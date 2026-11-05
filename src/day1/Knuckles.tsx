// Shot 5 (10.9-12.1 s): extreme close-up of her grip on a rusty rung. Knuckles white, shaking.
// "Don't look down!" -> she squeezes harder; rust flakes fall.
import React from 'react';
import {Frame, Glow, INK, P, flick, handheld, hash, jolt, mix, vnoise} from './kit';
import {clamp, lerp} from '../pigeon/lib';

const RUNG_Y = 470; // top edge of the rung's front face
const RUNG_H = 180;
const OWK = 9; // heavier outline at this scale

const Backdrop: React.FC<{L: number}> = ({L}) => (
  <g style={{filter: 'blur(16px)'}}>
    <rect x={-400} y={-400} width={2800} height={1900} fill={mix('#23242c', '#5a5546', 0.6 * L)} />
    {Array.from({length: 7}, (_, r) => (
      <g key={r}>
        <rect x={-400} y={-300 + r * 300} width={2800} height={18} fill="#15161b" />
        {Array.from({length: 6}, (_, c) => <rect key={c} x={-300 + c * 720 + (r % 2) * 360} y={-300 + r * 300} width={18} height={300} fill="#15161b" />)}
      </g>
    ))}
    {/* ladder rail on the right, rung going off left */}
    <rect x={1640} y={-400} width={120} height={1900} fill={mix(P.rust, P.rustLit, 0.5 * L)} />
    <rect x={-400} y={1150} width={2800} height={500} fill={INK} opacity={0.5} />
  </g>
);

const Rung: React.FC<{L: number}> = ({L}) => {
  const base = mix(P.rustDark, P.rust, 0.5 + 0.4 * L);
  const top = mix(P.rust, P.rustLit, 0.5 + 0.5 * L);
  const pits = [];
  for (let i = 0; i < 46; i++) {
    const x = -300 + hash(i * 2.7) * 2500;
    const y = RUNG_Y + 10 + hash(i * 5.9) * (RUNG_H - 20);
    pits.push(<ellipse key={i} cx={x} cy={y} rx={10 + 34 * hash(i * 3.3)} ry={6 + 12 * hash(i * 1.1)} fill={P.rustDark} opacity={0.75} />);
  }
  const paint = [];
  for (let i = 0; i < 9; i++) {
    const x = -200 + hash(i * 8.1) * 2300;
    paint.push(<path key={i} d={`M${x} ${RUNG_Y + 20}l${60 + 50 * hash(i)} -4l10 ${30 + 30 * hash(i * 2)}l-${70 + 40 * hash(i * 3)} 8z`} fill="#5d6b5e" stroke={INK} strokeWidth={3} opacity={0.85} />);
  }
  return (
    <g>
      {/* top surface (seen from above) then the front face */}
      <rect x={-400} y={RUNG_Y - 66} width={2800} height={70} fill={top} stroke={INK} strokeWidth={OWK} />
      <rect x={-400} y={RUNG_Y} width={2800} height={RUNG_H} fill={base} stroke={INK} strokeWidth={OWK} />
      <rect x={-400} y={RUNG_Y + 6} width={2800} height={16} fill="#f0a36a" opacity={0.35 * L} />
      {pits}
      {paint}
      <rect x={-400} y={RUNG_Y + RUNG_H - 30} width={2800} height={30} fill="#000" opacity={0.25} />
    </g>
  );
};

/** her hand from behind gripping the rung. side = 1 right hand, -1 left hand (mirrored).
 *  origin = middle of the knuckle ridge on the rung's top-front edge. */
