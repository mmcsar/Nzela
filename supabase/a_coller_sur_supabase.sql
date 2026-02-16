-- ============================================================
-- NZELA - Script à coller dans Supabase > SQL Editor > Run
-- À exécuter sur un projet qui a déjà les tables créées.
-- 1) Corrige payments.subscription_id (nullable)
-- 2) Crée la fonction is_admin() pour les policies
-- 3) Applique les politiques RLS (sans récursion)
-- ============================================================

-- ─── Extension (si pas déjà activée) ───
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. FIX PAYMENTS : paiements sans abonnement autorisés ───
ALTER TABLE public.payments
  ALTER COLUMN subscription_id DROP NOT NULL;

-- ─── 2. FONCTION is_admin() (évite récursion dans les policies) ───
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

-- ─── 3. SUPPRIMER LES ANCIENNES POLICIES (éviter conflits) ───

-- Users
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
DROP POLICY IF EXISTS "Admin can read all" ON public.users;
DROP POLICY IF EXISTS "users_admin_select_all" ON public.users;
DROP POLICY IF EXISTS "users_admin_update_all" ON public.users;

-- Companies
DROP POLICY IF EXISTS "Companies read own" ON public.companies;
DROP POLICY IF EXISTS "Companies insert own" ON public.companies;
DROP POLICY IF EXISTS "Companies update own" ON public.companies;
DROP POLICY IF EXISTS "Companies can read own data" ON public.companies;
DROP POLICY IF EXISTS "Admin can read all companies" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_all" ON public.companies;
DROP POLICY IF EXISTS "companies_select_auth" ON public.companies;

-- Brokers
DROP POLICY IF EXISTS "Brokers read own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers insert own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers update own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers can read own data" ON public.brokers;
DROP POLICY IF EXISTS "Admin can read all brokers" ON public.brokers;
DROP POLICY IF EXISTS "brokers_admin_all" ON public.brokers;

-- Trucks
DROP POLICY IF EXISTS "Trucks are viewable by authenticated users" ON public.trucks;
DROP POLICY IF EXISTS "Companies can insert own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Companies can update own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Companies can delete own trucks" ON public.trucks;
DROP POLICY IF EXISTS "trucks_select_auth" ON public.trucks;
DROP POLICY IF EXISTS "trucks_insert_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_admin_all" ON public.trucks;

-- Loads
DROP POLICY IF EXISTS "Loads are viewable by authenticated users" ON public.loads;
DROP POLICY IF EXISTS "Brokers can insert own loads" ON public.loads;
DROP POLICY IF EXISTS "Brokers can update own loads" ON public.loads;
DROP POLICY IF EXISTS "Brokers can delete own loads" ON public.loads;
DROP POLICY IF EXISTS "loads_select_auth" ON public.loads;
DROP POLICY IF EXISTS "loads_insert_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_update_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_delete_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_admin_all" ON public.loads;

-- BOLs
DROP POLICY IF EXISTS "BOLs viewable by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "BOLs insert by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "BOLs update by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "bols_admin_all" ON public.bols;

-- Subscriptions
DROP POLICY IF EXISTS "Subscriptions read own" ON public.subscriptions;
DROP POLICY IF EXISTS "Subscriptions insert own" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin can read all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;

-- Payments
DROP POLICY IF EXISTS "Payments read own" ON public.payments;
DROP POLICY IF EXISTS "Payments insert own" ON public.payments;
DROP POLICY IF EXISTS "Admin can read all payments" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;

