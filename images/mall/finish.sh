#!/usr/bin/env bash
# finish.sh RENDER.mp4 OUT.mp4
# Two-pass loudness normalisation to -15 LUFS (true peak -1.5 dBFS), then an efficient
# 1080p re-encode for upload. Remotion's CRF 18 render is ~127 MB; this gives ~80 MB.
set -euo pipefail
src="$1"; out="$2"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
m=$(ffmpeg -nostats -i "$src" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | python3 -c "
import sys, json
t = sys.stdin.read(); j = json.loads(t[t.rfind('{'):t.rfind('}') + 1])
print(f\"measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}\")")
ffmpeg -v error -y -i "$src" -c:v copy -af "loudnorm=I=-15:TP=-1.5:LRA=11:$m:linear=true" -ar 48000 -c:a aac -b:a 256k "$tmp/a.mp4"
ffmpeg -v error -y -i "$tmp/a.mp4" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -tune animation -c:a copy -movflags +faststart "$out"
ffmpeg -nostats -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
ls -la "$out"
