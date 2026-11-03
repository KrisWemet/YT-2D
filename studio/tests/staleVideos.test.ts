import { describe, expect, it } from 'vitest';
import { pickStaleVideos } from '@/lib/sync/run';

const NOW = new Date('2026-11-03T12:00:00Z');
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

type Row = Parameters<typeof pickStaleVideos>[0][number];
const row = (id: string, ageDays: number, statsAgeDays: number | null, format: 'short' | 'long' = 'short'): Row => ({
  id,
  channel_id: 'UCchan',
  format,
  format_source: 'duration',
  published_at: ago(ageDays),
  views: 1000,
  stats_updated_at: statsAgeDays == null ? null : ago(statsAgeDays),
});

describe('pickStaleVideos (what the daily sync refetches)', () => {
  it('refreshes uploads under 60 days old once a day, as essential calls', () => {
    const { essential, normal } = pickStaleVideos([row('young-stale', 10, 1), row('young-fresh', 10, 0.5)], NOW);
    expect(essential.map((v) => v.id)).toEqual(['young-stale']);
    expect(normal).toEqual([]);
  });

  it('refreshes older uploads only if they are in a baseline sample, weekly, as non-essential calls', () => {
    const rows = [row('old-1', 100, 8), row('old-2', 101, 2)];
    const { essential, normal } = pickStaleVideos(rows, NOW);
    expect(essential).toEqual([]);
    expect(normal.map((v) => v.id)).toEqual(['old-1']);
  });

  it('leaves old uploads outside the last 30 alone', () => {
    const rows = Array.from({ length: 31 }, (_, i) => row(`v${i}`, 70 + i, 30));
    const { normal } = pickStaleVideos(rows, NOW);
    expect(normal).toHaveLength(30);
    expect(normal.map((v) => v.id)).not.toContain('v30');
  });

  it('never refetches a video fetched for the first time today', () => {
    const { essential, normal } = pickStaleVideos([row('new', 1, 0)], NOW);
    expect([...essential, ...normal]).toEqual([]);
  });
});
