
const CACHE_NAME = 'ebf-manage-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx'
];

self.addEventListener('install', (event) => {
  // Forcer l'activation immédiate
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Prendre le contrôle immédiatement
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
