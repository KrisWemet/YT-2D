// npm run sync: run the daily sync once from your machine (same code as the cron job).
import './cli-env';
import { createAdminClient } from '@/lib/supabase/admin';
import { logRun, runSync } from '@/lib/sync/run';
import { createYouTubeClient } from '@/lib/usage';

async function main() {
  const db = createAdminClient();
  const yt = createYouTubeClient(db, 'cli:sync');
  const { status, summary } = await logRun(db, 'daily-sync', () => runSync(db, yt, { deadlineMs: 30 * 60_000 }));
  console.log(status, JSON.stringify(summary, null, 2));
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
