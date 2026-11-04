# WQL Studio

Research and planning for **Weird Questions Lab**: track competitor channels, spot outlier videos, and (in later phases) plan series, write scripts and hand them to the video build in `../videos/<slug>/`.

It's a Next.js app in the `studio/` folder of this repo, deployed on Vercel, with data in Supabase. The plan and the decisions behind it are in [`../docs/wql-studio-plan.md`](../docs/wql-studio-plan.md).

**Phase 1:** competitor tracker and outlier radar.
**Phase 2:** idea bank, series planner and weekly themes.
- **Ideas:** a bank of questions with status (idea → scripted → fact-checked → ready → animating → published), notes, history, and a **Queue for Sunday** flag. **Save as idea** on any outlier creates a linked idea to rephrase in your own voice.
- **Series:** runs of Shorts in watch order. Reorder them with ↑ ↓; each Short shows the one it teases. The YouTube playlist ID is entered by hand until playlist writes are approved.
- **Themes:** the weekly session's topic themes, each with 10 suggested questions. **Keep** adds one to the bank; **Keep + queue** also queues it.
- **AI work** happens in a scheduled Claude Code session every Sunday at 12:45 pm Mountain (runbook: [`../docs/weekly-batch.md`](../docs/weekly-batch.md)), so the app needs no Anthropic key yet.
**Phase 3:** scripts, fact-checks and the handoff to the video build.
- **Scripts:** every queued idea gets a 30–60 s script on Sunday, with a hook, one fact per beat, a loop ending and a next-Short tease, plus a storyboard and packaging. Every version is kept.
- **Fact-check:** a separate pass lists every claim with confidence and sources. Flagged claims are resolved on the idea page (**Resolve** with a note, or **Needs rewrite**, which queues the idea again).
- **Ready gate:** the database won't let an idea be *ready* while its script is unchecked or a claim is flagged.
- **Handoff:** ready ideas are exported to `../videos/<slug>/`: `script.md`, `storyboard.json`, `meta.json` and `fact-check.md`, documented in [`../videos/README.md`](../videos/README.md). The renderer is `lib/handoff/render.mjs`; the export command is `node scripts/batch.mjs export <slug>`.
- **Projects:** the data model is ready for more channels. Each YouTube channel you run is a `project` with its own watchlist, ideas, series and voice; Weird Questions Lab is `wql`.

- **Outliers:** videos with at least 5× their channel's median views, filterable by Shorts/long form, tier and date range.
- **Channels:** add a channel by URL, @handle or ID, remove or restore it, change its tier, import the seed list, sync now.
- **Usage:** YouTube quota used today and over 14 days, plus recent job runs.
- **Daily cron:** new uploads, stats snapshots, baselines and outliers.

## How it works

### YouTube quota

Only official endpoints are used, with an API key (public data). There's no `search.list` and no scraping.

| Call | Cost | Used for |
|---|---|---|
| `channels.list` (50 IDs per call, or `forHandle`) | 1 | channel stats, uploads playlist ID, resolving handles |
| `playlistItems.list` (50 per page) | 1 | new uploads, newest first, from each channel's uploads playlist |
| `videos.list` (50 IDs per call) | 1 | title, duration, views, likes, comments |

- **Logging:** every call, including failed ones, is written to `api_usage` with its cost. Usage is grouped by the Pacific-time day, because that's when Google resets the quota.
- **Reserve:** the client checks the budget before each call. Above 90% of the daily quota (`YOUTUBE_QUOTA_RESERVE`), non-essential calls are skipped: backfill pages, baseline refreshes and lookups. The essential daily sync can still finish.
- **No refetching fresh data:**
  - channel stats and uploads are read at most once every 20 hours;
  - stats for videos under 60 days old refresh daily;
  - older videos that are in a baseline refresh weekly;
  - nothing else is refetched.
- **Expected use:** about 60–100 units a day for 33 channels. The first sync, which backfills up to 4 pages per channel, takes a few hundred.

