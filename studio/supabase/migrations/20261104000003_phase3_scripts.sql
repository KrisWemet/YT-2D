-- WQL Studio, Phase 3: versioned scripts, fact-check claims, the ready gate and handoff records.
-- Scripts and fact-checks are written by the weekly Claude Code session through the service-role RPCs
-- below; the owner reviews them in the app, resolves flagged claims and marks ideas ready.

create type public.claim_status as enum ('ok', 'flagged', 'resolved', 'cut');
create type public.claim_confidence as enum ('high', 'medium', 'low');

-- ---------------------------------------------------------------- scripts (every version kept)

create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  version integer not null check (version > 0),
  is_current boolean not null default true,
  author text not null default 'claude-code-session',
  hook text not null check (length(trim(hook)) > 0),          -- the first line, said in the first ~2 s
  narration text not null check (length(trim(narration)) > 0), -- the full voice-over, one line per beat
  loop_ending text not null,                                   -- the last line, flowing back into the hook
  next_tease text,                                             -- teases the next Short in the series
  word_count integer not null,
  est_duration_s numeric not null,
  storyboard jsonb not null check (jsonb_typeof(storyboard) = 'object'), -- wql.storyboard/1, see videos/README.md
  packaging jsonb not null default '{}'::jsonb,                -- title options, description, tags, pinned comment
  notes text,
  fact_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (idea_id, version)
);
create unique index scripts_one_current on public.scripts (idea_id) where is_current;

-- ---------------------------------------------------------------- claims (the fact-check)

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references public.scripts (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  ref text not null check (ref ~ '^c[0-9]+$'),                 -- c1, c2 … referenced by storyboard beats
  claim text not null check (length(trim(claim)) > 0),
  beats integer[] not null default '{}',
  confidence public.claim_confidence not null,
  status public.claim_status not null,
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'), -- [{title, url, publisher, year, note}]
  note text,                                                   -- why it was flagged, or caveats
  resolution text,                                             -- the owner's note when resolving
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (script_id, ref)
);
create index claims_idea on public.claims (idea_id);

-- ---------------------------------------------------------------- handoffs (videos/<slug>/ exports)

create table public.handoffs (
  id bigint generated always as identity primary key,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  script_id uuid references public.scripts (id) on delete set null,
  script_version integer,
  path text not null,                                          -- e.g. videos/why-wombat-poop-cubes
  files jsonb not null,                                        -- {"script.md": "<sha256>", …}
  commit_sha text,
  actor text not null,
  exported_at timestamptz not null default now()
);
create index handoffs_idea on public.handoffs (idea_id, exported_at desc);

-- ---------------------------------------------------------------- the ready gate

-- An idea can only move forward when its current script supports it:
--   scripted → needs a current script; fact_checked → that script fact-checked;
--   ready / animating / published → and no flagged claims left on it.
create or replace function private.check_idea_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur public.scripts%rowtype;
  flagged integer;
begin
  if new.status = old.status then
    return new;
  end if;
  if new.status in ('scripted', 'fact_checked', 'ready', 'animating', 'published') then
    select * into cur from public.scripts where idea_id = new.id and is_current;
    if not found then
      raise exception 'This idea has no script yet. Queue it for Sunday to get one.' using errcode = 'check_violation';
    end if;
  end if;
  if new.status in ('fact_checked', 'ready', 'animating', 'published') and cur.fact_checked_at is null then
    raise exception 'Script v% has not been fact-checked yet.', cur.version using errcode = 'check_violation';
  end if;
  if new.status in ('ready', 'animating', 'published') then
    select count(*) into flagged from public.claims where script_id = cur.id and status = 'flagged';
    if flagged > 0 then
      raise exception '% flagged claim(s) must be resolved before this idea can be ready.', flagged using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
create trigger ideas_status_gate before update of status on public.ideas
  for each row execute function private.check_idea_status();

-- ---------------------------------------------------------------- session entry points (service role only)

-- Find an idea by id, or by slug within a project (default: the first project).
create or replace function private.find_idea(payload jsonb)
returns public.ideas
language plpgsql
stable
set search_path = ''
as $$
declare
  found_idea public.ideas%rowtype;
begin
  if payload ? 'idea_id' then
    select * into found_idea from public.ideas where id = (payload ->> 'idea_id')::uuid;
  else
    select * into found_idea from public.ideas
    where slug = payload ->> 'idea_slug'
      and project_id = coalesce((select id from public.projects where slug = payload ->> 'project'), private.default_project());
  end if;
  if not found then
    raise exception 'No idea found for %', coalesce(payload ->> 'idea_id', payload ->> 'idea_slug');
  end if;
  return found_idea;
end;
$$;

