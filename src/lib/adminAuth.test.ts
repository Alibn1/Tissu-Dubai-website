import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createHmac} from 'node:crypto';
import {NextRequest} from 'next/server';
import {
  createSessionToken,
  isAdminRequest,
  readSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionMatchesAccessIdentity,
  verifySessionToken
} from '@/lib/adminAuth';

/**
 * The admin guard is the only thing between the public internet and every write
 * endpoint. It has three independent properties worth pinning down:
 *
 *   - the cookie cannot be forged without the signing key,
 *   - the signing key is separate from the admin password, so a captured
 *     cookie cannot be used to brute-force the password offline,
 *   - a valid cookie is useless without the matching Cloudflare Access identity.
 */

const ORIGINAL = {
  password: process.env.ADMIN_PASSWORD,
  apiKey: process.env.ADMIN_API_KEY,
  secret: process.env.SESSION_SECRET,
  nodeEnv: process.env.NODE_ENV
};

const SECRET = 'test-session-secret-0123456789abcdef';
const EMAIL = 'admin@example.com';
const ACCESS_HEADER = 'cf-access-authenticated-user-email';

function withCookie(token: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://example.test/api/products', {
    headers: {cookie: `${SESSION_COOKIE}=${token}`, ...headers}
  });
}

function bare(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://example.test/api/products', {headers});
}

/** Re-signs a payload the way the module does, for expiry tests. */
function signPayload(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

/** @types/node declares NODE_ENV read-only, so assign through the index signature. */
function setNodeEnv(value: string): void {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

function tokenFor(email: string, expires: number, key = SECRET): string {
  const payload = Buffer.from(JSON.stringify({email, expires}), 'utf8').toString('base64url');
  return `${payload}.${signPayload(payload, key)}`;
}

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.SESSION_SECRET = SECRET;
  delete process.env.ADMIN_API_KEY;
  setNodeEnv('test');
});

afterEach(() => {
  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  restore('ADMIN_PASSWORD', ORIGINAL.password);
  restore('ADMIN_API_KEY', ORIGINAL.apiKey);
  restore('SESSION_SECRET', ORIGINAL.secret);
  restore('NODE_ENV', ORIGINAL.nodeEnv);
});

describe('session tokens', () => {
  it('accepts a freshly issued token and carries the identity', () => {
    const token = createSessionToken(EMAIL);
    const session = readSession(token);

    expect(session).not.toBeNull();
    expect(session?.email).toBe(EMAIL);
    expect(verifySessionToken(token)).toBe(true);
    expect(isAdminRequest(withCookie(token))).toBe(true);
  });

  it('expires after the configured lifetime', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = readSession(createSessionToken(EMAIL));
    expect(session?.expires).toBeGreaterThanOrEqual(now + SESSION_TTL_SECONDS - 2);
    expect(session?.expires).toBeLessThanOrEqual(now + SESSION_TTL_SECONDS + 2);
  });

  it('rejects a token whose signature has been altered', () => {
    const token = createSessionToken(EMAIL);
    const [payload] = token.split('.');
    const forged = `${payload}.not-the-real-signature`;

    expect(verifySessionToken(forged)).toBe(false);
    expect(isAdminRequest(withCookie(forged))).toBe(false);
  });

  it('rejects a token whose payload has been altered', () => {
    // Moving the identity to another email invalidates the signature, because
    // the whole payload is what gets signed.
    const token = createSessionToken(EMAIL);
    const [, signature] = token.split('.');
    const tampered = Buffer.from(
      JSON.stringify({email: 'attacker@example.com', expires: Math.floor(Date.now() / 1000) + 3600}),
      'utf8'
    ).toString('base64url');

    expect(verifySessionToken(`${tampered}.${signature}`)).toBe(false);
  });

  it('rejects an expired token', () => {
    const expired = tokenFor(EMAIL, Math.floor(Date.now() / 1000) - 1);
    expect(verifySessionToken(expired)).toBe(false);
    expect(readSession(expired)).toBeNull();
  });

  it('rejects empty and malformed values', () => {
    for (const value of [undefined, '', '.', 'abc', '1234567890.', '.signature']) {
      expect(verifySessionToken(value)).toBe(false);
    }
  });

  it('rejects a payload that is not a session object', () => {
    const payload = Buffer.from(JSON.stringify({nope: true}), 'utf8').toString('base64url');
    expect(verifySessionToken(`${payload}.${signPayload(payload, SECRET)}`)).toBe(false);
  });
});

