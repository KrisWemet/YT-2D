import {POSES} from '../Stick';
import type {Eyes, Pose} from '../Stick';

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const angles = (a: [number, number], b: [number, number], t: number): [number, number] =>
  [mix(a[0], b[0], t), mix(a[1], b[1], t)];

export const ease = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};

export const blendPose = (a: Pose, b: Pose, t: number): Pose => ({
  lean: mix(a.lean ?? 0, b.lean ?? 0, t),
  head: mix(a.head ?? 0, b.head ?? 0, t),
  armF: angles(a.armF, b.armF, t),
  armN: angles(a.armN, b.armN, t),
  legF: angles(a.legF, b.legF, t),
  legN: angles(a.legN, b.legN, t),
  sit: t < .5 ? a.sit : b.sit,
});

export const blink = (eyes: Eyes, t: number, offset = 0): Eyes =>
  eyes !== 'zombie' && (t + offset + .24 * Math.sin(t * .9)) % 4.18 < .10 ? 'closed' : eyes;

export const idlePose = (base: Pose, t: number, strength = 1): Pose => ({
  ...base,
  lean: (base.lean ?? 0) + Math.sin(t * 1.8) * 1.45 * strength,
  head: (base.head ?? 0) + Math.sin(t * 1.21 + .7) * 2.6 * strength,
});

export const runPose = (t: number): Pose => {
  const stride = Math.sin(t * 2 * Math.PI * 2.1);
  return {
    lean: 17,
    head: -7 + 3 * stride,
    armF: [-2 - 49 * stride, 59 - 44 * stride],
    armN: [2 + 49 * stride, 59 + 44 * stride],
    legF: [-35 * stride, -36 - 54 * stride],
    legN: [35 * stride, -36 + 54 * stride],
  };
};

export const climbPose = (base: Pose, t: number, rate: number): Pose => {
  const step = Math.sin(t * 2 * Math.PI * rate);
  return {
    ...base,
    lean: (base.lean ?? 0) + 3 * step,
    armF: [134 - 23 * step, 150 - 20 * step],
    armN: [134 + 23 * step, 150 + 20 * step],
    legF: [-16 + 17 * step, 3 - 25 * step],
    legN: [17 - 17 * step, 3 + 25 * step],
  };
};

export const shamblePose = (t: number): Pose => {
  const step = Math.sin(t * 2 * Math.PI * .67);
  return {
    ...POSES.zLimp,
    lean: 16 + 3 * step,
    head: 25 + 4 * step,
    legF: [-16 * step, -12 * step],
    legN: [19 * step, 14 * step],
  };
};

export type Speech = {open: boolean; accent: number};
