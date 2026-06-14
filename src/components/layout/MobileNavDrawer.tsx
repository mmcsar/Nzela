'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/lib/i18n/routing';
import type { LucideIcon } from 'lucide-react';
import {
  Truck,
  X,
  ChevronRight,
  Briefcase,
  Package,
  BookOpen,
  Info,
  Tag,
  Mail,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useTranslations } from 'next-intl';

type SolutionLink = {
  labelKey: 'brokers' | 'carriers';
  descKey: 'brokersDesc' | 'carriersDesc';
  href: string;
};

type SimpleLink = {
  labelKey: string;
  href: string;
};

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  solutionLinks: SolutionLink[];
  productLinks: SimpleLink[];
  resourceLinks: SimpleLink[];
};

function NavRow({
  href,
  label,
  description,
  icon: Icon,
  onClose,
}: {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="mobile-nav-row flex min-h-[3.25rem] items-center gap-3 rounded-xl px-3 py-2.5 active:bg-slate-100/90"
    >
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium text-slate-900">{label}</span>
        {description && (
          <span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
    </Link>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mobile-nav-section">
      <h2 className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {children}
      </div>
    </section>
  );
}

export function MobileNavDrawer({
  open,
  onClose,
  solutionLinks,
  productLinks,
  resourceLinks,
}: MobileNavDrawerProps) {
  const t = useTranslations('site');

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="mobile-nav-root mobile-nav-root-open fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t('menuTitle')}
    >
      <button
        type="button"
        className="mobile-nav-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label={t('menuClose')}
        onClick={onClose}
      />

      <div className="mobile-nav-panel absolute inset-y-0 right-0 flex w-full max-w-[100%] flex-col bg-[#f2f2f7] shadow-2xl sm:max-w-[22rem]">
        {/* Barre type iOS */}
        <div className="mobile-nav-header flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-slate-900">Nzela</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 active:scale-95 active:bg-slate-200"
            aria-label={t('menuClose')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Liste défilante type Réglages iOS */}
        <div className="mobile-nav-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="space-y-5">
            <SectionBlock title={t('solutions')}>
              {solutionLinks.map((item, index) => (
                <div key={item.href} className={index > 0 ? 'border-t border-slate-100' : ''}>
                  <NavRow
                    href={item.href}
                    label={t(item.labelKey)}
                    description={t(item.descKey)}
                    icon={Briefcase}
                    onClose={onClose}
                  />
                </div>
              ))}
            </SectionBlock>

            <SectionBlock title={t('products')}>
              {productLinks.map((item, index) => (
                <div key={item.href} className={index > 0 ? 'border-t border-slate-100' : ''}>
                  <NavRow
                    href={item.href}
                    label={t(item.labelKey)}
                    icon={Package}
                    onClose={onClose}
                  />
                </div>
              ))}
            </SectionBlock>

            <SectionBlock title={t('resources')}>
              {resourceLinks.map((item, index) => (
                <div key={item.href} className={index > 0 ? 'border-t border-slate-100' : ''}>
                  <NavRow
                    href={item.href}
                    label={t(item.labelKey)}
                    icon={BookOpen}
                    onClose={onClose}
                  />
                </div>
              ))}
            </SectionBlock>

            <SectionBlock title={t('menuDiscover')}>
              <NavRow href="/about" label={t('about')} icon={Info} onClose={onClose} />
              <div className="border-t border-slate-100">
                <NavRow href="/pricing" label={t('pricing')} icon={Tag} onClose={onClose} />
              </div>
              <div className="border-t border-slate-100">
                <NavRow href="/contact" label={t('contact')} icon={Mail} onClose={onClose} />
              </div>
            </SectionBlock>

            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm">
              <p className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t('menuLanguage')}
              </p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Pied fixe — CTA comme une app */}
        <div className="mobile-nav-footer shrink-0 border-t border-slate-200/80 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="flex flex-col gap-2.5">
            <ButtonLink
              href="/register"
              size="lg"
              className="w-full gap-2 shadow-md shadow-primary-600/20"
              onClick={onClose}
            >
              <UserPlus className="h-4 w-4" />
              {t('register')}
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="outline"
              size="lg"
              className="w-full gap-2 border-slate-200 bg-white"
              onClick={onClose}
            >
              <LogIn className="h-4 w-4" />
              {t('login')}
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
