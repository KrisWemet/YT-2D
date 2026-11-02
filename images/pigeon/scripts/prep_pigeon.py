#!/usr/bin/env python3
"""Split the keyed hero pigeon into rig pieces (head / neck / body without legs) and
measure the eye, eyebrow and colours. Writes public/pigeon/p_*.png + images/pigeon/rig.json"""
import json
import numpy as np, cv2
from PIL import Image

SRC = 'keyed/p_hero.png'
OUT = '../../public/pigeon'
Y_TOP, Y_BOT = 292, 468          # neck slice rows (below the beak, above the wing)
im = np.asarray(Image.open(SRC)).copy()
h, w = im.shape[:2]
rgb = im[..., :3].astype(np.int32); a = im[..., 3]
ink = (a > 200) & (rgb.sum(2) < 200)
HEAD_FILL = np.median(rgb[60:110, 1100:1160].reshape(-1, 3), 0).astype(int)
BODY_FILL = np.median(rgb[700:800, 1000:1200].reshape(-1, 3), 0).astype(int)

# ---- eye: orange interior (+ pupil/glint holes) -> ellipse
hsv = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.int32)
orange = ((hsv[..., 0] >= 8) & (hsv[..., 0] <= 22) & (hsv[..., 1] > 150) & (hsv[..., 2] > 150) & (a > 200)).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(orange, 8)
k = 1 + np.argmax(st[1:, 4]); eyem = (lab == k).astype(np.uint8)
cnts, _ = cv2.findContours(eyem, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
filled = np.zeros_like(eyem); cv2.fillPoly(filled, [hull], 1)
(ecx, ecy), (ew, eh), eang = cv2.fitEllipse(hull)
inner = filled.astype(bool)
pup = inner & ink
ys, xs = np.nonzero(pup); (pcx, pcy), pr = cv2.minEnclosingCircle(np.column_stack([xs, ys]).astype(np.float32))
glint = inner & (rgb.min(2) > 225)
ys, xs = np.nonzero(glint); (gcx, gcy), gr = cv2.minEnclosingCircle(np.column_stack([xs, ys]).astype(np.float32))
# outer ink ring thickness: walk up from the ellipse top
yy = int(ecy - eh / 2) - 1; t = 0
while ink[yy - t, int(ecx)]: t += 1
eye = dict(cx=ecx, cy=ecy, rx=ew / 2, ry=eh / 2, angle=eang, ring=t, pupil=dict(cx=pcx, cy=pcy, r=pr), glint=dict(cx=gcx, cy=gcy, r=gr))

# ---- eyebrow: separate ink component above the eye
box = np.zeros_like(ink); box[40:int(ecy - eh / 2 - t - 4), int(ecx - 110):int(ecx + 110)] = True
n, lab, st, _ = cv2.connectedComponentsWithStats((ink & box).astype(np.uint8), 8)
k = 1 + np.argmax(st[1:, 4]); brow = lab == k
ys, xs = np.nonzero(brow)
cols = np.unique(xs)
mid = np.array([[x, ys[xs == x].mean()] for x in cols])
coef = np.polyfit(mid[:, 0], mid[:, 1], 2)
bx0, bx1 = cols.min(), cols.max(); bxm = (bx0 + bx1) / 2
thick = len(xs) / max(len(cols), 1)
# quadratic bezier through ends with the same middle height
p0 = [bx0, np.polyval(coef, bx0)]; p2 = [bx1, np.polyval(coef, bx1)]
ym = np.polyval(coef, bxm); c1 = [bxm, 2 * ym - (p0[1] + p2[1]) / 2]
eyebrow = dict(p0=p0, c=c1, p2=p2, width=float(thick))
# erase the eyebrow from the head (head fill colour, slightly dilated)
browd = cv2.dilate(brow.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
im[browd, :3] = HEAD_FILL; im[browd, 3] = 255

# ---- body: erase legs below the belly outline (smooth curve fitted to the outline top)
body = im.copy()
pts = []
for x in range(600, 1201, 20):
    ys_ = np.nonzero(ink[1100:, x])[0]
    if len(ys_): pts.append((x, 1100 + ys_[0]))
pts = np.array(pts, float)
cf = np.polyfit(pts[:, 0], pts[:, 1], 4)
res = pts[:, 1] - np.polyval(cf, pts[:, 0]); keep = np.abs(res) < 6
cf = np.polyfit(pts[keep, 0], pts[keep, 1], 4)
for x in range(w):
    if 585 <= x <= 1215:
        yb = int(round(np.polyval(cf, x) + 11))
        body[yb + 1:, x, 3] = 0
        body[yb, x, 3] = body[yb, x, 3] // 2
    else:
        body[1240:, x, 3] = 0
body[:Y_BOT - 1, :, 3] = 0
belly = {int(x): float(np.polyval(cf, x)) for x in range(590, 1215, 10)}

head = im.copy(); head[Y_TOP + 2:, :, 3] = 0
neck = im.copy(); neck[:Y_TOP - 1, :, 3] = 0; neck[Y_BOT + 2:, :, 3] = 0

def save(arr, name, y0, y1):
    Image.fromarray(arr[y0:y1], 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    return dict(file=f'pigeon/{name}.png', y0=int(y0), w=int(w), h=int(y1 - y0))
pieces = dict(head=save(head, 'p_head', 0, Y_TOP + 2), neck=save(neck, 'p_neck', Y_TOP - 1, Y_BOT + 2),
              body=save(body, 'p_body', Y_BOT - 1, h))
ys_all = np.nonzero(a > 128)[0]
rig = dict(size=[int(w), int(h)], yTop=Y_TOP, yBot=Y_BOT, pieces=pieces, eye=eye, eyebrow=eyebrow,
           headFill='#%02x%02x%02x' % tuple(HEAD_FILL), bodyFill='#%02x%02x%02x' % tuple(BODY_FILL),
           ink='#0b0b0b', pink='#e2686a', inkW=10, ground=int(ys_all.max()), belly=belly)
json.dump(rig, open('rig.json', 'w'), indent=1, default=float)
print(json.dumps({k: rig[k] for k in ('eye', 'eyebrow', 'headFill', 'bodyFill', 'ground')}, indent=1, default=lambda v: round(float(v), 1)))