-- Policies que l'on va recréer (éviter "already exists" si script relancé)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
DROP POLICY IF EXISTS "companies_select_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_own" ON public.companies;
DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
DROP POLICY IF EXISTS "companies_select_auth" ON public.companies;
DROP POLICY IF EXISTS "brokers_select_own" ON public.brokers;
DROP POLICY IF EXISTS "brokers_select_admin" ON public.brokers;
DROP POLICY IF EXISTS "brokers_insert_own" ON public.brokers;
DROP POLICY IF EXISTS "brokers_update_own" ON public.brokers;
DROP POLICY IF EXISTS "brokers_select_auth" ON public.brokers;
DROP POLICY IF EXISTS "trucks_select_authenticated" ON public.trucks;
DROP POLICY IF EXISTS "trucks_insert_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_own" ON public.trucks;
DROP POLICY IF EXISTS "loads_select_authenticated" ON public.loads;
DROP POLICY IF EXISTS "loads_insert_own" ON public.loads;
DROP POLICY IF EXISTS "loads_update_own" ON public.loads;
DROP POLICY IF EXISTS "loads_delete_own" ON public.loads;
DROP POLICY IF EXISTS "bols_select_authenticated" ON public.bols;
DROP POLICY IF EXISTS "bols_insert_authenticated" ON public.bols;
DROP POLICY IF EXISTS "bols_update_authenticated" ON public.bols;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_admin" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;

-- ─── 4. ACTIVER RLS SUR LES TABLES (si pas déjà) ───
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ─── 5. CRÉER LES POLICIES RLS ───

-- ═══ USERS ═══
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (public.is_admin());
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (public.is_admin());

-- ═══ COMPANIES ═══
CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "companies_select_admin" ON public.companies
  FOR SELECT USING (public.is_admin());
CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE USING (auth.uid() = owner_id);
-- Tous les authentifiés peuvent voir les companies (liste pour associer / recherche)
CREATE POLICY "companies_select_auth" ON public.companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ═══ BROKERS ═══
CREATE POLICY "brokers_select_own" ON public.brokers
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "brokers_select_admin" ON public.brokers
  FOR SELECT USING (public.is_admin());
CREATE POLICY "brokers_insert_own" ON public.brokers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "brokers_update_own" ON public.brokers
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "brokers_select_auth" ON public.brokers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ═══ TRUCKS ═══
CREATE POLICY "trucks_select_authenticated" ON public.trucks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "trucks_insert_own" ON public.trucks
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );
CREATE POLICY "trucks_update_own" ON public.trucks
  FOR UPDATE USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );
CREATE POLICY "trucks_delete_own" ON public.trucks
  FOR DELETE USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

-- ═══ LOADS ═══
CREATE POLICY "loads_select_authenticated" ON public.loads
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "loads_insert_own" ON public.loads
  FOR INSERT WITH CHECK (
    broker_id IN (SELECT id FROM public.brokers WHERE owner_id = auth.uid())
  );
CREATE POLICY "loads_update_own" ON public.loads
  FOR UPDATE USING (
    broker_id IN (SELECT id FROM public.brokers WHERE owner_id = auth.uid())
  );
CREATE POLICY "loads_delete_own" ON public.loads
  FOR DELETE USING (
    broker_id IN (SELECT id FROM public.brokers WHERE owner_id = auth.uid())
  );

-- ═══ BOLS ═══
CREATE POLICY "bols_select_authenticated" ON public.bols
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "bols_insert_authenticated" ON public.bols
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "bols_update_authenticated" ON public.bols
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ═══ SUBSCRIPTIONS ═══
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_select_admin" ON public.subscriptions
  FOR SELECT USING (public.is_admin());
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══ PAYMENTS ═══
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (public.is_admin());
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admin peut mettre à jour (ex: webhook peut utiliser service_role, mais si besoin via app)
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (public.is_admin());

-- ─── 6. NOTIFICATIONS (si la table existe) ───
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
    CREATE POLICY "notifications_select_own" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── 7. APP_SETTINGS (paramètres plateforme, ex. monétisation) ───
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select_authenticated" ON public.app_settings;
CREATE POLICY "app_settings_select_authenticated" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "app_settings_admin_all" ON public.app_settings;
CREATE POLICY "app_settings_admin_all" ON public.app_settings
  FOR ALL USING (public.is_admin());

INSERT INTO public.app_settings (key, value) VALUES ('subscription_gate_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- FIN. Tu peux vérifier : Table Editor > une table > RLS activé.
-- ============================================================
