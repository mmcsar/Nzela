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
      .select('id, role, company_id, broker_id, email, full_name')
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
        // 1) Par owner_id
        const { data: byOwner } = await db.from(table).select('id').eq('owner_id', userId).maybeSingle();
        let entity = byOwner ?? null;

        // 2) Par email exact (courtier/entreprise)
        if (!entity && targetUser.email) {
          const { data: byEmailRows } = await db.from(table).select('id').eq('email', targetUser.email).limit(1);
          entity = Array.isArray(byEmailRows) ? byEmailRows[0] ?? null : byEmailRows ?? null;
          if (entity) {
            await db.from(table).update({ owner_id: userId }).eq('id', entity.id);
          }
        }

        // 3) Par préfixe email dans name (ex. "mmc" ou "MMC" pour mmc@...)
        if (!entity && targetUser.email) {
          const prefix = targetUser.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
          if (prefix.length >= 2) {
            const { data: byNameRows } = await db.from(table).select('id').ilike('name', `%${prefix}%`).limit(2);
            const first = Array.isArray(byNameRows) ? byNameRows[0] : byNameRows;
            if (first) entity = first;
            if (!entity) {
              const { data: byEmailPrefixRows } = await db.from(table).select('id').ilike('email', `%${prefix}%`).limit(1);
              const firstEmail = Array.isArray(byEmailPrefixRows) ? byEmailPrefixRows[0] : byEmailPrefixRows;
              if (firstEmail) entity = firstEmail;
            }
            if (entity) {
              await db.from(table).update({ owner_id: userId }).eq('id', entity.id);
            }
          }
        }

        // 4) Dernier recours : courtier/entreprise sans owner_id dont le nom ou email contient le préfixe
        if (!entity && targetUser.email) {
          const prefix = targetUser.email.split('@')[0]?.trim().replace(/[%_\\]/g, '') ?? '';
          if (prefix.length >= 2) {
            const { data: unlinked } = await db.from(table).select('id, name, email').is('owner_id', null).limit(50);
            const list = Array.isArray(unlinked) ? unlinked : unlinked ? [unlinked] : [];
            const match = list.find(
              (r: { id: string; name?: string | null; email?: string | null }) =>
                (r.name && r.name.toLowerCase().includes(prefix.toLowerCase())) ||
                (r.email && r.email.toLowerCase().includes(prefix.toLowerCase()))
            );
            if (match) {
              entity = match;
              await db.from(table).update({ owner_id: userId }).eq('id', entity.id);
            }
          }
        }

        // 5) Aucun trouvé : créer une fiche courtier/entreprise minimale (inscription peut avoir échoué côté RLS)
        if (!entity) {
          const displayName = (targetUser as { full_name?: string }).full_name?.trim() || targetUser.email?.split('@')[0] || 'Profil';
          const uniqueReg = `${entityType === 'company' ? 'CO' : 'BR'}-${userId.substring(0, 8)}-${Date.now().toString(36)}`;
          const { data: created, error: createErr } = await db
            .from(table)
            .insert({
              name: displayName,
              registration_number: uniqueReg,
              address: '',
              city: 'Lubumbashi',
              province: 'haut-katanga',
              phone: '',
              email: targetUser.email || '',
              owner_id: userId,
              status: newStatus,
            })
            .select('id')
            .single();
          if (createErr) {
            console.error('user-entity-status: create entity', createErr);
            return NextResponse.json(
              {
                error: `Aucun ${entityType === 'company' ? 'entreprise' : 'courtier'} trouvé. Créez-en un dans Supabase ou ajoutez SUPABASE_SERVICE_ROLE_KEY (Vercel). Détail: ${createErr.message}`,
              },
              { status: 404 }
            );
          }
          entityId = created.id;
        } else {
          entityId = entity.id;
        }
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
