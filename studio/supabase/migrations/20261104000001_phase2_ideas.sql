-- WQL Studio, Phase 2: idea bank + series planner, ready for more than one channel.
-- AI work (theme clustering, suggested questions) runs in a weekly Claude Code session that writes
-- results through private.ingest_theme_run(); the app itself makes no AI calls yet.

-- ---------------------------------------------------------------- projects (one per channel you run)

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  youtube_channel_id text,               -- the channel this project publishes to
  voice text,                            -- tone guide used for questions and scripts
  videos_path text not null default 'videos', -- where handoff files go in the repo
  created_at timestamptz not null default now()
);
comment on table public.projects is 'One row per YouTube channel run from Studio. Weird Questions Lab is the first.';

insert into public.projects (slug, name, youtube_channel_id, voice) values (
  'wql',
  'Weird Questions Lab',
  'UCjUsCUNfU6Ladj1ktmn6EBQ',
  'Curious, funny and scientifically accurate. One surprising question per Short, answered with real research. '
  'Plain spoken English, no "Did you know", no hype, no calls to action. Say "probably" or "mostly" where the science is uncertain. '
  'Cut-out cartoon style with the round-headed scientist; every Short loops back to its first frame.'
);

-- Until Studio has a project switcher, new rows belong to the first project.
create or replace function private.default_project()
returns uuid
language sql
stable
set search_path = ''
as $$
  select id from public.projects order by created_at, slug limit 1;
$$;
revoke execute on function private.default_project() from public, anon;
grant execute on function private.default_project() to authenticated;

alter table public.channels add column project_id uuid references public.projects (id) on delete cascade;
update public.channels set project_id = private.default_project();
alter table public.channels alter column project_id set not null;
alter table public.channels alter column project_id set default private.default_project();

-- ---------------------------------------------------------------- shared helpers

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- series

create table public.series (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null default private.default_project() references public.projects (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  slug text not null,
  description text,
  playlist_id text,                      -- YouTube playlist, entered by hand until playlist writes are approved
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);
create trigger series_touch before update on public.series for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- theme runs (weekly session output)

create table public.theme_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null default private.default_project() references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  actor text not null default 'claude-code-session',
  window_start timestamptz,
  window_end timestamptz,
  outlier_count integer,
  summary text,
  -- [{ "name": "...", "why": "...", "outlier_video_ids": ["..."], "questions": [{ "question": "...", "angle": "..." }] }]
  themes jsonb not null check (jsonb_typeof(themes) = 'array')
);
create index theme_runs_project_created on public.theme_runs (project_id, created_at desc);

-- ---------------------------------------------------------------- ideas

create type public.idea_status as enum ('idea', 'scripted', 'fact_checked', 'ready', 'animating', 'published');
create type public.idea_source as enum ('manual', 'outlier', 'claude', 'comment');

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null default private.default_project() references public.projects (id) on delete cascade,
  question text not null check (length(trim(question)) > 0),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  series_id uuid references public.series (id) on delete set null,
  position_in_series integer,
  status public.idea_status not null default 'idea',
  source public.idea_source not null default 'manual',
  source_outlier_id text references public.videos (id) on delete set null,
  theme_run_id uuid references public.theme_runs (id) on delete set null,
  theme text,
  scores jsonb not null default '{}'::jsonb,
  notes text,
  queued_at timestamptz,                 -- set when queued for the next weekly batch session
  youtube_video_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);
create index ideas_project_status on public.ideas (project_id, status);
create index ideas_series_position on public.ideas (series_id, position_in_series);
create index ideas_queued on public.ideas (queued_at) where queued_at is not null;
create trigger ideas_touch before update on public.ideas for each row execute function private.touch_updated_at();

-- Every status, queue and series change is logged, whoever makes it (app, weekly session, SQL).
-- The weekly session identifies itself with: set local app.actor = 'claude-code-session';
create table public.idea_events (
  id bigint generated always as identity primary key,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null check (kind in ('created', 'status', 'queued', 'unqueued', 'series')),
  from_status public.idea_status,
  to_status public.idea_status,
  actor text not null,
  note text
);
create index idea_events_idea on public.idea_events (idea_id, at desc);

create or replace function private.log_idea_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  who text := coalesce(nullif(current_setting('app.actor', true), ''), 'owner');
begin
  if tg_op = 'INSERT' then
    insert into public.idea_events (idea_id, kind, to_status, actor, note)
    values (new.id, 'created', new.status, who, new.source::text);
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.idea_events (idea_id, kind, from_status, to_status, actor)
    values (new.id, 'status', old.status, new.status, who);
  end if;
  if (new.queued_at is null) <> (old.queued_at is null) then
    insert into public.idea_events (idea_id, kind, actor)
    values (new.id, case when new.queued_at is null then 'unqueued' else 'queued' end, who);
  end if;
  if new.series_id is distinct from old.series_id then
    insert into public.idea_events (idea_id, kind, actor, note)
    values (new.id, 'series', who, coalesce(new.series_id::text, 'removed'));
  end if;
  return new;
end;
$$;
create trigger ideas_log after insert or update on public.ideas for each row execute function private.log_idea_event();

-- ---------------------------------------------------------------- weekly session entry point

-- Validates and stores one theme run. Called from the weekly Claude Code session (service role / SQL),
-- never from the browser.
create or replace function private.ingest_theme_run(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t jsonb;
  q jsonb;
  run_id uuid;
begin
  if jsonb_typeof(payload -> 'themes') <> 'array' or jsonb_array_length(payload -> 'themes') = 0 then
    raise exception 'payload.themes must be a non-empty array';
  end if;
  for t in select * from jsonb_array_elements(payload -> 'themes') loop
    if coalesce(trim(t ->> 'name'), '') = '' then
      raise exception 'every theme needs a name';
    end if;
    if jsonb_typeof(t -> 'questions') <> 'array' or jsonb_array_length(t -> 'questions') = 0 then
      raise exception 'theme "%" needs a non-empty questions array', t ->> 'name';
    end if;
    for q in select * from jsonb_array_elements(t -> 'questions') loop
      if coalesce(trim(q ->> 'question'), '') = '' then
        raise exception 'theme "%" has a question without text', t ->> 'name';
      end if;
    end loop;
  end loop;

  insert into public.theme_runs (project_id, actor, window_start, window_end, outlier_count, summary, themes)
  values (
    coalesce((select id from public.projects where slug = payload ->> 'project'), private.default_project()),
    coalesce(payload ->> 'actor', 'claude-code-session'),
    (payload ->> 'window_start')::timestamptz,
    (payload ->> 'window_end')::timestamptz,
    (payload ->> 'outlier_count')::integer,
    payload ->> 'summary',
    payload -> 'themes'
  )
  returning id into run_id;
  return run_id;
end;
$$;
revoke execute on function private.ingest_theme_run(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------- RLS

alter table public.projects enable row level security;
alter table public.series enable row level security;
alter table public.theme_runs enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_events enable row level security;

create policy "owner all" on public.projects for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner all" on public.series for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner all" on public.theme_runs for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner all" on public.ideas for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner reads" on public.idea_events for select to authenticated using ((select private.is_owner()));

revoke all on public.projects, public.series, public.theme_runs, public.ideas, public.idea_events from anon;
