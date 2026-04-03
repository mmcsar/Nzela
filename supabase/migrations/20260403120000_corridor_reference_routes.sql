-- Référence distances corridor RDC + Zambie (tarifs / carburant — aligné sur l’app)
-- Idempotent : n’insère pas si la paire existe déjà.

CREATE TABLE IF NOT EXISTS public.corridor_reference_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  distance_km integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_corridor_ref_route_pair
  ON public.corridor_reference_routes (lower(trim(origin_city)), lower(trim(destination_city)));

COMMENT ON TABLE public.corridor_reference_routes IS 'Distances indicative corridor (RDC + Zambie) ; les calculateurs utilisent aussi le code TypeScript.';

INSERT INTO public.corridor_reference_routes (origin_city, destination_city, distance_km)
SELECT v.o, v.d, v.km
FROM (
  VALUES
    ('Chililabombwe', 'Chingola', 14),
    ('Chingola', 'Kitwe', 52),
    ('Kitwe', 'Ndola', 63),
    ('Kitwe', 'Mufulira', 42),
    ('Ndola', 'Lusaka', 325),
    ('Ndola', 'Solwezi', 285),
    ('Kitwe', 'Solwezi', 335),
    ('Lusaka', 'Livingstone', 480),
    ('Lusaka', 'Chipata', 570),
    ('Ndola', 'Chipata', 620),
    ('Kasumbalesa', 'Chililabombwe', 8),
    ('Kasumbalesa', 'Chingola', 24),
    ('Sakania', 'Chingola', 58),
    ('Lubumbashi', 'Chingola', 98),
    ('Lubumbashi', 'Kitwe', 168),
    ('Lubumbashi', 'Ndola', 205),
    ('Lubumbashi', 'Lusaka', 525),
    ('Kolwezi', 'Ndola', 498),
    ('Kolwezi', 'Kitwe', 468)
) AS v(o, d, km)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.corridor_reference_routes r
  WHERE lower(trim(r.origin_city)) = lower(trim(v.o))
    AND lower(trim(r.destination_city)) = lower(trim(v.d))
);
