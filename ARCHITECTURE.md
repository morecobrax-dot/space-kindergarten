# Architecture

How Space Kindergarten is put together, and where new work goes. The first
half describes the foundation inherited from app-starter, which is still true.
The second half describes the product built on it.

---

## The shape of `index.html`

The whole application is one file with four blocks, in this order:

| Block | Contains |
|---|---|
| `<head>` | Meta, viewport, manifest link. The block between `APP-META-BEGIN/END` is **derived**, written by `config:sync`. |
| One `<style>` | Design tokens, adult-area controls, the child's scenes, overlay presentation, toast, responsive rules. |
| `<body>` markup | The world stage, the child's HUD, six scenes, the rotate prompt, and every overlay, all declared statically. Everything else is generated. |
| One `<script>` | Foundation (config, storage, migration, overlays, toast, confirmation, navigation), then the product, then settings, utilities and boot. |

**Keep it to one substantial `<script>` block.** The test harness evaluates
only the largest one. Code in a second block, or in a linked `.js` file, is
invisible to every contract, and the suite still passes. A contract asserts
this.

**Size.** At v0.6.0 the file is about 535 KB (about 149 KB gzipped, which is
how GitHub Pages sends it). It was measured against splitting: the harness
reads one script block; offline would need every split file precached in
step; and a first visit downloads the same bytes either way, with a repeat
visit coming from the service-worker cache. Splitting would add a second
source of truth for no measured gain, so the file stays whole. It is
revisited if first paint on an iPad is ever measured to suffer.

## The foundation

### Identity

`APP_CONFIG` is the single source. `id` (`space-kindergarten`) is
**permanent**: the storage namespace and cache name derive from it, so
changing it would orphan every child's progress. `name` is a working title and
can change freely.

```
APP_CONFIG.id ──┬── STORAGE_NAMESPACE   `space-kindergarten.`
                ├── CACHE_NAMESPACE     `space-kindergarten-v<version>`
                └── package.json name
APP_UPDATES[0].version ── APP_VERSION
APP_CONFIG.name/shortName/description/themeColor/orientation ── <head>, manifest
ASSET_REGISTRY ──┬── sw.js precache list
                 └── docs/ASSET-MANIFEST.md
```

`npm run config:sync` writes all of these; `npm run config:verify` (inside
`npm run verify`) fails on drift. Sync also refuses to run if a registered
asset file is missing, because `cache.addAll()` is all-or-nothing: one missing
file and the app silently stops working offline.

### Tokens

The design tokens have four layers in one `:root`: brand, semantic, scale and
domain. Components read roles, never colours. Contracts forbid:

- a raw `font-family` outside the tokens
- a raw `font-size` outside the scale
- a hex colour outside the token block

The child has its own scale:

- **Type:** `--fs-kid-*`, `--fs-hud-*` and `--fs-glyph`.
- **Touch targets:** `--touch-kid` (76px) and `--touch-hero` (112px).
  A mark can be smaller than its target: the HUD's marks are `--hud-mark`.
- **Tiles:** `--tile-size` before a play field is measured.
- **The viewport a child can see:** `--vh` and `--vw`, measured by
  `fitViewport()` into `--app-h` and `--app-w`, and `--ui`, which scales
  marks and type (never targets) on a short screen. The child world never
  uses raw `vh`/`vw`: on iPad Safari 100vh is taller than the visible page.

### Overlay engine

One `MutationObserver` owns scroll lock, focus, stacking, ARIA and Escape for
every `.overlay`. To add a surface, declare `.overlay` + `.sheet`, give it a
`close*()` function, and toggle `.open`. Never add a lock/unlock pair.

Surfaces in this product:

- **Child:** `homeSheet`, the "go back to Earth?" sheet.
- **Grown-up pages:** `grownupOverlay`, `dataOverlay`, `updatesOverlay`.
- **Shared:** `confirmOverlay`.

### Storage

There is one adapter, and every key is prefixed with the app id. `set()`
returns a real boolean, and a missing key reads `null` and is never repaired.
Migrations are keyed by the version they upgrade from; `DATA_SCHEMA_VERSION`
is `1`. Backup import merges any collection of records that carry an `id`,
with the newest `updatedAt` winning.

### Navigation

Navigation uses scenes, not tabs. `showScene(name)` validates before hiding
anything, keeps exactly one scene active, and marks the rest `aria-hidden`.

