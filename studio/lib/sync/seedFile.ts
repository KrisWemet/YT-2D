import 'server-only';
import { z } from 'zod';
// The seed list lives at the repo root (data/seed-channels.json) and is bundled at build time.
import raw from '../../../data/seed-channels.json';
import type { SeedEntry } from './channels';

const Entry = z.object({
  tier: z.enum(['mine', 'direct', 'rising', 'format', 'benchmark']),
  channel_id: z.string().regex(/^UC[0-9A-Za-z_-]{22}$/).nullable(),
  handle: z.string().nullable(),
  title: z.string(),
  subscribers: z.number().nullable().optional(),
  why: z.string().nullable().optional(),
});

export function seedEntries(): SeedEntry[] {
  return z.object({ channels: z.array(Entry) }).parse(raw).channels;
}
