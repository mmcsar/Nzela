'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, Smartphone, Building, Check, AlertCircle } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/utils/pricing';
import { toErrorMessage } from '@/lib/api/error';

interface PaymentFormProps {
  subscriptionId?: string;
  plan?: keyof typeof SUBSCRIPTION_PLANS;
  onSuccess?: (payment: any) => void;
  onCancel?: () => void;
}

type PaymentMethod = 'mobile-money' | 'bank-transfer' | 'card';
type Currency = 'CDF' | 'USD';

const MOBILE_PROVIDERS = [
  { id: 'vodacom', name: 'Vodacom M-Pesa', prefix: '+243 81/82/83', color: 'bg-red-500' },
  { id: 'airtel', name: 'Airtel Money', prefix: '+243 99/97', color: 'bg-red-600' },
  { id: 'orange', name: 'Orange Money', prefix: '+243 84/85/89', color: 'bg-orange-500' },
  { id: 'africell', name: 'Africell Money', prefix: '+243 90/91', color: 'bg-purple-500' },
];

export function PaymentForm({ subscriptionId, plan, onSuccess, onCancel }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('mobile-money');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  // Mobile Money
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('vodacom');

  // Bank Transfer
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');

  // Card
  const [cardNumber, setCardNumber] = useState('');

  const planInfo = plan ? SUBSCRIPTION_PLANS[plan] : null;
  const amount = planInfo
    ? currency === 'CDF' ? planInfo.priceCDF : planInfo.priceUSD
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (method === 'mobile-money' && !phoneNumber) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          amount,
          currency,
          method,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(toErrorMessage(data.error, 'Erreur lors du paiement'));
      }

      setStep('success');
      onSuccess?.(data.payment);
    } catch (error: any) {
      setError(error.message);
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Paiement initié !</h3>
        <p className="text-gray-600">
          {method === 'mobile-money'
            ? `Un message de confirmation a été envoyé au ${phoneNumber}. Validez le paiement sur votre téléphone.`
            : 'Votre paiement est en cours de traitement.'}
        </p>
        <p className="text-sm text-gray-500">
          Montant: {amount.toLocaleString()} {currency}
        </p>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900">Confirmer le paiement</h3>

        <div className="bg-gray-50 rounded-xl p-5 space-y-3">
          {planInfo && (
            <div className="flex justify-between">
              <span className="text-gray-600">Plan</span>
              <span className="font-semibold">{planInfo.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Montant</span>
            <span className="font-bold text-lg">{amount.toLocaleString()} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Méthode</span>
            <span className="font-medium">
              {method === 'mobile-money' ? `Mobile Money (${phoneNumber})` :
               method === 'bank-transfer' ? 'Virement bancaire' : 'Carte bancaire'}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('form')} className="flex-1" disabled={isLoading}>
            Retour
          </Button>
          <Button onClick={handleConfirm} className="flex-1" isLoading={isLoading}>
            Confirmer ({amount.toLocaleString()} {currency})
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Devise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
        <div className="flex gap-2">
          {(['CDF', 'USD'] as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
                currency === c
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {c === 'CDF' ? 'Franc Congolais (CDF)' : 'Dollar US (USD)'}
            </button>
          ))}
        </div>
        {planInfo && (
          <p className="text-center mt-2 text-lg font-bold text-gray-900">
            {amount.toLocaleString()} {currency} / mois
          </p>
        )}
      </div>

      {/* Méthode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
        <div className="space-y-2">
          {[
            { id: 'mobile-money' as const, label: 'Mobile Money', icon: Smartphone, desc: 'M-Pesa, Airtel Money, Orange Money' },
            { id: 'bank-transfer' as const, label: 'Virement bancaire', icon: Building, desc: 'Rawbank, TMB, Equity BCDC' },
            { id: 'card' as const, label: 'Carte bancaire', icon: CreditCard, desc: 'Visa, Mastercard' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                method === m.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <m.icon className={`w-6 h-6 ${method === m.id ? 'text-primary-600' : 'text-gray-400'}`} />
              <div>
                <div className="font-semibold text-sm">{m.label}</div>
                <div className="text-xs text-gray-500">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Champs spécifiques */}
      {method === 'mobile-money' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opérateur</label>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    provider === p.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.prefix}</div>
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Numéro de téléphone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+243 8X XXX XXXX"
            required
          />
        </div>
      )}

      {method === 'bank-transfer' && (
        <div className="space-y-4">
          <Input label="Nom du titulaire" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banque</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            >
              <option value="">Sélectionner une banque</option>
              <option value="rawbank">Rawbank</option>
              <option value="tmb">Trust Merchant Bank (TMB)</option>
              <option value="equity-bcdc">Equity BCDC</option>
              <option value="fbn">First Bank of Nigeria (FBN)</option>
              <option value="sofibanque">Sofibanque</option>
            </select>
          </div>
        </div>
      )}

      {method === 'card' && (
        <div className="space-y-4">
          <Input label="Numéro de carte" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4XXX XXXX XXXX XXXX" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiration" placeholder="MM/AA" required />
            <Input label="CVV" type="password" placeholder="XXX" required />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" className="flex-1">
          Payer {amount.toLocaleString()} {currency}
        </Button>
      </div>
    </form>
  );
}
