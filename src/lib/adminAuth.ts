import type {NextRequest} from 'next/server';
import {createHmac, timingSafeEqual} from 'node:crypto';

/** How long a signed-in admin stays signed in. */
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * The __Host- prefix is enforced by the browser: the cookie is only accepted
 * when it is Secure, has Path=/ and carries no Domain, and no sibling
 * subdomain can overwrite it. That makes it much harder for another service
 * on the same domain to plant a session.
 */
export const SESSION_COOKIE = '__Host-admin-session';

/** Shared by the login and logout routes so the two can never drift apart. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
  maxAge: SESSION_TTL_SECONDS
} as const;

/**
 * The header Cloudflare Access adds once it has authenticated the visitor.
 * Access strips any value the client sends, so on a protected hostname it can
 * be trusted as the edge's assertion of who is calling.
 */
const ACCESS_EMAIL_HEADER = 'cf-access-authenticated-user-email';

/** Minimal shape shared by NextRequest.headers and the headers() helper. */
type HeaderReader = {get(name: string): string | null};

export type AdminSession = {
  /** The Cloudflare Access identity the session was issued to. */
  email: string;
  /** Unix seconds. */
  expires: number;
};

export function safeEqual(a: string, b: string): boolean {
  const ha = new TextEncoder().encode(a);
  const hb = new TextEncoder().encode(b);
  if (ha.length !== hb.length) return false;
  return timingSafeEqual(ha, hb);
}

/**
 * Signing key for session cookies.
 *
 * Deliberately separate from ADMIN_PASSWORD. A session cookie is a signed
 * payload, so anyone holding one can test password guesses against the
 * signature offline, with no rate limit and no logs. Keying the signature with
 * the human password would make that brute force possible; a random
 * SESSION_SECRET makes it infeasible.
 *
 * Production fails closed when SESSION_SECRET is missing. Local development
 * falls back to the admin password so `npm run dev` keeps working without
 * extra setup.
 */
function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') return null;
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_API_KEY || null;
}

function sign(payload: string): string | null {
  const key = sessionSecret();
  if (!key) return null;
  return createHmac('sha256', key).update(payload).digest('base64url');
}

/** base64url of the JSON payload. base64url never contains a dot, so the
 * first dot is an unambiguous separator. */
function encode(payload: AdminSession): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * Issues the stateless session token stored in the session cookie.
 *
 * The Access identity is part of the signed payload, so the token cannot be
 * lifted to a different Cloudflare Access user.
 */
export function createSessionToken(email: string): string {
  const payload = encode({
    email,
    expires: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  });
  return `${payload}.${sign(payload) ?? ''}`;
}

/**
 * Verifies the signature and expiry and returns the session, or null.
 *
 * The signature is what makes the cookie unforgeable: without the key nobody
 * can mint a valid payload/signature pair, so a hardcoded value like
 * "authenticated" no longer grants access.
 */
export function readSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const separator = token.indexOf('.');
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload);
  if (!expected) return null;
  if (!safeEqual(signature, expected)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const {email, expires} = parsed as Partial<AdminSession>;
  if (typeof email !== 'string' || email.length === 0) return null;
  if (typeof expires !== 'number' || !Number.isFinite(expires)) return null;
  if (expires <= Math.floor(Date.now() / 1000)) return null;

  return {email, expires};
}

/** True when the token is valid. Callers that need the identity use readSession. */
export function verifySessionToken(token: string | undefined): boolean {
  return readSession(token) !== null;
}

/**
 * Ties a valid session to the Cloudflare Access identity on the current
 * request. A stolen cookie is therefore useless on its own: it also has to be
 * presented by the same Access user.
 *
 * In production a missing header means the request did not come through
 * Access, so the session is rejected. Outside production there is no Access,
 * so a missing header is allowed.
 */
export function sessionMatchesAccessIdentity(
  session: AdminSession,
  headers: HeaderReader
): boolean {
  const email = headers.get(ACCESS_EMAIL_HEADER);
  if (!email) return process.env.NODE_ENV !== 'production';
  return safeEqual(email.trim().toLowerCase(), session.email.trim().toLowerCase());
}

/**
 * Guards admin-only API mutations. Accepts either a valid signed
 * `__Host-admin-session` cookie set by /api/auth/login, or an
 * `Authorization: Bearer <ADMIN_API_KEY>` header for scripts / external tools.
 *
 * The bearer path is intentionally exempt from the Access identity check:
 * it is meant for machine clients, which authenticate to Access with a
 * service token instead.
 */
export function isAdminRequest(request: NextRequest): boolean {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return sessionMatchesAccessIdentity(session, request.headers);

  const adminKey = process.env.ADMIN_API_KEY;
  const header = request.headers.get('authorization');
  if (adminKey && header?.startsWith('Bearer ') && safeEqual(header.slice(7), adminKey)) return true;

  return false;
}

export function unauthorizedResponse() {
  return Response.json({error: 'Unauthorized'}, {status: 401});
}
