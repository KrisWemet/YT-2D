#!/usr/bin/env python3
"""Put the script's own words on the transcriber's timings, for captions and shot cues.

usage: caption_words.py WORDS.json   (adds "cwords" to the file, in place)

align.py stores what the transcriber heard ("words"), which can differ from the script:
"An hour ago, I" heard as "And now Argo", "three-fifteen" written as "3.15". Captions must show
the script, so for each segment the script's words are matched to the heard words; a matched
word takes its measured start and end, and words in between share the time between their
matched neighbours in proportion to their length.
"""
import difflib, json, re, sys

DIGITS = {"1": "one", "2": "two", "3": "three", "7": "seven", "9": "nine", "15": "fifteen", "20": "twenty", "22": "twentytwo",
          "30": "thirty", "40": "forty", "42": "fortytwo"}


def norm(w):
    w = w.lower().replace("-", "")
    w = re.sub(r"[^a-z0-9']", "", w)
    return DIGITS.get(w, w)


def main():
    path = sys.argv[1]
    d = json.load(open(path))
    heard = d["words"]
    out = []
    for si, seg in enumerate(d["segments"]):
        script = [w for w in re.sub(r"\[[^\]]*\]\s*", "", seg["text"]).split() if w.strip()]
        lo, hi = seg["s"] - 0.25, seg["e"] + 0.25
        hw = [w for w in heard if lo <= (w["s"] + w["e"]) / 2 <= hi]
        a = [norm(w) for w in script]
        b = [norm(w["w"]) for w in hw]
        times = [None] * len(script)
        for i0, j0, n in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
            for k in range(n):
                hs, he = hw[j0 + k]["s"], hw[j0 + k]["e"]
                # the transcriber can stretch a word across the pause before it: a short word
                # can't take more than ~0.12 s per letter, so its start moves up to the speech
                cap = 0.15 + 0.12 * len(a[i0 + k])
                times[i0 + k] = (max(hs, he - cap), he)
        # anchors at the segment's ends, then fill the gaps in proportion to word length
        known = [(-1, (seg["s"], seg["s"]))] + [(i, t) for i, t in enumerate(times) if t] + [(len(script), (seg["e"], seg["e"]))]
        for (ia, ta), (ib, tb) in zip(known, known[1:]):
            gap = list(range(ia + 1, ib))
            if not gap:
                continue
            t0, t1 = ta[1], max(tb[0], ta[1] + 0.05 * len(gap))
            weights = [max(1, len(re.sub(r"[^A-Za-z0-9]", "", script[i]))) for i in gap]
            # people pause at punctuation: after a comma or full stop, the words come at the end
            # of the gap (the pause first) if the gap is longer than the words need
            need = 0.09 * sum(weights) + 0.05 * len(gap)
            if ia >= 0 and re.search(r"[,.;:!?]$", script[ia]) and t1 - t0 > need * 1.6:
                t0 = t1 - need
            tot, acc = sum(weights), 0.0
            for i, wgt in zip(gap, weights):
                s = t0 + (t1 - t0) * acc / tot
                acc += wgt
                times[i] = (round(s, 3), round(t0 + (t1 - t0) * acc / tot, 3))
        for w, (s, e) in zip(script, times):
            out.append({"w": w, "n": norm(w), "s": round(s, 3), "e": round(e, 3), "seg": si,
                        "kind": seg["kind"], "id": seg.get("id")})
    d["cwords"] = out
    json.dump(d, open(path, "w"), indent=0)
    matched = sum(1 for w in out)
    print(f"{path}: {matched} script words placed")


if __name__ == "__main__":
    main()
