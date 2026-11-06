import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import {Txt} from './Overlays';
import {HEAD_R, Look, Pose, POSES, skeleton, Stick} from './Stick';
import {World} from './World';

/*
 * Design sheet: four takes on Marcus as a stick figure, each alive and as a zombie (the zombie in
 * his uniform has to read as Marcus at a glance). A, B and D are new drawing styles built on the
 * same skeleton and poses as <Stick>, so whichever is picked can animate the existing shots.
 *   A  Classic stick: ink lines and a round head.
 *   B  Chunky cartoon: thick limbs, a big head, big eyes.
 *   C  The current figures, with Marcus redesigned.
 *   D  Shadow: dark silhouettes with a rim of light and glowing details.
 * Marcus's anchors in every version: a big build, a hi-vis garage vest, and his radio clipped on
 * upside down ("He always wore it upside down").
 */

type V2 = [number, number];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V2, k: number): V2 => [a[0] * k, a[1] * k];
const unit = (a: V2): V2 => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const lerp = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pts = (...p: V2[]) => p.map((q) => q.join(',')).join(' ');
// a pill from a to b with radius r, as a path
const capsule = (a: V2, b: V2, r: number) => {
  const d = unit(sub(b, a));
  const n: V2 = [-d[1], d[0]];
  const a1 = add(a, mul(n, r));
  const b1 = add(b, mul(n, r));
  const b2 = add(b, mul(n, -r));
  const a2 = add(a, mul(n, -r));
  return `M ${a1} L ${b1} A ${r} ${r} 0 0 1 ${b2} L ${a2} A ${r} ${r} 0 0 1 ${a1} Z`;
};

const INK = '#1d1a1a';
const NAVY = '#33497d';
const NAVY_D = '#1f2a46';
const CAP = '#25365e';
const SKIN = '#8d5b3e';
const SKIN_Z = '#8e9b78';
const VEST = '#d2ec36';
const VEST_Z = '#a9b648';
const HAIR = '#161212';

type FigProps = {x: number; y: number; h: number; face?: 1 | -1; pose: Pose; zombie?: boolean};

// The radio, upside down: antenna pointing down, the screen light near the bottom.
const Radio: React.FC<{at: V2; rot: number; k?: number; glow?: boolean}> = ({at, rot, k = 1, glow}) => (
  <g transform={`translate(${at[0]},${at[1]}) rotate(${rot + 180}) scale(${k})`}>
    <line x1={3.5} y1={-7} x2={3.5} y2={-20} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
    <rect x={-6} y={-8} width={13} height={19} rx={2.6} fill="#262629" stroke={INK} strokeWidth={2.4} />
    <rect x={-2.5} y={-4.5} width={7} height={4.5} fill="#8fd18a" filter={glow ? 'url(#mvGlow)' : undefined} />
  </g>
);

