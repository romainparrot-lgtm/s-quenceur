// Séquenceur de pince : mode hors ligne.
// Pour publier une nouvelle version de l'appli, change le numéro ci-dessous (v1 -> v2...).
const CACHE = 'seqbois-v1';
const FILES = ['./', './index.html', './manifest.json',
  './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

// false = test sans les polices Google (repli sur la police du téléphone hors ligne).
// true  = garde aussi en mémoire les polices Google après une première ouverture en ligne.
const CACHE_FONTS = false;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !(CACHE_FONTS && isFont)) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const refresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || caches.match('./index.html'));
      e.waitUntil(refresh.catch(() => {}));
      return hit || refresh;
    })
  );
});
