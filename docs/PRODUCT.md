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
system, things have gone quiet: the Moon's beacon is dim, Mercury's signal
is fuzzy, Mars's sound scanner cannot hear, and Jupiter's sky signs have
lost their words. The explorer flies from world to world, finding letters,
rhymes, beats, sounds and words to set them right, and learns to write
letters on the Moon's writing slate. Every restored place brightens, and
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

## Phase 5: what is built (v0.7.0)

Phase 5 made the app worth coming back to: a mission played again asks
afresh, the rocket has more to earn, the pictures that make that possible
are drawn, and Pip speaks more calmly. Complexity stays behind the scenes;
the child's choices are the same taps as before.

| Area | Built |
|---|---|
| Replays ask afresh | A mission's first play is always as written. Once finished, a replay keeps its shape — as many rounds, the guided round in place, the same case and direction, sound, vowel, level and number of beats, and every review round with its own rule — and draws each other round from the mission's own list, by the run's seed. Within a run nothing comes back while the list has more; what the last run asked waits its turn, and a replay never starts as the last one did. A list too small repeats honestly. Moon Writer keeps its stroke order. A replay never adds a letter or a sound the mission does not teach |
| Replay from a marker | Once the visit's mission is played, a lit marker plays its game again ("Let's play it again!"), its finished missions in turn. The way home stays the yellow next step, and a game not yet played waits for a visit of its own. It used to say "Tap it to play again!" and do nothing |
| What a replay records | Its answers and evidence are for what it asked, and its completion keeps a short list of what that was (`shown`), so the next replay can avoid it. Older completions have none, and nothing is guessed for them |
| Eleven new pictures | bat, bun, pup, hut, fox, box, mouse, nest, seal, robot and butterfly, rendered by the same clay renderer and light: new rhyme pairs (fox/box, hat/bat, cup/pup, nut/hut, sun/bun), a third picture for each held sound in Sound Scout, two more short-u words to build (bun, hut), and more beats (robot, butterfly). All core pictures: 1,151,750 bytes, 91.5% of the 1.2 MB budget |
| More for the rocket | Two paints (Midnight blue, Moon silver), two themes (Polka dots, Race checkers: patterns through the same paint mask) and three pieces of gear (a planet ring, a satellite dish, party flags), each rendered in the rocket's own frame. 22 things cost 123 stars: a first pass through the 20 missions unlocks about 13, and everything takes 41 missions, 21 of them replays |
| A calmer voice | Pip speaks at a calm pace by default (0.86 of the device voice's speed, and longer pauses where a child listens: after an instruction, between the pictures named, after "almost"), and asks a question again only after 14 seconds. Grown-ups can choose "A little quicker". Letter sounds keep their own timing. The voice is still the device's own: easier to follow, not more natural |
| The recording list | [AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md) now lists every line built from a template, family by family, with each phrasing and every item it is said for (1055 lines), not just the authored ones |
| On a phone | The space station's things are a shelf that scrolls sideways, with the next one half showing (four of eight paints showed before, with no sign of the rest); the prompt to turn the screen no longer says "iPad" |
| Rapid taps | A double tap on a marker no longer answers the new mission's first question with its second tap |
| Back from the background | A question the app was in the middle of when it went to the background is asked again when it comes back, and Pip's nudge waits afresh; before, the round sat silent and was never asked again |
| Planets on a phone | A planet in Earth's sky is a whole child-sized target however small it is drawn (Mars was a 41 px target on a small phone) |

## Reliable updates: what changed (v0.6.4)

A user's installed phone app still showed an older release. The website
served the newest files; the installed app did not take them. The v0.6.3
updater had gaps that a phone meets every day: it checked only at launch
and on coming to the front, a failed check silenced it for ten minutes,
the network coming back checked nothing, a finger held still counted as
idle, and several states (a takeover missed while suspended, a stubborn
held one) could stop it for the rest of a session.

| Area | Built |
|---|---|
| One owner that reads what is real | `reconcileUpdates()` decides everything, on every trigger — launch, the front, the network back, the worker's events, the grown-ups area, and a heartbeat every 3 s while the app is on screen. It reads the registration as it is (installing, waiting, active), so an event missed while suspended no longer matters |
| Releases are found while the app stays open | The heartbeat checks every 10 minutes after the last successful check — no launch or trip to the background needed |
| A failed check is retried | Only a check that succeeded restarts the ten-minute clock. A failed one is retried at once when the app or the network comes back, and otherwise after 30 s, doubling to 10 minutes. A release whose install fails backs off on its own count. Checks are at least 15 s apart; one asked for sooner is kept, not dropped |
| Stalled states recover, within bounds | A takeover whose event was missed is noticed; a stubborn held one is helped again only after 10 minutes, and checks go on meanwhile |
| A held finger is not idle | A finger down never counts as a quiet moment, however long it rests; the quiet clock restarts when it lifts |
| A grown-up can see it | The grown-ups area shows "Updates" (checking, downloading, ready at the next quiet moment, offline, could not check and retrying, or up to date — only after a check that succeeded) and "Saved for offline" (the version the app opens offline) |

## The late takeover: what changed (v0.6.3)

A second independent audit found that an update could still restart the app
in the middle of play. v0.6.2 checked for a quiet moment when it asked a new
version in, but taking over is asynchronous: when the new worker came in
later — with the child already tracing a letter or flying — the page
reloaded on the spot.

| Area | Built |
|---|---|
| A takeover is recorded; the reload waits | When the new worker comes in, the page only records it and owes one reload. The reload happens at a quiet moment checked at that instant — home on Earth, at rest, no touch for 2.5 s — found by the same poll that looks for a quiet moment to ask. The child's controls stay live; nothing is frozen, and no delay was added |
| One owner for every update reload | Both update reloads (a newer version come in; the one helping reload for a held takeover) go through one watcher and one quiet check. A pending reload no longer depends on the worker still waiting |
| A held one that comes in late | A held newer version that comes in after the page stopped trying now gets its one reload at the next quiet moment, instead of leaving the page on the old version under the new worker until the next launch |
| The lock held | A grown-up holding the lock to open the grown-ups area counts as grown-up activity. A held finger sends no new touch, so the touch guard alone could pass during the three-second hold |

## Phase 4 follow-up, first rollout: what changed (v0.6.2)

The first real rollout of v0.6.1 (the live v0.6.0 installed with progress in
its own browser profile, then reopened once v0.6.1 was live) found that a
new version could wait until the app was next opened before moving in.

| Area | Built |
|---|---|
| A new version moves in on time | Asked to take over while the old worker was still serving the page's first loads, Chromium held the new worker waiting until the next navigation: the app showed v0.6.1 while v0.6.0's worker stayed in charge until a later launch. The app now lets itself settle (4 s after loading) and waits until no world picture is loading before it asks. In the same local rehearsal, the old timing left the new version waiting in 2 of 3 runs; the new timing brought it in within 8 s in 7 of 7, with no reload |
| A net under it | A newer version still held 8 s after it was asked gets one reload at a quiet moment (a navigation lets it in), marked on the tab so it is never forced twice in a row; the next launch brings in a stubborn one. A held worker of the page's own version changes nothing on screen: the page stops waiting on it and keeps looking for later versions |
| A rule for next time | CLAUDE.md rule 90: a change to updating is rehearsed from the previous released version, installed in its own profile, with the new one opened over it |

## Phase 4 follow-up: what changed (v0.6.1)

A maintenance release after an independent audit of v0.6.0: two findings
fixed, and releases now reach an installed app by themselves.

| Area | Built |
|---|---|
| World pictures recover | A world's picture that failed to load was marked done for good (the audit saw eight failed Jupiter requests and no retry after the network came back). Each picture is now pending, loaded or failed; a failed one is tried again when the network returns, when the app comes back to the front, and on a timer that backs off (15 s, doubling, up to 10 minutes); never twice at once |
| Kept means stored | A near world's pictures count as kept offline only when the service worker says it holds them (a `keep` request). A fresh install keeps its near world in its first session |
| Decodability, corrected | "and", "it" and "in" were claimed decodable with the sounds the app teaches; no mission teaches /d/ or short i. Decodability is now derived, in two parts kept apart: letter by letter (the word alone) and with what the missions teach. Today only "can" is decodable with what is taught. No stored progress was touched |
| Releases arrive by themselves | The app looks for a new version at launch and when it comes back to the front (at most every 10 minutes). A new version installs in the background and moves in at a quiet moment — home on Earth, at rest, the child still — with one reload. Never mid-mission, mid-letter or mid-flight. Progress, stars, the rocket, settings and a world's pictures are kept. Quiet to a child; the grown-ups area shows the version |
| A failed update changes nothing | A new version is installed fresh and all or nothing: if any file cannot be fetched, the install fails and the working version stays, offline too. What the network brings never replaces what the version installed, so offline is always one version |
| Standing release policy | Recorded in CLAUDE.md: every completed implementation request is released and verified in production without a separate request |

## Phase 4: what is built (v0.6.0)

Phase 4 completed the learning product's shape: all seven learning areas
now have a first game. It added little letters and big-and-little pairs,
handwriting (Moon Writer), and sight words on a new world, Jupiter. The
flow runs Moon (letters, writing) → Mercury (rhymes, beats) → Mars
(sounds, words) → Jupiter (sight words).

| Area | Built |
|---|---|
| Little letters | Every letter has a little shape, a little-letter family and its own look-alikes (b d p q; n h u; i l j). Letter Explorer finds little letters by name ("Find the little letter em."), and matches big and little partners (one shown on a plate, find the other). A child hears "big" and "little"; "uppercase" and "lowercase" stay in grown-up docs. Evidence is kept per case |
| The school print | Every letter a child reads is drawn from the same strokes a child learns to write: ball-and-stick, a single-storey a and g, a capital I with bars, round-ended strokes, one shared baseline in a round. No font is bundled; the device font was rejected |
| Moon Writer | On the Moon's writing slate: Pip writes a letter (the stroke drawn along its path, a pen moving with it; whole, stroke by stroke, with Reduce Motion), the child traces it with the path shown (lanes, a dashed middle, an arrow, a green start), then again with less help. Watch again and start again beside the slate. L, T, H; O, C and a review; little c, a, d |
| Tracing by geometry | No recognition, no score: a trace follows each stroke from its start, in its direction, to its end, within a corridor. Wandering well off restarts that stroke alone; a lifted finger carries on (the green dot moves there); going back to a stroke's start begins it again. Watching again or a restart counts as help, never as wrong |
| Touch and the Pencil | Pointer Events on the slate only: a finger or an Apple Pencil (never required), one pointer at a time, a Pencil beats a resting palm, a cancelled touch lifts, no page scroll or selection under the slate. On a short phone the slate stands in front of the ground, so letters stay big enough for a finger |
| Jupiter | A giant, friendly clay world of rolled cream, amber and orange bands with one big storm swirl, after Mars. Its markers are a sky sign (Star Words) and an orbit ring (Word Orbit). Restored by one of each |
| Star Words | Hear a sight word; find it among three floating word satellites. The word is never on screen as the clue. The harder level puts a look-alike beside it (it, is) |
| Word Orbit | A word at the centre; find the one just the same on the ring below. Seen, not heard, so it counts with the sound off |
| Sight-word source | Twelve words of the Dolch pre-primer list (the, and, see, you, to, go, is, it, in, can, we, my), chosen from three candidate sources and recorded in [CONTENT-SOURCES.md](CONTENT-SOURCES.md) as a source, never claimed as alignment. Whether each sounds out letter by letter, and with the sounds this app teaches, is derived, never flagged (v0.6.1: only "can" is decodable with what is taught) |
| More missions | 20 missions and 117 rounds (from 11 and 64): the Moon 8 (Letter Explorer ×5, Moon Writer ×3), Mercury 4, Mars 4, Jupiter 4 (Star Words ×2, Word Orbit ×2) |
| Meeting new games | The visit that restores a place also offers the first mission of any game there not yet played, so a new child meets the writing slate straight after relighting the Moon. With every open place restored, Earth points to the first place with something new |
| Review across skills | A little letter needing help comes back as a little letter and brings back its sound; a sound brings back a word starting with it; a hard sight word comes back in either sight game; a letter traced with help comes back with less help |
| Grown-ups | Seven plain counts: Letters practiced, Rhyming words practiced, Beginning sounds practiced, Syllable words practiced, Words built, Sight words practiced, Letters traced; then each item ("Traced 2 times · traced without help 1 time"). A letter counts once whatever its case |
| Pictures by tier | The precache holds only the core pictures (78, 1.04 MB) and the shell; the home-screen icons are fetched at install; Jupiter's 8 pictures (196 KB) are fetched once its route is near and kept offline, and carried into each new version's cache |
| Upgrades | A v0.5.0 journey opens with everything it had: Jupiter arrives in the sky once, Launch goes there, and the Moon's writing slate waits |

## Phase 3: what is built (v0.5.0)

Phase 3 built a permanent voice and educational-audio foundation, then two
reading games that depend on it, on a new planet. It also added missions
across the journey so the app is no longer a three-mission demo. The flow
now runs Moon (letters) → Mercury (rhymes, beats) → Mars (sounds, words), and
every place has more to play once it is restored.

| Area | Built |
|---|---|
| One audio owner | Every spoken line is a typed cue (story, instruction, question, praise, correction, hint, word, letter name, phoneme, word said sound by sound, blended word; sound effects are their own family). A cue resolves in one place (`audioRoute()`): a recording, then the development phonics voice or the device voice, then the caption. Only one sound plays at a time, in order. [AUDIO.md](AUDIO.md) |
| Phonics safety | A letter's sound, a word said sound by sound and a blended word are never given to the device voice (it says /m/ as "muh"). A letter's NAME and its SOUND are different cues and different data |
| Development phonics voice | A small formant synthesiser made for this app. It plays letter sounds, segmented words and blends with no vowel after a sound. It is deterministic, needs no files, and is **labelled development audio everywhere**. [AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md) lists the 35 recordings that replace it |
| Pacing | Each cue type has its pause before and after, a minimum hold and whether a tap may cut it. The device voice speaks sentence by sentence with punctuation pauses. A question never follows a story at once, and there are no dead spaces |
| Pip's voice | Warm, curious, encouraging, clear, playful, calm; speaks only when it helps. Written down in [AUDIO.md](AUDIO.md#pips-voice) |
| Sound design | One soft family in one scale: ignition, travel, touchdown, correct, gentle correction, star, restoration, the station, equip, and Word Builder's place/lift/build. No music |
| Mars | A red clay playground, after Mercury. Its first trip passes friendly rocks. Its two markers are a sound scanner and a word machine. Restored by a Sound Scout and a Word Builder |
| Sound Scout | Hear a sound (/m/ /s/ /f/ /n/ /r/), find the picture that starts with it. The pictures rise onto rocks as they are named, and the letter shows only after the answer |
| Word Builder | Hear a CVC word sound by sound, tap its letters into three slots (a letter plays its SOUND), tap one back to undo, hear it blended, see its picture. The help ladder is a gentle correction, then building it together |
| One word knowledge base | Every word once, in `WORDS`: picture, rime, beats, sounds (phonemes), first sound, level, review status. `PHONEMES` names the sounds, and `LETTERS` gives each letter a name and a sound |
| More missions | Letter Explorer ×3 (Moon), Rhyme Radar ×2 and Syllable Meteors ×2 (Mercury), Sound Scout ×2 and Word Builder ×2 (Mars): 11 missions, 64 rounds |
| Markers host games | One marker per game on each world; its missions come one after another, with a small lamp for each played. A place is restored by its story missions, so new missions never lock anything a child has done |
| Review by rule | A few rounds bring back what the child found hardest, chosen from their answers by a rule a grown-up could follow on paper. It works across games: a letter needing help comes back as its sound |
| Upgrades | A v0.4.0 journey opens with everything it had. Mars appears for it once, arriving in Earth's sky |
| Pictures | 17 new clay word pictures, and Mars (horizon, planet, scanner, word machine, rock pedestal), all rendered by `tools/art` |

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
| Dialogue timing | One table (`DIALOGUE`; since Phase 3, `AUDIO_TYPES`): a breath before and after each kind of line, praise's minimum hold, and whether a tap may cut it |

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

- sight words in a sentence (a sentence with a word missing): a sentence
  with exactly one right answer is hard to write ("I see ___ dog" has
  several), so it waits
- more letters to write (the rest of the alphabet has its strokes, for
  reading), and writing without an outline
- the rest of the sight-word list (28 more pre-primer words, then primer)
- short i, o and e CVC words, consonant blends and digraphs (sh, ch, th),
  and a bigger word bank
- recordings: every sound, word and line is still the development phonics
  voice or the device voice (see "placeholder" below)
- the other planets (declared as `planned`, never drawn)
- a review mission
- student profiles
- final (signed-off) artwork: the current pictures are draft renders
- the dinosaur and space-puppy themes, which still wait until after the
  voice and audio production phase (Phase 5 added two paints, two themes
  and three pieces of gear: 10, 8 and 5 now)
- short-a words to build with /b/ (bat is drawn, for rhymes, but no short-a
  mission asks for /b/ yet), and replays that mix earlier missions' items
  (review rounds do that, by rule)
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
  temporary stand-in in the grown-ups area and in code. Phase 5 slowed it to
  a calm pace; that makes it easier to follow, not more natural. Every line
  already has a script ready for a voice actor, the lines built from
  templates included ([AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md)).
- **Letter sounds, words said sound by sound, and blended words** are
  DEVELOPMENT AUDIO: a formant synthesiser in the app, never the device voice,
  labelled in the code, the grown-ups area and [AUDIO.md](AUDIO.md). The 39
  recordings that replace them are listed in
  [AUDIO-RECORDINGS.md](AUDIO-RECORDINGS.md). Nobody has judged these sounds
  on an iPad yet.
- **Sound effects:** synthesised with Web Audio, soft and short. Final sound
  design is still to come.
- **The letterforms and their stroke order** are original to this app and
  await an educator's review ([CONTENT-REVIEW.md](CONTENT-REVIEW.md) section
  21); so do the sight-word set and the tracing tolerances.
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

