# Day 1: Before We Go — cold open beat sheet

Composition `Day1ColdOpen`: 1920×1080, 30 fps, 30.0 s. All times are composition seconds and live in
`src/day1/cues.json`, which both the animation (`src/day1/*.tsx`) and the sound script (`sfx.py`) read.

## Script

> **Cold Open (0:00 to 0:30)**
>
> [Night. A gas station off a dark highway. Lights flickering. A pickup and trailer parked crooked at the pumps, driver door hanging open.]
>
> [Fast cuts. A jerry can tipped over, gas glugging onto concrete. Something slams against the truck's passenger window. A handprint smears down the glass.]
>
> [Samantha, overalls and black work boots, halfway up a rusty roof ladder on the side of the station. Knuckles white. Shaking.]
>
> [Below her, shapes in the dark. Hands reaching for her boots.]
>
> MARCUS (O.S., shouting): Sam! Don't look down! Look at me! LOOK AT ME!
>
> [She looks down.]
>
> [Hard cut to black. Silence.]
>
> SAMANTHA (V.O.): Three days before this, my biggest worry was a missed paycheck.
>
> [Title card: DAY 1]

## Shots

| Time | Shot | On screen | Sound |
|---|---|---|---|
| 0.00–5.00 | `Establish` | Wide: the station off an empty highway, canopy lights flickering. A red pickup and a jackknifed trailer sit crooked at the pumps, headlights on, driver door hanging open with the dome light lit. A tipped jerry can by the trailer. The roof ladder is on the side wall. From 2.4 s a shape shuffles at the edge of the light. Slow push-in. | crickets, wind, fluorescent buzz with a zap at each flicker, door-ajar chime, low drone, a distant groan (3.1) |
| 4.42–5.00 | | | short riser into the cut |
| 5.00–6.50 | `JerryCan` | Fast cut, low on the concrete: the red jerry can on its side, gas glugging from the spout in pulses into a spreading puddle with an oily sheen; the canopy tubes reflect in it. Blurred pump and truck tire behind. | impact hit, glugs synced to the pulses, can clunk |
| 6.50–8.40 | `Window` | Inside the cab, looking at the passenger window. A shape crosses the light outside (6.62). **6.95:** a hand slams flat on the glass (white flash, shake, the lights drop out), then drags down out of frame (7.17–7.95), leaving a smeared handprint. | outside muffled, chime louder inside the cab; slam, muffled groan, squeak on the glass |
| 8.40–10.90 | `LadderShot` | Samantha from behind, halfway up the rusty ladder: denim overalls, mustard shirt, black work boots, messy bun. Shaking, breathing hard, lit by a caged wall lamp and Marcus's flashlight from the roof. **9.10 "Sam!"**: she flinches and turns her head up. 9.95: her right boot slips off a rung and re-plants, rust flakes fall. 9.75–10.75: the camera tilts down to hands rising out of the dark below. | heartbeat starts and speeds up, ladder creaks, gasp, clang, crowd of groans |
| 10.90–12.10 | `KnucklesShot` | Extreme close-up: both hands on a rusty rung, knuckles white, trembling. **11.12 "Don't look down!"**: she squeezes harder; rust flakes drop. | close creak, flakes |
| 12.10–14.50 | `BootsShot` | Her black work boots on the rungs. Hands reach up out of the dark, grasping; one brushes her heel (13.15) and she yanks the boot up. **13.50 "Look at me!"** | groans close, hands slapping rungs, scuff, gasp, clang |
| 14.50–17.50 | `FaceShot` | From the roof: Samantha looks up into the flashlight, clinging to the rails, breath fogging. **14.78 "LOOK AT ME!"**: she blinks, eyes lock on him. 16.50: her eyes slowly drift down. 16.7: the camera pushes into her eyes. 17.05: her pupils shrink. | heartbeat and drone peak, riser, whine |
| **17.50** | — | **Hard cut to black.** | everything stops on the cut frame |
| 17.50–19.60 | black | Silence. | none |
| 19.60–23.20 | black | | **SAMANTHA (V.O.): "Three days before this, my biggest worry was a missed paycheck."** with a quiet warm pad |
| 24.00–30.00 | `Title` | **DAY 1** flickers on like the station lights (24.00–24.30), then "BEFORE WE GO" types in (25.30). Slow push; fade out 29.3–29.9. | deep hit, zaps on the flickers, typewriter clicks, room tone |

## Voices

Generated offline with Kokoro TTS (`vo.py`): Marcus is `am_fenrir`, processed to sound like shouting from a few metres
away (pitch up, drive, presence boost, slap-back off the wall); Samantha's voice-over is `af_heart`, close and dry.
Kokoro can't really shout, so these are placeholders until the lines are recorded or regenerated with ElevenLabs.
To swap a take, replace `public/day1/vo/<name>.wav` and, if its length changes, the time in `cues.json` → `vo`.
