import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export type UserRole = 'admin' | 'company' | 'broker';

export interface AuthResult {
  allowed: boolean;
  userId: string;
  role: UserRole | null;
  companyId: string | null;
  brokerId: string | null;
}

/**
 * Vérifie l'authentification et le rôle de l'utilisateur.
 * Utilisation dans les API routes :
 *
 * const auth = await requireAuth(supabase, ['admin', 'broker']);
 * if (!auth.allowed) return auth.response;
 */
export async function requireAuth(
  supabase: SupabaseClient,
  allowedRoles?: UserRole[]
): Promise<AuthResult & { response?: NextResponse }> {
  // 1. Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      userId: '',
      role: null,
      companyId: null,
      brokerId: null,
      response: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }),
    };
  }

  // 2. Récupérer le profil utilisateur avec le rôle
  const { data: userData, error } = await supabase
    .from('users')
    .select('role, company_id, broker_id')
    .eq('id', user.id)
    .maybeSingle();

  // Fallback: utiliser app_metadata si profil users manquant (ex: inscription incomplète)
  const metadataRole = (user.app_metadata as { role?: string } | undefined)?.role as UserRole | undefined;
  let role: UserRole = (userData?.role as UserRole) ?? metadataRole ?? 'company';
  let companyId = userData?.company_id ?? null;
  let brokerId = userData?.broker_id ?? null;

  if (!userData && (role === 'broker' || role === 'company')) {
    if (role === 'broker') {
      const { data: broker } = await supabase.from('brokers').select('id').eq('owner_id', user.id).maybeSingle();
      if (broker) brokerId = broker.id;
    } else {
      const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
      if (company) companyId = company.id;
    }
  }

  if (!role) {
    return {
      allowed: false,
      userId: user.id,
      role: null,
      companyId: null,
      brokerId: null,
      response: NextResponse.json({ error: 'Profil utilisateur non trouvé' }, { status: 403 }),
    };
  }

  // 3. Vérifier le rôle si des rôles autorisés sont spécifiés
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return {
      allowed: false,
      userId: user.id,
      role,
      companyId,
      brokerId,
      response: NextResponse.json(
        { error: `Accès refusé. Rôle requis : ${allowedRoles.join(' ou ')}` },
        { status: 403 }
      ),
    };
  }

  return {
    allowed: true,
    userId: user.id,
    role,
    companyId,
    brokerId,
  };
}

/**
 * Vérifie si l'utilisateur est admin.
 */
export async function requireAdmin(supabase: SupabaseClient) {
  return requireAuth(supabase, ['admin']);
}

/**
 * Vérifie si l'utilisateur est un broker (ou admin).
 */
export async function requireBroker(supabase: SupabaseClient) {
  return requireAuth(supabase, ['broker', 'admin']);
}

/**
 * Vérifie si l'utilisateur est une entreprise (ou admin).
 */
export async function requireCompany(supabase: SupabaseClient) {
  return requireAuth(supabase, ['company', 'admin']);
}

/**
 * Vérifie si l'utilisateur est strictement broker (sans bypass admin).
 */
export async function requireBrokerOnly(supabase: SupabaseClient) {
  return requireAuth(supabase, ['broker']);
}

/**
 * Vérifie si l'utilisateur est strictement entreprise (sans bypass admin).
 */
export async function requireCompanyOnly(supabase: SupabaseClient) {
  return requireAuth(supabase, ['company']);
}
