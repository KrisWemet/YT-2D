# videos/: one folder per Short

Each folder `videos/<slug>/` is the handoff from **WQL Studio** (research, scripts, fact-checks) to **the video build** (Remotion, in `src/`). A build session starts by reading the folder. Everything needed to make the Short is in these files, and nothing else needs to be looked up.

The format is versioned. Don't change it casually: the Studio renderer (`studio/lib/handoff/render.mjs`), the JSON Schemas in `videos/schema/` and this README change together, and a breaking change gets a new `schema` version.

## Files

| File | Written by | What it is |
|---|---|---|
| `script.md` | Studio | The human-readable script: voice-over, hook, loop and tease, a beat table, frame 0, pictures to draw, packaging, publishing checklist |
| `storyboard.json` | Studio | The beats as data (`wql.storyboard/1`, [schema](schema/storyboard.v1.schema.json)). This is what the build works from. |
| `meta.json` | Studio | Title options, description (with sources), tags, pinned comment, series and previous/next Short (`wql.meta/1`, [schema](schema/meta.v1.schema.json)) |
| `fact-check.md` | Studio | Every factual claim with confidence, status (ok / resolved / flagged / cut) and sources |
| `build.json` | the build | *(Optional, from Phase 5.)* Real beat start and end times after the voice-over, the composition ID and the YouTube video ID, for retention analysis |

**Studio overwrites its four files on every export, so don't hand-edit them.** If the words need to change during the build, ask for a new script version (queue the idea again with a note, or say so in the session). That keeps Studio, the fact-check and the files in step.

## How a folder gets here

1. An idea is queued in Studio, then scripted and fact-checked by the weekly session (see `docs/weekly-batch.md`).
2. The owner reviews the script in Studio and resolves any flagged claims. The database won't let an idea be *ready* while a claim is flagged.
3. Once the idea is **ready**, a session exports it:

   ```bash
   node studio/scripts/batch.mjs export <slug>   # writes videos/<slug>/ and records the handoff in Studio
   ```

   The command refuses ideas that aren't ready yet, unless you pass `--force`, which only the backfill of already-published Shorts uses. It needs `SUPABASE_SECRET_KEY` in the environment.
4. The folder is committed to `main` (only `videos/<slug>/`), and the Short gets built from it.

## storyboard.json in one example

```json
{
  "schema": "wql.storyboard/1",
  "slug": "hurricane-nuke",
  "question": "Why don't we just nuke a hurricane?",
  "script_version": 1,
  "est_duration_s": 20.6,
  "voice": { "provider": "ElevenLabs via vidIQ", "voice": "Chris" },
  "frame0": { "description": "Scientist on the beach holding a lit bomb; a huge hurricane asleep over the sea", "thumbnail_text": "JUST NUKE IT?" },
  "loop": { "last_line": "You'd probably keep the storm and add radiation.", "returns_to": "frame0", "description": "He pulls out another bomb; the storm falls asleep again" },
  "cast": ["scientist", "hurricane"],
  "assets": [{ "id": "g_bomb_hold", "kind": "pose", "description": "Scientist holding a round black bomb with a radiation symbol", "aspect": "2:3" }],
  "beats": [
    {
      "n": 1,
      "line": "Why don't we just nuke a hurricane?",
      "cue_word": "hurricane",
      "est_start_s": 0,
      "est_duration_s": 2.3,
      "visual": "Fuse sparks grow; on \"hurricane\" the storm's eyes pop open and stare at him",
      "camera": null,
      "on_screen_text": null,
      "sfx": [{ "cue": "fuse" }, { "cue": "pop_big", "at_word": "hurricane" }],
      "music": null,
      "assets": ["g_bomb_hold"],
      "claim_ids": [],
      "gag": "The hurricane wakes up exactly on its own name"
    }
  ],
  "next_tease": null
}
```

- **Beats** follow the existing beat sheets (`images/*/beats.md`): one narration line per beat, a visual that lands on a **cue word**, on-screen text, and sound cues tied to words.
- **Times** (`est_start_s`, `est_duration_s`) are estimates from the word count. After the voice-over is recorded, `words.py` gives real word times, and each beat's `cue_word` becomes an entry in that Short's `timing.ts` `T` map, as in `src/hurricane/timing.ts`.
- **`claim_ids`** link a beat to the claims in `fact-check.md`. A beat that states a fact must cite it.
- **`assets`** are the pictures to generate, one entry per pose or prop, like `images/*/prompts.md`. The style rules for drawing them are in the root README ("The house style").
- **`next_tease`** names the next Short in the series. It's teased in the description, the pinned comment, the related-video link and optionally on screen, **not in the voice-over**, so the loop back to frame 0 stays intact.

## Building a Short from its folder (checklist for the build session)

1. Read `script.md` and `fact-check.md`. Only say what the fact-check supports, and keep the hedges ("probably", "mostly").
2. Generate the voice-over from the narration lines, then get word times with `images/pigeon/scripts/words.py`.
3. Write `images/<slug>/beats.md` with real times. Generate the pictures listed under `assets` (`kie.py`), then key and measure them (`key.py`, `prep*.py`).
4. Animate in `src/<slug>/` with `timing.ts` keyed by cue words. Register the composition in `src/Root.tsx`.
5. Run the QA scripts in `scripts/`, then render.
6. Package from `meta.json`: title, description, tags, pinned comment, playlist, related video.
7. Once it's live, paste the YouTube video ID into the idea in Studio and set it to *published*.

## Folders

| Folder | Short | Status |
|---|---|---|
| `pigeon-head-bob/` | Why do pigeons bob their heads? | published (backfilled from the first build) |
| `hurricane-nuke/` | Why don't we just nuke a hurricane? | published (backfilled from the first build) |
