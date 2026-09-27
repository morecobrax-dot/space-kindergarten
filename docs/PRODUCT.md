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
system, things have gone quiet: the Moon's beacon is dim, and Mercury's
signal is fuzzy. The explorer flies from world to world, finding letters,
rhymes and beats to set them right. Every restored place brightens, and
opens the route to the next.

The story is hopeful, curious and warm. It has no villain, no danger and no
lore to read. It is told through flight, short lines from **Pip** (the guide),
and the world changing.

## The loop

```
open → Earth → see the destination in the sky → Launch → fly →
land on the planet → tap its marker → a short mission →
the world answers: it lights up, brightens, stars arc to the count →
the next marker, or home → the place relit in Earth's sky → Launch / Rocket Dock / stop
```

**The world is the navigation.** There are no menus: places are the
screens, and a place's markers are its missions. Every screen has one
obvious next action, and Earth is always a natural place to stop.

## Phase 2: what is built

The flow is welcome → Earth → Launch → a flight through one world → the Moon
→ tap the beacon → Letter Explorer → the beacon lights, stars arc to the
count → Mercury appears → home → Launch → Mercury → Rhyme Radar → the radar
is fixed → Syllable Meteors → Mercury restored → home → Rocket Dock → reload,
with everything persisted.

| Area | Built |
|---|---|
| The world stage | One continuous stage behind every child scene: space, two star layers, and the place you are in (its sky, its horizon, its markers). Planets are places, not screens |
| Welcome | First launch only, on Earth. Pip introduces itself; the tap also unlocks sound on iPad |
| Earth | A large curved clay horizon across the bottom ~40%; the rocket standing on its launch pad; Pip floating; the Moon (and, once open, Mercury) waiting in the sky, the one Launch will fly to ringed and joined by a dotted path. One huge **Launch**; the Dock, the star count and the grown-ups lock in the corners. Tap a planet in the sky to choose it |
| Flights | The camera moves through the world: lift-off, Earth falling away, parallax stars, the destination growing, its horizon rising, the rocket settling. About 1.3s; 2.2s the first time to a place; a tap skips it; Reduce Motion crossfades. Transforms and opacity only; every picture preloaded |
| A planet | Arrive, hear its story, tap the marker that pulses. One mission at a time; the world lights up and brightens as it is restored; a new route appears in its sky; the way home turns yellow when nothing is left to play |
| Letter Explorer `moon-1` | Six rounds of "hear a letter name, find it" (M S O T S M, uppercase), on Moon stones with clean letter plates. The first round is guided, and difficulty adapts per letter |
| Rhyme Radar `mercury-1` | Five rounds: hear a word and three pictures named, tap the one that rhymes. The harder level adds a picture that starts like the word. Development content |
| Syllable Meteors `mercury-2` | Six rounds: hear a word, tap the stone once for each beat. Only the count is judged; Pip shows the beats after a second miss. Development content |
| Feedback | Correct: a ring, a check mark, praise that names the answer. Wrong: the choice steps aside (a count clears), "Almost! Listen again." Second wrong: the answer is shown |
| Rewards | Three clay stars arc from what was fixed to the star count, which counts up as each lands |
| Rocket Dock | The camera lowers to the pad and the rocket is the hero. Four paints: classic (free), sky (3★), sunny (5★), lime (6★). A tap previews at once, then unlock or use |
| Grown-ups | The journey place by place, practice skill by skill (plain counts, not grades), voice and effects toggles, Reduce Motion, backup, erase, what's new, and storage and privacy status |
| Offline | The service worker precaches the shell and every registered picture (39 files) |
| Replay | A restored place can be visited again; its missions come round in turn, with a shorter arrival line. Replays earn stars too |

## Deliberately not built yet

These are not built yet:

- beginning sounds, CVC words, sight words and handwriting
- more missions, and a bigger word bank
- the other planets (declared as `planned`, never drawn)
- a review mission
- lowercase letters or a school font
- handwriting
- student profiles
- recorded narration
- final (signed-off) artwork: the current pictures are draft renders
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

## What is placeholder or draft (and says so)

