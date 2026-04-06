'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { Building2, Users, ArrowRight } from 'lucide-react';

function RegisterHubInner() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const query = plan ? `?plan=${encodeURIComponent(plan)}` : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">{t('register')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('registerHubSubtitle')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          <Link
            href={`/register/company${query}`}
            className="group flex items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-primary-400 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <Building2 className="h-7 w-7 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-semibold text-gray-900">{t('registerAsCompany')}</p>
              <p className="text-xs text-gray-500">{t('registerHubCompanyHint')}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
          </Link>

          <Link
            href={`/register/broker${query}`}
            className="group flex items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Users className="h-7 w-7 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-semibold text-gray-900">{t('registerAsBroker')}</p>
              <p className="text-xs text-gray-500">{t('registerHubBrokerHint')}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
          </Link>
        </div>

        <p className="text-center text-sm text-gray-600">
          {t('registerHubFooter')}{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            {t('login')}
          </Link>
        </p>

        <p className="text-center">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">
            {t('registerHubBack')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function RegisterHubFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mx-auto w-48" />
        <div className="h-4 bg-gray-100 rounded mx-auto w-72" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Hub d'inscription : oriente vers les parcours 2 etapes (entreprise / courtier).
 * Aucune modification des comptes existants — uniquement le parcours des nouveaux inscrits.
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterHubFallback />}>
      <RegisterHubInner />
    </Suspense>
  );
}
