#!/usr/bin/env python3
"""sheet.py dir out.jpg cols [tilewidth] -> grid of all PNGs in dir with time labels"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3])
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
files = sorted(glob.glob(os.path.join(d, '*.png')), key=lambda f: float(os.path.basename(f)[1:-4]))
ims = []
for f in files:
    im = Image.open(f).convert('RGB'); im = im.resize((tw, int(im.height * tw / im.width)))
    dr = ImageDraw.Draw(im); lab = os.path.basename(f)[1:-4].lstrip('0') or '0'
    dr.rectangle([0, 0, 60, 22], fill=(0, 0, 0)); dr.text((4, 4), lab, fill=(255, 255, 0))
    ims.append(im)
rows = (len(ims) + cols - 1) // cols
th = ims[0].height
sheet = Image.new('RGB', (cols * (tw + 4), rows * (th + 4)), (40, 40, 40))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * (tw + 4), (i // cols) * (th + 4)))
sheet.save(out, quality=85)
print(sheet.size)
