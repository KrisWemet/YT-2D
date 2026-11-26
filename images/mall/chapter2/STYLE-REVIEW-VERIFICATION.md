# Illustrated Part One — v10 verification

Scope: 0:00–10:14.533, `MallChapter2IllustratedPartOne`. The full `MallChapter2` composition remains the existing v8 chapter. The part ends on Theo's eight-thousand-gallons claim, before the location is explained.

- 18,436 frames at 30 fps, 1920×1080 H.264; stereo 48 kHz AAC.
- Complete 1080p decode passed. All presentation timestamps are continuous at 3,000 ticks/frame on a 90 kHz timescale.
- Encoded AAC prefix matches the original v8 MP4 exactly through this part's endpoint.
- The 1280×720 copy retains all 18,436 frames and identical encoded audio; complete decode passed.
- The exhaustive 103-shot track covers every frame without gaps or overlaps. Every shot is at most ten seconds; median 6.17 seconds.
- All 61 image files exist at production resolution. Every crop, pan and zoom is counted as another use. Maximum three uses per image and maximum three uses per identical file content; aliases cannot bypass the limit.
- The actual picture component was inspected at all 309 shot start/midpoint/end samples: exactly one painting, no native SVG figure layers. The opt-in review path bypasses the older coded scene/figure renderer.
- All 103 shot midpoint stills were reviewed alongside their retained transcript. A frame from each shot was also extracted from the completed MP4; final background corrections and the ending were checked in the delivered picture.
- Closed gates, no premature Theo reveal, chalk-before-bait, put-down-before-run, wrist contact and Theo's standing position were checked. The second gate-shadow use crops to Marcus, excluding the older perched Theo pose.
- The SRT has 232 ordered, nonoverlapping cues. The final spoken cue ends at 10:13.069, leaving about 1.46 seconds for the cliffhanger reaction.
- Source script and word timing, retention edit map, finished sound master and series outline match the preceding source revision byte for byte.
- TypeScript, renderer syntax, whitespace and existing ladder/rescue continuity checks pass.

Reproduce the structural/image audit with `node images/mall/chapter2/check-style-review.cjs`. The generated `out/chapter2-style-review-v10/shot-audit.json` contains per-shot transcripts, image-use counts and asset hashes. The render helper writes its media verification after decoding and timestamp/audio checks. Full-resolution and smaller review copies plus captions and reports are delivered locally; MP4s are excluded from Git. Nothing is merged or published.
