-- =====================================================
-- NZELA - SCRIPT SQL COMPLET POUR SUPABASE
-- A coller dans le SQL Editor de Supabase
-- Admin: christian@maintenancemc.com
-- =====================================================
--
-- ⚠️  ATTENTION : CE SCRIPT SUPPRIME TOUTES LES DONNÉES  ⚠️
--     (DROP TABLE sur users, companies, brokers, loads, trucks, etc.)
--     À utiliser UNIQUEMENT pour une NOUVELLE installation (base vide).
--     Ne PAS exécuter sur une base qui contient déjà des données.
--
--     Pour une base existante, utiliser à la place :
--     - supabase/a_coller_sur_supabase.sql (RLS, corrections)
--     - supabase/migrations/20260224100000_provinces_toute_rdc.sql (provinces)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. NETTOYAGE (si re-exécution) → EFFACE TOUTES LES DONNÉES
-- ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_bols_updated_at ON bols;
DROP TRIGGER IF EXISTS update_loads_updated_at ON loads;
DROP TRIGGER IF EXISTS update_trucks_updated_at ON trucks;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_brokers_updated_at ON brokers;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bols CASCADE;
DROP TABLE IF EXISTS loads CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;


-- ─────────────────────────────────────────────────────
-- 2. FONCTIONS UTILITAIRES
-- ─────────────────────────────────────────────────────

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction is_admin() pour éviter la récursion RLS
-- SECURITY DEFINER = s'exécute avec les droits du créateur, pas de l'utilisateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ─────────────────────────────────────────────────────
-- 3. TABLES (dans l'ordre des dépendances)
-- ─────────────────────────────────────────────────────

-- 3a. USERS (sans les FK circulaires pour l'instant)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'company', 'broker')),
  company_id UUID,         -- FK ajoutée après création de companies
  broker_id UUID,          -- FK ajoutée après création de brokers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT CHECK (province IN ('haut-katanga', 'lualaba')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID,    -- FK ajoutée après création de subscriptions
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3c. BROKERS
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT CHECK (province IN ('haut-katanga', 'lualaba')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID,    -- FK ajoutée après création de subscriptions
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3d. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'enhanced', 'pro', 'select', 'office')),
  price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3e. TRUCKS
CREATE TABLE public.trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  capacity DECIMAL(10, 2) NOT NULL,
  current_location JSONB NOT NULL DEFAULT '{"city":"Lubumbashi","address":"","province":"haut-katanga"}',
  available_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  destination JSONB,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_per_km DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'in-transit', 'maintenance')),
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3f. LOADS
CREATE TABLE public.loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  origin JSONB NOT NULL DEFAULT '{"city":"Lubumbashi","address":"","province":"haut-katanga"}',
  destination JSONB NOT NULL DEFAULT '{"city":"Kolwezi","address":"","province":"lualaba"}',
  distance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration TEXT NOT NULL DEFAULT '',
  trailer_type TEXT NOT NULL DEFAULT 'flatbed',
  weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_per_km DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pickup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
  cargo_type TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'in-transit', 'delivered', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3g. BOLS (Bill of Lading)
CREATE TABLE public.bols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bol_number TEXT UNIQUE,
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  shipper JSONB NOT NULL DEFAULT '{}',
  carrier JSONB NOT NULL DEFAULT '{}',
  consignee JSONB DEFAULT '{}',
  origin JSONB NOT NULL DEFAULT '{}',
  destination JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '[]',
  total_weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pickup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
  special_instructions TEXT,
  signature TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'in-transit', 'delivered', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3h. PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
  method TEXT CHECK (method IN ('mobile-money', 'bank-transfer', 'card')),
  provider TEXT,           -- 'mpesa', 'airtel-money', etc.
  phone_number TEXT,       -- numéro pour mobile money
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────
-- 4. FOREIGN KEYS CIRCULAIRES (ajoutées après création)
-- ─────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD CONSTRAINT fk_users_company
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.users
  ADD CONSTRAINT fk_users_broker
  FOREIGN KEY (broker_id) REFERENCES public.brokers(id) ON DELETE SET NULL;

