'use server';

import { headers } from 'next/headers';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { sent: boolean; error?: string };

/**
 * Send a magic link, but only to the owner's address (OWNER_EMAIL). Any other address gets the same
 * "check your email" reply, so the form doesn't reveal who the owner is.
 */
export async function sendMagicLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { sent: false, error: 'Enter an email address.' };
  if (email !== env.ownerEmail()) return { sent: true };

  const h = await headers();
  const origin = process.env.SITE_URL ?? h.get('origin') ?? `https://${h.get('host')}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm`, shouldCreateUser: true },
  });
  if (error) return { sent: false, error: 'Could not send the link. Try again in a minute.' };
  return { sent: true };
}
