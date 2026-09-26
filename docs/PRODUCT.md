# Product

## Thesis

Learning, exploration, a light story, visible progress and small cosmetic
rewards, for kindergarten children (about five to six) on iPad.

The feeling to aim for is *"I'm going on a space adventure,"* not *"I'm doing
schoolwork."* The permanent rule is:

> **Learning first. Adventure makes learning fun.**

No reward, animation, story beat or customisation may get in the way of
learning clarity. When a decision is uncertain, simplify the child's
experience and keep the complexity behind the scenes.

## Who uses it

- **The child** is a pre-reader or early reader, with limited fine motor
  control. They understand the app through **voice, pictures and motion**,
  not labels.
- **A grown-up** (parent or teacher) sets things up, checks progress and
  manages data, behind a 3-second hold on the lock icon on Earth.

## The story

The child is a new space explorer, and Earth is home base. Across the solar
system, friendly beacons have gone dim. The explorer flies from world to world
finding letters (and, later, sounds and words) to light them again. Every
restored place brings more light to the map.

The story is hopeful, curious and warm. It has no villain, no danger and no
lore to read. It is told through flight, short lines from **Pip** (the guide),
and the world changing.

## The loop

```
open → Earth → see the destination → Launch → fly → a short mission →
celebration → stars → the Moon relit on the map → next mission / Rocket Dock / stop
```

Every screen has one obvious next action, and the Earth screen is always a
natural place to stop.

## Phase 1: what is built

The flow is welcome → Earth → Launch → space travel → Moon → one
letter-recognition mission → supportive feedback → celebration → stars → home
→ Rocket Dock → unlock and equip a paint → reload, with everything persisted.

| Area | Built |
|---|---|
| Welcome | First launch only. Pip introduces themself; the tap also unlocks sound on iPad |
| Earth | Earth fills half the screen. The rocket stands on it, and a dotted path leads to the Moon. One huge **Launch**, plus the Dock, a star count, and the grown-ups lock |
| Travel | About 1s, 2.6s on the first arrival. A tap skips it; with Reduce Motion it is a crossfade |
| Mission `moon-1` | Six rounds of "hear a letter name, find it" (M S O T S M, uppercase). The first round is guided, and difficulty adapts per letter |
| Feedback | Correct: pop, ring, check mark, "Yes! That's the letter em." Wrong: the tile wiggles and steps aside, "Almost! Listen again." Second wrong: the answer is shown |
| Celebration | The beacon lights, 3 stars arrive one by one, and one button leads back to Earth |
| Progress | The Moon glows on Earth's sky, the star count updates, and the Dock sparkles when a paint is affordable |
| Rocket Dock | Four paints: classic (free), sky (3★), sunny (5★), lime (6★). A tap previews at once, then unlock or use |
| Grown-ups | Progress counts and letters practised (plain counts, not grades), voice and effects toggles, Reduce Motion, backup, erase, what's new, and storage and privacy status |
| Offline | The service worker precaches the shell and every registered asset |
| Replay | A finished Moon offers its mission again, with a shorter arrival line. Replays earn stars too |

## Deliberately not built yet

These are not built yet:

- the other six learning areas
- more missions
- the other planets
- a review mission
- lowercase letters or a school font
- handwriting
- student profiles
- recorded narration
- final artwork
- ambient music
- Capacitor or native packaging

These are never planned:

- a backend
- accounts
- analytics
- ads
- purchases
- streaks
- leaderboards
- chat
- AI

## What is placeholder (and says so)

- **All artwork:** every file in `assets/` and both icons. Each is marked
  `PLACEHOLDER` in the registry and in
  [ASSET-MANIFEST.md](ASSET-MANIFEST.md), and the grown-ups area says the
  pictures are temporary. The target is sculpted clay; see
  [ART-DIRECTION.md](ART-DIRECTION.md).
- **The voice:** the device's built-in speech synthesiser, labelled as a
  temporary stand-in in the grown-ups area and in code. Every line already has
  a script (`VOICE_CUES`) ready for a voice actor.