### The seam

The foundation reaches the product only through `Domain.hydrate / render /
wire / safeToReload`. A contract proves that the foundation's code names
nothing from the product.

### Updates and the service worker

A new release reaches an installed app by itself (`UPDATES`, at the end of
the script; `sw.js`):

1. **Checking.** The worker is registered at load. The app asks for a new
   version at launch (`checkForUpdate(true)`) and whenever it comes back to
   the front, at most every `UPDATE_EVERY` (10 minutes). No network: the
   check fails quietly and nothing changes.
2. **Installing.** A new worker precaches every file fresh from the server
   (`cache: 'reload'`), all or nothing: one missing file and the install
   fails, and the version already working stays. It then **waits**; it
   never takes over by itself (no `skipWaiting` on install).
3. **Deciding.** The app asks a waiting worker its version (a `version`
   message on a `MessageChannel`). Whatever the answer, it moves in only
   at a quiet moment: never within `UPDATE_SETTLE` (4 s) of the page
   loading; `Domain.safeToReload()` (the product: home on Earth, at rest,
   Pip quiet, no mission, flight, station or grown-ups page, no picture
   still loading); and no touch for `UPDATE_IDLE` — looked for every
   `UPDATE_POLL` and whenever the app comes to the front. The page's own
   version (the page came fresh from the network) moves in with no reload;
   a newer one with one. Only a worker still waiting (`installed`) counts:
   a first install's worker passes straight through it and goes in.
