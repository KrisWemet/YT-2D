#!/usr/bin/env bash
# verify.sh video.mp4 -> resolution, fps, frame count, durations, last-frames motion, loudness
f="$1"
ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=width,height,r_frame_rate,nb_read_packets,duration,pix_fmt,codec_name -of default=nw=1 "$f"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,duration -of default=nw=1 "$f"
ls -la "$f" | awk '{print "size_bytes=" $5}'
# motion in the last 0.5 s (mean abs diff between consecutive frames, downscaled)
ffmpeg -v error -sseof -0.5 -i "$f" -vf "scale=270:480,format=gray" -f rawvideo - | python3 -c "
import sys, numpy as np
a = np.frombuffer(sys.stdin.buffer.read(), np.uint8).reshape(-1, 480, 270).astype(float)
d = np.abs(np.diff(a, axis=0)).mean((1, 2))
print('last_frames', len(a), 'mean_motion', round(float(d.mean()), 3), 'min', round(float(d.min()), 3))"
ffmpeg -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" 
