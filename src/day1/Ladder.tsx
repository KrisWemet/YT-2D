// Shots 4-6 (8.4-14.5 s): Samantha halfway up the rusty roof ladder on the side of the station.
// One world (wall, ladder, Samantha from behind, the shapes below); each shot is a camera on it.
//   ladder   (8.4-10.9)  medium: knuckles white, shaking; "Sam!"; her boot slips; hands rise below
//   knuckles (10.9-12.1) extreme close-up on her grip; "Don't look down!"
//   boots    (12.1-14.5) her boots, hands reaching for them from the dark; "Look at me!"
import React from 'react';
import {B, Frame, Glow, INK, OW, P, flick, handheld, hash, jolt, mix, vnoise} from './kit';
import {clamp, easeInOutCubic, easeOutCubic, lerp} from '../pigeon/lib';

// ---------------------------------------------------------------- world layout
export const RX = [800, 1120]; // ladder rail centres
const RUNG0 = 100, RUNG_GAP = 100, GROUND = 2200;
const rungY = (i: number) => RUNG0 + i * RUNG_GAP;
const HAND_RUNG = 800;
const LAMP = {x: 1290, y: 470};
const TORCH = {x: 1120, y: -80}; // Marcus's flashlight on the roof

const lampL = (t: number) => clamp(flick(t + 0.37));

