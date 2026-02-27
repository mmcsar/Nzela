/**
 * Web Push Notification Service
 * Server-side: send push notifications
 */
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:info@nzelaa.com';

// Configure VAPID
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured, skipping push');
    return false;
  }

  try {
    const pushSub = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      url: payload.url || '/',
      tag: payload.tag || 'nzela-notification',
      data: payload.data || {},
    });

    await webpush.sendNotification(pushSub, pushPayload, {
      TTL: 86400, // 24 heures
      urgency: 'normal',
    });

    return true;
  } catch (error: any) {
    // 410 Gone = subscription expired
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.warn('[Push] Subscription expired:', subscription.endpoint.substring(0, 50));
      return false;
    }
    console.error('[Push] Error:', error.message);
    return false;
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendPushToMany(
  subscriptions: PushSubscription[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) sent++;
    else failed++;
  });

  return { sent, failed };
}

/**
 * Generate VAPID keys (run once)
 */
export function generateVAPIDKeys() {
  return webpush.generateVAPIDKeys();
}
