import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

/** Client avec service role - bypass RLS. À utiliser uniquement côté serveur, jamais exposé au client. */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'your_service_role_key_here') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY requis pour les opérations admin (notifications, etc.)');
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

/** Service role si configurée, sinon null (pas d’exception). */
export function tryCreateServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'your_service_role_key_here') return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

/** Client avec JWT explicite (pour RPC en Route Handler où les cookies peuvent ne pas être transmis). */
export function createClientWithAccessToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase: NEXT_PUBLIC_SUPABASE_URL et ANON_KEY requis');
  }
  return createSupabaseClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase: NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent etre definis dans .env.local');
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Client Supabase pour Route Handlers (POST/GET API) : écriture cookies sans try/catch silencieux,
 * nécessaire pour que `signOut()` efface bien la session (sinon l'utilisateur reste connecté).
 */
export async function createClientForRouteHandler() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase: NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent etre definis dans .env.local');
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}

// Cached per-request: avoids duplicate Supabase calls in layout + page
export const getAuthUser = cache(async () => {
  const fallback = { user: null, role: 'company' as string, suspended: false, accountStatus: 'active' as const, companyId: null, brokerId: null };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fallback;

    const { data: userData } = await supabase
      .from('users')
      .select('role, company_id, broker_id')
      .eq('id', user.id)
      .maybeSingle();

    // Fallback role to avoid hard crashes when profile row is missing
    const role =
      userData?.role ||
      ((user.app_metadata as { role?: string } | undefined)?.role ?? 'company');

    let companyId = userData?.company_id ?? null;
    let brokerId = userData?.broker_id ?? null;

    // Rattacher broker/company si manquant : owner_id, puis email, puis préfixe nom/email, puis (service role) non liés
    if ((role === 'broker' || role === 'company') && (!companyId || !brokerId)) {
      const table = role === 'broker' ? 'brokers' : 'companies';
      const col = role === 'broker' ? 'broker_id' : 'company_id';
      let entityId: string | null = null;

      if (role === 'broker' && !brokerId) {
        const { data: broker } = await supabase.from('brokers').select('id').eq('owner_id', user.id).maybeSingle();
        entityId = broker?.id ?? null;
      } else if (role === 'company' && !companyId) {
        const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
        entityId = company?.id ?? null;
      }

      if (!entityId && user.email) {
        const { data: byEmailData } = await supabase.from(table).select('id').eq('email', user.email).limit(1);
        const byEmailRow = Array.isArray(byEmailData) ? byEmailData[0] : byEmailData;
        if (byEmailRow?.id) entityId = byEmailRow.id;
      }
      if (!entityId && user.email) {
        const prefix = user.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
        if (prefix.length >= 2) {
          const { data: byNameData } = await supabase.from(table).select('id').ilike('name', `%${prefix}%`).limit(1);
          const byNameRow = Array.isArray(byNameData) ? byNameData[0] : byNameData;
          if (byNameRow?.id) entityId = byNameRow.id;
          if (!entityId) {
            const { data: byEmailPrefixData } = await supabase.from(table).select('id').ilike('email', `%${prefix}%`).limit(1);
            const byEmailPrefixRow = Array.isArray(byEmailPrefixData) ? byEmailPrefixData[0] : byEmailPrefixData;
            if (byEmailPrefixRow?.id) entityId = byEmailPrefixRow.id;
          }
        }
      }
      if (!entityId && user.email) {
        try {
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (key && key !== 'your_service_role_key_here') {
            const db = createServiceRoleClient();
            const prefix = user.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
            if (prefix.length >= 2) {
              const { data: unlinked } = await db.from(table).select('id, name, email').is('owner_id', null).limit(50);
              const list = Array.isArray(unlinked) ? unlinked : unlinked ? [unlinked] : [];
              const match = list.find(
                (r: { id: string; name?: string | null; email?: string | null }) =>
                  (r.name && r.name.toLowerCase().includes(prefix.toLowerCase())) ||
                  (r.email && r.email.toLowerCase().includes(prefix.toLowerCase()))
              );
              if (match?.id) {
                entityId = match.id;
                await db.from(table).update({ owner_id: user.id }).eq('id', entityId);
              }
            }
          }
        } catch {
          // SERVICE_ROLE_KEY absente ou erreur : on garde entityId tel quel
        }
      }

      if (entityId) {
        if (role === 'broker') brokerId = entityId;
        else companyId = entityId;
        await supabase.from('users').update({ [col]: entityId }).eq('id', user.id);
      }
    }

    // Verifier si le compte (company ou broker) est suspendu
    // Les entreprises peuvent publier sans validation admin ; seul "suspendu" bloque l'acces
    let suspended = false;
    let accountStatus: 'active' | 'pending' | 'suspended' = 'active';
    if (role !== 'admin') {
      if (role === 'company' && companyId) {
        const { data: company } = await supabase.from('companies').select('status').eq('id', companyId).maybeSingle();
        accountStatus = (company?.status as 'active' | 'pending' | 'suspended') || 'active';
        suspended = accountStatus === 'suspended'; // pending n'est plus bloquant pour les entreprises
      } else if (role === 'broker' && brokerId) {
        const { data: broker } = await supabase.from('brokers').select('status').eq('id', brokerId).maybeSingle();
        accountStatus = (broker?.status as 'active' | 'pending' | 'suspended') || 'active';
        suspended = accountStatus === 'suspended'; // pending n'est plus bloquant pour les courtiers
      }
    }

    return { user, role, suspended, accountStatus, companyId, brokerId };
  } catch (err) {
    console.error('[getAuthUser] Erreur:', err);
    return fallback;
  }
});




