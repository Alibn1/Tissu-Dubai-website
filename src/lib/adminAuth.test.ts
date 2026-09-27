import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createHmac} from 'node:crypto';
import {NextRequest} from 'next/server';
import {createSessionToken, isAdminRequest, verifySessionToken} from '@/lib/adminAuth';

/**
 * The admin guard is the only thing between the public internet and every write
 * endpoint, and the bearer path is easy to break without noticing: it is
 * disabled purely by ADMIN_API_KEY being unset.
 */

const ORIGINAL = {
  password: process.env.ADMIN_PASSWORD,
  apiKey: process.env.ADMIN_API_KEY
};

function withCookie(token: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://example.test/api/products', {
    headers: {cookie: `admin-session=${token}`, ...headers}
  });
}

function bare(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://example.test/api/products', {headers});
}

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'test-password';
  delete process.env.ADMIN_API_KEY;
});

afterEach(() => {
  if (ORIGINAL.password === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIGINAL.password;
  if (ORIGINAL.apiKey === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = ORIGINAL.apiKey;
});

describe('session tokens', () => {
  it('accepts a freshly issued token', () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
    expect(isAdminRequest(withCookie(token))).toBe(true);
  });

  it('rejects a token whose signature has been altered', () => {
    const token = createSessionToken();
    const [expires] = token.split('.');
    const forged = `${expires}.not-the-real-signature`;

    expect(verifySessionToken(forged)).toBe(false);
    expect(isAdminRequest(withCookie(forged))).toBe(false);
  });

  it('rejects a token whose expiry has been moved forward', () => {
    // Rewriting the expiry invalidates the signature, because the expiry is
    // what gets signed.
    const token = createSessionToken();
    const farFuture = String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365);
    const forged = `${farFuture}.${token.split('.')[1]}`;

    expect(verifySessionToken(forged)).toBe(false);
  });

  it('rejects a token signed with a different password', () => {
    const token = createSessionToken();
    process.env.ADMIN_PASSWORD = 'a-different-password';

    expect(verifySessionToken(token)).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = createSessionToken();
    const expired = String(Math.floor(Date.now() / 1000) - 1);
    // Re-sign a past expiry with the current key, which is what a real expiry
    // looks like rather than a forgery.
    const signature = createHmac('sha256', 'test-password').update(expired).digest('base64url');

    expect(verifySessionToken(`${expired}.${signature}`)).toBe(false);
    expect(token).not.toBe(`${expired}.${signature}`);
  });

  it('rejects empty and malformed values', () => {
    for (const value of [undefined, '', '.', 'abc', '1234567890.', '.signature']) {
      expect(verifySessionToken(value)).toBe(false);
    }
  });

  it('cannot mint a usable token when no key is configured', () => {
    // With neither secret set, signing yields nothing, so a token still gets
    // issued but can never be verified. The guard has to fail closed here or
    // "no password configured" would silently mean "open".
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_API_KEY;

    const token = createSessionToken();
    expect(token.endsWith('.')).toBe(true);
    expect(verifySessionToken(token)).toBe(false);
    expect(isAdminRequest(withCookie(token))).toBe(false);
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
    const token = createSessionToken();

    expect(isAdminRequest(withCookie(token))).toBe(true);
  });
});
