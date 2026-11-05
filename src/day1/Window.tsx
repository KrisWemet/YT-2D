// Shot 3 (6.5-8.4 s): inside the cab. Something slams against the passenger window and a
// handprint smears down the glass.
import React from 'react';
import {B, Frame, Glow, INK, OW, P, flick, handheld, jolt, mix, vnoise} from './kit';
import {clamp, easeInOutCubic, easeOutCubic, lerp} from '../pigeon/lib';

// glass outline (front of the truck is to the left: slanted A-pillar edge)
const GLASS = 'M470 150L1500 150Q1540 150 1540 190L1540 690L330 690Z';
const IMPACT = {x: 1000, y: 470};

const Outside: React.FC<{t: number; L: number}> = ({t, L}) => (
  <g style={{filter: 'blur(9px)'}}>
    <rect x={200} y={100} width={1500} height={700} fill="#070a14" />
    {/* lot, canopy, pumps, store window — out of focus */}
    <rect x={200} y={520} width={1500} height={300} fill={mix('#141822', '#5d6563', 0.8 * L)} />
    <rect x={250} y={250} width={900} height={40} fill={mix('#1b1f27', '#cfd5d2', 0.8 * L)} />
    {[360, 600, 840, 1080].map((x, i) => <rect key={i} x={x - 70} y={292} width={140} height={14} rx={7} fill={mix('#222831', P.tube, L)} />)}
    <ellipse cx={700} cy={330} rx={600} ry={160} fill={`rgba(${P.tubeGlow},${0.25 * L})`} />
    <rect x={430} y={380} width={70} height={140} fill={mix('#1a1d25', '#9aa2a5', 0.7 * L)} />
    <rect x={820} y={380} width={70} height={140} fill={mix('#1a1d25', '#9aa2a5', 0.7 * L)} />
    <rect x={1280} y={330} width={330} height={150} fill={mix('#1e1d16', '#e8d9a0', 0.6 * L)} />
    {/* something crosses the light before the slam */}
    {t > 6.6 && t < 6.92 && (
      <g transform={`translate(${lerp(1750, 150, clamp((t - 6.62) / 0.28))} 330)`}>
        <ellipse cx={0} cy={0} rx={70} ry={85} fill="#05060b" />
        <path d="M-170 380Q-160 120 -40 80L40 80Q170 120 180 380Z" fill="#05060b" />
      </g>
    )}
  </g>
);

