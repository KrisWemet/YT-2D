#!/usr/bin/env python3
"""Pick, for every line, the take that sounds most like a reference voice.

usage: pick_takes.py CANDIDATES.json TAKES_DIR --ref DIR id1,id2,... [--also DIR] [--min-voiced 55] [--flat W]

CANDIDATES.json is a voice_gemini.py plan whose chunk ids are "<line>-<n>": several takes of
the same line with the same direction. The reference is a set of takes that already sound right
(for example the typical story lines of a version the listener liked). For each line, every take
in TAKES_DIR (plus DIR/<line>.wav from --also, if it exists) is measured:
  - voicing: share of energy below 350 Hz. A normal voice is about 60-90 %, a whisper under 40 %.
    Takes under --min-voiced are never picked.
  - pitch: median F0 from a YIN-style tracker (semitones away from the reference)
  - tone colour: mean MFCC (spectral envelope), and brightness (spectral centroid)
  - pace: words per second over the whole line, with pauses over 0.3 s counted as 0.3 s
  - inflection: how far the pitch moves inside the line (10th-90th percentile, semitones);
    --flat W adds W to the score for every semitone, so calmer takes win when voices are close
and the closest take is copied to TAKES_DIR/<line>.wav. picks.json records every score.
"""
import json, pathlib, re, shutil, subprocess, sys
import numpy as np

SR = 16000


def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def frames(x, win, hop):
    n = 1 + (len(x) - win) // hop
    return np.lib.stride_tricks.sliding_window_view(x, win)[::hop][:n]


