// npm run seed: resolve data/seed-channels.json with the YouTube API and insert new channels.
import './cli-env';
import { createAdminClient } from '@/lib/supabase/admin';
import { importSeed } from '@/lib/sync/channels';
import { seedEntries } from '@/lib/sync/seedFile';
import { createYouTubeClient } from '@/lib/usage';

async function main() {
  const db = createAdminClient();
  const yt = createYouTubeClient(db, 'cli:seed');
  const report = await importSeed(db, yt, seedEntries());
  console.log(`added ${report.added.length}, already tracked ${report.alreadyTracked.length}, dropped ${report.dropped.length}`);
  for (const d of report.dropped) console.log(`  dropped: ${d.title} (${d.ref}): ${d.reason}`);
  for (const r of report.renamed) console.log(`  renamed on YouTube: "${r.seedTitle}" is now "${r.youtubeTitle}"`);
  console.log(`quota used today: ${yt.unitsUsedToday} units`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
