import React from 'react';
import {Audio, interpolate, Sequence, staticFile} from 'remotion';
import {DUR, FPS, resolveCue, segment, wordTime} from './timing';

const db = (d: number) => 10 ** (d / 20);
const f = (s: number) => Math.max(0, Math.round(s * FPS));

const m1 = segment('marcus1');
const m2 = segment('marcus2');
const wo = segment('woman');
const T = (c: string, from = 0) => resolveCue(c, from);
const W = (phrase: string, from = 0) => wordTime(phrase, from);

// Key moments (absolute seconds), resolved from the narration.
const tFlash = T('One hour ago', 10); // flashback: the warm "king of the mall" shot
const tRewind = T('Let me back', 15);
const tTitle = T('>back up', 15);
const tDanny = T("My name's Danny", 20);
const tBus = T('I took the night', 30);
const tSeven = T("She's seven", 35);
const tKeysShot = T('Because I have these', 40);
const tJoke = T('>rattle the same gates', 50);
const tTonight = T("Tonight he didn't", 60);
const tCams = T('Garage level', 85);
const tBehindThem = T('And behind them', 95);
const tWalking = T('Every one of them is walking', 105);
const tGlass = T("Here's what nobody", 115);
const tFriday = T('>Glass ceilings', 120);
const tDeath = T("Tonight it's a death", 125);
const tRun = T('So I run', 150);
const tBoom = W('explode', 180);
const tBehind = T('Behind me', 180);
const tSit = T('Then I sit', 200);
const tThink = T('thinking about', 205);
const tFoot = T('Footsteps', 210);
const tHead = T('every head', 235);
const tHour = T('That was hour one', 240);
const tEnd = T('>dangerous person in it', 250);

type Hit = {file: string; at: number; db: number};
const ticks: Hit[] = [];
for (let t = tRun; t < tBoom - 0.2; t += 0.5) ticks.push({file: 'tick', at: t, db: t > tBoom - 8 ? -16 : -21});

const HITS: Hit[] = [
  {file: 'breath', at: 0.3, db: -12},
  {file: 'crackle', at: W('crackle', 5) - 0.05, db: -15},
  {file: 'rewind', at: tRewind + 0.1, db: -9},
  {file: 'slam', at: tTitle, db: -11},
  {file: 'musicbox', at: tSeven - 0.1, db: -21},
  {file: 'keys', at: W('keys', 40) - 0.2, db: -12},
  {file: 'static', at: m1.s - 0.32, db: -16},
  {file: 'static', at: m1.e + 0.02, db: -18},
  {file: 'static', at: m2.s - 0.32, db: -16},
  {file: 'crackle', at: m2.e, db: -11},
  {file: 'slam', at: W('silent', 80) - 0.05, db: -17},
  {file: 'crowd', at: tFriday + 0.05, db: -13},
  {file: 'slam', at: tDeath, db: -15},
  {file: 'gate', at: W('Pull it down', 130) - 0.05, db: -17},
  {file: 'lock', at: W('Lock it', 140) - 0.08, db: -18},
  {file: 'slam', at: W('four minutes', 145) - 0.1, db: -13},
  ...ticks,
  {file: 'glass', at: tBoom - 0.06, db: -4},
  {file: 'slam', at: tBoom - 0.04, db: -11},
  {file: 'gate', at: W('Yank', 195) - 0.15, db: -8},
  {file: 'lock', at: W('key number', 200) - 0.5, db: -11},
  {file: 'musicbox', at: tThink, db: -22},
  {file: 'breath', at: T('>Shuffling past the gate', 215) + 0.1, db: -10},
  {file: 'slam', at: T('>stops', 215), db: -8},
  {file: 'crackle', at: W('crackles', 222) - 0.15, db: -9},
  {file: 'static', at: wo.s - 0.35, db: -14},
  {file: 'static', at: wo.e + 0.02, db: -16},
  {file: 'slam', at: tHead - 0.05, db: -6},
  {file: 'slam', at: tHour - 0.05, db: -12},
  {file: 'slam', at: tEnd, db: -10},
];

// Looping beds: file, from/to (absolute s), and a level curve [time, dB][] (held at the ends).
type Bed = {file: string; from: number; to: number; curve: [number, number][]};
const BEDS: Bed[] = [
  // cold open: the hallway full of them, then the flashback goes quiet
  {file: 'groans', from: 0, to: tFlash + 0.3, curve: [[0, -30], [3, -25], [tFlash, -28]]},
  {file: 'shuffle', from: 0, to: tFlash + 0.3, curve: [[0, -30]]},
  {file: 'drone', from: 0, to: tFlash + 0.6, curve: [[0, -34], [4, -26], [tFlash, -27]]},
  // the mall at night (but not on the sunny street)
  {file: 'mallhum', from: tFlash, to: tBus, curve: [[0, -31]]},
  {file: 'suburb', from: tBus - 0.1, to: tKeysShot, curve: [[0, -25]]},
  {file: 'mallhum', from: tKeysShot, to: DUR, curve: [[tKeysShot, -31], [tBehind, -31], [tBehind + 1, -38], [DUR - 2, -38], [DUR, -60]]},
  // the garage: Marcus's joke and intro, both radio calls, the camera feeds
  {file: 'garage', from: tJoke, to: tTonight, curve: [[0, -27]]},
  {file: 'garage', from: m1.s - 0.1, to: T("Marcus doesn't know", 70), curve: [[0, -27]]},
  {file: 'garage', from: m2.s - 0.1, to: T('Then the radio', 80), curve: [[0, -27]]},
  {file: 'garage', from: tCams, to: tWalking, curve: [[0, -30]]},
  {file: 'groans', from: tBehindThem, to: tGlass, curve: [[0, -34], [T('Six', 100), -30], [tWalking, -27]]},
  {file: 'groans', from: tDeath, to: T('But I know something', 130), curve: [[0, -22]]},
  // tension under the second half
  {
    file: 'drone',
    from: tTonight,
    to: DUR,
    curve: [[tTonight, -40], [tTonight + 2, -30], [tBehind, -28], [tFoot, -22], [tHead, -17], [tHour + 0.6, -19], [tEnd, -24], [DUR, -50]],
  },
  {file: 'heartbeat', from: tSit, to: tHead + 0.5, curve: [[tSit, -30], [tSit + 2, -22], [tHead, -17]]},
  {file: 'groans', from: tBehind, to: DUR, curve: [[tBehind, -40], [tBehind + 2.2, -24], [tFoot, -21], [wo.s, -27], [wo.e, -27], [tHead, -15], [tHour + 0.5, -24], [DUR, -60]]},
  {file: 'shuffle', from: tFoot - 0.2, to: DUR, curve: [[tFoot - 0.2, -30], [tFoot + 0.4, -18], [wo.s, -25], [tHead, -18], [tHour + 0.4, -30], [DUR, -60]]},
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
