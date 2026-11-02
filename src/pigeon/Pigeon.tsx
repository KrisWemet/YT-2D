import React from 'react';
import {Img, staticFile} from 'remotion';
import {S} from './sprites';
import {HIP} from './gait';

const R = S.rig;
const [W, H] = R.size;
export const OX = 875; // rig origin: on the ground between the hips (sprite px)
export const OY = R.ground;
const HIPY = 1148;
const L1 = 110; // thigh
const L2 = 105; // shin
export const FOOT_Y = OY - 128; // foot junction height when standing
const INK = '#0b0b0b';
const IW = 10;

export type FootPose = {x: number; lift?: number; curl?: number; dy?: number};
export type Pose = {
  headDx?: number; headDy?: number; headRot?: number;
  near?: FootPose; far?: FootPose;
  blink?: number; look?: [number, number]; eyePop?: number; brow?: number; browTilt?: number;
  rot?: number; sx?: number; sy?: number;
};

const ik = (hx: number, hy: number, jx: number, jy: number) => {
  const vx = jx - hx, vy = jy - hy;
  let d = Math.hypot(vx, vy);
  d = Math.min(Math.max(d, Math.abs(L1 - L2) + 1), L1 + L2 - 0.5);
  const a = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const th = Math.atan2(vy, vx);
  const k1 = [hx + L1 * Math.cos(th + a), hy + L1 * Math.sin(th + a)];
  const k2 = [hx + L1 * Math.cos(th - a), hy + L1 * Math.sin(th - a)];
  return k1[0] < k2[0] ? k1 : k2; // knee (bird ankle) points backward
};

const TOES: Array<[number, number, number]> = [ // dx, dy, width
  [-88, 22, 34],
  [128, 38, 38],
  [74, 100, 38],
];

const Leg: React.FC<{which: 'near' | 'far'; f: FootPose}> = ({which, f}) => {
  const hx = OX + HIP[which];
  const jx = OX + f.x;
  const jy = FOOT_Y - (f.lift ?? 0) + (f.dy ?? 0);
  const [kx, ky] = ik(hx, HIPY, jx, jy);
  const c = ((f.curl ?? 0) * Math.PI) / 180;
  const toes = TOES.map(([dx, dy, w]) => ({x: jx + dx * Math.cos(c) - dy * Math.sin(c), y: jy + dx * Math.sin(c) + dy * Math.cos(c), w}));
  const far = which === 'far';
  const grey = far ? '#71839e' : R.bodyFill;
  const pink = far ? '#c75b5e' : R.pink;
  const seg = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y2}`;
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* ink first, then fills: one merged outline */}
      <path d={seg(hx, HIPY, kx, ky)} stroke={INK} strokeWidth={62 + 2 * IW} />
      <path d={seg(kx, ky, jx, jy)} stroke={INK} strokeWidth={42 + 2 * IW} />
      {toes.map((t, i) => <path key={i} d={seg(jx, jy, t.x, t.y)} stroke={INK} strokeWidth={t.w + 2 * IW} />)}
      <path d={seg(kx, ky, jx, jy)} stroke={pink} strokeWidth={42} />
      {toes.map((t, i) => <path key={i} d={seg(jx, jy, t.x, t.y)} stroke={pink} strokeWidth={t.w} />)}
      <path d={seg(hx, HIPY, kx, ky)} stroke={grey} strokeWidth={62} />
    </g>
  );
};

const NS = 8; // neck strips
const prof = (t: number) => 0.6 * t + 0.4 * (0.5 - 0.5 * Math.cos(Math.PI * t));

const Neck: React.FC<{dx: number; dy: number}> = ({dx, dy}) => {
  const {yTop, yBot} = R;
  const np = R.pieces.neck;
  const off = (y: number) => {
    const t = (yBot - y) / (yBot - yTop);
    return [dx * prof(t), dy * t];
  };
  const strips = [];
  for (let j = 0; j < NS; j++) {
    const yt = yTop + ((yBot - yTop) * j) / NS;
    const yb = yTop + ((yBot - yTop) * (j + 1)) / NS;
    const hs = yb - yt;
    const Y0 = yt - 1.5;
    const [oxt, oyt] = off(yt);
    const [oxb, oyb] = off(yb);
    const B = -(oxt - oxb) / hs;
    const A = oxb + ((oxt - oxb) * (yb - Y0)) / hs;
    const d = 1 - (oyt - oyb) / hs;
    const F = oyb + ((oyt - oyb) * (yb - Y0)) / hs;
    strips.push(
      <div key={j} style={{position: 'absolute', left: 0, top: Y0, width: W, height: hs + 3, overflow: 'hidden', transformOrigin: '0 0', transform: `matrix(1, 0, ${B}, ${d}, ${A}, ${F})`}}>
        <Img src={staticFile(np.file)} style={{position: 'absolute', left: 0, top: np.y0 - Y0, width: np.w, height: np.h, maxWidth: 'none'}} />
      </div>,
    );
  }
  return <>{strips}</>;
};

export const Eye: React.FC<{e: typeof S.rig.eye | typeof S.p_close.eye; fill: string; ring: number; blink?: number; look?: [number, number]; pop?: number; id: string}> = ({e, fill, ring, blink = 0, look = [0, 0], pop = 1, id}) => {
  const {cx, cy, rx, ry, angle} = e;
  const pr = e.pupil.r;
  const pdx = e.pupil.cx - cx + look[0];
  const pdy = e.pupil.cy - cy + look[1];
  const gdx = e.glint.cx - cx + look[0] * 0.8;
  const gdy = e.glint.cy - cy + look[1] * 0.8;
  const b = Math.min(1, Math.max(0, blink));
  const top = -ry - 4;
  const lidY = top + b * (2 * ry + 8);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${pop})`}>
      <defs>
        <clipPath id={`${id}-o`}><ellipse rx={rx} ry={ry} transform={`rotate(${angle})`} /></clipPath>
        <clipPath id={`${id}-i`}><ellipse rx={rx - ring} ry={ry - ring} transform={`rotate(${angle})`} /></clipPath>
      </defs>
      <ellipse rx={rx} ry={ry} transform={`rotate(${angle})`} fill={INK} />
      <ellipse rx={rx - ring} ry={ry - ring} transform={`rotate(${angle})`} fill={(e as {iris?: string}).iris ?? '#fa9e3a'} />
      <g clipPath={`url(#${id}-i)`}>
        <circle cx={pdx} cy={pdy} r={pr} fill={INK} />
      </g>
      <circle cx={gdx} cy={gdy} r={e.glint.r} fill="#ffffff" />
      {b > 0.01 && (
        <g clipPath={`url(#${id}-o)`}>
          <rect x={-rx - 10} y={top - 10} width={2 * rx + 20} height={lidY - top + 10} fill={fill} />
          {b < 0.97 ? (
            <line x1={-rx - 10} y1={lidY} x2={rx + 10} y2={lidY} stroke={INK} strokeWidth={ring * 1.1} />
          ) : (
            <path d={`M${-rx * 0.85} ${ry * 0.05} Q0 ${ry * 0.45} ${rx * 0.85} ${ry * 0.05}`} stroke={INK} strokeWidth={ring * 1.1} fill="none" strokeLinecap="round" />
          )}
        </g>
      )}
      {b > 0.01 && <ellipse rx={rx - ring / 2} ry={ry - ring / 2} transform={`rotate(${angle})`} fill="none" stroke={INK} strokeWidth={ring} />}
    </g>
  );
};

