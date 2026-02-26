import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Mettre à jour le statut d'une entreprise ou d'un courtier (admin only).
 * Utilise le service role pour garantir la mise à jour (contourne RLS).
 * POST body: { entityType: 'company' | 'broker', entityId: string, status: 'active' | 'suspended' | 'pending' }
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { entityType, entityId, status } = body as {
      entityType: 'company' | 'broker';
      entityId: string;
      status: 'active' | 'suspended' | 'pending';
    };

    if (!entityType || !entityId || !status) {
      return NextResponse.json(
        { error: 'entityType, entityId et status requis' },
        { status: 400 }
      );
    }

    if (!['company', 'broker'].includes(entityType) || !['active', 'suspended', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'entityType: company|broker, status: active|suspended|pending' },
        { status: 400 }
      );
    }

    const table = entityType === 'company' ? 'companies' : 'brokers';
    const payload = { status, updated_at: new Date().toISOString() };
    const entityLabel = entityType === 'company' ? 'Entreprise' : 'Courtier';

    let updated = false;
    let err: unknown = null;
    try {
      const db = createServiceRoleClient();
      const res = await db.from(table).update(payload).eq('id', entityId).select('id');
      if (res.error) err = res.error;
      else if (res.data && res.data.length > 0) updated = true;
    } catch (e) {
      err = e;
    }

    if (!updated && err) {
      // Fallback sans SERVICE_ROLE : l'admin met à jour via RLS
      const { data: fallbackData, error } = await supabase.from(table).update(payload).eq('id', entityId).select('id');
      if (error) {
        console.error('entity-status:', error);
        const msg = error.message || 'Erreur lors de la mise à jour';
        const hint = error.code === 'PGRST301' || msg.includes('row-level') || msg.includes('policy')
          ? ' Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local ou exécutez les politiques RLS admin (voir supabase/a_ajouter_sur_supabase.sql).'
          : '';
        return NextResponse.json(
          { error: msg + hint },
          { status: 500 }
        );
      }
      if (fallbackData && fallbackData.length > 0) updated = true;
    }

    if (!updated) {
      return NextResponse.json(
        { error: `${entityLabel} introuvable (id invalide ou supprimé).` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: status === 'active' ? 'Compte validé — le courtier/entreprise peut maintenant publier.' : status === 'suspended' ? 'Compte suspendu' : 'Compte en attente',
    });
  } catch (error: unknown) {
    console.error('entity-status:', error);
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    if (msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
