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

    // Si company_id/broker_id manquant, recuperer depuis companies/brokers (owner_id = user) et persister
    if ((role === 'broker' || role === 'company') && (!companyId || !brokerId)) {
      if (role === 'broker' && !brokerId) {
        const { data: broker } = await supabase.from('brokers').select('id').eq('owner_id', user.id).maybeSingle();
        if (broker) {
          brokerId = broker.id;
          await supabase.from('users').update({ broker_id: broker.id }).eq('id', user.id);
        }
      } else if (role === 'company' && !companyId) {
        const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
        if (company) {
          companyId = company.id;
          await supabase.from('users').update({ company_id: company.id }).eq('id', user.id);
        }
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




