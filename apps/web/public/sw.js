// SchoolPro Service Worker v6 — Safe Next.js App Router & Vercel Deploy PWA
// Never intercepts /_next/static, /_next/data, ?_rsc= flight requests, or cross-origin traffic
// so new Vercel deploys never trigger ChunkLoadError or frozen sidebar navigation.
const STATIC_CACHE = 'schoolpro-static-v6';
const DYNAMIC_CACHE = 'schoolpro-dynamic-v6';

// Lightweight static shell assets only (avoid flooding 17 HTML routes on install)
const PRECACHE_URLS = [
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn('[SW v6] Pre-cache partial skip:', err);
        })
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Only handle same-origin requests (never interfere with Firestore, Google Fonts, CDNs, or extensions)
  if (url.origin !== self.location.origin) return;

  // NEVER intercept Next.js hashed chunks, RSC flight payloads, or API endpoints
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') === '1'
  ) {
    return;
  }

  // Same-origin static media/icons/manifest → Stale-While-Revalidate with safe catch
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone)).catch(() => {});
            }
            return response;
          })
          .catch(() => cached || new Response('', { status: 504 }));
        return cached || networkPromise;
      })
    );
    return;
  }

  // Document navigation → Network First with offline cache fallback (never serve stale HTML when online)
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/dashboard/') || caches.match('/'))
            .then(
              (fallback) =>
                fallback ||
                new Response('Offline - অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।', {
                  status: 503,
                  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                })
            )
        )
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-marks') {
    event.waitUntil(Promise.resolve());
  }
});
