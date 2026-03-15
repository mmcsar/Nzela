'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Building2, Pencil, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Load } from '@/types';
import { ALL_REGION_IDS, ALL_REGION_NAMES } from '@/lib/constants/rdc-provinces';
import { useTranslations } from 'next-intl';

/** RCCM officiel de la plateforme (MMC SARL) */
const PLATFORM_RCCM = 'LSHI 17-B-6981';
const PLATFORM_LEGAL = 'Maintenance de Matériel au Congo (M M C SARL)';

const CARGO_TYPE_KEYS: { value: string; key: string }[] = [
  { value: 'minerai_cuivre', key: 'cargoMinerai' },
  { value: 'cobalt', key: 'cargoCobalt' },
  { value: 'ciment', key: 'cargoCiment' },
  { value: 'bois_grumes', key: 'cargoBois' },
  { value: 'machines', key: 'cargoMachines' },
  { value: 'conteneurs', key: 'cargoConteneurs' },
  { value: 'agricole', key: 'cargoAgricole' },
  { value: 'carburant', key: 'cargoCarburant' },
  { value: 'acier_metaux', key: 'cargoAcier' },
  { value: 'general', key: 'cargoGeneral' },
  { value: 'autre', key: 'cargoAutre' },
];

const TRAILER_OPTIONS = [
  { value: 'flatbed', key: 'trailerFlatbed' },
  { value: 'van', key: 'trailerVan' },
  { value: 'reefer', key: 'trailerReefer' },
  { value: 'tanker', key: 'trailerTanker' },
  { value: 'container', key: 'trailerContainer' },
  { value: 'lowboy', key: 'trailerLowboy' },
  { value: 'step-deck', key: 'trailerStepDeck' },
  { value: 'benne', key: 'trailerBenne' },
  { value: 'porte-char', key: 'trailerPorteChar' },
  { value: '53ft', key: 'trailer53ft' },
];

