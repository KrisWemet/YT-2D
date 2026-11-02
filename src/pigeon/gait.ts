// Pigeon walk: head hold / thrust phases, body path, foot plants. All x in sprite px along the ground.
import {easeInOutCubic, easeInOutSine, lerp, monotone} from './lib';

export const STEP = 120; // body travel per head cycle (sprite px)
export const HIP = {near: 37, far: -37}; // hip x relative to the rig origin
export const LIFT = 46; // foot lift during a swing

export type FootState = {x: number; lift: number; u: number}; // u: swing progress (0 planted)
export type Walk = {
  body: (t: number) => number;
  head: (t: number) => number; // head x (world-fixed during holds)
  headDx: (t: number) => number; // head offset relative to body
  foot: (t: number, which: 'near' | 'far') => FootState;
  thrusts: Array<[number, number]>;
  holdStart: (t: number) => number; // start time of the hold that contains t (or -1)
};

/**
 * thrusts: [start, end] times of each head thrust (sorted). The body passes STEP per thrust,
 * reaching b0 + i*STEP at the start of thrust i (monotone cubic in between).
 * pauses: extra anchors [time, bodyX] to hold the body still (e.g. a peck).
 * firstFoot: which foot swings with thrust 0.
 */
export const makeWalk = (
  thrusts: Array<[number, number]>,
  b0: number,
  opts: {firstFoot?: 'near' | 'far'; headFixed?: boolean; extraAnchors?: Array<[number, number]>; step?: number} = {},
): Walk => {
  const S = opts.step ?? STEP;
  const ax: Array<[number, number]> = thrusts.map(([ts], i) => [ts, b0 + i * S]);
  // lead-in / lead-out anchors keep the speed sensible outside the schedule
  const n = thrusts.length;
  const p0 = thrusts[1][0] - thrusts[0][0];
  const p1 = thrusts[n - 1][0] - thrusts[n - 2][0];
  ax.unshift([thrusts[0][0] - p0, b0 - S]);
  ax.push([thrusts[n - 1][0] + p1, b0 + n * S]);
  for (const e of opts.extraAnchors ?? []) ax.push(e);
  ax.sort((a, b) => a[0] - b[0]);
  const body = monotone(ax.map((a) => a[0]), ax.map((a) => a[1]));
  // virtual thrusts before / after for plant + hold bookkeeping
  const T: Array<[number, number]> = [
    [thrusts[0][0] - 2 * p0, thrusts[0][1] - 2 * p0],
    [thrusts[0][0] - p0, thrusts[0][1] - p0],
    ...thrusts,
    [thrusts[n - 1][0] + p1, thrusts[n - 1][1] + p1],
    [thrusts[n - 1][0] + 2 * p1, thrusts[n - 1][1] + 2 * p1],
  ];
  const N = T.length;
  const hold = T.map((tr, i) => (i + 1 < N ? (body(tr[1]) + body(T[i + 1][0])) / 2 : body(tr[1]) + S * 0.35));
  const head = (t: number) => {
    if (opts.headFixed) return body(t);
    for (let i = 0; i < N; i++) {
      const [ts, te] = T[i];
      if (t < ts) return i === 0 ? hold[0] - S : hold[i - 1];
      if (t < te) return lerp(i === 0 ? hold[0] - S : hold[i - 1], hold[i], easeInOutCubic((t - ts) / (te - ts)));
    }
    return hold[N - 1];
  };
  const holdStart = (t: number) => {
    let s = -1;
    for (const [, te] of T) if (te <= t) s = te;
    return s;
  };
  // feet: swing index i belongs to foot (i + parity) % 2
  const parity = (opts.firstFoot ?? 'near') === 'near' ? 0 : 1; // thrust 0 (index 2 in T) swings firstFoot
  const footOf = (i: number): 'near' | 'far' => ((i - 2 + parity) % 2 === 0 ? 'near' : 'far');
  const plant = (i: number, which: 'near' | 'far') => {
    const te = T[i][1];
    const next = i + 2 < N ? body(T[i + 2][0]) : body(te) + 2 * S;
    return body(te) + HIP[which] + (next - body(te)) / 2;
  };
  const foot = (t: number, which: 'near' | 'far'): FootState => {
    let last = -1;
    for (let i = 0; i < N; i++) if (footOf(i) === which && T[i][0] <= t) last = i;
    if (last < 0) {
      // before the first swing of this foot: planted two steps behind its first plant
      const first = T.findIndex((_, i) => footOf(i) === which);
      return {x: plant(first, which) - 2 * S, lift: 0, u: 0};
    }
    const [ts, te] = T[last];
    const prev = last - 2 >= 0 ? plant(last - 2, which) : plant(last, which) - 2 * S;
    const cur = plant(last, which);
    if (t >= te) return {x: cur, lift: 0, u: 0};
    const u = (t - ts) / (te - ts);
    return {x: lerp(prev, cur, easeInOutSine(u)), lift: Math.sin(Math.PI * u) * LIFT, u};
  };
  return {body, head, headDx: (t) => head(t) - body(t), foot, thrusts, holdStart};
};

/** Regular thrust schedule: period p, thrust fraction f, from t0 to t1. */
export const regular = (t0: number, t1: number, p: number, f = 0.32): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  for (let t = t0; t < t1; t += p) out.push([t, t + f * p]);
  return out;
};
