const APP_VERSION = '1.0.5';
const CACHE_NAME = `sternenarchiv-${APP_VERSION}`;

const PRECACHE_URLS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache the HTML document itself — always go to network.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/' ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache Firebase / Firestore / Google auth requests.
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('gstatic.com') && url.pathname.includes('firebasejs') ||
    url.hostname.includes('google.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Only same-origin, precached static assets (icons, manifest) use cache-first.
  if (url.origin === self.location.origin && PRECACHE_URLS.some((p) => url.pathname.endsWith(p.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Default: network, no caching.
  event.respondWith(fetch(event.request));
});
