import {NextRequest, NextResponse} from 'next/server';
import {clearFailures, clientIp, isThrottled, recordFailure} from '@/lib/rateLimit';
import {createSessionToken, safeEqual} from '@/lib/adminAuth';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

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

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (password.length > 0 && safeEqual(password, adminPassword)) {
    clearFailures(throttleKey);
    const response = NextResponse.json({success: true});
    response.cookies.set('admin-session', createSessionToken(), {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    return response;
  }

  recordFailure(throttleKey, WINDOW_MS);
  return NextResponse.json({error: 'Invalid password'}, {status: 401});
}
