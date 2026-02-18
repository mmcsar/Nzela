'use client';

import { useEffect } from 'react';
import { Link } from '@/lib/i18n/routing';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Une erreur est survenue</h1>
        <p className="text-gray-500">
          {error.message?.includes('Configuration Supabase')
            ? error.message
            : "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
        {error.message && !error.message.includes('Configuration Supabase') && (
          <p className="text-xs text-left text-gray-400 font-mono break-all bg-gray-100 px-3 py-2 rounded max-h-24 overflow-y-auto" title="Détail pour diagnostic">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono">Code: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors inline-block"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
