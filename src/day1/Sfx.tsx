// Sound for the Day 1 cold open: voices, beds that follow the picture, and spot effects.
// Everything before the hard cut stops on the cut frame; then silence, the voice-over, the title.
import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {B, FPS, SHOT, VO} from './kit';
import C from './cues.json';
import {clamp, lerp} from '../pigeon/lib';
import {TYPE_AT, TYPE_STEP} from './Title';

const MP3 = new Set(['breath', 'buzz_canopy', 'buzz_lamp', 'chime', 'crowd', 'drone', 'heartbeat', 'hit', 'night_bed', 'night_muffled', 'pad', 'room', 'title_hit']);
const src = (f: string) => staticFile(`day1/sfx/${f}.${MP3.has(f) ? 'mp3' : 'wav'}`);
const MASTER = 3; // dB on everything (integrated loudness ~ -15 LUFS)
const db = (d: number) => (d <= -90 ? 0 : 10 ** ((d + MASTER) / 20));
const CUT_F = Math.round(B.cut * FPS);

/** level in dB per shot, with short crossfades at the cuts (bed volumes) */
const perShot = (levels: Partial<Record<string, number>>, fade = 0.06) => (t: number) => {
  const names = Object.keys(SHOT);
  let v = -99;
  for (const n of names) {
    const [a, b] = SHOT[n];
    const lv = levels[n];
    if (lv === undefined) continue;
    const w = clamp((t - a + fade) / fade) * clamp((b - t) / fade);
    if (w > 0) v = Math.max(v, lv + 20 * Math.log10(Math.max(w, 1e-4)));
  }
  return v;
};

type Bed = {f: string; from?: number; vol: (t: number) => number};
const BEDS: Bed[] = [
  {f: 'night_bed', vol: perShot({establish: -19, can: -23, ladder: -27, knuckles: -28, boots: -29, face: -32})},
  {f: 'night_muffled', vol: perShot({window: -22})},
  {f: 'buzz_canopy', vol: perShot({establish: -25, can: -23, window: -36})},
  {f: 'buzz_lamp', vol: perShot({ladder: -29, knuckles: -26, boots: -31, face: -31})},
  {f: 'chime', vol: perShot({establish: -26, can: -30, window: -21})},
  {f: 'drone', vol: (t) => lerp(-28, -15, Math.pow(clamp(t / B.cut), 1.5))},
  {f: 'crowd', from: SHOT.ladder[0], vol: perShot({ladder: -28, knuckles: -26, boots: -19, face: -21})},
  {f: 'heartbeat', from: SHOT.ladder[0], vol: (t) => lerp(-24, -12, clamp((t - SHOT.ladder[0]) / (B.cut - SHOT.ladder[0])))},
  {f: 'breath', from: SHOT.ladder[0], vol: perShot({ladder: -27, knuckles: -25, boots: -28, face: -21})},
];

type Cue = {f: string; at: number; db: number};
const taps = [10.35, 10.62, 11.4, 12.5, 12.95, 13.9, 14.25, 15.1, 16.0];
const CUES: Cue[] = [
  // wide: the first shape at the edge of the light
  {f: 'groan2', at: 3.1, db: -26},
  // fast cuts
  {f: 'riser_short', at: SHOT.can[0] - 0.58, db: -25},
  {f: 'hit', at: SHOT.can[0], db: -13},
  {f: 'glug', at: SHOT.can[0], db: -15},
  {f: 'groan_muffled', at: B.slam - 0.05, db: -20},
  {f: 'slam', at: B.slam, db: -4},
  {f: 'hit', at: B.slam, db: -17},
  {f: 'squeak', at: B.slam + 0.24, db: -22},
  // ladder
  {f: 'creak0', at: 8.55, db: -22},
  {f: 'gasp', at: B.flinch + 0.05, db: -21},
  {f: 'creak1', at: 9.5, db: -22},
  {f: 'clang', at: 9.97, db: -13},
  {f: 'flakes', at: 10.0, db: -24},
  {f: 'creak2', at: 11.0, db: -18},
  {f: 'flakes', at: 11.2, db: -21},
  {f: 'flakes', at: 11.6, db: -24},
  ...taps.map((at, i) => ({f: 'tap', at, db: -22 - (i % 3) * 2})),
  {f: 'groan0', at: 12.25, db: -18},
  {f: 'creak0', at: 12.4, db: -24},
  {f: 'groan4', at: 12.95, db: -17},
  {f: 'scuff', at: B.brush, db: -14},
  {f: 'gasp', at: B.brush + 0.03, db: -15},
  {f: 'clang', at: B.brush + 0.25, db: -19},
  {f: 'creak1', at: 13.75, db: -24},
  {f: 'groan1', at: 14.6, db: -21},
  {f: 'groan3', at: 15.4, db: -19},
  {f: 'groan5', at: 16.2, db: -17},
  {f: 'gasp', at: B.pupils, db: -17},
];

const TITLE_ON = C.titleFlicker.filter((_, i) => i % 2 === 0);
const LETTERS = 'BEFORE WE GO'.split('').map((ch, i) => ({ch, at: TYPE_AT + i * TYPE_STEP})).filter((l) => l.ch !== ' ');

const VOICE: Array<{f: string; at: number; db: number}> = [
  {f: 'm1', at: VO.m1, db: -5},
  {f: 'm2', at: VO.m2, db: -5},
  {f: 'm3', at: VO.m3, db: -4},
  {f: 'm4', at: VO.m4, db: -1.5},
  {f: 's1', at: VO.s1, db: -1},
];

export const Day1Sfx: React.FC = () => (
  <>
    {BEDS.map((b) => {
      const from = Math.round((b.from ?? 0) * FPS);
      return (
        <Sequence key={b.f} from={from} durationInFrames={CUT_F - from} layout="none">
          <Audio src={src(b.f)} volume={(f) => db(b.vol((f + from) / FPS))} />
        </Sequence>
      );
    })}
    {CUES.map((c, i) => {
      const from = Math.round(c.at * FPS);
      return (
        <Sequence key={`c${i}`} from={from} durationInFrames={Math.max(1, CUT_F - from)} layout="none">
          <Audio src={src(c.f)} volume={db(c.db)} />
        </Sequence>
      );
    })}
    {VOICE.map((v) => (
      <Sequence key={v.f} from={Math.round(v.at * FPS)} layout="none">
        <Audio src={staticFile(`day1/vo/${v.f}.wav`)} volume={db(v.db)} />
      </Sequence>
    ))}
    {/* after the silence: a warm pad under the voice-over, then the title */}
    <Sequence from={Math.round((VO.s1 - 0.5) * FPS)} layout="none">
      <Audio src={src('pad')} volume={db(-29)} />
    </Sequence>
    <Sequence from={Math.round(B.titleHit * FPS)} layout="none">
      <Audio src={src('title_hit')} volume={db(-6)} />
    </Sequence>
    <Sequence from={Math.round(B.titleHit * FPS)} layout="none">
      <Audio src={src('room')} volume={db(-34)} />
    </Sequence>
    {TITLE_ON.map((at, i) => (
      <Sequence key={`z${i}`} from={Math.round(at * FPS)} layout="none">
        <Audio src={src('zap')} volume={db(-23 - 3 * i)} />
      </Sequence>
    ))}
    {LETTERS.map((l, i) => (
      <Sequence key={`t${i}`} from={Math.round(l.at * FPS)} layout="none">
        <Audio src={src('type')} volume={db(-27)} />
      </Sequence>
    ))}
  </>
);
