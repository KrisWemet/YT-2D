#!/usr/bin/env python3
"""Generate sound effects with Suno sounds (V6) on Kie.ai: 2 variants per call, 2.5 credits.
usage: sfx_gen.py NAME [NAME ...]   (prompts below; files land in sfx_raw/NAME_a.mp3, NAME_b.mp3)"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "pigeon" / "scripts"))
import kie  # noqa: E402

P = "Sound effect only, no music, no voice: "
SFX = {
    "glass": (P + "a huge glass shop door shattering violently, a big crash and thousands of glass shards falling and tinkling on a tile floor, one event, about three seconds", False),
    "gate": (P + "a heavy steel roll-down security shutter being yanked down fast, loud metallic rattling slats rolling, ending in a hard metal slam on the floor, one event", False),
    "lock": (P + "a key turning in a heavy padlock, then a sharp metal click as the lock snaps shut, close up, quiet room", False),
    "keys": (P + "a big ring of metal keys jingling and rattling in a hand, close up, short", False),
    "static": (P + "a walkie-talkie radio squelch: a short burst of harsh radio static with a click at the start and a beep at the end, about one second", False),
    "crackle": (P + "walkie-talkie radio static crackling and hissing, unstable, a few pops and squelches, about three seconds", False),
    "groans": (P + "a crowd of zombies groaning and moaning low in a large echoing indoor hall, many voices, menacing, slow, steady, seamless loop", True),
    "shuffle": (P + "many people slowly shuffling and dragging their feet across a hard tile floor in a big empty echoing hall, steady, seamless loop", True),
    "mallhum": (P + "the ambience of an empty shopping mall at night: a low steady air conditioning hum, faint electrical buzz of lights, very quiet, distant echo, seamless loop", True),
    "drone": (P + "a dark, tense, low cinematic drone, slow pulsing sub bass and a faint eerie high tone, suspenseful horror atmosphere, no melody, no drums, seamless loop", True),
    "garage": (P + "an underground concrete parking garage at night: buzzing fluorescent lights, a low ventilation hum, distant echo, seamless loop", True),
    "breath": (P + "one zombie very close, a raspy wet growling breath and a low gurgling groan, creepy, about three seconds", False),
    "slam": (P + "a deep cinematic impact boom hit with a short reverb tail, dramatic, one hit", False),
    "rewind": (P + "a VHS tape rewinding fast: a rising whirring squeal with crackle, ending in a soft click, about one and a half seconds", False),
    "suburb": (P + "a quiet suburban street on a sunny afternoon: birds chirping, leaves rustling, a school bus idling nearby, distant children laughing, seamless loop", True),
    "crowd": (P + "an excited crowd of shoppers cheering and rushing through doors at a store opening, footsteps, shouting, about four seconds", False),
    "heartbeat": (P + "a slow heavy heartbeat, close and muffled, tense, steady, seamless loop", True),
    "musicbox": (P + "a gentle nostalgic music box melody, soft and a little sad, short, about four seconds", False),
}
for name in sys.argv[1:]:
    prompt, loop = SFX[name]
    inp = {"model": "V6", "prompt": prompt}
    if loop:
        inp["sound_loop"] = True
    d = kie.run("ai-music-api/sounds", inp)
    (HERE / "sfx_raw" / f"{name}.task.json").write_text(json.dumps(d, indent=1))
    res = json.loads(d["resultJson"])
    for i, item in enumerate(res["data"][:2]):
        kie.download(item["audio_url"], HERE / "sfx_raw" / f"{name}_{'ab'[i]}.mp3")
    print(name, [round(x.get("duration", 0), 1) for x in res["data"]], d.get("creditsConsumed", d.get("consumeCredits")))
