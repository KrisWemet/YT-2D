# Illustrated Part One — 10:14.233

`MallChapter2IllustratedPartOne` is the current v10 review: 18,427 frames at 30 fps. It ends after Theo says, “I know where there's eight thousand gallons,” with a short reaction hold. The fountain and route are left for the next part. The existing recorded performance and sound mix are retained through this endpoint. The full `MallChapter2` composition now renders the v10 still-screen cut (see `PRODUCTION.md`).

## Visual direction

The user's approved Image 1 (`theo-perch`) anchors every shot: oversized softly shaded pale heads, two black oval eyes, thin black stick bodies, mitten hands and richly painted environments with shared lighting and contact shadows. Danny has the navy security cap, gold shield and hip keys. Theo has a muted green hood collar. Characters are integrated into complete illustrations. There are no native flat figure layers in this part, including the rooftop memories, clue inserts and Theo's physical actions.

The part uses 61 images in 103 counted shots. Each image appears at most three times, including every crop, pan and zoom. The mean shot is 5.97 seconds, the median 6.17 seconds, and no hold exceeds ten seconds; shorter cuts follow action or dialogue. Slow push-ins, pullbacks and horizontal camera moves vary the framing. These are illustrated scenes with camera motion, rather than fully animated character performances.

Thirty-eight new scene illustrations and nine corrected versions of existing paintings are saved in `public/mall/ch2/story-art/v10/`. Fourteen previously accepted paintings complete the part. The original artwork files remain available for the previous review. All new raster art was made with the built-in image-generation tool. Prompts and correction instructions are recorded in `story-v10-prompts.json` and `story-v10-corrections.json`; reference images include the approved painting, established mall backgrounds and accepted intermediate artwork. No generation credentials are needed to render.

Continuity checks include the dark apartment window after goodnight, Vera remaining unseen, no premature Theo reveal, two bars becoming one, chalk before bait, the split heel clue, closed store entrances, the bar being put down before the run, Danny releasing Theo on the second shelf, and Theo remaining on the floor after standing. The ending uses small drinking bottles, with the water destination unrevealed.

## Timeline and audit

`src/mall/chapter2/illustrated-part-one.json` is an exhaustive final-clock picture track. Each entry records the image, start frame, duration, crop and narration cue. The review returns this track before the older scene renderer can run, so there is no fallback to flat figures. The original source script, word times and series outline are unchanged. Frame times follow the v10 retention edit and its sound master (see “Timing on the v10 edit” below).

Run:

```sh
node images/mall/chapter2/check-style-review.cjs
```

This checks continuous coverage, image existence and resolution, maximum uses by both path and identical file content, one painting and zero SVG figure layers at every shot's start/midpoint/end, and the cliffhanger's retained words. It writes `out/chapter2-style-review-v10/shot-audit.json`, including each shot's actual retained transcript and image SHA-256.

## Reproduce

With Node dependencies installed:

```sh
node images/mall/chapter2/render-style-review.cjs --stills
node images/mall/chapter2/render-style-review.cjs
```

Set `REMOTION_BROWSER_EXECUTABLE` to an installed Chromium executable if needed. The first command captures all 103 shot midpoints; the second creates resumable picture segments, normalizes frame timestamps, muxes the finished sound mix and verifies the movie. Output: `out/chapter2-style-review-v10/night-guard-chapter-2-v10-part-one.mp4`.

`NIGHT_GUARD_AUDIO_REFERENCE` optionally points to the v10 chapter MP4 (`night-guard-chapter-2-v10.mp4`) to copy its encoded AAC directly; the v8 MP4's audio no longer lines up after the title. Without that local file, the checked-in retention MP3 is encoded to stereo 48 kHz AAC. The earlier local delivery used the v8 AAC prefix on v8 timing. `NIGHT_GUARD_REVIEW_WORK` optionally changes the work/output directory.

The legacy `MallChapter2StyleReview10Min` registration remains available at exactly ten minutes; use the new Part One registration for the natural ending. Full-size delivery MP4s stay outside Git. Nothing is published or merged.

## Timing on the v10 edit

Part One follows the v10 retention edit and audio master. Compared with v8, the chapter title starts four frames later and everything after it plays nine frames (0.3 s) earlier, so Part One is 18,427 frames (10:14.233). `retime-part-one.py` moved every shot start and caption through its source frame: each of the 103 shots covers the same narration as before, every caption lands on the same words, and the reaction hold after the last line is still 1.46 seconds. The plan's `editVersion` must match the edit map, or `check-style-review.cjs` fails; after a future edit change, run `python3 images/mall/chapter2/retime-part-one.py <git ref with the previous edit>`.
