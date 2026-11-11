# Mall pilot v6: first-minute voiceover in one continuous take

Feedback on 5a: mostly good, but "it almost sounds like the voice changes." The follow-up answers were:
- **Where it changes:** the whispered opening, "An hour ago" to "Let me back up", near the end, and from line to line everywhere.
- **Quiet parts:** the same voice, much quieter, with no whisper.
- **Voice:** deeper and rougher.
- **Story:** slower and more shaken.

## What changed

- **One take instead of twelve.** 5a was recorded line by line, so every line was a slightly different performance, and the opening was a whisper. v6 records all of Danny's lines as one continuous take: one performance, one voice. `voice_gemini.py` now supports this with a chunk that has `lines`.
- **Quiet parts come from volume only.** Every line is spoken in his normal voice. The quiet lines are turned down afterwards with a fixed gain, and no per-line loudness normaliser changes the voice from line to line.

  | Lines | Level vs the story |
  |---|---|
  | The two gate lines ("Right now there's a zombie…", "The radio on his chest…") | 9 dB quieter |
  | "An hour ago, I was basically the king of this mall." | 5 dB quieter |
  | "Tonight, I'd only need one of them." / "Tonight he calls at one-forty…" | 3 dB quieter |
  | Everything else | the reference |

- **Deeper, rougher, slower.**
  - Direction: a deep, rough, gravelly voice, worn out and still shaken, telling it slowly and plainly.
  - It was recorded at Gemini's slow pace ("The Drift"), then any pause over 0.6 s was shortened.
  - The result is 125 words a minute against 150 in 5a, and Danny's part runs about 82 s instead of 68.
- **Two depths from the same take.** 6a is his natural pitch, with the story voice around 87 Hz. 6b is shifted 1.5 semitones down, to around 82 Hz.

The words are the same as v4 and v5 (`script-v4-minute1.md`). Marcus's radio line is the same take as v3 to v5.

**Listen for:** a few words the transcriber wasn't sure of in this slow, gravelly read:
- "where my daughter Lily gets off" (the script says "when");
- "you ever heard" ("you've ever heard");
- "Tonight, I only need" ("I'd only need").

**Takes:** seven directions were tried and five complete takes came back. Long takes often stop early. The run cost about 56 credits. The take used is `vo/v6/takes/d2b.wav`, and `vo/v6/candidates.json` lists every direction tried.
