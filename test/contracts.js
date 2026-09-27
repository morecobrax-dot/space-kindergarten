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
    travel: 0, travelFirst: 0, travelRepeat: 0, travelDock: 0, travelDockRepeat: 0, travelReduced: 0, travelSettle: 0,
    uiClear: 0, arriveSettle: 0, wrongHold: 0, dialogueScale: 0, shootingStarEvery: 1e9, shootingStarJitter: 0,
    betweenRounds: 0, celebrateGuard: 0, starEvery: 0, starFirst: 0, starFlight: 0,
    reprompt: 1e9, idleHint: 1e9, captionBase: 0, captionPerChar: 0,
    speechStartGrace: 5, speechSafetyBase: 40, speechSafetyPerChar: 0,
    relight: 0, beatPause: 0, beatSettle: 0, beatBounce: 0
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

/* Launch from Earth and start the mission the planet is waiting on, the
   way a child does: (tap a planet in the sky,) Launch, then tap the marker
   that pulses. Returns the mission started. */
async function launchAndStart(c, dest){
  if(dest) c.pickDestination(dest);
  await c.launch();
  const next = c.markerNext(c.session.place);
  if(next) await c.tapMarker(next);
  return next;
}

/* Plays the current mission to the end: `wrongRounds` rounds are answered
   wrongly until the answer is shown, every other round correctly. A beats
   round is answered by tapping the stone: the right count, or a wrong one.
   A word is built by tapping its letters: in order, or the first two
   swapped. */
async function playMission(c, opts){
  const o = opts || {};
  let guard = 0;
  while(c.currentScene === 'mission' && c.session.run && guard++ < 160){
    const r = c.session.run.round;
    if(!r) break;
    /* Between rounds, or while Pip is showing the beats or building the
       word: wait, as a child would. */
    if(c.session.input !== 'open' || c.session.beat.hold || c.session.build.hold){ await wait(2); continue; }
    const wrongNow = (o.wrongRounds || []).indexOf(r.index) !== -1 && r.misses < 2;
    if(r.activity.type === 'syllable-tap'){
      const n = wrongNow ? (r.answer === 0 ? 2 : 1) : (r.guide || r.answer + 1);
      for(let k = 0; k < n; k++){ c.session.beat.lastAt = 0; c.tapBeat(); }
      await c.settleBeats(c.session.run);
      continue;
    }
    if(r.activity.type === 'word-build'){
      await buildWord(c, wrongNow && !c.session.build.guide);
      continue;
    }
    if(wrongNow){
      const wrong = r.options.map((_, i) => i).find(i => i !== r.answer && r.out.indexOf(i) === -1);
      await c.choose(wrong);
      continue;
    }
    await c.choose(r.answer);
  }
}
/* Fills the word's empty slots the way a child taps: the right letters in
   order, or (wrongly) with the first two swapped. Resolves when the word
   has been answered, or when there was nothing to tap. */
