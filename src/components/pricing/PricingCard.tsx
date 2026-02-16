'use client';

import { SubscriptionPlan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface PricingCardProps {
  plan: SubscriptionPlan;
  price: number;
  features: string[];
  recommended?: boolean;
  currentPlan?: boolean;
  currency?: 'CDF' | 'USD';
}

const planNames: Record<SubscriptionPlan, string> = {
  standard: 'Standard',
};

const planDescriptions: Record<SubscriptionPlan, string> = {
  standard: 'Plan unique pour courtiers et entreprises',
};

export function PricingCard({
  plan,
  price,
  features,
  recommended = false,
  currentPlan = false,
  currency = 'CDF',
}: PricingCardProps) {
  return (
    <div
      className={`relative bg-white rounded-lg shadow-md p-8 ${
        recommended ? 'border-2 border-primary-600 transform scale-105' : 'border border-gray-200'
      }`}
    >
      {recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            LE PLUS POPULAIRE
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{planNames[plan]}</h3>
        <p className="text-sm text-gray-600 mb-4">{planDescriptions[plan]}</p>
        <div className="mb-4">
          <span className="text-4xl font-bold text-primary-600">{price.toLocaleString()}</span>
          <span className="text-gray-600 ml-2">{currency} / mois</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {currentPlan ? (
        <Button className="w-full" variant="outline" disabled>
          Plan actuel
        </Button>
      ) : (
        <Link href={`/register?plan=${plan}`} className="block">
          <Button className="w-full">
            {recommended ? 'Choisir ce plan' : 'Sélectionner'}
          </Button>
        </Link>
      )}
    </div>
  );
}




