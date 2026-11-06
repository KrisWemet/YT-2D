# Mall pilot v9: 5a with less inflection

Feedback on v8 ("5a fixed"): "The voice sounds good but it still has a little too much inflection to it."

## Why v8 had more inflection than 5a

v8's takes were picked only for sounding like 5a: pitch, tone colour, brightness and pace. Some of them swung their pitch more than 5a's. The gate lines, spoken instead of whispered, also have rise and fall that the whisper used to hide. Measured over every line, v8 moved 5.7 semitones per line on average, against 4.5 in 5a.

## What changed

- **Calmer takes.**
  - `pick_takes.py` now measures how far the pitch moves inside each take, and `--flat 0.6` adds 0.6 to a take's score for every semitone, so the calmer take wins when two voices are close.
  - Thirty more takes were recorded with one phrase added to 5a's direction: "very little inflection, keeping his pitch fairly level and even".
  - Near-ties go to the take with the closer pitch.
- **Optional narrowing.** `voice_gemini.py` gained `"flatten"`. It narrows the pitch rise and fall around each take's median using Praat's overlap-add resynthesis, which keeps the timing and the voice. Radio lines are never flattened.

## Two versions

| Version | Inflection per line (mean / max) | Pitch across lines |
|---|---|---|
| 5a | 4.5 / 7.1 semitones | 80–116 Hz |
| v8, 5a fixed | 5.7 / 8.3 semitones | 80–103 Hz |
| **v9 A, calm** (takes only, audio untouched) | 3.6 / 5.9 semitones | 80–91 Hz |
| **v9 B, calmest** (A plus `"flatten": 0.3`) | 2.5 / 4.3 semitones | 80–89 Hz |

Both versions keep 5a's pace, pauses and loudness map, with the gate lines in his normal voice 8 dB down. They were transcribed line by line. Played on its own, "An hour ago, I…" can be heard as "And now Argo…", in A and B alike. It reads correctly in context. The narrowing added no measurable spectral glitches.

## Files

- `vo/v9/takes`: the chosen takes. `picks.json` has every score.
- `vo/v9/a` and `vo/v9/b`: the two plans.
- `vo/v8/candidates.json`: everything that was recorded.
- Cost: about 19 credits.
