import 'server-only';
import type { Db } from '@/lib/supabase/admin';
import type { UsageEntry, UsageStore } from '@/lib/youtube/client';
import { YouTubeClient } from '@/lib/youtube/client';
import { env } from '@/lib/env';

/** Usage log in Supabase (api_usage). Written with the secret key; the owner can only read it. */
export class SupabaseUsageStore implements UsageStore {
  constructor(private readonly db: Db) {}

  async usedToday(quotaDay: string): Promise<number> {
    const { data, error } = await this.db
      .from('api_usage_daily')
      .select('units')
      .eq('quota_day', quotaDay)
      .eq('api', 'youtube_data');
    if (error) throw new Error(`could not read api_usage: ${error.message}`);
    return (data ?? []).reduce((s, r) => s + (r.units ?? 0), 0);
  }

  async record(e: UsageEntry): Promise<void> {
    const { error } = await this.db.from('api_usage').insert({
      quota_day: e.quotaDay,
      api: e.api,
      endpoint: e.endpoint,
      units: e.units,
      ok: e.ok,
      http_status: e.httpStatus,
      job: e.job,
    });
    if (error) console.error('api_usage insert failed:', error.message);
  }
}

export function createYouTubeClient(db: Db, job: string) {
  return new YouTubeClient({
    apiKey: env.youtubeApiKey(),
    store: new SupabaseUsageStore(db),
    limit: env.youtubeDailyQuota(),
    reserveFraction: env.youtubeQuotaReserve(),
    job,
  });
}
