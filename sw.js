const CACHE = 'situp-alarm-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for everything (also caches the pose model + wasm so it works offline)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: false });
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque') && res.status !== 206) cache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => cached || (req.mode === 'navigate' ? cache.match('./index.html') : undefined));
      return cached || net;
    })
  );
});
