-- Correction RLS loads : nouvelle insertion viole la politique
-- Executer dans Supabase SQL Editor
-- Utilise une fonction SECURITY DEFINER pour eviter les problemes de sous-requetes RLS

-- 1. Fonction pour obtenir les broker_id que l'utilisateur peut utiliser (bypass RLS pour la verification)
CREATE OR REPLACE FUNCTION public.get_my_broker_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.brokers WHERE owner_id = auth.uid()
  UNION
  SELECT broker_id FROM public.users WHERE id = auth.uid() AND broker_id IS NOT NULL;
$$;

-- 2. Recree les politiques loads
DROP POLICY IF EXISTS "loads_insert_broker_strict" ON public.loads;
DROP POLICY IF EXISTS "loads_insert_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_insert_own" ON public.loads;
DROP POLICY IF EXISTS "loads_select_authenticated" ON public.loads;
DROP POLICY IF EXISTS "loads_select_auth" ON public.loads;

-- SELECT : tous les authentifies peuvent voir
CREATE POLICY "loads_select_authenticated" ON public.loads
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT : broker peut inserer si broker_id appartient a ses brokers
CREATE POLICY "loads_insert_own" ON public.loads
  FOR INSERT
  WITH CHECK (broker_id IN (SELECT public.get_my_broker_ids()));

-- 3. S'assurer que UPDATE et DELETE existent
DROP POLICY IF EXISTS "loads_update_broker_strict" ON public.loads;
DROP POLICY IF EXISTS "loads_update_own" ON public.loads;
CREATE POLICY "loads_update_own" ON public.loads
  FOR UPDATE
  USING (broker_id IN (SELECT public.get_my_broker_ids()));

DROP POLICY IF EXISTS "loads_delete_broker_strict" ON public.loads;
DROP POLICY IF EXISTS "loads_delete_own" ON public.loads;
CREATE POLICY "loads_delete_own" ON public.loads
  FOR DELETE
  USING (broker_id IN (SELECT public.get_my_broker_ids()));

-- 4. Politique admin : decommentez si vous avez la fonction is_admin()
-- DROP POLICY IF EXISTS "loads_admin_all" ON public.loads;
-- CREATE POLICY "loads_admin_all" ON public.loads FOR ALL USING (public.is_admin());
