-- Maintenance V2 (niveau international)
-- Ajoute: work orders, checklist tâches, pièces/stock, main d'oeuvre, documents, audit log, vues KPI.

-- 1) WORK ORDERS
CREATE TABLE IF NOT EXISTS public.maintenance_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.company_vehicles(id) ON DELETE CASCADE,
  maintenance_type_id UUID REFERENCES public.maintenance_types(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.vehicle_maintenance_plans(id) ON DELETE SET NULL,
  intervention_id UUID REFERENCES public.vehicle_maintenance_interventions(id) ON DELETE SET NULL,
  work_order_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed', 'closed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  odometer_km INTEGER CHECK (odometer_km IS NULL OR odometer_km >= 0),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_note TEXT,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  total_parts_cost DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_parts_cost >= 0),
  total_labor_cost DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_labor_cost >= 0),
  total_other_cost DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_other_cost >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) CHECKLIST TASKS
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.maintenance_work_orders(id) ON DELETE CASCADE,
  checklist_code TEXT,
  title TEXT NOT NULL,
  instructions TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'skipped', 'failed')),
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  result_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) PARTS CATALOG + STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.maintenance_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'unit',
  stock_qty NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  min_stock_qty NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (min_stock_qty >= 0),
  avg_unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (avg_unit_cost >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, sku)
);

