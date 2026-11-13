# The Night Guard: project file

A stick-figure zombie survival story for YouTube. It has long chapters (16:9) and Shorts (9:16) cut from them. Still pictures change every 2–3 seconds, cut on the spoken word, under Danny's first-person narration.

> A night guard with a key to every store gets locked inside his mall the night the dead rise. His seven-year-old daughter is a mile and a half away across the highway and blinks a flashlight at him every night. The woman on the radio wants the one key he was told never to use.

- **Series plan:** `images/mall/series-outline.md`. Book One, *Forty-Two Keys*, has six chapters covering 30 days in the mall.
- **Voice recipe:** `images/mall/voice-recipe.md`. Use the approved v10 voice for every new line.
- **Code:** `src/mall/`, rendered with Remotion. The compositions are registered in `src/Root.tsx`.

## Status

| Item | Format | Length | Status | Upload kit |
|---|---|---|---|---|
| Chapter 1: The King of the Mall | 16:9, 1080p | 14:42 | ✅ Rendered in the Codex look (Nov 11) | `publish/night-guard-chapter-1.md` + `.srt` |
| Short 1: The Gate | 9:16 | 0:24 | ✅ Rendered, thumbnail made | `publish/night-guard-youtube-setup.md` |
| Short 2: Forty-Two Keys | 9:16 | 1:01 | ✅ Rendered | `publish/night-guard-shorts-1-3.md` |
| Short 3: One-Forty | 9:16 | 0:48 | ✅ Rendered | `publish/night-guard-shorts-1-3.md` |
| Shorts 1.4–1.6 | 9:16 | 0:58–1:32 | ✅ Posted Nov 9–10 (by you) | |
| Shorts 7–14, cut from Chapter 1 | 9:16 | 0:36–1:13 | ✅ Rendered, post one a day from Nov 11 | `publish/night-guard-shorts-7-14.md` |
| Remix Shorts 1–6, cut from Chapter 1 out of order | 9:16 | 2:19–2:46 | ✅ Rendered (Nov 12), post one a day from Nov 19 | `publish/night-guard-ch1-remix-shorts.md` |
| Chapter 1 thumbnail (16:9) | still | | ⬜ To make | |
| Chapter 2: The Boy in the Ceiling | 16:9 | ~21:00 | 📝 Script rewritten for pace (Nov 13): 3,585 words, was 5,233. The first draft is kept as `manuscript-v1.md` | `images/mall/chapter2/manuscript.md` |
| Chapter 3: The Pharmacy | 16:9 | ~31:00 | 📝 Script done (5,367 words) | `images/mall/chapter3/manuscript.md` |
| Chapter 4: Across the Highway | 16:9 | ~30:00 | 📝 Script done (5,100 words) | `images/mall/chapter4/manuscript.md` |
| Chapter 5: The Fall of the King | 16:9 | ~30:00 | 📝 Script done (4,808 words) | `images/mall/chapter5/manuscript.md` |
| Chapter 6: Key Forty-Two | 16:9 | ~30:00 | ⬜ Planned | outline |
| Channel picture and banner | stills | | ✅ Done | `publish/channel/` |

## Long videos (chapters)

Each chapter runs about 15 minutes and is built in this order: **script, then voice, then pictures cut to the voice.**

1. **Script:** `images/mall/chapterN/make_plans.py` writes `script.md` and the voice plan. Edit that file, not its outputs.
2. **Voice:** `cd images/mall && python3 voice_gemini.py vo/chN/plan.json vo/chN`. Pick takes with `pick_takes.py`, then build `vo.wav`.
3. **Timings:** `align.py`, then `caption_words.py`, write the word timings to `src/mall/chapterN/chN.json`.
4. **Pictures:** write the shot lists in `src/mall/chapterN/shots0*.tsx`, each shot cued by a phrase in the narration. Check them with `check_cues.py`.
5. **Render:** `npx remotion render src/index.ts MallChapter1 out/chapter1-codex/night-guard-ch1-render.mp4 --concurrency=4 --crf=18 --pixel-format=yuv420p --audio-bitrate=256k`, then `bash images/mall/finish.sh <render> <final>` to bring the sound to −15 LUFS.
6. **Captions:** `python3 images/mall/make_srt.py src/mall/chapterN/chN.json publish/night-guard-chapter-N.srt`.

The Chapter 1 steps are in full in `publish/night-guard-chapter-1.md`.

## Shorts

