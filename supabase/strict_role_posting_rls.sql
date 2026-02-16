-- Strict role-based posting rules:
-- - Only BROKER can insert/update/delete LOADS
-- - Only COMPANY can insert/update/delete TRUCKS
-- - Admin has no publish bypass at RLS level

ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;

-- =========================
-- LOADS write policies
-- =========================
DROP POLICY IF EXISTS "loads_insert_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_insert_own" ON public.loads;
DROP POLICY IF EXISTS "loads_update_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_update_own" ON public.loads;
DROP POLICY IF EXISTS "loads_delete_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_delete_own" ON public.loads;
DROP POLICY IF EXISTS "loads_admin_all" ON public.loads;

CREATE POLICY "loads_insert_broker_strict" ON public.loads
  FOR INSERT
  WITH CHECK (
    broker_id IN (
      SELECT b.id
      FROM public.brokers b
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "loads_update_broker_strict" ON public.loads
  FOR UPDATE
  USING (
    broker_id IN (
      SELECT b.id
      FROM public.brokers b
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "loads_delete_broker_strict" ON public.loads
  FOR DELETE
  USING (
    broker_id IN (
      SELECT b.id
      FROM public.brokers b
      WHERE b.owner_id = auth.uid()
    )
  );

-- =========================
-- TRUCKS write policies
-- =========================
DROP POLICY IF EXISTS "trucks_insert_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_insert_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_update_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_company" ON public.trucks;
DROP POLICY IF EXISTS "trucks_delete_own" ON public.trucks;
DROP POLICY IF EXISTS "trucks_admin_all" ON public.trucks;

CREATE POLICY "trucks_insert_company_strict" ON public.trucks
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "trucks_update_company_strict" ON public.trucks
  FOR UPDATE
  USING (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "trucks_delete_company_strict" ON public.trucks
  FOR DELETE
  USING (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.owner_id = auth.uid()
    )
  );
