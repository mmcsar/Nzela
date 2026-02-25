-- Demandes d'association (entreprise/courtier) visibles par l'admin sans SERVICE_ROLE_KEY
-- L'utilisateur insère sa demande ; l'admin lit la table depuis Dashboard > Utilisateurs
CREATE TABLE IF NOT EXISTS public.association_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'broker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_association_requests_user_id ON public.association_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_association_requests_created_at ON public.association_requests(created_at DESC);

ALTER TABLE public.association_requests ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut insérer sa propre demande
CREATE POLICY "association_requests_insert_own" ON public.association_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seul l'admin peut lire et supprimer (pour traiter ou ignorer)
CREATE POLICY "association_requests_select_admin" ON public.association_requests
  FOR SELECT USING (public.is_admin());
CREATE POLICY "association_requests_delete_admin" ON public.association_requests
  FOR DELETE USING (public.is_admin());

COMMENT ON TABLE public.association_requests IS 'Demandes des utilisateurs (company/broker) pour être associés à un profil ; consultées par l''admin dans Utilisateurs.';
