import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Associe une company ou broker à un utilisateur (admin only).
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

    const targetUser = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (!targetUser.data) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const expectedRole = entityType === 'company' ? 'company' : 'broker';
    if (targetUser.data.role !== expectedRole) {
      return NextResponse.json(
        { error: `Le role utilisateur doit etre ${expectedRole} pour associer un ${entityType}` },
        { status: 400 }
      );
    }

    if (entityType === 'company') {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('id', entityId)
        .maybeSingle();
      if (!company) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });

      const { error } = await supabase
        .from('users')
        .update({ company_id: entityId })
        .eq('id', userId);
      if (error) throw error;
    } else {
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('id', entityId)
        .maybeSingle();
      if (!broker) return NextResponse.json({ error: 'Courtier introuvable' }, { status: 404 });

      const { error } = await supabase
        .from('users')
        .update({ broker_id: entityId })
        .eq('id', userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Profil associé' });
  } catch (error: unknown) {
    console.error('link-profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
