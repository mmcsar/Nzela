'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { Button } from '@/components/ui/Button';
import { CreditCard, Check, Star } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/utils/pricing';
import { useRequireRole } from '@/hooks/useRequireRole';

type PlanKey = keyof typeof SUBSCRIPTION_PLANS;
const SINGLE_PLAN: PlanKey = 'standard';

export default function SubscriptionPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);
  const supabase = createClient();

  // ALL hooks must be called BEFORE any conditional return
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setCurrentPlan(data.plan as PlanKey);
        setSubscriptionId(data.id);
      }
    } catch (error: unknown) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isAuthorized) {
      loadSubscription();
    }
  }, [isAuthorized, loadSubscription]);

  const handleSelectPlan = (plan: PlanKey) => {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setCurrentPlan(selectedPlan!);
    setSelectedPlan(null);
  };

  // Conditional returns AFTER all hooks
  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  if (showPayment && selectedPlan) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Paiement</h1>
        <p className="text-gray-500">
          Mise a niveau vers le plan {SUBSCRIPTION_PLANS[selectedPlan].name}
        </p>
        <div className="bg-white rounded-xl border p-6">
          <PaymentForm
            subscriptionId={subscriptionId || undefined}
            plan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onCancel={() => { setShowPayment(false); setSelectedPlan(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary-600" />
          Abonnement
        </h1>
        <p className="text-gray-500 mt-1">Plan unique: 50 USD / mois</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <div className="max-w-md">
          {(() => {
            const plan = SUBSCRIPTION_PLANS[SINGLE_PLAN];
            const isCurrent = !!currentPlan;
            return (
              <div
                className={`bg-white rounded-2xl border-2 p-5 transition-all ${
                  isCurrent
                    ? 'border-primary-500 shadow-lg shadow-primary-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isCurrent && (
                  <div className="text-xs font-bold text-primary-600 uppercase mb-2">Plan actuel</div>
                )}
                {!isCurrent && (
                  <div className="text-xs font-bold text-amber-600 uppercase mb-2">Unique</div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100">
                    <Star className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-gray-900">{plan.priceUSD}</span>
                  <span className="text-gray-500 text-sm"> USD/mois</span>
                  <div className="text-sm text-gray-400">{plan.priceCDF.toLocaleString()} CDF/mois</div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'primary'}
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(SINGLE_PLAN)}
                >
                  {isCurrent ? 'Plan actuel' : 'Choisir'}
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
