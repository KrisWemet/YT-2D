# Chapter Two · Painted Part Two

**9:56.800 · 1920×1080 · 30 fps · 17,904 frames.** This installment continues immediately after Illustrated Part One's “eight thousand gallons.” It opens with “The fountain” and ends with Theo's “They were cutting through the wall,” followed by a two-second visual hold asking what the crew wanted to reach.

The story follows the existing Chapter Two recordings and series outline: the water plan, cinema route, ceiling collapse, Theo rescuing Danny, Danny losing his right boot, the single ladder descent, water collection, and the first-night drilling clue. Vera's identity confirmation and the return journey remain for the next installment.

## Artwork and continuity

- 46 new complete painted scenes, generated with the built-in `image_gen` tool; no KIE call or API key needed.
- 82 timed shots with restrained pans and zooms. Each source image appears at most three times, counting reframes and identical-file aliases. The same limit also passes across Part One and Part Two combined.
- Danny stays left and Theo stays right in shared scenes. Danny has one remaining black boot and one dirty sock after the rescue; the keys stay muffled during the trip. Marcus has an empty radio clip.
- Danny and Theo remain above the mall crowd during the crossing. The ground-level reaction shots show Marcus and the undead, with only Danny's boot/leg visible through the ceiling. The pump room is enclosed beneath the fountain.
- All people and scenery are integrated into each painting. There are no native SVG character layers.

The final PNG files are in `public/mall/ch2/story-art/part-two-v1/`. `generation.json` records the exact prompts, references, generated-file identifiers and selected revisions. `artwork-tasks.json` and `build-plan.py` preserve the scene briefs and timing plan.

## Audio and captions

The picture track uses final-clock frames **18,436–36,279** of the existing retention edit. The corresponding **48 kHz stereo** source mix is decoded and trimmed at exact sample boundaries, then given a two-second silent cliffhanger hold and encoded once to AAC. Voices and effects retain their original timing and mix. The renderer verifies the decoded source slice against the intermediate WAV by SHA-256; it does not claim compressed MP3/AAC byte identity.

`part-two.srt` contains 198 caption cues, retimed from 1,738 original recorded word cues through `retention-edit.json`. The cut stops after “wall,” before “Theo said.” The final caption uses a period for the installment ending.

## Reproduce and verify

From repository root:

```sh
python3 images/mall/chapter2/part-two-v1/build-plan.py
python3 images/mall/chapter2/part-two-v1/build-captions.py
node node_modules/typescript/bin/tsc --noEmit
node images/mall/chapter2/check-part-two.cjs
node images/mall/chapter2/render-part-two.cjs --stills
node images/mall/chapter2/render-part-two.cjs
```

Set `REMOTION_BROWSER_EXECUTABLE` if Chromium is not discoverable. `NIGHT_GUARD_REVIEW_WORK` optionally changes the output directory. The opt-in Remotion composition is `MallChapter2IllustratedPartTwo`; all existing compositions remain available.

Default output directory: `out/chapter2-part-two-v1/`. The render script resumes completed picture parts by a hash of source and artwork, checks every frame timestamp, verifies the frame count and audio format, and fully decodes the result. Rendered video files stay outside Git; source, artwork, captions, prompts and verification reports are versioned.
