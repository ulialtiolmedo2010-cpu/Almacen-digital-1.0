const CACHE_NAME = 'almacen-digital-v1';

// Evento de instalación
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Estrategia de red primero, si falla intenta cache (para no romper peticiones dinámicas/API)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
