/* Keep the entire app shell together until the user chooses to update. */
const CACHE_PREFIX = 'bauernschnapsen-app-';
const CACHE = `${CACHE_PREFIX}v26-20261021`;
const ASSETS = [
  './', './index.html', './style.css', './announcement-stats.js', './app.js', './pwa.js',
  './redesign.css', './redesign.js', './accessibility.js', './manifest.webmanifest', './icon.svg',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png'
];
const assetURLs = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(ASSETS.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE && (
      key.startsWith(CACHE_PREFIX) || key.startsWith('schnapsen-threeplayer-')
    )).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(new URL('./index.html', scope).href)) || fetch(request)
    ));
    return;
  }

  // Requests outside the known shell keep their normal network behavior.
  url.search = '';
  url.hash = '';
  if (!assetURLs.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache =>
    (await cache.match(url.href)) || fetch(request)
  ));
});