Every chapter is 14 segments of about 2½–3 minutes, and each segment can be cut into a Short. The rules are in the outline, under "How every chapter splits into Shorts":

- **Hook:** the first 2 seconds work for a brand-new viewer.
- **Turn:** one problem and one turn.
- **Cliff:** end on a question.
- **Title:** use the hook, never "Part 7".
- **End card:** "The full chapter is on the channel."
- **Schedule:** one Short a day, so one chapter gives about two weeks of Shorts.

How they're made:

- **Scripts:** `images/mall/shorts/ch1-shorts-1-3.md`.
- **Code:** `src/mall/shortsCh1.tsx`, with `MallShort.tsx` as the generic renderer and the vertical toolkit in `vertical.tsx`.
- **Captions:** burned in word by word, in gold for Danny and green for radio voices.
- **Render:** `npx remotion render src/index.ts MallShort1 out/shorts/raw-1.mp4 --crf=18 --pixel-format=yuv420p --audio-bitrate=256k`, then `finish.sh`.
- **Thumbnail:** `src/mall/ShortThumbs.tsx`. `images/mall/append_thumb.sh` adds the thumbnail as the last frames, so it can be picked in the YouTube app.

**Remix Shorts** (`src/mall/RemixShorts.tsx`) are a second kind, for viewers who haven't seen anything yet. They run 2–3 minutes and are cut from anywhere in a chapter, out of order. Each opens on a moment from deep in the night, rewinds on tape to how it started, and jumps ahead to a cliffhanger. A clock at the top says when each moment happens, and every jump in time gets a ◀◀ or ▶▶ transition with a label ("THE NEXT MORNING"). A remix is a list of beats, and each beat is a set of chapter lines, so a new remix needs no new pictures or voice. Keep each one under 3:00, YouTube's limit for a Short.

## Characters

| Character | Voice (Gemini on Kie.ai) | Look |
|---|---|---|
| Danny Ruiz, night guard (narrator) | Algenib, Deadpan, tempo 1.08 | navy uniform, guard cap, moustache, keys |
| Marcus, 22, garage guard and nursing student | Orus | navy uniform, beard, radio on his chest (worn upside down) |
| Lily, 7, Danny's daughter | — | pink shirt, pigtails |
| Vera, the woman on the radio | Gacrux, whispering | not shown yet |
| Emergency broadcast | Charon | |

**Look (chosen Nov 11):** Codex's stick-figure style, with thin ink arms and legs and the same heads and uniforms (`src/mall/Stick.tsx`, before/after in `docs/night-guard-stick-figures.jpg`). Every new scene uses it. Earlier style options are in `publish/characters/`.

## Where things live

| What | Where |
|---|---|
| Rendered videos (not in git, download them) | `out/chapter1-codex/` (Chapter 1), `out/shorts/ch1-full/` (Parts 7–14), `out/shorts/ch1-remix/` (Remix Shorts 1–6); older looks in `out/chapter1/`, `out/shorts/ch1/`, `out/shorts/ch1-codex/` |
| Upload kits: titles, descriptions, captions | `publish/night-guard-*.md`, `publish/night-guard-chapter-1.srt` |
| Channel art and thumbnails | `publish/channel/`, `thumbnails/` |
| Backgrounds and sounds | `public/mall/bg/`, `public/mall/sfx/` (prompts in `images/mall/prompts.json`, `sfx_gen.py`) |
| Voice takes | `images/mall/vo/<round>/takes/` |

## Costs (Kie.ai credits)

- **Chapter 1:** about 278 credits (~$1.40), mostly for the voice.
- **Shorts 1–3:** about 51 credits.
- **Remix Shorts 1–6:** none. They reuse the chapter's pictures, voice and sound.
- **Each new background:** 3.24 credits.
- **Each new sound:** 2.5 credits for two variants.

The balance was 412.74 on Nov 6, 2026.

## Next up

1. Upload Chapter 1 (new look), then post Parts 7–14 one a day from Nov 11 (`publish/night-guard-shorts-7-14.md`).
2. Post Remix Shorts 1–6 one a day from Nov 19 (`publish/night-guard-ch1-remix-shorts.md`).
3. Make a 16:9 thumbnail for Chapter 1.
4. Voice and build Chapter 2. The tighter script needs about 360 Kie credits (the first draft needed about 520). The last recorded balance was 412.74, on Nov 6.
5. Write Chapter 6, *Key Forty-Two*.
6. Nov 22: re-check vidIQ retention for Parts 7 and 12, with vidIQ connected to the right account, and compare the first remixes with them.
