'use client';

import { useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RateEstimator } from '@/components/rates/RateEstimator';
import { FuelEstimator } from '@/components/rates/FuelEstimator';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { AlertManager } from '@/components/alerts/AlertManager';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Copy, BellRing, Wrench, Calculator, Fuel, FileCheck, Navigation, Smartphone } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';

type ToolTab = 'rates' | 'fuel' | 'templates' | 'alerts';

function isToolTab(v: string | null): v is ToolTab {
  return v === 'rates' || v === 'fuel' || v === 'templates' || v === 'alerts';
}

function ToolsPageContent() {
  const t = useTranslations('estimators');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: ToolTab = isToolTab(tabParam) ? tabParam : 'rates';

  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);

  const routeTools = useMemo(
    () =>
      [
        { icon: Calculator, titleKey: 'toolTileRatesTitle' as const, descKey: 'toolTileRatesDesc' as const, action: 'rates' as const },
        { icon: Fuel, titleKey: 'toolTileFuelTitle' as const, descKey: 'toolTileFuelDesc' as const, action: 'fuel' as const },
        {
          icon: FileCheck,
          titleKey: 'toolTileDocsTitle' as const,
          descKey: 'toolTileDocsDesc' as const,
          action: 'link' as const,
          href: '/dashboard/verification' as const,
        },
        { icon: Navigation, titleKey: 'toolTileNavTitle' as const, descKey: 'toolTileNavDesc' as const, action: 'static' as const },
        { icon: Smartphone, titleKey: 'toolTileMobileTitle' as const, descKey: 'toolTileMobileDesc' as const, action: 'static' as const },
      ] as const,
    [],
  );

  const setTab = useCallback(
    (id: ToolTab) => {
      router.replace(`${pathname}?tab=${id}`, { scroll: false });
    },
    [router, pathname],
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
        <p className="text-gray-600">{t('accessDenied')}</p>
        <Link href="/dashboard" className="text-primary-600 font-medium hover:underline">
          {t('backDashboard')}
        </Link>
      </div>
    );
  }

  const tabs: { id: ToolTab; label: string; icon: LucideIcon; desc: string }[] = [
    { id: 'rates', label: t('tabRates'), icon: BarChart3, desc: t('tabRatesDesc') },
    { id: 'fuel', label: t('tabFuel'), icon: Fuel, desc: t('tabFuelDesc') },
    { id: 'templates', label: t('tabTemplates'), icon: Copy, desc: t('tabTemplatesDesc') },
    { id: 'alerts', label: t('tabAlerts'), icon: BellRing, desc: t('tabAlertsDesc') },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="w-7 h-7 text-primary-600" />
          {t('toolsPageTitle')}
        </h1>
        <p className="text-gray-500 mt-1">{t('toolsPageSubtitle')}</p>
        <p className="text-sm text-primary-800 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 mt-3">
          <strong>{t('toolsTmsHint')}</strong>{' '}
          <Link href="/dashboard/tms/couts" className="font-semibold underline hover:text-primary-950">
            {t('toolsTmsLink')}
          </Link>
          {t('toolsTmsHintEnd')}
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('toolsSectionTitle')}</h2>
        <p className="text-sm text-gray-500 mb-5">{t('toolsSectionIntro')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {routeTools.map((row) => {
            const content = (
              <>
                <row.icon className="w-9 h-9 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900 text-sm">{t(row.titleKey)}</h3>
                <p className="text-xs text-gray-500">{t(row.descKey)}</p>
              </>
            );
            const rowKey = row.titleKey;
            if (row.action === 'link') {
              return (
                <Link key={rowKey} href={row.href} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-left block">
                  {content}
                </Link>
              );
            }
            if (row.action === 'rates') {
              return (
                <button
                  key={rowKey}
                  type="button"
                  onClick={() => setTab('rates')}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-left"
                >
                  {content}
                </button>
              );
            }
            if (row.action === 'fuel') {
              return (
                <button
                  key={rowKey}
                  type="button"
                  onClick={() => setTab('fuel')}
                  className="bg-white rounded-lg p-4 border-2 border-amber-200 ring-1 ring-amber-100 hover:border-amber-400 hover:shadow-sm transition-all text-left"
                >
                  {content}
                </button>
              );
            }
            return (
              <div key={rowKey} className="bg-white rounded-lg p-4 border border-gray-200 text-left opacity-90">
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              activeTab === tab.id
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${tab.id === 'fuel' && activeTab !== 'fuel' ? 'border-amber-200 hover:border-amber-300' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <tab.icon className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${activeTab === tab.id ? 'text-primary-700' : 'text-gray-900'}`}>
                {tab.label}
              </div>
              <div className="text-xs text-gray-500">{tab.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div id="outil-actif">
        {activeTab === 'rates' && <RateEstimator />}
        {activeTab === 'fuel' && <FuelEstimator />}
        {activeTab === 'templates' && <TemplateManager />}
        {activeTab === 'alerts' && <AlertManager />}
      </div>
    </div>
  );
}

function ToolsLoadingFallback() {
  const t = useTranslations('estimators');
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-gray-500">{t('loadingTools')}</div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<ToolsLoadingFallback />}>
      <ToolsPageContent />
    </Suspense>
  );
}
