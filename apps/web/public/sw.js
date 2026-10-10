// SchoolPro Service Worker v3 — Teacher Mobile-First PWA
const CACHE_NAME = 'schoolpro-v3';
const STATIC_CACHE = 'schoolpro-static-v3';
const DYNAMIC_CACHE = 'schoolpro-dynamic-v3';

// Pre-cache critical app shell routes
const PRECACHE_URLS = [
  '/',
  '/login',
  '/teacher-login',
  '/dashboard',
  '/dashboard/teacher-portal',
  '/dashboard/exam/mark-entry',
  '/dashboard/exam/bulk-entry',
  '/dashboard/academic/attendance',
  '/dashboard/teacher',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install — pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure (ok for dev):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// - Static assets → Cache First
// - Navigation (HTML) → Network First with cache fallback
// - API calls → Network Only
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Static assets (JS, CSS, images, fonts) → Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML navigation → Network First, cache fallback
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/login')))
    );
    return;
  }
});

// Background Sync for offline mark entry
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-marks') {
    event.waitUntil(syncPendingMarks());
  }
});

async function syncPendingMarks() {
  // In a real server scenario, this would POST to server
  // For localStorage-based app, sync is handled client-side
  console.log('[SW] Background sync triggered for marks');
}
