import { requireOwner } from '@/lib/auth/owner';
import { age, compact, daysAgo, duration, TIER_LABEL } from '@/lib/format';
import Link from 'next/link';
import { saveOutlierAsIdea } from '../ideas/actions';
import { setOutlierStatus, setVideoFormat } from './actions';

export const metadata = { title: 'Outliers · WQL Studio' };

const FORMATS = ['all', 'short', 'long'] as const;
const TIERS = ['all', 'direct', 'rising', 'format', 'benchmark', 'mine'] as const;
const RANGES = ['7', '30', '60', 'custom'] as const;
const STATUSES = ['new', 'saved', 'dismissed', 'all'] as const;
const SORTS = { multiple: 'Multiple', recent: 'Newest', vpd: 'Views/day' } as const;

function pick<T extends readonly string[]>(v: string | string[] | undefined, allowed: T, fallback: T[number]): T[number] {
  const s = Array.isArray(v) ? v[0] : v;
  return s && (allowed as readonly string[]).includes(s) ? (s as T[number]) : fallback;
}
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function OutliersPage({ searchParams }: PageProps<'/outliers'>) {
  const { supabase } = await requireOwner();
  const sp = await searchParams;
  const format = pick(sp.format, FORMATS, 'all');
  const tier = pick(sp.tier, TIERS, 'all');
  const range = pick(sp.range, RANGES, '60');
  const status = pick(sp.status, STATUSES, 'new');
  const sort = pick(sp.sort, Object.keys(SORTS) as (keyof typeof SORTS)[], 'multiple');
  const from = isDate(sp.from) ? sp.from : '';
  const to = isDate(sp.to) ? sp.to : '';
  const min = Math.max(1, Number(sp.min) || 5);

  const now = new Date();
  let q = supabase.from('outlier_feed').select('*').gte('multiple_vs_channel_median', min);
  if (format !== 'all') q = q.eq('format', format);
  if (tier !== 'all') q = q.eq('tier', tier);
  if (status !== 'all') q = q.eq('status', status);
  if (range === 'custom') {
    if (from) q = q.gte('published_at', `${from}T00:00:00Z`);
    if (to) q = q.lte('published_at', `${to}T23:59:59Z`);
  } else {
    q = q.gte('published_at', daysAgo(Number(range), now).toISOString());
  }
  const order = sort === 'recent' ? 'published_at' : sort === 'vpd' ? 'views_per_day' : 'multiple_vs_channel_median';
  const { data: rows, error } = await q.order(order, { ascending: false }).limit(200);
  const ids = (rows ?? []).map((r) => r.video_id!).filter(Boolean);
  const { data: linked } = ids.length
    ? await supabase.from('ideas').select('id, source_outlier_id').in('source_outlier_id', ids)
    : { data: [] as { id: string; source_outlier_id: string | null }[] };
  const ideaFor = new Map((linked ?? []).map((i) => [i.source_outlier_id, i.id]));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">Outlier radar</h1>
        <p className="text-sm text-muted">{rows?.length ?? 0} videos ≥ {min}× their channel median</p>
      </div>

      <form className="card grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-7" method="get">
        <Select name="format" value={format} options={{ all: 'Shorts + long', short: 'Shorts', long: 'Long form' }} />
        <Select name="tier" value={tier} options={Object.fromEntries(TIERS.map((t) => [t, t === 'all' ? 'All tiers' : TIER_LABEL[t]]))} />
        <Select name="range" value={range} options={{ '7': 'Last 7 days', '30': 'Last 30 days', '60': 'Last 60 days', custom: 'Custom dates' }} />
        <Select name="status" value={status} options={{ new: 'New', saved: 'Saved as ideas', dismissed: 'Dismissed', all: 'Any status' }} />
        <Select name="sort" value={sort} options={SORTS} />
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Min ×</span>
          <input name="min" type="number" min={1} step={0.5} defaultValue={min} className="input w-full" />
        </label>
        <button className="btn-primary" type="submit">
          Apply
        </button>
        {range === 'custom' && (
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-4 lg:col-span-7">
            <input name="from" type="date" defaultValue={from} className="input" aria-label="Published from" />
            <input name="to" type="date" defaultValue={to} className="input" aria-label="Published to" />
          </div>
        )}
      </form>

      {error && <p className="text-sm text-red-600">Could not load outliers: {error.message}</p>}
      {!error && rows?.length === 0 && (
        <div className="card p-6 text-sm text-muted">
          No outliers match. If the radar is new, add channels and run a sync from the Channels page; outliers appear once each
          channel has at least 5 uploads older than a week.
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows?.map((o) => {
          const href = o.format === 'short' ? `https://www.youtube.com/shorts/${o.video_id}` : `https://www.youtube.com/watch?v=${o.video_id}`;
          return (
            <li key={o.video_id} className="card overflow-hidden">
              <a href={href} target="_blank" rel="noreferrer" className="relative block aspect-video bg-line">
                {o.thumbnail_url && <img src={o.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-sm font-bold text-accent-ink">
                  {Number(o.multiple_vs_channel_median).toFixed(1)}×
                </span>
                <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 text-xs text-white">
                  {o.format === 'short' ? 'Short' : 'Long'} {duration(o.duration_s)}
                </span>
              </a>
              <div className="space-y-2 p-3">
                <a href={href} target="_blank" rel="noreferrer" className="line-clamp-2 font-medium leading-snug hover:underline">
                  {o.title}
                </a>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span className="font-medium text-fg">{o.channel_title}</span>
                  <span className="chip">{TIER_LABEL[o.tier ?? ''] ?? o.tier}</span>
                </div>
                {ideaFor.get(o.video_id) ? (
                  <Link href={`/ideas/${ideaFor.get(o.video_id)}`} className="btn w-full text-good">
                    Saved as idea ✓
                  </Link>
                ) : (
                  <form action={saveOutlierAsIdea}>
                    <input type="hidden" name="video_id" value={o.video_id ?? ''} />
                    <button className="btn-primary w-full" type="submit">
                      Save as idea
                    </button>
                  </form>
                )}
                <dl className="grid grid-cols-3 text-xs">
                  <Stat label="Views" value={compact(o.views)} />
                  <Stat label="Views/day" value={compact(o.views_per_day)} />
                  <Stat label="Age" value={age(o.published_at, now)} />
                </dl>
                <div className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span className="mr-auto">Median {compact(o.baseline_median)}</span>
                  <form action={setVideoFormat}>
                    <input type="hidden" name="video_id" value={o.video_id ?? ''} />
                    <input type="hidden" name="format" value={o.format === 'short' ? 'long' : 'short'} />
                    <button className="hover:text-fg" type="submit" title="Correct the Short/long detection for this video">
                      {o.format === 'short' ? 'Not a Short?' : 'Is a Short?'}
                    </button>
                  </form>
                  <form action={setOutlierStatus}>
                    <input type="hidden" name="video_id" value={o.video_id ?? ''} />
                    <input type="hidden" name="status" value={o.status === 'dismissed' ? 'new' : 'dismissed'} />
                    <button className="hover:text-fg" type="submit">
                      {o.status === 'dismissed' ? 'Restore' : 'Dismiss'}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Select({ name, value, options }: { name: string; value: string; options: Record<string, string> }) {
  return (
    <select name={name} defaultValue={value} className="input w-full" aria-label={name}>
      {Object.entries(options).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
