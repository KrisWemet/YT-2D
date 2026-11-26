# Opening ten-minute illustrated review

The user narrowed this revision to the first ten minutes of Chapter Two. The review composition is `MallChapter2StyleReview10Min`, exactly 18,000 frames at 30 fps. The full `MallChapter2` composition now renders the v10 still-screen cut (see `PRODUCTION.md`). The review enables `styleReview:true`; the default is false.

## Visual direction

The latest user-supplied image is the design reference: oversized pale softly shaded round heads, two oval eyes, thin black single-line torsos and limbs, black mitten hands, textured illustrated environments, restrained blue-gray nighttime lighting. Danny is identified by a navy security cap with a gold shield and his keys. Theo wears a muted green hood collar. Accessories and height distinguish them while keeping the faces simple.

Characters belong in the scene and visibly handle relevant props. Twenty-four complete illustrations are used in this opening, under `public/mall/ch2/story-art/`. They cover the ceiling danger hook, rooftop phone and radio, sleep, missing food, the closed gate, stockroom, chalk trail, discovery of the rack, Marcus's rounds, Theo's confrontation, trainer repair and the water decision. They were made using the built-in image-generation tool with the user's image as a style reference and the established mall backgrounds as location references. The generated `water-choice` scene anchors subsequent character consistency. Original reference artwork is kept outside the repository. Prompts are in `story-generation-prompts.json`, `story-expanded-prompts.json` and the two `story-*-prompt.txt` files.

Three additional draft images (`route`, `pump`, `bandage`) were generated before the scope was narrowed. They are saved for a possible later pass and are not included in the ten-minute review. No later video was rendered in this revision.

Selected fast physical actions use the original joint rig with an opt-in illustrated renderer. The quiet, investigation and dialogue shots use complete illustrated scenes, with alternating crops and restrained camera movement. Word cues and action progress are measured on the original source clock, so a camera cut cannot restart an animated action. Complete illustrations are not represented as fully animated character shots. The rejected wide ceiling illustration is excluded; the opening instead uses an upward boot view and a close rescue grip, preserving Theo on Danny's right.

## Story and timing

No narration, performance, sound mix, recap decision, editorial clip or scene order was changed. The original 13.6-second opening remains. The source recording, series outline and original retention-edit map are unchanged. The review is a working excerpt ending at 10:00, not a newly written ending or a finished full-chapter replacement.

There are 120 source views intersecting the opening. The three apparent source holds over ten seconds are inside the separately edited rooftop passage, which has its own 1.5–6.5-second cutaways. Other source views in this opening hold at most ten seconds. These view changes include both new illustrated scenes and animated detail cuts.

## Render

With dependencies installed:

```sh
node images/mall/chapter2/render-style-review.cjs
```

Set `REMOTION_BROWSER_EXECUTABLE` to an installed Chromium executable if needed. The output is `out/chapter2-style-review/night-guard-chapter-2-v9-first-10-minutes.mp4`. No generation key is needed. The checked-in finished audio master is used by default. Set `NIGHT_GUARD_AUDIO_REFERENCE` to the v10 MP4 when its encoded AAC should be copied directly (the v8 MP4 no longer lines up; see below).

The local delivery uses resumable one-minute picture segments, normalizes their video timescale to 90 kHz, and copies the opening encoded AAC from v8. It checks every frame timestamp, expected media properties, matching audio prefix and a complete decode. Verification results accompany the review delivery.

## Timing after the v10 merge

The review reads the shared edit map and audio master, so it now follows v10 timing. The opening is 13.47 seconds (the chapter title starts four frames later), and everything after it plays 0.3 seconds (nine frames) earlier than in v8, so the review ends 0.3 seconds further into the story. The checked-in audio master matches this timing. The review stays animated (it is not affected by the still-screen setting), and it now also has the v9 picture polish: fades at scene changes, no flash frames at edit points, section tags and the sub-pixel camera. The verification notes in `STYLE-REVIEW-VERIFICATION.md` describe the v8-based render.
