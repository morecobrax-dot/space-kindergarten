# Learning design

How the learning works, and the decisions behind it. For where the content
came from and what still needs expert review, see
[CONTENT-SOURCES.md](CONTENT-SOURCES.md) and
[CONTENT-REVIEW.md](CONTENT-REVIEW.md). **Nothing here claims to be
research-backed or aligned with a standard or curriculum.** The rhyming and
beats content is development content, written for this project and
awaiting review.

## Principles every activity follows

- **One clear task at a time,** spoken aloud, with a **Repeat** button
  always visible.
- **Almost no reading.** On-screen text is a few words and never necessary.
  Each game shows its name and what to do (LETTER EXPLORER / Find the
  letter you hear), and each planet what it teaches (MERCURY / Rhymes •
  Syllables): for grown-ups and early readers. Pip says everything a
  pre-reader needs, and nothing on screen gives an answer away.
- **Big, forgiving targets.** Choice tiles are 130–236px on an iPad (they
  shrink to fit a phone rather than slip off it), and every child control
  is at least a 76px target, whatever the size of its mark.
- **An answer being praised owns the screen.** Taps during praise wait; a
  tap during the explanation means "go on" and skips to the question; a
  second tap straight after a wrong answer is the same finger bouncing, not
  a second try (a 0.45s hold). Found on a real iPad: fast taps during
  feedback cut the praise off.
- **Immediate, calm feedback.** There is no "wrong!", no buzzer, no red, no
  lost lives and no lost stars. There is no countdown.
- **Short.** A mission is five or six rounds, which takes about 1–2 minutes
  with the device voice.
- **A stop point after every mission.** The child is back in the world: what
  they fixed lights up, the stars land in the count, and there is one thing
  to do next — the next marker, or the yellow way home.

## Two layers: story and learning

The **story layer** is the solar system: Earth, then the Moon, then Mercury,
then planets later. The **learning layer** is the skills. They cooperate but
are not the same thing:

- A destination has a `primarySkill` and `reviewSkills`.
- A **mission** names its own `skillId`.
- Resequencing the curriculum never means moving a planet, and a planet never
  locks a skill behind it.

Handwriting in particular is not meant to wait for Neptune. It is planned as
recurring "Explorer Writing Labs".

### Missions happen in the world

The world is the navigation. Launch flies to a place; the place has
**markers** standing on its ground — the Moon's beacon, Mercury's radar dish
and meteor rocks — and each marker is a mission.

1. **Arrive.** Pip tells the place's story and points at the marker to tap.
2. **One mission at a time.** Only the next marker pulses; tapping another
   one is answered by pointing at the one that is ready.
3. **Play** the mission, standing on the world: the learning layer is drawn
   over the planet's horizon, and the markers step back while it plays.
4. **The world answers.** The marker lights up in front of the child, a
   restored place brightens, three stars arc to the count, and Pip cheers.
5. **What is next is shown:** the next marker pulses, or — when the place is
   restored — the next route appears in its sky and the way home turns
   yellow.

A restored place can always be visited again, and its missions come round in
turn.

### The route (a plan, apart from what is built)

| Destination | Primary skill | State |
|---|---|---|
| Moon | Letter recognition | **Built:** `moon-1`, the Letter Explorer |
| Mercury | Rhyming, then counting syllables | **Built:** `mercury-1` Rhyme Radar, `mercury-2` Syllable Meteors. Opens when the Moon shines |
| Venus | Letter recognition (lowercase, matching cases) | planned |
| Mars | Beginning sounds | planned |
| Jupiter | Beginning sounds, early blending | planned |
| Saturn | CVC words | planned |
| Uranus | Sight words (only once a list is chosen and sourced) | planned |
| Neptune | Mixed review, with Explorer Writing Labs | planned |

The planned destinations are declared in `DESTINATIONS` as `kind: 'planned'`
so no mission can be filed under a place nobody planned. They have no
pictures and no missions, nothing draws them, and a contract holds them to
that: a declared plan, not content pretending to exist.

## Letter Explorer: `find-letter` (the Moon)

**Objective:** recognise an uppercase letter from its **spoken name**.

The letters stand on **Moon stones**: clay stones on the Moon's ground, each
with a clean plate on its face. The letter is always on the plate, never on
the clay, and the plate is as plain as a tile (7:1 contrast or better).

**How a round goes:**

