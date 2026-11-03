/**
 * Outlier maths (pure functions, no I/O).
 *
 * Baseline: the median views of a channel's last 30 uploads of the same format (Shorts and long
 * form separately). Only "mature" uploads (at least 7 days old) go into the baseline, so a batch of
 * brand-new videos can't drag the median down and inflate every multiple.
 * Outlier: an upload under 60 days old with views ≥ 5× that baseline. Young uploads can be flagged
 * early; they're compared against the mature baseline.
 */

import type { VideoFormat } from './shorts';

export const DAY_MS = 86_400_000;

export type OutlierOptions = {
  sampleSize: number;
  minAgeDays: number;
  minSample: number;
  threshold: number;
  maxAgeDays: number;
};

export const OUTLIER_DEFAULTS: Readonly<OutlierOptions> = {
  sampleSize: 30, // last N uploads per format
  minAgeDays: 7, // baseline uses uploads at least this old
  minSample: 5, // fewer mature uploads than this → no baseline yet
  threshold: 5, // flag at ≥ 5× the median
  maxAgeDays: 60, // only uploads younger than this are candidates (and get daily snapshots)
};

export type VideoStat = {
  id: string;
  format: VideoFormat | null;
  publishedAt: string | Date;
  views: number | null;
};

export type Baseline = { format: VideoFormat; median: number; sampleSize: number; videoIds: string[] };

export type Outlier = {
  videoId: string;
  format: VideoFormat;
  multiple: number;
  views: number;
  viewsPerDay: number;
  ageDays: number;
  baselineMedian: number;
};

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function ageDays(publishedAt: string | Date, now: Date): number {
  const t = typeof publishedAt === 'string' ? Date.parse(publishedAt) : publishedAt.getTime();
  return Math.max(0, (now.getTime() - t) / DAY_MS);
}

/** Views per day since upload. The first day counts as a full day, so a 3-hour-old video isn't ×8. */
export function viewsPerDay(views: number, age: number): number {
  return views / Math.max(age, 1);
}

export function computeBaseline(
  videos: VideoStat[],
  format: VideoFormat,
  now: Date,
  opts: Partial<OutlierOptions> = {},
): Baseline | null {
  const { sampleSize, minAgeDays, minSample } = { ...OUTLIER_DEFAULTS, ...opts };
  const sample = videos
    .filter((v) => v.format === format && v.views != null && ageDays(v.publishedAt, now) >= minAgeDays)
    .sort((a, b) => toMs(b.publishedAt) - toMs(a.publishedAt))
    .slice(0, sampleSize);
  if (sample.length < minSample) return null;
  const m = median(sample.map((v) => v.views as number));
  if (m == null || m <= 0) return null;
  return { format, median: m, sampleSize: sample.length, videoIds: sample.map((v) => v.id) };
}

export function detectOutliers(
  videos: VideoStat[],
  baseline: Baseline,
  now: Date,
  opts: Partial<OutlierOptions> = {},
): Outlier[] {
  const { threshold, maxAgeDays } = { ...OUTLIER_DEFAULTS, ...opts };
  const out: Outlier[] = [];
  for (const v of videos) {
    if (v.format !== baseline.format || v.views == null) continue;
    const age = ageDays(v.publishedAt, now);
    if (age >= maxAgeDays) continue;
    const multiple = v.views / baseline.median;
    if (multiple < threshold) continue;
    out.push({
      videoId: v.id,
      format: baseline.format,
      multiple: round(multiple, 2),
      views: v.views,
      viewsPerDay: Math.round(viewsPerDay(v.views, age)),
      ageDays: round(age, 1),
      baselineMedian: baseline.median,
    });
  }
  return out.sort((a, b) => b.multiple - a.multiple);
}

/** Freshness rule for video stats: uploads under 60 days refresh daily, older ones weekly. */
export function statsTtlMs(age: number): number {
  return age < OUTLIER_DEFAULTS.maxAgeDays ? 20 * 3_600_000 : 7 * DAY_MS;
}

export function isStatsFresh(statsUpdatedAt: string | null, age: number, now: Date): boolean {
  if (!statsUpdatedAt) return false;
  return now.getTime() - Date.parse(statsUpdatedAt) < statsTtlMs(age);
}

function toMs(d: string | Date) {
  return typeof d === 'string' ? Date.parse(d) : d.getTime();
}
function round(x: number, places: number) {
  const f = 10 ** places;
  return Math.round(x * f) / f;
}
