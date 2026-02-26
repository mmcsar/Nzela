import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkSubscriptionAccess } from '@/lib/subscription-access';

/**
 * GET - Vérifie si l'utilisateur a accès à la publication (trial ou abonnement actif).
 * Utilisé par la page Publier et le dashboard.
 * Lit l'entité (company/broker) avec le service role pour éviter tout blocage RLS.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Session expirée ou absente. Reconnectez-vous.' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, company_id, broker_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = (userData?.role ?? (user.app_metadata as { role?: string })?.role) ?? 'company';
    const companyId = userData?.company_id ?? null;
    const brokerId = userData?.broker_id ?? null;

    let preFetchedEntity: { created_at: string | null; subscription_id: string | null; status?: string } | null = null;
    const entityId = role === 'company' ? companyId : brokerId;
    if (entityId) {
      try {
        const db = createServiceRoleClient();
        const table = role === 'company' ? 'companies' : 'brokers';
        const { data } = await db.from(table).select('created_at, subscription_id, status').eq('id', entityId).maybeSingle();
        preFetchedEntity = data ?? null;
      } catch {
        // Pas de service role : checkSubscriptionAccess lira avec le client utilisateur (RLS)
      }
    }

    const access = await checkSubscriptionAccess(
      supabase,
      user.id,
      role,
      companyId,
      brokerId,
      preFetchedEntity
    );

    return NextResponse.json(access);
  } catch (error: unknown) {
    console.error('subscription/access:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
