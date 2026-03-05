-- Ajouter les colonnes workflow sur la table loads (si erreur "workflow_step" / "workflow_step_data" dans le schema cache)
-- À exécuter dans Supabase Dashboard > SQL Editor > New query > Run

ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS workflow_step text;

ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS workflow_step_data jsonb DEFAULT '{}';

COMMENT ON COLUMN public.loads.workflow_step IS 'Étape détaillée du workflow: bid_accepted, dispatched, en_route_pickup, at_pickup, loaded, in_transit, at_delivery, delivered, pod_uploaded, completed. Null = déduit du statut.';
COMMENT ON COLUMN public.loads.workflow_step_data IS 'Données saisies à chaque étape du workflow (receiverName, deliveryTime, pickupTime, notes, etc.) pour pré-remplir le formulaire POD.';
