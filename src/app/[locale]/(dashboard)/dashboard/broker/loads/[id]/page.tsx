'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useParams } from 'next/navigation';
import { LoadDetails } from '@/components/loads/LoadDetails';
import { Load } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LoadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [load, setLoad] = useState<Load | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchLoad = async () => {
      try {
        const { data, error } = await supabase
          .from('loads')
          .select('*, broker:brokers(*)')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        
        // Map Supabase data to Load type
        const mappedLoad: Load = {
          id: data.id,
          brokerId: data.broker_id,
          broker: data.broker,
          origin: data.origin,
          destination: data.destination,
          distance: data.distance,
          duration: data.duration,
          trailerType: data.trailer_type,
          weight: data.weight,
          price: data.price,
          pricePerKm: data.price_per_km,
          pickupDate: new Date(data.pickup_date),
          deliveryDate: new Date(data.delivery_date),
          status: data.status,
          createdAt: new Date(data.created_at),
        };
        
        setLoad(mappedLoad);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchLoad();
    }
  }, [params.id, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !load) {
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
          {error || 'Chargement introuvable'}
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
        <h1 className="text-3xl font-bold">Détails du chargement</h1>
      </div>

      <LoadDetails load={load} />
    </div>
  );
}


