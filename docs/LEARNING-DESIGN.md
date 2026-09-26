# Learning design

How the learning works, and the decisions behind it. For where the content
came from and what still needs expert review, see
[CONTENT-SOURCES.md](CONTENT-SOURCES.md) and
[CONTENT-REVIEW.md](CONTENT-REVIEW.md). **Nothing here claims to be
research-backed or aligned with a standard or curriculum.**

## Principles every activity follows

- **One clear task at a time,** spoken aloud, with a large **Repeat** button
  always visible.
- **Almost no reading.** On-screen text is a few words and never necessary.
- **Big, forgiving targets.** Choice tiles are 130–236px, and every child
  control is at least 76px.
- **Immediate, calm feedback.** There is no "wrong!", no buzzer, no red, no
  lost lives and no lost stars. There is no countdown.
- **Short.** A mission is six rounds, which takes about 1–2 minutes with the
  device voice.
- **A stop point after every mission.** The celebration leads home to Earth.

## Two layers: story and learning

The **story layer** is the solar system: Earth, then the Moon, then planets
later. The **learning layer** is the skills. They cooperate but are not the
same thing:

- A destination has a `primarySkill` and `reviewSkills`.
- A **mission** names its own `skillId`.
- Resequencing the curriculum never means moving a planet, and a planet never
  locks a skill behind it.

Handwriting in particular is not meant to wait for Neptune. It is planned as
recurring "Explorer Writing Labs".

### The planned route (a plan, not built content)

| Destination | Primary skill (proposed) |
|---|---|
| Moon | Letter recognition. **Built: `moon-1`** |
| Mercury | Letter recognition (lowercase, matching cases) |
| Venus | Rhyming |
| Mars | Counting syllables, beginning sounds |
| Jupiter | Beginning sounds, early blending |
| Saturn | CVC words |
| Uranus | Sight words (only once a list is chosen and sourced) |
| Neptune | Mixed review |

Earlier skills spiral back: a later destination's `reviewSkills` bring back
activities from before. None of these destinations exist in code yet, on
purpose. Declaring places nobody can visit would be content pretending to
exist.

## The one activity built: `find-letter`

**Objective:** recognise an uppercase letter from its **spoken name**.

**How a round goes:**

1. Pip says *"Find the letter em."* The bubble reads **"Find the letter!"**
   and never shows the letter, because showing "Find M" beside a tile that
   says M would turn hearing a name into matching two shapes. Later rounds
   ask in other words (*"Where is the letter em?"*), but always name "the
   letter".
2. Three tiles show three uppercase letters. The child taps one.
3. **Correct:** the tile pops, gains a green ring and a check mark, and Pip
   praises and names it: *"Yes! That's the letter em."*, *"Great job! You
   found the letter em."* Confirming the name reinforces the connection
   being taught.
4. **First wrong tap:** that tile wiggles and steps aside (dimmed and
   smaller), and Pip says *"Almost! Listen again. Find the letter em."* The
   question comes back in its plainest words.
5. **Second wrong tap:** that tile steps aside too, and the answer glows:
   *"Here it is! This is the letter em. Tap it!"* The only tile left is the
   answer, so **every round can be finished**.
6. If nothing is tapped for 10 seconds, Pip nudges (*"Listen. Find the
   letter em."*), then once more (*"Take your time…"*), then waits. This
   never counts against the child. The Repeat button says the question
   again in the same words.

**The guided first round.** The first round of the mission teaches the tap
itself: after the question, a ring pulses around the answer. It is not
recorded as evidence of anything.

**When nothing can be heard** (voice off, or no speech engine), the question
caption falls back to showing the letter ("Find M"), which turns the round
into visual matching. Those rounds are **not recorded as recognition
evidence**, and the grown-ups area explains why.

### When Pip speaks

The first real-iPad test found the device voice robotic and repetitive: the
same sentences, in the same words, on every visit. That is how a child learns
to stop listening to a guide. Pip therefore speaks by **fixed rules**:

1. **An instruction is given once.** After that Pip stays quiet, and offers a
   hint only when the child seems stuck: no tap for 12 seconds on Earth or in
   the Rocket Dock. It gives at most one hint per visit, and never during a
   mission, where the 10-second nudges above do that job.
2. **A recurring moment rotates its words.** Launching, arriving, finishing,
   coming home, each question, each praise and each "almost" has several
   phrasings, and the same phrasing is never used twice in a row.
3. **A moment with nothing new to say gets no line.** The Dock welcome is
   said on the first visit each time the app is opened, and later visits are
   quiet. "Look, the Moon is shining!" is said once, on the flight home from
   the mission that relit it.
4. **Pip finishes its sentences.** A tap asking for the line already playing
   does not restart it, and tapping Pip mid-sentence does not cut Pip off.

The choice of line is deterministic: it comes from counts, never from chance,
and never from an AI. A contract plays whole journeys and fails if any rule is
broken.

**The voice itself** is the device's speech synthesiser. It is a temporary
stand-in until recorded narration exists. The app chooses the most natural
US English voice installed: Premium, then Enhanced, then standard. It never
chooses a novelty voice, and it does not pitch-shift the voice, because
pitch-shifting was what made it sound most robotic. The grown-ups area names
the voice in use, and explains how to download a better one.

### Difficulty: which wrong choices appear

| Level | Distractors | Example for M |
|---|---|---|
| 1 | Different stroke shape (straight, diagonal, curved, mixed), never a lookalike | O, S |
| 2 | The same kind of strokes, not a lookalike | A, K |
| 3 | At least one letter commonly confused with the target | N or W |

Adaptation is deterministic and explainable:

- Every letter starts at the mission's lowest level (1).
- **Three answers in a row found first try** move that letter up one level,
  up to the mission's ceiling (3 for `moon-1`).
- **Any answer that needed help** moves it down one level, but never below
  the floor.
- The level is **never stored**. It is recomputed from the letter's last 8
  answers, so it can never disagree with them.
- Choice order comes from a random generator seeded by the run and round, so
  the same inputs always give the same round, and a test can prove it.

There is no AI or model anywhere, and none should be added.

### Evidence (grown-ups only)

Per letter, the app records how many times it was heard, how many were found
on the first try, the last 8 outcomes, and when it was last practised. The
grown-ups area shows these as **plain counts** ("Heard 3 times · found on the
first try 2 times"). There are no percentages, no mastery labels, and nothing
calling a child behind or weak. Evidence exists only to shape the next
experience.

## Stars: participation, not grades

- Finishing a mission earns a **fixed 3 stars**, however many mistakes were
  made. A replay earns them again, because practice counts.
- A wrong answer can never touch the star ledger, and a contract holds it to
  that.
- Stars buy **purely cosmetic** rocket paint. There are no gameplay
  advantages, no real money, no random rewards and no scarcity.

## What changes for the next skills

Each learning area gets interactions designed around its real objective, not
reskinned multiple choice:

- **Rhyming:** listen-first pairing of pictures.
- **Beginning sounds:** hear the word, then the sound.
- **Syllables:** tap or drum once per beat.
- **CVC words:** hear the phonemes, blend them, build the word.
- **Sight words:** a sourced list, recognition in simple contexts.
- **Handwriting:** tracing with a start point, a demonstrated direction, and
  forgiving path proximity. **No handwriting recognition.**

**Recorded audio is a prerequisite for any phonics work.** A speech
synthesiser cannot be trusted to produce isolated phonemes without an added
schwa, so no letter-sound or CVC content will run on the device voice.
