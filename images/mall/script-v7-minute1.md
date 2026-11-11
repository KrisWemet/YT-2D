# Mall pilot v7: the v6 take with natural pauses

Extra note after v6: "make sure the inflection isn't overly dramatic. Keep it natural feeling."

## What the measurements showed

These numbers cover the same five story lines in every version:

| Take | Fully voiced? (lowest line) | Pitch movement | Notes |
|---|---|---|---|
| 5a | yes | 4.7 st | the reference |
| v6 take (`d2b`, Deadpan, slow) | yes (63%) | 4.9 st | long, drawn-out pauses: 23% of each line |
| "calm, low-key" direction (`d3b`) | no (36%) | 3.8 st | turned breathy, close to 5a's half-whisper |
| "full normal voice, matter-of-fact" (`d4b`) | no (29%) | 5.4 st | perfect words, but more inflected |

"Fully voiced" is the share of energy below 350 Hz. A normal voice measures 65–90% and 5a's whispered lines 3–38%. Pitch movement is the 10th–90th percentile range inside each line. Asking for "calm" made the voice go breathy every time, which brings back the voice-change problem. The v6 take is the only one that's fully voiced on every line, and its pitch movement matches 5a's. What made v6 feel dramatic was its pauses.

## v7

v7 is the same take as v6, rebuilt with 5a's pause cap of 0.45 s instead of 0.6 s:
- Danny runs 77 s at 133 words a minute (5a: 150, 6a: 125).
- Pauses take up 19% of each line (5a: 13%, 6a: 23%).
- 7a is his natural pitch, and 7b is 1.5 semitones deeper.
- The levels are unchanged from v6: the gate lines are 9 dB under the story, in the same voice.

The plans are in `vo/v7/7a` and `vo/v7/7b` and use the takes in `vo/v6/takes`. Every direction tried is in `vo/v6/candidates.json`. The extra rounds cost about 36 credits, which brings v6 and v7 to about 92.
