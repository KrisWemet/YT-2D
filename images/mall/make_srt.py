#!/usr/bin/env python3
"""A YouTube captions file (.srt) for a long video, from its word timings.

usage: make_srt.py WORDS.json OUT.srt

WORDS.json is align.py's output with caption_words.py's "cwords" (the script's own words on the
transcriber's timings), so the captions show the script, not what the transcriber heard. Captions
break at sentence ends where they can, run at most two lines of 42 characters, and never cross
from one speaker to another. Radio voices are labelled the first time in each run of lines.
"""
import json
import sys

MAX_CHARS = 84  # two lines of 42
LABELS = {"marcus": "MARCUS", "marcus0": "MARCUS", "marcus1": "MARCUS", "marcus2": "MARCUS", "vera": "WOMAN ON THE RADIO",
          "broadcast": "RADIO"}


def stamp(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def two_lines(text):
    if len(text) <= 42:
        return text
    words, best = text.split(), None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        if len(a) <= 42 and len(b) <= 42:
            score = abs(len(a) - len(b))
            if best is None or score < best[0]:
                best = (score, a + "\n" + b)
    return best[1] if best else text


def main():
    src, out = sys.argv[1:3]
    d = json.load(open(src))
    words = d["cwords"]
    cues, cur = [], []

    def flush():
        if cur:
            cues.append(list(cur))
            cur.clear()

    for i, w in enumerate(words):
        if cur and (w["seg"] != cur[-1]["seg"] or len(" ".join(x["w"] for x in cur + [w])) > MAX_CHARS):
            flush()
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        sentence_end = w["w"].rstrip('"”').endswith((".", "?", "!"))
        if sentence_end and (nxt is None or nxt["s"] - w["e"] > 0.25 or len(" ".join(x["w"] for x in cur)) > 30):
            flush()
    flush()

    lines, last_label_seg = [], None
    for n, c in enumerate(cues, 1):
        text = " ".join(x["w"] for x in c)
        seg = d["segments"][c[0]["seg"]]
        label = LABELS.get(seg.get("id") or "") if seg.get("kind") == "radio" else None
        if label and last_label_seg != c[0]["seg"]:
            text = f"[{label}] {text}"
        last_label_seg = c[0]["seg"] if label else None
        start = c[0]["s"]
        end = max(c[-1]["e"] + 0.25, start + 1.0)
        if n < len(cues):
            end = min(end, cues[n][0]["s"] - 0.02)
        lines.append(f"{n}\n{stamp(start)} --> {stamp(end)}\n{two_lines(text)}\n")
    open(out, "w").write("\n".join(lines))
    print(out, len(cues), "captions")


if __name__ == "__main__":
    main()
