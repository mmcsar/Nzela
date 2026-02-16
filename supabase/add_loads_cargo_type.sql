-- Ajoute cargo_type (type de produit) sur loads si absent
-- Utile pour le matching avec les camions adaptes
-- Executer dans Supabase SQL Editor si la colonne n'existe pas
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS cargo_type TEXT;
CREATE INDEX IF NOT EXISTS idx_loads_cargo_type ON public.loads(cargo_type);
