-- Permet les paiements sans abonnement (fret, one-off, etc.)
-- À exécuter dans Supabase > SQL Editor si ta table payments a subscription_id NOT NULL.

ALTER TABLE public.payments
  ALTER COLUMN subscription_id DROP NOT NULL;

-- Optionnel : ajouter une contrainte de cohérence (au moins un des deux)
-- COMMENT ALTER TABLE public.payments ADD CONSTRAINT payments_subscription_or_load
--   CHECK (subscription_id IS NOT NULL OR load_id IS NOT NULL);