4. **Taking over.** The app sends `activate`; the worker takes over, carries
   the non-precached pictures of older caches into its own
   (`carryPictures()`), deletes only this app's older caches, and claims the
   page. Taking over is asynchronous — a held worker can come in long
   after the ask, with the child playing again — so `controllerchange`
   only records it: a newer version the page asked for (or a held one come
   in late) is `'arrived'`, and the page owes one reload. The reload waits
   for a quiet moment checked at that instant (`quietNow()`: the
   product's `safeToReload()` and no touch for `UPDATE_IDLE`), is looked
   for by the same poll, and happens **once**; until then the child plays
   on, nothing frozen. It does not depend on the worker still waiting. A
   first install or a same-version takeover owes no reload.
5. **A takeover the browser holds.** Asked while the old worker still has
   work in hand, Chromium can keep the new worker waiting until the next
   navigation. The first real rollout (v0.6.0 → v0.6.1) did exactly that:
   a same-version worker asked about 85 ms after load stayed waiting until
   the app was next opened. Hence the settle time and the no-picture-loading
   rule. As a net under them (`watchTakeover()`): a newer version still
   not in after `UPDATE_STALL` (8 s) gets one reload, at a quiet moment —
   a navigation lets it in — marked on this tab's history entry
   (`updateReloadAt`), so a stubborn one is never forced twice within
   `UPDATE_EVERY`: the page stops trying (`'stalled'`) and the next launch
   brings it in — or, if it comes in first, it is `'arrived'` like any
   other. A held worker of the page's own version would change
   nothing on screen, so the page just stops waiting on it and goes on
   looking for later versions.

Both a worker already waiting at launch and one that finishes installing
later (`updatefound` → `installed`) are handled. Nothing is shown or said
to a child; the grown-ups area shows the version. The browser runs none of
this while the app is closed.

**What the worker stores.** The precache, as installed; at runtime, only a
good (`ok`) answer for a file the version did not install (a world's
picture) — never a page, never a server error, never over an installed
file — so offline is always one version, even after a newer version's
install failed. The page itself is fetched with `cache: 'no-cache'`, so
the browser's HTTP cache cannot bring an old page back after an update.
**What the app may ask it** (`message`, answered on the port sent):
`version`, `activate`, and `keep` (store these pictures, and say which
it now holds).

---

## The product

The product section sits between the `PRODUCT DOMAIN` and `SETTINGS` banners.
Each layer reads only the ones above it.

| Layer | What it is | Rule |
|---|---|---|
| **ASSETS** | `ASSET_REGISTRY`: every picture, its source, licence, state and when it is fetched (`load`) | The only place an asset path is written. A contract enforces it. |
| **CONTENT** | `SKILLS`, `LETTERS`, `LETTER_FORMS` (how every letter is written), `PHONEMES`, `WORDS` (the one word knowledge base), `WORD_LISTS`, `DESTINATIONS`, `MISSIONS`, `TRAVEL_ART`, `COSMETIC_SLOTS`, `COSMETICS`, `VOICE_CUES` and the line templates | Data only. Checked by `validateContent()` at boot and in the contracts. |
| **ENGINE** | Rounds, difficulty, the help ladder, evidence, review picks, progress and restoring, the star ledger, looks, what a place teaches, the school print's geometry, tracing | Pure functions: no DOM, no storage, seeded randomness. |
| **JOURNEY** | The child's saved state (`journey`) | Five keys, each written only by its owner. |
| **AUDIO** | `Voice`, `AUDIO_TYPES`, `audioRoute()`, `AudioOut`, `DevVoice` and the synthesiser, `MediaVoice`, `Sfx`, `TIMING` | Every line is a typed cue: a recording if one exists; a phonics cue then the development phonics voice, anything else the device voice (temporary); otherwise a caption. A phonics cue never reaches the device voice. Each type sits in time by `AUDIO_TYPES`. [docs/AUDIO.md](docs/AUDIO.md) |
| **SCENES** | The HUD; the world stage, flights and the resting-stage check; welcome, Earth, travel, a planet, a mission, the space station; one view per activity type; the play-field fit | Controllers return promises, so a contract can walk the journey. |
| **GROWN-UPS** | Hold gate, progress, sound, motion, data, about | Behind a 3-second hold, with erasing behind a confirmation too. |

### Content model

```
Skill        { label, short, status: 'active' | 'planned',   seven named, all active;
               firstTry, shows, practiced, did? }            `short` is a child's word;
                                                             `practiced` the grown-ups count
Letter       { speak (its NAME), sound (its SOUND,           a name and a sound are
               a Phoneme id), family, lookalikes,            different things; `lower`
               lower{ family, lookalikes }, ambiguous? }     is the little letter's shape
LetterForm   LETTER_FORMS['M'] / ['m']: strokes[], each a    how it is WRITTEN, apart from
               list of segments ['L',x1,y1,x2,y2] |          how it is drawn: the print,
               ['A',cx,cy,rx,ry,from°,to°] | ['D',x,y]       the demo and the trace all
               in writing-line units (top 0, middle 0.5,     read it
               base 1, tail 1.45), in stroke order
Phoneme      { ipa, kind: 'continuous'|'stop'|'vowel',       the sounds; `spelling` ones
               example, spelling? }                          are never asked for alone
Word         { speak, picture?, rime, onset, beats[],        THE word knowledge base:
               phonemes[], level?, reviewed?,                every game reads it; CVC is
               sight?{ list } }                              derived (isCvc()); a sight
                                                             word has no picture and
                                                             names its WORD_LISTS source;
                                                             decodability is derived
                                                             (soundsOutByLetter(),
                                                             decodableHere())
Destination  { id, kind: 'home' | 'destination' | 'station'  the STORY layer
                   | 'planned', name, label, tagline?,
               asset, restoredAsset, horizon, sky{x,y,size},
               primarySkill, reviewSkills, missions[], restore[],
               unlock{after}, firstTrip?, newIn?,
               markers{ key: { missions[], asset, litAsset,        a marker is one game; its
                               at, height, foot, call } },         missions come in order
               story{ lines } }
  station    { room, outside, bay, turntable, window{earth} } the Rocket Dock, as a place
Mission      { id, destinationId, skillId, title, task,      the LEARNING layer;
               howTo, choices, difficulty{min,max},          title and task are the HUD's
               reward{stars}, activities[] }
CosmeticSlot { id: 'paint' | 'gear' | 'theme', label, speak }
Cosmetic     { id, slot, name, cost, starter?,               one of each slot is worn;
               tint? | art? | pattern?, focus? }             focus: where a gear chip zooms
Activity     { type, target | sound, answer?, form?,          authored targets; `review`
               from?, help?, guided?, review[]? }            lists what a review may ask;
                                                             form: upper|lower, from: the
                                                             case shown (a pair), help:
                                                             full|light (a trace)
ActivityType { skillId, repeatable?, validate, evidenceKey,  ACTIVITY_TYPES registry;
               promptCue, buildRound, check?, valid?,        check/valid: a many-tap answer;
               silentOk? }                                   silentOk: seen, not heard, so
                                                             evidence with the voice off
GameView     { draw, ask, guide, again, praise, correct,     GAME_VIEWS: one per type,
               wrong, retry, show, progressWord, lead? }     in SCENES; lead: before the
                                                             question (Pip writes first)
VoiceCue     { id, type, text (on screen, or null),        `voiceCue(id)` builds
               speak (script), locale, file, sounds? }       value-carrying lines;
                                                             `sounds` for phonics cues
```

**Adding a skill** means adding one `ACTIVITY_TYPES` entry, content, and one
`GAME_VIEWS` entry: how its round is drawn and what Pip says at each step of
the help ladder. `choose()`, the ladder, evidence, praise rotation and the
reprompts are shared; no scene is rewritten.

**Adding a destination** means adding a `DESTINATIONS` entry with its two
sky pictures, a horizon, a marker per game (each listing its missions), the
story missions that restore it, and its story lines, and appending it to
`JOURNEY_ORDER`. The world stage draws it from that data: no scene names a
place. A destination added after children may already have opened its
route says so (`newIn`), and Earth shows it arriving once
(`catchUpReveal()`).

**Adding missions to a place** never takes anything back: a place is
restored by its `restore` missions, so a new mission is more to play, not a
new lock. Until a place is restored, its story missions follow one another
in the same visit; once it is, it offers one mission a visit (unplayed ones
first, then each in turn: `markerNext()`).

**Review** (`reviewActivity()`, pure): an activity with a `review` list asks,
when its round begins, the candidate whose recent answers needed help most
often, then the one practiced longest ago, never one already asked in the
run. `reviewLinks()` says which evidence counts for which review: a letter
(either case) for its sound in Sound Scout, a sound for a word starting with
it in Word Builder, a little letter found or matched for the little-letter
review, a sight word heard or matched for either sight review, a traced
letter for the tracing review.

**Where the child goes next** (`currentDestination()`, pure): the first open
place not yet restored; else the first with a mission not yet played; else
the last open one. **The next marker** (`markerNext()`): the story missions
in order, then — in the visit that restored the place — the first mission
of any game there not yet played, then one mission a visit.

### The school print

Letters are drawn, not typed. `LETTER_FORMS` holds every letter, big and
little, as strokes in writing-line units; `strokePoints()` walks a stroke
into evenly spaced points and `strokePathD()` into an SVG path (arcs in
pieces of at most 120°). `printSvg(text, frame)` draws a letter or a word
as round-capped strokes (`PRINT`: the ink, the gap between letters, the dot)
in `currentColor`; `printFrame()` gives a round's choices one shared frame,
so every letter sits on the same baseline at the same scale. The print is
`aria-hidden`; its button carries the label ("Little letter m"). The same
strokes feed the demo and the trace, so reading and writing cannot drift
apart. `formProblems()` rejects a malformed letter (too many strokes, a
broken stroke, out of bounds); content validation runs it on all 52.

### Tracing (Moon Writer)

- **The engine** (pure, letter units): `tracePlan(strokes)` makes each stroke
  a path of points `TRACE.step` apart, or `null` for a malformed letter.
  `traceDown` begins a stroke near its start (or where it was left);
  `traceMove` walks the finger in small steps and advances to the nearest
  path point within `TRACE.ahead` points and `TRACE.tolerance` of it, so
  progress is only along the path; `TRACE.wander` off the path for
  `TRACE.wanderFor` of travel restarts that stroke alone; a stroke ends
  `TRACE.endSlack` points from its end. No score, no recognition: done, or
  not yet, and help counted (`noteHelp()`).
- **The slate** (`writeBegin()`, `drawWrite()`): an SVG in a fixed frame
  (`WRITE_FRAME`) with the writing lines; full help draws lanes, a dashed
  middle and an arrow; light help a faint outline; the green dot is where the
  next stroke starts or carries on. The ink is redrawn at most once a frame
  (`drawInk()`). Pip's demo (`watchLetter()`) animates `stroke-dashoffset`
  with the Web Animations API, stroke by stroke, and appears whole under
  Reduce Motion.
- **Input** (`wireWritePad()`): Pointer Events on `#writePad` only
  (`pointer-events: auto`, since the scene layer lets taps through;
  `touch-action: none`, no selection, no callout). One pointer at a time
  (`writeInput`); a pen beats a touch (a resting palm); a second finger is
  ignored; `pointercancel` and `lostpointercapture` lift; coalesced events
  are followed. The handlers turn screen points into letter units
  (`padPoint()`) and call `writeDown/writeMove/writeUp`, which is also what
  the contracts drive.
- **Answering:** the round's answer is `'traced'`, given through `choose()`
  when the last stroke is done, so the shared ladder, evidence and praise
  apply. Nothing half-traced is stored; a reload mid-letter starts it again.

### Loading pictures: three tiers

Every picture declares when it is fetched (`renderedAsset(…, load)`):

| Tier | What | Kept offline |
|---|---|---|
| `core` | everything the first worlds and the shell need | precached by the service worker at install |
| `install` | the home-screen icons | fetched by the device at install, not precached |
| a world id (`jupiter`) | that world's horizon, planet, markers and game pictures | fetched when its route is open or next to open (`worldsToKeep()`, `stageAssets()`, `preloadStage()`), and handed to the service worker to keep (`keepWorlds()`) |

So the first download holds only what is needed, a new world is on the
device before a child can fly there, and a new version's cache keeps every
open world. Contracts hold the budgets: core under 1.2 MB, each world under
300 KB.

**Loading, and keeping.** `Preload.assets` gives each stage picture a state:
`pending` (in flight: never asked for twice at once), `loaded`, or
`failed` (including a load that gives up after `PRELOAD_GIVE_UP`). A failed
picture is tried again when the network returns (`online`, forced), when
the app comes back to the front, and on a timer that backs off from
`PRELOAD_RETRY` to `PRELOAD_BACKOFF_MAX` while anything is missing — never
more often, so a flaky connection is not a storm. A near world's pictures
count as **kept** only when the service worker answers a `keep` request
saying it holds them (`Preload.kept`): loaded or decoded is not kept.
`keepWorlds()` waits for `navigator.serviceWorker.ready`, so a fresh
install keeps its near world in its first session; one request at a time;
asked afresh when a new worker takes over.

### The HUD

One `<header class="hud">` sits over every child scene and owns the top
band (`--hud-h`); every scene's controls start below it. `setHud(scene)`
draws it from `hudState(scene)`, which reads the state and the content:

| Scene | Left | Title / task |
|---|---|---|
| welcome, a flight | — (hidden) | — |
| Earth | the grown-ups lock | Earth / Home base |
| a planet | Home (flies home) | the planet's `label` / what it teaches (`focusLabel()`, from its missions' skills) |
| a mission | Home (asks first) | the mission's `title` / `task`, and its progress |
| the space station | Back (flies home) | Space Station / Rocket garage |

