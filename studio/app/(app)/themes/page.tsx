import Link from 'next/link';
import { requireOwner } from '@/lib/auth/owner';
import { age, compact } from '@/lib/format';
import { keepThemeQuestion } from '../ideas/actions';

export const metadata = { title: 'Themes · WQL Studio' };

type Theme = { name: string; why?: string; outlier_video_ids?: string[]; questions: { question: string; angle?: string }[] };

export default async function ThemesPage() {
  const { supabase } = await requireOwner();
  const { data: runs } = await supabase.from('theme_runs').select('*').order('created_at', { ascending: false }).limit(4);
  const latest = runs?.[0];
  const themes = (latest?.themes ?? []) as Theme[];
  const outlierIds = [...new Set(themes.flatMap((t) => t.outlier_video_ids ?? []))];
  const [{ data: outliers }, { data: kept }] = await Promise.all([
    outlierIds.length
      ? supabase.from('outlier_feed').select('video_id, title, channel_title, multiple_vs_channel_median, views, format').in('video_id', outlierIds)
      : Promise.resolve({ data: [] as never[] }),
    latest ? supabase.from('ideas').select('id, question').eq('theme_run_id', latest.id) : Promise.resolve({ data: [] as never[] }),
  ]);
  const byId = new Map((outliers ?? []).map((o) => [o.video_id, o]));
  const keptByQuestion = new Map((kept ?? []).map((k: { id: string; question: string }) => [k.question.trim().toLowerCase(), k.id]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Themes</h1>
      {!latest ? (
        <div className="card space-y-2 p-6 text-sm text-muted">
          <p>No themes yet.</p>
          <p>
            Every Sunday at 12:45 pm (Mountain), a Claude Code session groups the week’s outliers into topic themes and
            suggests 10 new weird science questions for each. They show up here; keep the ones you like.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">
            From the weekly session {age(latest.created_at)} ago · {latest.outlier_count ?? '–'} outliers ·{' '}
            {themes.length} themes{latest.summary ? ` · ${latest.summary}` : ''}
          </p>
          {themes.map((t) => (
            <section key={t.name} className="card space-y-3 p-4">
              <div>
                <h2 className="text-lg font-semibold">{t.name}</h2>
                {t.why && <p className="text-sm text-muted">{t.why}</p>}
              </div>
              {(t.outlier_video_ids ?? []).length > 0 && (
                <ul className="space-y-1 text-xs text-muted">
                  {(t.outlier_video_ids ?? []).map((vid) => {
                    const o = byId.get(vid);
                    if (!o) return null;
                    return (
                      <li key={vid} className="truncate">
                        {Number(o.multiple_vs_channel_median).toFixed(0)}× · {o.channel_title}: {o.title} ({compact(o.views)})
                      </li>
                    );
                  })}
                </ul>
              )}
              <ul className="divide-y divide-line">
                {t.questions.map((q) => {
                  const keptId = keptByQuestion.get(q.question.trim().toLowerCase());
                  return (
                    <li key={q.question} className="flex flex-wrap items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{q.question}</p>
                        {q.angle && <p className="text-xs text-muted">{q.angle}</p>}
                      </div>
                      {keptId ? (
                        <Link href={`/ideas/${keptId}`} className="text-sm text-good">
                          In the bank ✓
                        </Link>
                      ) : (
                        <div className="flex gap-1">
                          {(['false', 'true'] as const).map((queue) => (
                            <form key={queue} action={keepThemeQuestion}>
                              <input type="hidden" name="question" value={q.question} />
                              <input type="hidden" name="angle" value={q.angle ?? ''} />
                              <input type="hidden" name="theme" value={t.name} />
                              <input type="hidden" name="theme_run_id" value={latest.id} />
                              <input type="hidden" name="queue" value={queue} />
                              <button className={queue === 'true' ? 'btn-primary py-1 text-xs' : 'btn py-1 text-xs'} type="submit">
                                {queue === 'true' ? 'Keep + queue' : 'Keep'}
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {runs && runs.length > 1 && (
            <p className="text-xs text-muted">Earlier runs: {runs.slice(1).map((r) => `${age(r.created_at)} ago`).join(' · ')}</p>
          )}
        </>
      )}
    </div>
  );
}
