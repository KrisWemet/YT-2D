import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {H} from './sprites';
import {T} from './timing';
import {clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, inv, lerp, pop, shake, spring} from '../pigeon/lib';
import {Layer, Pic, Pos, toScreen} from '../pigeon/world';
import {Flash, INK, SweatDrop} from '../pigeon/fx';

type Cam = {x: number; y: number; z: number};
const IW = 4.5;

// ---------------------------------------------------------------- world
const YG = 1800; // scientist's feet on the beach (depth 1000)
const GX = 330;
const HEADR = 170; // scientist head radius in world px
const HUR = {x: 780, y: -960, z: 4000, R: 1880, squash: 0.6};
const HS = HUR.R / H.hurricane.R; // hurricane sprite scale

// camera: [t, x, y, z] keys, eased per segment
const CAM: Array<[number, number, number, number]> = [
  [0, 540, 960, 0],
  [2.3, 546, 958, 8],
  [3.55, 546, 958, 8],
  [4.78, 780, -930, 1450],
  [9.9, 780, -990, 1650],
  [11.2, 600, 880, -180],
  [13.3, 570, 900, -200],
  [16.6, 330, 980, -330],
  [17.5, 340, 1060, -120],
  [19.3, 380, 1120, 160],
  [20.55, 540, 960, 0],
];
const camAt = (t: number): Cam => {
  if (t <= CAM[0][0]) return {x: CAM[0][1], y: CAM[0][2], z: CAM[0][3]};
  for (let i = 1; i < CAM.length; i++) {
    if (t <= CAM[i][0]) {
      const [t0, x0, y0, z0] = CAM[i - 1];
      const [t1, x1, y1, z1] = CAM[i];
      const u = easeInOutCubic((t - t0) / (t1 - t0));
      return {x: lerp(x0, x1, u), y: lerp(y0, y1, u), z: lerp(z0, z1, u)};
    }
  }
  const l = CAM[CAM.length - 1];
  return {x: l[1], y: l[2], z: l[3]};
};
const BOOMS: Array<[number, number, number]> = [[T.boom, 16, 0.2], [9.12, 5, 0.1], [9.38, 5, 0.1], [9.62, 5, 0.1], [9.86, 5, 0.1]];
const withShake = (c: Cam, t: number): Cam => {
  let a = 0;
  for (const [at, amp, tau] of BOOMS) if (t >= at) a += amp * Math.exp(-(t - at) / tau);
  if (a < 0.05) return c;
  const s = shake(t, a);
  return {...c, x: c.x + s.x, y: c.y + s.y};
};

