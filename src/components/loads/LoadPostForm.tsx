'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Load } from '@/types';

const CARGO_TYPES = [
  { value: 'minerai_cuivre', label: 'Minerai / Concentré de cuivre' },
  { value: 'cobalt', label: 'Cobalt' },
  { value: 'ciment', label: 'Ciment' },
  { value: 'bois_grumes', label: 'Bois / Grumes' },
  { value: 'machines', label: 'Machines / Équipements' },
  { value: 'conteneurs', label: 'Conteneurs' },
  { value: 'agricole', label: 'Produits agricoles' },
  { value: 'carburant', label: 'Carburant / Hydrocarbures' },
  { value: 'acier_metaux', label: 'Acier / Métaux' },
  { value: 'general', label: 'Marchandises générales' },
  { value: 'autre', label: 'Autre' },
] as const;

const loadSchema = z.object({
  cargoType: z.string().min(1, 'Le type de produit est requis'),
  origin: z.object({
    address: z.string().min(1, 'L\'adresse d\'origine est requise'),
    city: z.string().min(1, 'La ville d\'origine est requise'),
    province: z.enum(['haut-katanga', 'lualaba']),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
  }),
  destination: z.object({
    address: z.string().min(1, 'L\'adresse de destination est requise'),
    city: z.string().min(1, 'La ville de destination est requise'),
    province: z.enum(['haut-katanga', 'lualaba']),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
  }),
  trailerType: z.string().min(1, 'Le type de remorque est requis'),
  weight: z.number().min(1, 'Le poids doit être supérieur à 0'),
  distance: z.number().min(1, 'La distance doit être supérieure à 0'),
  duration: z.string().min(1, 'La durée est requise'),
  price: z.number().min(0, 'Le prix doit être positif'),
  pricePerKm: z.number().min(0, 'Le prix par km doit être positif'),
  pickupDate: z.string().min(1, 'La date de ramassage est requise'),
  deliveryDate: z.string().min(1, 'La date de livraison est requise'),
});

type LoadFormData = z.infer<typeof loadSchema>;

interface LoadPostFormProps {
  onSuccess?: (load: Load) => void;
}

interface BrokerInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  registration_number: string;
}

