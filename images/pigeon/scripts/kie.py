#!/usr/bin/env python3
"""Tiny Kie.ai client: create a market task, poll it, download the results.

usage:
  kie.py image NAME ASPECT RES PROMPT_FILE [ref1.png ref2.png ...]   (GPT Image 2.5 Flare)
  kie.py tts OUT.mp3 TEXT_FILE VOICE_ID
  kie.py raw MODEL INPUT_JSON_FILE OUT_PREFIX
The API key is read from $KIE_API_KEY and never printed.
"""
import json, os, sys, time, urllib.request, uuid, mimetypes, pathlib

API = "https://api.kie.ai/api/v1"
UPLOAD = "https://kieai.redpandaai.co/api/file-stream-upload"
KEY = os.environ["KIE_API_KEY"]
HDR = {"Authorization": f"Bearer {KEY}"}

def req(url, data=None, headers=None, method=None, timeout=120):
    h = dict(HDR); h.update(headers or {})
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return resp.read()

def post_json(url, obj):
    return json.loads(req(url, json.dumps(obj).encode(), {"Content-Type": "application/json"}, "POST"))

def upload(path):
    """multipart upload of a local file -> public download URL"""
    b = uuid.uuid4().hex
    p = pathlib.Path(path)
    ctype = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    parts = []
    for k, v in (("uploadPath", "yt2d/refs"), ("fileName", f"{uuid.uuid4().hex[:8]}-{p.name}")):
        parts.append(f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    parts.append(f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{p.name}\"\r\nContent-Type: {ctype}\r\n\r\n".encode())
    parts.append(p.read_bytes()); parts.append(f"\r\n--{b}--\r\n".encode())
    out = json.loads(req(UPLOAD, b"".join(parts), {"Content-Type": f"multipart/form-data; boundary={b}"}, "POST", 300))
    if not out.get("success", out.get("code") == 200):
        raise SystemExit(f"upload failed: {out}")
    return out["data"]["downloadUrl"]

def run(model, inp, timeout_s=1500):
    out = post_json(f"{API}/jobs/createTask", {"model": model, "input": inp})
    if out.get("code") != 200:
        raise SystemExit(f"createTask failed: {out.get('code')} {out.get('msg')}")
    tid = out["data"]["taskId"]
    t0 = time.time()
    while True:
        time.sleep(5)
        info = json.loads(req(f"{API}/jobs/recordInfo?taskId={tid}"))
        d = info.get("data") or {}
        st = d.get("state")
        if st == "success":
            d["_elapsed"] = round(time.time() - t0, 1)
            return d
        if st == "fail":
            raise SystemExit(f"task failed: {d.get('failCode')} {d.get('failMsg')}")
        if time.time() - t0 > timeout_s:
            raise SystemExit(f"timeout waiting for {tid} (state {st})")

def download(url, path):
    r = urllib.request.Request(url)
    with urllib.request.urlopen(r, timeout=300) as resp:
        pathlib.Path(path).write_bytes(resp.read())

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "image":
        name, aspect, res, pfile = sys.argv[2:6]
        refs = sys.argv[6:]
        prompt = pathlib.Path(pfile).read_text().strip()
        inp = {"prompt": prompt, "aspect_ratio": aspect, "resolution": res}
        model = "gpt-image-2-5-flare-text-to-image"
        if refs:
            inp["input_urls"] = [upload(r) for r in refs]
            model = "gpt-image-2-5-flare-image-to-image"
        d = run(model, inp)
        urls = json.loads(d["resultJson"])["resultUrls"]
        for i, u in enumerate(urls):
            ext = os.path.splitext(u.split("?")[0])[1] or ".png"
            dst = f"{name}{'' if i == 0 else '_' + str(i)}{ext}"
            download(u, dst)
            print(dst)
        meta = {k: d.get(k) for k in ("taskId", "costTime", "_elapsed")}
        meta.update({"model": model, "aspect": aspect, "res": res, "refs": refs, "urls": urls,
                     "credits": d.get("creditsConsumed", d.get("consumeCredits"))})
        pathlib.Path(f"{name}.json").write_text(json.dumps(meta, indent=1))
    elif mode == "tts":
        outp, tfile, voice = sys.argv[2:5]
        text = pathlib.Path(tfile).read_text().strip()
        d = run("elevenlabs/text-to-speech-multilingual-v2",
                {"text": text, "voice": voice, "stability": 0.5, "similarity_boost": 0.75,
                 "style": 0, "speed": 1, "timestamps": True})
        pathlib.Path(outp + ".task.json").write_text(json.dumps(d, indent=1))
        res = json.loads(d["resultJson"])
        download(res["resultUrls"][0], outp)
        print(outp)
    elif mode == "raw":
        model, ifile, prefix = sys.argv[2:5]
        d = run(model, json.loads(pathlib.Path(ifile).read_text()))
        pathlib.Path(prefix + ".task.json").write_text(json.dumps(d, indent=1))
        print(prefix + ".task.json")
