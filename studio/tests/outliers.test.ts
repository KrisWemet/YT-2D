import { describe, expect, it } from 'vitest';
import {
  ageDays,
  computeBaseline,
  detectOutliers,
  isStatsFresh,
  median,
  viewsPerDay,
  type VideoStat,
} from '@/lib/core/outliers';

const NOW = new Date('2026-11-03T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

function vids(format: 'short' | 'long', specs: Array<[age: number, views: number]>, prefix = format): VideoStat[] {
  return specs.map(([age, views], i) => ({ id: `${prefix}${i}`, format, publishedAt: daysAgo(age), views }));
}

describe('median', () => {
  it('handles odd, even and empty input', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  it('does not mutate its input', () => {
    const xs = [3, 1, 2];
    median(xs);
    expect(xs).toEqual([3, 1, 2]);
  });
});

describe('computeBaseline', () => {
  it('uses only the same format', () => {
    const v = [...vids('short', [[10, 100], [11, 100], [12, 100], [13, 100], [14, 100]]), ...vids('long', [[10, 9e6]])];
    expect(computeBaseline(v, 'short', NOW)?.median).toBe(100);
  });

  it('takes the last 30 mature uploads, newest first', () => {
    // 40 mature Shorts: the 30 newest have 1,000 views, the 10 oldest have 1,000,000.
    const specs: Array<[number, number]> = [];
    for (let i = 0; i < 30; i++) specs.push([8 + i, 1000]);
    for (let i = 0; i < 10; i++) specs.push([100 + i, 1_000_000]);
    const b = computeBaseline(vids('short', specs), 'short', NOW)!;
    expect(b.sampleSize).toBe(30);
    expect(b.median).toBe(1000);
  });

  it('ignores uploads younger than 7 days', () => {
    const v = vids('short', [[1, 1], [2, 1], [3, 1], [10, 500], [11, 500], [12, 500], [13, 500], [14, 500]]);
    expect(computeBaseline(v, 'short', NOW)?.median).toBe(500);
  });

  it('returns null with fewer than 5 mature uploads or a zero median', () => {
    expect(computeBaseline(vids('short', [[10, 1], [11, 1], [12, 1], [13, 1]]), 'short', NOW)).toBeNull();
    expect(computeBaseline(vids('short', [[10, 0], [11, 0], [12, 0], [13, 0], [14, 0]]), 'short', NOW)).toBeNull();
  });

  it('skips videos without a view count', () => {
    const v = vids('short', [[10, 100], [11, 100], [12, 100], [13, 100], [14, 100]]);
    v.push({ id: 'hidden', format: 'short', publishedAt: daysAgo(9), views: null });
    expect(computeBaseline(v, 'short', NOW)?.sampleSize).toBe(5);
  });
});

describe('detectOutliers', () => {
  const baseline = { format: 'short' as const, median: 1000, sampleSize: 30, videoIds: [] };

  it('flags uploads at or above 5× the median, sorted by multiple', () => {
    const v = vids('short', [[3, 4999], [3, 5000], [20, 12_000], [20, 100]]);
    const o = detectOutliers(v, baseline, NOW);
    expect(o.map((x) => x.videoId)).toEqual(['short2', 'short1']);
    expect(o[0].multiple).toBe(12);
    expect(o[1].multiple).toBe(5);
  });

  it('only considers uploads under 60 days old', () => {
    const v = vids('short', [[59.9, 50_000], [60, 50_000], [200, 50_000]]);
    expect(detectOutliers(v, baseline, NOW).map((x) => x.videoId)).toEqual(['short0']);
  });

  it('never compares across formats', () => {
    expect(detectOutliers(vids('long', [[3, 1e9]]), baseline, NOW)).toEqual([]);
  });

  it('reports views per day and age', () => {
    const [o] = detectOutliers(vids('short', [[10, 100_000]]), baseline, NOW);
    expect(o.viewsPerDay).toBe(10_000);
    expect(o.ageDays).toBe(10);
    expect(o.baselineMedian).toBe(1000);
  });

  it('honours a custom threshold', () => {
    const v = vids('short', [[3, 3000]]);
    expect(detectOutliers(v, baseline, NOW, { threshold: 3 })).toHaveLength(1);
  });
});

describe('age and views per day', () => {
  it('counts the first day as a full day', () => {
    expect(viewsPerDay(5000, 0.1)).toBe(5000);
    expect(viewsPerDay(5000, 2)).toBe(2500);
  });
  it('never returns a negative age for clock skew', () => {
    expect(ageDays(new Date(NOW.getTime() + 60_000), NOW)).toBe(0);
  });
});

describe('stats freshness', () => {
  it('refreshes young videos after 20 hours and old ones after a week', () => {
    const h = (n: number) => new Date(NOW.getTime() - n * 3_600_000).toISOString();
    expect(isStatsFresh(h(19), 5, NOW)).toBe(true);
    expect(isStatsFresh(h(21), 5, NOW)).toBe(false);
    expect(isStatsFresh(h(100), 90, NOW)).toBe(true);
    expect(isStatsFresh(h(24 * 8), 90, NOW)).toBe(false);
    expect(isStatsFresh(null, 5, NOW)).toBe(false);
  });
});
