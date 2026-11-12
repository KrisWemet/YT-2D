# The Night Guard: six remix Shorts from Chapter 1

Six more Shorts cut from Chapter 1, made for the people who haven't seen any Night Guard video yet. Each one tells a whole story in 2–3 minutes, **out of order**. It opens on a moment from deep in the night, rewinds on tape to how it started, then jumps ahead to a cliffhanger.

They reuse moments from Parts 1–14 on purpose. Most viewers haven't seen those, and each remix frames the night from a different angle: the friend, the daughter, the woman on the radio, the four-minute choice, the insulin, the rules.

**Files:** `out/shorts/ch1-remix/night-guard-remix-1.mp4` … `-6.mp4`. They're full-screen 9:16 (1080×1920), 30 fps, −15 LUFS, with burned-in captions, in the Codex stick-figure look, built from the same shots, voice and sound as the chapter. The renderer is `src/mall/RemixShorts.tsx` (`Ch1Remix1` … `Ch1Remix6`).

**Length:** 2:19–2:46. YouTube Shorts can be up to 3 minutes, so each one stays under that. A vertical video longer than 3:00 is posted as a regular video and doesn't go into the Shorts feed.

## How a remix reads

- **The hook:** big text on the first frame, over a cold open from late in the night (for example, Vera's voice from inside the sleeping bag).
- **Time jumps:** a clock at the top always says when we are. Every jump in time gets a one-second tape transition, ◀◀ or ▶▶, with a label like "EARLIER THAT NIGHT" or "THE NEXT MORNING". The transition holds two pictures only, so nothing flashes.
- **The ending:** each one ends on a cliffhanger line, then a question and "TELL ME IN THE COMMENTS". There's no end card, so it loops straight back to the hook.
- **Captions:** gold for Danny, green for Marcus on the radio, pink for the unknown woman.

## Post them one a day, in this order

Parts 7–14 run Nov 11–18 at 21:00 UTC, so the remixes start Nov 19 in the same slot. In this order, no two neighbours share a scene.

| # | Post (21:00 UTC) | Length | Title | Opens on | Ends on |
|---|---|---|---|---|---|
| 1 | Nov 19 | 2:43 | I Had the Key. I Didn't Open the Gate. | 2:31, Marcus stops breathing; 2:39, he stands up | Next morning, dead Marcus shakes Danny's gate on his rounds |
| 2 | Nov 20 | 2:19 | Rescue Is 30 Days Away. Her Insulin Runs Out in 10. | The two countdowns | "I'd be leading every one of them straight to her door." |
| 3 | Nov 21 | 2:46 | The Most Dangerous Thing in My Mall Isn't a Zombie | Vera: "Danny, right? I can hear you breathing." | Vera: "You've got all the keys, don't you?" |
| 4 | Nov 22 | 2:30 | The City Went Dark. Then My Daughter's Window Blinked. | 9:00, nothing; 9:01, nothing | Vera: "Who's in the window?" |
| 5 | Nov 23 | 2:43 | The Dead Are Coming. 4 Minutes to Pick a Store. | "Which one would you pick?" | Marcus at the gate. "I had the key in my hand." |
| 6 | Nov 24 | 2:25 | The Dead in My Mall Still Show Up for Work | The night cleaner pushing her cart into a wall | "Then my phone buzzed." A text from Mom, sent at 2:14 a.m. |

## Copy-paste fields

Every remix gets the same settings as the earlier Shorts (`night-guard-youtube-setup.md`): not made for kids, Film & Animation, and "No" for altered or synthetic content. Add each one to "The Night Guard" playlist. Then in Studio → the Short → **Related video**, choose Chapter 1, so there's a tappable link to the whole night.

**Tags** (the same for all six):

```
zombie story, zombie apocalypse, zombie shorts, zombie animation, animated story, survival story, zombie survival, scary story, horror story, storytime, the night guard, night guard, mall security guard, zombie mall, stick figure animation, apocalypse
```

### Remix 1: I had the key

**Title:**
```
I Had the Key. I Didn't Open the Gate.
```
**Description:**
```
My best friend got bitten, and I had the key to the gate. A night guard with a key to every store gets locked inside his mall the night the dead rise. The whole night is on the channel: Chapter 1, "The King of the Mall."

#zombie #horrorstory #animation
```
**Pinned comment:**
```
Would you have opened the gate for Marcus? Be honest. 👇
```

### Remix 2: Ten days

**Title:**
```
Rescue Is 30 Days Away. Her Insulin Runs Out in 10.
```
**Description:**
```
I'm locked inside my mall with the dead. My mom and my daughter are a mile and a half away, across eight lanes of them. The whole night is on the channel: Chapter 1, "The King of the Mall."

#zombie #survival #animation
```
**Pinned comment:**
```
30 days to rescue, 10 days of insulin, eight lanes of the dead. What would you do? 👇
```

### Remix 3: It isn't a zombie

**Title:**
```
The Most Dangerous Thing in My Mall Isn't a Zombie
```
**Description:**
```
I locked every door at midnight. At 3 a.m., a woman on the radio knew my name. The whole night is on the channel: Chapter 1, "The King of the Mall."

#zombie #mystery #animation
```
**Pinned comment:**
```
What do you think the B3 key opens? Best theory gets a ❤️ 👇
```

### Remix 4: Who's in the window

**Title:**
```
The City Went Dark. Then My Daughter's Window Blinked.
```
**Description:**
```
Every night at nine, my daughter blinks "I love you" at the mall. Then the whole city went dark. The whole night is on the channel: Chapter 1, "The King of the Mall."

#zombie #horrorstory #animation
```
**Pinned comment:**
```
Who do you think the woman on the radio is? 👇
```

### Remix 5: Four minutes

**Title:**
```
The Dead Are Coming. 4 Minutes to Pick a Store.
```
**Description:**
```
They were heading for the food court, and the food court is made of glass. I had four minutes and a key to every store. The whole night is on the channel: Chapter 1, "The King of the Mall."

#zombie #survival #animation
```
**Pinned comment:**
```
Pharmacy, food court, department store or Summit Outdoors. Which one are you picking? 👇
```

### Remix 6: Still at work

**Title:**
```
The Dead in My Mall Still Show Up for Work
```
**Description:**
```
The morning after, the dead went back to their old jobs. My best friend was still doing his rounds. The whole night is on the channel: Chapter 1, "The King of the Mall."

#zombie #horrorstory #animation
```
**Pinned comment:**
```
Mom texted at 2:14 a.m. What do you think it says? 👇
```

## After each post

- In the first hour, reply to every comment and heart the best answers, as with Parts 7–14.
- On Nov 22 (vidIQ credits renew), compare Remix 1–3 with Parts 7 and 12: how many viewers get past the first 5 seconds, where they leave, and comments per view. If the remixes hold viewers longer, cut Chapter 2's Shorts this way too.

## Re-render

```bash
npx remotion render src/index.ts Ch1Remix1 out/shorts/ch1-remix/raw-remix-1.mp4 --crf=18 --pixel-format=yuv420p --audio-bitrate=256k
bash images/mall/finish.sh out/shorts/ch1-remix/raw-remix-1.mp4 out/shorts/ch1-remix/night-guard-remix-1.mp4
```

Each remix is set up in `CH1_REMIXES` in `src/mall/RemixShorts.tsx`, as a list of beats. Each beat has:
- `lines`: the chapter lines to play, in any order. These are the `segments` in `src/mall/chapter1/ch1.json`, 0–188.
- `clock`: the time shown at the top.
- `jump` and `rel`: the tape transition into the beat and its label.
- `trim`: an optional cut of the breath before the beat's first word.

`hook` and `question` set the big on-screen text. Change a beat and every time and caption follows by itself.
