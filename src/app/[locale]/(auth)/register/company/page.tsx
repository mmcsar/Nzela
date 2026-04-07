'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ALL_REGION_IDS, ALL_REGION_NAMES, type AllRegionId } from '@/lib/constants/rdc-provinces';
import { Building2, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function RegisterCompanyPage() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Step 1: Compte
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Step 2: Entreprise
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lubumbashi');
  const [province, setProvince] = useState<AllRegionId>('haut-katanga');
  const [phone, setPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'company',
          email,
          password,
          fullName,
          entityName: companyName,
          registrationNumber,
          address,
          city,
          province,
          phone,
          professionalEmail: companyEmail.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du compte');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login?registered=true'), 2000);
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Inscription réussie !</h2>
          <p className="text-gray-600">
            Votre compte entreprise a été créé. Un administrateur doit valider votre compte avant que vous puissiez accéder à toutes les fonctionnalités. Vérifiez votre email pour confirmer votre adresse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <Link href="/register" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inscription Entreprise</h2>
              <p className="text-sm text-gray-500">Étape {step} sur 2</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Informations du compte</h3>
            <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <Button type="submit" className="w-full">Suivant</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Informations de l&apos;entreprise</h3>
            <Input label="Nom de l'entreprise" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            <Input label="Numéro d'enregistrement (RCCM)" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
            <Input label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={province}
                  onChange={(e) => setProvince(e.target.value as AllRegionId)}
                >
                  {ALL_REGION_IDS.map((id) => (
                    <option key={id} value={id}>{ALL_REGION_NAMES[id]}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+243..." />
            <Input label="Email entreprise (optionnel)" type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="Laisser vide pour utiliser l'email du compte" />
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
              <Button type="submit" className="flex-1" isLoading={isLoading}>Créer mon compte</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
