# Audio recordings

Every recording a voice actor will make, derived from the content. The
first two tables are **required**: today those sounds are development
audio, made on the device by the development phonics voice
([AUDIO.md](AUDIO.md)), and they are not production-ready. The last table
is the narration the device voice says today, until it is recorded.

A recording is attached by cue id in `VOICE_RECORDINGS` (and registered in
`ASSET_REGISTRY` like every file). It plays instead of the stand-in, and
nothing else changes. Record in one voice, US English, with the timing and
pauses described in each script.

<!-- AUDIO-RECORDINGS-BEGIN
 — derived from the content by `npm run config:sync`. Do not hand-edit. -->

**39 recordings replace development audio (13 sounds, 26 words said sound by sound or blended); 95 authored lines and 1055 lines built from templates replace the device voice.**

## Sounds (required)

Each on its own, with no vowel after it: /m/ is "mmm", never "muh"; /p/ is one puff, never "puh".

| Cue | Sound | As in | Script | Used by |
|---|---|---|---|---|
| `phoneme.a` | /æ/ | apple | /æ/ as in "apple": held for about half a second, with no vowel after it | Word Builder |
| `phoneme.b` | /b/ | bus | /b/ as in "bus": one short puff, with no vowel after it | Word Builder |
| `phoneme.f` | /f/ | fish | /f/ as in "fish": held for about half a second, with no vowel after it | Sound Scout, Word Builder |
| `phoneme.g` | /g/ | gum | /g/ as in "gum": one short puff, with no vowel after it | Word Builder |
| `phoneme.h` | /h/ | hat | /h/ as in "hat": held for about half a second, with no vowel after it | Word Builder |
| `phoneme.k` | /k/ | cat | /k/ as in "cat": one short puff, with no vowel after it | Word Builder |
| `phoneme.m` | /m/ | moon | /m/ as in "moon": held for about half a second, with no vowel after it | Sound Scout, Word Builder |
| `phoneme.n` | /n/ | net | /n/ as in "net": held for about half a second, with no vowel after it | Sound Scout, Word Builder |
| `phoneme.p` | /p/ | pan | /p/ as in "pan": one short puff, with no vowel after it | Word Builder |
| `phoneme.r` | /ɹ/ | rug | /ɹ/ as in "rug": held for about half a second, with no vowel after it | Sound Scout |
| `phoneme.s` | /s/ | sun | /s/ as in "sun": held for about half a second, with no vowel after it | Sound Scout, Word Builder |
| `phoneme.t` | /t/ | tub | /t/ as in "tub": one short puff, with no vowel after it | Word Builder |
| `phoneme.u` | /ʌ/ | up | /ʌ/ as in "up": held for about half a second, with no vowel after it | Word Builder |

## Words, sound by sound and blended (required)

