-- =====================================================
-- NZELA V2 - Migration : Alertes, Scores, Offres, Credit Check
-- Executer dans Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. LOAD ALERTS (Alertes personnalisees)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.load_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'instant' CHECK (frequency IN ('instant', 'hourly', 'daily')),
  channels TEXT[] DEFAULT '{push}',
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. RELIABILITY SCORES (Score de fiabilite)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('broker', 'company')),
  target_id UUID NOT NULL,
  load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Score aggrege
CREATE TABLE IF NOT EXISTS public.reliability_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('broker', 'company')),
  entity_id UUID NOT NULL UNIQUE,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  on_time_rate DECIMAL(5, 2) DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  response_time_avg INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PRICE NEGOTIATIONS (Offres / Contre-offres)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled')),
  parent_offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREDIT CHECKS (Verification solvabilite)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.credit_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('broker', 'company')),
  entity_id UUID NOT NULL,
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  payment_history JSONB DEFAULT '{}',
  outstanding_balance DECIMAL(12, 2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  avg_payment_days INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  report JSONB DEFAULT '{}',
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. RATE HISTORY (Historique des tarifs par route)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_city TEXT NOT NULL,
  origin_province TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_province TEXT NOT NULL,
  trailer_type TEXT,
  avg_price DECIMAL(12, 2) NOT NULL,
  avg_price_per_km DECIMAL(10, 2) NOT NULL,
  min_price DECIMAL(12, 2),
  max_price DECIMAL(12, 2),
  load_count INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_load_alerts_user ON public.load_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_load_alerts_active ON public.load_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reviews_target ON public.reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reliability_entity ON public.reliability_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_offers_load ON public.offers(load_id);
CREATE INDEX IF NOT EXISTS idx_offers_from ON public.offers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_offers_to ON public.offers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_credit_checks_entity ON public.credit_checks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rate_history_route ON public.rate_history(origin_city, destination_city, period_start);

-- Indexes composites recommandes pour la scalabilite
CREATE INDEX IF NOT EXISTS idx_loads_status_created ON public.loads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trucks_status_available ON public.trucks(status, available_date);

-- =====================================================
-- 7. RLS
-- =====================================================
ALTER TABLE public.load_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reliability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_history ENABLE ROW LEVEL SECURITY;

-- Load alerts: CRUD propre
CREATE POLICY "Users manage own alerts" ON public.load_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Reviews: tous peuvent lire, seuls les auteurs peuvent creer
CREATE POLICY "Reviews readable by all auth" ON public.reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Reviews insert own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Reliability: visible par tous
CREATE POLICY "Reliability scores readable by all auth" ON public.reliability_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Offers: visible par les deux parties
CREATE POLICY "Offers visible to parties" ON public.offers
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Offers insert by auth" ON public.offers
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Offers update by parties" ON public.offers
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Credit checks: visible par le demandeur et l'admin
CREATE POLICY "Credit checks own or admin" ON public.credit_checks
  FOR SELECT USING (
    auth.uid() = requested_by OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Credit checks insert auth" ON public.credit_checks
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Rate history: visible par tous les utilisateurs auth
CREATE POLICY "Rate history readable by all auth" ON public.rate_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin full access sur toutes les nouvelles tables
CREATE POLICY "Admin full load_alerts" ON public.load_alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full reviews" ON public.reviews
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full reliability" ON public.reliability_scores
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full offers" ON public.offers
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full credit" ON public.credit_checks
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full rate_history" ON public.rate_history
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- 8. TRIGGERS updated_at
-- =====================================================
DO $$ BEGIN
  CREATE TRIGGER update_load_alerts_updated_at BEFORE UPDATE ON public.load_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_reliability_scores_updated_at BEFORE UPDATE ON public.reliability_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_credit_checks_updated_at BEFORE UPDATE ON public.credit_checks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- FIN V2
-- =====================================================
