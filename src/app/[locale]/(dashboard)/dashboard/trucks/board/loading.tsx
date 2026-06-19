import { getTranslations } from 'next-intl/server';
import { LoadBoardSkeleton } from '@/components/loads/LoadBoardSkeleton';

export default async function TruckBoardLoading() {
  const t = await getTranslations('truckBoard');

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-slate-50/70 to-gray-50/50 py-4">
      <div className="mx-auto max-w-[1600px] px-4">
        <LoadBoardSkeleton variant="page" label={t('loadingTruck')} />
      </div>
    </div>
  );
}
