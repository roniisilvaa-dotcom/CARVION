const CACHE_NAME = 'carvion-financeiro-2026-05-03-render-loader-v36';
const LOADING_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f5faf7">
  <meta name="color-scheme" content="light">
  <title>CARVION carregando</title>
  <style>
    html, body { min-height: 100%; margin: 0; background: #f5faf7; font-family: -apple-system, BlinkMacSystemFont, "Inter", Arial, sans-serif; color: #14211a; }
    body { display: grid; place-items: center; }
    .box { display: grid; justify-items: center; gap: 13px; padding: 24px; text-align: center; }
    .mark { width: 76px; height: 76px; border-radius: 22px; display: grid; place-items: center; background: linear-gradient(135deg, #33d17a, #35a7ff); color: #06130d; font-size: 25px; font-weight: 900; box-shadow: 0 18px 45px rgba(18, 116, 70, .18); animation: pulse 1.25s ease-in-out infinite; }
    .name { font-size: 25px; font-weight: 850; letter-spacing: .14em; }
    .bar { width: 190px; height: 4px; border-radius: 999px; overflow: hidden; background: #dfeee6; }
    .bar:before { content: ""; display: block; width: 46%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #33d17a, #35a7ff); animation: load 1.1s ease-in-out infinite; }
    .hint { font-size: 13px; color: #607568; }
    @keyframes pulse { 50% { transform: scale(1.04); filter: brightness(1.06); } }
    @keyframes load { from { transform: translateX(-120%); } to { transform: translateX(245%); } }
  </style>
</head>
<body>
  <div class="box">
    <div class="mark">CR</div>
    <div class="name">CARVION</div>
    <div class="bar"></div>
    <div class="hint">Carregando o sistema...</div>
  </div>
  <script>setTimeout(function(){ location.reload(); }, 2500);</script>
</body>
</html>`;
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
      Promise.race([
        fetch(new Request(request, { cache: 'no-store' })),
        new Promise((resolve) => setTimeout(() => resolve(new Response(LOADING_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-CARVION-Fallback': '1' },
        })), 900)),
      ])
        .then((response) => {
          if (response?.headers?.get('X-CARVION-Fallback') === '1') return response;
          if (!response || !response.ok || !String(response.headers.get('content-type') || '').includes('text/html')) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./CA.RO Sistema Financeiro.html') || new Response(LOADING_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        })))
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
