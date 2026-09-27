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

## Phase 2.2: what is built

Phase 2.2 kept the games and rebuilt the shell around them, from a real-iPad
QA (Rocket 4/10, Travel 5, Rocket Dock 2, World feel 6, Visual polish 6.5).
The flow is welcome → Earth → choose a planet → Launch → one camera journey
(lift-off, clouds, the cruise, the approach, touchdown) → the Moon → the
beacon → Letter Explorer → the world answers → home → Mercury → Rhyme Radar →
Syllable Meteors → home → fly up to the space station → dress up the
rocket → fly home → reload, with everything persisted.

| Area | Built |
|---|---|
| The HUD | One bar over every child scene: the way back top left (the grown-ups lock on Earth), a title and a few words of task top centre, the stars top right. Quiet marks inside full-size targets |
| Lesson titles | LETTER EXPLORER / Find the letter you hear · RHYME RADAR / Find the picture that rhymes · SYLLABLE METEORS / Tap the beats, with progress stars |
| Planet labels | MOON / Letters · MERCURY / Rhymes • Beats (the game's word; the skill stays Syllables for grown-ups), derived from each planet's missions |
| Choosing a planet | The chosen planet comes forward (larger, lit, named with what it teaches), the others wait smaller; the route lights up; Launch shows the chosen planet; Pip says what is there |
| Travel | Five phases (ignite, rise, cruise, approach, touchdown) and a vocabulary of motifs chosen by rule: clouds leaving and reaching Earth, the stellar cruise with rushing specks, a shooting star every other cruise, friendly asteroids one trip in three, a light tunnel on the first trip to Mercury, and the station's bay. About 2.6s with the settle; 3.4s for a first arrival; shorter on a route already flown |
| Arrival | Touchdown dust or light, the rocket's clay giving a little, Pip settling, the HUD fading in; nothing can be tapped until it has settled |
| Shooting stars | Rare (every 13–23s) and deterministic, on the far side of the sky, never over Pip, the caption or the title; not in missions, not in flight, not with Reduce Motion |
| The rocket | Redesigned as a chunky clay toy (chosen from five silhouettes): a tall rounded cone, a big window, big swept fins, a simple engine bell. The paint mask architecture is unchanged |
| The space station | The Rocket Dock as a place: a flight up through the clouds, the station ahead, into its bay, the rocket settling on a turntable. The rocket is the hero; Pip nearby; a window with Earth below; a compact panel on the right |
| Customization | Paint (8 colours), Gear (star topper, tiny antenna, moon topper, side lights, boosters), Themes (Bumblebee with wings, Rainbow explorer, Galaxy explorer). Try on for free, then unlock with stars or use. Nothing random, nothing for money, nothing that changes play |
| Responsive safety | Sized by the viewport actually visible; the HUD scales its marks (never its targets) on short screens; the game's play field fits its box on every screen, picture beside the game on a short phone |
| Rapid taps | An answer being praised owns the screen; a wrong answer holds taps for 0.45s; the same in every game |
| The resting stage | Written-down rules checked after every flight, at boot and on return; a broken rest is redrawn from state and counted in the grown-ups area |
| Dialogue timing | One table (`DIALOGUE`): a breath before and after each kind of line, praise's minimum hold, and whether a tap may cut it |

## Phase 2: what was built

| Area | Built |
|---|---|
| The world stage | One continuous stage behind every child scene: space, two star layers, and the place you are in (its sky, its horizon, its markers). Planets are places, not screens |
| Welcome | First launch only, on Earth. Pip introduces itself; the tap also unlocks sound on iPad |
| Earth | A large curved clay horizon across the bottom ~40%; the rocket standing on its launch pad; Pip floating; the Moon (and, once open, Mercury) waiting in the sky. One huge **Launch**. Tap a planet in the sky to choose it |
| Flights | The camera moves through the world (rebuilt in Phase 2.2, above). Transforms and opacity only; every picture preloaded |
| A planet | Arrive, hear its story, tap the marker that pulses. One mission at a time; the world lights up and brightens as it is restored; a new route appears in its sky; the way home turns yellow when nothing is left to play |
| Letter Explorer `moon-1` | Six rounds of "hear a letter name, find it" (M S O T S M, uppercase), on Moon stones with clean letter plates. The first round is guided, and difficulty adapts per letter |
| Rhyme Radar `mercury-1` | Five rounds: hear a word and three pictures named, tap the one that rhymes. The harder level adds a picture that starts like the word. Development content |
| Syllable Meteors `mercury-2` | Six rounds: hear a word, tap the stone once for each beat. Only the count is judged; Pip shows the beats after a second miss. Development content |
| Feedback | Correct: a ring, a check mark, praise that names the answer. Wrong: the choice steps aside (a count clears), "Almost! Listen again." Second wrong: the answer is shown |
| Rewards | Three clay stars arc from what was fixed to the star count, which counts up as each lands |
| Rocket Dock | Replaced in Phase 2.2 by the space station (above) |
| Grown-ups | The journey place by place, practice skill by skill (plain counts, not grades), the rocket's look, voice and effects toggles, Reduce Motion, backup, erase, what's new, storage and privacy status, and "Display checks" |
| Offline | The service worker precaches the shell and every registered picture (53 files) |
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
- more rocket looks: the dinosaur and space-puppy themes, and more gear
  (Phase 2.2 proved the model with 8 paints, 5 gear and 3 themes). The two
  themes wait until after the voice and audio production phase
- a spinning turntable, and animated station lights beyond the
  turntable's slow breath
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

## Phase 2.2 QA record (2026-09-27)

**Tested in Chromium (headless Edge and the in-app browser on Windows) with
emulated iPad and phone viewports, not on a physical iPad.** The real-iPad
checklist is [IPAD-QA-PHASE-2.2.md](IPAD-QA-PHASE-2.2.md); nothing in it is
marked tested.

| Check | How | Result |
|---|---|---|
| The whole journey | Scripted through the app's own functions, captured at 1180×820 (2×) and 1024×768: welcome → Earth → a flight frozen at six moments → the Moon → Letter Explorer → the world answers → home (clouds rising) → choosing each planet → the first trip to Mercury (the light tunnel) → Rhyme Radar → Syllable Meteors → home → the station flight frozen at three moments → paint, gear and a theme tried on and unlocked → flying home → an asteroid pass → Reduce Motion → grown-ups. 1366×1024, 844×390 and 667×375: Earth, the three games, the station | No page errors, no resting-stage problem after any step, and no repair at any size, after the fixes below |
| Rhyme Radar, the reported defect | Reproduced at 844×390 on v0.3.0 (the pictures rose under the top bar), then measured on the new build at every size | Every picture, the title, Pip and the stars keep their own space; a row layout on short phones |
| Offline | Headless Edge: loaded once, the network cut in DevTools and the server stopped, then reloaded and played through Earth, a flight, the Moon, Mercury, Rhyme Radar and the space station | The v0.4.0 cache holds 56 entries (the shell and all 53 pictures). No missing picture anywhere, including the flight's clouds, the station and the gear chips; the stage at rest |
| Contracts | `npm run verify` | 1015 passed, 0 failed |
| Mutation check | 40 defects planted one at a time in the new state rules: tap ownership, dialogue timing, travel plans, the resting stage, arrival, the HUD, planet labels and focus, the play field, looks and the station, ambient shooting stars | First run: 36 of 38 caught. The 2 missed exposed weak tests (a flight awaited before checking it had landed; Reduce Motion checked inside a mission, where shooting stars are off anyway). Both tests were strengthened and now catch them, as do 2 more mutants for the fixes: all 40 caught |

**Found and fixed in browser QA:**

1. **The clouds passed after Earth had gone,** grey and small, because they
   started far above the screen, at 80% opacity, behind the ground. They
   now sweep past while Earth falls away, solid, between the ground and
   the rocket.
2. **A stale caption:** coming home from the station, Earth's bubble still
   said "To the station!". Entering a scene now clears its caption.
3. **An asteroid crossed right behind the rocket,** which reads as a near
   miss. The rocks now drift down the edges, away from the rocket.
4. **Gear was invisible in its chip:** a topper is about 10% of the
   rocket's frame. A chip now zooms onto where each piece sits.
5. **The station's panel ran the full height,** mostly empty glass. It now
   hugs its contents.
6. **The chosen planet's label and the route lingered** for a moment after
   Launch. They now go with the controls.
7. **The growing destination overlapped its own rising ground** for too
   long. It now dissolves as the ground rises.
8. **After a relight, the first planet choice redrew the whole sky** (a
   stale `data-held` in the drawn sky; a possible blink on a device). The
   hold is now released in place and the redraw record kept in step.

**Not physically tested on an iPad** (see the checklist):

- how the flights, clouds, tunnel and station feel and perform on the device
- the HUD's marks and targets under a real finger; Safari's toolbar; Split View
- the rocket's new look at iPad size; the toppers' size; the station
- rapid taps with real fingers, and the dialogue pauses with the device voice
- the Home Screen install, offline after install, and the v0.3.0 → v0.4.0
  update on a device that already has progress

**Decided at the device gate (2026-09-27):**

- **Mercury's label is "Rhymes • Beats",** the game's own word ("Tap the
  beats"). Presentation only: the skill is still Syllables in the
  learning data, the docs and the grown-ups area.
- **The rocket is not reframed yet.** The star and moon toppers' size is
  unproven until seen on the iPad; a Rocket score under 7 because the
  gear is too small is the evidence that would justify it.
- **Prices stay:** 3 stars a mission, paint and gear 3–6, themes 8–10.
  The economy is revisited once there is substantial curriculum, not with
  three missions.
- **The dinosaur and space-puppy themes wait** until after the voice and
  audio production phase.

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
| Mutation check | 25 defects planted one at a time (tiles vs. counts, rhyme leaks, locked markers, uncapped taps, finger bounce, pause judging, captions giving answers away, Mercury open too early, both places drawn, layout animation, the yellow button, anchors, held beats, a floating marker, a wrong beat count, a missing review row, a letter on clay, a scene naming a word) | First run: 17 of 22 caught. Of the 5 missed, 2 changed no behaviour (equivalent) and were replaced by a real one; the other 3 exposed genuine test gaps, now closed. With 2 more for the soft-lock (fix 4), all 23 meaningful defects are caught |

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
