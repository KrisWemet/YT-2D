#!/usr/bin/env python3
"""Check that every shot cue (and in-shot event) in the Chapter 1 shot lists resolves against the
voice track's script words, in order, the way src/mall/cues.ts resolves them. Lists every problem
at once instead of stopping at the first, and prints how long each shot runs.

usage: python3 images/mall/chapter1/check_cues.py WORDS.json
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILES = ["shots01.tsx", "shots02.tsx", "shots03.tsx", "shots04.tsx"]
LEAD = 0.12


def norm(x):
    return re.sub(r"[^a-z0-9']", "", x.lower().replace("-", ""))


def main():
    d = json.load(open(sys.argv[1]))
    W = d["cwords"]
    toks = [norm(w["w"]) for w in W]

    def idx_at(t):
        for i, w in enumerate(W):
            if w["s"] >= t - 0.05:
                return i
        return len(W)

    def find(phrase, frm):
        ph = [norm(x) for x in phrase.split() if norm(x)]
        for i in range(frm, len(W)):
            if all(i + j < len(W) and toks[i + j] == p for j, p in enumerate(ph)):
                return i
        return None

    def resolve(cue, prev):
        if cue == "0":
            return 0.0
        right = cue.startswith(">+")
        after = right or cue.startswith(">")
        phrase = cue[2:] if right else cue[1:] if after else cue
        i = find(phrase, idx_at(prev))
        if i is None:
            return None
        if not after:
            return max(0.0, W[i]["s"] - LEAD)
        last = i + len(phrase.split()) - 1
        if right:
            return W[last]["e"] + 0.15
        return (W[last]["e"] + W[last + 1]["s"]) / 2 if last + 1 < len(W) else W[last]["e"] + 0.3

    shot_re = re.compile(r"\{\s*at:\s*(['\"])(.*?)\1\s*,(?:\s*ev:\s*\{([^}]*)\})?", re.S)
    shots = []
    for f in FILES:
        src = (ROOT / "src/mall/chapter1" / f).read_text()
        for m in shot_re.finditer(src):
            ev = dict(re.findall(r"(\w+):\s*['\"](.*?)['\"]", m.group(3) or ""))
            shots.append((f, m.group(2), ev))
    prev, bad, rows = 0.0, 0, []
    for k, (f, cue, ev) in enumerate(shots):
        t = resolve(cue, prev)
        if t is None:
            print(f"MISSING  shot {k} ({f}): {cue!r}  (searching from {prev:.1f}s)")
            bad += 1
            continue
        if t < prev - 0.001:
            print(f"BACKWARD shot {k} ({f}): {cue!r} at {t:.1f}s < {prev:.1f}s")
            bad += 1
        for name, ph in ev.items():
            if find(ph, idx_at(t)) is None:
                print(f"EVENT    shot {k} ({f}) {cue!r}: ev {name}={ph!r} not found")
                bad += 1
        rows.append((t, cue))
        prev = t
    total = d["duration"]
    lens = [(rows[i + 1][0] if i + 1 < len(rows) else total) - rows[i][0] for i in range(len(rows))]
    print(f"{len(shots)} shots, {bad} problems; voice {total:.1f}s; mean shot {total / max(1, len(rows)):.2f}s")
    longest = sorted(zip(lens, [r[1] for r in rows]), reverse=True)[:8]
    print("longest shots:", ", ".join(f"{c!r} {l:.1f}s" for l, c in longest))


if __name__ == "__main__":
    main()
