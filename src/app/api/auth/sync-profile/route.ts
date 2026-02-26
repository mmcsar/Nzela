import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Synchronise le profil utilisateur (table users) si manquant.
 * Appelé à l'ouverture de la page Publier pour rattacher courtier/entreprise (owner_id, email, ou nom).
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

  // Cas 1: Pas de ligne users -> créer ou mettre à jour le profil
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

  // Cas 2: Rattacher broker/company si manquant (owner_id, puis email, puis préfixe email dans nom)
  if ((!companyId || !brokerId) && (role === 'broker' || role === 'company')) {
    const table = role === 'broker' ? 'brokers' : 'companies';
    const col = role === 'broker' ? 'broker_id' : 'company_id';
    let entityId: string | null = null;

    const byOwner = await supabase.from(table).select('id').eq('owner_id', user.id).maybeSingle();
    entityId = byOwner.data?.id ?? null;

    if (!entityId && user.email) {
      const byEmail = await supabase.from(table).select('id').eq('email', user.email).limit(1);
      const row = Array.isArray(byEmail.data) ? byEmail.data[0] : byEmail.data;
      if (row?.id) entityId = row.id;
    }

    if (!entityId && user.email) {
      const prefix = user.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
      if (prefix.length >= 2) {
        const byName = await supabase.from(table).select('id').ilike('name', `%${prefix}%`).limit(1);
        const row = Array.isArray(byName.data) ? byName.data[0] : byName.data;
        if (row?.id) entityId = row.id;
        if (!entityId) {
          const byEmailPrefix = await supabase.from(table).select('id').ilike('email', `%${prefix}%`).limit(1);
          const row2 = Array.isArray(byEmailPrefix.data) ? byEmailPrefix.data[0] : byEmailPrefix.data;
          if (row2?.id) entityId = row2.id;
        }
      }
    }

    if (!entityId && user.email) {
      try {
        const db = createServiceRoleClient();
        const prefix = user.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
        if (prefix.length >= 2) {
          const { data: unlinked } = await db.from(table).select('id').is('owner_id', null).or(`name.ilike.%${prefix}%,email.ilike.%${prefix}%`).limit(1);
          const row = Array.isArray(unlinked) ? unlinked[0] : unlinked;
          if (row?.id) {
            entityId = row.id;
            await db.from(table).update({ owner_id: user.id }).eq('id', entityId);
          }
        }
      } catch {
        // SERVICE_ROLE_KEY absente : on garde les résultats déjà trouvés
      }
    }

    if (entityId) {
      brokerId = role === 'broker' ? entityId : brokerId;
      companyId = role === 'company' ? entityId : companyId;
      await supabase.from('users').update({ [col]: entityId }).eq('id', user.id);
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
