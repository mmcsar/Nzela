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

export default function PostVehiclePage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['company', 'admin']);
  const t = useTranslations('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [currentMileageKm, setCurrentMileageKm] = useState('');
  const [category, setCategory] = useState('truck');
  const [truckConfig, setTruckConfig] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [ptacTons, setPtacTons] = useState('');
  const [ptraTons, setPtraTons] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/company/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber,
          brand,
          model,
          year: year ? Number(year) : null,
          currentMileageKm: currentMileageKm ? Number(currentMileageKm) : 0,
          category,
          truckConfig: truckConfig || null,
          bodyType: bodyType || null,
          ptacTons: ptacTons ? Number(ptacTons) : null,
          ptraTons: ptraTons ? Number(ptraTons) : null,
          photoUrl: photoUrl || null,
          notes: notes || null,
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
            Ajouter un camion a la flotte
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5 transition-shadow duration-200 hover:shadow-sm">
        <Input
          label="Immatriculation"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          required
          placeholder="Ex: 1234 AB 01"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Marque" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          <Input label="Modèle" value={model} onChange={(e) => setModel(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Année" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2021" />
          <Input label="Kilométrage actuel (km)" type="number" value={currentMileageKm} onChange={(e) => setCurrentMileageKm(e.target.value)} placeholder="Ex: 245000" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="truck">Camion</option>
            <option value="tractor">Tracteur</option>
            <option value="trailer">Remorque</option>
            <option value="van">Fourgon</option>
            <option value="pickup">Pickup</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Configuration camion (optionnel)"
            value={truckConfig}
            onChange={(e) => setTruckConfig(e.target.value)}
            placeholder="Ex: 4x2, 6x4, 8x4"
          />
          <Input
            label="Type carrosserie (optionnel)"
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
            placeholder="Ex: Benne, Citerne, Plateau"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="PTAC (tonnes, optionnel)"
            type="number"
            step="0.01"
            min="0"
            value={ptacTons}
            onChange={(e) => setPtacTons(e.target.value)}
            placeholder="Ex: 26"
          />
          <Input
            label="PTRA (tonnes, optionnel)"
            type="number"
            step="0.01"
            min="0"
            value={ptraTons}
            onChange={(e) => setPtraTons(e.target.value)}
            placeholder="Ex: 44"
          />
        </div>

        <Input label="Photo URL (optionnel)" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
        <Input label="Notes (optionnel)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails utiles..." />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Enregistrer le véhicule
        </Button>
      </form>
    </div>
  );
}
