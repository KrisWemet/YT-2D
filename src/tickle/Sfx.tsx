import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {DUR, FPS, T} from './timing';

// Reuses the procedural one-shots made for the earlier Shorts (public/pigeon/sfx).
type Cue = {f: string; at: number; db: number; dur?: number};
const P = (n: string) => `pigeon/sfx/${n}.wav`;
const giggles = (from: number, n: number) => Array.from({length: n}, (_, i) => ({f: P('plip'), at: from + i * 0.21, db: -31 + (i % 2) * 2}));
const CUES: Cue[] = [
  // hook: already mid-laugh at frame 0, robot motor running
  ...giggles(0.0, 5),
  {f: P('hum_bed'), at: 0, db: -36, dur: T.your + 0.3},
  {f: P('click'), at: T.robot1 - 0.03, db: -24},
  {f: P('pop'), at: T.fifth1 - 0.2, db: -22},
  ...[0, 1, 2].map((i) => ({f: P('tick'), at: T.fifth1 - 0.1 + i * 0.2, db: -24})),
  // explanation: robot rolls away, brain pops up, predicts, turns it down
  {f: P('whoosh'), at: T.your - 0.03, db: -23},
  {f: P('pop_big'), at: T.brain - 0.12, db: -21},
  {f: P('bloop'), at: T.predicts - 0.05, db: -24},
  {f: P('zip'), at: T.predicts + 0.05, db: -30},
  ...[0, 1, 2, 3, 4].map((i) => ({f: P('tick'), at: T.turns + i * 0.12, db: -25})),
  {f: P('slowdown'), at: T.down - 0.05, db: -22},
  {f: P('pop'), at: T.but, db: -27},
  // the experiment: robot rolls back in, tickles in sync
  {f: P('whir'), at: T.experiment, db: -22},
  {f: P('whoosh'), at: T.experiment + 0.05, db: -24},
  {f: P('thud'), at: T.experiment + 0.6, db: -20},
  {f: P('hum_bed'), at: T.experiment + 0.6, db: -36, dur: DUR - T.experiment - 0.6},
  {f: P('plip'), at: T.robot2 - 0.02, db: -26},
  // the delay
  {f: P('pop'), at: T.waited - 0.15, db: -22},
  ...[0, 1, 2, 3].map((i) => ({f: P('tick'), at: T.fifth2 - 0.2 + i * 0.19, db: -23})),
  // the prediction is off: bubble back, dizzy, "?"
  {f: P('pop_big'), at: T.prediction - 0.25, db: -22},
  {f: P('bloop'), at: T.prediction, db: -25},
  {f: P('pop'), at: T.off, db: -21},
  // it tickles: laugh, meter to the "someone else" mark
  {f: P('boing'), at: T.tickly, db: -18},
  {f: P('speedup'), at: T.tickly + 0.02, db: -24},
  {f: P('sparkle'), at: T.tickly + 0.1, db: -24},
  ...giggles(T.tickly + 0.25, 8),
  {f: P('pop'), at: T.someone - 0.12, db: -23},
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
