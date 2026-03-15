'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { ALL_REGION_IDS, ALL_REGION_NAMES, type AllRegionId } from '@/lib/constants/rdc-provinces';
import { Users, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function RegisterBrokerPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Step 1: Compte
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Step 2: Courtier
  const [brokerName, setBrokerName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lubumbashi');
  const [province, setProvince] = useState<AllRegionId>('haut-katanga');
  const [phone, setPhone] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');

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
      const appUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: 'broker', full_name: fullName },
          emailRedirectTo: `${appUrl}/auth/callback`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      await supabase.from('users').insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'broker',
      });

      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .insert({
          name: brokerName,
          registration_number: registrationNumber,
          address,
          city,
          province,
          phone,
          email: brokerEmail || email,
          owner_id: authData.user.id,
          status: 'pending', // en attente de validation par l'admin (visible dans Dashboard > Courtiers)
        })
        .select()
        .single();

      if (brokerError) throw brokerError;

      await supabase
        .from('users')
        .update({ broker_id: broker.id })
        .eq('id', authData.user.id);

      // Notifier les admins (token dans l'en-tête car la session peut ne pas être dans les cookies tout de suite)
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authData.session?.access_token) {
          headers['Authorization'] = `Bearer ${authData.session.access_token}`;
        }
        await fetch('/api/auth/notify-signup', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'broker',
            entityId: broker.id,
            entityName: brokerName,
          }),
        });
      } catch { /* non bloquant */ }

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
            Votre compte courtier a été créé. Un administrateur doit valider votre compte avant que vous puissiez accéder à toutes les fonctionnalités. Vérifiez votre email pour confirmer votre adresse.
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
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inscription Courtier</h2>
              <p className="text-sm text-gray-500">Étape {step} sur 2</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-gray-200'}`} />
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
            <h3 className="text-lg font-semibold text-gray-800">Informations du courtier</h3>
            <Input label="Nom du cabinet / courtier" value={brokerName} onChange={(e) => setBrokerName(e.target.value)} required />
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
            <Input label="Email professionnel (optionnel)" type="email" value={brokerEmail} onChange={(e) => setBrokerEmail(e.target.value)} placeholder="Laisser vide pour utiliser l'email du compte" />
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
