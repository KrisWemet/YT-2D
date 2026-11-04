/**
 * Slugs name an idea's handoff folder (videos/<slug>/), so they are ASCII, short and stable:
 * set once when the idea is created and never changed by later edits to the question.
 */

const STOP = new Set(['a', 'an', 'the', 'do', 'does', 'did', 'is', 'are', 'was', 'were', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'it', 'its']);

export function slugify(text: string, maxLength = 60): string {
  const words = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // accents
    .toLowerCase()
    .replace(/#\S+/g, ' ') // hashtags
    .replace(/['’]/g, '') // don't → dont
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => !STOP.has(w));
  const chosen = meaningful.length >= 2 ? meaningful : words;
  let slug = '';
  for (const w of chosen) {
    const next = slug ? `${slug}-${w}` : w;
    if (next.length > maxLength) break;
    slug = next;
  }
  return slug || 'idea';
}

/** base, base-2, base-3 … whichever isn't taken. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!set.has(candidate)) return candidate;
  }
}

/** Turn an outlier's title into a starting question: drop hashtags, emoji and "||" clutter. */
export function cleanTitle(title: string): string {
  return title
    .replace(/#\S+/g, ' ')
    .replace(/\|+/g, ' ')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\.mp4\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