The stars are always top right. `enterScene()` is the one way into a child
scene: the scene, the stage's view, the HUD and ambient life together.

### The world stage

One `#stage` sits behind every child scene (`CHILD WORLD` in the CSS, and
"The world stage" in SCENES):

- **Sky and two star layers,** painted once. The **ambient layer** holds
  the rare shooting star at rest (`shootingStarPath()`: deterministic, far
  side of the sky, below the HUD; off in missions, in flight and with
  Reduce Motion).
- **The camera** (`.stage-camera`): two place slots, the flight path, and the
  rocket.
- **A place slot** (`placeA`, `placeB`) holds a place's sky (planets, home,
  the Sun's glow) and its ground: the horizon picture and the markers, or
  the station's room with Earth behind its window. It is drawn by
  `drawPlace()` from `DESTINATIONS`; `paint()` redraws a part only when its
  HTML changed, so nothing blinks. Which planet is chosen on Earth is a
  class (`applyPick()`), not markup, so choosing never redraws the sky.
- **Geometry** is tokens (`--world-w`, `--crest-y`, `--world-top`,
  `--rocket-h`; `--station-w/h` for the garage): the horizon is 150 `--vh`
  wide and never narrower than the screen, its crest at 62 `--vh`. Every
  prop, landing spot and hit area is a fraction of its picture, so it
  stays in place at any size.
