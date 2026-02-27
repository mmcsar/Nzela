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
  // Supprimer le préfixe de locale (ex: /fr/login -> /login)
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

  // 0. Si l'URL n'a pas de locale (ex: /reset-password, /forgot-password), rediriger vers /fr/...
  const publicWithoutLocale = ['/reset-password', '/forgot-password', '/login', '/register'];
  if (!LOCALE_PREFIX.test(pathname) && publicWithoutLocale.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/fr' + pathname;
    return NextResponse.redirect(url);
  }

  // 1. Pour les routes dashboard, vérifier l'authentification d'abord
  if (isDashboardRoute(pathname)) {
    try {
      const sessionResponse = await updateSession(request);

      // Si la réponse est une redirection (302/307), l'utilisateur n'est pas connecté
      if (sessionResponse.status === 302 || sessionResponse.status === 307) {
        return sessionResponse;
      }

      // Copier les cookies de session vers la réponse intl
      const intlResponse = intlMiddleware(request);
      sessionResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value);
      });

      return intlResponse;
    } catch (err) {
      console.error('[Middleware] Erreur updateSession:', err);
      return intlMiddleware(request);
    }
  }

  // 2. Pour les routes publiques, juste le middleware intl + rafraîchir la session
  if (isPublicRoute(pathname)) {
    // Rafraîchir la session silencieusement (pas de redirection)
    try {
      const sessionResponse = await updateSession(request);
      const intlResponse = intlMiddleware(request);
      sessionResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value);
      });
      return intlResponse;
    } catch {
      // En cas d'erreur, juste retourner la réponse intl
      return intlMiddleware(request);
    }
  }

  // 3. Pour tout le reste, middleware intl standard
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static, _next/image, favicon.ico, api
     * - manifest.json, /icons (PWA et assets)
     * - extensions: svg, png, jpg, jpeg, gif, webp, js (sw.js, swe-worker)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|manifest\\.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
  ],
};
