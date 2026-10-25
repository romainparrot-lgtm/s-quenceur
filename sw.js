// Séquenceur de pince : mode hors ligne.
// Pour publier une nouvelle version de l'appli, change le numéro ci-dessous (v6 -> v7...).
// Tant que ce numéro ne change pas, l'appli ne retélécharge rien : tout vient du téléphone.
const CACHE = 'seqbois-v7';
const FILES = ['./', './index.html', './manifest.json', './mode-emploi.html',
  './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

// false = test sans les polices Google (repli sur la police du téléphone hors ligne).
// true  = garde aussi en mémoire les polices Google après une première ouverture en ligne.
const CACHE_FONTS = false;

self.addEventListener('install', e => {
  // cache:'reload' = on récupère bien la version fraîche sur le serveur, pas une copie du navigateur.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache d'abord : si le fichier est dans le téléphone, on le sert sans aucun accès réseau.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !(CACHE_FONTS && isFont)) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
