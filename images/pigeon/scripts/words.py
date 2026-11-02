#!/usr/bin/env python3
"""Word times for the voice-over: faster-whisper words + loudness pauses (RMS every 20 ms).
usage: words.py voice.mp3 out.json"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
a = np.frombuffer(pcm, np.float32)
hop = 320  # 20 ms at 16 kHz
n = len(a) // hop
rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
db = 20 * np.log10(rms)
silent = db < -42
pauses, i = [], 0
while i < n:
    if silent[i]:
        j = i
        while j < n and silent[j]:
            j += 1
        if (j - i) * 0.02 >= 0.18:
            pauses.append({"s": round(i * 0.02, 3), "e": round(j * 0.02, 3)})
        i = j
    else:
        i += 1
model = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = model.transcribe(a, language="en", word_timestamps=True, beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
voice_on = [round(k * 0.02, 2) for k in range(n) if not silent[k]]
res = {"duration": round(len(a) / 16000, 3), "first_sound": voice_on[0] if voice_on else 0,
       "last_sound": voice_on[-1] if voice_on else 0, "pauses": pauses, "words": words,
       "db_20ms": [round(float(x), 1) for x in db]}
json.dump(res, open(out, "w"), indent=0)
print("duration", res["duration"], "first", res["first_sound"], "last", res["last_sound"])
print("pauses:", [(p["s"], p["e"]) for p in pauses])
for w in words:
    print(f'{w["s"]:6.2f} {w["e"]:6.2f}  {w["w"]}')
