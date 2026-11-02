#!/usr/bin/env python3
"""popscan.py video.mp4 -> frames whose mean abs diff (blurred 270x480) > 2.2x local median"""
import subprocess, sys
import numpy as np, cv2
f = sys.argv[1]
w, h = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(x, (5, 5), 0) for x in fr])
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
fps = 60
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi]) + 0.15
    if d[i] > 2.2 * med and d[i] > 0.6:
        flags.append((i + 1, round((i + 1) / fps, 3), round(float(d[i]), 2), round(float(med), 2)))
print('frames', len(fr))
for fl in flags: print('frame %d  t=%.3f  diff %.2f  (median %.2f)' % fl)
