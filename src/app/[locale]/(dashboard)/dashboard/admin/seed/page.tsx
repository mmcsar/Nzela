'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

export default function SeedDataPage() {
  const t = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  const handleSeedData = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Créer les données d'exemple via l'API
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création des données');
      }

      setMessage({
        type: 'success',
        text: `✅ ${result.message} (${result.trucks} camions, ${result.loads} chargements)`,
      });
      showSuccess(`${result.trucks} camions et ${result.loads} chargements créés avec succès !`);
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div>
        <h1 className="text-3xl font-bold">Publier des données de démo</h1>
        <p className="text-gray-600 mt-2">
          Cette page permet de créer 3 exemples de camions et 3 exemples de chargements pour tester l&apos;application.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Données à créer</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="font-medium text-gray-900">3 Camions</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
              <li>Semi-remorque - 20,000 kg - Lubumbashi → Kolwezi</li>
              <li>Camion benne - 15,000 kg - Lubumbashi</li>
              <li>Porteur - 10,000 kg - Likasi → Lubumbashi</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">3 Chargements</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
              <li>Tenke → Matadi - 18,000 kg - 1,200 km</li>
              <li>Lubumbashi → Kolwezi - 12,000 kg - 350 km</li>
              <li>Likasi → Lubumbashi - 8,000 kg - 120 km</li>
            </ul>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <Button
          onClick={handleSeedData}
          isLoading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Création en cours...' : 'Créer les données d\'exemple'}
        </Button>
      </div>
    </div>
  );
}

