#!/usr/bin/env python3
"""Generate mall backgrounds on Kie.ai from prompts.json (style + scene prompt).

usage: gen.py MODEL NAME [NAME ...]
  MODEL: flux   -> flux-3/klein-text-to-image, 2K (2.5 credits)
         flash  -> seedream/5-flash-text-to-image, 2K (3.24 credits)
         gpt    -> gpt-image-2-5-flare-text-to-image, 2K (10 credits)
Writes raw/NAME.MODEL.png and raw/NAME.MODEL.json. The key is read from $KIE_API_KEY.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "pigeon" / "scripts"))
import kie  # noqa: E402

MODELS = {
    "flux": ("flux-3/klein-text-to-image", lambda p: {"prompt": p, "aspect_ratio": "16:9", "resolution": "2K", "output_format": "png"}),
    "flash": ("seedream/5-flash-text-to-image", lambda p: {"prompt": p, "aspect_ratio": "16:9", "size": "2K", "output_format": "png"}),
    "gpt": ("gpt-image-2-5-flare-text-to-image", lambda p: {"prompt": p, "aspect_ratio": "16:9", "resolution": "2K"}),
}

prompts = json.loads((HERE / "prompts.json").read_text())
key = sys.argv[1]
model, build = MODELS[key]
for name in sys.argv[2:]:
    prompt = prompts[name] + "\n\n" + prompts["_style"]
    d = kie.run(model, build(prompt))
    urls = json.loads(d["resultJson"])["resultUrls"]
    out = HERE / "raw" / f"{name}.{key}.png"
    kie.download(urls[0], out)
    meta = {"model": model, "name": name, "taskId": d.get("taskId"), "elapsed": d.get("_elapsed"),
            "credits": d.get("creditsConsumed", d.get("consumeCredits")), "url": urls[0]}
    (HERE / "raw" / f"{name}.{key}.json").write_text(json.dumps(meta, indent=1))
    print(out.name, meta["credits"], meta["elapsed"])
