import type {NextRequest} from 'next/server';

/**
 * Guards admin-only API mutations. Accepts either the "admin-session" cookie
 * set by /api/auth/login or an Authorization: Bearer <ADMIN_API_KEY> header
 * (useful for scripts / external tools).
 */
export function isAdminRequest(request: NextRequest): boolean {
  const session = request.cookies.get('admin-session');
  if (session?.value === 'authenticated') return true;

  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && request.headers.get('authorization') === `Bearer ${adminKey}`) return true;

  return false;
}

export function unauthorizedResponse() {
  return Response.json({error: 'Unauthorized'}, {status: 401});
}