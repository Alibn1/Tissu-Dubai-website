import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {NextRequest} from 'next/server';
import {POST} from '@/app/api/auth/login/route';
import {readSession, SESSION_COOKIE} from '@/lib/adminAuth';

/**
 * The login route is where the two hardening changes meet: the cookie it sets
 * carries the __Host- prefix and an 8 hour lifetime, and in production the
 * session it mints is bound to the Cloudflare Access identity.
 */

const ORIGINAL = {
  password: process.env.ADMIN_PASSWORD,
  secret: process.env.SESSION_SECRET,
  nodeEnv: process.env.NODE_ENV
};

const SECRET = 'login-route-test-secret-0123456789';
const EMAIL = 'admin@example.com';
const ACCESS_HEADER = 'cf-access-authenticated-user-email';

let ipCounter = 0;

function setNodeEnv(value: string): void {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

function loginRequest(password: string, headers: Record<string, string> = {}): NextRequest {
  ipCounter += 1;
  return new NextRequest('https://example.test/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': `10.0.0.${ipCounter}`,
      ...headers
    },
    body: JSON.stringify({password})
  });
}

function sessionCookie(response: Response): string {
  const raw = response.headers.get('set-cookie') ?? '';
  const match = raw.match(new RegExp(`${SESSION_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match?.[1] ?? '';
}

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'correct-horse-battery';
  process.env.SESSION_SECRET = SECRET;
  setNodeEnv('test');
});

afterEach(() => {
  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  restore('ADMIN_PASSWORD', ORIGINAL.password);
  restore('SESSION_SECRET', ORIGINAL.secret);
  restore('NODE_ENV', ORIGINAL.nodeEnv);
});

describe('POST /api/auth/login', () => {
  it('rejects a wrong password', async () => {
    const response = await POST(loginRequest('wrong'));
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('issues a hardened __Host- cookie on success', async () => {
    const response = await POST(loginRequest('correct-horse-battery'));
    expect(response.status).toBe(200);

    const raw = response.headers.get('set-cookie') ?? '';
    expect(raw).toContain(`${SESSION_COOKIE}=`);
    expect(raw).toContain('HttpOnly');
    expect(raw).toContain('Secure');
    expect(raw.toLowerCase()).toContain('samesite=strict');
    expect(raw).toContain('Path=/');
    // 8 hours, not 24.
    expect(raw).toContain('Max-Age=28800');
  });

  it('binds the session to the Access identity in production', async () => {
    setNodeEnv('production');

    const response = await POST(loginRequest('correct-horse-battery', {[ACCESS_HEADER]: EMAIL}));
    expect(response.status).toBe(200);

    const session = readSession(sessionCookie(response));
    expect(session?.email).toBe(EMAIL);
  });

  it('refuses to issue a session in production without an Access identity', async () => {
    setNodeEnv('production');

    const response = await POST(loginRequest('correct-horse-battery'));
    expect(response.status).toBe(403);
    expect(response.headers.get('set-cookie')).toBeNull();

    const body = await response.json();
    expect(body.error).toMatch(/Access/i);
  });

  it('does not need an Access identity outside production', async () => {
    const response = await POST(loginRequest('correct-horse-battery'));
    expect(response.status).toBe(200);

    const session = readSession(sessionCookie(response));
    expect(session?.email).toBe('local-dev');
  });

  it('throttles repeated failures from the same IP', async () => {
    const request = () =>
      new NextRequest('https://example.test/api/auth/login', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9'},
        body: JSON.stringify({password: 'wrong'})
      });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await POST(request())).status).toBe(401);
    }
    expect((await POST(request())).status).toBe(429);
  });

  it('fails closed when no admin password is configured', async () => {
    delete process.env.ADMIN_PASSWORD;

    const response = await POST(loginRequest('anything'));
    expect(response.status).toBe(500);
  });
});
