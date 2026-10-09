// Creative Request Portal Service Worker
const CACHE_NAME = 'portal-static-v1';
const STATIC_ASSETS = ['/favicon.ico', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network-first policy for dynamic navigation; never cache private API responses
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API, SSE streams, and authentication routes from service worker interception
  if (url.pathname.startsWith('/api') || url.pathname.includes('/stream')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Web Push event listener for PWA on iOS / Desktop
self.addEventListener('push', (event) => {
  let data = { title: 'Creative Request Portal', body: 'New workflow update received.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {}

  const options = {
    body: data.body || data.message || 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.actionUrl || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Creative Portal', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
