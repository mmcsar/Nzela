-- ============================================================
-- NZELA - Correctif sécurité Supabase (vulnérabilités RLS)
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
-- Problèmes corrigés :
-- 1. Notifications : n'importe quel utilisateur pouvait insérer des
--    notifications pour n'importe quel user_id (spam, phishing).
-- 2. BOLs : n'importe quel utilisateur authentifié pouvait insérer/modifier
--    n'importe quel BOL (données sensibles).
-- ============================================================

-- ─── 1. NOTIFICATIONS : supprimer l'INSERT pour les utilisateurs normaux ───
-- Seul le backend (service_role) doit pouvoir insérer des notifications.
-- Les utilisateurs ne peuvent que SELECT/UPDATE/DELETE leurs propres lignes.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifs_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifs_select" ON public.notifications;

-- Une seule policy SELECT : l'utilisateur ne voit que ses notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Ne pas créer de policy INSERT : seuls service_role (backend) pourront insérer.


-- ─── 2. BOLS : politiques strictes (broker du load / company du truck / admin) ───
DROP POLICY IF EXISTS "bols_select_authenticated" ON public.bols;
DROP POLICY IF EXISTS "bols_insert_authenticated" ON public.bols;
DROP POLICY IF EXISTS "bols_update_authenticated" ON public.bols;

-- SELECT : broker du chargement, ou company du camion, ou admin
CREATE POLICY "bols_select_own_or_admin" ON public.bols
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.brokers b ON b.id = l.broker_id
      WHERE l.id = bols.load_id AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.trucks t
      INNER JOIN public.companies c ON c.id = t.company_id
      WHERE t.id = bols.truck_id AND c.owner_id = auth.uid()
    )
  );

-- INSERT : seul le broker propriétaire du load peut créer un BOL
CREATE POLICY "bols_insert_broker_own_load" ON public.bols
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.brokers b ON b.id = l.broker_id
      WHERE l.id = bols.load_id AND b.owner_id = auth.uid()
    )
  );

-- UPDATE : broker du load ou company du truck (ex: signature, statut)
CREATE POLICY "bols_update_own_or_admin" ON public.bols
  FOR UPDATE USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.brokers b ON b.id = l.broker_id
      WHERE l.id = bols.load_id AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.trucks t
      INNER JOIN public.companies c ON c.id = t.company_id
      WHERE t.id = bols.truck_id AND c.owner_id = auth.uid()
    )
  );

-- DELETE : broker du load ou admin (optionnel, selon métier)
CREATE POLICY "bols_delete_broker_or_admin" ON public.bols
  FOR DELETE USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.brokers b ON b.id = l.broker_id
      WHERE l.id = bols.load_id AND b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- FIN. Vérifier dans Table Editor que RLS est activé sur
-- public.notifications et public.bols.
-- ============================================================
