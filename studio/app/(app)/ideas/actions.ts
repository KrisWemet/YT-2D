'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOwner } from '@/lib/auth/owner';
import { cleanTitle } from '@/lib/core/slug';
import { compact } from '@/lib/format';
import { IDEA_STATUSES, insertIdea, nextPosition } from '@/lib/ideas';
import type { Enums } from '@/lib/supabase/database.types';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const orNull = (s: string) => (s === '' ? null : s);

export async function createIdea(form: FormData) {
  const { supabase } = await requireOwner();
  const question = str(form, 'question');
  if (!question) return;
  const seriesId = orNull(str(form, 'series_id'));
  const id = await insertIdea(supabase, {
    question,
    series_id: seriesId,
    position_in_series: seriesId ? await nextPosition(supabase, seriesId) : null,
    source: 'manual',
    queued_at: form.get('queue') === 'on' ? new Date().toISOString() : null,
  });
  revalidatePath('/ideas');
  if (form.get('open') === '1') redirect(`/ideas/${id}`);
}

export async function updateIdea(form: FormData) {
  const { supabase } = await requireOwner();
  const id = str(form, 'id');
  const status = str(form, 'status') as Enums<'idea_status'>;
  const seriesId = orNull(str(form, 'series_id'));
  const { data: before } = await supabase.from('ideas').select('series_id').eq('id', id).single();
  const question = str(form, 'question');
  if (!question || !IDEA_STATUSES.includes(status)) return;
  let position = form.get('position_in_series') ? Number(form.get('position_in_series')) : null;
  if (seriesId && seriesId !== before?.series_id && !position) position = await nextPosition(supabase, seriesId);
  const { error } = await supabase
    .from('ideas')
    .update({
      question,
      status,
      series_id: seriesId,
      position_in_series: seriesId ? position : null,
      notes: orNull(str(form, 'notes')),
      youtube_video_id: orNull(str(form, 'youtube_video_id')),
    })
    .eq('id', id);
  revalidatePath(`/ideas/${id}`);
  revalidatePath('/ideas');
  revalidatePath('/series');
  // The database's ready gate explains itself ("2 flagged claim(s) must be resolved…"); show that.
  if (error) redirect(`/ideas/${id}?error=${encodeURIComponent(error.message)}`);
}

/** One-tap status change (e.g. "Mark ready"); the database gate decides whether it's allowed. */
export async function setIdeaStatus(form: FormData) {
  const { supabase } = await requireOwner();
  const id = str(form, 'id');
  const status = str(form, 'status') as Enums<'idea_status'>;
  if (!IDEA_STATUSES.includes(status)) return;
  const { error } = await supabase.from('ideas').update({ status }).eq('id', id);
  revalidatePath(`/ideas/${id}`);
  revalidatePath('/ideas');
  if (error) redirect(`/ideas/${id}?error=${encodeURIComponent(error.message)}`);
}

/** Accept a flagged claim with a note on how it's handled (e.g. "say 'about'", or a better source). */
export async function resolveClaim(form: FormData) {
  const { supabase } = await requireOwner();
  const ideaId = str(form, 'idea_id');
  const resolution = str(form, 'resolution');
  if (!resolution) redirect(`/ideas/${ideaId}?error=${encodeURIComponent('Add a short note on how the claim is resolved.')}`);
  await supabase
    .from('claims')
    .update({ status: 'resolved', resolution, resolved_at: new Date().toISOString() })
    .eq('id', str(form, 'claim_id'));
  revalidatePath(`/ideas/${ideaId}`);
}

/** Send the idea back for a new script version on Sunday, with the reason added to its notes. */
export async function requestRewrite(form: FormData) {
  const { supabase } = await requireOwner();
  const ideaId = str(form, 'idea_id');
  const reason = str(form, 'reason') || 'Rewrite requested';
  const { data: idea } = await supabase.from('ideas').select('notes').eq('id', ideaId).single();
  const stamp = new Date().toISOString().slice(0, 10);
  const notes = [idea?.notes, `Rewrite request (${stamp}): ${reason}`].filter(Boolean).join('\n');
  await supabase.from('ideas').update({ notes, queued_at: new Date().toISOString() }).eq('id', ideaId);
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath('/ideas');
}

export async function setQueued(form: FormData) {
  const { supabase } = await requireOwner();
  const id = str(form, 'id');
  await supabase
    .from('ideas')
    .update({ queued_at: form.get('queued') === 'true' ? new Date().toISOString() : null })
    .eq('id', id);
  revalidatePath('/ideas');
  revalidatePath(`/ideas/${id}`);
}

export async function deleteIdea(form: FormData) {
  const { supabase } = await requireOwner();
  const id = str(form, 'id');
  const { data: idea } = await supabase.from('ideas').select('source_outlier_id').eq('id', id).single();
  await supabase.from('ideas').delete().eq('id', id);
  // Put the outlier back in the feed if this idea came from one.
  if (idea?.source_outlier_id) await supabase.from('outliers').update({ status: 'new' }).eq('video_id', idea.source_outlier_id);
  revalidatePath('/ideas');
  redirect('/ideas');
}

/** "Save as inspiration" on an outlier card: a linked idea to rephrase in your own words. */
export async function saveOutlierAsIdea(form: FormData) {
  const { supabase } = await requireOwner();
  const videoId = str(form, 'video_id');
  const { data: o } = await supabase.from('outlier_feed').select('*').eq('video_id', videoId).single();
  if (!o) return;
  const { data: existing } = await supabase.from('ideas').select('id').eq('source_outlier_id', videoId).limit(1).maybeSingle();
  if (existing) redirect(`/ideas/${existing.id}`);
  const url = o.format === 'short' ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`;
  const id = await insertIdea(supabase, {
    question: cleanTitle(o.title ?? '') || 'New idea from an outlier',
    source: 'outlier',
    source_outlier_id: videoId,
    notes:
      `Inspired by ${o.channel_title}: "${o.title}" (${Number(o.multiple_vs_channel_median).toFixed(1)}× its median, ` +
      `${compact(o.views)} views) ${url}\nRewrite the question in our own voice before scripting.`,
  });
  await supabase.from('outliers').update({ status: 'saved' }).eq('video_id', videoId);
  revalidatePath('/outliers');
  redirect(`/ideas/${id}`);
}

/** Keep one of the weekly session's suggested questions (optionally queueing it for the next batch). */
export async function keepThemeQuestion(form: FormData) {
  const { supabase } = await requireOwner();
  const question = str(form, 'question');
  if (!question) return;
  await insertIdea(supabase, {
    question,
    source: 'claude',
    theme_run_id: orNull(str(form, 'theme_run_id')),
    theme: orNull(str(form, 'theme')),
    notes: orNull(str(form, 'angle')),
    queued_at: form.get('queue') === 'true' ? new Date().toISOString() : null,
  });
  revalidatePath('/themes');
  revalidatePath('/ideas');
}