## Phase 5 QA record (v0.7.0, 2026-09-28)

**Tested in the harness, and in Chromium (headless Edge on Windows, every
run a throwaway guest session with sync off) against a local server, with
real touch and mouse input, at 1180×820 (iPad landscape), 874×402 with
62 px side insets (an iPhone 17 in landscape), 667×375 (a small phone) and
402×874 (portrait). The upgrade used the real v0.6.4 build (e19769c). No
WebKit build was available on this machine, no physical iPhone or iPad was
tested, and no person listened to the audio: the pace was measured, not
heard.**

| Check | Result |
|---|---|
| Replays, in the engine | 240 seeded replays of each of the 17 missions with a pool, under four histories: every round a valid round of its own game, in its place, with its guided flag, case, direction, sound, vowel, level and beats; review rounds untouched; nothing outside the pool; the 13 taught sounds unchanged; every answer, at every level, beside wrong choices that are really wrong; the same seed and history the same sequence, in a fresh copy too; at least 5 different sequences in 50 seeds for every mission; across six replays in a row, none started as the last one did, and what was not asked came first |
| Small and broken pools | Two letters for six rounds: three each; one letter: the mission whole; an empty pool or unusable items: the rounds as written; the content check names each problem |
| A replay, played through | From a lit marker, two fast taps: one run, "Let's play it again!", then its own first question; the next replay said so another way; evidence written for exactly the letters asked; 3 stars, once; the completion keeps what it asked |
| In the browser | The Moon's visit, then the lit beacon: one start for two fast taps, the first question asked normally (before the fix, the second tap answered it: "Almost!"). Mercury and Mars visits drew fresh sequences, with the fox, box, mouse, seal, nest and butterfly at play size |
| The station | iPad: 10 paints in three rows, 9 gear chips each zoomed onto its piece, 6 themes; try-ons on the rocket and gone on leaving; a purchase and a paint worn by touch (29 → 19 stars). iPhone 17 by touch: a shelf of 3 things and half the next, scrolled by a swipe, the tenth paint tapped kept in sight, an unlock refused without enough stars ("2 more stars"). 667×375: the same, and the thing picked kept in sight after the screen grew to an iPad's and back |
| The look everywhere | The planet ring, party flags and polka dots on Earth, in flight and on the Moon; every new gear piece and theme on Earth at iPad and phone size. Party streamers failed this check (squiggles at play size, legs in flight) and were replaced by the flags |
| Sky targets | At 667×375 Mars is drawn 41 px; a touch 36 px from any planet's centre reached it, 8 of 8 points, every planet |
| Moon Writer by touch | Pip's demo, "watch again", a stroke lifted half-way and carried on to its end, "start again" clearing the ink, the letter traced; the page never scrolled |
| The replay-audio button, and the background | The button said the question and named the pictures. Sent to the background mid-question (a real `visibilitychange`), the voice and the nudge stopped; brought back, the question was asked again and the nudge re-armed (before the fix, nothing) |
| Grown-ups | The pace choice in landscape and by touch in portrait: chosen, saved, still chosen after a reload |
| Layout audit | Every game, the station and the grown-ups area at the four sizes: nothing off screen and no small target, beyond pages that scroll and the station's shelf |
| Upgrade | v0.6.4 played (the Moon and Mercury restored, a paint and a star topper bought and worn, effects off). v0.7.0 deployed on the same origin: v0.6.4's own updater brought it in 2.1 s later with one reload; every saved record byte-identical; the pace read as calm. Mercury's third mission played as written, then the lit radar replayed `mercury-1` afresh (fox/box in it); the planet ring bought |
| Offline | The network cut and the server stopped: v0.7.0 started, all 14 new pictures and gear were cached, and Mars was played |
| Contracts | `npm run verify`: 1570 passed, 0 failed; config verify ok. New: contract 59 (replays), 60 (pace), 61 (the phone), 62 (back from the background) |
| Mutation | 27 defects planted one at a time on a copy of the repo, in two batches: 25 caught by failing contracts. One first crashed the test runner instead of misbehaving; rewritten, it was caught (one of the 25). One could not be caught because it changed nothing: Sound Scout's 'same sound' replay rule only repeated what validate() already refuses, so the rule was removed |
| Budgets and economy | Core pictures 1,151,750 bytes, 91.5% of the 1.2 MB budget; Jupiter 63.8% of its own 300 KB. 22 things cost 123 stars: 13 on a first pass, everything after 41 missions |

