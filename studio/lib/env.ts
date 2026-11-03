import 'server-only';

/**
 * Server-side environment access. Every secret is read here, on the server only, and never logged.
 * Values are read lazily so a page that doesn't need YouTube still renders without YOUTUBE_API_KEY.
 * See .env.example for what each variable is.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name} (see studio/.env.example)`);
  return v;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v == null || v === '' ? fallback : Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
  return n;
}

export const env = {
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  supabasePublishableKey: () => required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  supabaseSecretKey: () => required('SUPABASE_SECRET_KEY'),
  youtubeApiKey: () => required('YOUTUBE_API_KEY'),
  youtubeDailyQuota: () => num('YOUTUBE_DAILY_QUOTA', 10_000),
  youtubeQuotaReserve: () => num('YOUTUBE_QUOTA_RESERVE', 0.1),
  cronSecret: () => required('CRON_SECRET'),
  ownerEmail: () => required('OWNER_EMAIL').trim().toLowerCase(),
};
