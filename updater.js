(() => {
  const VERSION_URL = '/version.json';
  const WATCH_URLS = [
    '/version.json',
    '/app.jsx',
    '/data.jsx',
    '/carvion-core.js',
    '/styles.css',
    '/dashboard',
    '/industrial',
    '/industrial/dashboard',
    '/industrial/producao',
    '/industrial/eficiencia',
    '/industrial/relatorios',
    '/industrial.jsx',
    '/industrial.css'
  ];
  const STORAGE_KEY = 'carvion.deploy.fingerprint';
  const RELOAD_FLAG = 'carvion.deploy.reloading';
  const CHECK_INTERVAL = 30000;

  const fingerprintFrom = async (response) => {
    const text = await response.clone().text();
    const etag = response.headers.get('etag') || '';
    const modified = response.headers.get('last-modified') || '';
    return `${etag}|${modified}|${text}`;
  };

  const deployFingerprint = async () => {
    const parts = [];
    for (const url of WATCH_URLS) {
      const response = await fetch(`${url}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) continue;
      const etag = response.headers.get('etag') || '';
      const modified = response.headers.get('last-modified') || '';
      const length = response.headers.get('content-length') || '';
      const text = url.endsWith('.json') ? await response.clone().text() : '';
      parts.push(`${url}:${etag}:${modified}:${length}:${text}`);
    }
    return parts.join('|');
  };

  const showUpdateBanner = () => {
    if (document.getElementById('carvion-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'carvion-update-banner';
    banner.innerHTML = '<strong>CARVION atualizado</strong><span>Nova versão publicada. Atualizando automaticamente...</span>';
    Object.assign(banner.style, {
      position: 'fixed',
      right: '18px',
      bottom: '18px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      maxWidth: '320px',
      padding: '12px 14px',
      borderRadius: '12px',
      color: 'var(--text, #fff)',
      background: 'var(--surface, #182024)',
      border: '1px solid var(--border-soft, rgba(255,255,255,.16))',
      boxShadow: '0 18px 48px rgba(0,0,0,.38)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px'
    });
    document.body.appendChild(banner);
  };

  const hardReload = async () => {
    if (sessionStorage.getItem(RELOAD_FLAG) === '1') return;
    sessionStorage.setItem(RELOAD_FLAG, '1');
    showUpdateBanner();
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));
    }
    setTimeout(() => location.reload(), 1200);
  };

  const checkVersion = async ({ initial = false } = {}) => {
    try {
      const fingerprint = await deployFingerprint();
      if (!fingerprint) return;
      const current = localStorage.getItem(STORAGE_KEY);
      if (!current) {
        localStorage.setItem(STORAGE_KEY, fingerprint);
        sessionStorage.removeItem(RELOAD_FLAG);
        return;
      }
      if (current !== fingerprint) {
        localStorage.setItem(STORAGE_KEY, fingerprint);
        if (!initial) await hardReload();
      } else {
        sessionStorage.removeItem(RELOAD_FLAG);
      }
    } catch {
      // Offline or deploy warming up. Try again on the next interval.
    }
  };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
        registration.update().catch(() => undefined);
      } catch {
        // Keep the app working even if SW registration fails.
      }
      await checkVersion({ initial: true });
      setInterval(checkVersion, CHECK_INTERVAL);
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem(RELOAD_FLAG) !== '1') hardReload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'CARVION_SW_ACTIVE') checkVersion();
    });
  } else {
    window.addEventListener('load', () => {
      checkVersion({ initial: true });
      setInterval(checkVersion, CHECK_INTERVAL);
    });
  }
})();
