import React from 'react';
import {Audio, interpolate, Sequence, staticFile} from 'remotion';
import {DUR, FPS, resolveCue, segment, wordTime} from './timing';

const db = (d: number) => 10 ** (d / 20);
const f = (s: number) => Math.max(0, Math.round(s * FPS));

// One-shot effects: file, absolute time, level in dB.
type Hit = {file: string; at: number; db: number};
const m1 = segment('marcus1');
const m2 = segment('marcus2');
const wo = segment('woman');

const HITS: Hit[] = [
  {file: 'keys', at: wordTime('keys', 20) - 0.15, db: -12},
  {file: 'static', at: m1.s - 0.32, db: -16},
  {file: 'static', at: m1.e + 0.02, db: -18},
  {file: 'static', at: m2.s - 0.32, db: -16},
  {file: 'crackle', at: m2.e, db: -11},
  {file: 'slam', at: wordTime('Then nothing', 40) - 0.05, db: -18},
  {file: 'gate', at: wordTime('Pull it down', 70) - 0.05, db: -17},
  {file: 'lock', at: wordTime('lock it', 70) - 0.08, db: -18},
  {file: 'glass', at: wordTime('shatter', 110) - 0.06, db: -4},
  {file: 'slam', at: wordTime('shatter', 110) - 0.04, db: -12},
  {file: 'gate', at: wordTime('yank', 110) - 0.15, db: -8},
  {file: 'lock', at: wordTime('lock it', 117) - 0.08, db: -11},
  {file: 'breath', at: wordTime('presses', 125) + 0.2, db: -9},
  {file: 'slam', at: wordTime("It's Marcus", 130) - 0.05, db: -8},
  {file: 'crackle', at: wordTime('crackles', 135) - 0.15, db: -9},
  {file: 'static', at: wo.s - 0.35, db: -14},
  {file: 'static', at: wo.e + 0.02, db: -16},
  {file: 'slam', at: wordTime('every head', 145) - 0.05, db: -6},
  {file: 'slam', at: wordTime('That was hour', 150) - 0.05, db: -12},
];

// Looping beds: file, from/to (absolute s), and a level curve [time, dB][] (held at the ends).
type Bed = {file: string; from: number; to: number; curve: [number, number][]};
const T = (c: string, from = 0) => resolveCue(c, from);
const tNothing = T('Then nothing', 39);
const tBehind = T('Behind me', 100);
const tFoot = T('Footsteps', 120);
const tHead = T('every head', 145);
const tEnd = T('That was hour one', 150);

const BEDS: Bed[] = [
  {file: 'mallhum', from: 0, to: DUR, curve: [[0, -30], [tBehind, -30], [tBehind + 1, -38], [DUR - 2, -38], [DUR, -60]]},
  // the garage: Marcus's intro, both radio calls, the camera feeds
  {file: 'garage', from: T('the other night guard', 20), to: T('And a ring', 22), curve: [[0, -26]]},
  {file: 'garage', from: m1.s - 0.1, to: T('Then I hear him', 33), curve: [[0, -27]]},
  {file: 'garage', from: m2.s - 0.1, to: tNothing, curve: [[0, -27]]},
  {file: 'garage', from: T('Garage level', 42), to: T('>counting', 50), curve: [[0, -30]]},
  {file: 'groans', from: T('behind them', 46), to: T("Here's the thing", 55), curve: [[0, -34], [T('Six', 50), -30], [T('>counting', 50), -27]]},
  // tension under the second half
  {
    file: 'drone',
    from: tNothing,
    to: DUR,
    curve: [[tNothing, -40], [tNothing + 2, -29], [tBehind, -28], [tFoot, -22], [tHead, -17], [tEnd + 0.6, -19], [DUR, -50]],
  },
  {file: 'groans', from: tBehind, to: DUR, curve: [[tBehind, -40], [tBehind + 2.2, -24], [tFoot, -21], [wo.s, -27], [wo.e, -27], [tHead, -15], [tEnd + 0.5, -22], [DUR, -60]]},
  {file: 'shuffle', from: tFoot - 0.2, to: DUR, curve: [[tFoot - 0.2, -30], [tFoot + 0.4, -18], [wo.s, -25], [tHead, -18], [tEnd + 0.4, -30], [DUR, -60]]},
];

const curveDb = (curve: [number, number][], t: number) =>
  curve.length === 1
    ? curve[0][1]
    : interpolate(
        t,
        curve.map((c) => c[0]),
        curve.map((c) => c[1]),
        {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
      );

export const MallSfx: React.FC = () => (
  <>
    {HITS.map((h, i) => (
      <Sequence key={`h${i}`} from={f(h.at)} layout="none">
        <Audio src={staticFile(`mall/sfx/${h.file}.mp3`)} volume={db(h.db)} />
      </Sequence>
    ))}
    {BEDS.map((b, i) => {
      const from = f(b.from);
      const len = Math.max(1, f(b.to) - from);
      return (
        <Sequence key={`b${i}`} from={from} durationInFrames={len} layout="none">
          <Audio
            src={staticFile(`mall/sfx/${b.file}.mp3`)}
            loop
            volume={(fr) => {
              const t = (from + fr) / FPS;
              const edge = Math.min(1, fr / 6, (len - fr) / 6); // short fades at both ends
              return db(curveDb(b.curve, t)) * Math.max(0, edge);
            }}
          />
        </Sequence>
      );
    })}
  </>
);
