# iPad QA — Phase 2

The real-iPad gate for the world redesign and the two new games. **A check
is PASS only when it was seen on the physical iPad.** Browser or Node
results never count here. Phase 1's record is in
[IPAD-QA-PHASE-1.md](IPAD-QA-PHASE-1.md).

| | |
|---|---|
| **Build under test** | v0.3.0 — the commit named in the release report |
| **Served from** | GitHub Pages: https://morecobrax-dot.github.io/space-kindergarten/ |
| **Device** | a physical iPad · Safari first, then the Home Screen install |
| **Tester** | — |
| **Started** | — |

**STATUS:** PASS · DEFECT · QUESTION · NOT TESTED
**SEVERITY:** BLOCKER · HIGH · MEDIUM · LOW · POLISH

## Before you start

- **Get the new build.** Pages can take up to 10 minutes to serve a push.
  Open the site, then reload it twice. The grown-ups area (hold the lock for
  3 seconds) should show **Version 0.3.0**.
- **Start fresh, to see the first-time story.** Grown-ups → Backup & data →
  Erase all progress. Or keep your progress: the Moon will already be lit,
  and Mercury will be open.
- **Turn the sound on,** and the silent switch off.
- **Try Reduce Motion last** (section M), from the grown-ups area.

---

## The checks

