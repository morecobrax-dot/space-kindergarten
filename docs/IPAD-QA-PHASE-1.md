# iPad QA — Phase 1.1

Evidence log for the real-iPad production-readiness gate. **A test is PASS only
when it was observed on the physical iPad.** Browser or Node results never
count here.

| | |
|---|---|
| **Build under test** | `d5811f72e0a4137bcfca78710c3ba89a36fd6db4` (Phase 1, pushed) |
| **Served from** | GitHub Pages: https://morecobrax-dot.github.io/space-kindergarten/ (HTTPS, from `main`) |
| **Device** | a physical iPad (the tester chose not to record the model or iPadOS version) · Safari first, Home Screen later |
| **Tester** | Jacob |
| **Started** | 2026-09-26 |

**STATUS:** PASS · DEFECT · QUESTION · NOT TESTED
**SEVERITY:** BLOCKER · HIGH · MEDIUM · LOW · POLISH

## Environment notes

- **Hosting.** The repo was made public and published with GitHub Pages on
  2026-09-26, the same setup as dayplan: the legacy build from `main`, served
  from `/`.
  - The live files were checked byte-for-byte against commit `d5811f7`
    (index.html, sw.js, the manifest and the assets).
  - The service worker is scoped to `/space-kindergarten/`, precaches 17
    files, and uses the cache `space-kindergarten-v0.1.0`.
  - HTTPS is enforced, so offline (section H) is testable.
- **Updates can take up to 10 minutes to arrive.** Pages serves files with
  `Cache-Control: max-age=600`. After a fix is pushed, wait that long before
  retesting, or reload twice.
- **Progress stays on one device.** It is local-first: each device keeps its
  own progress, and Safari and a Home Screen install on the same iPad keep
  separate progress too. Nothing syncs, by design.
