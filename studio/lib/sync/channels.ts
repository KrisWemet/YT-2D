import 'server-only';
import type { ChannelRef } from '@/lib/core/channelInput';
import type { Db } from '@/lib/supabase/admin';
import type { Enums, TablesInsert } from '@/lib/supabase/database.types';
import { bestThumb, chunk, type YouTubeClient, type YtChannel } from '@/lib/youtube/client';

export type Tier = Enums<'channel_tier'>;

/** Channel stats columns from a channels.list item. */
export function channelFields(c: YtChannel) {
  const s = c.statistics ?? {};
  return {
    title: c.snippet?.title ?? c.id,
    handle: c.snippet?.customUrl ?? null,
    subs: s.hiddenSubscriberCount ? null : toNum(s.subscriberCount),
    subs_hidden: Boolean(s.hiddenSubscriberCount),
    video_count: toNum(s.videoCount),
    view_count: toNum(s.viewCount),
    uploads_playlist_id: c.contentDetails?.relatedPlaylists?.uploads ?? null,
    thumbnail_url: bestThumb(c.snippet?.thumbnails),
    stats_updated_at: new Date().toISOString(),
  };
}

export async function resolveChannel(yt: YouTubeClient, ref: ChannelRef): Promise<YtChannel | null> {
  switch (ref.kind) {
    case 'id':
      return (await yt.channelsById([ref.id], 'normal'))[0] ?? null;
    case 'handle':
      return yt.channelByHandle(ref.handle, 'normal');
    case 'username':
      return yt.channelByUsername(ref.username, 'normal');
    default:
      return null;
  }
}

// ---------------------------------------------------------------- seed import

export type SeedEntry = {
  tier: Tier;
  channel_id: string | null;
  handle: string | null;
  title: string;
  subscribers?: number | null;
  why?: string | null;
};

export type SeedReport = {
  added: { id: string; title: string; tier: Tier }[];
  alreadyTracked: { id: string; title: string }[];
  dropped: { title: string; ref: string; reason: string }[];
  renamed: { id: string; seedTitle: string; youtubeTitle: string }[];
};

/**
 * Resolve every seed entry with the official API and insert the ones that exist.
 * Entries with a channel ID are looked up in batches of 50 (1 unit each batch); entries with only a
 * handle ("unverified") are looked up with forHandle (1 unit each) and dropped if they don't resolve.
 * Channels already in the table are left as they are, so re-running never undoes edits made in the app.
 */
export async function importSeed(db: Db, yt: YouTubeClient, entries: SeedEntry[]): Promise<SeedReport> {
  const report: SeedReport = { added: [], alreadyTracked: [], dropped: [], renamed: [] };
  const found = new Map<string, { entry: SeedEntry; channel: YtChannel }>();

  const withId = entries.filter((e) => e.channel_id);
  for (const batch of chunk(withId, 50)) {
    const items = await yt.channelsById(batch.map((e) => e.channel_id!), 'normal');
    const byId = new Map(items.map((c) => [c.id, c]));
    for (const e of batch) {
      const c = byId.get(e.channel_id!);
      if (c) found.set(c.id, { entry: e, channel: c });
      else report.dropped.push({ title: e.title, ref: e.channel_id!, reason: 'channel ID not found' });
    }
  }
  for (const e of entries.filter((x) => !x.channel_id)) {
    if (!e.handle) {
      report.dropped.push({ title: e.title, ref: '(none)', reason: 'no channel ID or handle' });
      continue;
    }
    const c = await yt.channelByHandle(e.handle, 'normal');
    if (c) found.set(c.id, { entry: e, channel: c });
    else report.dropped.push({ title: e.title, ref: e.handle, reason: 'unverified handle did not resolve' });
  }

  const ids = [...found.keys()];
  const { data: existing, error } = await db.from('channels').select('id, title').in('id', ids.length ? ids : ['-']);
  if (error) throw new Error(error.message);
  const existingIds = new Set((existing ?? []).map((r) => r.id));

  const rows: TablesInsert<'channels'>[] = [];
  for (const [id, { entry, channel }] of found) {
    const fields = channelFields(channel);
    if (normalize(fields.title) !== normalize(entry.title)) {
      report.renamed.push({ id, seedTitle: entry.title, youtubeTitle: fields.title });
    }
    if (existingIds.has(id)) {
      report.alreadyTracked.push({ id, title: fields.title });
      continue;
    }
    rows.push({ id, tier: entry.tier, why: entry.why ?? null, ...fields, handle: fields.handle ?? entry.handle });
    report.added.push({ id, title: fields.title, tier: entry.tier });
  }
  if (rows.length) {
    const { error: insErr } = await db.from('channels').insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
  return report;
}

function toNum(s?: string): number | null {
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}