- **All artwork is DRAFT.** Every file in `assets/`, and both icons, is a
  clay render made in this repository by `tools/art`.
  - Each is marked `DRAFT` in the registry and in
    [ASSET-MANIFEST.md](ASSET-MANIFEST.md).
  - The grown-ups area says the pictures are early drafts.
  - They are real, consistent artwork: sculpted shapes, shaded as clay under
    one light. They were not made by an artist, though, and none is signed
    off.
  - [ART-DIRECTION.md](ART-DIRECTION.md) sets the look.
    [ASSET-BRIEFS.md](ASSET-BRIEFS.md) says what a final version of each must
    match, so final art can replace the drafts one file at a time.
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

## Phase 2 QA record (2026-09-26/27)

**Tested in Chromium (headless Edge and the in-app browser on Windows) with
emulated iPad viewports, not on a physical iPad.** The real-iPad checklist is
[IPAD-QA-PHASE-2.md](IPAD-QA-PHASE-2.md); nothing in it is marked tested.

| Check | How | Result |
|---|---|---|
| The whole journey | Scripted through the app's own functions, captured at 1180×820 (2×), 1024×768 and 1366×1024: welcome → Earth → flight → the Moon → beacon → Letter Explorer → the world answers → home → Mercury → Rhyme Radar → Syllable Meteors → Mercury restored → home → Dock → Reduce Motion → grown-ups | Passed at all three sizes, no page errors, after fix 4 below |
| Flights | Paused at 16%, 50% and 82% through (Web Animations `currentTime`) | Lift-off with the flame and the pad below; the Moon growing while the rocket crosses; the Moon's ground risen, the rocket settling. No blank frame |
| Composition | The same 19 moments at every size | The horizon fills the bottom ~40% and runs off both sides; the rocket stands on its pad; nothing overlaps the corners; the letters stay clear |
| Reduce Motion | The grown-ups setting, a flight paused half way | A crossfade: nothing slides, the stars do not stream |
| Offline | Headless Edge: loaded once, the network cut in DevTools and the server stopped, then reloaded | The app, Earth, both planets in the sky, the flight to Mercury and Rhyme Radar loaded with **no** missing picture. The v0.3.0 cache holds all 39 registered pictures |
| Contracts | `npm run verify` | 855 passed, 0 failed |
| Mutation check | 25 defects planted one at a time (tiles vs. counts, rhyme leaks, locked markers, uncapped taps, finger bounce, pause judging, captions giving answers away, Mercury open too early, both places drawn, layout animation, the yellow button, anchors, held beats, a floating marker, a wrong beat count, a missing review row, a letter on clay, a scene naming a word) | 23 caught. The other 2 changed no behaviour and were replaced; 3 real gaps they exposed were closed with new contracts |

**Defects found and fixed in QA:**

1. **Rhyme Radar's pictures were missing or tiny.** Their padding was a
   percentage, which CSS takes from the *row's* width, so the word's picture
   in the radar window had no room at all. Padding is now in the card's own
   size.
2. **The destination ring flew with the planet,** spinning round the Moon as
   it grew mid-flight. It now shows only at home.
3. **The flight path lingered** for a moment after lift-off, pointing from
   an empty pad. It now disappears the instant the rocket lifts.
4. **A child could get stuck in Syllable Meteors.** After Pip showed the
   beats, tapping part of the count and pausing was judged as a miss, which
   cleared the shown count — and the stone then waited for a count that no
   longer existed, ignoring every tap. Now, once shown, a pause is only a
   pause, and leaving the app mid-count keeps the count shown. A regression
   contract covers it, and both ways of planting the bug are caught.
5. **The marker's ring faded to nothing** once a cycle. It now breathes but
   never vanishes, like every "tap here".
6. **Two moons at once:** the growing Moon and the rising Moon ground
   overlapped too long. The Moon fades sooner.

**Not physically tested on an iPad** (see the checklist):

- how flights feel and perform on the device, and the first flight to Mercury
- Safari's speech voice, and especially the spoken beats ("ba! na! na!")
- the audio unlock, Web Audio effects
- touch: markers, planets in the sky, the meteor stone, fast and bouncing taps
- the Home Screen install and offline after install
- safe areas, Split View, other iPad sizes

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