- Safari on iPad reports itself as a Mac by default ("Request Desktop
  Website"). This app does no user-agent sniffing, so this does not matter.

---

## A. First-launch child journey

### A1 — Welcome: the one action is obvious before any tap
- **STATUS:** PASS
- **EXPECTED:** Pip and a single large yellow play button. No reading needed to know what to touch.
- **OBSERVATION:** The tester reported that the Welcome screen works and everything looks alright.
- **ACTUAL:** As expected.
- **SEVERITY:** —
- **EVIDENCE:** Tester report on the physical iPad, Safari, 2026-09-26.
- **FIX:** —
- **RETEST:** —

### A2 — First tap starts audio, and Pip speaks
- **STATUS:** PASS, with an audio defect raised separately
- **EXPECTED:** One tap on play → Pip's antenna glows and "Hi, explorer! I'm Pip…" is heard within about a second.
- **OBSERVATION:** The first tap produced speech, and the flow reached Earth. The tester found the voice robotic and not realistic enough.
- **ACTUAL:** Audio unlock works. Voice quality is poor; see AUD-1.
- **SEVERITY:** —
- **EVIDENCE:** Tester report on the physical iPad, Safari, 2026-09-26.
- **FIX:** AUD-1 and AUD-2, in v0.1.1. See the fix notes under the defect register.
- **RETEST:** Pending on the iPad, once v0.1.1 is live.

### A3 — Earth composition and the Launch instruction
- **STATUS:** PASS
- **EXPECTED:** Earth fills about half the screen, with the rocket on it and a dotted path to the Moon. Launch is unmistakable, and Pip says to tap Launch.
- **OBSERVATION:** "Everything looks alright."
- **ACTUAL:** As expected.
- **SEVERITY:** —
- **EVIDENCE:** Tester report on the physical iPad, Safari, 2026-09-26.
- **FIX:** —
- **RETEST:** —

### A4 — Tapping the rocket also launches
- **STATUS:** NOT TESTED
- **EXPECTED:** A tap on the rocket itself behaves exactly like Launch.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### A5 — Travel pacing (first flight)
- **STATUS:** NOT TESTED
- **EXPECTED:** About 2.6s, smooth and exciting, never boring. A tap skips it.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### A6 — First Moon arrival leads into the activity
- **STATUS:** NOT TESTED
- **EXPECTED:** The story line, then "I'll say a letter. You tap it!", then the first question. The guided ring appears on the answer.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### A7 — A five-year-old would know what to touch next
- **STATUS:** NOT TESTED
- **EXPECTED:** At every step, one thing is obviously the thing to touch.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## B. Audio (the real iPad voice)

### B1 — Selected voice and locale
- **STATUS:** NOT TESTED
- **EXPECTED:** A clear en-US voice. Not a novelty voice.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### B2 — Letter names M, S, O, T are understandable
- **STATUS:** NOT TESTED
- **EXPECTED:** "em", "ess", "oh" and "tee" are clearly the letter names. "Find the letter em" is not heard as "find 'em".
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### B3 — Volume and latency
- **STATUS:** NOT TESTED
- **EXPECTED:** Comfortable volume, with no long silence before speech.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### B4 — Repeat, including rapid taps
- **STATUS:** NOT TESTED
- **EXPECTED:** Every tap on Repeat restarts the question cleanly. Rapid taps never stack voices or go silent.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### B5 — Skipping the intro still reaches the question
- **STATUS:** NOT TESTED
- **EXPECTED:** Tapping a tile or Repeat during the arrival story jumps straight to the question.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### B6 — Sound off behaves honestly
- **STATUS:** NOT TESTED
- **EXPECTED:** With spoken instructions off, nothing is spoken and the bubble shows "Find M". The grown-ups note explains that those rounds are not counted as practice.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### B7 — Audio decision gate
- **STATUS:** NOT TESTED
- **EXPECTED:** The device voice is classified as ACCEPTABLE FOR DEVELOPMENT or UNACCEPTABLE EVEN FOR DEVELOPMENT, with reasons.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## C. Child touch behaviour

### C1 — Normal, fast and slightly inaccurate taps on tiles
- **STATUS:** NOT TESTED
- **EXPECTED:** Every tap on a tile registers, including near its edges.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### C2 — Double taps and repeated tapping
- **STATUS:** NOT TESTED
- **EXPECTED:** No zoom, and no double answer.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### C3 — Drag slightly before release
- **STATUS:** NOT TESTED
- **EXPECTED:** A small wobble still counts as a tap. The page never scrolls or rubber-bands.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### C4 — Tapping another answer before feedback finishes
- **STATUS:** NOT TESTED
- **EXPECTED:** Ignored after a correct answer. No stuck state and no second answer.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### C5 — Long press, text selection, callouts
- **STATUS:** NOT TESTED
- **EXPECTED:** A long press on a letter selects nothing and raises no menu or magnifier.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### C6 — Palm or finger resting nearby
- **STATUS:** NOT TESTED
- **EXPECTED:** A resting hand does not trigger answers.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## D. Wrong-answer flow

### D1 — First mistake
- **STATUS:** NOT TESTED
- **EXPECTED:** The tile wiggles and steps aside immediately, and Pip says "Almost! Listen again." The child can tell what to do next.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### D2 — Second mistake
- **STATUS:** NOT TESTED
- **EXPECTED:** The answer glows and "Here it is!" is heard. Nothing feels like punishment.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### D3 — No stars lost, still completable, no error look
- **STATUS:** NOT TESTED
- **EXPECTED:** The star count is unchanged, the round finishes, and nothing is red or looks like an error.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## E. Completion and reward loop

### E1 — Mission completion is unmistakable
- **STATUS:** NOT TESTED
- **EXPECTED:** "You did it!", the beacon lights, and 3 stars arrive one by one.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### E2 — Reward pacing
- **STATUS:** NOT TESTED
- **EXPECTED:** It feels rewarding without being long.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### E3 — Back to Earth, relit Moon, star count
- **STATUS:** NOT TESTED
- **EXPECTED:** The way home is obvious. The Moon glows, and the star count is understandable.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### E4 — Rocket Dock: preview, locked, cost, unlock, equip
- **STATUS:** NOT TESTED
- **EXPECTED:** Tap → instant preview. Locked items say how many more stars are needed. The cost is understandable. Unlock, then use it.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### E5 — Leaving and re-entering the Dock
- **STATUS:** NOT TESTED
- **EXPECTED:** The equipped paint stays equipped. An unchosen preview is discarded.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## F. Persistence

### F1 — Reload
- **STATUS:** NOT TESTED
- **EXPECTED:** Completion, stars, spends, ownership and the equipped paint all remain. No welcome, and no duplicate rewards.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### F2 — Close the tab and reopen it
- **STATUS:** NOT TESTED
- **EXPECTED:** As F1.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### F3 — Quit Safari and reopen it
- **STATUS:** NOT TESTED
- **EXPECTED:** As F1.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### F4 — Quit and reopen the Home Screen app
- **STATUS:** NOT TESTED
- **EXPECTED:** As F1, within the Home Screen app's own storage.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## G. Home Screen install

### G1 — Icon and name
- **STATUS:** NOT TESTED
- **EXPECTED:** The Pip icon, labelled "Space Kinder".
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### G2 — Standalone launch
- **STATUS:** NOT TESTED
- **EXPECTED:** Opens full screen with no Safari chrome, in landscape.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### G3 — Differences between Safari and the Home Screen app
- **STATUS:** NOT TESTED
- **EXPECTED:** Any difference is recorded. Note that the Home Screen app starts with its own separate progress.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## H. Offline (needs HTTPS — see Environment notes)

### H1 — Reopen from the Home Screen with Wi-Fi off
- **STATUS:** NOT TESTED
- **EXPECTED:** The app opens with all artwork.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### H2 — Play a mission and use the Dock offline
- **STATUS:** NOT TESTED
- **EXPECTED:** The mission works, progress is written and the Dock works. The voice may or may not work offline; record which.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### H3 — Reconnect
- **STATUS:** NOT TESTED
- **EXPECTED:** Nothing changes incorrectly, and progress made offline remains.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## I. Orientation

### I1 — The portrait prompt
- **STATUS:** NOT TESTED
- **EXPECTED:** A clean "turn your iPad" screen, spoken once.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### I2 — Rotate during Earth, the mission, travel, and the grown-ups area
- **STATUS:** NOT TESTED
- **EXPECTED:** State is preserved. The question is re-asked when back in landscape. No duplicate audio, no stale bubble, and grown-up pages stay usable.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## J. Safe areas and the physical screen

### J1 — Edges and corners
- **STATUS:** NOT TESTED
- **EXPECTED:** Launch, the star count, Home, Repeat, the tiles, the Dock and the grown-ups lock are all clear of the edges, the rounded corners and the home indicator, in both Safari and the Home Screen app.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## K. Split View

### K1 — A reasonable Split View width
- **STATUS:** NOT TESTED
- **EXPECTED:** Classified as must fix, nice to support, or unsupported intentionally.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## L. Reduce Motion

### L1 — The iPad system setting
- **STATUS:** NOT TESTED
- **EXPECTED:** Travel is a quick crossfade, feedback is still understandable, and nothing pulses.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### L2 — The app's grown-ups setting
- **STATUS:** NOT TESTED
- **EXPECTED:** The same as L1, with the system setting off.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## M. Grown-ups gate

### M1 — Physical 3-second hold
- **STATUS:** NOT TESTED
- **EXPECTED:** An adult can find it. A child is unlikely to open it by accident. The ring fills while holding, and letting go early cancels it.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

### M2 — Repeated attempts
- **STATUS:** NOT TESTED
- **EXPECTED:** Attempt after attempt behaves the same, and no stuck ring.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

## N. Performance

### N1 — Launch, animation, travel, speech and transitions
- **STATUS:** NOT TESTED
- **EXPECTED:** No visible stutter, and no noticeable delay after a tap.
- **OBSERVATION:** —
- **ACTUAL:** —
- **SEVERITY:** —
- **EVIDENCE:** —
- **FIX:** —
- **RETEST:** —

---

## Subjective ratings (1–10)

| Area | Rating | Notes |
|---|---|---|
| Earth first impression | | |
| Clarity of what to tap | | |
| Pip / guide quality | | |
| Audio clarity | | |
| Travel feel | | |
| Letter game clarity | | |
| Correct-answer satisfaction | | |
| Wrong-answer support | | |
| Star reward feel | | |
| Rocket Dock | | |
| Touch comfort | | |
| Visual quality (placeholder art judged as placeholder) | | |
| Overall child-friendliness | | |
| **Would I hand this to a kindergartner without explaining it?** | | |

**Open questions:**
- What felt slow?
- What confused you?
- What felt cheap or web-like?
- What felt surprisingly good?
- What did you instinctively tap that didn't respond?
- What took too long?
- Was anything overstimulating?
- Was anything boring?
- Did anything need an adult to interpret it?

---

## Defect register

| ID | Test | Severity | Summary | Status |
|---|---|---|---|---|
| AUD-1 | A2, B1 | HIGH | The device voice sounds robotic. Cause: the app takes the *first* English voice the device lists, which can be a basic compact or even a novelty voice, ignoring the Enhanced and Premium voices, and it pitch-shifts the voice (1.08), which adds artificiality. There is also no way to see on the device which voice was chosen. | Fixed in v0.1.1. Awaiting iPad retest |
| AUD-2 | A2, tester report | MEDIUM | Pip speaks by fixed rule, not by need: the same instruction on every visit, the same sentence pattern for every question and every piece of praise. Justified fix: audio is the pre-reader's main channel, and a guide who repeats itself teaches a child to tune it out. | Fixed in v0.1.1. Awaiting iPad retest |

### Fix notes

**AUD-1: voice quality (v0.1.1)**

- **Root cause.** `pickVoice` took the first local `en-US` voice in the
  device's list. On iPadOS that list also holds Apple's novelty voices
  (Albert, Bubbles, Zarvox…) and the Eloquence voices, and one of them can
  come first. The voice was also pitch-shifted to 1.08.
- **Fix.**
  - Voices are ranked, never taken in list order. US English comes first,
    then Premium, then Enhanced, then standard.
  - A novelty voice is used only if nothing else exists. Eloquence voices
    rank below standard ones.
  - Pitch is 1 and the rate is 0.92.
  - The ranking runs again when the device's voice list changes, so a voice
    downloaded while the app is open is used from the next line.
  - The grown-ups area now names the voice in use and explains how to
    download a Premium one.
- **Verified off the device.**
  - Contracts check the ranking against iPadOS-style voice ids, check that
    the pitch and rate reach the speech engine, and check that a newly
    installed voice is picked up.
  - A desktop browser chose a US voice at pitch 1 and rate 0.92.
- **Not verified.** How it sounds on the iPad. Only listening on the device
  can close this. A synthesiser is still a synthesiser: if the best installed
  voice is still too robotic, the answer is the audio decision gate (B7), not
  more code.

**AUD-2: when Pip speaks (v0.1.1)**

- **Root cause.** Every moment had one fixed sentence, said every time the
  moment came round:
  - "Tap the big Launch button" on every arrival at Earth.
  - "Welcome home! Look, the Moon is shining!" on every return after the
    first mission.
  - The Dock welcome on every visit.
  - One question pattern and three praise patterns for every round.
- **Fix.** Fixed rules, under "When Pip speaks" in `index.html`, with no AI:
  1. An instruction is given once. After that, a hint comes only after 12
     seconds with no tap, on Earth or in the Dock, and at most once per
     visit.
  2. A recurring moment rotates its phrasing and never uses the same one
     twice in a row.
  3. A moment with nothing new to say gets no line.
  4. Pip finishes its sentences. Tapping the same thing again does not
     restart the line, and tapping Pip mid-sentence waits.
- **Verified off the device.**
  - Contract 30 plays five missions and checks every rule.
  - Each rule was broken on purpose in turn (28 planted bugs), and the
    contracts caught every one.
  - In a desktop browser, with a silent speech engine that records each line:
    - Three quick taps on Pip gave one line.
    - The Earth and Dock hints each came once, 12 seconds after the last tap.
    - Questions and praise rotated their wording.
- **Not verified.** The iPad. Retest A3, B4 and D1, then play two missions in
  a row and listen for any line that feels repeated or badly timed.