/** pressed palm + bony fingers (palm side, fingers up); local origin = centre of palm */
const FINGERS: Array<[number, number, number, number]> = [
  // base x, base y, angle (deg), length
  [-58, -62, -16, 150], [-20, -78, -5, 176], [20, -76, 5, 170], [56, -58, 15, 132],
];
const fingerPts = (x: number, y: number, a: number, len: number, curl: number) => {
  const r = (a * Math.PI) / 180;
  const k = 1 - 0.3 * curl;
  const j = [x + Math.sin(r) * len * 0.5 * k, y - Math.cos(r) * len * 0.5 * k];
  const r2 = r + (curl * 0.5 + 0.06) * Math.sign(a || 1);
  const tip = [j[0] + Math.sin(r2) * len * 0.5 * k, j[1] - Math.cos(r2) * len * 0.5 * k];
  return {j, tip};
};
const Hand: React.FC<{press: number; L: number; curl: number}> = ({press, L, curl}) => {
  const skin = mix(P.handShade, P.hand, 0.35 + 0.6 * L);
  const pale = mix(P.hand, '#e3e8dc', 0.7);
  const palm = 'M-86 -74Q-104 10 -78 92Q-10 116 70 96Q100 20 84 -66Q40 -94 -10 -88Q-50 -88 -86 -74Z';
  return (
    <g>
      {/* outlines first so the fingers join the palm cleanly */}
      {FINGERS.map(([x, y, a, len], i) => {
        const {j, tip} = fingerPts(x, y, a, len, curl);
        return <polyline key={`o${i}`} points={`${x},${y + 30} ${j[0]},${j[1]} ${tip[0]},${tip[1]}`} fill="none" stroke={INK} strokeWidth={36 - i * 2 + 2 * OW} strokeLinecap="round" strokeLinejoin="round" />;
      })}
      <polyline points="-70,40 -132,-6 -150,-58" fill="none" stroke={INK} strokeWidth={38 + 2 * OW} strokeLinecap="round" strokeLinejoin="round" />
      <path d={palm} fill={INK} stroke={INK} strokeWidth={2 * OW} strokeLinejoin="round" />
      {FINGERS.map(([x, y, a, len], i) => {
        const {j, tip} = fingerPts(x, y, a, len, curl);
        return (
          <g key={`f${i}`}>
            <polyline points={`${x},${y + 30} ${j[0]},${j[1]} ${tip[0]},${tip[1]}`} fill="none" stroke={skin} strokeWidth={36 - i * 2} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={tip[0]} cy={tip[1]} r={12} fill={pale} opacity={0.85 * press} />
            <line x1={j[0] - 10} y1={j[1]} x2={j[0] + 10} y2={j[1] + 2} stroke={INK} strokeWidth={3} opacity={0.5} />
          </g>
        );
      })}
      <polyline points="-70,40 -132,-6 -150,-58" fill="none" stroke={skin} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={-150} cy={-58} r={12} fill={pale} opacity={0.85 * press} />
      <path d={palm} fill={skin} />
      <path d="M-60 -40Q-20 -60 30 -50Q56 -20 40 30Q0 50 -50 36Q-70 0 -60 -40Z" fill={pale} opacity={0.3 * press} />
      <path d="M-62 -24Q-14 -2 44 -40" fill="none" stroke={INK} strokeWidth={3} opacity={0.25} />
      {/* wrist and ragged sleeve into the dark */}
      <path d="M-72 92L-84 300L86 300L72 92Z" fill={skin} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d="M-96 170L-70 150L-50 172L-20 148L10 170L40 150L66 168L96 152L104 320L-104 320Z" fill={mix('#101210', '#2f352d', 0.6 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
    </g>
  );
};

/** grime smear: the print where it hit, plus streaks down to the hand */
const Smear: React.FC<{d: number; a: number; k: number}> = ({d, a, k}) => {
  if (a <= 0.01) return null;
  const col = '#2a1310';
  return (
    <g filter="url(#w-grime)" opacity={a}>
      <g transform={`translate(${IMPACT.x} ${IMPACT.y}) scale(${k}) rotate(-6)`}>
        {FINGERS.map(([x, y, ang, len], i) => {
          const {j, tip} = fingerPts(x, y, ang, len, 0);
          return (
            <g key={i}>
              <polyline points={`${x},${y + 30} ${j[0]},${j[1]} ${tip[0]},${tip[1]}`} fill="none" stroke={col} strokeWidth={24} strokeLinecap="round" opacity={0.42} />
              <rect x={tip[0] - 12} y={tip[1]} width={24} height={d / k + 10} rx={12} fill={col} opacity={0.5 - 0.06 * i} />
            </g>
          );
        })}
        <path d="M-86 -74Q-104 10 -78 92Q-10 116 70 96Q100 20 84 -66Q40 -94 -10 -88Q-50 -88 -86 -74Z" fill={col} opacity={0.4} />
        <rect x={-74} y={0} width={148} height={d / k + 40} rx={60} fill={col} opacity={0.32} />
        <rect x={-160} y={-58} width={22} height={d / k * 0.7 + 30} rx={11} fill={col} opacity={0.35} />
        {[[-40, 0.8], [30, 1.0], [64, 0.6]].map(([x, q], i) => (
          <rect key={`d${i}`} x={x} y={70 + d / k} width={7} height={80 * q * clamp(d / 400)} rx={3.5} fill={col} opacity={0.45} />
        ))}
      </g>
    </g>
  );
};

const Interior: React.FC<{L: number; t: number}> = ({L, t}) => {
  const warm = 0.75 + 0.05 * Math.sin(t * 3);
  const trim = mix('#0d0d10', '#4a3c2c', 0.45 * warm);
  return (
    <g>
      {/* roof liner, pillars and the door, as one frame around the glass */}
      <path d={`M-200 -200L2200 -200L2200 1300L-200 1300Z ${GLASS}`} fillRule="evenodd" fill="#0c0c10" />
      <rect x={-200} y={-200} width={2400} height={330} fill={mix('#15130f', '#5e5244', 0.5 * warm)} />
      <path d="M-200 130L2200 130" stroke={INK} strokeWidth={OW} />
      <path d="M330 690L470 150L380 130L200 700Z" fill={mix('#0f0f12', '#3b3128', 0.5 * warm)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d="M1540 130L1720 130L1760 1300L1560 1300L1540 690Z" fill={mix('#0f0f12', '#2e2620', 0.4 * warm)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d={GLASS} fill="none" stroke={INK} strokeWidth={OW + 6} strokeLinejoin="round" />
      <path d={GLASS} fill="none" stroke="#24262c" strokeWidth={6} strokeLinejoin="round" />
      {/* door panel */}
      <path d="M180 700L1560 700L1600 1300L140 1300Z" fill={trim} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <rect x={260} y={700} width={1260} height={34} fill={mix('#0a0a0c', '#2a241e', warm)} stroke={INK} strokeWidth={4} />
      <path d="M520 860Q560 800 760 800L1260 800Q1320 806 1330 860L1330 900L520 900Z" fill={mix('#0a0a0c', '#3e3328', warm)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <rect x={720} y={760} width={150} height={28} rx={12} fill="#08080a" stroke={INK} strokeWidth={4} />
      <rect x={740} y={766} width={70} height={14} rx={6} fill={mix('#222', P.chrome, 0.35 * warm)} />
      <g opacity={0.8}>
        {Array.from({length: 18}, (_, i) => <circle key={i} cx={1120 + (i % 6) * 26} cy={980 + Math.floor(i / 6) * 26} r={6} fill="#050506" />)}
      </g>
      <Glow x={150} y={420} rx={600} ry={500} rgb="255,200,120" a={0.22 * warm} id="w-dome" />
    </g>
  );
};

export const Window: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const L = flick(t);
  const hit = t - B.slam;
  const h = handheld(t, 0.9, 21);
  const j = jolt(t, [[B.slam, 26, 0.16], [B.slam + 0.05, 8, 0.25]]);
  // hand: lunges in, slams, holds, then drags down out of the window
  const inU = clamp((t - (B.slam - 0.08)) / 0.08);
  const drag = easeInOutCubic(clamp((t - (B.slam + 0.22)) / (B.smearEnd - B.slam - 0.22)));
  const HK = 1.3;
  const d = 420 * drag;
  const handS = HK * lerp(1.3, 1.0, easeOutCubic(inU));
  const handA = inU;
  const curl = clamp((t - (B.slam + 0.4)) / 0.5) * 0.6;
  const smearA = hit > 0 ? 1 : 0;
  const bodyX = IMPACT.x + 240 - 40 * clamp(hit / 0.3);
  const s = 1.06 + 0.04 * clamp(lt / 1.9) + (hit > 0 ? 0.03 * Math.exp(-hit / 0.2) : 0);
  return (
    <Frame
      x={960 + h.x + j.x}
      y={540 + h.y + j.y}
      s={s}
      r={h.r + 0.6 * vnoise(t * 7) * clamp(1 - hit / 0.5) * (hit > 0 ? 1 : 0)}
      bg="#06070c"
      defs={
        <>
          <clipPath id="w-glass"><path d={GLASS} /></clipPath>
          <filter id="w-grime" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={4} />
            <feDisplacementMap in="SourceGraphic" scale={18} />
          </filter>
        </>
      }
    >
      <g clipPath="url(#w-glass)">
        <Outside t={t} L={L} />
        {/* the shape behind the glass: head and shoulder, rim-lit by the canopy */}
        {handA > 0 && (
          <g transform={`translate(${bodyX} ${IMPACT.y + 60 + d * 0.9}) rotate(${-8 + 6 * drag})`} style={{filter: 'blur(4px)'}}>
            <path d="M-300 560Q-290 200 -80 120Q20 96 130 126Q330 200 360 560Z" fill={P.shape} />
            <path d="M-110 40Q-150 -120 -60 -200L-40 -236L-10 -206L20 -246L44 -204L84 -228L96 -180Q170 -110 130 20Q100 120 10 130Q-80 126 -110 40Z" fill={P.shape} />
            <path d="M96 -180Q170 -110 130 20M160 150Q320 230 350 460" fill="none" stroke={P.shapeRim} strokeWidth={9} opacity={0.5 * L} />
          </g>
        )}
        {/* glass: faint reflection, dust */}
        <rect x={300} y={140} width={1260} height={560} fill="#9fb4d0" opacity={0.05} />
        <path d="M520 170L700 170L520 520Z" fill="#fff" opacity={0.035} />
        <Smear d={d} a={smearA} k={HK} />
        {handA > 0 && d < 418 && (
          <g transform={`translate(${IMPACT.x} ${IMPACT.y + d}) scale(${handS}) rotate(${-6 + 4 * drag})`} opacity={handA}>
            <Hand press={hit > 0 ? 1 : 0} L={L} curl={curl} />
          </g>
        )}
      </g>
      <Interior L={L} t={t} />
      {/* flash of the hit */}
      <rect x={-200} y={-200} width={2400} height={1500} fill="#ffffff" opacity={hit > 0 ? 0.28 * Math.exp(-hit / 0.05) : 0} />
      <rect x={-200} y={-200} width={2400} height={1500} fill="#03040a" opacity={0.15 + 0.2 * (1 - L) + (easeInOutCubic(clamp((lt - 1.7) / 0.2)) * 0)} />
    </Frame>
  );
};
