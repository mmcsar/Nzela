-- Facturation transport : factures liées aux chargements terminés
CREATE TABLE IF NOT EXISTS public.transport_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_invoices_load ON public.transport_invoices(load_id);
CREATE INDEX IF NOT EXISTS idx_transport_invoices_broker ON public.transport_invoices(broker_id);
CREATE INDEX IF NOT EXISTS idx_transport_invoices_company ON public.transport_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_transport_invoices_status ON public.transport_invoices(status);

ALTER TABLE public.transport_invoices ENABLE ROW LEVEL SECURITY;

-- Broker: voir/créer ses factures (broker_id = lui)
CREATE POLICY "transport_invoices_broker_own" ON public.transport_invoices
  FOR ALL USING (broker_id = (SELECT broker_id FROM public.users WHERE id = auth.uid()));

-- Company: voir les factures où company_id = lui
CREATE POLICY "transport_invoices_company_own" ON public.transport_invoices
  FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Admin: tout
CREATE POLICY "transport_invoices_admin" ON public.transport_invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.transport_invoices IS 'Factures transport liées aux chargements (TMS facturation).';
