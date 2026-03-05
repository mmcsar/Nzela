'use client';

import { BOLForm } from '@/components/bol/BOLForm';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/lib/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function CreateBOLPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadId = searchParams.get('loadId') || undefined;
  const truckId = searchParams.get('truckId') || undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold">Créer un BOL</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <BOLForm loadId={loadId} truckId={truckId} />
      </div>
    </div>
  );
}


