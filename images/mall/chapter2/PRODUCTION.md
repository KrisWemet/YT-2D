# Chapter Two production

The current finished composition is `MallChapter2`: the approved retention revision, without a recap. It runs 49,732 frames at 30 fps (27:37.733). Earlier source timing and performances remain available as `MallChapter2VisualPreview`. The revised preview is `MallChapter2RetentionPreview`.

## Current editorial sources

- `src/mall/chapter2/ch2.json` is the original recorded, word-aligned narration. Its source clock remains unchanged.
- `src/mall/chapter2/retention-edit.json` maps retained source frames into the new timeline and includes the new 24-second return-trip scene.
- `retention-script.md` contains the retained spoken script and the new visual passage.
- `src/mall/chapter2/retention-scenes.tsx` adds the new ceiling angles, wrist detail, wall prints, character decisions, rooftop signal and return-trip action.
- `public/mall/ch2/retention.mp3` is the finished audio master. No API key is needed to preview or render it.
- `publish/night-guard-chapter-2-v7.srt` and the adjacent chapter markers match this edit.

The opening is about fourteen seconds, followed immediately by Night One. Fifteen edits remove advance reveal summaries and repeated preparation. On the return trip, Theo's leg buckles. Danny holds him while a container falls onto a lower ledge and loses its water. The empty container is recovered with the climbing strap. Later scenes preserve one full and one empty container. The copied rooftop signal and B3 ending retain their original revelations.

The new scene uses the existing stick rig and is told through action, without new dialogue. Algenib, Gacrux and Puck retain their recorded performances. Beds fall away around the ceiling crack, empty-fountain impact and copied signal. The delivered master measures -16.1 LUFS with a -2.4 dBTP true peak. Artwork prompts and provenance are in `retention-artwork.md`.

## Reproduce

With Node dependencies installed, preview with `npm run studio`. To export with the checked-in audio:

```sh
node images/mall/chapter2/retention/render.cjs
```

Set `REMOTION_BROWSER_EXECUTABLE` if an installed Chrome or headless shell should be used. The export goes into `out/chapter2-retention/`. It is checked for expected frames, dimensions, frame rate, stereo audio, and complete decoding.

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