export function LoadPostForm({ onSuccess }: LoadPostFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [broker, setBroker] = useState<BrokerInfo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoadFormData>({
    resolver: zodResolver(loadSchema),
    defaultValues: {
      cargoType: '',
      origin: {
        province: 'haut-katanga',
      },
      destination: {
        province: 'haut-katanga',
      },
    },
  });

  useEffect(() => {
    const fetchBroker = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('broker_id').eq('id', user.id).single();
      if (!userData?.broker_id) return;
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('id, name, phone, email, city, registration_number')
        .eq('id', userData.broker_id)
        .single();
      if (brokerData) setBroker(brokerData as BrokerInfo);
    };
    fetchBroker();
  }, [supabase]);

  const origin = watch('origin');
  const destination = watch('destination');

  // Calculate distance when origin or destination changes
  const calculateDistance = () => {
    // This is a simplified calculation
    // In production, you'd use a mapping service API
    if (origin?.city && destination?.city) {
      // Placeholder: would use actual distance calculation
      setValue('distance', 100);
      setValue('duration', '2h');
    }
  };

  const onSubmit = async (data: LoadFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Vous devez être connecté');
      }

      // Get user's broker
      const { data: userData } = await supabase
        .from('users')
        .select('broker_id')
        .eq('id', user.id)
        .single();

      if (!userData?.broker_id) {
        throw new Error('Vous devez avoir un compte broker associé');
      }

      // Create load
      const { data: load, error: loadError } = await supabase
        .from('loads')
        .insert({
          broker_id: userData.broker_id,
          origin: data.origin,
          destination: data.destination,
          distance: data.distance,
          duration: data.duration,
          trailer_type: data.trailerType,
          weight: data.weight,
          price: data.price,
          price_per_km: data.pricePerKm,
          pickup_date: data.pickupDate,
          delivery_date: data.deliveryDate,
          cargo_type: data.cargoType || null,
          status: 'available',
        })
        .select()
        .single();

      if (loadError) throw loadError;

      if (onSuccess) {
        onSuccess(load as Load);
      } else {
        router.push(`/dashboard/broker/loads/${load.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-primary-50/50 border border-primary-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-medium text-primary-800">À propos des load boards</p>
          <p>
            Les load boards permettent aux expéditeurs et courtiers de publier leurs chargements, de rechercher des camions adaptés et d&apos;utiliser des outils de tarification pour consulter les prix moyens par itinéraire. En renseignant les informations ci-dessous, vous facilitez la mise en relation avec les transporteurs et la négociation des tarifs.
          </p>
          <p className="text-xs text-gray-600">
            Informations requises : détails du fret (poids, dimensions, quantité), lieu et date de ramassage, lieu et date de livraison, instructions additionnelles, taux de fret.
          </p>
        </div>
      </div>

      {broker && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Détails du courtier
          </h2>
          <p className="text-sm text-gray-600 mb-4">Ces informations seront affichées aux transporteurs pour les mises en contact.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Entreprise</span>
              <p className="font-medium">{broker.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">RCCM</span>
              <p className="font-medium">{broker.registration_number}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Téléphone</span>
              <p className="font-medium">{broker.phone}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Email</span>
              <p className="font-medium">{broker.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Ville</span>
              <p className="font-medium">{broker.city || '—'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold">Informations du chargement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Origine</h3>
            <div className="space-y-4">
              <Input
                label="Adresse d'origine"
                {...register('origin.address')}
                error={errors.origin?.address?.message}
                required
              />
              <Input
                label="Ville d'origine"
                {...register('origin.city')}
                error={errors.origin?.city?.message}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('origin.province')}
                >
                  <option value="haut-katanga">Haut-Katanga</option>
                  <option value="lualaba">Lualaba</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Destination</h3>
            <div className="space-y-4">
              <Input
                label="Adresse de destination"
                {...register('destination.address')}
                error={errors.destination?.address?.message}
                required
              />
              <Input
                label="Ville de destination"
                {...register('destination.city')}
                error={errors.destination?.city?.message}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('destination.province')}
                >
                  <option value="haut-katanga">Haut-Katanga</option>
                  <option value="lualaba">Lualaba</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Détails du chargement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de produit
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('cargoType')}
              >
                <option value="">Sélectionner...</option>
                {CARGO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Indiquez le type de marchandise pour trouver le camion adapté.</p>
              {errors.cargoType && (
                <p className="mt-1 text-sm text-red-600">{errors.cargoType.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de remorque
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('trailerType')}
              >
                <option value="">Selectionner...</option>
                <option value="flatbed">Plateau (Flatbed)</option>
                <option value="van">Fourgon (Van)</option>
                <option value="reefer">Frigorifique (Reefer)</option>
                <option value="tanker">Citerne (Tanker)</option>
                <option value="container">Conteneur</option>
                <option value="lowboy">Surbaisse (Lowboy)</option>
                <option value="step-deck">Plateau surbaisse (Step Deck)</option>
                <option value="benne">Benne</option>
                <option value="porte-char">Porte-char</option>
                <option value="53ft">53 pieds</option>
              </select>
              {errors.trailerType && (
                <p className="mt-1 text-sm text-red-600">{errors.trailerType.message}</p>
              )}
            </div>
            <Input
              label="Poids (kg)"
              type="number"
              {...register('weight', { valueAsNumber: true })}
              error={errors.weight?.message}
              required
            />
            <Input
              label="Distance (km)"
              type="number"
              {...register('distance', { valueAsNumber: true })}
              error={errors.distance?.message}
              required
            />
            <Input
              label="Durée estimée"
              placeholder="Ex: 2h, 1d 3h"
              {...register('duration')}
              error={errors.duration?.message}
              required
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Tarification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prix total (CDF)"
              type="number"
              {...register('price', { valueAsNumber: true })}
              error={errors.price?.message}
              required
            />
            <Input
              label="Prix par km (CDF)"
              type="number"
              step="0.01"
              {...register('pricePerKm', { valueAsNumber: true })}
              error={errors.pricePerKm?.message}
              required
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date de ramassage"
              type="datetime-local"
              {...register('pickupDate')}
              error={errors.pickupDate?.message}
              required
            />
            <Input
              label="Date de livraison"
              type="datetime-local"
              {...register('deliveryDate')}
              error={errors.deliveryDate?.message}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          Publier le chargement
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}




