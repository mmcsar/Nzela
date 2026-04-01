'use client';

import { useCallback, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RateEstimator } from '@/components/rates/RateEstimator';
import { FuelEstimator } from '@/components/rates/FuelEstimator';
import { BarChart3, Fuel, Calculator, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';

type CoutTab = 'rates' | 'fuel';

function isCoutTab(v: string | null): v is CoutTab {
  return v === 'rates' || v === 'fuel';
}

function TMSCoutsContent() {
  const t = useTranslations('estimators');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: CoutTab = isCoutTab(tabParam) ? tabParam : 'rates';

  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);

  const setTab = useCallback(
    (id: CoutTab) => {
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
        <Link href="/dashboard/tms" className="text-primary-600 font-medium hover:underline">
          {t('backTms')}
        </Link>
      </div>
    );
  }

  const tabs: { id: CoutTab; label: string; icon: LucideIcon; desc: string }[] = [
    { id: 'rates', label: t('tmsCoutsTabRates'), icon: BarChart3, desc: t('tmsCoutsTabRatesDesc') },
    { id: 'fuel', label: t('tmsCoutsTabFuel'), icon: Fuel, desc: t('tmsCoutsTabFuelDesc') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/tms"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('tmsBreadcrumb')}
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary-600" />
            {t('tmsCoutsTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('tmsCoutsIntro')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              activeTab === tab.id
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${tab.id === 'fuel' && activeTab !== 'fuel' ? 'border-amber-100 hover:border-amber-200' : ''}`}
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

      <div className="border-t border-gray-100 pt-2">
        {activeTab === 'rates' && <RateEstimator />}
        {activeTab === 'fuel' && <FuelEstimator />}
      </div>
    </div>
  );
}

function TMSCoutsFallback() {
  const t = useTranslations('estimators');
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-gray-500">{t('loading')}</div>
    </div>
  );
}

export default function TMSCoutsPage() {
  return (
    <Suspense fallback={<TMSCoutsFallback />}>
      <TMSCoutsContent />
    </Suspense>
  );
}
