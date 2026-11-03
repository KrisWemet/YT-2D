#!/usr/bin/env python3
"""tighten.py in.mp3 words.json out.mp3 [until_s=6] [keep_s=0.28]
Shortens the silent pauses that start before `until_s` to `keep_s`, so the hook has no dead air.
Cuts only inside the loudness-detected pauses in words.json (images/pigeon/scripts/words.py), with short crossfades."""
import json, subprocess, sys
import numpy as np

src, wj, dst = sys.argv[1:4]
until = float(sys.argv[4]) if len(sys.argv) > 4 else 6.0
keep = float(sys.argv[5]) if len(sys.argv) > 5 else 0.28
SR = 48000
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.float32).copy()
pauses = [(p['s'], p['e']) for p in json.load(open(wj))['pauses']]
pauses = [p for p in pauses if p[0] < until and p[1] - p[0] > keep + 0.02]
fade = int(0.012 * SR)
removed = 0.0
for a, b in sorted(pauses, reverse=True):  # cut from the end so earlier times stay valid
    mid = (a + b) / 2
    c0, c1 = int((mid - (b - a - keep) / 2) * SR), int((mid + (b - a - keep) / 2) * SR)
    head, tail = x[:c0], x[c1:]
    w = np.linspace(0, 1, fade, dtype=np.float32)
    joint = head[-fade:] * (1 - w) + tail[:fade] * w
    x = np.concatenate([head[:-fade], joint, tail[fade:]])
    removed += (c1 - c0) / SR
    print(f'pause {a:.2f}-{b:.2f}s ({b - a:.2f}s) -> {keep:.2f}s')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '192k', dst], input=x.tobytes(), check=True)
print(f'removed {removed:.2f}s -> {dst} ({len(x) / SR:.2f}s)')
