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
| `<body>` markup | The backdrop, six scenes, the rotate prompt, and every overlay, all declared statically. Everything else is generated. |
| One `<script>` | Foundation (config, storage, migration, overlays, toast, confirmation, navigation), then the product, then settings, utilities and boot. |

**Keep it to one substantial `<script>` block.** The test harness evaluates
only the largest one. Code in a second block, or in a linked `.js` file, is
invisible to every contract, and the suite still passes. A contract asserts
this.

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

- **Type:** `--fs-kid-*` and `--fs-glyph`.
- **Touch targets:** `--touch-kid` (76px) and `--touch-hero` (112px).
- **Tiles:** `--tile-size`.

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
wire`. A contract proves that the foundation's code names nothing from the
product.

---

## The product

The product section sits between the `PRODUCT DOMAIN` and `SETTINGS` banners.
Each layer reads only the ones above it.

| Layer | What it is | Rule |
|---|---|---|
| **ASSETS** | `ASSET_REGISTRY`: every picture, its source, licence and state | The only place an asset path is written. A contract enforces it. |
| **CONTENT** | `SKILLS`, `LETTERS`, `DESTINATIONS`, `MISSIONS`, `COSMETICS`, `VOICE_CUES` | Data only. Checked by `validateContent()` at boot and in the contracts. |
| **ENGINE** | Rounds, difficulty, the help ladder, evidence, progress and the star ledger | Pure functions: no DOM, no storage, seeded randomness. |
| **JOURNEY** | The child's saved state (`journey`) | Five keys, each written only by its owner. |
| **AUDIO** | `Voice`, `Sfx`, `TIMING` | A recording if one exists, otherwise the device voice (temporary), otherwise a caption. |
| **SCENES** | Welcome, Earth, travel, mission, celebration, Rocket Dock | Controllers return promises, so a contract can walk the journey. |
| **GROWN-UPS** | Hold gate, progress, sound, motion, data, about | Behind a 3-second hold, with erasing behind a confirmation too. |

### Content model

```
Skill        { label, status: 'active' | 'planned' }         seven named, one active
Destination  { id, kind, asset, primarySkill, reviewSkills,   the STORY layer
               missions[], unlock, story{ lines } }
Mission      { id, destinationId, skillId, choices,          the LEARNING layer
               difficulty{min,max}, reward{stars}, activities[] }
Activity     { type, target, form, guided? }                 authored targets
ActivityType { skillId, validate, evidenceKey,               ACTIVITY_TYPES registry
               promptCue, buildRound }
VoiceCue     { text (on screen), speak (script), file }      `voiceCue(id)` builds
                                                             value-carrying lines
```

**Adding a skill** means adding one `ACTIVITY_TYPES` entry, content, and a
scene renderer for that interaction, if it differs from the tap-a-tile layout.
Existing scenes do not change.

**Adding a destination** means adding a `DESTINATIONS` entry, an asset, and
story lines, and appending it to `JOURNEY_ORDER`.

### Data model

| Key | Shape | Written by |
|---|---|---|
| `data.profile` | `{ id, createdAt, updatedAt, story: { 'arrived.moon', 'heard.dockHint' } }` | first tap; story moments |
| `data.completions` | `[{ id: runId, missionId, destinationId, skillId, startedAt, completedAt, rounds, firstTry, helped, unscored }]` | end of a mission |
| `data.stars` | `[{ id: 'earn.<runId>' \| 'spend.<cosmeticId>', kind, amount, runId \| cosmeticId, at }]` | end of a mission (earn); the Dock (spend) |
| `data.evidence` | `[{ id: '<skill>.<item>.<form>', item, form, seen, firstTry, recent[≤8], lastPracticed }]` | after each resolved round |
| `data.rocket` | `{ paint, updatedAt }` | the Dock |
| `ui.sound`, `ui.motion` | device preferences | grown-ups area |

**Derived, never stored:**

- the star balance
- which cosmetics are owned
- whether a destination is restored
- the next mission
- a letter's difficulty level (recomputed from `recent`)

**Invariants, each held by a contract:**

- A run earns once.
- A cosmetic is bought once.
- A spend is refused without enough stars.
- Only owned paint is worn. An unknown saved paint shows the starter paint without rewriting the record.
- A completion with no earning is repaid at boot, exactly once.
- An unreadable value is copied to `sys.backup.unreadable.<key>` before anything can overwrite it.
- The Dock has no write path to completions or evidence.

### Timing

`TIMING` is the one table of durations:

- **Flights:** 1.1s normally, 2.6s on the first arrival, 0.32s with Reduce Motion.
- **Feedback:** the praise hold and the celebration guard.
- **Prompts:** re-asking after 10s idle, at most twice.
- **Gate:** 3s.
- **Speech fallbacks:** the speech-start grace (1.2s) and the safety timeout.

The contracts collapse these to zero to run the journey in milliseconds.

### Testing

`npm run verify` runs the contracts, config integrity and the residue scan.

- **Contracts 1–19** are the foundation's own, retargeted where they used to
  exercise the starter demo.
- **Contracts 20–29** cover the product.

The journey contract (28) plays welcome → Earth → Moon → celebration → Dock →
reload through the same functions the buttons call, using a recording fake
speech engine. The harness has no layout, no pointer events and no Web
Animations, so visual behaviour is checked in a real browser. See the Phase 1
QA notes in `docs/PRODUCT.md`.

## Where new work goes

| You are adding | Put it |
|---|---|
| A picture | A file in `assets/`, one `ASSET_REGISTRY` entry, then `npm run config:sync` |
| A recording | A registry entry, then its path in `VOICE_RECORDINGS` under the line's id |
| A mission | `MISSIONS` plus the destination's `missions` list; `validateContent()` checks it |
| A new kind of activity | An `ACTIVITY_TYPES` entry and its round renderer |
| Persistent state | A key in `KEYS`, under `data.` or `ui.`, with a single owner |
| A data shape change | Bump `DATA_SCHEMA_VERSION` and add a migration |
| A colour | A token, in layer 1, 2 or 4 |
| A release | An `APP_UPDATES` entry, then `npm run config:sync` |
