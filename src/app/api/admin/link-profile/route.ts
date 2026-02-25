import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Associe une company ou broker à un utilisateur (admin only).
 * Utilise le service role pour lire entreprises/courtiers et mettre à jour users (bypass RLS).
 * POST body: { userId, entityType: 'company'|'broker', entityId }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, entityType, entityId } = body as {
      userId: string;
      entityType: 'company' | 'broker';
      entityId: string;
    };

    if (!userId || !entityType || !entityId || !['company', 'broker'].includes(entityType)) {
      return NextResponse.json(
        { error: 'userId, entityType (company|broker) et entityId requis' },
        { status: 400 }
      );
    }

    const db = createServiceRoleClient();

    const { data: targetUser } = await db
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const expectedRole = entityType === 'company' ? 'company' : 'broker';
    if (targetUser.role !== expectedRole) {
      return NextResponse.json(
        { error: `Le role utilisateur doit etre ${expectedRole} pour associer un ${entityType}` },
        { status: 400 }
      );
    }

    if (entityType === 'company') {
      const { data: company } = await db
        .from('companies')
        .select('id')
        .eq('id', entityId)
        .maybeSingle();
      if (!company) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });

      const { error } = await db
        .from('users')
        .update({ company_id: entityId })
        .eq('id', userId);
      if (error) throw error;
    } else {
      const { data: broker } = await db
        .from('brokers')
        .select('id')
        .eq('id', entityId)
        .maybeSingle();
      if (!broker) return NextResponse.json({ error: 'Courtier introuvable' }, { status: 404 });

      const { error } = await db
        .from('users')
        .update({ broker_id: entityId })
        .eq('id', userId);
      if (error) throw error;
    }

    await db.from('association_requests').delete().eq('user_id', userId);

    return NextResponse.json({ success: true, message: 'Profil associé' });
  } catch (error: unknown) {
    console.error('link-profile:', error);
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    if (msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Configuration: ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local pour que l\'admin puisse associer les profils.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
