# iPad QA — Phase 2.2

The real-iPad gate for the new shell: the HUD, planet selection, travel,
arrival, the redesigned rocket and the space station. **A check is PASS only
when it was seen on the physical iPad.** Browser or Node results never count
here. Earlier records: [IPAD-QA-PHASE-2.md](IPAD-QA-PHASE-2.md),
[IPAD-QA-PHASE-1.md](IPAD-QA-PHASE-1.md).

| | |
|---|---|
| **Build under test** | v0.4.0 — the commit named in the release report |
| **Served from** | GitHub Pages: https://morecobrax-dot.github.io/space-kindergarten/ |
| **Device** | a physical iPad · Safari first, then the Home Screen install |
| **Tester** | the product owner |
| **Started** | 2026-09-27, in five batches (below) |

**STATUS:** PASS · DEFECT · QUESTION · NOT TESTED
**SEVERITY:** BLOCKER · HIGH · MEDIUM · LOW · POLISH

**Batch 1 passed. Batches 2–5 are deferred to the next major device gate:**
on 2026-09-27 the owner moved physical QA from every phase to milestone
gates (the Phase 3 brief). The checks below stay the checklist for that
gate.

The gate runs in five batches, each reported before the next is sent:

1. Earth, the HUD and planet selection (H1, H2, E1, P1)
2. travel and arrival (T1–T6, A1, SS1, S1, S6)
3. the learning games (H3, H4, R1, R2, Q1–Q3, T3)
4. the space station and customization (S2–S5, G1)
5. stress, rotation, PWA and performance (PF1, O1, O2, OF1, MO1)

## Before you start

- **Get the new build.** Pages can take up to 10 minutes to serve a push.
  Open the site and reload it twice. The grown-ups area (hold the lock for
  3 seconds) should show **Version 0.4.0**.
- **Keep your progress** for most checks: the Moon lit and Mercury open.
  A first arrival (and the light tunnel, T3) happens once per profile:
  see it in a Safari Private tab, which starts a fresh profile without
  touching yours, or after Grown-ups → Backup & data → Erase all progress.
- **Turn the sound on,** and the silent switch off.
- **Try Reduce Motion last** (section MO), from the grown-ups area.

---

## The checks

