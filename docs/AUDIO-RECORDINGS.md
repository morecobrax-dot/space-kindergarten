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

**35 recordings replace development audio (13 sounds, 22 words said sound by sound or blended); 72 authored lines replace the device voice.**

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
| map | `seg.map` | map, sound by sound: /m/ … /æ/ … /p/, each on its own, a short pause between |
| map | `blend.map` | map, blended slowly in one breath, each sound running into the next: /m/ /æ/ /p/ |
| nut | `seg.nut` | nut, sound by sound: /n/ … /ʌ/ … /t/, each on its own, a short pause between |
| nut | `blend.nut` | nut, blended slowly in one breath, each sound running into the next: /n/ /ʌ/ /t/ |
| pan | `seg.pan` | pan, sound by sound: /p/ … /æ/ … /n/, each on its own, a short pause between |
| pan | `blend.pan` | pan, blended slowly in one breath, each sound running into the next: /p/ /æ/ /n/ |
| sun | `seg.sun` | sun, sound by sound: /s/ … /ʌ/ … /n/, each on its own, a short pause between |
| sun | `blend.sun` | sun, blended slowly in one breath, each sound running into the next: /s/ /ʌ/ /n/ |

## Narration (the device voice until recorded)

Also recorded: the lines built from templates — each letter's questions and praise (`LETTER_LINES`), each rhyme pair's (`RHYME_LINES`), each word's beats (`BEAT_LINES`), and each Sound Scout and Word Builder word's (`SOUND_LINES`, `BUILD_LINES`). Their cue ids are listed in index.html beside `voiceCue()`, `wordCue()` and `phonicsCue()`.

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
| `guide.dockHint` | hint | You have stars! Tap the paint brush to visit the space station and dress up your rocket. |
| `travel.launch.1` | reaction | Let's launch! |
| `travel.launch.2` | reaction | Blast off! |
| `travel.launch.3` | reaction | Here we go! |
| `place.moon` | story | The Moon! That's where we find letters. Tap Launch to fly there! |
| `place.mercury` | story | Mercury! That's where we play with rhymes and beats. Tap Launch to fly there! |
| `place.mars` | story | Mars! That's where we play with sounds and words. Tap Launch to fly there! |
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
| `marker.beacon` | hint | Tap the beacon to start! |
| `marker.radar` | hint | Tap the radar dish to start! |
| `marker.meteors` | hint | Now tap the meteor rocks! |
| `marker.scanner` | hint | Tap the sound scanner to start! |
| `marker.workshop` | hint | Now tap the word machine! |
| `planet.homeHint` | hint | Tap the big yellow button to fly home! |
| `planet.fixed` | hint | That one is already fixed. Tap it to play again! |
| `mission.howTo` | instruction | I'll say a letter. You tap it! |
| `mission.howTo.rhyme` | instruction | Rhyming words sound the same at the end, like cat and hat. I'll say a word. You find the picture that rhymes! |
| `mission.howTo.beats` | instruction | Words have beats. Tap the big stone once for each beat! |
| `mission.howTo.sound` | instruction | Words start with a sound. I'll play a sound. You find the picture that starts with it. |
| `mission.howTo.build` | instruction | I'll say a word sound by sound. Tap the letters to build it. |
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
| `rotate` | reaction | Turn your iPad sideways. |
<!-- AUDIO-RECORDINGS-END -->