// ---------------- A: classic stick ----------------
const ClassicFig: React.FC<FigProps> = ({x, y, h, face = 1, pose, zombie}) => {
  const k = skeleton(pose);
  const s = h / 300;
  const W = 9;
  const perp: V2 = [-k.dir[1], k.dir[0]];
  const hr = HEAD_R * 1.18;
  const hc = add(k.neck, mul(unit(sub(k.headC, k.neck)), hr + 4));
  const line = (key: string, ...p: V2[]) => <polyline key={key} points={pts(...p)} fill="none" stroke={INK} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />;
  const vt = lerp(k.neck, k.hip, 0.1);
  const vb = lerp(k.neck, k.hip, 0.82);
  const st = lerp(k.neck, k.hip, 0.6);
  return (
    <g transform={`translate(${x},${y}) scale(${s * face},${s})`}>
      <ellipse cx={0} cy={3} rx={40} ry={7} fill="#000" opacity={0.25} />
      {line('lf', k.hip, k.kneeF, k.footF)}
      {line('af', k.shoulder, k.elbowF, k.handF)}
      {line('t', k.neck, k.hip)}
      {/* the hi-vis vest, a simple shape on the body line */}
      <polygon points={pts(add(vt, mul(perp, -15)), add(vt, mul(perp, 15)), add(vb, mul(perp, 13)), add(vb, mul(perp, -13)))} fill={zombie ? VEST_Z : VEST} stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      <line x1={add(st, mul(perp, -14))[0]} y1={add(st, mul(perp, -14))[1]} x2={add(st, mul(perp, 14))[0]} y2={add(st, mul(perp, 14))[1]} stroke="#eef2f4" strokeWidth={4.5} />
      <Radio at={add(lerp(k.neck, k.hip, 0.3), mul(perp, 6))} rot={k.lean} k={0.9} />
      {line('ln', k.hip, k.kneeN, k.footN)}
      {line('an', k.shoulder, k.elbowN, k.handN)}
      <g transform={`translate(${hc[0]},${hc[1]}) rotate(${pose.head ?? 0})`}>
        <circle r={hr} fill={zombie ? SKIN_Z : SKIN} stroke={INK} strokeWidth={6} />
        {/* cap on backwards */}
        <path d={`M ${-hr - 1} ${-hr * 0.12} Q ${-hr * 0.95} ${-hr * 1.22} ${hr * 0.05} ${-hr * 1.18} Q ${hr * 0.95} ${-hr * 1.14} ${hr + 1} ${-hr * 0.2} Z`} fill={zombie ? '#202c4c' : CAP} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M ${-hr * 0.5} ${-hr * 0.24} Q ${-hr * 1.25} ${-hr * 0.3} ${-hr * 1.78} ${-hr * 0.08} Q ${-hr * 1.5} ${-hr * 0.5} ${-hr * 0.6} ${-hr * 0.54} Z`} fill="#18243f" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {zombie ? (
          <g>
            <circle cx={hr * 0.14} cy={-hr * 0.02} r={7} fill="#3d4535" opacity={0.7} />
            <circle cx={hr * 0.58} cy={-hr * 0.02} r={7} fill="#3d4535" opacity={0.7} />
            <circle cx={hr * 0.16} cy={0} r={2.2} fill="#e6ead0" />
            <circle cx={hr * 0.6} cy={0} r={2.2} fill="#e6ead0" />
            <path d={`M ${hr * 0.26} ${hr * 0.36} L ${hr * 0.76} ${hr * 0.3} L ${hr * 0.7} ${hr * 0.56} L ${hr * 0.32} ${hr * 0.58} Z`} fill="#3a2424" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          </g>
        ) : (
          <g>
            <ellipse cx={hr * 0.14} cy={-hr * 0.04} rx={3.6} ry={4.6} fill={INK} />
            <ellipse cx={hr * 0.58} cy={-hr * 0.04} rx={3.6} ry={4.6} fill={INK} />
            <path d={`M ${hr * 0.22} ${hr * 0.36} Q ${hr * 0.5} ${hr * 0.64} ${hr * 0.8} ${hr * 0.3}`} stroke={INK} strokeWidth={3.4} fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
};

// ---------------- B: chunky cartoon ----------------
const ToonFig: React.FC<FigProps & {id: string}> = ({x, y, h, face = 1, pose, zombie, id}) => {
  const k = skeleton(pose);
  const s = h / 300;
  const perp: V2 = [-k.dir[1], k.dir[0]];
  const skin = zombie ? SKIN_Z : SKIN;
  const hr = HEAD_R * 1.62;
  const hc = add(k.neck, mul(unit(sub(k.headC, k.neck)), hr - 4));
  const tA = add(k.neck, mul(k.dir, -2));
  const tB = add(k.hip, mul(k.dir, 12));
  const RT = 33;
  const limb = (key: string, p: V2[], w: number, c: string) => (
    <g key={key}>
      <polyline points={pts(...p)} fill="none" stroke={INK} strokeWidth={w + 9} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts(...p)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  const shoe = (foot: V2, far: boolean) => <ellipse cx={foot[0] + 8} cy={foot[1] - 4} rx={18} ry={10} fill={far ? '#151517' : '#1d1d20'} stroke={INK} strokeWidth={4.5} />;
  const arm = (e: V2, hd: V2, far: boolean) => (
    <g>
      {limb('u', [k.shoulder, e], 24, far ? '#2a3d6a' : NAVY)}
      {limb('f', [e, hd], 20, far ? '#7d5038' : skin)}
      <circle cx={hd[0]} cy={hd[1]} r={12.5} fill={skin} stroke={INK} strokeWidth={4.5} />
    </g>
  );
  const stripe = (t: number) => {
    const p = lerp(tA, tB, t);
    const a = add(p, mul(perp, -RT - 4));
    const b = add(p, mul(perp, RT + 4));
    return (
      <g key={t}>
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={11} />
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#e8eef1" strokeWidth={6.5} />
      </g>
    );
  };
  const vee = [add(tA, mul(perp, -15)), add(tA, mul(perp, 15)), add(tA, mul(k.dir, -34))] as V2[];
  return (
    <g transform={`translate(${x},${y}) scale(${s * face},${s})`}>
      <defs>
        <clipPath id={id}>
          <path d={capsule(tA, tB, RT)} />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={3} rx={50} ry={9} fill="#000" opacity={0.28} />
      {limb('lf', [k.hip, k.kneeF, k.footF], 28, '#18213a')}
      {shoe(k.footF, true)}
      {arm(k.elbowF, k.handF, true)}
      {/* body: the vest over the navy shirt */}
      <path d={capsule(tA, tB, RT)} fill={zombie ? VEST_Z : VEST} stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#${id})`}>
        <polygon points={pts(...vee)} fill={NAVY} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {stripe(0.56)}
        {stripe(0.8)}
        {zombie && [-18, 2, 20].map((o, i) => <polygon key={i} points={pts(add(add(tB, mul(perp, o - 8)), mul(k.dir, -RT - 2)), add(add(tB, mul(perp, o + 8)), mul(k.dir, -RT - 2)), add(add(tB, mul(perp, o)), mul(k.dir, -RT + 16)))} fill={NAVY_D} stroke={INK} strokeWidth={3} />)}
        <path d={`M ${add(tA, mul(perp, -RT))} L ${add(tB, mul(perp, -RT))} L ${add(tB, mul(perp, -RT * 0.25))} L ${add(tA, mul(perp, -RT * 0.25))} Z`} fill="#000" opacity={0.1} />
      </g>
      <Radio at={add(lerp(tA, tB, 0.3), mul(perp, 14))} rot={k.lean} k={1.25} />
      {limb('ln', [k.hip, k.kneeN, k.footN], 28, NAVY_D)}
      {shoe(k.footN, false)}
      <g transform={`translate(${hc[0]},${hc[1]}) rotate(${pose.head ?? 0})`}>
        <circle r={hr} fill={skin} stroke={INK} strokeWidth={6} />
        <path d={`M ${-hr * 0.3} ${-hr * 0.95} A ${hr} ${hr} 0 0 0 ${-hr * 0.3} ${hr * 0.95} A ${hr * 1.2} ${hr * 1.2} 0 0 1 ${-hr * 0.3} ${-hr * 0.95} Z`} fill="#000" opacity={0.08} />
        {/* beanie with a folded band */}
        <path d={`M ${-hr * 1.03} ${-hr * 0.16} Q ${-hr * 1.02} ${-hr * 1.36} ${hr * 0.05} ${-hr * 1.32} Q ${hr * 1.06} ${-hr * 1.27} ${hr * 1.03} ${-hr * 0.24} Z`} fill={zombie ? '#26324f' : '#2c3c6a'} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M ${-hr * 1.06} ${-hr * 0.12} Q 0 ${-hr * 0.34} ${hr * 1.06} ${-hr * 0.2} L ${hr * 1.04} ${-hr * 0.48} Q 0 ${-hr * 0.64} ${-hr * 1.04} ${-hr * 0.42} Z`} fill={zombie ? '#1c2640' : '#22305a'} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {zombie ? (
          <g>
            {[hr * 0.1, hr * 0.56].map((ex, i) => (
              <g key={i}>
                <ellipse cx={ex} cy={hr * 0.05} rx={12} ry={13} fill="#3d4535" opacity={0.45} />
                <ellipse cx={ex} cy={hr * 0.02} rx={9} ry={10.5} fill="#e6ead0" stroke={INK} strokeWidth={3} />
                <path d={`M ${ex - 9.5} ${hr * 0.02 - 3} Q ${ex} ${hr * 0.02 - 1} ${ex + 9.5} ${hr * 0.02 - 3} L ${ex + 9} ${hr * 0.02 - 9} Q ${ex} ${hr * 0.02 - 15} ${ex - 9} ${hr * 0.02 - 9} Z`} fill={skin} stroke={INK} strokeWidth={3} />
                <circle cx={ex + 1.5} cy={hr * 0.02 + 3} r={2.4} fill={INK} />
              </g>
            ))}
            <ellipse cx={hr * 0.5} cy={hr * 0.5} rx={13} ry={9} fill="#3a2424" stroke={INK} strokeWidth={3.4} />
            <path d={`M ${hr * 0.5 - 9} ${hr * 0.5 - 6} l 4 5 l 4 -5 l 4 5 l 4 -5`} stroke="#d9d4bc" strokeWidth={2.4} fill="none" />
          </g>
        ) : (
          <g>
            {[hr * 0.1, hr * 0.56].map((ex, i) => (
              <g key={i}>
                <ellipse cx={ex} cy={hr * 0.02} rx={9} ry={11} fill="#fff" stroke={INK} strokeWidth={3} />
                <circle cx={ex + 3} cy={hr * 0.04} r={4.8} fill={INK} />
                <circle cx={ex + 4.6} cy={hr * 0.04 - 1.8} r={1.6} fill="#fff" />
                <path d={`M ${ex - 9} ${-hr * 0.3} Q ${ex} ${-hr * 0.38} ${ex + 9} ${-hr * 0.31}`} stroke={HAIR} strokeWidth={5} fill="none" strokeLinecap="round" />
              </g>
            ))}
            <path d={`M ${hr * 0.2} ${hr * 0.38} Q ${hr * 0.52} ${hr * 0.72} ${hr * 0.84} ${hr * 0.32} Z`} fill="#4a2a2a" stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
            <path d={`M ${hr * 0.28} ${hr * 0.42} Q ${hr * 0.52} ${hr * 0.5} ${hr * 0.76} ${hr * 0.38}`} stroke="#fff" strokeWidth={4} fill="none" />
            <ellipse cx={hr * 0.52} cy={hr * 0.74} rx={7} ry={4.5} fill={HAIR} />
          </g>
        )}
      </g>
      {arm(k.elbowN, k.handN, false)}
    </g>
  );
};

// ---------------- D: shadow ----------------
const NoirShape: React.FC<{k: ReturnType<typeof skeleton>; color: string; zombie?: boolean}> = ({k, color, zombie}) => {
  const hr = HEAD_R * 1.05;
  const hc = add(k.neck, mul(unit(sub(k.headC, k.neck)), hr + 5));
  const tA = add(k.neck, mul(k.dir, -3));
  const tB = add(k.hip, mul(k.dir, 8));
  const l = (p: V2[], w: number) => <polyline points={pts(...p)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <g>
      {l([k.hip, k.kneeF, k.footF], 21)}
      {l([k.shoulder, k.elbowF, k.handF], 17)}
      <path d={capsule(tA, tB, 29)} fill={color} />
      {l([k.hip, k.kneeN, k.footN], 21)}
      {l([k.shoulder, k.elbowN, k.handN], 17)}
      <ellipse cx={k.footF[0] + 8} cy={k.footF[1] - 3} rx={15} ry={7} fill={color} />
      <ellipse cx={k.footN[0] + 8} cy={k.footN[1] - 3} rx={15} ry={7} fill={color} />
      <g transform={`translate(${hc[0]},${hc[1]}) rotate(${(k.lean ?? 0) * 0.5})`}>
        <circle r={hr} fill={color} />
        {/* cap with the brim forward */}
        <path d={`M ${-hr - 1} ${-hr * 0.15} Q ${-hr} ${-hr * 1.25} ${hr * 0.05} ${-hr * 1.2} Q ${hr} ${-hr * 1.18} ${hr + 1} ${-hr * 0.2} Z`} fill={color} />
        <path d={`M ${hr * 0.3} ${-hr * 0.32} Q ${hr * 1.2} ${-hr * 0.5} ${hr * 1.62} ${-hr * 0.22} Q ${hr * 1.1} ${-hr * 0.12} ${hr * 0.4} ${-hr * 0.14} Z`} fill={color} />
        {zombie && <path d={`M ${-hr * 0.2} ${hr * 0.9} l 6 10 l 5 -8 l 6 10`} stroke={color} strokeWidth={4} fill="none" />}
      </g>
    </g>
  );
};
const NoirFig: React.FC<FigProps> = ({x, y, h, face = 1, pose, zombie}) => {
  const k = skeleton(pose);
  const s = h / 300;
  const perp: V2 = [-k.dir[1], k.dir[0]];
  const tA = add(k.neck, mul(k.dir, -3));
  const tB = add(k.hip, mul(k.dir, 8));
  const hr = HEAD_R * 1.05;
  const hc = add(k.neck, mul(unit(sub(k.headC, k.neck)), hr + 5));
  const stripe = (t: number) => {
    const p = lerp(tA, tB, t);
    const a = add(p, mul(perp, -27));
    const b = add(p, mul(perp, 27));
    return <line key={t} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#f2f7c4" strokeWidth={5} filter="url(#mvGlow)" opacity={zombie ? 0.7 : 1} />;
  };
  const tr = `translate(${x},${y}) scale(${s * face},${s})`;
  return (
    <g>
      <ellipse cx={x} cy={y + 3 * s} rx={46 * s} ry={8 * s} fill="#000" opacity={0.5} />
      {/* rim light: the same shape in pale blue, nudged toward the light behind */}
      <g transform="translate(-5,-4)">
        <g transform={tr}>
          <NoirShape k={k} color="#a9c1e8" zombie={zombie} />
        </g>
      </g>
      <g transform={tr}>
        <NoirShape k={k} color="#0d1016" zombie={zombie} />
        {stripe(0.56)}
        {stripe(0.8)}
        <Radio at={add(lerp(tA, tB, 0.3), mul(perp, 13))} rot={k.lean} k={1.1} glow />
        <g transform={`translate(${hc[0]},${hc[1]}) rotate(${(k.lean ?? 0) * 0.5})`}>
          {zombie ? (
            <>
              <circle cx={hr * 0.18} cy={-hr * 0.02} r={3.6} fill="#d9f5a0" filter="url(#mvGlow)" />
              <circle cx={hr * 0.62} cy={-hr * 0.02} r={3.6} fill="#d9f5a0" filter="url(#mvGlow)" />
            </>
          ) : (
            <>
              <circle cx={hr * 0.2} cy={-hr * 0.04} r={2.2} fill="#ffffff" />
              <circle cx={hr * 0.62} cy={-hr * 0.04} r={2.2} fill="#ffffff" />
            </>
          )}
        </g>
      </g>
    </g>
  );
};

// ---------------- C: the current figures, Marcus redesigned ----------------
export const MARCUS_V: Look = {
  skin: SKIN, shirt: NAVY, sleeves: 'short', pants: NAVY_D, hair: 'hightop', hairColor: HAIR,
  goatee: true, glasses: true, vest: VEST, badge: true, radioOnChest: true, radioFlip: true, bulk: 1.22,
};
export const MARCUS_VZ: Look = {
  ...MARCUS_V, skin: '#7c8a6c', shirt: '#2c3d63', pants: '#1c2540', glasses: 'cracked', vest: VEST_Z, torn: true,
};

// ---------------- the sheet ----------------
const PW = 1280;
const PH = 720;
const CAM = {x: 1300, y: 1050, z: 2.2}; // a 1280×720 window of the garage, 1 picture px = 1 px
const ALIVE = {x: 1060, y: 1345};
const DEAD = {x: 1560, y: 1345};
const FIG_H = 480;

const Panel: React.FC<{i: number; title: string; lines: string[]; dark?: boolean; children: React.ReactNode}> = ({i, title, lines, dark, children}) => (
  <div style={{position: 'absolute', left: (i % 2) * PW, top: Math.floor(i / 2) * PH, width: PW, height: PH, overflow: 'hidden'}}>
    <World bg="garage" cam={CAM} width={PW} height={PH} filter={dark ? 'brightness(0.24) saturate(0.55)' : 'brightness(0.8) saturate(0.8)'}>
      {dark && (
        <>
          <defs>
            <radialGradient id="mvLight" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#c9dcff" stopOpacity={0.55} />
              <stop offset="1" stopColor="#c9dcff" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={1180} cy={930} rx={620} ry={360} fill="url(#mvLight)" />
        </>
      )}
      {children}
    </World>
    <svg width={PW} height={PH} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={PW} height={PH} fill="none" stroke="#07080b" strokeWidth={6} />
      <rect x={28} y={26} width={66} height={66} rx={14} fill="#f0c53c" stroke={INK} strokeWidth={4} />
      <Txt x={61} y={78} size={52} fill={INK}>
        {String.fromCharCode(65 + i)}
      </Txt>
      <Txt x={112} y={76} size={52} anchor="start">
        {title}
      </Txt>
      {lines.map((l, j) => (
        <text key={j} x={112} y={116 + j * 32} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={25} fill="#e9edf5" stroke="#07080b" strokeWidth={5} paintOrder="stroke">
          {l}
        </text>
      ))}
      <text x={ALIVE.x - CAM.x + PW / 2} y={PH - 18} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={22} fill="#cfd6e6" stroke="#07080b" strokeWidth={5} paintOrder="stroke">
        MARCUS
      </text>
      <text x={DEAD.x - CAM.x + PW / 2} y={PH - 18} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={22} fill="#cfd6e6" stroke="#07080b" strokeWidth={5} paintOrder="stroke">
        ZOMBIE MARCUS
      </text>
    </svg>
  </div>
);

export const MarcusVariants: React.FC = () => {
  useFont();
  return (
    <AbsoluteFill style={{background: '#07080b'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="mvGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={3.5} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <Panel i={0} title="CLASSIC STICK" lines={['Ink lines and a round head. Simplest; reads at any size.', 'Marcus: cap on backwards, hi-vis vest, radio upside down.']}>
        <ClassicFig x={ALIVE.x} y={ALIVE.y} h={FIG_H * 1.04} pose={POSES.wave} />
        <ClassicFig x={DEAD.x} y={DEAD.y} h={FIG_H * 1.04} face={-1} pose={POSES.zShamble} zombie />
      </Panel>
      <Panel i={1} title="CHUNKY CARTOON" lines={['Thick limbs, a big head, big eyes. The most expressive.', 'Marcus: big round build, beanie, hi-vis vest, goatee.']}>
        <ToonFig id="mvToonA" x={ALIVE.x} y={ALIVE.y} h={FIG_H * 1.04} pose={POSES.wave} />
        <ToonFig id="mvToonZ" x={DEAD.x} y={DEAD.y} h={FIG_H * 1.04} face={-1} pose={POSES.zShamble} zombie />
      </Panel>
      <Panel i={2} title="TODAY'S STYLE, NEW MARCUS" lines={['The figures you have now. Marcus gets a bigger build, a high-top,', 'glasses (nursing student), a goatee, the vest and the radio upside down.']}>
        <Stick x={ALIVE.x} y={ALIVE.y} h={FIG_H * 1.06} look={MARCUS_V} pose={POSES.wave} eyes="dot" mouth="smile" />
        <Stick x={DEAD.x} y={DEAD.y} h={FIG_H * 1.06} face={-1} look={MARCUS_VZ} pose={POSES.zShamble} eyes="zombie" mouth="zombie" wobble={7} />
      </Panel>
      <Panel i={3} title="SHADOW" dark lines={['Dark silhouettes, a rim of light, glowing details. The moodiest;', 'faces stay hidden. Marcus: big frame, cap, glowing vest stripes.']}>
        <NoirFig x={ALIVE.x} y={ALIVE.y} h={FIG_H * 1.04} pose={POSES.wave} />
        <NoirFig x={DEAD.x} y={DEAD.y} h={FIG_H * 1.04} face={-1} pose={POSES.zShamble} zombie />
      </Panel>
    </AbsoluteFill>
  );
};