**Not tested:** a physical iPhone or iPad; Safari; how the calm pace
actually sounds, and whether Pip's device voice is easy to follow for a
child (nobody listened); a child's finger on the shelf; whether children
name the new pictures as intended.

## Reliable updates QA record (v0.6.4, 2026-09-27)

**Tested in the harness, and in Chromium (headless Edge on Windows), each
browser run in a fresh, isolated profile against a local server that
behaves like GitHub Pages (`max-age=600`). Background and foreground were
the window minimized and restored (a real `visibilitychange`); offline was
CDP network emulation plus a server refusing connections. No update event
was dispatched by a script. No WebKit build was available on this machine,
and no physical iPhone or iPad was tested.** OLD is the previous release's
updater (v0.6.3 installed, a 0.6.9 built from its code delivered); NEW is
this one (v0.6.4 installed, a test 0.6.5 delivered).

| Check | OLD (v0.6.3) | NEW (v0.6.4) |
|---|---|---|
| Opened offline, then the network comes back, the app never closed | No check of the server in the 60 s after the network returned; still the old release | The grown-ups area said "Offline"; the network back, one check, and the new release installed and moved in 4 s later, with one reload |
| A check fails (503), then the server recovers | No check at all in the 76 s after the server recovered, the app brought to the front 16 s in | "Could not check" shown; the app brought to the front retried at once, and moved in 17 s after the server recovered |
| The app left open on one screen, untouched, while a release lands | No check of the server in 13 minutes; still the old release | Found by the heartbeat and moved in 601 s after the deploy — no launch, no trip to the background — with one reload |
| A finger held still on Earth after a late takeover | The page reloaded under the finger | No reload while it was down (5.6 s); one reload 4.3 s after it lifted |
| Twelve trips to the background during a slow install | — | No extra check; one reload when it finished |
| A worker already waiting when the page registers (a same-tab reload) | — | Found, and in charge in the same session, with no further navigation |
| A worker still installing when the page reloads | Both handled it: in Chromium the page's registration resolves only once the running install has finished, so it saw a waiting worker | As OLD. Following an install from whenever it is seen covers a page suspended while one began (harness) |
| A takeover held, helped once, stalled, then released | — | One helping reload (offline, so the old page returned), then stalled with checks going on; released, it moved in: two navigations in all, no loop |
| A delayed takeover during tracing | — | Recorded mid-letter; the letter finished by touch under the new worker; one reload on Earth after the finger lifted |
| The previous release installed, this one deployed, the app opened | — | The v0.6.4 page at once, and its worker in charge in the same session |
| After every move | — | Every mission, the stars and the paint kept; offline, the app started on the new version and flew to Jupiter with every picture |
| Contracts | | `npm run verify`: 1489 passed, 0 failed; config verify ok. The new contract 58 was run first against the shipped v0.6.3 code: 23 of its checks failed there |
| Mutation check | | 19 defects planted one at a time, each gap put back and v0.6.3's protections removed: all 19 caught by failing contracts, after one equivalent mutant was replaced by the real gap it stood for, and one catch my script misfiled as a runner error was re-run |

