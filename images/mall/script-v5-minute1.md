# Mall pilot v5: first-minute voiceover, genuine and a little scared, with real dynamics

Feedback on v4: liked #1 (Algenib) but too much inflection; liked #2 (Umbriel) too. The voice should sound genuine and a little scared, and get louder and quieter where the story calls for it, almost whispering while the zombie is outside his gate.

Two versions with the same direction, one per voice:
- **5a:** Algenib (the current Danny). Inflection is 2.7 semitones of pitch movement on the story lines, half of v4 #1's 5.2.
- **5b:** Umbriel. Inflection is 4.0 semitones.

Direction for both: a "deadpan" (low-inflection) delivery and a character note of "genuinely a little scared and still shaken, telling it plainly, like a real person, not an actor". There are no emotion tags. Each line has its own loudness, and the export uses one fixed gain plus a limiter (`vo_export.sh`), so the contrast survives:

| Lines | How | Level vs the story lines |
|---|---|---|
| "Right now there's a zombie… my best friend's uniform." / "The radio on his chest…" | almost whispering, then whispered | about 8–9 dB quieter |
| "An hour ago, I was basically the king of this mall." | hushed | quieter |
| "Let me back up." through the bus stop, the keys and Marcus | his normal voice | the reference |
| "Tonight, I'd only need one of them." / "Tonight he calls at one-forty…" | lower, tense | about 2–3 dB quieter |
| Marcus on the radio | low, through the walkie-talkie filter | quieter |

The words are the same as v4 (`script-v4-minute1.md`).