- **Travel layers:** `travelFar` (behind the rocket), `travelNear` (in
  front) and `landFx` (touchdown dust). `travelFx()` fills them for one
  flight; they are cleared when it lands.
- **Held beats** (`relightHold`, `markerHold`, `revealHold`): what was
  restored is drawn dark for a beat, then lights up while the child watches
  (`releaseHeld()` lets go in place, so it crossfades).

### Flights

- **The plan** (`travelPlan()`, pure): from where a trip starts and ends,
  whether it is a first arrival, whether the route was flown this session,
  and the flight's number, it picks the duration and the motifs, and splits
  the trip into five phases: ignite, rise, cruise, approach, touchdown.
  Motifs: `clouds-out` (leaving Earth), `clouds-in` (coming home), `cruise`
  (streaming stars and rushing specks), `shooting` (every other cruise),
  `asteroids` (one trip in three, never a first arrival), the first trip to
  a world beyond the first stop (its `firstTrip`: the `tunnel` for Mercury,
  a pass through friendly `asteroids` for Mars), `station-in` and
  `station-out`.
- **The move** (`travelTo()` + `flightMoves()`): the controls clear, the
  destination is drawn into the other slot and held out of sight, the
  rocket is measured before and after the stage moves (FLIP, with scale),
  and everything moves by transforms and opacity with the Web Animations
  API. The resting state is the destination, so a skip, a resize, a hidden
  tab or no animation support all land in the same place. Reduce Motion
  crossfades.
