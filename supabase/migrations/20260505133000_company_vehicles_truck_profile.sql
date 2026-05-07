-- Sprint 1 truck-first: profil camion essentiel
ALTER TABLE public.company_vehicles
  ADD COLUMN IF NOT EXISTS truck_config TEXT,
  ADD COLUMN IF NOT EXISTS body_type TEXT,
  ADD COLUMN IF NOT EXISTS ptac_tons NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS ptra_tons NUMERIC(8,2);

ALTER TABLE public.company_vehicles
  DROP CONSTRAINT IF EXISTS company_vehicles_ptac_tons_check;
ALTER TABLE public.company_vehicles
  ADD CONSTRAINT company_vehicles_ptac_tons_check
  CHECK (ptac_tons IS NULL OR ptac_tons >= 0);

ALTER TABLE public.company_vehicles
  DROP CONSTRAINT IF EXISTS company_vehicles_ptra_tons_check;
ALTER TABLE public.company_vehicles
  ADD CONSTRAINT company_vehicles_ptra_tons_check
  CHECK (ptra_tons IS NULL OR ptra_tons >= 0);

CREATE INDEX IF NOT EXISTS idx_company_vehicles_truck_config
  ON public.company_vehicles(truck_config);
CREATE INDEX IF NOT EXISTS idx_company_vehicles_body_type
  ON public.company_vehicles(body_type);

COMMENT ON COLUMN public.company_vehicles.truck_config IS 'Configuration camion/essieux (ex: 4x2, 6x4, 8x4).';
COMMENT ON COLUMN public.company_vehicles.body_type IS 'Type carrosserie (benne, citerne, plateau, porte-conteneur, fourgon, etc.).';
COMMENT ON COLUMN public.company_vehicles.ptac_tons IS 'Poids total autorisé en charge (tonnes).';
COMMENT ON COLUMN public.company_vehicles.ptra_tons IS 'Poids total roulant autorisé (tonnes).';