| # | Check | What should happen | Status | Notes |
|---|---|---|---|---|
| **H1** | The HUD | Every screen: a small round button top left (the lock on Earth), a short title in a dark pill top centre, the stars top right. Nothing oversized; nothing covers the art | PASS (Earth) | Batch 1, Safari: compact, nothing oversized, nothing cut off. The other screens are in Batches 2–4 |
| **H2** | Small marks, easy taps | The top-left and top-right buttons look small, but a sloppy tap near them still works | PASS (the lock) | Batch 1: the lock's 3-second hold, also slightly off the icon; a quick tap does nothing. Home and Back are in Batches 2–4 |
| **H3** | Lesson titles | Each game shows its name and what to do: LETTER EXPLORER / Find the letter you hear · RHYME RADAR / Find the picture that rhymes · SYLLABLE METEORS / Tap the beats, with progress stars under them | NOT TESTED | |
| **H4** | Planet labels | On a planet: MOON / Letters; MERCURY / Rhymes • Syllables in v0.4.0. Decided 2026-09-27: "Rhymes • Beats" from the next build | NOT TESTED | Batch 1 showed the same labels under the chosen planet in Earth's sky. On a planet: Batch 2 |
| **E1** | Earth | The horizon, the new rocket on its pad, Pip, the planets in the sky; one chosen planet larger and lit, with its name and what it teaches under it, and a glowing route to it. Launch shows that planet on the button | PASS | Batch 1: still feels like a place, not a menu |
| **P1** | Choosing a planet | Tap the other planet: it comes forward and lights up, its label appears, the first one steps back and loses its label, the route lights up along the new path, Launch shows the new planet, and Pip says what is there. Only one chosen at a time. Nothing launches | PASS | Batch 1: the chosen planet and what it teaches are obvious at once; a child would know where Launch goes. Switching glides, with no blink |
| **T1** | Leaving Earth | Tap Launch: the button presses in, the controls fade, the engine lights and the rocket trembles, it lifts straight up, Earth falls away, clouds pass the camera, space opens. Say if any part feels like a page change | NOT TESTED | |
| **T2** | The cruise | Stars stream past (near ones faster), specks rush by; sometimes a shooting star, sometimes friendly rocks drifting past (never toward the rocket). The destination grows ahead | NOT TESTED | |
| **T3** | First trip to Mercury | In a fresh profile (a Private tab), once the Moon is restored: the first flight to Mercury passes through rings of soft light (the light tunnel), with one gentle pulse. About 3–4 s in all | NOT TESTED | |
| **T4** | Pacing | A common trip feels like 2–3 s; a repeat of the same trip a little shorter; never slow. A tap anywhere skips | NOT TESTED | |
| **T5** | Coming home | Leaving a planet: the rocket lifts off, space, Earth grows, clouds pass the other way, the Earth horizon rises, the rocket lands on the pad | NOT TESTED | |
| **T6** | Smoothness | No stutter, no blank or flashing frame, no picture popping in, on any trip. Say which part stutters, if any | NOT TESTED | |
| **A1** | Arrival | The horizon rises, the rocket touches down (a little dust, a squash), Pip drifts into place, the HUD fades in. Tapping the marker during that moment does nothing; right after, it works | NOT TESTED | |
| **A2** | One obvious mission | On a planet, the mission to play stands in a warm pool of light with a breathing ring; the others wait, dimmer | NOT TESTED | |
| **R1** | Rhyme Radar layout | The radar picture and all three picture cards are fully visible, below the title, above the ground; nothing under the stars. Try it in Safari with the toolbar showing, and from the Home Screen | NOT TESTED | |
| **R2** | Other games' layout | Letter Explorer's three stones and Syllable Meteors' picture, meteors and stone all fit, below the title | NOT TESTED | |
| **Q1** | Rapid taps: Letter Explorer | Tap a right letter, then hammer the stones during "Yes! That's the letter…": the praise finishes, nothing else answers, the next letter comes | NOT TESTED | |
| **Q2** | Rapid taps: wrong answers | Tap a wrong stone twice fast: only one "almost", not an instant "here it is" | NOT TESTED | |
| **Q3** | Rapid taps: the other games | The same in Rhyme Radar and on the meteor stone | NOT TESTED | |
| **S1** | Going to the station | Tap the Station button: the rocket flies up through the clouds, a friendly station comes into view, the camera goes into its bay, and the rocket settles on a turntable | NOT TESTED | |
| **S2** | The garage | A warm clay room: a round window with Earth below, the turntable's lights breathing, the rocket large on it, Pip nearby, a compact panel on the right. No giant buttons | NOT TESTED | |
| **S3** | Trying things on | Paint (8 colours), Gear (star, antenna, moon, lights, boosters), Themes (Bumblebee, Rainbow, Galaxy): each tap shows on the big rocket at once. Nothing is spent until Unlock | NOT TESTED | |
| **S4** | Unlock and use | Unlock something: the stars go down once; it stays on after leaving. Something owned: "Use it!". What is on the rocket says so, and gives up the yellow | NOT TESTED | |
| **S5** | Gear on the rocket | Each gear piece sits exactly on the rocket, on any paint; a theme's pattern shows on the cap and fins | NOT TESTED | |
| **S6** | Leaving | Back: the rocket flies out of the bay and back down to the pad, wearing its things | NOT TESTED | |
| **SS1** | Shooting stars | Wait on Earth or a planet for a minute: once or twice, a faint shooting star crosses the far side of the sky. Never over Pip's bubble or the title; never in a mission | NOT TESTED | |
| **O1** | Orientation | Portrait shows "Turn your iPad sideways"; turning back resumes. Turn it during a flight: the rocket lands where it was going | NOT TESTED | |
| **O2** | Safe areas | Nothing is cut off at any edge, in Safari and from the Home Screen; with Split View if you have it | NOT TESTED | |
| **MO1** | Reduce Motion | Grown-ups → Motion → Reduce motion: every trip is a short crossfade (no clouds, rocks, rings, specks or shooting stars); no dust; the HUD just appears | NOT TESTED | |
| **PF1** | Repeated travel | Ten or more trips, including the station: still smooth, nothing left over in the sky, the rocket always on its pad | NOT TESTED | |
| **OF1** | Offline | After one full visit to Mercury and the station: airplane mode, close and reopen. Everything loads, including the station and the clouds | NOT TESTED | |
| **G1** | Grown-ups | Progress shows the rocket's look ("Bumblebee · Star topper · N of 16 unlocked"); About shows "Display checks: All clear" | NOT TESTED | Batch 1: About reported fine (Version 0.4.0), but the Display checks value was not given; it is asked again before and after Batch 2's trips. Progress is in Batch 4 |

## Ratings

The scores this phase set out to move (1–10):

| | Before (Phase 2 QA) | After |
|---|---|---|
| World feel | 6 | |
| Travel | 5 | |
| Rocket | 4 | |
| Rocket Dock / space station | 2 | |
| HUD | — | |
| Visual polish | 6.5 | |

## Defects

| ID | Check | What went wrong | Severity | Fix | Retest |
|---|---|---|---|---|---|
| | | | | | |

## Not tested anywhere yet

Nothing in this file has been seen on a physical iPad. Browser QA with
emulated iPad and phone viewports is recorded in [PRODUCT.md](PRODUCT.md).
