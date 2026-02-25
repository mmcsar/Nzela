-- Colonnes optionnelles pour le Load Board : description et exigences spéciales du chargement
-- À exécuter dans Supabase > SQL Editor si l'erreur "column loads.description does not exist" apparaît
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS special_requirements TEXT;
