-- Workflow détaillé des chargements : étape courante (dispatché, en_route_pickup, at_pickup, etc.)
-- Sans cette colonne, l’app utilise uniquement le statut global (booked, in-transit, completed)
-- et l’« Étape actuelle » reste sur « Offre acceptée » jusqu’au passage en transit/terminé.

ALTER TABLE public.loads
ADD COLUMN IF NOT EXISTS workflow_step text;

COMMENT ON COLUMN public.loads.workflow_step IS 'Étape détaillée du workflow: bid_accepted, dispatched, en_route_pickup, at_pickup, loaded, in_transit, at_delivery, delivered, pod_uploaded, completed. Null = déduit du statut (booked → bid_accepted, etc.).';
