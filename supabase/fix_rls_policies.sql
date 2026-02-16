-- =====================================================
-- NZELA - Correction des politiques RLS
-- Problème: recursion infinie dans les policies "Admin"
-- Solution: utiliser auth.jwt() au lieu d'un SELECT sur users
-- =====================================================

-- ─── 1. SUPPRIMER LES ANCIENNES POLICIES ───

-- Users
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
DROP POLICY IF EXISTS "Admin can read all" ON public.users;

-- Companies
DROP POLICY IF EXISTS "Companies read own" ON public.companies;
DROP POLICY IF EXISTS "Companies insert own" ON public.companies;
DROP POLICY IF EXISTS "Companies update own" ON public.companies;
DROP POLICY IF EXISTS "Companies can read own data" ON public.companies;
DROP POLICY IF EXISTS "Admin can read all companies" ON public.companies;

-- Brokers
DROP POLICY IF EXISTS "Brokers read own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers insert own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers update own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers can read own data" ON public.brokers;
DROP POLICY IF EXISTS "Admin can read all brokers" ON public.brokers;

-- Trucks
DROP POLICY IF EXISTS "Trucks are viewable by authenticated users" ON public.trucks;
DROP POLICY IF EXISTS "Companies can insert own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Companies can update own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Companies can delete own trucks" ON public.trucks;

-- Loads
DROP POLICY IF EXISTS "Loads are viewable by authenticated users" ON public.loads;
DROP POLICY IF EXISTS "Brokers can insert own loads" ON public.loads;
DROP POLICY IF EXISTS "Brokers can update own loads" ON public.loads;
DROP POLICY IF EXISTS "Brokers can delete own loads" ON public.loads;

-- BOLs
DROP POLICY IF EXISTS "BOLs viewable by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "BOLs insert by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "BOLs update by authenticated users" ON public.bols;

-- Subscriptions
DROP POLICY IF EXISTS "Subscriptions read own" ON public.subscriptions;
DROP POLICY IF EXISTS "Subscriptions insert own" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin can read all subscriptions" ON public.subscriptions;

-- Payments
DROP POLICY IF EXISTS "Payments read own" ON public.payments;
DROP POLICY IF EXISTS "Payments insert own" ON public.payments;
DROP POLICY IF EXISTS "Admin can read all payments" ON public.payments;


-- ─── 2. FONCTION HELPER pour vérifier le rôle admin SANS recursion ───
-- Utilise auth.jwt() qui lit le JWT token directement, pas la table users

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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 3. NOUVELLES POLICIES ───

-- ═══ USERS ═══
-- Tous les utilisateurs authentifiés peuvent lire leur propre ligne
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admin peut lire tous les users (via SECURITY DEFINER function = pas de recursion)
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (public.is_admin());

-- Chaque utilisateur peut modifier ses propres données
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Insertion pour l'inscription
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin peut modifier tous les users (ex: changement de rôle)
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


-- ═══ BROKERS ═══
CREATE POLICY "brokers_select_own" ON public.brokers
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "brokers_select_admin" ON public.brokers
  FOR SELECT USING (public.is_admin());

CREATE POLICY "brokers_insert_own" ON public.brokers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "brokers_update_own" ON public.brokers
  FOR UPDATE USING (auth.uid() = owner_id);


-- ═══ TRUCKS ═══
-- Tous les utilisateurs authentifiés peuvent voir les camions (pour la recherche)
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
-- Tous les utilisateurs authentifiés peuvent voir les chargements
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


-- =====================================================
-- FIN - Policies RLS corrigées sans recursion
-- =====================================================
