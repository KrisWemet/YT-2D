import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusChip } from '@/components/StatusChip';
import { requireOwner } from '@/lib/auth/owner';
import { addIdeaToSeries, moveIdea, removeIdeaFromSeries, updateSeries } from '../actions';

export const metadata = { title: 'Series · WQL Studio' };

export default async function SeriesDetail({ params }: PageProps<'/series/[id]'>) {
  const { id } = await params;
  const { supabase } = await requireOwner();
  const { data: s } = await supabase.from('series').select('*').eq('id', id).maybeSingle();
  if (!s) notFound();
  const [{ data: items }, { data: loose }] = await Promise.all([
    supabase.from('ideas').select('id, question, status, position_in_series, queued_at').eq('series_id', id).order('position_in_series', { nullsFirst: false }),
    supabase.from('ideas').select('id, question').is('series_id', null).neq('status', 'published').order('updated_at', { ascending: false }).limit(100),
  ]);
  const list = items ?? [];

  return (
    <div className="space-y-4">
      <Link href="/series" className="text-sm text-muted hover:text-fg">
        ← Series
      </Link>
      <form action={updateSeries} className="card space-y-2 p-4">
        <input type="hidden" name="id" value={s.id} />
        <input name="name" required defaultValue={s.name} className="input w-full text-lg font-semibold" />
        <textarea name="description" rows={2} defaultValue={s.description ?? ''} placeholder="What ties it together" className="input w-full" />
        <div className="flex flex-wrap items-center gap-2">
          <input name="playlist_id" defaultValue={s.playlist_id ?? ''} placeholder="YouTube playlist ID (PL…)" className="input flex-1" />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" name="archived" defaultChecked={s.archived} /> Archived
          </label>
          <button className="btn-primary" type="submit">
            Save
          </button>
        </div>
        <p className="text-xs text-muted">
          Creating or updating the YouTube playlist from here needs write access to your channel. Studio will ask before
          that’s turned on; until then, paste the playlist ID by hand.
        </p>
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Watch order · {list.length}</h2>
        {list.length === 0 && <div className="card p-4 text-sm text-muted">No Shorts in this series yet. Add ideas below.</div>}
        <ol className="space-y-2">
          {list.map((i, idx) => (
            <li key={i.id} className="card p-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-6 shrink-0 text-center text-lg font-bold text-muted">{idx + 1}</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <Link href={`/ideas/${i.id}`} className="font-medium leading-snug hover:underline">
                    {i.question}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusChip status={i.status} />
                    {i.queued_at && <span className="chip border-accent bg-accent/20">Queued</span>}
                  </div>
                  {idx < list.length - 1 && <p className="text-xs text-muted">↳ teases: {list[idx + 1].question}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {(['up', 'down'] as const).map((dir) => (
                    <form key={dir} action={moveIdea}>
                      <input type="hidden" name="series_id" value={s.id} />
                      <input type="hidden" name="idea_id" value={i.id} />
                      <input type="hidden" name="direction" value={dir} />
                      <button
                        className="btn px-2 py-0.5 text-xs"
                        type="submit"
                        disabled={(dir === 'up' && idx === 0) || (dir === 'down' && idx === list.length - 1)}
                        aria-label={`Move ${dir}`}
                      >
                        {dir === 'up' ? '↑' : '↓'}
                      </button>
                    </form>
                  ))}
                  <form action={removeIdeaFromSeries}>
                    <input type="hidden" name="series_id" value={s.id} />
                    <input type="hidden" name="idea_id" value={i.id} />
                    <button className="btn px-2 py-0.5 text-xs" type="submit" aria-label="Remove from series">
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <form action={addIdeaToSeries} className="card flex flex-wrap gap-2 p-3">
        <input type="hidden" name="series_id" value={s.id} />
        <select name="idea_id" className="input min-w-0 flex-1" defaultValue="" aria-label="Idea to add">
          <option value="" disabled>
            {loose?.length ? 'Add an idea from the bank…' : 'No unassigned ideas'}
          </option>
          {(loose ?? []).map((i) => (
            <option key={i.id} value={i.id}>
              {i.question}
            </option>
          ))}
        </select>
        <button className="btn" type="submit" disabled={!loose?.length}>
          Add to end
        </button>
      </form>
    </div>
  );
}
