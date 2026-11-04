import { STATUS_LABEL } from '@/lib/ideas';
import type { Enums } from '@/lib/supabase/database.types';

const TONE: Record<Enums<'idea_status'>, string> = {
  idea: 'border-line text-muted',
  scripted: 'border-sky-500/50 text-sky-600 dark:text-sky-400',
  fact_checked: 'border-violet-500/50 text-violet-600 dark:text-violet-400',
  ready: 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400',
  animating: 'border-amber-500/60 text-amber-700 dark:text-amber-400',
  published: 'border-fg text-fg',
};

export function StatusChip({ status }: { status: Enums<'idea_status'> }) {
  return <span className={`chip ${TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}
