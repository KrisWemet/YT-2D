# Mall pilot v8: 5a, with the voice jumps fixed

The listener still preferred 5a to every later version (v6 and v7 were deeper, rougher and slower). So v8 keeps 5a exactly (voice, direction, pace, pauses and loudness map) and fixes only what was wrong: the voice seemed to change from line to line.

## What changed from 5a

- **No whisper at the gate.** The two opening lines were whispers. Now they're spoken in his normal 5a voice and turned down to the same −26 LUFS, 8 dB under the story. The sentence about whispering was removed from the voice profile, and nothing else in the direction changed.
- **Every line is the closest match.** Each line was recorded 3 to 10 times with 5a's exact settings. `pick_takes.py` then kept the take nearest to 5a's typical story lines ("I'm Danny", "I work nights", "She's seven", "The job's pretty simple" and "Tonight, I'd only need one of them"), comparing pitch, tone colour (MFCC), brightness and pace, and never picking a whispered take. Original 5a takes were candidates too, and two were kept ("I work nights", "She's seven").
- **"An hour ago… Let me back up" in one go.** Recorded alone, "Let me back up" kept coming out higher, faster or whispered. Now the two lines are recorded together, cut at the pause, and rejoined with 5a's 0.35 s gap.
- **Plain volume, no normaliser.** Each line gets one fixed gain to reach its 5a level. The per-line loudness normaliser, which rides the gain inside a take, is gone.

## Measured

| | 5a | v8 |
|---|---|---|
| Pitch range across lines | 80–116 Hz (6.5 semitones) | 80–103 Hz (4.3), most lines at 88–91 Hz |
| Brightness range | 202–1809 | 206–441 |
| Whispered lines | 3 | 0 |
| Length | 75.8 s | 76.1 s |

Every line was transcribed and checked word for word. Levels are within 0.5 dB of 5a's plan.

## Files

- `vo/v8/plan.json`: built with `"level": "fixed"`, and the one-take pair uses `"rejoin": true`.
- `vo/v8/candidates.json`: everything that was recorded.
- `vo/v8/takes/picks.json`: every candidate's score.
- Cost: about 34 credits.