**Not tested:** a physical iPhone or iPad, Safari's service-worker
lifecycle, a Home Screen app resuming from the background, iOS suspending
timers. On the phone, a page still running v0.6.3's code keeps its own
updater until it reloads once into v0.6.4: it looks for a release only at
launch and on coming to the front, at most every ten minutes.

## The late takeover QA record (v0.6.3, 2026-09-27)

**Tested in the harness, and in Chromium (headless Edge on Windows), each
browser run in a fresh, isolated profile against a local server that
behaves like GitHub Pages (`max-age=600`), with touch emulation and real
touch input. Not tested on a physical iPad.** In the browser, the takeover
was delayed by the browser itself: the old worker had a request in flight,
the server held its answer, and Chromium does not let the new worker in
until that fetch ends. The `controllerchange` came from the new worker's
own `clients.claim()` when the answer was released; no script dispatched
one. The harness contracts use a fake worker whose takeover the test
releases, and a fake `controllerchange`.

| Check | How | Result |
|---|---|---|
| The defect, in a real browser (before) | v0.6.2, the previous release, installed with progress and Jupiter kept. v0.6.3 delivered while the old worker had a request in flight; the page asked the new worker in at rest on Earth, and the browser held it. Then Moon Writer opened, and half a letter was traced by real touch, finger down. Then the held request was released | The new worker came in, and v0.6.2 reloaded at once, mid-letter: the trace and the mission run were gone |
| The fix, the same sequence (after) | v0.6.3 installed; a test v0.6.4 delivered the same way | 3 of 3: the worker came in 0.2 s after the release, mid-letter, with no reload — the finger still down where it was, the mission run intact. The letter was then finished by touch under the new worker, the mission finished, and 4 s on the planet brought no reload. Home on Earth, a real tap on bare ground held the reload off (none in the 2 s after it); it came 3.2–3.3 s after the tap, exactly one, into v0.6.4. Every earlier mission, the new one and the paint were kept, and stars went up. Offline, the app started as v0.6.4 and flew to Jupiter with every picture |
| Contract 57 (harness) | Asked at rest, the takeover released mid-letter, mid-flight, with a grown-ups page open, with the lock held, and just after a touch; the poll alone; repeated events; a first install; a same-version takeover; the held-takeover reload with play under way; a held one come in after the page stopped trying | Each records the takeover and reloads exactly once, at the next quiet moment; the run, the half-traced letter and the saved journey survive (a second app booted over the same storage has the finished mission); a first install and a same-version takeover never reload |
| Contracts | `npm run verify` | 1452 passed, 0 failed; config verify ok |
| Mutation check | 15 defects planted one at a time in a copy of the repo. Eleven target the fix, starting with v0.6.2's own handler restored exactly, which 17 contracts catch; the other ten are the reload trusting the ask's quiet moment, ignoring a touch, never looking again, reloading twice, hanging on the waiting worker, ignoring a late held one, a first install or a same-version takeover owing a reload, the lock hold not counting, and the helping reload trusting the ask. Four target the checks that moved into quietNow(). The eleven, first run: 10 caught. The miss (an owed reload the poll never looks for again) passed because the poll armed at the ask happened to fire after the child went still; a contract now makes the poll survive a look while not quiet, and the rerun caught it. The four, run after: 4 of 4. In all, 15 of 15 | |

