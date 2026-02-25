import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Approuver, suspendre, mettre en attente ou dissocier le profil company/broker d'un utilisateur.
 * POST body: { userId, action: 'approve' | 'suspend' | 'pending' | 'unlink' }
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
    const { userId, action, entityId: bodyEntityId } = body as {
      userId: string;
      action: 'approve' | 'suspend' | 'pending' | 'unlink';
      entityId?: string;
    };

    if (!userId || !action || !['approve', 'suspend', 'pending', 'unlink'].includes(action)) {
      return NextResponse.json(
        { error: 'userId et action (approve|suspend|pending|unlink) requis' },
        { status: 400 }
      );
    }

    const db = createServiceRoleClient();

    if (action === 'unlink') {
      const { data: targetUser } = await db
        .from('users')
        .select('id, role, company_id, broker_id')
        .eq('id', userId)
        .maybeSingle();

      if (!targetUser) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
      }

      if (targetUser.role !== 'company' && targetUser.role !== 'broker') {
        return NextResponse.json(
          { error: 'Action reservée aux comptes entreprise ou courtier' },
          { status: 400 }
        );
      }

      const col = targetUser.role === 'company' ? 'company_id' : 'broker_id';
      const { error: unlinkErr } = await db
        .from('users')
        .update({ [col]: null })
        .eq('id', userId);

      if (unlinkErr) throw unlinkErr;
      return NextResponse.json({ success: true, message: 'Profil dissocié' });
    }

    const newStatus = action === 'approve' ? 'active' : action === 'suspend' ? 'suspended' : 'pending';

    const { data: targetUser } = await db
      .from('users')
      .select('id, role, company_id, broker_id')
      .eq('id', userId)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const role = targetUser.role;
    if (role !== 'company' && role !== 'broker') {
      return NextResponse.json(
        { error: 'Action reservée aux comptes entreprise ou courtier' },
        { status: 400 }
      );
    }

    const entityType = role === 'company' ? 'company' : 'broker';
    const table = entityType === 'company' ? 'companies' : 'brokers';
    let entityId = role === 'company' ? targetUser.company_id : targetUser.broker_id;

    // Si pas de lien : utiliser entityId fourni par l'admin (liste déroulante) ou chercher par owner_id
    if (!entityId) {
      if (bodyEntityId) {
        // Vérifier que l'entité existe
        const { data: entity } = await db
          .from(table)
          .select('id')
          .eq('id', bodyEntityId)
          .maybeSingle();
        if (!entity) {
          return NextResponse.json(
            { error: `${entityType === 'company' ? 'Entreprise' : 'Courtier'} introuvable.` },
            { status: 404 }
          );
        }
        entityId = bodyEntityId;
      } else {
        const { data: entity } = await db
          .from(table)
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();

        if (!entity) {
          return NextResponse.json(
            { error: `Aucune ${entityType === 'company' ? 'entreprise' : 'courtier'} trouvée pour cet utilisateur (owner_id). Choisissez une ${entityType === 'company' ? 'entreprise' : 'courtier'} dans la liste déroulante puis cliquez Approuver.` },
            { status: 404 }
          );
        }
        entityId = entity.id;
      }

      // Lier l'utilisateur à l'entité
      const col = entityType === 'company' ? 'company_id' : 'broker_id';
      const { error: linkErr } = await db
        .from('users')
        .update({ [col]: entityId })
        .eq('id', userId);
      if (linkErr) throw linkErr;
    }

    // Mettre à jour le statut de l'entité
    const { error: statusErr } = await db
      .from(table)
      .update({ status: newStatus })
      .eq('id', entityId);
    if (statusErr) throw statusErr;

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Compte approuvé' : action === 'suspend' ? 'Compte suspendu' : 'Compte en attente',
    });
  } catch (error: unknown) {
    console.error('user-entity-status:', error);
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