| Word | Cue | Script |
|---|---|---|
| bug | `seg.bug` | bug, sound by sound: /b/ … /ʌ/ … /g/, each on its own, a short pause between |
| bug | `blend.bug` | bug, blended slowly in one breath, each sound running into the next: /b/ /ʌ/ /g/ |
| bun | `seg.bun` | bun, sound by sound: /b/ … /ʌ/ … /n/, each on its own, a short pause between |
| bun | `blend.bun` | bun, blended slowly in one breath, each sound running into the next: /b/ /ʌ/ /n/ |
| bus | `seg.bus` | bus, sound by sound: /b/ … /ʌ/ … /s/, each on its own, a short pause between |
| bus | `blend.bus` | bus, blended slowly in one breath, each sound running into the next: /b/ /ʌ/ /s/ |
| cap | `seg.cap` | cap, sound by sound: /k/ … /æ/ … /p/, each on its own, a short pause between |
| cap | `blend.cap` | cap, blended slowly in one breath, each sound running into the next: /k/ /æ/ /p/ |
| cat | `seg.cat` | cat, sound by sound: /k/ … /æ/ … /t/, each on its own, a short pause between |
| cat | `blend.cat` | cat, blended slowly in one breath, each sound running into the next: /k/ /æ/ /t/ |
| cup | `seg.cup` | cup, sound by sound: /k/ … /ʌ/ … /p/, each on its own, a short pause between |
| cup | `blend.cup` | cup, blended slowly in one breath, each sound running into the next: /k/ /ʌ/ /p/ |
| fan | `seg.fan` | fan, sound by sound: /f/ … /æ/ … /n/, each on its own, a short pause between |
| fan | `blend.fan` | fan, blended slowly in one breath, each sound running into the next: /f/ /æ/ /n/ |
| hat | `seg.hat` | hat, sound by sound: /h/ … /æ/ … /t/, each on its own, a short pause between |
| hat | `blend.hat` | hat, blended slowly in one breath, each sound running into the next: /h/ /æ/ /t/ |
| hut | `seg.hut` | hut, sound by sound: /h/ … /ʌ/ … /t/, each on its own, a short pause between |
| hut | `blend.hut` | hut, blended slowly in one breath, each sound running into the next: /h/ /ʌ/ /t/ |
| map | `seg.map` | map, sound by sound: /m/ … /æ/ … /p/, each on its own, a short pause between |
| map | `blend.map` | map, blended slowly in one breath, each sound running into the next: /m/ /æ/ /p/ |
| nut | `seg.nut` | nut, sound by sound: /n/ … /ʌ/ … /t/, each on its own, a short pause between |
| nut | `blend.nut` | nut, blended slowly in one breath, each sound running into the next: /n/ /ʌ/ /t/ |
| pan | `seg.pan` | pan, sound by sound: /p/ … /æ/ … /n/, each on its own, a short pause between |
| pan | `blend.pan` | pan, blended slowly in one breath, each sound running into the next: /p/ /æ/ /n/ |
| sun | `seg.sun` | sun, sound by sound: /s/ … /ʌ/ … /n/, each on its own, a short pause between |
| sun | `blend.sun` | sun, blended slowly in one breath, each sound running into the next: /s/ /ʌ/ /n/ |

## Narration (the device voice until recorded)

Sight words and handwriting add no sounds to the required list: a sight word is said whole.

