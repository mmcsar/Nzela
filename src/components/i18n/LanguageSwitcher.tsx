'use client';

import { Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/lib/i18n/routing';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'fr' as const, label: 'FR', flag: '🇫🇷' },
  { code: 'en' as const, label: 'EN', flag: '🇬🇧' },
];

interface LanguageSwitcherProps {
  compact?: boolean;
}

function useLocalizedHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());
  if (Object.keys(query).length === 0) return pathname;
  return { pathname, query };
}

function LanguageSwitcherInner({ compact = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const href = useLocalizedHref();

  if (compact) {
    const target = locale === 'fr' ? 'en' : 'fr';
    return (
      <Link
        href={href}
        locale={target}
        scroll={false}
        className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors"
        title={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
      >
        <Globe className="w-3 h-3" />
        {locale === 'fr' ? 'EN' : 'FR'}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {LANGUAGES.map((lang) => (
        <Link
          key={lang.code}
          href={href}
          locale={lang.code}
          scroll={false}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            locale === lang.code
              ? 'bg-white text-gray-900 shadow-sm pointer-events-none'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-current={locale === lang.code ? 'true' : undefined}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </Link>
      ))}
    </div>
  );
}

function SwitcherFallback({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-400">
        <Globe className="w-3 h-3" />
        …
      </span>
    );
  }
  return <span className="inline-block h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  return (
    <Suspense fallback={<SwitcherFallback compact={compact} />}>
      <LanguageSwitcherInner compact={compact} />
    </Suspense>
  );
}
