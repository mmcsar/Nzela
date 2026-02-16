import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { PricingCard } from '@/components/pricing/PricingCard';
import { getLocale } from 'next-intl/server';

const pricingPlan = {
  priceUSD: 50,
  features: [
    'Publication et recherche illimitees',
    'Load Board et Truck Board',
    'Alertes de correspondance',
    'Messagerie et contact direct',
    'POD / BOL et outils essentiels',
    'Support client',
  ],
};

export default async function CompanySubscriptionPage() {
  const locale = await getLocale();
  const { user } = await getAuthUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  const supabase = await createClient();
  // Get user's subscription
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_id')
    .eq('id', user.id)
    .single();

  let currentPlan: string | null = null;
  if (userData?.subscription_id) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('id', userData.subscription_id)
      .single();
    currentPlan = subscription?.plan || null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plans d&apos;abonnement</h1>
        <p className="text-gray-600 mt-2">Plan unique: 50 USD par mois</p>
      </div>

      <div className="max-w-md">
        <PricingCard
          plan="standard"
          price={pricingPlan.priceUSD}
          currency="USD"
          features={pricingPlan.features}
          currentPlan={!!currentPlan}
          recommended
        />
      </div>
    </div>
  );
}




