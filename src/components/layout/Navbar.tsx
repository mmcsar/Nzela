'use client';

import { useState } from 'react';
import { Link } from '@/lib/i18n/routing';
import { Truck, Menu, ChevronDown } from 'lucide-react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { useTranslations } from 'next-intl';

const SOLUTION_LINKS = [
  { labelKey: 'brokers' as const, descKey: 'brokersDesc' as const, href: '/solutions/brokers' },
  { labelKey: 'carriers' as const, descKey: 'carriersDesc' as const, href: '/solutions/carriers' },
];

const PRODUCT_LINKS = [
  { labelKey: 'loadTracking' as const, href: '/products/load-tracking' },
  { labelKey: 'loadBoard' as const, href: '/products/load-board' },
  { labelKey: 'smartMatching' as const, href: '/products/matching' },
  { labelKey: 'bolManagement' as const, href: '/products/bol' },
  { labelKey: 'carrierToolkit' as const, href: '/products/toolkit' },
];

const RESOURCE_LINKS = [
  { labelKey: 'blog' as const, href: '/blog' },
  { labelKey: 'news' as const, href: '/news' },
  { labelKey: 'caseStudies' as const, href: '/resources/case-studies' },
  { labelKey: 'faq' as const, href: '/resources/faq' },
  { labelKey: 'guides' as const, href: '/resources/guides' },
];

export function Navbar() {
  const t = useTranslations('site');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex h-14 items-center justify-between sm:h-16">
            <Link href="/" className="flex items-center gap-2 active:opacity-80">
              <Truck className="h-6 w-6 text-primary-600 sm:h-7 sm:w-7" />
              <span className="text-lg font-bold text-gray-900 sm:text-xl">Nzela</span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              <Link href="/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                {t('about')}
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('solutions')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button type="button" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md transition-colors">
                  {t('solutions')} <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {openDropdown === 'solutions' && (
                  <div className="absolute top-full left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 mt-0">
                    {SOLUTION_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{t(item.labelKey)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t(item.descKey)}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('products')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button type="button" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md transition-colors">
                  {t('products')} <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {openDropdown === 'products' && (
                  <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 mt-0">
                    {PRODUCT_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      >
                        {t(item.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('resources')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button type="button" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md transition-colors">
                  {t('resources')} <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {openDropdown === 'resources' && (
                  <div className="absolute top-full left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 mt-0">
                    {RESOURCE_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      >
                        {t(item.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                {t('pricing')}
              </Link>
              <Link href="/contact" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                {t('contact')}
              </Link>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <LanguageSwitcher compact />
              <ButtonLink href="/login" variant="outline" size="sm">
                {t('login')}
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                {t('register')}
              </ButtonLink>
            </div>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-700 active:scale-95 active:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-label={t('menuTitle')}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        solutionLinks={SOLUTION_LINKS}
        productLinks={PRODUCT_LINKS}
        resourceLinks={RESOURCE_LINKS}
      />
    </>
  );
}