1. Pip says *"Find the letter em."* The bubble reads **"Find the letter!"**
   and never shows the letter, because showing "Find M" beside a tile that
   says M would turn hearing a name into matching two shapes. Later rounds
   ask in other words (*"Where is the letter em?"*), but always name "the
   letter".
2. Three stones show three uppercase letters. The child taps one.
3. **Correct:** the plate gains a green ring and a check mark, and Pip
   praises and names it: *"Yes! That's the letter em."*, *"Great job! You
   found the letter em."* Confirming the name reinforces the connection
   being taught.
4. **First wrong tap:** that stone wiggles and steps aside (dimmed and
   smaller), and Pip says *"Almost! Listen again. Find the letter em."* The
   question comes back in its plainest words.
5. **Second wrong tap:** that stone steps aside too, and the answer glows:
   *"Here it is! This is the letter em. Tap it!"* The only stone left is the
   answer, so **every round can be finished**.
6. If nothing is tapped for 10 seconds, Pip nudges (*"Listen. Find the
   letter em."*), then once more (*"Take your time…"*), then waits. This
   never counts against the child. The Repeat button says the question
   again in the same words.

**The guided first round.** The first round of every mission teaches the tap
itself: after the question, a ring pulses around the answer. It is not
recorded as evidence of anything.

**When nothing can be heard** (voice off, or no speech engine), the question
caption falls back to showing the letter ("Find M"), which turns the round
into visual matching. Those rounds are **not recorded as recognition
evidence**, and the grown-ups area explains why.

## Rhyme Radar: `rhyme-pick` (Mercury)

**Objective:** hear which of three words rhymes with a word — the same
sound at the end — from **pictures and the spoken words**, without reading.

Mercury's signal is fuzzy; the radar dish hears one word. That word's
picture is shown in the radar's round window, and three pictures stand on
the ground below it.

1. Pip says the word as a name (*"Cake."*), then the question (*"What rhymes
   with cake?"*), then **names each picture as it lights up** (*"Snake."
   "Sock." "Moon."*). A child who cannot read cannot rhyme with a picture
   nobody has named, and a picture can be called more than one thing.
2. The child taps a picture.
3. **Correct:** the card gains the green ring and check, and Pip says both
   words, so the rhyme is the last thing heard: *"Yes! cake, snake. They
   rhyme!"*
4. **First wrong tap:** the card steps aside; *"Almost! Listen again. What
   rhymes with cake?"*, and the pictures left are named again.
5. **Second wrong tap:** *"Here it is! cake, snake. Tap the snake!"*, with
   the answer ringed. Every round can be finished.

**Difficulty.** The wrong pictures are chosen by the engine from the word
list. A wrong picture **never** rhymes with the word heard. At the easier
level the wrong pictures also start with different sounds; at the harder
level one of them starts with the **same** sound as the word heard (cake:
car), because "starts the same" is the classic mix-up with "rhymes", and
hearing past it is the skill. The level comes from the same rule as letters:
three first-try answers up, any help down, recomputed from stored answers.

## Syllable Meteors: `syllable-tap` (Mercury)

**Objective:** hear the beats (syllables) in a spoken word, and show how
many there are by tapping once for each.

1. Pip says the word (*"Banana."*) and asks for its beats (*"Tap the stone
   once for each beat!"*). The word's picture is shown; the count never is.
2. The child taps the big meteor stone. **Each tap lights a meteor**, so the
   child sees the count they are making.
3. **A pause ends the count** (1.5 seconds without a tap). **Only the count
   is judged** — never the rhythm, never the speed. Two taps closer than
   0.09 s are one finger bouncing, and count once.
4. **Correct:** the meteors glow, and Pip says the count in words: *"Yes!
   banana has three beats!"*
5. **First wrong count:** the meteors clear, *"Almost! Listen again."*, and
   the word and question again. A count is not a tile: the child may tap the
   same wrong count again, and it is simply another try.
6. **Second wrong count:** Pip **shows the beats**: *"Let's tap it together.
   Listen!"*, each beat said on its own as a meteor lights (*"ba!" "na!"
   "na!"*), then *"Now you! three beats. Tap the stone!"*, with three
   meteors waiting. From then on only that many taps count, so the round
   always ends right.

The first round of the mission is shown the same way before the child
tries, and is not evidence. Waiting meteors are drawn **only** while Pip is
showing the count: drawn before a first try, they would give the answer
away.

**The device voice and beats.** Beats are whole-word parts, not isolated
phonemes, so the device voice can say them. Each is spelled so the voice
says it clearly on its own (*"ap" "pull"* for apple) and must be checked on
the target iPad voice ([CONTENT-REVIEW.md](CONTENT-REVIEW.md#7-syllable-meteors-mercury-2--development-content)).
Recordings should replace them before they are called final.

### When Pip speaks

The first real-iPad test found the device voice robotic and repetitive: the
same sentences, in the same words, on every visit. That is how a child learns
to stop listening to a guide. Pip therefore speaks by **fixed rules**:

1. **An instruction is given once.** After that Pip stays quiet, and offers a
   hint only when the child seems stuck: no tap for 12 seconds on Earth, on a
   planet or in the space station. It gives at most one hint per visit, and
   never during a mission, where the 10-second nudges above do that job. A
   task is explained when its mission starts, until it has been done once.
2. **A recurring moment rotates its words.** Launching, arriving, finishing,
   coming home, each question, each praise and each "almost" has several
   phrasings, and the same phrasing is never used twice in a row.
3. **A moment with nothing new to say gets no line.** The Dock welcome is
   said on the first visit each time the app is opened, and later visits are
   quiet. "Look, the Moon is shining!" and "Next stop, Mercury!" are said
   once, on the flight home from the mission that made them true.
4. **Pip finishes its sentences.** A tap asking for the line already playing
   does not restart it, and tapping Pip mid-sentence does not cut Pip off.
5. **Each kind of line has its own timing** (`DIALOGUE`): a small breath
   after a piece of story before the next line, praise held long enough to
   see the right answer, and whether a tap may cut the line short. Recorded
   narration will keep these rules.

The choice of line is deterministic: it comes from counts, never from chance,
and never from an AI. A contract plays whole journeys and fails if any rule is
broken.

**The voice itself** is the device's speech synthesiser. It is a temporary
stand-in until recorded narration exists. The app chooses the most natural
US English voice installed: Premium, then Enhanced, then standard. It never
chooses a novelty voice, and it does not pitch-shift the voice, because
pitch-shifting was what made it sound most robotic. The grown-ups area names
the voice in use, and explains how to download a better one.

### Difficulty: which wrong letters appear

| Level | Distractors | Example for M |
|---|---|---|
| 1 | Different stroke shape (straight, diagonal, curved, mixed), never a lookalike | O, S |
| 2 | The same kind of strokes, not a lookalike | A, K |
| 3 | At least one letter commonly confused with the target | N or W |

Adaptation is deterministic and explainable, for letters and rhymes alike:

- Every item starts at the mission's lowest level (1).
- **Three answers in a row right first try** move that item up one level,
  up to the mission's ceiling (3 for `moon-1`, 2 for `mercury-1`).
- **Any answer that needed help** moves it down one level, but never below
  the floor.
- The level is **never stored**. It is recomputed from the item's last 8
  answers, so it can never disagree with them.
- Choice order comes from a random generator seeded by the run and round, so
  the same inputs always give the same round, and a test can prove it.

Beats have one level: the count is the count.

There is no AI or model anywhere, and none should be added.

### Evidence (grown-ups only)

Per letter or word, the app records how many times it was asked, how many
were right on the first try, the last 8 outcomes, and when it was last
practised. The grown-ups area shows these as **plain counts, skill by
skill** ("Heard 3 times · rhyme found on the first try 2 times"). There are
no percentages, no mastery labels, and nothing calling a child behind or
weak. Evidence exists only to shape the next experience.

## Stars: participation, not grades

- Finishing a mission earns a **fixed 3 stars**, however many mistakes were
  made. A replay earns them again, because practice counts.
- A wrong answer can never touch the star ledger, and a contract holds it to
  that.
- Stars buy **purely cosmetic** rocket paint. There are no gameplay
  advantages, no real money, no random rewards and no scarcity.

## What changes for the next skills

Each learning area gets interactions designed around its real objective, not
reskinned multiple choice. Rhyming (listen-first pairing of pictures) and
syllables (tap once per beat) are now built. Still planned, **and not
built**:

- **Beginning sounds:** hear the word, then the sound.
- **CVC words:** hear the phonemes, blend them, build the word.
- **Sight words:** a sourced list, recognition in simple contexts.
- **Handwriting:** tracing with a start point, a demonstrated direction, and
  forgiving path proximity. **No handwriting recognition.**

**Recorded audio is a prerequisite for any phonics work.** A speech
synthesiser cannot be trusted to produce isolated phonemes without an added
schwa, so no letter-sound or CVC content will run on the device voice.
