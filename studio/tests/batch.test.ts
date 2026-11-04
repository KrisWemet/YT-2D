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