interface LoadFormData {
  cargoType: string;
  origin: { address: string; city: string; province: string; coordinates?: { lat?: number; lng?: number } };
  destination: { address: string; city: string; province: string; coordinates?: { lat?: number; lng?: number } };
  trailerType: string;
  weight: number;
  distance: number;
  duration: string;
  price: number;
  pricePerKm: number;
  pickupDate: string;
  deliveryDate: string;
}

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
  const t = useTranslations('postLoadForm');
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [broker, setBroker] = useState<BrokerInfo | null>(null);
  const [isEditingBroker, setIsEditingBroker] = useState(false);
  const [brokerEdit, setBrokerEdit] = useState({ name: '', registration_number: '', phone: '', email: '', city: '' });
  const [savingBroker, setSavingBroker] = useState(false);
  const [brokerEditError, setBrokerEditError] = useState('');

  const loadSchema = useMemo(() => z.object({
    cargoType: z.string().min(1, t('errCargoRequired')),
    origin: z.object({
      address: z.string().min(1, t('errOriginAddress')),
      city: z.string().min(1, t('errOriginCity')),
      province: z.enum(ALL_REGION_IDS as unknown as [string, ...string[]]),
      coordinates: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
    }),
    destination: z.object({
      address: z.string().min(1, t('errDestAddress')),
      city: z.string().min(1, t('errDestCity')),
      province: z.enum(ALL_REGION_IDS as unknown as [string, ...string[]]),
      coordinates: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
    }),
    trailerType: z.string().min(1, t('errTrailerRequired')),
    weight: z.number().min(1, t('errWeightMin')),
    distance: z.number().min(1, t('errDistanceMin')),
    duration: z.string().min(1, t('errDurationRequired')),
    price: z.number().min(0, t('errPricePositive')),
    pricePerKm: z.number().min(0, t('errPricePerKmPositive')),
    pickupDate: z.string().min(1, t('errPickupRequired')),
    deliveryDate: z.string().min(1, t('errDeliveryRequired')),
  }), [t]);

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
      origin: { province: 'haut-katanga' },
      destination: { province: 'lualaba' },
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
      if (brokerData) {
        const b = brokerData as BrokerInfo;
        setBroker(b);
        setBrokerEdit({
          name: b.name || '',
          registration_number: b.registration_number || '',
          phone: b.phone || '',
          email: b.email || '',
          city: b.city || '',
        });
      }
    };
    fetchBroker();
  }, [supabase]);

  const handleSaveBroker = async () => {
    if (!broker) return;
    setBrokerEditError('');
    setSavingBroker(true);
    try {
      const res = await fetch(`/api/brokers/${broker.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brokerEdit.name || broker.name,
          registration_number: brokerEdit.registration_number || broker.registration_number,
          phone: brokerEdit.phone ?? broker.phone,
          email: brokerEdit.email ?? broker.email,
          city: brokerEdit.city ?? broker.city,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBrokerEditError(data.error || t('errorSave'));
        return;
      }
      if (data.broker) {
        setBroker(data.broker as BrokerInfo);
        setBrokerEdit({
          name: data.broker.name ?? '',
          registration_number: data.broker.registration_number ?? '',
          phone: data.broker.phone ?? '',
          email: data.broker.email ?? '',
          city: data.broker.city ?? '',
        });
      }
      setIsEditingBroker(false);
    } finally {
      setSavingBroker(false);
    }
  };

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
    const contactPhone = broker?.phone || (isEditingBroker ? brokerEdit.phone : '');
    if (broker && !contactPhone?.trim()) {
      setError(t('pleaseAddPhone'));
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/loads/post', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: data.origin,
          destination: data.destination,
          cargoType: data.cargoType || null,
          trailerType: data.trailerType,
          weight: data.weight,
          distance: data.distance,
          duration: data.duration,
          price: data.price,
          pricePerKm: data.pricePerKm,
          pickupDate: data.pickupDate,
          deliveryDate: data.deliveryDate,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json.error || (res.status === 403 ? t('profileRequired') : res.status === 401 ? t('sessionExpired') : t('errorOccurred'));
        setError(msg);
        return;
      }

      const load = json.load as Load;
      if (onSuccess) {
        onSuccess(load);
      } else {
        router.push(`/dashboard/broker/loads/${load.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex flex-col gap-2">
          <span>{error}</span>
          {(error.includes('Session') || error.includes('Reconnectez') || error.includes('sign in')) && (
            <button type="button" onClick={() => router.push('/login')} className="text-sm font-medium underline hover:no-underline text-left">
              {t('reconnect')}
            </button>
          )}
        </div>
      )}

      <div className="bg-primary-50/50 border border-primary-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-medium text-primary-800">{t('aboutLoadBoards')}</p>
          <p>{t('aboutLoadBoardsDesc')}</p>
          <p className="text-xs text-gray-600">{t('requiredInfo')}</p>
        </div>
      </div>

      {broker && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                {t('brokerDetails')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{t('brokerDetailsDesc')}</p>
            </div>
            {!isEditingBroker ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingBroker(true)} className="gap-1.5">
                <Pencil className="w-4 h-4" />
                {t('edit')}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingBroker(false)} className="gap-1.5" disabled={savingBroker}>
                  <X className="w-4 h-4" />
                  {t('cancel')}
                </Button>
                <Button type="button" size="sm" onClick={handleSaveBroker} isLoading={savingBroker} className="gap-1.5">
                  <Check className="w-4 h-4" />
                  {t('save')}
                </Button>
              </div>
            )}
          </div>
          {brokerEditError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{brokerEditError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditingBroker ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('company')}</label>
                  <input
                    type="text"
                    value={brokerEdit.name}
                    onChange={(e) => setBrokerEdit((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('placeholderName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('rccm')}</label>
                  <input
                    type="text"
                    value={brokerEdit.registration_number}
                    onChange={(e) => setBrokerEdit((p) => ({ ...p, registration_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('placeholderRccm')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('phoneVisible')}</label>
                  <input
                    type="tel"
                    value={brokerEdit.phone}
                    onChange={(e) => setBrokerEdit((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('placeholderPhone')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('email')}</label>
                  <input
                    type="email"
                    value={brokerEdit.email}
                    onChange={(e) => setBrokerEdit((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('placeholderEmail')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('city')}</label>
                  <input
                    type="text"
                    value={brokerEdit.city}
                    onChange={(e) => setBrokerEdit((p) => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('placeholderCity')}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('company')}</span>
                  <p className="font-medium">{broker.name || '—'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('rccm')}</span>
                  <p className="font-medium">
                    {(broker.registration_number?.startsWith('BR-') ? PLATFORM_RCCM : broker.registration_number) || PLATFORM_RCCM}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('phoneVisible')}</span>
                  <p className="font-medium">{broker.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('email')}</span>
                  <p className="font-medium">{broker.email || '—'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('city')}</span>
                  <p className="font-medium">{broker.city || '—'}</p>
                </div>
              </>
            )}
            <div className="sm:col-span-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">{t('platform')}</span>
              <p className="text-sm font-medium text-gray-700">{PLATFORM_LEGAL} — RCCM {PLATFORM_RCCM}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold">{t('loadInfo')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">{t('origin')}</h3>
            <div className="space-y-4">
              <Input
                label={t('addressOrigin')}
                {...register('origin.address')}
                error={errors.origin?.address?.message}
                required
              />
              <Input
                label={t('cityOrigin')}
                {...register('origin.city')}
                error={errors.origin?.city?.message}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('province')}
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('origin.province')}
                >
                  {ALL_REGION_IDS.map((id) => (
                    <option key={id} value={id}>{ALL_REGION_NAMES[id]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">{t('destination')}</h3>
            <div className="space-y-4">
              <Input
                label={t('addressDest')}
                {...register('destination.address')}
                error={errors.destination?.address?.message}
                required
              />
              <Input
                label={t('cityDest')}
                {...register('destination.city')}
                error={errors.destination?.city?.message}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('province')}
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('destination.province')}
                >
                  {ALL_REGION_IDS.map((id) => (
                    <option key={id} value={id}>{ALL_REGION_NAMES[id]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('loadDetails')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('productType')}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('cargoType')}
              >
                <option value="">{t('selectProduct')}</option>
                {CARGO_TYPE_KEYS.map((c) => (
                  <option key={c.value} value={c.value}>{t(c.key)}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">{t('cargoHint')}</p>
              {errors.cargoType && (
                <p className="mt-1 text-sm text-red-600">{errors.cargoType.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('trailerType')}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('trailerType')}
              >
                <option value="">{t('selectTrailer')}</option>
                {TRAILER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t(o.key)}</option>
                ))}
              </select>
              {errors.trailerType && (
                <p className="mt-1 text-sm text-red-600">{errors.trailerType.message}</p>
              )}
            </div>
            <Input
              label={t('weightKg')}
              type="number"
              {...register('weight', { valueAsNumber: true })}
              error={errors.weight?.message}
              required
            />
            <Input
              label={t('distanceKm')}
              type="number"
              {...register('distance', { valueAsNumber: true })}
              error={errors.distance?.message}
              required
            />
            <Input
              label={t('duration')}
              placeholder={t('durationPlaceholder')}
              {...register('duration')}
              error={errors.duration?.message}
              required
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('pricing')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('totalPriceCdf')}
              type="number"
              {...register('price', { valueAsNumber: true })}
              error={errors.price?.message}
              required
            />
            <Input
              label={t('pricePerKmCdf')}
              type="number"
              step="0.01"
              {...register('pricePerKm', { valueAsNumber: true })}
              error={errors.pricePerKm?.message}
              required
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('dates')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('pickupDate')}
              type="datetime-local"
              {...register('pickupDate')}
              error={errors.pickupDate?.message}
              required
            />
            <Input
              label={t('deliveryDate')}
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
          {t('publishLoad')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}




