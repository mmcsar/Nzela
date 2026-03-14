'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import { Loader2, LayoutGrid } from 'lucide-react';

export default function TMSProPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
          <LayoutGrid className="w-6 h-6 text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Vue détaillée</h1>
        <p className="text-sm text-gray-500 mb-6">
          Les fonctionnalités détaillées (flotte, chauffeurs, routes, livraisons) ont été retirées de cette vue.
        </p>
        <Link
          href="/dashboard/tms"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Retour au TMS
        </Link>
      </div>
    </div>
  );
}
