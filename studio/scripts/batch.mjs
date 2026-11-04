#!/usr/bin/env node
// Weekly batch helper: database access for the Sunday Claude Code session, with no npm install.
// Talks to Supabase's REST API with the secret key from the environment (never printed).
//
//   node studio/scripts/batch.mjs context                     → JSON with everything the session needs to think
//   node studio/scripts/batch.mjs ingest run.json             → stores a theme run (validated by the database)
//   node studio/scripts/batch.mjs ingest-script script.json   → stores a new script version (+ optional fact-check)
//   node studio/scripts/batch.mjs ingest-fact-check fc.json   → stores the fact-check pass for the current script
//   node studio/scripts/batch.mjs export <slug> [--force]     → writes videos/<slug>/ and records the handoff
//
// Env: SUPABASE_SECRET_KEY (required), SUPABASE_URL (defaults to the wql-studio project), BATCH_PROJECT (default "wql").

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { houseStyleWarnings, renderHandoff, validateStoryboard } from '../lib/handoff/render.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const DEFAULT_URL = 'https://dtwjcenbduybmerfrglb.supabase.co';

export function config(env = process.env) {
  const key = env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SECRET_KEY is not set. Add it to this cloud environment (environment settings → Edit) and start a new session.',
    );
  }
  return { url: (env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, ''), key, project: env.BATCH_PROJECT || 'wql' };
}

/**
 * GET /rest/v1/<path>?<params> or POST /rest/v1/rpc/<fn>. Errors never include the key.
 * @param {{ url: string, key: string, project?: string }} cfg
 * @param {string} path
 * @param {{ params?: Record<string, string>, body?: unknown, fetchFn?: typeof fetch }} [opts]
 */
export async function rest(cfg, path, { params, body, fetchFn = fetch } = {}) {
  const u = new URL(`${cfg.url}/rest/v1/${path}`);
  for (const [k, v] of Object.entries(params ?? {})) u.searchParams.append(k, v);
  const res = await fetchFn(u, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    const msg = (json && (json.message || json.hint)) || res.statusText;
    throw new Error(`Supabase ${res.status} on ${path}: ${msg}`);
  }
  return json;
}

const DAY = 86_400_000;

/**
 * Everything the session reads before clustering, in one JSON document.
 * @param {{ url: string, key: string, project: string }} cfg
 * @param {{ now?: Date, fetchFn?: typeof fetch }} [opts]
 */
