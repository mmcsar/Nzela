'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Car, ArrowLeft, Check } from 'lucide-react';
import { Link } from '@/lib/i18n/routing';
import { useRequireRole } from '@/hooks/useRequireRole';
import { toErrorMessage } from '@/lib/api/error';
import { PROVINCES_RDC_IDS, PROVINCES_RDC_NAMES } from '@/lib/constants/rdc-provinces';

export default function PostVehiclePage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['company', 'admin']);
  const t = useTranslations('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [type, setType] = useState('pickup');
  const [capacity, setCapacity] = useState('');
  const [city, setCity] = useState('Lubumbashi');
  const [province, setProvince] = useState('haut-katanga');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [features, setFeatures] = useState<string[]>([]);

  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  const availableFeatures = ['GPS', 'Climatisation', 'Assurance', 'Bâche', 'Hayon', 'Radio'];

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          capacity: parseInt(capacity),
          currentLocation: JSON.stringify({
            address,
            city,
            province,
          }),
          price: parseInt(price) || 0,
          pricePerKm: parseInt(pricePerKm) || 0,
          features,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(toErrorMessage(data.error, 'Erreur lors de la création'));
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard/company/vehicles'), 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold">Véhicule ajouté !</h2>
          <p className="text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/company/vehicles" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour aux véhicules
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Car className="w-7 h-7 text-indigo-500" />
          Ajouter un véhicule
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule</label>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="pickup">Pickup</option>
            <option value="van">Van / Fourgon</option>
            <option value="small-truck">Petit camion</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <Input
          label="Capacité (kg)"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
          placeholder="Ex: 2000"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              {PROVINCES_RDC_IDS.map((id) => (
                <option key={id} value={id}>{PROVINCES_RDC_NAMES[id]}</option>
              ))}
            </select>
          </div>
        </div>

        <Input label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse de stationnement" />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Prix total (CDF)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          <Input label="Prix par km (CDF)" type="number" value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} placeholder="0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Équipements</label>
          <div className="flex flex-wrap gap-2">
            {availableFeatures.map((feature) => (
              <button
                key={feature}
                type="button"
                onClick={() => toggleFeature(feature)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  features.includes(feature)
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {feature}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Publier le véhicule
        </Button>
      </form>
    </div>
  );
}
