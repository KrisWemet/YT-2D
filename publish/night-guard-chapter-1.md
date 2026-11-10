# The Night Guard: Chapter 1 upload details

**Video:** `out/chapter1/night-guard-chapter-1.mp4`. It's 1920×1080 at 30 fps and runs 14:42 (14:33 of story, then a 9-second end card). The sound is mixed to −15 LUFS.

**Captions:** `publish/night-guard-chapter-1.srt` (363 captions, at most two lines of 42 characters). The words come from the script, not from automatic speech recognition, so names, numbers and capitals are right. Radio voices are labelled, for example [WOMAN ON THE RADIO].

## Title

Use one of these:

- My Best Friend Knocked on My Gate. I Didn't Open It. | The Night Guard, Chapter 1
- I Was the Mall's Night Guard When the Dead Walked In | The Night Guard, Chapter 1
- The Night Guard, Chapter 1: The King of the Mall | Zombie Survival Story

## Description

```
Danny Ruiz is the night guard at Maplecrest Mall. He has a key to every store. Every night his daughter blinks her lamp at the mall from across the highway, and at 1 a.m. his best friend radios him a terrible joke. Tonight, his best friend whispered.

The Night Guard is an animated zombie survival story told in chapters. One mall, every key, and 30 days until rescue.

0:00 The zombie at my gate
0:25 Forty-two keys
1:47 The 1 a.m. joke
2:37 Camera six
4:06 Four minutes to pick a store
5:01 Key thirty-one
6:16 The last joke
7:36 The radio on his chest
8:20 Through the bars
9:03 She knew my name
9:52 The first rule
11:06 Thirty days
12:25 The roof
13:43 Three blinks

Next: Chapter 2, The Boy in the Ceiling.

#zombie #survival #animation
```

The chapter times come from the narration's word timings, so they're exact. YouTube needs the first one at 0:00, at least three chapters and at least 10 seconds per chapter. This list meets all three.

## Settings

- **Category:** Film & Animation
- **Tags:** zombie story, zombie survival, animated story, night guard, mall zombie apocalypse, survival story, stick figure animation, horror story animated, 30 days, the night guard
- **Audience, age restriction, paid promotion, altered or synthetic content, language:** the same as for the Shorts (see the settings table in `night-guard-youtube-setup.md`). That's not made for kids, no age restriction, and "No" for altered content, because it's clearly animated fiction.
- **Captions:** Subtitles → Add language → English → Upload file → "With timing" → choose `night-guard-chapter-1.srt`.
- **End screen:** the last 9 seconds are the "Next: Chapter Two" card, with the text in the middle. Put a Subscribe element and a "Best for viewer" video on either side of it.
- **Playlist:** add it to "The Night Guard" playlist, after Shorts 1–3. The Shorts are cut from this chapter, so they lead viewers here. Each Short's pinned comment can link to this video once it's up.
- **Pinned comment:** "Would you have opened the gate for Marcus? Be honest. 👇 Chapter 2, The Boy in the Ceiling, is coming next."
- **Link the Shorts to it:** on every Night Guard Short, go to Studio, choose the Short, then Related video, and pick this chapter. The Shorts then carry a tappable link to the full chapter. See `night-guard-shorts-7-14.md`.
- **Upload it before Part 7 (Nov 11).** So far the Shorts have nowhere to send viewers.
- **Thumbnail:** there's no custom one for the long video yet. Until there is one, pick the auto frame with zombie Marcus at the gate.

## How it was made

- **Script:** `images/mall/chapter1/script.md`. It's about 2,500 words in 14 sections. `images/mall/chapter1/make_plans.py` writes the script and the voice plan, so edit that file, not the outputs.
- **Voice:** `images/mall/vo/ch1/plan.json` follows the approved v10 recipe (`images/mall/voice-recipe.md`): Algenib for Danny, Orus for Marcus, Gacrux whispering for the woman and Charon for the emergency broadcast. Each line uses the calmest take that matches the reference voice (`pick_takes.py`). The chosen takes are in `vo/ch1/takes/`.
- **Pictures:** 265 shots (`src/mall/chapter1/shots01.tsx`–`shots04.tsx`), about one every 3.3 seconds. Each shot is cued by a phrase in the narration, so a new recording re-times every cut. `python3 images/mall/chapter1/check_cues.py src/mall/chapter1/ch1.json` checks every cue and lists the longest shots.
- **New for this chapter:** three backgrounds (the roof, the stockroom and Lily's apartment) and eight sounds (a knock, a helicopter, wind, a gate rattle, a creak, a phone buzz, a busy signal and an emergency alert tone). The cards include the map, the radio, the phone, the alert, lists, two clocks, a news ticker, a napkin plan and polaroids.

## Re-render

```bash
cd images/mall
python3 voice_gemini.py vo/ch1/plan.json vo/ch1        # rebuild the voice from the chosen takes (records only missing takes)
bash vo_export.sh vo/ch1/vo.wav ../../public/mall/ch1/vo.mp3
python3 align.py vo/ch1/vo.wav vo/ch1/segments.json ../../src/mall/chapter1/ch1.json
python3 caption_words.py ../../src/mall/chapter1/ch1.json
python3 chapter1/check_cues.py ../../src/mall/chapter1/ch1.json
python3 make_srt.py ../../src/mall/chapter1/ch1.json ../../publish/night-guard-chapter-1.srt
cd ../..
npx remotion render src/index.ts MallChapter1 out/chapter1/night-guard-ch1-render.mp4 --concurrency=4 --crf=18 --pixel-format=yuv420p --audio-bitrate=256k
bash images/mall/finish.sh out/chapter1/night-guard-ch1-render.mp4 out/chapter1/night-guard-chapter-1.mp4
```

The full render takes about an hour on 4 cores.
