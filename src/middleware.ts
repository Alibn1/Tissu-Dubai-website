import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const ADMIN_PREFIXED = /^\/(fr|ar|en)(\/admin(?:\/.*)?)$/;

export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // The admin panel is single-language, so it is served at /admin with no
  // locale prefix. Rewrite rather than redirect: the pages still live in the
  // [locale] tree (the root layout carries no <html>/<body>, so a top-level
  // /admin route cannot exist without breaking lang/dir on Arabic pages),
  // but the address bar keeps the clean /admin path.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Retire the old prefixed admin URLs.
  const match = pathname.match(ADMIN_PREFIXED);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = match[2];
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
