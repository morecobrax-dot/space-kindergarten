/* Service worker — offline support for the application shell.
 *
 * CACHE_NAME is DERIVED, not chosen. It is written here by
 * `npm run config:sync` from APP_CONFIG.id and the newest APP_UPDATES entry
 * in index.html, and `npm run config:verify` fails if the two ever drift.
 * Never hand-edit it: the cache name is what separates this app from every
 * other app deployed on the same origin, and a stale one serves old code.
 *
 * Publishing a new version means adding an APP_UPDATES entry and running
 * config:sync. That bumps the version, the cache name changes, and phones
 * pick up the new code.
 *
 * This only ever caches application CODE. Everything a person creates lives
 * in localStorage under the app's own namespace and is never touched here —
 * clearing these caches cannot lose a single record.
 */

/* APP-CACHE-BEGIN */
const CACHE_NAME = 'space-kindergarten-v0.4.0';
/* APP-CACHE-END */

/* The precache list is derived too — from ASSET_REGISTRY in index.html — by
 * the same `npm run config:sync`. cache.addAll() is all-or-nothing: one
 * missing file and nothing is cached, so the app silently stops working
 * offline. Deriving the list, and refusing to sync when a registered file
 * does not exist, is what keeps that from happening. */
/* APP-ASSETS-BEGIN */
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/backgrounds/space.webp',
  './assets/backgrounds/stars-far.webp',
  './assets/backgrounds/stars-near.webp',
  './assets/horizons/earth.webp',
  './assets/horizons/moon.webp',
  './assets/horizons/mercury.webp',
  './assets/places/station-outside.webp',
  './assets/places/station-inside.webp',
  './assets/planets/earth.webp',
  './assets/planets/moon.webp',
  './assets/planets/moon-lit.webp',
  './assets/planets/mercury.webp',
  './assets/planets/mercury-lit.webp',
  './assets/props/beacon.webp',
  './assets/props/beacon-lit.webp',
  './assets/props/radar.webp',
  './assets/props/radar-on.webp',
  './assets/props/meteor-field.webp',
  './assets/props/meteor-field-on.webp',
  './assets/props/letter-stone.webp',
  './assets/props/beat-stone.webp',
  './assets/props/meteor.webp',
  './assets/props/meteor-lit.webp',
  './assets/props/star.webp',
  './assets/props/cloud-a.webp',
  './assets/props/cloud-b.webp',
  './assets/props/cloud-c.webp',
  './assets/props/asteroid-a.webp',
  './assets/props/asteroid-b.webp',
  './assets/props/asteroid-c.webp',
  './assets/pictures/apple.webp',
  './assets/pictures/banana.webp',
  './assets/pictures/bee.webp',
  './assets/pictures/cake.webp',
  './assets/pictures/car.webp',
  './assets/pictures/rock.webp',
  './assets/pictures/snake.webp',
  './assets/pictures/sock.webp',
  './assets/pictures/spoon.webp',
  './assets/pictures/tomato.webp',
  './assets/pictures/tree.webp',
  './assets/rocket/rocket.webp',
  './assets/rocket/rocket-paint.webp',
  './assets/rocket/flame.webp',
  './assets/rocket/gear-star.webp',
  './assets/rocket/gear-moon.webp',
  './assets/rocket/gear-antenna.webp',
  './assets/rocket/gear-lights.webp',
  './assets/rocket/gear-booster.webp',
  './assets/rocket/gear-wings.webp',
  './assets/characters/pip.webp',
  './icon-192.png',
  './icon-512.png'
];
/* APP-ASSETS-END */

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      /* A failed precache must not block activation — the app still works
         online, and the fetch handler will fill the cache as it goes. */
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        /* Only this app's own older caches. A cache belonging to another app
           on the same origin is left completely alone — deleting by anything
           looser than this prefix is how one deployment wipes another. */
        keys.filter(k => k !== CACHE_NAME && k.indexOf(cachePrefix()) === 0)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function cachePrefix(){
  const cut = CACHE_NAME.lastIndexOf('-v');
  return cut === -1 ? CACHE_NAME : CACHE_NAME.slice(0, cut + 2);
}

/* Network-first for the shell, so a freshly deployed update is picked up as
 * soon as there is a connection, with the cache as the offline fallback. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  if(new URL(req.url).origin !== location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
