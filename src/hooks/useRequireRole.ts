'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';

type UserRole = 'admin' | 'company' | 'broker';

interface UseRequireRoleResult {
  isLoading: boolean;
  isAuthorized: boolean;
  authError: string | null;
  role: UserRole | null;
  userId: string | null;
  companyId: string | null;
  brokerId: string | null;
}

/**
 * Hook client-side pour verifier le role de l'utilisateur.
 * Utilise le contexte Dashboard (donnees serveur) en priorite - evite les erreurs client Supabase.
 */
export function useRequireRole(allowedRoles?: UserRole[]): UseRequireRoleResult {
  const router = useRouter();
  const dashboardAuth = useDashboardAuth();
  const supabase = useMemo(() => createClient(), []);
  const allowedRolesKey = (allowedRoles || []).join('|');
  const [state, setState] = useState<UseRequireRoleResult>({
    isLoading: true,
    isAuthorized: false,
    authError: null,
    role: null,
    userId: null,
    companyId: null,
    brokerId: null,
  });

  useEffect(() => {
    // Priorite 1: Donnees du layout serveur - pas de requete Supabase
    if (dashboardAuth) {
      const { user, role, companyId, brokerId } = dashboardAuth;
      const isAuthorized = !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(role);

      if (!isAuthorized) {
        switch (role) {
          case 'admin': router.replace('/dashboard/admin'); break;
          case 'company': router.replace('/dashboard/company'); break;
          case 'broker': router.replace('/dashboard/broker'); break;
          default: router.replace('/dashboard');
        }
      }

      queueMicrotask(() => setState({
        isLoading: false,
        isAuthorized,
        authError: null,
        role,
        userId: user.id,
        companyId,
        brokerId,
      }));
      return;
    }

    // Priorite 2: Fallback - requete Supabase client
    let isMounted = true;
    const checkRole = async () => {
      try {
        // 1. Verifier l'auth
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          setState({
            isLoading: false,
            isAuthorized: false,
            authError: null,
            role: null,
            userId: null,
            companyId: null,
            brokerId: null,
          });
          router.replace('/login');
          return;
        }

        // 2. Recuperer le profil (table users)
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, company_id, broker_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        // Fallback: si pas de ligne users (inscription incomplete, sync en retard), utiliser app_metadata
        const metadataRole = (user.app_metadata as { role?: string } | undefined)?.role as UserRole | undefined;
        let role: UserRole | null = (userData?.role as UserRole) ?? metadataRole ?? null;
        let companyId = userData?.company_id ?? null;
        let brokerId = userData?.broker_id ?? null;

        // Si profil manquant mais role dans metadata: tenter de synchroniser via API
        if (!userData && metadataRole) {
          try {
            const res = await fetch('/api/auth/sync-profile', { method: 'POST', credentials: 'include' });
            if (res.ok) {
              const sync = await res.json();
              if (sync.role) role = sync.role as UserRole;
              if (sync.brokerId) brokerId = sync.brokerId;
              if (sync.companyId) companyId = sync.companyId;
            }
          } catch {
            // Ignorer les erreurs de sync, on utilise le fallback
          }
          if (!isMounted) return;
        }

        if (!role) {
          setState({
            isLoading: false,
            isAuthorized: false,
            authError: error?.message || 'Profil utilisateur incomplet. Reconnectez-vous ou contactez le support.',
            role: null,
            userId: user.id,
            companyId: null,
            brokerId: null,
          });
          return;
        }

        // Si toujours pas de companyId/brokerId, recuperer depuis les tables
        if (!companyId && !brokerId && (role === 'broker' || role === 'company')) {
          if (role === 'broker') {
            const { data: broker } = await supabase
              .from('brokers')
              .select('id')
              .eq('owner_id', user.id)
              .maybeSingle();
            if (broker) brokerId = broker.id;
          } else if (role === 'company') {
            const { data: company } = await supabase
              .from('companies')
              .select('id')
              .eq('owner_id', user.id)
              .maybeSingle();
            if (company) companyId = company.id;
          }
          if (!isMounted) return;
        }

        // 3. Verifier le role
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
          setState({
            isLoading: false,
            isAuthorized: false,
            authError: null,
            role,
            userId: user.id,
            companyId,
            brokerId,
          });
          // Rediriger vers la page appropriee selon le role
          switch (role) {
            case 'admin':
              router.replace('/dashboard/admin');
              break;
            case 'company':
              router.replace('/dashboard/company');
              break;
            case 'broker':
              router.replace('/dashboard/broker');
              break;
            default:
              router.replace('/dashboard');
          }
          return;
        }

        setState({
          isLoading: false,
          isAuthorized: true,
          authError: null,
          role,
          userId: user.id,
          companyId,
          brokerId,
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('Auth check error:', error);
        const message = error instanceof Error ? error.message : 'Erreur inconnue de verification auth.';
        setState({
          isLoading: false,
          isAuthorized: false,
          authError: message,
          role: null,
          userId: null,
          companyId: null,
          brokerId: null,
        });
      }
    };

    checkRole();
    return () => {
      isMounted = false;
    };
  // allowedRolesKey derive de allowedRoles - deps semantiquement correctes
  // eslint-disable-next-line react-hooks/exhaustive-deps -- allowedRolesKey equivalent
  }, [dashboardAuth, allowedRolesKey, router, supabase]);

  // Retour immediat si donnees du layout serveur (evite flash loading)
  if (dashboardAuth) {
    const { user, role, companyId, brokerId } = dashboardAuth;
    const isAuthorized = !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(role);
    return {
      isLoading: false,
      isAuthorized,
      authError: null,
      role,
      userId: user.id,
      companyId,
      brokerId,
    };
  }

  return state;
}
