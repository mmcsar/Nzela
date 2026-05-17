import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Vérifie que l'utilisateur peut publier pour cette entreprise
 * (propriétaire owner_id OU company_id sur users).
 * Contourne les limites RLS trucks_insert_company_strict (owner_id seul).
 */
export async function userMayManageCompany(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.company_id === companyId) return true;

  const { data: owned } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (owned?.id) return true;

  try {
    const db = createServiceRoleClient();
    const { data: company } = await db
      .from('companies')
      .select('id, owner_id')
      .eq('id', companyId)
      .maybeSingle();

    if (!company) return false;
    if (company.owner_id === userId) return true;

    const { data: userRow } = await db
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    return userRow?.company_id === companyId;
  } catch {
    return false;
  }
}

/** Rattache company_id / owner_id comme sync-profile (côté API). */
export async function resolveCompanyIdForUser(
  supabase: SupabaseClient,
  userId: string,
  email: string | undefined,
  existingCompanyId: string | null,
): Promise<string | null> {
  if (existingCompanyId) return existingCompanyId;

  const { data: byOwner } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (byOwner?.id) return byOwner.id;

  if (email) {
    const { data: byEmailData } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email)
      .limit(1);
    const row = Array.isArray(byEmailData) ? byEmailData[0] : byEmailData;
    if (row?.id) return row.id;
  }

  try {
    const db = createServiceRoleClient();
    if (email) {
      const prefix = email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
      if (prefix.length >= 2) {
        const { data: unlinked } = await db
          .from('companies')
          .select('id, name, email')
          .is('owner_id', null)
          .limit(50);
        const list = Array.isArray(unlinked) ? unlinked : unlinked ? [unlinked] : [];
        const match = list.find(
          (r: { id: string; name?: string | null; email?: string | null }) =>
            (r.name && r.name.toLowerCase().includes(prefix.toLowerCase())) ||
            (r.email && r.email.toLowerCase().includes(prefix.toLowerCase())),
        );
        if (match?.id) {
          await db.from('companies').update({ owner_id: userId }).eq('id', match.id);
          await db.from('users').update({ company_id: match.id }).eq('id', userId);
          return match.id;
        }
      }
    }
  } catch {
    // SERVICE_ROLE_KEY absente
  }

  return null;
}
