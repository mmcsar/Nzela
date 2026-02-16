-- ═══════════════════════════════════════════════════════════════
-- NZELA: KYC VERIFICATION + NOTIFICATIONS PUSH
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────
-- 1. CHAMPS VERIFICATION SUR COMPANIES / BROKERS / USERS
-- ────────────────────────────────────
DO $$ BEGIN
  -- Companies
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'verification_status') THEN
    ALTER TABLE companies ADD COLUMN verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'verified_at') THEN
    ALTER TABLE companies ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'verified_by') THEN
    ALTER TABLE companies ADD COLUMN verified_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'rejection_reason') THEN
    ALTER TABLE companies ADD COLUMN rejection_reason TEXT;
  END IF;

  -- Brokers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'verification_status') THEN
    ALTER TABLE brokers ADD COLUMN verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'verified_at') THEN
    ALTER TABLE brokers ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'verified_by') THEN
    ALTER TABLE brokers ADD COLUMN verified_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'rejection_reason') THEN
    ALTER TABLE brokers ADD COLUMN rejection_reason TEXT;
  END IF;

  -- Users: identity verification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
    ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_verified') THEN
    ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_verification ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_brokers_verification ON brokers(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_kyc ON users(kyc_status);

-- ────────────────────────────────────
-- 2. TABLE verification_documents
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'company', 'broker')),
  entity_id UUID NOT NULL,                 -- ID de la company, broker, ou user
  
  document_type TEXT NOT NULL CHECK (document_type IN (
    'national_id',           -- Carte d'identite nationale
    'passport',              -- Passeport
    'drivers_license',       -- Permis de conduire
    'business_registration', -- RCCM (Registre de commerce)
    'tax_certificate',       -- NIF / Patente
    'transport_license',     -- Licence de transport
    'insurance_certificate', -- Attestation d'assurance
    'vehicle_registration',  -- Carte grise
    'proof_of_address',      -- Preuve de domicile
    'bank_statement',        -- Releve bancaire
    'other'
  )),
  
  document_number VARCHAR(100),           -- Numero du document
  file_url TEXT,                          -- URL Supabase Storage
  file_name VARCHAR(255),
  file_size INTEGER,                      -- bytes
  mime_type VARCHAR(50),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  
  expiry_date DATE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vdocs_user ON verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_vdocs_entity ON verification_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_vdocs_status ON verification_documents(status);
CREATE INDEX IF NOT EXISTS idx_vdocs_type ON verification_documents(document_type);

-- ────────────────────────────────────
-- 3. TABLE verification_requests (workflow)
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'company', 'broker')),
  entity_id UUID NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'more_info_needed')),
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  documents UUID[] DEFAULT '{}',          -- Array de verification_documents IDs
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vreqs_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vreqs_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_vreqs_entity ON verification_requests(entity_type, entity_id);

-- ────────────────────────────────────
-- 4. TABLE notifications (persistent)
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'load_new',          -- Nouveau chargement disponible
    'load_assigned',     -- Chargement assigne
    'load_status',       -- Changement de statut
    'message_new',       -- Nouveau message
    'payment_received',  -- Paiement recu
    'payment_failed',    -- Paiement echoue
    'kyc_approved',      -- Verification approuvee
    'kyc_rejected',      -- Verification rejetee
    'kyc_submitted',     -- Nouvelle soumission KYC (admin)
    'tracking_alert',    -- Alerte GPS (geofence)
    'subscription_expiry', -- Abonnement expire bientot
    'system'             -- Notification systeme
  )),
  
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  link TEXT,                              -- URL vers la page concernee
  icon TEXT,                              -- Nom icone lucide-react
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifs_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifs_created ON notifications(created_at DESC);

-- ────────────────────────────────────
-- 5. TABLE push_subscriptions (web push)
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,                   -- Public key
  auth TEXT NOT NULL,                     -- Auth secret
  
  user_agent TEXT,
  device_name TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_active ON push_subscriptions(is_active);

-- ────────────────────────────────────
-- 6. RLS POLICIES
-- ────────────────────────────────────
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Verification documents: owner + admin
CREATE POLICY "vdocs_select" ON verification_documents FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "vdocs_insert" ON verification_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "vdocs_update" ON verification_documents FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Verification requests: owner + admin
CREATE POLICY "vreqs_select" ON verification_requests FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "vreqs_insert" ON verification_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "vreqs_update" ON verification_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Notifications: own only
CREATE POLICY "notifs_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifs_insert" ON notifications FOR INSERT WITH CHECK (TRUE); -- server-side inserts
CREATE POLICY "notifs_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifs_delete" ON notifications FOR DELETE USING (user_id = auth.uid());

-- Push subscriptions: own only
CREATE POLICY "push_select" ON push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────
-- 7. TRIGGERS
-- ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vdocs_updated ON verification_documents;
CREATE TRIGGER vdocs_updated BEFORE UPDATE ON verification_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS vreqs_updated ON verification_requests;
CREATE TRIGGER vreqs_updated BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- FIN
-- ═══════════════════════════════════════════════════════════════
