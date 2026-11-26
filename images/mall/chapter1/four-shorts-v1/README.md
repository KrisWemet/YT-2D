# Chapter One — four painted Shorts

Four connected condensed parts of the latest painted Chapter One. These are a
new four-part edit, separate from the older fourteen `NightGuardPart` cuts.

| Part | Story | Duration | Ending |
| --- | --- | --- | --- |
| 1 | Forty-Two Keys | 2:56.200 | Which store would you choose? |
| 2 | I Had the Key | 2:39.267 | Marcus dies, then stands up. |
| 3 | The Radio | 2:12.767 | How did the stranger enter the locked mall? |
| 4 | Three Blinks | 2:56.000 | Who is in Lily’s window? |

Each export is 1080 × 1920, 30 fps, H.264/AAC stereo at 48 kHz, with fast-start
MP4 metadata. Each is below three minutes. They condense the 14:42 chapter;
omitted passages remain available in the full chapter. The openings of parts 3
and 4 are cold opens followed by an explicit time card.

## What is preserved

All characters and backgrounds come from the existing integrated paintings.
The source performances and effects are recut from the completed painted master
without a voice-generation service, speed changes, or a new mix. A five-millisecond
fade at each new edit boundary prevents clicks inside the sentence handles.
Every retained audio core is sample-identical before AAC encoding. The closing
text holds for 2.2 seconds. No narration gap is introduced inside the story.

Portrait cameras retain the full picture for two-person scenes and geography.
Solo scenes use closer crops. Captions are native text with word highlighting;
the SRT copies contain the same retimed words without styling. Source-clock
phone text and Lily’s three window flashes retain their original timing. No
painting is used more than three times within a Short.

## Build

From the repository root:

1. `python3 images/mall/chapter1/four-shorts-v1/build-plan.py`
2. Run `build-audio.py` with Python plus NumPy. It expects the completed painted
   master at `../../outputs/night-guard-chapter-1-painted-v1.mp4`; override with
   `NIGHT_GUARD_AUDIO_REFERENCE`. The four encoded mixes are checked in for Studio.
3. `node node_modules/typescript/bin/tsc --noEmit`
4. Set `REMOTION_BROWSER_EXECUTABLE` to a local Chromium executable and run
   `node images/mall/chapter1/four-shorts-v1/render.cjs --stills`.
5. Inspect the QC samples, then run the same command without `--stills`.

The render command checks duration, dimensions, frame rate, audio format,
continuous frame timestamps, and a full decode. Picture rendering resumes in
50-second pieces when the source hash matches. Outputs, captions, QC samples,
and verification reports are in `out/chapter1-four-shorts-v1/`.

Studio compositions: `NightGuardChapter1FourShort01` through `04`. Existing
full chapters and the older Shorts compositions are unchanged.

## Thumbnail options

`thumbnails/` contains two finished portrait JPEG covers per Short (A and B),
each 1080 × 1920 and below 2 MB. The comparison sheets show the full designs
and centered 3:4 crops. Prompts, refinements, and file checksums are included.
These are qualitative curiosity concepts; no measured CTR or virality is claimed.
