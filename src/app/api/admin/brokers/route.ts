import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Liste des courtiers pour l'admin (Gestion des Courtiers).
 * Utilise le service role pour garantir que l'admin voit TOUS les courtiers,
 * y compris ceux en "pending" ou masqués par le RLS.
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let data: unknown[] = [];
    try {
      const db = createServiceRoleClient();
      let query = db
        .from('brokers')
        .select('*, owner:users!brokers_owner_id_fkey(id, email, full_name)')
        .order('created_at', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);
      const res = await query;
      if (res.error) throw res.error;
      data = res.data || [];
    } catch (e) {
      // Fallback sans SERVICE_ROLE : l'admin lit via RLS (is_admin())
      let query = supabase
        .from('brokers')
        .select('*, owner:users!brokers_owner_id_fkey(id, email, full_name)')
        .order('created_at', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);
      const { data: fallbackData, error } = await query;
      if (error) throw error;
      data = fallbackData || [];
    }

    return NextResponse.json({ brokers: data });
  } catch (error: unknown) {
    console.error('admin/brokers:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const isConfigMissing = message.includes('SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json(
      { error: isConfigMissing ? 'Configuration manquante : ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (voir Dashboard Supabase > Settings > API > service_role).' : message },
      { status: isConfigMissing ? 503 : 500 }
    );
  }
}
