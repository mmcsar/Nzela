import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Décode le payload JWT (sans vérifier la signature) pour récupérer sub.
 * Utilisé quand la session n'est pas encore dans les cookies (juste après signUp).
 * Utilise atob (disponible Node 18+ et Edge) pour éviter "Buffer is not defined" en Edge.
 */
function getSubFromJwt(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(decoded) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Notifie les admins lors d'une nouvelle inscription company ou broker.
 * Accepte la session via cookies ou via Authorization: Bearer (session pas encore en cookie après signUp).
 */
export async function POST(request: Request) {
  try {
    let userId: string | null = null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }

    if (!userId) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        const sub = getSubFromJwt(token);
        if (sub) userId = sub;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { type, entityId, entityName } = body as {
      type: 'company' | 'broker';
      entityId: string;
      entityName: string;
    };

    if (!type || !entityId || !entityName || !['company', 'broker'].includes(type)) {
      return NextResponse.json(
        { error: 'type (company|broker), entityId et entityName requis' },
        { status: 400 }
      );
    }

    const adminClient = createServiceRoleClient();

    // Vérifier que l'entité appartient bien à l'utilisateur (évite les abus si token passé à la main)
    const table = type === 'company' ? 'companies' : 'brokers';
    const { data: entity } = await adminClient
      .from(table)
      .select('owner_id')
      .eq('id', entityId)
      .maybeSingle();
    if (!entity || entity.owner_id !== userId) {
      return NextResponse.json({ error: 'Entité non trouvée ou non autorisée' }, { status: 403 });
    }

    const { data: admins } = await adminClient.from('users').select('id').eq('role', 'admin');
    if (!admins || admins.length === 0) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    const label = type === 'company' ? 'entreprise' : 'courtier';
    const link = type === 'company' ? '/dashboard/admin/companies' : '/dashboard/admin/brokers';

    const notifications = admins.map((a: { id: string }) => ({
      user_id: a.id,
      type: 'system' as const,
      title: `Nouvelle inscription ${label}`,
      body: `${entityName} demande une validation. Un administrateur doit approuver le compte.`,
      link,
      icon: type === 'company' ? 'Building2' : 'Users',
      metadata: { entityType: type, entityId },
    }));

    const { error } = await adminClient.from('notifications').insert(notifications);
    if (error) {
      console.error('Error notifying admins:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notified: admins.length });
  } catch (error: unknown) {
    console.error('notify-signup:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
