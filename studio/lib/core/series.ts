/** Series ordering helpers (pure). Positions are 1-based and gap-free. */

export type Positioned = { id: string; position: number | null };

/** Sort by position (nulls last, stable) and renumber 1..n. */
export function normalize(items: Positioned[]): { id: string; position: number }[] {
  return [...items]
    .map((it, i) => ({ ...it, i }))
    .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity) || a.i - b.i)
    .map((it, idx) => ({ id: it.id, position: idx + 1 }));
}

/** Move one item up or down by one place; returns the full new order. */
export function move(items: Positioned[], id: string, direction: 'up' | 'down'): { id: string; position: number }[] {
  const order = normalize(items).map((x) => x.id);
  const i = order.indexOf(id);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= order.length) return order.map((x, k) => ({ id: x, position: k + 1 }));
  [order[i], order[j]] = [order[j], order[i]];
  return order.map((x, k) => ({ id: x, position: k + 1 }));
}

/** Only the rows whose position actually changes, so updates stay minimal. */
export function changed(before: Positioned[], after: { id: string; position: number }[]) {
  const old = new Map(before.map((b) => [b.id, b.position]));
  return after.filter((a) => old.get(a.id) !== a.position);
}
