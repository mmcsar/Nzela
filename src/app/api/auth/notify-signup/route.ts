import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Notifie les admins lors d'une nouvelle inscription company ou broker.
 * Utilise le service role pour contourner RLS (le nouvel inscrit ne peut pas lire les admins).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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
