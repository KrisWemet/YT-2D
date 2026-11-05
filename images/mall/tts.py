#!/usr/bin/env python3
"""ElevenLabs TTS on Kie.ai with word timestamps.
usage: tts.py OUT.mp3 TEXT_FILE VOICE_ID [model: v2|turbo] [stability]
Writes OUT.mp3 and OUT.task.json (the raw task record, including any timestamps)."""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "pigeon" / "scripts"))
import kie  # noqa: E402

outp, tfile, voice = sys.argv[1:4]
m = sys.argv[4] if len(sys.argv) > 4 else "v2"
stab = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
model = {"v2": "elevenlabs/text-to-speech-multilingual-v2", "turbo": "elevenlabs/text-to-speech-turbo-2-5"}[m]
text = pathlib.Path(tfile).read_text().strip()
d = kie.run(model, {"text": text, "voice": voice, "stability": stab, "similarity_boost": 0.75,
                    "style": 0, "speed": 1, "timestamps": True})
pathlib.Path(outp + ".task.json").write_text(json.dumps(d, indent=1))
res = json.loads(d["resultJson"])
kie.download(res["resultUrls"][0], outp)
print(outp, "chars", len(text), "credits", d.get("creditsConsumed", d.get("consumeCredits")))
