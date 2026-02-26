import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Liste des entreprises et courtiers pour l'admin (dropdown Associer).
 * Utilise le service role pour garantir l'accès complet.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: adminData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (adminData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
    }

    let companies: { id: string; name: string; owner_id?: string }[] = [];
    let brokers: { id: string; name: string; owner_id?: string }[] = [];

    try {
      const db = createServiceRoleClient();
      const [companiesRes, brokersRes] = await Promise.all([
        db.from('companies').select('id, name, owner_id').order('name'),
        db.from('brokers').select('id, name, owner_id').order('name'),
      ]);
      companies = (companiesRes.data || []).map((c: { id: string; name: string; owner_id?: string }) => ({ id: c.id, name: c.name, owner_id: c.owner_id }));
      brokers = (brokersRes.data || []).map((b: { id: string; name: string; owner_id?: string }) => ({ id: b.id, name: b.name, owner_id: b.owner_id }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        return NextResponse.json(
          { error: 'Configuration manquante : ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (Dashboard Supabase > Settings > API > service_role) pour afficher les listes entreprise/courtier.' },
          { status: 503 }
        );
      }
      const [c, b] = await Promise.all([
        supabase.from('companies').select('id, name, owner_id').order('name'),
        supabase.from('brokers').select('id, name, owner_id').order('name'),
      ]);
      companies = (c.data || []).map((x: { id: string; name: string; owner_id?: string }) => ({ id: x.id, name: x.name, owner_id: x.owner_id }));
      brokers = (b.data || []).map((x: { id: string; name: string; owner_id?: string }) => ({ id: x.id, name: x.name, owner_id: x.owner_id }));
    }

    return NextResponse.json({ companies, brokers });
  } catch (error: unknown) {
    console.error('entities-list:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const isConfigMissing = message.includes('SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json(
      { error: isConfigMissing ? 'Configuration manquante : ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local' : message },
      { status: isConfigMissing ? 503 : 500 }
    );
  }
}
