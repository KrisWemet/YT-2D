import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertSafeSlug,
  description,
  FILES,
  houseStyleWarnings,
  renderHandoff,
  STORYBOARD_SCHEMA,
  validateStoryboard,
} from '@/lib/handoff/render.mjs';

const storyboard = {
  schema: STORYBOARD_SCHEMA,
  voice: { provider: 'ElevenLabs via vidIQ', voice: 'Chris' },
  frame0: { description: 'A wombat proudly stacking a tower of tiny brown cubes.', thumbnail_text: 'CUBE POOP?!' },
  loop: { last_line: 'So why cubes?', returns_to: 'frame0', description: 'The scientist stares at the tower again.' },
  cast: ['scientist', 'wombat'],
  assets: [
    { id: 'wombat_stack', kind: 'character', description: 'Wombat stacking cubes, proud face', aspect: '1:1' },
    { id: 'g_clipboard', kind: 'pose', description: 'Scientist with clipboard, puzzled', aspect: '2:3' },
  ],
  beats: [
    {
      n: 1,
      line: 'Why is wombat poop shaped like cubes?',
      cue_word: 'cubes',
      est_duration_s: 3,
      visual: 'Wombat finishes a cube tower; the top cube wobbles.',
      camera: 'Slow push in',
      on_screen_text: 'CUBE POOP?',
      sfx: [{ cue: 'pop', at_word: 'cubes' }],
      music: null,
      assets: ['wombat_stack'],
      claim_ids: ['c1'],
      gag: 'The top cube has a tiny flag.',
    },
    {
      n: 2,
      line: 'The last stretch of its gut is stiff in some places and stretchy in others | like a press.',
      cue_word: 'press',
      est_duration_s: 6,
      visual: 'Cutaway gut diagram squeezing a sausage into a cube.',
      on_screen_text: null,
      sfx: [{ cue: 'squish' }],
      music: 'bouncy',
      assets: ['g_clipboard'],
      claim_ids: ['c2'],
    },
  ],
  next_tease: { question: 'Why do flamingos stand on one leg?', slug: 'why-flamingos-stand-one-leg', on_screen: 'Next: one-legged birds' },
};

const script = {
  version: 2,
  hook: 'Why is wombat poop shaped like cubes?',
  narration: storyboard.beats.map((b) => b.line).join('\n'),
  loop_ending: 'So why cubes?',
  next_tease: 'Next: why flamingos stand on one leg.',
  word_count: 30,
  est_duration_s: 9,
  storyboard,
  packaging: {
    title_options: ['Why Wombats Poop Cubes', 'Wombat Poop Is Square (Really)'],
    description: 'Wombats are the only animals known to make cube-shaped poop.',
    tags: ['wombat', 'animal facts'],
    hashtags: ['#shorts', '#science'],
    pinned_comment: 'Which animal fact should I check next?',
  },
  fact_checked_at: '2026-11-08T19:00:00Z',
};

const claims = [
  {
    ref: 'c2',
    claim: 'Varying stiffness of the intestine wall shapes the cubes',
    beats: [2],
    confidence: 'high',
    status: 'resolved',
    sources: [{ title: 'Yang et al. 2021', url: 'https://doi.org/10.1039/D0SM01230K', publisher: 'Soft Matter', year: 2021 }],
    note: 'Mechanism studied in two roadkill wombats',
    resolution: 'Say "is thought to" rather than "is"',
  },
  {
    ref: 'c1',
    claim: 'Wombats produce cube-shaped feces',
    beats: [1],
    confidence: 'high',
    status: 'ok',
    sources: [
      { title: 'Yang et al. 2021', url: 'https://doi.org/10.1039/D0SM01230K' },
      { title: 'Australian Museum', url: 'https://australian.museum/learn/animals/mammals/common-wombat/' },
    ],
  },
  { ref: 'c3', claim: 'They stack them on purpose', beats: [], confidence: 'low', status: 'cut', sources: [], note: 'Not supported' },
];