| Cue | Type | Script |
|---|---|---|
| `guide.welcome` | story | Hi, explorer! I'm Pip, your space buddy. Let's go on an adventure! |
| `guide.launchHint.1` | hint | Tap the big Launch button to fly! |
| `guide.launchHint.2` | hint | Ready to fly? Tap Launch! |
| `guide.launchHint.3` | hint | Let's fly! Tap the yellow Launch button. |
| `guide.home.1` | story | Welcome home, explorer! |
| `guide.home.2` | story | Home again! Nice flying. |
| `guide.home.3` | story | Welcome back to Earth! |
| `guide.moonShining` | story | Welcome home! Look, the Moon is shining! |
| `guide.mercuryShining` | story | Welcome home! Look, Mercury is glowing! |
| `guide.marsShining` | story | Welcome home! Look, Mars is glowing! |
| `guide.jupiterShining` | story | Welcome home! Look, Jupiter is glowing! |
| `guide.dockHint` | hint | You have stars! Tap the paint brush to visit the space station and dress up your rocket. |
| `travel.launch.1` | reaction | Let's launch! |
| `travel.launch.2` | reaction | Blast off! |
| `travel.launch.3` | reaction | Here we go! |
| `place.moon` | story | The Moon! That's where we find letters. Tap Launch to fly there! |
| `place.mercury` | story | Mercury! That's where we play with rhymes and beats. Tap Launch to fly there! |
| `place.mars` | story | Mars! That's where we play with sounds and words. Tap Launch to fly there! |
| `place.jupiter` | story | Jupiter! That's where we find words. Tap Launch to fly there! |
| `travel.station` | reaction | Up we go, to the space station! |
| `travel.stationHome` | reaction | Back down to Earth! |
| `story.moon.firstArrive` | story | We made it to the Moon! Its beacon is dim. Let's find letters to light it up! |
| `story.moon.arrive.1` | story | Back on the Moon! |
| `story.moon.arrive.2` | story | The Moon again! Ready to find some letters? |
| `story.moon.arrive.3` | story | Here we are on the Moon! |
| `story.moon.restored` | story | You did it! The Moon's beacon is shining again! |
| `story.moon.shining.1` | story | You did it! The Moon is shining bright! |
| `story.moon.shining.2` | story | Hooray! Another mission done! |
| `story.moon.shining.3` | story | Great work, explorer! The Moon is glowing! |
| `story.mercury.reveal` | story | Look! A new planet is waiting for us. That is Mercury! |
| `story.mercury.next` | story | Next stop, Mercury! Tap Launch when you are ready. |
| `story.mercury.firstArrive` | story | We made it to Mercury! Mercury's signal is fuzzy. Let's fix it! |
| `story.mercury.arrive.1` | story | Back on Mercury! |
| `story.mercury.arrive.2` | story | Mercury again! Hello, warm rocks! |
| `story.mercury.arrive.3` | story | Here we are on Mercury! |
| `story.mercury.step` | story | It works! One more thing to fix on Mercury. |
| `story.mercury.restored` | story | You did it! Mercury's signal is clear! |
| `story.mercury.shining.1` | story | You did it! Mercury is glowing! |
| `story.mercury.shining.2` | story | Hooray! Another mission done! |
| `story.mercury.shining.3` | story | Great work, explorer! |
| `story.mars.reveal` | story | Look! A red planet is waiting for us. That is Mars! |
| `story.mars.next` | story | Next stop, Mars! Tap Launch when you are ready. |
| `story.mars.firstArrive` | story | We made it to Mars! Its sound scanner is quiet. Let's help it hear again! |
| `story.mars.arrive.1` | story | Back on Mars! |
| `story.mars.arrive.2` | story | Mars again! Hello, red rocks! |
| `story.mars.arrive.3` | story | Here we are on Mars! |
| `story.mars.step` | story | It works! Now the word machine needs help. |
| `story.mars.restored` | story | You did it! Mars is full of sounds again! |
| `story.mars.shining.1` | story | You did it! Mars is glowing! |
| `story.mars.shining.2` | story | Hooray! Another mission done! |
| `story.mars.shining.3` | story | Great work, explorer! |
| `story.jupiter.reveal` | story | Look! A giant planet is waiting for us. That is Jupiter! |
| `story.jupiter.next` | story | Next stop, Jupiter! Tap Launch when you are ready. |
| `story.jupiter.firstArrive` | story | We made it to Jupiter! Its sky signs have lost their words. Let's find them! |
| `story.jupiter.arrive.1` | story | Back on Jupiter! |
| `story.jupiter.arrive.2` | story | Jupiter again! Hello, big clouds! |
| `story.jupiter.arrive.3` | story | Here we are on Jupiter! |
| `story.jupiter.step` | story | It works! Now the orbit ring needs help. |
| `story.jupiter.restored` | story | You did it! Jupiter is full of words again! |
| `story.jupiter.shining.1` | story | You did it! Jupiter is glowing! |
| `story.jupiter.shining.2` | story | Hooray! Another mission done! |
| `story.jupiter.shining.3` | story | Great reading, explorer! |
| `marker.beacon` | hint | Tap the beacon to start! |
| `marker.radar` | hint | Tap the radar dish to start! |
| `marker.meteors` | hint | Now tap the meteor rocks! |
| `marker.scanner` | hint | Tap the sound scanner to start! |
| `marker.workshop` | hint | Now tap the word machine! |
| `marker.skysign` | hint | Tap the sky sign to start! |
| `marker.orbit` | hint | Now tap the orbit ring! |
| `planet.homeHint` | hint | Tap the big yellow button to fly home! |
| `mission.again.1` | instruction | Let's play it again! |
| `mission.again.2` | instruction | One more time! |
| `mission.again.3` | instruction | Here we go again! |
| `mission.howTo` | instruction | I'll say a letter. You tap it! |
| `mission.howTo.little` | instruction | Every letter has a big shape and a little shape. Now we find the little ones! |
| `mission.howTo.pair` | instruction | Big letters and little letters go together. I show you one. You find its partner! |
| `mission.howTo.rhyme` | instruction | Rhyming words sound the same at the end, like cat and hat. I'll say a word. You find the picture that rhymes! |
| `mission.howTo.beats` | instruction | Words have beats. Tap the big stone once for each beat! |
| `mission.howTo.sound` | instruction | Words start with a sound. I'll play a sound. You find the picture that starts with it. |
| `mission.howTo.build` | instruction | I'll say a word sound by sound. Tap the letters to build it. |
| `mission.howTo.write` | instruction | Let's write letters! Watch how I write each one. Then trace it with your finger, starting at the green dot. |
| `marker.slate` | hint | Tap the writing slate. Let's write! |
| `mission.howTo.sight` | instruction | Some words we just know by sight. I'll say a word. You find it! |
| `mission.howTo.match` | instruction | Look at the word in the middle. Find the one that is just the same! |
| `feedback.almost.1` | correction | Almost! Listen again. |
| `feedback.almost.2` | correction | Good try! Listen again. |
| `feedback.almost.3` | correction | So close! Listen again. |
| `home.ask` | question | Go back to Earth? |
| `dock.welcome` | story | Welcome to the space station! This is your rocket's garage. Tap something to try it on. |
| `dock.idle.1` | hint | Tap a color to try it on your rocket. |
| `dock.idle.2` | hint | Which one do you like? Tap one to try it on! |
| `dock.idle.3` | hint | Tap Gear to find a star or a moon for the top of your rocket! |
| `dock.unlocked` | reaction | Ta-da! It's on your rocket! |
| `dock.equipped` | reaction | Looking good! |
| `rotate` | reaction | Turn the screen sideways. |

