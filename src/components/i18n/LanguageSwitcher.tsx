'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'fr', label: 'FR', fullLabel: 'Francais', flag: '🇫🇷' },
  { code: 'en', label: 'EN', fullLabel: 'English', flag: '🇬🇧' },
] as const;

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale as 'fr' | 'en' });
  };

  if (compact) {
    return (
      <button
        onClick={() => switchLocale(locale === 'fr' ? 'en' : 'fr')}
        className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors"
        title={locale === 'fr' ? 'Switch to English' : 'Passer en francais'}
      >
        <Globe className="w-3 h-3" />
        {locale === 'fr' ? 'EN' : 'FR'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => switchLocale(lang.code)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            locale === lang.code
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
