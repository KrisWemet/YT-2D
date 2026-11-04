import { describe, expect, it } from 'vitest';
import { checkBudget, quotaDay, YOUTUBE_COSTS } from '@/lib/core/quota';
import { QuotaSkipError, YouTubeApiError, YouTubeClient, type UsageEntry, type UsageStore } from '@/lib/youtube/client';

describe('quotaDay (Pacific time)', () => {
  it('rolls over at midnight Pacific, not UTC', () => {
    // 07:59 UTC on Nov 3 is still Nov 2 in Los Angeles (PST, UTC-8).
    expect(quotaDay(new Date('2026-11-03T07:59:00Z'))).toBe('2026-11-02');
    expect(quotaDay(new Date('2026-11-03T08:00:00Z'))).toBe('2026-11-03');
  });
  it('follows daylight saving time', () => {
    // July: PDT, UTC-7.
    expect(quotaDay(new Date('2026-07-01T06:59:00Z'))).toBe('2026-06-30');
    expect(quotaDay(new Date('2026-07-01T07:00:00Z'))).toBe('2026-07-01');
  });
});

describe('checkBudget', () => {
  const base = { limit: 10_000, reserveFraction: 0.1, cost: 1 };
  it('allows calls well under the limit', () => {
    expect(checkBudget({ ...base, used: 100, priority: 'normal' }).allowed).toBe(true);
  });
  it('skips non-essential calls once the reserve line is reached', () => {
    expect(checkBudget({ ...base, used: 8_999, priority: 'normal' }).allowed).toBe(true);
    expect(checkBudget({ ...base, used: 9_000, priority: 'normal' }).allowed).toBe(false);
  });
  it('lets essential calls use the reserve', () => {
    expect(checkBudget({ ...base, used: 9_500, priority: 'essential' }).allowed).toBe(true);
  });
  it('blocks everything past the hard limit', () => {
    expect(checkBudget({ ...base, used: 10_000, priority: 'essential' }).allowed).toBe(false);
    expect(checkBudget({ ...base, used: 9_990, cost: 50, priority: 'essential' }).allowed).toBe(false);
  });
});

describe('cost table', () => {
  it('matches the documented costs', () => {
    expect(YOUTUBE_COSTS['channels.list']).toBe(1);
    expect(YOUTUBE_COSTS['playlistItems.list']).toBe(1);
    expect(YOUTUBE_COSTS['videos.list']).toBe(1);
    expect(YOUTUBE_COSTS['playlists.insert']).toBe(50);
    expect(YOUTUBE_COSTS['playlistItems.insert']).toBe(50);
  });
});

// ---- the client: logging and budget enforcement ----

class MemoryStore implements UsageStore {
  entries: UsageEntry[] = [];
  constructor(private start: Record<string, number> = {}) {}
  async usedToday(day: string) {
    return (this.start[day] ?? 0) + this.entries.filter((e) => e.quotaDay === day).reduce((s, e) => s + e.units, 0);
  }
  async record(e: UsageEntry) {
    this.entries.push(e);
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function client(store: UsageStore, fetchFn: typeof fetch, now = new Date('2026-11-03T12:00:00Z'), limit = 10_000) {
  return new YouTubeClient({ apiKey: 'TEST_KEY', store, fetchFn, now: () => now, limit, reserveFraction: 0.1, job: 'test' });
}

describe('YouTubeClient quota tracking', () => {
  it('logs one row per call with its cost and quota day', async () => {
    const store = new MemoryStore();
    const yt = client(store, async () => json(200, { items: [] }));
    await yt.videosById(['a', 'b'], 'essential');
    await yt.channelsById(['UC' + 'x'.repeat(22)]);
    expect(store.entries).toEqual([
      { quotaDay: '2026-11-03', api: 'youtube_data', endpoint: 'videos.list', units: 1, ok: true, httpStatus: 200, job: 'test' },
      { quotaDay: '2026-11-03', api: 'youtube_data', endpoint: 'channels.list', units: 1, ok: true, httpStatus: 200, job: 'test' },
    ]);
    expect(yt.unitsUsedToday).toBe(2);
  });

  it('still logs the cost when the API returns an error, and never leaks the key', async () => {
    const store = new MemoryStore();
    const yt = client(store, async () => json(403, { error: { errors: [{ reason: 'quotaExceeded' }] } }));
    const err = await yt.videosById(['a'], 'essential').catch((e) => e);
    expect(err).toBeInstanceOf(YouTubeApiError);
    expect(err.reason).toBe('quotaExceeded');
    expect(String(err.message)).not.toContain('TEST_KEY');
    expect(store.entries[0]).toMatchObject({ ok: false, httpStatus: 403, units: 1 });
  });

  it('logs network failures too', async () => {
    const store = new MemoryStore();
    const yt = client(store, async () => {
      throw new TypeError('fetch failed');
    });
    await expect(yt.videosById(['a'], 'essential')).rejects.toThrow('fetch failed');
    expect(store.entries[0]).toMatchObject({ ok: false, httpStatus: null, units: 1 });
  });

  it('skips non-essential calls near the limit without calling the API or logging', async () => {
    const store = new MemoryStore({ '2026-11-03': 9_000 });
    let calls = 0;
    const yt = client(store, async () => {
      calls++;
      return json(200, { items: [] });
    });
    await expect(yt.playlistPage('UUx', undefined, 'normal')).rejects.toBeInstanceOf(QuotaSkipError);
    expect(calls).toBe(0);
    expect(store.entries).toHaveLength(0);
    await yt.playlistPage('UUx', undefined, 'essential');
    expect(calls).toBe(1);
  });

  it('reloads usage when the Pacific day changes', async () => {
    let now = new Date('2026-11-03T07:00:00Z'); // Nov 2 Pacific
    const store = new MemoryStore({ '2026-11-02': 10_000 });
    const yt = new YouTubeClient({ apiKey: 'k', store, fetchFn: async () => json(200, {}), now: () => now });
    await expect(yt.videosById(['a'], 'essential')).rejects.toBeInstanceOf(QuotaSkipError);
    now = new Date('2026-11-03T09:00:00Z'); // Nov 3 Pacific: fresh quota
    await yt.videosById(['a'], 'essential');
    expect(yt.unitsUsedToday).toBe(1);
  });

  it('rejects batches over 50 IDs before spending quota', async () => {
    const store = new MemoryStore();
    const yt = client(store, async () => json(200, {}));
    const ids = Array.from({ length: 51 }, (_, i) => `v${i}`);
    await expect(yt.videosById(ids, 'essential')).rejects.toThrow('1–50');
    expect(store.entries).toHaveLength(0);
  });

  it('puts the key and parameters in the request URL', async () => {
    let seen: URL | null = null;
    const yt = client(new MemoryStore(), async (input) => {
      seen = new URL(String(input));
      return json(200, { items: [] });
    });
    await yt.channelByHandle('@superbouniverse');
    expect(seen!.pathname).toBe('/youtube/v3/channels');
    expect(seen!.searchParams.get('forHandle')).toBe('@superbouniverse');
    expect(seen!.searchParams.get('key')).toBe('TEST_KEY');
  });
});
