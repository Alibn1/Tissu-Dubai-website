import type {NextRequest} from 'next/server';
import {createHmac, timingSafeEqual} from 'node:crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24;

export function safeEqual(a: string, b: string): boolean {
  const ha = new TextEncoder().encode(a);
  const hb = new TextEncoder().encode(b);
  if (ha.length !== hb.length) return false;
  return timingSafeEqual(ha, hb);
}

/**
 * Signing key for session cookies and the admin bearer token. ADMIN_PASSWORD
 * doubles as the key so a single secret secures both; changing the password
 * invalidates every existing session. Falls back to ADMIN_API_KEY so a
 * separate SESSION_SECRET is not strictly required.
 */
function secretKey(): string | null {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_API_KEY || null;
}

function sign(value: string): string | null {
  const key = secretKey();
  if (!key) return null;
  return createHmac('sha256', key).update(value).digest('base64url');
}

/** Issues the stateless session token stored in the `admin-session` cookie. */
export function createSessionToken(): string {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${expires}.${sign(expires) ?? ''}`;
}

/**
 * Verifies the session token's HMAC and expiry. The signature is what makes
 * the cookie unforgeable: without the key nobody can mint a valid `expiry.sig`
 * pair, so a hardcoded value like "authenticated" no longer grants access.
 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const separator = token.indexOf('.');
  if (separator <= 0) return false;

  const expires = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(expires);
  if (!expected) return false;
  if (!safeEqual(signature, expected)) return false;

  const expiry = Number(expires);
  return Number.isFinite(expiry) && expiry > Math.floor(Date.now() / 1000);
}

/**
 * Guards admin-only API mutations. Accepts either a valid HMAC-signed
 * `admin-session` cookie set by /api/auth/login, or an
 * `Authorization: Bearer <ADMIN_API_KEY>` header for scripts / external tools.
 */
export function isAdminRequest(request: NextRequest): boolean {
  if (verifySessionToken(request.cookies.get('admin-session')?.value)) return true;

  const adminKey = process.env.ADMIN_API_KEY;
  const header = request.headers.get('authorization');
  if (adminKey && header?.startsWith('Bearer ') && safeEqual(header.slice(7), adminKey)) return true;

  return false;
}

export function unauthorizedResponse() {
  return Response.json({error: 'Unauthorized'}, {status: 401});
}