// ---------------------------------------------------------------- scientist
type GName = 'g_bomb_hold' | 'g_windup' | 'g_throw' | 'g_scared';
const gScale = (n: GName) => HEADR / H[n].head[2];
const breath = (t: number) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
const guyState = (t: number) => {
  let name: GName = 'g_bomb_hold';
  let sy = 1;
  let rot = 0;
  const squashIn = (t0: number) => 1 - 0.06 * Math.sin((Math.PI / 2) * inv(t0 - 0.09, t0, t));
  const stretchOut = (t0: number) => 1 + 0.04 * (1 - spring(t - t0, 3.2, 0.3));
  if (t < T.because) {
    sy = t > T.because - 0.09 ? squashIn(T.because) : 1 + (t > T.nuke && t < T.nuke + 0.4 ? 0.03 * Math.sin(Math.PI * (t - T.nuke) / 0.4) : 0);
  } else if (t < T.stronger) {
    name = 'g_windup';
    sy = t > T.stronger - 0.09 ? squashIn(T.stronger) : stretchOut(T.because);
    rot = -3 * clamp((t - T.because) / 0.6);
  } else if (t < T.might) {
    name = 'g_throw';
    sy = t > T.might - 0.09 ? squashIn(T.might) : stretchOut(T.stronger);
    rot = 5 * (1 - spring(t - T.stronger, 2.2, 0.35)) - 0;
  } else if (t < T.another) {
    name = 'g_scared';
    sy = t > T.another - 0.09 ? squashIn(T.another) : stretchOut(T.might);
    rot = 0.8 * Math.sin(2 * Math.PI * 7 * t) * (t < 17.3 ? 0.5 : 1); // trembling
  } else {
    name = 'g_bomb_hold';
    sy = 1 + 0.05 * (1 - spring(t - T.another, 3, 0.3));
  }
  return {name, sy: sy * breath(t), rot};
};
const Guy: React.FC<{t: number; glow: number}> = ({t, glow}) => {
  const g = guyState(t);
  const p = H[g.name];
  const sc = gScale(g.name);
  return (
    <Pos x={GX} y={YG} s={sc} sx={2 - g.sy} sy={g.sy} rot={g.rot} style={{filter: glow > 0.01 ? `drop-shadow(0 0 ${30 * glow}px rgba(140,255,80,${0.95 * glow}))` : undefined}}>
      <Pic file={p.file} w={p.w} h={p.h} ax={p.feet[0]} ay={p.feet[1]} />
      {glow > 0.01 && (
        <div style={{position: 'absolute', left: -p.feet[0], top: -p.feet[1], width: p.w, height: p.h, background: `rgba(120,240,70,${0.35 * glow})`, mixBlendMode: 'multiply', WebkitMaskImage: `url(${staticFile(p.file)})`, maskImage: `url(${staticFile(p.file)})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}} />
      )}
    </Pos>
  );
};

// fuse sparks (world px, around a point)
const Sparks: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => {
  const n = 7;
  const items = [];
  for (let i = 0; i < n; i++) {
    const ph = (t * 9 + i / n) % 1;
    const a = (i / n) * Math.PI * 2 + Math.sin(i * 3.1) * 0.6;
    const d = 18 + 70 * ph;
    const r = 9 * (1 - ph) + 2;
    items.push(<circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d - 10 * ph} r={r} fill={i % 2 ? '#ffd23f' : '#ff8a2a'} />);
  }
  const star = 1 + 0.25 * Math.sin(t * 40);
  return (
    <svg width={260} height={260} viewBox="-130 -130 260 260" style={{position: 'absolute', left: x - 130, top: y - 130, overflow: 'visible', transform: `scale(${s})`}}>
      {items}
      <path d="M0 -38L9 -9L38 0L9 9L0 38L-9 9L-38 0L-9 -9Z" transform={`scale(${star}) rotate(${t * 300})`} fill="#fff6b0" stroke={INK} strokeWidth={IW} strokeLinejoin="round" />
    </svg>
  );
};

// ---------------------------------------------------------------- hurricane + face
type Mood = 'sleep' | 'open' | 'squeeze' | 'smug' | 'yawn' | 'laugh' | 'wide';
const moodAt = (t: number): Mood => {
  if (t < T.hurricane) return 'sleep';
  if (t < T.boom) return 'open';
  if (t < T.boom + 0.32) return 'squeeze';
  if (t > T.slow - 0.05 && t < T.slow + 0.75) return 'yawn';
  if (t > T.youd && t < T.l6End + 0.2) return 'laugh';
  if (t > T.another && t < T.another + 0.35) return 'wide';
  if (t >= T.another + 0.35) return 'sleep';
  return t > T.boom + 0.3 ? 'smug' : 'open';
};
const Face: React.FC<{t: number; look: [number, number]}> = ({t, look}) => {
  const m = moodAt(t);
  const R = HUR.R;
  const ex = R * 0.2, ey = -R * 0.2 * HUR.squash, er = R * 0.12;
  const popIn = t >= T.hurricane && t < T.hurricane + 0.3 ? easeOutBack(clamp((t - T.hurricane) / 0.3), 2.2) : 1;
  const eye = (sx: number) => {
    const cx = sx * ex;
    if (m === 'sleep') return <path key={sx} d={`M${cx - er} ${ey}Q${cx} ${ey + er * 0.8} ${cx + er} ${ey}`} fill="none" stroke={INK} strokeWidth={IW * 4} strokeLinecap="round" />;
    if (m === 'squeeze') return <path key={sx} d={`M${cx - sx * er} ${ey - er * 0.7}L${cx + sx * er * 0.6} ${ey}L${cx - sx * er} ${ey + er * 0.7}`} fill="none" stroke={INK} strokeWidth={IW * 4} strokeLinecap="round" strokeLinejoin="round" />;
    if (m === 'laugh' || m === 'yawn') return <path key={sx} d={`M${cx - er} ${ey + er * 0.3}Q${cx} ${ey - er * 0.9} ${cx + er} ${ey + er * 0.3}`} fill="none" stroke={INK} strokeWidth={IW * 4} strokeLinecap="round" />;
    const big = m === 'wide' ? 1.25 : 1;
    const lid = m === 'smug' ? 0.45 : 0;
    return (
      <g key={sx} transform={`translate(${cx} ${ey}) scale(${big * popIn})`}>
        <ellipse rx={er} ry={er * 1.15} fill="#fff" stroke={INK} strokeWidth={IW * 3} />
        <circle cx={look[0] * er * 0.42} cy={look[1] * er * 0.42} r={er * 0.5} fill={INK} />
        <circle cx={look[0] * er * 0.42 + er * 0.18} cy={look[1] * er * 0.42 - er * 0.2} r={er * 0.15} fill="#fff" />
        <defs><clipPath id={`hc${sx}`}><ellipse rx={er} ry={er * 1.15} /></clipPath></defs>
        {lid > 0 && (
          <g clipPath={`url(#hc${sx})`}>
            <rect x={-er * 1.2} y={-er * 1.3} width={er * 2.4} height={lid * 2.3 * er + er * 0.1} fill="#e4ebf2" />
            <line x1={-er * 1.2} y1={-er * 1.2 + lid * 2.3 * er} x2={er * 1.2} y2={-er * 1.2 + lid * 2.3 * er} stroke={INK} strokeWidth={IW * 3} />
          </g>
        )}
        {lid > 0 && <ellipse rx={er} ry={er * 1.15} fill="none" stroke={INK} strokeWidth={IW * 3} />}
      </g>
    );
  };
  const brow = (sx: number) => {
    const tilt = m === 'smug' ? -0.18 : m === 'wide' ? 0.12 : 0;
    const by = ey - er * (m === 'wide' ? 1.85 : 1.55);
    return <path key={`b${sx}`} d={`M${sx * ex - er} ${by + sx * tilt * er}Q${sx * ex} ${by - er * 0.35} ${sx * ex + er} ${by - sx * tilt * er}`} fill="none" stroke={INK} strokeWidth={IW * 4} strokeLinecap="round" />;
  };
  const my = R * 0.24 * HUR.squash;
  let mouth: React.ReactNode = null;
  if (m === 'smug') mouth = <path d={`M${-er * 0.9} ${my}Q${er * 0.2} ${my + er * 0.7} ${er * 1.2} ${my - er * 0.2}`} fill="none" stroke={INK} strokeWidth={IW * 4} strokeLinecap="round" />;
  if (m === 'yawn' || m === 'laugh') {
    const open = m === 'yawn' ? 0.8 + 0.2 * Math.sin((t - T.slow) * 6) : 0.55 + 0.15 * Math.abs(Math.sin(t * 14));
    mouth = (
      <g>
        <ellipse cx={0} cy={my} rx={er * 1.0} ry={er * open} fill="#5a2230" stroke={INK} strokeWidth={IW * 3.5} />
        <ellipse cx={0} cy={my + er * open * 0.45} rx={er * 0.55} ry={er * open * 0.4} fill="#ff7a8a" />
      </g>
    );
  }
  if (m === 'sleep') mouth = <path d={`M${-er * 0.4} ${my}Q0 ${my + er * 0.25} ${er * 0.4} ${my}`} fill="none" stroke={INK} strokeWidth={IW * 3.5} strokeLinecap="round" />;
  if (m === 'wide' || m === 'squeeze') mouth = <ellipse cx={0} cy={my} rx={er * 0.4} ry={er * 0.45} fill="#5a2230" stroke={INK} strokeWidth={IW * 3.5} />;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: HUR.x, top: HUR.y, overflow: 'visible'}}>
      <g>
        {[-1, 1].map(eye)}
        {m !== 'sleep' && m !== 'laugh' && m !== 'yawn' && [-1, 1].map(brow)}
        {mouth}
      </g>
    </svg>
  );
};

