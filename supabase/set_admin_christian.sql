-- ═══════════════════════════════════════════════════════════════
-- DÉFINIR christian@maintenancemc.com COMME ADMIN
-- À exécuter dans Supabase SQL Editor
-- Crée public.users si elle n'existe pas encore.
-- ═══════════════════════════════════════════════════════════════

-- 1. Créer la table public.users si elle n'existe pas (sans FK companies/brokers)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- 2. Définir christian@maintenancemc.com comme admin
DO $$
DECLARE
  admin_id UUID;
  has_full_name BOOLEAN;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'christian@maintenancemc.com' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Compte christian@maintenancemc.com non trouvé. Inscrivez-vous d''abord via l''app (inscription puis confirmation email).';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
  ) INTO has_full_name;

  IF has_full_name THEN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (admin_id, 'christian@maintenancemc.com', 'Christian Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      full_name = COALESCE(public.users.full_name, 'Christian Admin'),
      updated_at = NOW();
  ELSE
    INSERT INTO public.users (id, email, role)
    VALUES (admin_id, 'christian@maintenancemc.com', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      updated_at = NOW();
  END IF;

  RAISE NOTICE '✅ christian@maintenancemc.com est maintenant admin.';
END $$;
