# Danny's voice: the approved recipe

Approved on the first minute as v10 "calm, quicker still" (`vo/v10/b`). It took ten rounds to get here (v1 to v10). Use this recipe for every chapter so Danny always sounds the same.

## Direction (Gemini 3.1 Flash TTS on Kie.ai)

| Setting | Value |
|---|---|
| Voice | Algenib, accent "American (Gen)" |
| Style / pace | Deadpan / Natural |
| Temperature | 1 |
| Profile | "Danny, a regular guy in his late thirties. He is genuinely a little scared and still shaken, and he tells what happened plainly and honestly, in a natural voice with very little inflection, keeping his pitch fairly level and even, like a real person, not an actor." |
| Scene | "A man quietly tells what happened during the first hour of a zombie outbreak at the mall where he works. Close to the microphone, plain and natural, no music." |
| Sample context | "A first-person story told plainly, in a natural, slightly scared voice." |

**Never ask for a whisper, a soft voice or a calm voice.** Every time we did (v5, v6), the voice changed into what sounded like someone else. Quiet moments are the same voice turned down afterwards.

## Takes

- **One line per take,** with 2–4 takes of each line. The voice engine sometimes cuts a take short, repeats words or ad-libs, so `voice_gemini.py` checks every take against the script and re-records misses.
- **Pick with `pick_takes.py --ref vo/v5/a-algenib/takes n2,n3,n4,n5,q2 --flat 0.6`.** It keeps the take closest to 5a's voice in pitch, tone colour, brightness and pace, prefers the calmer one, and never picks a whispered take. The reference is 5a's typical story lines, the voice everyone agreed on.
- **Record short lines with their neighbour.** A short line that comes out odd on its own ("Let me back up." comes out higher, faster or whispered) is recorded together with the line before it, as one chunk with `lines` and `"rejoin": true`.

## Build

| Setting | Value |
|---|---|
| `"level"` | `"fixed"`: one plain gain per line, no loudness normaliser |
| Story lines | −18 LUFS |
| Tense lines | −21 to −22 LUFS |
| Danger-close lines | −26 LUFS (8 dB under the story) |
| `"tempo"` | 1.08 (8% quicker, same pitch) |
| `"max_pause"` | 0.22 s inside a line |
| Gaps between lines | 0.2 s |
| Beats | 0.3–0.4 s (after a cold open, after "Let me back up", before a radio call) |
| Radio voices | walkie-talkie filter, −19 LUFS. Marcus is Orus. |
| Export | `vo_export.sh` (one gain plus a limiter, −16 LUFS), then `align.py` for the word timings |

**Result on the first minute:**
- Pace: 171 words a minute overall, about 202 while talking.
- Inflection: about 3.6 semitones of pitch movement per line.
- Voice: 80–91 Hz from line to line.

## Cost

The engine costs about 0.08 Kie credits per second of audio. Raw takes run much longer than word counts suggest, because of breaths, slower reads and pauses that are trimmed later. Chapter 2 is 20:34 finished and needed 1,719 s of raw takes for one pass, about 138 credits. Budget about 7 credits per finished minute for one take per line, plus 10% for retakes.

For a 40-minute chapter (about 2,400 s of narration):

| Plan | Credits | Cost |
|---|---|---|
| One take per line | ~190 | ~$0.95 |
| Two takes per line plus retakes for misses (recommended) | ~400 | ~$2 |
| Three takes per line | ~560 | ~$2.80 |
