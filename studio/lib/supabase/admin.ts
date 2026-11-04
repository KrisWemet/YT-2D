import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import type { Database } from './database.types';

export type Db = SupabaseClient<Database>;

/**
 * Secret-key client: bypasses RLS. Only for cron jobs, CLI scripts and server actions that have
 * already checked requireOwner(). Never import this from a Client Component.
 */
export function createAdminClient(): Db {
  return createClient<Database>(env.supabaseUrl(), env.supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
