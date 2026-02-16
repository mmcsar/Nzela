-- ═══════════════════════════════════════════════════════════════
-- NZELA: GPS TRACKING + MOBILE MONEY PAYMENTS
-- Tables, indexes, RLS, triggers
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────
-- 1. AJOUTER truck_id SUR LOADS (si manquant)
-- ────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loads' AND column_name = 'truck_id'
  ) THEN
    ALTER TABLE loads ADD COLUMN truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL;
    CREATE INDEX idx_loads_truck_id ON loads(truck_id);
  END IF;
END $$;

-- ────────────────────────────────────
-- 2. TABLE tracking_sessions
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  driver_user_id UUID REFERENCES auth.users(id),
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  
  total_distance_km DOUBLE PRECISION DEFAULT 0,
  elapsed_time_minutes INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_load ON tracking_sessions(load_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_truck ON tracking_sessions(truck_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_status ON tracking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_driver ON tracking_sessions(driver_user_id);

-- ────────────────────────────────────
-- 3. TABLE tracking_updates (positions GPS)
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracking_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES tracking_sessions(id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id),

  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  
  speed DOUBLE PRECISION DEFAULT 0,         -- km/h
  heading DOUBLE PRECISION DEFAULT 0,       -- degrees 0-360
  
  status VARCHAR(20) DEFAULT 'moving' CHECK (status IN ('moving', 'stopped', 'idle', 'loading', 'unloading', 'checkpoint')),
  
  battery_level INTEGER,                    -- % batterie du device
  network_type VARCHAR(10),                 -- 2g, 3g, 4g, wifi
  
  metadata JSONB DEFAULT '{}',              -- donnees supplementaires
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),    -- heure de l'enregistrement GPS
  created_at TIMESTAMPTZ DEFAULT NOW()      -- heure d'insertion en base
);

CREATE INDEX IF NOT EXISTS idx_tracking_updates_session ON tracking_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_load ON tracking_updates(load_id);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_recorded ON tracking_updates(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_coords ON tracking_updates(lat, lng);

-- ────────────────────────────────────
-- 4. TABLE geofences (zones de notification)
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS geofences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'circle' CHECK (type IN ('circle', 'polygon')),
  
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION DEFAULT 5,
  
  trigger_on VARCHAR(10) DEFAULT 'enter' CHECK (trigger_on IN ('enter', 'exit', 'both')),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────
-- 5. AMELIORER TABLE payments POUR MOBILE MONEY
-- ────────────────────────────────────
DO $$ BEGIN
  -- Provider (flutterwave, maxicash, rawbank, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider') THEN
    ALTER TABLE payments ADD COLUMN provider VARCHAR(50);
  END IF;
  
  -- Numero de telephone pour Mobile Money
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'phone_number') THEN
    ALTER TABLE payments ADD COLUMN phone_number VARCHAR(20);
  END IF;
  
  -- Provider externe reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_reference') THEN
    ALTER TABLE payments ADD COLUMN provider_reference VARCHAR(100);
  END IF;
  
  -- URL de callback/redirect
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'redirect_url') THEN
    ALTER TABLE payments ADD COLUMN redirect_url TEXT;
  END IF;
  
  -- Metadata JSONB pour donnees supplementaires du provider
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'metadata') THEN
    ALTER TABLE payments ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  
  -- Date de paiement effectif
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'paid_at') THEN
    ALTER TABLE payments ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
  
  -- Raison d'echec
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'failure_reason') THEN
    ALTER TABLE payments ADD COLUMN failure_reason TEXT;
  END IF;
  
  -- Type de paiement: subscription, load_payment, pod_fee
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_type') THEN
    ALTER TABLE payments ADD COLUMN payment_type VARCHAR(30) DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'load_payment', 'freight_charge', 'pod_fee', 'other'));
  END IF;
  
  -- Load ID associe (pour paiement de fret)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'load_id') THEN
    ALTER TABLE payments ADD COLUMN load_id UUID REFERENCES loads(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_phone ON payments(phone_number);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_load ON payments(load_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_reference);

-- ────────────────────────────────────
-- 6. TABLE payment_webhooks (log des callbacks)
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(50),
  payload JSONB NOT NULL,
  payment_id UUID REFERENCES payments(id),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_webhooks_payment ON payment_webhooks(payment_id);

-- ────────────────────────────────────
-- 7. RLS POLICIES
-- ────────────────────────────────────
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Tracking sessions: owner, assignee, et admins peuvent voir
CREATE POLICY "tracking_sessions_select" ON tracking_sessions FOR SELECT
  USING (
    auth.uid() = driver_user_id
    OR EXISTS (SELECT 1 FROM loads WHERE loads.id = load_id AND loads.broker_id IN (SELECT broker_id FROM users WHERE id = auth.uid()))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tracking_sessions_insert" ON tracking_sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tracking_sessions_update" ON tracking_sessions FOR UPDATE
  USING (auth.uid() = driver_user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Tracking updates: memes regles
CREATE POLICY "tracking_updates_select" ON tracking_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracking_sessions ts 
      WHERE ts.id = session_id 
      AND (
        ts.driver_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR EXISTS (SELECT 1 FROM loads WHERE loads.id = ts.load_id AND loads.broker_id IN (SELECT broker_id FROM users WHERE id = auth.uid()))
      )
    )
  );

CREATE POLICY "tracking_updates_insert" ON tracking_updates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Geofences: authenticated users
CREATE POLICY "geofences_select" ON geofences FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "geofences_insert" ON geofences FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Payment webhooks: admin only
CREATE POLICY "webhooks_admin" ON payment_webhooks FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ────────────────────────────────────
-- 8. TRIGGERS
-- ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracking_sessions_updated ON tracking_sessions;
CREATE TRIGGER tracking_sessions_updated
  BEFORE UPDATE ON tracking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: quand un tracking_update arrive, mettre a jour la position du truck
CREATE OR REPLACE FUNCTION update_truck_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.truck_id IS NOT NULL THEN
    UPDATE trucks SET current_location = jsonb_build_object(
      'coordinates', jsonb_build_object('lat', NEW.lat, 'lng', NEW.lng),
      'city', '',
      'province', '',
      'address', '',
      'updatedAt', NOW()
    ) WHERE id = NEW.truck_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracking_update_truck_position ON tracking_updates;
CREATE TRIGGER tracking_update_truck_position
  AFTER INSERT ON tracking_updates
  FOR EACH ROW EXECUTE FUNCTION update_truck_position();

-- ═══════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ═══════════════════════════════════════════════════════════════
