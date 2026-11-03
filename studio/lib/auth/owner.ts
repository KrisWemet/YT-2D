import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * The signed-in user, only if they are the owner (listed in app_owner, checked through RLS).
 * Use at the top of every page and server action.
 */
export async function requireOwner() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');
  // app_owner is readable only by an owner (RLS), so a row here proves ownership.
  const { data: owner } = await supabase.from('app_owner').select('email').limit(1).maybeSingle();
  if (!owner) redirect('/login?error=not-owner');
  return { supabase, user: auth.user };
}
