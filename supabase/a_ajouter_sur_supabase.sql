-- ============================================================
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query
-- Collez ce script puis Run.
-- ============================================================
-- 1) Fonction is_admin() (évite récursion RLS sur users)
-- 2) Correction policies users (Admin can read all)
-- 3) Table association_requests + RLS (demandes "Notifier l'admin")
-- 4) Admin peut mettre à jour le statut companies/brokers (Valider / Suspendre sans SERVICE_ROLE_KEY)
-- ============================================================

-- ─── 1. FONCTION is_admin() ───
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── 2. USERS : policies admin sans récursion ───
DROP POLICY IF EXISTS "Admin can read all" ON public.users;
CREATE POLICY "Admin can read all" ON public.users
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
CREATE POLICY "Admin can read all users" ON public.users
  FOR SELECT USING (public.is_admin());

-- ─── 3. TABLE association_requests (demandes "Notifier l'administrateur") ───
CREATE TABLE IF NOT EXISTS public.association_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'broker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_association_requests_user_id ON public.association_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_association_requests_created_at ON public.association_requests(created_at DESC);
ALTER TABLE public.association_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "association_requests_insert_own" ON public.association_requests;
CREATE POLICY "association_requests_insert_own" ON public.association_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "association_requests_select_admin" ON public.association_requests;
CREATE POLICY "association_requests_select_admin" ON public.association_requests
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "association_requests_delete_admin" ON public.association_requests;
CREATE POLICY "association_requests_delete_admin" ON public.association_requests
  FOR DELETE USING (public.is_admin());

-- ─── 4. ADMIN : droit de mettre à jour le statut companies et brokers (Valider / Suspendre) ───
DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
CREATE POLICY "companies_update_admin" ON public.companies
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "brokers_update_admin" ON public.brokers;
CREATE POLICY "brokers_update_admin" ON public.brokers
  FOR UPDATE USING (public.is_admin());

-- Vérifier que l'admin peut aussi lire toutes les companies/brokers (au cas où)
DROP POLICY IF EXISTS "companies_select_admin" ON public.companies;
CREATE POLICY "companies_select_admin" ON public.companies
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "brokers_select_admin" ON public.brokers;
CREATE POLICY "brokers_select_admin" ON public.brokers
  FOR SELECT USING (public.is_admin());
