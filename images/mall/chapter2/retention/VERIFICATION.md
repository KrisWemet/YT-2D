# Chapter Two v8 verification

- Full export: 49,732 frames, 27:37.733 at 1920 × 1080 and 30 fps.
- H.264 High picture and stereo AAC at 48 kHz.
- Entire final movie decoded without errors.
- Every picture timestamp checked against the 30 fps timeline. Sub-frame rounding from concatenation was normalized without re-encoding the picture.
- The final return-trip frame matches the corrected scene pixel for pixel.
- No Chapter One recap. The Chapter Two danger opening is 13.6 seconds.
- All 4,736 retained words preserve their source text, speaker and timing. No spoken words are cut at the edit boundaries.
- Ten audio join samples checked with transcription, including the opening.
- Visual holds remain within ten seconds, including the end card. The two ladder views share a single descent.
- Caption times are ordered and remain inside the movie runtime. Chapter markers match this revision.
- New return-trip hand contact, water loss and strap retrieval inspected in rendered frames. The later shop shots retain one full and one empty container.
- Copied signal pulses follow the original three recorded count words.
- Audio measured at -16.1 LUFS, 4.7 LU loudness range and -2.4 dBTP. The quiet action passage contains no additional spoken dialogue.
- TypeScript compilation, Python production-script compilation and git whitespace checks passed.

The full MP4 and original PNG plates are delivered locally. The working artwork, audio master, captions, timing data and reproducible source are in the repository.

## V8 continuity checks

- Theo remains on Danny’s right through the ceiling crawl, fall and rescue, including the opening flash-forward. Actor poses, linked hands and camera focus are transformed together.
- The approach to the ladder remains above the ceiling. One source-clock descent runs across both ladder views without restarting. Danny steps clear before Theo reaches the floor.
- The descent regression check samples every frame for downward progress, verifies progress across the close-view cut and checks both characters’ final positions.
- Both corrected scenes match their frames in the finished movie pixel for pixel. A later unchanged scene also matches v7 pixel for pixel.
- V8 contains exactly the same encoded AAC audio as v7. Runtime and caption timing are unchanged.
- All 49,732 frame timestamps are continuous, and the complete v8 movie decodes without errors.