**Found in the audit** (beyond the confirmed defect):

1. **A held newer version that came in after the page had stopped trying
   was ignored**, leaving the page on the old version under the new worker
   until the next launch. It is now owed its one reload like any other.
2. **A grown-up's three-second hold on the lock was not activity.** The
   touch guard counts from the finger going down, so it could pass half a
   second before the hold completed; a keyboard hold sent no touch at all.

**Not tested:** a physical iPad (Safari's worker lifecycle and a Home
Screen app resuming); a takeover delayed any other way than by a request
the old worker holds. A device whose open page is still v0.6.2 when v0.6.3
arrives moves with v0.6.2's own code, once; a page opened after the deploy
is v0.6.3 from the network and moves with the fix.

## Phase 4 follow-up QA record (v0.6.2, 2026-09-27)

**Tested in Chromium (headless Edge on Windows), each flow in a fresh,
isolated profile against a local server that behaves like GitHub Pages
(`max-age=600`), and in the test harness. Browser emulation does not prove
physical iPad behavior: Safari's service worker and a Home Screen app
resuming from the background were not tested on a device.**

| Check | How | Result |
|---|---|---|
| The live rollout (v0.6.0 → v0.6.1) | The live v0.6.0 installed with progress in a persistent profile; reopened after v0.6.1 went live | Found the fault: the second open showed v0.6.1 while v0.6.0's worker stayed in charge, with v0.6.1 installed and waiting; only a later launch brought it in |
| The fault, rehearsed | v0.6.2 installed; v0.6.3 found while a grown-ups page is open; the page then reloaded in the same tab (the new page arrives while the old one is still a client, and finds a waiting worker of its own version) | With v0.6.1's timing (asked at once): still waiting after 20 s in 2 of 3 runs. With v0.6.2's: 7 of 7 fully in by 8 s, with no reload, no worker left waiting and the old cache gone |
| The rollout from v0.6.1 | v0.6.1 (the commit that is live) installed with progress; v0.6.2 deployed; the app opened | 3 of 3: the v0.6.2 page at once and its worker in by 8 s, with no reload or relaunch; every saved record identical; the world's 8 pictures carried |
| A held newer version | The old worker kept busy by a request the server holds for 25 s; v0.6.3 found at a quiet moment | Asked at once and held; 8 s later one reload, marked on the tab, into the v0.6.3 page; its worker came in as soon as the held request ended, with no second reload |
| An installed app updates by itself | v0.6.2 installed with progress and Jupiter kept; v0.6.3 deployed; the app brought to the front | Moved in about 4 s after being found, with one reload; no worker left waiting; every saved record identical; Jupiter carried and the old cache gone; the grown-ups area shows 0.6.3 |
| Repeated foregrounding | 20 trips to the front after an update; then one check with nothing new | 0 checks and 0 reloads; the empty check reloaded nothing |
| An update mid-letter | Moon Writer mid-stroke when v0.6.3 is found | Installed and waited through the letter, the rest of the mission and the planet; home on Earth it moved in 4.1 s after landing, with one reload; the mission still recorded |
| Offline start, and a failed update | Offline reload of v0.6.3; then a broken v0.6.4 (its precache lists a missing file) deployed and opened online, then offline | Offline start works and flies to Jupiter. The broken install failed and never took over; offline afterwards the app starts as v0.6.3, whole |
| World pictures, again | The three flows of the v0.6.1 record | Unchanged: kept within 10 s of the network returning, then offline at Jupiter; kept by the timer 12 s after the server recovered; a fresh install keeps Jupiter in its first session |
| Contracts | `npm run verify` | 1418 passed, 0 failed; config verify ok |
| Mutation check | 36 defects planted one at a time in a copy (preload recovery and keeping; the update lifecycle, including the settle, a held takeover and a first install; the worker; derived decodability): 36 of 36 caught by failing contracts. The eight touching the held takeover were re-run on the final build (8 of 8). One planted defect at first broke the script's syntax rather than its behavior; rewritten, it was caught by contracts | |

