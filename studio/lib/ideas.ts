import 'server-only';
import { slugify, uniqueSlug } from '@/lib/core/slug';
import type { createClient } from '@/lib/supabase/server';
import type { Enums, TablesInsert } from '@/lib/supabase/database.types';

type Client = Awaited<ReturnType<typeof createClient>>;

export const IDEA_STATUSES: Enums<'idea_status'>[] = ['idea', 'scripted', 'fact_checked', 'ready', 'animating', 'published'];
export const STATUS_LABEL: Record<Enums<'idea_status'>, string> = {
  idea: 'Idea',
  scripted: 'Scripted',
  fact_checked: 'Fact-checked',
  ready: 'Ready',
  animating: 'Animating',
  published: 'Published',
};

/** Insert an idea with a unique, stable slug. Retries once if two inserts race for the same slug. */
export async function insertIdea(supabase: Client, fields: Omit<TablesInsert<'ideas'>, 'slug'>) {
  const base = slugify(fields.question);
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: taken } = await supabase.from('ideas').select('slug').like('slug', `${base}%`);
    const slug = uniqueSlug(base, (taken ?? []).map((r) => r.slug));
    const { data, error } = await supabase.from('ideas').insert({ ...fields, slug }).select('id').single();
    if (!error) return data.id;
    if (error.code !== '23505') throw new Error(error.message); // not a unique-violation: give up
  }
  throw new Error('Could not find a free slug for this idea');
}

/** Next free position at the end of a series. */
export async function nextPosition(supabase: Client, seriesId: string): Promise<number> {
  const { data } = await supabase
    .from('ideas')
    .select('position_in_series')
    .eq('series_id', seriesId)
    .order('position_in_series', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (data?.position_in_series ?? 0) + 1;
}
