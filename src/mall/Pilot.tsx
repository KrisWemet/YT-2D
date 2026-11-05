import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import {ChapterTag, Countdown, RadioBadge, Screen} from './Overlays';
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
  {n: 1, title: 'THE KING OF THE MALL', at: "My name's Danny"},
  {n: 2, title: 'THE RAMP', at: '@marcus1'},
  {n: 3, title: 'GLASS', at: "Here's what nobody"},
  {n: 4, title: 'FOUR MINUTES', at: 'So I run'},
  {n: 5, title: 'THE GATE', at: 'Behind me'},
];
const CH_START = CHAPTERS.map((c) => RESOLVED.find((r) => r.at === c.at)!.start + 0.3);

// The four-minute countdown runs from "So I run" until the food court doors give.
const T_FOUR = wordTime('four minutes', 140);
const T_RUN = RESOLVED.find((r) => r.at === 'So I run')!.start;
const T_BOOM = wordTime('explode', 180);
const leftAt = (t: number) => 240 * (1 - (t - T_FOUR) / (T_BOOM - T_FOUR));

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
        {t >= T_RUN && t < T_BOOM + 0.5 && <Countdown left={leftAt(Math.min(t, T_BOOM))} t={t} urgent={leftAt(t) < 60} />}
      </Screen>
      <Audio src={staticFile('mall/vo/vo.mp3')} />
      <MallSfx />
    </AbsoluteFill>
  );
};
