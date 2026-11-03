import 'server-only';
import { ageDays, computeBaseline, detectOutliers, isStatsFresh, OUTLIER_DEFAULTS, type VideoStat } from '@/lib/core/outliers';
import type { Priority } from '@/lib/core/quota';
import { classifyFormat, parseIsoDuration } from '@/lib/core/shorts';
import type { Db } from '@/lib/supabase/admin';
import type { Json, Tables, TablesInsert } from '@/lib/supabase/database.types';
import { bestThumb, chunk, QuotaSkipError, type YouTubeClient, type YtVideo } from '@/lib/youtube/client';
import { channelFields } from './channels';

/**
 * The daily sync (also run from "Sync now" and the CLI):
 * 1. Channel stats via channels.list, 50 channels per call. Skipped if fetched in the last 20 h.
 * 2. New uploads from each channel's uploads playlist (playlistItems.list, 50 per page). The first
 *    run per channel backfills a few pages so there are 30 mature uploads per format for a baseline.
 * 3. Stats for uploads under 60 days old (daily) and for baseline uploads (weekly), via videos.list
 *    in batches of 50, with one snapshot row per video per day. Fresh rows are never refetched.
 * 4. Baselines and outliers per channel and format.
 * No search.list anywhere. Every call is logged with its cost by the YouTube client.
 */

export type SyncOptions = {
  now?: Date;
  channelIds?: string[]; // limit to these channels (e.g. right after adding one)
  backfillPages?: number; // pages per channel on its first run
  dailyPages?: number; // max pages per channel afterwards
  deadlineMs?: number; // stop starting new work after this long (Vercel Hobby functions get 300 s)
};

export type SyncSummary = {
  channels: number;
  channelStatsRefreshed: number;
  missingChannels: string[];
  newVideos: number;
  statsRefreshed: number;
  snapshots: number;
  baselines: number;
  outliersFlagged: number;
  quotaSkips: number;
  deferredChannels: string[];
  errors: { channelId?: string; step: string; message: string }[];
  unitsUsedToday: number;
};

const HOUR = 3_600_000;
type Channel = Tables<'channels'>;
type VideoRow = Pick<Tables<'videos'>, 'id' | 'channel_id' | 'format' | 'format_source' | 'published_at' | 'views' | 'stats_updated_at'>;

