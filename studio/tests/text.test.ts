import { describe, expect, it } from 'vitest';
import { clip, wellFormed } from '@/lib/core/text';

describe('clip', () => {
  it('never cuts an emoji in half (the bug that broke the first sync)', () => {
    const s = 'a'.repeat(499) + '🌪️ storm';
    const naive = s.slice(0, 500); // ends in a lone high surrogate
    expect(() => JSON.parse(JSON.stringify(naive))).not.toThrow(); // JS is fine with it…
    expect(/[\uD800-\uDBFF]$/.test(naive)).toBe(true); // …but Postgres json isn't
    const c = clip(s, 500);
    expect(Array.from(c)).toHaveLength(500);
    expect(c.endsWith('🌪')).toBe(true);
    expect(/[\uD800-\uDFFF]/.test(c.replace(/\p{Extended_Pictographic}/gu, ''))).toBe(false);
  });
  it('handles empty input', () => {
    expect(clip(null, 10)).toBe('');
    expect(clip(undefined, 10)).toBe('');
  });
});

describe('wellFormed', () => {
  it('replaces lone surrogates and keeps valid pairs', () => {
    expect(wellFormed('ok \uD83D')).toBe('ok �');
    expect(wellFormed('\uDE00 x')).toBe('� x');
    expect(wellFormed('🐦 pigeon')).toBe('🐦 pigeon');
  });
});
