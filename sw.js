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
const CACHE_NAME = 'space-kindergarten-v0.6.3';
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

/* The version this worker serves, from its cache name ('…-v0.6.1' → '0.6.1'). */
const VERSION = CACHE_NAME.slice(CACHE_NAME.lastIndexOf('-v') + 2);
/* Every file this version installs, as full URLs. */
const PRECACHED = new Set(ASSETS.map(p => new URL(p, self.location.href).href));

/* Installing: everything the app needs, fresh from the server — never from
 * the browser's own HTTP cache, which could hand a new version an old file.
 * If any of it cannot be fetched, the install FAILS: a half-filled cache
 * must never replace a version that works offline. The version already
 * working stays, and the browser tries again at its next update check. With
 * no version working yet, the app still works online meanwhile.
 *
 * A new version does not take over by itself. It waits until the app says
 * the moment is quiet (index.html, "UPDATES": never mid-mission, mid-letter
 * or mid-flight) and asks it to. With no version working yet — a first
 * install — there is nothing to wait for, and it starts at once. */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
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
  return caches.open(CACHE_NAME).then(fresh => Promise.all(older.map(name =>
    caches.open(name).then(old => old.keys().then(reqs => Promise.all(reqs
      .filter(req => !PRECACHED.has(req.url) && new URL(req.url).pathname.indexOf('/assets/') !== -1)
      .map(req => fresh.match(req).then(have => (have && have.ok) || old.match(req).then(res => (res && res.ok ? fresh.put(req, res) : null))))))))))
    .catch(() => {});
}

function cachePrefix(){
  const cut = CACHE_NAME.lastIndexOf('-v');
  return cut === -1 ? CACHE_NAME : CACHE_NAME.slice(0, cut + 2);
}

/* What the app may ask of its worker, each answered on the port it sends:
 *   version   which version this worker serves, so the app can tell a
 *             newer version from its own
 *   activate  take over now: the app has found a quiet moment
 *   keep      store these pictures for offline play, and say which this
 *             cache now holds — "asked for" is not "kept" */
self.addEventListener('message', event => {
  const msg = event.data || {};
  const reply = data => { const port = event.ports && event.ports[0]; if(port) port.postMessage(data); };
  if(msg.type === 'version') reply({ version: VERSION });
  else if(msg.type === 'activate') event.waitUntil(self.skipWaiting().then(() => reply({ activating: true })));
  else if(msg.type === 'keep') event.waitUntil(keepPictures(msg.paths).then(kept => reply({ kept: kept })));
});

/* Only this app's own pictures: a path under assets/ on this origin. Each
 * is fetched fresh unless this cache already holds it, stored, and then
 * looked up again: only a picture the cache really holds is reported kept.
 * One that cannot be fetched now is simply not in the answer; the app asks
 * again later. */
function keepPictures(paths){
  const wanted = (Array.isArray(paths) ? paths : []).map(p => {
    try{ const url = new URL(String(p), self.location.href); return url.origin === location.origin && url.pathname.indexOf('/assets/') !== -1 ? { p: p, url: url.href } : null; }
    catch(e){ return null; }
  }).filter(Boolean);
  return caches.open(CACHE_NAME).then(cache => Promise.all(wanted.map(w =>
    cache.match(w.url)
      .then(hit => (hit && hit.ok) || fetch(w.url, { cache: 'no-cache' }).then(res => (res && res.ok ? cache.put(w.url, res) : null)))
      .then(() => cache.match(w.url))
      .then(hit => (hit && hit.ok ? w.p : null), () => null))))
    .then(list => list.filter(Boolean), () => []);
}

/* Network-first for the shell, so a freshly deployed update is picked up as
 * soon as there is a connection, with the cache as the offline fallback.
 * The page itself is asked of the server every time (no-cache): a copy
 * still in the browser's HTTP cache must not bring an old version back
 * after an update. What the network brings is kept only when it is a good
 * answer for a file this version did not install (a world's picture): the
 * installed page and pictures stay exactly this version's, so offline
 * never mixes a newer page with an older worker, even when a newer
 * version's install failed. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  if(new URL(req.url).origin !== location.origin) return;

  event.respondWith(
    (req.mode === 'navigate' ? fetch(req, { cache: 'no-cache' }) : fetch(req))
      .then(res => {
        /* a server error must never stand in for a file when the network is
           gone, and an installed file is never overwritten by another version */
        if(res.ok && req.mode !== 'navigate' && !PRECACHED.has(req.url)){
          const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
