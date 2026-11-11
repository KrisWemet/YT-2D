"""Mask of the two store gates' bars in the concourse painting, for the channel banner.

The banner stands zombies behind the gates at the edges of public/mall/bg/concourse.jpg and then
draws the painting again through this mask, so the bars come back in front of them.

The bars are vertical, so a column belongs to a bar when the gate is brighter there than its
neighbours, measured over the whole height of the gate (continuous bars, no specks). The diagonal
cross-bracing comes from plain brightness, inside the bracing bands only.

Output: public/mall/brand/concourse-gates-mask.png, 2560x1440 (banner pixels), white = bar.
usage: python3 images/mall/gate_mask.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BW, BH = 2560, 1440

# banner pixels; keep in step with GATE_L / GATE_R in src/mall/ChannelArt.tsx
GATES = {
    'L': {'poly': [(0, 328), (486, 484), (486, 1050), (0, 1178)], 'rows': (600, 860), 'cols': (0, 486)},
    'R': {'poly': [(2118, 490), (2560, 326), (2560, 1180), (2118, 1056)], 'rows': (660, 880), 'cols': (2118, 2560)},
}
BRACING = [
    [(0, 395), (486, 465), (486, 580), (0, 580)],
    [(0, 875), (486, 885), (486, 1040), (0, 1120)],
    [(2118, 485), (2560, 425), (2560, 615), (2118, 645)],
    [(2118, 885), (2560, 875), (2560, 1120), (2118, 1045)],
]


def luminance(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def bar_columns(L, rows, cols, rise=0.1, reach=10):
    """Columns covered by bars. Each bar shows in the painting as a bright highlight between two
    dark outlines; a bar runs from the outline left of a highlight peak to the one right of it."""
    prof = L[rows[0]:rows[1], cols[0]:cols[1]].mean(axis=0)
    n = len(prof)
    on = np.zeros(n, bool)
    for i in range(1, n - 1):
        lo, hi = max(0, i - reach), min(n, i + reach + 1)
        if prof[i] < prof[lo:hi].max() or prof[i] - np.percentile(prof[lo:hi], 30) < rise:
            continue
        left = lo + int(np.argmin(prof[lo:i]))
        right = i + 1 + int(np.argmin(prof[i + 1:min(n, i + 7)]))
        on[max(0, left - 1):min(n, right + 2)] = True
    return on


def main():
    bg = Image.open(ROOT / 'public/mall/bg/concourse.jpg').resize((BW, BH), Image.LANCZOS)
    L = luminance(bg)

    stripes = np.zeros((BH, BW), np.float32)
    for g in GATES.values():
        on = bar_columns(L, g['rows'], g['cols'])
        stripes[:, g['cols'][0]:g['cols'][1]] = on[None, :]

    # cross-bracing: bright paint inside the bracing bands, grown to take in the outlines
    bright = np.clip((L - 0.17) / 0.06, 0, 1)
    bands = Image.new('L', (BW, BH), 0)
    for p in BRACING:
        ImageDraw.Draw(bands).polygon(p, fill=255)
    bracing = Image.fromarray((bright * np.asarray(bands, np.float32)).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))

    mask = np.maximum(stripes * 255, np.asarray(bracing, np.float32))
    gates = Image.new('L', (BW, BH), 0)
    for g in GATES.values():
        ImageDraw.Draw(gates).polygon(g['poly'], fill=255)
    mask = mask * (np.asarray(gates, np.float32) / 255)

    out = Image.fromarray(mask.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    dest = ROOT / 'public/mall/brand/concourse-gates-mask.png'
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, optimize=True)
    print(dest, out.size, f'{dest.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