const Hurricane: React.FC<{t: number; glow: number; look: [number, number]}> = ({t, glow, look}) => {
  const h = H.hurricane;
  const spin = -14 * t; // counter-clockwise from above
  const breathe = 1 + 0.012 * Math.sin(2 * Math.PI * 0.45 * t) + (t > T.boom && t < T.boom + 0.6 ? 0.05 * Math.exp(-(t - T.boom) * 6) * Math.cos((t - T.boom) * 30) : 0);
  const yawnStretch = moodAt(t) === 'yawn' ? 1.04 : 1;
  return (
    <>
      <div style={{position: 'absolute', left: HUR.x - HUR.R * 1.5, top: HUR.y - HUR.R * 1.1, width: HUR.R * 3, height: HUR.R * 2.2, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(255,150,60,${0.5 * glow}), rgba(255,150,60,0))`}} />
      <div style={{position: 'absolute', left: HUR.x, top: HUR.y, width: 0, height: 0, transform: `scale(${breathe}, ${HUR.squash * breathe * yawnStretch})`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `rotate(${spin}deg) scale(${HS})`}}>
          <Img src={staticFile(h.file)} style={{position: 'absolute', left: -h.eye[0], top: -h.eye[1], width: h.w, height: h.h, maxWidth: 'none'}} />
        </div>
      </div>
      <Face t={t} look={look} />
    </>
  );
};

// explosion crown + smoke (world px around a point, life u 0..1)
const Boom: React.FC<{x: number; y: number; u: number; size: number}> = ({x, y, u, size}) => {
  if (u <= 0 || u >= 1) return null;
  const n = 9;
  const grow = easeOutCubic(clamp(u / 0.35));
  const shrink = u > 0.45 ? 1 - easeInCubic((u - 0.45) / 0.55) : 1;
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    const d = size * 0.55 * grow;
    puffs.push({x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, r: size * (0.3 + 0.08 * Math.sin(i * 2.7)) * shrink * grow});
  }
  const core = size * 0.5 * grow * shrink;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      {puffs.map((p, i) => <circle key={`k${i}`} cx={p.x} cy={p.y} r={p.r + IW * 3} fill={INK} />)}
      <circle r={core + IW * 3} fill={INK} />
      {puffs.map((p, i) => <circle key={`f${i}`} cx={p.x} cy={p.y} r={p.r} fill={i % 2 ? '#ff8a2a' : '#ffb13d'} />)}
      <circle r={core} fill="#ffd94a" />
      <circle r={core * 0.55} fill="#fff6c9" />
    </svg>
  );
};

// fallout cloud: green puffs with one merged outline
const Cloud: React.FC<{u: number; r: number; t: number}> = ({u, r, t}) => {
  if (u <= 0.001) return null;
  const puffs = [[-0.55, 0.1, 0.42], [-0.2, -0.25, 0.5], [0.25, -0.2, 0.46], [0.6, 0.12, 0.38], [0.05, 0.2, 0.5], [-0.35, 0.3, 0.34], [0.38, 0.32, 0.32]];
  const wob = (i: number) => 1 + 0.06 * Math.sin(t * 3 + i * 1.7);
  return (
    <g transform={`scale(${u})`}>
      <circle r={r * 1.5} fill="rgba(150,255,90,0.25)" />
      {puffs.map(([px, py, pr], i) => <circle key={`k${i}`} cx={px * r} cy={py * r} r={pr * r * wob(i) + IW * 2} fill={INK} />)}
      {puffs.map(([px, py, pr], i) => <circle key={`f${i}`} cx={px * r} cy={py * r} r={pr * r * wob(i)} fill={i % 2 ? '#9be35a' : '#b6f070'} />)}
      {[[-0.3, -0.1], [0.2, 0.05], [0.45, -0.15], [-0.05, 0.25]].map(([px, py], i) => (
        <circle key={`s${i}`} cx={px * r} cy={py * r} r={r * 0.05} fill="#6fbf2f" />
      ))}
    </g>
  );
};

// curved wind arrow (screen px)
const WindArrow: React.FC<{x: number; y: number; len: number; a: number}> = ({x, y, len, a}) => {
  if (a <= 0.01) return null;
  const d = `M${len / 2} 0C${len / 4} ${-40} ${-len / 4} 40 ${-len / 2 + 40} 0`;
  return (
    <svg width={len + 120} height={200} viewBox={`${-len / 2 - 60} -100 ${len + 120} 200`} style={{position: 'absolute', left: x - len / 2 - 60, top: y - 100, opacity: a, overflow: 'visible'}}>
      <path d={d} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <path d={`M${-len / 2 + 70} -38L${-len / 2 + 10} 2L${-len / 2 + 74} 40`} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" />
      <path d={`M${-len / 2 + 70} -38L${-len / 2 + 10} 2L${-len / 2 + 74} 40`} fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// clock (screen px): minute hand angle in degrees
const Clock: React.FC<{x: number; y: number; r: number; s: number; ang: number}> = ({x, y, r, s, ang}) => {
  if (s <= 0.001) return null;
  return (
    <svg width={r * 3} height={r * 3} viewBox={`${-r * 1.5} ${-r * 1.5} ${r * 3} ${r * 3}`} style={{position: 'absolute', left: x - r * 1.5, top: y - r * 1.5, overflow: 'visible'}}>
      <g transform={`scale(${s})`}>
        <path d={`M0 0L0 ${-r}A${r} ${r} 0 ${((ang % 360) + 360) % 360 > 180 ? 1 : 0} 1 ${r * Math.sin((ang * Math.PI) / 180)} ${-r * Math.cos((ang * Math.PI) / 180)}Z`} fill="#ffd27a" />
        <circle r={r} fill="none" stroke={INK} strokeWidth={10} />
        <circle r={r} fill="rgba(255,255,255,0.0)" />
        {Array.from({length: 12}, (_, i) => (
          <line key={i} x1={0} y1={-r * 0.82} x2={0} y2={-r * (i % 3 === 0 ? 0.66 : 0.74)} stroke={INK} strokeWidth={i % 3 === 0 ? 9 : 6} strokeLinecap="round" transform={`rotate(${i * 30})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-r * 0.45} stroke={INK} strokeWidth={12} strokeLinecap="round" transform="rotate(60)" />
        <line x1={0} y1={0} x2={0} y2={-r * 0.72} stroke="#e8452e" strokeWidth={10} strokeLinecap="round" transform={`rotate(${ang})`} />
        <circle r={12} fill={INK} />
      </g>
    </svg>
  );
};
const ClockFace: React.FC<{x: number; y: number; r: number; s: number; ang: number}> = (p) => (
  <>
    {p.s > 0.001 && (
      <div style={{position: 'absolute', left: p.x - p.r * p.s, top: p.y - p.r * p.s, width: 2 * p.r * p.s, height: 2 * p.r * p.s, borderRadius: '50%', background: '#ffffff', boxShadow: `6px 6px 0 ${INK}`}} />
    )}
    <Clock {...p} />
  </>
);

