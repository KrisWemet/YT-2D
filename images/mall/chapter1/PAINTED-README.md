# Chapter One: painted edition

The full original chapter is remade with complete painted scenes: pale shaded stick-figure heads, thin black bodies, navy guard caps and richly textured environments. Danny keeps his gold keys; Marcus has no keys, wears the inverted radio until Danny removes it, and changes from pale to olive only when he rises. There is no Theo in Chapter One.

- Composition: `MallChapter1Painted`, 1920×1080, 30 fps, **26,465 frames / 14:42.167**.
- 168 picture shots, 100 distinct images: 96 new paintings plus four compatible existing paintings.
- Each image, including any pan/zoom/reframe, appears at most three times. No picture hold exceeds ten seconds; short action/dialogue beats can cut sooner.
- All people and scenery are painted into the images. No native figure renderer appears in this composition. Native layers supply readable messages, chapter titles, original location/time and radio badges, and the timed flashlight signal.
- Narration, dialogue, music, sound effects and final runtime use the existing Chapter One clock. The final export copies the original delivered video's stereo AAC without re-encoding.
- The original `MallChapter1` composition and existing shorts remain available.

## Files

- Artwork: `public/mall/ch1/story-art/painted-v1/`.
- Picture renderer and readable information: `src/mall/chapter1/painted.tsx`.
- Exhaustive frame manifest: `src/mall/chapter1/painted-edit.json`.
- Initial scene specifications: `painted-tasks.json`; actual prompts, references, revisions and selected source images: `painted-generation.json`. Generated with the built-in image tool; no KIE or generation API key is required to render.
- Matching channel profile picture and banner: `images/mall/channel-art/painted-v1/`.

## Validation and rendering

From the repository root:

```sh
node node_modules/typescript/bin/tsc --noEmit
node images/mall/chapter1/check-painted.cjs
node images/mall/chapter1/render-painted.cjs --stills
node images/mall/chapter1/render-painted.cjs
```

Set `REMOTION_BROWSER_EXECUTABLE` to an installed Chromium executable if needed. Set `NIGHT_GUARD_AUDIO_REFERENCE` to the **original Chapter One MP4**. The local default resolves to the original delivery at `../../outputs/night-guard-chapter-1.mp4`; render outputs and resumable one-minute picture parts go to `out/chapter1-painted-v1/`, or `NIGHT_GUARD_REVIEW_WORK` when specified.

The audit checks exhaustive frame coverage, PNG resolution, source-file and identical-content reuse, and the actual picture component at each shot's start/middle/end. The export verifies full media decoding, every video frame timestamp, dimensions/frame rate, stereo 48 kHz audio, and an identical encoded audio hash against the reference.

`contact-painted.py` makes inspection sheets and a companion asset index without modifying artwork. `build-painted-plan.py` rebuilds the initial paragraph-to-picture map from `ch1.json`; preserve any intentional later editorial changes before rebuilding.

The long video uses the original separate SRT captions. No full narration captions are burned into the image track.
