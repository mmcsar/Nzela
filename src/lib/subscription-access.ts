import type { SupabaseClient } from '@supabase/supabase-js';

/** Période gratuite en jours après inscription (entreprise ou courtier). */
export const TRIAL_DAYS = 14;

/**
 * La variable d'environnement force l'état si définie.
 * Sinon, l'état est lu depuis la table app_settings (toggle dans Admin > Paramètres > Métier).
 */
async function isSubscriptionGateEnabled(supabase: SupabaseClient): Promise<boolean> {
  if (process.env.SUBSCRIPTION_GATE_ENABLED === 'true') return true;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'subscription_gate_enabled')
    .maybeSingle();
  return (data?.value as { enabled?: boolean } | null)?.enabled === true;
}

export interface SubscriptionAccessResult {
  hasAccess: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  message: string;
}

/**
 * Vérifie si l'utilisateur (company ou broker) a le droit de publier :
 * - soit il est en période gratuite (created_at + TRIAL_DAYS),
 * - soit il a un abonnement actif (status = active, end_date > now).
 * Admin : toujours accès.
 */
export async function checkSubscriptionAccess(
  supabase: SupabaseClient,
  userId: string,
  role: string,
  companyId: string | null,
  brokerId: string | null
): Promise<SubscriptionAccessResult> {
  if (role === 'admin') {
    return { hasAccess: true, isTrial: false, trialEndsAt: null, message: 'Admin' };
  }

  const entityId = role === 'company' ? companyId : brokerId;
  const table = role === 'company' ? 'companies' : 'brokers';

  if (!entityId) {
    return {
      hasAccess: false,
      isTrial: false,
      trialEndsAt: null,
      message: 'Profil entreprise ou courtier non lié.',
    };
  }

  const gateEnabled = await isSubscriptionGateEnabled(supabase);
  if (!gateEnabled) {
    return {
      hasAccess: true,
      isTrial: false,
      trialEndsAt: null,
      message: 'Abonnement suspendu (lancement).',
    };
  }

  const { data: entity, error: entityError } = await supabase
    .from(table)
    .select('created_at, subscription_id')
    .eq('id', entityId)
    .single();

  if (entityError || !entity) {
    return {
      hasAccess: false,
      isTrial: false,
      trialEndsAt: null,
      message: 'Profil introuvable.',
    };
  }

  const created_at = entity.created_at ? new Date(entity.created_at) : new Date();
  const trialEndsAt = new Date(created_at);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
  const now = new Date();

  // 1. Abonnement actif ?
  if (entity.subscription_id) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, end_date')
      .eq('id', entity.subscription_id)
      .single();

    if (sub?.status === 'active' && sub?.end_date && new Date(sub.end_date) > now) {
      return {
        hasAccess: true,
        isTrial: false,
        trialEndsAt: null,
        message: 'Abonnement actif',
      };
    }
  }

  // 2. Période gratuite ?
  if (trialEndsAt > now) {
    return {
      hasAccess: true,
      isTrial: true,
      trialEndsAt: trialEndsAt.toISOString(),
      message: `Période gratuite jusqu'au ${trialEndsAt.toLocaleDateString('fr-FR')}`,
    };
  }

  return {
    hasAccess: false,
    isTrial: false,
    trialEndsAt: trialEndsAt.toISOString(),
    message: 'Période gratuite terminée. Abonnez-vous pour continuer à publier.',
  };
}
