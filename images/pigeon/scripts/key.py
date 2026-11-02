#!/usr/bin/env python3
"""key.py in.png out.png -> flat background (connected to the border, plus enclosed
background-coloured holes) becomes transparent; the black outline edge is un-blended.
Prints the trim box so other scripts can map raw coords -> sprite coords."""
import json, sys
import numpy as np, cv2
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
h, w, _ = im.shape
border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
bgc = np.median(border, 0)
dist = np.sqrt(((im - bgc) ** 2).sum(2))
near = (dist < 60).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=4)
edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(edge_labels))
# enclosed holes: near-components whose mean colour is really the background colour
holes = 0
for k in range(1, n):
    if k in edge_labels or stats[k, cv2.CC_STAT_AREA] < 150:
        continue
    m = lab == k
    if np.sqrt(((im[m].mean(0) - bgc) ** 2).sum()) < 22:
        bg |= m; holes += 1
dark = im.sum(2) < 120
ink = np.median(im[dark], 0) if dark.any() else np.array([20, 20, 20], np.float32)
dink = max(np.sqrt(((ink - bgc) ** 2).sum()), 1)
band = cv2.dilate(bg.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~bg
alpha = np.ones((h, w), np.float32)
alpha[bg] = 0
a_edge = np.clip(dist / dink, 0, 1)
alpha[band] = a_edge[band]
rgb = im.copy()
rgb[band] = ink
out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
ys, xs = np.nonzero(alpha > 0.02)
pad = 12
x0, y0 = max(xs.min() - pad, 0), max(ys.min() - pad, 0)
x1, y1 = min(xs.max() + pad + 1, w), min(ys.max() + pad + 1, h)
Image.fromarray(out[y0:y1, x0:x1], "RGBA").save(dst, optimize=True)
print(json.dumps({"src": src, "raw_size": [w, h], "trim": [int(x0), int(y0), int(x1), int(y1)],
                  "bg": [round(float(c)) for c in bgc], "ink": [round(float(c)) for c in ink], "holes": holes}))
