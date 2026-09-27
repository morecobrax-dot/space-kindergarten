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
    temporary synthesiser; letter *sounds*, blending and CVC need recordings.
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
    `--paint-*` token and a `COSMETICS` line. Never add one rocket image per
    colour, and never tint anything else in CSS.
50. **Clay is for the world, not the controls.** Buttons, tiles and panels
    stay clean UI whose depth follows the key light: highlight up and to the
    left, lip and shadow down and to the right. Nothing textured ever sits
    behind a letter. Learning clarity comes before art.
51. **Characters move like stop-motion; navigation never does.** Idle
    character motion steps with `steps()` at about ten frames a second.
    Transitions stay smooth and fast, and nothing a child waits for imitates
    stop-motion. Reduce Motion turns all of it off.
52. **Keep the anchors.** CSS positions the antenna light, the flame, the
    beacon glow and the rocket's landing spot by fixed points in the
    renders (`docs/ASSET-BRIEFS.md`). A scene change that moves one updates
    the CSS in the same change.
