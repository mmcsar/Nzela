import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si Supabase n'est pas configuré, laisser passer (utilisateur non authentifié)
  if (!supabaseUrl || !supabaseAnonKey) {
    const pathname = request.nextUrl.pathname;
    const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
    const isPublic =
      withoutLocale === '/' ||
      withoutLocale.startsWith('/login') ||
      withoutLocale.startsWith('/register') ||
      withoutLocale.startsWith('/pricing') ||
      withoutLocale.startsWith('/about') ||
      withoutLocale.startsWith('/contact');

    if (!isPublic && withoutLocale.startsWith('/dashboard')) {
      const locale = pathname.match(/^\/(fr|en)/)?.[1] || 'fr';
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err) {
    console.error('[Supabase middleware] Erreur getUser:', err);
    // En cas d'erreur (réseau, config invalide), traiter comme non connecté
  }

  // Routes publiques qui ne nécessitent pas de redirection
  const pathname = request.nextUrl.pathname;
  const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
  const isPublic =
    withoutLocale === '/' ||
    withoutLocale.startsWith('/login') ||
    withoutLocale.startsWith('/register') ||
    withoutLocale.startsWith('/pricing') ||
    withoutLocale.startsWith('/about') ||
    withoutLocale.startsWith('/contact');

  if (!user && !isPublic) {
    // Pas d'utilisateur sur une route protégée → rediriger vers login
    const url = request.nextUrl.clone();
    const locale = pathname.match(/^\/(fr|en)/)?.[1] || 'fr';
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}