CREATE TABLE IF NOT EXISTS public.maintenance_part_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.maintenance_parts(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.maintenance_work_orders(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(12,2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
  reference_no TEXT,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) LABOR ENTRIES
CREATE TABLE IF NOT EXISTS public.maintenance_labor_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.maintenance_work_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hours NUMERIC(8,2) NOT NULL CHECK (hours > 0),
  hourly_rate DECIMAL(12,2) NOT NULL CHECK (hourly_rate >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  line_total DECIMAL(12,2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) DOCUMENTS
CREATE TABLE IF NOT EXISTS public.maintenance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.company_vehicles(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.maintenance_work_orders(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.vehicle_maintenance_interventions(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('invoice', 'photo_before', 'photo_after', 'inspection_report', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) AUDIT LOG
CREATE TABLE IF NOT EXISTS public.maintenance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  entity_name TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'status_change')),
  old_data JSONB,
  new_data JSONB,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mwo_company ON public.maintenance_work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_mwo_vehicle ON public.maintenance_work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mwo_status ON public.maintenance_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_mwo_priority ON public.maintenance_work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_mwo_requested_at ON public.maintenance_work_orders(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_mt_work_order ON public.maintenance_tasks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_company ON public.maintenance_parts(company_id);
CREATE INDEX IF NOT EXISTS idx_part_movements_part ON public.maintenance_part_movements(part_id);
CREATE INDEX IF NOT EXISTS idx_part_movements_work_order ON public.maintenance_part_movements(work_order_id);
CREATE INDEX IF NOT EXISTS idx_labor_work_order ON public.maintenance_labor_entries(work_order_id);
CREATE INDEX IF NOT EXISTS idx_docs_company ON public.maintenance_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_docs_work_order ON public.maintenance_documents(work_order_id);
CREATE INDEX IF NOT EXISTS idx_maint_audit_company ON public.maintenance_audit_log(company_id, created_at DESC);

-- RLS
ALTER TABLE public.maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_part_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_labor_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mwo_company_own ON public.maintenance_work_orders;
CREATE POLICY mwo_company_own ON public.maintenance_work_orders
  FOR ALL
  USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS mwo_admin_all ON public.maintenance_work_orders;
CREATE POLICY mwo_admin_all ON public.maintenance_work_orders
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS tasks_company_own ON public.maintenance_tasks;
CREATE POLICY tasks_company_own ON public.maintenance_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.maintenance_work_orders w
      WHERE w.id = maintenance_tasks.work_order_id
        AND w.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.maintenance_work_orders w
      WHERE w.id = maintenance_tasks.work_order_id
        AND w.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS tasks_admin_all ON public.maintenance_tasks;
CREATE POLICY tasks_admin_all ON public.maintenance_tasks
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS parts_company_own ON public.maintenance_parts;
CREATE POLICY parts_company_own ON public.maintenance_parts
  FOR ALL
  USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS parts_admin_all ON public.maintenance_parts;
CREATE POLICY parts_admin_all ON public.maintenance_parts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS part_movements_company_own ON public.maintenance_part_movements;
CREATE POLICY part_movements_company_own ON public.maintenance_part_movements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.maintenance_parts p
      WHERE p.id = maintenance_part_movements.part_id
        AND p.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.maintenance_parts p
      WHERE p.id = maintenance_part_movements.part_id
        AND p.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS part_movements_admin_all ON public.maintenance_part_movements;
CREATE POLICY part_movements_admin_all ON public.maintenance_part_movements
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS labor_company_own ON public.maintenance_labor_entries;
CREATE POLICY labor_company_own ON public.maintenance_labor_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.maintenance_work_orders w
      WHERE w.id = maintenance_labor_entries.work_order_id
        AND w.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.maintenance_work_orders w
      WHERE w.id = maintenance_labor_entries.work_order_id
        AND w.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS labor_admin_all ON public.maintenance_labor_entries;
CREATE POLICY labor_admin_all ON public.maintenance_labor_entries
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS docs_company_own ON public.maintenance_documents;
CREATE POLICY docs_company_own ON public.maintenance_documents
  FOR ALL
  USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS docs_admin_all ON public.maintenance_documents;
CREATE POLICY docs_admin_all ON public.maintenance_documents
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS audit_company_read ON public.maintenance_audit_log;
CREATE POLICY audit_company_read ON public.maintenance_audit_log
  FOR SELECT
  USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS audit_admin_all ON public.maintenance_audit_log;
CREATE POLICY audit_admin_all ON public.maintenance_audit_log
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_mwo_updated_at ON public.maintenance_work_orders;
CREATE TRIGGER update_mwo_updated_at
  BEFORE UPDATE ON public.maintenance_work_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.maintenance_tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.maintenance_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parts_updated_at ON public.maintenance_parts;
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON public.maintenance_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log helper
CREATE OR REPLACE FUNCTION public.log_maintenance_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_id UUID;
  v_actor_email TEXT;
BEGIN
  v_company_id :=
    CASE
      WHEN TG_TABLE_NAME = 'maintenance_work_orders' THEN COALESCE(NEW.company_id, OLD.company_id)
      WHEN TG_TABLE_NAME = 'maintenance_parts' THEN COALESCE(NEW.company_id, OLD.company_id)
      WHEN TG_TABLE_NAME = 'maintenance_documents' THEN COALESCE(NEW.company_id, OLD.company_id)
      ELSE NULL
    END;

  SELECT email INTO v_actor_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.maintenance_audit_log (
    company_id, entity_name, entity_id, action, old_data, new_data, actor_id, actor_email
  )
  VALUES (
    v_company_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'INSERT' THEN 'insert' WHEN TG_OP = 'UPDATE' THEN 'update' ELSE 'delete' END,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    v_actor_email
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_mwo_audit ON public.maintenance_work_orders;
CREATE TRIGGER trg_mwo_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_work_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_maintenance_audit();

DROP TRIGGER IF EXISTS trg_parts_audit ON public.maintenance_parts;
CREATE TRIGGER trg_parts_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_parts
  FOR EACH ROW EXECUTE FUNCTION public.log_maintenance_audit();

DROP TRIGGER IF EXISTS trg_docs_audit ON public.maintenance_documents;
CREATE TRIGGER trg_docs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_maintenance_audit();

-- Stock movement => update stock and average cost
CREATE OR REPLACE FUNCTION public.apply_part_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_qty NUMERIC(14,3);
  v_current_avg DECIMAL(12,2);
  v_new_qty NUMERIC(14,3);
  v_new_avg DECIMAL(12,2);
  v_unit_cost DECIMAL(12,2);
BEGIN
  SELECT stock_qty, avg_unit_cost INTO v_current_qty, v_current_avg
  FROM public.maintenance_parts
  WHERE id = NEW.part_id
  FOR UPDATE;

  v_unit_cost := COALESCE(NEW.unit_cost, v_current_avg, 0);

  IF NEW.movement_type = 'in' THEN
    v_new_qty := v_current_qty + NEW.quantity;
    IF v_new_qty > 0 THEN
      v_new_avg := ((v_current_qty * v_current_avg) + (NEW.quantity * v_unit_cost)) / v_new_qty;
    ELSE
      v_new_avg := v_current_avg;
    END IF;
  ELSIF NEW.movement_type = 'out' THEN
    v_new_qty := GREATEST(v_current_qty - NEW.quantity, 0);
    v_new_avg := v_current_avg;
  ELSE
    v_new_qty := NEW.quantity;
    v_new_avg := v_unit_cost;
  END IF;

  UPDATE public.maintenance_parts
  SET stock_qty = v_new_qty, avg_unit_cost = COALESCE(v_new_avg, avg_unit_cost)
  WHERE id = NEW.part_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_part_movement ON public.maintenance_part_movements;
CREATE TRIGGER trg_apply_part_movement
  AFTER INSERT ON public.maintenance_part_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_part_movement();

-- KPI Views
CREATE OR REPLACE VIEW public.v_company_maintenance_kpi AS
SELECT
  w.company_id,
  COUNT(*) AS total_work_orders,
  COUNT(*) FILTER (WHERE w.status = 'completed') AS completed_work_orders,
  COUNT(*) FILTER (WHERE w.status IN ('draft', 'approved', 'in_progress')) AS open_work_orders,
  COUNT(*) FILTER (WHERE w.priority = 'critical') AS critical_work_orders,
  SUM(w.total_parts_cost + w.total_labor_cost + w.total_other_cost) AS total_maintenance_cost,
  AVG(
    CASE
      WHEN w.completed_at IS NOT NULL AND w.started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (w.completed_at - w.started_at)) / 3600.0
      ELSE NULL
    END
  ) AS avg_repair_hours
FROM public.maintenance_work_orders w
GROUP BY w.company_id;

CREATE OR REPLACE VIEW public.v_vehicle_maintenance_kpi AS
SELECT
  v.id AS vehicle_id,
  v.company_id,
  v.registration_number,
  v.brand,
  v.model,
  v.current_mileage_km,
  COUNT(w.id) AS work_orders_count,
  SUM(COALESCE(w.total_parts_cost,0) + COALESCE(w.total_labor_cost,0) + COALESCE(w.total_other_cost,0)) AS total_cost,
  CASE
    WHEN v.current_mileage_km > 0 THEN
      SUM(COALESCE(w.total_parts_cost,0) + COALESCE(w.total_labor_cost,0) + COALESCE(w.total_other_cost,0)) / v.current_mileage_km
    ELSE NULL
  END AS cost_per_km
FROM public.company_vehicles v
LEFT JOIN public.maintenance_work_orders w ON w.vehicle_id = v.id
GROUP BY v.id, v.company_id, v.registration_number, v.brand, v.model, v.current_mileage_km;

COMMENT ON TABLE public.maintenance_work_orders IS 'Ordres de travail maintenance (workflow pro).';
COMMENT ON TABLE public.maintenance_tasks IS 'Checklist tâches par ordre de travail.';
COMMENT ON TABLE public.maintenance_parts IS 'Catalogue pièces + stock compagnie.';
COMMENT ON TABLE public.maintenance_part_movements IS 'Mouvements de stock pièces (in/out/adjustment).';
COMMENT ON TABLE public.maintenance_labor_entries IS 'Lignes de main d''oeuvre par ordre de travail.';
COMMENT ON TABLE public.maintenance_documents IS 'Documents maintenance (facture/photos/rapports).';
COMMENT ON TABLE public.maintenance_audit_log IS 'Journal d''audit maintenance (immutabilité logique).';
COMMENT ON VIEW public.v_company_maintenance_kpi IS 'KPI maintenance agrégés par compagnie.';
COMMENT ON VIEW public.v_vehicle_maintenance_kpi IS 'KPI maintenance agrégés par véhicule.';
