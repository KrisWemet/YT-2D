import { isCronRequest } from '@/lib/cron';
import { createAdminClient } from '@/lib/supabase/admin';
import { logRun, runSync } from '@/lib/sync/run';
import { createYouTubeClient } from '@/lib/usage';

// Vercel Hobby allows up to 300 s per function; the sync stops starting new work at 240 s.
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isCronRequest(req)) return new Response('Unauthorized', { status: 401 });
  try {
    const db = createAdminClient();
    const yt = createYouTubeClient(db, 'cron:daily');
    const { status, summary } = await logRun(db, 'daily-sync', () => runSync(db, yt));
    return Response.json({ status, summary });
  } catch (e) {
    // Messages name missing variables or failing steps, never secret values.
    return Response.json({ status: 'error', error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
