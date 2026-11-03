import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Compare in constant time. */
export function isCronRequest(req: Request): boolean {
  const got = Buffer.from(req.headers.get('authorization') ?? '');
  const want = Buffer.from(`Bearer ${env.cronSecret()}`);
  return got.length === want.length && timingSafeEqual(got, want);
}
