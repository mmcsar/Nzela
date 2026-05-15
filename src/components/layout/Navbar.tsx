'use client';

import { useState } from 'react';
import { Link } from '@/lib/i18n/routing';
import { Truck, Menu, X, ChevronDown } from 'lucide-react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Nzela</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
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

          <div className="hidden lg:flex items-center gap-3">
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
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('solutions')}</p>
              {SOLUTION_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="block py-1.5 text-sm text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('products')}</p>
              {PRODUCT_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="block py-1.5 text-sm text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('resources')}</p>
              {RESOURCE_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="block py-1.5 text-sm text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Link href="/about" className="block py-1.5 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                {t('about')}
              </Link>
              <Link href="/pricing" className="block py-1.5 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                {t('pricing')}
              </Link>
              <Link href="/contact" className="block py-1.5 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                {t('contact')}
              </Link>
            </div>
            <div className="px-1 pb-2">
              <LanguageSwitcher />
            </div>
            <div className="pt-3 border-t border-gray-200 flex gap-3">
              <ButtonLink
                href="/login"
                variant="outline"
                size="sm"
                className="flex-1 w-full"
                onClick={() => setMobileOpen(false)}
              >
                {t('login')}
              </ButtonLink>
              <ButtonLink
                href="/register"
                size="sm"
                className="flex-1 w-full"
                onClick={() => setMobileOpen(false)}
              >
                {t('register')}
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

