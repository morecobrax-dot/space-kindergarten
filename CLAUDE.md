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
