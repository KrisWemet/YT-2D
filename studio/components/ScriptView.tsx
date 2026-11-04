import { requestRewrite, resolveClaim } from '@/app/(app)/ideas/actions';
import type { Tables } from '@/lib/supabase/database.types';

type Script = Tables<'scripts'>;
type Claim = Tables<'claims'>;

type Beat = {
  n: number;
  line: string;
  cue_word?: string | null;
  est_duration_s: number;
  visual: string;
  camera?: string | null;
  on_screen_text?: string | null;
  sfx: { cue: string; at_word?: string }[];
  music?: string | null;
  claim_ids: string[];
  gag?: string | null;
};
type Storyboard = {
  frame0?: { description?: string; thumbnail_text?: string };
  loop?: { description?: string };
  assets?: { id: string; kind: string; description: string }[];
  beats?: Beat[];
  next_tease?: { on_screen?: string } | null;
};
type Packaging = { title_options?: string[]; tags?: string[]; pinned_comment?: string; description?: string };
type Source = { title?: string; url?: string; publisher?: string; year?: number | string; note?: string };

const CLAIM_TONE: Record<Claim['status'], string> = {
  ok: 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400',
  resolved: 'border-sky-500/50 text-sky-600 dark:text-sky-400',
  flagged: 'border-red-500/60 bg-red-500/10 text-red-600',
  cut: 'border-line text-muted line-through',
};