ALTER TABLE public.companies
  ADD CONSTRAINT fk_companies_subscription
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.brokers
  ADD CONSTRAINT fk_brokers_subscription
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


-- ─────────────────────────────────────────────────────
-- 5. INDEX POUR LA PERFORMANCE
-- ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_broker_id ON public.users(broker_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_brokers_owner_id ON public.brokers(owner_id);
CREATE INDEX IF NOT EXISTS idx_brokers_status ON public.brokers(status);
CREATE INDEX IF NOT EXISTS idx_trucks_company_id ON public.trucks(company_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON public.trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_type ON public.trucks(type);
CREATE INDEX IF NOT EXISTS idx_loads_broker_id ON public.loads(broker_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON public.loads(pickup_date);
CREATE INDEX IF NOT EXISTS idx_loads_cargo_type ON public.loads(cargo_type);
CREATE INDEX IF NOT EXISTS idx_bols_load_id ON public.bols(load_id);
CREATE INDEX IF NOT EXISTS idx_bols_truck_id ON public.bols(truck_id);
CREATE INDEX IF NOT EXISTS idx_bols_status ON public.bols(status);
CREATE INDEX IF NOT EXISTS idx_bols_bol_number ON public.bols(bol_number);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);


-- ─────────────────────────────────────────────────────
-- 6. TRIGGERS (updated_at automatique)
-- ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brokers_updated_at ON public.brokers;
CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trucks_updated_at ON public.trucks;
CREATE TRIGGER update_trucks_updated_at
  BEFORE UPDATE ON public.trucks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loads_updated_at ON public.loads;
CREATE TRIGGER update_loads_updated_at
  BEFORE UPDATE ON public.loads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bols_updated_at ON public.bols;
CREATE TRIGGER update_bols_updated_at
  BEFORE UPDATE ON public.bols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ── USERS ──
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_admin_select_all" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "users_admin_update_all" ON public.users
  FOR UPDATE USING (public.is_admin());

-- ── COMPANIES ──
CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "companies_admin_all" ON public.companies
  FOR ALL USING (public.is_admin());

-- Tout le monde authentifié peut voir les noms des companies (pour le search)
CREATE POLICY "companies_select_auth" ON public.companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── BROKERS ──
CREATE POLICY "brokers_select_own" ON public.brokers
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "brokers_update_own" ON public.brokers
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "brokers_insert_own" ON public.brokers
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brokers_admin_all" ON public.brokers
  FOR ALL USING (public.is_admin());

CREATE POLICY "brokers_select_auth" ON public.brokers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── SUBSCRIPTIONS ──
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (public.is_admin());

-- ── TRUCKS (visibles par tous les authentifiés pour le search/load board) ──
CREATE POLICY "trucks_select_auth" ON public.trucks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "trucks_insert_company" ON public.trucks
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "trucks_update_company" ON public.trucks
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "trucks_delete_company" ON public.trucks
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "trucks_admin_all" ON public.trucks
  FOR ALL USING (public.is_admin());

-- ── LOADS (visibles par tous les authentifiés pour le load board) ──
CREATE POLICY "loads_select_auth" ON public.loads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "loads_insert_broker" ON public.loads
  FOR INSERT WITH CHECK (
    broker_id IN (
      SELECT id FROM public.brokers WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "loads_update_broker" ON public.loads
  FOR UPDATE USING (
    broker_id IN (
      SELECT id FROM public.brokers WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "loads_delete_broker" ON public.loads
  FOR DELETE USING (
    broker_id IN (
      SELECT id FROM public.brokers WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "loads_admin_all" ON public.loads
  FOR ALL USING (public.is_admin());

-- ── BOLS ──
CREATE POLICY "bols_select_auth" ON public.bols
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "bols_insert_auth" ON public.bols
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "bols_update_auth" ON public.bols
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "bols_admin_all" ON public.bols
  FOR ALL USING (public.is_admin());

-- ── PAYMENTS ──
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (public.is_admin());


-- ─────────────────────────────────────────────────────
-- 8. CONFIGURER L'ADMIN christian@maintenancemc.com
-- ─────────────────────────────────────────────────────
-- IMPORTANT: Ceci s'exécute APRÈS que christian se soit inscrit via l'app.
-- Si le compte existe déjà dans auth.users, cette commande l'ajoute à la table users.
-- Si le compte n'existe pas encore, inscrivez-vous d'abord puis exécutez ceci.

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Chercher l'utilisateur dans auth.users
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'christian@maintenancemc.com'
  LIMIT 1;

  -- Si trouvé, insérer ou mettre à jour dans public.users
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (admin_id, 'christian@maintenancemc.com', 'Christian Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      full_name = COALESCE(public.users.full_name, 'Christian Admin'),
      updated_at = NOW();

    RAISE NOTICE '✅ Admin configuré: christian@maintenancemc.com (ID: %)', admin_id;
  ELSE
    RAISE NOTICE '⚠️ Le compte christian@maintenancemc.com n''existe pas encore dans auth.users.';
    RAISE NOTICE '   → Inscrivez-vous d''abord via l''app, puis ré-exécutez cette section.';
  END IF;
END $$;


-- ─────────────────────────────────────────────────────
-- 9. DONNÉES DE DÉMONSTRATION (optionnel)
-- ─────────────────────────────────────────────────────
-- Décommentez les lignes ci-dessous si vous voulez des données de test.
-- Vous devez d'abord avoir des companies et brokers créés via l'app.

/*
-- Exemple: créer une company de test (après avoir un user company)
-- INSERT INTO public.companies (name, registration_number, address, city, province, phone, email, owner_id, status)
-- VALUES ('Transport Katanga Express', 'RCCM-LUB-001', '123 Avenue Lumumba', 'Lubumbashi', 'haut-katanga', '+243999000001', 'transport@katanga.cd', '<USER_ID_ICI>', 'active');

-- Exemple: créer un broker de test
-- INSERT INTO public.brokers (name, registration_number, address, city, province, phone, email, owner_id, status)
-- VALUES ('Courtage Lubumbashi', 'RCCM-LUB-002', '456 Avenue Kasai', 'Lubumbashi', 'haut-katanga', '+243999000002', 'courtage@lshi.cd', '<USER_ID_ICI>', 'active');
*/


-- ─────────────────────────────────────────────────────
-- 10. VÉRIFICATION FINALE
-- ─────────────────────────────────────────────────────

DO $$
DECLARE
  table_count INT;
  admin_count INT;
BEGIN
  -- Compter les tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('users', 'companies', 'brokers', 'subscriptions', 'trucks', 'loads', 'bols', 'payments');

  -- Compter les admins
  SELECT COUNT(*) INTO admin_count
  FROM public.users
  WHERE role = 'admin';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '  NZELA - Installation terminée !';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '  Tables créées  : % / 8', table_count;
  RAISE NOTICE '  Admins         : %', admin_count;
  RAISE NOTICE '  RLS            : Activé sur toutes les tables';
  RAISE NOTICE '  Index          : 23 index créés';
  RAISE NOTICE '  Triggers       : 8 triggers updated_at';
  RAISE NOTICE '════════════════════════════════════════';

  IF table_count < 8 THEN
    RAISE WARNING '⚠️ Certaines tables n''ont pas été créées !';
  END IF;

  IF admin_count = 0 THEN
    RAISE NOTICE '⚠️ Aucun admin trouvé. Inscrivez christian@maintenancemc.com puis ré-exécutez la section 8.';
  END IF;
END $$;
