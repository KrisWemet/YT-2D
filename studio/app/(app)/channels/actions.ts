'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth/owner';
import { parseChannelInput } from '@/lib/core/channelInput';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Enums } from '@/lib/supabase/database.types';
import { channelFields, importSeed, resolveChannel } from '@/lib/sync/channels';
import { logRun, runSync } from '@/lib/sync/run';
import { seedEntries } from '@/lib/sync/seedFile';
import { createYouTubeClient } from '@/lib/usage';
import { QuotaSkipError, YouTubeApiError } from '@/lib/youtube/client';

export type ActionState = { ok?: boolean; message?: string; details?: string[] };

const TIERS: Enums<'channel_tier'>[] = ['direct', 'rising', 'format', 'benchmark', 'mine'];

function failure(e: unknown): ActionState {
  if (e instanceof QuotaSkipError) return { ok: false, message: `Skipped: ${e.message}` };
  if (e instanceof YouTubeApiError) return { ok: false, message: `YouTube said no (${e.reason}).` };
  return { ok: false, message: e instanceof Error ? e.message : String(e) };
}

export async function addChannel(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireOwner();
  const ref = parseChannelInput(String(form.get('channel') ?? ''));
  if (ref.kind === 'invalid') return { ok: false, message: ref.reason };
  const tier = String(form.get('tier')) as Enums<'channel_tier'>;
  if (!TIERS.includes(tier)) return { ok: false, message: 'Pick a tier.' };
  const why = String(form.get('why') ?? '').trim() || null;

  const db = createAdminClient();
  const yt = createYouTubeClient(db, 'ui:add-channel');
  try {
    const ch = await resolveChannel(yt, ref);
    if (!ch) return { ok: false, message: 'No channel found for that URL or handle.' };
    const fields = channelFields(ch);
    const { data: existing } = await db.from('channels').select('id, active').eq('id', ch.id).maybeSingle();
    if (existing?.active) return { ok: false, message: `${fields.title} is already tracked.` };
    if (existing) {
      await db.from('channels').update({ ...fields, active: true, tier, why: why ?? undefined }).eq('id', ch.id);
    } else {
      const { error } = await db.from('channels').insert({ id: ch.id, tier, why, ...fields });
      if (error) throw new Error(error.message);
    }
    // Pull its uploads straight away so it shows up in the radar (a few quota units).
    const s = await runSync(db, yt, { channelIds: [ch.id], deadlineMs: 45_000 });
    revalidatePath('/channels');
    return {
      ok: true,
      message: `Added ${fields.title}: ${s.newVideos} uploads read, ${s.outliersFlagged} outliers. ${yt.unitsUsedToday} units used today.`,
    };
  } catch (e) {
    return failure(e);
  }
}

export async function setChannelActive(form: FormData) {
  const { supabase } = await requireOwner();
  const id = String(form.get('id'));
  await supabase.from('channels').update({ active: form.get('active') === 'true' }).eq('id', id);
  revalidatePath('/channels');
  revalidatePath('/outliers');
}

export async function setChannelTier(form: FormData) {
  const { supabase } = await requireOwner();
  const tier = String(form.get('tier')) as Enums<'channel_tier'>;
  if (!TIERS.includes(tier)) return;
  await supabase.from('channels').update({ tier }).eq('id', String(form.get('id')));
  revalidatePath('/channels');
}

export async function importSeedAction(_prev: ActionState): Promise<ActionState> {
  await requireOwner();
  const db = createAdminClient();
  const yt = createYouTubeClient(db, 'ui:seed');
  try {
    const r = await importSeed(db, yt, seedEntries());
    revalidatePath('/channels');
    return {
      ok: true,
      message: `Seed list: ${r.added.length} added, ${r.alreadyTracked.length} already tracked, ${r.dropped.length} dropped.`,
      details: [
        ...r.dropped.map((d) => `Dropped ${d.title} (${d.ref}): ${d.reason}`),
        ...r.renamed.map((x) => `Renamed on YouTube: “${x.seedTitle}” is now “${x.youtubeTitle}”`),
      ],
    };
  } catch (e) {
    return failure(e);
  }
}

export async function syncNowAction(_prev: ActionState): Promise<ActionState> {
  await requireOwner();
  const db = createAdminClient();
  const yt = createYouTubeClient(db, 'ui:sync');
  try {
    const { status, summary: s } = await logRun(db, 'manual-sync', () => runSync(db, yt));
    revalidatePath('/channels');
    revalidatePath('/outliers');
    const details = [
      ...s.errors.map((e) => `${e.channelId ?? ''} ${e.step}: ${e.message}`.trim()),
      ...(s.deferredChannels.length ? [`${s.deferredChannels.length} channels ran out of time; run Sync again to finish them.`] : []),
      ...(s.quotaSkips ? [`${s.quotaSkips} non-essential calls skipped to protect the quota.`] : []),
      ...(s.missingChannels.length ? [`Not found on YouTube any more: ${s.missingChannels.join(', ')}`] : []),
    ];
    return {
      ok: status === 'ok',
      message: `Sync ${status}: ${s.newVideos} new uploads, ${s.statsRefreshed} stats refreshed, ${s.outliersFlagged} new outliers. ${s.unitsUsedToday} units used today.`,
      details,
    };
  } catch (e) {
    return failure(e);
  }
}
