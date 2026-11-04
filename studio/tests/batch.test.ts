import { describe, expect, it } from 'vitest';
import { buildContext, config, ingest, rest } from '../scripts/batch.mjs';

const cfg = { url: 'https://example.supabase.co', key: 'sb_secret_TEST', project: 'wql' };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('batch.mjs config', () => {
  it('requires SUPABASE_SECRET_KEY and explains where to add it', () => {
    expect(() => config({} as NodeJS.ProcessEnv)).toThrow(/SUPABASE_SECRET_KEY is not set/);
    expect(config({ SUPABASE_SECRET_KEY: 'k' } as unknown as NodeJS.ProcessEnv)).toEqual({ url: 'https://dtwjcenbduybmerfrglb.supabase.co', key: 'k', project: 'wql' });
  });
});

describe('batch.mjs rest', () => {
  it('sends the key as headers, never in the URL, and keeps it out of errors', async () => {
    let seen: { url: string; headers: Record<string, string> } | null = null;
    const fetchFn = async (u: URL | RequestInfo, init?: RequestInit) => {
      seen = { url: String(u), headers: init!.headers as Record<string, string> };
      return new Response(JSON.stringify({ message: 'permission denied' }), { status: 401 });
    };
    const err = await rest(cfg, 'ideas', { params: { select: 'question' }, fetchFn }).catch((e: Error) => e);
    expect(seen!.url).toBe('https://example.supabase.co/rest/v1/ideas?select=question');
    expect(seen!.url).not.toContain('sb_secret');
    expect(seen!.headers.apikey).toBe('sb_secret_TEST');
    expect(String(err.message)).toBe('Supabase 401 on ideas: permission denied');
    expect(String(err.message)).not.toContain('sb_secret');
  });
});

describe('batch.mjs buildContext', () => {
  it('starts the window where the last run ended and splits dismissed outliers out', async () => {
    const calls: string[] = [];
    const fetchFn = async (u: URL | RequestInfo) => {
      const url = new URL(String(u));
      calls.push(url.pathname + url.search);
      const table = url.pathname.split('/').pop();
      if (table === 'projects') return ok([{ id: 'p1', slug: 'wql', name: 'Weird Questions Lab', voice: 'curious' }]);
      if (table === 'theme_runs' && url.searchParams.get('limit') === '1') return ok([{ window_end: '2026-11-01T19:00:00Z' }]);
      if (table === 'theme_runs') return ok([{ created_at: 'x', themes: [{ name: 'Kitchen secrets', questions: [] }] }]);
      if (table === 'outlier_feed')
        return ok([
          { video_id: 'a', status: 'new' },
          { video_id: 'b', status: 'dismissed' },
        ]);
      if (table === 'ideas') return ok([{ question: 'Why is the sky blue?', status: 'idea', queued_at: '2026-11-02T00:00:00Z' }]);
      if (table === 'api_usage_daily')
        return ok([
          { quota_day: '2026-11-03', units: 120 },
          { quota_day: '2026-11-03', units: 71 },
        ]);
      return ok([]);
    };
    const ctx = await buildContext(cfg, { now: new Date('2026-11-08T19:45:00Z'), fetchFn });
    expect(ctx.window).toEqual({ start: '2026-11-01T19:00:00Z', end: '2026-11-08T19:45:00.000Z' });
    expect(ctx.outliers.map((o: { video_id: string }) => o.video_id)).toEqual(['a']);
    expect(ctx.dismissed_examples.map((o: { video_id: string }) => o.video_id)).toEqual(['b']);
    expect(ctx.existing_questions).toEqual(['Why is the sky blue?']);
    expect(ctx.queued).toHaveLength(1);
    expect(ctx.recent_theme_names).toEqual(['Kitchen secrets']);
    expect(ctx.youtube_units_by_day).toEqual({ '2026-11-03': 191 });
    const outlierCall = calls.find((c) => c.startsWith('/rest/v1/outlier_feed'))!;
    expect(decodeURIComponent(outlierCall)).toContain('or=(updated_at.gte.2026-11-01T19:00:00Z,detected_at.gte.2026-11-01T19:00:00Z)');
  });

  it('falls back to the last 7 days on the first run', async () => {
    const fetchFn = async (u: URL | RequestInfo) => {
      const table = new URL(String(u)).pathname.split('/').pop();
      if (table === 'projects') return ok([{ id: 'p1', slug: 'wql', name: 'WQL', voice: '' }]);
      return ok([]);
    };
    const ctx = await buildContext(cfg, { now: new Date('2026-11-08T19:45:00Z'), fetchFn });
    expect(ctx.window.start).toBe('2026-11-01T19:45:00.000Z');
  });
});

describe('batch.mjs ingest', () => {
  it('posts the payload to the ingest RPC with the project slug', async () => {
    let body: unknown;
    const fetchFn = async (u: URL | RequestInfo, init?: RequestInit) => {
      expect(String(u)).toBe('https://example.supabase.co/rest/v1/rpc/ingest_theme_run');
      expect(init!.method).toBe('POST');
      body = JSON.parse(String(init!.body));
      return ok('run-uuid');
    };
    const id = await ingest(cfg, { themes: [{ name: 'T', questions: [{ question: 'Q?' }] }] }, { fetchFn });
    expect(id).toBe('run-uuid');
    expect(body).toEqual({ payload: { project: 'wql', themes: [{ name: 'T', questions: [{ question: 'Q?' }] }] } });
  });
});

