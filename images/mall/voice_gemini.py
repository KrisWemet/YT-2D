#!/usr/bin/env python3
"""Directed voice-over with Gemini TTS on Kie.ai, checked line by line.

usage: voice_gemini.py PLAN.json OUT_DIR [--only id1,id2] [--no-assemble]

PLAN.json:
  {"voices": {"danny": {"voice_name", "audio_profile", "accent"}, ...},
   "scene": "...", "sample_context": "...",
   "chunks": [{"id", "who", "style", "pace", "text", "gap", "radio": "marcus1"|null}, ...]}

Each chunk is one short take. Gemini sometimes stops early or repeats itself, so every take is
transcribed with faster-whisper and compared with the script; a take that doesn't match is
recorded again (up to 4 tries). Good takes are kept in OUT_DIR/takes/ and reused on re-runs.
Then the takes are joined with the planned pauses, radio lines get a walkie-talkie filter, and
OUT_DIR/vo.wav + OUT_DIR/segments.json are written (same format as voice_local.py).
"""
import concurrent.futures as cf
import difflib, json, pathlib, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "pigeon" / "scripts"))
import kie  # noqa: E402

plan_f, out = sys.argv[1], pathlib.Path(sys.argv[2])
only = None
if "--only" in sys.argv:
    only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
assemble = "--no-assemble" not in sys.argv
plan = json.loads(pathlib.Path(plan_f).read_text())
takes = out / "takes"
takes.mkdir(parents=True, exist_ok=True)
SR = 48000

NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight",
       "9": "nine", "10": "ten", "20": "twenty", "22": "twenty two", "30": "thirty", "31": "thirty one", "42": "forty two", "140": "one forty", "315": "three fifteen"}


def words(s):
    s = re.sub(r"\[[^\]]*\]", " ", s).lower().replace("-", " ").replace("$", "")
    s = re.sub(r"(\d+)", lambda m: " " + NUM.get(m.group(1), m.group(1)) + " ", s)
    s = s.replace("gonna", "going to").replace("name's", "name is").replace("a.m.", "am").replace("a m", "am")
    return re.findall(r"[a-z']+", s)


def load16(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32)


def request(ch):
    v = plan["voices"][ch["who"]]
    inp = {"speakers": [{"speaker_id": "Speaker 1", "voice_name": v["voice_name"], "audio_profile": v.get("audio_profile", ""),
                         "style": ch.get("style", v.get("style", "Empathetic")), "pace": ch.get("pace", "Natural"),
                         "accent": v.get("accent", "American (Gen)")}],
           "dialogue_turns": [{"speaker_id": "Speaker 1", "text": ch["text"]}],
           "scene": ch.get("scene", plan.get("scene", "")), "sample_context": plan.get("sample_context", ""), "temperature": 1}
    d = kie.run("google/gemini-3-1-flash-tts", inp, timeout_s=600)
    url = json.loads(d["resultJson"])["resultUrls"][0]
    raw = takes / f"{ch['id']}.try.wav"
    kie.download(url, raw)
    return raw, d.get("creditsConsumed", 0)


def validate(model, c, path):
    """does this take say the scripted words, all of them, and nothing extra?"""
    a = load16(path)
    segs, _ = model.transcribe(a, language="en", beam_size=5)
    got = " ".join(s.text for s in segs)
    exp_w, got_w = words(c["text"]), words(got)
    sim = difflib.SequenceMatcher(None, exp_w, got_w).ratio()
    dur = len(a) / 16000
    exp_dur = len(exp_w) / 2.7
    extra = len(got_w) - len(exp_w)  # words the take added (e.g. a stray "shh")
    ok = sim >= plan.get("min_sim", 0.9) and extra <= 0 and dur >= 0.6 * exp_dur and dur <= 2.2 * exp_dur + 1.5
    return ok, sim, dur, exp_dur, got


def check_all():
    """re-check every saved take (no API calls) and list the ones to record again"""
    from faster_whisper import WhisperModel
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    bad = []
    for c in plan["chunks"]:
        ok, sim, dur, exp_dur, got = validate(model, c, takes / f"{c['id']}.wav")
        if not ok:
            bad.append(c["id"])
            print(f"  {c['id']} sim {sim:.2f} dur {dur:.1f}s (~{exp_dur:.1f}) | {got.strip()}", flush=True)
    print("re-take:", ",".join(bad) if bad else "none", flush=True)


def sane(c):
    """a take must be a real line of dialogue: some words, no markdown table or rule"""
    t = re.sub(r"\[[^\]]*\]", " ", c["text"])
    return len(re.findall(r"[A-Za-z']+", t)) >= 2 and "|" not in t and not re.fullmatch(r"\s*-{3,}\s*", t)