## Narration built from templates (the device voice until recorded)

Each family is one set of phrasings said for many items: record every phrasing for every item listed. A phrasing with a placeholder is one line per item; one without is a single line. A cue id without its last number is its first phrasing (`find.M` is `find.M.0`). Stars and the station add the lines `stars.found.3` ("You found 3 stars!"), `stars.have.N` ("You have N stars!", and for none "You don't have any stars yet. Let's find some!"), `dock.needMore.N` ("You need N more stars. Keep exploring!"), `item.<id>` (each rocket item's name) and `dock.tab.<slot>` (each tab's name).

### Letters asked by name — 144 lines

Said for 12: M (em), S (ess), O (oh), T (tee), A (ay), P (pee), F (eff), N (en), C (see), H (aitch), U (you), B (bee). {L} is the letter's name.

| Cue | Type | Script |
|---|---|---|
| `find.{L}.0` | question | Find the letter {L}. |
| `find.{L}.1` | question | Now find the letter {L}. |
| `find.{L}.2` | question | Can you find the letter {L}? |
| `find.{L}.3` | question | Where is the letter {L}? |
| `again.{L}.0` | question | Listen. Find the letter {L}. |
| `again.{L}.1` | question | Take your time. Find the letter {L}. |
| `found.{L}.0` | praise | Yes! That's the letter {L}. |
| `found.{L}.1` | praise | Great job! You found the letter {L}. |
| `found.{L}.2` | praise | You got it! The letter {L}. |
| `found.{L}.3` | praise | Wonderful! That's the letter {L}. |
| `found.{L}.4` | praise | Super! You found the letter {L}. |
| `show.{L}` | correction | Here it is! This is the letter {L}. Tap it! |

