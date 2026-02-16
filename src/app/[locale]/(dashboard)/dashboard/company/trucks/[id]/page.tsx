'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useParams } from 'next/navigation';
import { TruckDetails } from '@/components/trucks/TruckDetails';
import { Truck } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function TruckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchTruck = async () => {
      try {
        const { data, error } = await supabase
          .from('trucks')
          .select('*, company:companies(*)')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setTruck(data as Truck);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du camion');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchTruck();
    }
  }, [params.id, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !truck) {
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
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Camion introuvable'}
        </div>
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
        <h1 className="text-3xl font-bold">Détails du camion</h1>
      </div>

      <TruckDetails truck={truck} />
    </div>
  );
}


