-- WQL Studio, Phase 1: competitor tracker + outlier radar.
-- Every table has RLS on. The signed-in owner (email listed in app_owner) can read and write app data;
-- server jobs use the secret key, which bypasses RLS. Nobody else, including anon, sees anything.

-- ---------------------------------------------------------------- owner

create table public.app_owner (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
comment on table public.app_owner is 'Emails allowed to use WQL Studio. Insert your own with the SQL editor (see studio/README.md).';

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_owner o
    where o.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );
$$;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- ---------------------------------------------------------------- enums

create type public.channel_tier as enum ('mine', 'direct', 'rising', 'format', 'benchmark');
create type public.video_format as enum ('short', 'long');
create type public.format_source as enum ('duration', 'hashtag', 'manual');
create type public.outlier_status as enum ('new', 'saved', 'dismissed');

-- ---------------------------------------------------------------- channels

create table public.channels (
  id text primary key check (id ~ '^UC[0-9A-Za-z_-]{22}$'),
  handle text,
  title text not null,
  subs bigint,
  subs_hidden boolean not null default false,
  video_count integer,
  view_count bigint,
  tier public.channel_tier not null,
  why text,
  uploads_playlist_id text,
  thumbnail_url text,
  active boolean not null default true,
  added_at timestamptz not null default now(),
  stats_updated_at timestamptz,          -- channels.list last fetched
  last_synced_at timestamptz,            -- uploads playlist last read
  backfilled_at timestamptz              -- first deep read (enough uploads for a baseline) done
);

-- ---------------------------------------------------------------- videos

create table public.videos (
  id text primary key,
  channel_id text not null references public.channels (id) on delete cascade,
  title text not null,
  description_snippet text,              -- first 500 characters: #shorts hint, later topic clustering
  published_at timestamptz not null,
  duration_s integer,
  format public.video_format,            -- null while live/upcoming or unknown
  format_source public.format_source,
  is_short boolean generated always as (format = 'short') stored,
  live_status text not null default 'none',
  thumbnail_url text,
  views bigint,
  likes bigint,
  comments bigint,
  stats_updated_at timestamptz,
  first_seen_at timestamptz not null default now()
);
create index videos_channel_format_published on public.videos (channel_id, format, published_at desc);
create index videos_published on public.videos (published_at desc);

create table public.video_snapshots (
  video_id text not null references public.videos (id) on delete cascade,
  captured_on date not null,             -- one row per video per day, so a re-run is harmless
  captured_at timestamptz not null default now(),
  views bigint,
  likes bigint,
  comments bigint,
  primary key (video_id, captured_on)
);

-- ---------------------------------------------------------------- baselines + outliers

create table public.channel_baselines (
  id bigint generated always as identity primary key,
  channel_id text not null references public.channels (id) on delete cascade,
  format public.video_format not null,
  median_views numeric not null,
  sample_size integer not null,
  min_age_days integer not null,
  computed_at timestamptz not null default now()
);
create index channel_baselines_latest on public.channel_baselines (channel_id, format, computed_at desc);

create table public.outliers (
  video_id text primary key references public.videos (id) on delete cascade,
  channel_id text not null references public.channels (id) on delete cascade,
  format public.video_format not null,
  multiple_vs_channel_median numeric not null,
  baseline_median numeric not null,
  views bigint not null,
  views_per_day numeric not null,
  status public.outlier_status not null default 'new',
  detected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index outliers_multiple on public.outliers (multiple_vs_channel_median desc);

-- ---------------------------------------------------------------- usage + jobs

create table public.api_usage (
  id bigint generated always as identity primary key,
  called_at timestamptz not null default now(),
  -- YouTube quota resets at midnight Pacific, so usage is grouped by the Pacific date.
  quota_day date not null default ((now() at time zone 'America/Los_Angeles')::date),
  api text not null check (api in ('youtube_data', 'youtube_analytics', 'anthropic', 'github')),
  endpoint text not null,
  units integer not null default 0,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric,
  ok boolean not null default true,
  http_status integer,
  job text
);
create index api_usage_day on public.api_usage (quota_day, api);

create table public.cron_runs (
  id bigint generated always as identity primary key,
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'partial', 'error')),
  summary jsonb,
  error text
);
create index cron_runs_job_started on public.cron_runs (job, started_at desc);

-- ---------------------------------------------------------------- views (run with the caller's rights)

create view public.outlier_feed with (security_invoker = true) as
select
  o.video_id,
  o.channel_id,
  o.format,
  o.multiple_vs_channel_median,
  o.baseline_median,
  o.views,
  o.views_per_day,
  o.status,
  o.detected_at,
  o.updated_at,
  v.title,
  v.published_at,
  v.duration_s,
  v.thumbnail_url,
  c.title as channel_title,
  c.handle as channel_handle,
  c.tier
from public.outliers o
join public.videos v on v.id = o.video_id
join public.channels c on c.id = o.channel_id
where c.active;

create view public.channel_overview with (security_invoker = true) as
select
  c.*,
  (select b.median_views from public.channel_baselines b
     where b.channel_id = c.id and b.format = 'short' order by b.computed_at desc limit 1) as short_median,
  (select b.median_views from public.channel_baselines b
     where b.channel_id = c.id and b.format = 'long' order by b.computed_at desc limit 1) as long_median,
  (select count(*) from public.videos v where v.channel_id = c.id) as tracked_videos,
  (select count(*) from public.outliers o where o.channel_id = c.id) as outlier_count
from public.channels c;

create view public.api_usage_daily with (security_invoker = true) as
select quota_day, api, endpoint, count(*) as calls, sum(units) as units,
       sum(coalesce(input_tokens, 0)) as input_tokens, sum(coalesce(output_tokens, 0)) as output_tokens,
       sum(coalesce(cost_usd, 0)) as cost_usd, count(*) filter (where not ok) as failures
from public.api_usage
group by quota_day, api, endpoint;

-- ---------------------------------------------------------------- RLS

alter table public.app_owner enable row level security;
alter table public.channels enable row level security;
alter table public.videos enable row level security;
alter table public.video_snapshots enable row level security;
alter table public.channel_baselines enable row level security;
alter table public.outliers enable row level security;
alter table public.api_usage enable row level security;
alter table public.cron_runs enable row level security;

create policy "owner reads owners" on public.app_owner for select to authenticated using ((select public.is_owner()));

create policy "owner all" on public.channels for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner all" on public.videos for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner all" on public.video_snapshots for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner all" on public.channel_baselines for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner all" on public.outliers for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- Usage and job logs are written by server jobs only; the owner can read them.
create policy "owner reads" on public.api_usage for select to authenticated using ((select public.is_owner()));
create policy "owner reads" on public.cron_runs for select to authenticated using ((select public.is_owner()));

-- anon never needs anything in this schema.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
