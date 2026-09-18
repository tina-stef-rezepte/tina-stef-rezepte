const CACHE_NAME = 'tina-stef-rezepte-shell-v2';

const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Nur Anfragen an den GitHub-Pages-Wrapper behandeln.
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML / Navigation immer zuerst aktuell aus dem Netz laden.
  // Nur wenn keine Verbindung besteht, auf einen vorhandenen Cache zurückfallen.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() =>
          caches.match('./index.html').then(cached =>
            cached || caches.match('./')
          )
        )
    );
    return;
  }

  // Icons und Manifest dürfen aus dem Cache kommen.
  event.respondWith(
    caches.match(request).then(cached =>
      cached ||
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
    )
  );
});
