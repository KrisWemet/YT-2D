# Mall pilot v10: "calm" at a quicker pace

Feedback on v9: "I like calm but we need to increase the pace a little. It's very slow and I don't want to lose listeners."

## Where the time went

"Calm" talks at a normal speed, about 190 words a minute while speaking, near the brisk v3 version's 201. The slowness was silence: 10.7 s of pauses inside lines plus 4.8 s between lines, out of 69.5 s.

## What changed

The same takes as "calm" (`vo/v9/takes`), so the voice and the calm delivery are unchanged:

- **Pauses inside lines** are shortened to 0.28 s (A) or 0.22 s (B), from 0.45 s.
  - A pause is now anything 35 dB under the line's loudest moment.
  - The old fixed −40 dBFS threshold could mistake the soft gate lines for silence. A first attempt to fix that, based on the line's average level, missed the faint room tone in pauses.
- **Gaps between lines** are about 0.25 s (A) or 0.2 s (B). A few beats stay a little longer:
  - after the cold open: 0.4 s (A) / 0.35 s (B);
  - after "Let me back up": 0.5 s (A) / 0.4 s (B);
  - after "Tonight, I'd only need one of them": 0.4 s (A) / 0.3 s (B);
  - before Marcus's radio call: 0.35 s (A) / 0.3 s (B).
- **A small speed-up of the speech itself:** 4% (A) or 8% (B). The pitch is unchanged.

| Version | Danny's part | Overall pace | Talking pace | Longest pause |
|---|---|---|---|---|
| v3, brisk | 56.4 s | 166 wpm | 201 wpm | 0.31 s |
| calm (v9 A) | 69.5 s | 148 wpm | 190 wpm | 0.47 s |
| **v10 A, quicker** | 64.2 s | 160 wpm | 195 wpm | 0.30 s |
| **v10 B, quicker still** | 60.2 s | 171 wpm | 202 wpm | 0.25 s |

Both were transcribed in full and every word is there. At B's speed the transcriber misheard a couple of words ("tonight" as "the night", "when" as "where"). Levels are unchanged: the gate lines sit 8 dB under the story. No new recordings, so no credits.
