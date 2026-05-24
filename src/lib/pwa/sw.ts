import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const pwaRuntimeCaching = [
  ...defaultCache,
  {
    // Ne jamais mettre en cache les chunks Next — évite "Loading chunk XXXX failed" après déploiement
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/_next/static/'),
    handler: 'NetworkOnly',
  },
  {
    // API GET: privilegie la fraicheur, mais garde un fallback cache court
    urlPattern: ({ request, url }: { request: Request; url: URL }) =>
      request.method === 'GET' &&
      url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/api/payments/webhook'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'nzela-api-v2',
      networkTimeoutSeconds: 4,
      cacheableResponse: { statuses: [0, 200] },
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 5 * 60, // 5 minutes
      },
    },
  },
  {
    // Pages dashboard: reactivite online, fallback offline automatique
    urlPattern: ({ request, url }: { request: Request; url: URL }) =>
      request.mode === 'navigate' && url.pathname.includes('/dashboard'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'nzela-pages-v2',
      networkTimeoutSeconds: 3,
      cacheableResponse: { statuses: [0, 200] },
      expiration: {
        maxEntries: 80,
        maxAgeSeconds: 24 * 60 * 60, // 1 jour
      },
    },
  },
  {
    // Images: cache long pour fluidite mobile
    urlPattern: ({ request }: { request: Request }) => request.destination === 'image',
    handler: 'CacheFirst',
    options: {
      cacheName: 'nzela-images-v2',
      cacheableResponse: { statuses: [0, 200] },
      expiration: {
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
      },
    },
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: pwaRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Permettre au client de forcer l'activation d'une nouvelle version SW.
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ═══════════════════════════════════════
// PUSH NOTIFICATIONS HANDLER
// ═══════════════════════════════════════

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options: NotificationOptions = {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag || 'nzela-notification',
      data: {
        url: payload.url || '/',
        ...payload.data,
      },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'dismiss', title: 'Fermer' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'Nzela', options)
    );
  } catch (e) {
    // Fallback: show raw text
    event.waitUntil(
      self.registration.showNotification('Nzela', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(url);
    })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event: any) => {
  if (!event.oldSubscription) return;
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      return fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
    })
  );
});