### Little letters asked by name — 60 lines

Said for 6: O (oh), S (ess), C (see), M (em), A (ay), T (tee). {L} is the letter's name.

| Cue | Type | Script |
|---|---|---|
| `little.{L}.0` | question | Find the little letter {L}. |
| `little.{L}.1` | question | Now find the little letter {L}. |
| `little.{L}.2` | question | Can you find the little letter {L}? |
| `little.{L}.3` | question | Where is the little letter {L}? |
| `littleAgain.{L}.0` | question | Listen. Find the little letter {L}. |
| `littleAgain.{L}.1` | question | Take your time. Find the little letter {L}. |
| `littleFound.{L}.0` | praise | Yes! That's the little letter {L}. |
| `littleFound.{L}.1` | praise | Great job! You found the little letter {L}. |
| `littleFound.{L}.2` | praise | You got it! The little letter {L}. |
| `littleShow.{L}` | correction | Here it is! This is the little letter {L}. Tap it! |

### Big and little letters in pairs — 70 lines

Said for 5: N (en), P (pee), F (eff), H (aitch), B (bee). {L} is the letter's name; "lower" finds the little letter, "upper" the big one.

| Cue | Type | Script |
|---|---|---|
| `pair.{L}.lower.0` | question | This is the big letter {L}. Find the little letter {L}! |
| `pair.{L}.lower.1` | question | Here is the big letter {L}. Where is the little letter {L}? |
| `pair.{L}.lower.2` | question | The big letter {L}! Can you find the little letter {L}? |
| `pair.{L}.upper.0` | question | This is the little letter {L}. Find the big letter {L}! |
| `pair.{L}.upper.1` | question | Here is the little letter {L}. Where is the big letter {L}? |
| `pair.{L}.upper.2` | question | The little letter {L}! Can you find the big letter {L}? |
| `pairAgain.{L}.lower.0` | question | Look at the big letter {L}. Find the little letter {L}. |
| `pairAgain.{L}.lower.1` | question | Take your time. Find the little letter {L}. |
| `pairAgain.{L}.upper.0` | question | Look at the little letter {L}. Find the big letter {L}. |
| `pairAgain.{L}.upper.1` | question | Take your time. Find the big letter {L}. |
| `pairFound.{L}.lower.0` | praise | Yes! They match: the big and little letter {L}! |
| `pairFound.{L}.lower.1` | praise | You got it! The big letter {L} and the little letter {L}! |
| `pairFound.{L}.lower.2` | praise | They go together! The big and little letter {L}! |
| `pairShow.{L}.lower` | correction | Here it is! The big letter {L} and the little letter {L} go together. Tap it! |

### Picture names (Rhyme Radar, Sound Scout, Syllable Meteors) — 42 lines

Said for 42: cake, snake, bee, tree, rock, sock, moon, spoon, star, car, apple, rocket, banana, tomato, map, fan, hat, cat, cap, pan, sun, nut, rug, cup, bus, bug, net, fish, pumpkin, umbrella, cupcake, bat, bun, pup, hut, fox, box, mouse, nest, seal, robot, butterfly. {W} is the word, as a name: "Cake.".

| Cue | Type | Script |
|---|---|---|
| `word.{W}` | word | {W}. |

### Rhyme Radar — 280 lines

Said for 28: cake/snake, bee/tree, rock/sock, moon/spoon, star/car, snake/cake, tree/bee, sock/rock, spoon/moon, car/star, fox/box, box/fox, cat/hat, map/cap, fan/pan, bug/rug, hat/cat, bat/cat, hat/bat, cap/map, pan/fan, rug/bug, cup/pup, pup/cup, nut/hut, hut/nut, sun/bun, bun/sun. {W} is the word heard, {R} the one that rhymes with it.

