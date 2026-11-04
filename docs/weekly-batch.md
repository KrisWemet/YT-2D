# Weekly batch session (runbook)

Every **Sunday at 12:45 pm Mountain time**, a scheduled task wakes a dedicated Claude Code session, **"WQL weekly batch (Sundays 12:45 pm MT)"**, which runs this runbook. By about 1 pm the week's themes and suggested questions are waiting in WQL Studio, and the afternoon goes to building videos.

Why a dedicated session: sessions a schedule starts fresh get no copy of this private repo. The dedicated session was created with the repo attached, so each Sunday it runs `git fetch` and checks out the latest code: `main` once the runbook is there, otherwise the WQL Studio PR branch. It sends its report as a push notification. To change what it does, edit this runbook. To change when it runs, edit the "WQL weekly batch" scheduled task.

The weekly session does all of Studio's AI work for now, so the app needs no Anthropic API key. When the API key is added later, these steps move into the app as buttons and crons; this runbook is the spec for that.

## Database access

The scheduled session has no Supabase connector, so it uses `studio/scripts/batch.mjs`. The script talks to Supabase's REST API with the `SUPABASE_SECRET_KEY` set in this cloud environment's settings. It needs no `npm install`, and it never prints the key.

```bash
node studio/scripts/batch.mjs context > /tmp/batch-context.json   # everything step 1 needs, as JSON
node studio/scripts/batch.mjs ingest /tmp/theme-run.json          # stores the theme run (step 3)
```

If `SUPABASE_SECRET_KEY` isn't set, stop and say so in the report. The fix is to add the key in the environment settings.

When the Supabase connector *is* available (an interactive session started by the owner), the SQL shown below for each step does the same job through `execute_sql` on project `dtwjcenbduybmerfrglb`.

## Ground rules for the session

- **Data:** the YouTube data is already in the database; the daily sync keeps it fresh. Don't call the YouTube API.
- **Writes:** write only through the entry points named below.
  - Never delete or update other rows.
  - Never change schema.
  - Never touch `api_usage`, `cron_runs`, `channels` or `outliers`.
- **Git:** don't push to `main`. Phase 2 needs no commits. From Phase 3, commit the `videos/<slug>/` files on a branch and open a PR.
- **Logging:** when changing ideas through SQL, run `set local app.actor = 'claude-code-session';` first. This makes `idea_events` record who did it.
- **Report:** finish with the short report described at the end. The owner reads it in the Claude app.

## Phase 2: themes and suggested questions

### 1. Gather

Run `node studio/scripts/batch.mjs context`. It returns the window, outliers, dismissed examples, existing questions, queued ideas, recent theme names, recent sync runs and quota use. The equivalent SQL:

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

## Phase 3 and later (not active yet)

These steps are added as the phases ship:

- **Phase 3:** for each queued idea:
  - write the 30–60 s script and storyboard;
  - fact-check every claim with web search and sources;
  - save the versions to Supabase;
  - write `videos/<slug>/` and open a PR.
- **Phase 4:** score titles and thumbnail concepts for queued ideas.
- **Phase 5:** retention review of last week's uploads.

## Report (the session's final message)

Keep it short. The owner reads it on a phone.

1. The window, how many outliers, and the themes found, one line each.
2. The 3 strongest suggested questions overall and why.
3. Anything odd: a channel that went quiet, a sync error in `cron_runs`, quota above 50%.
4. The queued ideas waiting for scripting.
