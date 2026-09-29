const CACHE_NAME = 'cca-pwa-v5';
const APP_SHELL = [
  './',
  './index.html',
  './car-crash-arena.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Cache external runtime assets so the game can reload offline after first use.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => cache.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && (response.ok || response.type === 'opaque')) {
            return cache.put(event.request, response.clone()).then(() => response);
          }
          return response;
        }).catch(() => cached);
      }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
