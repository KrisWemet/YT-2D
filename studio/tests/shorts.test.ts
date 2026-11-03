import { describe, expect, it } from 'vitest';
import { classifyFormat, hasShortsTag, isUncertainShort, parseIsoDuration } from '@/lib/core/shorts';

const AFTER = '2025-06-01T00:00:00Z'; // under the 3-minute rule
const BEFORE = '2024-06-01T00:00:00Z'; // under the old 60-second rule

describe('classifyFormat', () => {
  it('treats anything up to 60 s as a Short, whenever it was uploaded', () => {
    expect(classifyFormat({ durationS: 45, publishedAt: BEFORE }).format).toBe('short');
    expect(classifyFormat({ durationS: 60, publishedAt: AFTER }).format).toBe('short');
  });

  it('uses the 3-minute limit for uploads from 2024-10-15', () => {
    expect(classifyFormat({ durationS: 61, publishedAt: AFTER }).format).toBe('short');
    expect(classifyFormat({ durationS: 180, publishedAt: AFTER }).format).toBe('short');
    expect(classifyFormat({ durationS: 181, publishedAt: AFTER }).format).toBe('long');
  });

  it('switches rules exactly on 2024-10-15 (UTC)', () => {
    expect(classifyFormat({ durationS: 120, publishedAt: '2024-10-14T23:59:59Z' }).format).toBe('long');
    expect(classifyFormat({ durationS: 120, publishedAt: '2024-10-15T00:00:00Z' }).format).toBe('short');
  });

  it('uses the 60-second limit for older uploads', () => {
    expect(classifyFormat({ durationS: 90, publishedAt: BEFORE })).toEqual({ format: 'long', source: 'duration' });
  });

  it('records #shorts as the source when present', () => {
    expect(classifyFormat({ durationS: 120, publishedAt: AFTER, title: 'What if? #shorts' })).toEqual({ format: 'short', source: 'hashtag' });
    expect(classifyFormat({ durationS: 120, publishedAt: AFTER, description: 'more\n#Short' }).source).toBe('hashtag');
    expect(classifyFormat({ durationS: 120, publishedAt: AFTER })).toEqual({ format: 'short', source: 'duration' });
  });

  it('does not let #shorts turn a long video into a Short', () => {
    expect(classifyFormat({ durationS: 600, publishedAt: AFTER, title: '#shorts compilation' }).format).toBe('long');
  });

  it('leaves live, upcoming and zero-length videos unclassified', () => {
    expect(classifyFormat({ durationS: 30, publishedAt: AFTER, liveStatus: 'live' }).format).toBeNull();
    expect(classifyFormat({ durationS: 0, publishedAt: AFTER, liveStatus: 'upcoming' }).format).toBeNull();
    expect(classifyFormat({ durationS: null, publishedAt: AFTER }).format).toBeNull();
  });

  it('accepts Date objects', () => {
    expect(classifyFormat({ durationS: 120, publishedAt: new Date(AFTER) }).format).toBe('short');
  });
});

describe('hasShortsTag', () => {
  it('matches #shorts and #short as whole tags only', () => {
    expect(hasShortsTag('#shorts')).toBe(true);
    expect(hasShortsTag('ok #SHORT')).toBe(true);
    expect(hasShortsTag('#shortstory')).toBe(false);
    expect(hasShortsTag('a#shorts')).toBe(false);
    expect(hasShortsTag(null, null)).toBe(false);
  });
});

describe('isUncertainShort', () => {
  it('flags 61–180 s Shorts classified by duration alone', () => {
    expect(isUncertainShort(120, 'duration')).toBe(true);
    expect(isUncertainShort(120, 'hashtag')).toBe(false);
    expect(isUncertainShort(50, 'duration')).toBe(false);
    expect(isUncertainShort(120, 'manual')).toBe(false);
  });
});

describe('parseIsoDuration', () => {
  it('parses YouTube durations', () => {
    expect(parseIsoDuration('PT59S')).toBe(59);
    expect(parseIsoDuration('PT1M5S')).toBe(65);
    expect(parseIsoDuration('PT3M')).toBe(180);
    expect(parseIsoDuration('PT1H2M3S')).toBe(3723);
    expect(parseIsoDuration('P1DT1S')).toBe(86401);
    expect(parseIsoDuration('P0D')).toBe(0);
  });
  it('returns null for missing or malformed input', () => {
    expect(parseIsoDuration(undefined)).toBeNull();
    expect(parseIsoDuration('3:00')).toBeNull();
  });
});