def mel_bank(nfft=1024, n=40, fmin=60, fmax=7600):
    mel = lambda f: 2595 * np.log10(1 + f / 700)
    hz = lambda m: 700 * (10 ** (m / 2595) - 1)
    pts = hz(np.linspace(mel(fmin), mel(fmax), n + 2))
    bins = np.floor((nfft + 1) * pts / SR).astype(int)
    fb = np.zeros((n, nfft // 2 + 1))
    for i in range(1, n + 1):
        l, c, r = bins[i - 1], bins[i], bins[i + 1]
        fb[i - 1, l:c] = (np.arange(l, c) - l) / max(c - l, 1)
        fb[i - 1, c:r] = (r - np.arange(c, r)) / max(r - c, 1)
    return fb


FB = mel_bank()
DCT = np.cos(np.pi / 40 * (np.arange(40)[None, :] + 0.5) * np.arange(13)[:, None])


def features(x, n_words):
    fr = frames(x, 1024, 256) * np.hanning(1024)
    P = np.abs(np.fft.rfft(fr)) ** 2
    f = np.fft.rfftfreq(1024, 1 / SR)
    tot = P[:, (f > 70) & (f < 6000)].sum(1)
    db = 10 * np.log10(tot + 1e-12)
    on = db > db.max() - 25
    voiced = float(np.median(P[on][:, (f > 70) & (f < 350)].sum(1) / tot[on]) * 100)
    cent = float(np.median((P[on] * f).sum(1) / np.maximum(P[on].sum(1), 1e-12)))
    mfcc = (DCT @ np.log(FB @ P[on].T + 1e-10)).T[:, 1:].mean(0)
    # pitch: YIN-style cumulative mean normalised difference, 60-180 Hz
    g = frames(x, 800, 160)
    g = g - g.mean(1, keepdims=True)
    rms = np.sqrt((g ** 2).mean(1))
    tmax, tmin = SR // 60, SR // 180
    acf = np.fft.irfft(np.abs(np.fft.rfft(g, 1600)) ** 2)[:, : tmax + 1]
    d = 2 * (acf[:, :1] - acf)
    cm = d[:, 1:] / np.maximum(np.cumsum(d[:, 1:], 1) / np.arange(1, tmax + 1), 1e-9)
    seg = cm[:, tmin - 1:]
    ok = (rms > rms.max() * 0.08) & (seg.min(1) < 0.45)
    f0 = SR / (tmin + seg.argmin(1)[ok])
    fr0 = np.where(ok, SR / (tmin + seg.argmin(1)), np.nan)
    sm = np.array([np.nanmedian(fr0[max(0, i - 3): i + 4]) if ok[i] else np.nan for i in range(len(fr0))])
    st = 12 * np.log2(sm / np.nanmedian(sm)) if ok.sum() > 15 else np.array([0.0])
    st = st[~np.isnan(st) & (np.abs(st) < 8)]
    spread = float(np.percentile(st, 90) - np.percentile(st, 10)) if len(st) > 15 else 0.0
    # pace over the whole line: its length with every pause longer than 0.3 s cut to 0.3 s
    lvl = 20 * np.log10(rms + 1e-9)
    quiet = lvl < lvl.max() - 35
    dur, i = 0.0, 0
    first, last = np.where(~quiet)[0][[0, -1]] if (~quiet).any() else (0, len(quiet) - 1)
    q = quiet[first: last + 1]
    while i < len(q):
        j = i
        while j < len(q) and q[j] == q[i]:
            j += 1
        dur += min((j - i) * 0.01, 0.3) if q[i] else (j - i) * 0.01
        i = j
    return {"voiced": voiced, "f0": float(np.median(f0)) if len(f0) > 10 else 0.0, "bright": cent,
            "mfcc": mfcc, "wps": n_words / max(dur, 0.3), "spread": spread}


def n_words(text):
    return len(re.findall(r"[A-Za-z0-9']+", re.sub(r"\[[^\]]*\]", " ", text)))


def main():
    plan_f, tdir = sys.argv[1], pathlib.Path(sys.argv[2])
    i = sys.argv.index("--ref")
    ref_dir, ref_ids = pathlib.Path(sys.argv[i + 1]), sys.argv[i + 2].split(",")
    also = pathlib.Path(sys.argv[sys.argv.index("--also") + 1]) if "--also" in sys.argv else None
    min_voiced = float(sys.argv[sys.argv.index("--min-voiced") + 1]) if "--min-voiced" in sys.argv else 55.0
    flat = float(sys.argv[sys.argv.index("--flat") + 1]) if "--flat" in sys.argv else 0.0
    plan = json.loads(pathlib.Path(plan_f).read_text())
    text = {}
    for c in plan["chunks"]:
        text[c["id"].rsplit("-", 1)[0]] = c["text"]
    ref_plan = {c["id"]: c["text"] for c in json.loads((ref_dir.parent / "plan.json").read_text())["chunks"]} \
        if (ref_dir.parent / "plan.json").exists() else text
    refs = [features(load(ref_dir / f"{r}.wav"), n_words(ref_plan.get(r, text.get(r, "")))) for r in ref_ids]
    R = {k: np.mean([r[k] for r in refs], 0) for k in ("f0", "bright", "mfcc", "wps")}
    mf_spread = max(float(np.mean([np.linalg.norm(r["mfcc"] - R["mfcc"]) for r in refs])), 1.0)
    print(f"reference ({', '.join(ref_ids)}): pitch {R['f0']:.0f} Hz, brightness {R['bright']:.0f}, {R['wps']:.2f} words/s")
    picks = {}
    for line, t in text.items():
        cands = sorted(tdir.glob(f"{line}-*.wav"), key=lambda p: p.name)
        cands = [p for p in cands if re.fullmatch(rf"{re.escape(line)}-[A-Z]?\d+\.wav", p.name)]
        if also and (also / f"{line}.wav").exists():
            cands.append(also / f"{line}.wav")
        rows = []
        for p in cands:
            ft = features(load(p), n_words(t))
            dist = np.sqrt((12 * np.log2(max(ft["f0"], 1) / R["f0"]) / 1.0) ** 2 + ((ft["bright"] - R["bright"]) / 120) ** 2
                           + (np.linalg.norm(ft["mfcc"] - R["mfcc"]) / mf_spread) ** 2 + ((ft["wps"] - R["wps"]) / 0.6) ** 2) \
                + flat * ft["spread"]
            rows.append((dist if ft["voiced"] >= min_voiced else float("inf"), p, ft))
        # near-ties (within 0.1) go to the take whose pitch is closest to the reference
        rows.sort(key=lambda r: (round(r[0], 1), abs(12 * np.log2(max(r[2]["f0"], 1) / R["f0"]))))
        best = rows[0]
        if best[0] == float("inf"):
            print(f"{line}: no fully voiced take, record more")
            continue
        shutil.copy(best[1], tdir / f"{line}.wav")
        picks[line] = {"picked": str(best[1]), "takes": [{"take": str(p), "distance": None if d == float("inf") else round(float(d), 2),
                       "voiced": round(ft["voiced"]), "f0": round(ft["f0"]), "bright": round(ft["bright"]), "wps": round(ft["wps"], 2),
                       "spread": round(ft["spread"], 1)}
                       for d, p, ft in rows]}
        print(f"{line}: " + "  ".join(f"{'*' if r is best else ' '}{r[1].stem}({'whisper' if r[0] == float('inf') else f'{r[0]:.1f}'}"
                                     f"|{r[2]['f0']:.0f}Hz|{r[2]['spread']:.1f}st|{r[2]['wps']:.1f}w/s)" for r in rows))
    (tdir / "picks.json").write_text(json.dumps(picks, indent=1))


if __name__ == "__main__":
    main()
