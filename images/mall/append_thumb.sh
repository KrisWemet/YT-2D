#!/usr/bin/env bash
# Add a Short's thumbnail as its last quarter-second (8 frames, silent), so it can be chosen in the
# YouTube app's thumbnail frame picker on channels that can't upload a custom Shorts thumbnail.
#
# usage: bash images/mall/append_thumb.sh IN.mp4 THUMB.jpg OUT.mp4
set -euo pipefail
in=$1 thumb=$2 out=$3
len=0.26667 # 8 frames at 30 fps
ffmpeg -v error -y -i "$in" -loop 1 -framerate 30 -t "$len" -i "$thumb" -f lavfi -t "$len" -i anullsrc=r=48000:cl=stereo \
  -filter_complex "[0:v]fps=30,setsar=1,format=yuv420p[v0];[1:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[t];\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo[a0];[2:a]aformat=sample_rates=48000:channel_layouts=stereo[a1];\
[v0][a0][t][a1]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart "$out"
echo "$out"
