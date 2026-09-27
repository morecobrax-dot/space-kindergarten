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
    relight: 0, beatPause: 0, beatSettle: 0, beatBounce: 0,
    writeDemo: 0, writeDemoGap: 0, writeHint: 0
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
    if(r.activity.type === 'letter-trace'){
      await traceLetter(c, wrongNow);
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
/* Traces the letter on the slate, stroke by stroke along its own path, in
   letter units, the way a finger would: down at the start, along, up. A
   wandering trace first strays far off the first stroke once (that stroke
   restarts, and the letter counts as helped). */
async function traceLetter(c, wander){
  const w = c.session.write;
  if(!w || !w.plan){ await wait(2); return; }
  if(wander && !w.plan[0].dot){
    const p0 = w.plan[0].pts[0];
    c.writeDown(p0);
    c.writeMove([p0[0] + 0.9, p0[1] + 0.2]);
    c.writeUp();
  }
  for(let i = w.t.stroke; i < w.plan.length && !w.t.done && c.session.write === w; i++){
    const s = w.plan[i];
    c.writeDown(s.pts[0]);
    for(let k = 2; k < s.pts.length; k += 2) c.writeMove(s.pts[k]);
    if(!s.dot) c.writeMove(s.pts[s.pts.length - 1]);
    c.writeUp();
  }
  await wait(2);
}
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
  T('a failed registration cannot break boot', /register\('sw\.js'\)[\s\S]{0,600}\.catch\(\(\) => \{\}\)/.test(fnBody(js(), 'startUpdates')));
  T('the shell is network-first, so a deploy is picked up promptly',
    /fetch\(req\)[\s\S]{0,900}\.catch\(\(\) => caches\.match\(req\)/.test(sw));
  T('index.html is the offline fallback', /caches\.match\('\.\/index\.html'\)/.test(sw));
  T('cross-origin requests are left alone',
    /new URL\(req\.url\)\.origin !== location\.origin/.test(sw));
  T('non-GET requests are left alone', /req\.method !== 'GET'/.test(sw));
  T('a new version never takes over by itself: it waits for the app (contract 56 plays it)', !/skipWaiting/.test(sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"))));
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
  /* The starter's own list once came along with it. This product's history
     starts at its own first flight, and every entry is a later release of it:
     versions strictly descend to 0.1.0, so nothing older can hide below. */
  const semver = v => v.split('.').map(Number);
  const newer = (a, b) => { const x = semver(a), y = semver(b); for(let i = 0; i < 3; i++){ if(x[i] !== y[i]) return x[i] > y[i]; } return false; };
  T('this product\'s own releases, not an inherited list: they end at its first flight',
    c.APP_UPDATES[c.APP_UPDATES.length - 1].id === 'v0-1-0', c.APP_UPDATES[c.APP_UPDATES.length - 1].id);
  T('and each entry is a newer release than the one below it',
    c.APP_UPDATES.every((u, i) => i === c.APP_UPDATES.length - 1 || newer(u.version, c.APP_UPDATES[i + 1].version)),
    c.APP_UPDATES.map(u => u.version).join(' > '));
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
  const games = new Set(played.map(id => c.MISSIONS[id].activities[0].type)), worlds = new Set(played.map(id => c.MISSIONS[id].destinationId));
  T('every world and every game on the journey came round', c.JOURNEY_ORDER.every(d => worlds.has(d)) &&
    Object.keys(c.ACTIVITY_TYPES).every(g => games.has(g)), [...new Set(played)].join(','));
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
  c.LETTERS.I.ambiguous = true;
  m.activities.push({ type: 'find-letter', target: 'I', form: 'upper' });
  T('a letter marked ambiguous is caught (none is, in the school print)', c.validateContent().some(p => /cannot be told apart/.test(p)));
  m.activities.pop();
  delete c.LETTERS.I.ambiguous;
  m.activities.push({ type: 'find-letter', target: 'M', form: 'middle' });
  T('a letter case that does not exist is caught', c.validateContent().some(p => /big \(upper\) or little \(lower\)/.test(p)));
  m.activities.pop();
  m.activities.push({ type: 'find-letter', target: 'b', form: 'lower' });
  T('lowercase is caught while only uppercase is taught', c.validateContent().some(p => /uppercase/.test(p) || /unknown letter/.test(p)));
  m.activities.pop();
  m.activities.push({ type: 'trace-letter', target: 'M', form: 'upper' });
  T('an activity type nobody built is caught', c.validateContent().some(p => /unknown type/.test(p)));
  m.activities.pop();
  c.SKILLS.spelling = { label: 'Spelling', short: 'Spelling', status: 'planned' };
  const oldSkill = m.skillId; m.skillId = 'spelling';
  T('a mission for a skill that is only planned is caught', c.validateContent().some(p => /not built/.test(p)));
  m.skillId = oldSkill;
  delete c.SKILLS.spelling;
  const oldChoices = m.choices; m.choices = 7;
  T('too many choices for a kindergartener is caught', c.validateContent().some(p => /choices/.test(p)));
  m.choices = oldChoices;
  T('the mission is back to sound', JSON.stringify(m) === saved && c.validateContent().length === 0);

  sub('the journey: letters and writing on the Moon, then Mercury, Mars and Jupiter');
  const ids = Object.keys(c.MISSIONS);
  const by = sk => ids.filter(id => c.MISSIONS[id].skillId === sk).sort().join();
  T('letters and writing on the Moon, rhymes and beats on Mercury, sounds and words on Mars, sight words on Jupiter: 2 to 5 missions a game',
    ids.length === 20 && by('letter-recognition') === 'moon-1,moon-2,moon-3,moon-4,moon-5' && by('handwriting') === 'writer-1,writer-2,writer-3' &&
    by('rhyming') === 'mercury-1,mercury-3' && by('syllables') === 'mercury-2,mercury-4' && by('beginning-sounds') === 'mars-1,mars-3' &&
    by('cvc') === 'mars-2,mars-4' && by('sight-words') === 'jupiter-1,jupiter-2,jupiter-3,jupiter-4', ids.join(','));
  T('each holds 5 to 8 interactions', ids.every(id => c.MISSIONS[id].activities.length >= 5 && c.MISSIONS[id].activities.length <= 8));
  const moonOrder = c.DESTINATIONS.moon.missions;
  const littleAt = moonOrder.filter(id => c.MISSIONS[id].activities.some(a => a.form === 'lower'));
  T('big letters come first: every little-letter mission comes after the big-letter ones on the Moon',
    littleAt.every(id => ['moon-1', 'moon-2', 'moon-3'].every(big => moonOrder.indexOf(big) < moonOrder.indexOf(id))), littleAt.join(','));
  T('and little letters are written after they are found', moonOrder.indexOf('writer-3') > moonOrder.indexOf('moon-4'));
  /* the first mission of each task (its howTo, in journey order) teaches
     it in its first round; after that no round is guided — except Moon
     Writer, where every letter is first written with its whole path shown */
  const firstOfTask = {};
  c.JOURNEY_ORDER.forEach(d => c.DESTINATIONS[d].missions.forEach(id => { const h = c.MISSIONS[id].howTo; if(!firstOfTask[h]) firstOfTask[h] = id; }));
  T('each task\'s first mission guides its first round, and no other round is guided but a trace shown whole', ids.every(id => {
    const acts = c.MISSIONS[id].activities;
    if(acts[0].type === 'letter-trace') return acts.every(a => !!a.guided === (a.help === 'full'));
    return firstOfTask[c.MISSIONS[id].howTo] === id ? acts[0].guided === true && acts.filter(a => a.guided).length === 1 : acts.every(a => !a.guided);
  }), JSON.stringify(firstOfTask));
  T('all seven learning areas are named, and all seven are built',
    Object.keys(c.SKILLS).length === 7 && Object.keys(c.SKILLS).every(k => c.SKILLS[k].status === 'active'));
  T('the journey is the Moon, Mercury, Mars, then Jupiter', c.JOURNEY_ORDER.join() === 'moon,mercury,mars,jupiter');
  T('Jupiter opens only when Mars is full of sounds again', c.DESTINATIONS.jupiter.unlock && c.DESTINATIONS.jupiter.unlock.after === 'mars' &&
    !c.destinationUnlocked('jupiter', [{ id: 'x', missionId: 'mars-1', completedAt: 't' }]) &&
    c.destinationUnlocked('jupiter', ['mars-1', 'mars-2'].map(id => ({ id: id, missionId: id, completedAt: 't' }))));
  T('Mercury opens only when the Moon shines', c.DESTINATIONS.mercury.unlock && c.DESTINATIONS.mercury.unlock.after === 'moon' &&
    !c.destinationUnlocked('mercury', []) && c.destinationUnlocked('mercury', [{ id: 'x', missionId: 'moon-1', completedAt: 't' }]));
  T('Mars opens only when Mercury\'s signal is clear', c.DESTINATIONS.mars.unlock && c.DESTINATIONS.mars.unlock.after === 'mercury' &&
    !c.destinationUnlocked('mars', [{ id: 'x', missionId: 'mercury-1', completedAt: 't' }]) &&
    c.destinationUnlocked('mars', ['mercury-1', 'mercury-2'].map(id => ({ id: id, missionId: id, completedAt: 't' }))));
  const planned = Object.keys(c.DESTINATIONS).filter(id => c.DESTINATIONS[id].kind === 'planned');
  T('the rest of the route is declared, and pretends to nothing: no pictures, no missions, never drawn',
    planned.length >= 3 && planned.every(id => !c.DESTINATIONS[id].asset && !(c.DESTINATIONS[id].missions || []).length &&
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
  const sum = list => list.reduce((s, a) => s + sizes[a.id], 0);
  const core = reg.filter(a => a.load === 'core');
  T('the pictures the offline cache installs are under 1.2 MB, so installing stays quick', sum(core) < 1.2 * 1024 * 1024, Math.round(sum(core) / 1024) + 'KB');
  const worlds = [...new Set(reg.map(a => c.assetWorld(a)).filter(Boolean))];
  T('a world added later carries its own budget: under 300 KB each', worlds.length >= 1 &&
    worlds.every(w => sum(reg.filter(a => c.assetWorld(a) === w)) < 300 * 1024), worlds.map(w => w + ' ' + Math.round(sum(reg.filter(a => c.assetWorld(a) === w)) / 1024) + 'KB').join(', '));
  T('every picture is in the core, installed only with the app, or waits for a world on the journey',
    reg.every(a => c.ASSET_LOADS.indexOf(a.load) !== -1 || c.JOURNEY_ORDER.indexOf(a.load) !== -1));
  T('the Home Screen icons are the only pictures fetched at install and never by the page', reg.filter(a => a.load === 'install').every(a => /^icon-\d+\.png$/.test(a.path)) &&
    reg.filter(a => /^icon-/.test(a.path)).every(a => a.load === 'install'));
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
  T('the service worker precaches every core picture', reg.filter(a => a.load === 'core').every(a => sw.indexOf("'./" + a.path + "'") !== -1));
  T('and nothing that waits: not the icons, not a world that is not yet near', reg.filter(a => a.load !== 'core').every(a => sw.indexOf("'./" + a.path + "'") === -1));
  T('the precache list config:sync writes holds the core pictures and nothing that waits', (() => {
    const list = require('../scripts/config.js').precacheList({ registry: reg });
    return reg.filter(a => a.load === 'core').every(a => list.indexOf('./' + a.path) !== -1) &&
      reg.filter(a => a.load !== 'core').every(a => list.indexOf('./' + a.path) === -1);
  })());
  T('an update carries a world\'s pictures, fetched when it came near, into the new cache before the old one goes',
    /function carryPictures\(older\)/.test(sw) && /carryPictures\(older\)\.then\(\(\) => Promise\.all\(older\.map\(k => caches\.delete\(k\)\)\)\)/.test(sw) &&
    /!PRECACHED\.has\(req\.url\) && new URL\(req\.url\)\.pathname\.indexOf\('\/assets\/'\) !== -1/.test(sw));
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
  T('the visit that restores the Moon shows its other game too: the writing slate is next, and Pip points at it',
    !d.getElementById('scene-planet').classList.contains('is-done') && c.markerNext('moon') === 'writer-1' && lines.some(s => /writing slate/.test(s)));

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
  seedDone(t, ['writer-1', 'moon-2', 'moon-3', 'writer-2', 'moon-4', 'moon-5', 'writer-3']);
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
  T('and is recorded as its own run', t.journey.completions.filter(x => x.missionId === 'moon-1').length === 2);

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
  T('no completion is recorded for it', t.journey.completions.filter(x => !/^seed_/.test(x.id)).length === 2);
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
  /* the Moon's other missions done, so its four visits are big letters:
     moon-1 to moon-3, then moon-1 again */
  seedDone(c, ['writer-1', 'writer-2', 'writer-3', 'moon-4', 'moon-5']);
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
  T('a child who waits on a planet is shown the marker to tap', nudge.length === 1 &&
    nudge[0] === line(c.DESTINATIONS.moon.markers[c.markerOf(c.markerNext('moon'))].call), nudge.join(' / '));
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
  c.pickDestination('moon');
  await c.launch();
  await c.startMission('moon-2');
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
    /'<span class="choice-face" aria-hidden="true"><span class="choice-glyph" data-letter="' \+ inCase\(L, a\.form\) \+ '">' \+ printSvg\(/.test(js()));
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
  T('every stage picture near the journey is fetched and decoded ahead of a flight', /\^\(horizon\|planet\|bg\|prop\|rocket\|character\|place\)\\\./.test(fnBody(js(), 'stageAssets')) &&
    /img\.decode\(\)/.test(fnBody(js(), 'preloadStage')) && /stageAssets\(journey\.completions\)/.test(fnBody(js(), 'preloadStage')));

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
                  pumpkin: 2, umbrella: 3, cupcake: 2,
                  the: 1, and: 1, see: 1, you: 1, to: 1, go: 1, is: 1, it: 1, in: 1, can: 1, we: 1, my: 1 };
  T('every word has a checked beat count', Object.keys(c.WORDS).every(w => BEATS[w] === c.WORDS[w].beats.length),
    Object.keys(c.WORDS).filter(w => BEATS[w] !== c.WORDS[w].beats.length).join(','));
  const PAIRS = [['cake', 'snake'], ['bee', 'tree'], ['rock', 'sock'], ['moon', 'spoon'], ['star', 'car'],
                 ['cat', 'hat'], ['map', 'cap'], ['fan', 'pan'], ['bug', 'rug'], ['sock', 'rock']];
  T('every rhyme asked for is one of the checked pairs', rhymes.every(a => PAIRS.some(p => p[0] === a.target && p[1] === a.answer)));
  T('and every checked pair rhymes in the data', PAIRS.every(p => c.WORDS[p[0]].rime === c.WORDS[p[1]].rime));
  const review = fs.readFileSync(path.join(H.ROOT, 'docs', 'CONTENT-REVIEW.md'), 'utf8');
  T('CONTENT-REVIEW.md lists every rhyme pair', PAIRS.every(p => new RegExp(p[0] + '\\s*/\\s*' + p[1], 'i').test(review)),
    PAIRS.filter(p => !new RegExp(p[0] + '\\s*/\\s*' + p[1], 'i').test(review)).map(p => p.join('/')).join(','));
  T('and every picture word\'s beat count', Object.keys(BEATS).filter(c.hasPicture).every(w => new RegExp('\\b' + w + '\\b[^\\n]*\\b' + BEATS[w] + '\\b', 'i').test(review)),
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
  T('a planet names itself and what it teaches, with the way home', !hud().hidden && hud().left === 'home' && hud().title === 'Moon' && hud().sub === 'Letters • Writing' && /Earth/.test(hud().back));
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
  T('back on the planet after the mission, the planet\'s own title returns', hud().title === 'Moon' && hud().sub === 'Letters • Writing');
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
  T('what a place teaches is derived from its missions\' skills', c.destinationFocus('moon').join() === 'Letters,Writing' && c.destinationFocus('mercury').join() === 'Rhymes,Beats' &&
    c.destinationFocus('jupiter').join() === 'Sight words');
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
  T('each planet in the sky carries its label, ready to be shown', /class="sky-label-name">Moon</.test(sky()) && /class="sky-label-focus">Letters • Writing</.test(sky()) &&
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
  T('once found, the letter that spells the sound shows on the scanner', /class="signal-letter"[^>]*data-letter="M"/.test(d.getElementById('gameSignal').innerHTML));
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
  T('the Moon is restored by its first mission, as before', c.destinationProgress('moon', has(['moon-1'])).restored && c.destinationProgress('moon', has(['moon-1'])).total === 8);
  T('Jupiter by a Star Words and a Word Orbit', c.destinationProgress('jupiter', has(['jupiter-1', 'jupiter-2'])).restored && !c.destinationProgress('jupiter', has(['jupiter-1', 'jupiter-3'])).restored);
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
  T('after the relighting mission, the same visit shows the Moon\'s other game: the writing slate', p.markerNext('moon') === 'writer-1' &&
    !d.getElementById('scene-planet').classList.contains('is-done'));
  await p.tapMarker('slate');
  await playMission(p);
  T('with both games met, the way forward is home', p.markerNext('moon') === null && d.getElementById('scene-planet').classList.contains('is-done'));
  await p.flyHome();
  await launchAndStart(p, 'moon');
  T('the next visit offers the Moon\'s next mission, at the beacon', p.session.run && p.session.run.missionId === 'moon-2');
  await playMission(p);
  await p.flyHome();
  await launchAndStart(p, 'moon');
  T('and then the third', p.session.run && p.session.run.missionId === 'moon-3');
  await playMission(p);
  const props = d.getElementById('place' + p.session.slot + 'Props').innerHTML;
  const lampsOf = key => { const at = props.indexOf('id="marker-' + key + '"'); const seg = props.slice(at, props.indexOf('</button>', at)); return (seg.match(/marker-lamp is-on/g) || []).length; };
  T('the beacon\'s lamps show three played, the slate\'s one', lampsOf('beacon') === 3 && lampsOf('slate') === 1, props.slice(0, 200));
  await p.flyHome();
  await launchAndStart(p, 'moon');
  T('then the next not yet played: the writing slate\'s second', p.session.run && p.session.run.missionId === 'writer-2');

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
  T('the Moon\'s new missions are waiting: the writing slate first', u.markerNext('moon') === 'writer-1');
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

/* =========================================================
   CONTRACT 46 — ONE SET OF LETTERS, TO READ AND TO WRITE
   Every letter a child reads is drawn from the strokes a child traces:
   school print, big and little, from one table (LETTER_FORMS). Its
   shapes are checked here as geometry.
   ========================================================= */
async function testLetterforms(){
  section('CONTRACT 46 — one set of letters, to read and to write');
  const c = H.loadApp().ctx;
  const up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), low = up.map(L => L.toLowerCase()), all = up.concat(low);
  const box = ch => c.inkBox(c.LETTER_FORMS[ch]);

  sub('every letter, big and little, in one table');
  T('all 52 letterforms exist, and none is malformed', all.every(ch => c.LETTER_FORMS[ch] && !c.formProblems(c.LETTER_FORMS[ch])),
    all.filter(ch => !c.LETTER_FORMS[ch] || c.formProblems(c.LETTER_FORMS[ch])).join(','));
  T('a letter is one record, keyed by its capital, with its little shape on it', up.every(L => c.LETTERS[L] && c.LETTERS[L].lower &&
    c.LOWER_FAMILIES.indexOf(c.LETTERS[L].lower.family) !== -1 && c.LETTERS[L].lower.lookalikes.every(x => c.LETTERS[x])) && !c.LETTERS.m);
  T('big letters stand between the top line and the baseline', up.filter(L => L !== 'Q').every(L => box(L).y0 > -0.1 && box(L).y1 < 1.1));
  T('small letters sit between the midline and the baseline', 'acemnorsuvwxz'.split('').every(ch => box(ch).y0 > 0.4 && box(ch).y1 < 1.1));
  T('tall letters reach up to the top line', 'bdfhklt'.split('').every(ch => box(ch).y0 < 0.2));
  T('tails hang below the baseline', 'gjpqy'.split('').every(ch => box(ch).y1 > 1.3));
  T('i and j have their dots, and no other letter has one', all.filter(ch => c.LETTER_FORMS[ch].some(c.isDot)).join('') === 'ij');
  T('no two letters are drawn alike', new Set(all.map(ch => c.LETTER_FORMS[ch].map(c.strokePathD).join('|') + c.LETTER_FORMS[ch].filter(c.isDot).length)).size === 52);

  sub('school shapes, the way a child is taught to write them');
  const a = c.LETTER_FORMS.a, g = c.LETTER_FORMS.g;
  T('"a" is single-storey: a round bowl, then a stick down its right side', a.length === 2 && a[0].length === 1 && a[0][0][0] === 'A' &&
    Math.abs(a[0][0][6] - a[0][0][5]) === 360 && a[1].length === 1 && a[1][0][0] === 'L' && a[1][0][1] === a[1][0][3]);
  T('"g" is single-storey: the same bowl, then a stick with a tail', g.length === 2 && g[0][0][0] === 'A' && Math.abs(g[0][0][6] - g[0][0][5]) === 360 &&
    g[1][0][0] === 'L' && g[1][g[1].length - 1][0] === 'A');
  T('a big I has its bars, so it is never taken for a little l', c.LETTER_FORMS.I.length === 3 && c.LETTER_FORMS.l.length === 1 &&
    (box('I').x1 - box('I').x0) > 3 * (box('l').x1 - box('l').x0) && !c.LETTERS.I.ambiguous);
  T('circles start near one o\'clock and go counterclockwise, "like c"', 'acdgoq'.split('').every(ch => {
    const sg = c.LETTER_FORMS[ch][0][0];
    return sg[0] === 'A' && sg[5] >= -70 && sg[5] <= -20 && sg[6] < sg[5];
  }));
  T('sticks are pulled down: every stroke that is one upright line starts at its top', all.every(ch => c.LETTER_FORMS[ch].every(st =>
    !(st.length === 1 && st[0][0] === 'L' && st[0][1] === st[0][3]) || st[0][2] < st[0][4])));
  T('a stroke never lifts between its segments', all.every(ch => c.LETTER_FORMS[ch].every(st => st.every((sg, k) => {
    if(k === 0) return true;
    const a0 = c.segmentPoints(st[k - 1], 1), b0 = c.segmentPoints(sg, 1)[0];
    return Math.hypot(a0[a0.length - 1][0] - b0[0], a0[a0.length - 1][1] - b0[1]) < 0.011;
  }))));
  T('a malformed letterform is caught, never drawn or traced', [
    [], [[]], [[['L', 0, 0, NaN, 1]]], [[['Z', 0, 0]]], [[['L', 0, 0, 0, 1], ['L', 0.5, 0.5, 1, 1]]], [[['A', 0, 0, 0, 0.2, 0, 90]]],
    [[['L', 0, 0, 0, 9]]], [[['D', 0, 0], ['L', 0, 0, 0, 1]]]
  ].every(f => !!c.formProblems(f) && c.tracePlan(f) === null));

  sub('the print: letters drawn from their letterforms, never typed');
  const vb = svg => svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const frame = c.printFrame(['b', 'd', 'p']);
  const boxes = ['b', 'd', 'p'].map(ch => vb(c.printSvg(ch, frame)));
  T('a round shares one frame: every choice one size, on one baseline', boxes.every(b => b[1] === boxes[0][1] && b[2] === boxes[0][2] && b[3] === boxes[0][3]));
  T('a little letter framed with its big partner looks little', (() => {
    const f = c.printFrame(['m', 'n', 'w', 'M']);
    return f.y0 < 0 && f.y1 > 1 && box('m').y0 > 0.4;
  })());
  T('a word is its letters, laid out in order, evenly apart', (() => {
    const lay = c.printLayout('the');
    return lay.parts.map(p => p.ch).join('') === 'the' && lay.parts.every((p, i) => i === 0 || Math.abs((p.dx + p.box.x0) - (lay.parts[i - 1].dx + lay.parts[i - 1].box.x1) - c.PRINT.gap) < 1e-9);
  })());
  T('the print is drawn in the tile\'s own ink, round-ended, and hidden from screen readers (the button carries the name)',
    /stroke="currentColor"/.test(c.printSvg('M')) && /stroke-linecap="round"/.test(c.printSvg('M')) && /aria-hidden="true"/.test(c.printSvg('M')));
  const src = stripComments(js());
  T('every letter a child reads is printed: Letter Explorer\'s stones, Word Builder\'s pieces, the scanner\'s letter, a sight word',
    /printSvg\(inCase\(L, a\.form\), frame\)/.test(src) && /printSvg\(L, frame\)/.test(fnBody(js(), 'drawBuild')) &&
    /printSvg\(L\)/.test(fnBody(js(), 'showSoundLetter')) && /printSvg\(w, frame\)/.test(fnBody(js(), 'sightChoicesHtml')));
  T('the letter sizes that were set for the UI font are no longer used for a letter', !/choice-glyph">' \+ L \+/.test(src));
}

/* =========================================================
   CONTRACT 47 — BIG LETTERS, LITTLE LETTERS, AND PARTNERS
   Letter Explorer in both cases: little letters are found by name, and
   partners are matched by eye. A letter's little shape has its own
   look-alikes. Pip always says "the letter", "the big letter" or "the
   little letter": never a bare name.
   ========================================================= */
async function testLetterCases(){
  section('CONTRACT 47 — big letters, little letters, and their partners');
  const c = H.loadApp().ctx;

  sub('the engine');
  const pools = c.distractorPools('B', 'lower');
  T('a little letter\'s look-alikes are its own: b beside d, p and q — not B beside P and R', ['D', 'P', 'Q'].every(L => pools.lookalike.indexOf(L) !== -1) &&
    pools.lookalike.indexOf('R') === -1);
  T('at the easy level, the other little letters are other shapes altogether', (() => {
    for(let s = 0; s < 30; s++){
      const out = c.pickDistractors('B', 1, 2, c.seededRandom('b' + s), 'lower');
      if(out.length !== 2 || out.some(L => c.areLookalikes('B', L, 'lower') || c.LETTERS[L].lower.family === 'tall')) return false;
    }
    return true;
  })());
  T('above it, a look-alike joins: b meets d, p or q', (() => {
    for(let s = 0; s < 10; s++){ const out = c.pickDistractors('B', 3, 2, c.seededRandom('h' + s), 'lower'); if(!out.some(L => ['D', 'P', 'Q', 'H'].indexOf(L) !== -1)) return false; }
    return true;
  })());
  T('a little-letter round is built from little-letter shapes: at the easy level no look-alike, and nothing of its family, stands beside it', (() => {
    return Object.keys(c.LETTERS).filter(L => !c.LETTERS[L].ambiguous).every(L => {
      for(let k = 0; k < 12; k++){
        const r = c.ACTIVITY_TYPES['find-letter'].buildRound({ type: 'find-letter', target: L, form: 'lower' }, { tier: 1, choices: 3, rand: c.seededRandom('lower' + L + k) });
        if(r.options.some(o => o !== L && (c.areLookalikes(L, o, 'lower') || c.LETTERS[o].lower.family === c.LETTERS[L].lower.family))) return false;
      }
      return true;
    });
  })());
  const type = c.ACTIVITY_TYPES['find-letter'];
  T('evidence is kept per case: M big, m little, and M with m as a pair',
    type.evidenceKey({ target: 'M', form: 'upper' }).form === 'upper' && type.evidenceKey({ target: 'M', form: 'lower' }).form === 'lower' &&
    type.evidenceKey({ target: 'M', form: 'lower', from: 'upper' }).form === 'match');
  T('a pair counts without sound — the partner is on the screen — and a little letter asked for by name does not',
    type.silentOk({ target: 'M', form: 'lower', from: 'upper' }) === true && !type.silentOk({ target: 'M', form: 'lower' }));
  T('a pair must show the other case', !!type.validate({ target: 'M', form: 'lower', from: 'lower' }) && !type.validate({ target: 'M', form: 'lower', from: 'upper' }));
  T('a little letter needing help brings its sound back in Sound Scout, as a big one does', (() => {
    const ev = [{ id: 'letter-recognition.M.lower', skillId: 'letter-recognition', item: 'M', form: 'lower', recent: [0, 0], lastPracticed: 't1' }];
    const a = c.MISSIONS['mars-3'].activities.find(x => x.review && x.review.indexOf('m') !== -1 && x.review[0] !== 'm');
    return !!a && c.reviewActivity(a, ev, { asked: [] }).sound === 'm';
  })());
  T('a little letter needing help comes back as a little letter, and pairs count toward it', (() => {
    const ev = [{ id: 'letter-recognition.A.match', skillId: 'letter-recognition', item: 'A', form: 'match', recent: [0, 0], lastPracticed: 't1' },
                { id: 'letter-recognition.M.upper', skillId: 'letter-recognition', item: 'M', form: 'upper', recent: [0, 0, 0], lastPracticed: 't1' }];
    const a = c.MISSIONS['moon-5'].activities[5];
    return c.reviewActivity(a, ev, { asked: [] }).target === 'A';
  })());

  sub('what Pip says');
  const L = Object.keys(c.LETTERS);
  const ids = [];
  L.forEach(x => ['little.' + x, 'little.' + x + '.2', 'littleAgain.' + x + '.1', 'littleFound.' + x + '.0', 'littleShow.' + x,
                  'pair.' + x + '.lower', 'pair.' + x + '.upper.1', 'pairAgain.' + x + '.lower.0', 'pairFound.' + x + '.upper.2', 'pairShow.' + x + '.lower'].forEach(id => ids.push([x, id])));
  const cues = ids.map(([x, id]) => [x, c.voiceCue(id)]);
  T('every line about a little letter or a pair exists', cues.every(q => !!q[1]));
  const named = (x, s) => {
    const name = c.LETTERS[x].speak, re = new RegExp('(\\S+)\\s+' + name + '\\b', 'g');
    let m, ok = new RegExp('\\b' + name + '\\b').test(s);
    while((m = re.exec(s))) if(m[1].toLowerCase() !== 'letter') ok = false;
    return ok;
  };
  /* U is "you", which the lines also use ("Can you find…"): it is checked by hand, in CONTENT-REVIEW.md */
  T('a letter\'s name always follows "letter" — never a bare "bee" (an insect) or "pee"', cues.every(([x, q]) => !q || x === 'U' || named(x, q.speak)),
    cues.filter(([x, q]) => q && !named(x, q.speak)).slice(0, 3).map(([x, q]) => q.speak).join(' / '));
  T('on screen a question is the task, never the letter to find', cues.filter(([x, q]) => q && q.type === 'question').every(([x, q]) =>
    ['Find the little letter!', 'Find its little letter!', 'Find its big letter!'].indexOf(q.text) !== -1));

  sub('playing it');
  const sp = fakeSpeech();
  const app = H.loadApp({ windowExtras: sp.extras });
  const p = fast(app.ctx), d = app.dom.document;
  await p.startAdventure();
  seedDone(p, ['moon-1', 'writer-1', 'moon-2', 'moon-3', 'writer-2']);
  p.pickDestination('moon');
  await p.launch();
  const hints = spy(p, 'tileClass');
  await p.tapMarker('beacon');
  T('the fourth letter mission is little letters, explained once, though the game is known', p.session.run && p.session.run.missionId === 'moon-4' &&
    sp.said.filter(s => /a big shape and a little shape/.test(s)).length === 1);
  const html = d.getElementById('missionChoices').innerHTML;
  T('its letters are little, printed, one frame for the round', /data-letter="o"/.test(html) && (html.match(/class="print"/g) || []).length === 3);
  T('and named for a screen reader as little letters', /aria-label="Little letter o"/.test(html));
  T('its first round is guided: the answer glows', hints.some(x => x[0] === p.session.run.round.answer && x[1] === 'is-hint'));
  await playMission(p, { wrongRounds: [2] });
  T('each little letter is recorded as little', p.journey.evidence.filter(e => e.skillId === 'letter-recognition').every(e => e.form === 'lower') &&
    p.journey.evidence.some(e => e.item === 'S' && e.form === 'lower'));
  await p.flyHome();
  p.pickDestination('moon');
  await p.launch();
  await p.tapMarker('beacon');
  T('then big and little partners', p.session.run && p.session.run.missionId === 'moon-5');
  const sig = d.getElementById('gameSignal').innerHTML;
  T('the partner stands on a plate above the stones', /class="signal-plate" data-letter="N"/.test(sig) && d.getElementById('missionGame').getAttribute('data-variant') === 'pair');
  T('Pip names it and asks for its partner', /This is the big letter en\. Find the little letter en!/.test(sp.said[sp.said.length - 1]));
  T('and the little letters to choose from look little beside it', (() => {
    const v = d.getElementById('missionChoices').innerHTML.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    return v[1] < 0 && v[1] + v[3] > 1;
  })());
  await playMission(p);
  T('a pair is recorded as a pair (the guided first one teaches, and is not)', ['P', 'F', 'H', 'B'].every(x => p.journey.evidence.some(e => e.item === x && e.form === 'match')) &&
    !p.journey.evidence.some(e => e.item === 'N' && e.form === 'match'));
  T('no console errors', app.errors.length === 0, app.errors.join(' | '));
}

/* =========================================================
   CONTRACT 48 — SIGHT WORDS: A RECORDED SOURCE, AND THE WORD IS THE QUESTION
   Twelve words from the Dolch pre-primer list, recorded as the source and
   awaiting review. In Star Words the word is heard, never shown before it
   is found; in Word Orbit it is matched by eye.
   ========================================================= */
async function testSightWords(){
  section('CONTRACT 48 — sight words: a recorded source, and the word is the question');
  const c = H.loadApp().ctx;
  /* the Dolch pre-primer list, typed here by hand as the independent check */
  const DOLCH = ('a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run ' +
                 'said see the three to two up we where yellow you').split(' ');

  sub('the words, and where they come from');
  const sw = c.sightWords();
  T('twelve sight words, each naming a recorded list', sw.length === 12 && sw.every(w => c.WORD_LISTS[c.WORDS[w].sight.list]), sw.join(','));
  T('every one is on the Dolch pre-primer list', sw.every(w => DOLCH.indexOf(w) !== -1) && DOLCH.length === 40);
  T('no single-letter word yet: "a" and "I" look like the letters found on the Moon', sw.every(w => w.length > 1));
  T('no sight word says by hand whether it can be sounded out: that is derived', sw.every(w => c.WORDS[w].sight.decodable === undefined) &&
    (() => { const k = c.WORDS.and.sight; k.decodable = true; const bad = c.validateContent().some(x => /says by hand whether it can be sounded out/.test(x)); delete k.decodable; return bad; })());
  T('whether a word sounds out letter by letter comes from its letters and its sounds: and, it, in, can do; the, see, is, go do not',
    ['and', 'it', 'in', 'can'].every(c.soundsOutByLetter) && !['the', 'see', 'is', 'go', 'you', 'to', 'we', 'my'].some(c.soundsOutByLetter));
  const taught = c.taughtSounds();
  T('the sounds this app teaches come from its missions: what Sound Scout asks and Word Builder builds — and /d/ and short i are not among them',
    ['m', 's', 'f', 'n', 'r', 'a', 'u', 'p', 't', 'k', 'b', 'g', 'h'].every(p => taught.has(p)) && !taught.has('d') && !taught.has('i') && taught.size === 13, [...taught].sort().join(' '));
  T('a sound the app can make is not a sound it teaches', !!c.PHONEMES.d && !!c.PHONEMES.i && !taught.has('d') && !taught.has('i'));
  T('so only "can" is decodable with what this app teaches: "and" needs /d/, "it" and "in" need short i',
    sw.filter(c.decodableHere).join(',') === 'can' && !c.decodableHere('and') && !c.decodableHere('it') && !c.decodableHere('in'));
  const srcDoc = fs.readFileSync(path.join(H.ROOT, 'docs', 'CONTENT-SOURCES.md'), 'utf8');
  const rows = {};
  srcDoc.split('\n').forEach(line => { const m = line.match(/^\| `([a-z]+)` \| [^|]+\| (yes|no)[^|]*\| (yes|no)[^|]*\|/); if(m) rows[m[1]] = [m[2] === 'yes', m[3] === 'yes']; });
  T('CONTENT-SOURCES.md says the same for every word, in two columns: letter by letter, and with what this app teaches',
    sw.every(w => rows[w] && rows[w][0] === c.soundsOutByLetter(w) && rows[w][1] === c.decodableHere(w)),
    sw.filter(w => !rows[w] || rows[w][0] !== c.soundsOutByLetter(w) || rows[w][1] !== c.decodableHere(w)).join(','));
  const reviewDoc = fs.readFileSync(path.join(H.ROOT, 'docs', 'CONTENT-REVIEW.md'), 'utf8');
  T('and no other document calls a sight word decodable with the sounds taught unless it is',
    !/\| (and|it|in) \| sight word, decodable/.test(reviewDoc) && !/Decodable with the sounds taught \|/.test(srcDoc));
  T('a sight word has no picture, and no picture game can ever offer one', sw.every(w => !c.WORDS[w].picture) &&
    Object.keys(c.MISSIONS).every(id => c.MISSIONS[id].activities.every(a => {
      if(a.type === 'rhyme-pick'){ const pl = c.rhymeDistractorPools(a); return pl.sameStart.concat(pl.other).every(c.hasPicture); }
      if(a.type === 'sound-pick'){ const pl = c.soundDistractorPools(a); return pl.far.concat(pl.rhyme).every(c.hasPicture); }
      return true;
    })) && c.soundWord('s', []) !== 'see');
  const sources = fs.readFileSync(path.join(H.ROOT, 'docs', 'CONTENT-SOURCES.md'), 'utf8');
  T('CONTENT-SOURCES.md records the list, and every word drawn from it', /Dolch/.test(sources) && /pre-primer/i.test(sources) &&
    sw.every(w => new RegExp('`' + w + '`').test(sources)));
  T('nothing a child or a grown-up sees claims alignment to it', !/Dolch|aligned/i.test(JSON.stringify(c.VOICE_CUES) + JSON.stringify(c.APP_UPDATES)));

  sub('the engine');
  const rounds = [];
  ['sight-find', 'sight-match'].forEach(t => sw.forEach(w => [1, 2].forEach(tier => {
    rounds.push([w, tier, c.ACTIVITY_TYPES[t].buildRound({ type: t, target: w }, { tier: tier, choices: 3, rand: c.seededRandom(t + w + tier) })]);
  })));
  T('a round is three different words, one of them the word', rounds.every(([w, tier, r]) => r.options.length === 3 && new Set(r.options).size === 3 && r.options[r.answer] === w));
  T('at the easy level the others look little like it', rounds.filter(r => r[1] === 1).every(([w, tier, r]) => r.options.every(o => o === w || c.wordLikeness(w, o) <= 2)));
  T('above it, one looks a lot like it — telling close words apart', rounds.filter(r => r[1] === 2 && c.sightDistractorPools(r[0]).near.length).every(([w, tier, r]) =>
    r.options.some(o => o !== w && c.wordLikeness(w, o) >= 3)));
  const NEAR = { the: 'see to', and: 'can', see: 'the', you: '', to: 'the go', go: 'to', is: 'it in', it: 'is in', in: 'is it', can: 'and', we: '', my: '' };
  T('the look-alike words are exactly those listed for review (CONTENT-REVIEW.md section 23)', sw.every(w =>
    c.sightDistractorPools(w).near.slice().sort().join(' ') === NEAR[w].split(' ').filter(Boolean).sort().join(' ')),
    sw.map(w => w + ':' + c.sightDistractorPools(w).near.join('/')).join(' '));
  T('likeness is counted, the same way every time: "it" and "is" are close, "the" and "and" are not',
    c.wordLikeness('it', 'is') >= 3 && c.wordLikeness('the', 'to') >= 3 && c.wordLikeness('the', 'and') <= 2);
  T('the same run makes the same round', JSON.stringify(c.ACTIVITY_TYPES['sight-find'].buildRound({ type: 'sight-find', target: 'the' }, { tier: 2, choices: 3, rand: c.seededRandom('x') })) ===
    JSON.stringify(c.ACTIVITY_TYPES['sight-find'].buildRound({ type: 'sight-find', target: 'the' }, { tier: 2, choices: 3, rand: c.seededRandom('x') })));
  T('a sight-word lesson\'s title and task never show a sight word', Object.keys(c.MISSIONS).filter(id => c.MISSIONS[id].skillId === 'sight-words')
    .every(id => !sw.some(w => new RegExp('\\b' + w + '\\b', 'i').test(c.MISSIONS[id].task + ' ' + c.MISSIONS[id].title))));

  sub('Star Words: the word is heard, never shown before it is found');
  const rig = audioRig();
  const app = H.loadApp({ windowExtras: rig.extras });
  const p = fast(app.ctx), d = app.dom.document;
  await p.startAdventure();
  seedDone(p, ['moon-1', 'mercury-1', 'mercury-2', 'mars-1', 'mars-2']);
  p.saveCompletions();
  p.pickDestination('jupiter');
  await p.launch();
  T('Jupiter is open once Mars is full of sounds, and its sky sign is the one to tap', p.session.place === 'jupiter' && p.markerNext('jupiter') === 'jupiter-1');
  await p.tapMarker('skysign');
  const r0 = p.session.run.round;
  const caption = () => d.getElementById('caption-mission').textContent;
  const heard = rig.events.filter(e => /^tts:/.test(e)).slice(-2).join('|');
  T('"Find the word…" — then the word, on its own', /tts:(Find the word|Where is the word|Can you find the word)…\|tts:the\.$/.test(heard), heard);
  T('the caption says the task and never the word', caption() === 'Find the word!' && !/\bthe\b/i.test(caption().replace(/^Find the word!$/, '')));
  const tiles = d.getElementById('missionChoices').innerHTML;
  T('the word Pip said is the word printed on the answer', new RegExp('data-word="' + r0.options[r0.answer] + '"').test(tiles) && r0.options[r0.answer] === 'the' &&
    (tiles.match(/class="print"/g) || []).length === 3);
  T('each word is on its own satellite, named for a screen reader', (tiles.match(/class="choice choice-word/g) || []).length === 3 && /aria-label="The word the"/.test(tiles));
  let answeredEarly = true;
  for(let i = 0; i < 6 && p.session.run; i++){
    const r = p.session.run.round;
    if(!r) break;
    for(let k = 0; k < 200 && p.session.input !== 'open'; k++) await wait(2);
    await wait(5);
    if(!r.resolved && caption() !== 'Find the word!') answeredEarly = false;
    await p.choose(r.answer);
    await wait(2);
  }
  T('in every round the caption kept the word hidden until it was found', answeredEarly);
  T('each word found is recorded as heard', p.journey.evidence.filter(e => e.skillId === 'sight-words').every(e => e.form === 'hear'));

  sub('Word Orbit: the same word, found by eye');
  for(let k = 0; k < 400 && p.currentScene !== 'planet'; k++) await wait(2);
  await p.tapMarker('orbit');
  const r1 = p.session.run.round;
  const hub = d.getElementById('gameSignal').innerHTML;
  T('the word to match is at the centre, and the same word is on the ring', /class="signal-word" data-word="the"/.test(hub) && r1.options.indexOf('the') !== -1);
  T('both are printed in the same frame, so they match letter for letter', hub.match(/viewBox="([^"]+)"/)[1].split(' ').slice(1).join() ===
    d.getElementById('missionChoices').innerHTML.match(/viewBox="([^"]+)"/)[1].split(' ').slice(1).join());
  T('a match is seen, not heard: it counts with the sound off', c.ACTIVITY_TYPES['sight-match'].silentOk() === true);
  await playMission(p);
  T('each word matched is recorded as matched', p.journey.evidence.some(e => e.skillId === 'sight-words' && e.form === 'match'));
  T('Jupiter is restored by its sky sign and its orbit ring', p.placeRestored('jupiter'));

  sub('with nothing to hear');
  const q = H.loadApp();
  const s = fast(q.ctx);
  s.soundPrefs.voice = false;
  await s.startAdventure();
  seedDone(s, ['moon-1', 'mercury-1', 'mercury-2', 'mars-1', 'mars-2']);
  s.pickDestination('jupiter');
  await s.launch();
  await s.tapMarker('skysign');
  await wait(5);
  T('the word is shown, so the game can still be played', /Find the word: the/.test(q.dom.document.getElementById('caption-mission').textContent));
  await playMission(s);
  T('and nothing is recorded: a word read off the caption is not a sight word known', s.journey.evidence.filter(e => e.skillId === 'sight-words').length === 0);

  sub('review');
  const ev = [{ id: 'sight-words.you.hear', skillId: 'sight-words', item: 'you', form: 'hear', recent: [0, 0], lastPracticed: 't1' },
              { id: 'sight-words.the.match', skillId: 'sight-words', item: 'the', form: 'match', recent: [1], lastPracticed: 't0' }];
  T('the sight word that needed help most comes back, from either game', c.reviewActivity(c.MISSIONS['jupiter-3'].activities[4], ev, { asked: [] }).target === 'you');
  T('no console errors', app.errors.length === 0 && q.errors.length === 0, app.errors.concat(q.errors).join(' | '));
}

/* =========================================================
   CONTRACT 49 — TRACING: THE WAY A LETTER IS MADE, BY GEOMETRY
   Did the child follow the letter's path, from its start, in its
   direction? No recognition, no score: forward progress along each
   stroke within a corridor, and a gentle restart of one stroke only.
   ========================================================= */
function testTracing(){
  section('CONTRACT 49 — tracing: the way a letter is made, checked by geometry');
  const c = H.loadApp().ctx;
  const all = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  const trace = (ch, step, only) => {
    const plan = c.tracePlan(c.LETTER_FORMS[ch]), t = c.traceStart(plan), evs = [];
    plan.forEach((s, i) => {
      if(only !== undefined && i > only) return;
      evs.push(c.traceDown(plan, t, s.pts[0]));
      if(s.dot) return;
      for(let k = step; k < s.pts.length; k += step) evs.push(c.traceMove(plan, t, s.pts[k]));
      evs.push(c.traceMove(plan, t, s.pts[s.pts.length - 1]));
      c.traceUp(t);
    });
    return { plan: plan, t: t, evs: evs };
  };

  sub('a whole letter, followed');
  T('every letter, big and little, can be traced along its own strokes, in order', all.every(ch => trace(ch, 2).t.done), all.filter(ch => !trace(ch, 2).t.done).join(','));
  T('even by a fast finger, far between its points', all.every(ch => trace(ch, 6).t.done), all.filter(ch => !trace(ch, 6).t.done).join(','));
  T('each stroke done is said once, and the letter once', (() => { const r = trace('H', 2); return r.evs.filter(e => e === 'stroke').length === 2 && r.evs.filter(e => e === 'letter').length === 1; })());

  sub('only the way the letter is made');
  const planL = c.tracePlan(c.LETTER_FORMS.L), s0 = planL[0];
  T('going down anywhere but the start does not begin the stroke', (() => { const t = c.traceStart(planL); return c.traceDown(planL, t, [0.5, 0.2]) === 'away' && !t.down; })());
  T('starting from the end — tracing backwards — does not begin it either', (() => { const t = c.traceStart(planL); return c.traceDown(planL, t, s0.pts[s0.pts.length - 1]) === 'away'; })());
  T('moving the wrong way from the start makes no progress', (() => {
    const t = c.traceStart(planL); c.traceDown(planL, t, s0.pts[0]);
    for(let k = 1; k < 20; k++) c.traceMove(planL, t, [0, -0.01 * k]);
    return t.at === 0 && !t.done;
  })());
  T('cutting straight across a letter is not its path', (() => {
    const pO = c.tracePlan(c.LETTER_FORMS.O), t = c.traceStart(pO); c.traceDown(pO, t, pO[0].pts[0]);
    const far = pO[0].pts[Math.floor(pO[0].pts.length / 2)];
    c.traceMove(pO, t, far);
    return c.traceShare(pO, t) < 0.2 && !t.done;
  })());
  T('nothing is done until the last point of the last stroke', (() => {
    const t = c.traceStart(planL); c.traceDown(planL, t, s0.pts[0]);
    const stop = Math.floor(s0.pts.length * 0.9);
    for(let k = 1; k <= stop; k++) c.traceMove(planL, t, s0.pts[k]);
    return !t.done && c.traceShare(planL, t) < 1;
  })());

  sub('forgiving');
  T('a finger a little off the path is neither counted nor punished', (() => {
    const t = c.traceStart(planL); c.traceDown(planL, t, s0.pts[0]);
    let ev = null;
    for(let k = 1; k < 6; k++){ ev = c.traceMove(planL, t, [0.22, k * 0.03]) || ev; if(ev === 'wander') break; }
    return ev !== 'wander' && t.resets === 0 && t.at <= 1;
  })());
  T('a finger that wanders well away restarts only that stroke: those before it stay done', (() => {
    const pH = c.tracePlan(c.LETTER_FORMS.H), t = c.traceStart(pH);
    c.traceDown(pH, t, pH[0].pts[0]); pH[0].pts.forEach(q => c.traceMove(pH, t, q)); c.traceUp(t);
    c.traceDown(pH, t, pH[1].pts[0]);
    let ev = null;
    for(let k = 1; k < 30 && ev !== 'wander'; k++) ev = c.traceMove(pH, t, [pH[1].pts[0][0] - 0.05 * k, 0.1]);
    return ev === 'wander' && t.stroke === 1 && t.at === -1 && t.resets === 1 && !t.down;
  })());
  T('restarts are counted stroke by stroke: once astray on each of two strokes is not twice on one', (() => {
    const pH = c.tracePlan(c.LETTER_FORMS.H), t = c.traceStart(pH);
    const astray = i => { c.traceDown(pH, t, pH[i].pts[0]); let ev = null; for(let k = 1; k < 30 && ev !== 'wander'; k++) ev = c.traceMove(pH, t, [pH[i].pts[0][0] - 0.05 * k, 0.1]); };
    astray(0);
    c.traceDown(pH, t, pH[0].pts[0]); pH[0].pts.forEach(q => c.traceMove(pH, t, q)); c.traceUp(t);
    astray(1);
    return t.stroke === 1 && t.resets === 1;
  })());
  T('a lifted finger carries on from where it stopped', (() => {
    const t = c.traceStart(planL); c.traceDown(planL, t, s0.pts[0]);
    const mid = Math.floor(s0.pts.length / 2);
    for(let k = 1; k <= mid; k++) c.traceMove(planL, t, s0.pts[k]);
    c.traceUp(t);
    const back = c.traceDown(planL, t, s0.pts[t.at]);
    for(let k = mid; k < s0.pts.length; k++) c.traceMove(planL, t, s0.pts[k]);
    return back === 'start' && t.done;
  })());
  T('or goes back to where the stroke begins, and starts that stroke again', (() => {
    const t = c.traceStart(planL); c.traceDown(planL, t, s0.pts[0]);
    const mid = Math.floor(s0.pts.length / 2);
    for(let k = 1; k <= mid; k++) c.traceMove(planL, t, s0.pts[k]);
    c.traceUp(t);
    const again = c.traceDown(planL, t, s0.pts[0]);
    return again === 'start' && t.at === 0 && t.down && t.resets === 0;
  })());
  T('but a lifted finger going down anywhere else begins nothing', (() => {
    const t = c.traceStart(planL); c.traceDown(planL, t, s0.pts[0]);
    const mid = Math.floor(s0.pts.length / 2);
    for(let k = 1; k <= mid; k++) c.traceMove(planL, t, s0.pts[k]);
    c.traceUp(t);
    const at = t.at;
    return c.traceDown(planL, t, s0.pts[s0.pts.length - 1]) === 'away' && !t.down && t.at === at;
  })());
  T('a dot is a tap near it', (() => { const r = trace('i', 2); return r.t.done && r.evs[r.evs.length - 1] === 'letter'; })());

  T('a finger wiggling in the middle of a little o does not trace it — the corridor is narrower than its radius', (() => {
    const p = c.tracePlan(c.LETTER_FORMS.o), t = c.traceStart(p);
    c.traceDown(p, t, p[0].pts[0]);
    for(let k = 0; k < 40; k++) c.traceMove(p, t, [0.25 + (k % 2 ? 0.02 : -0.02), 0.75 + (k % 3 ? 0.02 : -0.02)]);
    return !t.done && c.traceShare(p, t) < 0.2 && c.TRACE.tolerance < 0.25 - 0.05;
  })());

  sub('safe with anything');
  const pl = c.tracePlan(c.LETTER_FORMS.A), tt = c.traceStart(pl);
  T('a point that is not a point is ignored, never thrown', c.traceDown(pl, tt, [NaN, 1]) === null && c.traceMove(pl, tt, null) === null &&
    c.traceDown(null, tt, [0, 0]) === null && c.traceMove(pl, null, [0, 0]) === null && c.traceUp(null) === null);
  T('a finished letter takes no more', (() => { const r = trace('T', 2); return c.traceDown(r.plan, r.t, r.plan[0].pts[0]) === null; })());
  T('the same trace is judged the same way every time', JSON.stringify(trace('S', 3).t) === JSON.stringify(trace('S', 3).t));
  T('there is no score and no recognition: done, or not yet, and help counted', !/score|percent|recogni/i.test(stripComments(fnBody(js(), 'traceMove') + fnBody(js(), 'traceDown'))));
}

/* =========================================================
   CONTRACT 50 — MOON WRITER: WATCH, TRACE, TRACE AGAIN
   Pip writes the letter first; the child traces it with the path
   shown, then with only its start. A finger or the Pencil, one at a
   time, on the slate only. A trace is answered by finishing it, and help
   is counted, never punished.
   ========================================================= */
async function testMoonWriter(){
  section('CONTRACT 50 — Moon Writer: watch, trace, trace again');
  const sheet = css();

  sub('the slate takes the trace, and only the slate');
  T('the page never scrolls under a tracing finger, and nothing is selected or long-pressed', /touch-action: none/.test(cssRule(sheet, '.write-pad')) &&
    /user-select: none/.test(cssRule(sheet, '.write-pad')) && /-webkit-touch-callout: none/.test(cssRule(sheet, '.write-pad')));
  T('it listens for a pointer going down, moving, lifting and being cancelled — a finger and the Pencil alike',
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'].every(e => new RegExp("'" + e + "'").test(fnBody(js(), 'wireWritePad'))));
  T('what is drawn on it takes no taps of its own', /pointer-events: none/.test(cssRule(sheet, '.w-svg')));
  T('the slate itself catches a real finger: the scene layer lets taps through, and the slate is not a button',
    /\.scene-ui\{[^}]*pointer-events: none/.test(sheet.replace(/\/\*[\s\S]*?\*\//g, '')) && /pointer-events: auto/.test(cssRule(sheet, '.write-pad')));

  sub('watch, then trace');
  const rig = audioRig();
  const app = H.loadApp({ windowExtras: rig.extras });
  const p = fast(app.ctx), d = app.dom.document;
  await p.startAdventure();
  await launchAndStart(p);
  await playMission(p);
  T('the visit that relit the Moon points at its writing slate', p.markerNext('moon') === 'writer-1');
  const at = rig.events.length;
  await p.tapMarker('slate');
  const said = rig.events.slice(at).filter(e => /^tts:/.test(e)).join('|');
  T('the task is explained once, then Pip writes the letter, then asks', /Let's write letters!/.test(said) &&
    /This is how we write the big letter el\.[\s\S]*Trace the big letter el\./.test(said), said);
  const pad = () => d.getElementById('writePad').innerHTML;
  T('with full help: every stroke\'s lane, the dashed middle, the arrow and the green start', /class="w-lane is-now"/.test(pad()) &&
    /class="w-dash"/.test(pad()) && /class="w-arrow"/.test(pad()) && /class="w-start"/.test(pad()));
  T('between the writing lines: top, dashed middle and baseline', /class="w-line"/.test(pad()) && /class="w-mid"/.test(pad()));
  T('the slate is open to the trace', p.session.input === 'open' && p.writeReady());

  sub('one pointer at a time: a second finger does not draw, and the Pencil beats a resting palm');
  const el = d.getElementById('writePad');
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 160, height: 195 });
  const w = p.session.write, view = w.view;
  const ev = (id, kind, u) => ({ pointerId: id, pointerType: kind, clientX: (u[0] - view[0]) * 100, clientY: (u[1] - view[1]) * 100,
                                 cancelable: true, preventDefault(){}, currentTarget: { setPointerCapture(){} } });
  const s0 = w.plan[0];
  el.dispatch('pointerdown', ev(1, 'touch', s0.pts[0]));
  T('a finger at the green dot begins the stroke', w.t.down && p.writeInput.id === 1);
  el.dispatch('pointerdown', ev(2, 'touch', [view[0] + 0.1, 1.5]));
  el.dispatch('pointermove', ev(2, 'touch', s0.pts[10]));
  T('a second finger is ignored', p.writeInput.id === 1 && w.t.at < 5);
  el.dispatch('pointermove', ev(1, 'touch', s0.pts[8]));
  T('the first finger\'s trace moves on', w.t.at >= 6);
  el.dispatch('pointerdown', ev(3, 'pen', s0.pts[w.t.at]));
  T('a Pencil coming down takes over: the touch was a palm', p.writeInput.id === 3 && p.writeInput.type === 'pen' && w.t.down);
  el.dispatch('pointercancel', ev(3, 'pen', s0.pts[w.t.at]));
  T('a cancelled pointer just lifts: what was traced stays', !w.t.down && w.t.at >= 6 && p.writeInput.id === null);
  const dot = (pad().match(/<circle class="w-start" id="writeStart" cx="([-\d.]+)" cy="([-\d.]+)"/) || []).slice(1).map(Number);
  T('and the green dot moves to where it stopped, which is where it carries on',
    dot.length === 2 && Math.abs(dot[0] - s0.pts[w.t.at][0]) < 0.002 && Math.abs(dot[1] - s0.pts[w.t.at][1]) < 0.002, dot.join(','));
  el.dispatch('pointerdown', ev(4, 'pen', s0.pts[w.t.at]));
  s0.pts.forEach((q, k) => { if(k % 2 === 0) el.dispatch('pointermove', ev(4, 'pen', q)); });
  el.dispatch('pointermove', ev(4, 'pen', s0.pts[s0.pts.length - 1]));
  el.dispatch('pointerup', ev(4, 'pen', s0.pts[s0.pts.length - 1]));
  for(let k = 0; k < 100 && !p.session.run.results.length; k++) await wait(2);
  T('finishing the trace answers the round — nothing to choose, nothing wrong', p.session.run.results.length === 1);
  T('the first, fully shown trace is teaching, not evidence', p.session.run.results[0].outcome === null);
  for(let k = 0; k < 200 && !(p.session.run.index === 1 && p.session.input === 'open'); k++) await wait(2);
  T('then the same letter again with less help: a faint outline and only its start', /class="w-faint/.test(pad()) && !/w-lane/.test(pad()) &&
    !/w-dash/.test(pad()) && /class="w-start"/.test(pad()) && p.session.run.round.activity.help === 'light');
  T('and Pip asks without writing it again', rig.events.slice(-3).some(e => /Now write it again, with less help!|Can you write it on your own\?/.test(e)));

  sub('help is counted, never punished');
  await traceLetter(p, false);
  for(let k = 0; k < 200 && !(p.session.run && p.session.run.index === 2 && p.session.input === 'open'); k++) await wait(2);
  const evL = p.journey.evidence.find(e => e.id === 'handwriting.L.upper');
  T('traced cleanly with less help: recorded as without help', !!evL && evL.recent.join() === '1');
  await traceLetter(p, false);
  for(let k = 0; k < 200 && !(p.session.run && p.session.run.index === 3 && p.session.input === 'open'); k++) await wait(2);
  const marks = rig.events.length;
  await traceLetter(p, true);
  T('a stroke that wandered starts again, alone, and Pip says so gently', rig.events.slice(marks).some(e => /Let's try that line again\./.test(e)) &&
    !rig.events.slice(marks).some(e => /wrong|no!/i.test(e)));
  for(let k = 0; k < 200 && !(p.session.run && p.session.run.index === 4 && p.session.input === 'open'); k++) await wait(2);
  const evT = p.journey.evidence.find(e => e.id === 'handwriting.T.upper');
  T('that letter is recorded as helped', !!evT && evT.recent.join() === '0');
  await traceLetter(p, false);
  for(let k = 0; k < 200 && !(p.session.run && p.session.run.index === 5 && p.session.input === 'open'); k++) await wait(2);
  p.session.write.t.stroke = 0;
  const before = p.session.run.round.misses;
  await p.watchAgain();
  T('"watch it again" shows the letter again, and counts as help', p.session.run.round.misses === before + 1 && p.session.input === 'open');
  T('the letter traced with the most help comes back in Moon Writer\'s review', (() => {
    const ev = [{ id: 'handwriting.L.upper', skillId: 'handwriting', item: 'L', form: 'upper', recent: [1], lastPracticed: 't0' },
                { id: 'handwriting.T.upper', skillId: 'handwriting', item: 'T', form: 'upper', recent: [0, 0], lastPracticed: 't1' },
                { id: 'handwriting.H.lower', skillId: 'handwriting', item: 'H', form: 'lower', recent: [0, 0, 0], lastPracticed: 't1' }];
    const a = p.MISSIONS['writer-2'].activities.find(x => x.review);
    return p.reviewActivity(a, ev, { asked: [] }).target === 'T';
  })());
  const w5 = p.session.write;
  w5.ink.push([[0, 0], [0, 0.5]]);
  p.restartLetter();
  T('"start again" clears the slate for this letter', w5.t.stroke === 0 && w5.t.at === -1 && w5.ink.length === 0);
  await traceLetter(p, false);
  for(let k = 0; k < 400 && p.currentScene !== 'planet'; k++) await wait(2);
  T('the mission finishes when every letter is traced, and pays its stars', p.missionDone('writer-1') && p.starBalance(p.journey.stars) === 6);
  T('each letter is recorded once, as a big letter traced', ['L', 'T', 'H'].every(x => p.journey.evidence.filter(e => e.id === 'handwriting.' + x + '.upper').length === 1));

  sub('Pip reminds, but never nags');
  {
    const nr = audioRig();
    const n = H.loadApp({ windowExtras: nr.extras });
    const nc = fast(n.ctx);
    nc.TIMING.writeHint = 60000;
    await nc.startAdventure();
    seedDone(nc, ['moon-1']);
    nc.pickDestination('moon');
    await nc.launch();
    await nc.tapMarker('slate');
    const from = nr.events.length;
    for(let k = 0; k < 4; k++){ nc.writeDown([1.2, 1.4]); nc.writeUp(); await wait(2); }
    T('going down away from the dot again and again: "Start at the green dot" is said once, not every time',
      nr.events.slice(from).filter(e => /Start at the green dot\./.test(e)).length === 1, nr.events.slice(from).join('|'));
  }

  sub('with the sound off');
  {
    const z = H.loadApp();
    const zc = fast(z.ctx);
    zc.soundPrefs.voice = false;
    await zc.startAdventure();
    seedDone(zc, ['moon-1']);
    zc.pickDestination('moon');
    await zc.launch();
    await zc.tapMarker('slate');
    await traceLetter(zc, false);
    for(let k = 0; k < 200 && !(zc.session.run && zc.session.run.index === 1 && zc.session.input === 'open'); k++) await wait(2);
    await traceLetter(zc, false);
    for(let k = 0; k < 200 && !(zc.session.run && zc.session.run.index === 2); k++) await wait(2);
    T('a trace counts with the sound off: it is seen and done, not heard', zc.journey.evidence.some(e => e.id === 'handwriting.L.upper'));
  }

  sub('Reduce Motion');
  T('with Reduce Motion, Pip\'s letter appears stroke by stroke, whole, never drawn along', /motionReduced\(\)/.test(fnBody(js(), 'drawDemo')) &&
    /if\(isDot\(st\) \|\| reduced \|\|/.test(fnBody(js(), 'demoStroke')) && /stroke-dashoffset', '0'/.test(fnBody(js(), 'demoStroke')));

  sub('a reload in the middle of a letter');
  const shared = new Map();
  const m1 = H.loadApp({ sharedStorage: shared });
  const mc = fast(m1.ctx);
  await mc.startAdventure();
  seedDone(mc, ['moon-1', 'writer-1', 'moon-2', 'moon-3']);
  mc.saveCompletions();
  mc.pickDestination('moon');
  await mc.launch();
  await mc.tapMarker('slate');
  const mw = mc.session.write;
  mc.writeDown(mw.plan[0].pts[0]);
  for(let k = 1; k < mw.plan[0].pts.length / 2; k++) mc.writeMove(mw.plan[0].pts[k]);
  const again = H.loadApp({ sharedStorage: shared });
  T('reloaded mid-letter: nothing half-traced is saved, no completion is invented, and the app boots clean',
    again.errors.length === 0 && !again.ctx.missionDone('writer-2') && again.ctx.journey.evidence.every(e => e.skillId !== 'handwriting') && again.ctx.session.run === null,
    again.errors.join(' | '));

  sub('a letter that cannot be traced');
  const b = H.loadApp();
  const bc = fast(b.ctx);
  bc.LETTER_FORMS.L = [[['L', 0, 0, NaN, 1]]];
  T('content validation stops it at boot', bc.validateContent().some(x => /cannot be traced/.test(x)));
  await bc.startAdventure();
  seedDone(bc, ['moon-1']);
  bc.pickDestination('moon');
  await bc.launch();
  await bc.tapMarker('slate');
  for(let k = 0; k < 100 && bc.session.run && bc.session.run.index < 2; k++) await wait(2);
  T('and if it ever reached a child, it is passed over — never recorded as traced', bc.session.run && bc.session.run.index >= 2 &&
    bc.session.run.results.slice(0, 2).every(x => x.outcome === null) && !bc.journey.evidence.some(e => e.id === 'handwriting.L.upper'));
  T('no console errors', app.errors.length === 0 && m1.errors.length === 0, app.errors.concat(m1.errors).join(' | '));
}

/* =========================================================
   CONTRACT 51 — JUPITER, AND A JOURNEY THAT GROWS WITHOUT TAKING ANYTHING BACK
   The fourth world opens after Mars. A place's first visit shows every
   game it has; once everything open is restored, Launch goes where
   there is something new. A v0.5.0 journey opens with everything it had.
   ========================================================= */
function seedV050(storage, c){
  const ns = c.STORAGE_NAMESPACE, at = '2026-09-27T10:00:00.000Z';
  const ids = ['moon-1', 'moon-2', 'moon-3', 'mercury-1', 'mercury-2', 'mercury-3', 'mercury-4', 'mars-1', 'mars-2', 'mars-3', 'mars-4'];
  const done = ids.map((id, i) => ({ id: 'run_v050_' + i, missionId: id, destinationId: c.MISSIONS[id].destinationId, skillId: c.MISSIONS[id].skillId,
    startedAt: at, completedAt: at, updatedAt: at, rounds: 6, firstTry: 5, helped: 1, unscored: 0 }));
  const stars = done.map(x => ({ id: 'earn.' + x.id, kind: 'earn', amount: 3, runId: x.id, at: at, updatedAt: at }))
    .concat([{ id: 'spend.paint-sky', kind: 'spend', amount: 3, cosmeticId: 'paint-sky', at: at, updatedAt: at }]);
  const evidence = [
    { id: 'letter-recognition.M.upper', skillId: 'letter-recognition', item: 'M', form: 'upper', seen: 3, firstTry: 1, recent: [0, 1, 0], lastPracticed: at, updatedAt: at },
    { id: 'beginning-sounds.m.initial', skillId: 'beginning-sounds', item: 'm', form: 'initial', seen: 2, firstTry: 1, recent: [1, 0], lastPracticed: at, updatedAt: at },
    { id: 'cvc.map.build', skillId: 'cvc', item: 'map', form: 'build', seen: 1, firstTry: 1, recent: [1], lastPracticed: at, updatedAt: at }];
  const profile = { id: 'explorer', createdAt: at, updatedAt: at,
                    story: { 'arrived.moon': at, 'arrived.mercury': at, 'arrived.mars': at, 'shown.mars': at, 'heard.dockHint': at } };
  const put = (k, v) => storage.setItem(ns + k, JSON.stringify(v));
  put(c.KEYS.completions, done); put(c.KEYS.stars, stars); put(c.KEYS.evidence, evidence);
  put(c.KEYS.profile, profile); put(c.KEYS.rocket, { paint: 'paint-sky', updatedAt: at });
  storage.setItem(ns + c.KEYS.schemaVersion, String(c.DATA_SCHEMA_VERSION));
}
async function testJupiter(){
  section('CONTRACT 51 — Jupiter, and a journey that grows without taking anything back');
  const c = H.loadApp().ctx;
  const has = ids => ids.map((id, i) => ({ id: 'x' + i, missionId: id, completedAt: 't' }));

  sub('Jupiter');
  T('JUPITER / Sight words: a planet says what it teaches', c.focusLabel('jupiter') === 'Sight words');
  T('its sky sign hosts Star Words, its orbit ring Word Orbit', c.markerOf('jupiter-1') === 'skysign' && c.markerOf('jupiter-3') === 'skysign' &&
    c.markerOf('jupiter-2') === 'orbit' && c.markerOf('jupiter-4') === 'orbit');
  T('it hangs in Earth\'s sky clear of the HUD title, big enough for a small finger', c.DESTINATIONS.jupiter.sky.y > 20 && c.DESTINATIONS.jupiter.sky.size >= 10);
  T('its first trip is the light tunnel, the first arrival beyond the first stop', c.travelPlan({ from: 'earth', to: 'jupiter', first: true, flight: 1 }).motifs.indexOf('tunnel') !== -1);
  T('it is new in 0.6.0: a child who restored Mars before it existed is shown it arriving', c.DESTINATIONS.jupiter.newIn === '0.6.0');

  sub('where Launch goes');
  const restoring = ['moon-1', 'mercury-1', 'mercury-2', 'mars-1', 'mars-2', 'jupiter-1', 'jupiter-2'];
  T('with a place open and not yet restored, the first such', c.currentDestination(has(['moon-1', 'mercury-1', 'mercury-2'])) === 'mars');
  T('with every open place restored, the first with a mission not yet played — back to the Moon\'s slate and little letters',
    c.currentDestination(has(restoring)) === 'moon');
  T('with everything played, the last one open', c.currentDestination(has(Object.keys(c.MISSIONS))) === 'jupiter');

  sub('a place\'s first visit shows every game there');
  T('on the Moon: the beacon\'s first mission, then the writing slate\'s', (() => {
    const t = H.loadApp().ctx;
    t.session.visit = { dest: 'moon', played: true, restoredHere: true };
    t.journey.completions = has(['moon-1']);
    const first = t.markerNext('moon');
    t.journey.completions = has(['moon-1', 'writer-1']);
    return first === 'writer-1' && t.markerNext('moon') === null;
  })());
  T('a later visit, one mission — any not yet played first', (() => {
    const t = H.loadApp().ctx;
    t.session.visit = { dest: 'moon', played: false };
    t.journey.completions = has(['moon-1', 'writer-1']);
    return t.markerNext('moon') === 'moon-2';
  })());

  sub('a journey saved by v0.5.0');
  const shared = new Map();
  seedV050(H.makeLocalStorage(shared), c);
  const beforeKeys = new Map(shared);
  const up = H.loadApp({ sharedStorage: shared });
  const u = fast(up.ctx);
  T('it opens with no errors and nothing set aside as unreadable', up.errors.length === 0 && ![...shared.keys()].some(k => /unreadable/.test(k)), up.errors.join(' | '));
  T('everything it had: eleven missions, the Moon, Mercury and Mars restored', u.journey.completions.length === 11 &&
    ['moon', 'mercury', 'mars'].every(u.placeRestored));
  T('its stars, its rocket and its practice notes, unchanged', u.starBalance(u.journey.stars) === 30 && u.currentLook().paint === 'paint-sky' && u.journey.evidence.length === 3);
  T('nothing it finished is locked again', u.journey.completions.every(x => u.destinationUnlocked(x.destinationId, u.journey.completions)));
  T('Jupiter is open to it, and Launch goes there', u.destinationUnlocked('jupiter', u.journey.completions) && u.launchTarget() === 'jupiter');
  T('opening on Earth, Jupiter is shown arriving, once, and a flag remembers it',
    /class="sky-body is-new[^"]*" id="sky-jupiter"/.test(up.dom.document.getElementById('place' + u.session.slot + 'Sky').innerHTML) && u.storyFlag('shown.jupiter'));
  const changed = [...shared.keys()].filter(k => shared.get(k) !== beforeKeys.get(k));
  T('and only the profile learned that it was shown: nothing else was rewritten', changed.length === 1 && changed[0] === u.STORAGE_NAMESPACE + u.KEYS.profile, changed.join(','));
  const up2 = H.loadApp({ sharedStorage: shared });
  T('reloaded, it is not shown again', !/is-new/.test(up2.dom.document.getElementById('place' + up2.ctx.session.slot + 'Sky').innerHTML));
  T('the Moon\'s new missions wait for it: the writing slate first', u.markerNext('moon') === 'writer-1');
  T('its old evidence feeds the new review: /m/ needing help brings back a Word Builder word that starts with it',
    u.reviewPick({ type: 'word-build' }, ['fan', 'map', 'hat'], [{ id: 'beginning-sounds.m.initial', recent: [0, 0], lastPracticed: 't' }], []) === 'map');
}

/* =========================================================
   CONTRACT 52 — PICTURES BY WHEN THEY ARE NEEDED
   The offline cache installs the core. A world added later is fetched —
   and so kept offline — once its route is open or next to open, at every
   start while it is: never before it is near.
   ========================================================= */
function testAssetLoading(){
  section('CONTRACT 52 — pictures by when they are needed, kept offline once near');
  const c = H.loadApp().ctx;
  const has = ids => ids.map((id, i) => ({ id: 'x' + i, missionId: id, completedAt: 't' }));
  const ofWorld = (list, w) => list.filter(a => c.assetWorld(a) === w);
  T('a new explorer is not sent Jupiter\'s pictures: its route is far away', ofWorld(c.stageAssets([]), 'jupiter').length === 0);
  T('while Mars is the next to open, still not', ofWorld(c.stageAssets(has(['moon-1'])), 'jupiter').length === 0);
  T('once Mars is open, Jupiter is next: its pictures are fetched, and so kept offline before its route opens',
    ofWorld(c.stageAssets(has(['moon-1', 'mercury-1', 'mercury-2'])), 'jupiter').length === ofWorld(c.ASSET_REGISTRY, 'jupiter').filter(a => /^(horizon|planet|prop)\./.test(a.id)).length);
  T('the core\'s stage pictures are always fetched', c.ASSET_REGISTRY.filter(a => a.load === 'core' && /^(horizon|planet|bg|prop|rocket|character|place)\./.test(a.id))
    .every(a => c.stageAssets([]).indexOf(a) !== -1));
  T('the icons are never fetched by the page', c.stageAssets(has(Object.keys(c.MISSIONS))).every(a => a.load !== 'install'));
  T('fetched at every start, and whenever a route opens — so a new version\'s cache keeps an open world too',
    /setTimeout\(preloadStage/.test(js()) && /preloadStage\(\)/.test(fnBody(js(), 'finishMission')));
  T('and never twice for one picture: contract 54 plays it, with loads that fail, hang and recover', typeof c.preloadStage === 'function' && !!c.Preload);
  const manifest = fs.readFileSync(path.join(H.ROOT, 'docs', 'ASSET-MANIFEST.md'), 'utf8');
  T('ASSET-MANIFEST.md says when each picture is kept offline', /\| Kept offline \|/.test(manifest) && /when Jupiter is near/.test(manifest) && /at install only/.test(manifest));
}

/* =========================================================
   CONTRACT 53 — THE GROWN-UPS AREA: SEVEN SKILLS, IN PLAIN COUNTS
   ========================================================= */
function testGrownupsSeven(){
  section('CONTRACT 53 — the grown-ups area: seven skills, in plain counts');
  const app = H.loadApp();
  const c = app.ctx, d = app.dom.document;
  const e = (skill, item, form, recent) => ({ id: skill + '.' + item + '.' + form, skillId: skill, item: item, form: form, seen: recent.length,
                                              firstTry: recent.filter(x => x === 1).length, recent: recent, lastPracticed: '2026-09-27T10:00:00.000Z' });
  c.journey.evidence = [e('letter-recognition', 'M', 'upper', [1]), e('letter-recognition', 'M', 'lower', [0, 1]), e('letter-recognition', 'N', 'match', [1]),
    e('handwriting', 'L', 'upper', [1, 1]), e('handwriting', 'A', 'lower', [0]), e('sight-words', 'the', 'hear', [1]), e('sight-words', 'the', 'match', [1]),
    e('cvc', 'map', 'build', [1]), e('beginning-sounds', 'm', 'initial', [1]), e('rhyming', 'cake', 'rhyme', [1]), e('syllables', 'banana', 'beats', [1])];
  c.renderGrownups();
  const g = d.getElementById('gLetters').innerHTML, text = d.getElementById('gLetters').textContent;
  T('each of the seven skills is counted in plain words', ['Letters practiced', 'Rhyming words practiced', 'Syllable words practiced',
    'Beginning sounds practiced', 'Words built', 'Sight words practiced', 'Letters traced'].every(k => text.indexOf(k) !== -1));
  T('a letter counts once, whatever its case: M, m and N are two letters', /Letters practiced<\/span><span class="detail-value">2</.test(g));
  T('a traced letter says "traced"', /Traced 2 times/.test(text));
  T('a little letter shows little, and a pair as a pair', />m<\/span>/.test(g) && />N n<\/span>/.test(g));
  T('no grades, ranks or judgements: practice notes only', !/\b(grade|rank|score|behind|failing|weak|IQ|percent)\b/i.test(text.replace('These are practice notes, not a grade.', '')));
}

/* A MessageChannel stand-in: what one port posts arrives at the other's
   onmessage, on the next tick. */
class FakeChannel {
  constructor(){
    const a = { onmessage: null }, b = { onmessage: null };
    a.postMessage = d => setTimeout(() => { if(b.onmessage) b.onmessage({ data: d }); }, 0);
    b.postMessage = d => setTimeout(() => { if(a.onmessage) a.onmessage({ data: d }); }, 0);
    this.port1 = a; this.port2 = b;
  }
}
function clearPreloadTimers(c){
  if(c.Preload.retry.timer){ clearTimeout(c.Preload.retry.timer); c.Preload.retry.timer = null; }
  Object.keys(c.Preload.assets).forEach(k => { const r = c.Preload.assets[k]; if(r && r.timer){ clearTimeout(r.timer); r.timer = null; } });
  if(c.Updates.timer){ clearTimeout(c.Updates.timer); c.Updates.timer = null; }
}

/* =========================================================
   CONTRACT 54 — A WORLD'S PICTURES: TRIED AGAIN, AND KEPT ONLY WHEN STORED
   An independent audit found a picture that failed to load marked as
   done for good: eight failed Jupiter requests, and none again after the
   network came back. A picture that fails is tried again — when the
   network returns, when the app comes back to the front, and on a timer
   that backs off — never twice at once and never in a storm. A near
   world's pictures count as kept offline only when the service worker
   says it holds them: asked for, or even decoded, is not kept.
   ========================================================= */
async function testWorldKeeping(){
  section('CONTRACT 54 — a world\'s pictures: tried again, and kept only when stored');
  const isWorld = src => /jupiter|skysign|orbit|word-satellite/.test(src);
  /* the page's pictures load, fail or hang as the "network" says; the
     worker keeps what the network lets it fetch */
  const rig = () => {
    const net = { up: false, hang: false, requests: [], asks: [], kept: new Set(), storeWorks: true };
    const app = H.loadApp();
    const c = fast(app.ctx);
    c.window.Image = class {
      constructor(){ this.onload = null; this.onerror = null; }
      set src(v){ this._src = v; net.requests.push(v); if(net.hang) return;
        const ok = net.up || !isWorld(v); setTimeout(() => { const f = ok ? this.onload : this.onerror; if(f) f(); }, 0); }
      get src(){ return this._src; }
    };
    const worker = { state: 'activated', postMessage(msg, ports){ net.asks.push(msg.type); if(msg.type !== 'keep') return;
      (msg.paths || []).forEach(p => { if(net.storeWorks && (net.up || !isWorld(p))) net.kept.add(p); });
      ports[0].postMessage({ kept: (msg.paths || []).filter(p => net.kept.has(p)) }); } };
    c.MessageChannel = FakeChannel;
    c.navigator = { serviceWorker: { ready: Promise.resolve({ active: worker }), register: () => Promise.resolve({ active: worker }), addEventListener(){} } };
    seedDone(c, ['moon-1', 'mercury-1', 'mercury-2']);      // Mars open: Jupiter is next, so near
    return { app, c, net, worldReqs: () => net.requests.filter(isWorld).length };
  };

  const r = rig(), c = r.c;
  const world = c.stageAssets(c.journey.completions).filter(a => c.assetWorld(a) === 'jupiter');
  T('Jupiter is next on the route, so its eight pictures are wanted', world.length === 8, String(world.length));

  sub('the network is down');
  c.preloadStage();
  await wait(10);
  T('each of Jupiter\'s pictures is asked for once', r.worldReqs() === 8, String(r.worldReqs()));
  T('each is marked failed, and none is counted kept', world.every(a => c.Preload.assets[a.id] && c.Preload.assets[a.id].state === 'failed') &&
    world.every(a => !c.Preload.kept[a.path]));
  c.preloadStage(); c.preloadStage(); c.preloadStage();
  await wait(10);
  T('asking again straight away sends nothing: no storm', r.worldReqs() === 8, String(r.worldReqs()));
  T('a retry waits on a timer that backs off', !!c.Preload.retry.timer && c.Preload.retry.wait > c.PRELOAD_RETRY);
  T('the worker was asked to keep them once, and holds none', r.net.asks.filter(x => x === 'keep').length === 1 && r.net.kept.size === 0, r.net.asks.join(','));

  sub('the network comes back');
  r.net.up = true;
  c.window.dispatch('online');
  await wait(20);
  T('each failed picture is tried once more, at once', r.worldReqs() === 16, String(r.worldReqs()));
  T('and loads', world.every(a => c.Preload.assets[a.id].state === 'loaded'));
  T('the worker is asked again and now holds them — only then are they counted kept', world.every(a => c.Preload.kept[a.path]) && r.net.kept.size === 8);
  T('with nothing missing, no retry is left waiting', !c.Preload.retry.timer);
  c.preloadStage();
  await wait(10);
  T('a picture loaded and kept is not asked for again', r.worldReqs() === 16 && r.net.asks.filter(x => x === 'keep').length === 2, r.worldReqs() + ' ' + r.net.asks.join(','));
  clearPreloadTimers(c);

  sub('never twice at once');
  const h = rig();
  h.net.hang = true;
  h.c.preloadStage(); h.c.preloadStage(); h.c.preloadStage({ force: true });
  await wait(10);
  T('a picture still loading is never asked for a second time, even when forced', h.worldReqs() === 8, String(h.worldReqs()));
  const stuck = world.map(a => h.c.Preload.assets[a.id]);
  T('while loading it is pending, not failed and not kept', stuck.every(x => x && x.state === 'pending') && world.every(a => !h.c.Preload.kept[a.path]));
  T('a load that never answers has a give-up timer, so it can be tried again', stuck.every(x => !!x.timer));
  clearPreloadTimers(h.c);

  sub('loaded is not kept');
  const k = rig();
  k.net.up = true;
  k.net.storeWorks = false;
  k.c.preloadStage();
  await wait(20);
  T('every picture loaded in the page, but the worker could not store them: none is counted kept',
    world.every(a => k.c.Preload.assets[a.id].state === 'loaded') && world.every(a => !k.c.Preload.kept[a.path]));
  T('so a retry is waiting for them', !!k.c.Preload.retry.timer);
  clearPreloadTimers(k.c);

  sub('a first visit, before the worker has started');
  const f = rig();
  f.net.up = true;
  let start;
  const ready = new Promise(res => { start = res; });
  const worker = { state: 'activated', postMessage(msg, ports){ f.net.asks.push(msg.type); (msg.paths || []).forEach(p => f.net.kept.add(p)); ports[0].postMessage({ kept: msg.paths }); } };
  f.c.navigator = { serviceWorker: { ready: ready, register: () => ready, addEventListener(){} } };
  f.c.preloadStage();
  await wait(10);
  T('nothing is counted kept before there is a worker to keep it', world.every(a => !f.c.Preload.kept[a.path]));
  start({ active: worker });
  await wait(20);
  T('once the worker starts, in the same session, the near world is handed to it and kept', world.every(a => f.c.Preload.kept[a.path]));
  clearPreloadTimers(f.c);
  T('no console errors', [r, h, k, f].every(x => x.app.errors.length === 0), [r, h, k, f].map(x => x.app.errors.join('|')).join(' '));
}

/* =========================================================
   CONTRACT 55 — UPDATES ARRIVE BY THEMSELVES, AT A QUIET MOMENT
   A new version installs by itself and takes over only at a quiet
   moment: home on Earth, at rest, the child still. Never mid-mission,
   mid-letter or mid-flight; one reload per page and only into a newer
   version; a failed check changes nothing.
   ========================================================= */
async function testUpdates(){
  section('CONTRACT 55 — updates arrive by themselves, at a quiet moment');
  /* the browser's part: a service-worker container, a registration, and
     workers that answer "version" and take over on "activate" */
  const rig = waitingVersion => {
    const box = { reloads: 0, messages: [], updates: 0, failUpdate: false };
    const listeners = {};
    const container = { controller: {},
      addEventListener(t, fn){ (listeners[t] = listeners[t] || []).push(fn); },
      fire(t){ (listeners[t] || []).forEach(fn => fn({})); } };
    const reg = { waiting: null, installing: null, active: null, ls: {},
      addEventListener(t, fn){ (reg.ls[t] = reg.ls[t] || []).push(fn); },
      update(){ box.updates++; return box.failUpdate ? Promise.reject(new Error('no network')) : Promise.resolve(); } };
    const worker = version => {
      const w = { version: version, state: 'installed', ls: {},
        addEventListener(t, fn){ (w.ls[t] = w.ls[t] || []).push(fn); },
        setState(st){ w.state = st; (w.ls.statechange || []).forEach(fn => fn({})); },
        postMessage(msg, ports){ box.messages.push(msg.type + '@' + w.version);
          if(msg.type === 'version' && ports) ports[0].postMessage({ version: w.version });
          if(msg.type === 'activate'){ w.state = 'activated'; reg.waiting = null; reg.active = w; setTimeout(() => container.fire('controllerchange'), 0); } } };
      return w;
    };
    reg.active = worker('before');
    reg.active.state = 'activated';
    if(waitingVersion) reg.waiting = worker(waitingVersion);
    container.register = () => Promise.resolve(reg);
    container.ready = Promise.resolve(reg);
    /* a new version finishing its install while the app runs */
    box.install = version => { const w = worker(version); w.state = 'installing'; reg.installing = w;
      (reg.ls.updatefound || []).forEach(fn => fn({})); reg.installing = null; reg.waiting = w; w.setState('installed'); return w; };
    const sp = fakeSpeech();
    const app = H.loadApp({ windowExtras: sp.extras });
    const c = fast(app.ctx);
    c.MessageChannel = FakeChannel;
    c.navigator = { serviceWorker: container };
    c.location.reload = () => { box.reloads++; };
    if(waitingVersion === 'same') reg.waiting = worker(c.APP_VERSION);
    box.app = app; box.c = c; box.container = container; box.reg = reg; box.worker = worker;
    return box;
  };
  const activated = (b, v) => b.messages.indexOf('activate@' + v) !== -1;

  sub('a waiting worker of this page\'s own version');
  const same = rig('same');
  await same.c.startAdventure();
  await same.c.startUpdates();
  await wait(20);
  T('never while the page is still loading: its version is asked, nothing more (a browser can hold a takeover asked then)',
    same.messages.indexOf('version@' + same.c.APP_VERSION) !== -1 && !activated(same, same.c.APP_VERSION), same.messages.join(','));
  same.c.Updates.loadedAt = Date.now() - same.c.UPDATE_SETTLE - 1;
  same.c.applyUpdate();
  await wait(20);
  T('once the page has settled, at a quiet moment, it takes over — the page already is that version — and nothing reloads',
    activated(same, same.c.APP_VERSION) && same.reloads === 0, same.messages.join(','));
  T('and later versions are still looked for', same.c.Updates.moving === false && same.c.Updates.same === null);
  T('the app asked for a new version at launch', same.updates === 1);
  clearPreloadTimers(same.c);

  sub('a waiting worker of this page\'s own version that does not come in when asked');
  const held = rig('same');
  held.reg.waiting.postMessage = function(msg, ports){ held.messages.push(msg.type + '@' + held.c.APP_VERSION); if(msg.type === 'version' && ports) ports[0].postMessage({ version: held.c.APP_VERSION }); };
  await held.c.startAdventure();
  await held.c.startUpdates();
  await wait(10);
  held.c.Updates.loadedAt = Date.now() - held.c.UPDATE_SETTLE - 1;
  held.c.applyUpdate();
  await wait(10);
  T('asked at a quiet moment, it stays waiting: for now, nothing more is looked for', activated(held, held.c.APP_VERSION) && held.c.Updates.moving === 'quiet' && held.c.checkForUpdate(true) === false);
  held.c.Updates.askedAt = Date.now() - held.c.UPDATE_STALL - 1;
  held.c.watchTakeover();
  const lookedAgain = held.c.checkForUpdate(true);
  await wait(5);
  T('after a while the page stops waiting on it — nothing reloads, the page already is that version — and goes on looking for later versions',
    held.reloads === 0 && held.c.Updates.moving === false && held.c.Updates.same === null && lookedAgain === true && held.updates === 2, held.updates + ' ' + held.c.Updates.moving);
  clearPreloadTimers(held.c);

  sub('a first install: the worker goes straight in, it does not wait');
  const first = rig(null);
  await first.c.startAdventure();
  await first.c.startUpdates();
  await wait(10);
  const fw = first.install(first.c.APP_VERSION);
  fw.state = 'activated'; first.reg.waiting = null; first.reg.active = fw;     // nothing before it to wait for
  await wait(20);
  first.c.Updates.loadedAt = Date.now() - first.c.UPDATE_SETTLE - 1;
  const firstAsked = first.c.applyUpdate();
  const firstLooks = first.c.checkForUpdate(true);
  await wait(5);
  T('a worker already in is not asked to take over, nothing reloads, and later versions are still looked for',
    firstAsked === false && !activated(first, first.c.APP_VERSION) && first.c.Updates.moving === false && first.c.Updates.same === null &&
    firstLooks === true && first.updates === 2 && first.reloads === 0, first.messages.join(',') + ' moving ' + first.c.Updates.moving);
  clearPreloadTimers(first.c);

  sub('a newer version already waiting at launch, the child at rest on Earth');
  const idle = rig('9.9.9');
  await idle.c.startAdventure();
  await wait(5);
  await idle.c.startUpdates();
  await wait(20);
  T('not in the page\'s first moments', !activated(idle, '9.9.9') && idle.reloads === 0 && !!idle.c.Updates.timer);
  idle.c.Updates.loadedAt = Date.now() - idle.c.UPDATE_SETTLE - 1;
  idle.c.applyUpdate();
  await wait(20);
  T('then it takes over, and the page reloads once, into it', activated(idle, '9.9.9') && idle.reloads === 1, idle.messages.join(',') + ' reloads ' + idle.reloads);
  idle.container.fire('controllerchange');
  idle.container.fire('controllerchange');
  T('a worker taking over again never reloads twice: no loop', idle.reloads === 1);
  clearPreloadTimers(idle.c);

  sub('a newer version that finishes installing in the middle of a letter');
  const mid = rig(null);
  await mid.c.startAdventure();
  seedDone(mid.c, ['moon-1']);
  mid.c.pickDestination('moon');
  await mid.c.launch();
  await mid.c.tapMarker('slate');
  await mid.c.startUpdates();
  mid.c.Updates.loadedAt = Date.now() - mid.c.UPDATE_SETTLE - 1;
  const wt = mid.c.session.write;
  mid.c.writeDown(wt.plan[0].pts[0]);
  for(let q = 1; q < wt.plan[0].pts.length / 2; q++) mid.c.writeMove(wt.plan[0].pts[q]);
  mid.install('9.9.9');
  await wait(20);
  T('it installs and waits: the page asks its version and does not ask it to take over', mid.messages.indexOf('version@9.9.9') !== -1 && !activated(mid, '9.9.9') && mid.reloads === 0, mid.messages.join(','));
  T('the letter goes on, under the same finger', mid.c.session.write === wt && wt.t.down && wt.t.at > 5);
  T('it keeps looking for a quiet moment', !!mid.c.Updates.timer && mid.c.Updates.waiting !== null);
  await traceLetter(mid.c, false);
  await playMission(mid.c);
  T('the mission is finished, with nothing taken over and nothing reloaded', mid.c.missionDone('writer-1') && !activated(mid, '9.9.9') && mid.reloads === 0);
  for(let q = 0; q < 300 && mid.c.Voice.speaking(); q++) await wait(2);
  mid.c.Updates.touchedAt = 0;
  T('on the planet, even at rest with Pip quiet and no touch, a reload would move the child: still not',
    mid.c.currentScene === 'planet' && !mid.c.Voice.speaking() && !mid.c.session.busy && mid.c.Domain.safeToReload() === false &&
    mid.c.applyUpdate() === false && mid.reloads === 0);
  await mid.c.flyHome();
  await wait(5);
  mid.c.Updates.touchedAt = 0;
  T('home on Earth, at rest: at the next look it takes over, and the page reloads once', mid.c.currentScene === 'earth' && mid.c.applyUpdate() === true);
  await wait(20);
  T('into the new version', activated(mid, '9.9.9') && mid.reloads === 1, mid.messages.join(','));
  clearPreloadTimers(mid.c);

  sub('never in the station, nor with a grown-ups page open');
  const where = rig(null);
  await where.c.startAdventure();
  await wait(5);
  const earthQuiet = where.c.Domain.safeToReload();
  await where.c.openDock();
  for(let q = 0; q < 300 && where.c.Voice.speaking(); q++) await wait(2);
  const stationQuiet = where.c.Domain.safeToReload();
  await where.c.leaveDock();
  for(let q = 0; q < 300 && where.c.Voice.speaking(); q++) await wait(2);
  where.c.openGrownups();
  const grownupsQuiet = where.c.Domain.safeToReload();
  T('home on Earth at rest is a quiet moment; the space station (something may be tried on) and an open grown-ups page are not',
    earthQuiet === true && where.c.currentScene === 'earth' && stationQuiet === false && grownupsQuiet === false,
    [earthQuiet, stationQuiet, grownupsQuiet].join(','));
  clearPreloadTimers(where.c);

  sub('a world\'s picture still loading');
  const loading = rig(null);
  await loading.c.startAdventure();
  await wait(5);
  for(let q = 0; q < 300 && loading.c.Voice.speaking(); q++) await wait(2);
  const restQuiet = loading.c.Domain.safeToReload();
  const hung = [];
  loading.c.window.Image = class { set src(v){ this._src = v; hung.push(this); } get src(){ return this._src; } };
  seedDone(loading.c, ['moon-1', 'mercury-1', 'mercury-2']);      // Jupiter is next, so near
  loading.c.preloadStage();
  const loadingQuiet = loading.c.Domain.safeToReload();
  hung.forEach(im => { if(im.onload) im.onload(); });
  await wait(5);
  T('while a picture is still loading, home on Earth is not yet quiet (the old worker has it in hand); once it has loaded, it is',
    restQuiet === true && hung.length > 0 && loadingQuiet === false && loading.c.Domain.safeToReload() === true,
    [restQuiet, hung.length, loadingQuiet, loading.c.Domain.safeToReload()].join(','));
  clearPreloadTimers(loading.c);

  sub('the child still touching');
  const touch = rig('9.9.9');
  await touch.c.startAdventure();
  await wait(5);
  await touch.c.startUpdates();
  await wait(10);
  touch.c.Updates.loadedAt = Date.now() - touch.c.UPDATE_SETTLE - 1;
  touch.c.Updates.touchedAt = Date.now();
  touch.c.applyUpdate();
  await wait(20);
  T('a touch just now: it waits until the child has been still', !activated(touch, '9.9.9') && touch.reloads === 0);
  touch.c.Updates.touchedAt = Date.now() - touch.c.UPDATE_IDLE - 1;
  touch.c.applyUpdate();
  await wait(20);
  T('then it takes over', activated(touch, '9.9.9') && touch.reloads === 1);
  clearPreloadTimers(touch.c);

  sub('coming back to the front, again and again');
  const fg = rig(null);
  await fg.c.startAdventure();
  await fg.c.startUpdates();
  await wait(10);
  for(let q = 0; q < 12; q++) fg.app.dom.document.dispatch('visibilitychange');
  await wait(10);
  T('the app asks for a new version at most every so often, not every time', fg.updates === 1, String(fg.updates));
  fg.c.Updates.checkedAt = Date.now() - fg.c.UPDATE_EVERY - 1;
  fg.app.dom.document.dispatch('visibilitychange');
  await wait(10);
  T('and asks again once that time has passed', fg.updates === 2, String(fg.updates));
  fg.failUpdate = true;
  fg.c.Updates.checkedAt = 0;
  fg.app.dom.document.dispatch('visibilitychange');
  await wait(20);
  T('with no network the check fails quietly: the same version, nothing reloaded, no error', fg.updates === 3 && fg.reloads === 0 && fg.app.errors.length === 0 && fg.c.currentScene === 'earth');
  T('and nothing was taken over', fg.messages.every(m => !/^activate/.test(m)));
  clearPreloadTimers(fg.c);

  sub('a newer version that does not come in when asked');
  const stuck = rig('9.9.9');
  stuck.reg.waiting.postMessage = function(msg, ports){ stuck.messages.push(msg.type + '@9.9.9'); if(msg.type === 'version' && ports) ports[0].postMessage({ version: '9.9.9' }); };
  stuck.c.history = { state: null, replaceState(st){ this.state = st; }, pushState(){}, back(){} };
  await stuck.c.startAdventure();
  await stuck.c.startUpdates();
  await wait(10);
  stuck.c.Updates.loadedAt = Date.now() - stuck.c.UPDATE_SETTLE - 1;
  stuck.c.applyUpdate();
  await wait(10);
  T('asked at a quiet moment, it does not come in: nothing is forced at once', activated(stuck, '9.9.9') && stuck.reloads === 0 && stuck.c.Updates.moving === 'asked');
  T('a moment later, still nothing forced', stuck.c.watchTakeover() === false && stuck.reloads === 0);
  stuck.c.Updates.askedAt = Date.now() - stuck.c.UPDATE_STALL - 1;
  stuck.c.openGrownups();
  T('after a while, but with a grown-ups page open: it waits', stuck.c.watchTakeover() === false && stuck.reloads === 0 && stuck.c.Updates.moving === 'asked');
  stuck.c.closeGrownups();
  for(let q = 0; q < 300 && stuck.c.Voice.speaking(); q++) await wait(2);
  stuck.c.Updates.touchedAt = Date.now();
  T('home on Earth again, but the child touched the screen just now: it waits', stuck.c.watchTakeover() === false && stuck.reloads === 0 && stuck.c.Updates.moving === 'asked');
  stuck.c.Updates.touchedAt = Date.now() - stuck.c.UPDATE_IDLE - 1;
  T('after a while, at a quiet moment again, the page reloads once — a navigation lets it in — and marks this tab',
    stuck.c.Domain.safeToReload() === true &&
    stuck.c.watchTakeover() === true && stuck.reloads === 1 && !!(stuck.c.history.state && stuck.c.history.state.updateReloadAt));
  /* the reloaded page: the same tab, the same stubborn worker */
  stuck.c.Updates.moving = false;
  stuck.c.applyUpdate();
  stuck.c.Updates.askedAt = Date.now() - stuck.c.UPDATE_STALL - 1;
  stuck.c.watchTakeover();
  T('a stubborn one is never forced twice in a row: the next launch brings it in', stuck.reloads === 1 && stuck.c.Updates.moving === 'stalled');
  clearPreloadTimers(stuck.c);

  sub('a version that failed to install');
  const bad = rig('9.9.9');
  await bad.c.startAdventure();
  bad.reg.waiting.state = 'redundant';
  bad.c.Updates.waiting = bad.reg.waiting;
  T('a waiting worker that turned redundant is dropped, and nothing reloads', bad.c.applyUpdate() === false && bad.c.Updates.waiting === null && bad.reloads === 0 && !activated(bad, '9.9.9'));
  clearPreloadTimers(bad.c);

  sub('what stays');
  const keep = rig('9.9.9');
  await keep.c.startAdventure();
  const saved = () => JSON.stringify([...keep.app.storage._map.entries()].sort());
  const beforeKeys = saved();
  await keep.c.startUpdates();
  keep.c.Updates.loadedAt = Date.now() - keep.c.UPDATE_SETTLE - 1;
  keep.c.applyUpdate();
  await wait(20);
  T('taking over touches no saved record: progress, stars, the rocket and settings are all as they were',
    saved() === beforeKeys && beforeKeys.length > 20 && !/localStorage|Store\.(set|remove)/.test(fnBody(js(), 'applyUpdate') + fnBody(js(), 'considerUpdate') + fnBody(js(), 'startUpdates')));
  T('nothing about updates is ever shown or said to a child', !/Voice\.say|toast\(|setHtml\(/.test(fnBody(js(), 'applyUpdate') + fnBody(js(), 'considerUpdate') + fnBody(js(), 'startUpdates') + fnBody(js(), 'checkForUpdate')));
  clearPreloadTimers(keep.c);
  const rigs = [same, held, first, idle, mid, where, loading, touch, fg, stuck, bad, keep];
  T('no console errors', rigs.every(b => b.app.errors.length === 0), rigs.map(b => b.app.errors.join('|')).join(' '));
}

/* =========================================================
   CONTRACT 56 — THE SERVICE WORKER: INSTALLS WHOLE, WAITS, KEEPS WHAT IT HOLDS
   Played in a sandbox with a fake network and fake caches: sw.js itself,
   not a reading of it. A half-downloaded version must never replace one
   that works offline; a server error must never stand in for a file.
   ========================================================= */
async function testWorker(){
  section('CONTRACT 56 — the service worker: installs whole, waits, keeps only what it holds');
  const vm = require('vm');
  const BASE = 'https://example.github.io/app/sw.js';
  const mk = status => {
    const handlers = {}, stores = new Map(), fetched = [];
    let skipped = 0, claimed = 0;
    const net = { offline: false, status: status || (() => 200) };
    const keyOf = r => (typeof r === 'string' ? new URL(r, BASE).href : r.url);
    const res = (url, st) => ({ url: url, status: st, ok: st >= 200 && st < 300, clone(){ return this; } });
    const sandbox = {
      URL, Set, Map, Promise, Array, String, Object, TypeError, Error,
      location: { href: BASE, origin: 'https://example.github.io' },
      Request: function(u, init){ this.url = new URL(u, BASE).href; this.cache = (init && init.cache) || 'default'; this.method = 'GET'; },
      fetch: (r, init) => {
        const url = keyOf(r);
        fetched.push({ url: url, cache: (init && init.cache) || r.cache || 'default' });
        if(net.offline) return Promise.reject(new TypeError('offline'));
        return Promise.resolve(res(url, net.status(url)));
      }
    };
    const cacheOf = name => {
      if(!stores.has(name)) stores.set(name, new Map());
      const m = stores.get(name);
      return { match: r => Promise.resolve(m.get(keyOf(r))), put: (r, v) => { m.set(keyOf(r), v); return Promise.resolve(); },
               keys: () => Promise.resolve([...m.keys()].map(u => ({ url: u }))),
               addAll: reqs => Promise.all(reqs.map(q => sandbox.fetch(q))).then(list => {
                 if(list.some(x => !x.ok)) throw new TypeError('a response was not ok');
                 list.forEach((x, i) => m.set(keyOf(reqs[i]), x)); }) };
    };
    sandbox.caches = { open: n => Promise.resolve(cacheOf(n)), keys: () => Promise.resolve([...stores.keys()]),
                       delete: n => Promise.resolve(stores.delete(n)),
                       match: r => Promise.resolve([...stores.values()].map(m => m.get(keyOf(r))).find(Boolean)) };
    sandbox.self = { addEventListener: (t, fn) => { handlers[t] = fn; }, location: sandbox.location,
                     skipWaiting: () => { skipped++; return Promise.resolve(); }, clients: { claim: () => { claimed++; return Promise.resolve(); } } };
    vm.runInNewContext(H.readSW(), sandbox, { filename: 'sw.js' });
    const run = (type, ev) => { handlers[type](ev); return ev.p || Promise.resolve(); };
    return { handlers, stores, fetched, net, sandbox, run, res, keyOf, skipped: () => skipped, claimed: () => claimed };
  };
  const evt = extra => Object.assign({ waitUntil(p){ this.p = p; }, respondWith(p){ this.p = p; } }, extra || {});
  const c = H.loadApp().ctx;
  const cacheName = c.CACHE_NAMESPACE;

  sub('installing');
  const w = mk();
  await w.run('install', evt());
  const own = w.stores.get(cacheName);
  const assets = w.sandbox.ASSETS || [];
  T('it stores every file the app needs', !!own && own.size >= 80, own ? String(own.size) : 'no cache');
  T('each fetched fresh from the server, not from the browser\'s HTTP cache', w.fetched.length > 0 && w.fetched.every(f => f.cache === 'reload'));
  T('and it does not take over by itself', w.skipped() === 0);
  const broken = mk(url => (/manifest\.webmanifest/.test(url) ? 404 : 200));
  let failed = false;
  await broken.run('install', evt()).catch(() => { failed = true; });
  T('one file missing and the install fails: the version already working stays', failed);
  const off = mk();
  off.net.offline = true;
  let failedOff = false;
  await off.run('install', evt()).catch(() => { failedOff = true; });
  T('no network and the install fails too', failedOff);

  sub('taking over');
  const t = mk();
  const oldName = cacheName.replace(/-v[\d.]+$/, '-v0.5.0');
  const oldCache = new Map([[new URL('assets/props/orbit.webp', BASE).href, t.res('x', 200)], [new URL('assets/props/skysign.webp', BASE).href, t.res('y', 503)]]);
  t.stores.set(oldName, oldCache);
  t.stores.set('another-app-v1.0.0', new Map([['https://example.github.io/other/a.png', t.res('z', 200)]]));
  await t.run('install', evt());
  await t.run('activate', evt());
  const fresh = t.stores.get(cacheName);
  T('this app\'s older cache is gone, another app\'s is left alone', !t.stores.has(oldName) && t.stores.has('another-app-v1.0.0'));
  T('a world\'s picture it held is carried into the new cache', !!fresh.get(new URL('assets/props/orbit.webp', BASE).href));
  T('a server error it held is not', !fresh.get(new URL('assets/props/skysign.webp', BASE).href));
  T('it takes charge of the open pages', t.claimed() === 1);

  sub('what the app may ask');
  const m = mk(url => (/skysign/.test(url) ? 503 : 200));
  await m.run('install', evt());
  const replies = [];
  const port = { postMessage: d => replies.push(d) };
  await m.run('message', evt({ data: { type: 'version' }, ports: [port] }));
  T('"version": the version it serves, from its cache name', replies[0] && replies[0].version === c.APP_VERSION, JSON.stringify(replies[0]));
  await m.run('message', evt({ data: { type: 'activate' }, ports: [port] }));
  T('"activate": it takes over, and only when asked', m.skipped() === 1);
  const before = m.fetched.length;
  await m.run('message', evt({ data: { type: 'keep', paths: ['assets/props/orbit.webp', 'assets/props/skysign.webp', 'index.html', 'https://elsewhere.example/x.webp'] }, ports: [port] }));
  const kept = replies[replies.length - 1].kept;
  const asked = m.fetched.slice(before).map(f => f.url);
  T('"keep": only this app\'s own pictures are fetched — never a page, never another site', asked.length === 2 && asked.every(u => /\/app\/assets\//.test(u)), asked.join(' '));
  T('it answers with the ones it now holds, and not the one that failed', JSON.stringify(kept) === JSON.stringify(['assets/props/orbit.webp']), JSON.stringify(kept));
  m.net.status = () => 200;
  await m.run('message', evt({ data: { type: 'keep', paths: ['assets/props/orbit.webp', 'assets/props/skysign.webp'] }, ports: [port] }));
  T('asked again once the server answers, it holds both', JSON.stringify(replies[replies.length - 1].kept) === JSON.stringify(['assets/props/orbit.webp', 'assets/props/skysign.webp']));

  sub('fetching');
  const f = mk(url => (/orbit/.test(url) ? 503 : 200));
  await f.run('install', evt());
  const pic = new URL('assets/props/orbit.webp', BASE).href;
  const got = await f.run('fetch', evt({ request: { url: pic, method: 'GET', mode: 'no-cors' } }));
  T('a server error is passed on, but never stored in place of the file', got && got.status === 503 && !f.stores.get(cacheName).get(pic));
  const nav = new URL('./', BASE).href;
  const before2 = f.fetched.length;
  await f.run('fetch', evt({ request: { url: nav, method: 'GET', mode: 'navigate' } }));
  T('the page itself is asked of the server afresh, never an old copy from the HTTP cache', f.fetched.slice(before2).some(x => x.url === nav && x.cache === 'no-cache'));
  f.net.offline = true;
  const offPage = await f.run('fetch', evt({ request: { url: nav, method: 'GET', mode: 'navigate' } }));
  T('offline, the page comes from the cache', !!offPage && offPage.ok);

  sub('one version offline, whatever was seen online');
  const v = mk();
  await v.run('install', evt());
  const home = new URL('./index.html', BASE).href, horizon = new URL('assets/horizons/moon.webp', BASE).href;
  const installedPage = v.stores.get(cacheName).get(home), installedHorizon = v.stores.get(cacheName).get(horizon);
  const n0 = v.fetched.length;
  const newer = await v.run('fetch', evt({ request: { url: home, method: 'GET', mode: 'navigate' } }));
  const fresher = await v.run('fetch', evt({ request: { url: horizon, method: 'GET', mode: 'no-cors' } }));
  await new Promise(res => setTimeout(res, 5));
  T('online, the page and a picture come fresh from the server', !!newer && newer.ok && newer !== installedPage && !!fresher && fresher !== installedHorizon &&
    v.fetched.length === n0 + 2);
  T('but neither replaces what this version installed: a newer deploy whose install failed can never be half-served offline',
    !!installedPage && !!installedHorizon && v.stores.get(cacheName).get(home) === installedPage && v.stores.get(cacheName).get(horizon) === installedHorizon);
  const world = new URL('assets/props/orbit.webp', BASE).href;
  await v.run('fetch', evt({ request: { url: world, method: 'GET', mode: 'no-cors' } }));
  await new Promise(res => setTimeout(res, 5));
  T('a picture this version did not install (a world\'s) is kept when fetched', !!v.stores.get(cacheName).get(world));
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
  testAudioSystem, testWordBase, testSoundScout, testWordBuilder, testMars, testReview, testSoundDesign,
  testLetterforms, testLetterCases, testSightWords, testTracing, testMoonWriter, testJupiter, testAssetLoading, testGrownupsSeven,
  testWorldKeeping, testUpdates, testWorker
};
