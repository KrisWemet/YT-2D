#!/usr/bin/env python3
"""Word timings for the pilot's voice track (faster-whisper), merged with the segment list.
usage: align.py VO.wav SEGMENTS.json OUT.json"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

src, segf, out = sys.argv[1:4]
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
a = np.frombuffer(pcm, np.float32)
model = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = model.transcribe(a, language="en", word_timestamps=True, beam_size=5,
                           initial_prompt="Maplecrest Mall. Marcus. Forty-two keys. One forty in the morning.")
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
seg = json.load(open(segf))
for w in words:
    mid = (w["s"] + w["e"]) / 2
    hit = next((g for g in seg["segments"] if g["s"] - 0.15 <= mid <= g["e"] + 0.15), None)
    w["g"] = hit.get("id", "narr") if hit else "narr"
json.dump({"duration": seg["duration"], "segments": seg["segments"], "words": words}, open(out, "w"), indent=0)
print("words", len(words))
print(" ".join(w["w"] for w in words))
