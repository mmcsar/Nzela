-- Données collectées à chaque étape du workflow (pour pré-remplir le POD)
-- Ex: delivered.receiverName, delivered.deliveryTime, at_pickup.pickupTime, etc.

ALTER TABLE public.loads
ADD COLUMN IF NOT EXISTS workflow_step_data jsonb DEFAULT '{}';

COMMENT ON COLUMN public.loads.workflow_step_data IS 'Données saisies à chaque étape du workflow (receiverName, deliveryTime, pickupTime, notes, etc.) pour pré-remplir le formulaire POD.';
