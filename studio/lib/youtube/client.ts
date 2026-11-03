import 'server-only';
import { checkBudget, quotaDay, YOUTUBE_COSTS, type Priority, type YouTubeEndpoint } from '@/lib/core/quota';

/**
 * YouTube Data API v3 client (official REST endpoints, API key, public data only).
 * - Every call is logged with its quota cost, including failed calls (they still cost quota).
 * - Before each call the daily budget is checked; non-essential calls are skipped near the limit.
 * - The API key goes in the query string as Google requires, so URLs are never logged or thrown.
 */

export type UsageEntry = {
  quotaDay: string;
  api: 'youtube_data';
  endpoint: YouTubeEndpoint;
  units: number;
  ok: boolean;
  httpStatus: number | null;
  job: string | null;
};

export interface UsageStore {
  usedToday(quotaDay: string): Promise<number>;
  record(entry: UsageEntry): Promise<void>;
}

export class QuotaSkipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaSkipError';
  }
}

export class YouTubeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly reason: string,
  ) {
    super(`YouTube API ${status || 'network error'}: ${reason}`);
    this.name = 'YouTubeApiError';
  }
}

export type YouTubeClientOptions = {
  apiKey: string;
  store: UsageStore;
  limit?: number;
  reserveFraction?: number;
  job?: string;
  fetchFn?: typeof fetch;
  now?: () => Date;
};

// ---- response shapes (only the fields Studio reads) ----

export type YtThumbs = Partial<Record<'default' | 'medium' | 'high' | 'standard' | 'maxres', { url: string }>>;

export type YtChannel = {
  id: string;
  snippet?: { title: string; customUrl?: string; thumbnails?: YtThumbs };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean; videoCount?: string; viewCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
};

export type YtPlaylistItem = { contentDetails: { videoId: string; videoPublishedAt?: string } };

export type YtVideo = {
  id: string;
  snippet?: {
    channelId: string;
    title: string;
    description?: string;
    publishedAt: string;
    liveBroadcastContent?: string;
    thumbnails?: YtThumbs;
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
};

type ListResponse<T> = { items?: T[]; nextPageToken?: string };

const BASE = 'https://www.googleapis.com/youtube/v3/';

export class YouTubeClient {
  private used = 0;
  private day: string | null = null;
  private readonly limit: number;
  private readonly reserveFraction: number;
  private readonly fetchFn: typeof fetch;
  private readonly now: () => Date;

  constructor(private readonly opts: YouTubeClientOptions) {
    this.limit = opts.limit ?? 10_000;
    this.reserveFraction = opts.reserveFraction ?? 0.1;
    this.fetchFn = opts.fetchFn ?? fetch;
    this.now = opts.now ?? (() => new Date());
  }

  /** Units spent today, as far as this client knows (loaded from the store on first call each day). */
  get unitsUsedToday() {
    return this.used;
  }

  async call<T>(endpoint: YouTubeEndpoint, params: Record<string, string>, priority: Priority): Promise<T> {
    const cost = YOUTUBE_COSTS[endpoint];
    const day = quotaDay(this.now());
    if (this.day !== day) {
      this.used = await this.opts.store.usedToday(day);
      this.day = day;
    }
    const decision = checkBudget({ used: this.used, cost, limit: this.limit, reserveFraction: this.reserveFraction, priority });
    if (!decision.allowed) throw new QuotaSkipError(decision.reason);

    const [resource, method] = endpoint.split('.');
    if (method !== 'list') throw new Error(`${endpoint} needs OAuth; this client only reads public data`);
    const url = new URL(resource, BASE);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set('key', this.opts.apiKey);

    let status: number | null = null;
    let ok = false;
    let body: unknown = null;
    try {
      const res = await this.fetchFn(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      status = res.status;
      ok = res.ok;
      body = await res.json().catch(() => null);
    } finally {
      // Count the units even when the request failed: Google charges for invalid requests too.
      this.used += cost;
      await this.opts.store.record({
        quotaDay: day,
        api: 'youtube_data',
        endpoint,
        units: cost,
        ok,
        httpStatus: status,
        job: this.opts.job ?? null,
      });
    }
    if (!ok) throw new YouTubeApiError(status ?? 0, errorReason(body));
    return body as T;
  }

  /** Up to 50 channels by ID (1 unit). */
  async channelsById(ids: string[], priority: Priority = 'essential'): Promise<YtChannel[]> {
    assertBatch(ids);
    const r = await this.call<ListResponse<YtChannel>>(
      'channels.list',
      { part: 'snippet,statistics,contentDetails', id: ids.join(','), maxResults: '50' },
      priority,
    );
    return r.items ?? [];
  }

  /** One channel by @handle (1 unit). Returns null when the handle doesn't exist. */
  async channelByHandle(handle: string, priority: Priority = 'normal'): Promise<YtChannel | null> {
    const r = await this.call<ListResponse<YtChannel>>(
      'channels.list',
      { part: 'snippet,statistics,contentDetails', forHandle: handle },
      priority,
    );
    return r.items?.[0] ?? null;
  }

  /** One channel by legacy /user/ name (1 unit). */
  async channelByUsername(username: string, priority: Priority = 'normal'): Promise<YtChannel | null> {
    const r = await this.call<ListResponse<YtChannel>>(
      'channels.list',
      { part: 'snippet,statistics,contentDetails', forUsername: username },
      priority,
    );
    return r.items?.[0] ?? null;
  }

  /** One page (up to 50) of a playlist, newest first for uploads playlists (1 unit). */
  async playlistPage(playlistId: string, pageToken: string | undefined, priority: Priority) {
    const params: Record<string, string> = { part: 'contentDetails', playlistId, maxResults: '50' };
    if (pageToken) params.pageToken = pageToken;
    const r = await this.call<ListResponse<YtPlaylistItem>>('playlistItems.list', params, priority);
    return { items: r.items ?? [], nextPageToken: r.nextPageToken };
  }

  /** Up to 50 videos by ID with snippet, duration and stats (1 unit). */
  async videosById(ids: string[], priority: Priority): Promise<YtVideo[]> {
    assertBatch(ids);
    const r = await this.call<ListResponse<YtVideo>>(
      'videos.list',
      { part: 'snippet,contentDetails,statistics', id: ids.join(','), maxResults: '50' },
      priority,
    );
    return r.items ?? [];
  }
}

function assertBatch(ids: string[]) {
  if (ids.length === 0 || ids.length > 50) throw new Error(`batch must have 1–50 IDs, got ${ids.length}`);
}

function errorReason(body: unknown): string {
  const e = (body as { error?: { message?: string; errors?: { reason?: string }[] } } | null)?.error;
  return e?.errors?.[0]?.reason ?? e?.message ?? 'unknown error';
}

export function bestThumb(t?: YtThumbs): string | null {
  return t?.high?.url ?? t?.medium?.url ?? t?.standard?.url ?? t?.default?.url ?? null;
}

export function chunk<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}
