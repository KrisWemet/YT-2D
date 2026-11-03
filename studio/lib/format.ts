/** Display helpers shared by pages. */

export function compact(n: number | null | undefined): string {
  if (n == null) return '–';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function age(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '–';
  const h = (now.getTime() - Date.parse(iso)) / 3_600_000;
  if (h < 1) return 'just now';
  if (h < 48) return `${Math.round(h)}h`;
  const d = h / 24;
  if (d < 60) return `${Math.round(d)}d`;
  if (d < 730) return `${Math.round(d / 30)}mo`;
  return `${Math.round(d / 365)}y`;
}

export function duration(s: number | null | undefined): string {
  if (s == null) return '';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

export const TIER_LABEL: Record<string, string> = {
  mine: 'Mine',
  direct: 'Direct',
  rising: 'Rising',
  format: 'Format',
  benchmark: 'Benchmark',
};

/** A Date `days` before now (kept out of render bodies so components stay pure). */
export function daysAgo(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - days * 86_400_000);
}
