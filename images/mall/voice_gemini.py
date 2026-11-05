#!/usr/bin/env python3
"""Directed voice-over with Gemini TTS on Kie.ai, checked line by line.

usage: voice_gemini.py PLAN.json OUT_DIR [--only id1,id2] [--no-assemble] [--tries N]

PLAN.json:
  {"voices": {"danny": {"voice_name", "audio_profile", "accent"}, ...},
   "scene": "...", "sample_context": "...",
   "chunks": [{"id", "who", "style", "pace", "text", "gap", "radio": "marcus1"|null}, ...]}

Each chunk is one take. Gemini sometimes stops early or repeats itself, so every take is
transcribed with faster-whisper and compared with the script; a take that doesn't match is
recorded again (up to 4 tries). Good takes are kept in OUT_DIR/takes/ and reused on re-runs.
Then the takes are joined with the planned pauses, radio lines get a walkie-talkie filter, and
OUT_DIR/vo.wav + OUT_DIR/segments.json are written (same format as voice_local.py).

One-take chunks: give a chunk "lines": [{"text", "db"}, ...] instead of "text" and the lines are
recorded together as one continuous take, so the voice can't drift from line to line. The take
is split at the pauses between lines using word timings, and each line gets a fixed gain so it
sits "db" above or below the plain lines (db 0), which land at the chunk's "lufs" (default -18).
Nothing dynamic touches the performance. Optional per chunk: "pitch" (semitones, e.g. -1.5),
"tempo", "max_pause" (longer pauses are shortened to this), "temperature", "rejoin" (cut the take
into its lines and join them with each line's "gap", default 0.35 s), "flatten" (0.3 = narrow the pitch
rise and fall by 30 %, Praat PSOLA; never applied to radio lines). Optional in the plan:
"takes_dir", so two versions of a voice-over can share one set of takes.
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
for _c in plan["chunks"]:
    if "lines" in _c:  # a one-take chunk speaks all its lines in one go
        _c["text"] = " ".join(line["text"] for line in _c["lines"])
# "takes_dir" (relative to the plan file) lets two versions of a voice-over share the same takes
takes = (pathlib.Path(plan_f).parent / plan["takes_dir"]).resolve() if "takes_dir" in plan else out / "takes"
takes.mkdir(parents=True, exist_ok=True)
SR = 48000
FLATTEN_NOW = 0  # set per chunk by build()

NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight",
       "9": "nine", "10": "ten", "15": "fifteen", "20": "twenty", "22": "twenty two", "30": "thirty", "31": "thirty one", "40": "forty",
       "42": "forty two", "140": "one forty", "315": "three fifteen"}


def words(s):
    s = re.sub(r"\[[^\]]*\]", " ", s).lower().replace("-", " ").replace("$", "")
    s = re.sub(r"(\d+)", lambda m: " " + NUM.get(m.group(1), m.group(1)) + " ", s)
    s = s.replace("gonna", "going to").replace("name's", "name is").replace("a.m.", "am").replace("a m", "am")
    s = re.sub(r"\bs\s*o\s*s\b", "s o s", s)  # "S-O-S" may come back as "SOS"
    s = re.sub(r"\b10th\b", "tenth", s)
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
           "scene": ch.get("scene", plan.get("scene", "")), "sample_context": plan.get("sample_context", ""),
           "temperature": ch.get("temperature", plan.get("temperature", 1))}
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
    # a long take gets a little slack, since the transcriber may split a contraction ("I've" -> "I have");
    # every difference is printed so it can be checked by ear
    allow = c.get("allow_extra", 2 if len(exp_w) > 60 else 0)
    ok = sim >= plan.get("min_sim", 0.9) and extra <= allow and dur >= 0.6 * exp_dur and dur <= 2.2 * exp_dur + 1.5
    if len(exp_w) > 60:
        sm = difflib.SequenceMatcher(None, exp_w, got_w, autojunk=False)
        diffs = [f"{' '.join(exp_w[i1:i2]) or '-'} -> {' '.join(got_w[j1:j2]) or '-'}"
                 for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal"]
        got = "differences: " + ("; ".join(diffs) if diffs else "none")
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
    tries = int(sys.argv[sys.argv.index("--tries") + 1]) if "--tries" in sys.argv else 4
    for attempt in range(1, tries + 1):
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
            shown = got.strip() if "lines" in c else got.strip()[:90]
            print(f"  {c['id']} sim {sim:.2f} dur {dur:.1f}s (~{exp_dur:.1f}) {'ok' if ok else 'RETRY'} | {shown}", flush=True)
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


def pause_floor(a):
    """the level below which a stretch counts as a pause: 35 dB under the take's loudest 20 ms
    (room tone and pauses sit lower than that; soft speech, even in quiet lines, sits higher)"""
    hop = SR // 50
    n = len(a) // hop
    if n == 0:
        return -40.0
    return float(10 * np.log10((a[: n * hop].reshape(n, hop) ** 2).mean(1).max() + 1e-12) - 35)


def squeeze(a, max_pause, floor_db=-40):
    """shorten pauses inside a take: any silence (quieter than floor_db) longer than max_pause is cut down to max_pause"""
    hop = SR // 50  # 20 ms
    n = len(a) // hop
    if n == 0:
        return a
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    quiet = 20 * np.log10(rms) < floor_db
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


def squeeze_map(a, max_pause, floor_db=-40):
    """squeeze(), plus a function that maps a time in the old audio (s) to the new audio.
    Anything quieter than floor_db counts as a pause."""
    hop = SR // 50
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    quiet = 20 * np.log10(rms) < floor_db
    keep, pieces, i, pos = [], [], 0, 0
    while i < n:
        j = i
        while j < n and quiet[j] == quiet[i]:
            j += 1
        s0, s1 = i * hop, j * hop
        half = int(max_pause * SR / 2)
        parts = [(s0, s0 + half), (s1 - half, s1)] if quiet[i] and s1 - s0 > max_pause * SR else [(s0, s1)]
        for p0, p1 in parts:
            pieces.append((p0, p1, pos))
            keep.append(a[p0:p1])
            pos += p1 - p0
        i = j
    pieces.append((n * hop, len(a), pos))
    keep.append(a[n * hop:])

    def remap(t):
        x = t * SR
        for p0, p1, q in pieces:
            if x < p1:
                return (q + max(0.0, x - p0)) / SR
        return (pos + len(a) - n * hop) / SR
    return np.concatenate(keep), remap


def word_times(path):
    """(word, start, end) for every word in a take, words normalised like words()"""
    from faster_whisper import WhisperModel
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(load16(path), language="en", beam_size=5, word_timestamps=True)
    return [(tok, w.start, w.end) for s in segs for w in s.words for tok in words(w.word)]


def line_spans(c, wt):
    """start and end (s) of each scripted line inside a one-take chunk"""
    exp = [(tok, i) for i, line in enumerate(c["lines"]) for tok in words(line["text"])]
    sm = difflib.SequenceMatcher(None, [e[0] for e in exp], [w[0] for w in wt], autojunk=False)
    at = [None] * len(exp)
    for a0, b0, size in sm.get_matching_blocks():
        for k in range(size):
            at[a0 + k] = wt[b0 + k][1:]
    spans = []
    for i in range(len(c["lines"])):
        hits = [at[k] for k, e in enumerate(exp) if e[1] == i and at[k]]
        if not hits:
            raise SystemExit(f"{c['id']}: can't find line {i + 1} in the take")
        spans.append((hits[0][0], hits[-1][1]))
    return spans


def active_db(x):
    """level of the speech in x (dB), ignoring the pauses"""
    hop = SR // 50
    n = len(x) // hop
    if n == 0:
        return -90.0
    p = (x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12
    db = 10 * np.log10(p)
    on = db > max(db.max() - 30, -60)
    return float(10 * np.log10(p[on].mean()))


def measure_lufs(x):
    with tempfile.TemporaryDirectory() as d:
        sf.write(f"{d}/x.wav", x, SR)
        log = subprocess.run(["ffmpeg", "-nostats", "-i", f"{d}/x.wav", "-af", "ebur128", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])


def take_lines(c):
    """a one-take chunk: keep the performance as it is, shorten very long pauses, give each line a fixed gain"""
    path = takes / f"{c['id']}.wav"
    tempo = c.get("tempo", plan.get("tempo", 1.0))
    af = ([f"atempo={tempo}"] if tempo != 1.0 else []) + \
         ([f"rubberband=pitch={2 ** (c['pitch'] / 12):.5f}:pitchq=quality"] if c.get("pitch") else [])
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(SR)] +
                       (["-af", ",".join(af)] if af else []) + [f"{d}/o.wav"], check=True)
        a, _ = sf.read(f"{d}/o.wav", dtype="float32")
    if c.get("flatten", plan.get("flatten")):
        a = flatten_pitch(a, c.get("flatten", plan.get("flatten")))
    spans = [(s / tempo, e / tempo) for s, e in line_spans(c, word_times(path))]
    # shorten very long pauses first, at the take's own level, so soft lines never count as silence
    a, remap = squeeze_map(a, c.get("max_pause", plan.get("max_pause", 0.9)), floor_db=pause_floor(a))
    spans = [(remap(s), remap(e)) for s, e in spans]
    idx = np.where(np.abs(a) > 0.03 * np.abs(a).max())[0]
    t0 = max(0, idx[0] - 1200)
    a = a[t0: idx[-1] + 3600]
    spans = [(max(0.0, s - t0 / SR), e - t0 / SR) for s, e in spans]
    if c.get("rejoin"):
        # cut the take into its lines at the pauses, trim each to its own sound, and join them with
        # each line's "gap" (default 0.35 s), so the pacing matches a version built line by line
        cuts = [0.0] + [(spans[i][1] + spans[i + 1][0]) / 2 for i in range(len(spans) - 1)] + [len(a) / SR]
        parts, new_spans, t = [], [], 0.0
        for i in range(len(spans)):
            # a window around the line's words (the transcriber's last word can run long, so the window
            # stops 0.3 s after it), then trimmed to its clear speech (within 22 dB of the line's peak) plus a
            # soft onset of up to 0.15 s and a 0.12 s tail, so breaths before and after are left out
            w0 = max(cuts[i], spans[i][0] - 0.2)
            w1 = min(cuts[i + 1], spans[i][1] + 0.3)
            piece = a[int(w0 * SR): int(w1 * SR)]
            hop = SR // 100
            n = len(piece) // hop
            db = 10 * np.log10((piece[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
            core = np.where(db > db.max() - 22)[0]        # clear speech; breaths sit lower than this
            if len(core):
                k = core[0]                               # keep a soft onset just before it, at most 0.15 s
                while k > 0 and core[0] - k < 15 and db[k - 1] > db.max() - 32:
                    k -= 1
                s0 = max(0, k * hop - int(0.03 * SR))
                s1 = min(len(piece), (core[-1] + 1) * hop + int(0.12 * SR))
            else:
                s0, s1 = 0, len(piece)
            piece = piece[s0:s1]
            if i:
                gap = c["lines"][i - 1].get("gap", 0.35)
                parts.append(np.zeros(int(gap * SR), np.float32))
                t += gap
            new_spans.append((t, t + len(piece) / SR))
            parts.append(piece)
            t += len(piece) / SR
        a, spans = np.concatenate(parts), new_spans
    # each line's gain changes halfway through the pause before it, with a 40 ms ramp
    cuts = [0.0] + [(spans[i][1] + spans[i + 1][0]) / 2 for i in range(len(spans) - 1)] + [len(a) / SR]
    tgt = [line.get("db", 0.0) for line in c["lines"]]
    # each line's loudness (gated, so breaths and pauses don't count; short lines repeated to 3 s+)
    lv = [measure_lufs(np.tile(x, int(np.ceil(3 * SR / max(len(x), 1))))) for x in
          (a[int(s * SR): int(e * SR)] for s, e in spans)]
    ref = float(np.median([v for v, t in zip(lv, tgt) if t == 0] or lv))
    gain = [t - (v - ref) for v, t in zip(lv, tgt)]
    db = np.zeros(len(a), np.float64)
    for i, g in enumerate(gain):
        db[int(cuts[i] * SR): int(cuts[i + 1] * SR)] = g
    r = int(0.04 * SR)
    cs = np.cumsum(np.pad(db, (r // 2, r - r // 2), mode="edge"))
    db = (cs[r:] - cs[:-r]) / r
    a = (a * 10 ** (db[: len(a)] / 20)).astype(np.float32)
    # the plain lines (db 0) sit at the chunk's loudness; the rest follow from their gains
    plain = np.concatenate([a[int(s * SR): int(e * SR)] for (s, e), t in zip(spans, tgt) if t == 0] or [a])
    a *= 10 ** ((c.get("lufs", plan.get("lufs", -18)) - measure_lufs(plain)) / 20)
    for (s, e), g, line in zip(spans, gain, c["lines"]):
        said = re.sub(r"\[[^\]]*\]", "", line["text"]).strip()
        print(f"    {s:6.2f}-{e:6.2f}s  gain {g:+5.1f} dB  {said[:60]}", flush=True)
    return a, spans


def flatten_pitch(a, k):
    """narrow the pitch movement by k (0.3 = 30 % less rise and fall) around the take's median pitch,
    keeping timing and voice: Praat's overlap-add (PSOLA) resynthesis"""
    import parselmouth
    from parselmouth.praat import call
    snd = parselmouth.Sound(a.astype(np.float64), sampling_frequency=SR)
    man = call(snd, "To Manipulation", 0.01, 60, 220)
    tier = call(man, "Extract pitch tier")
    n = call(tier, "Get number of points")
    if n < 5:
        return a
    med = float(np.median([call(tier, "Get value at index", i + 1) for i in range(n)]))
    call(tier, "Formula", f"{med} * exp({1 - k} * ln(self / {med}))")
    call([tier, man], "Replace pitch tier")
    out = call(man, "Get resynthesis (overlap-add)").values[0]
    return np.asarray(out[: len(a)], np.float32)


