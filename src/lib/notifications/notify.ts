/**
 * Notification Helper
 * Creates persistent notifications in DB + sends push
 */
import { createClient } from '@/lib/supabase/server';
import { sendPushToMany, type PushPayload } from './push-service';

interface NotifyParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  icon?: string;
  metadata?: Record<string, any>;
  sendPush?: boolean;
}

/**
 * Send notification to a single user (DB + optional push)
 */
export async function notifyUser(params: NotifyParams) {
  const supabase = await createClient();

  // 1. Insert in DB
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link || null,
      icon: params.icon || null,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('[Notify] DB error:', error.message);
    return null;
  }

  // 2. Send push notification
  if (params.sendPush !== false) {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', params.userId)
      .eq('is_active', true);

    if (subscriptions && subscriptions.length > 0) {
      const pushPayload: PushPayload = {
        title: params.title,
        body: params.body,
        url: params.link || '/',
        tag: params.type,
        data: { notificationId: notification.id, ...params.metadata },
      };

      const result = await sendPushToMany(subscriptions, pushPayload);

      // Deactivate expired subscriptions
      if (result.failed > 0) {
        // Could cleanup dead subscriptions here
      }
    }
  }

  return notification;
}

/**
 * Send notification to multiple users
 */
export async function notifyUsers(userIds: string[], params: Omit<NotifyParams, 'userId'>) {
  const results = await Promise.allSettled(
    userIds.map(userId => notifyUser({ ...params, userId }))
  );
  return results;
}

/**
 * Send notification to all admins
 */
export async function notifyAdmins(params: Omit<NotifyParams, 'userId'>) {
  const supabase = await createClient();
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (!admins || admins.length === 0) return [];

  return notifyUsers(admins.map(a => a.id), params);
}
