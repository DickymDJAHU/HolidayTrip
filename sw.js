const CACHE = 'trip-itinerary-v10';
const FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for the app shell; for everything else (including the Firebase
// library loaded from gstatic.com) — serve from cache if we have it, but also
// fetch in the background and save the result for next time. This way the
// Firebase SDK itself becomes available offline after the first successful
// online load, not just our own 5 files.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});