**Found and fixed before release** (while building v0.6.2):

1. **A first install blocked the next update check.** On a first install
   the worker passes straight through "installed"; the settle change took
   it for a waiting worker of the page's own version and left the page
   believing a takeover was under way, so the next check was skipped. The
   held-version browser flow found it. Only a worker actually waiting is
   considered now, and a contract covers a first install.
2. **A held same-version takeover would have blocked later checks for the
   rest of a session.** The page now stops waiting on it after 8 s.
3. **The net's reload did not wait for the child to be still.** It checked
   the quiet moment but not "no touch for 2.5 s"; it now keeps the same
   idle rule as every other reload.

**Not known, and not tested:** why Chromium holds a takeover asked during
the page's first loads (the live rollout and the rehearsal show that it
does, and that the settle avoids it); whether Safari does the same.

## Phase 4 follow-up QA record (v0.6.1, 2026-09-27)

**Tested in Chromium (headless Edge on Windows), each flow in a fresh,
isolated profile against a local server that behaves like GitHub Pages
(`max-age=600`), and in the test harness. Browser emulation does not prove
physical iPad behavior: Safari's service worker, its update checks, and
Home Screen apps resuming from the background were not tested on a device.**

| Check | How | Result |
|---|---|---|
| Failure, then the network back | Jupiter near; the server answers its pictures with 503; then serves them; the network toggled off and on (an `online` event) | While failing: all 8 marked failed, none counted kept, no error stored in the cache, and no further requests in the next 3 s. Back online: all 8 loaded and kept within 10 s (cache 81 → 89). Then offline, a reload and a flight to Jupiter: every picture present |
| Failure, then recovery by timer alone | The same, with no `online` event | All 8 kept 12 s after the server recovered (the first backed-off retry) |
| A fresh install | A first visit with Jupiter near | Jupiter's 8 pictures kept in the first session, no reload; offline, all 8 load from the cache |
| An installed app updates by itself | v0.6.1 installed with progress and Jupiter kept; a v0.6.2 deployed; the app brought to the front | Installed in the background, moved in at a quiet moment on Earth with exactly one reload; every saved record byte-identical; Jupiter's pictures carried into the v0.6.2 cache and the old cache gone; the grown-ups area shows 0.6.2 |
| Repeated foregrounding | 20 trips to the front just after an update; then one check with nothing new | 0 extra checks and 0 reloads; the check with nothing new reloaded nothing |
| An update mid-letter | Moon Writer mid-stroke when v0.6.2 is deployed and found | Installed and waited: no reload for 9 s with the finger down, none on the planet after the mission; home on Earth it moved in with one reload, the finished mission recorded |
| Offline start, and a failed update | Offline reload of v0.6.2; then a broken v0.6.3 (its precache lists a missing file) deployed and the app opened online, then offline again | Offline start works and flies to Jupiter. The broken install failed and never took over; offline afterwards the app starts as v0.6.2, whole |
| Contracts | `npm run verify` | 1405 passed, 0 failed; config verify ok |
| Mutation check | 22 defects planted one at a time in a copy (preload recovery and keeping, the update lifecycle, the worker, derived decodability). First run: 21 caught. The one missed (a planet counted as a quiet moment) was hidden because the check ran while Pip was still speaking; it now waits until Pip is quiet, and checks the space station and a grown-ups page too. The rerun caught it: 22 of 22 | |

**Found and fixed during this work** (beyond the two audit findings):

1. **A failed precache still took over** (the install caught its own
   failure and skipped waiting), so a half-downloaded update could replace a
   working offline version. The install now fails instead.
2. **A server error could be cached as a file** (the fetch handler stored
   every answer), and would then be served offline or counted as kept.
3. **A newer page seen online was written into the older version's cache**,
   so after a failed update the app could start offline as a mix of two
   versions. Runtime caching now never stores a page or overwrites an
   installed file.
4. **On a first visit a near world was fetched before the worker existed**,
   so it was not kept offline until the next start. The worker now stores it
   as soon as it is ready.

