'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { Package, Loader2 } from 'lucide-react';

export default function SeedLoadsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, removeToast, success, error: showError } = useToast();

  const handleSeedLoads = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/loads/seed', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création des chargements');
      }

      success(`${data.count} chargements créés avec succès !`);
    } catch (error: any) {
      console.error('Error seeding loads:', error);
      showError(error.message || 'Erreur lors de la création des chargements');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl p-8 border-2 border-indigo-500/20 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100">Créer des chargements d&apos;exemple</h1>
              <p className="text-sm text-slate-400">Générer 8 chargements variés pour le LoadBoard</p>
            </div>
          </div>

          <div className="bg-indigo-950/30 rounded-xl p-6 border border-indigo-500/20 mb-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4">Chargements qui seront créés :</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Lubumbashi → Kolwezi (Minerais, 25T, $3500)</li>
              <li>• Lubumbashi → Likasi (Ciment, 20T, $1800)</li>
              <li>• Kolwezi → Lubumbashi (Marchandises, 15T, $2800)</li>
              <li>• Likasi → Lubumbashi (Équipements, 18T, $2200)</li>
              <li>• Lubumbashi → Kasumbalesa (Alimentaire, 12T, $1500)</li>
              <li>• Kolwezi → Fungurume (Minerais, 30T, $4200)</li>
              <li>• Lubumbashi → Kipushi (Matériaux, 22T, $1200)</li>
              <li>• Likasi → Kambove (Ciment, 16T, $1900)</li>
            </ul>
          </div>

          <Button
            onClick={handleSeedLoads}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Package className="w-5 h-5 mr-2" />
                Créer 8 chargements d&apos;exemple
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center mt-4">
            Les chargements seront créés avec votre compte broker actuel
          </p>
        </div>
      </div>
    </div>
  );
}


