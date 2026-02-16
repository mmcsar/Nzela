-- ═══════════════════════════════════════════════════════════════════════════
-- FIX RLS: Admin peut voir et valider les comptes broker/company en attente
-- Exécuter dans Supabase SQL Editor
-- Admin: christian@maintenancemc.com
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. S'assurer que christian@maintenancemc.com est admin dans public.users
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

  RAISE NOTICE '✅ christian@maintenancemc.com configuré comme admin.';
END $$;


-- 2. Fonction is_admin() (SECURITY DEFINER = évite la récursion RLS)
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


-- 3. BROKERS: supprimer anciennes policies admin puis créer les bonnes
DROP POLICY IF EXISTS "brokers_select_admin" ON public.brokers;
DROP POLICY IF EXISTS "brokers_admin_all" ON public.brokers;
DROP POLICY IF EXISTS "Admin can read all brokers" ON public.brokers;

-- Admin peut TOUT faire sur les brokers (SELECT + UPDATE pour valider les comptes)
CREATE POLICY "brokers_admin_all" ON public.brokers
  FOR ALL USING (public.is_admin());


-- 4. COMPANIES: idem pour cohérence
DROP POLICY IF EXISTS "companies_select_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_all" ON public.companies;
DROP POLICY IF EXISTS "Admin can read all companies" ON public.companies;

CREATE POLICY "companies_admin_all" ON public.companies
  FOR ALL USING (public.is_admin());


-- 5. Vérification rapide
DO $$
BEGIN
  RAISE NOTICE '✅ RLS mis à jour. L''admin christian@maintenancemc.com peut maintenant voir et valider les courtiers/entreprises en attente.';
END $$;
