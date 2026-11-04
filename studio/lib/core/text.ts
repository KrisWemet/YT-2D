/**
 * Text going into Postgres via PostgREST is sent as JSON, and Postgres rejects JSON that contains
 * half of a surrogate pair (e.g. an emoji cut in two). These helpers never produce one.
 */

/** Replace any lone surrogate with U+FFFD. */
export function wellFormed(s: string): string {
  return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '�');
}

/** First `max` characters (code points, so emoji stay whole), well-formed. */
export function clip(s: string | null | undefined, max: number): string {
  return wellFormed(Array.from(s ?? '').slice(0, max).join(''));
}
