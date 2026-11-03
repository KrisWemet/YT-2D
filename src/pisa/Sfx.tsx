import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {DUR, FPS, T} from './timing';

// New: rumble and creak (images/pisa/sfx.py). The rest reuses the earlier Shorts' procedural effects.
type Cue = {f: string; at: number; db: number; dur?: number};
const P = (n: string) => `pigeon/sfx/${n}.wav`;
const H = (n: string) => `hurricane/sfx/${n}.wav`;
const Q = (n: string) => `pisa/sfx/${n}.wav`;
const BADGES = [T.four, T.four + 0.22, T.four + 0.44, T.four + 0.66];
// metronome ticks while both metronomes are up: the tower's slow swing (14 cycles over DUR), the ground's fast one
const towerTicks = Array.from({length: 40}, (_, k) => ((k + 0.25) * DUR) / 28).filter((x) => x > T.different + 0.1 && x < 17.4);
const groundTicks = Array.from({length: 30}, (_, k) => T.different + 0.15 + k / 6).filter((x) => x < 17.4);
const CUES: Cue[] = [
  {f: P('city_bed'), at: 0, db: -36, dur: DUR},
  // hook: already shaking at frame 0, four quakes thump into the tally
  {f: Q('rumble'), at: 0, db: -11},
  ...BADGES.map((at) => ({f: H('boom_small'), at, db: -21})),
  ...BADGES.map((at) => ({f: P('pop'), at: at + 0.01, db: -27})),
  {f: P('pop'), at: T.earthquakes - 0.05, db: -23},
  {f: P('stamp'), at: T.damage - 0.03, db: -23},
  // the open loop: he props it up, "?" over the soil, creak on "lean"
  {f: P('whoosh_soft'), at: T.protecting - 0.05, db: -27},
  {f: P('pop'), at: T.same - 0.05, db: -22},
  {f: P('bloop'), at: T.same + 0.1, db: -27},
  {f: Q('creak'), at: T.lean - 0.12, db: -17},
  // the reveal: soft ground
  {f: P('whoosh_soft'), at: T.theGround - 0.05, db: -27},
  {f: P('boing'), at: T.soft1 - 0.04, db: -20},
  // tall, stiff, soft soil
  {f: P('zip'), at: T.tall - 0.05, db: -24},
  {f: P('stamp'), at: T.stiff - 0.03, db: -25},
  {f: P('bloop'), at: T.soft2 - 0.04, db: -26},
  // demo shaking, metronomes, the ghost that builds up, crossed out
  {f: Q('rumble'), at: T.sways - 0.15, db: -17},
  {f: Q('rumble'), at: T.sways + 2.6, db: -18},
  {f: P('pop'), at: T.different - 0.15, db: -24},
  ...towerTicks.map((at) => ({f: P('tick'), at, db: -25})),
  ...groundTicks.map((at) => ({f: P('tick_soft'), at, db: -33})),
  {f: P('speedup'), at: T.shaking1 - 0.05, db: -23},
  {f: P('stamp'), at: T.doesnt, db: -18},
  // the payoff: the soil glows, creak on "tilted", shield on "saves", and the shaking comes back (loop)
  {f: P('whoosh_soft'), at: T.basically, db: -27},
  {f: P('sparkle'), at: T.soil3 - 0.02, db: -24},
  {f: Q('creak'), at: T.tilted - 0.06, db: -22},
  {f: P('pop_big'), at: T.saves - 0.05, db: -20},
  {f: P('shimmer'), at: T.saves + 0.1, db: -27},
  {f: Q('rumble'), at: T.saves - 0.05, db: -12},
];
const db = (d: number) => 10 ** (d / 20);

export const PisaSfx: React.FC = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
        <Audio src={staticFile(c.f)} volume={db(c.db)} loop={c.f.includes('_bed')} />
      </Sequence>
    ))}
  </>
);
