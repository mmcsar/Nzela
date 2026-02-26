import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkSubscriptionAccess } from '@/lib/subscription-access';

/**
 * GET - Diagnostic du profil (pour débugger "rien ne marche").
 * Connectez-vous en tant que courtier ou entreprise, puis ouvrez /api/debug/profile.
 * Réponse : role, companyId, brokerId, subscription (hasAccess, message), serviceRoleConfigured.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non connecté', ok: false }, { status: 401 });
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('role, company_id, broker_id')
      .eq('id', user.id)
      .maybeSingle();

    const role = (userRow?.role ?? (user.app_metadata as { role?: string })?.role) ?? null;
    const companyId = userRow?.company_id ?? null;
    const brokerId = userRow?.broker_id ?? null;

    let subscription: { hasAccess: boolean; message: string } = { hasAccess: false, message: '' };
    try {
      const access = await checkSubscriptionAccess(
        supabase,
        user.id,
        role ?? 'company',
        companyId,
        brokerId,
        undefined
      );
      subscription = { hasAccess: access.hasAccess, message: access.message };
    } catch (e) {
      subscription = { hasAccess: false, message: (e as Error).message || 'Erreur calcul accès' };
    }

    const serviceRoleConfigured = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here'
    );

    return NextResponse.json({
      ok: true,
      email: user.email,
      role,
      companyId,
      brokerId,
      subscription,
      serviceRoleConfigured,
      hint: !brokerId && role === 'broker'
        ? 'broker_id manquant : exécutez supabase/lier_courtier_utilisateur.sql dans Supabase SQL Editor, ou faites lier par un admin.'
        : !companyId && role === 'company'
          ? 'company_id manquant : idem, script SQL ou admin.'
          : !serviceRoleConfigured
            ? 'SUPABASE_SERVICE_ROLE_KEY absente (Vercel ou .env.local) : listes admin et certains rattachements peuvent échouer.'
            : subscription.hasAccess
              ? 'Profil OK, vous devriez pouvoir publier.'
              : `Blocage abonnement : ${subscription.message}`,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: (e as Error).message,
    }, { status: 500 });
  }
}