- **Sound effects:** synthesised with Web Audio, soft and short. Final sound
  design is still to come.
- **The working title,** "Space Kindergarten". The permanent internal id is
  `space-kindergarten`, which the name can change without affecting.

## Privacy and safety

The app is local-first, and nothing is sent anywhere. A contract forbids
`fetch`, XHR, beacons, sockets and outbound links. An explorer has no name,
email, age or location. The grown-ups gate is a 3-second hold, which is enough
to stop an accidental tap, and erasing progress also asks for confirmation.
Nothing inside the gate spends money or leaves the app.

**Safari storage risk.** Safari may clear a website's script-written storage
after about 7 days without a visit, unless the app has been added to the Home
Screen. The app asks for persistent storage, shows the status in the grown-ups
area, and recommends adding to the Home Screen and exporting backups. Native
packaging removes this risk.

**If the App Store route is taken:** the Kids Category would expect a stronger
parental gate (one that needs adult-level knowledge) before any external link
or purchase. There are none of either today.

## Phase 1 QA record (2026-09-26)

**Tested in the in-app browser (Chromium on Windows) with emulated iPad
viewports, not on a physical iPad.**

| Check | How | Result |
|---|---|---|
| Fresh install to first star | Real clicks, 1024×768: welcome → Earth → Launch → flight → mission → celebration | Passed |
| Wrong answers | Real clicks: one miss ("Almost!", the tile steps aside), two misses (the answer is shown) | Passed after fix 1 below |
| Stars never duplicated | Double-tap on the final answer; double-tap on Unlock | One earning, one spend |
| Cosmetic | Locked paint explains the shortfall; unlock then equip; leaving the Dock discards an unchosen preview | Passed |
| Reload persistence | Reload after the Dock | Opens on Earth: 0★, Sky blue rocket, Moon relit, 4 letter records |
| Grown-ups gate | Dispatched pointer events: a 1.5s hold does nothing, a 3.5s hold opens the page | Passed (not a physical long-press) |
| Sound off | Voice toggled off in the grown-ups area | The caption shows "Find M"; those rounds are not counted as evidence |
| Reduce Motion | The grown-ups setting | A 0.37s crossfade flight, Pip still, halo and rings still, after fix 2 below |
| Offline | Precache checked (17 entries, none missing), then the dev server **stopped** (connection refused) and the page reloaded | Opened from cache with every image loaded |
| Viewports | 1024×768, 1133×744, 1180×820 and 1366×1024 landscape; 768×1024 portrait | No horizontal overflow at any size. Portrait shows the rotate prompt, and the grown-ups page works over it |

**Defects found and fixed in QA:**

1. **The wrong-answer feedback was invisible.** The tiles' entry animation
   kept its last frame (`fill: both`) and, being more specific, overrode the
   wiggle, the step-aside dim and the correct-answer pop. The logic was right,
   but the child saw nothing change.
2. **Reduce Motion left pseudo-elements animating.** The inherited rule
   targeted `*`, which does not match `::before`/`::after`, so the Launch
   halo, the hint ring and the destination ring kept pulsing. A contract now
   guards this.
3. **A silent voice froze the flow.** When speech was blocked, the child
   waited out a 10-second safety timer. Lines that do not start within 1.2s
   now fall back to caption pacing.
4. **Turning the iPad sideways** wrote "Turn your iPad sideways" into the
   mission's bubble and did not re-ask the question. The rotate line is now
   off-screen, and the question is asked again when the iPad is back in
   landscape.
5. **Layout and visibility.** The Moon's destination ring overlapped the star
   count, and the guided "tap here" ring faded to invisible each cycle.

The contract suite runs the same journey in Node, and a mutation check showed
it catches six planted defects.

**Not physically tested on an iPad:**

- Safari's speech voice and its latency
- the audio unlock on the first tap
- Web Audio effects
- touch precision and palm touches
- the Home Screen install and standalone launch
- offline after install
- safe areas with the home indicator
- Split View
- the Apple Pencil (handwriting is not built yet)
