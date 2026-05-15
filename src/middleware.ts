import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/register/company',
  '/register/broker',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/pricing',
  '/about',
  '/contact',
];

function isPublicRoute(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
  return PUBLIC_ROUTES.some((route) => withoutLocale === route || withoutLocale.startsWith(route + '/'));
}

function isDashboardRoute(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
  return withoutLocale.startsWith('/dashboard');
}

const LOCALE_PREFIX = /^\/(fr|en)(\/|$)/;

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/auth/callback' || pathname.startsWith('/auth/callback/')) {
    try {
      const sessionResponse = await updateSession(request);
      const res = NextResponse.next({ request });
      sessionResponse.cookies.getAll().forEach((cookie) => {
        res.cookies.set(cookie.name, cookie.value, cookie);
      });
      return res;
    } catch {
      return NextResponse.next({ request });
    }
  }

  const publicWithoutLocale = ['/reset-password', '/forgot-password', '/login', '/register'];
  if (!LOCALE_PREFIX.test(pathname) && publicWithoutLocale.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/fr' + pathname;
    return NextResponse.redirect(url);
  }

  if (isDashboardRoute(pathname)) {
    try {
      const sessionResponse = await updateSession(request);

      if (sessionResponse.status === 302 || sessionResponse.status === 307) {
        return sessionResponse;
      }

      const intlResponse = intlMiddleware(request);
      sessionResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value, cookie);
      });

      return intlResponse;
    } catch (err) {
      console.error('[middleware] Erreur updateSession:', err);
      return intlMiddleware(request);
    }
  }

  if (isPublicRoute(pathname)) {
    try {
      const sessionResponse = await updateSession(request);
      const intlResponse = intlMiddleware(request);
      sessionResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return intlResponse;
    } catch {
      return intlMiddleware(request);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|manifest\\.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
  ],
};
