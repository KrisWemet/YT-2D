# Chapter Two — The Boy in the Ceiling

The complete 5,233-word manuscript is `script.md`. The approved target is about thirty minutes, with fourteen sections. Continue the Chapter One stick figure style, painted mall backgrounds, 1920×1080 output, 30 fps, and sidecar subtitles.

## Current state

Visual production is implemented in `src/mall/chapter2`. Danny uses the existing Chapter One rig. Theo uses the same rig, with a muted green hoodie, younger face, and a smaller build. The ceiling crawl, leg through the tile, rescue, empty radio clip on Marcus, reservoir, cinema hideout, and department store signal have dedicated scenes.

`make_plan.py` writes the speaker assignments, resumable voice plan, and visual development timings. Until approved narration has been generated, the only registered composition is `MallChapter2VisualPreview`. Its times are estimates, and its sound does not contain narration. It is not a finished chapter.

## Exact voice continuation

Use Chapter One's KIE.ai Gemini 3.1 Flash TTS settings. Danny is Algenib; Vera is Gacrux. Theo is a new youthful, understated Puck voice. The recipe uses fixed per-line gains, 1.08 tempo, short internal pauses, and a walkie-talkie treatment for Vera. Record two takes and transcribe before selecting. The script contains complete role assignments.

`record_voice.py` accepts the configured `KIE_API_KEY` or `--key-file /absolute/path/to/local.env`. Credentials are never written to the repository or logs. It reuses completed task IDs on resumption instead of submitting duplicate jobs. Only accepted takes are assembled; missing or inaccurate chunks block the finished-video composition.

After narration, align words and emit subtitles. Recheck the runtime against the thirty-minute target before final export. The final `MallChapter2` composition is registered only when recorded timing is present.

## Completion checks

Inspect the new scenes and transitions at actual narration times. Verify that no generated files or credentials are accidentally tracked. Render the full chapter, apply the Chapter One final audio mastering, and decode the entire MP4. Check 1920×1080, 30 fps, stereo audio, end-card duration, subtitle timing, missing media, and representative dark scenes. Deliver the finished MP4 and SRT to outputs, then copy them into Downloads. Never present the visual-only preview as the completed video.
