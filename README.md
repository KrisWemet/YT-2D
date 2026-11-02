# YT-2D

Cut-out cartoon Shorts: AI pictures (transparent cut-outs) + Remotion code animation.

## Pigeon head-bob Short (`PigeonShort`, 24.9 s, 1080x1920 @ 60 fps, delivered 2160x3840)

| Folder | What |
|---|---|
| `images/pigeon/` | source pictures (`raw/`), keyed cut-outs (`keyed/`), prompts (`prompts.md`), beat sheet (`beats.md`), word times (`words.json`), QA sheets (`qa/`), scripts |
| `public/pigeon/` | final sprites, voice (`vo/take1.mp3`), sound effects (`sfx/`) |
| `src/pigeon/` | composition: `Short.tsx` (cuts), `Street.tsx`, `Lab.tsx`, `Close.tsx`, `CamGuy.tsx`, pigeon rig `Pigeon.tsx`, gait `gait.ts`, effects `fx.tsx`, sound `Sfx.tsx`, beat times `timing.ts`, generated `sprites.ts` |

Pipeline (scripts in `images/pigeon/scripts/`):

1. `kie.py image NAME ASPECT 2K PROMPT_FILE [refs...]` - GPT Image 2.5 via Kie.ai (needs `KIE_API_KEY`).
2. `key.py raw.png keyed.png` - flat background -> transparent, outline edge un-blended.
3. `prep_pigeon.py` - splits the hero pigeon into head / neck / body (legs, eye and eyebrow are drawn in code).
4. `prep_all.py` - measures every sprite and writes `src/pigeon/sprites.ts`.
5. `words.py voice.mp3 words.json` - faster-whisper word times + loudness pauses.
6. `sfx.py` - procedural one-shot sound effects + looped beds.

Render:

```bash
npm install
node scripts/stills.mjs out/qa 0.5 0 4.5 9.7 17.3 24.88    # stills at given seconds
npx remotion render src/index.ts PigeonShort out/pigeon-4K.mp4 --scale=2 --image-format=png --crf=16 --pixel-format=yuv420p
python3 scripts/popscan.py out/preview.mp4                    # flags sudden frame jumps
```