describe('signing key separation', () => {
  it('is not affected by the admin password changing', () => {
    // The whole point of a separate SESSION_SECRET: rotating the password must
    // not hand an attacker a shortcut to forging cookies, and conversely the
    // signature must not be crackable by guessing the password.
    const token = createSessionToken(EMAIL);
    process.env.ADMIN_PASSWORD = 'a-completely-different-password';

    expect(verifySessionToken(token)).toBe(true);
  });

  it('is invalidated when the session secret changes', () => {
    const token = createSessionToken(EMAIL);
    process.env.SESSION_SECRET = 'a-new-secret-0123456789abcdefgh';

    expect(verifySessionToken(token)).toBe(false);
  });

  it('falls back to the admin password outside production', () => {
    delete process.env.SESSION_SECRET;
    setNodeEnv('test');

    const token = createSessionToken(EMAIL);
    expect(verifySessionToken(token)).toBe(true);
  });

  it('fails closed in production when SESSION_SECRET is missing', () => {
    delete process.env.SESSION_SECRET;
    setNodeEnv('production');

    // A token is still produced, but with no key, so it can never verify.
    const token = createSessionToken(EMAIL);
    expect(token.endsWith('.')).toBe(true);
    expect(verifySessionToken(token)).toBe(false);
    expect(isAdminRequest(withCookie(token))).toBe(false);
  });

  it('ignores a too-short SESSION_SECRET', () => {
    process.env.SESSION_SECRET = 'short';
    setNodeEnv('production');

    expect(verifySessionToken(createSessionToken(EMAIL))).toBe(false);
  });
});

describe('Cloudflare Access identity binding', () => {
  it('accepts a matching identity in production', () => {
    setNodeEnv('production');
    const token = createSessionToken(EMAIL);

    expect(isAdminRequest(withCookie(token, {[ACCESS_HEADER]: EMAIL}))).toBe(true);
  });

  it('matches the identity case-insensitively', () => {
    setNodeEnv('production');
    const token = createSessionToken(EMAIL);

    expect(isAdminRequest(withCookie(token, {[ACCESS_HEADER]: 'ADMIN@Example.com'}))).toBe(true);
  });

  it('rejects a valid cookie presented by a different identity', () => {
    setNodeEnv('production');
    const token = createSessionToken(EMAIL);

    expect(isAdminRequest(withCookie(token, {[ACCESS_HEADER]: 'someone-else@example.com'}))).toBe(false);
  });

  it('rejects a valid cookie when production has no Access header', () => {
    setNodeEnv('production');
    const token = createSessionToken(EMAIL);

    expect(isAdminRequest(withCookie(token))).toBe(false);
  });

  it('does not require an Access header outside production', () => {
    setNodeEnv('test');
    const token = createSessionToken(EMAIL);

    expect(isAdminRequest(withCookie(token))).toBe(true);
  });

  it('exposes the identity check for the admin layout', () => {
    setNodeEnv('production');
    const session = readSession(createSessionToken(EMAIL));
    if (!session) throw new Error('expected a session');

    expect(sessionMatchesAccessIdentity(session, new Headers({[ACCESS_HEADER]: EMAIL}))).toBe(true);
    expect(sessionMatchesAccessIdentity(session, new Headers())).toBe(false);
  });
});

describe('admin request guard', () => {
  it('refuses a request with no cookie and no header', () => {
    expect(isAdminRequest(bare())).toBe(false);
  });

  it('accepts a bearer token when ADMIN_API_KEY is set', () => {
    process.env.ADMIN_API_KEY = 'external-tool-key';

    expect(isAdminRequest(bare({authorization: 'Bearer external-tool-key'}))).toBe(true);
  });

  it('rejects a bearer token when ADMIN_API_KEY is not set', () => {
    // The header is ignored entirely, so a leaked guess cannot authenticate
    // against a deployment that never opted into the bearer path.
    delete process.env.ADMIN_API_KEY;

    expect(isAdminRequest(bare({authorization: 'Bearer anything'}))).toBe(false);
    expect(isAdminRequest(bare({authorization: 'Bearer '}))).toBe(false);
  });

  it('rejects a bearer token that does not match', () => {
    process.env.ADMIN_API_KEY = 'external-tool-key';

    expect(isAdminRequest(bare({authorization: 'Bearer wrong-key'}))).toBe(false);
    expect(isAdminRequest(bare({authorization: 'Basic external-tool-key'}))).toBe(false);
    expect(isAdminRequest(bare({authorization: 'external-tool-key'}))).toBe(false);
  });

  it('still accepts a valid session cookie when the bearer key is set', () => {
    process.env.ADMIN_API_KEY = 'external-tool-key';
    const token = createSessionToken(EMAIL);

    expect(isAdminRequest(withCookie(token))).toBe(true);
  });

  it('does not let a stale cookie mask a valid bearer key', () => {
    // An expired or rotated cookie must fall through to the bearer path rather
    // than short-circuiting it, but on its own it must never grant access.
    process.env.ADMIN_API_KEY = 'external-tool-key';
    const token = createSessionToken(EMAIL);
    process.env.SESSION_SECRET = 'rotated-secret-0123456789abcdefgh';

    expect(isAdminRequest(withCookie(token))).toBe(false);
    expect(
      isAdminRequest(withCookie(token, {authorization: 'Bearer external-tool-key'}))
    ).toBe(true);
  });
});