export const Brow: React.FC<{b: {p0: readonly number[]; c: readonly number[]; p2: readonly number[]; width: number}; raise?: number; tilt?: number}> = ({b, raise = 0, tilt = 0}) => {
  const mx = (b.p0[0] + b.p2[0]) / 2;
  const my = (b.p0[1] + b.p2[1]) / 2;
  return (
    <path
      d={`M${b.p0[0]} ${b.p0[1]}Q${b.c[0]} ${b.c[1]} ${b.p2[0]} ${b.p2[1]}`}
      transform={`translate(0 ${-raise}) rotate(${tilt} ${mx} ${my})`}
      stroke={INK} strokeWidth={b.width + 1} fill="none" strokeLinecap="round"
    />
  );
};

/** The rig, drawn in sprite px with its origin (OX, OY) at the parent's origin. */
export const PigeonRig: React.FC<{pose: Pose; id: string}> = ({pose, id}) => {
  const dx = pose.headDx ?? 0;
  const dy = pose.headDy ?? 0;
  const near = pose.near ?? {x: 50};
  const far = pose.far ?? {x: -50};
  const hp = R.pieces.head;
  const bp = R.pieces.body;
  const hr = pose.headRot ?? 0;
  const e = R.eye;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `rotate(${pose.rot ?? 0}deg) scale(${pose.sx ?? 1}, ${pose.sy ?? 1})`}}>
      <div style={{position: 'absolute', left: -OX, top: -OY, width: W, height: H}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Leg which="far" f={far} />
          <Leg which="near" f={near} />
        </svg>
        <Img src={staticFile(bp.file)} style={{position: 'absolute', left: 0, top: bp.y0, width: bp.w, height: bp.h, maxWidth: 'none'}} />
        <Neck dx={dx} dy={dy} />
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${R.eye.cx}px ${R.yTop}px`, transform: `translate(${dx}px, ${dy}px) rotate(${hr}deg)`}}>
          <Img src={staticFile(hp.file)} style={{position: 'absolute', left: 0, top: hp.y0, width: hp.w, height: hp.h, maxWidth: 'none'}} />
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <Eye e={e} fill={R.headFill} ring={e.ring} blink={pose.blink} look={pose.look} pop={pose.eyePop} id={`${id}-eye`} />
            <Brow b={R.eyebrow} raise={pose.brow} tilt={pose.browTilt} />
          </svg>
        </div>
      </div>
    </div>
  );
};
