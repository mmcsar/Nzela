'use client';

import { LoadPostForm } from '@/components/loads/LoadPostForm';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';

export default function PostLoadPage() {
  const router = useRouter();

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
        <h1 className="text-3xl font-bold">Publier un chargement</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <LoadPostForm />
      </div>
    </div>
  );
}


