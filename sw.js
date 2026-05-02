const CACHE_NAME = 'carvion-financeiro-2026-05-02-neon-sync-v26';
const CORE_ASSETS = [
  './',
  './index.html',
  './CA.RO Sistema Financeiro.html',
  './version.json',
  './manifest.json',
  './styles.css',
  './shared.css',
  './data.jsx',
  './charts.jsx',
  './tweaks-panel.jsx',
  './app.jsx',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS.map((asset) => new Request(asset, { cache: 'reload' }))))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME && key.startsWith('carvion-')).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(new Request(request, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./CA.RO Sistema Financeiro.html')))
    );
    return;
  }

  event.respondWith(
    fetch(new Request(request, { cache: 'no-store' }))
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
