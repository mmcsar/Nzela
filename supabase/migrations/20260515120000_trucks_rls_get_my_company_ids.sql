-- RLS trucks : autoriser INSERT si company_id = owner OU users.company_id
-- Corrige : "new row violates row-level security policy for table trucks"

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

GRANT EXECUTE ON FUNCTION public.get_my_company_ids() TO authenticated;

DROP POLICY IF EXISTS "trucks_insert_company_strict" ON public.trucks;
DROP POLICY IF EXISTS "trucks_insert_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_insert_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_company_strict" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_company_strict" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_own" ON public.trucks;

CREATE POLICY "trucks_insert_own" ON public.trucks
  FOR INSERT
  WITH CHECK (company_id IN (SELECT public.get_my_company_ids()));

CREATE POLICY "trucks_update_own" ON public.trucks
  FOR UPDATE
  USING (company_id IN (SELECT public.get_my_company_ids()));

CREATE POLICY "trucks_delete_own" ON public.trucks
  FOR DELETE
  USING (company_id IN (SELECT public.get_my_company_ids()));