**Not tested on a physical iPad** (deferred, as before): Safari's worker
lifecycle and update checks, a Home Screen app resuming from the
background, how often iPadOS lets a closed app check for updates (it does
not while the app is closed), and the reload at a quiet moment as a child
sees it.

## Phase 4 QA record (2026-09-27)

**Tested in Chromium (headless Edge on Windows) with emulated iPad and
phone viewports, emulated touch and an emulated pen, and in the test
harness. Nothing was tested on a physical iPad, with a real finger or an
Apple Pencil: device QA is deferred to the next major device gate.**

| Check | How | Result |
|---|---|---|
| The whole journey | Headless Edge, scripted through the app's own functions, at 1180×820 (2×) and 1024×768: Earth → the Moon → Letter Explorer in the school print → the slate offered in the same visit → Moon Writer (Pip's demo mid-stroke, full help, mid-stroke ink, a lift with the dot moving, the letter done, less help, a stroke that wandered) → little letters → big and little partners → little c → home, Jupiter revealed → the first flight to Jupiter → Star Words (found, a wrong pick) → Word Orbit → Jupiter restored → home, Jupiter lit → Moon Writer with Reduce Motion → grown-ups. At 1366×1024, 844×390 and 667×375: the Moon with the slate, Moon Writer, partners, Earth with Jupiter, Jupiter, Star Words, Word Orbit | No page errors, no resting-stage problem and no display repair at any size |
| Real input | Headless Edge, touch and pen dispatched through the browser's own input pipeline (not by calling the code) | A finger traces a letter with the page never scrolling; a cancelled touch lifts and the dot moves to where it stopped, then carries on; a second finger is ignored; a resting palm, then the Pencil takes over and finishes; twelve quick taps away from the dot give one reminder and draw nothing; the eye button counts as help; the arrow button clears the letter; a reload mid-letter records nothing and boots clean |
| A real v0.5.0 → v0.6.0 update, then offline | Headless Edge: the v0.5.0 build (`168ac8f`) served and played through Mars with a stand-in speech engine (the letter S found after a miss; grape paint bought). Its worker cached 81 files. Then v0.6.0 was served on the same origin and the page reloaded; reloaded again; then the network cut and the server stopped, and Jupiter and Moon Writer played offline | Completions, stars, the rocket and all 21 practice records byte-identical; only a story flag (`shown.jupiter`) added. Moon, Mercury and Mars stay restored; Jupiter opens and arrives once, never after a reload; Launch goes to Jupiter; the Moon offers the writing slate. Jupiter's 8 pictures were fetched once, through the old worker, and carried into the v0.6.0 cache (89 entries). Offline: Jupiter drawn with every picture, Star Words and Word Orbit played and Jupiter restored, then Moon Writer traced; no missing picture, no error |
| Contracts | `npm run verify` | 1338 passed, 0 failed; config verify ok |
| Mutation check | 41 defects planted one at a time in a copy: little letters and pairs, the print, sight words, tracing geometry, the slate's input, progression, picture tiers, review across skills, grown-ups | First run: 32 of 41 caught. All 9 missed exposed weak or missing tests (a little-letter round built from big-letter shapes; the near/far line for sight words; the tracing corridor; a trace with the sound off; Pip's reminder throttle; the demo under Reduce Motion; the precache list config:sync writes; a little letter bringing back its sound; the tracing review). Each now has a contract, and a rerun caught all 9: 41 of 41 |
| Performance | Headless Edge, cold loads, median of five, v0.5.0 against v0.6.0 | index.html 146 KB on the wire (124 KB before). DOMContentLoaded 59 ms (50) at full speed and 296 ms (225) with 4× CPU throttling; script 98 ms (61) throttled. Kept as one file: see ARCHITECTURE.md |
| Economy | `npm run economy`: 20 missions at 3 stars | The whole journey once earns 60 stars and 12 of 15 things; everything after 28 missions. Kept at 3 stars a mission |

**Found and fixed in Phase 4 QA:**

1. **The slate could not be traced with a real finger.** The scene layer lets
   taps through and only its buttons catch them; the slate is not a button,
   so every touch passed through it. The contracts dispatch events straight
   at the element and could not see it; a browser test with real input did.
   The slate now catches its own pointer, and a contract holds it.
2. **A lifted finger was sent back to a stale dot.** After a lift the trace
   carries on from where it stopped, but the green dot stayed at the
   stroke's start, so a child who went back to it heard "Start at the green
   dot" again. The dot now moves, and the stroke's own start begins it again.
3. **An update could drop a world offline.** Jupiter's pictures, fetched
   through the old worker at the first start after an update, were deleted
   with its cache. The new worker now carries them into its own cache first.
4. **Restarts counted across a letter,** so Pip re-wrote a stroke after one
   miss on each of two strokes. They are counted stroke by stroke.
5. **Jupiter's ring sat under Pip's words** on 1180×820 and 1024×768, and on
   phones its label fell behind a cloud. It sits lower and more central.
6. **Tracing was too tight on a phone** (a corridor about 13 px wide). Widening
   the corridor was tried and rejected: wide enough to help, a finger
   wiggling in the middle of a little o finished it. Instead the slate is
   bigger on short screens (about 20 px), and a contract proves the
   wiggle never traces.
7. **The Moon Writer slate touched the title** on 1180×820; it keeps a gap.
8. Grown-up text said "practised"; it is US English: "practiced".

**Not physically tested on an iPad** (deferred to the next device gate):

- tracing with a real finger and an Apple Pencil, palm rejection and
  pointer cancellation on iPad Safari, and whether the page ever scrolls or
  selects under the slate there
- how forgiving the tracing tolerances feel to a five-year-old
- Pip's demo animation and the stroke order, judged by a person
- the sight words and letter-case lines in the device voice (for example,
  "to" not heard as a number)
- the new pictures (Jupiter, the slate, the word satellite) at iPad size
- the v0.5.0 → v0.6.0 update on a device with progress, and Jupiter's
  pictures offline after it; the Home Screen install
- everything still deferred from Phase 3 (every sound, Silent Mode, the
  Phase 2.2 device batches)

## Phase 3 QA record (2026-09-27)

