-- Module maintenance flotte (compagnies)
-- Couvre: véhicules, types d'entretien, plans, interventions, alertes et rapport.

CREATE TABLE IF NOT EXISTS public.company_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES public.trucks(id) ON DELETE SET NULL,
  registration_number TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER CHECK (year >= 1950 AND year <= 2100),
  current_mileage_km INTEGER NOT NULL DEFAULT 0 CHECK (current_mileage_km >= 0),
  category TEXT NOT NULL DEFAULT 'truck' CHECK (
    category IN ('truck', 'tractor', 'trailer', 'van', 'pickup', 'other')
  ),
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'maintenance', 'immobilized', 'sold')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, registration_number)
);

CREATE TABLE IF NOT EXISTS public.maintenance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  default_interval_km INTEGER CHECK (default_interval_km IS NULL OR default_interval_km > 0),
  default_interval_days INTEGER CHECK (default_interval_days IS NULL OR default_interval_days > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.company_vehicles(id) ON DELETE CASCADE,
  maintenance_type_id UUID NOT NULL REFERENCES public.maintenance_types(id) ON DELETE RESTRICT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  interval_km INTEGER CHECK (interval_km IS NULL OR interval_km > 0),
  interval_days INTEGER CHECK (interval_days IS NULL OR interval_days > 0),
  last_service_at TIMESTAMPTZ,
  last_service_mileage_km INTEGER CHECK (last_service_mileage_km IS NULL OR last_service_mileage_km >= 0),
  next_due_at TIMESTAMPTZ,
  next_due_mileage_km INTEGER CHECK (next_due_mileage_km IS NULL OR next_due_mileage_km >= 0),
  alert_before_km INTEGER NOT NULL DEFAULT 500 CHECK (alert_before_km >= 0),
  alert_before_days INTEGER NOT NULL DEFAULT 7 CHECK (alert_before_days >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, maintenance_type_id)
);

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.company_vehicles(id) ON DELETE CASCADE,
  maintenance_type_id UUID REFERENCES public.maintenance_types(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.vehicle_maintenance_plans(id) ON DELETE SET NULL,
  intervention_kind TEXT NOT NULL DEFAULT 'preventive' CHECK (
    intervention_kind IN ('preventive', 'corrective')
  ),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (
    status IN ('planned', 'in_progress', 'completed', 'cancelled')
  ),
  service_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mileage_km INTEGER CHECK (mileage_km IS NULL OR mileage_km >= 0),
  provider_name TEXT,
  parts_changed TEXT,
  notes TEXT,
  cost_parts DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (cost_parts >= 0),
  cost_labor DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (cost_labor >= 0),
  cost_other DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (cost_other >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  attachment_urls TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.company_vehicles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.vehicle_maintenance_plans(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (
    alert_type IN ('due_soon_date', 'due_soon_mileage', 'overdue_date', 'overdue_mileage')
  ),
  alert_level TEXT NOT NULL DEFAULT 'warning' CHECK (alert_level IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  due_mileage_km INTEGER CHECK (due_mileage_km IS NULL OR due_mileage_km >= 0),
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_vehicles_company ON public.company_vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_vehicles_status ON public.company_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_company_vehicles_registration ON public.company_vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_plans_vehicle ON public.vehicle_maintenance_plans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_plans_due_at ON public.vehicle_maintenance_plans(next_due_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_plans_due_km ON public.vehicle_maintenance_plans(next_due_mileage_km);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_interventions_vehicle ON public.vehicle_maintenance_interventions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_interventions_service_at ON public.vehicle_maintenance_interventions(service_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_alerts_vehicle ON public.vehicle_maintenance_alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_alerts_open ON public.vehicle_maintenance_alerts(is_resolved, created_at DESC);

ALTER TABLE public.company_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_vehicles_company_own_select ON public.company_vehicles;
CREATE POLICY company_vehicles_company_own_select ON public.company_vehicles
  FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS company_vehicles_company_own_write ON public.company_vehicles;
CREATE POLICY company_vehicles_company_own_write ON public.company_vehicles
  FOR ALL
  USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS maintenance_types_read_all_authenticated ON public.maintenance_types;
CREATE POLICY maintenance_types_read_all_authenticated ON public.maintenance_types
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS maintenance_types_admin_write ON public.maintenance_types;
CREATE POLICY maintenance_types_admin_write ON public.maintenance_types
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS vehicle_maintenance_plans_company_own ON public.vehicle_maintenance_plans;
CREATE POLICY vehicle_maintenance_plans_company_own ON public.vehicle_maintenance_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_vehicles v
      WHERE v.id = vehicle_maintenance_plans.vehicle_id
      AND v.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_vehicles v
      WHERE v.id = vehicle_maintenance_plans.vehicle_id
      AND v.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS vehicle_maintenance_interventions_company_own ON public.vehicle_maintenance_interventions;
CREATE POLICY vehicle_maintenance_interventions_company_own ON public.vehicle_maintenance_interventions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_vehicles v
      WHERE v.id = vehicle_maintenance_interventions.vehicle_id
      AND v.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_vehicles v
      WHERE v.id = vehicle_maintenance_interventions.vehicle_id
      AND v.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS vehicle_maintenance_alerts_company_own ON public.vehicle_maintenance_alerts;
CREATE POLICY vehicle_maintenance_alerts_company_own ON public.vehicle_maintenance_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_vehicles v
      WHERE v.id = vehicle_maintenance_alerts.vehicle_id
      AND v.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_vehicles v
      WHERE v.id = vehicle_maintenance_alerts.vehicle_id
      AND v.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS company_vehicles_admin_all ON public.company_vehicles;
CREATE POLICY company_vehicles_admin_all ON public.company_vehicles
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS vehicle_maintenance_plans_admin_all ON public.vehicle_maintenance_plans;
CREATE POLICY vehicle_maintenance_plans_admin_all ON public.vehicle_maintenance_plans
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS vehicle_maintenance_interventions_admin_all ON public.vehicle_maintenance_interventions;
CREATE POLICY vehicle_maintenance_interventions_admin_all ON public.vehicle_maintenance_interventions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS vehicle_maintenance_alerts_admin_all ON public.vehicle_maintenance_alerts;
CREATE POLICY vehicle_maintenance_alerts_admin_all ON public.vehicle_maintenance_alerts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_company_vehicles_updated_at ON public.company_vehicles;
CREATE TRIGGER update_company_vehicles_updated_at
  BEFORE UPDATE ON public.company_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_maintenance_plans_updated_at ON public.vehicle_maintenance_plans;
CREATE TRIGGER update_vehicle_maintenance_plans_updated_at
  BEFORE UPDATE ON public.vehicle_maintenance_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_maintenance_interventions_updated_at ON public.vehicle_maintenance_interventions;
CREATE TRIGGER update_vehicle_maintenance_interventions_updated_at
  BEFORE UPDATE ON public.vehicle_maintenance_interventions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_vehicle_mileage_from_intervention()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.mileage_km IS NOT NULL THEN
    UPDATE public.company_vehicles v
    SET current_mileage_km = GREATEST(v.current_mileage_km, NEW.mileage_km)
    WHERE v.id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_vehicle_mileage_from_intervention ON public.vehicle_maintenance_interventions;
CREATE TRIGGER trg_sync_vehicle_mileage_from_intervention
  AFTER INSERT OR UPDATE ON public.vehicle_maintenance_interventions
  FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_mileage_from_intervention();

CREATE OR REPLACE FUNCTION public.compute_next_due(
  p_from_at TIMESTAMPTZ,
  p_from_km INTEGER,
  p_interval_days INTEGER,
  p_interval_km INTEGER
)
RETURNS TABLE(next_due_at TIMESTAMPTZ, next_due_mileage_km INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  next_due_at := CASE
    WHEN p_interval_days IS NULL THEN NULL
    ELSE COALESCE(p_from_at, NOW()) + make_interval(days => p_interval_days)
  END;

  next_due_mileage_km := CASE
    WHEN p_interval_km IS NULL THEN NULL
    ELSE COALESCE(p_from_km, 0) + p_interval_km
  END;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_intervention_to_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_due_at TIMESTAMPTZ;
  v_next_due_km INTEGER;
BEGIN
  IF NEW.plan_id IS NULL OR NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT d.next_due_at, d.next_due_mileage_km
    INTO v_next_due_at, v_next_due_km
  FROM public.compute_next_due(
    NEW.service_at,
    NEW.mileage_km,
    (SELECT interval_days FROM public.vehicle_maintenance_plans p WHERE p.id = NEW.plan_id),
    (SELECT interval_km FROM public.vehicle_maintenance_plans p WHERE p.id = NEW.plan_id)
  ) d;

  UPDATE public.vehicle_maintenance_plans
  SET
    last_service_at = NEW.service_at,
    last_service_mileage_km = NEW.mileage_km,
    next_due_at = v_next_due_at,
    next_due_mileage_km = v_next_due_km
  WHERE id = NEW.plan_id;

  UPDATE public.vehicle_maintenance_alerts
  SET
    is_resolved = TRUE,
    resolved_at = NOW()
  WHERE plan_id = NEW.plan_id
    AND is_resolved = FALSE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_intervention_to_plan ON public.vehicle_maintenance_interventions;
CREATE TRIGGER trg_apply_intervention_to_plan
  AFTER INSERT OR UPDATE ON public.vehicle_maintenance_interventions
  FOR EACH ROW EXECUTE FUNCTION public.apply_intervention_to_plan();

CREATE OR REPLACE VIEW public.v_company_maintenance_report AS
SELECT
  v.company_id,
  v.id AS vehicle_id,
  v.registration_number,
  v.brand,
  v.model,
  v.year,
  v.current_mileage_km,
  i.id AS intervention_id,
  i.service_at,
  i.intervention_kind,
  i.status AS intervention_status,
  i.mileage_km AS intervention_mileage_km,
  i.cost_parts,
  i.cost_labor,
  i.cost_other,
  (i.cost_parts + i.cost_labor + i.cost_other) AS cost_total,
  i.currency,
  mt.code AS maintenance_code,
  mt.label_fr AS maintenance_label_fr,
  mt.label_en AS maintenance_label_en
FROM public.company_vehicles v
LEFT JOIN public.vehicle_maintenance_interventions i ON i.vehicle_id = v.id
LEFT JOIN public.maintenance_types mt ON mt.id = i.maintenance_type_id;

-- Types d'entretien prédéfinis
INSERT INTO public.maintenance_types (code, label_fr, label_en, default_interval_km, default_interval_days)
VALUES
  ('oil_filter_change', 'Vidange huile et filtre', 'Oil and filter change', 10000, 180),
  ('tire_change', 'Changement pneu', 'Tire replacement', 40000, 365),
  ('brake_service', 'Frein disque / plaquettes', 'Brake discs / pads service', 30000, 365),
  ('technical_inspection', 'Révision technique', 'Technical inspection', NULL, 365),
  ('greasing', 'Graissage', 'Greasing', 15000, 180),
  ('battery_alternator', 'Batterie / alternateur', 'Battery / alternator', 60000, 730),
  ('air_conditioning', 'Climatisation', 'Air conditioning service', NULL, 365)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE public.company_vehicles IS 'Parc véhicule par compagnie (immat, marque, modèle, année, km, photo, catégorie).';
COMMENT ON TABLE public.vehicle_maintenance_plans IS 'Plan de maintenance par véhicule et type d''entretien (date/km).';
COMMENT ON TABLE public.vehicle_maintenance_interventions IS 'Historique des interventions de maintenance et coûts.';
COMMENT ON TABLE public.vehicle_maintenance_alerts IS 'Alertes automatiques maintenance (à faire / en retard).';
COMMENT ON VIEW public.v_company_maintenance_report IS 'Vue rapport maintenance par véhicule et intervention.';
