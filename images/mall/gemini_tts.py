#!/usr/bin/env python3
"""Gemini TTS on Kie.ai (google/gemini-3-1-flash-tts): voices with direction.

usage: gemini_tts.py JOB.json OUT.wav
JOB.json: {"speakers": [{"speaker_id", "voice_name", "audio_profile", "style", "pace", "accent"}],  (max 2)
           "dialogue_turns": [{"speaker_id", "text"}], "scene": "...", "sample_context": "...", "temperature": 1}
Inline direction tags such as [whispers] or [nervously] work inside the text.
style: Vocal Smile | Newscaster | Whisper | Empathetic | Promo/Hype | Deadpan
pace: Natural | Rapid Fire | The Drift | Staccato
accent: Neutral | American (Gen) | American (Valley) | American (South) | British (RP) | British (Brixton) | Transatlantic | Australian
The key is read from $KIE_API_KEY."""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "pigeon" / "scripts"))
import kie  # noqa: E402

job, out = sys.argv[1], sys.argv[2]
inp = json.loads(pathlib.Path(job).read_text())
inp.setdefault("temperature", 1)
d = kie.run("google/gemini-3-1-flash-tts", inp, timeout_s=900)
pathlib.Path(out + ".task.json").write_text(json.dumps(d, indent=1))
res = json.loads(d["resultJson"])
kie.download(res["resultUrls"][0], out)
print(out, "credits", d.get("creditsConsumed", d.get("consumeCredits")), "elapsed", d.get("_elapsed"), flush=True)
