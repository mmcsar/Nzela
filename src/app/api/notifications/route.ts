import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// ── GET - Liste des notifications (DB persistante) ──
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Essayer d'abord la table notifications
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: dbNotifications, error: dbError } = await query;

    // Si la table existe et a des donnees
    if (!dbError && dbNotifications) {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      return NextResponse.json({
        notifications: dbNotifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.body,
          read: n.read,
          created_at: n.created_at,
          link: n.link,
          icon: n.icon,
          data: n.metadata,
        })),
        unreadCount: count || 0,
      });
    }

    // Fallback: generer depuis activites recentes (si table pas encore creee)
    const notifications: any[] = [];

    const { data: recentLoads } = await supabase
      .from('loads')
      .select('id, cargo_type, status, created_at, origin, destination')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentLoads) {
      for (const load of recentLoads) {
        let origin = '', destination = '';
        try {
          const o = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
          const d = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;
          origin = o?.city || '';
          destination = d?.city || '';
        } catch {}

        if (load.status === 'available') {
          notifications.push({
            id: `load-${load.id}`, type: 'load_new',
            title: 'Nouveau chargement', message: `${load.cargo_type || 'Marchandise'} de ${origin} a ${destination}`,
            read: false, created_at: load.created_at, data: { loadId: load.id },
          });
        }
      }
    }

    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const filtered = unreadOnly ? notifications.filter(n => !n.read) : notifications;

    return NextResponse.json({
      notifications: filtered.slice(0, limit),
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PUT - Marquer comme lu ──
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      return NextResponse.json({ success: true, message: 'Toutes les notifications marquees comme lues' });
    }

    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'notificationId ou markAllRead requis' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