// ---------------------------------------------------------------- Phase 3: scripts and export

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { exportIdea, ingestScript } from '../scripts/batch.mjs';

const sb = {
  schema: 'wql.storyboard/1',
  frame0: { description: 'Wombat with a cube tower' },
  loop: { last_line: 'So why cubes?' },
  assets: [{ id: 'wombat', kind: 'character', description: 'Proud wombat' }],
  beats: Array.from({ length: 6 }, (_, i) => ({
    n: i + 1,
    line: `Line ${i + 1}`,
    est_duration_s: 6,
    visual: 'Wombat does a thing',
    on_screen_text: null,
    sfx: [],
    assets: ['wombat'],
    claim_ids: i === 0 ? ['c1'] : [],
  })),
};

describe('batch.mjs ingestScript', () => {
  it('rejects an invalid storyboard before calling the database', async () => {
    let called = false;
    const fetchFn = (async () => {
      called = true;
      return ok({});
    }) as typeof fetch;
    const bad = { idea_slug: 'x', script: { storyboard: { ...sb, beats: [] } } };
    await expect(ingestScript(cfg, bad, { fetchFn })).rejects.toThrow(/beats must be a non-empty array/);
    expect(called).toBe(false);
  });

  it('posts to ingest_script with the project and returns house-style warnings', async () => {
    let body: { payload: { project: string; idea_slug: string } } | null = null;
    const fetchFn = (async (u: URL | RequestInfo, init?: RequestInit) => {
      expect(String(u)).toBe('https://example.supabase.co/rest/v1/rpc/ingest_script');
      body = JSON.parse(String(init!.body));
      return ok({ script_id: 's1', version: 1, status: 'scripted', flagged: 0 });
    }) as typeof fetch;
    const res = await ingestScript(cfg, { idea_slug: 'wombat', script: { hook: 'Why cubes?', loop_ending: 'So why cubes?', storyboard: sb } }, { fetchFn });
    expect(body!.payload.project).toBe('wql');
    expect(res.status).toBe('scripted');
    expect(res.warnings.join('\n')).toContain("Beats cite c1, which isn't in the fact-check");
  });
});

describe('batch.mjs exportIdea', () => {
  const rows: Record<string, unknown[]> = {
    projects: [{ id: 'p1', slug: 'wql', name: 'Weird Questions Lab' }],
    ideas: [{ id: 'i1', slug: 'wombat-cubes', question: 'Why is wombat poop cube shaped?', status: 'ready', series_id: null, position_in_series: null }],
    scripts: [
      {
        id: 's1', version: 3, hook: 'Why cubes?', narration: 'Line 1', loop_ending: 'So why cubes?', next_tease: null,
        word_count: 60, est_duration_s: 36, storyboard: sb, packaging: { title_options: ['Wombat Cubes'] }, fact_checked_at: '2026-11-08T19:00:00Z',
      },
    ],
    claims: [{ ref: 'c1', claim: 'Wombats make cubes', beats: [1], confidence: 'high', status: 'ok', sources: [{ title: 'Yang 2021', url: 'https://doi.org/x' }] }],
  };
  const fakeDb = (posts: unknown[], overrides: Record<string, unknown[]> = {}) =>
    (async (u: URL | RequestInfo, init?: RequestInit) => {
      const url = new URL(String(u));
      const name = url.pathname.split('/').pop()!;
      if (init?.method === 'POST') {
        posts.push({ name, body: JSON.parse(String(init.body)) });
        return ok(42);
      }
      return ok({ ...rows, ...overrides }[name] ?? []);
    }) as typeof fetch;

  it('writes the four files, hashes them and records the handoff', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wql-export-'));
    const posts: { name: string; body: { payload: { path: string; files: Record<string, string> } } }[] = [];
    const res = await exportIdea(cfg, 'wombat-cubes', { repoRoot, fetchFn: fakeDb(posts), now: new Date('2026-11-08T20:00:00Z') });
    expect(res.dir).toBe('videos/wombat-cubes');
    expect(res.version).toBe(3);
    expect(fs.readdirSync(path.join(repoRoot, 'videos/wombat-cubes')).sort()).toEqual(['fact-check.md', 'meta.json', 'script.md', 'storyboard.json']);
    const meta = JSON.parse(fs.readFileSync(path.join(repoRoot, 'videos/wombat-cubes/meta.json'), 'utf8'));
    expect(meta.title).toBe('Wombat Cubes');
    expect(meta.script_version).toBe(3);
    expect(posts).toHaveLength(1);
    expect(posts[0].name).toBe('record_handoff');
    expect(posts[0].body.payload.path).toBe('videos/wombat-cubes');
    expect(Object.keys(posts[0].body.payload.files).sort()).toEqual(['fact-check.md', 'meta.json', 'script.md', 'storyboard.json']);
    expect(posts[0].body.payload.files['meta.json']).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses an idea that is not ready unless forced', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wql-export-'));
    const notReady = { ideas: [{ ...(rows.ideas[0] as object), status: 'scripted' }] };
    await expect(exportIdea(cfg, 'wombat-cubes', { repoRoot, fetchFn: fakeDb([], notReady) })).rejects.toThrow(/is scripted; only ready ideas/);
    expect(fs.existsSync(path.join(repoRoot, 'videos'))).toBe(false);
    const res = await exportIdea(cfg, 'wombat-cubes', { repoRoot, fetchFn: fakeDb([], notReady), force: true });
    expect(res.files).toHaveLength(4);
  });
});
