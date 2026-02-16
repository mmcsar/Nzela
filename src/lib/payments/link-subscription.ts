import type { SupabaseClient } from '@supabase/supabase-js';

type PaymentWithMeta = {
  user_id: string;
  subscription_id: string | null;
  metadata?: { entity_type?: 'company' | 'broker' } | null;
};

/**
 * Après validation d'un paiement d'abonnement, lie l'abonnement à l'entreprise
 * ou au courtier de l'utilisateur (pour que checkSubscriptionAccess reconnaisse l'accès).
 */
export async function linkSubscriptionToEntity(
  supabase: SupabaseClient,
  payment: PaymentWithMeta
): Promise<void> {
  if (!payment.subscription_id) return;

  const entityType = payment.metadata?.entity_type;
  const { data: userRow } = await supabase
    .from('users')
    .select('company_id, broker_id')
    .eq('id', payment.user_id)
    .maybeSingle();

  let companyId = userRow?.company_id ?? null;
  let brokerId = userRow?.broker_id ?? null;
  if (!companyId || !brokerId) {
    const [{ data: company }, { data: broker }] = await Promise.all([
      companyId ? Promise.resolve({ data: null }) : supabase.from('companies').select('id').eq('owner_id', payment.user_id).maybeSingle(),
      brokerId ? Promise.resolve({ data: null }) : supabase.from('brokers').select('id').eq('owner_id', payment.user_id).maybeSingle(),
    ]);
    if (!companyId && company) companyId = company.id;
    if (!brokerId && broker) brokerId = broker.id;
  }

  if (entityType === 'company' && companyId) {
    await supabase
      .from('companies')
      .update({ subscription_id: payment.subscription_id })
      .eq('id', companyId);
    return;
  }
  if (entityType === 'broker' && brokerId) {
    await supabase
      .from('brokers')
      .update({ subscription_id: payment.subscription_id })
      .eq('id', brokerId);
    return;
  }

  // Pas d'entity_type: lier aux deux profils si présents (même abonnement pour company + broker)
  if (companyId) {
    await supabase
      .from('companies')
      .update({ subscription_id: payment.subscription_id })
      .eq('id', companyId);
  }
  if (brokerId) {
    await supabase
      .from('brokers')
      .update({ subscription_id: payment.subscription_id })
      .eq('id', brokerId);
  }
}
