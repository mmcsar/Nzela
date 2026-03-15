-- Add currency to loads and trucks (CDF or USD)
ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD'));

ALTER TABLE public.trucks
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD'));
