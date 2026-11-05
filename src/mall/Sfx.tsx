import React from 'react';
import {Audio, interpolate, Sequence, staticFile} from 'remotion';
import {DUR, FPS, resolveCue, segment, wordTime} from './timing';

// Sound for the first-minute test (the v10 voice).
const db = (d: number) => 10 ** (d / 20);
const f = (s: number) => Math.max(0, Math.round(s * FPS));

const m1 = segment('marcus1');
const T = (c: string, from = 0) => resolveCue(c, from);
const W = (phrase: string, from = 0) => wordTime(phrase, from);

const tFlash = T('An hour ago', 4);
const tRewind = T('Let me back', tFlash);
const tBus = T('>one reason', tRewind);
const tSeven = T("She's seven", tBus);
const tKeysShot = T('because I carry', tSeven);
const tOne = T("Tonight I'd only", tKeysShot);
const tGarage = T('Marcus calls', tOne);
const tTonight = T('Tonight he calls', tGarage);
const tEnd = resolveCue('>+wrong', m1.s); // the end card, right after Marcus says "wrong"

type Hit = {file: string; at: number; db: number};
const HITS: Hit[] = [
  {file: 'breath', at: 0.2, db: -12},
  {file: 'crackle', at: W('about to tell', 3) - 0.1, db: -16},
  {file: 'rewind', at: tRewind + 0.05, db: -9},
  {file: 'musicbox', at: tSeven - 0.05, db: -22},
  {file: 'keys', at: W('keys', tKeysShot) - 0.2, db: -12},
  {file: 'lock', at: W('one of them', tOne) - 0.1, db: -15},
  {file: 'static', at: m1.s - 0.32, db: -16},
  {file: 'static', at: m1.e + 0.02, db: -18},
  {file: 'slam', at: tEnd, db: -10},
];

type Bed = {file: string; from: number; to: number; curve: [number, number][]};
const BEDS: Bed[] = [
  // cold open: the hallway full of them
  {file: 'groans', from: 0, to: tFlash + 0.3, curve: [[0, -30], [3, -25], [tFlash, -27]]},
  {file: 'shuffle', from: 0, to: tFlash + 0.3, curve: [[0, -30]]},
  {file: 'drone', from: 0, to: tFlash + 0.5, curve: [[0, -34], [3, -26], [tFlash, -27]]},
  // the mall at night, the sunny street, the garage
  {file: 'mallhum', from: tFlash, to: tBus, curve: [[0, -31]]},
  {file: 'suburb', from: tBus - 0.1, to: tKeysShot, curve: [[0, -25]]},
  {file: 'mallhum', from: tKeysShot, to: tEnd, curve: [[0, -31]]},
  {file: 'garage', from: tGarage - 0.1, to: tTonight, curve: [[0, -27]]},
  {file: 'garage', from: m1.s - 0.1, to: tEnd, curve: [[0, -26]]},
  // tension builds from 1:40 a.m.
  {file: 'drone', from: tTonight, to: DUR, curve: [[tTonight, -40], [tTonight + 2, -28], [tEnd, -22], [DUR, -50]]},
  {file: 'groans', from: m1.s, to: DUR, curve: [[m1.s, -40], [m1.e, -30], [DUR, -55]]},
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
