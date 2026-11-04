import Link from 'next/link';
import { requireOwner } from '@/lib/auth/owner';
import { createSeries } from './actions';

export const metadata = { title: 'Series · WQL Studio' };

export default async function SeriesPage() {
  const { supabase } = await requireOwner();
  const [{ data: series }, { data: ideas }] = await Promise.all([
    supabase.from('series').select('*').order('archived').order('sort_order'),
    supabase.from('ideas').select('series_id, status').not('series_id', 'is', null),
  ]);
  const counts = new Map<string, { total: number; published: number }>();
  for (const i of ideas ?? []) {
    const c = counts.get(i.series_id!) ?? { total: 0, published: 0 };
    c.total++;
    if (i.status === 'published') c.published++;
    counts.set(i.series_id!, c);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Series</h1>
      <p className="text-sm text-muted">
        A series is a run of Shorts where each one leads into the next, so viewers binge them in order.
      </p>
      <form action={createSeries} className="card space-y-2 p-3">
        <input name="name" required placeholder="Series name, e.g. Animal superpowers" className="input w-full" />
        <input name="description" placeholder="What ties it together (optional)" className="input w-full" />
        <button className="btn-primary" type="submit">
          Create series
        </button>
      </form>
      {series?.length === 0 && <div className="card p-6 text-sm text-muted">No series yet.</div>}
      <ul className="card divide-y divide-line">
        {series?.map((s) => {
          const c = counts.get(s.id) ?? { total: 0, published: 0 };
          return (
            <li key={s.id}>
              <Link href={`/series/${s.id}`} className="block p-3 hover:bg-line/30">
                <p className="font-medium">
                  {s.name} {s.archived && <span className="chip ml-1 text-muted">Archived</span>}
                </p>
                <p className="text-xs text-muted">
                  {c.total} Shorts · {c.published} published{s.playlist_id ? ' · playlist linked' : ''}
                  {s.description ? ` · ${s.description}` : ''}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
