'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth/owner';

export async function setOutlierStatus(form: FormData) {
  const { supabase } = await requireOwner();
  const videoId = String(form.get('video_id') ?? '');
  const status = String(form.get('status') ?? '');
  if (!videoId || !['new', 'dismissed', 'saved'].includes(status)) return;
  await supabase.from('outliers').update({ status: status as 'new' | 'dismissed' | 'saved' }).eq('video_id', videoId);
  revalidatePath('/outliers');
}

/**
 * Manual Short/long override for one video. Sync never overwrites it. The outlier row is removed
 * because its multiple was computed against the wrong baseline; the next sync recomputes it.
 */
export async function setVideoFormat(form: FormData) {
  const { supabase } = await requireOwner();
  const videoId = String(form.get('video_id') ?? '');
  const format = String(form.get('format') ?? '');
  if (!videoId || (format !== 'short' && format !== 'long')) return;
  await supabase.from('videos').update({ format, format_source: 'manual' }).eq('id', videoId);
  await supabase.from('outliers').delete().eq('video_id', videoId);
  revalidatePath('/outliers');
}
