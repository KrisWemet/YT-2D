import Link from 'next/link';
import { StatusChip } from '@/components/StatusChip';
import { requireOwner } from '@/lib/auth/owner';
import { age } from '@/lib/format';
import { IDEA_STATUSES, STATUS_LABEL } from '@/lib/ideas';
import type { Enums } from '@/lib/supabase/database.types';
import { createIdea } from './actions';

export const metadata = { title: 'Ideas · WQL Studio' };

const SOURCE_LABEL: Record<Enums<'idea_source'>, string> = { manual: 'Mine', outlier: 'Outlier', claude: 'Suggested', comment: 'Comment' };

export default async function IdeasPage({ searchParams }: PageProps<'/ideas'>) {
  const { supabase } = await requireOwner();
  const sp = await searchParams;
  const status = typeof sp.status === 'string' && (IDEA_STATUSES as string[]).includes(sp.status) ? (sp.status as Enums<'idea_status'>) : 'all';
  const series = typeof sp.series === 'string' ? sp.series : 'all';
  const queued = sp.queued === '1';
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  let query = supabase.from('ideas').select('id, question, status, source, series_id, position_in_series, queued_at, updated_at, theme');
  if (status !== 'all') query = query.eq('status', status);
  if (series === 'none') query = query.is('series_id', null);
  else if (series !== 'all') query = query.eq('series_id', series);
  if (queued) query = query.not('queued_at', 'is', null);
  if (q) query = query.ilike('question', `%${q.replace(/[%_]/g, '')}%`);
  const [{ data: ideas, error }, { data: allSeries }, { count: queuedCount }] = await Promise.all([
    query.order('updated_at', { ascending: false }).limit(300),
    supabase.from('series').select('id, name').eq('archived', false).order('sort_order'),
    supabase.from('ideas').select('id', { count: 'exact', head: true }).not('queued_at', 'is', null),
  ]);
  const seriesName = new Map((allSeries ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">Idea bank</h1>
        <Link href="/ideas?queued=1" className="text-sm text-muted hover:text-fg">
          {queuedCount ?? 0} queued for Sunday
        </Link>
      </div>

      <form action={createIdea} className="card space-y-2 p-3">
        <input name="question" required placeholder="A weird question… e.g. Why can't you tickle yourself?" className="input w-full" />
        <div className="flex flex-wrap items-center gap-2">
          <select name="series_id" className="input" aria-label="Series" defaultValue="">
            <option value="">No series</option>
            {(allSeries ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" name="queue" /> Queue for Sunday
          </label>
          <button className="btn-primary ml-auto" type="submit">
            Add idea
          </button>
        </div>
      </form>

      <form method="get" className="card grid grid-cols-2 gap-2 p-3 sm:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="Search" className="input col-span-2 sm:col-span-1" />
        <select name="status" defaultValue={status} className="input" aria-label="Status">
          <option value="all">Any status</option>
          {IDEA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="series" defaultValue={series} className="input" aria-label="Series">
          <option value="all">Any series</option>
          <option value="none">No series</option>
          {(allSeries ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="queued" value="1" defaultChecked={queued} /> Queued only
        </label>
        <button className="btn" type="submit">
          Filter
        </button>
      </form>

      {error && <p className="text-sm text-red-600">Could not load ideas: {error.message}</p>}
      {ideas?.length === 0 && (
        <div className="card p-6 text-sm text-muted">
          No ideas here yet. Add one above, tap “Save as idea” on an outlier, or keep a suggestion on the Themes page.
        </div>
      )}
      <ul className="card divide-y divide-line">
        {ideas?.map((i) => (
          <li key={i.id}>
            <Link href={`/ideas/${i.id}`} className="block space-y-1 p-3 hover:bg-line/30">
              <p className="font-medium leading-snug">{i.question}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <StatusChip status={i.status} />
                {i.queued_at && <span className="chip border-accent bg-accent/20 text-fg">Queued</span>}
                {i.series_id && (
                  <span>
                    {seriesName.get(i.series_id) ?? 'Series'} #{i.position_in_series ?? '?'}
                  </span>
                )}
                <span>{SOURCE_LABEL[i.source]}</span>
                {i.theme && <span>· {i.theme}</span>}
                <span className="ml-auto">{age(i.updated_at)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
