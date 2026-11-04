# Weekly batch session (runbook)

Every **Sunday at 12:45 pm Mountain time**, a scheduled task wakes a dedicated Claude Code session, **"WQL weekly batch (Sundays 12:45 pm MT)"**, which runs this runbook. By about 1 pm the week's themes and suggested questions are waiting in WQL Studio, and the afternoon goes to building videos.

Why a dedicated session: sessions a schedule starts fresh get no copy of this private repo. The dedicated session was created with the repo attached, so each Sunday it runs `git fetch` and checks out the latest code: `main` once the runbook is there, otherwise the WQL Studio PR branch. It sends its report as a push notification. To change what it does, edit this runbook. To change when it runs, edit the "WQL weekly batch" scheduled task.

The weekly session does all of Studio's AI work for now, so the app needs no Anthropic API key. When the API key is added later, these steps move into the app as buttons and crons; this runbook is the spec for that.

## Database access

The scheduled session has no Supabase connector, so it uses `studio/scripts/batch.mjs`. The script talks to Supabase's REST API with the `SUPABASE_SECRET_KEY` set in this cloud environment's settings. It needs no `npm install`, and it never prints the key.

```bash
node studio/scripts/batch.mjs context > /tmp/batch-context.json   # everything the run needs, as JSON
node studio/scripts/batch.mjs ingest /tmp/theme-run.json          # stores the theme run (step 3)
node studio/scripts/batch.mjs ingest-script /tmp/script.json      # stores a script version (step 4)
node studio/scripts/batch.mjs ingest-fact-check /tmp/fc.json      # stores the fact-check pass (step 5)
node studio/scripts/batch.mjs export <slug>                       # writes videos/<slug>/ (step 6)
```

If `SUPABASE_SECRET_KEY` isn't set, stop and say so in the report. The fix is to add the key in the environment settings.

When the Supabase connector *is* available (an interactive session started by the owner), the SQL shown below for each step does the same job through `execute_sql` on project `dtwjcenbduybmerfrglb`.

## Ground rules for the session

- **Data:** the YouTube data is already in the database; the daily sync keeps it fresh. Don't call the YouTube API.
- **Writes:** write only through the entry points named below.
  - Never delete or update other rows.
  - Never change schema.
  - Never touch `api_usage`, `cron_runs`, `channels` or `outliers`.
