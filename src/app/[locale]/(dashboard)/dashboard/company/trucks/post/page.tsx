'use client';

import { TruckPostForm } from '@/components/trucks/TruckPostForm';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useTranslations } from 'next-intl';

export default function PostTruckPage() {
  const t = useTranslations('postTruck');
  const router = useRouter();
  const { isLoading, isAuthorized, role, companyId } = useRequireRole(['company', 'admin']);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[320px]">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized || (role === 'company' && !companyId)) {
    return (
      <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p className="font-medium text-amber-800">{t('accessCompanyOnly')}</p>
        <p className="text-sm text-amber-700 mt-1">
          {role === 'company' && !companyId ? t('noCompanyProfile') : t('connectCompany')}
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/publish')}>
          {t('goToPublish')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Button>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <TruckPostForm />
      </div>
    </div>
  );
}


