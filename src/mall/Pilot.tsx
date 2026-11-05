import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import {ChapterTag, RadioBadge, Screen} from './Overlays';
import {MallSfx} from './Sfx';
import {SHOTS} from './shots';
import {DUR, FPS, resolveCue, SEGMENTS, wordTime} from './timing';

// Resolve every shot's cue to a start time (in order), plus its named events.
export const RESOLVED = (() => {
  let prev = 0;
  const starts = SHOTS.map((s) => {
    const t = resolveCue(s.at, prev);
    if (t < prev - 0.001) throw new Error(`shot "${s.at}" starts before the previous one`);
    prev = t;
    return t;
  });
  return SHOTS.map((s, i) => {
    const start = starts[i];
    const end = i + 1 < SHOTS.length ? starts[i + 1] : DUR;
    const ev: Record<string, number> = {};
    for (const [k, ph] of Object.entries(s.ev ?? {})) ev[k] = wordTime(ph, start) - start;
    return {at: s.at, start, end, ev, draw: s.draw};
  });
})();

const CHAPTERS: {n: number; title: string; at: string}[] = [
  {n: 1, title: 'THE LOOP', at: '0'},
  {n: 2, title: 'THE RAMP', at: 'At one forty'},
  {n: 3, title: 'GLASS', at: "Here's the thing"},
  {n: 4, title: 'SHOPPING', at: 'I run my loop'},
  {n: 5, title: 'THE GATE', at: 'Behind me'},
];
const CH_START = CHAPTERS.map((c) => (c.at === '0' ? 0.4 : RESOLVED.find((r) => r.at === c.at)!.start));

const RADIO_NAMES: Record<string, string> = {marcus1: 'MARCUS', marcus2: 'MARCUS', woman: 'UNKNOWN'};

export const MallPilot: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let i = RESOLVED.findIndex((r) => t >= r.start && t < r.end);
  if (i < 0) i = RESOLVED.length - 1;
  const sh = RESOLVED[i];
  const ci = CH_START.reduce((a, s, k) => (t >= s ? k : a), -1);
  const radio = SEGMENTS.find((g) => g.kind === 'radio' && t >= g.s - 0.05 && t <= g.e + 0.15);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {sh.draw({t: t - sh.start, dur: sh.end - sh.start, frame, ev: sh.ev})}
      <Screen>
        {ci >= 0 && <ChapterTag n={CHAPTERS[ci].n} title={CHAPTERS[ci].title} t={t - CH_START[ci]} />}
        {radio && <RadioBadge name={RADIO_NAMES[radio.id ?? ''] ?? 'RADIO'} t={t} color={radio.id === 'woman' ? '#f2b5d4' : '#8fd18a'} />}
      </Screen>
      <Audio src={staticFile('mall/vo/vo.mp3')} />
      <MallSfx />
    </AbsoluteFill>
  );
};