| # | Check | What should happen | Status | Notes |
|---|---|---|---|---|
| **E1** | Earth composition | The Earth's curved horizon fills the bottom ~40%, running off both sides; the rocket stands on its lamp-ringed pad on the left continent; Pip floats upper left; the Moon waits upper right with a slow dashed ring and a dotted path from the rocket. Most of the sky is empty. Nothing looks like a dashboard | NOT TESTED | |
| **E2** | The corners | The small lock top left, the star count top right, the round Dock button bottom left, the big yellow **Launch!** bottom right. Launch is the one obvious thing | NOT TESTED | |
| **E3** | The clay | Cleaner than v0.2.0: smooth clay, little grain or noise, soft light from the upper left, a thin cyan edge. Pip and the rocket read clearly | NOT TESTED | |
| **E4** | Tap the rocket | Tapping the rocket itself launches, like Launch | NOT TESTED | |
| **L1** | Launch | A clear acknowledgement: the sound, Pip's line, the flame | NOT TESTED | |
| **L2** | The flight | The rocket lifts straight up, the Earth falls away, the stars stream past (the near ones faster), the rocket leans and crosses, the Moon grows, the Moon's ground rises into place, and the rocket settles upright on it. No flash, no blank frame, no picture popping in | NOT TESTED | |
| **L3** | Flight timing | About 2 seconds the first time to a place; about 1.3 seconds after that. Tapping anywhere during a flight skips to the end | NOT TESTED | |
| **L4** | Smoothness | The flight is smooth on this iPad: no stutter or dropped frames. Say if any part stutters | NOT TESTED | |
| **A1** | Arrival on the Moon | The Moon's horizon at the bottom, the beacon standing on it with a breathing yellow ring round its foot, the rocket parked on the right, Earth small in the sky. Pip tells the story and says "Tap the beacon" | NOT TESTED | |
| **A2** | Waiting on a planet | Do nothing for 12 seconds: Pip says what to tap, once | NOT TESTED | |
| **M1** | Letter Explorer | Tapping the beacon starts the mission: three Moon stones stand on the ground, each with a clean plate and a big clear letter. Pip explains the task (first time only) and asks for a letter | NOT TESTED | |
| **M2** | Letters stay clear | Every letter is easy to read at arm's length; nothing textured behind it | NOT TESTED | |
| **M3** | Wrong, then wrong again | One wrong stone wiggles and steps aside ("Almost!"); a second one shows the answer | NOT TESTED | |
| **R1** | The world answers | After the last letter: back on the Moon, the beacon lights up in front of you, three clay stars arc up to the star count and it counts up, Pip hops, and Mercury appears in the sky ("Look! A new planet…") | NOT TESTED | |
| **R2** | Rewards are quick | All three stars have landed within about 2 seconds | NOT TESTED | |
| **R3** | The way home | With nothing left to play, a big yellow **Home** button appears. Tapping it flies home; the Moon lights up in Earth's sky; Pip says "Next stop, Mercury!"; Launch now goes to Mercury, ringed with the path | NOT TESTED | |
| **P1** | Choosing a planet | Tapping the Moon in Earth's sky moves the ring and the path to it, and Pip names it. Launch then flies to the Moon | NOT TESTED | |
| **H1** | Mercury | A warm sky with the Sun's glow, a warm stone horizon, the radar dish pulsing and the meteor rocks waiting (dimmer). "Mercury's signal is fuzzy. Let's fix it!" | NOT TESTED | |
| **H2** | One mission at a time | Tapping the meteor rocks first: Pip points at the radar instead | NOT TESTED | |
| **RR1** | Rhyme Radar | The word's picture in a round window; three picture cards on the ground. Pip says the word, asks what rhymes, and names each picture as it lights up | NOT TESTED | |
| **RR2** | The pictures | Every picture is recognisable at a glance (apple, banana, bee, cake, car, rock, snake, sock, spoon, tomato, tree, the Moon, the star, your rocket) | NOT TESTED | |
| **RR3** | Rhyme feedback | Right: both words said together ("cake, snake — they rhyme!"). Wrong: the card steps aside and the rest are named again | NOT TESTED | |
| **SM1** | Syllable Meteors | After the radar is fixed, the meteor rocks pulse. The mission shows a picture, meteors and a big stone. The first word: Pip taps its beats first ("rock!" "it!"), then "Now you!" | NOT TESTED | |
| **SM2** | Tapping beats | Each tap on the stone lights a meteor. A pause ends the count. Only the number of taps matters, not the rhythm | NOT TESTED | |
| **SM3** | The beats voice | Listen to "ba! na! na!", "ap! pull!", "toe! may! toe!", "rock! it!". Do they sound like the word's beats? This is the riskiest voice content | NOT TESTED | |
| **SM4** | Fast or messy taps | Very fast taps, two fingers, a bouncing finger: nothing breaks, and the count is what you meant | NOT TESTED | |
| **SM5** | Mercury restored | After the second mission: the rocks glow, the world brightens, the yellow Home appears; home, "Mercury is glowing" | NOT TESTED | |
| **D1** | The Rocket Dock | Tapping Dock lowers the camera to the pad: the rocket large on it, the paints beside it. A paint shows on the rocket at once | NOT TESTED | |
| **D2** | Buying and wearing | Unlock and wear a paint; the star count goes down once; leaving keeps the worn paint, and the camera rises back to home | NOT TESTED | |
| **T1** | Touch | Every button, marker, planet, stone and card is easy for a small finger; nothing needs precision | NOT TESTED | |
| **O1** | Orientation | Turning to portrait shows "Turn your iPad sideways"; turning back resumes where you were (the question is asked again) | NOT TESTED | |
| **O2** | Other iPad sizes | If you have more than one iPad or Split View: the horizon still fills the bottom, and nothing overlaps | NOT TESTED | |
| **MO1** | Reduce Motion | Grown-ups → Motion → Reduce motion. A flight becomes a short fade: nothing slides or streams. Stars count up without flying. Pip and the rocket stand still | NOT TESTED | |
| **PF1** | Performance | Launching, flying and arriving stay smooth after 10 or more flights. The first flight to Mercury does not stall | NOT TESTED | |
| **OF1** | Offline | After one full visit to Mercury: airplane mode, close and reopen the app. Everything, including Mercury and every picture, still loads | NOT TESTED | |
| **G1** | Grown-ups | Progress shows the Moon and Mercury place by place, and practice skill by skill (letters, rhymes, beats) in plain counts | NOT TESTED | |

## Defects

| ID | Check | What went wrong | Severity | Fix | Retest |
|---|---|---|---|---|---|
| | | | | | |

## Not tested anywhere yet

Nothing in this file has been seen on a physical iPad. Browser QA with
emulated iPad viewports is recorded in [PRODUCT.md](PRODUCT.md).
