import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Synchronise le profil utilisateur (table users) si manquant.
 * Appelé quand l'utilisateur est authentifié mais n'a pas de ligne dans users.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id, role, company_id, broker_id')
    .eq('id', user.id)
    .maybeSingle();

  const metadataRole = (user.app_metadata as { role?: string })?.role;
  const role = (existing?.role as string) || (metadataRole && ['admin', 'company', 'broker'].includes(metadataRole) ? metadataRole : 'company');
  let companyId = existing?.company_id ?? null;
  let brokerId = existing?.broker_id ?? null;

  // Cas 1: Pas de ligne users -> créer ou mettre à jour le profil (upsert évite duplicate key)
  if (!existing) {
    const fullName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || '';

    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        role,
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error('[sync-profile] Erreur upsert users:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  // Cas 2: Ligne users existe mais company_id/broker_id manquant -> rattacher si company/broker existe (owner_id = user)
  if ((!companyId || !brokerId) && (role === 'broker' || role === 'company')) {
    if (role === 'broker' && !brokerId) {
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (broker) {
        brokerId = broker.id;
        await supabase.from('users').update({ broker_id: broker.id }).eq('id', user.id);
      }
    } else if (role === 'company' && !companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (company) {
        companyId = company.id;
        await supabase.from('users').update({ company_id: company.id }).eq('id', user.id);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    message: 'Profil synchronisé',
    role,
    brokerId,
    companyId,
  });
}