- **Arriving** (`settleInto()`): touchdown dust or light, the rocket's clay
  giving a little, Pip settling, the HUD fading in — and only then may
  anything be tapped.
- **The rest** (`stageRestingProblems()`, `checkStage()`): the rules of a
  stage at rest, checked after every flight, at boot and on return to the
  app. A broken rest is redrawn from state and counted in the grown-ups
  area ("Display checks").

### Missions: input and the play field

- **Who owns a tap** (`session.input`): `intro` (a tap skips to the
  question), `open` (answers are taken), `wait` (praise, correction,
  between rounds: a tap waits). A wrong answer holds taps for
  `TIMING.wrongHold`, so a bouncing finger is one answer.
- **The play field:** the CSS owns the game's box (below the HUD, right of
  Pip, standing on the ground); `playfieldSizes()` (pure) sizes the tiles,
  the picture, the stone and the meteors to fit it, stacked or, on a short
  wide screen, in a row. `fitPlayfield()` measures and applies it when a
  round is drawn and when the screen changes shape.
- **Word Builder** answers with several taps: `session.build` holds which
  letter is in each slot; a tapped letter goes into the next empty slot (and
  plays its sound), a placed one tapped again comes back, and a full word is
  answered through `choose()` like any choice (`ACTIVITY_TYPES.check`).
- **Moon Writer** answers by tracing: `session.write` holds the plan, the
  trace and the ink (see "Tracing" above). The slate is the one game that
  fills its box's height, beside its two buttons.

### Audio

`Voice` is the one owner of speech and phonics audio: one cue at a time, in
order, each resolved by `audioRoute()` (a recording, the development
phonics voice for a sound, the device voice for anything else, a caption).
The development phonics voice (`synthPhonics()`, `phonicsRender()`,
`DevVoice`) is a small, deterministic formant synthesiser, played through
the Web Audio output the first tap wakes (`AudioOut`), which `Sfx` shares.
Recordings will play through one media element woken on the first tap
(`MediaVoice`), only once one exists. The device voice speaks sentence by
sentence with punctuation pauses (`speechChunks()`). Everything, with the
recording list, is in [docs/AUDIO.md](docs/AUDIO.md).

### The space station

The Rocket Dock is a place (`DESTINATIONS.station`), reached by a flight
(`openDock()` → `travelTo('station')`, and `leaveDock()` home). The rocket
stands on the turntable, larger. The panel holds three tabs (paint, gear,
themes), the things to try and one action. Trying something on changes
only the stage rocket (`previewLook()`); the action unlocks or wears it.

### Data model

| Key | Shape | Written by |
|---|---|---|
| `data.profile` | `{ id, createdAt, updatedAt, story: { 'arrived.<place>', 'shown.<place>', 'heard.dockHint' } }` | first tap; story moments |
| `data.completions` | `[{ id: runId, missionId, destinationId, skillId, startedAt, completedAt, rounds, firstTry, helped, unscored }]` | end of a mission |
| `data.stars` | `[{ id: 'earn.<runId>' \| 'spend.<cosmeticId>', kind, amount, runId \| cosmeticId, at }]` | end of a mission (earn); the Dock (spend) |
| `data.evidence` | `[{ id: '<skill>.<item>.<form>', item, form, seen, firstTry, recent[≤8], lastPracticed }]`: a letter (`letter-recognition.M.upper`, `.M.lower`, `.M.match`), a word (`rhyming.cake.rhyme`), a sound (`beginning-sounds.m.initial`), a built word (`cvc.map.build`), a sight word (`sight-words.the.hear`, `.the.match`), a traced letter (`handwriting.L.upper`) | after each resolved round |
| `data.rocket` | `{ paint, gear?, theme?, updatedAt }` (a missing slot reads as its free starter, so v0.3.0 records need no migration) | the space station |
| `ui.sound`, `ui.motion` | device preferences | grown-ups area |

