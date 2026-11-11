#!/usr/bin/env bash
# finish.sh RENDER.mp4 OUT.mp4
# Bring the mix to about -15 LUFS with one fixed gain plus a peak limiter (true peak about -1.5 dBFS),
# so whispers stay quiet and loud moments stay loud (a loudness normaliser can squash those),
# then an efficient 1080p re-encode for upload.
set -euo pipefail
src="$1"; out="$2"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
I=$(ffmpeg -nostats -i "$src" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-15 - ($I), 2))")
ffmpeg -v error -y -i "$src" -c:v copy -af "volume=${G}dB,alimiter=limit=0.84:level=false" -ar 48000 -c:a aac -b:a 256k "$tmp/a.mp4"
ffmpeg -v error -y -i "$tmp/a.mp4" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -tune animation -c:a copy -movflags +faststart "$out"
echo "input ${I} LUFS, gain ${G} dB"
ffmpeg -nostats -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
ls -la "$out"
