import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS, T} from './timing';

type Cue = {f: string; at: number; db: number; dur?: number};
const tally = [9.12, 9.38, 9.62, 9.86];
const ticks = [8.42, 8.56, 8.7, 8.84, 8.98];

const CUES: Cue[] = [
  // line 1: lit fuse, the hurricane wakes up
  {f: 'fuse', at: 0, db: -31, dur: T.because},
  {f: 'pop_big', at: T.hurricane, db: -21},
  // line 2: wind-up, throw, the bomb flies in, boom in the pause
  {f: 'zip', at: T.because, db: -26},
  {f: 'whoosh', at: T.stronger - 0.04, db: -16},
  {f: 'whistle', at: T.stronger + 0.08, db: -27, dur: T.boom - T.stronger - 0.1},
  {f: 'boom_big', at: T.boom, db: -8},
  // line 3: heat, the 10-megaton bomb, the 20-minute clock
  {f: 'whoosh_soft', at: T.givesOff - 0.1, db: -27},
  {f: 'pop', at: T.megaton, db: -21},
  {f: 'pop', at: T.every - 0.2, db: -24},
  ...ticks.map((at) => ({f: 'tick', at, db: -24})),
  ...tally.map((at) => ({f: 'boom_small', at, db: -20})),
  ...tally.map((at) => ({f: 'pop', at: at + 0.02, db: -28})),
  // line 4: one more bomb, scared, the yawn
  {f: 'pop', at: T.oneMore, db: -24},
  {f: 'bloop', at: T.might, db: -23},
  {f: 'yawn', at: T.slow - 0.02, db: -19},
  // line 5: trade winds carry the fallout
  {f: 'whoosh_soft', at: T.tradeWinds - 0.1, db: -21},
  {f: 'whoosh_soft', at: T.tradeWinds + 0.35, db: -24},
  {f: 'geiger', at: T.radioactive, db: -24},
  // line 6: the storm laughs, sweat, another bomb
  {f: 'laugh_rumble', at: T.youd, db: -17},
  {f: 'plip', at: 17.55, db: -23},
  {f: 'sparkle', at: T.another, db: -22},
  {f: 'fuse', at: T.another + 0.1, db: -32},
];

const db = (d: number) => 10 ** (d / 20);
const bedGain = (t: number) => {
  const close = t > 4.6 && t < 10.4 ? Math.min(1, Math.min(t - 4.6, 10.4 - t) / 0.4) : 0;
  return db(-29 - 4 * close);
};

export const HurricaneSfx: React.FC = () => (
  <>
    <Audio src={staticFile('hurricane/sfx/storm_bed.wav')} volume={(f) => bedGain(f / FPS)} />
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
        <Audio src={staticFile(`hurricane/sfx/${c.f}.wav`)} volume={db(c.db)} />
      </Sequence>
    ))}
  </>
);
