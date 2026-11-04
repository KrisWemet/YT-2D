# WQL Studio: plan

WQL Studio is the research and planning tool for **Weird Questions Lab** (channel `UCjUsCUNfU6Ladj1ktmn6EBQ`). It has two jobs:

1. **What to make:** track competitor channels, spot outliers, plan series and score packaging.
2. **How it gets made:** hand each finished script to the video build as files in this repo (`videos/<slug>/`).

## Where it lives

A subfolder app in this repo, with its own `package.json`. The Remotion build at the repo root is not touched.

```
YT-2D/
  src/ public/ images/ scripts/      Remotion build (unchanged)
  studio/                            Next.js app (Vercel "Root Directory" = studio)
    app/ lib/ supabase/migrations/ tests/ vercel.json .env.example
  videos/                            the handoff between Studio and the build
    README.md                        the format spec
    schema/                          JSON Schema for storyboard.json and meta.json (versioned)
    <slug>/ script.md storyboard.json meta.json fact-check.md [build.json]
  data/seed-channels.json            seed watchlist
  CLAUDE.md                          tells each build session to start from videos/<slug>/
```

- **Why the same repo:** the handoff files land where videos are built, and one Claude Code session sees both sides of the format.
- **Why a separate package:** Next.js and Remotion pin their own React and bundlers, so no npm workspaces for now.
- **One format definition:** zod schemas in `studio/lib/handoff/` generate `videos/schema/*.json`, and a test fails if they drift apart.
- **Deploys:** Vercel builds only when `studio/` changes (`ignoreCommand`), so handoff commits and video code don't redeploy the app.

## How Studio and the build connect

1. **Studio → repo.** When an idea reaches *ready*, Studio commits `videos/<slug>/` straight to `main` as one commit through the GitHub API. It uses a fine-grained token limited to this repo's contents, and only ever writes inside `videos/`. Fallback: `npm run pull <slug>` writes the same files from Supabase.
2. **The storyboard follows the existing build.** Beats are anchored on a cue word, like `T` in `src/*/timing.ts`, and carry estimated seconds. Each beat has: narration line, cue word, visual, camera, on-screen text, sound cues tied to words, assets and claim IDs. Assets are listed once, like `images/*/prompts.md`, and there are `frame0` and `loop` blocks. The build replaces estimates with real word times after the voice-over.
3. **Build → Studio.** After rendering, the build writes `videos/<slug>/build.json` with the real beat start and end seconds, the composition ID and the YouTube video ID. Studio reads it back so Phase 5 maps retention drop-offs to exact beats.
4. **Backfill.** The pigeon and hurricane Shorts are converted into `videos/pigeon-head-bob/` and `videos/hurricane-nuke/` in Phase 3.

## Decisions

| Question | Decision |
|---|---|
| Handoff target | Commit directly to `main`, only inside `videos/<slug>/` |
| Script length | 30–60 s, keep the loop back to frame 0. The next-Short tease goes in the Short's related video, description and pinned comment, optionally as an unvoiced on-screen tease. |
| Shorts detection | Duration-based (documented data only). ≤60 s is a Short. 61–180 s uploaded on or after 2024-10-15 is a likely Short, with `#shorts` in the title or description as a tie-breaker. Manual override per video. The undocumented `UUSH…` playlist ID pattern is not used. |
| My channel | Tracked as tier `mine`, now named Weird Questions Lab |
| Hosting | Vercel Hobby (crons at most once a day), Supabase project `wql-studio` (us-east-1), set up through the connectors |
| Google account | Personal. The OAuth app must be set to "In production" (unverified is fine for one user), because in "Testing" mode refresh tokens expire after 7 days. |
| Backfill existing Shorts | Yes, in Phase 3 |
| AI work | A dedicated Claude Code session, woken by a scheduled task every Sunday at 12:45 pm Mountain, instead of Anthropic API calls from the app until API keys are added. It reaches the database through `studio/scripts/batch.mjs`, using the `SUPABASE_SECRET_KEY` stored in the cloud environment. Runbook: `docs/weekly-batch.md`. |
| More channels | Planned (5–7 channels). From Phase 2, every idea, series, theme run and tracked channel belongs to a `project` (one per YouTube channel). Weird Questions Lab is project `wql`. |

