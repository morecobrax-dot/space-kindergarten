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
const CACHE_NAME = 'space-kindergarten-v0.6.0';
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
  './assets/horizons/mars.webp',
  './assets/places/station-outside.webp',
  './assets/places/station-inside.webp',
  './assets/planets/earth.webp',
  './assets/planets/moon.webp',
  './assets/planets/moon-lit.webp',
  './assets/planets/mercury.webp',
  './assets/planets/mercury-lit.webp',
  './assets/planets/mars.webp',
  './assets/planets/mars-lit.webp',
  './assets/props/beacon.webp',
  './assets/props/beacon-lit.webp',
  './assets/props/radar.webp',
  './assets/props/radar-on.webp',
  './assets/props/meteor-field.webp',
  './assets/props/meteor-field-on.webp',
  './assets/props/scanner.webp',
  './assets/props/scanner-on.webp',
  './assets/props/workshop.webp',
  './assets/props/workshop-on.webp',
  './assets/props/pedestal.webp',
  './assets/props/letter-stone.webp',
  './assets/props/slate.webp',
  './assets/props/slate-on.webp',
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
  './assets/pictures/map.webp',
  './assets/pictures/fan.webp',
  './assets/pictures/hat.webp',
  './assets/pictures/cat.webp',
  './assets/pictures/cap.webp',
  './assets/pictures/pan.webp',
  './assets/pictures/sun.webp',
  './assets/pictures/nut.webp',
  './assets/pictures/rug.webp',
  './assets/pictures/cup.webp',
  './assets/pictures/bus.webp',
  './assets/pictures/bug.webp',
  './assets/pictures/net.webp',
  './assets/pictures/fish.webp',
  './assets/pictures/pumpkin.webp',
  './assets/pictures/umbrella.webp',
  './assets/pictures/cupcake.webp',
  './assets/rocket/rocket.webp',
  './assets/rocket/rocket-paint.webp',
  './assets/rocket/flame.webp',
  './assets/rocket/gear-star.webp',
  './assets/rocket/gear-moon.webp',
  './assets/rocket/gear-antenna.webp',
  './assets/rocket/gear-lights.webp',
  './assets/rocket/gear-booster.webp',
  './assets/rocket/gear-wings.webp',
  './assets/characters/pip.webp'
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
      .then(keys => {
        /* Only this app's own older caches. A cache belonging to another app
           on the same origin is left completely alone — deleting by anything
           looser than this prefix is how one deployment wipes another. */
        const older = keys.filter(k => k !== CACHE_NAME && k.indexOf(cachePrefix()) === 0);
        return carryPictures(older).then(() => Promise.all(older.map(k => caches.delete(k))));
      })
      .then(() => self.clients.claim())
  );
});

/* A picture the precache does not hold (a world's pictures, fetched when
 * its route came near) is carried from an older cache into this one before
 * that cache goes, so an update never takes a world away offline. Only
 * pictures under assets/, only ones this cache lacks; the fetch handler
 * refreshes them from the network whenever there is one. A failure here
 * never stops the update. */
function carryPictures(older){
  const precached = new Set(ASSETS.map(p => new URL(p, self.location.href).href));
  return caches.open(CACHE_NAME).then(fresh => Promise.all(older.map(name =>
    caches.open(name).then(old => old.keys().then(reqs => Promise.all(reqs
      .filter(req => !precached.has(req.url) && new URL(req.url).pathname.indexOf('/assets/') !== -1)
      .map(req => fresh.match(req).then(have => have || old.match(req).then(res => (res ? fresh.put(req, res) : null))))))))))
    .catch(() => {});
}

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
