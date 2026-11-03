# Pisa Short — beat sheet (take 2: hook re-cut)

Script (66 words): "The Leaning Tower of Pisa has survived at least four strong earthquakes without damage. And what's protecting it is the same thing that made it lean. The ground under it is soft. A tall, stiff tower on soft soil sways to a different rhythm than the shaking ground, so the shaking doesn't build up. Basically, the soil that tilted it is the soil that saves it."

Voice: ElevenLabs premade "Chris" (via vidIQ); the 0.58 s pause after the first line was trimmed to 0.28 s with `scripts/tighten.py` (take2_raw.mp3 → take2.mp3). Placed at 0.10 s; take 21.77 s; composition 22.8 s @ 60 fps. Times are composition seconds. One continuous shot: the tower (leaning 5°, face drawn in code) on a lawn with the ground cut away below it.

Structure: open mid-earthquake on the result, open a loop ("the same thing that made it lean"), hide the answer under a "?", reveal it, explain it, and end with the shaking starting again, which is frame 0.

| Time | Words | On screen | Pictures / code | Sound |
|---|---|---|---|---|
| 0.00 | (frame 0) "The Leaning Tower of Pisa has survived" | Mid-earthquake: ground jitters, scientist wobbles on one leg, tower barely sways with a bored face | g_balance (mirrored), tower, quake | rumble |
| 1.98–2.64 | "at least four strong earthquakes" | Four quake badges thump in down the left side | code badges | small booms, pops |
| 3.0 | "earthquakes" | "SINCE 1280" badge | code | pop |
| 3.82 | "without damage" | "NO DAMAGE" tag on the tower | code | stamp |
| 4.9 | "what's protecting it" | Squash-swap: he props the tower up, as if it's him | g_push | whoosh |
| 5.98 | "the same thing" | Big red "?" pulses over the cut-away soil (the open loop) | code | pop, bloop |
| 7.12 | "that made it lean" | The tower creaks over a bit further, he pushes back | rotation | creak |
| 8.12–8.98 | "The ground under it is soft." | Camera tilts down; the "?" pops; the clay jiggles hard; "SOFT" tag; tower looks smug | g_clip (mirrored), jelly | whoosh, boing |
| 10.22 | "tall" | Height ruler grows beside the tower, "58 m" | code | zip |
| 10.62 | "stiff" | "STIFF" tag on the tower | code | stamp |
| 11.48 | "soft soil" | The clay jiggles again | code | bloop |
| 12.1–14.84 | "sways to a different rhythm than the shaking ground" | Demo shaking: ground jitters fast, tower sways slowly; two metronomes, the ground's fast and the tower's slow | Metronomes | rumble, ticks |
| 14.24–15.98 | "shaking ground. So the shaking" | A red ghost tower swings in step with the shaking, wider and wider (what resonance would do) | red silhouette | speed-up |
| 15.98 | "doesn't build up" | Big red X over the ghost; the real tower keeps its small, slow sway | XMark | stamp, shake |
| 17.62 | "Basically" | Camera back out; swap to thinking | g_hero (mirrored) | whoosh |
| 18.56 | "the soil" | The clay boundary glows | glow | sparkle |
| 19.02 | "that tilted it" | Little creak-and-lean wiggle | rotation | creak |
| 21.26 | "saves it" | Green shield pops over the clay; the tower winks; the shaking starts again and he wobbles | Shield, g_balance | big pop, shimmer, rumble |
| 21.8–22.8 | (end) | Mid-earthquake, bored tower = frame 0 (loop) | — | rumble |
