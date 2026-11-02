#!/usr/bin/env python3
"""storyboard.py video.mp4 out.jpg "seconds|caption" ... -> one-row film strip of frames (used in the README)

Example:
  python3 scripts/storyboard.py out/pigeon-head-bob-4K.mp4 docs/pigeon-storyboard.jpg \
      "2.8|never moves backward" "4.6|freezes in place" "12|the bobbing stopped" "17.5|about vision"
"""
import io, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

video, out, *beats = sys.argv[1:]
FW, GAP, PAD, R = 400, 24, 24, 16  # frame width, gap, outer padding, corner radius (px)
BG, MUTED, FG = (22, 25, 30), (154, 166, 178), (255, 255, 255)


def font(size):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'DejaVuSans-Bold.ttf', 'Arial Bold.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


F_TIME, F_CAP = font(24), font(30)


def grab(t):
    png = subprocess.run(
        ['ffmpeg', '-v', 'error', '-ss', str(t), '-i', video, '-frames:v', '1',
         '-vf', f'scale={FW}:-2:flags=lanczos', '-f', 'image2pipe', '-vcodec', 'png', '-'],
        capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGB')


def wrap(draw, text, width):
    lines, cur = [], ''
    for w in text.split():
        nxt = f'{cur} {w}'.strip()
        if cur and draw.textlength(nxt, font=F_CAP) > width:
            lines.append(cur)
            cur = w
        else:
            cur = nxt
    return lines + [cur]


items = []
for b in beats:
    t, cap = b.split('|', 1)
    items.append((float(t), f'“{cap}”', grab(t)))

probe = ImageDraw.Draw(Image.new('RGB', (1, 1)))
wrapped = [wrap(probe, cap, FW) for _, cap, _ in items]
FH = items[0][2].height
n_lines = max(len(w) for w in wrapped)
W = PAD * 2 + FW * len(items) + GAP * (len(items) - 1)
H = PAD + FH + 16 + 30 + n_lines * 38 + PAD

sheet = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(sheet)
mask = Image.new('L', (FW, FH), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, FW - 1, FH - 1], radius=R, fill=255)
for i, ((t, _, im), lines) in enumerate(zip(items, wrapped)):
    x = PAD + i * (FW + GAP)
    sheet.paste(im, (x, PAD), mask)
    y = PAD + FH + 16
    draw.text((x, y), f'{int(t) // 60}:{int(t) % 60:02d}', font=F_TIME, fill=MUTED)
    for j, line in enumerate(lines):
        draw.text((x, y + 30 + j * 38), line, font=F_CAP, fill=FG)
sheet.save(out, quality=85, optimize=True, progressive=True)
print(out, sheet.size)