| Cue | Type | Script |
|---|---|---|
| `rhyme.ask.{W}.0` | question | What rhymes with {W}? |
| `rhyme.ask.{W}.1` | question | Which one rhymes with {W}? |
| `rhyme.ask.{W}.2` | question | Find the one that rhymes with {W}! |
| `rhyme.again.{W}.0` | question | Listen. What rhymes with {W}? |
| `rhyme.again.{W}.1` | question | Take your time. What rhymes with {W}? |
| `rhyme.found.{W}.{R}.0` | praise | Yes! {W}, {R}. They rhyme! |
| `rhyme.found.{W}.{R}.1` | praise | {W} and {R}. You found the rhyme! |
| `rhyme.found.{W}.{R}.2` | praise | Great listening! {W}, {R}! |
| `rhyme.found.{W}.{R}.3` | praise | You got it! {W} rhymes with {R}! |
| `rhyme.show.{W}.{R}` | correction | Here it is! {W}, {R}. Tap the {R}! |

### Syllable Meteors — 136 lines

Said for 22: rocket (rock-it), bee (bee), apple (ap-pull), banana (ba-na-na), car (car), tomato (toe-may-toe), pumpkin (pump-kin), cupcake (cup-cake), robot (roe-bot), sun (sun), fish (fish), cake (cake), moon (moon), star (star), tree (tree), sock (sock), fox (fox), mouse (mouse), seal (seal), nest (nest), umbrella (um-brel-la), butterfly (but-ter-fly). {W} is the word, {N} its count ("three beats"); each beat is also said on its own (beat.{W}.i: "ba!", "na!", "na!").

| Cue | Type | Script |
|---|---|---|
| `beats.ask.{W}.0` | question | Tap the stone once for each beat! |
| `beats.ask.{W}.1` | question | How many beats? Tap them! |
| `beats.ask.{W}.2` | question | Tap the beats! |
| `beats.again.{W}.0` | question | Listen. {W}. Tap each beat! |
| `beats.again.{W}.1` | question | Take your time. {W}. Tap each beat! |
| `beats.found.{W}.0` | praise | Yes! {W} has {N}! |
| `beats.found.{W}.1` | praise | You got it! {N}! |
| `beats.found.{W}.2` | praise | Great tapping! {W}, {N}! |
| `beats.show.{W}` | correction | Let's tap it together. Listen! |
| `beats.turn.{W}` | question | Now you! {N}. Tap the stone! |

### Sound Scout — 102 lines

Said for 16: rock, sock, moon, rocket, map, fan, sun, nut, rug, net, fish, fox, mouse, nest, seal, robot. {W} is the picture; a question ending "…" is followed by the sound itself (phoneme.{S}, listed above), for the sounds /m/ /s/ /f/ /n/ /ɹ/.

| Cue | Type | Script |
|---|---|---|
| `sound.listen` | instruction | Listen. |
| `sound.ask.{S}.0` | question | Which picture starts with… |
| `sound.ask.{S}.1` | question | Which one starts with… |
| `sound.ask.{S}.2` | question | Find the one that starts with… |
| `sound.again.{S}.0` | question | Listen again. |
| `sound.again.{S}.1` | question | Take your time. Listen. |
| `sound.found.{W}.0` | praise | {W}! |
| `sound.found.{W}.1` | praise | Yes! {W}! |
| `sound.found.{W}.2` | praise | You found it! {W}! |
| `sound.found.{W}.3` | praise | Great listening! {W}! |
| `sound.show.{W}` | correction | Here it is! {W} starts with… |
| `sound.tap.{W}` | correction | Tap the {W}! |

### Word Builder — 59 lines

Said for 13: map, fan, hat, cat, cap, pan, sun, cup, nut, bus, bug, hut, bun. {W} is the word; it is heard sound by sound and blended first (above).

