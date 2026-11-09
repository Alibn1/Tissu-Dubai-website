import {NextResponse} from 'next/server';
import {SESSION_COOKIE, SESSION_COOKIE_OPTIONS} from '@/lib/adminAuth';

export async function POST() {
  const response = NextResponse.json({success: true});
  // Clearing has to repeat the same path/secure attributes, otherwise the
  // browser keeps the original cookie.
  response.cookies.set(SESSION_COOKIE, '', {...SESSION_COOKIE_OPTIONS, maxAge: 0});
  return response;
}
