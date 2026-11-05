#!/usr/bin/env bash
# vo_export.sh VO.wav OUT.mp3 [target LUFS, default -16]
# Export a voice track at a target loudness with one fixed gain plus a peak limiter,
# keeping the planned quiet/loud differences between lines (no dynamic loudness normalising).
set -euo pipefail
src="$1"; out="$2"; target="${3:--16}"
I=$(ffmpeg -nostats -i "$src" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(${target} - ($I), 2))")
ffmpeg -v error -y -i "$src" -af "volume=${G}dB,alimiter=limit=0.84:level=false" -ar 48000 -c:a libmp3lame -b:a 192k "$out"
echo "$out: input ${I} LUFS, gain ${G} dB"
