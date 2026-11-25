# Chapter Two production

The current finished composition is `MallChapter2`: the approved retention revision with the ceiling-side and ladder continuity corrections, without a recap, plus the v9 picture polish described below. It runs 49,732 frames at 30 fps (27:37.733). Earlier source timing and performances remain available as `MallChapter2VisualPreview`. The revised preview is `MallChapter2RetentionPreview`.

## V9 picture polish

Picture only: the narration, sound, runtime, captions and chapter markers are exactly those of v8.

- **No flash frames.** The retention cuts left about twenty one- to ten-frame slivers of neighbouring shots at edit points. `retention.tsx` now builds a picture plan once and gives any run shorter than 15 frames to the picture beside it, so cuts land on the audio edit or on the narration word that cued them. Every picture lasts at least half a second.
- **Sub-pixel camera.** Painted backgrounds were placed with layout pixels, so slow camera drifts stepped unevenly under the smoothly moving figures. Inside the revised edit (`SubpixelCamera`), the painting is placed with a transform and glides with the figures. Render with input props `{"subpixel": false}` to compare.
- **Section tags on every chapter.** The trimmed openings had removed most "where and when" tags. Each section's tag now opens on its first retained frame; the cold open stays untitled.
- **Transitions.** Short fades through black where the story moves to another night, day or place (title to Night One, Day 2, Day 3, the six-a.m. wait, Day 4, Day 5, nine o'clock, the end card) and a fade from and to black at the very start and end. Memories and imagined scenes dissolve in and out over 8 frames; the woman in Vera's story fades out of the fitting room over 24 frames under one continuous camera.
- **Continuity.** The crawls above the store and the court run on the source clock (`crawlState` in `continuity.ts`), with movement following the narration, so cuts never send the actors back to a starting mark; the close views follow the crawlers. The court crossing ends on the collapse marks, Danny enters the collapse in the crawl's on-screen shape, and the rescue starts from the hanging shape the fall left him in. Consecutive fall shots share one struggle and debris clock; the strap draws out as Theo reaches for it; the wound close-up keeps the rescue staging; the ladder approach starts where the rescue left them, beside the broken ceiling; the boot stays in the fountain, and "I could see Marcus too" moves in on Marcus.
- **Motion.** The food-offer camera moves the painting and the figures together with eased pushes instead of two single-frame zoom jumps; the inserted plates (ceiling angles, prints, grip, second light, frozen thumb) push slowly toward their subjects; the poured jug fills; the drill crew keeps walking and the service-hall crowd keeps shambling instead of stopping dead or walking on the spot.

`check_continuity.cjs` now also verifies the crawl (no backward slide, no jumps, ends on the collapse marks) and the picture plan (no gaps, nothing under 15 frames).

## Current editorial sources

- `src/mall/chapter2/ch2.json` is the original recorded, word-aligned narration. Its source clock remains unchanged.
- `src/mall/chapter2/retention-edit.json` maps retained source frames into the new timeline and includes the new 24-second return-trip scene.
- `retention-script.md` contains the retained spoken script and the new visual passage.
- `src/mall/chapter2/retention-scenes.tsx` adds the new ceiling angles, wrist detail, wall prints, character decisions, rooftop signal and return-trip action.
- `public/mall/ch2/retention.mp3` is the finished audio master. No API key is needed to preview or render it.
- `publish/night-guard-chapter-2-v8.srt` and the adjacent chapter markers match this edit.

The opening is about fourteen seconds, followed immediately by Night One. Fifteen edits remove advance reveal summaries and repeated preparation. On the return trip, Theo's leg buckles. Danny holds him while a container falls onto a lower ledge and loses its water. The empty container is recovered with the climbing strap. Later scenes preserve one full and one empty container. The copied rooftop signal and B3 ending retain their original revelations.

The new scene uses the existing stick rig and is told through action, without new dialogue. Algenib, Gacrux and Puck retain their recorded performances. Beds fall away around the ceiling crack, empty-fountain impact and copied signal. The delivered master measures -16.1 LUFS with a -2.4 dBTP true peak. Artwork prompts and provenance are in `retention-artwork.md`.

## Reproduce

With Node dependencies installed, preview with `npm run studio`. To export with the checked-in audio:

```sh
node images/mall/chapter2/retention/render.cjs
```

Set `REMOTION_BROWSER_EXECUTABLE` if an installed Chrome or headless shell should be used. The export goes into `out/chapter2-retention/` as `night-guard-chapter-2-v9.mp4`. The picture renders in `CHUNKS` parts (default 4) that are kept between runs, so an interrupted export resumes; `CONCURRENCY` sets parallel browser tabs (default 6). It is checked for expected frames, dimensions, frame rate, stereo audio, and complete decoding.

To change the cut or rebuild the audio, use Python with numpy and soundfile, plus ffmpeg:

```sh
python images/mall/chapter2/retention/build_edit.py
node images/mall/chapter2/retention/export_cues.cjs
python images/mall/chapter2/retention/build_sound.py
```

The edit builder intentionally disables `audioReady` until sound is rebuilt. The original source WAV is used when present, otherwise the builder decodes `public/mall/ch2/vo.mp3`. All temporary PCM, exported sound metadata and output media stay under ignored `out/`.

The original generation tools (`make_plan.py`, `record_voice.py`) belong to the immutable source-clock production. Do not run them to change this edit. They regenerate original voice timing, and recording requires the privately configured KIE key. Credentials and raw voice takes remain excluded from version control.

## Delivery checks

Check every revised scene against its retained words, especially the boot landing in an empty fountain, the delayed footprints reveal, the three individually cued flashes, hand contact and water loss. Keep purposeful visual changes within ten seconds of narration. Recheck captions after timeline changes. Decode the entire final MP4 and verify 1920×1080, 30 fps, stereo AAC at 48 kHz. Export media and subtitles into the delivery folder, then copy to Downloads. Nothing is published or merged by this workflow.

## Continuity corrections

The ceiling rescue keeps Theo on Danny’s right, as established during the crawl. The actor poses and their camera focus are reflected together while the background remains fixed. Hand contact stays attached. The approach to the pump room remains above the ceiling until the actual ladder cue. Both ladder views share a source-clock descent, and Danny steps clear before Theo reaches the floor. Run `node images/mall/chapter2/retention/check_continuity.cjs` to check monotonic descent and screen-side ordering. Narration, audio, runtime and caption timing are unchanged from v7.