export async function runSync(db: Db, yt: YouTubeClient, opts: SyncOptions = {}): Promise<SyncSummary> {
  const now = opts.now ?? new Date();
  const started = Date.now();
  const deadline = started + (opts.deadlineMs ?? 240_000);
  const backfillPages = opts.backfillPages ?? 4;
  const dailyPages = opts.dailyPages ?? 3;
  const s: SyncSummary = {
    channels: 0,
    channelStatsRefreshed: 0,
    missingChannels: [],
    newVideos: 0,
    statsRefreshed: 0,
    snapshots: 0,
    baselines: 0,
    outliersFlagged: 0,
    quotaSkips: 0,
    deferredChannels: [],
    errors: [],
    unitsUsedToday: 0,
  };
  const guard = async <T>(step: string, fn: () => Promise<T>, channelId?: string): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof QuotaSkipError) s.quotaSkips++;
      else s.errors.push({ channelId, step, message: e instanceof Error ? e.message : String(e) });
      return undefined;
    }
  };

  let q = db.from('channels').select('*').eq('active', true);
  if (opts.channelIds?.length) q = q.in('id', opts.channelIds);
  const { data: channels, error } = await q;
  if (error) throw new Error(error.message);
  s.channels = channels.length;

  // 1. channel stats ------------------------------------------------------------------------
  const staleChannels = channels.filter((c) => !c.stats_updated_at || now.getTime() - Date.parse(c.stats_updated_at) > 20 * HOUR);
  for (const batch of chunk(staleChannels, 50)) {
    await guard('channels.list', async () => {
      const items = await yt.channelsById(batch.map((c) => c.id), 'essential');
      const byId = new Map(items.map((c) => [c.id, c]));
      for (const c of batch) {
        const item = byId.get(c.id);
        if (!item) {
          s.missingChannels.push(c.id);
          continue;
        }
        const f = channelFields(item);
        const { error: e } = await db.from('channels').update({ ...f, handle: f.handle ?? c.handle }).eq('id', c.id);
        if (e) throw new Error(e.message);
        Object.assign(c, f);
        s.channelStatsRefreshed++;
      }
    });
  }

  // 2. new uploads --------------------------------------------------------------------------
  for (const c of channels) {
    if (!c.uploads_playlist_id) continue;
    if (c.last_synced_at && now.getTime() - Date.parse(c.last_synced_at) < 20 * HOUR) continue;
    if (Date.now() > deadline) {
      s.deferredChannels.push(c.id);
      continue;
    }
    await guard('uploads', () => syncUploads(db, yt, c, now, c.backfilled_at ? dailyPages : backfillPages, s), c.id);
  }

  // 3. stats refresh ------------------------------------------------------------------------
  const ids = channels.map((c) => c.id);
  const videos = await loadVideos(db, ids);
  const { essential, normal } = pickStaleVideos(videos, now);
  for (const [list, priority] of [[essential, 'essential'], [normal, 'normal']] as const) {
    for (const batch of chunk(list, 50)) {
      if (Date.now() > deadline) break;
      await guard('videos.list', async () => {
        const items = await yt.videosById(batch.map((v) => v.id), priority);
        await writeVideos(db, items, now, s, { refresh: new Map(batch.map((v) => [v.id, v])) });
      });
    }
  }

  // 4. baselines + outliers -----------------------------------------------------------------
  const fresh = await loadVideos(db, ids);
  const byChannel = groupBy(fresh, (v) => v.channel_id);
  for (const c of channels) {
    await guard('outliers', () => computeChannelOutliers(db, c.id, byChannel.get(c.id) ?? [], now, s), c.id);
  }

  s.unitsUsedToday = yt.unitsUsedToday;
  return s;
}

/** Read the uploads playlist newest-first until we reach videos we already have. */
async function syncUploads(db: Db, yt: YouTubeClient, c: Channel, now: Date, maxPages: number, s: SyncSummary) {
  const known = new Set((await loadVideos(db, [c.id])).map((v) => v.id));
  let pageToken: string | undefined;
  let pages = 0;
  let reachedKnown = false;
  let exhausted = false;
  while (pages < maxPages) {
    // The first page is part of the daily sync; extra pages are nice-to-have and give way near the limit.
    const priority: Priority = pages === 0 ? 'essential' : 'normal';
    const page = await yt.playlistPage(c.uploads_playlist_id!, pageToken, priority);
    pages++;
    const newIds = page.items.map((i) => i.contentDetails.videoId).filter((id) => !known.has(id));
    if (newIds.length < page.items.length) reachedKnown = true;
    for (const batch of chunk(newIds, 50)) {
      const items = await yt.videosById(batch, priority);
      await writeVideos(db, items, now, s, { channelId: c.id });
    }
    pageToken = page.nextPageToken;
    if (!pageToken) exhausted = true;
    if (reachedKnown || exhausted) break;
    // During a backfill, stop once there are enough mature uploads for both baselines.
    if (!c.backfilled_at && (await hasFullBaselines(db, c.id, now))) break;
  }
  const update: Partial<Channel> = { last_synced_at: now.toISOString() };
  if (!c.backfilled_at) update.backfilled_at = now.toISOString();
  const { error } = await db.from('channels').update(update).eq('id', c.id);
  if (error) throw new Error(error.message);
}

