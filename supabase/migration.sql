-- =====================================================
-- NZELA - Migration SQL corrigée
-- Exécuter dans Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLES SANS REFERENCES CIRCULAIRES
-- =====================================================

-- Users table (extends Supabase auth.users)
-- On crée d'abord sans les FK vers companies/brokers
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'company' CHECK (role IN ('admin', 'company', 'broker')),
  company_id UUID,
  broker_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'enhanced', 'pro', 'select', 'office')),
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL CHECK (province IN ('haut-katanga', 'lualaba')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brokers table
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL CHECK (province IN ('haut-katanga', 'lualaba')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les FK circulaires sur users
ALTER TABLE public.users 
  ADD CONSTRAINT fk_users_company 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.users 
  ADD CONSTRAINT fk_users_broker 
  FOREIGN KEY (broker_id) REFERENCES public.brokers(id) ON DELETE SET NULL;

-- Trucks table
CREATE TABLE IF NOT EXISTS public.trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  capacity DECIMAL(10, 2) NOT NULL,
  current_location JSONB NOT NULL DEFAULT '{"address":"","city":"","province":"haut-katanga"}',
  available_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  destination JSONB,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_per_km DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'in-transit', 'maintenance')),
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loads table
CREATE TABLE IF NOT EXISTS public.loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  origin JSONB NOT NULL,
  destination JSONB NOT NULL,
  distance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration TEXT NOT NULL DEFAULT '',
  trailer_type TEXT NOT NULL DEFAULT '',
  weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_per_km DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pickup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'in-transit', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BOLs (Bill of Lading) table
CREATE TABLE IF NOT EXISTS public.bols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  shipper JSONB NOT NULL,
  carrier JSONB NOT NULL,
  origin JSONB NOT NULL,
  destination JSONB NOT NULL,
  items JSONB NOT NULL,
  total_weight DECIMAL(10, 2) NOT NULL,
  total_value DECIMAL(10, 2) NOT NULL,
  pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CDF', 'USD')),
  method TEXT NOT NULL CHECK (method IN ('mobile-money', 'bank-transfer', 'card')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_brokers_owner_id ON public.brokers(owner_id);
CREATE INDEX IF NOT EXISTS idx_trucks_company_id ON public.trucks(company_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON public.trucks(status);
CREATE INDEX IF NOT EXISTS idx_loads_broker_id ON public.loads(broker_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);
CREATE INDEX IF NOT EXISTS idx_bols_load_id ON public.bols(load_id);
CREATE INDEX IF NOT EXISTS idx_bols_truck_id ON public.bols(truck_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. POLICIES RLS (DROP IF EXISTS pour ré-exécution)
-- =====================================================
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
DROP POLICY IF EXISTS "Companies read own" ON public.companies;
DROP POLICY IF EXISTS "Companies insert own" ON public.companies;
DROP POLICY IF EXISTS "Companies update own" ON public.companies;
DROP POLICY IF EXISTS "Admin can read all companies" ON public.companies;
DROP POLICY IF EXISTS "Brokers read own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers insert own" ON public.brokers;
DROP POLICY IF EXISTS "Brokers update own" ON public.brokers;
DROP POLICY IF EXISTS "Admin can read all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Trucks are viewable by authenticated users" ON public.trucks;
DROP POLICY IF EXISTS "Companies can insert own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Companies can update own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Companies can delete own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Loads are viewable by authenticated users" ON public.loads;
DROP POLICY IF EXISTS "Brokers can insert own loads" ON public.loads;
DROP POLICY IF EXISTS "Brokers can update own loads" ON public.loads;
DROP POLICY IF EXISTS "Brokers can delete own loads" ON public.loads;
DROP POLICY IF EXISTS "BOLs viewable by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "BOLs insert by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "BOLs update by authenticated users" ON public.bols;
DROP POLICY IF EXISTS "Subscriptions read own" ON public.subscriptions;
DROP POLICY IF EXISTS "Subscriptions insert own" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin can read all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Payments read own" ON public.payments;
DROP POLICY IF EXISTS "Payments insert own" ON public.payments;
DROP POLICY IF EXISTS "Admin can read all payments" ON public.payments;

-- Users: lire ses propres données
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users: mettre à jour ses propres données
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users: insert (pour l'inscription)
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin: lire toutes les données users
CREATE POLICY "Admin can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Companies: lire ses propres entreprises
CREATE POLICY "Companies read own" ON public.companies
  FOR SELECT USING (auth.uid() = owner_id);

-- Companies: créer
CREATE POLICY "Companies insert own" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Companies: modifier
CREATE POLICY "Companies update own" ON public.companies
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admin: lire toutes les entreprises
CREATE POLICY "Admin can read all companies" ON public.companies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Brokers: lire ses propres courtiers
CREATE POLICY "Brokers read own" ON public.brokers
  FOR SELECT USING (auth.uid() = owner_id);

-- Brokers: créer
CREATE POLICY "Brokers insert own" ON public.brokers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Brokers: modifier
CREATE POLICY "Brokers update own" ON public.brokers
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admin: lire tous les courtiers
CREATE POLICY "Admin can read all brokers" ON public.brokers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════
-- TRUCKS: Politiques READ pour tous les utilisateurs authentifiés
-- (les camions sont visibles par tous pour la recherche)
-- ═══════════════════════════════════════════════════
CREATE POLICY "Trucks are viewable by authenticated users" ON public.trucks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Trucks: les entreprises peuvent créer/modifier/supprimer leurs propres camions
CREATE POLICY "Companies can insert own trucks" ON public.trucks
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Companies can update own trucks" ON public.trucks
  FOR UPDATE USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Companies can delete own trucks" ON public.trucks
  FOR DELETE USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════
-- LOADS: Politiques READ pour tous les utilisateurs authentifiés
-- (les chargements sont visibles par tous pour la recherche)
-- ═══════════════════════════════════════════════════
CREATE POLICY "Loads are viewable by authenticated users" ON public.loads
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Loads: les courtiers peuvent créer/modifier/supprimer leurs propres chargements
CREATE POLICY "Brokers can insert own loads" ON public.loads
  FOR INSERT WITH CHECK (
    broker_id IN (SELECT id FROM public.brokers WHERE owner_id = auth.uid())
  );

CREATE POLICY "Brokers can update own loads" ON public.loads
  FOR UPDATE USING (
    broker_id IN (SELECT id FROM public.brokers WHERE owner_id = auth.uid())
  );

CREATE POLICY "Brokers can delete own loads" ON public.loads
  FOR DELETE USING (
    broker_id IN (SELECT id FROM public.brokers WHERE owner_id = auth.uid())
  );

-- BOLs: visibles par les parties concernées
CREATE POLICY "BOLs viewable by authenticated users" ON public.bols
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "BOLs insert by authenticated users" ON public.bols
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "BOLs update by authenticated users" ON public.bols
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Subscriptions: lire ses propres abonnements
CREATE POLICY "Subscriptions read own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions insert own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin: lire tous les abonnements
CREATE POLICY "Admin can read all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Payments: lire ses propres paiements
CREATE POLICY "Payments read own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Payments insert own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin: lire tous les paiements
CREATE POLICY "Admin can read all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 5. TRIGGERS updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON public.trucks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_loads_updated_at BEFORE UPDATE ON public.loads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_bols_updated_at BEFORE UPDATE ON public.bols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- FIN - Toutes les tables et policies sont créées
-- =====================================================
