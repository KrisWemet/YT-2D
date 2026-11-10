# The Night Guard: Shorts 7–14 and the Chapter 1 hookup

Parts 1–6 are already on the channel. Parts 7–14 finish Chapter 1. They're cut straight from the finished chapter (`out/chapter1/night-guard-chapter-1.mp4`), so they look and sound exactly like it. The renderer is `src/mall/ChapterShorts.tsx` (`Ch1Part07` … `Ch1Part14`).

**Files:** `out/shorts/ch1/night-guard-part-07.mp4` … `-14.mp4`. They're 1080×1920, 30 fps, −15 LUFS, with burned-in captions.

## What changed after the first vidIQ read (Nov 10)

| What the numbers showed | What these Shorts do about it |
|---|---|
| About 40% of viewers left between 6 and 17 seconds, right where the hook gave way to backstory. | Lines that slow the opening were cut. The second line keeps the tension, and no Short opens with "Then…". |
| Only 55–64% of views got past the first moment. | The hook is in big text from the very first frame. |
| A third of the people still watching left during the end card. | There's no end card. Each Short ends on its cliffhanger line, so it loops straight back to the hook. |
| Each Short got 0–2 comments. | The last 3 seconds ask a question on screen, "TELL ME IN THE COMMENTS", and the pinned comment asks it again. |
| Two Shorts went up 5 hours apart on Nov 9. | One a day, at the same time. |

## Step 1: upload Chapter 1 first

The Shorts need somewhere to send people.
1. Upload `night-guard-chapter-1.mp4` using `night-guard-chapter-1.md`: a title from that file, the description with chapter times, and the captions file.
2. Pin this comment on it:
   ```
   Would you have opened the gate for Marcus? Be honest. 👇
   Chapter 2, The Boy in the Ceiling, is coming next.
   ```
3. On **every** Night Guard Short, parts 1–6 and each new one, go to Studio → the Short → **Related video** and choose Chapter 1. That puts a tappable link to the full chapter right on the Short.

## Step 2: post one Short a day

All the Shorts so far went up around 21:00 UTC, so keep that slot. Part 6 is scheduled for Nov 10 at 22:00 UTC, so Part 7 starts Nov 11.

The titles are hook-first and short. Drop the "| The Night Guard 1.x #animation #horrorstory" tail: the part number is already on screen.

| Part | Post (21:00 UTC) | Length | Title | Pinned comment |
|---|---|---|---|---|
| 7 | Nov 11 | 1:06 | My Best Friend Begged Me to Open the Gate | Would you have opened the gate? 👇 The whole night is on the channel: "The King of the Mall." |
| 8 | Nov 12 | 0:39 | A Stranger Called on My Dead Friend's Radio | Would you reach through the bars to turn it off? 👇 |
| 9 | Nov 13 | 0:42 | I Had to Take the Radio Off My Dead Best Friend | Could you have done it? 👇 |
| 10 | Nov 14 | 0:42 | A Stranger in My Locked Mall Knew My Name | Who do you think she is? Wrong answers welcome. 👇 |
| 11 | Nov 15 | 0:36 | My Best Friend Died Last Night. This Morning He's Doing His Rounds. | Rule one: they follow sound. What's your rule two? 👇 |
| 12 | Nov 16 | 1:13 | My Mom Sent One Text on Day One of the Outbreak | How would you get insulin across eight lanes of the dead? 👇 |
| 13 | Nov 17 | 1:09 | I Can See My Daughter's Window. I Can't Get to Her. | Would you have tried to cross? 👇 |
| 14 | Nov 18 | 0:49 | My Daughter Blinks "I Love You" Every Night. Tonight the Power Was Out. | Who do you think is in the window? 👇 Chapter 2 starts next. |

**Description for every part** (change the part number):
```
Part 7 of The Night Guard. A night guard with a key to every store gets locked inside his mall the night the dead rise. The full chapter is on the channel.

#zombie #horrorstory #animation
```

**Settings:** the same as the earlier Shorts (`night-guard-youtube-setup.md`): not made for kids, Film & Animation, "No" for altered or synthetic content. Add each one to "The Night Guard" playlist.

## Step 3: in the first hour after each post

- Reply to every comment. Early replies add to the comment count and bring people back.
- Heart the best answers to the question.

## Check again on Nov 22

That's when the vidIQ credits renew. Pull audience retention (where viewers stop watching) for Parts 7 and 12, and traffic sources for Chapter 1. If the early drop is gone and comments are up, cut Chapter 2's Shorts the same way.

## Re-render

```bash
npx remotion render src/index.ts Ch1Part07 out/shorts/ch1/raw-part-07.mp4 --crf=18 --pixel-format=yuv420p --audio-bitrate=256k
bash images/mall/finish.sh out/shorts/ch1/raw-part-07.mp4 out/shorts/ch1/night-guard-part-07.mp4
```

Each part is set up in `CH1_CUTS` in `src/mall/ChapterShorts.tsx`. `lines` lists the chapter lines to keep, and any gap becomes a jump cut. `hook` and `question` set the big on-screen text. The line numbers are the `segments` in `src/mall/chapter1/ch1.json`.