export async function buildContext(cfg, { now = new Date(), fetchFn = fetch } = {}) {
  const get = (path, params) => rest(cfg, path, { params, fetchFn });
  const [project] = await get('projects', { select: 'id,slug,name,voice,youtube_channel_id', slug: `eq.${cfg.project}` });
  if (!project) throw new Error(`No project with slug "${cfg.project}"`);
  const [last] = await get('theme_runs', {
    select: 'window_end,created_at',
    project_id: `eq.${project.id}`,
    order: 'created_at.desc',
    limit: '1',
  });
  const windowStart = last?.window_end ?? new Date(now.getTime() - 7 * DAY).toISOString();
  const windowEnd = now.toISOString();
  const since = `(updated_at.gte.${windowStart},detected_at.gte.${windowStart})`;
  const cols = 'video_id,title,channel_title,tier,format,multiple_vs_channel_median,views,views_per_day,status,published_at';
  const [outliers, ideas, recentRuns, runs, usage, series] = await Promise.all([
    get('outlier_feed', { select: cols, or: since, order: 'multiple_vs_channel_median.desc', limit: '150' }),
    get('ideas', {
      select: 'id,slug,question,status,queued_at,theme,notes,series_id,position_in_series,source_outlier_id,youtube_video_id',
      project_id: `eq.${project.id}`,
      order: 'created_at.desc',
      limit: '1000',
    }),
    get('theme_runs', { select: 'created_at,themes', project_id: `eq.${project.id}`, order: 'created_at.desc', limit: '3' }),
    get('cron_runs', { select: 'job,status,started_at,error', order: 'started_at.desc', limit: '10' }),
    get('api_usage_daily', { select: 'quota_day,units', api: 'eq.youtube_data', order: 'quota_day.desc', limit: '50' }),
    get('series', { select: 'id,name,slug,description', project_id: `eq.${project.id}` }),
  ]);
  const unitsByDay = {};
  for (const u of usage) unitsByDay[u.quota_day] = (unitsByDay[u.quota_day] ?? 0) + (u.units ?? 0);

  const seriesById = new Map(series.map((x) => [x.id, x]));
  const neighbours = (idea) => {
    if (!idea.series_id) return null;
    const run = ideas
      .filter((i) => i.series_id === idea.series_id)
      .sort((a, b) => (a.position_in_series ?? 1e9) - (b.position_in_series ?? 1e9));
    const at = run.findIndex((i) => i.id === idea.id);
    const s = seriesById.get(idea.series_id);
    return {
      name: s?.name ?? null,
      description: s?.description ?? null,
      position: idea.position_in_series,
      total: run.length,
      previous: at > 0 ? { slug: run[at - 1].slug, question: run[at - 1].question } : null,
      next: at >= 0 && at < run.length - 1 ? { slug: run[at + 1].slug, question: run[at + 1].question } : null,
    };
  };

  // Ideas that are ready but whose current script hasn't been exported to videos/<slug>/ yet.
  const ready = ideas.filter((i) => ['ready', 'animating'].includes(i.status));
  let readyToExport = [];
  if (ready.length) {
    const inList = `in.(${ready.map((i) => i.id).join(',')})`;
    const [current, handoffs] = await Promise.all([
      get('scripts', { select: 'idea_id,version', idea_id: inList, is_current: 'eq.true' }),
      get('handoffs', { select: 'idea_id,script_version', idea_id: inList }),
    ]);
    const exported = new Set(handoffs.map((h) => `${h.idea_id}:${h.script_version}`));
    readyToExport = current
      .filter((c) => !exported.has(`${c.idea_id}:${c.version}`))
      .map((c) => ready.find((i) => i.id === c.idea_id).slug);
  }

  return {
    project: { slug: project.slug, name: project.name, voice: project.voice },
    window: { start: windowStart, end: windowEnd },
    outliers: outliers.filter((o) => o.status !== 'dismissed'),
    dismissed_examples: outliers.filter((o) => o.status === 'dismissed').slice(0, 20),
    existing_questions: ideas.map((i) => i.question),
    queued: ideas
      .filter((i) => i.queued_at)
      .map((i) => ({
        slug: i.slug,
        question: i.question,
        status: i.status,
        queued_at: i.queued_at,
        theme: i.theme,
        notes: i.notes,
        source_outlier: i.source_outlier_id ? outliers.find((o) => o.video_id === i.source_outlier_id)?.title ?? i.source_outlier_id : null,
        series: neighbours(i),
      })),
    ready_to_export: readyToExport,
    recent_theme_names: recentRuns.flatMap((r) => (r.themes ?? []).map((t) => t.name)),
    recent_job_runs: runs,
    youtube_units_by_day: unitsByDay,
  };
}

/**
 * Store a theme run through public.ingest_theme_run (the database validates it).
 * @param {{ url: string, key: string, project: string }} cfg
 * @param {object} payload
 * @param {{ fetchFn?: typeof fetch }} [opts]
 */
export async function ingest(cfg, payload, { fetchFn = fetch } = {}) {
  const body = { payload: { project: cfg.project, ...payload } };
  return rest(cfg, 'rpc/ingest_theme_run', { body, fetchFn });
}

/**
 * Store a new script version. The storyboard is checked here first so mistakes come back as a readable
 * list instead of a database error; house-style warnings are returned but don't block.
 * payload: { idea_slug, script: { hook, narration, loop_ending, next_tease, est_duration_s, storyboard, packaging }, fact_check?: { claims } }
 * @param {{ url: string, key: string, project: string }} cfg
 * @param {any} payload
 * @param {{ fetchFn?: typeof fetch }} [opts]
 */
export async function ingestScript(cfg, payload, { fetchFn = fetch } = {}) {
  const errors = validateStoryboard(payload?.script?.storyboard);
  if (errors.length) throw new Error(`Storyboard is invalid:\n- ${errors.join('\n- ')}`);
  const warnings = houseStyleWarnings(payload.script, payload.fact_check?.claims ?? []);
  const result = await rest(cfg, 'rpc/ingest_script', { body: { payload: { project: cfg.project, ...payload } }, fetchFn });
  return { ...result, warnings };
}

/**
 * Store the fact-check pass for an idea's current script. payload: { idea_slug, claims: [...] }
 * @param {{ url: string, key: string, project: string }} cfg
 * @param {any} payload
 * @param {{ fetchFn?: typeof fetch }} [opts]
 */