const input = {
  project: { slug: 'wql', name: 'Weird Questions Lab' },
  idea: { id: 'idea-1', slug: 'why-wombat-poop-cubes', question: 'Why is wombat poop shaped like cubes?', status: 'ready' },
  script,
  claims,
  series: { name: 'Animal superpowers', slug: 'animal-superpowers', position: 2, total: 5, playlist_id: 'PLabc' },
  previous: { slug: 'why-camels-humps', question: 'What is really in a camel hump?', youtube_video_id: 'vid123' },
  next: { slug: 'why-flamingos-stand-one-leg', question: 'Why do flamingos stand on one leg?' },
  exportedAt: '2026-11-08T20:00:00.000Z',
};

describe('renderHandoff', () => {
  const out = renderHandoff(input);

  it('writes exactly the four documented files into videos/<slug>/', () => {
    expect(out.dir).toBe('videos/why-wombat-poop-cubes');
    expect(Object.keys(out.files).sort()).toEqual([...FILES].sort());
    for (const f of FILES) expect(out.files[f].endsWith('\n')).toBe(true);
  });

  it('is deterministic for the same input', () => {
    expect(renderHandoff(input)).toEqual(out);
  });

  it('storyboard.json keeps every beat field and adds cumulative start times', () => {
    const sb = JSON.parse(out.files['storyboard.json']);
    expect(sb.schema).toBe(STORYBOARD_SCHEMA);
    expect(sb.slug).toBe('why-wombat-poop-cubes');
    expect(sb.script_version).toBe(2);
    expect(sb.est_duration_s).toBe(9);
    expect(sb.beats.map((b: { est_start_s: number }) => b.est_start_s)).toEqual([0, 3]);
    expect(Object.keys(sb.beats[1])).toEqual([
      'n', 'line', 'cue_word', 'est_start_s', 'est_duration_s', 'visual', 'camera', 'on_screen_text', 'sfx', 'music', 'assets', 'claim_ids', 'gag',
    ]);
    expect(sb.beats[1].camera).toBeNull();
    expect(validateStoryboard({ ...sb, schema: STORYBOARD_SCHEMA })).toEqual([]);
  });

  it('meta.json carries packaging, series links and a description with deduplicated sources', () => {
    const meta = JSON.parse(out.files['meta.json']);
    expect(meta.schema).toBe('wql.meta/1');
    expect(meta.title).toBe('Why Wombats Poop Cubes');
    expect(meta.series).toEqual({ name: 'Animal superpowers', slug: 'animal-superpowers', position: 2, total: 5, playlist_id: 'PLabc' });
    expect(meta.previous.youtube_video_id).toBe('vid123');
    expect(meta.next).toEqual({ slug: 'why-flamingos-stand-one-leg', question: 'Why do flamingos stand on one leg?', youtube_video_id: null });
    expect(meta.description.match(/doi\.org/g)).toHaveLength(1);
    expect(meta.description).toContain('Sources:\n• Yang et al. 2021');
    expect(meta.description.endsWith('#shorts #science')).toBe(true);
    expect(meta.exported_at).toBe('2026-11-08T20:00:00.000Z');
  });

  it('script.md escapes table pipes and includes the publishing checklist', () => {
    const md = out.files['script.md'];
    expect(md).toContain('stiff in some places and stretchy in others \\| like a press.');
    expect(md).toContain('| 2 | 3 | 6 | press |');
    expect(md).toContain('Series: **Animal superpowers** #2 of 5');
    expect(md).toContain('on screen, not voiced: "Next: one-legged birds"');
    expect(md).toContain('- [ ] Fact-check clear (no flagged claims');
    expect(md).toContain('set it as this Short\'s related video');
  });

  it('fact-check.md lists claims in ref order with counts, notes, resolutions and sources', () => {
    const md = out.files['fact-check.md'];
    expect(md).toContain('3 claims: 1 ok, 1 resolved, 0 flagged, 1 cut');
    expect(md.indexOf('### c1')).toBeLessThan(md.indexOf('### c2'));
    expect(md).toContain('Resolution: Say "is thought to" rather than "is"');
    expect(md).toContain('[Yang et al. 2021](https://doi.org/10.1039/D0SM01230K) (Soft Matter, 2021)');
    expect(md).toContain('| c3 | They stack them on purpose |  | low | CUT |');
  });

  it('refuses unsafe slugs and invalid storyboards', () => {
    expect(() => renderHandoff({ ...input, idea: { ...input.idea, slug: '../main' } })).toThrow(/Unsafe slug/);
    const broken = { ...script, storyboard: { ...storyboard, beats: [] } };
    expect(() => renderHandoff({ ...input, script: broken })).toThrow(/beats must be a non-empty array/);
  });
});

