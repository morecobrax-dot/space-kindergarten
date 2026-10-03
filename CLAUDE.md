# Development method

Instructions for AI coding sessions in this repository. These override default
behaviour.

This is **Space Kindergarten**, a kindergarten literacy game for iPad, built
from the app-starter foundation. Read [ARCHITECTURE.md](ARCHITECTURE.md)
before changing architecture, [PRODUCT-DESIGN.md](PRODUCT-DESIGN.md) and the
product rules at the end of this file before changing anything a user sees,
and [docs/LEARNING-DESIGN.md](docs/LEARNING-DESIGN.md) before changing
anything a child learns from.

---

## Before implementing a feature

1. Read [docs/PRODUCT.md](docs/PRODUCT.md) for what is built, what is
   deliberately not built yet, and what is placeholder.
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) for what already exists, so you do
   not rebuild it.
3. **Separate foundation from product before you type.** Name which parts of
   the change are product-specific and which are genuinely reusable.

### The foundation-modification rule

**A product-specific need stays in the product.** Do not change generic
foundation code because one product wants something. Add it in the domain
section, behind the `Domain` seams.

Only upstream a change to the foundation when it is reusable *on its own terms*
— when a second, unrelated product would want it identically. If you are
unsure, it is not reusable yet. Leave it in the product; it can be promoted
later, by hand, after a second product proves the need.

This rule exists so a savings app does not slowly turn a general foundation
into a finance framework. The same applies in the other direction: never add a
domain concept — a transaction, an account, a category — to the storage
adapter, the overlay engine, toast, confirmation, or navigation.

### No dependency linkage

A product created from this starter is **independent**. Never introduce a git
submodule, an npm package, a shared remote runtime, or any automation that
pulls starter changes into a product or pushes product changes back. Copy the
knowledge, then own the product.

## Workflow

```
AUDIT → UNDERSTAND → IMPLEMENT → ADVERSARIAL VERIFY → DIFF AUDIT → SHIP → REPORT → STOP
```

- **Audit** the existing code before proposing a change. Read the thing you are
  about to modify, and the thing that calls it.
- **Understand** why it is the way it is. Nearly every unusual line here carries
  a comment naming the failure that caused it. If you are about to remove
  something that looks redundant, find that comment first.
- **Implement** the requested change, and only that change.
- **Adversarially verify.** Try to break what you built. Repeat it a hundred
  times. Open it, close it, rotate it, refresh mid-edit, deny it storage.
- **Diff audit** before shipping. Read the whole diff. Every surviving line
  should have a reason to exist.
- **Report** what you did, what you verified, and what you did not.
- **Stop** at the requested phase. Do not begin the next one.

## Before changing anything

1. **Run the baseline first.** `npm run verify` before you start, so you know
   whether a failure is yours.
2. **Find the current source of truth before adding another one.** If you are
   about to declare a value, search for it first. Identity, tokens, storage
   keys, release history and overlay state each have exactly one owner, and a
   contract enforces it.
3. **Prefer extending an existing system to creating a parallel one.** A second
   overlay mechanism, a second storage wrapper or a second version constant is
   a defect, not an addition.
4. **Do not redesign unrelated surfaces during targeted work.** If you notice
   something else, say so; do not fix it in the same change.

## Hard rules

1. **New code goes in the largest inline `<script>` block.** A second block or
   a linked file is invisible to every contract, and the suite will still pass.
2. **Never hard-code a font size, font family, or colour.** Use the tokens. A
   genuine exception is marked `/* fs-exempt: reason */` on the lines above it.
3. **Never add a lock/unlock pair to an overlay.** The engine's observer handles
   scroll lock, focus, stacking and ARIA. A hand-rolled pair reintroduces the
   bug the engine exists to prevent.
4. **Never touch `localStorage` outside the storage adapter.** Anything else is
   an unnamespaced key and an origin collision waiting to happen.
5. **Never edit `sw.js`, `manifest.webmanifest` or the derived `<head>` block by
   hand.** Edit `APP_CONFIG`, run `npm run config:sync`.
6. **Never reference a path outside the repository** in application or tooling
   code. The starter is self-contained.