// small bomb icon (screen px)
const BombIcon: React.FC<{x: number; y: number; size: number; s: number; rot?: number; glow?: boolean}> = ({x, y, size, s, rot = 0, glow}) => {
  if (s <= 0.001) return null;
  const b = H.bomb;
  const sc = (size / b.body.r) * s;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `rotate(${rot}deg) scale(${sc})`, filter: glow ? 'drop-shadow(0 0 40px rgba(255,220,80,0.9))' : undefined}}>
      <Img src={staticFile(b.file)} style={{position: 'absolute', left: -b.body.cx, top: -b.body.cy, width: b.w, height: b.h, maxWidth: 'none'}} />
    </div>
  );
};

// ---------------------------------------------------------------- the shot
export const HurricaneScene: React.FC<{t: number}> = ({t}) => {
  const cam = withShake(camAt(t), t);
  // thrown bomb: 3D projectile from the drawn bomb in g_windup to the hurricane eye
  const sw = gScale('g_windup');
  const wb = H.g_windup.bomb;
  const b0 = {x: GX + (wb.cx - H.g_windup.feet[0]) * sw, y: YG + (wb.cy - H.g_windup.feet[1]) * sw, z: 1000};
  const b1 = {x: HUR.x - 120, y: HUR.y + 60, z: HUR.z};
  const TF = T.boom - T.stronger;
  const ta = 0.72 * TF;
  const g = (2 * (b0.y - b1.y)) / (ta * ta - (TF - ta) * (TF - ta));
  const ya = b0.y - 0.5 * g * ta * ta;
  const tau = t - T.stronger;
  const flying = tau >= 0 && tau < TF;
  const bz = lerp(b0.z, b1.z, clamp(tau / TF));
  const bx = lerp(b0.x, b1.x, clamp(tau / TF));
  const by = ya + 0.5 * g * (tau - ta) * (tau - ta);
  const bS = toScreen(cam, bz, bx, by);
  const bombR = wb.r * sw; // world radius stays constant; perspective shrinks it
  // scientist's head (scared pose) for the sweat drop
  const gsc = gScale('g_scared');
  const headX = GX + (H.g_scared.head[0] - H.g_scared.feet[0]) * gsc;
  const headY = YG + (H.g_scared.head[1] - H.g_scared.feet[1]) * gsc;
  // hurricane gaze
  const hS = toScreen(cam, HUR.z, HUR.x, HUR.y);
  const gS = toScreen(cam, 1000, GX + 120, YG - 900);
  let look: [number, number] = [0, 0];
  if (t > T.hurricane && t < T.boom) {
    const tx = flying ? bS.x : gS.x;
    const ty = flying ? bS.y : gS.y;
    const dx = tx - hS.x, dy = ty - hS.y;
    const L = Math.hypot(dx, dy) || 1;
    look = [dx / L, dy / L];
  } else if (t > T.boom + 0.3) look = [-0.7, 0.55];
  if (t > 14.6 && t < 17.3) look = [-1, 0.25];
  // heat glow (line 3)
  const heat = clamp((t - T.givesOff) / 0.5) * (1 - clamp((t - 10.0) / 0.5));
  // fallout cloud path: hurricane -> beach
  const fu = clamp((t - (T.radioactive - 0.1)) / (T.land + 0.1 - (T.radioactive - 0.1)));
  const fe = easeInOutCubic(fu);
  const cz = lerp(HUR.z - 200, 1250, fe);
  const cx = lerp(HUR.x - 900, GX - 60, fe);
  const cy = lerp(HUR.y + 700, YG - 430, fe) - 260 * Math.sin(Math.PI * fe);
  const cS = toScreen(cam, cz, cx, cy);
  const cloudGrow = pop(t, T.radioactive - 0.1, 99, 0.4) * (1 - clamp((t - 19.25) / 0.5));
  const cloudVisible = t > T.radioactive - 0.1 && t < 19.8;
  // green over the beach once the fallout arrives
  const green = clamp((t - (T.land - 0.2)) / 0.5) * (1 - clamp((t - 19.3) / 0.5));
  const glow = green;
  // line 3 graphics (screen px)
  const clockS = pop(t, T.every - 0.2, 10.0, 0.3);
  const sweep = (() => {
    // 20-minute sweep during "every twenty minutes", then 4 quick repeats in the pause
    if (t < T.every) return 0;
    if (t < 9.1) return 120 * easeInOutCubic((t - T.every) / (9.1 - T.every));
    const k = Math.min(4, Math.floor((t - 9.1) / 0.24));
    const u = ((t - 9.1) % 0.24) / 0.24;
    return 120 * (1 + k) + (k < 4 ? 120 * easeInOutCubic(u) : 0);
  })();
  const tallyTimes = [9.12, 9.38, 9.62, 9.86];
  const bigBombS = pop(t, T.megaton, 10.0, 0.35);
  // line 4: one more (the scientist's) bomb in the tally
  const tallyOut = 13.15;
  const smallBooms = tallyTimes.map((tt) => (t - tt) / 0.35);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #5f7f9e 0%, #8aa3ba 45%, #c4d3df 100%)'}} />
      {/* hurricane far over the sea */}
      <Layer cam={cam} z={HUR.z}>
        <Hurricane t={t} glow={heat} look={look} />
        {smallBooms.map((u, i) => <Boom key={i} x={HUR.x + [-300, 260, -120, 340][i]} y={HUR.y + [-120, 80, 160, -200][i]} u={u} size={520} />)}
        <Boom x={b1.x} y={b1.y} u={(t - T.boom) / 0.8} size={950} />
      </Layer>
      {/* ocean */}
      <Layer cam={cam} z={3000}>
        <div style={{position: 'absolute', left: -9000, top: 300, width: 20000, height: 6000, background: '#3f86a8', borderTop: `7px solid ${INK}`}} />
        {Array.from({length: 46}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: -9000 + i * 430 + 60 * Math.sin(t * 0.8 + i), top: 400 + (i % 3) * 110, width: 160, height: 14, borderRadius: 7, background: '#7cbcd6'}} />
        ))}
      </Layer>
      <Layer cam={cam} z={2000}>
        <div style={{position: 'absolute', left: -9000, top: 840, width: 20000, height: 6000, background: '#357b9c'}} />
        {Array.from({length: 40}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: -9000 + i * 520 + 80 * Math.sin(t * 1.1 + i * 2), top: 910 + (i % 2) * 120, width: 200, height: 16, borderRadius: 8, background: '#6fb1cc'}} />
        ))}
      </Layer>
      {/* land: sand spit with houses (left) */}
      <Layer cam={cam} z={1600}>
        <div style={{position: 'absolute', left: -7000, top: 1104, width: 7020, height: 3000, background: '#efd398', borderTop: `6px solid ${INK}`, borderTopRightRadius: 260}} />
        <Pos x={-1250} y={1110} s={0.52}>
          <Pic file={H.houses.file} w={H.houses.w} h={H.houses.h} ax={0} ay={H.houses.base} />
        </Pos>
      </Layer>
      {/* fallout cloud (behind the scientist) */}
      {cloudVisible && (
        <svg width={10} height={10} style={{position: 'absolute', left: cS.x, top: cS.y, overflow: 'visible'}}>
          <Cloud u={cloudGrow} r={520 * cS.k} t={t} />
        </svg>
      )}
      {/* near beach */}
      <Layer cam={cam} z={1000}>
        <div style={{position: 'absolute', left: -6000, top: 1250, width: 13000, height: 4000, background: '#f1d49b', borderTop: `6px solid ${INK}`}} />
        <div style={{position: 'absolute', left: -6000, top: 1256, width: 13000, height: 34, background: '#e3bd7d'}} />
        {Array.from({length: 26}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: -6000 + i * 520, top: 1222 + 6 * Math.sin(t * 2 + i), width: 260, height: 36, borderRadius: '0 0 130px 130px', background: '#ffffff', border: `5px solid ${INK}`, borderTop: 'none'}} />
        ))}
        {[[120, 1700], [760, 1650], [900, 1840], [-200, 1760]].map(([x, y], i) => (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: 26, height: 16, borderRadius: '50%', background: '#d9b06a'}} />
        ))}
        <div style={{position: 'absolute', left: GX - 300, top: YG - 30, width: 600, height: 60, borderRadius: '50%', background: 'rgba(90,60,30,0.22)', filter: 'blur(5px)'}} />
        <Guy t={t} glow={glow} />
        {t < T.because && <Sparks x={GX + (H.g_bomb_hold.fuse[0] - H.g_bomb_hold.feet[0]) * gScale('g_bomb_hold')} y={YG + (H.g_bomb_hold.fuse[1] - H.g_bomb_hold.feet[1]) * gScale('g_bomb_hold')} t={t} s={t < T.nuke ? 0.55 : 1} />}
        {t > T.another && <Sparks x={GX + (H.g_bomb_hold.fuse[0] - H.g_bomb_hold.feet[0]) * gScale('g_bomb_hold')} y={YG + (H.g_bomb_hold.fuse[1] - H.g_bomb_hold.feet[1]) * gScale('g_bomb_hold')} t={t} s={0.55 * pop(t, T.another + 0.1, 99, 0.3)} />}
        <SweatDrop x={headX - HEADR * 0.78} y={headY - HEADR * 0.45 + 0.6 * HEADR * clamp((t - 17.6) / 1.2)} s={pop(t, 17.55, 19.4)} r={24} rot={-12} />
        <div style={{position: 'absolute', left: -6000, top: -3000, width: 13000, height: 9000, background: `rgba(120,230,70,${0.18 * green})`, mixBlendMode: 'multiply'}} />
      </Layer>
      {/* thrown bomb (depth changes every frame -> placed in screen space) */}
      {flying && (
        <div style={{position: 'absolute', left: bS.x, top: bS.y, width: 0, height: 0, transform: `rotate(${360 * (tau / TF) * 1.1}deg) scale(${(bombR / H.bomb.body.r) * bS.k})`}}>
          <Img src={staticFile(H.bomb.file)} style={{position: 'absolute', left: -H.bomb.body.cx, top: -H.bomb.body.cy, width: H.bomb.w, height: H.bomb.h, maxWidth: 'none'}} />
        </div>
      )}
      {/* trade winds */}
      {[0, 1, 2].map((i) => {
        const t0 = T.tradeWinds - 0.1 + i * 0.18;
        const u = clamp((t - t0) / 2.4);
        const a = clamp((t - t0) / 0.25) * (1 - clamp((t - 16.9 - i * 0.1) / 0.3));
        return <WindArrow key={i} x={980 - 520 * easeOutCubic(u) - i * 60} y={420 + i * 230} len={340 - i * 40} a={a} />;
      })}
      {/* line 3: heat, the 10-megaton bomb and the 20-minute clock */}
      <BombIcon x={290} y={1430} size={170} s={bigBombS} rot={-8 + 4 * Math.sin(t * 3)} glow={t > T.every && t < 10} />
      <ClockFace x={790} y={1420} r={150} s={clockS} ang={sweep} />
      {tallyTimes.map((tt, i) => (
        <BombIcon key={i} x={260 + i * 150} y={300} size={52} s={pop(t, tt, tallyOut, 0.25)} rot={-10 + 5 * i} />
      ))}
      <BombIcon x={260 + 4 * 150} y={300} size={30} s={pop(t, T.oneMore, tallyOut, 0.3)} rot={12} glow={t > T.oneMore && t < T.might} />
      <Flash a={t > T.boom ? Math.max(0, 1 - (t - T.boom) / 0.3) * 0.75 : 0} />
    </AbsoluteFill>
  );
};
