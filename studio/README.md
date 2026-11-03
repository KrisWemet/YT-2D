# WQL Studio

Research and planning for **Weird Questions Lab**: track competitor channels, spot outlier videos, and (in later phases) plan series, write scripts and hand them to the video build in `../videos/<slug>/`.

It's a Next.js app in the `studio/` folder of this repo, deployed on Vercel, with data in Supabase. The plan and the decisions behind it are in [`../docs/wql-studio-plan.md`](../docs/wql-studio-plan.md).

**Phase 1 (this version):** competitor tracker and outlier radar.

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

For your own channel's analytics, Studio will sign in as you with read-only scopes.

1. Go to **APIs & Services → OAuth consent screen** (also called "Google Auth Platform").
2. Set **User type** to **External** (a personal Gmail account can't choose Internal). Fill in the app name "WQL Studio", your email as support and developer contact, and your Vercel URL as the app domain.
3. Add the scopes `https://www.googleapis.com/auth/yt-analytics.readonly` and `https://www.googleapis.com/auth/youtube.readonly`.
4. **Publishing status: push the app to "In production".** In "Testing" mode, Google expires refresh tokens after 7 days, and the analytics sync would stop every week. Google may show "unverified app" when you sign in. That's fine for an app only you use; you don't need to submit it for verification.
5. Later, Phase 5 creates the OAuth client ID (type *Web application*) with the redirect URI `https://<your-app>/api/auth/google/callback`.
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
2. **Emails → Magic Link template.** Replace the link so it works when your mail app opens it in a different browser, which is common on phones:

   ```html
   <h2>Sign in to WQL Studio</h2>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in</a></p>
   ```

   The default link also works, but only in the same browser that requested it.
3. **After your first sign-in:** under **Sign In / Providers**, turn off **Allow new users to sign up**. Studio only sends links to `OWNER_EMAIL`, and RLS hides everything from anyone else; this closes the door completely.

### 5. Vercel

1. The project is linked to `KrisWemet/YT-2D` with **Root Directory** `studio`. To do it by hand: Add New → Project → import the repo → Root Directory `studio` → framework Next.js.
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

## Data model (Phase 1)

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

The views `outlier_feed`, `channel_overview` and `api_usage_daily` back the pages. Later phases add series, ideas, scripts, claims, packaging scores and analytics; see the plan.
