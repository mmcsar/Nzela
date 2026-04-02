import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { routing } from '@/lib/i18n/routing';

type AppLocale = (typeof routing.locales)[number];

/** Locale depuis la page d’origine (Referer), sinon locale par défaut next-intl. */
function localeFromRequest(request: Request): AppLocale {
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const path = new URL(referer).pathname;
      const seg = path.split('/').filter(Boolean)[0];
      if (seg && routing.locales.includes(seg as AppLocale)) {
        return seg as AppLocale;
      }
    } catch {
      // ignore
    }
  }
  return routing.defaultLocale;
}

export async function POST(request: Request) {
  const supabase = await createClientForRouteHandler();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  const locale = localeFromRequest(request);
  const loginPath = `/${locale}/login`;

  return NextResponse.redirect(new URL(loginPath, origin), 303);
}