**Tested in Chromium (headless Edge and the in-app browser on Windows) with
emulated iPad and phone viewports, and in the test harness. Nothing was
tested on a physical iPad: device QA is deferred to the next major device
gate. No person has yet judged any sound in this phase on a device.**

| Check | How | Result |
|---|---|---|
| The whole journey | Headless Edge, scripted through the app's own functions, at 1180×820 (2×) and 1024×768: Earth → the Moon → Letter Explorer → the light tunnel to Mercury → Rhyme Radar (the new words) → Syllable Meteors, which reveals Mars → home, Mars next → the first trip to Mars (the asteroid pass) → Mars → Sound Scout (listening, the pictures, found, a wrong pick) → Word Builder (with Pip, two letters in, built, a wrong order) → Mars restored → home, Mars lit → a Reduce Motion trip → grown-ups. At 1366×1024, 844×390 and 667×375: Earth with Mars, Mars, Sound Scout and Word Builder | No page errors, no resting-stage problem and no display repair at any size. Every game fits its box, under the HUD and above the ground |
| Real clicks | The in-app browser at 1180×820: the scanner tapped, Sound Scout answered, and Word Builder's guided round built letter by letter with clicks | As designed: a wrong letter wiggles and stays out, the right one goes into the first empty slot, the hint moves on, and the built word ("Map!") shows its picture |
| Offline | Headless Edge: loaded once online, then the network cut and the server stopped, reloaded and played Earth → a flight → Mars → Sound Scout → Word Builder (a word built) → the space station | The v0.5.0 cache holds 81 entries (the shell and all 78 pictures). No missing picture anywhere; the development voice made its sounds with no network; no errors; the stage at rest |
| A real v0.4.0 → v0.5.0 update | Headless Edge: the v0.4.0 build (`712dcca`) served and played with a quick stand-in speech engine, so every round was heard and scored: the Moon (the letter S found only after a miss), Mercury, and stars spent on the sky paint and the antenna. Its own code wrote the records, and its service worker cached 56 files. Then v0.5.0 was served on the same origin and the page reloaded, as a device does after a deploy; then reloaded again, and played on. Contract 43 does the same in the harness | Everything kept: 3 missions, 3 stars, the paint and the antenna, and all 13 practice records unchanged. The Moon and Mercury stay restored; Mars is open and arrives in the sky once, never again after a reload; Launch goes to Mars and the Moon offers `moon-2`. Review brings the missed letter back: S in `moon-3`, and its sound /s/ in `mars-3`. The new worker took over and replaced the old cache (v0.5.0, 81 entries). Playing on restored Mars and paid 3 stars a mission. Nothing unreadable, no errors |
| Contracts | `npm run verify` | 1166 passed, 0 failed; config verify ok |
| Audio states | Contracts 39 and 45, with a fake device voice, a fake media element and a fake Web Audio that record every sound in order | Never two sounds at once; lines in the order asked; a new line stops a sound still playing; a phonics cue never reaches the device voice, even with it available or a recording failing; punctuation pauses; no quiet longer than 700 ms; the sound effects stay in one scale |
| Rapid and odd input | Contract 36 (shared by every game: a tap during an explanation skips it, taps during praise wait, a bouncing finger is one tap), and contracts 41 and 42 for the new games: taps while an answer is praised, a letter tapped twice, undo, a wrong order, a reload mid-word | Taps are owned by what is on screen; nothing is lost or half-saved |
| Mutation check | 46 defects planted one at a time: 39 in the new rules (the audio owner and phonics routing, pacing, the development voice, the word base, Sound Scout, Word Builder, restoring and reveals, review, the sound family, grown-ups), then 7 aimed at the brief's high-risk list (tap-to-place order, a letter placed twice, a failed recording, Mars's unlock, cutting praise short, the last sound before the check, leaving mid-line) | First run: 40 of 46 caught. Of the 6 missed, 3 exposed weak tests: a pause measured against the synthesizer's own gap, the letter-by-letter half of `isCvc()` never exercised, and a word checked while its last letter's sound was cut off. All 3 were strengthened and now catch them. 2 were equivalent: no behavior can differ. 1 was a recording-player guard that could never fire, so it was removed. Every defect that can change behavior is caught: 43 of 43. The run also exposed a flaky contract that assumed one praise phrasing; it is fixed |
| Economy | `npm run economy`: 3 stars a mission, 15 things to unlock costing 82 stars | 5 missions: 15 stars, 4 things (buying the cheapest first) or 1 theme (saving for one). 10 missions: 30 stars, 7 things, or all three themes and one more. 20 missions: 60 stars, 12 of 15 things. Everything after 28 missions; the whole journey once (11 missions) earns 33. Kept at 3 stars a mission: something new every mission or two, and never everything at once |

**Found and fixed in Phase 3 QA:**

1. **A capital letter was missing after praise** ("Great listening! moon!").
   The line builder now capitalizes a word that starts a sentence; the
   older rhyme lines had the same flaw.
2. **A line of two sentences could be cut short.** The safety timer, which
   ends a line whose voice never reports back, did not count the pauses
   between sentences.
3. **An upgraded journey that opened on Earth never saw Mars arrive:** the
   catch-up reveal ran only on coming home. It now runs at start-up too.
4. **Word Builder's picture circle sat empty and faded** until the word was
   built. It now holds the word machine until the picture replaces it.
5. **Sound Scout's rocks took their height from their image,** so the
   pictures could jump as it loaded. The rocks now have a set height.

**Not physically tested on an iPad** (deferred to the next device gate):

- every sound: the development phonics voice (letter sounds, words said
  sound by sound, blends), the device voice's new pacing and the new sound
  effects. None has been heard on an iPad or judged by a person
- the sounds in Silent Mode: iOS mutes Web Audio there, which would silence
  the development voice while the device voice still speaks
  ([AUDIO.md](AUDIO.md))
- the recording path: there are no recordings yet
- Sound Scout and Word Builder under a real finger; the Mars art and the
  new pictures at iPad size
- the v0.4.0 → v0.5.0 update on a device that already has progress; the
  Home Screen install and offline after install
- the Phase 2.2 device batches 2–5 (travel, the games, the station, stress
  and PWA), which were never completed

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