**Derived, never stored:**

- the star balance
- which cosmetics are owned
- whether a destination is restored (by its story missions), and whether it is open
- the next mission, and which marker pulses
- an item's difficulty level (recomputed from `recent`)

**Invariants, each held by a contract:**

- A run earns once.
- A cosmetic is bought once.
- A spend is refused without enough stars.
- Only owned things are worn. An unknown or unowned saved item shows its slot's starter without rewriting the record.
- Choosing a paint takes a theme off; a theme hides the paint without forgetting it.
- A completion with no earning is repaid at boot, exactly once.
- An unreadable value is copied to `sys.backup.unreadable.<key>` before anything can overwrite it.
- The Dock has no write path to completions or evidence.

### Timing

`TIMING` is the one table of durations:

- **Flights:** 2.2s normally, 3.0s on a first arrival, 1.7s on a route
  already flown, 1.9s (1.5s again) to or from the station, 0.32s with
  Reduce Motion; then 0.42s to settle. The controls clear in 0.18s.
- **Feedback:** the wrong-answer hold (0.45s), the celebration guard, and
  the reward stars (all landed within about 2s).
- **Ambient:** a shooting star about every 13–23s at rest.
- **Writing:** Pip's pen moves at `writeDemo` ms per letter height, with a
  `writeDemoGap` between strokes; "Start at the green dot" is said at most
  every `writeHint` ms.

`AUDIO_TYPES` is the other table: for each type of cue (story, instruction,
question, praise, correction, hint, reaction, word, letter name, phoneme,
segmented and blended word; sound effects are `Sfx`'s) its breath before
and after, its minimum hold (praise holds 0.95s), whether a tap may cut it,
and whether the device voice may say it. `TIMING.dialogueScale` scales all
of it; the contracts set 0 (and then say each line whole, since there is no
pause to leave between its sentences).
- **Beats:** a 1.5s pause ends a count; taps closer than 0.09s are one.
- **Prompts:** re-asking after 10s idle, at most twice.
- **Gate:** 3s.
- **Speech fallbacks:** the speech-start grace (1.2s) and the safety timeout.

The contracts collapse these to zero to run the journey in milliseconds.

### Testing

`npm run verify` runs the contracts, config integrity and the residue scan.

- **Contracts 1–19** are the foundation's own, retargeted where they used to
  exercise the starter demo.
- **Contracts 20–45** cover the product. 32 holds the world stage (one
  stage, places from data, one primary action, one mission at a time); 33
  holds Rhyme Radar and Syllable Meteors; 34 the HUD, lesson titles and
  choosing a planet; 35 travel plans, the resting stage and ambient
  shooting stars; 36 who owns a tap; 37 the play field on every screen;
  38 the space station and what a rocket wears; 39 the one audio owner,
  typed cues and the development phonics voice; 40 the word knowledge
  base, and a letter's name against its sound; 41 Sound Scout; 42 Word
  Builder; 43 Mars, restoring by story missions and a v0.4.0 journey
  opening; 44 review by rule; 45 the sound effects family.
- **Contracts 46–53** cover Phase 4: 46 the letterforms and the school print;
  47 big and little letters and partners; 48 sight words, their source and
  both games; 49 tracing by geometry; 50 Moon Writer (watch, trace, less
  help, pointers, reload); 51 Jupiter and a v0.5.0 journey opening it; 52
  picture tiers and offline; 53 the grown-ups area's seven skills.
- **Contracts 54–56** cover the v0.6.1 follow-up, played with fakes rather
  than read: 54 a world's pictures failing, hanging and recovering, and
  kept only on the worker's word; 55 updates (a same-version takeover, a
  newer version at a quiet moment, one mid-letter, a touch just now, a
  picture still loading, nothing asked while the page settles, a held
  takeover helped by one reload and never two, a first install,
  repeated foregrounding, a failed check, a redundant worker, nothing
  saved touched); 56 `sw.js` itself in a sandbox with fake caches and a
  fake network (install whole or not at all, never by itself, carry
  pictures, answer `version`/`activate`/`keep`, never store an error or
  replace an installed file). Real-browser flows for all of it are in
  docs/PRODUCT.md's v0.6.1 and v0.6.2 QA records.
