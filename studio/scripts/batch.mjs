#!/usr/bin/env node
// Weekly batch helper: database access for the Sunday Claude Code session, with no npm install.
// Talks to Supabase's REST API with the secret key from the environment (never printed).
//
//   node studio/scripts/batch.mjs context            → JSON with everything the session needs to think
//   node studio/scripts/batch.mjs ingest run.json    → stores a theme run (validated by the database)
//
// Env: SUPABASE_SECRET_KEY (required), SUPABASE_URL (defaults to the wql-studio project), BATCH_PROJECT (default "wql").

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

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
  const [outliers, ideas, recentRuns, runs, usage] = await Promise.all([
    get('outlier_feed', { select: cols, or: since, order: 'multiple_vs_channel_median.desc', limit: '150' }),
    get('ideas', { select: 'question,status,queued_at,theme', project_id: `eq.${project.id}`, order: 'created_at.desc', limit: '1000' }),
    get('theme_runs', { select: 'created_at,themes', project_id: `eq.${project.id}`, order: 'created_at.desc', limit: '3' }),
    get('cron_runs', { select: 'job,status,started_at,error', order: 'started_at.desc', limit: '10' }),
    get('api_usage_daily', { select: 'quota_day,units', api: 'eq.youtube_data', order: 'quota_day.desc', limit: '50' }),
  ]);
  const unitsByDay = {};
  for (const u of usage) unitsByDay[u.quota_day] = (unitsByDay[u.quota_day] ?? 0) + (u.units ?? 0);
  return {
    project: { slug: project.slug, name: project.name, voice: project.voice },
    window: { start: windowStart, end: windowEnd },
    outliers: outliers.filter((o) => o.status !== 'dismissed'),
    dismissed_examples: outliers.filter((o) => o.status === 'dismissed').slice(0, 20),
    existing_questions: ideas.map((i) => i.question),
    queued: ideas.filter((i) => i.queued_at).map((i) => ({ question: i.question, status: i.status, queued_at: i.queued_at })),
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

async function main(argv) {
  const [cmd, file] = argv;
  const cfg = config();
  if (cmd === 'context') {
    process.stdout.write(JSON.stringify(await buildContext(cfg), null, 2) + '\n');
  } else if (cmd === 'ingest' && file) {
    const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    const id = await ingest(cfg, payload);
    process.stdout.write(`stored theme run ${id}\n`);
  } else {
    process.stderr.write('usage: batch.mjs context | batch.mjs ingest <run.json>\n');
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).catch((e) => {
    process.stderr.write(`${e instanceof Error ? e.message : e}\n`);
    process.exit(1);
  });
}
