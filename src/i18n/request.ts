import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  let messages;
  try {
    messages = (await import(`@/locales/${locale}/common.json`)).default;
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale ${locale}:`, error);
    try {
      messages = (await import(`@/locales/fr/common.json`)).default;
    } catch (fallbackError) {
      console.error('[i18n] Fallback fr failed:', fallbackError);
      messages = {};
    }
  }

  return {
    locale,
    messages,
  };
});
