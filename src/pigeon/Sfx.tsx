import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS, T} from './timing';
import {WALK_A, WALK_B, WALK_C} from './Street';
import {TW} from './Lab';

type Cue = {f: string; at: number; db: number; dur?: number};
const plants = (thr: Array<[number, number]>, t0: number, t1: number) => thr.map(([, te]) => te).filter((te) => te >= t0 && te < t1);

const CUES: Cue[] = [
  // footsteps
  ...plants(WALK_A.thrusts, 0, T.cutLab).map((at) => ({f: 'tick', at, db: at > 1.2 && at < 6.4 ? -22 : -27})),
  ...plants(TW.thrusts, 10.9, T.cutClose).map((at) => ({f: 'tick_soft', at, db: -27})),
  ...plants(WALK_B.thrusts, T.cutStreet2, T.cutCam).map((at) => ({f: 'tick', at, db: -27})),
  ...plants(WALK_C.thrusts, T.cutStreet3, 24.95).map((at) => ({f: 'tick', at, db: -27})),
  // line 1-2: guide lines, "backward" X, slow motion, freeze, dart
  {f: 'pop', at: 1.3, db: -22}, {f: 'pop', at: 2.14, db: -24}, {f: 'pop', at: 3.39, db: -22}, {f: 'pop', at: 6.05, db: -25},
  {f: 'slowdown', at: 1.12, db: -27},
  {f: 'pop', at: T.moves + 0.02, db: -23}, {f: 'stamp', at: T.backward + 0.06, db: -17},
  {f: 'whoosh_soft', at: 2.7, db: -27},
  {f: 'pop_big', at: T.freezes + 0.04, db: -19},
  {f: 'pop', at: T.while + 0.06, db: -24},
  {f: 'whoosh', at: T.darts - 0.06, db: -17},
  {f: 'speedup', at: 6.25, db: -29},
  {f: 'whoosh_soft', at: 6.4, db: -27},
  // line 3: balance gag
  {f: 'boing', at: T.balance, db: -19}, {f: 'plip', at: T.balance + 0.28, db: -23},
  // line 4: lab
  {f: 'flutter', at: T.put + 0.04, db: -21}, {f: 'thud', at: T.put + 0.58, db: -17},
  {f: 'click', at: T.treadmill, db: -15}, {f: 'whir', at: T.treadmill + 0.02, db: -22},
  {f: 'pop_big', at: T.bobbing - 0.02, db: -22}, {f: 'pop', at: T.bobbing + 0.04, db: -24},
  {f: 'zip', at: 12.72, db: -25},
  // line 5-6
  {f: 'shimmer', at: T.view - 0.12, db: -23},
  {f: 'bloop', at: T.vision, db: -19}, {f: 'sparkle', at: T.vision + 0.05, db: -21},
  // line 7
  {f: 'pop', at: T.each - 0.05, db: -23},
  ...WALK_B.thrusts.map(([, te]) => te).filter((te) => te > T.each && te < T.cutCam).map((at) => ({f: 'btick', at, db: -27})),
  {f: 'shutter', at: T.still, db: -11},
  {f: 'whistle', at: 23.0, db: -29, dur: 24.02 - 23.0},
  {f: 'bloop', at: T.spot, db: -21},
  {f: 'snap', at: 24.02, db: -16}, {f: 'gulp', at: 24.08, db: -19},
];

const db = (d: number) => 10 ** (d / 20);
const ramp = (t: number, a: number, b: number, fade = 0.06) => Math.min(1, Math.max(0, (t - a) / fade)) * Math.min(1, Math.max(0, (b - t) / fade));

/** City ambience only in the street shots (ducked in slow motion). */
const cityGain = (t: number) => {
  const on = ramp(t, -1, T.cutLab) + ramp(t, T.cutStreet2, 99);
  const duck = t > 2.7 && t < 6.4 ? Math.min(1, Math.min(t - 2.7, 6.4 - t) / 0.4) : 0;
  return on * db(-30 - 7 * duck);
};
const humGain = (t: number) => ramp(t, T.treadmill + 0.15, T.cutStreet2, 0.4) * db(t < T.cutClose ? -27 : -33);

export const Sfx: React.FC = () => (
  <>
    <Audio src={staticFile('pigeon/sfx/city_bed.wav')} volume={(f) => cityGain(f / FPS)} />
    <Sequence from={Math.round(T.treadmill * FPS)} layout="none">
      <Audio src={staticFile('pigeon/sfx/hum_bed.wav')} volume={(f) => humGain(T.treadmill + f / FPS)} />
    </Sequence>
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
        <Audio src={staticFile(`pigeon/sfx/${c.f}.wav`)} volume={db(c.db)} />
      </Sequence>
    ))}
  </>
);
