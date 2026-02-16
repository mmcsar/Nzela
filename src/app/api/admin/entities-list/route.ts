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

    let companies: { id: string; name: string }[] = [];
    let brokers: { id: string; name: string }[] = [];

    try {
      const db = createServiceRoleClient();
      const [companiesRes, brokersRes] = await Promise.all([
        db.from('companies').select('id, name').order('name'),
        db.from('brokers').select('id, name').order('name'),
      ]);
      companies = companiesRes.data || [];
      brokers = brokersRes.data || [];
    } catch (e) {
      // Fallback: client standard si service role non configuré
      const [c, b] = await Promise.all([
        supabase.from('companies').select('id, name').order('name'),
        supabase.from('brokers').select('id, name').order('name'),
      ]);
      companies = c.data || [];
      brokers = b.data || [];
    }

    return NextResponse.json({ companies, brokers });
  } catch (error: unknown) {
    console.error('entities-list:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
