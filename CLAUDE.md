# Working in this repo

This repo is two things:

- **The video build** (Remotion) at the root: `src/`, `public/`, `images/`, `scripts/`.
- **WQL Studio** in `studio/`: the research and planning app, with its own package.

## Building a Short

1. Start from its folder, `videos/<slug>/`. Read `videos/README.md` first: it documents the four files and has the build checklist.
2. Treat `script.md`, `storyboard.json`, `meta.json` and `fact-check.md` as read-only inputs. Studio rewrites them on export.
3. If the words must change, ask for a new script version instead of editing those files.
4. Only say what `fact-check.md` supports, and keep its hedges.
5. Follow the house style in `README.md`: 30–60 s, hook in the first 2 s, a loop back to frame 0, and no voiced calls to action.

To export a ready idea from Studio:

```bash
node studio/scripts/batch.mjs export <slug>
```

This needs `SUPABASE_SECRET_KEY` in the environment.

## Weekly batch

Every Sunday at 12:45 pm Mountain, a scheduled session runs `docs/weekly-batch.md`. It produces themes, scripts, fact-checks and exports.

## Studio

Setup, the data model and the commands are in `studio/README.md`. Before pushing changes to `studio/`, run:

```bash
cd studio && npm test && npm run typecheck && npm run lint
```

Never print, log or commit keys. They live in Vercel and in this cloud environment's settings.