const Grip: React.FC<{x: number; t: number; L: number; side: number; squeeze: number}> = ({x, t, L, side, squeeze}) => {
  const skin = mix(P.skinShade, P.skin, 0.45 + 0.5 * L);
  const shade = mix('#5a372a', P.skinShade, 0.45 + 0.4 * L);
  const lit = mix(P.skin, P.skinLit, 0.35 + 0.6 * L);
  const white = mix('#ecd3c0', '#fff4ea', squeeze);
  const jx = 4 * Math.sin(t * 2 * Math.PI * 9.1 + side) + 2 * vnoise(t * 12 + side * 5);
  const jy = 2.5 * Math.sin(t * 2 * Math.PI * 7.3 + side * 2);
  const sq = 1 - 0.03 * squeeze;
  const K = [-111, -37, 37, 109]; // finger centres
  const FW = [66, 70, 68, 58];
  const ridge = 'M-150 6Q-148 -14 -111 -16Q-74 -20 -37 -20Q0 -22 37 -20Q74 -18 109 -14Q142 -10 146 8';
  return (
    <g transform={`translate(${x + jx} ${RUNG_Y + jy}) scale(${side} ${sq})`}>
      {/* forearm + rolled sleeve toward camera */}
      <path d="M-128 170Q-150 360 -170 640L170 640Q150 360 120 170Z" fill={skin} stroke={INK} strokeWidth={OWK} strokeLinejoin="round" />
      <path d="M-128 170Q-150 360 -170 640" fill="none" stroke={shade} strokeWidth={34} opacity={0.55} />
      <path d="M-200 470Q0 430 200 470L214 640Q0 600 -214 640Z" fill={mix(P.shirtDark, P.shirt, 0.4 + 0.5 * L)} stroke={INK} strokeWidth={OWK} strokeLinejoin="round" />
      <path d="M-200 470Q0 430 200 470L203 515Q0 476 -203 515Z" fill={mix(P.shirtDark, P.shirtLit, 0.6 * L)} stroke={INK} strokeWidth={5} />
      {/* proximal finger segments lying over the top of the rung, ending in the bent middle knuckles */}
      {K.map((kx, i) => (
        <g key={`f${i}`}>
          <path d={`M${kx - FW[i] / 2} -4L${kx - FW[i] / 2 + 4} -70Q${kx} -92 ${kx + FW[i] / 2 - 4} -70L${kx + FW[i] / 2} -4Z`} fill={lit} stroke={INK} strokeWidth={OWK - 3} strokeLinejoin="round" />
          <ellipse cx={kx} cy={-72} rx={FW[i] * 0.32} ry={12} fill={white} />
          <path d={`M${kx - FW[i] * 0.3} -38Q${kx} -30 ${kx + FW[i] * 0.3} -38`} fill="none" stroke={shade} strokeWidth={4} opacity={0.45} />
        </g>
      ))}
      {/* back of the hand: knuckle ridge on top, down the front face to the wrist */}
      <path d={`${ridge}Q156 90 122 172L-128 172Q-168 90 -150 6Z`} fill={skin} stroke={INK} strokeWidth={OWK} strokeLinejoin="round" />
      <path d="M-150 20Q-166 100 -128 172L-96 172Q-128 100 -120 20Z" fill={shade} opacity={0.5} />
      {/* white knuckles: skin stretched over the bone */}
      {K.map((kx, i) => (
        <g key={`k${i}`}>
          <ellipse cx={kx} cy={-6} rx={FW[i] * 0.36} ry={16} fill={white} />
          <path d={`M${kx * 0.92} 16Q${kx * 0.7} 90 ${kx * 0.32} 168`} fill="none" stroke={lit} strokeWidth={10} strokeLinecap="round" opacity={0.45 + 0.35 * squeeze} />
        </g>
      ))}
      <path d={ridge} fill="none" stroke={INK} strokeWidth={OWK} strokeLinejoin="round" />
      {/* thumb wrapping under the rung */}
      <path d="M-150 60Q-214 120 -196 196Q-160 222 -124 176Q-118 130 -128 96Z" fill={skin} stroke={INK} strokeWidth={OWK} strokeLinejoin="round" />
      <ellipse cx={-176} cy={186} rx={18} ry={14} fill={white} opacity={0.85} />
      {/* scrape + sweat sheen */}
      <path d="M30 70l40 -10M38 82l30 -8" stroke="#a9443a" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      <path d="M-70 40Q-30 30 10 42" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.3 * L} />
      <circle cx={70} cy={110} r={7} fill="#fff" opacity={0.5 * L} />
    </g>
  );
};

const Flakes: React.FC<{t: number}> = ({t}) => {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const t0 = 10.95 + k * 0.38;
    const u = t - t0;
    if (u < 0 || u > 1.2) continue;
    for (let i = 0; i < 9; i++) {
      const fx = 700 + k * 260 + (hash(i * 3 + k) - 0.5) * 300 + 20 * Math.sin(u * 10 + i);
      const fy = RUNG_Y + RUNG_H + 0.5 * 1800 * u * u * (0.5 + 0.5 * hash(i * 7 + k));
      out.push(<rect key={`${k}-${i}`} x={fx} y={fy} width={14 + 10 * hash(i)} height={9 + 6 * hash(i * 2)} fill={i % 2 ? P.rust : P.rustLit} stroke={INK} strokeWidth={2} transform={`rotate(${u * 600 * (hash(i + k) - 0.5)} ${fx} ${fy})`} opacity={1 - u / 1.2} />);
    }
  }
  return <g>{out}</g>;
};

export const KnucklesShot: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const L = clamp(flick(t + 0.37));
  const squeeze = clamp((t - 11.12) / 0.2) * 0.8 + 0.2;
  const h = handheld(t, 0.8, 41);
  const j = jolt(t, [[11.12, 5, 0.1]]);
  const s = lerp(1.0, 1.06, clamp(lt / 1.2));
  return (
    <Frame x={960 + h.x + j.x} y={540 + h.y + j.y} s={s} r={2 + h.r} bg="#06070c">
      <Backdrop L={L} />
      <Rung L={L} />
      <Grip x={560} t={t} L={L} side={-1} squeeze={squeeze} />
      <Grip x={1370} t={t} L={L} side={1} squeeze={squeeze} />
      <Flakes t={t} />
      {/* lamp warmth from the upper left, flashlight cool from above */}
      <Glow x={200} y={80} rx={900} ry={600} rgb={P.lamp} a={0.25 * L} id="k-lamp" />
      <Glow x={1100} y={-200} rx={900} ry={500} rgb="238,244,255" a={0.25} id="k-torch" />
      <rect x={-400} y={-400} width={2800} height={1900} fill="#03040a" opacity={0.2 + 0.3 * (1 - L)} />
    </Frame>
  );
};
