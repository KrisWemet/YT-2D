import { requireOwner } from '@/lib/auth/owner';
import { quotaDay } from '@/lib/core/quota';
import { env } from '@/lib/env';
import { age, daysAgo } from '@/lib/format';

export const metadata = { title: 'Usage · WQL Studio' };

export default async function UsagePage() {
  const { supabase } = await requireOwner();
  const today = quotaDay();
  const since = quotaDay(daysAgo(13));
  const [{ data: daily }, { data: runs }] = await Promise.all([
    supabase.from('api_usage_daily').select('*').gte('quota_day', since).order('quota_day', { ascending: false }),
    supabase.from('cron_runs').select('*').order('started_at', { ascending: false }).limit(15),
  ]);
  const limit = env.youtubeDailyQuota();
  const yt = (daily ?? []).filter((r) => r.api === 'youtube_data');
  const todayRows = yt.filter((r) => r.quota_day === today);
  const usedToday = todayRows.reduce((s, r) => s + (r.units ?? 0), 0);
  const byDay = new Map<string, number>();
  for (const r of yt) byDay.set(r.quota_day!, (byDay.get(r.quota_day!) ?? 0) + (r.units ?? 0));
  const pct = Math.min(100, (usedToday / limit) * 100);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">API usage</h1>
      <section className="card space-y-2 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">YouTube quota today</h2>
          <span className="text-sm text-muted">{today} (Pacific; resets at midnight PT)</span>
        </div>
        <p className="text-2xl font-bold">
          {usedToday.toLocaleString()} <span className="text-base font-normal text-muted">/ {limit.toLocaleString()} units</span>
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={usedToday} aria-valuemin={0} aria-valuemax={limit}>
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted">Non-essential calls stop at {Math.round((1 - env.youtubeQuotaReserve()) * 100)}% so the daily sync always has room.</p>
        {todayRows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="font-normal">Endpoint</th>
                <th className="text-right font-normal">Calls</th>
                <th className="text-right font-normal">Units</th>
                <th className="text-right font-normal">Failed</th>
              </tr>
            </thead>
            <tbody>
              {todayRows.map((r) => (
                <tr key={r.endpoint}>
                  <td>{r.endpoint}</td>
                  <td className="text-right">{r.calls}</td>
                  <td className="text-right">{r.units}</td>
                  <td className="text-right">{r.failures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Last 14 days</h2>
        {byDay.size === 0 ? (
          <p className="text-sm text-muted">No calls yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {[...byDay].map(([day, units]) => (
              <li key={day} className="grid grid-cols-[6.5rem_1fr_4rem] items-center gap-2">
                <span className="text-muted">{day}</span>
                <span className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(1, (units / limit) * 100)}%` }} />
                <span className="text-right">{units}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Recent job runs</h2>
        {(runs ?? []).length === 0 ? (
          <p className="text-sm text-muted">No runs yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {runs!.map((r) => {
              const s = r.summary as { newVideos?: number; outliersFlagged?: number; unitsUsedToday?: number } | null;
              return (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>
                    {r.job} · <span className={r.status === 'ok' ? 'text-good' : r.status === 'running' ? 'text-muted' : 'text-red-600'}>{r.status}</span>
                  </span>
                  <span className="text-muted">
                    {s ? `${s.newVideos ?? 0} new · ${s.outliersFlagged ?? 0} outliers · ` : ''}
                    {r.error ? `${r.error} · ` : ''}
                    {age(r.started_at)} ago
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
