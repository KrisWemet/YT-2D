import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS, T} from './timing';

// Reuses the procedural one-shots made for the earlier Shorts (public/pigeon/sfx, public/hurricane/sfx).
type Cue = {f: string; at: number; db: number; dur?: number};
const P = (n: string) => `pigeon/sfx/${n}.wav`;
const CUES: Cue[] = [
  // line 1: deadpan self-tickle, "?"
  {f: P('shimmer'), at: 0.0, db: -34},
  {f: P('pop'), at: T.yourself, db: -22},
  // line 2: the brain pops up and sees it coming
  {f: P('pop_big'), at: T.brain - 0.12, db: -21},
  {f: P('bloop'), at: T.sees - 0.05, db: -24},
  {f: P('zip'), at: T.sees + 0.05, db: -30},
  // line 3: prediction, the knob turned down, the meter drops
  {f: P('sparkle'), at: T.predicts, db: -28},
  ...[0, 1, 2, 3, 4, 5].map((i) => ({f: P('tick'), at: T.turns + i * 0.14, db: -25})),
  {f: P('slowdown'), at: T.down - 0.05, db: -22},
  {f: P('pop'), at: 8.55, db: -27},
  // line 4: the robot rolls in, tickles in sync
  {f: P('whir'), at: 8.85, db: -22},
  {f: P('whoosh'), at: 8.9, db: -24},
  {f: P('thud'), at: 9.45, db: -20},
  {f: P('hum_bed'), at: 9.5, db: -36, dur: 9.0},
  {f: P('plip'), at: T.robot - 0.02, db: -26},
  // line 5: the stopwatch, one fifth of a second
  {f: P('pop'), at: T.waited - 0.15, db: -22},
  ...[0, 1, 2, 3].map((i) => ({f: P('tick'), at: T.fifth - 0.2 + i * 0.19, db: -23})),
  // line 6: it tickles! meter shoots up, someone-else mark
  {f: P('boing'), at: T.tickly, db: -18},
  {f: P('speedup'), at: T.tickly + 0.02, db: -24},
  {f: P('sparkle'), at: T.tickly + 0.1, db: -24},
  ...[0, 1, 2, 3, 4].map((i) => ({f: P('plip'), at: T.tickly + 0.25 + i * 0.21, db: -31 + (i % 2) * 2})),
  {f: P('pop'), at: T.someone - 0.12, db: -23},
  // line 7: robot leaves, the confused brain, back to the start
  {f: P('whoosh_soft'), at: 17.5, db: -27},
  {f: P('whir'), at: 18.55, db: -26},
  {f: P('pop_big'), at: 18.62, db: -22},
  {f: P('bloop'), at: T.yourBrain - 0.25, db: -25},
  {f: P('pop'), at: T.cant, db: -21},
  {f: P('pop'), at: 20.0, db: -28},
  {f: P('whoosh_soft'), at: 20.1, db: -29},
  {f: P('shimmer'), at: 20.3, db: -34},
];
const db = (d: number) => 10 ** (d / 20);

export const TickleSfx: React.FC = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
        <Audio src={staticFile(c.f)} volume={db(c.db)} loop={c.f.includes('_bed')} />
      </Sequence>
    ))}
  </>
);