- **Git:** the only thing the session commits is exported `videos/<slug>/` folders, straight to `main` (the owner's choice). Never commit or push anything else. Changes to code or docs go on a branch with a PR.
- **Logging:** when changing ideas through SQL, run `set local app.actor = 'claude-code-session';` first. This makes `idea_events` record who did it.
- **Report:** finish with the short report described at the end. The owner reads it in the Claude app.

## Phase 2: themes and suggested questions

### 1. Gather

Run `node studio/scripts/batch.mjs context`. It returns the window, outliers, dismissed examples, existing questions, queued ideas (with notes and series neighbours), ideas ready to export, recent theme names, recent sync runs and quota use. The equivalent SQL:

```sql
-- The window: since the last run (or 7 days), so nothing is missed or repeated.
select coalesce(max(window_end), now() - interval '7 days') as window_start, now() as window_end
from public.theme_runs where project_id = (select id from public.projects where slug = 'wql');

-- Outliers to cluster: new or updated in the window, strongest first. Include dismissed ones only
-- as negative examples (the owner didn't want them).
select o.video_id, o.title, o.channel_title, o.tier, o.format, o.multiple_vs_channel_median as x,
       o.views, o.views_per_day, o.status, o.published_at
from public.outlier_feed o
where o.updated_at >= :window_start or o.detected_at >= :window_start
order by o.multiple_vs_channel_median desc
limit 150;

-- Don't suggest what already exists: every idea in the bank, plus last runs' themes.
select question, status from public.ideas;
select created_at, jsonb_path_query_array(themes, '$[*].name') as names from public.theme_runs order by created_at desc limit 3;

-- What's queued (reported only; scripting starts in Phase 3).
select question, queued_at from public.ideas where queued_at is not null order by queued_at;
```

Also read:
- the channel's voice in `public.projects.voice`;
- the house style in the root `README.md` (section "The house style");
- the topics already made or considered in the root `README.md` ("Finished Shorts", "Next ideas").

### 2. Think

- **Cluster** the outlier titles into **3–6 topic themes**.
  - Weight them by multiple and views per day.
  - Group by *topic and curiosity pattern*, not by channel. Examples: "everyday objects with a hidden reason" or "what if the human body…".
  - Skip outliers outside the niche (pure comedy, music, reaction videos) unless they teach a packaging lesson; if they do, mention it in `why`.
- **For each theme**, write `why`: what the outliers share and what that says about hooks and titles. One or two sentences.
- **Suggest exactly 10 new questions per theme** in Weird Questions Lab's voice: curious, funny, scientifically accurate.
  - Each question must be answerable in a 30–60 s Short with real, checkable research. Prefer questions with a surprising, settled answer. Avoid medical advice, dangerous stunts, conspiracy bait and anything the science can't answer.
  - Phrase each as a question a viewer would type or wonder aloud: short, concrete, a little absurd ("Why don't we just nuke a hurricane?").
  - Don't repeat or near-repeat anything already in the bank or in recent runs.
  - Give each question an `angle`: the surprising answer in one line, plus why it suits cut-out 2D animation. Example: "The tab hole is for a straw — but it also stops the tab snapping off. Big close-up of the tab as a character."
  - Mark which questions would chain well as a series. Mention it in the angle, for example "Series: Kitchen secrets #2".

### 3. Write

Write the run as JSON to a file and run `node studio/scripts/batch.mjs ingest <file>`. The payload has the same shape as below, minus `project`, which the script adds. With the connector instead, use one SQL call; dollar quoting means apostrophes don't need escaping:

```sql
select private.ingest_theme_run($json${
  "project": "wql",
  "window_start": "…", "window_end": "…",
  "outlier_count": 0,
  "summary": "One line: what stood out this week.",
  "themes": [
    {
      "name": "Everyday objects with a hidden reason",
      "why": "…",
      "outlier_video_ids": ["…"],
      "questions": [ { "question": "…?", "angle": "…" } ]
    }
  ]
}$json$::jsonb);
```

The function validates the payload: every theme needs a name and at least one question. It returns the run's ID. If it raises an error, fix the payload and call it again; don't insert into `theme_runs` directly. Over the REST API this is `public.ingest_theme_run`, which only the secret key can call. The questions appear on Studio's **Themes** page, where the owner keeps or queues them.

## Phase 3: scripts, fact-checks and exports

Run this after Phase 2, every week.

### 4. Script the queued ideas

`context.queued` lists them, oldest first, with notes, theme, source outlier and series neighbours. Take **up to 6**; report any left over.

For each idea:

1. **Research.** Search the web for the question. Prefer primary sources: papers, agencies, universities, museums. Note anything uncertain or contested. If the idea's notes contain a **Rewrite request**, that request is the brief; fix exactly what it asks.
2. **Write the script** in the house style (root `README.md`, "The house style"):
   - **Length:** 30–60 s, about 75–150 words, plain spoken English. No "Did you know", no hype, no calls to action. Hedge where the science hedges ("probably", "mostly").
   - **Hook:** at most 14 words, landing the question or premise in the first 2 seconds.
   - **Beats:** one surprising fact per beat.
   - **Loop ending:** the last line flows back into the hook, and the last frame matches frame 0.
   - **Series tease:** if the idea has a `series.next`, write `next_tease`. It goes in the description, pinned comment and related video, optionally as unvoiced on-screen text, and **never in the voice-over**.
3. **Write the storyboard** (`wql.storyboard/1`, documented in `videos/README.md`):
   - one narration `line` per beat, with a `cue_word` and `est_duration_s` (about 2.6 spoken words a second, plus pauses);
   - a `visual` for cut-out 2D animation with the round-headed scientist, plus `camera`, `on_screen_text`, `sfx` with `at_word`, and `claim_ids`;
   - `frame0` (it doubles as the thumbnail, with short `thumbnail_text`) and `loop`;
   - `assets` listing every picture to draw. Reuse existing poses and props where they fit (see `public/*/` and `images/*/prompts.md`).
4. **Package it:**
   - `title_options`: 3–5 curiosity titles, at most 60 characters;
   - `description`: 2–3 sentences (sources are appended automatically);
   - `tags`: 8–12;
   - `hashtags`: `#shorts` plus 2–4;
   - `pinned_comment`: a question for viewers, or the series tease.
5. **Store it:** write `{ "idea_slug": …, "script": { hook, narration, loop_ending, next_tease, est_duration_s, storyboard, packaging, notes } }` to a file and run `node studio/scripts/batch.mjs ingest-script <file>`. It checks the storyboard and prints house-style warnings; fix the warnings unless there's a reason not to. The idea becomes *scripted* and leaves the queue.

### 5. Fact-check each new script: a separate pass

Re-read the stored script as if someone else wrote it.

1. **List every claim** as `c1…cN` with the beats that state it: numbers, comparisons, causes, "first/only/never", and implied claims.
2. **Find 1–3 sources per claim**, primary where possible. Record `title`, `url`, `publisher` and `year` for each.
3. **Rate each claim:**
   - `confidence` is `high`, `medium` or `low`.
   - `status: "ok"` only when a source supports the claim *as worded*. Otherwise use `"flagged"`, with a `note` saying what's wrong and what wording would be supported.
   - Never mark a claim ok without a source.
4. **Store the pass:** `node studio/scripts/batch.mjs ingest-fact-check <file>`, with `{ "idea_slug": …, "claims": [ … ] }`. If nothing is flagged, the idea becomes *fact_checked*.
5. **Fix what wording can fix:** if a flagged claim can be fixed by rewording, store a revised version with `ingest-script`, this time including `"fact_check": { "claims": [ … ] }` checked against the new wording, so the owner sees a clean version. Leave real judgement calls flagged; the owner resolves them in Studio, and the database won't let an idea be *ready* while any are open.

### 6. Export ready ideas

For each slug in `context.ready_to_export` (ideas the owner marked ready whose current script isn't exported yet):

```bash
node studio/scripts/batch.mjs export <slug>      # writes videos/<slug>/ and records the handoff
git fetch origin main
git worktree add /tmp/wql-main origin/main
mkdir -p /tmp/wql-main/videos && cp -r videos/<slug> /tmp/wql-main/videos/
cd /tmp/wql-main && git add videos/<slug> && git commit -m "videos/<slug>: script v<N> from WQL Studio" && git push origin HEAD:main
cd - && git worktree remove /tmp/wql-main
```

Commit only `videos/<slug>/`, nothing else.

## Phase 4 and later (not active yet)

- **Phase 4:** score titles and thumbnail concepts for scripted ideas.
- **Phase 5:** retention review of last week's uploads.

## Report (the session's final message)

Keep it short. The owner reads it on a phone.

1. The window, how many outliers, and the themes found, one line each.
2. The 3 strongest suggested questions overall and why.
3. Anything odd: a channel that went quiet, a sync error in `cron_runs`, quota above 50%.
4. Scripts written: one line each with the question, version, length and status, and any flagged claims with what's needed.
5. Exports committed (slugs), and queued ideas left for next week.