// ---------------------------------------------------------------- wall + ladder
const Wall: React.FC<{t: number; L: number; detail: number}> = ({t, L, detail}) => {
  const rows = [];
  for (let r = -2; r < 46; r++) {
    const y = r * 50;
    rows.push(<line key={`r${r}`} x1={-200} y1={y} x2={2200} y2={y} stroke="#17181e" strokeWidth={4} />);
    for (let c = -2; c < 20; c++) {
      const x = c * 120 + (r % 2 ? 60 : 0);
      rows.push(<line key={`c${r}_${c}`} x1={x} y1={y} x2={x} y2={y + 50} stroke="#17181e" strokeWidth={4} />);
      if (detail > 0.5 && hash(r * 31 + c) > 0.8) {
        rows.push(<rect key={`b${r}_${c}`} x={x + 6} y={y + 6} width={108} height={38} fill="#000" opacity={0.08 + 0.1 * hash(c * 7 + r)} />);
      }
    }
  }
  return (
    <g>
      <rect x={-300} y={-300} width={2600} height={2800} fill="#2b2c35" />
      {rows}
      {/* rust and water streaks below the roof edge and the ladder brackets */}
      {[120, 380, 760, 1160, 1500, 1830].map((x, i) => (
        <path key={i} d={`M${x} 0L${x + 40} 0L${x + 30 + 10 * hash(i)} ${300 + 300 * hash(i * 3)}L${x + 12} ${200 + 200 * hash(i * 5)}Z`} fill="#2a2018" opacity={0.25} />
      ))}
      {[RX[0], RX[1]].map((x, i) => [400, 1000, 1600].map((y) => (
        <path key={`${i}${y}`} d={`M${x - 10} ${y}L${x + 10} ${y}L${x + 4} ${y + 160}L${x - 6} ${y + 120}Z`} fill={P.rustDark} opacity={0.35} />
      )))}
      {/* light: warm caged lamp + the flashlight pool on the wall */}
      <g style={{mixBlendMode: 'screen'}}>
        <defs>
          <radialGradient id="l-lamp">
            <stop offset="0%" stopColor={`rgb(${P.lamp})`} stopOpacity={0.6 * L} />
            <stop offset="45%" stopColor={`rgb(${P.lamp})`} stopOpacity={0.22 * L} />
            <stop offset="100%" stopColor={`rgb(${P.lamp})`} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="l-torch">
            <stop offset="0%" stopColor="#eef4ff" stopOpacity={0.4} />
            <stop offset="70%" stopColor="#eef4ff" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#eef4ff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={LAMP.x - 160} cy={LAMP.y + 380} rx={780} ry={880} fill="url(#l-lamp)" />
      </g>
      {/* roof edge: parapet cap */}
      <rect x={-300} y={-120} width={2600} height={120} fill="#0b0d14" />
      <rect x={-300} y={-30} width={2600} height={34} fill={mix('#2a2e36', '#8d939a', 0.5 * L)} stroke={INK} strokeWidth={OW} />
      {/* caged lamp */}
      <g transform={`translate(${LAMP.x} ${LAMP.y})`}>
        <rect x={-30} y={-46} width={60} height={22} rx={4} fill="#15171d" stroke={INK} strokeWidth={OW} />
        <path d="M-26 -24L-34 26Q0 52 34 26L26 -24Z" fill={mix('#3a3020', '#fff1c2', 0.25 + 0.75 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
        {[-16, 0, 16].map((x) => <line key={x} x1={x} y1={-24} x2={x * 1.3} y2={36} stroke={INK} strokeWidth={4} />)}
        <path d="M-32 6Q0 20 32 6" fill="none" stroke={INK} strokeWidth={4} />
      </g>
      <Glow x={LAMP.x} y={LAMP.y + 10} rx={260} rgb={P.lamp} a={0.85 * L} id="l-lampglow" />
      {/* moths at the lamp */}
      {[0, 1, 2, 3].map((i) => {
        const a = t * (6 + 2 * i) + i * 1.7;
        return <circle key={i} cx={LAMP.x + Math.cos(a) * (40 + 14 * i)} cy={LAMP.y + 10 + Math.sin(a * 1.4) * 26} r={3} fill="#efe6c8" opacity={0.8 * L} />;
      })}
    </g>
  );
};

const Rail: React.FC<{x: number; L: number; side: number}> = ({x, L, side}) => {
  const lit = mix(P.rust, P.rustLit, 0.6 * L);
  const spots = [];
  for (let i = 0; i < 26; i++) {
    const y = 40 + i * 85 + hash(i * 3 + x) * 40;
    spots.push(<ellipse key={i} cx={x + (hash(i + x) - 0.5) * 10} cy={y} rx={7} ry={14 + 16 * hash(i * 7 + x)} fill={P.rustDark} opacity={0.7} />);
  }
  return (
    <g>
      {/* standoff brackets */}
      {[400, 1000, 1600].map((y) => (
        <g key={y}>
          <rect x={x - 26} y={y - 10} width={52} height={22} fill={P.rustDark} stroke={INK} strokeWidth={4} />
          <circle cx={x + side * 18} cy={y + 1} r={5} fill="#15171d" />
        </g>
      ))}
      {/* gooseneck over the parapet */}
      <path d={`M${x} 60L${x} -40Q${x} -110 ${x + side * 10} -110L${x + side * 30} -110`} fill="none" stroke={INK} strokeWidth={22 + 2 * OW} strokeLinecap="round" />
      <path d={`M${x} 60L${x} -40Q${x} -110 ${x + side * 10} -110L${x + side * 30} -110`} fill="none" stroke={lit} strokeWidth={22} strokeLinecap="round" />
      <rect x={x - 11} y={40} width={22} height={2300} fill={lit} stroke={INK} strokeWidth={OW} />
      {spots}
      <line x1={x - 5} y1={40} x2={x - 5} y2={2300} stroke="#e8955a" strokeWidth={3} opacity={0.35 * L} />
    </g>
  );
};

const Rungs: React.FC<{L: number; slipFlakes: number}> = ({L}) => {
  const lit = mix(P.rust, P.rustLit, 0.55 * L);
  const out = [];
  for (let i = 0; i < 21; i++) {
    const y = rungY(i);
    out.push(
      <g key={i}>
        <rect x={RX[0]} y={y - 9} width={RX[1] - RX[0]} height={18} rx={9} fill={lit} stroke={INK} strokeWidth={OW - 1} />
        <line x1={RX[0] + 10} y1={y - 3} x2={RX[1] - 10} y2={y - 3} stroke="#f0a36a" strokeWidth={3} opacity={0.35 * L} />
        {[0.2, 0.45, 0.7].map((u, k) => (
          <ellipse key={k} cx={lerp(RX[0], RX[1], u + 0.12 * (hash(i * 3 + k) - 0.5))} cy={y + 2} rx={10 + 14 * hash(i + k * 5)} ry={5} fill={P.rustDark} opacity={0.75} />
        ))}
      </g>,
    );
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------- the shapes below
type Arm = {sx: number; sy: number; tx: number; ty: number; t0: number; ph: number; lean: number};
const ARMS: Arm[] = [
  {sx: 760, sy: 1770, tx: 860, ty: 1500, t0: 10.0, ph: 0.0, lean: -1},
  {sx: 1180, sy: 1780, tx: 1060, ty: 1500, t0: 10.25, ph: 1.3, lean: 1},
  {sx: 880, sy: 1840, tx: 920, ty: 1440, t0: 11.6, ph: 2.1, lean: -1}, // the one that reaches her boot
  {sx: 560, sy: 1820, tx: 700, ty: 1580, t0: 10.4, ph: 0.7, lean: -1},
  {sx: 1380, sy: 1820, tx: 1220, ty: 1570, t0: 10.6, ph: 2.6, lean: 1},
  {sx: 1060, sy: 1880, tx: 1000, ty: 1520, t0: 12.2, ph: 3.3, lean: 1},
];
const HEADS = [[690, 1690, 1.15, -8], [960, 1760, 1.3, 6], [1210, 1700, 1.15, 10], [470, 1760, 1.05, -12], [1440, 1760, 1.1, 8], [1080, 1820, 1.2, -4]];

export const GrabHand: React.FC<{x: number; y: number; ang: number; grip: number; L: number; s?: number}> = ({x, y, ang, grip, L, s = 1}) => {
  const skin = mix('#272d27', P.hand, 0.15 + 0.6 * L);
  const lit = mix(P.handShade, P.handLit, 0.8 * L);
  const F: Array<[number, number, number]> = [[-17, -22, 64], [-6, -8, 78], [6, 6, 74], [17, 20, 58]]; // base x, angle, length
  const seg = (bx: number, a0: number, len: number) => {
    const c = grip * 0.55;
    const r0 = (a0 * Math.PI) / 180;
    const p0 = [bx, -50];
    const p1 = [p0[0] + Math.sin(r0) * len * 0.45, p0[1] - Math.cos(r0) * len * 0.45];
    const r1 = r0 + c * Math.sign(-bx || 1) * -0.2 + c;
    const p2 = [p1[0] + Math.sin(r1) * len * 0.33, p1[1] - Math.cos(r1) * len * 0.33];
    const r2 = r1 + c * 1.1;
    const p3 = [p2[0] + Math.sin(r2) * len * 0.26, p2[1] - Math.cos(r2) * len * 0.26];
    return [p0, p1, p2, p3, r2] as const;
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
      {/* forearm */}
      <path d="M-15 0L-19 120L19 120L15 0Z" fill={skin} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {F.map(([bx, a0, len], i) => {
        const [p0, p1, p2, p3] = seg(bx, a0, len);
        return <polyline key={`o${i}`} points={`${p0} ${p1} ${p2} ${p3}`} fill="none" stroke={INK} strokeWidth={11 + 8} strokeLinecap="round" strokeLinejoin="round" />;
      })}
      <polyline points="-22,-16 -42,-36 -52,-58" fill="none" stroke={INK} strokeWidth={12 + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-22 -2Q-30 -30 -24 -54L24 -54Q30 -28 22 -2Z" fill={skin} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {F.map(([bx, a0, len], i) => {
        const [p0, p1, p2, p3, r2] = seg(bx, a0, len);
        return (
          <g key={`f${i}`}>
            <polyline points={`${p0} ${p1} ${p2} ${p3}`} fill="none" stroke={skin} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={p1[0]} cy={p1[1]} r={5.5} fill={lit} />
            <circle cx={p2[0]} cy={p2[1]} r={4.5} fill={lit} />
            <path d={`M${p3[0] - 4} ${p3[1]}L${p3[0] + Math.sin(r2) * 12} ${p3[1] - Math.cos(r2) * 12}L${p3[0] + 4} ${p3[1]}Z`} fill="#2a2620" stroke={INK} strokeWidth={2} />
          </g>
        );
      })}
      <polyline points="-22,-16 -42,-36 -52,-58" fill="none" stroke={skin} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-8 -48L-6 -10M6 -48L5 -10" stroke={lit} strokeWidth={2.5} opacity={0.6} />
      {/* ragged sleeve */}
      <path d="M-30 60L-18 46L-8 60L4 44L16 58L30 46L34 140L-34 140Z" fill={P.shape} stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Shapes: React.FC<{t: number; L: number; brushBoost: number}> = ({t, L, brushBoost}) => {
  const rim = P.shapeRim;
  return (
    <g>
      {HEADS.map(([x, y, s, a], i) => {
        const bob = 8 * Math.sin(t * (2 + 0.3 * i) + i) + 4 * vnoise(t * 3 + i * 10);
        return (
          <g key={i} transform={`translate(${x + 6 * vnoise(t * 1.3 + i * 4)} ${y + bob}) rotate(${a + 4 * Math.sin(t * 1.7 + i)}) scale(${s})`}>
            <path d="M-170 400Q-160 170 -60 110L60 110Q170 170 180 400Z" fill={P.shape} />
            <path d="M-62 60Q-80 -60 -20 -96L0 -110L20 -94Q80 -60 62 60Q40 116 0 118Q-40 116 -62 60Z" fill={P.shape} />
            <path d="M20 -94Q80 -60 62 60M60 110Q150 160 170 300" fill="none" stroke={rim} strokeWidth={5} opacity={0.4 * L} />
          </g>
        );
      })}
      {ARMS.map((a, i) => {
        const u = easeOutCubic(clamp((t - a.t0) / 1.2));
        if (u <= 0) return null;
        const extra = i === 2 ? brushBoost : 0;
        const wig = 14 * Math.sin(t * 5 + a.ph) + 8 * vnoise(t * 4 + a.ph * 10);
        const hx = lerp(a.sx, a.tx, u) + wig * 0.6;
        const hy = lerp(a.sy + 60, a.ty, u) + wig * 0.4 - extra;
        const ex = (a.sx + hx) / 2 + a.lean * 50;
        const ey = (a.sy + hy) / 2 + 30;
        const ang = (Math.atan2(hx - ex, -(hy - ey)) * 180) / Math.PI;
        const grip = 0.5 + 0.5 * Math.sin(t * 6 + a.ph * 2);
        return (
          <g key={i}>
            <polyline points={`${a.sx},${a.sy} ${ex},${ey} ${lerp(ex, hx, 0.75)},${lerp(ey, hy, 0.75) + 40}`} fill="none" stroke={P.shape} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={`${ex},${ey} ${hx},${hy + 20}`} fill="none" stroke={rim} strokeWidth={3} opacity={0.35 * L} transform="translate(18 0)" />
            <GrabHand x={hx} y={hy} ang={ang} grip={grip} L={L} s={1.35} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- Samantha from behind
type Pose = {tremble: {x: number; y: number}; breathe: number; turn: number; hunch: number; slip: number; lift: number; grip: number};
const poseAt = (t: number): Pose => {
  const k = 2.2 + 1.4 * clamp((t - 10.9) / 3);
  const tremble = {x: k * Math.sin(t * 2 * Math.PI * 9.3) + 1.2 * vnoise(t * 14), y: 0.6 * k * Math.sin(t * 2 * Math.PI * 7.7 + 1)};
  const breathe = Math.sin(t * 2 * Math.PI * 1.4);
  const turn = easeOutCubic(clamp((t - B.flinch) / 0.18)) * (1 - 0.6 * clamp((t - 10.6) / 0.4));
  const hunch = Math.exp(-Math.max(0, t - B.flinch) / 0.6) * (t > B.flinch ? 1 : 0);
  // right boot slips off its rung and re-plants
  const slip = t > 9.95 && t < 10.55 ? Math.sin(Math.PI * clamp((t - 9.95) / 0.6)) : 0;
  // left boot yanked up after the brush
  const lift = easeOutCubic(clamp((t - (B.brush + 0.06)) / 0.22));
  const grip = clamp((t - 11.12) / 0.15);
  return {tremble, breathe, turn, hunch, slip, lift, grip};
};

const Boot: React.FC<{x: number; y: number; L: number; rot?: number; detail: number}> = ({x, y, L, rot = 0, detail}) => {
  const b = mix(P.boot, P.bootLit, 0.5 * L);
  return (
    // origin = bottom of the heel, sole sitting on the rung
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M-34 -120L-38 -40Q-44 -14 -44 0L44 0Q44 -14 38 -40L34 -120Z" fill={b} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d="M-46 -16L46 -16L48 8L-48 8Z" fill={P.sole} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      {detail > 0.5 && [-30, -15, 0, 15, 30].map((k) => <rect key={k} x={k - 5} y={-10} width={10} height={14} rx={2} fill="#121214" />)}
      <path d="M-8 -126L-8 -96Q0 -90 8 -96L8 -126" fill="none" stroke={INK} strokeWidth={5} />
      <path d="M-30 -60Q0 -50 30 -60" fill="none" stroke={INK} strokeWidth={3} opacity={0.6} />
      <path d="M-30 -110L-34 -40" stroke="#8e96a8" strokeWidth={3} opacity={0.4 * L} />
      {/* rolled denim cuff */}
      <path d="M-40 -150L40 -150L38 -116L-38 -116Z" fill={mix(P.denimDark, P.denimLit, 0.3 + 0.4 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
    </g>
  );
};

const Leg: React.FC<{hip: [number, number]; knee: [number, number]; ankle: [number, number]; L: number}> = ({hip, knee, ankle, L}) => (
  <g>
    <polyline points={`${hip[0]},${hip[1]} ${knee[0]},${knee[1]} ${ankle[0]},${ankle[1]}`} fill="none" stroke={INK} strokeWidth={78 + 2 * OW} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={`${hip[0]},${hip[1]} ${knee[0]},${knee[1]} ${ankle[0]},${ankle[1]}`} fill="none" stroke={mix(P.denimDark, P.denim, 0.4 + 0.5 * L)} strokeWidth={78} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={`${hip[0] - 22},${hip[1]} ${knee[0] - 24},${knee[1]} ${ankle[0] - 22},${ankle[1]}`} fill="none" stroke={P.denimLit} strokeWidth={8} strokeLinecap="round" opacity={0.35 * L} />
  </g>
);

const Arm: React.FC<{sh: [number, number]; el: [number, number]; ha: [number, number]; L: number; side: number; grip: number; detail: number}> = ({sh, el, ha, L, side, grip, detail}) => {
  const sleeve = mix(P.shirtDark, P.shirt, 0.35 + 0.55 * L);
  const skin = mix(P.skinShade, P.skin, 0.4 + 0.5 * L);
  const cuff: [number, number] = [lerp(el[0], ha[0], 0.15), lerp(el[1], ha[1], 0.15)];
  return (
    <g>
      <polyline points={`${sh[0]},${sh[1]} ${el[0]},${el[1]} ${cuff[0]},${cuff[1]}`} fill="none" stroke={INK} strokeWidth={56 + 2 * OW} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${cuff[0]},${cuff[1]} ${ha[0]},${ha[1] + 30}`} fill="none" stroke={INK} strokeWidth={40 + 2 * OW} strokeLinecap="round" />
      <polyline points={`${cuff[0]},${cuff[1]} ${ha[0]},${ha[1] + 30}`} fill="none" stroke={skin} strokeWidth={40} strokeLinecap="round" />
      <polyline points={`${sh[0]},${sh[1]} ${el[0]},${el[1]} ${cuff[0]},${cuff[1]}`} fill="none" stroke={sleeve} strokeWidth={56} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={cuff[0]} cy={cuff[1]} rx={32} ry={18} transform={`rotate(${(Math.atan2(ha[1] - el[1], ha[0] - el[0]) * 180) / Math.PI + 90} ${cuff[0]} ${cuff[1]})`} fill={mix(P.shirtDark, P.shirtLit, 0.5 * L)} stroke={INK} strokeWidth={4} />
      <SamHand x={ha[0]} y={ha[1]} L={L} side={side} grip={grip} detail={detail} />
    </g>
  );
};

/** her hand from behind, wrapped over the rung (origin = top of the rung under the knuckles) */
const SamHand: React.FC<{x: number; y: number; L: number; side: number; grip: number; detail: number}> = ({x, y, L, side, grip, detail}) => {
  const skin = mix(P.skinShade, P.skin, 0.45 + 0.5 * L);
  const white = mix(P.skin, '#fbefe4', 0.75 + 0.25 * grip);
  return (
    <g transform={`translate(${x} ${y}) scale(${side} 1)`}>
      {/* back of the hand */}
      <path d="M-30 46Q-40 10 -34 -4L32 -6Q40 12 30 50Q0 62 -30 46Z" fill={skin} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* four fingers over the rung */}
      {[-24, -8, 8, 23].map((fx, i) => (
        <g key={i}>
          <rect x={fx - 8} y={-20 + (i === 0 || i === 3 ? 3 : 0)} width={16} height={26} rx={8} fill={skin} stroke={INK} strokeWidth={4} />
          <ellipse cx={fx} cy={-6 + (i === 0 || i === 3 ? 3 : 0)} rx={6} ry={5} fill={white} />
        </g>
      ))}
      {/* thumb under the rung */}
      <path d="M-34 14Q-48 22 -44 36Q-36 40 -28 30" fill={skin} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {detail > 0.5 && <path d="M-16 8L-14 38M0 8L0 40M15 8L13 38" stroke={mix(P.skinShade, P.skinLit, 0.7)} strokeWidth={3} opacity={0.6} />}
    </g>
  );
};

const Sam: React.FC<{t: number; L: number; detail: number}> = ({t, L, detail}) => {
  const p = poseAt(t);
  const tx = p.tremble.x, ty = p.tremble.y;
  const sh = -3 * p.breathe - 14 * p.hunch; // shoulders up when breathing in / hunching
  const cx = 960 + tx;
  // legs: left straight to rung 14, right bent to rung 12 (slips, re-plants); left lifts after the brush
  const hipY = 1080 + ty;
  const lAnk: [number, number] = [915 + tx * 0.4, rungY(13) - 150 - 110 * p.lift];
  const rAnk: [number, number] = [1035 + tx * 0.4 + 18 * p.slip, rungY(12) - 150 + 70 * p.slip];
  const lKnee: [number, number] = [912 + tx * 0.6 - 30 * p.lift, lerp(hipY, lAnk[1], 0.5) - 40 * p.lift];
  const rKnee: [number, number] = [1062 + tx * 0.6, 1190 + 20 * p.slip];
  // arms: up to the hand rung beside her head
  const shY = 860 + ty + sh;
  const lSh: [number, number] = [892 + tx, shY], rSh: [number, number] = [1028 + tx, shY];
  const lHa: [number, number] = [892 + tx * 0.3, HAND_RUNG - 8], rHa: [number, number] = [1030 + tx * 0.3, HAND_RUNG - 8];
  const lEl: [number, number] = [842 + tx, 920 + ty + sh * 0.5], rEl: [number, number] = [1080 + tx, 920 + ty + sh * 0.5];
  const denim = mix(P.denimDark, P.denim, 0.4 + 0.5 * L);
  const shirt = mix(P.shirtDark, P.shirt, 0.35 + 0.55 * L);
  const hair = mix(P.hair, P.hairLit, 0.6 * L);
  const headY = 790 + ty + sh * 0.8 - 10 * p.turn;
  const headX = cx + 8 * p.turn;
  return (
    <g>
      {/* legs + boots */}
      <Leg hip={[922 + tx, hipY]} knee={lKnee} ankle={lAnk} L={L} />
      <Leg hip={[1000 + tx, hipY]} knee={rKnee} ankle={rAnk} L={L} />
      <Boot x={lAnk[0]} y={lAnk[1] + 150} L={L} detail={detail} rot={-4 * p.lift} />
      <Boot x={rAnk[0]} y={rAnk[1] + 150} L={L} detail={detail} rot={10 * p.slip} />
      {/* torso: shirt, then the overalls (seat, back bib, crossed straps) */}
      <path d={`M${cx - 72} ${shY - 6}Q${cx} ${shY - 26} ${cx + 72} ${shY - 6}L${cx + 66} ${hipY - 60}L${cx - 66} ${hipY - 60}Z`} fill={shirt} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d={`M${cx - 70} ${hipY - 90}L${cx + 70} ${hipY - 90}L${cx + 82} ${hipY + 40}Q${cx} ${hipY + 70} ${cx - 82} ${hipY + 40}Z`} fill={denim} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <line x1={cx} y1={hipY - 40} x2={cx} y2={hipY + 60} stroke={INK} strokeWidth={4} opacity={0.6} />
      {/* back pockets */}
      <path d={`M${cx - 66} ${hipY - 30}L${cx - 14} ${hipY - 30}L${cx - 16} ${hipY + 20}L${cx - 40} ${hipY + 30}L${cx - 64} ${hipY + 18}Z`} fill="none" stroke={P.shirt} strokeWidth={3} strokeDasharray="6 5" opacity={0.7} />
      <path d={`M${cx + 66} ${hipY - 30}L${cx + 14} ${hipY - 30}L${cx + 16} ${hipY + 20}L${cx + 40} ${hipY + 30}L${cx + 64} ${hipY + 18}Z`} fill="none" stroke={P.shirt} strokeWidth={3} strokeDasharray="6 5" opacity={0.7} />
      <path d={`M${cx - 70} ${hipY - 90}L${cx + 70} ${hipY - 90}L${cx + 46} ${hipY - 150}L${cx - 46} ${hipY - 150}Z`} fill={denim} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d={`M${cx - 40} ${hipY - 140}L${cx + 60} ${shY - 8}M${cx + 40} ${hipY - 140}L${cx - 60} ${shY - 8}`} stroke={INK} strokeWidth={30 + 2 * 5} strokeLinecap="round" />
      <path d={`M${cx - 40} ${hipY - 140}L${cx + 60} ${shY - 8}M${cx + 40} ${hipY - 140}L${cx - 60} ${shY - 8}`} stroke={denim} strokeWidth={30} strokeLinecap="round" />
      <rect x={cx - 16} y={(hipY - 140 + shY) / 2 - 22} width={32} height={30} rx={6} fill={mix(P.denimDark, P.denimLit, 0.5 * L)} stroke={INK} strokeWidth={4} />
      {/* arms reaching up to the rung by her head */}
      <Arm sh={lSh} el={lEl} ha={lHa} L={L} side={1} grip={p.grip} detail={detail} />
      <Arm sh={rSh} el={rEl} ha={rHa} L={L} side={-1} grip={p.grip} detail={detail} />
      {/* head from behind: neck, ears, hair with a ponytail; turning up toward the voice */}
      <rect x={cx - 26} y={headY + 30} width={52} height={60} fill={mix(P.skinShade, P.skin, 0.4 * L)} stroke={INK} strokeWidth={OW} />
      <ellipse cx={headX - 58} cy={headY + 6} rx={14} ry={20} fill={mix(P.skinShade, P.skin, 0.5 * L)} stroke={INK} strokeWidth={5} />
      <ellipse cx={headX + 58} cy={headY + 6} rx={14} ry={20} fill={mix(P.skinShade, P.skin, 0.5 * L)} stroke={INK} strokeWidth={5} />
      {p.turn > 0.05 && (
        // cheek + nose tip appear as she turns toward Marcus
        <path d={`M${headX + 40} ${headY + 40}Q${headX + 66 + 20 * p.turn} ${headY + 10} ${headX + 60 + 28 * p.turn} ${headY - 18}L${headX + 50} ${headY - 30}Z`} fill={mix(P.skinShade, P.skinLit, 0.5)} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      )}
      <ellipse cx={headX} cy={headY} rx={60} ry={66} fill={hair} stroke={INK} strokeWidth={OW} />
      <path d={`M${headX - 50} ${headY - 30}Q${headX} ${headY - 60} ${headX + 48} ${headY - 34}`} fill="none" stroke={P.hairLit} strokeWidth={5} opacity={0.5 * L} />
      <path d={`M${headX - 44} ${headY + 30}Q${headX - 30} ${headY - 10} ${headX - 8} ${headY - 8}M${headX + 44} ${headY + 30}Q${headX + 30} ${headY - 10} ${headX + 10} ${headY - 8}M${headX} ${headY + 50}L${headX} ${headY - 6}`} fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />
      <path d={`M${headX - 34} ${headY + 52}Q${headX} ${headY + 40} ${headX + 34} ${headY + 52}L${headX + 26} ${headY + 70}L${headX - 26} ${headY + 70}Z`} fill={mix(P.skinShade, P.skin, 0.45 * L)} />
      {/* messy bun */}
      <g transform={`rotate(${2 * Math.sin(t * 3) + tx * 0.4} ${headX} ${headY - 30})`}>
        <ellipse cx={headX + 4} cy={headY - 34} rx={34} ry={30} fill={hair} stroke={INK} strokeWidth={OW} />
        <path d={`M${headX - 20} ${headY - 44}Q${headX + 4} ${headY - 62} ${headX + 26} ${headY - 40}M${headX - 18} ${headY - 24}Q${headX + 8} ${headY - 14} ${headX + 30} ${headY - 30}`} fill="none" stroke={P.hairLit} strokeWidth={4} opacity={0.6 * L} />
        <path d={`M${headX + 30} ${headY - 50}q18 -14 30 -4M${headX - 26} ${headY - 52}q-12 -18 -2 -26`} fill="none" stroke={hair} strokeWidth={5} strokeLinecap="round" />
        <rect x={headX - 30} y={headY - 12} width={60} height={12} rx={6} fill="#a4362a" stroke={INK} strokeWidth={4} />
      </g>
      {/* stray hairs */}
      <path d={`M${headX + 44} ${headY - 40}q18 -8 24 6M${headX - 46} ${headY - 36}q-16 -12 -26 0`} fill="none" stroke={hair} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- flashlight beam from the roof
const Torch: React.FC<{t: number; target: [number, number]; a: number}> = ({t, target, a}) => {
  const jx = 18 * vnoise(t * 2.3) + 6 * vnoise(t * 9);
  const tx = target[0] + jx, ty = target[1];
  const ang = Math.atan2(ty - TORCH.y, tx - TORCH.x);
  const len = Math.hypot(tx - TORCH.x, ty - TORCH.y) * 1.6;
  const spread = 0.17;
  const p1 = [TORCH.x + Math.cos(ang - spread) * len, TORCH.y + Math.sin(ang - spread) * len];
  const p2 = [TORCH.x + Math.cos(ang + spread) * len, TORCH.y + Math.sin(ang + spread) * len];
  const motes = [];
  for (let i = 0; i < 18; i++) {
    const u = hash(i * 1.9);
    const v = hash(i * 4.3) - 0.5;
    const d = u * len * 0.8;
    motes.push(<circle key={i} cx={TORCH.x + Math.cos(ang + v * spread * 1.6) * d + 6 * Math.sin(t + i)} cy={TORCH.y + Math.sin(ang + v * spread * 1.6) * d + ((t * 20 + i * 30) % 40)} r={2 + 2 * hash(i)} fill="#fff" opacity={0.35 * a} />);
  }
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id="l-beam" gradientUnits="userSpaceOnUse" x1={TORCH.x} y1={TORCH.y} x2={tx} y2={ty}>
          <stop offset="0%" stopColor="#f2f6ff" stopOpacity={0.5 * a} />
          <stop offset="100%" stopColor="#f2f6ff" stopOpacity={0.08 * a} />
        </linearGradient>
      </defs>
      <path d={`M${TORCH.x} ${TORCH.y}L${p1[0]} ${p1[1]}L${p2[0]} ${p2[1]}Z`} fill="url(#l-beam)" />
      <ellipse cx={tx} cy={ty} rx={240} ry={210} fill="url(#l-torch)" />
      {motes}
      <Glow x={TORCH.x} y={TORCH.y + 20} rx={120} rgb="242,246,255" a={0.9 * a} id="l-torchsrc" />
    </g>
  );
};

// rust flakes knocked loose (world px)
const Flakes: React.FC<{t: number; t0: number; x: number; y: number; n?: number}> = ({t, t0, x, y, n = 10}) => {
  const u = t - t0;
  if (u < 0 || u > 1.6) return null;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const vx = (hash(i * 3.1 + t0) - 0.5) * 160;
        const g = 900;
        const fx = x + (hash(i + t0) - 0.5) * 120 + vx * u + 12 * Math.sin(u * 9 + i);
        const fy = y + 0.5 * g * u * u * (0.5 + 0.5 * hash(i * 7));
        return <rect key={i} x={fx} y={fy} width={6 + 6 * hash(i * 2)} height={4 + 4 * hash(i * 5)} fill={i % 2 ? P.rust : P.rustLit} transform={`rotate(${u * 400 * (hash(i) - 0.5)} ${fx} ${fy})`} opacity={1 - u / 1.6} />;
      })}
    </g>
  );
};

const LadderWorld: React.FC<{t: number; detail: number; brushBoost: number}> = ({t, detail, brushBoost}) => {
  const L = lampL(t);
  return (
    <g>
      <Wall t={t} L={L} detail={detail} />
      <Rail x={RX[0]} L={L} side={-1} />
      <Rail x={RX[1]} L={L} side={1} />
      <Rungs L={L} slipFlakes={0} />
      {/* darkness at the foot of the wall */}
      <defs>
        <linearGradient id="l-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={INK} stopOpacity={0} />
          <stop offset="55%" stopColor={INK} stopOpacity={0.85} />
          <stop offset="100%" stopColor={INK} stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect x={-300} y={1250} width={2600} height={1300} fill="url(#l-dark)" />
      <Sam t={t} L={L} detail={detail} />
      <Flakes t={t} t0={9.97} x={1040} y={rungY(12)} n={14} />
      <Flakes t={t} t0={11.2} x={960} y={HAND_RUNG + 10} n={8} />
      <Flakes t={t} t0={B.brush + 0.05} x={915} y={rungY(13)} n={12} />
      <Shapes t={t} L={L * 0.55} brushBoost={brushBoost} />
      <defs>
        <linearGradient id="l-dark2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={INK} stopOpacity={0} />
          <stop offset="100%" stopColor={INK} stopOpacity={0.75} />
        </linearGradient>
      </defs>
      <rect x={-300} y={1330} width={2600} height={820} fill="url(#l-dark2)" />
      <Torch t={t} target={[960, 790]} a={1} />
    </g>
  );
};

// ---------------------------------------------------------------- the three shots
export const LadderShot: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  // start on her (roof edge in frame), tilt down to reveal the hands rising below
  const u = easeInOutCubic(clamp((t - 9.75) / 1.0));
  const h = handheld(t, 1.2, 31);
  const j = jolt(t, [[B.flinch, 6, 0.12], [9.97, 10, 0.12]]);
  const y = lerp(890, 1160, u) + h.y + j.y;
  const s = lerp(0.98, 1.04, clamp(lt / 2.5));
  return (
    <Frame x={960 + h.x + j.x} y={y} s={s} r={-2 + h.r} bg="#05060b">
      <LadderWorld t={t} detail={0.3} brushBoost={0} />
    </Frame>
  );
};

export const BootsShot: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const h = handheld(t, 1.0, 51);
  const j = jolt(t, [[B.brush, 18, 0.14]]);
  const s = lerp(1.9, 2.05, clamp(lt / 2.4));
  // the reaching hand that touches the heel: extra lift timed to the brush
  const boost = 70 * Math.sin(Math.PI * clamp((t - (B.brush - 0.45)) / 0.9));
  return (
    <Frame x={965 + h.x / s + j.x / s} y={1380 + h.y / s + j.y / s} s={s} r={-5 + h.r} bg="#05060b">
      <LadderWorld t={t} detail={1} brushBoost={boost} />
    </Frame>
  );
};
