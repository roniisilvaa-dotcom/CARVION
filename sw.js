const CACHE_PREFIX = 'carvion-cache-';
const STATIC_CACHE = `${CACHE_PREFIX}2026-04-30-sector-dashboards-v1`;
const CORE_ASSETS = [
  '/',
  '/dashboard',
  '/CARVION.html',
  '/index.html',
  '/styles.css',
  '/shared.css',
  '/carvion-core.js',
  '/data.jsx',
  '/charts.jsx',
  '/app.jsx',
  '/industrial',
  '/industrial/index.html',
  '/industrial/dashboard',
  '/industrial/dashboard.html',
  '/industrial/producao',
  '/industrial/producao.html',
  '/industrial/produtos',
  '/industrial/produtos.html',
  '/industrial/eficiencia',
  '/industrial/eficiencia.html',
  '/industrial/relatorios',
  '/industrial/relatorios.html',
  '/industrial.jsx',
  '/industrial.css',
  '/auth/login.html',
  '/auth/auth.css',
  '/version.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS.map((asset) => new Request(asset, { cache: 'reload' }))))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'CARVION_SW_ACTIVE' })))
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put('/CARVION.html', copy));
          return response;
        })
        .catch(() => caches.match('/CARVION.html'))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
