import {NextRequest, NextResponse} from 'next/server';
import {clearFailures, clientIp, isThrottled, recordFailure} from '@/lib/rateLimit';
import {
  createSessionToken,
  safeEqual,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS
} from '@/lib/adminAuth';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const ACCESS_EMAIL_HEADER = 'cf-access-authenticated-user-email';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({error: 'Admin password is not configured'}, {status: 500});
  }

  const throttleKey = `login:${clientIp(request)}`;
  const throttle = isThrottled(throttleKey, MAX_FAILURES);
  if (throttle.limited) {
    return NextResponse.json(
      {error: 'Too many failed attempts. Try again later.'},
      {status: 429, headers: {'Retry-After': String(throttle.retryAfterSeconds)}}
    );
  }

  // In production the request has already passed Cloudflare Access, and Access
  // tells us who it authenticated. The session is bound to that identity, so
  // without the header we cannot issue a token that means anything. Failing
  // closed here also catches an Access application that is not forwarding the
  // header, rather than quietly issuing sessions nobody can use.
  const accessEmail = request.headers.get(ACCESS_EMAIL_HEADER)?.trim().toLowerCase() ?? '';
  if (process.env.NODE_ENV === 'production' && !accessEmail) {
    return NextResponse.json(
      {
        error:
          'Cloudflare Access did not report an identity for this request. Check that the Access application forwards Cf-Access-Authenticated-User-Email.'
      },
      {status: 403}
    );
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (password.length > 0 && safeEqual(password, adminPassword)) {
    clearFailures(throttleKey);
    const response = NextResponse.json({success: true});
    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken(accessEmail || 'local-dev'),
      SESSION_COOKIE_OPTIONS
    );
    return response;
  }

  recordFailure(throttleKey, WINDOW_MS);
  return NextResponse.json({error: 'Invalid password'}, {status: 401});
}
