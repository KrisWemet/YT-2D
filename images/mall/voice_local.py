#!/usr/bin/env python3
"""Build the pilot's voice track with Kokoro (local, free) as a fallback for ElevenLabs.

usage: voice_local.py MODEL.onnx VOICES.bin OUT_DIR
Reads vo/narrator.txt (one paragraph per block) and the radio lines, synthesizes each
paragraph, inserts the radio lines (walkie-talkie filtered) and writes:
  OUT_DIR/vo.wav            the whole voice track (48 kHz mono)
  OUT_DIR/segments.json     where each paragraph / radio line sits on the timeline
"""
import json, pathlib, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = pathlib.Path(__file__).resolve().parent
model, voices, out = sys.argv[1], sys.argv[2], pathlib.Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
k = Kokoro(model, voices)

NARRATOR, MARCUS, WOMAN = "am_michael", "am_puck", "af_heart"
SR = 48000
paras = [p.strip() for p in (HERE / "vo" / "narrator.txt").read_text().split("\n\n") if p.strip()]
radio = {
    "marcus1": ((HERE / "vo" / "marcus1.txt").read_text().strip(), MARCUS),
    "marcus2": ((HERE / "vo" / "marcus2.txt").read_text().strip(), MARCUS),
    "woman": ((HERE / "vo" / "woman.txt").read_text().strip(), WOMAN),
}
# radio line inserted right after the paragraph that starts with this text
AFTER = {"At one forty": "marcus1", "Then I hear him say": "marcus2", "Then mine crackles": "woman"}
# a longer breath after these paragraphs (chapter ends and beats)
LONG = ("One for every store", "heading for the food court", "pick one store", "only one way in", "Then nothing", "That was hour one")


def synth(text, voice, speed=1.0):
    a, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    a = np.asarray(a, np.float32)
    if sr != SR:
        with tempfile.TemporaryDirectory() as d:
            sf.write(f"{d}/i.wav", a, sr)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{d}/i.wav", "-ar", str(SR), f"{d}/o.wav"], check=True)
            a, _ = sf.read(f"{d}/o.wav", dtype="float32")
    # trim the silence Kokoro leaves at both ends
    idx = np.where(np.abs(a) > 0.01)[0]
    return a[max(0, idx[0] - 960): idx[-1] + 2400] if len(idx) else a


def walkie(a):
    """band-limit, squash and dirty up a clip so it sounds like a handheld radio"""
    with tempfile.TemporaryDirectory() as d:
        sf.write(f"{d}/i.wav", a, SR)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{d}/i.wav", "-af",
                        "highpass=f=380,lowpass=f=3100,acompressor=threshold=-24dB:ratio=8:attack=2:release=60,"
                        "volume=2.2,alimiter=limit=0.7", f"{d}/o.wav"], check=True)
        b, _ = sf.read(f"{d}/o.wav", dtype="float32")
    rng = np.random.default_rng(7)
    hiss = rng.normal(0, 0.012, len(b)).astype(np.float32)
    return np.clip(b + hiss, -1, 1)


timeline, segs, t = [], [], 0.35
pad = lambda s: np.zeros(int(s * SR), np.float32)
timeline.append(pad(0.35))
for p in paras:
    a = synth(p, NARRATOR)
    segs.append({"kind": "narr", "text": p, "s": round(t, 3), "e": round(t + len(a) / SR, 3)})
    timeline.append(a); t += len(a) / SR
    gap = 0.85 if p.startswith(LONG) else 0.45
    rid = next((v for key, v in AFTER.items() if p.startswith(key)), None)
    if rid:
        text, voice = radio[rid]
        r = walkie(synth(text, voice, 1.05 if rid != "woman" else 0.95))
        timeline.append(pad(0.55)); t += 0.55
        segs.append({"kind": "radio", "id": rid, "text": text, "s": round(t, 3), "e": round(t + len(r) / SR, 3)})
        timeline.append(r); t += len(r) / SR
        gap = 0.6
    timeline.append(pad(gap)); t += gap
timeline.append(pad(1.2)); t += 1.2
vo = np.concatenate(timeline)
sf.write(out / "vo.wav", vo, SR)
(out / "segments.json").write_text(json.dumps({"duration": round(len(vo) / SR, 3), "segments": segs}, indent=1))
print("duration", round(len(vo) / SR, 2), "paragraphs", len(paras))
