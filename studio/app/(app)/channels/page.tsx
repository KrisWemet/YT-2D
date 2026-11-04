import { requireOwner } from '@/lib/auth/owner';
import { age, compact, TIER_LABEL } from '@/lib/format';
import type { Tables } from '@/lib/supabase/database.types';
import { setChannelActive, setChannelTier } from './actions';
import { AddChannelForm, SyncControls } from './forms';

export const metadata = { title: 'Channels · WQL Studio' };
// "Sync now" and "Add channel" run the sync inside the server action.
export const maxDuration = 300;

const ORDER = ['mine', 'direct', 'rising', 'format', 'benchmark'] as const;
type Row = Tables<'channel_overview'>;

export default async function ChannelsPage() {
  const { supabase } = await requireOwner();
  const { data: rows, error } = await supabase.from('channel_overview').select('*').order('subs', { ascending: false, nullsFirst: false });
  const active = (rows ?? []).filter((r) => r.active);
  const removed = (rows ?? []).filter((r) => !r.active);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Channels</h1>
        <p className="text-sm text-muted">{active.length} tracked</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <AddChannelForm />
        <SyncControls />
      </div>
      {error && <p className="text-sm text-red-600">Could not load channels: {error.message}</p>}
      {active.length === 0 && !error && (
        <div className="card p-6 text-sm text-muted">No channels yet. Use “Import seed list” to add the 33 channels in data/seed-channels.json.</div>
      )}
      {ORDER.map((tier) => {
        const list = active.filter((r) => r.tier === tier);
        if (!list.length) return null;
        return (
          <section key={tier} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {TIER_LABEL[tier]} · {list.length}
            </h2>
            <ul className="card divide-y divide-line">
              {list.map((c) => (
                <ChannelRow key={c.id} c={c} />
              ))}
            </ul>
          </section>
        );
      })}
      {removed.length > 0 && (
        <details className="card p-3">
          <summary className="cursor-pointer text-sm text-muted">Removed channels ({removed.length})</summary>
          <ul className="mt-2 divide-y divide-line">
            {removed.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>{c.title}</span>
                <form action={setChannelActive}>
                  <input type="hidden" name="id" value={c.id ?? ''} />
                  <input type="hidden" name="active" value="true" />
                  <button className="btn" type="submit">
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ChannelRow({ c }: { c: Row }) {
  const url = c.handle ? `https://www.youtube.com/${c.handle}` : `https://www.youtube.com/channel/${c.id}`;
  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      {c.thumbnail_url ? (
        <img src={c.thumbnail_url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-full bg-line" />
      )}
      <div className="min-w-0 flex-1">
        <a href={url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
          {c.title}
        </a>
        <p className="truncate text-xs text-muted">
          {c.subs_hidden ? 'subs hidden' : `${compact(c.subs)} subs`} · Shorts median {compact(c.short_median)} · long median{' '}
          {compact(c.long_median)} · {c.outlier_count ?? 0} outliers · synced {age(c.last_synced_at)}
        </p>
        {c.why && <p className="truncate text-xs text-muted">{c.why}</p>}
      </div>
      <div className="flex items-center gap-2">
        <form action={setChannelTier} className="flex items-center gap-1">
          <input type="hidden" name="id" value={c.id ?? ''} />
          <select name="tier" defaultValue={c.tier ?? 'direct'} className="input py-1 text-xs" aria-label="Tier">
            {ORDER.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
          <button className="btn py-1 text-xs" type="submit">
            Set
          </button>
        </form>
        <form action={setChannelActive}>
          <input type="hidden" name="id" value={c.id ?? ''} />
          <input type="hidden" name="active" value="false" />
          <button className="btn py-1 text-xs" type="submit">
            Remove
          </button>
        </form>
      </div>
    </li>
  );
}