/** One script version: voice-over, beats, packaging and its fact-check. Claim actions only when editable. */
export function ScriptView({ script, claims, editable }: { script: Script; claims: Claim[]; editable: boolean }) {
  const sb = (script.storyboard ?? {}) as Storyboard;
  const beats = sb.beats ?? [];
  const p = (script.packaging ?? {}) as Packaging;
  const total = beats.reduce((s, b) => s + (Number(b.est_duration_s) || 0), 0);
  const sorted = [...claims].sort((a, b) => Number(a.ref.slice(1)) - Number(b.ref.slice(1)));
  const flagged = sorted.filter((c) => c.status === 'flagged');
  const starts = beats.map((_, i) => beats.slice(0, i).reduce((s, b) => s + (Number(b.est_duration_s) || 0), 0));

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        v{script.version} · ~{Math.round(total)} s · {script.word_count} words · by {script.author} ·{' '}
        {script.fact_checked_at ? `fact-checked ${script.fact_checked_at.slice(0, 10)}` : 'not fact-checked yet'}
      </p>

      <section className="card space-y-2 p-4">
        <h3 className="font-semibold">Voice-over</h3>
        <div className="space-y-1 border-l-4 border-accent pl-3 text-[15px] leading-relaxed">
          {beats.map((b) => (
            <p key={b.n}>{b.line}</p>
          ))}
        </div>
        <dl className="grid gap-1 pt-2 text-sm">
          <div>
            <dt className="inline font-medium">Hook: </dt>
            <dd className="inline">{script.hook}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Loop: </dt>
            <dd className="inline">
              {script.loop_ending || '—'}
              {sb.loop?.description ? <span className="text-muted"> ({sb.loop.description})</span> : null}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Next-Short tease: </dt>
            <dd className="inline">
              {script.next_tease || '—'}
              {sb.next_tease?.on_screen ? <span className="text-muted"> · on screen: “{sb.next_tease.on_screen}”</span> : null}
            </dd>
          </div>
          {sb.frame0?.description && (
            <div>
              <dt className="inline font-medium">Frame 0: </dt>
              <dd className="inline">
                {sb.frame0.description}
                {sb.frame0.thumbnail_text ? <strong> · “{sb.frame0.thumbnail_text}”</strong> : null}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Beats · {beats.length}</h3>
        <ol className="space-y-2">
          {beats.map((b, i) => {
            const start = starts[i];
            const end = start + (Number(b.est_duration_s) || 0);
            return (
              <li key={b.n} className="card space-y-1 p-3 text-sm">
                <p className="text-xs text-muted">
                  #{b.n} · {start.toFixed(1)}–{end.toFixed(1)} s{b.cue_word ? ` · lands on “${b.cue_word}”` : ''}
                </p>
                <p className="font-medium">{b.line}</p>
                <p>
                  {b.visual}
                  {b.camera ? <span className="text-muted"> Camera: {b.camera}.</span> : null}
                  {b.gag ? <span className="text-muted"> Gag: {b.gag}</span> : null}
                </p>
                {b.on_screen_text && <p className="text-xs">On screen: <strong>{b.on_screen_text}</strong></p>}
                {(b.sfx.length > 0 || b.music) && (
                  <p className="text-xs text-muted">
                    Sound: {[...b.sfx.map((x) => (x.at_word ? `${x.cue} @ “${x.at_word}”` : x.cue)), ...(b.music ? [`music: ${b.music}`] : [])].join(' · ')}
                  </p>
                )}
                {b.claim_ids.length > 0 && <p className="text-xs text-muted">Claims: {b.claim_ids.join(', ')}</p>}
              </li>
            );
          })}
        </ol>
      </section>

      {(sb.assets ?? []).length > 0 && (
        <section className="card p-4 text-sm">
          <h3 className="mb-1 font-semibold">Pictures to draw</h3>
          <ul className="space-y-1">
            {sb.assets!.map((a) => (
              <li key={a.id}>
                <code className="text-xs">{a.id}</code> <span className="text-muted">({a.kind})</span> {a.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(p.title_options?.length || p.pinned_comment) && (
        <section className="card space-y-1 p-4 text-sm">
          <h3 className="font-semibold">Packaging</h3>
          {p.title_options?.length ? (
            <ol className="list-decimal pl-5">
              {p.title_options.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ol>
          ) : null}
          {p.pinned_comment && <p className="text-muted">Pinned comment: {p.pinned_comment}</p>}
          {p.tags?.length ? <p className="text-xs text-muted">Tags: {p.tags.join(', ')}</p> : null}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Fact-check · {sorted.length} claims{flagged.length ? ` · ${flagged.length} flagged` : ''}
        </h3>
        {sorted.length === 0 && <div className="card p-4 text-sm text-muted">Not fact-checked yet.</div>}
        <ul className="space-y-2">
          {sorted.map((c) => (
            <li key={c.id} className="card space-y-2 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted">{c.ref}</span>
                <span className={`chip ${CLAIM_TONE[c.status]}`}>{c.status}</span>
                <span className="chip text-muted">{c.confidence} confidence</span>
                {c.beats.length > 0 && <span className="text-xs text-muted">beats {c.beats.join(', ')}</span>}
              </div>
              <p className="font-medium">{c.claim}</p>
              {c.note && <p className="text-xs text-muted">Note: {c.note}</p>}
              {c.resolution && <p className="text-xs">Resolution: {c.resolution}</p>}
              <ul className="space-y-0.5 text-xs">
                {((c.sources ?? []) as Source[]).map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                        {s.title ?? s.publisher ?? s.url}
                      </a>
                    ) : (
                      (s.title ?? s.publisher)
                    )}
                    {[s.publisher && s.title ? s.publisher : null, s.year].filter(Boolean).length ? (
                      <span className="text-muted"> ({[s.publisher && s.title ? s.publisher : null, s.year].filter(Boolean).join(', ')})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {editable && c.status === 'flagged' && (
                <div className="grid gap-2 border-t border-line pt-2 sm:grid-cols-2">
                  <form action={resolveClaim} className="flex gap-1">
                    <input type="hidden" name="claim_id" value={c.id} />
                    <input type="hidden" name="idea_id" value={script.idea_id} />
                    <input name="resolution" required placeholder="How it's handled…" className="input min-w-0 flex-1 py-1 text-sm" />
                    <button className="btn py-1 text-xs" type="submit">
                      Resolve
                    </button>
                  </form>
                  <form action={requestRewrite}>
                    <input type="hidden" name="idea_id" value={script.idea_id} />
                    <input type="hidden" name="reason" value={`${c.ref} flagged: ${c.claim}${c.note ? ` (${c.note})` : ''}`} />
                    <button className="btn w-full py-1 text-xs" type="submit">
                      Needs rewrite → queue for Sunday
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
