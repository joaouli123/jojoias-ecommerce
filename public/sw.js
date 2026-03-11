const CACHE_NAME = 'luxijoias-v2';
const OFFLINE_URLS = ['/', '/brands', '/rastreio', '/manifest.webmanifest'];

function isCacheableRequest(requestUrl) {
  if (!requestUrl) return false;

  const protocol = requestUrl.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return false;
  }

  if (requestUrl.origin !== self.location.origin) {
    return false;
  }

  return true;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (!isCacheableRequest(requestUrl)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match('/'));
    })
  );
});