-- Insert the claims of a fact-check pass for one script; returns how many are flagged.
create or replace function private.insert_claims(p_script public.scripts, p_claims jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  c jsonb;
  flagged integer := 0;
begin
  if jsonb_typeof(p_claims) <> 'array' or jsonb_array_length(p_claims) = 0 then
    raise exception 'fact_check.claims must be a non-empty array';
  end if;
  for c in select * from jsonb_array_elements(p_claims) loop
    insert into public.claims (script_id, idea_id, ref, claim, beats, confidence, status, sources, note)
    values (
      p_script.id,
      p_script.idea_id,
      c ->> 'ref',
      c ->> 'claim',
      coalesce((select array_agg(x::integer) from jsonb_array_elements_text(c -> 'beats') x), '{}'),
      (c ->> 'confidence')::public.claim_confidence,
      (c ->> 'status')::public.claim_status,
      coalesce(c -> 'sources', '[]'::jsonb),
      c ->> 'note'
    )
    on conflict (script_id, ref) do update set
      claim = excluded.claim, beats = excluded.beats, confidence = excluded.confidence,
      status = excluded.status, sources = excluded.sources, note = excluded.note,
      resolution = null, resolved_at = null;
    if c ->> 'status' = 'flagged' then
      flagged := flagged + 1;
    end if;
  end loop;
  return flagged;
end;
$$;

-- Store a new script version (optionally with its fact-check) and move the idea forward.
-- payload: { idea_slug | idea_id, project?, actor?, script: {...}, fact_check?: { claims: [...] } }
create or replace function public.ingest_script(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  idea public.ideas%rowtype;
  s jsonb := payload -> 'script';
  next_version integer;
  new_script public.scripts%rowtype;
  flagged integer := 0;
  checked boolean := payload ? 'fact_check';
  new_status public.idea_status;
begin
  idea := private.find_idea(payload);
  if s is null or jsonb_typeof(s -> 'storyboard') <> 'object' or jsonb_typeof(s -> 'storyboard' -> 'beats') <> 'array' then
    raise exception 'script.storyboard.beats is required';
  end if;
  perform set_config('app.actor', coalesce(payload ->> 'actor', 'claude-code-session'), true);

  select coalesce(max(version), 0) + 1 into next_version from public.scripts where idea_id = idea.id;
  update public.scripts set is_current = false where idea_id = idea.id and is_current;
  insert into public.scripts (idea_id, version, author, hook, narration, loop_ending, next_tease, word_count,
                              est_duration_s, storyboard, packaging, notes, fact_checked_at)
  values (
    idea.id, next_version, coalesce(payload ->> 'actor', 'claude-code-session'),
    s ->> 'hook', s ->> 'narration', coalesce(s ->> 'loop_ending', ''), s ->> 'next_tease',
    coalesce((s ->> 'word_count')::integer, array_length(regexp_split_to_array(trim(s ->> 'narration'), '\s+'), 1)),
    (s ->> 'est_duration_s')::numeric,
    s -> 'storyboard', coalesce(s -> 'packaging', '{}'::jsonb), s ->> 'notes',
    case when checked then now() end
  )
  returning * into new_script;

  if checked then
    flagged := private.insert_claims(new_script, payload -> 'fact_check' -> 'claims');
  end if;
  new_status := case when checked and flagged = 0 then 'fact_checked' else 'scripted' end;
  -- A new version always goes back through review, even if the idea was ready before.
  update public.ideas set status = new_status, queued_at = null where id = idea.id;
  return jsonb_build_object('script_id', new_script.id, 'version', next_version, 'status', new_status, 'flagged', flagged);
end;
$$;

-- The separate fact-check pass for the current script. payload: { idea_slug | idea_id, project?, claims: [...] }
create or replace function public.ingest_fact_check(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  idea public.ideas%rowtype;
  cur public.scripts%rowtype;
  flagged integer;
  new_status public.idea_status;
begin
  idea := private.find_idea(payload);
  select * into cur from public.scripts where idea_id = idea.id and is_current;
  if not found then
    raise exception 'Idea % has no script to fact-check', idea.slug;
  end if;
  perform set_config('app.actor', coalesce(payload ->> 'actor', 'claude-code-session'), true);
  -- A re-check replaces the previous pass: same refs are updated, refs it no longer lists are marked cut.
  flagged := private.insert_claims(cur, payload -> 'claims');
  update public.claims set status = 'cut', note = 'Dropped in a later fact-check'
  where script_id = cur.id
    and ref not in (select c ->> 'ref' from jsonb_array_elements(payload -> 'claims') c);
  update public.scripts set fact_checked_at = now() where id = cur.id;
  new_status := case when flagged = 0 then 'fact_checked' else 'scripted' end;
  update public.ideas set status = new_status where id = idea.id;
  return jsonb_build_object('script_id', cur.id, 'version', cur.version, 'status', new_status, 'flagged', flagged);
end;
$$;

-- Record that videos/<slug>/ was written. payload: { idea_slug | idea_id, project?, path, files, commit_sha?, actor? }
create or replace function public.record_handoff(payload jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  idea public.ideas%rowtype;
  cur public.scripts%rowtype;
  new_id bigint;
begin
  idea := private.find_idea(payload);
  select * into cur from public.scripts where idea_id = idea.id and is_current;
  insert into public.handoffs (idea_id, script_id, script_version, path, files, commit_sha, actor)
  values (idea.id, cur.id, cur.version, payload ->> 'path', coalesce(payload -> 'files', '{}'::jsonb),
          payload ->> 'commit_sha', coalesce(payload ->> 'actor', 'claude-code-session'))
  returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function private.find_idea(jsonb) from public, anon, authenticated;
revoke execute on function private.insert_claims(public.scripts, jsonb) from public, anon, authenticated;
revoke execute on function public.ingest_script(jsonb) from public, anon, authenticated;
revoke execute on function public.ingest_fact_check(jsonb) from public, anon, authenticated;
revoke execute on function public.record_handoff(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_script(jsonb) to service_role;
grant execute on function public.ingest_fact_check(jsonb) to service_role;
grant execute on function public.record_handoff(jsonb) to service_role;

-- ---------------------------------------------------------------- RLS

alter table public.scripts enable row level security;
alter table public.claims enable row level security;
alter table public.handoffs enable row level security;

create policy "owner all" on public.scripts for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner all" on public.claims for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner reads" on public.handoffs for select to authenticated using ((select private.is_owner()));

revoke all on public.scripts, public.claims, public.handoffs from anon;
