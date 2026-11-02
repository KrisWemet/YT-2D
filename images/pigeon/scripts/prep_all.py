#!/usr/bin/env python3
"""Measure every keyed sprite, copy it to public/pigeon/, write src/pigeon/sprites.ts"""
import json, shutil
import numpy as np, cv2
from PIL import Image

PUB = '../../public/pigeon'
trims = {}
for l in open('keyed/trim.jsonl'):
    d = json.loads(l); trims[d['src'].split('/')[-1][:-4]] = d

def load(name):
    im = np.asarray(Image.open(f'keyed/{name}.png')).astype(np.int32)
    return im[..., :3], im[..., 3]

def ink_of(rgb, a): return (a > 200) & (rgb.sum(2) < 200)

def head_feet(name):
    rgb, a = load(name); h, w = a.shape
    a8 = (a > 128).astype(np.uint8); ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    ys = np.nonzero(a8.any(1))[0]; yb = ys.max()
    band = a8[int(yb - 0.035 * h):yb + 1]
    xs = np.nonzero(band.any(0))[0]
    return dict(w=w, h=h, head=[float(hx), float(hy), float(dt[hy, hx])], feet=[float((xs.min() + xs.max()) / 2), float(yb)])

def eye_measure(rgb, a, box=None):
    ink = ink_of(rgb, a)
    hsv = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.int32)
    orange = (hsv[..., 0] >= 8) & (hsv[..., 0] <= 22) & (hsv[..., 1] > 150) & (hsv[..., 2] > 150) & (a > 200)
    if box is not None:
        m = np.zeros_like(orange); x0, y0, x1, y1 = box; m[y0:y1, x0:x1] = True; orange &= m
    glint = (rgb.min(2) > 225) & (a > 200)
    U = (orange | ink | glint).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(U, 8)
    ys, xs = np.nonzero(orange); k = np.bincount(lab[ys, xs]).argmax()
    eye = cv2.morphologyEx((lab == k).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(eye, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    (cx, cy), (W, H), ang = cv2.fitEllipse(c)
    filled = np.zeros_like(eye); cv2.drawContours(filled, [c], -1, 1, -1)
    inner = cv2.erode(filled, np.ones((int(0.18 * W) | 1, int(0.18 * W) | 1), np.uint8)).astype(bool)
    pup = inner & ink; m = cv2.moments(pup.astype(np.uint8))
    pcx, pcy = m['m10'] / m['m00'], m['m01'] / m['m00']
    ys, xs = np.nonzero(pup); left = xs < pcx
    pr = float(np.percentile(np.hypot(xs[left] - pcx, ys[left] - pcy), 99))
    gy, gx = np.nonzero(glint & filled.astype(bool))
    # ring thickness along the vertical through the centre (top side)
    oys, oxs = np.nonzero(orange & (np.abs(np.arange(orange.shape[0])[:, None] - cy) < 0.15 * H))
    t = int(round(W / 2 - (cx - oxs.min()))) if len(oxs) else 8
    return dict(cx=cx, cy=cy, rx=W / 2, ry=H / 2, angle=ang, ring=max(t, 6),
                pupil=dict(cx=pcx, cy=pcy, r=pr), glint=dict(cx=float(gx.mean()), cy=float(gy.mean()), r=float(np.sqrt(len(gx) / np.pi))),
                iris='#%02x%02x%02x' % tuple(np.median(rgb[orange], 0).astype(int)))

def brow_measure(rgb, a, eye):
    ink = ink_of(rgb, a)
    cx, cy, rx, ry = eye['cx'], eye['cy'], eye['rx'], eye['ry']
    box = np.zeros_like(ink); box[max(int(cy - 2.6 * ry), 0):int(cy - 0.75 * ry), max(int(cx - 1.8 * rx), 0):int(cx + 1.8 * rx)] = True
    n, lab, st, _ = cv2.connectedComponentsWithStats((ink & box).astype(np.uint8), 8)
    ys_b, xs_b = np.nonzero(box); bx0, bx1, by0, by1 = xs_b.min(), xs_b.max(), ys_b.min(), ys_b.max()
    cand = [k for k in range(1, n) if st[k, 0] > bx0 and st[k, 1] > by0 and st[k, 0] + st[k, 2] - 1 < bx1 and st[k, 1] + st[k, 3] - 1 < by1]
    k = max(cand, key=lambda k: st[k, 4]); brow = lab == k
    ys, xs = np.nonzero(brow); cols = np.unique(xs)
    mid = np.array([[x, ys[xs == x].mean()] for x in cols])
    coef = np.polyfit(mid[:, 0], mid[:, 1], 2)
    x0, x1 = float(cols.min()), float(cols.max()); xm = (x0 + x1) / 2
    p0 = [x0, float(np.polyval(coef, x0))]; p2 = [x1, float(np.polyval(coef, x1))]
    ym = float(np.polyval(coef, xm))
    return brow, dict(p0=p0, c=[xm, 2 * ym - (p0[1] + p2[1]) / 2], p2=p2, width=float(len(xs) / len(cols)))

out = {}
# ---------- guy poses
for n in ['g_hero', 'g_balance', 'g_hold', 'g_empty', 'g_clip', 'g_camera']:
    shutil.copy(f'keyed/{n}.png', f'{PUB}/{n}.png')
    out[n] = head_feet(n); out[n]['file'] = f'pigeon/{n}.png'
# the pigeon drawn in g_hold: its eye
rgb, a = load('g_hold')
out['g_hold']['pigeonEye'] = eye_measure(rgb, a)
# ---------- close-up head: eye + eyebrow (eyebrow erased, drawn in code)
rgb, a = load('p_close')
e = eye_measure(rgb, a); brow, b = brow_measure(rgb, a, e)
im = np.asarray(Image.open('keyed/p_close.png')).copy()
fill = np.median(rgb[int(e['cy'] - 1.4 * e['ry']):int(e['cy'] - 1.15 * e['ry']), int(e['cx'] - 0.3 * e['rx']):int(e['cx'] + 0.3 * e['rx'])].reshape(-1, 3), 0).astype(int)
bd = cv2.dilate(brow.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
im[bd, :3] = fill; im[bd, 3] = 255
Image.fromarray(im, 'RGBA').save(f'{PUB}/p_close.png', optimize=True)
out['p_close'] = dict(file='pigeon/p_close.png', w=im.shape[1], h=im.shape[0], eye=e, eyebrow=b, headFill='#%02x%02x%02x' % tuple(fill))
# ---------- treadmill: dark belt band + green button
rgb, a = load('treadmill'); h, w = a.shape
ink = ink_of(rgb, a)
dark = (a > 200) & (rgb.sum(2) > 150) & (rgb.max(2) < 110)
xm = w // 2
rows = np.nonzero(dark[:, xm - 300:xm + 300].mean(1) > 0.9)[0]
bt, bb = int(rows.min()), int(rows.max())
cols = np.nonzero(dark[(bt + bb) // 2])[0]
# top of the belt = outer edge of the ink line above the band
y = bt - 1
while ink[y, xm]: y -= 1
hsv = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.int32)
green = (hsv[..., 0] > 45) & (hsv[..., 0] < 85) & (hsv[..., 1] > 100) & (a > 200)
def blob(m):
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    k = 1 + np.argmax(st[1:, 4]); ys, xs = np.nonzero(lab == k); return xs, ys
gx, gy = blob(green)
red = ((hsv[..., 0] < 8) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 120) & (a > 200)
rx_, ry_ = blob(red)
shutil.copy('keyed/treadmill.png', f'{PUB}/treadmill.png')
out['treadmill'] = dict(file='pigeon/treadmill.png', w=w, h=h, beltTop=int(y + 1), bandTop=bt, bandBot=bb,
                        bandX0=int(cols.min()), bandX1=int(cols.max()), beltColor='#%02x%02x%02x' % tuple(np.median(rgb[dark], 0).astype(int)),
                        green=[float(gx.mean()), float(gy.mean()), float(np.sqrt(len(gx) / np.pi))],
                        red=[float(rx_.mean()), float(ry_.mean()), float(np.sqrt(len(rx_) / np.pi))])
# ---------- street backdrop: base line
rgb, a = load('street'); h, w = a.shape
shutil.copy('keyed/street.png', f'{PUB}/street.png')
colsum = (a > 128).sum(1); base = int(np.nonzero(colsum > 0.5 * w)[0].max())
out['street'] = dict(file='pigeon/street.png', w=w, h=h, base=base)
# ---------- pigeon rig
out['rig'] = json.load(open('rig.json'))
json.dump(out, open('sprites.json', 'w'), indent=1, default=float)
ts = '// generated by images/pigeon/scripts/prep_all.py - do not edit by hand\n'
ts += 'export const S = ' + json.dumps(out, indent=1, default=lambda v: round(float(v), 2)) + ' as const;\n'
import os; os.makedirs('../../src/pigeon', exist_ok=True)
open('../../src/pigeon/sprites.ts', 'w').write(ts)
for k, v in out.items():
    if k == 'rig': continue
    print(k, {kk: vv for kk, vv in v.items() if kk not in ('file', 'eye', 'eyebrow', 'pigeonEye')})
print('hold pigeon eye', {k: (round(v, 1) if isinstance(v, float) else v) for k, v in out['g_hold']['pigeonEye'].items() if k in ('cx', 'cy', 'rx', 'ry')})
print('close eye', {k: (round(v, 1) if isinstance(v, float) else v) for k, v in out['p_close']['eye'].items() if not isinstance(v, dict)})
print('close brow', out['p_close']['eyebrow'])