- **Contract 57** covers v0.6.3: a takeover asked at a quiet moment that
  comes in late — mid-letter, mid-flight, with a grown-ups page open or
  the lock held, just after a touch — is recorded, and the page reloads
  once, at the next quiet moment checked then, found by the poll alone;
  the mission run, the half-traced letter and the saved journey survive;
  repeated takeover events and polls never reload twice; a first install
  and a same-version takeover owe no reload; the held-takeover reload
  waits for play to stop too, and a held one that comes in after the page
  stopped trying still gets its one reload. The real-browser flow is in
  docs/PRODUCT.md's v0.6.3 QA record.

The journey contract (28) plays welcome → Earth → the Moon → the beacon →
the mission → the world answering → home → Dock → reload through the same
functions the buttons call, using a recording fake speech engine; 33 goes on
through Mercury. The harness has no layout and no Web Animations, and its pointer events are
dispatched by hand, so flights, tracing feel and visual behaviour are also
checked in a real browser.
See the QA notes in `docs/PRODUCT.md`.

## Where new work goes

| You are adding | Put it |
|---|---|
| A picture | A file in `assets/`, one `ASSET_REGISTRY` entry, then `npm run config:sync` |
| A recording | A registry entry, then its path in `VOICE_RECORDINGS` under the cue's id ([docs/AUDIO-RECORDINGS.md](docs/AUDIO-RECORDINGS.md) lists every one) |
| A word | One `WORDS` entry (picture, rime, beats, phonemes); every game can then use it |
| A sight word | A `WORDS` entry with `sight: { list }`, its `phonemes`, and no picture, from a list recorded in `WORD_LISTS` and docs/CONTENT-SOURCES.md (whose decodability columns must match `soundsOutByLetter()` and `decodableHere()`) |
| A letter to write | Nothing new: all 52 are in `LETTER_FORMS`. A `letter-trace` activity in a Moon Writer mission, and its strokes checked in docs/CONTENT-REVIEW.md |
| A world's pictures | Registry entries with `load: '<world id>'`, so they are fetched when its route is near, not in the first download |
| A sound a game asks for | A `PHONEMES` entry, a `LETTERS[].sound` if a letter spells it, and its synthesis in `SYNTH_SOUNDS` until it is recorded |
| A review round | A `review` list on the activity: what it may ask, the default first |
| A sound effect | A recipe in `Sfx`, from `SFX_NOTES`, short and soft |
| A mission | `MISSIONS` plus the destination's `missions` list; `validateContent()` checks it |
| A new kind of activity | An `ACTIVITY_TYPES` entry, content, a `GAME_VIEWS` entry, and its shapes in `playfieldSizes()` |
| A lesson title or task | The mission's `title` and `task`; the HUD shows them |
| Something to wear | A `COSMETICS` line in its slot: a `--paint-*` token, a gear picture in the rocket's frame, or a theme pattern in the CSS |
| A travel motif | A rule in `travelPlan()`, its pieces in `travelFx()`, its moves in `flightMoves()`, and a contract 35 check |
| A rule for the resting stage | A line in `stageRestingProblems()`, and what `repairStage()` must reset |
| A pause in Pip's speech | The cue's type in `AUDIO_TYPES`, never a timeout in a scene |
| A destination | A `DESTINATIONS` entry (sky pictures, horizon, a marker per game, `restore`, story) and `JOURNEY_ORDER`; its renders in `tools/art/jobs.js` |
| A mission for an existing game | `MISSIONS`, the destination's `missions`, and its marker's `missions`; never its `restore`, once children have played |
| Persistent state | A key in `KEYS`, under `data.` or `ui.`, with a single owner |
| A data shape change | Bump `DATA_SCHEMA_VERSION` and add a migration |
| A colour | A token, in layer 1, 2 or 4 |
| A release | An `APP_UPDATES` entry, then `npm run config:sync`; installed apps pick it up by themselves at a quiet moment (see "Updates and the service worker") |
| A state a child must not be interrupted in | A condition in `Domain.safeToReload`, so an update never reloads during it |
