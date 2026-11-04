import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConfirmButton } from '@/components/ConfirmButton';
import { StatusChip } from '@/components/StatusChip';
import { requireOwner } from '@/lib/auth/owner';
import { age, compact } from '@/lib/format';
import { IDEA_STATUSES, STATUS_LABEL } from '@/lib/ideas';
import { deleteIdea, setQueued, updateIdea } from '../actions';

export const metadata = { title: 'Idea · WQL Studio' };

export default async function IdeaPage({ params }: PageProps<'/ideas/[id]'>) {
  const { id } = await params;
  const { supabase } = await requireOwner();
  const { data: idea } = await supabase.from('ideas').select('*').eq('id', id).maybeSingle();
  if (!idea) notFound();
  const [{ data: allSeries }, { data: events }, { data: outlier }] = await Promise.all([
    supabase.from('series').select('id, name').order('sort_order'),
    supabase.from('idea_events').select('*').eq('idea_id', id).order('at', { ascending: false }).limit(30),
    idea.source_outlier_id
      ? supabase.from('outlier_feed').select('*').eq('video_id', idea.source_outlier_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/ideas" className="text-sm text-muted hover:text-fg">
        ← Idea bank
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={idea.status} />
        {idea.queued_at && <span className="chip border-accent bg-accent/20">Queued for Sunday</span>}
        <span className="text-xs text-muted">videos/{idea.slug}/</span>
      </div>

      <form action={updateIdea} className="card space-y-3 p-4">
        <input type="hidden" name="id" value={idea.id} />
        <label className="block space-y-1">
          <span className="text-sm font-medium">Question</span>
          <textarea name="question" required rows={2} defaultValue={idea.question} className="input w-full" />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Status</span>
            <select name="status" defaultValue={idea.status} className="input w-full">
              {IDEA_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Series</span>
            <select name="series_id" defaultValue={idea.series_id ?? ''} className="input w-full">
              <option value="">No series</option>
              {(allSeries ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Position in series</span>
            <input name="position_in_series" type="number" min={1} defaultValue={idea.position_in_series ?? ''} className="input w-full" />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Notes</span>
          <textarea name="notes" rows={4} defaultValue={idea.notes ?? ''} className="input w-full" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">YouTube video ID (once published)</span>
          <input name="youtube_video_id" defaultValue={idea.youtube_video_id ?? ''} className="input w-full" />
        </label>
        <button className="btn-primary" type="submit">
          Save
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={setQueued}>
          <input type="hidden" name="id" value={idea.id} />
          <input type="hidden" name="queued" value={idea.queued_at ? 'false' : 'true'} />
          <button className="btn" type="submit">
            {idea.queued_at ? 'Remove from Sunday queue' : 'Queue for Sunday'}
          </button>
        </form>
        <form action={deleteIdea} className="ml-auto">
          <input type="hidden" name="id" value={idea.id} />
          <ConfirmButton message="Delete this idea? This can't be undone." className="btn text-red-600">
            Delete
          </ConfirmButton>
        </form>
      </div>

      {outlier && (
        <section className="card flex gap-3 p-3">
          {outlier.thumbnail_url && <img src={outlier.thumbnail_url} alt="" className="h-16 w-28 shrink-0 rounded object-cover" />}
          <div className="min-w-0 text-sm">
            <p className="text-xs text-muted">Inspired by</p>
            <a
              className="line-clamp-2 font-medium hover:underline"
              href={`https://www.youtube.com/${outlier.format === 'short' ? 'shorts/' : 'watch?v='}${outlier.video_id}`}
              target="_blank"
              rel="noreferrer"
            >
              {outlier.title}
            </a>
            <p className="text-xs text-muted">
              {outlier.channel_title} · {Number(outlier.multiple_vs_channel_median).toFixed(1)}× · {compact(outlier.views)} views
            </p>
          </div>
        </section>
      )}
      {idea.theme && <p className="text-sm text-muted">Theme: {idea.theme}</p>}

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">History</h2>
        <ul className="space-y-1 text-sm">
          {(events ?? []).map((e) => (
            <li key={e.id} className="flex justify-between gap-2">
              <span>
                {e.kind === 'status'
                  ? `${STATUS_LABEL[e.from_status!]} → ${STATUS_LABEL[e.to_status!]}`
                  : e.kind === 'created'
                    ? `Created (${e.note})`
                    : e.kind === 'series'
                      ? 'Series changed'
                      : e.kind === 'queued'
                        ? 'Queued for Sunday'
                        : 'Removed from queue'}
                {e.actor !== 'owner' && <span className="text-muted"> · {e.actor}</span>}
              </span>
              <span className="text-muted">{age(e.at)} ago</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
