'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOwner } from '@/lib/auth/owner';
import { changed, move, normalize } from '@/lib/core/series';
import { slugify, uniqueSlug } from '@/lib/core/slug';
import { nextPosition } from '@/lib/ideas';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

export async function createSeries(form: FormData) {
  const { supabase } = await requireOwner();
  const name = str(form, 'name');
  if (!name) return;
  const { data: taken } = await supabase.from('series').select('slug');
  const slug = uniqueSlug(slugify(name, 40), (taken ?? []).map((r) => r.slug));
  const { data: max } = await supabase.from('series').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const { data } = await supabase
    .from('series')
    .insert({ name, slug, description: str(form, 'description') || null, sort_order: (max?.sort_order ?? 0) + 1 })
    .select('id')
    .single();
  revalidatePath('/series');
  if (data) redirect(`/series/${data.id}`);
}

export async function updateSeries(form: FormData) {
  const { supabase } = await requireOwner();
  const id = str(form, 'id');
  const name = str(form, 'name');
  if (!name) return;
  await supabase
    .from('series')
    .update({
      name,
      description: str(form, 'description') || null,
      playlist_id: str(form, 'playlist_id') || null,
      archived: form.get('archived') === 'on',
    })
    .eq('id', id);
  revalidatePath(`/series/${id}`);
  revalidatePath('/series');
}

export async function moveIdea(form: FormData) {
  const { supabase } = await requireOwner();
  const seriesId = str(form, 'series_id');
  const direction = str(form, 'direction') === 'up' ? 'up' : 'down';
  const { data: rows } = await supabase.from('ideas').select('id, position_in_series').eq('series_id', seriesId);
  const before = (rows ?? []).map((r) => ({ id: r.id, position: r.position_in_series }));
  for (const row of changed(before, move(before, str(form, 'idea_id'), direction))) {
    await supabase.from('ideas').update({ position_in_series: row.position }).eq('id', row.id);
  }
  revalidatePath(`/series/${seriesId}`);
}

export async function addIdeaToSeries(form: FormData) {
  const { supabase } = await requireOwner();
  const seriesId = str(form, 'series_id');
  const ideaId = str(form, 'idea_id');
  if (!ideaId) return;
  await supabase
    .from('ideas')
    .update({ series_id: seriesId, position_in_series: await nextPosition(supabase, seriesId) })
    .eq('id', ideaId);
  revalidatePath(`/series/${seriesId}`);
}

export async function removeIdeaFromSeries(form: FormData) {
  const { supabase } = await requireOwner();
  const seriesId = str(form, 'series_id');
  await supabase.from('ideas').update({ series_id: null, position_in_series: null }).eq('id', str(form, 'idea_id'));
  // Close the gap so positions stay 1..n.
  const { data: rows } = await supabase.from('ideas').select('id, position_in_series').eq('series_id', seriesId);
  const before = (rows ?? []).map((r) => ({ id: r.id, position: r.position_in_series }));
  for (const row of changed(before, normalize(before))) {
    await supabase.from('ideas').update({ position_in_series: row.position }).eq('id', row.id);
  }
  revalidatePath(`/series/${seriesId}`);
}
