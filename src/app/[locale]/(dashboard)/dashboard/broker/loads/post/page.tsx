'use client';

import { LoadPostForm } from '@/components/loads/LoadPostForm';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function PostLoadPage() {
  const router = useRouter();
  const { isLoading, isAuthorized, role, brokerId } = useRequireRole(['broker', 'admin']);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[320px]">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized || (role === 'broker' && !brokerId)) {
    return (
      <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p className="font-medium text-amber-800">Accès réservé aux courtiers</p>
        <p className="text-sm text-amber-700 mt-1">
          {role === 'broker' && !brokerId
            ? 'Aucun profil courtier lié. Utilisez la page Publier pour rattacher votre compte ou contactez l\'administrateur.'
            : 'Connectez-vous avec un compte courtier pour publier un chargement.'}
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/publish')}>
          Aller à Publier
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