def take48(path, lufs, tempo=1.0, max_pause=0.4):
    """resample to 48 kHz mono, even out loudness, speed up a touch, trim and squeeze silences.
    With "level": "fixed" in the plan, the take gets one plain gain to reach its LUFS instead of
    loudnorm, which rides the gain inside a take and can make lines sound processed differently."""
    fixed = plan.get("level") == "fixed"
    af = ",".join(([] if fixed else [f"loudnorm=I={lufs}:TP=-2:LRA=7"]) + ([f"atempo={tempo}"] if tempo != 1.0 else [])) or "anull"
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(SR), "-af", af, f"{d}/o.wav"], check=True)
        a, _ = sf.read(f"{d}/o.wav", dtype="float32")
    if FLATTEN_NOW:
        a = flatten_pitch(a, FLATTEN_NOW)
    if fixed:
        # a short take is repeated to 3 s+ so the loudness meter has enough to gate on (same content, same reading)
        a *= 10 ** ((lufs - measure_lufs(np.tile(a, int(np.ceil(3 * SR / max(len(a), 1)))))) / 20)
    if fixed:
        # quiet lines (e.g. -26 LUFS) must not have their soft speech counted as silence: trim and
        # squeeze relative to the take's own level
        idx = np.where(np.abs(a) > 0.03 * np.abs(a).max())[0]
        a = a[max(0, idx[0] - 1200): idx[-1] + 3600] if len(idx) else a
        return squeeze(a, max_pause, floor_db=pause_floor(a))
    idx = np.where(np.abs(a) > 0.02)[0]
    a = a[max(0, idx[0] - 1200): idx[-1] + 3600] if len(idx) else a
    return squeeze(a, max_pause)


def build():
    timeline, segs, t = [np.zeros(int(0.3 * SR), np.float32)], [], 0.3
    for c in plan["chunks"]:
        if "lines" in c:  # one continuous take, levelled line by line
            a, spans = take_lines(c)
            if c.get("radio"):
                a = walkie(a)
            for i, ((s, e), line) in enumerate(zip(spans, c["lines"])):
                seg = {"kind": "radio" if c.get("radio") else "narr", "text": re.sub(r"\[[^\]]*\]\s*", "", line["text"]),
                       "s": round(t + s, 3), "e": round(t + e, 3), "chunk": c["id"], "line": i + 1}
                if c.get("radio"):
                    seg["id"] = c["radio"]
                segs.append(seg)
            timeline.append(a)
            t += len(a) / SR
            gap = c.get("gap", 0.45)
            timeline.append(np.zeros(int(gap * SR), np.float32))
            t += gap
            continue
        global FLATTEN_NOW
        FLATTEN_NOW = 0 if c.get("radio") else c.get("flatten", plan.get("flatten", 0))
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
