import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Magic-link landing. Handles both link styles:
 * - ?token_hash=…&type=email (works across browsers; needs the email template change in the README)
 * - ?code=… (Supabase's default PKCE link; must be opened in the same browser that requested it)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code');
  const supabase = await createClient();

  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;

  const dest = url.clone();
  dest.search = '';
  dest.pathname = ok ? '/outliers' : '/login';
  if (!ok) dest.searchParams.set('error', 'link');
  return NextResponse.redirect(dest);
}
