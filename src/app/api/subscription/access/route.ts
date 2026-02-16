import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkSubscriptionAccess } from '@/lib/subscription-access';

/**
 * GET - Vérifie si l'utilisateur a accès à la publication (trial ou abonnement actif).
 * Utilisé par la page Publier et le dashboard.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, company_id, broker_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = (userData?.role ?? (user.app_metadata as { role?: string })?.role) ?? 'company';
    const companyId = userData?.company_id ?? null;
    const brokerId = userData?.broker_id ?? null;

    const access = await checkSubscriptionAccess(
      supabase,
      user.id,
      role,
      companyId,
      brokerId
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