Costs were checked on [Google's quota page](https://developers.google.com/youtube/v3/determine_quota_cost) on 2026-11-03. `search.list` now has its own bucket of 100 calls a day; Studio doesn't use it.

### Shorts detection

YouTube counts a video as a Short when it's square or vertical and no longer than 3 minutes, for uploads on or after 2024-10-15 (60 seconds before that). The public API doesn't expose aspect ratio or a Shorts flag for other people's videos, so Studio uses duration:

| Duration | Uploaded | Classified as |
|---|---|---|
| ≤ 60 s | any time | Short |
| 61–180 s | on or after 2024-10-15 | Short (`#shorts` in the title or description marks it as certain; without it, it's a likely Short) |
| 61–180 s | before 2024-10-15 | Long form |
| > 180 s | any time | Long form |

- Live and upcoming streams are left unclassified until they finish.
- A manual override (`format_source = 'manual'`) is never overwritten by sync.
- The undocumented `UUSH…` Shorts-playlist trick is deliberately not used.

The code is in `lib/core/shorts.ts`.

### Outlier maths

- **Baseline:** for each channel and format (Shorts and long form separately), the median views of its last 30 uploads that are at least 7 days old. Brand-new uploads haven't finished collecting views, so they'd drag the median down. A baseline needs at least 5 such uploads.
- **Outlier:** an upload under 60 days old with views ≥ 5× that baseline. Young uploads can be flagged early.
- **Floor:** multiples are measured against at least 1,000 views. A channel whose typical video gets 70 views would otherwise turn an ordinary 2,000-view video into a "28×" outlier. The real median is still stored in `channel_baselines`.
- **Views per day:** views ÷ age, with the first day counted as a full day.
- **Tracking:** baselines are kept as history in `channel_baselines`. Already-flagged videos keep their multiple up to date as the baseline moves. Dismissed outliers stay dismissed.

The code is in `lib/core/outliers.ts`.

### Security

- **RLS:** every table has RLS on. The signed-in owner (the email in `app_owner`) can read and write. Anyone else signed in sees nothing, and `anon` has no table access.
- **Owner check:** the check function sits in a private schema, so it can't be called through the API.
- **Server-only secrets:** the YouTube key, the Supabase secret key and the cron secret are only read in server code (`lib/env.ts`, `import 'server-only'`). They never reach the browser and are never logged. The key is never included in errors.
- **Login:** a magic link, sent only to `OWNER_EMAIL`. The form gives the same reply for any other address.
- **Cron:** `/api/cron/daily` requires `Authorization: Bearer $CRON_SECRET`, compared in constant time.

## Setup

The Supabase project (`wql-studio`, us-east-1) and the Phase 1 migrations already exist. The steps below are what's left for you, plus how to rebuild everything from scratch.

### 1. Google Cloud project and APIs

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a project, e.g. "WQL Studio".
2. Under **APIs & Services → Library**, enable **YouTube Data API v3**. Also enable **YouTube Analytics API** now, so Phase 5 only needs OAuth.
3. Under **APIs & Services → Credentials → Create credentials → API key**:
   - Rename it "WQL Studio server".
   - Under **API restrictions**, choose **Restrict key** and tick only *YouTube Data API v3*.
   - Leave **Application restrictions** as *None*. Vercel functions don't have fixed IPs, and the key never leaves the server.
4. Copy the key into `YOUTUBE_API_KEY` (step 3 below).
5. Check your quota under **APIs & Services → YouTube Data API v3 → Quotas** (default 10,000 units a day). If Google ever grants more, set `YOUTUBE_DAILY_QUOTA` to match.

### 2. OAuth consent screen (needed from Phase 5; can be done now)

For your own channel's analytics, Studio will sign in as you with read-only scopes. Google now calls the consent screen **Google Auth Platform** (APIs & Services → OAuth consent screen opens it). Its left-hand menu has the settings below.

1. **Overview → Get started** (only shown if the app isn't set up yet). The wizard asks for:
   - **App information:** the app name "WQL Studio" and your email as user support email.
   - **Audience:** choose **External**. A personal Gmail account can't choose Internal.
   - **Contact information:** your email.
   - **Finish:** agree to the policy, then click **Create**.

   If the app already exists, the same settings are under **Branding** and **Audience**.
2. **Branding:** Google won't let you publish (step 4) until these are filled in:
   - **Application home page:** `https://wql-studio.vercel.app`
   - **Application privacy policy link:** `https://wql-studio.vercel.app/privacy` (a public page in this app)
   - **Authorised domain 1:** `wql-studio.vercel.app`. Use the full name: `vercel.app` alone is rejected because every Vercel site shares it.
   - Leave **App logo** empty. Uploading one makes Google require verification.

   Then click **Save**.
3. **Data access → Add or remove scopes:** paste `https://www.googleapis.com/auth/yt-analytics.readonly` and `https://www.googleapis.com/auth/youtube.readonly` into **Manually add scopes**, click **Add to table**, then **Update** and **Save**.
4. **Audience → Publishing status → Publish app.** This takes the app from "Testing" to "In production". In Testing, Google expires refresh tokens after 7 days, and the analytics sync would stop every week. Google may show "unverified app" when you sign in. That's fine for an app only you use; you don't need to submit it in the **Verification centre**.
5. **Clients:** leave this for Phase 5. Phase 5 creates the OAuth client (type *Web application*) with the redirect URI `https://wql-studio.vercel.app/api/auth/google/callback`.
6. Writing playlists (Phase 2, optional) needs the broader `youtube` scope. Studio will ask before enabling it.

### 3. Environment variables

All variables are listed and explained in [`.env.example`](.env.example).

| Variable | Where to get it | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (already set to the wql-studio URL) | no |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → *Publishable key* | no |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → *Secret keys* → create one named "vercel" | **yes** |
| `OWNER_EMAIL` | your sign-in email | no |
| `SITE_URL` | your Vercel production URL | no |
| `YOUTUBE_API_KEY` | step 1 | **yes** |
| `CRON_SECRET` | `openssl rand -hex 32` | **yes** |

On Vercel, add the secret ones as **Sensitive** variables for Production and Preview. For local work, copy `.env.example` to `.env.local` (git-ignored) and fill it in.

### 4. Supabase

**Migrations** live in `supabase/migrations/` and were applied to the project with the Supabase connector. To rebuild elsewhere, run them in order in the SQL editor, or with `supabase db push` after `supabase link`. Then regenerate `lib/supabase/database.types.ts`:

```bash
npx supabase gen types typescript --project-id dtwjcenbduybmerfrglb > lib/supabase/database.types.ts
```

**Owner.** Your email is already in `app_owner`. On a fresh project, add it in the SQL editor:

```sql
insert into public.app_owner (email) values ('you@example.com');
```

**Auth settings** (Supabase dashboard → Authentication):

1. **URL Configuration:** set **Site URL** to your Vercel production URL, and add `https://<your-app>/auth/confirm` and `http://localhost:3000/auth/confirm` under **Redirect URLs**.
2. **Emails: leave the default template.** Supabase only lets you edit email templates once custom SMTP is set up, and Studio works with the default sign-in email. Open the link in the **same browser** you requested it from. On a phone, long-press **Sign in** in the email and choose *Open in Safari* (or Chrome) instead of the mail app's built-in browser. You stay signed in afterwards. The built-in mailer only sends a few emails an hour, so wait a few minutes before requesting another link.

   Optional, for links that work in any browser: set up custom SMTP (Authentication → Emails → *Set up SMTP*), then change the Magic Link body to:

   ```html
   <h2>Sign in to WQL Studio</h2>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in</a></p>
   ```

3. **After your first sign-in:** under **Sign In / Providers**, turn off **Allow new users to sign up**. Studio only sends links to `OWNER_EMAIL`, and RLS hides everything from anyone else; this closes the door completely.

### 5. Vercel

1. The project `wql-studio` (https://wql-studio.vercel.app) is linked to `KrisWemet/YT-2D` with **Root Directory** `studio` and Node 22. To do it by hand: Add New → Project → import the repo → Root Directory `studio` → framework Next.js.
   - **Vercel Authentication** is on for all `*.vercel.app` URLs, the default for new projects. Only you, signed in to Vercel, can even reach the login page; Studio's own magic-link login sits behind it. Keep it on. If it gets in the way on your phone, turn it off under Settings → Deployment Protection; Studio's login and RLS still protect everything.
   - Cron requests aren't blocked by it.
2. Add the environment variables from step 3.
3. **Cron:** `vercel.json` schedules `/api/cron/daily` at 09:17 UTC (about 1–2 am Pacific, just after the quota resets).
   - On the Hobby plan, crons run once a day and may fire any time within that hour. Crons only run on production deployments, so this starts once the PR is merged to `main`.
   - Vercel sends `CRON_SECRET` automatically.
   - Each run is logged in `cron_runs`, shown on the Usage page.
4. **Function time:** the cron route and the Channels page ask for 300 s (the Hobby maximum). The sync stops starting new channels after 240 s; leftovers are picked up by the next run or by **Sync now**.
5. **Ignored build step:** `vercel.json` skips deploys when a commit changes nothing in `studio/` or `data/`, so video-build commits don't redeploy Studio.

### 6. First run

1. Open the app, enter your email and click the link in the email.
2. Go to **Channels → Import seed list**. Studio resolves all 33 entries in `../data/seed-channels.json` (about 6 units) and reports any that didn't resolve. Unverified handles that don't exist are dropped.
3. Click **Sync now**. The first run backfills each channel and can take a few minutes; if any channels run out of time, run it again.
4. Open **Outliers**.

## Local development

Requires Node 22.

```bash
cd studio
npm install
cp .env.example .env.local   # fill it in
npm run dev                  # http://localhost:3000
npm test                     # unit tests (vitest)
npm run typecheck && npm run lint
npm run seed                 # same as "Import seed list", from the terminal
npm run sync                 # same as the cron job, with a 30-minute time limit
```

`seed` and `sync` read `.env.local` and run the same server code as the app.

## Code map

```
app/
  (app)/outliers/   outlier feed + dismiss action
  (app)/channels/   channel list, add/remove/tier, seed import, sync now
  (app)/usage/      quota meter, daily usage, job runs
  login/, auth/     magic-link sign-in, confirm, sign-out
  api/cron/daily/   Vercel Cron entry point
lib/
  core/             pure logic, unit tested: quota, Shorts detection, outliers, channel input parsing
  youtube/client.ts YouTube Data API client with quota checks and usage logging
  sync/             daily sync, channel helpers, seed import
  supabase/         typed clients (user/RLS and admin) and generated types
  auth/owner.ts     requireOwner() for pages and actions
  env.ts            server-only environment access
proxy.ts            session refresh + sign-in redirect (Next.js 16's renamed middleware)
supabase/migrations/
tests/              vitest
```

## Data model

| Table | What's in it |
|---|---|
| `channels` | tracked channels: tier (`mine`/`direct`/`rising`/`format`/`benchmark`), why, stats, uploads playlist, sync times, active flag |
| `videos` | every upload read: title, published, duration, format and how it was decided, latest stats |
| `video_snapshots` | one row per video per day: views, likes, comments |
| `channel_baselines` | median views per channel and format, kept as history |
| `outliers` | one row per flagged video: multiple, baseline, views/day, status (new/saved/dismissed) |
| `api_usage` | every API call with units (and, later, tokens and cost) |
| `cron_runs` | every sync run with its summary |
| `app_owner` | who may use the app |
| `projects` | one per YouTube channel run from Studio: slug, name, channel ID, voice guide, handoff folder |
| `series` | name, description, playlist ID, order, archived |
| `ideas` | question, stable slug (the `videos/<slug>/` folder), series and position, status, source (mine/outlier/suggested), linked outlier, theme, scores, notes, queued_at |
| `idea_events` | every status, queue and series change, with who made it (owner or weekly session) |
| `theme_runs` | the weekly session's themes and suggested questions, written through `private.ingest_theme_run()` |
| `scripts` | every script version per idea (one current): hook, narration, loop ending, tease, storyboard (`wql.storyboard/1`), packaging, fact-check time |
| `claims` | the fact-check: one row per claim with beats, confidence, sources, status (ok/flagged/resolved/cut) and the owner's resolution |
| `handoffs` | every `videos/<slug>/` export with file hashes |

The views `outlier_feed`, `channel_overview` and `api_usage_daily` back the pages. Later phases add series, ideas, scripts, claims, packaging scores and analytics; see the plan.
