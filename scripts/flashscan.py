#!/usr/bin/env python3
"""flashscan.py video.mp4 -> photosensitivity check plus black frames.

Follows the WCAG 2.x general-flash rule for a full-screen video. A transition is a change of at
least 0.1 in the frame's mean relative luminance (between turning points of the luminance curve),
and two opposing transitions make a flash, unless the darker side is 0.8 or brighter. More than
3 flashes (6 transitions) in any one-second window fails. Also reports the darkest frame and any
run of near-black frames, which is how a missing picture shows up.
"""
import subprocess
import sys

import numpy as np

f = sys.argv[1]
w, h = 108, 192
rate = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', f], capture_output=True, text=True, check=True).stdout.strip()
num, den = (int(x) for x in rate.split('/'))
fps = num / den
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
rgb = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32) / 255
lin = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
lum = (lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)).mean((1, 2))

# zigzag: turning points where the curve reverses by at least 0.1
pivots: list[tuple[int, float]] = []
trend = 0
lo = hi = ext = (0, float(lum[0]))
for i, v in enumerate(map(float, lum)):
    if trend == 0:
        lo = min(lo, (i, v), key=lambda p: p[1])
        hi = max(hi, (i, v), key=lambda p: p[1])
        if hi[1] - lo[1] >= 0.1:
            trend = 1 if hi[0] > lo[0] else -1
            pivots, ext = ([lo], hi) if trend == 1 else ([hi], lo)
    elif (v - ext[1]) * trend > 0:
        ext = (i, v)
    elif abs(v - ext[1]) >= 0.1:
        pivots.append(ext)
        trend, ext = -trend, (i, v)
if trend:
    pivots.append(ext)
transitions = [b[0] for a, b in zip(pivots, pivots[1:]) if min(a[1], b[1]) < 0.8]
worst, worst_at = 0, 0.0
for k, t0 in enumerate(transitions):
    n = sum(1 for t in transitions[k:] if t - t0 < fps)
    if n > worst:
        worst, worst_at = n, t0 / fps

dark = np.append(lum < 0.0015, False)
runs, start = [], None
for i, d in enumerate(dark):
    if d and start is None:
        start = i
    elif not d and start is not None:
        runs.append((round(start / fps, 2), i - start))
        start = None
print(f'frames {len(lum)} at {fps:g} fps; mean luminance {lum.mean():.3f}, darkest {lum.min():.4f} at {lum.argmin() / fps:.2f}s, brightest {lum.max():.3f}')
print(f'transitions of 0.1 or more: {len(transitions)}; most in one second: {worst}' + (f' (from {worst_at:.2f}s)' if worst else ''))
print('near-black runs of 3+ frames (start s, frames):', [r for r in runs if r[1] >= 3] or 'none')
print('PASS' if worst <= 6 else 'FAIL: more than 3 flashes in one second')
