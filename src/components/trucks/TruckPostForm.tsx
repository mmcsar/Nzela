'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Truck } from '@/types';
import { toErrorMessage } from '@/lib/api/error';
import { ALL_REGION_IDS, ALL_REGION_NAMES } from '@/lib/constants/rdc-provinces';
import { Building2, Pencil, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CompanyInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface TruckFormData {
  type: string;
  capacity: number;
  currentLocation: { address: string; city: string; province: string; coordinates?: { lat?: number; lng?: number } };
  availableDate: string;
  destination?: { address?: string; city?: string; province?: string; coordinates?: { lat?: number; lng?: number } };
  price: number;
  pricePerKm: number;
  currency: 'CDF' | 'USD';
  features?: string[];
}

const FEATURES: { value: string; key: string }[] = [
  { value: 'GPS', key: 'featureGps' },
  { value: 'Refrigéré', key: 'featureRefrigere' },
  { value: 'Plateau', key: 'featurePlateau' },
  { value: 'Bâché', key: 'featureBache' },
  { value: 'Grue', key: 'featureGrue' },
  { value: 'Hayon', key: 'featureHayon' },
  { value: 'Double essieu', key: 'featureDoubleEssieu' },
  { value: 'Triple essieu', key: 'featureTripleEssieu' },
];

const TRUCK_TYPE_OPTIONS = [
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

interface TruckPostFormProps {
  onSuccess?: (truck: Truck) => void;
}

export function TruckPostForm({ onSuccess }: TruckPostFormProps) {
  const t = useTranslations('postTruckForm');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [companyEdit, setCompanyEdit] = useState({ phone: '', email: '' });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyEditError, setCompanyEditError] = useState('');

  const truckSchema = useMemo(() => z.object({
    type: z.string().min(1, t('errTypeRequired')),
    capacity: z.number().min(1, t('errCapacityMin')),
    currentLocation: z.object({
      address: z.string().min(1, t('errAddressRequired')),
      city: z.string().min(1, t('errCityRequired')),
      province: z.enum(ALL_REGION_IDS as unknown as [string, ...string[]]),
      coordinates: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
    }),
    availableDate: z.string().min(1, t('errAvailableDateRequired')),
    destination: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.enum(ALL_REGION_IDS as unknown as [string, ...string[]]).optional(),
      coordinates: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
    }).optional(),
    price: z.number().min(0, t('errPricePositive')),
    pricePerKm: z.number().min(0, t('errPricePerKmPositive')),
    currency: z.enum(['CDF', 'USD']),
    features: z.array(z.string()).optional(),
  }), [t]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/companies', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { companies?: CompanyInfo[] }) => {
        if (cancelled || !data?.companies?.length) return;
        const c = data.companies[0];
        setCompany(c);
        setCompanyEdit({ phone: c.phone ?? '', email: c.email ?? '' });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TruckFormData>({
    resolver: zodResolver(truckSchema),
    defaultValues: {
      currentLocation: {
        province: 'haut-katanga',
      },
      currency: 'CDF',
      features: [],
    },
  });

  const features = watch('features') || [];

  const toggleFeature = (feature: string) => {
    const currentFeatures = features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];
    setValue('features', newFeatures);
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    setCompanyEditError('');
    setSavingCompany(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: companyEdit.phone || undefined,
          email: companyEdit.email || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCompanyEditError(data.error || t('errorSave'));
        return;
      }
      if (data.company) {
        setCompany({ ...company, phone: data.company.phone ?? '', email: data.company.email ?? '' });
        setCompanyEdit({ phone: data.company.phone ?? '', email: data.company.email ?? '' });
      }
      setIsEditingCompany(false);
    } finally {
      setSavingCompany(false);
    }
  };

  const onSubmit = async (data: TruckFormData) => {
    const contactPhone = company?.phone || (isEditingCompany ? companyEdit.phone : '');
    if (company && !contactPhone?.trim()) {
      setError(t('pleaseAddPhone'));
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          capacity: data.capacity,
          currentLocation: data.currentLocation,
          availableDate: data.availableDate,
          destination: data.destination || null,
          price: data.price,
          pricePerKm: data.pricePerKm,
          currency: data.currency || 'CDF',
          features: data.features || [],
          status: 'available',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(toErrorMessage(json.error, t('errorOccurred')));
      const truck = json.truck;

      if (onSuccess) {
        onSuccess(truck as Truck);
      } else {
        router.push(`/dashboard/company/trucks/${truck.id}`);
      }
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
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

      {company && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                {t('contactDetails')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{t('contactDetailsDesc')}</p>
            </div>
            {!isEditingCompany ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingCompany(true)} className="gap-1.5">
                <Pencil className="w-4 h-4" />
                {t('edit')}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingCompany(false)} className="gap-1.5" disabled={savingCompany}>
                  <X className="w-4 h-4" />
                  {t('cancel')}
                </Button>
                <Button type="button" size="sm" onClick={handleSaveCompany} isLoading={savingCompany} className="gap-1.5">
                  <Check className="w-4 h-4" />
                  {t('save')}
                </Button>
              </div>
            )}
          </div>
          {companyEditError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{companyEditError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">{t('company')}</span>
              <p className="font-medium">{company.name || '—'}</p>
            </div>
            {isEditingCompany ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('phoneVisible')}</label>
                  <input
                    type="tel"
                    value={companyEdit.phone}
                    onChange={(e) => setCompanyEdit((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('placeholderPhone')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('email')}</label>
                  <input
                    type="email"
                    value={companyEdit.email}
                    onChange={(e) => setCompanyEdit((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('placeholderEmail')}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('phoneVisible')}</span>
                  <p className="font-medium">{company.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('email')}</span>
                  <p className="font-medium">{company.email || '—'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold">{t('truckInfo')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('truckType')} <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('type')}
            >
              <option value="">{t('selectType')}</option>
              {TRUCK_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.key)}</option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>
          <Input
            label={t('capacityKg')}
            type="number"
            {...register('capacity', { valueAsNumber: true })}
            error={errors.capacity?.message}
            required
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('currentLocation')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('address')}
              {...register('currentLocation.address')}
              error={errors.currentLocation?.address?.message}
              required
            />
            <Input
              label={t('city')}
              {...register('currentLocation.city')}
              error={errors.currentLocation?.city?.message}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('province')}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('currentLocation.province')}
              >
                {ALL_REGION_IDS.map((id) => (
                  <option key={id} value={id}>{ALL_REGION_NAMES[id]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('destinationOptional')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('destinationCity')}
              {...register('destination.city')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('province')}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('destination.province')}
              >
                <option value="">{t('anyDestination')}</option>
                {ALL_REGION_IDS.map((id) => (
                  <option key={id} value={id}>{ALL_REGION_NAMES[id]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('pricing')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('currency')}</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('currency')}
              >
                <option value="CDF">{t('currencyCdf')}</option>
                <option value="USD">{t('currencyUsd')}</option>
              </select>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={watch('currency') === 'USD' ? t('fixedPriceUsd') : t('fixedPriceCdf')}
                type="number"
                {...register('price', { valueAsNumber: true })}
                error={errors.price?.message}
                required
              />
              <Input
                label={watch('currency') === 'USD' ? t('pricePerKmUsd') : t('pricePerKmCdf')}
                type="number"
                step="0.01"
                {...register('pricePerKm', { valueAsNumber: true })}
                error={errors.pricePerKm?.message}
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('availability')}</h3>
          <Input
            label={t('availableDate')}
            type="datetime-local"
            {...register('availableDate')}
            error={errors.availableDate?.message}
            required
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('featuresSection')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.map((item) => (
              <label
                key={item.value}
                className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={features.includes(item.value)}
                  onChange={() => toggleFeature(item.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{t(item.key)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {t('publishTruck')}
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




