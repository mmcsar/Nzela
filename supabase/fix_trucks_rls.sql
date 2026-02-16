-- Correction RLS trucks : insertion viole la politique
-- À exécuter dans Supabase SQL Editor
-- Utilise une fonction SECURITY DEFINER pour éviter les problèmes de sous-requêtes RLS
-- Aucun service role nécessaire côté app.

-- 1. Fonction pour obtenir les company_id que l'utilisateur peut utiliser
CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.companies WHERE owner_id = auth.uid()
  UNION
  SELECT company_id FROM public.users WHERE id = auth.uid() AND company_id IS NOT NULL;
$$;

-- 2. Recréer les politiques trucks
DROP POLICY IF EXISTS "trucks_insert_company_strict" ON public.trucks;
DROP POLICY IF EXISTS "trucks_insert_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_insert_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_company_strict" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_company_strict" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_select_authenticated" ON public.trucks;
DROP POLICY IF EXISTS "trucks_select_auth" ON public.trucks;

-- SELECT : tous les authentifiés peuvent voir (pour search/board)
CREATE POLICY "trucks_select_authenticated" ON public.trucks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT : company peut insérer si company_id appartient à ses entreprises
CREATE POLICY "trucks_insert_own" ON public.trucks
  FOR INSERT
  WITH CHECK (company_id IN (SELECT public.get_my_company_ids()));

-- UPDATE
CREATE POLICY "trucks_update_own" ON public.trucks
  FOR UPDATE
  USING (company_id IN (SELECT public.get_my_company_ids()));

-- DELETE
CREATE POLICY "trucks_delete_own" ON public.trucks
  FOR DELETE
  USING (company_id IN (SELECT public.get_my_company_ids()));

-- 4. Politique admin : décommentez si vous avez la fonction is_admin()
-- DROP POLICY IF EXISTS "trucks_admin_all" ON public.trucks;
-- CREATE POLICY "trucks_admin_all" ON public.trucks FOR ALL USING (public.is_admin());