def main():
    bad = [c["id"] for c in plan["chunks"] if not sane(c)]
    if bad:
        raise SystemExit("these lines don't look like dialogue, fix the plan first: " + ", ".join(bad))
    from faster_whisper import WhisperModel
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    chunks = [c for c in plan["chunks"] if only is None or c["id"] in only]
    todo = [c for c in chunks if only is not None or not (takes / f"{c['id']}.wav").exists()]
    spent = 0.0
    for attempt in range(1, 5):
        if not todo:
            break
        print(f"attempt {attempt}: {len(todo)} takes", flush=True)
        results = {}
        with cf.ThreadPoolExecutor(max_workers=6) as ex:
            futs = {ex.submit(request, c): c for c in todo}
            for f in cf.as_completed(futs):
                c = futs[f]
                try:
                    raw, cr = f.result()
                    spent += float(cr or 0)
                    results[c["id"]] = raw
                except SystemExit as e:
                    print("  request failed", c["id"], e, flush=True)
        failed = []
        for c in todo:
            raw = results.get(c["id"])
            if raw is None:
                failed.append(c)
                continue
            ok, sim, dur, exp_dur, got = validate(model, c, raw)
            print(f"  {c['id']} sim {sim:.2f} dur {dur:.1f}s (~{exp_dur:.1f}) {'ok' if ok else 'RETRY'} | {got.strip()[:90]}", flush=True)
            if ok:
                raw.rename(takes / f"{c['id']}.wav")
            else:
                failed.append(c)
        todo = failed
    print(f"credits this run: {spent:.2f}", flush=True)
    if todo:
        raise SystemExit("still failing: " + ", ".join(c["id"] for c in todo))


def walkie(a):
    with tempfile.TemporaryDirectory() as d:
        sf.write(f"{d}/i.wav", a, SR)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{d}/i.wav", "-af",
                        "highpass=f=380,lowpass=f=3100,acompressor=threshold=-24dB:ratio=8:attack=2:release=60,"
                        "volume=2.2,alimiter=limit=0.7", f"{d}/o.wav"], check=True)
        b, _ = sf.read(f"{d}/o.wav", dtype="float32")
    return np.clip(b + np.random.default_rng(7).normal(0, 0.012, len(b)).astype(np.float32), -1, 1)


def squeeze(a, max_pause):
    """shorten pauses inside a take: any silence longer than max_pause is cut down to max_pause"""
    hop = SR // 50  # 20 ms
    n = len(a) // hop
    if n == 0:
        return a
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    quiet = 20 * np.log10(rms) < -40
    keep, i = [], 0
    while i < n:
        j = i
        while j < n and quiet[j] == quiet[i]:
            j += 1
        seg = a[i * hop: j * hop]
        if quiet[i] and (j - i) * hop > max_pause * SR:
            half = int(max_pause * SR / 2)
            seg = np.concatenate([seg[:half], seg[-half:]])
        keep.append(seg)
        i = j
    keep.append(a[n * hop:])
    return np.concatenate(keep)


def take48(path, lufs, tempo=1.0, max_pause=0.4):
    """resample to 48 kHz mono, even out loudness, speed up a touch, trim and squeeze silences"""
    af = f"loudnorm=I={lufs}:TP=-2:LRA=7" + (f",atempo={tempo}" if tempo != 1.0 else "")
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(SR), "-af", af, f"{d}/o.wav"], check=True)
        a, _ = sf.read(f"{d}/o.wav", dtype="float32")
    idx = np.where(np.abs(a) > 0.02)[0]
    a = a[max(0, idx[0] - 1200): idx[-1] + 3600] if len(idx) else a
    return squeeze(a, max_pause)


def build():
    timeline, segs, t = [np.zeros(int(0.3 * SR), np.float32)], [], 0.3
    for c in plan["chunks"]:
        whisper = c.get("style") == "Whisper"
        lufs = c.get("lufs", -21 if whisper else -19)
        tempo = c.get("tempo", plan.get("tempo", 1.06))
        max_pause = c.get("max_pause", 0.55 if whisper else plan.get("max_pause", 0.4))
        a = take48(takes / f"{c['id']}.wav", lufs, tempo, max_pause)
        if c.get("radio"):
            a = walkie(a)
        seg = {"kind": "radio" if c.get("radio") else "narr", "text": re.sub(r"\[[^\]]*\]\s*", "", c["text"]),
               "s": round(t, 3), "e": round(t + len(a) / SR, 3), "chunk": c["id"]}
        if c.get("radio"):
            seg["id"] = c["radio"]
        segs.append(seg)
        timeline.append(a)
        t += len(a) / SR
        gap = c.get("gap", 0.45)
        timeline.append(np.zeros(int(gap * SR), np.float32))
        t += gap
    timeline.append(np.zeros(int(1.2 * SR), np.float32))
    vo = np.concatenate(timeline)
    sf.write(out / "vo.wav", vo, SR)
    (out / "segments.json").write_text(json.dumps({"duration": round(len(vo) / SR, 3), "segments": segs}, indent=1))
    print("voice track", round(len(vo) / SR, 2), "s,", len(segs), "takes", flush=True)


if "--check" in sys.argv:
    check_all()
    raise SystemExit(0)
if "--build-only" not in sys.argv:
    main()
if assemble and only is None:
    build()