| Cue | Type | Script |
|---|---|---|
| `build.listen` | instruction | Listen. |
| `build.ask.{W}.0` | question | Build the word! |
| `build.ask.{W}.1` | question | Tap the letters in order! |
| `build.ask.{W}.2` | question | Can you build it? |
| `build.again.{W}.0` | question | Listen again. |
| `build.again.{W}.1` | question | Take your time. Listen. |
| `build.found.{W}.0` | praise | {W}! You built it! |
| `build.found.{W}.1` | praise | {W}! You made the word! |
| `build.found.{W}.2` | praise | Great building! {W}! |
| `build.show.{W}` | correction | Let's build it together. Listen. |
| `build.turn.{W}` | question | Now you! Build {W}. |

### Star Words and Word Orbit — 98 lines

Said for 12: the, and, see, you, to, go, is, it, in, can, we, my. {W} is the sight word; a line ending "…" is followed by the word said on its own (sight.word.{W}).

| Cue | Type | Script |
|---|---|---|
| `sight.word.{W}` | word | {W}. |
| `sight.ask.{W}.0` | question | Find the word… |
| `sight.ask.{W}.1` | question | Where is the word… |
| `sight.ask.{W}.2` | question | Can you find the word… |
| `sight.again.{W}.0` | question | Listen again. |
| `sight.again.{W}.1` | question | Take your time. Listen. |
| `sight.found.{W}.0` | praise | {W}! You found it! |
| `sight.found.{W}.1` | praise | Yes! {W}! |
| `sight.found.{W}.2` | praise | Great reading! {W}! |
| `sight.show.{W}` | correction | Here it is! This word is… |
| `sight.tap` | correction | Tap it! |
| `sight.look.{W}` | instruction | Look at this word. It says… |
| `sight.match.{W}.0` | question | Find the same word! |
| `sight.match.{W}.1` | question | Which one is just the same? |
| `sight.match.{W}.2` | question | Find a word just like it! |
| `sight.matchAgain.{W}.0` | question | Look closely. Find the same word. |
| `sight.matchAgain.{W}.1` | question | Take your time. Look at each letter. |
| `sight.matched.{W}.0` | praise | They match! {W}! |
| `sight.matched.{W}.1` | praise | Just the same! {W}! |
| `sight.matched.{W}.2` | praise | Yes! Both say {W}! |
| `sight.matchShow.{W}` | correction | Here it is! Just the same. Tap it! |

### Moon Writer — 64 lines

Said for 8: L (the big letter el), T (the big letter tee), H (the big letter aitch), O (the big letter oh), C (the big letter see), c (the little letter see), a (the little letter ay), d (the little letter dee). {L} is the letter's name and {C} "big" or "little".

| Cue | Type | Script |
|---|---|---|
| `write.watch.{L}.{case}.0` | instruction | Watch. This is how we write the {C} letter {L}. |
| `write.watch.{L}.{case}.1` | instruction | Watch how the {C} letter {L} is made. |
| `write.trace.{L}.{case}.0` | question | Now you! Trace the {C} letter {L}. |
| `write.trace.{L}.{case}.1` | question | Your turn! Trace the {C} letter {L}. |
| `write.light.{L}.{case}.0` | question | Now write it again, with less help! |
| `write.light.{L}.{case}.1` | question | Can you write it on your own? |
| `write.done.{L}.{case}.0` | praise | Nice tracing! The {C} letter {L}! |
| `write.done.{L}.{case}.1` | praise | You wrote the {C} letter {L}! |
| `write.done.{L}.{case}.2` | praise | Beautiful writing! The {C} letter {L}! |
| `write.again.0` | hint | Start at the green dot and follow the path. |
| `write.again.1` | hint | Take your time. Start at the green dot. |
| `write.start` | hint | Start at the green dot. |
| `write.retry.0` | correction | Let's try that line again. |
| `write.retry.1` | correction | Let's try that one again. Start at the dot. |
| `write.watchAgain` | instruction | Watch again. |
<!-- AUDIO-RECORDINGS-END -->
