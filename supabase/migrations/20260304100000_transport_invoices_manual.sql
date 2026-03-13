-- Permettre la création manuelle de factures (sans chargement lié)
ALTER TABLE public.transport_invoices
  ALTER COLUMN load_id DROP NOT NULL;

COMMENT ON COLUMN public.transport_invoices.load_id IS 'Optionnel : null pour facture créée manuellement.';
