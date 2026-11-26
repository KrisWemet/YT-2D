# Chapter Two · Painted Finale

**7:34.433 · 1920×1080 · 30 fps · 13,633 frames.** The final installment opens at the complete recorded sentence “One-thirty. Ten minutes before Marcus called about the man on the ramp.” Its first **6.033 seconds** overlap Part Two, including the same clock/drilling pictures, then continue directly into Theo's account. The previous installment's two-second closing hold is not inserted into the dialogue.

This finishes all remaining Chapter Two recordings: Vera's connection to the drill, the return journey and water sacrifice, Theo coming home and accepting a tent, the nightly signals, Vera copying Lily's flashes, and the red B3 key. The last spoken question remains **“What did she think was behind that door?”** The last ten seconds retain the original end-card timing. No B3 door or underground room is invented.

## Artwork and continuity

- 38 new complete paintings generated with the built-in `image_gen` tool; no KIE API key needed.
- 66 timed shots with gentle pans and zooms. Every source image appears at most three times, including aliases and all three Chapter Two parts combined.
- Danny stays left and Theo right in shared present-day scenes. Danny retains one black boot and one dirty gray sock. Keys stay wrapped until the final reveal.
- Danny and Theo remain above the mall crowd. Danny rescues Theo on the return journey, sacrificing one jug's water and retrieving the damaged empty container from a lower ledge. They return with one full and one cracked empty jug.
- Theo's scrape is treated before the later roof scenes. They enter the store via the storage rack, with the front gate still locked. Danny signals alone the first evening; Theo joins the following evening.
- Three timed light pulses from Lily, three replies from Danny, and three from the other roof are frame-driven on/off effects on dark painted plates. The earlier solo exchange also has three pulses each. Native B3 lettering is placed on the two blank tag plates.
- All characters and scenery are painted together; no native SVG character layers.

Final artwork: `public/mall/ch2/story-art/part-three-v1/`. `generation.json` preserves exact prompts, reference paths, generated-file identifiers and selected revisions, and identifies the three reused sources.

## Original audio and captions

Source-clock range: retention frames **36,099–49,731**, through the end of the original 49,732-frame edit. The 48 kHz stereo mix is decoded and trimmed at exact sample boundaries, checked against the intermediate WAV by SHA-256, and encoded once to AAC. This preserves the recorded voices, effects and mix timing. The 720p preview copies the final AAC stream unchanged.

`part-three.srt` maps 1,230 original recorded words into 148 cues, including the opening reprise and final question. It follows the visual-only 24-second return-choice segment without adding narration. No new recap or narration is generated.

## Reproduce

From repository root:

```sh
python3 images/mall/chapter2/part-three-v1/build-plan.py
python3 images/mall/chapter2/part-three-v1/build-captions.py
node node_modules/typescript/bin/tsc --noEmit
node images/mall/chapter2/check-part-three.cjs
node images/mall/chapter2/render-part-three.cjs --stills
node images/mall/chapter2/render-part-three.cjs
```

Set `REMOTION_BROWSER_EXECUTABLE` if needed. `NIGHT_GUARD_REVIEW_WORK` can change the output directory. The opt-in composition is `MallChapter2IllustratedPartThree`. The existing Remotion production workflow is retained.

Default output: `out/chapter2-part-three-v1/`. Rendering resumes completed picture parts by source/artwork hash, checks every video timestamp, verifies frame count and audio format, and fully decodes the output. Source, artwork, captions, exact prompts and verification reports are versioned; rendered videos stay outside Git.

The review covers all 66 shot midpoints and separate on/off stills for all 15 signal pulses. See `shot-audit.json` and `verification.json` for the completed export checks.