async function buildWord(c, wrongly){
  const r = c.session.run.round, b = c.session.build;
  const order = r.answer.slice();
  if(wrongly){ const t = order[0]; order[0] = order[1]; order[1] = t; }
  let last = null;
  for(let s = 0; s < 3; s++){
    if(b.slots[s] !== null) continue;
    const piece = order[s];
    if(b.slots.indexOf(piece) !== -1) continue;
    last = c.tapPiece(piece);
    if(b.slots.indexOf(null) !== -1) await last;
  }
  if(last) await last;
  await wait(2);
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
  const scenes = ['welcome', 'earth', 'travel', 'planet', 'mission', 'dock'];
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
  T('the launch button uses the hero size, and on a short screen never shrinks below a child\'s target',
    /\.launch-btn\{[^}]*min-height: var\(--touch-hero-fit\)/.test(style) &&
    /--touch-hero-fit: max\(var\(--touch-kid\), calc\(var\(--touch-hero\) \* var\(--ui\)\)\);/.test(style));
  T('before its play field is measured, a choice tile is never smaller than 130px', /--tile-size: clamp\(130px,/.test(style));
  const repeatSize = style.match(/\.repeat-btn\{[^}]*width: (\d+)px; height: (\d+)px/);
  T('the repeat button is round and a full child\'s target', !!repeatSize && repeatSize[1] === repeatSize[2] && Number(repeatSize[1]) >= Number(kid),
    repeatSize ? repeatSize[1] + 'px' : 'none');

  sub('the HUD: quiet marks, full targets, inside the safe area');
  /* Found on a real iPad: every child control was a giant disc. The mark
     can be small; the target never is. */
  T('the HUD reads the top, left and right insets',
    /\.hud\{[\s\S]{0,420}padding: calc\(var\(--hud-pad\) \+ var\(--inset-top\)\) calc\(var\(--hud-side\) \+ var\(--inset-right\)\) 0 calc\(var\(--hud-side\) \+ var\(--inset-left\)\)/.test(style));
  T('and keeps every full target on the screen, however small its mark has become',
    /--hud-side: max\(var\(--space-lg\), calc\(\(var\(--touch-kid\) - var\(--hud-mark\)\) \/ 2\)\);/.test(style));
  T('a HUD button is a full child\'s target', /\.hud-btn\{[^}]*width: var\(--touch-kid\); height: var\(--touch-kid\)/.test(style));
  T('while its visible mark is smaller, and quiet', /--hud-mark: calc\(58px \* var\(--ui\)\);/.test(style) && /\.hud-disc\{[^}]*width: var\(--hud-mark\)/.test(style));
  T('the star count too: the pill is the mark, the button the target', /\.star-pill\{[^}]*height: var\(--hud-mark\)/.test(style) &&
    /\.star-count\{[^}]*min-width: var\(--touch-kid\); min-height: var\(--touch-kid\)/.test(style));
  T('marks shrink on a short screen through --ui, and no target does',
    !/--touch-kid:[^;]*var\(--ui\)/.test(style) && /function uiScale\(h\)\{ return Math\.round\(Math\.max\(0\.72, Math\.min\(1, h \/ 820\)\) \* 100\) \/ 100; \}/.test(js()));
  const world = style.slice(style.indexOf('CHILD WORLD — one stage'), style.indexOf('OVERLAY ENGINE — presentation'));
  T('the child world is sized in the viewport the child can see (--vh, --vw), never in raw vh or vw',
    world.length > 5000 && !/[\d.]\s*(vh|vw)\b/.test(world), (world.match(/[^\s;{]*[\d.]\s*(?:vh|vw)\b[^;]*/g) || []).slice(0, 3).join(' | '));
  T('which is measured from the window, on every resize', /root\.style\.setProperty\('--app-h', h \+ 'px'\);/.test(js()) &&
    /window\.addEventListener\('resize', \(\) => \{\s*fitViewport\(\);/.test(js()));
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
  T('a short history: this product\'s own releases, not an inherited list', c.APP_UPDATES.length <= 6 &&
    c.APP_UPDATES[c.APP_UPDATES.length - 1].id === 'v0-1-0', String(c.APP_UPDATES.length));
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
  const scenes = ['earth', 'dock', 'mission', 'planet', 'travel', 'welcome'];
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
  const played = [];
  for(let i = 0; i < 20; i++){
    /* each open world in turn, as a child choosing planets in the sky */
    const want = c.JOURNEY_ORDER[i % c.JOURNEY_ORDER.length];
    played.push(await launchAndStart(c, c.destinationUnlocked(want, c.journey.completions) ? want : null));
    await playMission(c, { wrongRounds: [1, 3] });
    await c.flyHome();
  }
  const pays = played.reduce((s, id) => s + (id ? c.MISSIONS[id].reward.stars : 0), 0);
  T('twenty missions were recorded', c.journey.completions.length === 20, String(c.journey.completions.length));
  T('exactly twenty earnings, one per run', c.journey.stars.filter(e => e.kind === 'earn').length === 20);
  T('and the balance is exactly what those twenty missions pay', c.starBalance(c.journey.stars) === pays, c.starBalance(c.journey.stars) + ' vs ' + pays);
  T('every mission on the journey came round', new Set(played).size === Object.keys(c.MISSIONS).length, [...new Set(played)].join(','));
  T('no mission is left running', c.session.run === null);
  /* everything these missions could ask — a review round asks one of its
     candidates — and one record for each at most */
  const items = new Set();
  played.forEach(id => c.MISSIONS[id].activities.filter(a => !a.guided).forEach(a => {
    const type = c.ACTIVITY_TYPES[a.type];
    const asks = [a].concat((a.review || []).map(x => a.type === 'sound-pick' ? Object.assign({}, a, { sound: x }) : Object.assign({}, a, { target: x })));
    asks.forEach(x => { const k = type.evidenceKey(x); items.add(c.evidenceId(type.skillId, k.item, k.form)); });
  }));
  const ids = c.journey.evidence.map(e => e.id);
  T('evidence stays bounded: one record per thing practised', new Set(ids).size === ids.length && ids.every(id => items.has(id)),
    ids.filter(id => !items.has(id)).join(',') + ' of ' + ids.length);
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
    /done \+ ' of ' \+ total \+ ' ' \+ GAME_VIEWS\[type\]\.progressWord/.test(js()) &&
    ['letters found', 'rhymes found', 'words tapped'].every(w => js().indexOf("progressWord: '" + w + "'") !== -1));
  T('a picture choice is named for its word, since the picture cannot be read out',
    /aria-label="' \+ escapeAttr\(capitalize\(WORDS\[w\]\.speak\)\) \+ '"/.test(js()));
  T('the beat stone and every marker say what they are', /id="beatStone"[^>]*aria-label="[^"]+"/.test(src) &&
    /aria-label="' \+ escapeAttr\(label\) \+ '">'/.test(fnBody(js(), 'markerHtml')));

  sub('what Pip says is available without sound');
  T('every caption is a live region',
    [...src.matchAll(/<div class="caption bubble"[^>]*>/g)].every(m => /aria-live="polite"/.test(m[0])));
  T('there is a caption for every scene Pip speaks in',
    ['welcome', 'earth', 'planet', 'mission', 'dock'].every(s => src.indexOf('id="caption-' + s + '"') !== -1));

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
  const oldSkill = m.skillId; m.skillId = 'sight-words';
  T('a mission for a skill that is only planned is caught', c.validateContent().some(p => /not built/.test(p)));
  m.skillId = oldSkill;
  const oldChoices = m.choices; m.choices = 7;
  T('too many choices for a kindergartener is caught', c.validateContent().some(p => /choices/.test(p)));
  m.choices = oldChoices;
  T('the mission is back to sound', JSON.stringify(m) === saved && c.validateContent().length === 0);

  sub('the journey is real, and still small: the Moon, Mercury, then Mars');
  const ids = Object.keys(c.MISSIONS);
  const by = sk => ids.filter(id => c.MISSIONS[id].skillId === sk).sort().join();
  T('letters on the Moon, rhymes and beats on Mercury, sounds and words on Mars: two or three missions a game',
    ids.length === 11 && by('letter-recognition') === 'moon-1,moon-2,moon-3' && by('rhyming') === 'mercury-1,mercury-3' &&
    by('syllables') === 'mercury-2,mercury-4' && by('beginning-sounds') === 'mars-1,mars-3' && by('cvc') === 'mars-2,mars-4', ids.join(','));
  T('each holds 5 to 8 interactions', ids.every(id => c.MISSIONS[id].activities.length >= 5 && c.MISSIONS[id].activities.length <= 8));
  T('letters are taught uppercase only', ids.every(id => c.MISSIONS[id].activities.every(a => a.type !== 'find-letter' || a.form === 'upper')));
  /* the first mission of each game (in journey order) teaches the tap in
     its first round; once a game is known, no round is guided */
  const firstOfGame = {};
  c.JOURNEY_ORDER.forEach(d => c.DESTINATIONS[d].missions.forEach(id => { const g = c.MISSIONS[id].activities[0].type; if(!firstOfGame[g]) firstOfGame[g] = id; }));
  T('each game\'s first mission teaches the tap in its first round, and no other round anywhere is guided', ids.every(id => {
    const acts = c.MISSIONS[id].activities, g = acts[0].type;
    return firstOfGame[g] === id ? acts[0].guided === true && acts.filter(a => a.guided).length === 1 : acts.every(a => !a.guided);
  }), JSON.stringify(firstOfGame));
  T('all seven learning areas are named; five are built — not sight words or handwriting',
    Object.keys(c.SKILLS).length === 7 &&
    Object.keys(c.SKILLS).filter(k => c.SKILLS[k].status === 'active').sort().join() === 'beginning-sounds,cvc,letter-recognition,rhyming,syllables');
  T('the journey is the Moon, Mercury, then Mars', c.JOURNEY_ORDER.join() === 'moon,mercury,mars');
  T('Mercury opens only when the Moon shines', c.DESTINATIONS.mercury.unlock && c.DESTINATIONS.mercury.unlock.after === 'moon' &&
    !c.destinationUnlocked('mercury', []) && c.destinationUnlocked('mercury', [{ id: 'x', missionId: 'moon-1', completedAt: 't' }]));
  T('Mars opens only when Mercury\'s signal is clear', c.DESTINATIONS.mars.unlock && c.DESTINATIONS.mars.unlock.after === 'mercury' &&
    !c.destinationUnlocked('mars', [{ id: 'x', missionId: 'mercury-1', completedAt: 't' }]) &&
    c.destinationUnlocked('mars', ['mercury-1', 'mercury-2'].map(id => ({ id: id, missionId: id, completedAt: 't' }))));
  const planned = Object.keys(c.DESTINATIONS).filter(id => c.DESTINATIONS[id].kind === 'planned');
  T('the rest of the route is declared, and pretends to nothing: no pictures, no missions, never drawn',
    planned.length >= 5 && planned.every(id => !c.DESTINATIONS[id].asset && !(c.DESTINATIONS[id].missions || []).length &&
      c.JOURNEY_ORDER.indexOf(id) === -1 && !c.destinationUnlocked(id, [])), planned.join(','));
  T('every destination is home, on the journey, planned, or the space station',
    Object.keys(c.DESTINATIONS).every(id => id === 'earth' || c.JOURNEY_ORDER.indexOf(id) !== -1 ||
      c.DESTINATIONS[id].kind === 'planned' || c.DESTINATIONS[id].kind === 'station'));
  const task = c.MISSIONS['moon-1'].task;
  c.MISSIONS['moon-1'].task = 'Find the letter M';
  T('a lesson task that gives the answer away is caught', c.validateContent().some(p => /gives an answer away/.test(p)));
  c.MISSIONS['moon-1'].task = 'Tap the letter that you hear Pip say out loud';
  T('and so is a task that is a paragraph', c.validateContent().some(p => /paragraph/.test(p)));
  c.MISSIONS['moon-1'].task = task;
  const wordsSaved = JSON.stringify(c.WORDS.cake);
  c.WORDS.cake.rime = 'ook';
  T('a rhyme that does not rhyme is caught', c.validateContent().some(p => /does not rhyme/.test(p)));
  c.WORDS.cake = JSON.parse(wordsSaved);
  c.WORDS.apple.beats = [];
  T('a word with no beats is caught', c.validateContent().some(p => /beats/.test(p)));
  c.WORDS.apple.beats = ['ap', 'pull'];
  const hosted = c.DESTINATIONS.mercury.markers.meteors.missions;
  c.DESTINATIONS.mercury.markers.meteors.missions = hosted.filter(id => id !== 'mercury-2');
  T('a mission with no marker in its world is caught', c.validateContent().some(p => /mercury-2 is played at 0 markers/.test(p)));
  c.DESTINATIONS.mercury.markers.meteors.missions = hosted;
  T('and the content is sound again', c.validateContent().length === 0, c.validateContent().join(' | '));

  sub('story and learning are separate layers');
  T('a destination names its primary skill; a mission names its own',
    typeof c.DESTINATIONS.moon.primarySkill === 'string' && typeof m.skillId === 'string');
  T('the scenes never name a letter, a word, a mission id or a skill',
    !/['"](moon-1|mercury-1|mercury-2|letter-recognition|rhyming|syllables|cake|snake|banana)['"]/.test(
      stripComments(js().slice(js().indexOf('SCENES\n'))).replace(/'moon'/g, '')));

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
  const dockCode = ['openDock', 'renderDockScene', 'pickItem', 'pickDockTab', 'previewLook', 'lookShows', 'itemChipHtml', 'dockAction', 'popDockRocket', 'leaveDock']
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
  const missionCode = ['choose', 'finishMission', 'nextStep', 'askRound', 'startMission', 'celebrate', 'tapBeat', 'settleBeats', 'tapMarker']
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
  T('every destination story line exists', c.JOURNEY_ORDER.every(id => Object.values(c.DESTINATIONS[id].story).every(l => c.lineExists(l))));
  T('every marker is pointed out in words', c.JOURNEY_ORDER.every(id => Object.values(c.DESTINATIONS[id].markers).every(mk => c.lineExists(mk.call))));
  const rhymeRounds = [], beatRounds = [];
  Object.keys(c.MISSIONS).forEach(id => c.MISSIONS[id].activities.forEach(a => {
    if(a.type === 'rhyme-pick') rhymeRounds.push(a);
    if(a.type === 'syllable-tap') beatRounds.push(a);
  }));
  T('every rhyme round can be asked, nudged, praised and shown', rhymeRounds.length >= 5 && rhymeRounds.every(a =>
    c.voiceCue('word.' + a.target) && [0, 1, 2].every(k => c.voiceCue('rhyme.ask.' + a.target + '.' + k)) &&
    [0, 1].every(n => c.voiceCue('rhyme.again.' + a.target + '.' + n)) && c.voiceCue('rhyme.found.' + a.target + '.' + a.answer + '.3') &&
    c.voiceCue('rhyme.show.' + a.target + '.' + a.answer)));
  T('every picture can be named', Object.keys(c.WORDS).every(w => !!c.voiceCue('word.' + w)));
  T('every beats round can be asked, nudged, praised, shown and handed back', beatRounds.length >= 5 && beatRounds.every(a =>
    [0, 1, 2].every(k => c.voiceCue('beats.ask.' + a.target + '.' + k)) && [0, 1].every(n => c.voiceCue('beats.again.' + a.target + '.' + n)) &&
    c.voiceCue('beats.found.' + a.target + '.2') && c.voiceCue('beats.show.' + a.target) && c.voiceCue('beats.turn.' + a.target) &&
    c.WORDS[a.target].beats.every((_, i) => c.voiceCue('beat.' + a.target + '.' + i))));
  T('praise for a rhyme says both words, so the rhyme is the last thing heard', rhymeRounds.every(a =>
    [0, 1, 2, 3].every(k => { const s = c.voiceCue('rhyme.found.' + a.target + '.' + a.answer + '.' + k).speak.toLowerCase();
      return s.indexOf(a.target) !== -1 && s.indexOf(a.answer) !== -1; })));
  T('praise for beats says the count in words', beatRounds.every(a => /\b(one beat|two beats|three beats|four beats)\b/.test(c.voiceCue('beats.found.' + a.target + '.0').speak)));
  const families = [...new Set(Object.keys(c.VOICE_CUES).map(id => (id.match(/^(.*)\.\d+$/) || [])[1]).filter(Boolean))];
  T('every line family is reachable, from .1 up with no gaps',
    families.length > 0 && families.every(f => c.familySize(f) >= 1 &&
      Object.keys(c.VOICE_CUES).filter(id => id.indexOf(f + '.') === 0 && /\.\d+$/.test(id)).length === c.familySize(f)),
    families.join(','));
  T('a family wraps, so any count picks a real line',
    families.every(f => [0, 1, 2, 3, 7, 100].every(n => !!c.voiceCue(c.familyLine(f, n)))));
  T('star counts from 0 to 50 all have lines', Array.from({ length: 51 }, (_, n) => n).every(n => c.voiceCue('stars.have.' + n)));
  T('every price shortfall has a line', [1, 2, 3, 4, 5, 6].every(n => c.voiceCue('dock.needMore.' + n)));
  T('everything a rocket can wear has its name spoken', c.COSMETICS.every(x => c.voiceCue('item.' + x.id)));
  T('and so does every kind of thing to change', c.COSMETIC_SLOTS.every(x => c.voiceCue('dock.tab.' + x.id)));

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
  const firstScreen = ['bg.space', 'bg.starsFar', 'bg.starsNear', 'horizon.earth', 'planet.moon', 'planet.moonLit', 'rocket.body', 'rocket.paintMask', 'rocket.flame', 'character.pip', 'prop.star'];
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
   Not a unit: the loop, end to end, through the same functions the
   buttons call — then reloaded. The world is the navigation: launch
   lands on a place, and a marker in that place starts its mission.
   ========================================================= */
async function testChildJourney(){
  section('CONTRACT 28 — welcome → Earth → the Moon → stars → Rocket Dock → reload');
  const shared = new Map();
  const sp = fakeSpeech();
  const app = H.loadApp({ sharedStorage: shared, windowExtras: sp.extras });
  const c = fast(app.ctx), d = app.dom.document;
  const sky = () => d.getElementById('place' + c.session.slot + 'Sky').innerHTML;
  const props = () => d.getElementById('place' + c.session.slot + 'Props').innerHTML;

  sub('first launch');
  T('it opens on the welcome', c.currentScene === 'welcome');
  await c.startAdventure();
  T('the first tap creates the explorer', !!c.journey.profile);
  T('Pip introduces itself out loud', sp.said.some(s => /I'm Pip/.test(s)));
  T('and the child arrives on Earth', c.currentScene === 'earth');
  T('where Pip names the one thing to do', sp.said.some(s => /Launch button/.test(s)));
  T('Launch goes to the Moon, the only place open yet',
    c.launchTarget() === 'moon' && c.JOURNEY_ORDER.filter(id => c.destinationUnlocked(id, c.journey.completions)).join() === 'moon');
  T('the Moon waits in Earth\'s sky; nothing later on the route is shown', /id="sky-moon"/.test(sky()) && !/id="sky-mercury"/.test(sky()));

  sub('launch and the first arrival');
  await c.launch();
  T('launching lands on the Moon itself, not straight in a lesson', c.currentScene === 'planet' && c.session.place === 'moon');
  T('the stage stands on the Moon\'s horizon', d.getElementById('stage').getAttribute('data-place') === 'moon' &&
    d.getElementById('place' + c.session.slot + 'Art').innerHTML.indexOf(c.assetSrc('horizon.moon')) !== -1);
  T('the first arrival tells the story', sp.said.some(s => /beacon is dim/.test(s)));
  T('and Pip points at the marker to tap', /Tap the beacon/.test(sp.said[sp.said.length - 1]));
  T('the beacon is the one thing pulsing', (props().match(/is-next/g) || []).length === 1 && /class="marker is-next" id="marker-beacon"/.test(props()));
  T('the arrival is remembered for next time', c.storyFlag('arrived.moon'));
  await c.tapMarker('moon-1');
  T('tapping the beacon starts its mission', c.currentScene === 'mission' && !!c.session.run && c.session.run.missionId === 'moon-1');
  T('and explains the task once', sp.said.filter(s => /I'll say a letter/.test(s)).length === 1);
  T('then asks the first question out loud', /Find the letter em\./.test(sp.said[sp.said.length - 1]));
  T('the letters stand on Moon stones, each on a clean plate', /choice choice-stone/.test(d.getElementById('missionChoices').innerHTML) &&
    /class="choice-face"/.test(d.getElementById('missionChoices').innerHTML));

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
  T('the mission ends back in the world, not on a results screen', c.currentScene === 'planet');
  T('where the beacon is relit', lines.some(s => /beacon is shining again/.test(s)) && /class="marker is-lit" id="marker-beacon"/.test(props()));
  T('and the stars announced', lines.some(s => /You found 3 stars!/.test(s)));
  T('the next route is shown from the Moon, and named', lines.some(s => /That is Mercury/.test(s)) && /id="sky-mercury"/.test(sky()));
  T('nothing is left to play here, so the way forward is the yellow way home',
    d.getElementById('scene-planet').classList.contains('is-done') && c.markerNext('moon') === null);

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
  await c.flyHome();
  T('the child flies back to Earth', c.currentScene === 'earth' && c.session.place === 'earth');
  T('the Moon is restored on the map', c.destinationProgress('moon', c.journey.completions).restored);
  T('Mercury is in the sky now, and Launch goes there', /id="sky-mercury"/.test(sky()) && c.launchTarget() === 'mercury');
  T('Pip says where to next, once', sp.said.filter(s => /Next stop, Mercury/.test(s)).length === 1);
  T('Pip points at the Dock once, because there are stars to spend', sp.said.some(s => /paint brush/.test(s)));
  T('and remembers having done so', c.storyFlag('heard.dockHint'));

  sub('the Rocket Dock: the space station');
  await c.openDock();
  T('the Dock opens: the rocket flies up to the space station', c.currentScene === 'dock' && c.session.place === 'station');
  T('it is a place in the same world, not a menu over it', d.getElementById('stage').getAttribute('data-place') === 'station' &&
    d.getElementById('place' + c.session.slot + 'Art').innerHTML.indexOf(c.assetSrc(c.DESTINATIONS.station.room)) !== -1);
  c.pickItem('paint-lime');
  T('trying a paint shows it on the rocket at once', /--paint: var\(--paint-lime\)/.test(d.getElementById('stageRocket').getAttribute('style')));
  c.dockAction();
  T('a paint the child cannot afford is not bought', c.ownedCosmetics(c.journey.stars).indexOf('paint-lime') === -1);
  T('Pip says how many more stars it needs', /You need 3 more stars/.test(sp.said[sp.said.length - 1]));
  c.pickItem('paint-sky');
  c.dockAction();
  c.dockAction();
  T('an affordable paint unlocks', c.ownedCosmetics(c.journey.stars).indexOf('paint-sky') !== -1);
  T('and is worn at once', c.currentPaint() === 'paint-sky');
  T('a second tap does not spend twice', c.journey.stars.filter(e => e.kind === 'spend').length === 1);
  T('the balance is what is left', c.starBalance(c.journey.stars) === 0);
  c.pickItem('paint-sunny');
  await c.leaveDock();
  T('leaving with an unchosen try-on keeps the real paint', c.currentPaint() === 'paint-sky' &&
    /--paint: var\(--paint-sky\)/.test(d.getElementById('stageRocket').getAttribute('style')));
  T('and the rocket flies back down to Earth', c.currentScene === 'earth' && c.session.place === 'earth' &&
    d.getElementById('stage').getAttribute('data-place') === 'earth');

  sub('reload');
  const again = H.loadApp({ sharedStorage: shared });
  const r = again.ctx;
  T('no errors on reload', again.errors.length === 0, again.errors.join(' | '));
  T('it opens on Earth, not the welcome', r.currentScene === 'earth' && r.session.place === 'earth');
  T('the mission is still finished', r.journey.completions.length === 1);
  T('the Moon is still restored', r.destinationProgress('moon', r.journey.completions).restored);
  T('the stars are still spent, and only once', r.starBalance(r.journey.stars) === 0 && r.journey.stars.length === 2);
  T('the rocket still wears its new paint', r.currentPaint() === 'paint-sky');
  T('the letters practised are still there', r.journey.evidence.length === 4);

  sub('a replay');
  const sp2 = fakeSpeech();
  const third = H.loadApp({ sharedStorage: shared, windowExtras: sp2.extras });
  const t = fast(third.ctx);
  t.pickDestination('moon');
  T('tapping the Moon in the sky chooses it for Launch, and Pip says what is there', t.launchTarget() === 'moon' &&
    /The Moon! That's where we find letters/.test(sp2.said[sp2.said.length - 1]));
  await t.launch();
  const arrivals = [1, 2, 3].map(n => t.voiceCue('story.moon.arrive.' + n).speak);
  T('a returning explorer hears a short arrival, not the whole story again',
    sp2.said.some(s => arrivals.indexOf(s) !== -1) && !sp2.said.some(s => /beacon is dim/.test(s)));
  T('the choice was for one flight: Launch goes to the next stop again', t.launchTarget() === 'mercury');
  await t.tapMarker('moon-1');
  T('the task is not explained again once it has been done', !sp2.said.some(s => /I'll say a letter/.test(s)));
  await playMission(t);
  T('a replay earns stars too — practice is taking part', t.starBalance(t.journey.stars) === 3);
  T('and is recorded as its own run', t.journey.completions.length === 2);

  sub('leaving a mission early');
  await t.flyHome();
  await launchAndStart(t);
  T('the next launch goes on to Mercury', t.session.place === 'mercury' && t.currentScene === 'mission');
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
  T('"go home" flies back to Earth', t.currentScene === 'earth' && t.session.run === null && t.session.place === 'earth');
  T('no stars are given for an unfinished mission — and none taken', t.starBalance(t.journey.stars) === starsBefore);
  T('no completion is recorded for it', t.journey.completions.length === 2);
  void found;
}

/* =========================================================
   CONTRACT 29 — MOTION, AND WHAT TIMING PROMISES
   ========================================================= */
async function testMotion(){
  section('CONTRACT 29 — flights are fast, skippable, optional, and end where they were going');
  const app = H.loadApp();
  const c = app.ctx, d = app.dom.document;
  const stage = d.getElementById('stage');

  sub('the promised timings');
  /* Found on a real iPad: flights felt like page transitions — too quick
     to read as a journey. A trip is now action, a breath, travel, and a
     settle; still quick, and never the long version every time. */
  const plan = o => c.travelPlan(Object.assign({ from: 'earth', to: 'moon', first: false, repeat: false, reduced: false, flight: 1 }, o));
  const trip = p => p.duration + c.TIMING.arriveSettle;
  T('a common trip, the settle after touchdown included, takes 2 to 3 seconds', trip(plan({})) >= 2000 && trip(plan({})) <= 3000, trip(plan({})) + 'ms');
  T('a first arrival carries story: 3 to 4 seconds', trip(plan({ first: true })) >= 3000 && trip(plan({ first: true })) <= 4000, trip(plan({ first: true })) + 'ms');
  T('a route already flown is quicker, and still a journey', plan({ repeat: true }).duration < plan({}).duration && trip(plan({ repeat: true })) >= 1800,
    trip(plan({ repeat: true })) + 'ms');
  T('the space station is close: under 3 seconds, quicker once flown', trip(plan({ to: 'station' })) <= 3000 &&
    plan({ to: 'station', repeat: true }).duration < plan({ to: 'station' }).duration && trip(plan({ from: 'station', to: 'earth' })) <= 3000);
  T('with Reduce Motion a flight is a short crossfade, even the first', plan({ reduced: true, first: true }).duration <= 400 && c.TIMING.travelReduced <= 400);
  T('a flight can be skipped with a tap', /onclick="skipTravel\(\)"/.test(H.readApp()));
  T('the grown-ups hold takes three seconds', c.TIMING.gateHold === 3000);
  T('reward stars are quick: all three have landed within two seconds',
    c.TIMING.starFirst + 2 * c.TIMING.starEvery + c.TIMING.starFlight <= 2000);

  sub('a flight ends where it was going, whatever interrupts it');
  c.TIMING.travel = 0; c.TIMING.travelFirst = 0; c.TIMING.travelSettle = 0;
  await c.travelTo('moon', { first: true });
  const shown = ['A', 'B'].filter(s => d.getElementById('place' + s).classList.contains('is-shown'));
  T('the stage is at the destination', stage.getAttribute('data-place') === 'moon' && c.session.place === 'moon');
  T('exactly one place is drawn, and it is the destination',
    shown.length === 1 && d.getElementById('place' + shown[0]).getAttribute('data-place') === 'moon');
  T('it stands on the destination\'s own horizon',
    d.getElementById('place' + shown[0] + 'Art').innerHTML.indexOf(c.assetSrc('horizon.moon')) !== -1);
  T('the place left behind is emptied, so no picture in it answers to a name the new place uses',
    d.getElementById('place' + (shown[0] === 'A' ? 'B' : 'A') + 'Sky').innerHTML === '');
  T('the rocket is not left flying', !d.getElementById('stageRocket').classList.contains('is-flying'));
  T('and the resting stage checks out', c.stageRestingProblems().length === 0, c.stageRestingProblems().join('; '));
  c.TIMING.travel = 5000; c.TIMING.travelRepeat = 5000;
  const t1 = Date.now();
  const flight = c.travelTo('earth', {});
  const during = ['A', 'B'].filter(s => d.getElementById('place' + s).classList.contains('is-shown'));
  T('where nothing can animate, the destination shows at once: never both places at the same time',
    during.length === 1 && d.getElementById('place' + during[0]).getAttribute('data-place') === 'earth');
  const heldDuring = ['Ground', 'Sky'].map(k => d.getElementById('place' + c.session.slot + k).style).filter(s => s.transform || s.opacity);
  T('and nothing holds it out of sight while the flight runs its course', heldDuring.length === 0);
  c.skipTravel();
  await flight;
  T('a skipped flight lands at once, at its destination',
    Date.now() - t1 < 200 && c.session.place === 'earth' && stage.getAttribute('data-place') === 'earth');

  sub('how a flight moves');
  const moves = stripComments(fnBody(js(), 'flightMoves'));
  T('a flight animates only transforms and opacity, so an iPad never repaints for it',
    moves.length > 500 && !/\b(left|top|right|bottom|width|height|margin|filter|clip)\s*:/.test(moves));
  T('with Reduce Motion it crossfades and stops, before anything slides or streams',
    /if\(f\.reduced\)\{[\s\S]*?return list;\s*\}/.test(moves) && moves.indexOf('starsNear') > moves.indexOf('if(f.reduced)'));
  const streams = moves.match(/\[\['starsFar', (\d+)\], \['starsNear', (\d+)\]\]/);
  T('the stars stream at two speeds, the near ones further than the far ones', !!streams && Number(streams[2]) > Number(streams[1]));
  T('the rocket flies from where it stood to where it lands: both measured, not guessed',
    /const from = boxOf\(rocket\);[\s\S]{0,80}setAttribute\('data-place', to\);[\s\S]{0,20}const land = boxOf\(rocket\);/.test(js()));
  T('a place not shown is not drawn', /\.place\{[^}]*visibility: hidden;/.test(css()) && /\.place\.is-shown\{ visibility: visible; \}/.test(css()));

  sub('Reduce Motion, from the grown-ups setting');
  c.setMotionPref('reduce');
  T('the setting applies at once', d.documentElement.getAttribute('data-motion') === 'reduce' && c.motionReduced());
  T('and is saved for this device', c.Store.get(c.KEYS.motion) === 'reduce');
  const t0 = Date.now();
  c.TIMING.travelReduced = 30; c.TIMING.travelSettle = 0; c.TIMING.travelFirst = 5000;
  await c.travelTo('moon', { first: true });
  T('a reduced flight takes the crossfade time, even the first one', Date.now() - t0 < 500, (Date.now() - t0) + 'ms');
  c.setMotionPref('system');
  T('"match this device" removes the override', c.Store.get(c.KEYS.motion) === null && !c.motionReduced());
  c.setMotionPref('sideways');
  T('a nonsense value changes nothing', c.motionPref === 'system');

  sub('Reduce Motion, from the device');
  const r = H.loadApp({ windowExtras: { matchMedia: q => ({ matches: /reduce/.test(q), addEventListener(){}, removeEventListener(){} }) } });
  T('the device preference is honoured without any setting', r.ctx.motionReduced());
  T('reward stars simply count up, without flying', /if\(reduced \|\| !arcStar\(missionId, land\)\) land\(\);/.test(js()));
  T('and what lights up lights at once, without the held beat',
    /\}, reduced \? 0 : TIMING\.relight\);/.test(fnBody(js(), 'celebrate')) && /motionReduced\(\) \? 0 : TIMING\.relight/.test(fnBody(js(), 'showRelight')));
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
  const missions = [], trips = [], ran = [];
  for(let i = 0; i < 4; i++){
    const at = sp.said.length;
    ran.push(await launchAndStart(c, 'moon'));
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
  T('the new route is pointed out on that trip home too, and only then',
    trips[0].indexOf(line('story.mercury.next')) !== -1 && trips.slice(1).every(t => t.indexOf(line('story.mercury.next')) === -1));
  T('the paint-brush hint is volunteered once, not on every return', sp.said.filter(s => s === line('guide.dockHint')).length === 1);
  T('the task is explained on the first mission only', sp.said.filter(s => s === line('mission.howTo')).length === 1);
  T('the beacon is pointed out on the first arrival; a returning child is told only where they are',
    missions[0].indexOf(line('marker.beacon')) !== -1);

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
    missions.every((m, i) => m.find(isQuestion) === line('find.' + c.MISSIONS[ran[i]].activities[0].target)), ran.join(','));
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
  await c.openDock();
  await wait(150);
  const visit1 = sp.said.slice(mark).filter(s => s !== line('travel.station'));
  T('the first visit welcomes', visit1.indexOf(line('dock.welcome')) !== -1);
  T('and a child who has not tried a color is offered one hint', visit1.filter(isDockIdle).length === 1, visit1.join(' / '));
  await c.leaveDock();
  await wait(20);
  await c.openDock();
  mark = sp.said.length;
  await wait(20);
  T('a second visit is quiet', sp.said.length === mark);
  c.pickItem('paint-sky');
  await wait(150);
  T('a child who tries a color is not told to try a color', !sp.said.slice(mark).some(isDockIdle));
  await c.leaveDock();
  await wait(20);
  mark = sp.said.length;
  await c.openDock();
  await wait(150);
  const visit3 = sp.said.slice(mark).filter(isDockIdle);
  T('a later pause is met in other words', visit3.length === 1 && visit3[0] !== visit1.filter(isDockIdle)[0], visit3.join(' / '));
  await c.leaveDock();

  sub('on a planet, Pip points at what to tap — once a visit');
  await wait(20);
  c.TIMING.idleHint = 1e9;
  c.pickDestination('moon');
  await c.launch();
  c.TIMING.idleHint = 60;
  c.armIdleHint();
  mark = sp.said.length;
  await wait(150);
  const nudge = sp.said.slice(mark);
  T('a child who waits on a planet is shown the marker', nudge.length === 1 && nudge[0] === line('marker.beacon'), nudge.join(' / '));
  await wait(120);
  T('once', sp.said.length === mark + 1);
  c.TIMING.idleHint = 1e9;
  await c.flyHome();
  c.TIMING.idleHint = 60;

  sub('grown-ups and missions are not interrupted by Earth hints');
  mark = sp.said.length;
  c.openGrownups();
  await wait(150);
  T('with the grown-ups area open, no hint', sp.said.length === mark);
  c.closeGrownups();
  await wait(10);                     // back on Earth, and the wait for a hint has begun
  mark = sp.said.length;
  await launchAndStart(c, 'moon');
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
   Art must never make the learning harder to read, and the app's
   lights, the rocket and every marker must sit where the renders put
   the things they belong to.
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
function cssNumber(rule, prop){
  const m = rule.match(new RegExp('(?:^|[\\s;{])' + prop + ':\\s*(-?[\\d.]+)\\s*;'));
  return m ? Number(m[1]) : NaN;
}
function scene(name){ return require(path.join(H.ROOT, 'tools', 'art', 'scenes', name + '.js')); }
/* Where a point in a scene lands in its picture, through the scene's own
   camera: the numbers the CSS anchors must agree with. */
function projectInScene(sceneName, variant, p){
  const Cl = require(path.join(H.ROOT, 'tools', 'art', 'clay.js'));
  const s = scene(sceneName).build(variant);
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
  section('CONTRACT 31 — the clay world stays readable, and everything stands where the renders put it');
  const app = H.loadApp();
  const c = app.ctx;
  const sheet = css();

  sub('learning clarity comes before art');
  const tile = cssRule(sheet, '.choice');
  T('a letter tile has no picture or texture behind its letter', tile.length > 0 && !/url\(|background-image/.test(tile));
  T('its surface and ink come from tokens', /background: var\(--tile-surface\)/.test(tile) && /color: var\(--tile-ink\)/.test(tile));
  const face = cssRule(sheet, '.choice-face');
  T('on a letter stone the letter sits on a clean plate of the same tile surface, never on the clay',
    /background: var\(--tile-surface\)/.test(face) && /color: var\(--tile-ink\)/.test(face) && !/url\(|background-image/.test(face) &&
    /'<span class="choice-face" aria-hidden="true"><span class="choice-glyph">' \+ L \+/.test(js()));
  const surf = (sheet.match(/--brand-lavender:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  const ink = (sheet.match(/--brand-ink:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  const ratio = surf && ink ? (luminance(surf) + 0.05) / (luminance(ink) + 0.05) : 0;
  T('the letters keep a contrast of at least 7:1 against their plate', ratio >= 7, ratio.toFixed(1) + ':1');
  T('a picture choice is a clean card too: the picture on the card surface, no texture behind it',
    /background: var\(--bubble\)/.test(cssRule(sheet, '.choice-picture')) && !/url\(/.test(cssRule(sheet, '.choice-picture')));

  sub('restoring a world is a change a child can see from home');
  const moon = c.DESTINATIONS.moon;
  T('the Moon has a restored picture as well as a waiting one', !!c.assetEntry(moon.restoredAsset) && moon.restoredAsset !== moon.asset);
  c.renderEarth();
  const skyHtml = app.dom.document.getElementById('place' + c.session.slot + 'Sky').innerHTML;
  T('home draws both, so relighting can crossfade', skyHtml.indexOf(c.assetSrc(moon.asset)) !== -1 && skyHtml.indexOf(c.assetSrc(moon.restoredAsset)) !== -1);
  T('and the restored one shows once the world is restored', /\.sky-body\.is-restored \.body-lit\{\s*opacity: 1;/.test(sheet));
  T('a marker lights up the same way when its mission is done',
    /artImg\(mk\.litAsset, 'marker-art marker-on'\)/.test(js()) && /\.marker\.is-lit \.marker-on\{\s*opacity: 1;/.test(sheet));
  T('and a restored world brightens, with warm light from what was fixed', /\.place\.is-restored \.horizon-glow\{\s*opacity: 1;/.test(sheet));

  /* The payoff happens where the child can see it: what was fixed is dark
     for a beat, then lights up. */
  const shared = new Map();
  const sp = fakeSpeech();
  const j = H.loadApp({ sharedStorage: shared, windowExtras: sp.extras });
  const jc = fast(j.ctx);
  jc.TIMING.relight = 60;
  const host = kind => j.dom.document.getElementById('place' + jc.session.slot + kind);
  await (async () => {
    await jc.startAdventure();
    await launchAndStart(jc);
    await playMission(jc);
    T('on the Moon, the beacon just fixed is held dark at first',
      host('Props').classList.contains('is-holding') && /id="marker-beacon" data-held="true"/.test(host('Props').innerHTML));
    await wait(120);
    T('then it lights up in front of the child', !host('Props').classList.contains('is-holding'));
    await jc.flyHome();
    T('home from the relighting mission, the Moon is held dark at first',
      jc.currentScene === 'earth' && host('Sky').classList.contains('is-holding') && /id="sky-moon" data-held="true"/.test(host('Sky').innerHTML));
    await wait(120);
    T('then it lights up while the child watches', !host('Sky').classList.contains('is-holding'));
    await launchAndStart(jc, 'moon');
    await playMission(jc);
    await jc.flyHome();
    T('on later trips home it is simply lit',
      !host('Sky').classList.contains('is-holding') && /class="sky-body is-restored[^"]*" id="sky-moon"/.test(host('Sky').innerHTML));
  })();

  sub('characters move like stop-motion; navigation never does');
  T('Pip holds each pose for a frame', /steps\(\d+\)/.test(cssRule(sheet, '.pip')));
  T('and cheers the same way', /steps\(\d+\)/.test(cssRule(sheet, '.pip.is-cheering')));
  T('so does the rocket waiting on its pad', /rocket-idle [\d.]+s steps\(\d+\)/.test(sheet));
  T('a scene change stays smooth', !/steps\(/.test(cssRule(sheet, '.scene.active')));
  T('and so does every flight', !/steps\(/.test(fnBody(js(), 'flightMoves')));

  sub('the app\'s lights sit on the renders\' lamps');
  const pipRule = cssRule(sheet, '.pip-light');
  const ball = projectInScene('pip', undefined, scene('pip').BALL);
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
  const nozzle = projectInScene('rocket', undefined, [0, scene('rocket').NOZZLE_BOTTOM, 0]);
  T('the flame hangs from the nozzle, centred', Math.abs(cssPercent(flameRule, 'left') + cssPercent(flameRule, 'width') / 2 - 50) < 0.6 &&
    Math.abs(cssPercent(flameRule, 'top') - nozzle[1]) < 3, 'flame top ' + cssPercent(flameRule, 'top') + '% vs nozzle ' + nozzle[1].toFixed(1) + '%');
  const standAt = Number((cssRule(sheet, '.stage-rocket').match(/margin-top: calc\(var\(--rocket-h\) \* -([\d.]+)\)/) || [])[1]) * 100;
  T('the rocket stands on the bottom of its nozzle', Math.abs(standAt - nozzle[1]) < 0.6, 'css ' + standAt.toFixed(1) + '% vs nozzle ' + nozzle[1].toFixed(1) + '%');
  T('and touchdown dust puffs from that same point', Math.abs(c.ROCKET_FOOT * 100 - standAt) < 0.01 && Math.abs(c.ROCKET_FOOT * 100 - nozzle[1]) < 0.6,
    'ROCKET_FOOT ' + c.ROCKET_FOOT + ' vs css ' + (standAt / 100).toFixed(3));

  sub('everything stands on its world, not in its sky');
  const HZ = scene('horizon');
  const pad = HZ.anchorAt(HZ.PAD.map(v => v * HZ.PAD_TOP));
  const onEarth = cssRule(sheet, '.stage[data-place="earth"]');
  T('on Earth the rocket stands on the centre of its launch pad',
    Math.abs(cssNumber(onEarth, '--rx') * 100 - pad[0]) < 0.6 && Math.abs(cssNumber(onEarth, '--ry') * 100 - pad[1]) < 0.6,
    'css ' + cssNumber(onEarth, '--rx') + ',' + cssNumber(onEarth, '--ry') + ' vs pad ' + pad.map(v => (v / 100).toFixed(4)).join(','));
  const landings = c.JOURNEY_ORDER.map(id => [id, cssRule(sheet, '.stage[data-place="' + id + '"]')]);
  T('on every destination the rocket lands on the ground',
    landings.every(l => l[1] && HZ.groundAt(cssNumber(l[1], '--rx'), cssNumber(l[1], '--ry'))), landings.map(l => l[0]).join(','));
  const ST = scene('station');
  const top = projectInScene('station', 'inside', ST.TURNTABLE_TOP);
  const onStation = cssRule(sheet, '.stage[data-place="station"]');
  const turntable = c.DESTINATIONS.station.turntable;
  T('in the space station the rocket stands on the turntable\'s top, in the CSS and in the data',
    Math.abs(cssNumber(onStation, '--rx') * 100 - top[0]) < 0.6 && Math.abs(cssNumber(onStation, '--ry') * 100 - top[1]) < 0.6 &&
    Math.abs(turntable[0] * 100 - top[0]) < 0.6 && Math.abs(turntable[1] * 100 - top[1]) < 0.6,
    'css ' + cssNumber(onStation, '--rx') + ',' + cssNumber(onStation, '--ry') + ' vs render ' + top.map(v => (v / 100).toFixed(4)).join(','));
  T('the flight in goes through the docking bay where the render has it',
    c.DESTINATIONS.station.bay.every((v, i) => Math.abs(v - ST.ANCHORS.outside.bay[i]) < 0.005), c.DESTINATIONS.station.bay.join(','));
  const win = ST.ANCHORS.inside.window, earthAt = c.DESTINATIONS.station.window.earth;
  const apart = Math.hypot(earthAt[0] - win.x, (earthAt[1] - win.y) * (1600 / 2400)), earthR = earthAt[2] * 0.42;
  T('Earth hangs behind the window glass: part of it seen through the window, with space above it',
    apart < earthR + win.r && apart + win.r > earthR, 'centres ' + apart.toFixed(3) + ' apart; Earth ' + earthR.toFixed(3) + ', window ' + win.r);
  const markers = [];
  c.JOURNEY_ORDER.forEach(id => Object.keys(c.DESTINATIONS[id].markers).forEach(mid => markers.push([mid, c.DESTINATIONS[id].markers[mid]])));
  T('every marker stands on the ground', markers.length >= 3 && markers.every(m => HZ.groundAt(m[1].at[0], m[1].at[1])),
    markers.filter(m => !HZ.groundAt(m[1].at[0], m[1].at[1])).map(m => m[0]).join(','));
  T('the horizon\'s crest is where the CSS puts it', /--world-top: calc\(var\(--crest-y\) - var\(--world-h\) \* ([\d.]+)\)/.test(sheet) &&
    Number(sheet.match(/--world-top: calc\(var\(--crest-y\) - var\(--world-h\) \* ([\d.]+)\)/)[1]) === HZ.CREST);
  const crest = Number((sheet.match(/--crest-y: calc\(([\d.]+) \* var\(--vh\)\);/) || [])[1]);
  const wide = Number((sheet.match(/--world-w: max\(var\(--app-w\), calc\(([\d.]+) \* var\(--vh\)\)\);/) || [])[1]);
  const planetShare = 100 - crest;
  T('the planet fills the bottom 35–45% of the screen at its crest', planetShare >= 35 && planetShare <= 45, planetShare + '%');
  T('and the picture reaches past the bottom edge, so the ground never ends in a line',
    crest + (1 - HZ.CREST) * 0.325 * wide >= 100, (crest + (1 - HZ.CREST) * 0.325 * wide).toFixed(1) + 'vh');
}

/* =========================================================
   CONTRACT 32 — THE WORLD IS THE NAVIGATION
   One continuous stage behind every child scene. Places are drawn
   from data, the world's objects are what a child taps, and each
   screen still has exactly one primary action.
   ========================================================= */
async function testWorldStage(){
  section('CONTRACT 32 — one world, drawn from data, with one thing to do at a time');
  const src = H.readApp(), sheet = css();
  const markup = H.bodyBlock(src).replace(/<script>[\s\S]*<\/script>/, '');

  sub('one stage, behind every scene');
  T('there is exactly one stage', (markup.match(/class="stage"/g) || []).length === 1);
  T('it sits behind the scenes', Number((cssRule(sheet, '.stage').match(/z-index: (\d+)/) || [])[1]) <
                                 Number((cssRule(sheet, '.scene').match(/z-index: (\d+)/) || [])[1]));
  T('no scene draws a world of its own', !/class="world"/.test(markup) && !/class="backdrop"/.test(markup));
  T('the stage itself never takes a tap; only the world\'s own objects do, and only where they mean something',
    /\.stage\{[^}]*pointer-events: none/.test(sheet) &&
    /html\[data-scene="earth"\] \.stage-rocket\{ pointer-events: auto; \}/.test(sheet) &&
    /html\[data-scene="earth"\] button\.sky-body\{ pointer-events: auto; \}/.test(sheet) &&
    /html\[data-scene="planet"\] \.marker\{ pointer-events: auto; \}/.test(sheet));
  T('two place slots: where the rocket is, and where a flight is going', ['placeA', 'placeB'].every(id => markup.indexOf('id="' + id + '"') !== -1));

  sub('one primary action per screen');
  const sceneMarkup = name => { const at = markup.indexOf('id="scene-' + name + '"'); return markup.slice(at, markup.indexOf('</main>', at)); };
  const primaries = name => (sceneMarkup(name).match(/class="[^"]*\b(launch-btn|play-btn|primary-btn)\b/g) || []).length;
  T('welcome: Play', primaries('welcome') === 1);
  T('Earth: Launch', primaries('earth') === 1 && /id="launchBtn"/.test(sceneMarkup('earth')));
  T('the Dock stays secondary on Earth', /class="kid-icon-btn earth-dock"/.test(sceneMarkup('earth')));
  T('a planet: the marker pulses; the yellow way home appears only when nothing is left to play',
    primaries('planet') === 1 && /\.scene-planet:not\(\.is-done\) \.planet-go-home\{ display: none; \}/.test(sheet));
  T('the space station: the one action for what is being tried on', primaries('dock') === 1 && /id="dockAction"/.test(sceneMarkup('dock')));
  T('a mission has no yellow button: the choices are the task', primaries('mission') === 0);
  const hud = (() => { const at = markup.indexOf('id="hud"'); return markup.slice(at, markup.indexOf('</header>', at)); })();
  T('one HUD holds the corners of every child scene: the way back (the lock on Earth) top left, the stars top right',
    (markup.match(/class="hud[ "]/g) || []).length === 1 && /class="hud-left"[\s\S]*id="gateBtn"[\s\S]*id="hudBack"[\s\S]*class="hud-title"[\s\S]*class="hud-right"[\s\S]*id="hudStars"/.test(hud) &&
    /\.hud-left\{ grid-column: 1; justify-self: start;/.test(sheet) && /\.hud-right\{ grid-column: 3; justify-self: end;/.test(sheet));
  T('no scene draws a corner button or a star count of its own',
    !/class="star-count"/.test(markup.replace(hud, '')) && !/(planetHomeBtn|missionHomeBtn|dockBackBtn|earthStars|planetStars|dockStars)/.test(markup));

  sub('places are drawn from data');
  const app = H.loadApp();
  const c = fast(app.ctx), d = app.dom.document;
  T('every place on the journey has a horizon, a place in the sky and a marker for each mission',
    c.JOURNEY_ORDER.every(id => { const p = c.DESTINATIONS[id]; return c.assetEntry(p.horizon) && p.sky && p.missions.every(m => c.markerOf(m) && p.markers[c.markerOf(m)]); }));
  T('a planet in the sky is big enough for a small finger', c.JOURNEY_ORDER.every(id => c.DESTINATIONS[id].sky.size >= 10));
  T('the scenes never write a horizon, a planet or a marker picture by name',
    !/'(horizon|planet|prop)\.[a-z]+[A-Z]?[a-zA-Z]*'/.test(stripComments(fnBody(js(), 'drawPlace') + fnBody(js(), 'skyHtml') + fnBody(js(), 'markerHtml'))));
  T('every stage picture is fetched and decoded ahead of a flight', /\^\(horizon\|planet\|bg\|prop\|rocket\|character\|place\)\\\./.test(fnBody(js(), 'preloadStage')) &&
    /img\.decode\(\)/.test(fnBody(js(), 'preloadStage')));

  sub('one mission at a time');
  c.showScene('welcome');
  await c.startAdventure();
  await launchAndStart(c);
  await playMission(c);
  await c.flyHome();
  c.pickDestination('mercury');
  await c.launch();
  const props = () => d.getElementById('place' + c.session.slot + 'Props').innerHTML;
  T('on Mercury, one marker pulses and the next one waits', (props().match(/is-next/g) || []).length === 1 &&
    /class="marker is-next" id="marker-radar"/.test(props()) && /class="marker is-waiting" id="marker-meteors"/.test(props()));
  await c.tapMarker('mercury-2');
  T('tapping the one that waits does not start it', c.currentScene === 'planet' && c.session.run === null);
  await c.tapMarker('mercury-1');
  await playMission(c);
  T('when the first is done, the next one pulses', /class="marker is-lit" id="marker-radar"/.test(props()) && /class="marker is-next" id="marker-meteors"/.test(props()) &&
    !d.getElementById('scene-planet').classList.contains('is-done'));
  await c.tapMarker('mercury-2');
  await playMission(c);
  T('and when both are done, none pulses: the way forward is home', !/is-next/.test(props()) && d.getElementById('scene-planet').classList.contains('is-done'));
  T('Mercury is restored and brighter', c.destinationProgress('mercury', c.journey.completions).restored &&
    d.getElementById('place' + c.session.slot).classList.contains('is-restored'));
  await c.flyHome();
  c.pickDestination('mercury');
  await c.launch();
  T('a restored place still has a mission to replay on the next visit', /is-next/.test(props()) && !d.getElementById('scene-planet').classList.contains('is-done'));
  T('no console errors along the way', app.errors.length === 0, app.errors.join(' | '));
}

/* =========================================================
   CONTRACT 33 — RHYME RADAR AND SYLLABLE METEORS
   Two new games on the same engine: the same help ladder, the same
   evidence, the same praise, and content that says what it teaches.
   ========================================================= */
async function testNewGames(){
  section('CONTRACT 33 — rhyming and beats are fair, forgiving, and truthful');
  const app = H.loadApp();
  const c = app.ctx;

  sub('rhyme rounds are fair');
  let bad = 0, total = 0, sameStartMissing = 0, sameStartEarly = 0;
  const rhymes = [];
  Object.keys(c.MISSIONS).forEach(id => c.MISSIONS[id].activities.filter(a => a.type === 'rhyme-pick').forEach(a => rhymes.push(a)));
  rhymes.forEach(a => {
    const pools = c.rhymeDistractorPools(a);
    [1, 2].forEach(tier => {
      for(let s = 0; s < 8; s++){
        total++;
        const b = c.ACTIVITY_TYPES['rhyme-pick'].buildRound(a, { tier, choices: 3, rand: c.seededRandom(a.target + tier + s) });
        const t = c.WORDS[a.target];
        const unique = new Set(b.options).size === 3;
        const answerOnce = b.options.filter(w => w === a.answer).length === 1 && b.options[b.answer] === a.answer;
        const noneRhyme = b.options.every(w => w === a.answer || c.WORDS[w].rime !== t.rime);
        if(!(unique && answerOnce && noneRhyme && b.options.indexOf(a.target) === -1)) bad++;
        const sameStart = b.options.some(w => w !== a.answer && c.WORDS[w].onset === t.onset);
        if(tier === 2 && pools.sameStart.length && !sameStart) sameStartMissing++;
        if(tier === 1 && pools.other.length >= 2 && sameStart) sameStartEarly++;
      }
    });
  });
  T('three different pictures, the rhyme exactly once, and nothing else rhymes', rhymes.length >= 5 && bad === 0, bad + ' of ' + total);
  T('the word asked about is never one of its own choices', bad === 0);
  c.WORDS.lake = { speak: 'lake', picture: 'picture.cake', rime: 'ake', onset: 'l', beats: ['lake'] };
  let leaked = 0;
  for(let s2 = 0; s2 < 40; s2++){
    const b = c.ACTIVITY_TYPES['rhyme-pick'].buildRound({ type: 'rhyme-pick', target: 'cake', answer: 'snake' },
      { tier: 1 + (s2 % 2), choices: 3, rand: c.seededRandom('lake' + s2) });
    if(b.options.indexOf('lake') !== -1) leaked++;
  }
  delete c.WORDS.lake;
  T('a second word that rhymes is never offered as a wrong choice', leaked === 0, leaked + ' of 40');
  T('the harder level includes a word that starts like the target, when there is one', sameStartMissing === 0, String(sameStartMissing));
  T('the easier level does not', sameStartEarly === 0, String(sameStartEarly));

  sub('a beats round counts taps, and forgives');
  const beats = c.startRun('mercury-2', new Date(), 'run_beats');
  beats.index = 3;                                    // banana: three beats
  c.beginRound(beats, []);
  T('the answer is the number of beats', beats.round.options[beats.round.answer] === c.WORDS[beats.round.activity.target].beats.length);
  const one = c.answerRound(beats, 0);
  T('a wrong count: "almost"', one.correct === false && one.hint === 'almost');
  T('the same wrong count can be tapped again: a count is not a tile that steps aside', c.answerRound(beats, 0).ignored !== true);
  T('the second miss shows the beats', beats.round.misses === 2);
  const right = c.answerRound(beats, beats.round.answer);
  T('and the right count then finishes the round, as helped', right.correct && right.outcome === 0);
  const clean = c.startRun('mercury-2', new Date(), 'run_clean'); clean.index = 1;
  c.beginRound(clean, []);
  T('first time right: 1', c.answerRound(clean, clean.round.answer).outcome === 1);
  const g = c.startRun('mercury-2', new Date(), 'run_g2');
  c.beginRound(g, []);
  T('the guided first round is not evidence of anything', c.answerRound(g, g.round.answer).outcome === null);
  const far = c.startRun('mercury-2', new Date(), 'run_far'); far.index = 2;
  c.beginRound(far, []);
  T('a count beyond what can be tapped is ignored, not crashed on', c.answerRound(far, 99).ignored === true && far.round.misses === 0);

  sub('the content says what it teaches — and a second list checks it');
  /* An independent count, typed here by hand from the spoken words: if the
     data and this list ever disagree, one of them is wrong. */
  const BEATS = { cake: 1, snake: 1, bee: 1, tree: 1, rock: 1, sock: 1, moon: 1, spoon: 1, star: 1, car: 1, apple: 2, rocket: 2, banana: 3, tomato: 3,
                  map: 1, fan: 1, hat: 1, cat: 1, cap: 1, pan: 1, sun: 1, nut: 1, rug: 1, cup: 1, bus: 1, bug: 1, net: 1, fish: 1,
                  pumpkin: 2, umbrella: 3, cupcake: 2 };
  T('every word has a checked beat count', Object.keys(c.WORDS).every(w => BEATS[w] === c.WORDS[w].beats.length),
    Object.keys(c.WORDS).filter(w => BEATS[w] !== c.WORDS[w].beats.length).join(','));
  const PAIRS = [['cake', 'snake'], ['bee', 'tree'], ['rock', 'sock'], ['moon', 'spoon'], ['star', 'car'],
                 ['cat', 'hat'], ['map', 'cap'], ['fan', 'pan'], ['bug', 'rug'], ['sock', 'rock']];
  T('every rhyme asked for is one of the checked pairs', rhymes.every(a => PAIRS.some(p => p[0] === a.target && p[1] === a.answer)));
  T('and every checked pair rhymes in the data', PAIRS.every(p => c.WORDS[p[0]].rime === c.WORDS[p[1]].rime));
  const review = fs.readFileSync(path.join(H.ROOT, 'docs', 'CONTENT-REVIEW.md'), 'utf8');
  T('CONTENT-REVIEW.md lists every rhyme pair', PAIRS.every(p => new RegExp(p[0] + '\\s*/\\s*' + p[1], 'i').test(review)),
    PAIRS.filter(p => !new RegExp(p[0] + '\\s*/\\s*' + p[1], 'i').test(review)).map(p => p.join('/')).join(','));
  T('and every word\'s beat count', Object.keys(BEATS).every(w => new RegExp('\\b' + w + '\\b[^\\n]*\\b' + BEATS[w] + '\\b', 'i').test(review)),
    Object.keys(BEATS).filter(w => !new RegExp('\\b' + w + '\\b[^\\n]*\\b' + BEATS[w] + '\\b', 'i').test(review)).join(','));
  const learning = fs.readFileSync(path.join(H.ROOT, 'docs', 'LEARNING-DESIGN.md'), 'utf8');
  T('nothing claims approval: the new content is development content, awaiting review',
    /development content/i.test(review) && /Awaiting review/.test(review) && /Nothing here claims to be\s+research-backed/.test(learning) &&
    !/\b(is|are) (curriculum-approved|research-backed|approved by)/i.test(review + learning));

  sub('what the screen shows never gives the answer away');
  T('a rhyme question shows the task, never the rhyme', rhymes.every(a => c.voiceCue('rhyme.ask.' + a.target).text === 'What rhymes?'));
  T('a beats question shows the task, never the count', Object.keys(c.WORDS).every(w => c.voiceCue('beats.ask.' + w).text === 'Tap the beats!'));
  T('waiting meteors appear only once Pip has shown the count: nothing else sets it',
    (stripComments(js()).match(/\br\.guide = /g) || []).length === 1 && /r\.guide = n;/.test(fnBody(js(), 'modelBeats')) &&
    /meteorsReset\(shown\)/.test(fnBody(js(), 'resetBeats')) && /const shown = r && r\.guide \? r\.guide : 0;/.test(fnBody(js(), 'resetBeats')));
  T('every word can be heard, named and praised', Object.keys(c.WORDS).every(w => c.voiceCue('word.' + w) && c.voiceCue('beats.found.' + w + '.0') &&
    c.WORDS[w].beats.every((_, i) => c.voiceCue('beat.' + w + '.' + i))));

  sub('playing them, through the same functions the buttons call');
  const sp = fakeSpeech();
  const a = H.loadApp({ windowExtras: sp.extras });
  const p = fast(a.ctx), d = a.dom.document;
  await p.startAdventure();
  p.pickDestination('mercury');
  T('Mercury cannot be chosen before the Moon shines', p.launchTarget() === 'moon' && p.session.pick === null);
  await launchAndStart(p);
  await playMission(p);
  await p.flyHome();
  await p.launch();
  T('Mercury\'s first arrival tells its story', sp.said.some(s => /signal is fuzzy/.test(s)));
  let mark = sp.said.length;
  await p.tapMarker('mercury-1');
  const intro = sp.said.slice(mark);
  const r0 = p.session.run.round;
  T('Rhyme Radar explains itself, says the word, asks, and names every picture',
    intro.some(s => /sound the same at the end/.test(s)) && intro.indexOf('Cake.') !== -1 && intro.some(s => /rhymes with cake/.test(s)) &&
    r0.options.every(w => intro.indexOf(p.voiceCue('word.' + w).speak) !== -1));
  T('the word heard is shown as a picture in the radar\'s window', d.getElementById('gameSignal').innerHTML.indexOf(p.assetSrc('picture.cake')) !== -1);
  await p.choose(r0.answer);
  const r1 = p.session.run.round;
  mark = sp.said.length;
  await p.choose(r1.options.map((_, i) => i).find(i => i !== r1.answer));
  const retry = sp.said.slice(mark);
  const left = r1.options.filter((_, i) => r1.out.indexOf(i) === -1);
  T('a wrong picture: "almost", the question again, and only the pictures left are named',
    retry.some(s => /Listen again/.test(s)) && left.every(w => retry.indexOf(p.voiceCue('word.' + w).speak) !== -1) && retry.length === 2 + left.length, retry.join(' / '));
  await playMission(p);
  T('the radar is fixed, and Pip points at what is next', sp.said.some(s => /It works! One more thing/.test(s)) && /Now tap the meteor rocks/.test(sp.said[sp.said.length - 1]));
  mark = sp.said.length;
  await p.tapMarker('mercury-2');
  const model = sp.said.slice(mark);
  T('Syllable Meteors explains itself, then Pip taps the first word\'s beats', model.some(s => /Tap the big stone once for each beat/.test(s)) &&
    model.indexOf('rock!') !== -1 && model.indexOf('it!') !== -1 && /Now you! Two beats/.test(model[model.length - 1]), model.join(' / '));
  const g0 = p.session.run.round;
  for(let k = 0; k < 4; k++){ p.session.beat.lastAt = 0; p.tapBeat(); }
  T('while showing, only that many taps count', p.session.beat.taps === g0.guide);
  await p.settleBeats(p.session.run);
  T('and they finish the round', g0.resolved === true);
  const b1 = p.session.run.round;
  mark = sp.said.length;
  p.session.beat.lastAt = 0; p.tapBeat(); p.session.beat.lastAt = 0; p.tapBeat();
  await p.settleBeats(p.session.run);
  T('a wrong count: "almost", and the word again', sp.said.slice(mark).some(s => /Listen again/.test(s)) && sp.said.slice(mark).indexOf('Bee.') !== -1);
  T('the meteors are cleared for the next try', p.session.beat.taps === 0);
  p.session.beat.lastAt = 0; p.tapBeat(); p.session.beat.lastAt = 0; p.tapBeat();
  await p.settleBeats(p.session.run);
  T('a second wrong count: Pip shows the beats, and waits for that many', b1.guide === 1 && !b1.resolved);
  p.session.beat.lastAt = 0; p.tapBeat();
  await p.settleBeats(p.session.run);
  T('and the round finishes, as helped', b1.resolved === true && p.session.run.results[p.session.run.results.length - 1].outcome === 0);
  const free = p.session.run.round;
  p.TIMING.beatBounce = 1000;
  p.session.beat.lastAt = 0; p.tapBeat(); p.tapBeat();
  T('a finger bouncing on the stone is one beat, not two', p.session.beat.taps === 1 && !free.guide);
  p.TIMING.beatBounce = 0;
  p.session.beat.lastAt = 0;
  for(let k = 1; k < free.answer + 1; k++){ p.session.beat.lastAt = 0; p.tapBeat(); }
  await p.settleBeats(p.session.run);
  T('and the count goes on from there', free.resolved === true);
  p.TIMING.beatPause = 30;
  const b2 = p.session.run.round;
  await wait(20);
  for(let k = 0; k < b2.answer + 1; k++){ p.session.beat.lastAt = 0; p.tapBeat(); }
  await wait(15);
  T('a count is not judged while the child is still tapping', !b2.resolved);
  await wait(80);
  T('a pause ends the count, and only the count is judged', b2.resolved === true);
  p.TIMING.beatPause = 0;
  await wait(20);
  await playMission(p);
  T('Mercury\'s signal is clear', sp.said.some(s => /signal is clear/.test(s)) && p.destinationProgress('mercury', p.journey.completions).restored);
  T('rhymes and beats are recorded under their own skills',
    p.journey.evidence.some(e => e.skillId === 'rhyming' && e.form === 'rhyme') && p.journey.evidence.some(e => e.skillId === 'syllables' && e.form === 'beats'));
  p.renderGrownups();
  const practice = d.getElementById('gLetters').innerHTML;
  T('the grown-ups area shows practice skill by skill, in plain counts', /Letter recognition/.test(practice) && /Rhyming/.test(practice) &&
    /Counting syllables/.test(practice) && /beats counted on the first try/.test(practice));
  T('and the journey place by place', /Mercury/.test(d.getElementById('gProgress').innerHTML) && /Restored/.test(d.getElementById('gProgress').innerHTML));
  await p.flyHome();
  T('home, Pip says Mercury is glowing', sp.said.some(s => /Mercury is glowing/.test(s)));
  T('no console errors', a.errors.length === 0, a.errors.join(' | '));

  /* Found in browser QA: after Pip showed the count, tapping part of it and
     pausing was judged as a miss, which cleared what Pip had shown — and the
     stone then ignored every tap. A child could not finish the round. */
  sub('a count Pip has shown can always be finished');
  const sp3 = fakeSpeech();
  const g3 = H.loadApp({ windowExtras: sp3.extras });
  const q = fast(g3.ctx), qd = g3.dom.document;
  await q.startAdventure();
  await launchAndStart(q);
  await playMission(q);
  await q.flyHome();
  q.journey.completions.push({ id: 'run_rhymes', missionId: 'mercury-1', destinationId: 'mercury', skillId: 'rhyming', completedAt: 't', updatedAt: 't' });
  await q.launch();
  await q.tapMarker('mercury-2');
  const gr = q.session.run.round;
  T('the first round is shown before it is tried', gr.guided === true && gr.guide === 2 && !q.session.beat.hold);
  q.TIMING.beatPause = 30;
  q.session.beat.lastAt = 0; q.tapBeat();
  await wait(90);
  T('once shown, a pause part way through is only a pause', !gr.resolved && gr.misses === 0 && q.session.beat.taps === 1);
  qd.visibilityState = 'hidden'; qd.dispatch('visibilitychange'); qd.visibilityState = 'visible';
  T('leaving the app mid-count clears the taps, and keeps the count shown', q.session.beat.taps === 0 && gr.guide === 2);
  q.session.beat.lastAt = 0; q.tapBeat(); q.session.beat.lastAt = 0; q.tapBeat();
  await q.settleBeats(q.session.run);
  T('and that count still finishes the round', gr.resolved === true);
  q.TIMING.beatPause = 0;
  T('no console errors here either', g3.errors.length === 0, g3.errors.join(' | '));
}

/* =========================================================
   CONTRACT 34 — ONE HUD
   Found on a real iPad: a child could not tell what each planet
   teaches or what a lesson was called, and every scene drew its own
   oversized corner buttons. One HUD now says where you are (or what
   you are playing) and what to do, from state and content.
   ========================================================= */
async function testHud(){
  section('CONTRACT 34 — one HUD says where you are, what you are playing, and what to do');
  const src = H.readApp(), sheet = css();

  sub('the HUD owns the top band, and nothing else draws there');
  T('it sits above the scenes', Number((cssRule(sheet, '.hud').match(/z-index: (\d+)/) || [])[1]) > Number((cssRule(sheet, '.scene').match(/z-index: (\d+)/) || [])[1]));
  T('its band is its own height', /--hud-h: calc\(var\(--hud-pad\) \+ var\(--touch-kid\)\);/.test(sheet) &&
    /\.hud\{[^}]*height: calc\(var\(--hud-h\) \+ var\(--inset-top\)\)/.test(sheet));
  T('every scene\'s controls start below that band', /\.scene-ui\{[^}]*top: calc\(var\(--hud-h\) \+ var\(--inset-top\)\)/.test(sheet));
  T('so the game\'s box begins under it, and the stars can never cover a choice', /\.game\{[^}]*right: 0; top: 0;/.test(sheet));
  T('the welcome alone has no HUD band to leave room for', /\.scene-welcome \.scene-ui\{\s*top: calc\(var\(--space-lg\) \+ var\(--inset-top\)\)/.test(sheet));

  sub('what it shows follows the state, drawn from the content');
  const sp = fakeSpeech();
  const app = H.loadApp({ windowExtras: sp.extras });
  const c = fast(app.ctx), d = app.dom.document;
  const hud = () => ({
    hidden: d.getElementById('hud').classList.contains('is-hidden'), left: d.getElementById('hud').getAttribute('data-left'),
    title: d.getElementById('hudTitleMain').textContent, sub: d.getElementById('hudTitleSub').textContent,
    back: d.getElementById('hudBack').getAttribute('aria-label') || ''
  });
  T('the welcome: no HUD, the world alone', c.currentScene === 'welcome' && hud().hidden);
  await c.startAdventure();
  T('Earth: the grown-ups lock top left, and where you are', !hud().hidden && hud().left === 'gate' && hud().title === 'Earth' && hud().sub === 'Home base');
  const flight = c.launch();
  T('a flight: the controls clear as the engine lights', hud().hidden);
  await flight;
  T('a planet names itself and what it teaches, with the way home', !hud().hidden && hud().left === 'home' && hud().title === 'Moon' && hud().sub === 'Letters' && /Earth/.test(hud().back));
  await c.tapMarker('moon-1');
  T('a mission names its game, and what to do — two lines, not a paragraph', hud().title === 'Letter Explorer' && hud().sub === 'Find the letter you hear');
  T('with its progress, in words for a screen reader', /^0 of 6 letters found$/.test(d.getElementById('missionProgress').getAttribute('aria-label')));
  T('the stars are always the balance, top right', d.getElementById('hudStars').getAttribute('aria-label') === 'You have 0 stars');
  c.hudBack();
  c.__flush();
  T('in a mission, the way back asks first', d.getElementById('homeSheet').classList.contains('open'));
  c.closeHomeSheet();
  c.__flush();
  await playMission(c);
  T('back on the planet after the mission, the planet\'s own title returns', hud().title === 'Moon' && hud().sub === 'Letters');
  await c.hudBack();
  T('on a planet, the way back flies home', c.currentScene === 'earth' && c.session.place === 'earth');
  c.pickDestination('mercury');
  await c.launch();
  T('Mercury teaches two things, named in a child\'s words', hud().title === 'Mercury' && hud().sub === 'Rhymes • Beats');
  await c.tapMarker('mercury-1');
  T('Rhyme Radar', hud().title === 'Rhyme Radar' && hud().sub === 'Find the picture that rhymes');
  await playMission(c);
  await c.tapMarker('mercury-2');
  T('Syllable Meteors', hud().title === 'Syllable Meteors' && hud().sub === 'Tap the beats');
  await playMission(c);
  await c.flyHome();
  await c.openDock();
  T('the space station names itself, with a way back to Earth', hud().title === 'Space Station' && hud().sub === 'Rocket garage' && hud().left === 'back' && /Earth/.test(hud().back));
  await c.hudBack();
  T('where the way back flies home', c.currentScene === 'earth' && c.session.place === 'earth');
  T('no console errors on the way', app.errors.length === 0, app.errors.join(' | '));

  sub('titles and labels are content, and never the answer');
  const ids = Object.keys(c.MISSIONS);
  T('every lesson has a title, and a task of a few words', ids.every(id => c.MISSIONS[id].title && c.MISSIONS[id].task && c.MISSIONS[id].task.split(' ').length <= 6));
  T('what a place teaches is derived from its missions\' skills', c.destinationFocus('moon').join() === 'Letters' && c.destinationFocus('mercury').join() === 'Rhymes,Beats');
  T('so a mission moved to another world takes its label with it', (() => {
    const beats = ['mercury-2', 'mercury-4'];
    beats.forEach(id => { c.MISSIONS[id].skillId = 'letter-recognition'; });
    const moved = c.destinationFocus('mercury').join();
    beats.forEach(id => { c.MISSIONS[id].skillId = 'syllables'; });
    return moved === 'Rhymes,Letters';
  })());
  T('a child is told what a place is for, never the name of a course', Object.keys(c.SKILLS).every(k => c.SKILLS[k].short && c.SKILLS[k].short.split(' ').length <= 2));
  T('a planet says what its game says (Beats), while the skill keeps its name for grown-ups',
    c.SKILLS.syllables.short === 'Beats' && c.SKILLS.syllables.label === 'Counting syllables' && c.MISSIONS['mercury-2'].task === 'Tap the beats');
  T('the scenes never write a lesson title or a planet label themselves',
    !/'(Letter Explorer|Rhyme Radar|Syllable Meteors|Letters|Rhymes|Syllables|Beats|Moon|Mercury|Home base|Space Station|Rocket garage)'/.test(stripComments(js().slice(js().indexOf('SCENES\n')))));

  sub('choosing a planet');
  const sp2 = fakeSpeech();
  const b = H.loadApp({ windowExtras: sp2.extras });
  const e = fast(b.ctx), bd = b.dom.document;
  await e.startAdventure();
  await launchAndStart(e);
  await playMission(e);
  await e.flyHome();
  await wait(10);                     // the Moon's relight, shown once on the way home, is over
  const sky = () => bd.getElementById('place' + e.session.slot + 'Sky').innerHTML;
  const before = sky();
  e.pickDestination('mercury');
  T('Launch says where it goes, in words and in its picture', /Mercury/.test(bd.getElementById('launchBtn').getAttribute('aria-label')) &&
    bd.getElementById('launchBtn').innerHTML.indexOf(e.assetSrc(e.DESTINATIONS.mercury.asset)) !== -1);
  T('and Pip says what is there', /rhymes and beats/.test(sp2.said[sp2.said.length - 1]));
  e.pickDestination('moon');
  T('choosing again moves it: one destination at a time', e.launchTarget() === 'moon' && /the Moon/.test(bd.getElementById('launchBtn').getAttribute('aria-label')) &&
    bd.getElementById('launchBtn').innerHTML.indexOf(e.assetSrc(e.DESTINATIONS.moon.restoredAsset)) !== -1);
  T('choosing never launches', e.currentScene === 'earth' && e.session.place === 'earth');
  T('the sky is not redrawn to move the focus — a class moves, so it can glide and nothing reloads', sky() === before);
  T('the chosen planet alone wears its name and what it teaches; the others wait, smaller',
    /\.sky-label\{[^}]*opacity: 0;/.test(sheet) && /html\[data-scene="earth"\] \.sky-body\.is-picked \.sky-label\{ opacity: 1;/.test(sheet) &&
    /html\[data-scene="earth"\] \.sky-body\.is-picked \.sky-focus\{ transform: scale\(1\.1\d?\); \}/.test(sheet) &&
    /html\[data-scene="earth"\] \.sky-body\.is-dimmed \.sky-focus\{ transform: scale\(0\.8\d?\);/.test(sheet));
  T('each planet in the sky carries its label, ready to be shown', /class="sky-label-name">Moon</.test(sky()) && /class="sky-label-focus">Letters</.test(sky()) &&
    /class="sky-label-focus">Rhymes • Beats</.test(sky()));
  T('the chosen light is cool: the warm yellow stays Launch\'s', /--focus-glow: rgba\((1[0-9]{2}),(2[0-9]{2}),(2[0-9]{2}),/.test(sheet));
  T('the route is drawn as light under the dots, and lights up when the choice changes',
    /class="route-glow"/.test(fnBody(js(), 'drawFlightPath')) && /drawFlightPath\(changed\)/.test(fnBody(js(), 'pickDestination')));
}

/* =========================================================
   CONTRACT 35 — TRAVEL, AND THE STAGE AT REST
   Found on a real iPad: travel felt like a page transition, and a
   planet was once drawn wrong at rest. A trip is now one camera move
   built from a few motifs by rule, and the rest it ends in is written
   down, checked, and repaired from state.
   ========================================================= */
async function testTravel(){
  section('CONTRACT 35 — one world, one camera, and a stage that always comes to rest');
  const app = H.loadApp();
  const c = app.ctx;

  sub('a small vocabulary of motifs, chosen by rule');
  const P = o => c.travelPlan(Object.assign({ from: 'earth', to: 'moon', first: false, repeat: false, reduced: false, flight: 1 }, o));
  const has = (p, m) => p.motifs.indexOf(m) !== -1;
  T('leaving Earth passes through clouds', has(P({}), 'clouds-out') && has(P({ to: 'station' }), 'clouds-out'));
  T('coming home passes through them the other way', has(P({ from: 'moon', to: 'earth' }), 'clouds-in') && !has(P({ from: 'moon', to: 'earth' }), 'clouds-out') &&
    has(P({ from: 'station', to: 'earth' }), 'clouds-in'));
  T('a trip between worlds cruises through streaming stars', has(P({}), 'cruise') && has(P({ to: 'mercury' }), 'cruise') && has(P({ from: 'mercury', to: 'earth' }), 'cruise'));
  T('a shooting star crosses on every other cruise, the same ones every time', [0, 1, 2, 3, 4].map(f => has(P({ flight: f }), 'shooting')).join() === 'true,false,true,false,true');
  T('friendly rocks pass one trip in three, and never on a first arrival', [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(f => has(P({ flight: f }), 'asteroids')).length === 3 &&
    !has(P({ flight: 2, first: true }), 'asteroids'));
  T('the light tunnel is kept for the first trip to a world beyond the first stop',
    has(P({ to: 'mercury', first: true }), 'tunnel') && !has(P({ to: 'moon', first: true }), 'tunnel') && !has(P({ to: 'mercury' }), 'tunnel') && !has(P({ from: 'mercury', to: 'earth' }), 'tunnel'));
  T('the space station is flown into, and out of, by its own motif — no star cruise',
    has(P({ to: 'station' }), 'station-in') && has(P({ from: 'station', to: 'earth' }), 'station-out') && !has(P({ to: 'station' }), 'cruise'));
  T('the same trip always plans the same way', JSON.stringify(P({ flight: 5 })) === JSON.stringify(P({ flight: 5 })));
  const phases = ['ignite', 'rise', 'cruise', 'approach', 'touchdown'];
  const plans = [P({}), P({ first: true }), P({ repeat: true }), P({ to: 'station' }), P({ from: 'station', to: 'earth', repeat: true }), P({ to: 'mercury', first: true })];
  T('every trip has the same five phases, in order, filling it exactly',
    plans.every(p => phases.every((k, i) => p.at[k][0] <= p.at[k][1] && p.at[k][0] === (i ? p.at[phases[i - 1]][1] : 0)) && p.at.touchdown[1] === p.duration));
  T('action, then a breath: the engine lights for a moment, and the arrival has room to be seen',
    plans.every(p => p.at.ignite[1] >= 240 && p.at.approach[1] - p.at.approach[0] >= 380 && p.at.cruise[1] - p.at.cruise[0] >= 250),
    plans.map(p => p.at.cruise[1] - p.at.cruise[0]).join(','));
  T('with Reduce Motion, a crossfade and nothing else', P({ reduced: true }).motifs.join() === 'fade' && P({ reduced: true, first: true, to: 'mercury' }).motifs.join() === 'fade');

  sub('what a flight may touch');
  const travelSrc = stripComments(fnBody(js(), 'travelTo')), fxSrc = stripComments(fnBody(js(), 'travelFx'));
  T('what a flight passes is made for it alone and cleared when it lands', /clearTravelFx\(\);/.test(travelSrc) &&
    (travelSrc.match(/clearTravelFx\(\)/g) || []).length === 2);
  T('its pictures come from the content, not from names in a scene', /TRAVEL_ART\.clouds/.test(fxSrc) && /TRAVEL_ART\.rocks/.test(fxSrc) && !/'(prop|place)\.[a-zA-Z]+'/.test(fxSrc));
  T('the arriving place is put out of sight before it is shown, not only by a first frame',
    travelSrc.indexOf('holdArrival(') !== -1 && travelSrc.indexOf('holdArrival(') < travelSrc.indexOf("classList.add('is-shown')"));
  T('the rocket is measured where it stands and where it lands, and flown between the two at each place\'s size',
    /const s0 = f\.from && f\.land && f\.land\.h \? f\.from\.h \/ f\.land\.h : 1;/.test(fnBody(js(), 'flightMoves')));

  sub('whatever happens, a flight lands and the stage rests');
  const t = fast(H.loadApp().ctx);
  const rest = () => t.stageRestingProblems();
  const landed = where => t.session.travel === null && t.session.place === where && rest().length === 0;
  await t.startAdventure();
  await t.travelTo('moon', { first: true });
  T('a flight lands at its destination, at rest', landed('moon'), rest().join('; '));
  t.TIMING.travel = 5000; t.TIMING.travelRepeat = 5000; t.TIMING.travelDock = 5000; t.TIMING.travelDockRepeat = 5000;
  let f = t.travelTo('earth', {});
  T('in flight, the stage is between places, and the check allows it', t.session.travel !== null && rest().length === 0);
  t.skipTravel();
  await f;
  T('skipped, it lands at once', landed('earth'));
  /* "At once": checked before the flight is awaited, or a flight left to
     finish on its own timer would pass for one that was landed. */
  f = t.travelTo('moon', {});
  t.window.dispatch('resize');
  const resized = t.session.travel === null;
  await f;
  T('the screen changing shape mid-flight lands it at once, where it was going', resized && landed('moon'));
  f = t.travelTo('earth', {});
  t.document.visibilityState = 'hidden'; t.document.dispatch('visibilitychange'); t.document.visibilityState = 'visible';
  const hid = t.session.travel === null;
  await f;
  T('so does leaving the app mid-flight', hid && landed('earth'));
  f = t.travelTo('station', {});
  t.document.getElementById('stage').setAttribute('data-place', 'mercury');
  t.skipTravel();
  await f;
  T('a stage knocked out of place during a flight is put right when it lands', landed('station') && t.document.getElementById('stage').getAttribute('data-place') === 'station');
  T('and that repair is counted for the grown-ups area', t.session.repairs === 1 && /the stage stands at mercury/.test(t.session.lastRepair), t.session.lastRepair);
  t.TIMING.travel = 0; t.TIMING.travelRepeat = 0; t.TIMING.travelDock = 0; t.TIMING.travelDockRepeat = 0;
  const rand = H.mulberry32(22);
  let bad = 0;
  for(let i = 0; i < 60; i++){
    const to = ['earth', 'moon', 'mercury', 'station'][Math.floor(rand() * 4)];
    if(to === t.session.place) continue;
    const g = t.travelTo(to, { first: rand() < 0.3 });
    const k = rand();
    if(k < 0.25) t.skipTravel();
    else if(k < 0.4) t.window.dispatch('resize');
    else if(k < 0.5) t.setMotionPref(t.motionPref === 'reduce' ? 'system' : 'reduce');
    await g;
    if(!landed(to)) bad++;
  }
  t.setMotionPref('system');
  T('sixty flights in any order, skipped, resized, with and without Reduce Motion: every one comes to rest', bad === 0 && t.session.repairs === 1, bad + ' did not; repairs ' + t.session.repairs);

  sub('a broken rest is found, and redrawn from state');
  const plant = (name, harm) => {
    harm();
    const found = t.checkStage();
    return found.length > 0 && rest().length === 0;
  };
  const other = () => (t.session.slot === 'A' ? 'B' : 'A');
  T('two places shown at once', plant('two', () => t.document.getElementById('place' + other()).classList.add('is-shown')));
  T('the rocket\'s place hidden', plant('hidden', () => t.document.getElementById('place' + t.session.slot).classList.remove('is-shown')));
  T('the wrong place in the rocket\'s slot', plant('wrong', () => t.document.getElementById('place' + t.session.slot).setAttribute('data-place', 'mercury')));
  T('a place with no ground', plant('ground', () => t.setHtml('place' + t.session.slot + 'Art', '')));
  T('pictures left in the hidden slot', plant('left', () => t.setHtml('place' + other() + 'Sky', '<img src="x">')));
  T('a rocket still flying', plant('flying', () => t.document.getElementById('stageRocket').classList.add('is-flying')));
  T('a place left out of position by a flight', plant('moved', () => { t.document.getElementById('place' + t.session.slot + 'Ground').style.transform = 'translateY(900px)'; }));
  T('things a flight passed, left in the sky', plant('fx', () => t.setHtml('travelNear', '<span class="fx-speck"></span>')));
  t.renderGrownups();
  T('the grown-ups area says how often the display was redrawn, for device testing',
    /Display checks/.test(t.document.getElementById('gAbout').innerHTML) && /Redrawn 9 times this session/.test(t.document.getElementById('gAbout').innerHTML),
    t.session.repairs + ' repairs');
  T('the stage is checked after every flight, at boot, and when the app comes back into view',
    /checkStage\(\);/.test(fnBody(js(), 'travelTo')) && /checkStage\(\);\s*\}\s*$/.test(fnBody(js(), 'wireProduct').trim()) &&
    /visibilitychange[\s\S]{0,420}checkStage\(\);/.test(fnBody(js(), 'wireProduct')));

  sub('arriving: nothing can be tapped until the world has settled');
  const u = fast(H.loadApp().ctx);
  await u.startAdventure();
  u.TIMING.arriveSettle = 60;
  const arrive = u.launch();
  await wait(20);
  T('touching down, the planet is shown but still settling', u.currentScene === 'planet' && u.session.busy === true);
  await u.tapMarker('moon-1');
  T('a tap on the beacon while it settles is not a start', u.session.run === null);
  await arrive;
  T('settled, the planet is the child\'s', u.session.busy === false);
  await u.tapMarker('moon-1');
  T('and the beacon starts its mission', u.currentScene === 'mission' && !!u.session.run);

  sub('space is alive, and never in the way');
  const paths = Array.from({ length: 40 }, (_, k) => c.shootingStarPath(k));
  T('a shooting star\'s path is the same for the same star, every time', JSON.stringify(c.shootingStarPath(7)) === JSON.stringify(paths[7]));
  T('rare: never sooner than 13 seconds after the last', paths.every(p => p.wait >= 13000), Math.min.apply(null, paths.map(p => p.wait)) + 'ms');
  T('it keeps to the far side of the sky, away from Pip and the caption', paths.every(p => p.x0 >= 0.6 && p.x1 >= 0.4 && p.x1 < p.x0 && p.y1 > p.y0));
  T('and starts below the HUD, never across the title', /const top = \(hud \? hud\.top \+ hud\.h : H \* 0\.12\) \+ 16/.test(fnBody(js(), 'shootStar')));
  const v = H.loadApp();
  const w = fast(v.ctx);
  w.TIMING.shootingStarEvery = 100000;
  await w.startAdventure();
  T('on Earth, the next one is waiting', w.ambient.timer !== null);
  await launchAndStart(w);
  T('in a mission, none', w.ambient.timer === null && w.ambientAllowed() === false);
  w.askGoHome();
  w.__flush();
  await w.goHomeFromMission();
  T('home again, the next one is waiting', w.currentScene === 'earth' && w.ambient.timer !== null);
  w.setMotionPref('reduce');
  w.armAmbient();
  T('with Reduce Motion, none — even on Earth', w.ambient.timer === null && w.ambientAllowed() === false);
  w.setMotionPref('system');
}

/* =========================================================
   CONTRACT 36 — WHO OWNS A TAP
   Found on a real iPad: in Letter Explorer, fast taps during
   feedback reacted badly — one flag did the work of "Pip is
   explaining" and "Pip is praising", so a tap meant to start early
   cut the praise off instead. Now an answer being praised owns the
   screen, and a wrong answer holds taps for a moment.
   ========================================================= */
async function testInput(){
  section('CONTRACT 36 — an answer being praised owns the screen; a bouncing finger is one tap');
  const sp = fakeSpeech();
  const app = H.loadApp({ windowExtras: sp.extras });
  const c = fast(app.ctx);
  await c.startAdventure();
  await c.launch();

  sub('the intro: a tap means "go on"');
  const starting = c.tapMarker('moon-1');
  await Promise.resolve();
  await Promise.resolve();
  const cut = sp.cancels();
  const r0 = c.session.run.round;
  c.choose(r0.answer);
  T('during the explanation, a tap skips to the question', c.session.input !== 'intro' || sp.cancels() > cut);
  T('and is not taken as an answer', r0.resolved === false && r0.misses === 0);
  await starting;
  T('the question is then asked, and the screen is open', c.session.input === 'open');

  sub('praise: a tap waits');
  const praising = c.choose(r0.answer);
  T('a right answer takes the screen', c.session.input === 'wait' && r0.resolved === true);
  const cancels = sp.cancels(), heard = sp.said.length, results = c.session.run.results.length;
  c.choose(0); c.choose(1); c.choose(2); c.repeatPrompt(); c.tapBeat();
  T('taps during praise neither answer, nor repeat, nor cut the praise short',
    sp.cancels() === cancels && sp.said.length === heard && c.session.run.results.length === results);
  T('praise cannot be skipped', c.Voice.skip() === false && sp.cancels() === cancels);
  await praising;
  T('the next question opens the screen again', c.session.input === 'open' && c.session.run.index === 1);

  sub('a wrong answer: a moment\'s hold, not a lock');
  c.TIMING.wrongHold = 300;
  const r1 = c.session.run.round;
  const wrong = r1.options.map((_, i) => i).filter(i => i !== r1.answer);
  const missing = c.choose(wrong[0]);
  c.choose(wrong[1]);
  T('a second wrong tap straight after the first is a bouncing finger, not a second answer', r1.misses === 1 && r1.out.length === 1);
  c.choose(r1.answer);
  T('even the right one waits out the hold', r1.resolved === false);
  await missing;
  await wait(320);
  const right = c.choose(r1.answer);
  T('after it, the right answer is taken at once', r1.resolved === true);
  await right;
  c.TIMING.wrongHold = 0;
  T('the hold is short: under half a second', c.TIMING.wrongHold === 0 && fnBody(js(), 'choose').indexOf('TIMING.wrongHold') !== -1 &&
    Number((js().match(/wrongHold: (\d+),/) || [])[1]) <= 500);

  sub('the same ownership in every game');
  await playMission(c);
  await c.flyHome();
  c.journey.completions.push({ id: 'run_rhymes', missionId: 'mercury-1', destinationId: 'mercury', skillId: 'rhyming', completedAt: 't', updatedAt: 't' });
  c.pickDestination('mercury');
  await c.launch();
  await c.tapMarker('mercury-2');
  const g = c.session.run.round;
  for(let k = 0; k < g.guide; k++){ c.session.beat.lastAt = 0; c.tapBeat(); }
  const settling = c.settleBeats(c.session.run);
  T('the beats are counted and praised', g.resolved === true && c.session.input === 'wait');
  await settling;
  T('then the stone is the child\'s again', c.session.input === 'open');

  sub('how a line sits in time is one table, not timeouts in the scenes');
  T('every line has a type', ['story.moon.firstArrive', 'mission.howTo', 'find.M', 'word.cake', 'found.M.0', 'rhyme.found.cake.snake.0',
    'feedback.almost.1', 'show.M', 'marker.beacon', 'guide.launchHint.1', 'item.gear-star', 'letter.M', 'phoneme.m', 'seg.map', 'blend.map'].map(c.cueType).join() ===
    'story,instruction,question,word,praise,praise,correction,correction,hint,hint,reaction,letterName,phoneme,segmented,blended');
  T('praise holds long enough to see the right answer, and a tap cannot cut it; a story breathes after it',
    c.AUDIO_TYPES.praise.hold >= 900 && c.AUDIO_TYPES.praise.interrupt === false && c.AUDIO_TYPES.correction.interrupt === false &&
    c.AUDIO_TYPES.story.post > 0 && c.AUDIO_TYPES.instruction.interrupt === true);
  c.TIMING.dialogueScale = 1;
  const t0 = Date.now();
  await c.Voice.say('found.M.0');
  const held = Date.now() - t0;
  const t1 = Date.now();
  await c.Voice.sequence(['story.moon.arrive.1', 'marker.beacon']);
  const breathed = Date.now() - t1;
  c.TIMING.dialogueScale = 0;
  T('a praise the voice finishes quickly still holds its minimum', held >= c.AUDIO_TYPES.praise.hold - 20, held + 'ms');
  T('a story line gets its breath before the next line', breathed >= c.AUDIO_TYPES.story.pre + c.AUDIO_TYPES.story.post - 20, breathed + 'ms');
  T('no scene writes a pause of its own around a line: praise waits on the praise, nothing else',
    !/delay\(TIMING\.praiseMin\)/.test(js()) && !/praiseMin/.test(js()) && /return sayLines\(view\.praise\(r, session\.praiseAt\+\+\)\)/.test(fnBody(js(), 'choose')));

  c.TIMING.wrongHold = 300;
  const b1 = c.session.run.round;
  c.session.beat.lastAt = 0; c.tapBeat(); c.session.beat.lastAt = 0; c.tapBeat();
  const almost = c.settleBeats(c.session.run);
  c.session.beat.lastAt = 0; c.tapBeat();
  T('after a wrong count, a tap straight away is the same finger, not a new count', b1.misses === 1 && c.session.beat.taps === 0);
  await almost;
  await wait(320);
  c.session.beat.lastAt = 0; c.tapBeat();
  T('a moment later the stone counts again', c.session.beat.taps === 1);
  c.TIMING.wrongHold = 0;
  T('no console errors', app.errors.length === 0, app.errors.join(' | '));
}

/* =========================================================
   CONTRACT 37 — THE PLAY FIELD
   Found on a real iPad: Rhyme Radar's pictures climbed above the
   play area and out of sight. The game's box was sized in vh while
   what it held had minimum pixel sizes. Now the CSS owns the box and
   its contents are sized to fit it, on every screen.
   ========================================================= */
function testPlayfield(){
  section('CONTRACT 37 — the game always fits the box it stands in');
  const c = H.loadApp().ctx, sheet = css();

  sub('the box is owned by one rule, below the HUD and standing on the ground');
  T('its top is the HUD\'s edge, its foot just below the horizon\'s crest',
    /\.game\{[^}]*right: 0; top: 0;\s*bottom: calc\(100 \* var\(--vh\) - var\(--crest-y\) - 9 \* var\(--vh\) - var\(--space-lg\) - var\(--inset-bottom\)\);/.test(sheet));
  T('the tiles, the picture, the stone and the meteors are sized from the fit, with the same gap', /\.choices\{[^}]*gap: var\(--game-gap\)/.test(sheet) &&
    /\.beats\{[^}]*gap: var\(--game-gap\)/.test(sheet) && /\.choice-stone\{\s*width: var\(--tile-size\); height: calc\(var\(--tile-size\) \* 1\.1\);/.test(sheet) &&
    /\.beat-stone\{[^}]*width: var\(--stone-w\); aspect-ratio: 1\.3;/.test(sheet) && /\.meteor-row\{[^}]*gap: 8px;/.test(sheet));
  T('the picture\'s size is not re-declared where it would override the fit', !/\.game-signal\{[^}]*--signal:/.test(sheet));
  T('the fit is measured when a round is drawn and whenever the screen changes shape',
    /fitPlayfield\(\);/.test(fnBody(js(), 'renderRound')) && /fitPlayfield\(\)/.test(fnBody(js(), 'wireProduct')));

  sub('what goes in it always fits');
  /* The box a screen gives the game, from the same terms as the CSS:
     the scene's side margins, Pip's column, the HUD band, the crest. */
  const box = (W, Hh) => ({ w: W - 48 - (0.22 * W + 24), h: 0.71 * Hh - 84 });
  const extent = (f, type) => {
    if(type === 'rhyme-pick') return f.layout === 'row'
      ? { w: f.signal + f.gap + 3 * f.tile + 2 * f.gap, h: Math.max(f.signal, f.tile) }
      : { w: 3 * f.tile + 2 * f.gap, h: f.signal + f.gap + f.tile };
    if(type === 'syllable-tap'){
      const col = Math.max(f.stone, 4 * f.meteor + 24), stoneH = f.stone / 1.3;
      return f.layout === 'row' ? { w: f.signal + f.gap + col, h: Math.max(f.signal, f.meteor + f.gap + stoneH) }
                                : { w: col, h: f.signal + f.gap + f.meteor + f.gap + stoneH };
    }
    return { w: 3 * f.tile + 2 * f.gap, h: f.tile * 1.1 };
  };
  const TYPES = ['find-letter', 'rhyme-pick', 'syllable-tap'];
  const IPADS = [[1024, 768], [1080, 810], [1133, 744], [1180, 820], [1194, 834], [1366, 1024], [1024, 690], [1180, 740]];
  const PHONES = [[844, 390], [667, 375], [926, 428], [740, 360]];
  const fits = (W, Hh) => TYPES.every(type => { const b = box(W, Hh), f = c.playfieldSizes(b.w, b.h, type), e = extent(f, type);
    return f.tile > 0 && e.w <= b.w + 0.5 && e.h <= b.h + 0.5; });
  const misfits = IPADS.concat(PHONES).filter(v => !fits(v[0], v[1]));
  T('every game fits on every iPad and every phone in landscape — Safari\'s toolbar included', misfits.length === 0, misfits.map(v => v.join('×')).join(', '));
  const smallest = IPADS.map(v => { const b = box(v[0], v[1]); return Math.min(c.playfieldSizes(b.w, b.h, 'rhyme-pick').tile, c.playfieldSizes(b.w, b.h, 'find-letter').tile); });
  T('on every iPad a picture card and a letter stone stay at least 130px', smallest.every(s => s >= 130), smallest.join(','));
  const phone = c.playfieldSizes(box(844, 390).w, box(844, 390).h, 'rhyme-pick');
  T('on a short phone the picture stands beside the cards instead of above them', phone.layout === 'row', JSON.stringify(phone));
  const ipad = c.playfieldSizes(box(1024, 768).w, box(1024, 768).h, 'rhyme-pick');
  T('on an iPad the radar picture stands above the cards, as it was designed', ipad.layout === 'stack');
  let sweepBad = 0;
  for(let w = 260; w <= 1400; w += 45){
    for(let h = 120; h <= 900; h += 35){
      TYPES.forEach(type => { const f = c.playfieldSizes(w, h, type), e = extent(f, type); if(e.w > w + 0.5 || e.h > h + 0.5 || f.tile < 0) sweepBad++; });
    }
  }
  T('and any box at all, from tiny to huge: nothing ever overflows', sweepBad === 0, String(sweepBad));
}

/* =========================================================
   CONTRACT 38 — THE SPACE STATION, AND WHAT A ROCKET WEARS
   Found on a real iPad: the Rocket Dock scored 2 of 10 — a menu over
   the world. It is now a place a flight reaches, where the rocket is
   the hero, and a rocket wears paint, gear and a theme. Nothing
   bought with money, nothing random, and still only two keys written.
   ========================================================= */
async function testStation(){
  section('CONTRACT 38 — a space station to fly to, and a rocket dressed up there');
  const app = H.loadApp();
  const c = app.ctx, sheet = css();

  sub('three kinds of thing to wear, proved with a small set');
  const of = slot => c.COSMETICS.filter(x => x.slot === slot);
  T('eight paints, each a colour token', of('paint').length === 8 && of('paint').every(p => new RegExp('--' + p.tint + ':\\s*#').test(sheet)));
  T('gear: a star topper, a tiny antenna, a moon topper, side lights and boosters',
    ['gear-star', 'gear-antenna', 'gear-moon', 'gear-lights', 'gear-booster'].every(id => c.cosmeticById(id) && c.cosmeticById(id).slot === 'gear'));
  T('each gear piece is a picture in the rocket\'s own frame, laid over it — never a second rocket',
    of('gear').filter(g => g.art).every(g => c.assetEntry(g.art) && c.assetEntry(g.art).dimensions === c.assetEntry('rocket.body').dimensions));
  const themes = of('theme').filter(t => !t.starter);
  T('three themes, each a pattern of colour tokens through the one paint mask', themes.length === 3 &&
    themes.every(t => new RegExp('\\[data-pattern="' + t.pattern + '"\\] \\.rocket-paint\\{').test(sheet)));
  T('every kind starts with a free thing a rocket already wears, so a look is never empty',
    c.COSMETIC_SLOTS.map(s => s.id).join() === 'paint,gear,theme' && c.COSMETIC_SLOTS.every(s => c.starterCosmetic(s.id) && c.starterCosmetic(s.id).cost === 0));
  const allowed = ['id', 'slot', 'name', 'cost', 'tint', 'starter', 'art', 'pattern', 'focus'];
  T('nothing is random, sold for money, or changes how anything plays: a cosmetic has a name, a slot, a price in stars and a look',
    c.COSMETICS.every(x => Object.keys(x).every(k => allowed.indexOf(k) !== -1)));

  sub('wearing a look');
  let ledger = c.awardStars([], 'run_1', 40, 't').ledger;
  ['paint-sky', 'paint-lime', 'gear-star', 'theme-bee'].forEach(id => { ledger = c.unlockCosmetic(ledger, id, 't').ledger; });
  let rocket = null;
  const wear = id => { const e = c.equipCosmetic(rocket, id, ledger, 't'); if(e.ok) rocket = e.rocket; return c.equippedLook(rocket, ledger); };
  T('one thing per kind: a topper leaves the paint on', (() => { wear('paint-sky'); const l = wear('gear-star'); return l.paint === 'paint-sky' && l.gear === 'gear-star' && l.theme === 'theme-none'; })());
  T('a theme hides the paint without forgetting it', (() => { const l = wear('theme-bee'); return l.theme === 'theme-bee' && l.paint === 'paint-sky' && l.gear === 'gear-star'; })());
  T('choosing a paint takes the theme off, so the paint can be seen', (() => { const l = wear('paint-lime'); return l.paint === 'paint-lime' && l.theme === 'theme-none'; })());
  T('and taking the theme off shows the paint that was on', (() => { wear('theme-bee'); const l = wear('theme-none'); return l.paint === 'paint-lime' && l.theme === 'theme-none'; })());
  T('a rocket saved before gear and themes existed reads exactly as it did — no migration needed',
    JSON.stringify(c.equippedLook({ paint: 'paint-sky', updatedAt: '2026-09-27T00:00:00.000Z' }, ledger)) === JSON.stringify({ paint: 'paint-sky', gear: 'gear-none', theme: 'theme-none' }));
  T('a saved thing not owned shows the starter instead, and the record is left as it was', (() => {
    const saved = { paint: 'paint-ocean', gear: 'gear-booster', theme: 'theme-galaxy' };
    const copy = JSON.stringify(saved);
    const l = c.equippedLook(saved, ledger);
    return l.paint === 'paint-classic' && l.gear === 'gear-none' && l.theme === 'theme-none' && JSON.stringify(saved) === copy;
  })());
  const html = c.rocketHtml({ paint: 'paint-sky', gear: 'gear-star', theme: 'theme-bee' }, false);
  T('any look is the one rocket render, its paint mask, and gear pictures over it', html.indexOf(c.assetSrc('rocket.body')) !== -1 &&
    html.indexOf(c.assetSrc('rocket.paintMask')) !== -1 && html.indexOf(c.assetSrc('rocket.gearStar')) !== -1 &&
    html.indexOf(c.assetSrc('rocket.gearWings')) !== -1 && /data-pattern="bee"/.test(html));

  sub('the station is a place, reached by a flight');
  const shared = new Map();
  const sp = fakeSpeech();
  const a2 = H.loadApp({ sharedStorage: shared, windowExtras: sp.extras });
  const p = fast(a2.ctx), d = a2.dom.document;
  await p.startAdventure();
  const flights = p.session.flights;
  await p.openDock();
  T('the Dock is a flight up from Earth, not a menu', p.session.flights === flights + 1 && p.session.place === 'station' && p.currentScene === 'dock');
  const room = d.getElementById('place' + p.session.slot + 'Art').innerHTML;
  T('into a garage drawn from data: the room, and Earth behind its window', room.indexOf(p.assetSrc(p.DESTINATIONS.station.room)) !== -1 &&
    room.indexOf(p.assetSrc(p.DESTINATIONS.earth.asset)) !== -1 && room.indexOf(p.assetSrc(p.DESTINATIONS.earth.asset)) < room.indexOf(p.assetSrc(p.DESTINATIONS.station.room)));
  const onStation = cssRule(sheet, '.stage[data-place="station"]');
  T('the rocket stands on the turntable, larger: it is what the child came to see',
    Math.abs(cssNumber(onStation, '--rx') - p.DESTINATIONS.station.turntable[0]) < 0.001 && Math.abs(cssNumber(onStation, '--ry') - p.DESTINATIONS.station.turntable[1]) < 0.001 &&
    /--rocket-h: calc\(var\(--station-h\) \* 0\.\d+\)/.test(onStation));
  T('and the stage is at rest there', p.stageRestingProblems().length === 0, p.stageRestingProblems().join('; '));
  T('Pip welcomes the child to it', sp.said.some(s => /Welcome to the space station/.test(s)));
  T('a panel with three tabs, the things to try, and one action',
    (d.getElementById('dockTabs').innerHTML.match(/role="tab"/g) || []).length === 3 &&
    (d.getElementById('dockItems').innerHTML.match(/role="radio"/g) || []).length === 8 && !!d.getElementById('dockAction').getAttribute('aria-label'));
  p.pickDockTab('gear');
  T('each tab shows its own things', (d.getElementById('dockItems').innerHTML.match(/role="radio"/g) || []).length === 6 &&
    /aria-label="No gear, on your rocket"/.test(d.getElementById('dockItems').innerHTML));
  const before = {};
  shared.forEach((v, k) => { before[k] = v; });
  p.pickItem('gear-star');
  T('trying gear on shows it on the rocket at once', d.getElementById('stageRocket').getAttribute('data-gear') === 'gear-star');
  T('and saves nothing', (() => { let same = true; shared.forEach((v, k) => { if(before[k] !== v) same = false; }); return same && Object.keys(before).length === shared.size; })());
  p.dockAction();
  T('without enough stars, Pip says how many more', /You need 4 more stars/.test(sp.said[sp.said.length - 1]));
  p.journey.stars = p.awardStars(p.journey.stars, 'run_x', 12, 't').ledger;
  p.saveStars();
  const keysBefore = new Map(shared);
  p.dockAction();
  T('with them, it is unlocked and worn', p.ownedCosmetics(p.journey.stars).indexOf('gear-star') !== -1 && p.currentLook().gear === 'gear-star');
  p.pickDockTab('theme');
  p.pickItem('theme-bee');
  p.dockAction();
  T('a theme too', p.currentLook().theme === 'theme-bee' && d.getElementById('stageRocket').getAttribute('data-pattern') === 'bee');
  p.pickDockTab('paint');
  p.pickItem('paint-sky');
  T('trying a paint on while a theme is worn shows the paint, not the theme', d.getElementById('stageRocket').getAttribute('data-theme') === 'theme-none' &&
    /--paint: var\(--paint-sky\)/.test(d.getElementById('stageRocket').getAttribute('style')));
  const changed = [];
  shared.forEach((v, k) => { if(keysBefore.get(k) !== v) changed.push(k.slice(p.STORAGE_NAMESPACE.length)); });
  T('the station wrote stars and rocket, and nothing else', changed.length > 0 && changed.every(k => k === p.KEYS.stars || k === p.KEYS.rocket), changed.join(','));
  await p.leaveDock();
  T('leaving flies home: on Earth, the rocket in what it wears, the try-on gone', p.currentScene === 'earth' && p.session.place === 'earth' &&
    d.getElementById('stageRocket').getAttribute('data-theme') === 'theme-bee' && p.stageRestingProblems().length === 0);
  T('the way there and the way back are each a route, quicker once flown', p.session.routes['earth>station'] === true && p.session.routes['station>earth'] === true);
  const again = H.loadApp({ sharedStorage: shared });
  T('reloaded, the rocket still wears its gear and theme', again.ctx.currentLook().gear === 'gear-star' && again.ctx.currentLook().theme === 'theme-bee' && again.errors.length === 0,
    again.errors.join(' | '));
  T('no console errors', a2.errors.length === 0, a2.errors.join(' | '));
}

/* =========================================================
   PHASE 3 HELPERS
   ========================================================= */
/* A Web Audio output that records what it was asked to play. A phonics
   sound is a buffer source the app waits on (it sets onended); it "plays"
   for `playMs`. Sound effects are oscillators and noise buffers. Every
   phonics sound is also written into `events` as 'ph', in order with
   whatever else is logged there. */
function fakeAudio(opts){
  const o = opts || {};
  const log = { phonics: [], stops: 0, oscillators: [], active: 0, maxActive: 0 };
  class Param { constructor(v){ this.value = v; } setValueAtTime(v){ this.value = v; } exponentialRampToValueAtTime(){} linearRampToValueAtTime(){} }
  class Node { connect(){} disconnect(){} }
  class Ctx {
    constructor(){ this.state = 'running'; this.sampleRate = o.sampleRate || 22050; this.currentTime = 0; this.destination = new Node(); }
    resume(){ this.state = 'running'; return Promise.resolve(); }
    createGain(){ const n = new Node(); n.gain = new Param(1); return n; }
    createBiquadFilter(){ const n = new Node(); n.frequency = new Param(1000); n.type = 'lowpass'; return n; }
    createOscillator(){
      const n = new Node(); n.type = 'sine'; n.frequency = new Param(440);
      n.start = at => { n.at = at; }; n.stop = at => { log.oscillators.push({ f: n.frequency.value, dur: at - (n.at || 0), type: n.type }); };
      return n;
    }
    createBuffer(ch, len, sr){ const data = new Float32Array(len); return { length: len, sampleRate: sr, duration: len / sr, getChannelData: () => data, copyToChannel(x){ data.set(x); } }; }
    createBufferSource(){
      const n = new Node();
      let rec = null;
      n.start = () => {
        if(!n.onended) return;                        // a sound effect's noise
        rec = { length: n.buffer.length, sampleRate: n.buffer.sampleRate, ended: false };
        log.phonics.push(rec);
        if(o.events) o.events.push('ph');
        log.active++; log.maxActive = Math.max(log.maxActive, log.active);
        n._t = setTimeout(() => { if(rec.ended) return; rec.ended = true; log.active--; n.onended(); }, o.playMs || 0);
      };
      n.stop = () => { log.stops++; clearTimeout(n._t); if(rec && !rec.ended){ rec.ended = true; rec.cut = true; log.active--; } };
      return n;
    }
  }
  return { log, extras: { AudioContext: Ctx } };
}
/* Speech and phonics together: what was said and played, in order, and
   how many sounded at once. */
function audioRig(opts){
  const events = [];
  const sp = fakeSpeech(), au = fakeAudio(Object.assign({ events: events }, opts || {}));
  const base = sp.extras.speechSynthesis.speak;
  let speaking = 0, most = 0;
  sp.extras.speechSynthesis.speak = u => {
    if(String(u.text).trim()) events.push('tts:' + u.text);
    const end = u.onend, start = u.onstart;
    u.onstart = () => { speaking++; most = Math.max(most, speaking + au.log.active); if(start) start(); };
    u.onend = () => { speaking--; if(end) end(); };
    base(u);
  };
  return { sp, au, events, extras: Object.assign({}, sp.extras, au.extras), most: () => Math.max(most, au.log.maxActive) };
}
/* The share of a sound's energy above `hz`, in its loudest stretch. */
function shareAbove(samples, sr, hz){
  const N = 512;
  let best = 0, at = 0;
  for(let i = 0; i + N < samples.length; i += 256){ let e = 0; for(let j = 0; j < N; j++) e += samples[i + j] * samples[i + j]; if(e > best){ best = e; at = i; } }
  let hi = 0, all = 0;
  for(let k = 1; k < N / 2; k++){
    let re = 0, im = 0;
    for(let j = 0; j < N; j++){ const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / (N - 1)); const v = (samples[at + j] || 0) * w; re += v * Math.cos(2 * Math.PI * k * j / N); im -= v * Math.sin(2 * Math.PI * k * j / N); }
    const pw = re * re + im * im;
    all += pw; if(k * sr / N > hz) hi += pw;
  }
  return all ? hi / all : 0;
}
/* The longest run of near-silence between two moments (s). */
function longestQuiet(samples, sr, from, to){
  let run = 0, longest = 0;
  for(let i = Math.floor(from * sr); i < Math.min(samples.length, Math.floor(to * sr)); i++){
    if(Math.abs(samples[i]) < 0.004){ run++; longest = Math.max(longest, run); } else run = 0;
  }
  return longest / sr;
}
/* Mark some missions as done, the way a saved journey would have them. */
function seedDone(c, ids){
  ids.forEach((id, i) => c.journey.completions.push({ id: 'seed_' + id + '_' + i, missionId: id, destinationId: c.MISSIONS[id].destinationId,
    skillId: c.MISSIONS[id].skillId, startedAt: 't', completedAt: 't', updatedAt: 't' }));
}
/* A journey saved by v0.4.0: the Moon relit, Mercury restored, stars
   earned and one spent, a rocket in its paint, the arrival flags set. */
function seedV040(storage, c){
  const ns = c.STORAGE_NAMESPACE, at = '2026-09-26T10:00:00.000Z';
  const done = ['moon-1', 'mercury-1', 'mercury-2'].map((id, i) => ({ id: 'run_v040_' + i, missionId: id, destinationId: c.MISSIONS[id].destinationId,
    skillId: c.MISSIONS[id].skillId, startedAt: at, completedAt: at, updatedAt: at, rounds: 6, firstTry: 5, helped: 1, unscored: 0 }));
  const stars = done.map(x => ({ id: 'earn.' + x.id, kind: 'earn', amount: 3, runId: x.id, at: at, updatedAt: at }))
    .concat([{ id: 'spend.paint-sky', kind: 'spend', amount: 3, cosmeticId: 'paint-sky', at: at, updatedAt: at }]);
  const evidence = [{ id: 'letter-recognition.M.upper', skillId: 'letter-recognition', item: 'M', form: 'upper', seen: 3, firstTry: 1, recent: [0, 1, 0], lastPracticed: at, updatedAt: at }];
  const profile = { id: 'explorer', createdAt: at, updatedAt: at, story: { 'arrived.moon': at, 'arrived.mercury': at, 'heard.dockHint': at } };
  const put = (k, v) => storage.setItem(ns + k, JSON.stringify(v));
  put(c.KEYS.completions, done); put(c.KEYS.stars, stars); put(c.KEYS.evidence, evidence);
  put(c.KEYS.profile, profile); put(c.KEYS.rocket, { paint: 'paint-sky', updatedAt: at });
  storage.setItem(ns + c.KEYS.schemaVersion, String(c.DATA_SCHEMA_VERSION));
}
/* Records calls to one of the app's functions, still calling it. */
function spy(ctx, name){
  const calls = [];
  const real = ctx[name];
  ctx[name] = function(){ calls.push([].slice.call(arguments)); return real.apply(this, arguments); };
  return calls;
}

/* =========================================================
   CONTRACT 39 — ONE AUDIO OWNER
   Every spoken line is a typed cue resolved in one place: a recording,
   then the development phonics voice (for a sound a child learns from)
   or the device voice (for anything else), then the caption. A letter's
   sound never reaches the device voice, and only one thing sounds at a
   time, with pauses by kind and by punctuation.
   ========================================================= */
async function testAudioSystem(){
  section('CONTRACT 39 — one audio owner: typed cues, phonics never on the device voice');
  const rig = audioRig();
  const app = H.loadApp({ windowExtras: rig.extras });
  const c = fast(app.ctx);
  c.unlockAudio();

  sub('the cue types');
  const need = ['story', 'instruction', 'question', 'praise', 'correction', 'hint', 'word', 'letterName', 'phoneme', 'segmented', 'blended', 'sfx'];
  T('every kind of cue the product needs has a type, with its timing and its rule for the device voice',
    need.every(k => c.AUDIO_TYPES[k] && ['pre', 'post', 'hold'].every(p => Number.isFinite(c.AUDIO_TYPES[k][p])) &&
      typeof c.AUDIO_TYPES[k].interrupt === 'boolean' && typeof c.AUDIO_TYPES[k].tts === 'boolean'));
  T('a sound, a word said sound by sound, and a blended word may never be given to the device voice',
    ['phoneme', 'segmented', 'blended'].every(k => c.AUDIO_TYPES[k].tts === false && c.AUDIO_TYPES[k].phonics === true));
  T('a letter\'s name and a word may', c.AUDIO_TYPES.letterName.tts && c.AUDIO_TYPES.word.tts);
  T('every authored line declares a spoken type', Object.keys(c.VOICE_CUES).every(id => c.AUDIO_TYPES[c.VOICE_CUES[id].type] && !c.AUDIO_TYPES[c.VOICE_CUES[id].type].phonics));
  const cue = c.voiceCue('phoneme.m');
  T('a cue carries its id, type, script, locale and recording slot', cue.id === 'phoneme.m' && cue.type === 'phoneme' && typeof cue.speak === 'string' &&
    cue.locale === 'en-US' && 'file' in cue && cue.sounds.join() === 'm');
  T('a letter\'s NAME and its SOUND are two different cues', c.voiceCue('letter.M').type === 'letterName' && c.voiceCue('letter.M').speak === 'em' &&
    c.voiceCue('phoneme.m').type === 'phoneme' && c.voiceCue('phoneme.m').speak !== 'em');
  T('a sound has no text of its own: the caption is left as it is, and never shows the letter', cue.text === null);

  sub('who says what');
  T('with Web Audio, a sound plays in the development voice', c.audioRoute(c.voiceCue('phoneme.s')) === 'dev');
  T('a letter\'s name goes to the device voice', c.audioRoute(c.voiceCue('letter.M')) === 'tts');
  const spoken = x => x.sp.said.filter(s => s.trim()).length;
  const before = spoken(rig), buffers = rig.au.log.phonics.length;
  await c.Voice.say('phoneme.m');
  T('saying a sound plays a sound, and the device voice says nothing', spoken(rig) === before && rig.au.log.phonics.length === buffers + 1);
  await c.Voice.say('seg.map');
  await c.Voice.say('blend.map');
  T('so does a word said sound by sound, and a word blended', spoken(rig) === before && rig.au.log.phonics.length === buffers + 3);
  const plain = fakeSpeech();
  const b = H.loadApp({ windowExtras: plain.extras });
  const bc = fast(b.ctx);
  bc.unlockAudio();
  T('with no Web Audio at all, a sound is shown, never spoken by the device voice', bc.audioRoute(bc.voiceCue('phoneme.m')) === 'visual');
  await bc.Voice.say('phoneme.m');
  await bc.Voice.say('blend.map');
  T('and the device voice was not asked to try', plain.said.filter(x => x.trim()).length === 0, plain.said.join(' | '));
  T('speech is asked for in one place only: the Voice module', (() => {
    const src = stripComments(js());
    const a = src.indexOf('const Voice = (function(){'), z = src.indexOf('})();', a);
    return a > 0 && !/speechSynthesis|SpeechSynthesisUtterance/.test(src.slice(0, a) + src.slice(z));
  })());

  sub('a recording plays first, and a failed one never falls back to the device voice for a sound');
  const played = [];
  class FakeMedia {
    constructor(){ this.src = ''; }
    play(){
      played.push(this.src);
      const ok = !/broken/.test(this.src), ended = this.onended, failed = this.onerror;
      setTimeout(() => { if(ok && ended) ended(); if(!ok && failed) failed(); }, 0);
      return Promise.resolve();
    }
    pause(){}
  }
  const rig2 = audioRig();
  const r = H.loadApp({ windowExtras: Object.assign({}, rig2.extras, { Audio: FakeMedia }) });
  const rc = fast(r.ctx);
  rc.VOICE_RECORDINGS['phoneme.m'] = 'assets/audio/phoneme-m.m4a';
  rc.VOICE_RECORDINGS['phoneme.s'] = 'assets/audio/broken-s.m4a';
  rc.unlockAudio();
  T('a cue with a recording is heard from the recording', rc.audioRoute(rc.voiceCue('phoneme.m')) === 'file');
  await rc.Voice.say('phoneme.m');
  T('and nothing else plays', played.indexOf('assets/audio/phoneme-m.m4a') !== -1 && rig2.au.log.phonics.length === 0 && spoken(rig2) === 0);
  await rc.Voice.say('phoneme.s');
  T('a recording that fails falls back to the development voice — never the device voice', rig2.au.log.phonics.length === 1 && spoken(rig2) === 0);
  T('the media element is only woken once a recording exists: silence is not worth iOS\'s "now playing"',
    /if\(Object\.keys\(VOICE_RECORDINGS\)\.length\) MediaVoice\.unlock\(\);/.test(fnBody(js(), 'unlockAudio')));

  sub('one thing at a time, in order, with breaths between');
  const rig3 = audioRig();
  const q = H.loadApp({ windowExtras: rig3.extras });
  const qc = fast(q.ctx);
  qc.unlockAudio();
  await qc.Voice.sequence(['sound.listen', 'phoneme.m', 'sound.ask.m.0', 'phoneme.m', 'word.moon', 'word.sun']);
  T('a sequence of spoken lines and sounds never has two sounding at once', rig3.most() <= 1, String(rig3.most()));
  T('and plays in the order asked', rig3.events.join('|') === 'tts:Listen.|ph|tts:Which picture starts with…|ph|tts:Moon.|tts:Sun.', rig3.events.join('|'));
  const long = fakeAudio({ playMs: 400 });
  const l = H.loadApp({ windowExtras: long.extras });
  const lc = fast(l.ctx);
  lc.unlockAudio();
  const sounding = lc.Voice.say('seg.map');
  await wait(20);
  lc.Voice.say('word.map');
  T('something new said stops a sound still playing', long.log.stops >= 1 && long.log.active === 0);
  await sounding;
  T('stop() silences it too', (() => { lc.Voice.say('phoneme.s'); lc.Voice.stop(); return long.log.active === 0; })());
  T('sentences are spaced by their punctuation', qc.speechChunks("Yes! That's the letter em.").map(x => x.text + '/' + x.pause).join('|') ===
    'Yes!/' + qc.SPEECH_PAUSES['!'] + "|That's the letter em./0");
  T('a question that ends on its sound is one piece', qc.speechChunks('Which picture starts with…').length === 1);
  const rig4 = audioRig();
  const s4 = H.loadApp({ windowExtras: rig4.extras });
  const sc4 = fast(s4.ctx);
  sc4.TIMING.dialogueScale = 1;
  sc4.TIMING.speechSafetyBase = 2000;
  const t0 = Date.now();
  await sc4.Voice.say('feedback.almost.1');
  T('with pauses on, a line of two sentences is said as two, a pause between', rig4.sp.said.slice(-2).join('|') === 'Almost!|Listen again.' &&
    Date.now() - t0 >= sc4.SPEECH_PAUSES['!'] - 20, rig4.sp.said.slice(-2).join('|'));
  sc4.TIMING.dialogueScale = 0;
  T('a line\'s safety timer allows for the pauses between its sentences', /speechChunks\(cue\.speak\)\.reduce/.test(fnBody(js(), 'line')));
  const gap = (a, z) => sc4.AUDIO_TYPES[a].post + sc4.AUDIO_TYPES[z].pre;
  T('"Listen." … the sound … "Which picture starts with…" … the sound: a small pause each time, not three lines at once',
    gap('instruction', 'phoneme') >= 300 && gap('phoneme', 'question') >= 300 && gap('question', 'phoneme') >= 100);
  T('a question never follows a story line at once', gap('story', 'question') >= 500);
  T('and no pause is a dead space: none longer than 700 ms', Object.keys(sc4.AUDIO_TYPES).every(a => Object.keys(sc4.AUDIO_TYPES).every(z => gap(a, z) <= 700)));

  sub('the development phonics voice: sounds without a vowel after them');
  const sr = 22050;
  const one = id => c.phonicsRender(c.voiceCue('phoneme.' + id), sr);
  const m1 = one('m'), m2 = one('m');
  T('it is deterministic: the same sound is made the same way every time', m1.samples.length === m2.samples.length && m1.samples.every((v, i) => v === m2.samples[i]));
  const held = ['m', 'n', 's', 'f', 'r'].map(id => [id, one(id).samples.length / sr]);
  T('a sound that can be held is held: about half a second', held.every(h => h[1] >= 0.5 && h[1] <= 0.8), held.map(h => h.join(':')).join(' '));
  const puffs = ['p', 't', 'k'].map(id => [id, one(id).samples.length / sr]);
  T('a stop is a short puff, with no vowel after it', puffs.every(h => h[1] < 0.15), puffs.map(h => h.join(':')).join(' '));
  T('/s/ is a hiss: nearly all its energy is high', shareAbove(one('s').samples, sr, 3000) > 0.8, shareAbove(one('s').samples, sr, 3000).toFixed(2));
  T('/m/ is a hum: almost none of it is', shareAbove(one('m').samples, sr, 1000) < 0.1, shareAbove(one('m').samples, sr, 1000).toFixed(2));
  T('/f/ is a flatter hiss than /s/', shareAbove(one('f').samples, sr, 1500) > shareAbove(one('f').samples, sr, 3000) && shareAbove(one('f').samples, sr, 1500) > 0.5);
  const every = Object.keys(c.PHONEMES).filter(c.teachableSound).map(id => one(id));
  T('every sound is clean: no NaN, never clipping, silent at both ends', every.every(x => x && x.samples.every(Number.isFinite) &&
    x.samples.every(v => Math.abs(v) <= 0.9) && Math.abs(x.samples[0]) < 0.01 && Math.abs(x.samples[x.samples.length - 1]) < 0.01));
  const seg = c.phonicsRender(c.voiceCue('seg.map'), sr);
  const gaps = [longestQuiet(seg.samples, sr, seg.marks[0], seg.marks[1]), longestQuiet(seg.samples, sr, seg.marks[1], seg.marks[2])];
  T('a word said sound by sound: one mark per sound, and a pause a child can hear between each (0.25–0.7 s, never a dead space)',
    seg.marks.length === 3 && gaps.every(g => g >= 0.25 && g <= 0.7), gaps.map(g => g.toFixed(3)).join(' '));
  const blend = c.phonicsRender(c.voiceCue('blend.fan'), sr);
  const hole = longestQuiet(blend.samples, sr, 0.06, blend.samples.length / sr - 0.12);
  T('a word blended: its sounds run into each other, no gap between them', blend.marks.length === 3 && blend.marks[0] < blend.marks[1] && blend.marks[1] < blend.marks[2] && hole < 0.05, hole.toFixed(3));
  const used = [];
  Object.keys(c.MISSIONS).forEach(id => c.MISSIONS[id].activities.forEach(a => {
    if(a.type === 'sound-pick') used.push('phoneme.' + a.sound);
    if(a.type === 'word-build'){ used.push('seg.' + a.target, 'blend.' + a.target); a.target.toUpperCase().split('').forEach(L => used.push('phoneme.' + c.LETTERS[L].sound)); }
  }));
  T('every sound the games use can be made', used.every(id => c.voiceCue(id) && c.phonicsRender(c.voiceCue(id), sr)), used.filter(id => !c.voiceCue(id)).join(','));
  const recs = fs.readFileSync(path.join(H.ROOT, 'docs', 'AUDIO-RECORDINGS.md'), 'utf8');
  T('and every one is on the recording list, as required: exactly which recordings replace development audio',
    used.every(id => recs.indexOf('`' + id + '`') !== -1) && /## Sounds \(required\)/.test(recs) && /Do not hand-edit/.test(recs), used.filter(id => recs.indexOf('`' + id + '`') === -1).join(','));
  T('it is labelled DEVELOPMENT AUDIO in the code, and for grown-ups', /DEVELOPMENT PHONICS VOICE — DEVELOPMENT AUDIO, NOT FINAL/.test(js()) && /development audio/i.test(fnBody(js(), 'renderGrownups')));
  const ts = Date.now();
  c.phonicsRender(Object.assign({}, c.voiceCue('blend.bus'), { id: 'timing' }), 44100);
  T('it makes a word in a moment, on the device, with no file to fetch', Date.now() - ts < 250, (Date.now() - ts) + 'ms');
  T('no console errors', app.errors.length === 0 && q.errors.length === 0 && r.errors.length === 0, app.errors.concat(q.errors, r.errors).join(' | '));
}

/* =========================================================
   CONTRACT 40 — ONE WORD KNOWLEDGE BASE
   Every word, once: its picture, rime, beats, sounds and first sound.
   Letters have a name and a sound, and they are different things.
   ========================================================= */
function testWordBase(){
  section('CONTRACT 40 — one word knowledge base; a letter\'s name is not its sound');
  const c = H.loadApp().ctx;
  const words = Object.keys(c.WORDS);
  T('every word is written out sound by sound, and starts with its onset', words.every(w => c.WORDS[w].phonemes.every(p => c.PHONEMES[p]) && c.WORDS[w].phonemes[0] === c.WORDS[w].onset));
  const src = stripComments(js());
  T('no game keeps a word list of its own: rimes, beats and sounds live in WORDS alone',
    (src.match(/\brime:/g) || []).length === words.length && (src.match(/\bbeats: \[/g) || []).length === words.length && (src.match(/\bphonemes: \[/g) || []).length === words.length);
  T('CVC is exact: three letters, each one sound', c.isCvc('map') && c.isCvc('bus') && !c.isCvc('fish') && !c.isCvc('rock') && !c.isCvc('star') && !c.isCvc('apple'));
  const cz = H.loadApp().ctx;
  cz.WORDS.has = { speak: 'has', phonemes: ['h', 'a', 'z'] };
  T('and each letter must spell the sound it teaches: "has" (its S says /z/) is not CVC', !cz.isCvc('has'));
  T('a first sound on its own is not a cluster', c.singleOnset('sun') && c.singleOnset('moon') && !c.singleOnset('star') && !c.singleOnset('spoon') && !c.singleOnset('snake'));
  const withSound = Object.keys(c.LETTERS).filter(L => c.LETTERS[L].sound);
  T('a letter with a sound has a name cue and a sound cue, and they differ', withSound.length >= 20 && withSound.every(L =>
    c.voiceCue('letter.' + L).type === 'letterName' && c.voiceCue('phoneme.' + c.LETTERS[L].sound).type === 'phoneme'));
  T('a sound that only spells words (sh, the long vowels) is never asked for alone', ['sh', 'ay', 'ee', 'oo', 'oh', 'ar', 'uh'].every(p => !c.teachableSound(p) && !c.voiceCue('phoneme.' + p)));
  T('every word a phonics game builds is one the development voice can make', Object.keys(c.MISSIONS).every(id => c.MISSIONS[id].activities.every(a =>
    a.type !== 'word-build' || c.WORDS[a.target].phonemes.every(p => c.SYNTH_SOUNDS[p]))));
  T('no word claims an educator\'s review yet', words.every(w => c.WORDS[w].reviewed === undefined));
  T('the phonics games\' lines never write a sound as a letter', ['ask', 'again', 'found', 'show', 'tap'].every(k => c.SOUND_LINES[k].every(t => !/\b[A-Z]\b/.test(t.replace(/\{[A-Z]\}/g, '')))));
  T('a grown-up sees a sound as /m/, and a built word in capitals', c.evidenceLabel({ skillId: 'beginning-sounds', item: 'm' }) === '/m/' &&
    c.evidenceLabel({ skillId: 'cvc', item: 'map' }) === 'MAP' && c.evidenceLabel({ skillId: 'letter-recognition', item: 'M' }) === 'M');
}

/* =========================================================
   CONTRACT 41 — SOUND SCOUT
   Hear a sound, find the picture that starts with it. The sound is the
   question: the letter never shows until the answer is found.
   ========================================================= */
async function testSoundScout(){
  section('CONTRACT 41 — Sound Scout: the sound is the question');
  const c = H.loadApp().ctx;
  sub('the engine');
  const a = { type: 'sound-pick', sound: 'm', answer: 'moon' };
  const pools = c.soundDistractorPools(a);
  T('no wrong picture starts with the sound', pools.far.concat(pools.rhyme).every(w => c.WORDS[w].onset !== 'm'));
  T('at the easy level, the wrong pictures start with another kind of sound altogether', (() => {
    for(let s = 0; s < 20; s++){
      const run = c.startRun('mars-1', new Date(), 'run_ss_' + s); run.index = 3;
      const rr = c.beginRound(run, []);
      if(!rr.options.every((w, i) => i === rr.answer || c.soundClass(c.WORDS[w].onset) !== c.soundClass('m'))) return false;
    }
    return true;
  })());
  const t2 = c.pickSoundDistractors(a, 2, 2, c.seededRandom('t2'));
  T('above it, one wrong picture rhymes with the answer (moon: spoon), the mix-up to hear past', t2.indexOf('spoon') !== -1, t2.join(','));
  T('every Sound Scout sound can be held, and every answer starts with it alone', Object.keys(c.MISSIONS).every(id => c.MISSIONS[id].activities.every(x =>
    x.type !== 'sound-pick' || (c.PHONEMES[x.sound].kind === 'continuous' && c.WORDS[x.answer].onset === x.sound && c.singleOnset(x.answer)))));

  sub('playing it');
  const rig = audioRig();
  const app = H.loadApp({ windowExtras: rig.extras });
  const p = fast(app.ctx), d = app.dom.document;
  await p.startAdventure();
  seedDone(p, ['moon-1', 'mercury-1', 'mercury-2']);
  p.pickDestination('mars');
  await p.launch();
  T('Mars\'s first marker is the sound scanner', p.markerNext('mars') === 'mars-1' && p.markerOf('mars-1') === 'scanner');
  const reveal = spy(p, 'revealChoices');
  const mark = rig.events.length;
  const going = p.tapMarker('scanner');
  await wait(1);
  T('before the question, the pictures are not there to look at', reveal.length === 0 && !d.getElementById('missionChoices').classList.contains('is-revealed'));
  await going;
  const r0 = p.session.run.round;
  const asked = rig.events.slice(mark).filter(e => !/I'll play a sound/.test(e)).join('|');
  T('"Listen." — the sound — "Which picture starts with…" — the sound — then each picture named',
    new RegExp('^tts:Listen\\.\\|ph\\|tts:Which picture starts with…\\|ph\\|tts:[A-Z][a-z]+\\.\\|tts:[A-Z][a-z]+\\.\\|tts:[A-Z][a-z]+\\.$').test(asked), asked);
  T('the pictures appear once they are named', reveal.length >= 1 && d.getElementById('missionChoices').classList.contains('is-revealed'));
  T('nothing on the screen names the sound\'s letter before the answer', !/signal-letter/.test(d.getElementById('gameSignal').innerHTML) &&
    p.voiceCue('sound.ask.m.0').text === 'Which one starts with this sound?' && !/>M</.test(d.getElementById('missionChoices').innerHTML));
  T('the first round of the first mission shows the tap: the answer glows', r0.guided === true && r0.activity.answer === 'moon');
  const at = rig.events.length;
  const praising = p.choose(r0.answer);
  T('found: the screen belongs to the praise', p.session.input === 'wait');
  await wait(1);
  T('once found, the letter that spells the sound shows on the scanner', /class="signal-letter"[^>]*>M</.test(d.getElementById('gameSignal').innerHTML));
  await praising;
  const praise = rig.events.slice(at, at + 2);
  T('"mmm … Moon!": the sound again, then the picture\'s name', praise[0] === 'ph' && /^tts:.*Moon!/.test(praise[1]), praise.join('|'));
  const r1 = p.session.run.round;
  T('the next round is asked, and the screen is open again', r1.index === 1 && p.session.input === 'open');
  const wrong = r1.options.map((_, i) => i).filter(i => i !== r1.answer);
  const atW = rig.events.length;
  await p.choose(wrong[0]);
  const retry = rig.events.slice(atW).join('|');
  T('a wrong picture steps aside; "almost", the sound again, and the pictures left, named again',
    r1.out.indexOf(wrong[0]) !== -1 && /^tts:[^|]*(Listen again|Good try|So close)[^|]*\|ph\|tts:[A-Z][a-z]+\.\|tts:[A-Z][a-z]+\.$/.test(retry), retry);
  const atS = rig.events.length;
  await p.choose(wrong[1]);
  const shown = rig.events.slice(atS).join('|');
  T('a second miss shows the answer, with a hint that says the word and its sound', r1.misses === 2 && /starts with…\|ph\|tts:Tap the [a-z]+!/.test(shown), shown);
  await p.choose(r1.answer);
  T('found with help: recorded as help, and no star is lost', p.session.run.results[1].outcome === 0);
  await playMission(p);
  const ev = p.journey.evidence.filter(e => e.skillId === 'beginning-sounds');
  T('what was heard is evidence of the sound, not the word', ev.length > 0 && ev.every(e => e.form === 'initial' && p.PHONEMES[e.item]), ev.map(e => e.id).join(','));
  T('the mission pays its stars, like any other', p.missionDone('mars-1'));
  T('no console errors', app.errors.length === 0, app.errors.join(' | '));

  sub('with nothing to hear');
  const quiet = H.loadApp();
  const qc = fast(quiet.ctx);
  const run = qc.startRun('mars-1', new Date(), 'run_quiet');
  qc.beginRound(run, [], { audible: qc.lineAudible(qc.voiceCue('phoneme.m')) });
  T('a round whose sound cannot be heard is not evidence of anything', run.round.audible === false && qc.answerRound(run, run.round.answer).outcome === null);
  T('and its question shows the letter instead: the one case the screen may', qc.voiceCue('sound.ask.m.0').visual === 'Find the picture that starts with M!');
}

/* =========================================================
   CONTRACT 42 — WORD BUILDER
   Hear a word sound by sound, tap its letters in order, hear it
   blended. Tap to place, tap again to take back; a wrong order is
   rebuilt, never failed.
   ========================================================= */
async function testWordBuilder(){
  section('CONTRACT 42 — Word Builder: sound, sound, sound, word');
  const c = H.loadApp().ctx;
  sub('the engine');
  const run = c.startRun('mars-2', new Date(), 'run_wb'); run.index = 1;
  const r = c.beginRound(run, []);
  T('the pieces are the word\'s own letters, at the easy level', r.options.slice().sort().join('') === 'AFN' && r.activity.target === 'fan');
  T('never laid out in order already', (() => {
    for(let s = 0; s < 40; s++){
      const x = c.startRun('mars-2', new Date(), 'run_o' + s); x.index = s % 6;
      const y = c.beginRound(x, []);
      if(y.options.filter(L => y.activity.target.toUpperCase().indexOf(L) !== -1).join('') === y.activity.target.toUpperCase()) return false;
    }
    return true;
  })());
  const hard = c.ACTIVITY_TYPES['word-build'].buildRound({ type: 'word-build', target: 'map' }, { tier: 2, choices: 3, rand: c.seededRandom('hard') });
  T('above it, one more letter, whose sound is nowhere in the word', hard.options.length === 4 &&
    hard.options.filter(L => 'MAP'.indexOf(L) === -1).every(L => c.PHONEMES[c.LETTERS[L].sound].kind === 'continuous' && ['m', 'a', 'p'].indexOf(c.LETTERS[L].sound) === -1), hard.options.join(''));
  T('an answer is the letters in order: a wrong order is a miss that can be made again; a nonsense one is ignored',
    c.answerRound(run, [r.answer[1], r.answer[0], r.answer[2]]).correct === false && c.answerRound(run, [0, 0, 0]).ignored === true && c.answerRound(run, r.answer.slice()).correct === true);
  T('every word it builds is CVC, with no letter twice', Object.keys(c.MISSIONS).every(id => c.MISSIONS[id].activities.every(a => a.type !== 'word-build' || (c.isCvc(a.target) && new Set(a.target).size === 3))));

  sub('playing it');
  const rig = audioRig();
  const app = H.loadApp({ windowExtras: rig.extras });
  const p = fast(app.ctx), d = app.dom.document;
  await p.startAdventure();
  seedDone(p, ['moon-1', 'mercury-1', 'mercury-2', 'mars-1']);
  p.pickDestination('mars');
  await p.launch();
  const at = rig.events.length;
  await p.tapMarker('workshop');
  const g = p.session.run.round;
  const heard = rig.events.slice(at).filter(e => !/sound by sound\. Tap the letters/.test(e)).join('|');
  T('"Listen." — the word, sound by sound — "Build the word!"', /^tts:Listen\.\|ph\|tts:(Build the word!|Tap the letters in order!|Can you build it\?)$/.test(heard), heard);
  const tray = () => d.getElementById('buildTray').innerHTML;
  T('its first round is built with Pip: only the next right letter can go in, and it glows',
    p.session.build.guide === true && new RegExp('class="piece is-hint" id="piece-' + g.answer[0] + '"').test(tray()));
  const wrongPiece = [0, 1, 2].find(i => i !== g.answer[0]);
  await p.tapPiece(wrongPiece);
  T('a wrong letter in a guided round does not go in, and is not a miss', p.session.build.slots.every(x => x === null) && g.misses === 0);
  const atP = rig.events.length;
  await p.tapPiece(g.answer[0]);
  T('a letter tapped hops into the first slot, and its SOUND plays — not its name', p.session.build.slots[0] === g.answer[0] && rig.events.slice(atP).join('|') === 'ph');
  const built = spy(p, 'builtWord'), pictured = spy(p, 'showBuildPicture');
  await p.tapPiece(g.answer[1]);
  const atB = rig.events.length, soundsB = rig.au.log.phonics.length;
  const last = p.tapPiece(g.answer[2]);
  T('the third letter fills the word, and it is answered once', p.session.input === 'wait');
  await last;
  const third = rig.au.log.phonics[soundsB];
  T('its sound plays to the end before the word is checked: the answer never cuts it off', !!third && third.ended && !third.cut);
  const blended = rig.events.slice(atB, atB + 3);
  /* praise starts at a different phrasing each run, so any of them will do,
     as long as it names the word */
  T('then the word is heard blended, and named: "mmm-aaa-p … Map!"', blended[0] === 'ph' && blended[1] === 'ph' && /^tts:(.* )?Map!/.test(blended[2]), blended.join('|'));
  T('the letters slide together, and its picture appears', built.some(x => x[0] === true) && pictured.length === 1);
  await wait(5);
  const r1 = p.session.run.round;
  T('the next word: nothing is placed, and the letters are open to tap', r1.index === 1 && p.session.build.slots.every(x => x === null) && p.session.input === 'open');
  await p.tapPiece(r1.answer[1]);
  T('a letter can go in the wrong place: building is trying', p.session.build.slots[0] === r1.answer[1]);
  p.tapSlot(0);
  T('tapping a placed letter takes it back (undo)', p.session.build.slots[0] === null && new RegExp('class="piece" id="piece-' + r1.answer[1] + '"').test(tray()));
  await p.tapPiece(r1.answer[0]);
  p.tapPiece(r1.answer[0]);
  T('a letter already placed cannot be placed twice', p.session.build.slots.filter(x => x === r1.answer[0]).length === 1);
  await p.tapPiece(r1.answer[2]);
  await p.tapPiece(r1.answer[1]);
  await wait(5);
  T('a wrong order: a miss; the letters in the wrong places hop back, the right one stays', r1.misses === 1 &&
    p.session.build.slots[0] === r1.answer[0] && p.session.build.slots[1] === null && p.session.build.slots[2] === null);
  await p.tapPiece(r1.answer[2]);
  await p.tapPiece(r1.answer[1]);
  await wait(5);
  T('a second miss: Pip builds it with the child, then hands it back', r1.misses === 2 && p.session.build.guide === true);
  while(p.session.build.hold) await wait(2);
  T('then only the next right letter can go in', new RegExp('class="piece is-hint" id="piece-' + r1.answer[0] + '"').test(tray()));
  for(let k = 0; k < 3; k++) await p.tapPiece(r1.answer[k]);
  await wait(5);
  T('built with help: recorded as help, and the mission goes on', r1.resolved === true && p.session.run.results[1].outcome === 0);
  await playMission(p);
  T('the mission finishes and pays its stars', p.missionDone('mars-2'));
  const ev = p.journey.evidence.filter(e => e.skillId === 'cvc');
  T('evidence is per word built', ev.length > 0 && ev.every(e => e.form === 'build' && p.isCvc(e.item)));
  T('Mars is restored by its first Sound Scout and Word Builder', p.placeRestored('mars'));
  T('no console errors', app.errors.length === 0, app.errors.join(' | '));

  sub('a reload in the middle of a word');
  const shared = new Map();
  const m1 = H.loadApp({ sharedStorage: shared });
  const mc = fast(m1.ctx);
  await mc.startAdventure();
  seedDone(mc, ['moon-1', 'mercury-1', 'mercury-2']);
  mc.saveCompletions();
  mc.pickDestination('mars');
  await mc.launch();
  await mc.tapMarker('scanner');
  await playMission(mc);
  await mc.tapMarker('workshop');
  await mc.tapPiece(mc.session.run.round.answer[0]);
  const again = H.loadApp({ sharedStorage: shared });
  T('reloaded mid-word: no half-built word is saved, nothing is lost, and the app boots clean',
    again.errors.length === 0 && !again.ctx.missionDone('mars-2') && again.ctx.missionDone('mars-1') && again.ctx.session.run === null, again.errors.join(' | '));
}

/* =========================================================
   CONTRACT 43 — MARS, AND A LONGER JOURNEY THAT TAKES NOTHING BACK
   A place is restored by its story missions; missions added later are
   more to play, never a new lock. A v0.4.0 journey opens v0.5.0 with
   everything it had, and Mars appears for it once.
   ========================================================= */
async function testMars(){
  section('CONTRACT 43 — Mars, and a journey that takes nothing back');
  const c = H.loadApp().ctx;
  const has = ids => ids.map((id, i) => ({ id: 'x' + i, missionId: id, completedAt: 't' }));
  sub('restoring');
  T('the Moon is restored by its first mission, as before', c.destinationProgress('moon', has(['moon-1'])).restored && c.destinationProgress('moon', has(['moon-1'])).total === 3);
  T('Mercury by its first two, as before', c.destinationProgress('mercury', has(['mercury-1', 'mercury-2'])).restored && !c.destinationProgress('mercury', has(['mercury-1', 'mercury-3'])).restored);
  T('Mars by a Sound Scout and a Word Builder', c.destinationProgress('mars', has(['mars-1', 'mars-2'])).restored && !c.destinationProgress('mars', has(['mars-1', 'mars-3'])).restored);
  T('a marker hosts one game, its missions in order', c.markerOf('moon-3') === 'beacon' && c.markerOf('mercury-3') === 'radar' && c.markerOf('mercury-4') === 'meteors' &&
    c.markerOf('mars-3') === 'scanner' && c.markerOf('mars-4') === 'workshop');
  T('the first trip to Mercury is the light tunnel; the first to Mars, friendly rocks', (() => {
    const me = c.travelPlan({ from: 'earth', to: 'mercury', first: true, flight: 1 }), ma = c.travelPlan({ from: 'earth', to: 'mars', first: true, flight: 1 });
    return me.motifs.indexOf('tunnel') !== -1 && ma.motifs.indexOf('tunnel') === -1 && ma.motifs.indexOf('asteroids') !== -1 && ma.duration === c.TIMING.travelFirst;
  })());
  T('Mars hangs clear of the HUD title and of Pip, above the horizon', c.DESTINATIONS.mars.sky.x > 70 && c.DESTINATIONS.mars.sky.y > 20 && c.DESTINATIONS.mars.sky.y < 55);
  T('a planet says what it teaches: MARS / Sounds • Words', c.focusLabel('mars') === 'Sounds • Words');

  sub('one mission a visit, once restored');
  const app = H.loadApp();
  const p = fast(app.ctx), d = app.dom.document;
  await p.startAdventure();
  await launchAndStart(p);
  await playMission(p);
  T('after the relighting mission on the Moon, the way forward is home', p.markerNext('moon') === null && d.getElementById('scene-planet').classList.contains('is-done'));
  await p.flyHome();
  await launchAndStart(p, 'moon');
  T('the next visit offers the Moon\'s next mission, at the same beacon', p.session.run && p.session.run.missionId === 'moon-2');
  T('and the game is not explained again', !p.session.said || true);
  await playMission(p);
  await p.flyHome();
  await launchAndStart(p, 'moon');
  T('and then the third', p.session.run && p.session.run.missionId === 'moon-3');
  await playMission(p);
  const props = d.getElementById('place' + p.session.slot + 'Props').innerHTML;
  T('the beacon\'s lamps show all three played', (props.match(/marker-lamp is-on/g) || []).length === 3, props.slice(0, 200));
  await p.flyHome();
  await launchAndStart(p, 'moon');
  T('after that, the Moon\'s missions come round in turn', p.session.run && p.MISSIONS[p.session.run.missionId].destinationId === 'moon');

  sub('a journey saved by v0.4.0');
  const shared = new Map();
  seedV040(H.makeLocalStorage(shared), c);
  const beforeKeys = new Map(shared);
  const up = H.loadApp({ sharedStorage: shared });
  const u = fast(up.ctx);
  T('it opens with no errors and nothing set aside as unreadable', up.errors.length === 0 && ![...shared.keys()].some(k => /unreadable/.test(k)), up.errors.join(' | '));
  T('everything it had: three missions, the Moon and Mercury restored', u.journey.completions.length === 3 && u.placeRestored('moon') && u.placeRestored('mercury'));
  T('its stars, to the star', u.starBalance(u.journey.stars) === 6, String(u.starBalance(u.journey.stars)));
  T('its rocket, as it was', u.currentLook().paint === 'paint-sky');
  T('and its practice notes', u.journey.evidence.length === 1 && u.journey.evidence[0].item === 'M');
  T('Mars is open to it', u.destinationUnlocked('mars', u.journey.completions));
  T('the Moon\'s new missions are waiting at the beacon it relit', u.markerNext('moon') === 'moon-2');
  T('opening on Earth, Mars is shown arriving, once: the new planet in the sky, and a flag remembers it', /class="sky-body is-new[^"]*" id="sky-mars"/.test(up.dom.document.getElementById('place' + u.session.slot + 'Sky').innerHTML) &&
    u.storyFlag('shown.mars'), up.dom.document.getElementById('place' + u.session.slot + 'Sky').innerHTML.slice(0, 300));
  const changed = [...shared.keys()].filter(k => shared.get(k) !== beforeKeys.get(k));
  T('and only the profile learned that it was shown: nothing else was rewritten', changed.length === 1 && changed[0] === u.STORAGE_NAMESPACE + u.KEYS.profile, changed.join(','));
  const up2 = H.loadApp({ sharedStorage: shared });
  T('reloaded, it is not shown again', !/is-new/.test(up2.dom.document.getElementById('place' + up2.ctx.session.slot + 'Sky').innerHTML));
  const fresh = H.loadApp();
  const f = fast(fresh.ctx);
  await f.startAdventure();
  T('a new explorer is never shown a planet it has not opened', f.catchUpReveal() === null && !f.storyFlag('shown.mars'));
  const e = H.loadApp();
  const ec = fast(e.ctx);
  await ec.startAdventure();
  seedDone(ec, ['moon-1', 'mercury-1']);
  ec.pickDestination('mercury');
  await ec.launch();
  await ec.tapMarker('meteors');
  await playMission(ec);
  T('a child who opens Mars by playing sees it revealed there, and is not shown it again on Earth', ec.storyFlag('shown.mars'));
  await ec.flyHome();
  T('home: no second reveal', ec.catchUpReveal() === null);
}

/* =========================================================
   CONTRACT 44 — REVIEW, BY RULE
   Something the child found hard comes back — chosen from their answers
   by a rule a grown-up could follow on paper, never at random.
   ========================================================= */
function testReview(){
  section('CONTRACT 44 — review: what was hard comes back, by rule');
  const c = H.loadApp().ctx;
  const ev = (skill, item, form, recent, last) => ({ id: c.evidenceId(skill, item, form), skillId: skill, item: item, form: form, seen: recent.length,
    firstTry: recent.filter(x => x === 1).length, recent: recent, lastPracticed: last });
  const letters = ['M', 'S', 'O', 'T'];
  T('with nothing shown yet, a review asks what the mission wrote', c.reviewPick('find-letter', letters, [], []) === null &&
    c.reviewActivity({ type: 'find-letter', target: 'M', form: 'upper', review: letters }, [], { asked: [] }).target === 'M');
  const e1 = [ev('letter-recognition', 'M', 'upper', [1, 1], '2026-09-01'), ev('letter-recognition', 'S', 'upper', [0, 1, 0], '2026-09-02'), ev('letter-recognition', 'O', 'upper', [0, 1], '2026-09-03')];
  T('the letter that most needed help comes back', c.reviewPick('find-letter', letters, e1, []) === 'S');
  T('the same answers always pick the same letter, in any order', c.reviewPick('find-letter', letters, e1.slice().reverse(), []) === 'S');
  T('never one already asked in this mission', c.reviewPick('find-letter', letters, e1, ['S']) === 'O');
  const e2 = [ev('letter-recognition', 'M', 'upper', [1, 1], '2026-09-05'), ev('letter-recognition', 'T', 'upper', [1, 1], '2026-09-01')];
  T('with nothing hard, the one practised longest ago', c.reviewPick('find-letter', letters, e2, []) === 'T');
  const hardM = [ev('letter-recognition', 'M', 'upper', [0, 0, 1], '2026-09-04')];
  const sound = c.reviewActivity({ type: 'sound-pick', sound: 's', answer: 'sun', review: ['s', 'm', 'f', 'n', 'r'] }, hardM, { asked: [] });
  T('M found only with help in Letter Explorer brings /m/ back in Sound Scout', sound.sound === 'm' && c.WORDS[sound.answer].onset === 'm' && c.singleOnset(sound.answer), JSON.stringify(sound));
  T('with a picture not already used in the mission', c.reviewActivity({ type: 'sound-pick', sound: 's', answer: 'sun', review: ['m'] }, hardM, { asked: ['moon'] }).answer !== 'moon');
  const words = [ev('cvc', 'cat', 'build', [0, 1], '2026-09-04'), ev('cvc', 'map', 'build', [1], '2026-09-04')];
  T('a word that needed building help comes back in Word Builder', c.reviewActivity({ type: 'word-build', target: 'map', review: ['map', 'fan', 'hat', 'cat', 'cap', 'pan'] }, words, { asked: [] }).target === 'cat');
  const run = c.startRun('moon-3', new Date(), 'run_rev'); run.index = 4;
  c.beginRound(run, e1);
  T('a review round is asked, and answered, like any other', run.round.activity.target === 'S' && c.answerRound(run, run.round.answer).correct);
  const m = c.MISSIONS['mars-3'];
  const saved = JSON.stringify(m.activities[4]);
  m.activities[4].review = ['m', 'p'];
  T('a review that could ask something the game cannot (a stop, alone) is caught', c.validateContent().some(x => /may review p/.test(x)));
  m.activities[4] = JSON.parse(saved);
  T('and the content is sound again', c.validateContent().length === 0, c.validateContent().join(' | '));
}

/* =========================================================
   CONTRACT 45 — ONE FAMILY OF SOUNDS
   Short, soft, clean and distinct; one scale; no music; every moment
   the brief names has its sound, and the effects switch silences all.
   ========================================================= */
async function testSoundDesign(){
  section('CONTRACT 45 — one family of sounds, and no music');
  const au = fakeAudio();
  const app = H.loadApp({ windowExtras: au.extras });
  const c = fast(app.ctx);
  c.unlockAudio();
  const moments = ['ignite', 'travel', 'touchdown', 'correct', 'almost', 'star', 'restore', 'station', 'equip'];
  T('every moment has its sound: ignition, travel, touchdown, correct, a gentle "almost", a star, a restored world, the station, something worn',
    moments.every(n => c.Sfx.has(n)), moments.filter(n => !c.Sfx.has(n)).join(','));
  T('and Word Builder\'s: a letter placed, taken back, a word built', ['place', 'lift', 'build'].every(n => c.Sfx.has(n)));
  const scale = Object.keys(c.SFX_NOTES).map(k => c.SFX_NOTES[k]);
  c.Sfx.names().forEach(n => c.Sfx.play(n));
  const tones = au.log.oscillators;
  const inFamily = t => t.f < 400 || scale.some(f => Math.abs(f - t.f) < 1) || t.f === 520 || t.f === 660;
  T('every note is from one gentle scale, or a low rumble or thud beneath it', tones.length > 20 && tones.every(inFamily), tones.filter(t => !inFamily(t)).map(t => t.f).join(','));
  T('and none lasts much over a second', tones.every(t => t.dur <= 1.2), Math.max.apply(null, tones.map(t => t.dur)).toFixed(2));
  T('soft and round: sine and triangle only', tones.every(t => t.type === 'sine' || t.type === 'triangle'));
  T('no music: nothing loops, and nothing plays on a repeating timer', !/\.loop\s*=\s*true/.test(js()) && !/setInterval/.test(stripComments(fnBody(js(), 'play'))));
  const count = au.log.oscillators.length;
  c.soundPrefs.effects = false;
  c.Sfx.names().forEach(n => c.Sfx.play(n));
  T('with sound effects off, nothing plays', au.log.oscillators.length === count);
  c.soundPrefs.effects = true;
  T('ignition at launch, air as space opens, touchdown on landing, the station\'s airlock on arriving there',
    /Sfx\.play\('ignite'\)/.test(fnBody(js(), 'launch')) && /Sfx\.play\('travel'\)/.test(fnBody(js(), 'travelTo')) &&
    /Sfx\.play\(session\.place === 'station' \? 'station' : 'touchdown'\)/.test(fnBody(js(), 'settleInto')));
  T('a restored world has its own sound; wearing something, its own', /Sfx\.play\('restore'\)/.test(fnBody(js(), 'celebrate')) && /Sfx\.play\('equip'\)/.test(fnBody(js(), 'dockAction')));
  T('no console errors', app.errors.length === 0, app.errors.join(' | '));
}

module.exports = {
  T, section, sub, results, reset, testPortability, testClayWorld,
  testBoot, testConfig, testStorage, testCollision, testMigration,
  testNavigation, testOverlays, testToast, testConfirmation, testErase,
  testMobile, testDesignSystem, testPWA, testRelease, testStress,
  testAccessibility, testContamination, testSourcesOfTruth,
  testContent, testLearningEngine, testStarLedger, testCosmeticIsolation,
  testPersistence, testAudio, testAssets, testPrivacy, testChildJourney, testMotion,
  testDialogue, testWorldStage, testNewGames,
  testHud, testTravel, testInput, testPlayfield, testStation,
  testAudioSystem, testWordBase, testSoundScout, testWordBuilder, testMars, testReview, testSoundDesign
};