export async function ingestFactCheck(cfg, payload, { fetchFn = fetch } = {}) {
  return rest(cfg, 'rpc/ingest_fact_check', { body: { payload: { project: cfg.project, ...payload } }, fetchFn });
}

const EXPORTABLE = ['ready', 'animating', 'published'];

/**
 * Write videos/<slug>/ for an idea and record the handoff in Studio.
 * Refuses ideas that aren't ready unless force (used only to backfill already-published Shorts).
 * @param {{ url: string, key: string, project: string }} cfg
 * @param {string} slug
 * @param {{ force?: boolean, repoRoot?: string, fetchFn?: typeof fetch, now?: Date, actor?: string }} [opts]
 */
export async function exportIdea(cfg, slug, { force = false, repoRoot = REPO_ROOT, fetchFn = fetch, now = new Date(), actor = 'claude-code-session' } = {}) {
  const get = (p, params) => rest(cfg, p, { params, fetchFn });
  const [project] = await get('projects', { select: 'id,slug,name', slug: `eq.${cfg.project}` });
  if (!project) throw new Error(`No project with slug "${cfg.project}"`);
  const [idea] = await get('ideas', {
    select: 'id,slug,question,status,series_id,position_in_series,youtube_video_id',
    slug: `eq.${slug}`,
    project_id: `eq.${project.id}`,
  });
  if (!idea) throw new Error(`No idea with slug "${slug}"`);
  if (!force && !EXPORTABLE.includes(idea.status)) {
    throw new Error(`"${slug}" is ${idea.status}; only ready ideas are exported (resolve its claims and mark it ready in Studio)`);
  }
  const [script] = await get('scripts', { select: '*', idea_id: `eq.${idea.id}`, is_current: 'eq.true' });
  if (!script) throw new Error(`"${slug}" has no script`);
  const claims = await get('claims', { select: 'ref,claim,beats,confidence,status,sources,note,resolution', script_id: `eq.${script.id}` });

  let series = null;
  let previous = null;
  let next = null;
  if (idea.series_id) {
    const [s] = await get('series', { select: 'name,slug,playlist_id', id: `eq.${idea.series_id}` });
    const run = await get('ideas', {
      select: 'slug,question,youtube_video_id,position_in_series',
      series_id: `eq.${idea.series_id}`,
      order: 'position_in_series.asc.nullslast',
    });
    const at = run.findIndex((r) => r.slug === idea.slug);
    series = s ? { ...s, position: idea.position_in_series, total: run.length } : null;
    previous = at > 0 ? run[at - 1] : null;
    next = at >= 0 && at < run.length - 1 ? run[at + 1] : null;
  }

  const { dir, files } = renderHandoff({
    project,
    idea,
    script,
    claims,
    series,
    previous,
    next,
    exportedAt: now.toISOString(),
  });
  const abs = path.join(repoRoot, dir);
  fs.mkdirSync(abs, { recursive: true });
  const hashes = {};
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(abs, name), content);
    hashes[name] = createHash('sha256').update(content).digest('hex');
  }
  const handoffId = await rest(cfg, 'rpc/record_handoff', {
    body: { payload: { project: cfg.project, idea_slug: slug, path: dir, files: hashes, actor } },
    fetchFn,
  });
  return { dir, files: Object.keys(files), handoffId, version: script.version, warnings: houseStyleWarnings(script, claims) };
}

async function main(argv) {
  const [cmd, arg, ...rest_] = argv;
  const cfg = config();
  const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const print = (x) => process.stdout.write((typeof x === 'string' ? x : JSON.stringify(x, null, 2)) + '\n');
  if (cmd === 'context') {
    print(await buildContext(cfg));
  } else if (cmd === 'ingest' && arg) {
    print(`stored theme run ${await ingest(cfg, readJson(arg))}`);
  } else if (cmd === 'ingest-script' && arg) {
    print(await ingestScript(cfg, readJson(arg)));
  } else if (cmd === 'ingest-fact-check' && arg) {
    print(await ingestFactCheck(cfg, readJson(arg)));
  } else if (cmd === 'export' && arg) {
    print(await exportIdea(cfg, arg, { force: rest_.includes('--force') }));
  } else {
    process.stderr.write(
      'usage: batch.mjs context | ingest <run.json> | ingest-script <script.json> | ingest-fact-check <fc.json> | export <slug> [--force]\n',
    );
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).catch((e) => {
    process.stderr.write(`${e instanceof Error ? e.message : e}\n`);
    process.exit(1);
  });
}