async function hasFullBaselines(db: Db, channelId: string, now: Date) {
  const cutoff = new Date(now.getTime() - OUTLIER_DEFAULTS.minAgeDays * 86_400_000).toISOString();
  const count = async (format: 'short' | 'long') => {
    const { count } = await db
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', channelId)
      .eq('format', format)
      .lte('published_at', cutoff);
    return count ?? 0;
  };
  const [shorts, longs] = await Promise.all([count('short'), count('long')]);
  return shorts >= OUTLIER_DEFAULTS.sampleSize && longs >= OUTLIER_DEFAULTS.sampleSize;
}

/**
 * Upsert videos.list items and their daily snapshot. New videos get classified; existing ones only
 * get fresh stats, except that a still-unclassified video (live/upcoming earlier) is classified now.
 * A manual format override is never touched.
 */
async function writeVideos(
  db: Db,
  items: YtVideo[],
  now: Date,
  s: SyncSummary,
  ctx: { channelId?: string; refresh?: Map<string, VideoRow> },
) {
  if (!items.length) return;
  const nowIso = now.toISOString();
  const day = nowIso.slice(0, 10);
  const rows: TablesInsert<'videos'>[] = [];
  const snaps: TablesInsert<'video_snapshots'>[] = [];
  for (const v of items) {
    const sn = v.snippet;
    if (!sn) continue;
    const durationS = parseIsoDuration(v.contentDetails?.duration);
    const stats = {
      views: toNum(v.statistics?.viewCount),
      likes: toNum(v.statistics?.likeCount),
      comments: toNum(v.statistics?.commentCount),
    };
    const existing = ctx.refresh?.get(v.id);
    const row: TablesInsert<'videos'> = {
      id: v.id,
      channel_id: ctx.channelId ?? existing?.channel_id ?? sn.channelId,
      title: sn.title,
      description_snippet: (sn.description ?? '').slice(0, 500),
      published_at: sn.publishedAt,
      duration_s: durationS,
      live_status: sn.liveBroadcastContent ?? 'none',
      thumbnail_url: bestThumb(sn.thumbnails),
      ...stats,
      stats_updated_at: nowIso,
    };
    if (!existing || (existing.format == null && existing.format_source !== 'manual')) {
      const f = classifyFormat({
        durationS,
        publishedAt: sn.publishedAt,
        title: sn.title,
        description: sn.description,
        liveStatus: sn.liveBroadcastContent,
      });
      row.format = f.format;
      row.format_source = f.source;
    }
    rows.push(row);
    snaps.push({ video_id: v.id, captured_on: day, captured_at: nowIso, ...stats });
  }
  // Rows without format keys keep their stored format on conflict (PostgREST only updates given columns),
  // but a batch must share one column set, so upsert classified and refresh-only rows separately.
  const withFormat = rows.filter((r) => 'format' in r);
  const statsOnly = rows.filter((r) => !('format' in r));
  for (const group of [withFormat, statsOnly]) {
    if (!group.length) continue;
    const { error } = await db.from('videos').upsert(group, { onConflict: 'id' });
    if (error) throw new Error(`videos upsert: ${error.message}`);
  }
  const { error: snapErr } = await db.from('video_snapshots').upsert(snaps, { onConflict: 'video_id,captured_on' });
  if (snapErr) throw new Error(`snapshots upsert: ${snapErr.message}`);
  s.snapshots += snaps.length;
  if (ctx.refresh) s.statsRefreshed += rows.length;
  else s.newVideos += rows.length;
}

/** Videos whose stats are due: under 60 days old (daily, essential) and baseline samples (weekly). */
export function pickStaleVideos(videos: VideoRow[], now: Date) {
  const essential: VideoRow[] = [];
  const normal: VideoRow[] = [];
  const baselineIds = new Set<string>();
  for (const group of groupBy(videos, (v) => `${v.channel_id}:${v.format}`).values()) {
    const b = computeBaseline(toStats(group), group[0].format ?? 'short', now, { minSample: 1 });
    b?.videoIds.forEach((id) => baselineIds.add(id));
  }
  for (const v of videos) {
    const age = ageDays(v.published_at, now);
    if (isStatsFresh(v.stats_updated_at, age, now)) continue;
    if (age < OUTLIER_DEFAULTS.maxAgeDays) essential.push(v);
    else if (baselineIds.has(v.id)) normal.push(v);
  }
  return { essential, normal };
}

