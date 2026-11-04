import { describe, expect, it } from 'vitest';
import { cleanTitle, slugify, uniqueSlug } from '@/lib/core/slug';
import { changed, move, normalize } from '@/lib/core/series';

describe('slugify', () => {
  it.each([
    ["Why don't we just nuke a hurricane?", 'why-dont-we-just-nuke-hurricane'],
    ['Why do pigeons bob their heads?', 'why-pigeons-bob-their-heads'],
    ['Café crème: does it taste different?', 'cafe-creme-taste-different'],
    ['How much does a cloud weigh? #shorts', 'how-much-cloud-weigh'],
    ['🤯🤯', 'idea'],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
  it('keeps slugs short without cutting words', () => {
    const s = slugify('What would happen if every single person on Earth jumped at exactly the same time tonight');
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith('-')).toBe(false);
  });
  it('only produces folder-safe characters', () => {
    expect(slugify('Ünïcode / slashes \\ and dots...')).toMatch(/^[a-z0-9-]+$/);
  });
});

describe('uniqueSlug', () => {
  it('appends -2, -3 … when taken', () => {
    expect(uniqueSlug('sky-blue', [])).toBe('sky-blue');
    expect(uniqueSlug('sky-blue', ['sky-blue'])).toBe('sky-blue-2');
    expect(uniqueSlug('sky-blue', ['sky-blue', 'sky-blue-2'])).toBe('sky-blue-3');
  });
});

describe('cleanTitle', () => {
  it('strips hashtags, emoji and separators from outlier titles', () => {
    expect(cleanTitle('How to Shatter a chip with a rubber band 🤔 ||#shorts #knowledge #trick')).toBe(
      'How to Shatter a chip with a rubber band',
    );
    expect(cleanTitle('what happens when a snake loses its fang.mp4#shorts #viralshorts')).toBe('what happens when a snake loses its fang');
    expect(cleanTitle('Why Is There a TINY HOLE in Every Soda Can Tab 🥤🤯')).toBe('Why Is There a TINY HOLE in Every Soda Can Tab');
  });
});

describe('series ordering', () => {
  const items = [
    { id: 'c', position: 3 },
    { id: 'a', position: 1 },
    { id: 'x', position: null },
    { id: 'b', position: 2 },
  ];
  it('normalizes to 1..n with unpositioned items last', () => {
    expect(normalize(items)).toEqual([
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
      { id: 'c', position: 3 },
      { id: 'x', position: 4 },
    ]);
  });
  it('moves up and down, and ignores moves past the ends', () => {
    expect(move(items, 'b', 'up').map((x) => x.id)).toEqual(['b', 'a', 'c', 'x']);
    expect(move(items, 'b', 'down').map((x) => x.id)).toEqual(['a', 'c', 'b', 'x']);
    expect(move(items, 'a', 'up').map((x) => x.id)).toEqual(['a', 'b', 'c', 'x']);
    expect(move(items, 'x', 'down').map((x) => x.id)).toEqual(['a', 'b', 'c', 'x']);
  });
  it('reports only rows whose position changed', () => {
    expect(changed(items, move(items, 'b', 'down'))).toEqual([
      { id: 'c', position: 2 },
      { id: 'b', position: 3 },
      { id: 'x', position: 4 }, // unplaced items get a position too
    ]);
  });
});
