/* =========================================================
   CONTRACTS
   ---------------------------------------------------------
   High-value contracts, not test volume. Every assertion here
   defends something that would otherwise have to be rediscovered:
   a namespace collision, a scroll lock that leaks, a star awarded
   twice, a wrong answer that costs a child something.

   Contracts 1–19 came with the foundation. Where one exercised the
   starter's demo (tabs, an Item form), it has been retargeted at
   this product's equivalent and still guards the same failure.
   Contracts 20 onward are Space Kindergarten's own.

   Each contract states what it protects, in the language of the
   failure it prevents. If an assertion cannot be described that
   way, it probably should not exist.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./harness.js');

let pass = 0, fail = 0;
const failures = [];

function T(name, cond, detail){
  if(cond){ pass++; }
  else { fail++; failures.push(name + (detail ? ' — ' + detail : '')); }
  console.log('  ' + (cond ? 'PASS' : 'FAIL') + '  ' + name + (cond || !detail ? '' : ' — ' + detail));
}
function section(t){ console.log('\n' + '='.repeat(64) + '\n  ' + t + '\n' + '='.repeat(64)); }
function sub(t){ console.log('\n  --- ' + t + ' ---'); }

function results(){ return { pass, fail, failures }; }
function reset(){ pass = 0; fail = 0; failures.length = 0; }

/* ---------- shared helpers ---------- */
function open(app, id){ app.ctx.openOverlay(id); app.ctx.__flush(); }
function close(app, id){ app.ctx.closeOverlay(id); app.ctx.__flush(); }
function css(){ return H.styleBlock(H.readApp()); }
function js(){ return H.mainScript(H.readApp()); }
/* Comments explain the rules; they must not be mistaken for breaking them. */
function stripComments(s){
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
/* The body of one top-level function, found by its declaration. */
function fnBody(src, name){
  const at = src.indexOf('function ' + name + '(');
  if(at === -1) return '';
  const open = src.indexOf('{', at);
  let depth = 0;
  for(let i = open; i < src.length; i++){
    if(src[i] === '{') depth++;
    else if(src[i] === '}'){ depth--; if(depth === 0) return src.slice(at, i + 1); }
  }
  return '';
}

/* Width and height from a PNG or WebP header, without decoding it. */
function imageSize(file){
  const b = fs.readFileSync(file);
  if(b.length > 24 && b.readUInt32BE(0) === 0x89504E47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if(b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'){
    const kind = b.toString('ascii', 12, 16);
    if(kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if(kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3FFF, b.readUInt16LE(28) & 0x3FFF];
    if(kind === 'VP8L'){ const bits = b.readUInt32LE(21); return [1 + (bits & 0x3FFF), 1 + ((bits >>> 14) & 0x3FFF)]; }
  }
  return null;
}

/* Timings collapse to zero so a whole journey runs in milliseconds. The
   values themselves are asserted elsewhere; here only the order matters. */
function fast(c){
  Object.assign(c.TIMING, {
    travel: 0, travelFirst: 0, travelReduced: 0, travelSettle: 0,
    praiseMin: 0, betweenRounds: 0, celebrateGuard: 0, starEvery: 0, starFirst: 0,
    reprompt: 1e9, idleHint: 1e9, captionBase: 0, captionPerChar: 0,
    speechStartGrace: 5, speechSafetyBase: 40, speechSafetyPerChar: 0
  });
  return c;
}

/* A speech engine that records what it was asked to say and finishes each
   line on the next tick — enough for the app to believe it was heard. */
function fakeSpeech(){
  const said = [];
  const utterances = [];
  let cancels = 0;
  function Utterance(text){ this.text = text; }
  const synth = {
    paused: false,
    speak(u){ said.push(u.text); utterances.push(u); setTimeout(() => { if(u.onstart) u.onstart(); if(u.onend) u.onend(); }, 0); },
    cancel(){ cancels++; },
    resume(){},
    getVoices(){ return [{ name: 'Test', lang: 'en-US', voiceURI: 'test', localService: true }]; }
  };
  return { said, utterances, cancels: () => cancels, extras: { speechSynthesis: synth, SpeechSynthesisUtterance: Utterance } };
}
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

/* Plays the current mission to the end: `wrongFirst` rounds are answered
   wrongly until the answer is shown, every other round correctly. */
async function playMission(c, opts){
  const o = opts || {};
  let guard = 0;
  while(c.currentScene === 'mission' && c.session.run && guard++ < 80){
    const r = c.session.run.round;
    if(!r) break;
    if((o.wrongRounds || []).indexOf(r.index) !== -1 && r.misses < 2){
      const wrong = r.options.map((_, i) => i).find(i => i !== r.answer && r.out.indexOf(i) === -1);
      await c.choose(wrong);
      continue;
    }
    await c.choose(r.answer);
  }
}

/* =========================================================
   CONTRACT 1 — BOOT
   The app starts, says so, and fails loudly rather than blankly.
   ========================================================= */
function testBoot(){
  section('CONTRACT 1 — the application boots');
  const app = H.loadApp();

  sub('a clean start');
  T('boots with no console errors', app.errors.length === 0, app.errors.join(' | '));
  T('the app container is revealed', app.dom.document.getElementById('app').style.display === '');
  T('storage is available and reports itself persistent', app.ctx.Store.isPersistent());
  T('a first run records the schema version',
    app.storage.getItem(app.ctx.STORAGE_NAMESPACE + 'sys.schemaVersion') === String(app.ctx.DATA_SCHEMA_VERSION));
  T('a first run writes nothing else', app.storage._map.size === 1, String(app.storage._map.size));
  T('a first launch opens on the welcome, where the first tap also unlocks sound',
    app.ctx.currentScene === 'welcome');

  sub('booting on top of existing progress');
  const shared = new Map();
  const seeded = H.loadApp({ sharedStorage: shared });
  const c = seeded.ctx;
  c.ensureProfile();
  const run = c.startRun('moon-1', new Date('2026-09-26T10:00:00Z'), 'run_boot');
  c.journey.completions = [c.completionRecord(run, new Date('2026-09-26T10:05:00Z'))];
  c.saveCompletions();
  c.journey.stars = c.awardStars([], 'run_boot', 3, '2026-09-26T10:05:00Z').ledger;
  c.saveStars();
  const second = H.loadApp({ sharedStorage: shared });
  T('a finished mission survives a reload', second.ctx.journey.completions.length === 1);
  T('and so do its stars', second.ctx.starBalance(second.ctx.journey.stars) === 3);
  T('a returning explorer opens on Earth, not the welcome', second.ctx.currentScene === 'earth');
  T('reloading raises no errors', second.errors.length === 0, second.errors.join(' | '));

  sub('there is only one script block, so the suite sees all the code');
  const blocks = H.scriptBlocks(H.readApp()).filter(b => b.trim().length > 200);
  T('exactly one substantial <script> block', blocks.length === 1, String(blocks.length));
  T('boot is wrapped so a failure still reports itself',
    /catch\(err\)\{[\s\S]{0,400}could not start/.test(js()));
}

/* =========================================================
   CONTRACT 2 — CONFIGURATION
   One source of identity, and static files that cannot drift.
   ========================================================= */
function testConfig(){
  section('CONTRACT 2 — application identity has one source');
  const app = H.loadApp();
  const c = app.ctx;
  const cfg = c.APP_CONFIG;

  sub('APP_ID is valid, and invalid ids are refused rather than repaired');
  T('the shipped id passes validation', c.validateAppId(cfg.id) === null);
  const bad = {
    'empty': '', 'uppercase': 'App-Starter', 'spaces': 'app starter',
    'leading digit': '1app', 'trailing hyphen': 'app-', 'double hyphen': 'app--starter',
    'underscore': 'app_starter', 'dot': 'app.starter', 'slash': 'app/starter',
    'too long': 'a'.repeat(41), 'not a string': 42
  };
  Object.keys(bad).forEach(label => {
    T('rejects ' + label, typeof c.validateAppId(bad[label]) === 'string');
  });
  T('a valid multi-word id is accepted', c.validateAppId('personal-savings') === null);

  sub('every namespace is derived, never typed twice');
  T('storage prefix derives from the id', c.STORAGE_NAMESPACE === cfg.id + '.');
  T('cache name derives from the id and the version',
    c.CACHE_NAMESPACE === cfg.id + '-v' + c.APP_VERSION);
  T('the version derives from the newest release entry',
    c.APP_VERSION === c.APP_UPDATES[0].version);

  sub('static files match APP_CONFIG — they cannot read it at runtime');
  const man = H.readManifest();
  T('manifest name', man.name === cfg.name, man.name);
  T('manifest short_name', man.short_name === cfg.shortName, man.short_name);
  T('manifest description', man.description === cfg.description);
  T('manifest theme_color', man.theme_color === cfg.themeColor, man.theme_color);
  T('manifest background_color', man.background_color === cfg.backgroundColor);
  T('manifest orientation', man.orientation === cfg.orientation, man.orientation);

  const sw = H.readSW();
  T('service-worker cache name', sw.indexOf("'" + c.CACHE_NAMESPACE + "'") !== -1, c.CACHE_NAMESPACE);

  const pkg = H.readPkg();
  T('package name', pkg.name === cfg.id, pkg.name);
  T('package version', pkg.version === c.APP_VERSION, pkg.version);

  /* Compared through the same escape the sync applies, so a product whose
     name contains & " or < is not reported as drift for being correct. */
  const src = H.readApp();
  const esc = require('../scripts/config.js').esc;
  T('document title', src.indexOf('<title>' + esc(cfg.name) + '</title>') !== -1);
  T('theme-color meta', src.indexOf('content="' + esc(cfg.themeColor) + '"') !== -1);
  T('apple web app title', src.indexOf('content="' + esc(cfg.shortName) + '"') !== -1);
  T('the title markup carries the derived name, not a stale copy',
    new RegExp('<h1 class="app-title" id="appTitle">' +
      esc(cfg.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</h1>').test(src));

  sub('a name that needs escaping survives every target intact');
  const hostile = 'Ben & Co "Ltd" <beta>';
  T('escaping is applied, not stripped',
    esc(hostile) === 'Ben &amp; Co &quot;Ltd&quot; &lt;beta>');
  T('the manifest holds the raw value, because JSON escapes differently',
    JSON.parse(JSON.stringify({ n: hostile })).n === hostile);

  sub('changing the id changes everything downstream');
  ['other-app', 'client-demo', 'personal-savings'].forEach(id => {
    const o = H.loadApp({ appId: id });
    T(id + ' → storage prefix', o.ctx.STORAGE_NAMESPACE === id + '.');
    T(id + ' → cache name', o.ctx.CACHE_NAMESPACE === id + '-v' + o.ctx.APP_VERSION);
    T(id + ' → validates', o.ctx.validateAppId(id) === null);
  });
}

/* =========================================================
   CONTRACT 3 — STORAGE
   Namespacing is the only thing keeping two deployments on one
   origin from reading each other's data.
   ========================================================= */
function testStorage(){
  section('CONTRACT 3 — storage is namespaced and honest');
  const app = H.loadApp();
  const c = app.ctx;

  sub('every key the app writes carries its namespace');
  c.Store.set('data.probe', 'x');
  c.Store.setJSON('ui.probe', { a: 1 });
  const raw = [...app.storage._map.keys()];
  T('no key escapes the prefix',
    raw.every(k => k.indexOf(c.STORAGE_NAMESPACE) === 0), raw.filter(k => k.indexOf(c.STORAGE_NAMESPACE) !== 0).join(','));
  T('no bare generic key is used',
    !raw.some(k => /^(settings|data|history|draft|user|userData|items|stars|progress)$/.test(k)));

  sub('read, write, delete');
  T('a value round-trips', c.Store.get('data.probe') === 'x');
  T('JSON round-trips', c.Store.getJSON('ui.probe', null).a === 1);
  c.Store.remove('data.probe');
  T('a removed key is gone', c.Store.get('data.probe') === null);

  sub('absent data stays absent — a missing key is a new user, not a broken one');
  T('a missing key reads null', c.Store.get('nothing.here') === null);
  T('a missing key does not get invented', app.storage.getItem(c.STORAGE_NAMESPACE + 'nothing.here') === null);
  T('getJSON returns the caller fallback, not a guess',
    c.Store.getJSON('nothing.here', 'FALLBACK') === 'FALLBACK');
  app.storage.setItem(c.STORAGE_NAMESPACE + 'ui.corrupt', '{not json');
  T('corrupt JSON degrades to the fallback rather than throwing',
    c.Store.getJSON('ui.corrupt', 'SAFE') === 'SAFE');

  sub('a failed write is reported, never assumed');
  const failing = H.loadApp({ failWrites: true });
  T('the store reports itself non-persistent', !failing.ctx.Store.isPersistent());
  T('set() returns false when the write cannot land', failing.ctx.Store.set('x', '1') === false ||
    failing.ctx.Store.backend() === 'memory');
  T('the app tells the grown-ups out loud',
    /not letting the app store data/.test(js()));
  T('and marks the grown-ups lock on Earth when progress is not being saved',
    /Progress is not being saved on this device/.test(js()));

  sub('listKeys sees only this app');
  app.storage.setItem('some-other-app.data.items', '[]');
  const keys = c.Store.listKeys();
  T('a foreign key is invisible', keys.every(k => k.indexOf('some-other-app') === -1));
  T('own keys are still found', keys.indexOf('ui.probe') !== -1);
}

/* =========================================================
   CONTRACT 4 — CROSS-APP COLLISION
   Two products on one github.io origin share localStorage and
   Cache Storage. This is what keeps them apart.
   ========================================================= */
function testCollision(){
  section('CONTRACT 4 — two apps on one origin cannot collide');
  const shared = new Map();
  const one = H.loadApp({ appId: 'app-one', sharedStorage: shared });
  const two = H.loadApp({ appId: 'app-two', sharedStorage: shared });

  sub('storage');
  one.ctx.Store.set('settings', 'ONE-SECRET');
  two.ctx.Store.set('settings', 'TWO-SECRET');
  T('each app reads its own value', one.ctx.Store.get('settings') === 'ONE-SECRET' &&
                                    two.ctx.Store.get('settings') === 'TWO-SECRET');
  T('app-one cannot read app-two through the adapter', one.ctx.Store.get('settings') !== 'TWO-SECRET');
  T('the underlying keys are genuinely distinct',
    shared.has('app-one.settings') && shared.has('app-two.settings'));
  T('app-one.listKeys never returns an app-two key',
    one.ctx.Store.listKeys().every(k => shared.get('app-one.' + k) !== undefined));

  one.ctx.journey.stars = one.ctx.awardStars([], 'run_x', 3, '2026-09-26').ledger;
  one.ctx.saveStars();
  T('one app earning stars leaves the other with none',
    two.ctx.Store.getJSON(two.ctx.KEYS.stars, []).length === 0);

  sub('cache identity');
  T('cache names differ', one.ctx.CACHE_NAMESPACE !== two.ctx.CACHE_NAMESPACE);
  T('app-one cache name', one.ctx.CACHE_NAMESPACE.indexOf('app-one-v') === 0, one.ctx.CACHE_NAMESPACE);
  T('app-two cache name', two.ctx.CACHE_NAMESPACE.indexOf('app-two-v') === 0, two.ctx.CACHE_NAMESPACE);

  sub('the service worker only ever deletes its own caches');
  const sw = H.readSW();
  T('cleanup is filtered by this app\'s own prefix',
    /keys\.filter\(k => k !== CACHE_NAME && k\.indexOf\(cachePrefix\(\)\) === 0\)/.test(sw));
  T('the prefix is derived from the cache name, not written twice',
    /function cachePrefix\(\)/.test(sw) && /lastIndexOf\('-v'\)/.test(sw));

  sub('no legacy namespace survives anywhere');
  const all = H.readApp() + H.readSW() + JSON.stringify(H.readManifest());
  T('no legacy storage prefix', !/\bloop_/i.test(all));
  T('no legacy cache prefix', !/\bloop-v\d/i.test(all));
  T('no starter namespace survives', all.indexOf("'app-starter") === -1 && all.indexOf('app-starter-v') === -1);
}

/* =========================================================
   CONTRACT 5 — MIGRATION
   ========================================================= */
function testMigration(){
  section('CONTRACT 5 — migration is non-destructive and idempotent');
  const shared = new Map();
  const app = H.loadApp({ sharedStorage: shared });
  const c = app.ctx;

  sub('first run');
  T('the schema version is recorded', c.Store.get(c.KEYS.schemaVersion) === String(c.DATA_SCHEMA_VERSION));
  T('nothing was migrated on a fresh install', c.runMigrations().migrated === false);

  sub('idempotence');
  c.Store.set(c.KEYS.completions, JSON.stringify([{ id: 'run_a', missionId: 'moon-1', completedAt: '2026-09-26' }]));
  const before = c.Store.get(c.KEYS.completions);
  c.runMigrations(); c.runMigrations(); c.runMigrations();
  T('running migrations repeatedly changes nothing', c.Store.get(c.KEYS.completions) === before);

  sub('a corrupt or absent version is handled without data loss');
  c.Store.set(c.KEYS.schemaVersion, 'not-a-number');
  const r = c.runMigrations();
  T('a nonsense version does not throw', r && typeof r === 'object');
  T('progress survives it', c.Store.get(c.KEYS.completions) === before);

  sub('the mechanism exists before the first shape change needs it');
  T('a migration table is declared', typeof c.MIGRATIONS === 'object');
  T('a backup namespace is reserved', typeof c.KEYS.backupPrefix === 'string' &&
    c.KEYS.backupPrefix.indexOf('sys.') === 0);
  T('backups are excluded from export', /indexOf\(KEYS\.backupPrefix\) === 0/.test(js()));
}

/* =========================================================
   CONTRACT 6 — NAVIGATION
   A child moves between scenes. The same failures as tabs apply:
   an unknown destination must not blank the screen, and exactly
   one place is ever shown.
   ========================================================= */
function testNavigation(){
  section('CONTRACT 6 — navigation between scenes is predictable');
  const app = H.loadApp();
  const c = app.ctx, d = app.dom.document;

  sub('every scene the product names exists');
  const scenes = ['welcome', 'earth', 'travel', 'mission', 'celebrate', 'dock'];
  scenes.forEach(s => T('scene "' + s + '" exists', !!d.getElementById('scene-' + s)));
  const declared = [...H.readApp().matchAll(/<main class="scene[^"]*" id="scene-([a-z]+)"/g)].map(m => m[1]);
  T('the markup declares no scene the code never visits', declared.every(s => scenes.indexOf(s) !== -1),
    declared.join(','));

  sub('an unknown scene is a no-op, not an empty starfield');
  c.showScene('earth');
  T('showing a real scene reports success', c.currentScene === 'earth');
  T('an unknown scene returns false', c.showScene('does-not-exist') === false);
  T('currentScene is unchanged', c.currentScene === 'earth');
  T('the current scene is still shown', d.getElementById('scene-earth').classList.contains('active'));

  sub('only one scene is ever shown');
  c.showScene('dock');
  const active = [...d.querySelectorAll('.scene')].filter(v => v.classList.contains('active'));
  T('exactly one active scene', active.length === 1, String(active.length));
  T('it is the one asked for', active[0].id === 'scene-dock');
  T('hidden scenes are hidden from assistive tech too',
    d.getElementById('scene-earth').getAttribute('aria-hidden') === 'true');
  T('the validation happens before anything is hidden',
    /const scene = document\.getElementById\('scene-' \+ name\);\s*if\(!scene\) return false;/.test(js()));
}

/* =========================================================
   CONTRACT 7 — OVERLAYS
   The most valuable system in the foundation. One mechanism, and
   it cannot be forgotten by a surface added later.
   ========================================================= */
function testOverlays(){
  section('CONTRACT 7 — one overlay engine owns every surface');
  const app = H.loadApp();
  const c = app.ctx, d = app.dom.document;
  const src = js(), style = css();

  sub('one mechanism, not a lock added by hand to every screen');
  T('an observer watches the overlays', /new MutationObserver\(/.test(src));
  T('and it is still the only one', (src.match(/new MutationObserver\(/g) || []).length === 1);
  T('the scroll lock runs from it',
    /new MutationObserver\(\(\) => \{[\s\S]{0,120}syncBackgroundScrollLock\(\);/.test(src));
  T('so does accessibility', /syncSheetAccessibility\(\);[\s\S]{0,40}\}\);/.test(src));
  T('the open overlays are the source of truth',
    /document\.querySelectorAll\('\.overlay\.open'\)\.length/.test(src));
  T('boot survives a platform without an observer',
    /if\(typeof MutationObserver === 'undefined'\) return null;/.test(src));
  T('it watches the whole body, so a later overlay is covered too',
    /obs\.observe\(document\.body,[\s\S]{0,120}subtree: true/.test(src));

  sub('the document behind a surface stops being a document');
  T('the body is pinned, which is what iOS needs',
    /body\.scroll-locked\{[\s\S]{0,140}position: fixed/.test(style));
  T('the offset is captured so it can be given back', /_lockedScrollY = window\.scrollY/.test(src));
  T('and restored exactly, without animating',
    /window\.scrollTo\(\{ top: _lockedScrollY, behavior: 'instant' \}\)/.test(src));
  T('nested layers do not unlock early', /if\(--_lockDepth > 0\) return;/.test(src));

  sub('a gesture inside a surface stays inside it');
  T('the overlay contains its own overscroll', /\.overlay\{[\s\S]{0,400}overscroll-behavior: contain/.test(style));
  T('so does the scrolling surface inside it',
    /\.sheet-scroll\{[\s\S]{0,400}overscroll-behavior: contain/.test(style));
  T('the locked body refuses chaining entirely',
    /body\.scroll-locked\{[\s\S]{0,200}overscroll-behavior: none/.test(style));

  sub('opening and closing, for real');
  open(app, 'grownupOverlay');
  T('the stack records it', c._openSheetStack.length === 1);
  T('the background is locked', d.body.classList.contains('scroll-locked'));
  T('the surface is announced as a dialog',
    d.getElementById('grownupOverlay').getAttribute('aria-modal') === 'true');
  T('it is painted at the stack base',
    d.getElementById('grownupOverlay').style.zIndex === String(c.OVERLAY_Z_BASE));

  sub('stacking is open order, not document order');
  open(app, 'confirmOverlay');
  T('both are on the stack', c._openSheetStack.length === 2);
  T('the newest is on top', c.topOpenSheet().id === 'confirmOverlay');
  T('and painted above the one beneath it',
    Number(d.getElementById('confirmOverlay').style.zIndex) >
    Number(d.getElementById('grownupOverlay').style.zIndex));
  T('the lock counts both layers', c._lockDepth === 2, String(c._lockDepth));

  sub('closing a child reveals its parent — the surface below is the way back');
  close(app, 'confirmOverlay');
  T('the parent is still open', d.getElementById('grownupOverlay').classList.contains('open'));
  T('the stack shrank to one', c._openSheetStack.length === 1);
  T('the background is still locked', d.body.classList.contains('scroll-locked'));
  T('the closed surface gave back its z-index', d.getElementById('confirmOverlay').style.zIndex === '');
  close(app, 'grownupOverlay');
  T('closing the last one unlocks', !d.body.classList.contains('scroll-locked'));
  T('the stack is empty', c._openSheetStack.length === 0);
  T('the lock depth is zero', c._lockDepth === 0);

  sub('every surface declares a way out');
  const ids = [...H.readApp().matchAll(/<div class="overlay(?: overlay-page)?" id="([A-Za-z]+)"/g)].map(m => m[1]);
  T('the app has overlays to check', ids.length >= 5, String(ids.length));
  T('the child\'s "go home?" sheet is one of them', ids.indexOf('homeSheet') !== -1);
  const noExit = ids.filter(id => {
    open(app, id);
    const has = !!c.sheetCloser(d.getElementById(id));
    close(app, id);
    return !has;
  });
  T('every one of them has a discoverable close path', noExit.length === 0, noExit.join(','));

  sub('focus');
  T('the surface takes focus, not its first field — a keyboard would cover the screen',
    /const sheet = ov\.querySelector\('\.sheet'\) \|\| ov;/.test(src));
  T('focus returns only to a control still on screen',
    /document\.contains\(opener\) && opener\.offsetParent !== null/.test(src));
  T('Escape acts on the top surface only', /const ov = topOpenSheet\(\);/.test(src));
  T('Tab is trapped inside it', /ev\.key !== 'Escape' && ev\.key !== 'Tab'/.test(src));
}

/* =========================================================
   CONTRACT 8 — TOAST
   ========================================================= */
function testToast(){
  section('CONTRACT 8 — feedback that never blocks');
  const app = H.loadApp();
  const c = app.ctx, d = app.dom.document;
  const host = d.getElementById('toastHost');

  sub('the host is an announcement region');
  const src = H.readApp();
  T('it is a live region', /id="toastHost"[^>]*aria-live="polite"/.test(src));
  T('it has a status role', /id="toastHost"[^>]*role="status"/.test(src));
  T('it never intercepts a tap', /\.toast-host\{[\s\S]{0,300}pointer-events: none/.test(css()));
  T('the toast itself does accept one', /\.toast\{[\s\S]{0,400}pointer-events: auto/.test(css()));
  T('it clears the home indicator',
    /\.toast-host\{[\s\S]{0,200}bottom: calc\([\s\S]{0,60}var\(--inset-bottom\)\)/.test(css()));

  sub('showing');
  c.toast('Saved');
  T('a toast is added', host.children.length === 1);
  T('it carries the message', host.children[0].innerHTML.indexOf('Saved') !== -1);
  T('an unknown variant falls back to neutral rather than breaking',
    c.toast('x', 'not-a-variant')._classes.has('toast-neutral'));

  sub('variants');
  c.TOAST_VARIANTS.forEach(v => {
    const el = c.toast('m', v);
    T('variant "' + v + '" is applied', el._classes.has('toast-' + v));
  });

  sub('the stack cannot grow without limit');
  T('at most MAX_TOASTS on screen', host.children.length <= c.MAX_TOASTS,
    String(host.children.length) + ' > ' + c.MAX_TOASTS);
  for(let i = 0; i < 20; i++) c.toast('flood ' + i);
  T('flooding does not grow the host', host.children.length <= c.MAX_TOASTS,
    String(host.children.length));

  sub('dismissal');
  const el = c.toast('bye');
  c.dismissToast(el, true);
  T('an immediate dismissal removes it', el.parentNode === null);
  T('dismissing twice is safe', (c.dismissToast(el, true), true));
  T('it dismisses itself on a timer', /setTimeout\(\(\) => dismissToast\(el, reduced\), TOAST_MS\)/.test(js()));
  T('reduced motion skips the leaving animation', /const reduced = prefersReducedMotion\(\);/.test(js()));
}

/* =========================================================
   CONTRACT 9 — CONFIRMATION
   ========================================================= */
function testConfirmation(){
  section('CONTRACT 9 — one confirmation, no native dialogs');
  const app = H.loadApp();
  const c = app.ctx, d = app.dom.document;
  const src = js();

  sub('native dialogs are gone');
  ['alert', 'confirm', 'prompt'].forEach(fn => {
    const re = new RegExp('\\b' + fn + '\\s*\\(', 'g');
    const hits = (src.match(re) || []);
    T('no ' + fn + '() in application code', hits.length === 0, hits.join(','));
  });

  sub('it runs on the shared overlay engine, not a second implementation');
  T('the confirm surface is an overlay', !!d.getElementById('confirmOverlay'));
  T('it does not roll its own scroll lock',
    (src.match(/document\.body\.classList\.add\('scroll-locked'\)/g) || []).length === 1);
  T('it is announced as an alert dialog', /role="alertdialog"/.test(H.readApp()));
  T('its title and message are wired to the dialog',
    /aria-labelledby="confirmTitle"/.test(H.readApp()) && /aria-describedby="confirmMessage"/.test(H.readApp()));

  sub('confirming');
  let resolved = null;
  c.confirmAction({ title: 'Delete?', message: 'Gone for good.', confirmLabel: 'Delete' })
    .then(v => { resolved = v; });
  c.__flush();
  T('the surface opens', d.getElementById('confirmOverlay').classList.contains('open'));
  T('the title is set', d.getElementById('confirmTitle').textContent === 'Delete?');
  T('the message is set', d.getElementById('confirmMessage').textContent === 'Gone for good.');
  T('the confirm label is set', d.getElementById('confirmAccept').textContent === 'Delete');
  c.acceptConfirm(); c.__flush();
  return Promise.resolve().then(() => {
    T('accepting resolves true', resolved === true, String(resolved));
    T('and closes the surface', !d.getElementById('confirmOverlay').classList.contains('open'));

    let cancelled = null;
    c.confirmAction({ title: 'Sure?' }).then(v => { cancelled = v; });
    c.__flush();
    c.closeConfirm(); c.__flush();
    return Promise.resolve().then(() => {
      T('cancelling resolves false', cancelled === false, String(cancelled));

      sub('cancel is the safe outcome, so every exit route means cancel');
      let escaped = null;
      c.confirmAction({ title: 'Sure?' }).then(v => { escaped = v; });
      c.__flush();
      const closer = c.sheetCloser(d.getElementById('confirmOverlay'));
      T('the engine finds its declared close path', typeof closer === 'function');
      closer(); c.__flush();
      return Promise.resolve().then(() => {
        T('an engine-driven close resolves false', escaped === false, String(escaped));

        sub('a destructive confirm does not wear the loud button');
        c.confirmAction({ title: 'x', destructive: true }); c.__flush();
        const accept = d.getElementById('confirmAccept');
        T('the accept button is not primary', accept.className.indexOf('btn-primary') === -1, accept.className);
        T('it is marked destructive', accept.className.indexOf('btn-danger') !== -1);
        c.closeConfirm(); c.__flush();

        sub('a second call cannot strand the first promise');
        let first = 'pending';
        c.confirmAction({ title: 'one' }).then(v => { first = v; });
        c.__flush();
        c.confirmAction({ title: 'two' });
        c.__flush();
        return Promise.resolve().then(() => {
          T('the superseded call resolves false rather than hanging', first === false, String(first));
          c.closeConfirm(); c.__flush();
        });
      });
    });
  });
}

/* =========================================================
   CONTRACT 10 — NOTHING IRREVERSIBLE HAPPENS WITHOUT ASKING
   The starter proved this with an Item form. This product has no
   form; what it has is a child's progress, and the one action that
   erases it.
   ========================================================= */
function testErase(){
  section('CONTRACT 10 — erasing progress asks first, and cancel keeps it');
  const shared = new Map();
  const app = H.loadApp({ sharedStorage: shared });
  const c = app.ctx, d = app.dom.document;

  c.ensureProfile();
  c.journey.stars = c.awardStars([], 'run_keep', 3, '2026-09-26').ledger;
  c.saveStars();

  sub('asking');
  const p = c.resetAllData();
  c.__flush();
  T('a confirmation is shown', d.getElementById('confirmOverlay').classList.contains('open'));
  T('its loud button is not the destructive one',
    d.getElementById('confirmAccept').className.indexOf('btn-primary') === -1);
  c.closeConfirm(); c.__flush();
  return p.then(() => {
    T('cancelling keeps every star', c.Store.getJSON(c.KEYS.stars, []).length === 1);
    T('and the explorer', c.Store.get(c.KEYS.profile) !== null);

    const p2 = c.resetAllData();
    c.__flush();
    c.acceptConfirm(); c.__flush();
    return p2.then(() => {
      T('confirming erases the progress', c.Store.get(c.KEYS.stars) === null && c.Store.get(c.KEYS.profile) === null);
      T('the in-memory journey is re-read, not left stale', c.starBalance(c.journey.stars) === 0 && c.journey.profile === null);
      T('the schema version is still recorded', c.Store.get(c.KEYS.schemaVersion) === String(c.DATA_SCHEMA_VERSION));
      T('the child is back at the welcome', c.currentScene === 'welcome');
      T('and a reload agrees', H.loadApp({ sharedStorage: shared }).ctx.currentScene === 'welcome');
    });
  });
}

/* =========================================================
   CONTRACT 11 — REAL-DEVICE BEHAVIOUR
   The starter's phone rules still hold for the grown-ups pages.
   The child's world adds its own: landscape, and targets sized for
   a five-year-old's finger.
   ========================================================= */
function testMobile(){
  section('CONTRACT 11 — real-device behaviour');
  const style = css(), src = H.readApp();

  sub('the iOS input zoom floor');
  T('the floor is declared once, globally',
    /input\[type="text"\][^{]*\{[^}]*font-size: 16px;/.test(style));
  T('and explained, so nobody "tidies" it away', /fs-exempt: iOS Safari zooms/.test(style));
  T('the token records the reason too', /--input-min-size: 16px;/.test(style));
  const smaller = [...style.matchAll(/(input|textarea|select)[^{]*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/g)]
    .filter(m => parseFloat(m[2]) < 16);
  T('no field is set below the floor', smaller.length === 0, smaller.map(m => m[0].slice(0, 40)).join(' | '));

  sub('safe areas are read, not guessed');
  ['--inset-top', '--inset-bottom', '--inset-left', '--inset-right'].forEach(t => {
    T(t + ' is tokenized', new RegExp(t + ':\\s*env\\(safe-area-inset').test(style));
  });
  T('everything a child can press sits inside all four insets',
    /\.scene-ui\{[\s\S]{0,300}var\(--inset-top\)[\s\S]{0,120}var\(--inset-right\)[\s\S]{0,120}var\(--inset-bottom\)[\s\S]{0,120}var\(--inset-left\)/.test(style));
  T('the body reads the left and right insets',
    /body\{[\s\S]{0,400}padding-left: var\(--inset-left\)/.test(style));
  T('a page paints a band the height of the top inset',
    /\.overlay-page \.sheet::before\{[\s\S]{0,200}height: var\(--inset-top\)/.test(style));
  T('the band never eats a tap',
    /\.overlay-page \.sheet::before\{[\s\S]{0,260}pointer-events: none/.test(style));
  T('the inset is never paid twice under a header',
    /\.page-topbar \+ \.sheet-scroll\{ padding-top: var\(--space-lg\); \}/.test(style));
  T('a header that owns the inset is opaque and outranks the band',
    /\.page-topbar\{[^}]*background: var\(--surface\); position: relative; z-index: 7/.test(style));
  T('no screen substitutes a fixed pixel margin for an inset',
    !/margin-top:\s*(44|47|59)px/.test(style));

  sub('every full page is protected — none opts out');
  const pageIds = [...src.matchAll(/<div class="overlay overlay-page" id="([A-Za-z]+)"/g)].map(m => m[1]);
  T('there are full pages to protect', pageIds.length >= 3, String(pageIds.length));
  const unprotected = pageIds.filter(id => {
    const at = src.indexOf('id="' + id + '"');
    return !/class="sheet"/.test(src.slice(at, at + 400));
  });
  T('each one carries the band-bearing surface', unprotected.length === 0, unprotected.join(','));

  sub('touch targets: the adult floor');
  T('the minimum is a token', /--touch-min: 44px;/.test(style));
  ['.btn-primary', '.btn-secondary', '.icon-btn', '.list-row', '.segmented button']
    .forEach(sel => {
      const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{[^}]*(min-height|height):\\s*var\\(--touch-min\\)');
      T(sel + ' meets the floor', re.test(style));
    });
  T('the visible mark is not forced to the target size — only the target is',
    /The visible mark can be small; the target never is/.test(style));

  sub('touch targets: a five-year-old\'s finger');
  const kid = (style.match(/--touch-kid:\s*(\d+)px/) || [])[1];
  const hero = (style.match(/--touch-hero:\s*(\d+)px/) || [])[1];
  T('every child control is at least 56px — the spec\'s floor for major child actions', Number(kid) >= 56, kid);
  T('the one primary action is bigger still', Number(hero) > Number(kid), hero);
  ['.kid-btn', '.kid-icon-btn', '.star-count'].forEach(sel => {
    const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{[^}]*min-height: var\\(--touch-kid\\)');
    T(sel + ' meets the child floor', re.test(style));
  });
  T('the launch button uses the hero size', /\.launch-btn\{[^}]*min-height: var\(--touch-hero\)/.test(style));
  T('a choice tile is never smaller than 130px', /--tile-size: clamp\(130px,/.test(style));
  T('the repeat button is large and round', /\.repeat-btn\{[^}]*width: 104px; height: 104px/.test(style));
  T('the grown-ups lock still meets the adult floor', /\.gate-btn\{[^}]*width: 56px; height: 56px/.test(style));

  sub('orientation, landscape-first');
  T('the manifest asks for landscape', H.readManifest().orientation === 'landscape');
  T('portrait shows a turn-your-iPad prompt, because iPadOS ignores the lock',
    /@media \(orientation: portrait\)\{\s*\.rotate-prompt\{ display: flex; \}/.test(style));
  T('grown-up pages sit above that prompt, so they work either way up',
    Number((style.match(/\.rotate-prompt\{[^}]*z-index: (\d+)/) || [])[1]) <
    Number((style.match(/\.overlay\{[^}]*z-index: (\d+)/) || [])[1]));
  T('the child\'s world cannot rubber-band or scroll',
    /html, body\{ height: 100%; overflow: hidden; overscroll-behavior: none; \}/.test(style));
  T('a long press cannot select a letter or raise a callout',
    /\.scene\{[\s\S]{0,300}-webkit-user-select: none; user-select: none; -webkit-touch-callout: none/.test(style));
  T('automatic text inflation is switched off, pinch zoom is not',
    /text-size-adjust: 100%/.test(style) && !/text-size-adjust:\s*none/.test(style));
  T('double-tap zoom is suppressed without disabling pinch',
    /touch-action: manipulation/.test(style));
  T('the viewport covers the notch', /viewport-fit=cover/.test(src));
}

/* =========================================================
   CONTRACT 12 — DESIGN SYSTEM ENFORCEMENT
   ========================================================= */
function testDesignSystem(){
  section('CONTRACT 12 — the design system is enforced, not merely documented');
  const style = css(), src = H.readApp();

  sub('font families come from tokens');
  T('the tokens exist', /--font-ui:/.test(style) && /--font-display:/.test(style) && /--font-mono:/.test(style));
  const families = [...src.matchAll(/font-family:\s*([^;}"]+)/g)].map(m => m[1].trim());
  const rogue = families.filter(v => v.indexOf('var(--font-') !== 0 && v !== 'inherit');
  T('every font-family declaration uses a token or inherits', rogue.length === 0,
    rogue.slice(0, 4).join(' | '));
  T('there is at least one, so the rule is doing work', families.length >= 5, String(families.length));

  sub('font sizes come from the scale');
  const scale = [...style.matchAll(/--fs-([a-z-]+):\s*(\d+)px/g)].map(m => m[1]);
  T('the scale defines the expected roles', scale.length >= 6, scale.join(','));
  const lines = style.split('\n');
  const violations = [];
  lines.forEach((line, i) => {
    const m = line.match(/font-size:\s*([^;]+);/);
    if(!m) return;
    const v = m[1].trim();
    if(v.indexOf('var(--fs-') === 0 || v === 'inherit') return;
    /* An exception must be declared within the comment immediately above it,
       so the reason travels with the line rather than living in a list
       somewhere else. */
    const window8 = lines.slice(Math.max(0, i - 8), i).join('\n');
    if(/fs-exempt:/.test(window8)) return;
    violations.push('line ' + (i + 1) + ': ' + line.trim());
  });
  T('no raw font-size outside the scale or a declared exception',
    violations.length === 0, violations.slice(0, 4).join(' | '));
  T('no inline style in the script sets a font size either',
    !/font-size:\s*\d/.test(stripComments(js())));

  sub('the exception mechanism is narrow');
  const exempt = (style.match(/fs-exempt:/g) || []).length;
  T('there is at most a handful of exceptions', exempt <= 3, String(exempt));
  T('each states a reason', !/fs-exempt:\s*($|\*\/)/m.test(style));

  sub('spacing, radius and motion are tokenized');
  ['--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl']
    .forEach(t => T(t + ' exists', new RegExp(t + ':').test(style)));
  ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl'].forEach(t =>
    T(t + ' exists', new RegExp(t + ':').test(style)));
  T('motion has an easing token', /--ease:/.test(style));
  T('and duration tokens', /--dur:/.test(style));
  T('layout width is a token', /--layout-max:/.test(style));
  T('breakpoints are named', /--bp-sm:/.test(style) && /--bp-md:/.test(style));

  sub('colours come from tokens');
  /* Hex colours may only be declared in the token block; every component
     reads a role. A hex literal in a rule is how a palette quietly forks. */
  const outsideRoot = style.replace(/:root\{[\s\S]*?\n\}/, '');
  const hexes = (stripComments(outsideRoot).match(/#[0-9a-fA-F]{3,8}\b/g) || []);
  T('no hex colour outside the token block', hexes.length === 0, hexes.slice(0, 5).join(','));

  sub('tokens live in exactly one place');
  T('one :root block', (style.match(/^:root\{/gm) || []).length === 1);
  T('the four layers are labelled',
    /1 · BRAND/.test(style) && /2 · SEMANTIC/.test(style) &&
    /3 · SCALE/.test(style) && /4 · DOMAIN/.test(style));

  sub('motion respects the system preference — and the grown-ups setting');
  T('a reduced-motion block exists', /@media \(prefers-reduced-motion: reduce\)/.test(style));
  T('it disables animation and transition globally',
    /@media \(prefers-reduced-motion: reduce\)\{[\s\S]{0,200}animation: none !important; transition: none !important/.test(style));
  T('the in-app setting applies the identical rule',
    /html\[data-motion="reduce"\] \*,[^{]*\{\s*animation: none !important; transition: none !important/.test(style));
  /* Found in Phase 1 QA: `*` does not match pseudo-elements, so the Launch
     halo and the hint ring kept pulsing with Reduce Motion on. */
  T('both rules also stop pseudo-element animation',
    /@media \(prefers-reduced-motion: reduce\)\{\s*\*, \*::before, \*::after\{/.test(style) &&
    /html\[data-motion="reduce"\] \*::before, html\[data-motion="reduce"\] \*::after\{/.test(style));
  const pseudoAnimated = [...style.matchAll(/([^{}\n]+::(?:before|after))\{[^}]*animation:/g)].map(m => m[1].trim());
  T('and pseudo-elements are animated somewhere, so that rule is doing work', pseudoAnimated.length > 0,
    pseudoAnimated.join(' | '));
  T('and the JS honours both', /prefersReducedMotion\(\)/.test(js()) &&
    /function motionReduced\(\)\{ return motionPref === 'reduce' \|\| prefersReducedMotion\(\); \}/.test(js()));

  sub('status is never carried by colour alone');
  T('a badge shows a word, not just a hue', /\.badge\{[\s\S]{0,400}text-transform: uppercase/.test(style));
  T('notices carry an icon as well as a border', /\.notice\{/.test(style) && /notice-error/.test(style));
  T('a correct answer gains a check mark, not only a green ring',
    /\.choice\.is-correct \.choice-badge\{ display: flex; \}/.test(style));
  T('a wrong answer steps aside — dimmed and smaller — rather than turning red',
    /\.choices \.choice\.is-out\{ opacity: 0\.28; transform: scale\(0\.9\)/.test(style));
}

/* =========================================================
   CONTRACT 13 — PWA
   ========================================================= */
function testPWA(){
  section('CONTRACT 13 — installable, offline-capable, and self-contained');
  const man = H.readManifest(), sw = H.readSW(), src = H.readApp();

  sub('nothing is bound to a repository path');
  T('start_url is relative', man.start_url.indexOf('./') === 0, man.start_url);
  T('scope is relative', man.scope === './', man.scope);
  T('every cached asset is relative',
    (sw.match(/'\.\/[^']*'/g) || []).length >= 4);
  T('no absolute path in the manifest',
    !/"(start_url|scope|src)":\s*"\//.test(JSON.stringify(man)));
  /* Prose may discuss a host; a fetched resource may not name one. The check
     targets things the browser would actually request. */
  const fetched = [...src.matchAll(/(?:href|src|action)\s*=\s*"([^"]+)"/g)].map(m => m[1])
    .concat([...css().matchAll(/url\(\s*['"]?([^'")]+)/g)].map(m => m[1]));
  const remote = fetched.filter(u => /^(https?:)?\/\//.test(u));
  T('no fetched resource points at another host', remote.length === 0, remote.join(', '));
  T('no deployment path is baked into a fetched URL',
    !fetched.some(u => /github\.io/.test(u)));

  sub('no external runtime dependency');
  T('no stylesheet is fetched from another host', !/<link[^>]*href="https?:/.test(src));
  T('no script is fetched from another host', !/<script[^>]*src="https?:/.test(src));
  T('no @import in the stylesheet', !/@import/.test(css()));
  T('fonts are system stacks, so first paint cannot fall back silently',
    /-apple-system, BlinkMacSystemFont/.test(css()));

  sub('the manifest declares a real installable app');
  T('it has a name', !!man.name);
  T('it has a short name', !!man.short_name && man.short_name.length <= 12);
  T('it runs standalone', man.display === 'standalone');
  T('it declares both icon sizes',
    man.icons.some(i => i.sizes === '192x192') && man.icons.some(i => i.sizes === '512x512'));
  T('icons are maskable', man.icons.every(i => /maskable/.test(i.purpose || '')));
  T('the icons exist on disk',
    fs.existsSync(path.join(H.ROOT, 'icon-192.png')) && fs.existsSync(path.join(H.ROOT, 'icon-512.png')));

  sub('the service worker');
  T('registration is guarded to http(s)',
    /location\.protocol\.indexOf\('http'\) === 0/.test(js()));
  T('a failed registration cannot break boot', /register\('sw\.js'\)\.catch\(\(\) => \{\}\)/.test(js()));
  T('the shell is network-first, so a deploy is picked up promptly',
    /fetch\(req\)[\s\S]{0,400}\.catch\(\(\) => caches\.match\(req\)/.test(sw));
  T('index.html is the offline fallback', /caches\.match\('\.\/index\.html'\)/.test(sw));
  T('cross-origin requests are left alone',
    /new URL\(req\.url\)\.origin !== location\.origin/.test(sw));
  T('non-GET requests are left alone', /req\.method !== 'GET'/.test(sw));
  T('a failed precache still activates', /\.catch\(\(\) => self\.skipWaiting\(\)\)/.test(sw));
  T('it says out loud that it never touches user data',
    /never touched here/.test(sw) || /cannot lose a single record/.test(sw));
}

/* =========================================================
   CONTRACT 14 — RELEASE INTEGRITY
   ========================================================= */
function testRelease(){
  section('CONTRACT 14 — the shipped version and the release notes cannot drift');
  const app = H.loadApp();
  const c = app.ctx;

  sub('one source for the version');
  T('there is at least one release entry', c.APP_UPDATES.length >= 1);
  T('the app version IS the newest entry', c.APP_VERSION === c.APP_UPDATES[0].version);
  T('no second version literal is declared in the app',
    (js().match(/APP_VERSION\s*=/g) || []).length === 1);
  T('the service-worker cache carries that version',
    H.readSW().indexOf(c.APP_VERSION) !== -1, c.APP_VERSION);
  T('package.json carries it too', H.readPkg().version === c.APP_VERSION);

  sub('entries are well formed and newest first');
  const dates = c.APP_UPDATES.map(u => u.date);
  T('every entry has an id, version, title, date and summary',
    c.APP_UPDATES.every(u => u.id && u.version && u.title && u.date && u.summary));
  T('dates are newest first',
    dates.every((d, i) => i === 0 || dates[i - 1] >= d), dates.join(' > '));
  T('ids are unique', new Set(c.APP_UPDATES.map(u => u.id)).size === c.APP_UPDATES.length);
  T('every entry has at least one line of content',
    c.APP_UPDATES.every(u => (u.newFeatures || []).length + (u.improvements || []).length +
                             (u.fixes || []).length > 0));

  sub('a minimal history, not an inherited one');
  T('a small number of entries', c.APP_UPDATES.length <= 3, String(c.APP_UPDATES.length));
  T('the authoring rules travel with the data', /AUTHORING A NEW ENTRY/.test(js()));
  T('and it says new products replace it', /New products replace this array wholesale/.test(js()));

  sub('unread state');
  T('the newest id is what marks it read', /Store\.set\(KEYS\.lastSeenUpdate, APP_UPDATES\[0\]\.id\)/.test(js()));
  T('the unread key is namespaced', c.KEYS.lastSeenUpdate.indexOf('ui.') === 0);
}

/* =========================================================
   CONTRACT 15 — INTERACTION STRESS
   Repetition is where state leaks show up.
   ========================================================= */
async function testStress(){
  section('CONTRACT 15 — repeated use leaks nothing');
  const sp = fakeSpeech();
  const app = H.loadApp({ windowExtras: sp.extras });
  const c = fast(app.ctx), d = app.dom.document;

  sub('100 scene changes');
  const scenes = ['earth', 'dock', 'mission', 'celebrate', 'travel', 'welcome'];
  for(let i = 0; i < 100; i++) c.showScene(scenes[i % scenes.length]);
  const active = [...d.querySelectorAll('.scene')].filter(v => v.classList.contains('active'));
  T('still exactly one active scene', active.length === 1, String(active.length));
  T('no scroll lock was acquired', c._lockDepth === 0, String(c._lockDepth));
  T('no console errors', app.errors.length === 0, app.errors.join(' | '));

  sub('100 overlay open/close cycles');
  for(let i = 0; i < 100; i++){ open(app, 'grownupOverlay'); close(app, 'grownupOverlay'); }
  T('the stack is empty', c._openSheetStack.length === 0, String(c._openSheetStack.length));
  T('the lock depth is zero', c._lockDepth === 0, String(c._lockDepth));
  T('the body is not left locked', !d.body.classList.contains('scroll-locked'));
  T('no z-index is left painted', d.getElementById('grownupOverlay').style.zIndex === '');
  T('the opener map did not grow', c._sheetOpeners.size === 0, String(c._sheetOpeners.size));

  sub('50 nested cycles');
  for(let i = 0; i < 50; i++){
    open(app, 'grownupOverlay');
    open(app, 'confirmOverlay');
    close(app, 'confirmOverlay');
    close(app, 'grownupOverlay');
  }
  T('the stack is empty', c._openSheetStack.length === 0, String(c._openSheetStack.length));
  T('the lock depth is zero', c._lockDepth === 0, String(c._lockDepth));
  T('history depth did not run away', Math.abs(c._historyDepth) <= 1, String(c._historyDepth));

  sub('20 whole missions, with mistakes');
  c.showScene('welcome');
  await c.startAdventure();
  for(let i = 0; i < 20; i++){
    await c.launch();
    await playMission(c, { wrongRounds: [1, 3] });
    await c.flyHome();
  }
  T('twenty missions were recorded', c.journey.completions.length === 20, String(c.journey.completions.length));
  T('exactly twenty earnings, one per run', c.journey.stars.filter(e => e.kind === 'earn').length === 20);
  T('and the balance is exactly what twenty missions pay', c.starBalance(c.journey.stars) === 20 * c.MISSIONS['moon-1'].reward.stars);
  T('no mission is left running', c.session.run === null);
  T('evidence stays bounded: one record per letter practised',
    c.journey.evidence.length === new Set(c.MISSIONS['moon-1'].activities.filter(a => !a.guided).map(a => a.target)).size,
    String(c.journey.evidence.length));
  T('and each record keeps only its recent answers',
    c.journey.evidence.every(e => e.recent.length <= c.RECENT_LIMIT));
  T('storage did not accumulate keys', c.Store.listKeys().length <= 8, c.Store.listKeys().join(','));
  T('the stack is still empty', c._openSheetStack.length === 0);
  T('no console errors after all of it', app.errors.length === 0, app.errors.join(' | '));

  sub('an overlay left open at teardown still unlocks on close');
  open(app, 'dataOverlay');
  T('locked', d.body.classList.contains('scroll-locked'));
  close(app, 'dataOverlay');
  T('unlocked', !d.body.classList.contains('scroll-locked'));
}

/* =========================================================
   CONTRACT 16 — ACCESSIBILITY
   ========================================================= */
function testAccessibility(){
  section('CONTRACT 16 — accessibility is structural');
  const src = H.readApp(), style = css();

  sub('semantics');
  /* The markup only: a comment in the script may quote a tag. */
  const markup = H.bodyBlock(src).replace(/<script>[\s\S]*<\/script>/, '');
  T('every scene is a <main> with a name',
    [...markup.matchAll(/<main class="scene[^"]*"[^>]*>/g)].every(m => /aria-label="[^"]+"/.test(m[0])) &&
    (markup.match(/<main class="scene/g) || []).length >= 5);
  T('every icon-only control has a label',
    [...src.matchAll(/<button[^>]*class="[^"]*(icon-btn|kid-icon-btn|gate-btn|repeat-btn|play-btn|star-count|launch-btn)[^"]*"[^>]*>/g)]
      .every(m => /aria-label=/.test(m[0])));
  T('decorative glyphs are hidden from assistive tech',
    (src.match(/aria-hidden="true"/g) || []).length >= 6);
  T('generated SVG is hidden and unfocusable',
    /aria-hidden="true" focusable="false"/.test(js()));
  T('a letter tile is named for the letter on it',
    /aria-label="Letter ' \+ L \+ '"/.test(js()));
  T('pictures inside named controls are not read twice',
    /alt="" draggable="false"/.test(js()));

  sub('state is exposed, not just painted');
  T('the motion setting is a radiogroup', /role="radiogroup" aria-label="Motion"/.test(src));
  T('its options report checked state', /role="radio" aria-checked="true"/.test(src));
  T('the paint swatches are a radiogroup too', /role="radiogroup" aria-label="Rocket paint"/.test(src));
  T('the sound settings are switches', /role="switch"/.test(src));
  T('the toggle exposes checked state', /\.toggle\[aria-checked="true"\]/.test(style));
  T('an action that cannot happen yet says so, instead of being dead',
    /setAttribute\('aria-disabled', 'true'\)/.test(js()));
  T('mission progress is announced in words',
    /' of ' \+ total \+ ' letters found'/.test(js()));

  sub('what Pip says is available without sound');
  T('every caption is a live region',
    [...src.matchAll(/<div class="caption bubble"[^>]*>/g)].every(m => /aria-live="polite"/.test(m[0])));
  T('there is a caption for every scene Pip speaks in',
    ['welcome', 'earth', 'mission', 'celebrate', 'dock'].every(s => src.indexOf('id="caption-' + s + '"') !== -1));

  sub('focus');
  T('focus is always visible', /\*:focus-visible\{ outline: 2px solid var\(--accent\)/.test(style));
  T('except where focus was moved programmatically',
    /\.sheet:focus, \.sheet:focus-visible\{ outline: none; \}/.test(style));
  T('a dialog traps Tab', /sheetFocusables\(ov\)/.test(js()));
  T('and returns focus when it closes', /opener\.focus\(\{ preventScroll: true \}\)/.test(js()));
  T('the grown-ups lock can be held from a keyboard too',
    /gate\.addEventListener\('keydown'/.test(js()));

  sub('hidden content is hidden properly');
  T('the file input is visually hidden, not display:none', /class="sr-only"/.test(src));
  T('.sr-only keeps it in the accessibility tree', /\.sr-only\{[\s\S]{0,200}clip: rect\(0 0 0 0\)/.test(style));
}

/* =========================================================
   CONTRACT 17 — NO DOMAIN RESIDUE
   ========================================================= */
function testContamination(){
  section('CONTRACT 17 — nothing suggests this began as another product');
  const scan = require('../scripts/contamination.js');
  const code = scan.run();
  T('the contamination scan is clean', code === 0);

  const src = H.readApp();
  T('no legacy brand token in the app', !/\bLOOP\b/.test(src));
  T('the starter\'s demo domain is gone',
    !/ITEM_STATUSES|openItemForm|itemFormOverlay|view-items|DEMO DOMAIN/.test(src));
  T('the starter\'s component gallery is gone', !/componentsOverlay|openComponents/.test(src));
  T('the starter\'s own docs were adapted, not shipped as-is',
    !fs.existsSync(path.join(H.ROOT, 'NEW-PROJECT.md')) &&
    !fs.existsSync(path.join(H.ROOT, 'STARTER-ARCHITECTURE.md')) &&
    fs.existsSync(path.join(H.ROOT, 'ARCHITECTURE.md')));
}

/* =========================================================
   CONTRACT 18 — SINGLE SOURCE OF TRUTH
   ========================================================= */
function testSourcesOfTruth(){
  section('CONTRACT 18 — one owner for each thing');
  const src = js(), style = css();

  const singles = [
    ['app identity',      /const APP_CONFIG = \{/g],
    ['app version',       /const APP_VERSION =/g],
    ['storage namespace', /const STORAGE_NAMESPACE =/g],
    ['cache namespace',   /const CACHE_NAMESPACE =/g],
    ['storage adapter',   /const Store = \(function\(\)\{/g],
    ['release history',   /const APP_UPDATES = \[/g],
    ['overlay stack',     /let _openSheetStack =/g],
    ['scroll lock depth', /let _lockDepth =/g],
    ['schema version',    /const DATA_SCHEMA_VERSION =/g],
    ['asset registry',    /const ASSET_REGISTRY = \[/g],
    ['timing table',      /const TIMING = \{/g],
    ['voice lines',       /const VOICE_CUES = \{/g]
  ];
  singles.forEach(([label, re]) => {
    const n = (src.match(re) || []).length;
    T(label + ' is declared exactly once', n === 1, String(n));
  });

  T('there is one token block', (style.match(/^:root\{/gm) || []).length === 1);
  T('there is one storage key table', (src.match(/const KEYS = \{/g) || []).length === 1);
  const literalKeys = stripComments(src).match(/Store\.(get|set|setJSON|getJSON|remove)\(\s*['"][a-z]+\./g) || [];
  T('every storage key goes through the table', literalKeys.length === 0, literalKeys.join(','));

  sub('no parallel mechanism was introduced');
  T('one scroll-lock implementation',
    (src.match(/classList\.add\('scroll-locked'\)/g) || []).length === 1);
  T('one focus-restore implementation',
    (src.match(/opener\.focus\(/g) || []).length === 1);
  T('one toast host', (src.match(/getElementById\('toastHost'\)/g) || []).length <= 2);
  T('one speech path: nothing but Voice calls the speech engine',
    (stripComments(src).match(/\.speak\(/g) || []).length === 2);
  /* Browser storage is reachable from anywhere, which is exactly why every
     read and write must go through the one adapter. Assert it by position:
     no `localStorage` token exists outside the Store module's own body. */
  const storeStart = src.indexOf('const Store = (function(){');
  const storeEnd = src.indexOf('})();', storeStart) + 5;
  const outsideStore = stripComments(src.slice(0, storeStart) + src.slice(storeEnd));
  const strays = [...outsideStore.matchAll(/^.*\blocalStorage\b.*$/gm)].map(m => m[0].trim());
  T('no code outside the adapter touches browser storage', strays.length === 0,
    strays.slice(0, 3).join(' | '));
  T('the adapter itself is the only place that does',
    /window\.localStorage/.test(src.slice(storeStart, storeEnd)));
  T('the app declares no dependencies', Object.keys(H.readPkg().dependencies || {}).length === 0);
  T('and no dev dependencies either', Object.keys(H.readPkg().devDependencies || {}).length === 0);

  sub('asset paths are written in exactly one place');
  const afterRegistry = src.slice(src.indexOf('function assetEntry('));
  T('no code after the registry names an asset file',
    !/['"]assets\//.test(stripComments(afterRegistry)));
}

/* =========================================================
   CONTRACT 19 — PORTABILITY
   ---------------------------------------------------------
   The foundation must not know the product, the product must be
   deletable, and nothing may quietly carry the starter's own
   identity into this product.
   ========================================================= */

/* The starter's own default id. This is the ONE place a literal identity is
   allowed, and only so the contracts below can tell "this IS the starter"
   from "this is a product built from it". Everything else derives. */
const STARTER_DEFAULT_ID = 'app-starter';
const STARTER_SEED_RELEASE = 'v0-1-0';

function testPortability(){
  section('CONTRACT 19 — the foundation and the product stay separable');
  const app = H.loadApp();
  const c = app.ctx;
  const src = js();

  sub('the foundation reaches the product through three named seams');
  T('a Domain seam exists', typeof c.Domain === 'object' && c.Domain !== null);
  ['hydrate', 'render', 'wire'].forEach(h =>
    T('Domain.' + h + '() is a function', typeof c.Domain[h] === 'function'));
  T('boot hydrates through the seam, not the product', /Domain\.hydrate\(\);/.test(src));
  T('boot wires through the seam', /Domain\.wire\(\);/.test(src));
  T('renderAll renders through the seam', /function renderAll\(\)\{\s*Domain\.render\(\);/.test(src));
  T('the seam defaults are no-ops, so the app boots before it has a product',
    /const Domain = \{[\s\S]{0,200}hydrate\(\)\{\},/.test(src));

  sub('no foundation function names the product');
  /* The boundary is the PRODUCT DOMAIN banner. Everything above it, plus the
     settings/updates/utilities/boot sections below it, is foundation. */
  const start = src.indexOf('PRODUCT DOMAIN — Space Kindergarten');
  const end = src.indexOf('SETTINGS — data ownership');
  T('the product section is delimited', start > 0 && end > start);
  /* The key table is where a product is told to declare its keys, so it is
     the one foundation block allowed to name them. */
  const foundation = stripComments(src.slice(0, start) + src.slice(end)).replace(/const KEYS = \{[\s\S]*?\n\};/, '');
  const productWords = ['journey', 'mission', 'Mission', 'letter', 'Letter', 'rocket', 'Rocket', 'cosmetic',
                        'ledger', 'Voice', 'Sfx', 'Pip', 'starBalance', 'evidence'];
  /* Code, not prose: the product's own identity and release notes live in
     foundation-shaped config and are meant to describe the product, and an
     error message may say "letters". What must never happen is foundation
     code reaching for a product name — so string literals are blanked first. */
  const foundationCode = foundation
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  const leaks = productWords.filter(w => new RegExp('\\b' + w).test(foundationCode));
  T('the foundation code contains no product vocabulary', leaks.length === 0, leaks.join(', '));
  /* setItem/getItem/removeItem are the localStorage API, not a demo entity. */
  const demoRefs = (foundation.match(/[A-Za-z_$][A-Za-z0-9_$]*[Ii]tem[A-Za-z0-9_$]*/g) || [])
    .filter(n => !/^(set|get|remove)Item$/.test(n));
  T('nor any trace of the starter\'s demo entity', demoRefs.length === 0, [...new Set(demoRefs)].join(', '));

  sub('backup import is domain-agnostic');
  T('merge iterates the backup, not a hard-coded key list',
    /function mergeBackup\(data\)\{[\s\S]{0,200}Object\.keys\(data\)/.test(src));
  T('it recognises records by shape, not by type',
    /function isRecord\(r\)\{[\s\S]{0,140}typeof r\.id === 'string'/.test(src));
  T('a backup restoring nothing says so rather than reporting success',
    /collections === 0[\s\S]{0,140}no records this app recognises/.test(src));
  {
    /* Prove it against a collection the product has never heard of. */
    const a = H.loadApp();
    const r = a.ctx.mergeBackup({
      'data.widgets': JSON.stringify([{ id: 'w1', title: 'A', updatedAt: '2026-01-02' }])
    });
    T('an unknown collection imports', r.added === 1 && r.collections === 1);
    T('and lands in storage', a.ctx.Store.getJSON('data.widgets', []).length === 1);
    const again = a.ctx.mergeBackup({
      'data.widgets': JSON.stringify([{ id: 'w1', title: 'A', updatedAt: '2026-01-02' }])
    });
    T('re-importing the same file changes nothing', again.added === 0 && again.updated === 0);
    const older = a.ctx.mergeBackup({
      'data.widgets': JSON.stringify([{ id: 'w1', title: 'OLD', updatedAt: '2020-01-01' }])
    });
    T('an older backup cannot overwrite a newer record',
      older.updated === 0 && a.ctx.Store.getJSON('data.widgets', [])[0].title === 'A');
    const newer = a.ctx.mergeBackup({
      'data.widgets': JSON.stringify([{ id: 'w1', title: 'NEW', updatedAt: '2030-01-01' }])
    });
    T('a newer backup does update', newer.updated === 1 &&
      a.ctx.Store.getJSON('data.widgets', [])[0].title === 'NEW');
    const guarded = a.ctx.mergeBackup({
      [a.ctx.KEYS.schemaVersion]: '"999"',
      [a.ctx.KEYS.backupPrefix + '1.data.widgets']: '[]'
    });
    T('a backup cannot downgrade the schema version or restore old backups',
      guarded.collections === 0 &&
      a.ctx.Store.get(a.ctx.KEYS.schemaVersion) === String(a.ctx.DATA_SCHEMA_VERSION));
  }

  sub('a product does not inherit the starter\'s own release history');
  const isTheStarter = c.APP_CONFIG.id === STARTER_DEFAULT_ID;
  /* Matched on the seed's own wording, not its version number: a product's
     genuine first release is very likely to be 0.1.0 / v0-1-0 too, and
     flagging that would be a false alarm. */
  const carriesSeed = c.APP_UPDATES.some(u =>
    u.id === STARTER_SEED_RELEASE && /starter foundation/i.test(u.summary || ''));
  T(isTheStarter
      ? 'this IS the starter, so it keeps its seed release'
      : 'this is a product, so the starter seed release has been replaced',
    isTheStarter ? carriesSeed : !carriesSeed,
    isTheStarter ? '' : 'still shipping ' + STARTER_SEED_RELEASE);

  sub('nothing hard-codes the starter identity');
  /* Contracts must follow the config, so that changing APP_ID does not turn
     the suite red. */
  const contractSrc = fs.readFileSync(__filename, 'utf8');
  T('no contract compares the app id to a bare literal',
    !/APP_CONFIG\.id\s*(===|!==|==|!=)\s*['"]/.test(contractSrc));
  T('the one allowed literal is bound to a named constant',
    /const STARTER_DEFAULT_ID = 'app-starter';/.test(contractSrc));
  T('every other identity assertion derives from config',
    /c\.APP_CONFIG\.id === STARTER_DEFAULT_ID/.test(contractSrc));
  T('no other source file pins it', (() => {
    const files = ['harness.js', 'run.js'].map(f =>
      fs.readFileSync(path.join(__dirname, f), 'utf8'));
    return files.every(t => t.indexOf('app-starter') === -1);
  })());
  T('the tooling does not pin it', (() => {
    const p = path.join(__dirname, '..', 'scripts');
    return ['config.js', 'contamination.js']
      .every(f => fs.readFileSync(path.join(p, f), 'utf8').indexOf('app-starter') === -1);
  })());
}

/* =========================================================
   CONTRACT 20 — CONTENT IS DATA, AND IT IS SOUND
   A mission that names a letter, a line or a skill that does not
   exist must fail the build — not show a five-year-old a blank tile.
   ========================================================= */
function testContent(){
  section('CONTRACT 20 — content is validated data, separate from the scenes');
  const app = H.loadApp();
  const c = app.ctx;

  sub('the shipped content passes its own validation');
  const problems = c.validateContent();
  T('validateContent() finds nothing wrong', problems.length === 0, problems.join(' | '));

  sub('validation actually catches the failures it names');
  const m = c.MISSIONS['moon-1'];
  const saved = JSON.stringify(m);
  m.activities.push({ type: 'find-letter', target: 'Ω', form: 'upper' });
  T('an unknown letter is caught', c.validateContent().some(p => /unknown letter/.test(p)));
  m.activities.pop();
  m.activities.push({ type: 'find-letter', target: 'I', form: 'upper' });
  T('an ambiguous letter is caught', c.validateContent().some(p => /ambiguous/.test(p)));
  m.activities.pop();
  m.activities.push({ type: 'find-letter', target: 'b', form: 'lower' });
  T('lowercase is caught while only uppercase is taught', c.validateContent().some(p => /uppercase/.test(p) || /unknown letter/.test(p)));
  m.activities.pop();
  m.activities.push({ type: 'trace-letter', target: 'M', form: 'upper' });
  T('an activity type nobody built is caught', c.validateContent().some(p => /unknown type/.test(p)));
  m.activities.pop();
  const oldSkill = m.skillId; m.skillId = 'rhyming';
  T('a mission for a skill that is only planned is caught', c.validateContent().some(p => /not built/.test(p)));
  m.skillId = oldSkill;
  const oldChoices = m.choices; m.choices = 7;
  T('too many choices for a kindergartener is caught', c.validateContent().some(p => /choices/.test(p)));
  m.choices = oldChoices;
  T('the mission is back to sound', JSON.stringify(m) === saved && c.validateContent().length === 0);

  sub('Phase 1 is exactly one real mission');
  T('one mission exists', Object.keys(c.MISSIONS).length === 1);
  T('it holds 5 to 8 interactions', m.activities.length >= 5 && m.activities.length <= 8, String(m.activities.length));
  T('it practises letter recognition', m.skillId === 'letter-recognition');
  T('it teaches uppercase only', m.activities.every(a => a.form === 'upper'));
  T('its first interaction teaches the tap itself', m.activities[0].guided === true);
  T('only the first one is guided', m.activities.filter(a => a.guided).length === 1);
  T('all seven learning areas are named, one built',
    Object.keys(c.SKILLS).length === 7 &&
    Object.keys(c.SKILLS).filter(k => c.SKILLS[k].status === 'active').length === 1);
  T('no destination exists that nobody can visit',
    Object.keys(c.DESTINATIONS).every(id => id === 'earth' || c.JOURNEY_ORDER.indexOf(id) !== -1));

  sub('story and learning are separate layers');
  T('a destination names its primary skill; a mission names its own',
    typeof c.DESTINATIONS.moon.primarySkill === 'string' && typeof m.skillId === 'string');
  T('the scenes never name a letter, a mission id or a skill',
    !/['"](moon-1|letter-recognition)['"]/.test(stripComments(js().slice(js().indexOf('SCENES\n'))).replace(/'moon'/g, '')));

  sub('the letter data is complete and self-consistent');
  const letters = Object.keys(c.LETTERS);
  T('all 26 uppercase letters are described', letters.length === 26 && letters.every(k => /^[A-Z]$/.test(k)));
  T('every letter has a spoken name and a shape family',
    letters.every(k => c.LETTERS[k].speak && c.LETTER_FAMILIES.indexOf(c.LETTERS[k].family) !== -1));
  T('a lookalike is always a real letter, never itself',
    letters.every(k => (c.LETTERS[k].lookalikes || []).every(x => c.LETTERS[x] && x !== k)));
  T('"A" is never handed to the voice bare — synthesisers read it as "uh"', c.LETTERS.A.speak !== 'A');
  T('the question always says "the letter", so "Find M" is never heard as "find \'em"',
    c.voiceCue('find.M').speak === 'Find the letter em.');
}

/* =========================================================
   CONTRACT 21 — THE LEARNING ENGINE
   Deterministic, understandable, and it never ends in failure.
   ========================================================= */
function testLearningEngine(){
  section('CONTRACT 21 — rounds, difficulty and help are deterministic and kind');
  const app = H.loadApp();
  const c = app.ctx;

  sub('a round is reproducible');
  const a = c.startRun('moon-1', new Date('2026-09-26T10:00:00Z'), 'run_seed');
  const b = c.startRun('moon-1', new Date('2026-09-26T10:00:00Z'), 'run_seed');
  c.beginRound(a, []); c.beginRound(b, []);
  T('the same run and evidence give the same choices', JSON.stringify(a.round.options) === JSON.stringify(b.round.options));
  const other = c.startRun('moon-1', new Date('2026-09-26T10:00:00Z'), 'run_other');
  const seen = new Set();
  for(let i = 0; i < 12; i++){ const r = c.startRun('moon-1', new Date(), 'run_' + i); c.beginRound(r, []); seen.add(r.round.options.join('')); }
  T('different runs do not always look the same', seen.size > 1, String(seen.size));
  c.beginRound(other, []);

  sub('every round is answerable and fair');
  let bad = 0, total = 0;
  Object.keys(c.LETTERS).filter(k => !c.LETTERS[k].ambiguous).forEach(target => {
    [1, 2, 3].forEach(tier => {
      for(let s = 0; s < 6; s++){
        total++;
        const built = c.ACTIVITY_TYPES['find-letter'].buildRound({ target, form: 'upper' },
          { tier, choices: 3, rand: c.seededRandom(target + tier + s) });
        const unique = new Set(built.options).size === built.options.length;
        const once = built.options.filter(x => x === target).length === 1;
        const noAmbiguous = built.options.every(x => !c.LETTERS[x].ambiguous);
        if(!(built.options.length === 3 && unique && once && built.options[built.answer] === target && noAmbiguous)) bad++;
      }
    });
  });
  T('across every letter and level: three choices, all different, the answer exactly once', bad === 0, bad + ' of ' + total);

  sub('difficulty means what it says');
  const pools = t => c.distractorPools(t);
  let easyOk = true, hardOk = true;
  Object.keys(c.LETTERS).filter(k => !c.LETTERS[k].ambiguous).forEach(target => {
    for(let s = 0; s < 5; s++){
      const easy = c.pickDistractors(target, 1, 2, c.seededRandom('e' + target + s));
      if(easy.some(x => c.areLookalikes(target, x))) easyOk = false;
      if(pools(target).otherFamily.length >= 2 && easy.some(x => c.LETTERS[x].family === c.LETTERS[target].family)) easyOk = false;
      const hard = c.pickDistractors(target, 3, 2, c.seededRandom('h' + target + s));
      if(pools(target).lookalike.length && !hard.some(x => c.areLookalikes(target, x))) hardOk = false;
    }
  });
  T('the easiest level never offers a lookalike, and differs in stroke shape', easyOk);
  T('the hardest level always includes a lookalike when one exists', hardOk);
  T('M\'s hardest round includes N or W — the spec\'s own example',
    c.pickDistractors('M', 3, 2, c.seededRandom('m')).some(x => x === 'N' || x === 'W'));

  sub('adaptation is a rule a grown-up could follow on paper');
  const band = { min: 1, max: 3 };
  T('no history starts at the easiest level', c.tierFor([], band) === 1);
  T('three first-try answers in a row step up one level', c.tierFor([1, 1, 1], band) === 2);
  T('six step up two', c.tierFor([1, 1, 1, 1, 1, 1], band) === 3);
  T('it never goes past the mission\'s ceiling', c.tierFor([1, 1, 1, 1, 1, 1, 1, 1, 1], { min: 1, max: 2 }) === 2);
  T('an answer that needed help steps back down', c.tierFor([1, 1, 1, 0], band) === 1);
  T('it never goes below the floor', c.tierFor([0, 0, 0], band) === 1);
  T('the level is never stored — it is recomputed from the answers', !/tier:\s*tierFor[\s\S]{0,40}persist/.test(js()) &&
    c.applyOutcome([], { skillId: 'letter-recognition', item: 'M', form: 'upper', outcome: 1, at: 'x' })[0].tier === undefined);
  const evidence = c.applyOutcome(c.applyOutcome(c.applyOutcome([], { skillId: 'letter-recognition', item: 'S', form: 'upper', outcome: 1, at: '1' }),
    { skillId: 'letter-recognition', item: 'S', form: 'upper', outcome: 1, at: '2' }),
    { skillId: 'letter-recognition', item: 'S', form: 'upper', outcome: 1, at: '3' });
  const run = c.startRun('moon-1', new Date(), 'run_adapt');
  run.index = 1;
  c.beginRound(run, evidence);
  T('a letter found first-try three times comes back harder', run.round.tier === 2, String(run.round.tier));
  run.index = 0;
  c.beginRound(run, evidence);
  T('the guided round is always the easiest', run.round.tier === 1);

  sub('the help ladder never ends in failure');
  const r = c.startRun('moon-1', new Date(), 'run_help');
  c.beginRound(r, []);
  const wrong = r.round.options.map((_, i) => i).filter(i => i !== r.round.answer);
  const first = c.answerRound(r, wrong[0]);
  T('a first wrong tap: "almost", listen again', first.correct === false && first.hint === 'almost');
  T('the same wrong tile cannot be counted twice', c.answerRound(r, wrong[0]).ignored === true);
  const second = c.answerRound(r, wrong[1]);
  T('a second wrong tap: the answer is shown', second.hint === 'show');
  T('only the answer is left to tap', r.round.out.length === 2);
  const done = c.answerRound(r, r.round.answer);
  T('and tapping it finishes the round', done.correct === true && r.round.resolved === true);
  T('a finished round ignores more taps', c.answerRound(r, r.round.answer).ignored === true);
  T('an impossible tap is ignored, not crashed on', c.answerRound(r, 99).ignored === true);

  sub('what a round is evidence of');
  const g = c.startRun('moon-1', new Date(), 'run_g');
  c.beginRound(g, []);
  T('the guided round is not evidence of anything', c.answerRound(g, g.round.answer).outcome === null);
  const q = c.startRun('moon-1', new Date(), 'run_q'); q.index = 1;
  c.beginRound(q, [], { audible: false });
  T('a round asked without sound is not evidence of recognising a spoken name', c.answerRound(q, q.round.answer).outcome === null);
  const f = c.startRun('moon-1', new Date(), 'run_f'); f.index = 1;
  c.beginRound(f, []);
  T('found on the first try from the spoken name: 1', c.answerRound(f, f.round.answer).outcome === 1);
  const h = c.startRun('moon-1', new Date(), 'run_h'); h.index = 1;
  c.beginRound(h, []);
  c.answerRound(h, h.round.options.map((_, i) => i).find(i => i !== h.round.answer));
  T('found with help: 0', c.answerRound(h, h.round.answer).outcome === 0);
  let ev = [];
  for(let i = 0; i < 20; i++) ev = c.applyOutcome(ev, { skillId: 'letter-recognition', item: 'T', form: 'upper', outcome: i % 2, at: String(i) });
  T('evidence keeps a running count', ev[0].seen === 20 && ev[0].firstTry === 10);
  T('but only the most recent answers', ev[0].recent.length === c.RECENT_LIMIT);
}

/* =========================================================
   CONTRACT 22 — THE STAR LEDGER
   Stars are for taking part. They are never a grade, never lost
   to a mistake, never awarded twice, never spent twice.
   ========================================================= */
function testStarLedger(){
  section('CONTRACT 22 — stars are an append-only ledger that cannot be gamed or broken');
  const app = H.loadApp();
  const c = app.ctx;

  sub('earning');
  let l = [];
  const first = c.awardStars(l, 'run_1', 3, 't');
  T('finishing a mission earns its stars', first.awarded && c.starBalance(first.ledger) === 3);
  l = first.ledger;
  for(let i = 0; i < 10; i++) l = c.awardStars(l, 'run_1', 3, 't').ledger;
  T('the same run can never be paid twice, however many times it is attempted', c.starBalance(l) === 3 && l.length === 1);
  T('a nonsense amount is refused', !c.awardStars(l, 'run_2', -3, 't').awarded && !c.awardStars(l, 'run_3', 1.5, 't').awarded);
  T('every entry is a record with an id, so backup merge unions ledgers safely', l.every(e => typeof e.id === 'string' && e.updatedAt));

  sub('spending');
  const short = c.unlockCosmetic([], 'paint-sky', 't');
  T('an unlock without enough stars is refused', short.ok === false && short.reason === 'short');
  T('and says exactly how many more are needed', short.short === 3);
  T('and changes nothing', short.ledger.length === 0);
  const bought = c.unlockCosmetic(l, 'paint-sky', 't');
  T('with enough stars it unlocks', bought.ok && c.ownedCosmetics(bought.ledger).indexOf('paint-sky') !== -1);
  T('the price comes off the balance', c.starBalance(bought.ledger) === 0);
  T('the spend is its own entry; the earning is untouched', bought.ledger.length === 2 && bought.ledger[0] === l[0]);
  const again = c.unlockCosmetic(c.awardStars(bought.ledger, 'run_2', 9, 't').ledger, 'paint-sky', 't');
  T('a cosmetic can never be bought twice', again.ok === false && again.reason === 'owned');
  T('an unknown cosmetic is refused', c.unlockCosmetic(l, 'paint-gold', 't').reason === 'unknown');
  T('the balance can never go below zero',
    c.starBalance(c.unlockCosmetic(bought.ledger, 'paint-lime', 't').ledger) >= 0);

  sub('derived, never stored');
  T('the balance is computed from the entries', /function starBalance\(ledger\)\{ return ledgerTotal\(ledger, 'earn'\) - ledgerTotal\(ledger, 'spend'\); \}/.test(js()));
  T('what is owned is computed from the entries', /function ownedCosmetics\(ledger\)\{[\s\S]{0,120}kind === 'spend'/.test(js()));
  T('no balance or owned list is ever written to storage', !/KEYS\.(balance|owned)/.test(js()));

  sub('mistakes never cost stars');
  T('nothing in answering a round touches the ledger', !/stars|ledger|Stars/.test(fnBody(js(), 'answerRound')));
  T('the reward is fixed per mission, not scored', /const s = awardStars\(journey\.stars, run\.id, m\.reward\.stars/.test(js()));

  sub('a debt from a failed write is repaid, once');
  const completions = [{ id: 'run_owed', missionId: 'moon-1', completedAt: 't' }];
  const once = c.reconcileStars(completions, [], 't');
  T('a finished mission with no stars recorded is paid on the next boot', once.added === 1 && c.starBalance(once.ledger) === 3);
  const twice = c.reconcileStars(completions, once.ledger, 't');
  T('and never paid again', twice.added === 0 && c.starBalance(twice.ledger) === 3);
  T('an unknown mission is not guessed at', c.reconcileStars([{ id: 'x', missionId: 'mars-9', completedAt: 't' }], [], 't').added === 0);
}

/* =========================================================
   CONTRACT 23 — COSMETICS STAY COSMETIC
   The Rocket Dock can only write stars and the rocket. A cosmetic
   bug must have no path to learning progress.
   ========================================================= */
function testCosmeticIsolation(){
  section('CONTRACT 23 — cosmetics are isolated from learning');
  const app = H.loadApp();
  const c = app.ctx;
  const src = js();

  sub('equipping');
  const ledger = c.awardStars([], 'run_1', 6, 't').ledger;
  T('an owned paint can be worn', c.equipCosmetic(null, 'paint-classic', ledger, 't').ok);
  T('a locked paint cannot', c.equipCosmetic(null, 'paint-sky', ledger, 't').reason === 'locked');
  T('an unknown paint cannot', c.equipCosmetic(null, 'paint-gold', ledger, 't').reason === 'unknown');
  T('a saved paint that is not owned shows the starter paint instead',
    c.equippedCosmetic({ paint: 'paint-lime' }, ledger, 'paint') === 'paint-classic');
  T('as does a saved paint nobody has heard of',
    c.equippedCosmetic({ paint: 'paint-gold' }, ledger, 'paint') === 'paint-classic');
  T('and nothing at all', c.equippedCosmetic(null, [], 'paint') === 'paint-classic');

  sub('a paint is a colour, not a picture — so paints scale');
  const paints = c.COSMETICS.filter(x => x.slot === 'paint');
  const tokens = css();
  T('no paint has a picture of its own', paints.every(p => !('asset' in p)));
  T('every paint names a colour token that exists', paints.every(p => new RegExp('--' + p.tint + ':\\s*#').test(tokens)),
    paints.filter(p => !new RegExp('--' + p.tint + ':\\s*#').test(tokens)).map(p => p.id).join(','));
  const bodyPath = c.assetSrc('rocket.body'), maskPath = c.assetSrc('rocket.paintMask');
  T('every paint draws the same rocket through the same paint mask',
    paints.every(p => { const h = c.rocketHtml(p.id, false); return h.indexOf(bodyPath) !== -1 && h.indexOf(maskPath) !== -1 && h.indexOf('var(--' + p.tint + ')') !== -1; }));
  T('the paint is multiplied, the way a matte surface takes colour, inside the rocket only',
    /\.rocket-paint\{[^}]*mix-blend-mode: multiply/.test(tokens) && /\.rocket\{[^}]*isolation: isolate/.test(tokens));
  T('adding a paint needs no new file: a made-up paint still draws a rocket', (() => {
    c.COSMETICS.push({ id: 'paint-test', slot: 'paint', name: 'Test', cost: 9, tint: 'paint-sky' });
    const h = c.rocketHtml('paint-test', false);
    c.COSMETICS.pop();
    return h.indexOf(bodyPath) !== -1 && h.indexOf('var(--paint-sky)') !== -1;
  })());

  sub('the Dock has no write path to learning');
  const dockCode = ['openDock', 'renderDockScene', 'pickPaint', 'dockAction', 'popDockRocket', 'leaveDock']
    .map(n => fnBody(src, n)).join('\n');
  T('the Dock code was found', dockCode.length > 500);
  ['KEYS.completions', 'KEYS.evidence', 'saveCompletions', 'saveEvidence', 'journey.completions =', 'journey.evidence =']
    .forEach(w => T('the Dock never touches ' + w, dockCode.indexOf(w) === -1));
  T('the Dock writes only through the two saves it owns',
    (dockCode.match(/save[A-Z][a-z]+\(/g) || []).every(s => s === 'saveStars(' || s === 'saveRocket('));
  /* A helper that saves is still a save: remembering "the Dock welcome was
     said" in the profile was nearly how the Dock gained a third key. */
  ['setStoryFlag', 'ensureProfile', 'KEYS.profile', 'journey.profile =']
    .forEach(w => T('the Dock never writes the profile, even through ' + w, dockCode.indexOf(w) === -1));
  const missionCode = ['choose', 'finishMission', 'nextStep', 'askRound', 'enterMission']
    .map(n => fnBody(src, n)).join('\n');
  T('and the mission never touches the rocket', missionCode.indexOf('saveRocket') === -1 && missionCode.indexOf('KEYS.rocket') === -1);

  sub('a broken cosmetic record cannot damage anything else');
  const shared = new Map();
  const a = H.loadApp({ sharedStorage: shared });
  a.ctx.ensureProfile();
  a.ctx.journey.completions = [{ id: 'run_1', missionId: 'moon-1', completedAt: 't', updatedAt: 't' }];
  a.ctx.saveCompletions();
  a.ctx.journey.evidence = a.ctx.applyOutcome([], { skillId: 'letter-recognition', item: 'M', form: 'upper', outcome: 1, at: 't' });
  a.ctx.saveEvidence();
  shared.set(a.ctx.STORAGE_NAMESPACE + a.ctx.KEYS.rocket, '{"paint": 42, broken');
  const b = H.loadApp({ sharedStorage: shared });
  T('it boots without errors', b.errors.length === 0, b.errors.join(' | '));
  T('learning progress is intact', b.ctx.journey.completions.length === 1 && b.ctx.journey.evidence.length === 1);
  T('the rocket simply wears the starter paint', b.ctx.currentPaint() === 'paint-classic');
  T('and the unreadable value was set aside, not destroyed',
    shared.get(b.ctx.STORAGE_NAMESPACE + b.ctx.KEYS.backupPrefix + 'unreadable.' + b.ctx.KEYS.rocket) === '{"paint": 42, broken');
}

/* =========================================================
   CONTRACT 24 — PROGRESS IS SAFE
   Progress is important to a child. It survives reloads, survives
   one corrupt key, and is never casually reset.
   ========================================================= */
function testPersistence(){
  section('CONTRACT 24 — a child\'s progress survives what devices do to it');
  const shared = new Map();
  const a = H.loadApp({ sharedStorage: shared });
  const c = a.ctx;

  sub('five keys, five meanings');
  ['profile', 'completions', 'stars', 'evidence', 'rocket'].forEach(k =>
    T('"' + k + '" is its own key under data.', c.KEYS[k] === 'data.' + k));
  T('preferences are per-device, under ui.', c.KEYS.sound.indexOf('ui.') === 0 && c.KEYS.motion.indexOf('ui.') === 0);

  sub('absent is a new explorer, never repaired with a default');
  T('no profile means no explorer yet', c.journey.profile === null);
  T('and nothing is written until the child starts', a.storage._map.size === 1);

  sub('a corrupt key is contained');
  c.ensureProfile();
  c.journey.stars = c.awardStars([], 'run_1', 3, 't').ledger;
  c.saveStars();
  c.journey.completions = [{ id: 'run_1', missionId: 'moon-1', completedAt: 't', updatedAt: 't' }];
  c.saveCompletions();
  shared.set(c.STORAGE_NAMESPACE + c.KEYS.evidence, '[{"id": broken');
  const b = H.loadApp({ sharedStorage: shared });
  T('a corrupt evidence key does not stop the app', b.errors.length === 0, b.errors.join(' | '));
  T('and costs no stars', b.ctx.starBalance(b.ctx.journey.stars) === 3);
  T('and no missions', b.ctx.journey.completions.length === 1);
  T('the unreadable value was kept aside before anything could overwrite it',
    shared.get(b.ctx.STORAGE_NAMESPACE + 'sys.backup.unreadable.' + b.ctx.KEYS.evidence) === '[{"id": broken');

  sub('a partial record is filtered, and the original kept');
  shared.set(c.STORAGE_NAMESPACE + c.KEYS.stars, JSON.stringify([
    { id: 'earn.run_1', kind: 'earn', amount: 3, runId: 'run_1', at: 't', updatedAt: 't' },
    { id: 'bogus', kind: 'gift', amount: 1000 }
  ]));
  const d = H.loadApp({ sharedStorage: shared });
  T('an invalid ledger entry is never counted', d.ctx.starBalance(d.ctx.journey.stars) === 3);

  sub('stars owed by an interrupted save are paid at boot');
  const s2 = new Map();
  const e = H.loadApp({ sharedStorage: s2 });
  e.ctx.ensureProfile();
  e.ctx.journey.completions = [{ id: 'run_lost', missionId: 'moon-1', completedAt: 't', updatedAt: 't' }];
  e.ctx.saveCompletions();
  const f = H.loadApp({ sharedStorage: s2 });
  T('the missing stars are awarded', f.ctx.starBalance(f.ctx.journey.stars) === 3);
  T('and written, so the next boot agrees', H.loadApp({ sharedStorage: s2 }).ctx.starBalance(H.loadApp({ sharedStorage: s2 }).ctx.journey.stars) === 3);

  sub('a failed write is remembered and surfaced');
  const g = H.loadApp({ failWrites: true });
  g.ctx.journey.stars = [];
  g.ctx.persist(g.ctx.KEYS.stars, [1]);
  T('the store is honest about being in memory only', !g.ctx.Store.isPersistent());
  T('the grown-ups area can say progress is not being saved', /Not saving/.test(js()));

  sub('the schema is versioned before the first release needs it');
  T('the data schema starts at 1', c.DATA_SCHEMA_VERSION === 1);
  T('a shape change must go through a migration', /Bump DATA_SCHEMA_VERSION only when the SHAPE/.test(js()));
}

/* =========================================================
   CONTRACT 25 — AUDIO, CAPTIONS AND THE VOICE
   The child is told everything out loud; the screen never gives
   the answer away; and turning the voice off is honoured.
   ========================================================= */
async function testAudio(){
  section('CONTRACT 25 — every line has a script, and the screen never gives the answer');
  const app = H.loadApp();
  const c = app.ctx;

  sub('every line a scene can ask for exists');
  const src = js();
  /* A literal ending in "." is a prefix a value is appended to — find.M,
     stars.have.3 — and is covered by the generated-line checks below. */
  const literal = [...src.matchAll(/Voice\.(?:say|sequence)\(\s*\[?\s*'([a-z][A-Za-z0-9.]*)'/g)]
    .map(m => m[1]).filter(id => !/\.$/.test(id));
  const missing = [...new Set(literal)].filter(id => !c.voiceCue(id));
  T('each literal line id resolves to a line', missing.length === 0, missing.join(','));
  c.MISSIONS['moon-1'].activities.forEach(a => {
    T('the question for ' + a.target + ' exists', !!c.voiceCue('find.' + a.target));
    T('and its praise', !!c.voiceCue('found.' + a.target + '.0'));
    T('and its "here it is"', !!c.voiceCue('show.' + a.target));
  });
  T('every destination story line exists', Object.values(c.DESTINATIONS.moon.story).every(id => c.lineExists(id)));
  const families = [...new Set(Object.keys(c.VOICE_CUES).map(id => (id.match(/^(.*)\.\d+$/) || [])[1]).filter(Boolean))];
  T('every line family is reachable, from .1 up with no gaps',
    families.length > 0 && families.every(f => c.familySize(f) >= 1 &&
      Object.keys(c.VOICE_CUES).filter(id => id.indexOf(f + '.') === 0 && /\.\d+$/.test(id)).length === c.familySize(f)),
    families.join(','));
  T('a family wraps, so any count picks a real line',
    families.every(f => [0, 1, 2, 3, 7, 100].every(n => !!c.voiceCue(c.familyLine(f, n)))));
  T('star counts from 0 to 50 all have lines', Array.from({ length: 51 }, (_, n) => n).every(n => c.voiceCue('stars.have.' + n)));
  T('every price shortfall has a line', [1, 2, 3, 4, 5, 6].every(n => c.voiceCue('dock.needMore.' + n)));
  T('every paint has its name spoken', c.COSMETICS.every(x => c.voiceCue('paint.' + x.id)));

  sub('the screen never gives the answer away');
  Object.keys(c.LETTERS).forEach(L => {
    const cue = c.voiceCue('find.' + L);
    if(cue.text.indexOf(L) !== -1 && !/letter/i.test(cue.text.replace(L, ''))) T('the question for ' + L + ' hides the letter', false);
  });
  T('the caption for a question never shows the letter', Object.keys(c.LETTERS).every(L => c.voiceCue('find.' + L).text === 'Find the letter!'));
  T('only when nothing can be heard does it fall back to showing it', c.voiceCue('find.M').visual === 'Find M');
  T('a spoken line and its caption are separate fields', Object.values(c.VOICE_CUES).every(v => v.text && v.speak));
  T('recordings attach by id without touching any scene', typeof c.VOICE_RECORDINGS === 'object' && c.voiceCue('find.M').file === null);

  sub('the device voice is labelled as the temporary stand-in it is');
  T('the grown-ups area says so', /temporary stand-in for recorded narration/.test(src));
  T('the audio section says so', /TEMPORARY stand-in/.test(src));
  T('and it names the voice in use, the only way to see it on a device', /'Voice in use: '/.test(src));

  sub('the most natural voice the device has is chosen, never a novelty one');
  /* Found on a real iPad: "robotic". The app took the first English voice
     listed, and pitch-shifted it. These are voice ids as iPadOS reports them. */
  const V = (name, lang, uri) => ({ name, lang, voiceURI: uri, localService: true, default: false });
  const albert = V('Albert', 'en-US', 'com.apple.speech.synthesis.voice.Albert');
  const bubbles = V('Bubbles', 'en-US', 'com.apple.speech.synthesis.voice.Bubbles');
  const rocko = V('Rocko', 'en-US', 'com.apple.eloquence.en-US.Rocko');
  const samantha = V('Samantha', 'en-US', 'com.apple.voice.compact.en-US.Samantha');
  const daniel = V('Daniel (Enhanced)', 'en-GB', 'com.apple.voice.enhanced.en-GB.Daniel');
  const thomas = V('Thomas', 'fr-FR', 'com.apple.voice.compact.fr-FR.Thomas');
  const ava = V('Ava (Premium)', 'en-US', 'com.apple.voice.premium.en-US.Ava');
  const listed = [albert, bubbles, rocko, samantha, daniel, thomas, ava];
  T('a Premium US voice wins when installed', c.bestVoice(listed) === ava);
  T('an Enhanced voice beats a compact one', c.bestVoice([samantha, V('Samantha (Enhanced)', 'en-US', 'com.apple.voice.enhanced.en-US.Samantha')]).voiceURI.indexOf('enhanced') !== -1);
  T('a US voice beats a British Enhanced one: US English is the intended locale',
    c.bestVoice([albert, rocko, daniel, samantha]) === samantha);
  T('the order the device lists voices in does not matter',
    c.bestVoice(listed.slice().reverse()) === ava && c.bestVoice([ava].concat(listed)) === ava);
  T('an Eloquence voice ranks below a compact one', c.bestVoice([rocko, samantha]) === samantha);
  T('a novelty voice is never chosen while any other English voice exists', c.bestVoice([albert, bubbles, rocko]) === rocko);
  T('another language is never chosen at all', c.bestVoice([thomas]) === null);
  T('the voice is not pitch-shifted, which made it sound robotic on a real iPad', c.SPEECH_STYLE.pitch === 1);
  T('it speaks US English', c.SPEECH_STYLE.lang === 'en-US');
  {
    const sp0 = fakeSpeech();
    const v0 = H.loadApp({ windowExtras: sp0.extras });
    fast(v0.ctx);
    await v0.ctx.Voice.say('guide.welcome');
    const u0 = sp0.utterances[0];
    T('the speech engine is actually given that style and voice',
      !!u0 && u0.pitch === 1 && u0.rate === v0.ctx.SPEECH_STYLE.rate && u0.voice && u0.voice.name === 'Test');
  }
  {
    /* The advice in the grown-ups area is to download a Premium voice. One
       downloaded while the app is open must not wait for a reload. */
    const installed = [samantha];
    const spoken = [];
    let changed = null;
    const synth = {
      paused: false,
      speak(u){ spoken.push(u); setTimeout(() => { if(u.onstart) u.onstart(); if(u.onend) u.onend(); }, 0); },
      cancel(){}, resume(){},
      getVoices(){ return installed.slice(); },
      addEventListener(type, fn){ if(type === 'voiceschanged') changed = fn; }
    };
    const v1 = H.loadApp({ windowExtras: { speechSynthesis: synth, SpeechSynthesisUtterance: function(t){ this.text = t; } } });
    fast(v1.ctx);
    await v1.ctx.Voice.say('guide.welcome');
    installed.push(ava);
    if(changed) changed();
    await v1.ctx.Voice.say('mission.howTo');
    T('a better voice installed while the app is open is used from the next line',
      spoken.length === 2 && spoken[0].voice === samantha && spoken[1].voice === ava);
  }

  sub('turning the voice off is honoured');
  const sp = fakeSpeech();
  const quiet = H.loadApp({ windowExtras: sp.extras });
  const q = fast(quiet.ctx);
  q.soundPrefs.voice = false;
  await q.Voice.say('guide.welcome');
  T('with spoken instructions off, nothing is spoken', sp.said.length === 0, sp.said.join(' | '));
  q.soundPrefs.voice = true;
  await q.Voice.say('guide.welcome');
  T('turned back on, the line is spoken', sp.said.length === 1 && /I'm Pip/.test(sp.said[0]));

  sub('a voice that never starts cannot freeze the child');
  const stuck = { speechSynthesis: { paused: false, speak(){}, cancel(){}, resume(){}, getVoices(){ return []; } },
                  SpeechSynthesisUtterance: function(t){ this.text = t; } };
  const s = H.loadApp({ windowExtras: stuck });
  const sc = fast(s.ctx);
  sc.TIMING.speechStartGrace = 20; sc.TIMING.speechSafetyBase = 60000;
  const t0 = Date.now();
  await sc.Voice.say('guide.welcome');
  T('a line that never begins is abandoned after the grace period, not the long safety timer', Date.now() - t0 < 2000, (Date.now() - t0) + 'ms');

  sub('the voice is quiet when the app is not');
  T('leaving the app stops Pip mid-sentence', /visibilitychange[\s\S]{0,120}Voice\.stop\(\)/.test(src));
  T('the grown-ups area silences the child\'s lines', /function openGrownups\(\)\{\s*Voice\.stop\(\);/.test(src));
  T('turning the iPad to portrait asks the child to turn it back — without writing into a scene\'s caption',
    c.voiceCue('rotate').offscreen === true);
}

/* =========================================================
   CONTRACT 26 — ASSETS AND PROVENANCE
   Every picture is registered with where it came from. Nothing
   from the moodboard can ever be shipped.
   ========================================================= */
function testAssets(){
  section('CONTRACT 26 — every picture is registered, present, and ours');
  const app = H.loadApp();
  const c = app.ctx;
  const reg = c.ASSET_REGISTRY;

  sub('the registry');
  T('ids are unique', new Set(reg.map(a => a.id)).size === reg.length);
  T('every entry has purpose, source, licence, format, size and state',
    reg.every(a => a.purpose && a.source && a.license && a.format && a.dimensions && c.ASSET_STATES.indexOf(a.state) !== -1));
  T('every registered file exists', reg.every(a => fs.existsSync(path.join(H.ROOT, a.path))),
    reg.filter(a => !fs.existsSync(path.join(H.ROOT, a.path))).map(a => a.path).join(','));
  T('nothing claims to be FINAL: only a person signs art off', reg.every(a => a.state !== 'FINAL'));
  T('every draft says what made it', reg.filter(a => a.state === 'DRAFT').every(a => /tools\/art/.test(a.source)));
  const JOBS = require(path.join(H.ROOT, 'tools', 'art', 'jobs.js'));
  const targets = [];
  JOBS.forEach(j => { targets.push(j.target); if(j.paintMask) targets.push(j.paintMask.target); });
  T('every rendered picture has a render job, so it can be made again', reg.filter(a => a.state === 'DRAFT').every(a => targets.indexOf(a.path) !== -1),
    reg.filter(a => a.state === 'DRAFT' && targets.indexOf(a.path) === -1).map(a => a.path).join(','));
  T('and every render job ships a registered picture', targets.every(t => reg.some(a => a.path === t)),
    targets.filter(t => !reg.some(a => a.path === t)).join(','));

  sub('small enough for an iPad on a slow connection');
  T('pictures ship as WebP; only the Home Screen icons are PNG, because iOS requires it',
    reg.every(a => a.format === 'webp' || (a.format === 'png' && /^icon-\d+\.png$/.test(a.path))));
  const sizes = {};
  reg.forEach(a => { sizes[a.id] = fs.statSync(path.join(H.ROOT, a.path)).size; });
  const wrongSize = reg.filter(a => { const d = imageSize(path.join(H.ROOT, a.path)); return !d || d.join('×') !== a.dimensions; });
  T('the registry states each picture\'s real size', wrongSize.length === 0,
    wrongSize.map(a => a.id + ' ' + (imageSize(path.join(H.ROOT, a.path)) || ['?']).join('×') + ' vs ' + a.dimensions).join(', '));
  const heavy = reg.filter(a => sizes[a.id] > 260 * 1024);
  T('no single picture is over 260 KB', heavy.length === 0, heavy.map(a => a.id + ' ' + Math.round(sizes[a.id] / 1024) + 'KB').join(','));
  const total = Object.keys(sizes).reduce((s, k) => s + sizes[k], 0);
  T('the whole picture set is under 1.2 MB, so offline install stays quick', total < 1.2 * 1024 * 1024, Math.round(total / 1024) + 'KB');
  const firstScreen = ['bg.space', 'planet.earth', 'planet.moon', 'planet.moonLit', 'rocket.body', 'rocket.paintMask', 'character.pip', 'prop.star'];
  const first = firstScreen.reduce((s, id) => s + (sizes[id] || 0), 0);
  T('the first Earth screen needs under 700 KB of pictures', first < 700 * 1024, Math.round(first / 1024) + 'KB');

  sub('one studio: every picture comes from the same renderer and the same light');
  const artDir = path.join(H.ROOT, 'tools', 'art');
  const sceneFiles = fs.readdirSync(path.join(artDir, 'scenes')).filter(f => /\.js$/.test(f));
  const sceneSrc = sceneFiles.map(f => fs.readFileSync(path.join(artDir, 'scenes', f), 'utf8')).join('\n');
  T('the light rig is declared once, in the renderer', /const RIG = \{/.test(fs.readFileSync(path.join(artDir, 'clay.js'), 'utf8')));
  T('no scene brings its own key or rim light, so nothing is lit from another direction',
    !/\bRIG\s*=|\bRIG\.\w+\s*=|\bdir\s*:/.test(stripComments(sceneSrc)));
  const toolSrc = ['clay.js', 'render.js', 'encode.js', 'jobs.js'].map(f => fs.readFileSync(path.join(artDir, f), 'utf8')).join('\n') + sceneSrc;
  T('the renderer never reads the moodboard', !/references/.test(stripComments(toolSrc)));
  T('master renders are never committed', /tools\/art\/out\//.test(fs.readFileSync(path.join(H.ROOT, '.gitignore'), 'utf8')));

  sub('nothing is shipped that is not registered');
  const files = [];
  (function walk(dir){
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const full = path.join(dir, e.name);
      if(e.isDirectory()) walk(full); else files.push(path.relative(H.ROOT, full).split(path.sep).join('/'));
    });
  })(path.join(H.ROOT, 'assets'));
  const unregistered = files.filter(f => !reg.some(a => a.path === f));
  T('every file under assets/ has a registry entry', unregistered.length === 0, unregistered.join(','));

  sub('the moodboard can never reach production');
  /* What would actually be requested: code (not the comments that explain
     the rule), markup attributes, the precache list and the manifest. */
  const html = H.readApp();
  const requested = stripComments(js()) + stripComments(H.readSW()) + JSON.stringify(H.readManifest()) +
    [...html.matchAll(/(?:href|src)\s*=\s*"([^"]+)"/g)].map(m => m[1]).join('\n');
  T('nothing the app loads or caches points into references/', !/references\//.test(requested));
  T('no registered path lies outside assets/ or the app icons',
    reg.every(a => /^(assets\/|icon-\d+\.png$)/.test(a.path)));
  T('the moodboard folder is git-ignored', /references\/visual\/\*/.test(fs.readFileSync(path.join(H.ROOT, '.gitignore'), 'utf8')));
  T('and its rules are written down', fs.existsSync(path.join(H.ROOT, 'references', 'README.md')));

  sub('derived from the registry, so they cannot drift');
  const sw = H.readSW();
  T('the service worker precaches every registered file', reg.every(a => sw.indexOf("'./" + a.path + "'") !== -1));
  const manifest = fs.readFileSync(path.join(H.ROOT, 'docs', 'ASSET-MANIFEST.md'), 'utf8');
  T('the asset manifest lists every registered file', reg.every(a => manifest.indexOf('`' + a.path + '`') !== -1));
  T('and is marked as generated', /Do not hand-edit/.test(manifest));
}

/* =========================================================
   CONTRACT 27 — PRIVACY
   Local-first, no network, no trackers, no way out of child mode.
   ========================================================= */
function testPrivacy(){
  section('CONTRACT 27 — nothing leaves the device, and nothing leads a child away');
  const src = stripComments(js()), html = H.readApp();

  sub('no network');
  ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource', 'importScripts'].forEach(api =>
    T('the app never calls ' + api, src.indexOf(api) === -1));
  T('no analytics or tracking identifier is named anywhere',
    !/analytics|gtag|mixpanel|segment\.io|firebase|supabase|sentry|amplitude/i.test(html));

  sub('no way out of child mode');
  T('there is no link to anywhere at all', !/<a\s[^>]*href=/i.test(html) && src.indexOf('window.open') === -1);
  T('no field asks a child for anything', !/<input(?![^>]*type="file")/i.test(html));
  T('the only file input is the grown-ups backup import', (html.match(/<input/g) || []).length === 1 &&
    /id="importInput"/.test(html));

  sub('the profile holds nothing personal');
  const app = H.loadApp();
  const p = app.ctx.ensureProfile();
  T('an explorer is a story, not a person: no name, email, age or location',
    Object.keys(p).every(k => ['id', 'createdAt', 'updatedAt', 'story'].indexOf(k) !== -1), Object.keys(p).join(','));
}

/* =========================================================
   CONTRACT 28 — THE WHOLE CHILD JOURNEY
   Not a unit: the Phase 1 loop, end to end, through the same
   functions the buttons call — then reloaded.
   ========================================================= */
async function testChildJourney(){
  section('CONTRACT 28 — welcome → Earth → Moon → stars → Rocket Dock → reload');
  const shared = new Map();
  const sp = fakeSpeech();
  const app = H.loadApp({ sharedStorage: shared, windowExtras: sp.extras });
  const c = fast(app.ctx);

  sub('first launch');
  T('it opens on the welcome', c.currentScene === 'welcome');
  await c.startAdventure();
  T('the first tap creates the explorer', !!c.journey.profile);
  T('Pip introduces itself out loud', sp.said.some(s => /I'm Pip/.test(s)));
  T('and the child arrives on Earth', c.currentScene === 'earth');
  T('where Pip names the one thing to do', sp.said.some(s => /Launch button/.test(s)));

  sub('launch and the first arrival');
  await c.launch();
  T('launching arrives at the Moon mission', c.currentScene === 'mission');
  T('the first arrival tells the story', sp.said.some(s => /beacon is dim/.test(s)));
  T('and explains the task once', sp.said.some(s => /I'll say a letter/.test(s)));
  T('then asks the first question out loud', /Find the letter em\./.test(sp.said[sp.said.length - 1]));
  T('the arrival is remembered for next time', c.storyFlag('arrived.moon'));

  sub('the mission, with mistakes');
  const saidBefore = sp.said.length;
  await playMission(c, { wrongRounds: [2] });
  const lines = sp.said.slice(saidBefore);
  T('a wrong answer hears "…Listen again."', lines.some(s => /Listen again\./.test(s)));
  T('a second wrong answer is shown the answer', lines.some(s => /Here it is!/.test(s)));
  const praiseSet = new Set();
  c.MISSIONS['moon-1'].activities.forEach(a => {
    for(let k = 0; k < c.LETTER_LINES.found.length; k++) praiseSet.add(c.voiceCue('found.' + a.target + '.' + k).speak);
  });
  T('every correct answer is praised, by name', lines.filter(s => praiseSet.has(s)).length === c.MISSIONS['moon-1'].activities.length);
  T('the mission ends in the celebration', c.currentScene === 'celebrate');
  T('with the beacon relit', lines.some(s => /beacon is shining again/.test(s)));
  T('and the stars announced', lines.some(s => /You found 3 stars!/.test(s)));

  sub('what was recorded');
  T('one completion', c.journey.completions.length === 1);
  T('exactly one earning of 3 stars — mistakes cost nothing', c.starBalance(c.journey.stars) === 3 && c.journey.stars.length === 1);
  const rec = c.journey.completions[0];
  T('the run summary is honest: 1 guided, 1 with help, 4 first try',
    rec.unscored === 1 && rec.helped === 1 && rec.firstTry === 4, JSON.stringify(rec));
  T('the guided round left no evidence', c.journey.evidence.length === 4, String(c.journey.evidence.length));
  T('finishing twice pays nothing more', (() => {
    const before = c.journey.stars.length;
    const fakeRun = { id: rec.id, missionId: 'moon-1', startedAt: rec.startedAt, results: [], index: 6 };
    c.finishMission(fakeRun);
    return c.journey.stars.length === before && c.journey.completions.length === 1;
  })());

  sub('home, and the progress it shows');
  c.showScene('celebrate');
  await c.flyHome();
  T('the child flies back to Earth', c.currentScene === 'earth');
  T('the Moon is restored on the map', c.destinationProgress('moon', c.journey.completions).restored);
  T('Pip points at the Dock once, because there are stars to spend', sp.said.some(s => /paint brush/.test(s)));
  T('and remembers having done so', c.storyFlag('heard.dockHint'));

  sub('the Rocket Dock');
  c.openDock();
  T('the Dock opens', c.currentScene === 'dock');
  c.pickPaint('paint-lime');
  c.dockAction();
  T('a paint the child cannot afford is not bought', c.ownedCosmetics(c.journey.stars).indexOf('paint-lime') === -1);
  T('Pip says how many more stars it needs', /You need 3 more stars/.test(sp.said[sp.said.length - 1]));
  c.pickPaint('paint-sky');
  c.dockAction();
  c.dockAction();
  T('an affordable paint unlocks', c.ownedCosmetics(c.journey.stars).indexOf('paint-sky') !== -1);
  T('and is worn at once', c.currentPaint() === 'paint-sky');
  T('a second tap does not spend twice', c.journey.stars.filter(e => e.kind === 'spend').length === 1);
  T('the balance is what is left', c.starBalance(c.journey.stars) === 0);
  c.pickPaint('paint-sunny');
  c.leaveDock();
  T('leaving with an unchosen preview keeps the real paint', c.currentPaint() === 'paint-sky');

  sub('reload');
  const again = H.loadApp({ sharedStorage: shared });
  const r = again.ctx;
  T('no errors on reload', again.errors.length === 0, again.errors.join(' | '));
  T('it opens on Earth, not the welcome', r.currentScene === 'earth');
  T('the mission is still finished', r.journey.completions.length === 1);
  T('the Moon is still restored', r.destinationProgress('moon', r.journey.completions).restored);
  T('the stars are still spent, and only once', r.starBalance(r.journey.stars) === 0 && r.journey.stars.length === 2);
  T('the rocket still wears its new paint', r.currentPaint() === 'paint-sky');
  T('the letters practised are still there', r.journey.evidence.length === 4);

  sub('a replay');
  const sp2 = fakeSpeech();
  const third = H.loadApp({ sharedStorage: shared, windowExtras: sp2.extras });
  const t = fast(third.ctx);
  await t.launch();
  const arrivals = [1, 2, 3].map(n => t.voiceCue('story.moon.arrive.' + n).speak);
  T('a returning explorer hears a short arrival, not the whole story again',
    sp2.said.some(s => arrivals.indexOf(s) !== -1) && !sp2.said.some(s => /beacon is dim/.test(s)));
  await playMission(t);
  T('a replay earns stars too — practice is taking part', t.starBalance(t.journey.stars) === 3);
  T('and is recorded as its own run', t.journey.completions.length === 2);

  sub('leaving a mission early');
  await t.flyHome();
  await t.launch();
  const found = t.session.run.round ? await t.choose(t.session.run.round.answer) : null;
  t.askGoHome();
  t.__flush();
  T('the "go home?" sheet opens', third.dom.document.getElementById('homeSheet').classList.contains('open'));
  t.closeHomeSheet();
  t.__flush();
  T('"keep playing" returns to the same round', t.currentScene === 'mission' && t.session.run !== null);
  t.askGoHome();
  t.__flush();
  const starsBefore = t.starBalance(t.journey.stars);
  await t.goHomeFromMission();
  T('"go home" flies back to Earth', t.currentScene === 'earth' && t.session.run === null);
  T('no stars are given for an unfinished mission — and none taken', t.starBalance(t.journey.stars) === starsBefore);
  T('no completion is recorded for it', t.journey.completions.length === 2);
  void found;
}

/* =========================================================
   CONTRACT 29 — MOTION, AND WHAT TIMING PROMISES
   ========================================================= */
async function testMotion(){
  section('CONTRACT 29 — transitions are fast, skippable, and optional');
  const app = H.loadApp();
  const c = app.ctx;

  sub('the promised timings');
  T('an ordinary flight is about a second', c.TIMING.travel >= 500 && c.TIMING.travel <= 1500, String(c.TIMING.travel));
  T('only the first flight to a place is longer', c.TIMING.travelFirst > c.TIMING.travel && c.TIMING.travelFirst <= 3000);
  T('with Reduce Motion a flight is a short crossfade', c.TIMING.travelReduced <= 400);
  T('a flight can be skipped with a tap', /onclick="skipTravel\(\)"/.test(H.readApp()));
  T('the grown-ups hold takes three seconds', c.TIMING.gateHold === 3000);

  sub('Reduce Motion, from the grown-ups setting');
  c.setMotionPref('reduce');
  T('the setting applies at once', app.dom.document.documentElement.getAttribute('data-motion') === 'reduce' && c.motionReduced());
  T('and is saved for this device', c.Store.get(c.KEYS.motion) === 'reduce');
  const t0 = Date.now();
  c.TIMING.travelReduced = 30; c.TIMING.travelSettle = 0;
  await c.travel('out', { first: true });
  T('a reduced flight takes the crossfade time, even the first one', Date.now() - t0 < 500, (Date.now() - t0) + 'ms');
  c.setMotionPref('system');
  T('"match this device" removes the override', c.Store.get(c.KEYS.motion) === null && !c.motionReduced());
  c.setMotionPref('sideways');
  T('a nonsense value changes nothing', c.motionPref === 'system');

  sub('Reduce Motion, from the device');
  const r = H.loadApp({ windowExtras: { matchMedia: q => ({ matches: /reduce/.test(q), addEventListener(){}, removeEventListener(){} }) } });
  T('the device preference is honoured without any setting', r.ctx.motionReduced());
  T('and the flight resting state is its destination, so nothing is lost without animation',
    /\.travel-out \.t-earth\{ opacity: 0;/.test(css()) && /\.travel-home \.t-moon\{ opacity: 0;/.test(css()));
}

/* =========================================================
   CONTRACT 30 — WHEN PIP SPEAKS
   Found on a real iPad: the same sentences, in the same words, on
   every visit. Pip now speaks by rule — an instruction once, a hint
   only when a child seems stuck, a recurring moment in words not
   just heard, and a sentence always finished.
   ========================================================= */
async function testDialogue(){
  section('CONTRACT 30 — Pip speaks when it helps, and never the same way twice in a row');
  const sp = fakeSpeech();
  const app = H.loadApp({ windowExtras: sp.extras });
  const c = fast(app.ctx);
  const family = base => new Set(Array.from({ length: c.familySize(base) }, (_, i) => c.voiceCue(base + '.' + (i + 1)).speak));
  const inFamily = base => { const set = family(base); return s => set.has(s); };
  const letterLines = kind => {
    const set = new Set();
    Object.keys(c.LETTERS).forEach(L => c.LETTER_LINES[kind].forEach((_, k) => set.add(c.voiceCue(kind + '.' + L + '.' + k).speak)));
    return s => set.has(s);
  };
  /* Which phrasing a letter line uses, whatever the letter: two praises for
     different letters are still the same words if the phrasing is. */
  const phrasing = kind => s => {
    for(const L of Object.keys(c.LETTERS)){
      for(let k = 0; k < c.LETTER_LINES[kind].length; k++) if(c.voiceCue(kind + '.' + L + '.' + k).speak === s) return k;
    }
    return -1;
  };
  const isHint = inFamily('guide.launchHint');
  const isAlmost = inFamily('feedback.almost');
  const isQuestion = letterLines('find');
  const isPraise = letterLines('found');
  const noRepeats = list => list.every((s, i) => i === 0 || s !== list[i - 1]);
  const rounds = c.MISSIONS['moon-1'].activities.length;
  /* A question, as opposed to the same question again after "almost". */
  const asked = m => m.filter((s, i) => isQuestion(s) && !isAlmost(m[i - 1]));
  const reasked = m => m.filter((s, i) => isQuestion(s) && isAlmost(m[i - 1]));
  const pick = (lists, pred) => lists.map(l => l.find(pred)).filter(Boolean);
  const line = id => c.voiceCue(id).speak;

  sub('an instruction is given once, then Pip waits to be needed');
  await c.startAdventure();
  T('arriving on Earth the first time explains the Launch button', sp.said.filter(isHint).length === 1);
  const missions = [], trips = [];
  for(let i = 0; i < 4; i++){
    const at = sp.said.length;
    await c.launch();
    await playMission(c, { wrongRounds: i === 1 ? [1, 3] : [] });
    const home = sp.said.length;
    await c.flyHome();
    missions.push(sp.said.slice(at, home));
    trips.push(sp.said.slice(home));
  }
  T('four missions and four trips home later, it has not been repeated unasked', sp.said.filter(isHint).length === 1);
  T('"the beacon is shining again" is said at the relight, and only then',
    missions[0].indexOf(line('story.moon.restored')) !== -1 && missions.slice(1).every(m => m.indexOf(line('story.moon.restored')) === -1));
  T('"look, the Moon is shining" is said on the flight home from that mission, and only then',
    trips[0].indexOf(line('guide.moonShining')) !== -1 && trips.slice(1).every(t => t.indexOf(line('guide.moonShining')) === -1));
  T('the paint-brush hint is volunteered once, not on every return', sp.said.filter(s => s === line('guide.dockHint')).length === 1);
  T('the task is explained on the first arrival only', sp.said.filter(s => s === line('mission.howTo')).length === 1);

  sub('a moment that recurs is never said the same way twice in a row');
  const launches = pick(missions, inFamily('travel.launch'));
  T('launching', launches.length === 4 && noRepeats(launches), launches.join(' / '));
  const arrivals = pick(missions.slice(1), inFamily('story.moon.arrive'));
  T('arriving', arrivals.length === 3 && noRepeats(arrivals), arrivals.join(' / '));
  const finishes = pick(missions.slice(1), inFamily('story.moon.shining'));
  T('finishing', finishes.length === 3 && noRepeats(finishes), finishes.join(' / '));
  const homes = pick(trips.slice(1), inFamily('guide.home'));
  T('coming home', homes.length === 3 && noRepeats(homes), homes.join(' / '));
  T('each question, in every mission',
    missions.every(m => asked(m).length === rounds && noRepeats(asked(m).map(phrasing('find')))));
  T('each praise, in every mission',
    missions.every(m => m.filter(isPraise).length === rounds && noRepeats(m.filter(isPraise).map(phrasing('found')))));
  const almosts = missions[1].filter(isAlmost);
  T('"almost"', almosts.length === 2 && noRepeats(almosts), almosts.join(' / '));
  T('but the first question of a mission is always the plainest',
    missions.every(m => m.find(isQuestion) === line('find.' + c.MISSIONS['moon-1'].activities[0].target)));
  T('and after "almost", the question comes again in its plainest words',
    reasked(missions[1]).length === 2 && reasked(missions[1]).every(s => phrasing('find')(s) === 0));
  T('every question and every praise says "the letter ___", so a letter name is never heard as a word',
    ['find', 'again', 'found', 'show'].every(k => c.LETTER_LINES[k].every(t => /the letter \{L\}/i.test(t))));

  sub('a hint only when a child seems stuck, and only once a visit');
  c.TIMING.idleHint = 60;
  let mark = sp.said.length;
  await c.goEarth([]);
  T('a visit with nothing new to say is quiet', sp.said.length === mark);
  await wait(30);
  T('a short pause is left alone', sp.said.length === mark);
  c.noteActivity();
  await wait(45);
  T('a tap restarts the wait: a child who is tapping is not stuck', sp.said.length === mark);
  await wait(90);
  const hint = sp.said.slice(mark);
  T('a child who stops hears one hint', hint.length === 1 && isHint(hint[0]), hint.join(' / '));
  T('in different words from the last time it was explained', hint[0] !== sp.said.filter(isHint).slice(-2)[0]);
  await wait(150);
  T('and no second one on the same visit', sp.said.length === mark + 1);

  sub('asked, by a tap, Pip answers — and finishes its sentence');
  mark = sp.said.length;
  c.tapPip(); c.tapPip(); c.tapPip();
  T('three quick taps on Pip start one answer, not three beginnings', sp.said.length === mark + 1);
  await wait(20);
  c.tapPip();
  const answers = sp.said.slice(mark);
  T('with stars to spend, the answers take turns between the Dock and the launch',
    answers.length === 2 && answers[0] === line('guide.dockHint') && isHint(answers[1]), answers.join(' / '));
  await wait(20);
  mark = sp.said.length;
  c.sayStarCount(); c.sayStarCount();
  T('tapping the star count twice says it once, whole', sp.said.length === mark + 1);
  await wait(20);
  c.sayStarCount();
  T('and again once it has finished, because it was asked again', sp.said.length === mark + 2);

  sub('the Rocket Dock explains itself once');
  await wait(20);
  const isDockIdle = inFamily('dock.idle');
  mark = sp.said.length;
  c.openDock();
  await wait(150);
  const visit1 = sp.said.slice(mark);
  T('the first visit welcomes', visit1.indexOf(line('dock.welcome')) !== -1);
  T('and a child who has not tried a color is offered one hint', visit1.filter(isDockIdle).length === 1, visit1.join(' / '));
  c.leaveDock();
  await wait(20);
  mark = sp.said.length;
  c.openDock();
  await wait(20);
  T('a second visit is quiet', sp.said.length === mark);
  c.pickPaint('paint-sky');
  await wait(150);
  T('a child who tries a color is not told to try a color', !sp.said.slice(mark).some(isDockIdle));
  c.leaveDock();
  await wait(20);
  mark = sp.said.length;
  c.openDock();
  await wait(150);
  const visit3 = sp.said.slice(mark).filter(isDockIdle);
  T('a later pause is met in other words', visit3.length === 1 && visit3[0] !== visit1.filter(isDockIdle)[0], visit3.join(' / '));
  c.leaveDock();

  sub('grown-ups and missions are not interrupted by Earth hints');
  mark = sp.said.length;
  c.openGrownups();
  await wait(150);
  T('with the grown-ups area open, no hint', sp.said.length === mark);
  c.closeGrownups();
  await wait(10);                     // back on Earth, and the wait for a hint has begun
  mark = sp.said.length;
  await c.launch();
  await wait(150);
  const inMission = sp.said.slice(mark);
  T('the Earth hint never follows the child into a mission', !inMission.some(isHint), inMission.join(' / '));
  const q = inMission[inMission.length - 1];
  T('the mission is waiting on its question', isQuestion(q), q);

  sub('in a mission, Pip waits, then nudges — twice at most');
  c.TIMING.reprompt = 30;
  mark = sp.said.length;
  c.repeatPrompt(); c.repeatPrompt();
  T('the speaker button repeats the question in the same words — once, however hard it is pressed',
    sp.said[mark] === q && sp.said.length === mark + 1);
  await wait(250);
  const nudges = sp.said.slice(mark + 1);
  T('silence is met with a nudge, a second nudge, then patience', nudges.length === 2, nudges.join(' / '));
  T('each nudge is new words, not a replay', nudges.length === 2 && nudges[0] !== q && nudges[1] !== q && nudges[0] !== nudges[1]);
  T('and still names the letter', nudges.every(s => /the letter/.test(s)));
  c.TIMING.reprompt = 1e9;
}

/* =========================================================
   CONTRACT 31 — THE CLAY WORLD STAYS READABLE, AND LINED UP
   Phase 1.2 made the world clay. Art must never make the learning
   harder to read, and the app's lights must sit where the renders
   put the things they light.
   ========================================================= */
function luminance(hexColour){
  const n = parseInt(hexColour.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function cssRule(sheet, selector){
  const at = sheet.indexOf(selector + '{');
  return at === -1 ? '' : sheet.slice(at, sheet.indexOf('}', at) + 1);
}
function cssPercent(rule, prop){
  const m = rule.match(new RegExp('(?:^|[\\s;{])' + prop + ':\\s*([\\d.]+)%'));
  return m ? Number(m[1]) : NaN;
}
/* Where a point in a scene lands in its picture, through the scene's own
   camera: the numbers the CSS anchors must agree with. */
function projectInScene(sceneName, variant, p){
  const Cl = require(path.join(H.ROOT, 'tools', 'art', 'clay.js'));
  const s = require(path.join(H.ROOT, 'tools', 'art', 'scenes', sceneName + '.js')).build(variant);
  const cam = s.camera;
  const f = Cl.norm3([cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]]);
  const r = Cl.norm3(Cl.cross3(f, [0, 1, 0]));
  const u = Cl.cross3(r, f);
  const th = Math.tan(cam.fov * Math.PI / 360), aspect = s.width / s.height;
  const d = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
  const z = Cl.dot3(d, f);
  return [(Cl.dot3(d, r) / z / (th * aspect) + 1) * 50, (1 - Cl.dot3(d, u) / z / th) * 50];
}

async function testClayWorld(){
  section('CONTRACT 31 — the clay world stays readable, and its lights stay on their lamps');
  const app = H.loadApp();
  const c = app.ctx;
  const sheet = css();

  sub('learning clarity comes before art');
  const tile = cssRule(sheet, '.choice');
  T('a letter tile has no picture or texture behind its letter', tile.length > 0 && !/url\(|background-image/.test(tile));
  T('its surface and ink come from tokens', /background: var\(--tile-surface\)/.test(tile) && /color: var\(--tile-ink\)/.test(tile));
  const surf = (sheet.match(/--brand-lavender:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  const ink = (sheet.match(/--brand-ink:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  const ratio = surf && ink ? (luminance(surf) + 0.05) / (luminance(ink) + 0.05) : 0;
  T('the letters keep a contrast of at least 7:1 against their tile', ratio >= 7, ratio.toFixed(1) + ':1');

  sub('restoring the Moon is a change a child can see from home');
  const moon = c.DESTINATIONS.moon;
  T('the Moon has a restored picture as well as a waiting one', !!c.assetEntry(moon.restoredAsset) && moon.restoredAsset !== moon.asset);
  c.renderEarth();
  const moonHtml = app.dom.document.getElementById('earthMoon').innerHTML;
  T('home draws both, so relighting can crossfade', moonHtml.indexOf(c.assetSrc(moon.asset)) !== -1 && moonHtml.indexOf(c.assetSrc(moon.restoredAsset)) !== -1);
  T('and the restored one shows once the Moon is restored', /\.earth-moon\.is-restored \.moon-lit\{\s*opacity: 1;/.test(sheet));
  T('the beacon lights up the same way in the celebration',
    /artImg\('prop\.beaconLit'/.test(js()) && /\.celebrate-beacon\.is-lit \.beacon-on\{\s*opacity: 1;/.test(sheet));

  /* The payoff happens where the child can see it: home from the relighting
     mission, the Moon is dark for a beat and then lights up. */
  const shared = new Map();
  const sp = fakeSpeech();
  const j = H.loadApp({ sharedStorage: shared, windowExtras: sp.extras });
  const jc = fast(j.ctx);
  jc.TIMING.relight = 30;
  const moonHost = () => j.dom.document.getElementById('earthMoon');
  await (async () => {
    await jc.startAdventure();
    await jc.launch();
    await playMission(jc);
    await jc.flyHome();
    T('home from the relighting mission, the Moon is dark at first', jc.currentScene === 'earth' && !moonHost().classList.contains('is-restored'));
    await wait(80);
    T('then it lights up while the child watches', moonHost().classList.contains('is-restored'));
    await jc.launch();
    await playMission(jc);
    await jc.flyHome();
    T('on later trips home it is simply lit', moonHost().classList.contains('is-restored'));
  })();

  sub('characters move like stop-motion; navigation never does');
  T('Pip holds each pose for a frame', /steps\(\d+\)/.test(cssRule(sheet, '.pip')));
  T('so does the rocket waiting on Earth', /rocket-idle [\d.]+s steps\(\d+\)/.test(sheet));
  T('a scene change stays smooth', !/steps\(/.test(cssRule(sheet, '.scene.active')));

  sub('the app\'s lights sit on the renders\' lamps');
  const pipRule = cssRule(sheet, '.pip-light');
  const ball = projectInScene('pip', undefined, [0.045, 0.83, 0]);
  T('Pip\'s speaking light is on the antenna ball', Math.abs(cssPercent(pipRule, 'left') - ball[0]) < 0.6 && Math.abs(cssPercent(pipRule, 'top') - ball[1]) < 0.6,
    'css ' + cssPercent(pipRule, 'left') + '%,' + cssPercent(pipRule, 'top') + '% vs render ' + ball.map(v => v.toFixed(1)).join('%,') + '%');
  const moonRule = cssRule(sheet, '.moon-light');
  const lamp = projectInScene('moon', 'dim', [0.238 * 1.128, 0.381 * 1.128, 0.894 * 1.128]);
  T('the Moon\'s beacon glow is on its lamp', Math.abs(cssPercent(moonRule, 'left') - lamp[0]) < 0.8 && Math.abs(cssPercent(moonRule, 'top') - lamp[1]) < 0.8,
    'css ' + cssPercent(moonRule, 'left') + '%,' + cssPercent(moonRule, 'top') + '% vs render ' + lamp.map(v => v.toFixed(1)).join('%,') + '%');
  const beaconRule = cssRule(sheet, '.beacon-lamp');
  const blamp = projectInScene('beacon', 'on', [0, 1.4, 0]);
  T('the lighthouse glow is on its lamp', Math.abs(cssPercent(beaconRule, 'top') - blamp[1]) < 0.8, 'css ' + cssPercent(beaconRule, 'top') + '% vs render ' + blamp[1].toFixed(1) + '%');
  const flameRule = cssRule(sheet, '.rocket-flame');
  const nozzle = projectInScene('rocket', undefined, [0, -1.065, 0]);
  T('the flame hangs from the nozzle, centred', Math.abs(cssPercent(flameRule, 'left') + cssPercent(flameRule, 'width') / 2 - 50) < 0.6 &&
    Math.abs(cssPercent(flameRule, 'top') - nozzle[1]) < 3, 'flame top ' + cssPercent(flameRule, 'top') + '% vs nozzle ' + nozzle[1].toFixed(1) + '%');
}

module.exports = {
  T, section, sub, results, reset, testPortability, testClayWorld,
  testBoot, testConfig, testStorage, testCollision, testMigration,
  testNavigation, testOverlays, testToast, testConfirmation, testErase,
  testMobile, testDesignSystem, testPWA, testRelease, testStress,
  testAccessibility, testContamination, testSourcesOfTruth,
  testContent, testLearningEngine, testStarLedger, testCosmeticIsolation,
  testPersistence, testAudio, testAssets, testPrivacy, testChildJourney, testMotion,
  testDialogue
};
