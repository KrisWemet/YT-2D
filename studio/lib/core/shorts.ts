/**
 * Short vs. long-form detection from public data only.
 *
 * YouTube's rule: a Short is square or vertical and up to 3 minutes long, for uploads on or after
 * 2024-10-15 (60 seconds before that). The public Data API exposes neither aspect ratio nor a
 * "Short" flag for other people's videos, so this uses duration, plus #shorts in the title or
 * description as a confidence signal. The undocumented "UUSH" Shorts-playlist ID pattern is not used.
 * A manual override (format_source = 'manual') always wins and is never overwritten by sync.
 */

export const SHORTS_3_MIN_FROM = Date.parse('2024-10-15T00:00:00Z');
export const SHORT_MAX_S_BEFORE = 60;
export const SHORT_MAX_S = 180;

export type VideoFormat = 'short' | 'long';
export type FormatSource = 'duration' | 'hashtag';

export type FormatInput = {
  durationS: number | null;
  publishedAt: string | Date;
  title?: string | null;
  description?: string | null;
  liveStatus?: string | null; // snippet.liveBroadcastContent: none | live | upcoming
};

export type FormatResult = { format: VideoFormat; source: FormatSource } | { format: null; source: null };

const SHORTS_TAG = /(^|\s)#shorts?\b/i;

export function hasShortsTag(title?: string | null, description?: string | null): boolean {
  return SHORTS_TAG.test(title ?? '') || SHORTS_TAG.test(description ?? '');
}

export function classifyFormat({ durationS, publishedAt, title, description, liveStatus }: FormatInput): FormatResult {
  if (liveStatus === 'live' || liveStatus === 'upcoming') return { format: null, source: null };
  if (durationS == null || durationS <= 0) return { format: null, source: null };

  const tagged = hasShortsTag(title, description);
  if (durationS <= SHORT_MAX_S_BEFORE) {
    return { format: 'short', source: tagged ? 'hashtag' : 'duration' };
  }
  const published = typeof publishedAt === 'string' ? Date.parse(publishedAt) : publishedAt.getTime();
  if (published < SHORTS_3_MIN_FROM || durationS > SHORT_MAX_S) {
    return { format: 'long', source: 'duration' };
  }
  // 61–180 s, uploaded under the 3-minute rule: most likely a Short. #shorts makes it near certain.
  return { format: 'short', source: tagged ? 'hashtag' : 'duration' };
}

/** True when the format is a guess worth a second look: a 61–180 s "Short" without #shorts. */
export function isUncertainShort(durationS: number | null, source: string | null): boolean {
  return durationS != null && durationS > SHORT_MAX_S_BEFORE && durationS <= SHORT_MAX_S && source === 'duration';
}

/** ISO 8601 duration from contentDetails.duration (e.g. PT1M5S, P1DT2H, P0D) to seconds. */
export function parseIsoDuration(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(iso);
  if (!m) return null;
  const [, w, d, h, min, s] = m;
  return (
    Number(w ?? 0) * 604800 +
    Number(d ?? 0) * 86400 +
    Number(h ?? 0) * 3600 +
    Number(min ?? 0) * 60 +
    Math.round(Number(s ?? 0))
  );
}