## Data model

| Table | Purpose and main columns |
|---|---|
| `channels` | YouTube channel ID (PK), handle, title, subs, tier (`direct`/`rising`/`format`/`benchmark`/`mine`), why, uploads_playlist_id, thumbnail_url, active, added_at, last_synced_at |
| `videos` | YouTube video ID (PK), channel_id, title, published_at, duration_s, format (`short`/`long`), format_source (`duration`/`hashtag`/`manual`), thumbnail_url, latest views/likes/comments, stats_updated_at |
| `video_snapshots` | video_id, captured_on (one row per day), views, likes, comments |
| `channel_baselines` | channel_id, format, median_views, sample_size, computed_at (history kept) |
| `outliers` | video_id (unique), format, multiple, baseline_median, views, views_per_day, status (`new`/`saved`/`dismissed`), detected_at, updated_at |
| `series` | name, slug, description, playlist_id, sort_order |
| `ideas` | question, slug, series_id, position_in_series, status, source, source_outlier_id, scores, notes, youtube_video_id |
| `idea_events` | Log of status changes |
| `scripts` | idea_id, version (unique per idea), is_current, hook, body, loop_ending, next_tease, storyboard (JSON), model, prompt_version |
| `claims` | script_id, claim, confidence, status (`ok`/`flagged`/`resolved`/`cut`), sources (JSON). The database blocks an idea from moving to *ready* while a claim is flagged. |
| `packaging_scores` | Predicted scores for titles and thumbnail concepts, later compared with real results |
| `my_video_stats`, `retention_curves`, `dropoffs` | Phase 5 analytics |
| `theme_runs` | Weekly clustering runs and suggested questions |
| `handoffs` | Every `videos/<slug>/` commit (idea, script version, commit SHA) |
| `api_usage` | One row per call: api, endpoint, units, tokens, cost, quota day (Pacific time, because YouTube quota resets at midnight PT) |
| `cron_runs` | Log of each scheduled job run |
| `oauth_tokens` | Encrypted refresh token. No client access at all. |

Security: RLS on every table. Access is limited to the owner through `is_owner()` (the email in the `app_owner` table). Sign-ups are off and login is a magic link. Cron jobs use the service-role key on the server only.

## Verified API facts (November 2026)

- `channels.list` supports `forHandle` and costs 1 unit. `playlistItems.list` and `videos.list` cost 1 unit each.
- The quota page now says `search.list` has its own bucket of 100 calls a day at 1 unit each. Studio doesn't use search either way.
- Playlist writes (`playlists.insert`, `playlistItems.insert`) cost 50 units.
- Default quota is 10,000 units a day, reset at midnight Pacific.
- Estimated use for 32 channels: about 60 units a day, and a few hundred for the first backfill.
- Shorts can be up to 3 minutes and must be square or vertical, for uploads on or after 2024-10-15 (60 s before that). The public API shows neither aspect ratio nor a Shorts flag for other people's videos.
- Retention reports take `elapsedVideoTimeRatio` with `audienceWatchRatio`, one video per request. Whether they work for Shorts is tested on the pigeon Short in Phase 5.

## Phases

1. **Competitor tracker and outlier radar.** Seed channels, add/remove page, daily cron, outlier maths, outlier feed.
2. **Idea bank and series planner.** CRUD, "save as inspiration", weekly theme clustering, series ordering. YouTube playlist writes only after you approve the write scope.
3. **Script pipeline and video handoff.** Script generation, storyboard JSON, fact-check gate, `videos/<slug>/` commit, version history, backfill of the two existing Shorts.
4. **Packaging scorer.** Title and thumbnail-concept scores with reasons and alternatives; predictions are stored.
5. **My channel analytics and retention review.** Read-only OAuth, retention curves, drop-offs mapped to beats, long-form candidates.
6. **Demand check (optional, ask first).** A pluggable interface; only sources with an official API.