describe('validateStoryboard', () => {
  it('accepts the fixture', () => {
    expect(validateStoryboard(storyboard)).toEqual([]);
  });
  it('reports each structural problem', () => {
    const bad = {
      schema: 'other',
      frame0: {},
      loop: {},
      assets: [{ id: 'Bad Id', kind: 'sticker', description: '' }],
      beats: [{ n: 2, line: '', est_duration_s: 0, visual: '', sfx: [{}], assets: ['nope'], claim_ids: ['x1'] }],
    };
    const errors = validateStoryboard(bad).join('\n');
    for (const fragment of [
      'schema must be',
      'frame0.description',
      'loop.last_line',
      'assets[0].id must be snake_case',
      'assets[0].kind',
      'beats[0].n must be 1',
      'beats[0].line',
      'est_duration_s must be a positive number',
      'beats[0].visual',
      'sfx must be a list',
      'assets must list ids',
      'claim_ids must be like',
    ]) {
      expect(errors).toContain(fragment);
    }
  });
});

describe('houseStyleWarnings', () => {
  it('flags length outside 30–60 s, long hooks and claims missing from the fact-check', () => {
    const w = houseStyleWarnings({ ...script, hook: 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen' }, claims.slice(1));
    expect(w.join('\n')).toContain('Estimated length 9.0 s is outside 30–60 s');
    expect(w.join('\n')).toContain('Hook is 15 words');
    expect(w.join('\n')).toContain("Beats cite c2, which isn't in the fact-check");
  });
});

describe('helpers', () => {
  it('assertSafeSlug accepts kebab-case only', () => {
    expect(assertSafeSlug('why-is-sky-blue')).toBe('why-is-sky-blue');
    for (const bad of ['', 'Upper', 'a/b', 'a..b', '-lead', 'trail-', 'spa ce']) expect(() => assertSafeSlug(bad)).toThrow();
  });
  it('description skips flagged and cut claims', () => {
    const d = description({ description: 'x' }, [
      { status: 'flagged', sources: [{ url: 'https://a' }] },
      { status: 'cut', sources: [{ url: 'https://b' }] },
    ]);
    expect(d).toBe('x');
  });
});

describe('published schemas', () => {
  it('videos/schema files exist, parse and require what the validator requires', () => {
    const dir = path.resolve(__dirname, '../../videos/schema');
    const sb = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.v1.schema.json'), 'utf8'));
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.v1.schema.json'), 'utf8'));
    expect(sb.properties.schema.const).toBe(STORYBOARD_SCHEMA);
    expect(sb.required).toEqual(expect.arrayContaining(['schema', 'frame0', 'loop', 'assets', 'beats']));
    expect(sb.$defs.beat.required).toEqual(
      expect.arrayContaining(['n', 'line', 'est_duration_s', 'visual', 'on_screen_text', 'sfx', 'assets', 'claim_ids']),
    );
    expect(meta.properties.schema.const).toBe('wql.meta/1');
  });
});
