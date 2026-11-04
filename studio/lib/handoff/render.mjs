// Renders one idea's handoff folder, videos/<slug>/, from what Studio stores:
//   script.md        human-readable script, beats, assets, packaging, publishing checklist
//   storyboard.json  machine-readable beats (wql.storyboard/1), what the Remotion build works from
//   meta.json        packaging and series links (wql.meta/1)
//   fact-check.md    every claim with confidence, status and sources
// Pure functions, no dependencies: shared by the app, the tests and studio/scripts/batch.mjs.
// The format is documented in videos/README.md. Change it only together with that file and the schemas.

export const STORYBOARD_SCHEMA = 'wql.storyboard/1';
export const META_SCHEMA = 'wql.meta/1';
export const FILES = ['script.md', 'storyboard.json', 'meta.json', 'fact-check.md'];
export const ASSET_KINDS = ['pose', 'character', 'prop', 'background', 'fx'];
export const HOUSE_STYLE = { minSeconds: 30, maxSeconds: 60, maxHookWords: 14 };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ASSET_ID = /^[a-z0-9_]+$/;
const CLAIM_REF = /^c[0-9]+$/;

/** Throws unless the slug is safe to use as a folder name (no paths, no dots, no uppercase). */
export function assertSafeSlug(slug) {
  if (typeof slug !== 'string' || !SLUG.test(slug) || slug.length > 80) {
    throw new Error(`Unsafe slug for videos/<slug>/: ${JSON.stringify(slug)}`);
  }
  return slug;
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isStrOrNull = (v) => v === null || v === undefined || typeof v === 'string';

/**
 * Structural check of a wql.storyboard/1 object. Returns a list of problems (empty when valid).
 * @param {any} sb
 * @returns {string[]}
 */
export function validateStoryboard(sb) {
  const errors = [];
  if (!sb || typeof sb !== 'object' || Array.isArray(sb)) return ['storyboard must be an object'];
  if (sb.schema !== STORYBOARD_SCHEMA) errors.push(`schema must be "${STORYBOARD_SCHEMA}"`);
  if (!sb.frame0 || !isStr(sb.frame0.description)) errors.push('frame0.description is required (frame 0 doubles as the thumbnail)');
  if (!sb.loop || !isStr(sb.loop.last_line)) errors.push('loop.last_line is required (the last line flows back into the hook)');
  const assets = Array.isArray(sb.assets) ? sb.assets : [];
  if (!Array.isArray(sb.assets)) errors.push('assets must be an array');
  const assetIds = new Set();
  assets.forEach((a, i) => {
    if (!a || !ASSET_ID.test(a.id ?? '')) errors.push(`assets[${i}].id must be snake_case`);
    else if (assetIds.has(a.id)) errors.push(`assets[${i}].id "${a.id}" is duplicated`);
    else assetIds.add(a.id);
    if (!ASSET_KINDS.includes(a?.kind)) errors.push(`assets[${i}].kind must be one of ${ASSET_KINDS.join(', ')}`);
    if (!isStr(a?.description)) errors.push(`assets[${i}].description is required`);
  });
  if (!Array.isArray(sb.beats) || sb.beats.length === 0) {
    errors.push('beats must be a non-empty array');
    return errors;
  }
  sb.beats.forEach((b, i) => {
    const at = `beats[${i}]`;
    if (b?.n !== i + 1) errors.push(`${at}.n must be ${i + 1} (beats are numbered in order from 1)`);
    if (!isStr(b?.line)) errors.push(`${at}.line (the narration) is required`);
    if (!(typeof b?.est_duration_s === 'number' && b.est_duration_s > 0)) errors.push(`${at}.est_duration_s must be a positive number`);
    if (!isStr(b?.visual)) errors.push(`${at}.visual is required`);
    if (!isStrOrNull(b?.on_screen_text)) errors.push(`${at}.on_screen_text must be text or null`);
    if (!isStrOrNull(b?.cue_word)) errors.push(`${at}.cue_word must be text or null`);
    if (!isStrOrNull(b?.music)) errors.push(`${at}.music must be text or null`);
    if (!Array.isArray(b?.sfx) || b.sfx.some((x) => !isStr(x?.cue))) errors.push(`${at}.sfx must be a list of { cue, at_word? }`);
    if (!Array.isArray(b?.assets) || b.assets.some((id) => !assetIds.has(id))) errors.push(`${at}.assets must list ids from assets[]`);
    if (!Array.isArray(b?.claim_ids) || b.claim_ids.some((r) => !CLAIM_REF.test(r))) errors.push(`${at}.claim_ids must be like ["c1"]`);
  });
  return errors;
}

/**
 * House-style warnings (not errors): length, hook length, loop, claims referenced by beats.
 * @param {any} script
 * @param {any[]} claims
 */
export function houseStyleWarnings(script, claims = []) {
  const w = [];
  const total = totalSeconds(script.storyboard);
  if (total < HOUSE_STYLE.minSeconds || total > HOUSE_STYLE.maxSeconds) {
    w.push(`Estimated length ${total.toFixed(1)} s is outside ${HOUSE_STYLE.minSeconds}–${HOUSE_STYLE.maxSeconds} s`);
  }
  const hookWords = wordCount(script.hook ?? '');
  if (hookWords > HOUSE_STYLE.maxHookWords) w.push(`Hook is ${hookWords} words; aim for ${HOUSE_STYLE.maxHookWords} or fewer (it must land in ~2 s)`);
  if (!isStr(script.loop_ending)) w.push('No loop ending');
  const refs = new Set(claims.map((c) => c.ref));
  const used = new Set((script.storyboard?.beats ?? []).flatMap((b) => b.claim_ids ?? []));
  for (const r of used) if (!refs.has(r)) w.push(`Beats cite ${r}, which isn't in the fact-check`);
  return w;
}

export function totalSeconds(sb) {
  return (sb?.beats ?? []).reduce((s, b) => s + (Number(b.est_duration_s) || 0), 0);
}

export function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Render the four handoff files.
 * @param {{
 *   project: { slug: string, name: string },
 *   idea: { id: string, slug: string, question: string, status: string, youtube_video_id?: string|null },
 *   script: any,
 *   claims: any[],
 *   series?: { name: string, slug: string, position: number|null, total: number, playlist_id?: string|null } | null,
 *   previous?: { slug: string, question: string, youtube_video_id?: string|null } | null,
 *   next?: { slug: string, question: string, youtube_video_id?: string|null } | null,
 *   exportedAt: string,
 * }} input
 * @returns {{ dir: string, files: Record<string, string> }}
 */
export function renderHandoff(input) {
  const slug = assertSafeSlug(input.idea.slug);
  const errors = validateStoryboard(input.script.storyboard);
  if (errors.length) throw new Error(`Storyboard for ${slug} is invalid:\n- ${errors.join('\n- ')}`);
  const claims = [...(input.claims ?? [])].sort((a, b) => refNum(a.ref) - refNum(b.ref));
  return {
    dir: `videos/${slug}`,
    files: {
      'script.md': scriptMd(input, claims),
      'storyboard.json': json(storyboardJson(input)),
      'meta.json': json(metaJson(input, claims)),
      'fact-check.md': factCheckMd(input, claims),
    },
  };
}

// ---------------------------------------------------------------- storyboard.json

function storyboardJson({ idea, script }) {
  const sb = script.storyboard;
  return {
    schema: STORYBOARD_SCHEMA,
    slug: idea.slug,
    question: idea.question,
    script_version: script.version,
    est_duration_s: round1(totalSeconds(sb)),
    voice: sb.voice ?? null,
    frame0: pick(sb.frame0, ['description', 'thumbnail_text']),
    loop: pick(sb.loop, ['last_line', 'returns_to', 'description']),
    cast: sb.cast ?? [],
    assets: (sb.assets ?? []).map((a) => pick(a, ['id', 'kind', 'description', 'aspect', 'refs'])),
    beats: sb.beats.map((b) => ({
      n: b.n,
      line: b.line,
      cue_word: b.cue_word ?? null,
      est_start_s: round1(sb.beats.slice(0, b.n - 1).reduce((s, x) => s + x.est_duration_s, 0)),
      est_duration_s: b.est_duration_s,
      visual: b.visual,
      camera: b.camera ?? null,
      on_screen_text: b.on_screen_text ?? null,
      sfx: b.sfx.map((x) => pick(x, ['cue', 'at_word'])),
      music: b.music ?? null,
      assets: b.assets,
      claim_ids: b.claim_ids,
      gag: b.gag ?? null,
    })),
    next_tease: sb.next_tease ? pick(sb.next_tease, ['question', 'slug', 'on_screen']) : null,
  };
}

// ---------------------------------------------------------------- meta.json

function metaJson({ project, idea, script, series, previous, next, exportedAt }, claims) {
  const p = script.packaging ?? {};
  const titles = Array.isArray(p.title_options) ? p.title_options : [];
  return {
    schema: META_SCHEMA,
    slug: idea.slug,
    project: project.slug,
    question: idea.question,
    status: idea.status,
    script_version: script.version,
    fact_checked_at: script.fact_checked_at ?? null,
    exported_at: exportedAt,
    title_options: titles,
    title: titles[0] ?? idea.question,
    description: description(p, claims),
    tags: p.tags ?? [],
    hashtags: p.hashtags ?? [],
    pinned_comment: p.pinned_comment ?? null,
    next_tease: script.next_tease ?? null,
    series: series
      ? { name: series.name, slug: series.slug, position: series.position ?? null, total: series.total, playlist_id: series.playlist_id ?? null }
      : null,
    previous: link(previous),
    next: link(next),
    youtube_video_id: idea.youtube_video_id ?? null,
    studio: { idea_id: idea.id },
  };
}

function link(x) {
  return x ? { slug: x.slug, question: x.question, youtube_video_id: x.youtube_video_id ?? null } : null;
}

/** The upload description: the packaged text, then every source the fact-check relied on, then hashtags. */
export function description(packaging, claims) {
  const parts = [];
  if (isStr(packaging.description)) parts.push(packaging.description.trim());
  const seen = new Set();
  const sources = [];
  for (const c of claims) {
    if (c.status !== 'ok' && c.status !== 'resolved') continue;
    for (const s of c.sources ?? []) {
      if (!s?.url || seen.has(s.url)) continue;
      seen.add(s.url);
      sources.push(`• ${s.title ?? s.publisher ?? 'Source'}: ${s.url}`);
    }
  }
  if (sources.length) parts.push(`Sources:\n${sources.join('\n')}`);
  if (Array.isArray(packaging.hashtags) && packaging.hashtags.length) parts.push(packaging.hashtags.join(' '));
  return parts.join('\n\n');
}

// ---------------------------------------------------------------- script.md

function scriptMd({ idea, script, series, previous, next }, claims) {
  const sb = script.storyboard;
  const p = script.packaging ?? {};
  const total = totalSeconds(sb);
  const lines = [];
  lines.push(`# ${idea.question}`, '');
  lines.push(
    `\`videos/${idea.slug}/\` · script v${script.version} · ~${round1(total)} s · ${script.word_count ?? wordCount(script.narration)} words · status: ${idea.status}`,
  );
  if (series) {
    const pos = series.position ? `#${series.position} of ${series.total}` : `of ${series.total}`;
    lines.push(`Series: **${series.name}** ${pos}${previous ? ` · previous: ${previous.question}` : ''}${next ? ` · next: ${next.question}` : ''}`);
  }
  lines.push('', '## Voice-over', '');
  for (const b of sb.beats) lines.push(`> ${b.line}`);
  lines.push('', '## Hook, loop and tease', '');
  lines.push(`- **Hook (first ~2 s):** ${script.hook}`);
  lines.push(`- **Loop ending:** ${script.loop_ending || '—'}${sb.loop?.description ? ` (${sb.loop.description})` : ''}`);
  lines.push(`- **Next-Short tease:** ${script.next_tease || '—'}${sb.next_tease?.on_screen ? ` · on screen, not voiced: "${sb.next_tease.on_screen}"` : ''}`);
  lines.push('', '## Beats', '');
  lines.push('| # | ~start | ~s | Cue word | Line | On screen | Visual | Sound | Claims |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  let t = 0;
  for (const b of sb.beats) {
    const sound = [...b.sfx.map((x) => (x.at_word ? `${x.cue} @ "${x.at_word}"` : x.cue)), ...(b.music ? [`music: ${b.music}`] : [])].join('; ');
    const visual = [b.visual, b.camera ? `Camera: ${b.camera}` : '', b.gag ? `Gag: ${b.gag}` : ''].filter(Boolean).map(sentence).join(' ');
    lines.push(
      `| ${b.n} | ${round1(t)} | ${b.est_duration_s} | ${cell(b.cue_word ?? '')} | ${cell(b.line)} | ${cell(b.on_screen_text ?? '')} | ${cell(visual)} | ${cell(sound)} | ${b.claim_ids.join(', ')} |`,
    );
    t += b.est_duration_s;
  }
  lines.push('', '## Frame 0 and thumbnail', '', sb.frame0.description);
  if (sb.frame0.thumbnail_text) lines.push('', `Thumbnail text: **${sb.frame0.thumbnail_text}**`);
  if ((sb.assets ?? []).length) {
    lines.push('', '## Pictures to draw', '', '| id | kind | description |', '|---|---|---|');
    for (const a of sb.assets) lines.push(`| \`${a.id}\` | ${a.kind}${a.aspect ? ` (${a.aspect})` : ''} | ${cell(a.description)} |`);
  }
  lines.push('', '## Packaging', '');
  const titles = Array.isArray(p.title_options) ? p.title_options : [];
  if (titles.length) {
    lines.push('Title options:', '');
    titles.forEach((title, i) => lines.push(`${i + 1}. ${title}`));
    lines.push('');
  }
  if (Array.isArray(p.tags) && p.tags.length) lines.push(`Tags: ${p.tags.join(', ')}`, '');
  if (isStr(p.pinned_comment)) lines.push(`Pinned comment: ${p.pinned_comment}`, '');
  const flagged = claims.filter((c) => c.status === 'flagged').length;
  lines.push('## Publishing checklist', '');
  lines.push(`- [ ] Fact-check clear (${flagged === 0 ? 'no flagged claims' : `${flagged} flagged claim(s) still open`}; see fact-check.md)`);
  lines.push('- [ ] Upload as a Short, Education category, not made for kids; description and tags from meta.json');
  lines.push('- [ ] Pin the comment above');
  if (series) lines.push(`- [ ] Add to the "${series.name}" playlist${series.playlist_id ? ` (${series.playlist_id})` : ''}`);
  if (previous) lines.push(`- [ ] Set the previous Short's related video ("${previous.question}") to this one`);
  if (next) lines.push(`- [ ] When "${next.question}" is live, set it as this Short's related video`);
  lines.push('- [ ] Paste the YouTube video ID into the idea in Studio');
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------- fact-check.md

function factCheckMd({ idea, script }, claims) {
  const count = (s) => claims.filter((c) => c.status === s).length;
  const lines = [`# Fact-check: ${idea.question}`, ''];
  lines.push(
    `Script v${script.version} · checked ${script.fact_checked_at ? script.fact_checked_at.slice(0, 10) : 'not yet'} · ${claims.length} claims: ` +
      `${count('ok')} ok, ${count('resolved')} resolved, ${count('flagged')} flagged, ${count('cut')} cut`,
  );
  if (!claims.length) return lines.concat(['', 'No claims recorded.']).join('\n') + '\n';
  lines.push('', '| Ref | Claim | Beats | Confidence | Status |', '|---|---|---|---|---|');
  for (const c of claims) {
    lines.push(`| ${c.ref} | ${cell(c.claim)} | ${(c.beats ?? []).join(', ')} | ${c.confidence} | ${c.status.toUpperCase()} |`);
  }
  lines.push('', '## Sources');
  for (const c of claims) {
    lines.push('', `### ${c.ref}: ${c.claim}`, '');
    if (c.note) lines.push(`Note: ${c.note}`, '');
    if (c.resolution) lines.push(`Resolution: ${c.resolution}`, '');
    const sources = c.sources ?? [];
    if (!sources.length) lines.push('- No source recorded');
    for (const s of sources) {
      const label = s.title ?? s.publisher ?? s.url;
      const extra = [s.publisher && s.title ? s.publisher : null, s.year ?? null].filter(Boolean).join(', ');
      lines.push(`- ${s.url ? `[${label}](${s.url})` : label}${extra ? ` (${extra})` : ''}${s.note ? `: ${s.note}` : ''}`);
    }
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------- helpers

function json(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}
function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
}
function sentence(text) {
  const t = String(text).trim();
  return /[.!?…"”)]$/.test(t) ? t : `${t}.`;
}
function cell(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
}
function round1(x) {
  return Math.round(x * 10) / 10;
}
function refNum(ref) {
  return Number(String(ref).slice(1)) || 0;
}
