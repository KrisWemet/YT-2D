/**
 * YouTube Data API v3 quota bookkeeping (pure functions, no I/O).
 *
 * Costs from https://developers.google.com/youtube/v3/determine_quota_cost (checked 2026-11-03).
 * Quota resets at midnight Pacific Time, so usage is grouped by the Pacific calendar date.
 * search.list and videos.insert now have their own buckets (100 calls/day); Studio uses neither.
 */

export const YOUTUBE_COSTS = {
  'channels.list': 1,
  'playlistItems.list': 1,
  'videos.list': 1,
  'playlists.list': 1,
  'playlists.insert': 50,
  'playlists.update': 50,
  'playlistItems.insert': 50,
  'playlistItems.update': 50,
  'playlistItems.delete': 50,
} as const;

export type YouTubeEndpoint = keyof typeof YOUTUBE_COSTS;

/** essential: the daily uploads/stats sync. normal: backfill pages, baseline refreshes, manual lookups. */
export type Priority = 'essential' | 'normal';

export const QUOTA_TIME_ZONE = 'America/Los_Angeles';

/** The quota day (YYYY-MM-DD, Pacific time) that `at` falls in. */
export function quotaDay(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: QUOTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export type BudgetInput = {
  used: number; // units already spent today
  cost: number; // units this call will spend
  limit: number; // daily quota (default 10,000)
  reserveFraction: number; // share of the quota kept back for essential calls (e.g. 0.1)
  priority: Priority;
};

export type BudgetDecision = { allowed: true } | { allowed: false; reason: string };

/**
 * Decide whether a call may run. Essential calls may use the whole quota; anything else
 * stops once spending would cross the reserve line, so the daily sync always has room.
 */
export function checkBudget({ used, cost, limit, reserveFraction, priority }: BudgetInput): BudgetDecision {
  if (used + cost > limit) {
    return { allowed: false, reason: `daily quota exhausted (${used}/${limit} units used)` };
  }
  const softCap = Math.floor(limit * (1 - reserveFraction));
  if (priority !== 'essential' && used + cost > softCap) {
    return { allowed: false, reason: `near the daily limit (${used}/${limit} units used); non-essential call skipped` };
  }
  return { allowed: true };
}
