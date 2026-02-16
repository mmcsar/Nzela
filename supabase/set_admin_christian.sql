-- ═══════════════════════════════════════════════════════════════
-- DÉFINIR christian@maintenancemc.com COMME ADMIN
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'christian@maintenancemc.com' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Compte christian@maintenancemc.com non trouvé. Inscrivez-vous d''abord via l''app.';
  END IF;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (admin_id, 'christian@maintenancemc.com', 'Christian Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = COALESCE(public.users.full_name, 'Christian Admin'),
    updated_at = NOW();

  RAISE NOTICE '✅ christian@maintenancemc.com est maintenant admin.';
END $$;