async function computeChannelOutliers(db: Db, channelId: string, videos: VideoRow[], now: Date, s: SyncSummary) {
  const stats = toStats(videos);
  const { data: existing } = await db.from('outliers').select('video_id').eq('channel_id', channelId);
  const existingIds = new Set((existing ?? []).map((r) => r.video_id));
  for (const format of ['short', 'long'] as const) {
    const baseline = computeBaseline(stats, format, now);
    if (!baseline) continue;
    const { error: bErr } = await db.from('channel_baselines').insert({
      channel_id: channelId,
      format,
      median_views: baseline.median,
      sample_size: baseline.sampleSize,
      min_age_days: OUTLIER_DEFAULTS.minAgeDays,
      computed_at: now.toISOString(),
    });
    if (bErr) throw new Error(bErr.message);
    s.baselines++;

    const flagged = detectOutliers(stats, baseline, now);
    // Keep already-flagged videos current too (their multiple can fall as the baseline moves).
    const flaggedIds = new Set(flagged.map((o) => o.videoId));
    const recheck = detectOutliers(
      stats.filter((v) => existingIds.has(v.id) && !flaggedIds.has(v.id)),
      baseline,
      now,
      { threshold: 0, maxAgeDays: Infinity },
    );
    const rows = [...flagged, ...recheck].map((o) => ({
      video_id: o.videoId,
      channel_id: channelId,
      format,
      multiple_vs_channel_median: o.multiple,
      baseline_median: o.baselineMedian,
      views: o.views,
      views_per_day: o.viewsPerDay,
      updated_at: now.toISOString(),
    }));
    if (rows.length) {
      // status and detected_at are left out, so a re-run keeps "dismissed" and the first detection time.
      const { error } = await db.from('outliers').upsert(rows, { onConflict: 'video_id' });
      if (error) throw new Error(error.message);
    }
    s.outliersFlagged += flagged.filter((o) => !existingIds.has(o.videoId)).length;
  }
}

async function loadVideos(db: Db, channelIds: string[]): Promise<VideoRow[]> {
  const out: VideoRow[] = [];
  if (!channelIds.length) return out;
  const pageSize = 1000; // PostgREST's default row cap
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from('videos')
      .select('id, channel_id, format, format_source, published_at, views, stats_updated_at')
      .in('channel_id', channelIds)
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    out.push(...data);
    if (data.length < pageSize) return out;
  }
}

function toStats(rows: VideoRow[]): VideoStat[] {
  return rows.map((v) => ({ id: v.id, format: v.format, publishedAt: v.published_at, views: v.views }));
}

function groupBy<T>(xs: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) {
    const k = key(x);
    const arr = m.get(k);
    if (arr) arr.push(x);
    else m.set(k, [x]);
  }
  return m;
}

function toNum(s?: string): number | null {
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Record a job run in cron_runs and return its outcome. */
export async function logRun<T extends object>(db: Db, job: string, fn: () => Promise<T>) {
  const { data: run } = await db.from('cron_runs').insert({ job }).select('id').single();
  try {
    const summary = await fn();
    const errors = (summary as { errors?: unknown[] }).errors;
    const status = errors && errors.length ? 'partial' : 'ok';
    if (run) {
      await db
        .from('cron_runs')
        .update({ status, finished_at: new Date().toISOString(), summary: summary as unknown as Json })
        .eq('id', run.id);
    }
    return { status, summary };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (run) await db.from('cron_runs').update({ status: 'error', finished_at: new Date().toISOString(), error: message }).eq('id', run.id);
    throw e;
  }
}