7. **No `alert()`, `confirm()` or `prompt()`.** Use `toast()` and
   `confirmAction()`.
8. **No new dependency, framework, or build step** without the user explicitly
   asking for one. The value here is proven behaviour, not stack novelty.

## Product rules

9. **iPad landscape first** for everything a child sees (this product
   overrides the starter's "mobile first"). Grown-up pages must also work in
   portrait.
10. **≥44px actionable touch targets** for grown-ups, **≥`--touch-kid`
    (76px)** for anything a child presses. The visible mark may be smaller.
11. **≥16px editable inputs**, or iOS Safari zooms and does not zoom back.
12. **Respect safe areas** on all four edges, through the `--inset-*` tokens.
13. **Respect `prefers-reduced-motion`** on every animation, not most of them.
14. **One visible action, one predictable outcome.** Validate before mutating.
15. **Truthful empty and unknown states.** Absent is not zero. A missing key is
    a new user, not a corrupted one, and is never repaired with a default.
16. **No fake precision.** Do not present a number the data cannot support.
17. **Do not persist derived values.** Store the record; compute the
    presentation. A stored total can disagree with its parts.
18. **Preserve backward compatibility** wherever product data already exists.
    A shape change means a migration, not a reinterpretation.

## Testing

19. **Add regression coverage for every real defect**, in the same session that
    fixes it. Name the contract after the failure it prevents, not the function
    it calls.
20. **Run adversarial tests** — repetition, nesting, refresh mid-action, denied
    storage, corrupt input, empty and enormous collections.
21. **A contract that cannot be described as "this prevents X" should not
    exist.** Optimise for value, not for count.
22. **If you add a top-level `const`/`let` a test must reach**, add its name to
    `BRIDGE` in `test/harness.js`, or it will be invisible.

## Shipping

23. **Verify live behaviour**, not just the local file. Install it, load it
    offline, check the cache and storage names in DevTools.
24. **Compare the deployed bytes to committed source**, not to a
    line-ending-modified working copy — on Windows the working tree is CRLF and
    will report a false mismatch. Compare the git blob.
25. **Update `APP_UPDATES` on every real release**, then run
    `npm run config:sync`. The newest entry is the version; the cache name
    derives from it. Skipping this ships an app that cannot invalidate its own
    cache.
26. **`npm run verify` must be green before any commit or push.**

### Standing release policy

The user's standing authorization (2026-09-27), for every normal
implementation request in this repository:

```
AUDIT → IMPLEMENT → VERIFY → BROWSER QA → DIFF AUDIT → COMMIT → PUSH → VERIFY PRODUCTION → REPORT
```

The user wants to use the released app after each completed request
without separately asking for a commit, a push or a deploy.

- **Every real release updates `APP_UPDATES`** and runs
  `npm run config:sync` (rule 25).
- **When the required checks pass** (`npm run verify`, and the browser QA
  the change calls for) **and there is no explicit review-only or STOP
  instruction, commit and push normally, without asking again.**
- **Verify production:** confirm the deployed version (the live
  `CACHE_NAME` and `APP_VERSION`) and compare every deployed file against
  its committed git blob (rule 24). A deploy is **not** complete because the
  push succeeded; it is complete when production matches.
- **Never force-push, never overwrite unrelated work, never bypass a failed
  check.** Fetch first; if `origin` has moved, integrate it before pushing.
- **If a genuine blocker prevents a release**, report the exact blocker and
  preserve the work (commit locally or leave it staged, and say which).
- **Advice-only prompts and no-op changes do not create releases.**

### Mission Control status

`PROJECT-STATUS.json` at the repository root is this project's public status.
Mission Control reads it from `main` on GitHub (raw.githubusercontent.com) and
shows it on its hub. Only pushed commits reach it: work that is not committed
and pushed does not appear there, whatever the file says locally.

**What `version` means.** It is this repository's release version on the same
commit — `APP_UPDATES[0].version` in `index.html`, the same version `npm run config:sync` writes into `package.json` and the cache name — and nothing more. It changes in the commit that
changes the release version, and only then. An equal version never means the
release is deployed, that QA passed or that the project is stable: production
verification stays part of the release workflow, and the other fields say
what you declare.

**Reviewing it is part of completing work.** At each milestone — implementation
completed, QA required, a decision or a blocker identified or cleared, a
release cut, a release verified (only after production has been checked, never
on a push alone) — review every field: `status`, `needsQa`, `needsDecision`,
`currentTask`, `nextAction`, `blocker`, `version` and `phase`. Change what is
no longer true, set `updatedAt` to the time you reviewed it, and commit it with
the work. Leave a fact `null` when it is not known; never infer a status from
commit counts, tests or a version number. A commit that reaches no milestone
needs no status edit.

**Report it.** Every paste-back report for a phase or a release says
"Mission Control status reviewed and published" with the commit that
published it — or which milestone was reached and why no field changed.

**The gate.** `npm run verify` runs `scripts/project-status.js` first. It fails,
with the reason and what to do, when the file breaks Mission Control's status
contract (schema 1: every key, the types and limits, an ISO 8601 time with a
zone), names another project, carries a key beyond the contract or anything
private (a conversation or session link, a credential, a local path), or when
`version` is not the release version. It only reads: it never edits the file,
clears a flag or picks a status. It cannot tell whether the words are still
true or whether unpublished work exists — that review is yours. It runs on
this machine only; nothing enforces it on GitHub. `npm run status` runs it
alone. The checker is Mission Control's, identical in every publishing
repository: never edit it here — change it in Mission Control, then copy it
unchanged.

The file is public. Write short, plain summaries only: never a conversation or
session link, a credential, a local path, private details or anything from a
private repository.

Schema 1, every key present: `schemaVersion` 1; `appId` `"space-kindergarten"`;
`version` and `phase` (text or null); `status`, one of `planning`, `building`,
`release_ready`, `stable`, `paused`; `needsQa` and `needsDecision` (true or
false); `currentTask`, `nextAction` and `blocker` (text or null — a blocker
means the project is blocked); `updatedAt` (ISO 8601 UTC, when you reviewed
it). Limits: version 24 characters, phase 48, currentTask 280, nextAction 200,
blocker 200. Mission Control refuses a file that breaks any rule and keeps
showing the last valid one.

## Scope

27. **A product-specific need stays in the product.** See the
    foundation-modification rule above. Do not generalise on the first use.
28. **Stop at the requested phase.** Finish it completely, report, and wait.
    Do not start the next phase, do not "while I'm here", do not polish the
    demo into a product.

---

# Space Kindergarten's own rules

These come from the product spec and from defects found while building
Phase 1. Each one has a reason; keep it with the rule.

## Learning comes first

29. **The screen never gives the answer away.** A question's caption says
    "Find the letter!", never "Find M". Showing the letter turns hearing a name
    into matching two shapes. The one exception is `visual`, used only when
    nothing can be heard, and those rounds are not recorded as evidence.
30. **Every round can be finished, and nothing costs a star.** Wrong choices
    step aside; the second miss shows the answer. The star ledger is never
    touched by `answerRound`.
31. **Stars are for taking part.** A mission pays a fixed reward. Never scale
    it by accuracy, never show a score to a child, and never label a child
    behind or weak, including in the grown-ups area.
32. **Adaptation stays deterministic.** The rules are three first-try answers
    up, any help down, and a level recomputed from stored answers. No model,
    no LLM, nothing a grown-up could not follow on paper.
33. **No phonics on the device voice.** Letter *names* are acceptable on the
    temporary synthesiser; letter *sounds*, words said sound by sound and
    blended words are never given to it (it says /m/ as "muh"). They are
    recordings, or until then the development phonics voice (rule 69).
34. **Never claim educational authority.** Record sources in
    `docs/CONTENT-SOURCES.md` and add every authored item to
    `docs/CONTENT-REVIEW.md`.

## Content and assets

35. **Content is data.** Missions, letters, lines and cosmetics live in the
    CONTENT section, and `validateContent()` must stay empty. Scenes never
    name a mission id, a letter or a skill.
36. **Every picture goes through `ASSET_REGISTRY`,** with source, licence and
    state. Scenes ask for an id. Run `npm run config:sync` after any asset
    change; it regenerates the precache list and `docs/ASSET-MANIFEST.md`.
37. **Nothing from `references/` is ever shipped, traced or committed.** The
    moodboard is stock and third-party art; it is git-ignored and a contract
    guards it.
38. **Never present placeholder or draft art as final.** Registry states are
    PLACEHOLDER, DRAFT and FINAL, and only a person promotes art to FINAL.
    The current pictures are DRAFT clay renders. `docs/ASSET-BRIEFS.md`
    says what final art must match.

## Data safety

39. **Five keys, five owners.** The mission writes completions, stars (earn)
    and evidence; the Rocket Dock writes stars (spend) and rocket. The Dock
    must never write learning data, and a contract enforces it.
40. **Earn and spend are append-only ledger entries** keyed by run and by
    cosmetic. Never store a balance or an owned list.
41. **Never overwrite what cannot be read.** An unreadable value is copied to
    `sys.backup.unreadable.<key>` first. Never "reset" a child's progress to
    recover from a bug.
42. **No backend, accounts, analytics, ads, purchases, chat or outbound
    links.** A contract forbids network APIs. Privacy is local-first.

## Children and iPads

43. **Speak first, then show.** Every child-facing line goes through `Voice`
    with a script in `VOICE_CUES`. Keep on-screen text to a few words.
44. **One primary action per child screen,** and it wears the warm yellow.
    Nothing else may.
45. **Never make a child wait on a silent voice.** A line that has not begun
    within `speechStartGrace` falls back to caption pacing.
46. **Reduce Motion is honoured twice:** by the device preference and by the
    grown-ups setting. JavaScript motion checks `motionReduced()`, and a
    flight's resting state is its destination.
47. **Nothing on this machine is an iPad.** Browser QA uses emulated
    viewports. Say what was not physically tested, every time.

## The clay world

48. **Every picture is rendered by `tools/art`, under one light.** Change a
    scene file and re-render; never retouch a render by hand. The rig in
    `tools/art/clay.js` is the only light, and a contract fails if a scene
    brings its own. A render that warns it touches its frame edge is not
    shipped: the app would show a cut line.
49. **A paint is a colour token, not a picture.** A new paint is a
    `--paint-*` token and a `COSMETICS` line. A theme is a pattern of
    colour tokens through the same paint mask. Never add one rocket image
    per colour or per look, and never tint anything else in CSS.
50. **Clay is for the world, not the controls.** Buttons, tiles and panels
    stay clean UI whose depth follows the key light: highlight up and to the
    left, lip and shadow down and to the right. Nothing textured ever sits
    behind a letter. Learning clarity comes before art.
51. **Characters move like stop-motion; navigation never does.** Idle
    character motion steps with `steps()` at about ten frames a second.
    Transitions stay smooth and fast, and nothing a child waits for imitates
    stop-motion. Reduce Motion turns all of it off.
52. **Keep the anchors.** CSS positions the antenna light, the flame, the
    beacon glow, the rocket's landing spot and the station's turntable by
    fixed points in the renders (`docs/ASSET-BRIEFS.md`). Gear is drawn
    in the rocket's own frame, so it needs no anchor of its own. A scene
    change that moves one updates the CSS in the same change.

## The world is the navigation

53. **One stage, drawn from data.** Every child scene sits over the one
    `#stage`. A place — its horizon, its sky, its markers, or the space
    station's room — is drawn by `drawPlace()` from `DESTINATIONS`. A scene never adds a backdrop of its
    own, and never names a place, a picture or a mission. Two backdrops
    fight during a flight, and a hand-placed prop drifts off the ground.
54. **Everything in the world stands at a fraction of its horizon.** Landing
    spots, marker feet and the launch pad are fractions of the horizon
    picture, projected from its camera, and contract 31 holds each one on
    the ground. A vh or px offset floats a prop in the sky on another iPad.
55. **A flight animates transforms and opacity only, and its resting state
    is the destination.** Use `travelTo()`; never swap a picture
    mid-flight. Layout animation stutters on an iPad, and a skipped or
    interrupted flight must still land where it was going.
56. **One mission at a time, one primary action.** On a planet only the
    next marker pulses, and the yellow way home appears only when nothing
    is left to play. Two pulsing things are two instructions to a
    pre-reader.
57. **A new activity is an engine entry, content, and a `GAME_VIEWS`
    entry.** `choose()`, the help ladder, evidence, praise and reprompts
    are shared. A second copy of the ladder is how a game quietly starts
    costing stars or skipping help.

## One shell for every game

These came from the Phase 2 real-iPad QA, which found good games inside
a shell that felt like web pages.

58. **One HUD, drawn from state.** The HUD owns the top band of every
    child scene (`--hud-h`): the way back top left, the place or the game
    in the centre (a title, then a few words of task), the stars top
    right. `setHud()` decides what it shows from the scene and the
    content. A scene never draws a corner button, a title or a star count
    of its own: each scene once did, and every one was a giant disc.
59. **Quiet marks, full targets.** A HUD mark is `--hud-mark`; the button
    around it is a full `--touch-kid`. On a short screen `--ui` shrinks
    marks and type, never a target, and `--hud-side` keeps every target on
    the screen.
60. **Size the child world in `--vh` and `--vw`, never in `vh` or `vw`.**
    They are the viewport actually visible, measured by `fitViewport()`.
    On iPad Safari 100vh is taller than the visible page. A contract
    refuses raw units in the child world.
61. **The CSS owns the game's box; `playfieldSizes()` fills it.** Never
    give a game element a minimum pixel size that can push it out of its
    box: Rhyme Radar's pictures climbed under the HUD on a real device
    exactly that way. A new game adds its shapes to `playfieldSizes()`
    and to contract 37's sweep.
62. **A trip is a plan, built from motifs by rule.** `travelPlan()`
    chooses the motifs (clouds, cruise, shooting star, asteroids, light
    tunnel, station) and the five phases from where a trip starts and
    ends and whether it has been flown before. Never by chance, and never
    a new engine per route. A common trip stays 2–3 s with its settle, a
    first arrival 3–4 s, a repeat shorter. What a flight passes is made by
    `travelFx()` for that flight alone and cleared when it lands.
63. **The resting stage is written down.** `stageRestingProblems()` lists
    what must be true when nothing is flying. `checkStage()` runs after
    every flight, at boot and when the app comes back into view; it
    redraws from state and counts the repair for the grown-ups area. A new
    stage layer or class adds its rule there. A device once showed a
    planet drawn wrong at rest, and it was never reproduced.
64. **An answer being praised owns the screen.** `session.input` says who
    owns a tap: `intro` (a tap skips to the question), `open` (answers are
    taken), `wait` (praise, correction, between rounds: a tap waits). A
    wrong answer holds taps for `TIMING.wrongHold`. A feedback tap never
    calls `Voice.stop()`, and `Voice.skip()` refuses to cut praise. On a
    real iPad, fast taps in Letter Explorer cut the praise off.
65. **Dialogue timing belongs to `AUDIO_TYPES`.** A pause before or after a
    line, its minimum hold, and whether a tap may cut it follow the cue's
    type (`cueType()`), not a timeout written into a scene.
66. **Arrivals settle before taps.** After touchdown, `settleInto()` plays
    the dust, Pip and the HUD, and only then clears `session.busy`. A
    marker tapped during the settle is not a start.
67. **A rocket wears one thing per slot.** Paint is a colour token. Gear is
    a picture in the rocket's own 640×800 frame, laid over the paint
    layer. A theme is a pattern of colour tokens through the same paint
    mask. Every slot has a free starter, so a saved look is never empty,
    and a record saved before a slot existed reads as its starter: no
    migration. The space station writes stars and rocket only.

## One voice, and sounds a child can trust

These came from Phase 3, which built the audio foundation and the first
reading games on it (docs/AUDIO.md).

68. **One audio owner.** Every spoken line is a typed cue (`AUDIO_TYPES`),
    played by `Voice` one at a time and resolved in one place,
    `audioRoute()`. Never call `speechSynthesis` or play a sound outside
    it; a contract checks that the speech API appears nowhere else.
69. **A phonics cue never reaches the device voice.** A phoneme, a word said
    sound by sound and a blended word resolve to a recording, then the
    development phonics voice, then the caption — never the device voice,
    even when a recording fails. Contract 39 proves it with the device voice
    available.
70. **Development audio says so, everywhere.** The development phonics voice
    is labelled in the code, the grown-ups area and docs/AUDIO.md, and is
    never called final. docs/AUDIO-RECORDINGS.md is derived by
    `npm run config:sync` and lists every recording that replaces it: never
    hand-edit it.
71. **A letter's name and its sound are different things.** The name is
    `LETTERS[L].speak` (cue `letter.L`); the sound is `LETTERS[L].sound`, a
    `PHONEMES` id (cue `phoneme.x`). Word Builder plays a letter's sound,
    never its name, and blending is taught as sounds.
72. **One word knowledge base.** Every word lives once in `WORDS` (picture,
    rime, beats, phonemes, level). A game never keeps its own word list, and
    CVC is derived (`isCvc()`), never flagged by hand.
73. **Nothing added takes anything back.** A place is restored by its story
    missions (`restore`); a mission added later is more to play, never a new
    lock on what a child has done. A marker hosts one game and lists its
    missions in order. A place added after children may already have opened
    its route says so (`newIn`) and is shown arriving once.
74. **Review is a rule, not a guess.** A review round lists its candidates in
    the content; `reviewPick()` asks the one that needed help most, then the
    one practised longest ago, never at random.
75. **The sound is the question.** In Sound Scout the screen never shows the
    letter that spells the sound until the picture is found — or when
    nothing can be heard, and then the answer is not evidence.
76. **Sound effects are one family.** Every note from `SFX_NOTES`, sine or
    triangle, short and soft; no jackpot runs and no music. A new moment is
    a recipe in `Sfx`, and contract 45 checks the family.

## Letters to read and write, and words to know

These came from Phase 4, which added little letters, handwriting and sight
words, and so completed the seven learning areas.

77. **One school print.** Every letter or word a child reads is drawn from
    `LETTER_FORMS` by `printSvg()`, never typed in a font. The same strokes
    are animated when Pip writes and followed when the child traces, so the
    "a" a child finds is the "a" they write. The device font was rejected: a
    double-storey a, and a capital I that looks like l.
78. **A letter's case is part of what is learned.** Evidence is kept per
    case (`upper`, `lower`, `match`), and a grown-up's count still
    counts M and m as one letter. Lines say "the big letter" and "the
    little letter", never a bare "little bee" (an insect) or "big pee".
79. **Handwriting is judged by geometry, never recognised.** No model, no
    OCR, no score, no percentage, no "wrong". A trace advances only along a
    stroke's path, in its direction; wandering well off restarts that
    stroke alone; a lifted finger carries on where it stopped, and the green
    dot moves there. A letter is always finished in the end.
80. **The slate owns its pointer, and only the slate.** Pointer Events on
    `#writePad`, which catches them itself (`pointer-events: auto`: the
    scene layer lets taps through, and a real finger passed straight
    through the slate until it did), one pointer at a time, a Pencil beats a touch (a palm), a
    second finger is ignored, a cancel lifts, and `touch-action: none` is
    set there and nowhere else. Nothing half-traced is ever saved.
81. **A sight word comes from a recorded list.** A `WORDS` entry with
    `sight` names its `WORD_LISTS` source and has no picture. The list is
    a source, never a claim: no copy says "aligned" unless
    docs/CONTENT-SOURCES.md records a mapping. Whether a word can be sounded
    out is derived, never written by hand: `soundsOutByLetter()` (the word
    alone) and `decodableHere()` (with the sounds the missions actually
    teach, `taughtSounds()`). A sound in `PHONEMES` is not a sound taught;
    an audit found "and", "it" and "in" claimed decodable with sounds no
    mission taught.
82. **Seen, not heard, is `silentOk`.** A pair of cases, a matched word and
    a trace count as evidence with the voice off; anything asked by sound
    does not (rule 29). A new game decides which it is, in its
    `ACTIVITY_TYPES` entry.
83. **Pictures load by tier, within budget.** Every picture declares
    `load`: `core` (precached with the app), `install` (the icons) or a
    world id (fetched when its route is open or next). A new world's
    pictures are never core. Core stays under 1.2 MB and each world under
    300 KB; a budget is never raised to make something fit.
84. **Where the child goes next is a rule.** Restore first
    (`currentDestination()`), and the visit that restores a place offers
    each game there not yet played, once (`markerNext()`), so a new game
    is met without a menu.
85. **A place in the sky clears Pip's words on every screen.** Pip's
    caption is fixed in pixels while the sky is in fractions, so a phone is
    where they meet. A new sky position is checked at the iPad sizes and at
    667×375 with Pip's longest line showing.

## Releases that arrive by themselves

These came from the v0.6.1 follow-up to an independent audit, from its
first real rollout (v0.6.2), from a second audit (v0.6.3), and from an
installed phone that still did not update (v0.6.4).

86. **A new version moves in only at a quiet moment.** It installs in the
    background and waits; the page asks it to take over when
    `Domain.safeToReload()` says so — home on Earth, at rest, the child
    still, no picture loading — and never within `UPDATE_SETTLE` of the
    page loading, and reloads once, only into a newer version, at a quiet
    moment checked when the reload happens, with no finger down. Never
    mid-mission, mid-letter, mid-flight, in the space station, with a
    grown-ups page open or the lock held. A new state that must not be
    interrupted adds its rule there. A takeover asked while the old worker
    is busy can be held by the browser until the next navigation (the
    v0.6.1 rollout): a held newer version gets one reload at a quiet
    moment, never two in a row.
87. **A failed install never replaces a working version.** The precache is
    fetched fresh (`cache: 'reload'`) and all-or-nothing; runtime caching
    stores only good answers, never a page, and never overwrites a file the
    version installed. Offline is always one version.
88. **Kept offline means the worker said so.** A world's pictures count as
    kept only from the service worker's `keep` answer. A picture requested,
    or even decoded, is not kept. A failed picture is tried again (network
    back, app in front, a backing-off timer), never twice at once.
89. **Test touch, updates and offline in a real browser.** The harness has
    no hit-testing, no service worker and no HTTP cache: contract 50 passed
    while a real finger fell through the slate. A change to input, the
    worker or caching gets a headless-Edge flow with real input or a real
    worker, in a fresh profile.
90. **Rehearse an update from what is installed.** Flows between two builds
    of the new code missed what the first real rollout found: the page
    arrives fresh from the network while the old worker is still in
    charge, and a same-version takeover asked at load was held until the
    next launch. A change to updating is also tried from the previous
    released version, installed in its own profile, with the new one
    opened over it. The hold shows only on a same-tab reload with the new
    worker already waiting; closing the app first lets a waiting worker in
    by the normal lifecycle, and hides it.
91. **Check a reload where it happens.** Asking a worker in is
    asynchronous: it can land long after the quiet moment that asked for
    it, with a child tracing or flying again — v0.6.2 reloaded right then.
    A takeover is only recorded (`'arrived'`); every update reload goes
    through `watchTakeover()`, which checks `quietNow()` at that instant.
    A pending reload is a state of its own, never the waiting worker's.
92. **One update owner reconciles what is real.** A phone suspends the
    page, starts installs before it listens, and wakes it offline: events
    get missed. `reconcileUpdates()` is the only place that decides, and
    it reads the registration as it is (installing, waiting, active)
    rather than trusting that an event arrived. Every trigger — launch,
    front, network back, the worker's events, the heartbeat — calls it. A
    new update behavior goes into it, never into a handler of its own.
93. **A check counts when it succeeds.** Only a successful check restarts
    the ten-minute clock; a failure is retried soon, and at once when the
    network or the app comes back. Throttling keeps a wanted check for
    later instead of dropping it. The grown-ups area says "up to date" only
    after a check that succeeded, and says plainly when it could not check.

## Playing again, and a calmer voice

These came from Phase 5, which made replays ask afresh, added pictures and
rocket gear, and slowed Pip down.

94. **A first play is the mission as written; a replay keeps its shape.**
    Once a mission has a completion, its run's `plan` swaps each non-review
    round for one drawn from the mission's own `replay` pool by the run's
    seed, keeping its guided flag, case, direction, sound, vowel, level and
    number of beats. Review rounds keep their rule, and Moon Writer has no
    pool. A round is read from `run.plan`, never from `m.activities`.
95. **A replay never teaches something new.** A pool holds the mission's
    own items and more of the same kind. A Word Builder word may use only
    the sounds its own mission already asks for, and `taughtSounds()` stays
    derived from the activities as written; `validateContent()` refuses a
    pool that breaks either. Artwork never widens what a mission teaches.
96. **What a run showed is kept on its completion, and only the latest is
    read.** `shown` lets the next replay avoid it. A completion without one
    avoids nothing, and is never reinterpreted from today's content.
97. **The pace is one grown-up choice; phonics keep their timing.**
    `speechPace()` sets the device voice's rate and scales every pause
    (`dialogueScale()`). The development phonics voice is never slowed or
    hurried. A slower device voice is easier to follow, not a better voice:
    never describe it as natural.
98. **A mission's first moment takes no answer** (`TIMING.startHold`): the
    second tap of a double tap on a marker once landed on the new mission's
    answer tile.
99. **On a short screen, a list that cannot fit scrolls sideways, and the
    next thing always half shows.** A target never shrinks to fit, and
    drawing the list again keeps where it was scrolled. The station's paint
    shelf showed four of eight paints on a phone, with no sign of the rest.
100. **A headless browser for QA or encoding runs as a throwaway guest with
     sync off** (`--guest --disable-sync`, its profile deleted after). A
     fresh ordinary Edge profile signed itself into the computer's account
     and started syncing. Another session may be using port 8397: never
     stop what you did not start.
101. **A question cut off from outside the game is asked again.** Turning
     the screen, or the app going to the background and coming back, runs
     `askAgain()`: the question again, and the nudge armed afresh. Going
     to the background once left a silent round that would never be asked
     again. A planet in the sky, like everything a child taps, is a whole
     `--touch-kid` target however small it is drawn.

## Pip's recorded voice

These came from the voice pilot (v0.7.1), the first recordings the app
ships.

102. **A recorded voice says what it is.** The pilot's narration is
     AI-generated (Speechify, a stock voice: never cloned, never a child's,
     never an imitation of a real person or a character). Every file says so
     in its tags; the grown-ups area says so with "Voices powered by
     Speechify", which the service's terms require; docs/CONTENT-SOURCES.md
     records the source. It stays DRAFT until a person has listened.
103. **One voice per exchange.** A pilot recording plays only inside
     `VOICE_PILOT`'s stretch of play (`voicePilot.on`). Inside it, every
     line that stretch can say is recorded, and a family rotates through its
     recorded phrasings only (`pilotTakes()`). A new line the pilot's
     stretch of play can say is recorded with it, or Pip changes voice in
     the middle of an exchange.
104. **Clips are made by `tools/voice` alone.** The key comes from the
     environment, never the repository or the output. The tool stops at its
     monthly budget and at the first 402, and never retries. The registry's
     voice entries are derived from `tools/voice/takes.json` (`build`), and
     `check` records what was measured in `tools/voice/check.json`: a letter
     line is never heard as another letter. Letter sounds never come from
     this voice (rule 33).
105. **A clip is a core asset with its own budget** (under 800 KB, apart
     from the pictures'), answered cache-first in byte ranges by the worker
     (Safari will not play a whole-file answer to a range request), and
     played by the one `MediaVoice` element: one clip at a time, every play
     settled, and the silence that wakes it never pauses a clip (it once
     silenced the line its tap was for). A clip plays at the speed it was
     made; the pace changes only the pauses.
106. **A hold that opens a page is not a tap on it.** The grown-ups lock's
     Back button sits under the finger that held the lock: in Chromium the
     lift closed the page as it opened.
