/**
 * Turn whatever gets pasted into the "add channel" box into something channels.list can resolve:
 * a channel ID (id=), a handle (forHandle=) or a legacy username (forUsername=).
 * Custom /c/ URLs and bare vanity paths can only be resolved with search.list, so they're rejected
 * with a hint instead.
 */

export type ChannelRef =
  | { kind: 'id'; id: string }
  | { kind: 'handle'; handle: string }
  | { kind: 'username'; username: string }
  | { kind: 'invalid'; reason: string };

const CHANNEL_ID = /^UC[0-9A-Za-z_-]{22}$/;
const HANDLE = /^[\p{L}\p{N}._-]{3,30}$/u;
const YT_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);

export function isChannelId(s: string): boolean {
  return CHANNEL_ID.test(s);
}

export function normalizeHandle(h: string): string {
  return '@' + h.replace(/^@/, '');
}

export function parseChannelInput(raw: string): ChannelRef {
  const input = raw.trim();
  if (!input) return { kind: 'invalid', reason: 'Paste a channel URL, @handle or channel ID.' };
  if (isChannelId(input)) return { kind: 'id', id: input };

  if (input.startsWith('@')) return handleRef(input.slice(1));

  let url: URL | null = null;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    url = null;
  }
  if (url && YT_HOSTS.has(url.hostname.toLowerCase())) {
    const parts = url.pathname.split('/').filter(Boolean).map(safeDecode);
    const [first, second] = parts;
    if (!first) return { kind: 'invalid', reason: 'That URL has no channel in it.' };
    if (first.startsWith('@')) return handleRef(first.slice(1));
    if (first === 'channel' && second && isChannelId(second)) return { kind: 'id', id: second };
    if (first === 'user' && second) return { kind: 'username', username: second };
    if (first === 'c') {
      return { kind: 'invalid', reason: 'Custom /c/ URLs need search to resolve. Open the channel and paste its @handle instead.' };
    }
    if (first === 'watch' || first === 'shorts') {
      return { kind: 'invalid', reason: 'That is a video link. Paste the channel URL or @handle instead.' };
    }
    return { kind: 'invalid', reason: 'Not a channel URL I can resolve. Paste the @handle instead.' };
  }

  if (/[/.:]/.test(input) && !HANDLE.test(input)) {
    return { kind: 'invalid', reason: 'Only youtube.com channel URLs, @handles and channel IDs work.' };
  }
  // A bare word: treat it as a handle without the @.
  return handleRef(input);
}

function handleRef(h: string): ChannelRef {
  if (!HANDLE.test(h)) return { kind: 'invalid', reason: `"@${h}" is not a valid handle.` };
  return { kind: 'handle', handle: normalizeHandle(h) };
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
