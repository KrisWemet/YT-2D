// Shot 1 (0.0-5.0 s): night, a gas station off a dark highway, lights flickering, a pickup and
// trailer parked crooked at the pumps with the driver door hanging open. Slow push-in.
import React from 'react';
import {B, Frame, Glow, INK, OW, P, flick, handheld, hash, mix, vnoise} from './kit';
import {clamp, easeInOutSine, lerp} from '../pigeon/lib';

const HZ = 600; // horizon

// ---------------------------------------------------------------- background
const Sky: React.FC<{t: number}> = ({t}) => {
  const stars = [];
  for (let i = 0; i < 70; i++) {
    const x = -300 + hash(i * 3.3) * 2500;
    const y = -250 + hash(i * 7.1) * 760;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + hash(i) * 3) + i);
    stars.push(<circle key={i} cx={x} cy={y} r={1 + hash(i * 1.7) * 1.6} fill="#dfe6ff" opacity={0.25 + 0.5 * tw * hash(i * 5.5)} />);
  }
  const cloudX = (base: number, sp: number) => base + t * sp;
  return (
    <>
      <defs>
        <linearGradient id="e-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.skyTop} />
          <stop offset="70%" stopColor="#0d1530" />
          <stop offset="100%" stopColor={P.skyBot} />
        </linearGradient>
        <linearGradient id="e-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3a63" stopOpacity={0} />
          <stop offset="60%" stopColor="#2a3a63" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#2a3a63" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-400} y={-400} width={2800} height={HZ + 420} fill="url(#e-sky)" />
      {stars}
      {/* moon behind thin cloud */}
      <Glow x={300} y={140} rx={170} rgb="190,205,255" a={0.35} id="e-moon" />
      <circle cx={300} cy={140} r={40} fill="#e9e7d2" />
      <circle cx={318} cy={128} r={38} fill="#0b1228" />
      {[[cloudX(80, 9), 150, 1], [cloudX(700, 6), 90, 0.8], [cloudX(1400, 7), 210, 1.1], [cloudX(-500, 8), 60, 0.9]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.9}>
          <path d="M-220 20Q-200 -14 -150 -6Q-120 -40 -60 -26Q-20 -56 40 -30Q90 -46 130 -14Q190 -16 220 20Z" fill="#111a36" />
          <path d="M-150 -6Q-120 -40 -60 -26Q-20 -56 40 -30Q90 -46 130 -14" fill="none" stroke="#2b3a66" strokeWidth={3} opacity={0.7} />
        </g>
      ))}
    </>
  );
};

const Treeline: React.FC = () => {
  const pts: string[] = [`M-400 ${HZ + 30}`];
  for (let x = -400; x <= 2400; x += 26) {
    const h = 25 + hash(x * 0.37) * 55 + (x > 1650 ? 25 : 0);
    pts.push(`L${x} ${HZ + 5 - h * 0.25}L${x + 13} ${HZ - h}L${x + 26} ${HZ + 5 - h * 0.25}`);
  }
  pts.push(`L2400 ${HZ + 30}Z`);
  return (
    <>
      <path d={`M-400 ${HZ}Q300 ${HZ - 70} 900 ${HZ - 30}Q1500 ${HZ - 90} 2400 ${HZ - 20}L2400 ${HZ + 40}L-400 ${HZ + 40}Z`} fill={P.far} />
      <path d={pts.join('')} fill={P.trees} />
      <rect x={-400} y={HZ - 70} width={2800} height={130} fill="url(#e-haze)" />
    </>
  );
};

const PowerLine: React.FC = () => {
  const poles = [-60, 520, 1100, 1680, 2260];
  return (
    <g>
      {poles.map((x, i) => (
        <g key={i}>
          <rect x={x - 4} y={HZ - 150} width={8} height={160} fill="#05070f" />
          <rect x={x - 34} y={HZ - 140} width={68} height={6} fill="#05070f" />
        </g>
      ))}
      {poles.slice(0, -1).map((x, i) => (
        <g key={i} fill="none" stroke="#05070f" strokeWidth={2}>
          <path d={`M${x - 30} ${HZ - 138}Q${x + 290} ${HZ - 95} ${poles[i + 1] - 30} ${HZ - 138}`} />
          <path d={`M${x + 30} ${HZ - 138}Q${x + 290} ${HZ - 98} ${poles[i + 1] + 30} ${HZ - 138}`} />
        </g>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- station building (with the side ladder)
const Station: React.FC<{L: number; t: number}> = ({L, t}) => {
  const front = mix(P.block, P.blockLit, 0.18 * L);
  const side = mix('#2c2d36', '#5d5a52', 0.15 * L);
  const win = 0.25 + 0.75 * L;
  const lamp = clamp(flick(t + 0.37) * 1.05);
  const rows = [];
  for (let y = 545; y < 745; y += 20) rows.push(<line key={y} x1={1180} y1={y} x2={1760} y2={y} stroke={INK} strokeOpacity={0.18} strokeWidth={2} />);
  const sign = 'GAS · FOOD · ICE';
  const dead = [2, 9, 13];
  return (
    <g>
      {/* side wall in perspective with the roof ladder */}
      <path d="M1180 520L1180 745L1100 738L1100 532Z" fill={side} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <g stroke={mix(P.rustDark, P.rust, 0.4 + 0.4 * lamp)} strokeWidth={4} strokeLinecap="round">
        <line x1={1128} y1={545} x2={1128} y2={738} />
        <line x1={1150} y1={543} x2={1150} y2={740} />
        {Array.from({length: 11}, (_, i) => <line key={i} x1={1128} y1={556 + i * 17} x2={1150} y2={555 + i * 17} strokeWidth={3} />)}
      </g>
      <path d="M1116 528L1132 528L1132 540L1116 540Z" fill={INK} />
      <Glow x={1124} y={536} rx={80} rgb={P.lamp} a={0.55 * lamp} id="e-sidelamp" />
      <circle cx={1124} cy={536} r={5} fill={`rgb(${P.lamp})`} opacity={0.3 + 0.7 * lamp} />
      {/* front */}
      <rect x={1180} y={525} width={580} height={220} fill={front} stroke={INK} strokeWidth={OW} />
      {rows}
      <rect x={1170} y={510} width={600} height={22} fill={mix('#3a3c46', '#8a8f95', 0.2 * L)} stroke={INK} strokeWidth={OW} />
      {/* storefront window: dim shelves inside */}
      <rect x={1270} y={598} width={290} height={124} fill={mix('#2a2a20', '#f4e7b0', 0.85 * win)} stroke={INK} strokeWidth={OW} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={1285 + i * 92} y={640} width={70} height={82} fill={mix('#141410', '#6f6a52', win)} />
          <rect x={1285 + i * 92} y={662} width={70} height={4} fill={INK} opacity={0.5} />
          <rect x={1285 + i * 92} y={690} width={70} height={4} fill={INK} opacity={0.5} />
        </g>
      ))}
      <line x1={1415} y1={598} x2={1415} y2={722} stroke={INK} strokeWidth={4} />
      <Glow x={1415} y={700} rx={260} ry={110} rgb="244,231,176" a={0.22 * win} id="e-store" />
      {/* door */}
      <rect x={1592} y={612} width={74} height={133} fill={mix('#1e1e18', '#d9cc96', 0.7 * win)} stroke={INK} strokeWidth={OW} />
      <line x1={1600} y1={680} x2={1612} y2={680} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      {/* roof sign with dead letters */}
      <rect x={1300} y={462} width={340} height={50} rx={6} fill="#0e1018" stroke={INK} strokeWidth={OW} />
      <text x={1470} y={499} textAnchor="middle" fontFamily="Bebas Neue, Impact, sans-serif" fontSize={40} letterSpacing={4}>
        {sign.split('').map((ch, i) => (
          <tspan key={i} fill={dead.includes(i) ? '#2a1a18' : mix('#3a1612', '#ff5a3c', 0.35 + 0.65 * L)}>{ch}</tspan>
        ))}
      </text>
      <Glow x={1470} y={487} rx={230} ry={50} rgb="255,90,60" a={0.25 * L} id="e-sign" />
    </g>
  );
};

// ---------------------------------------------------------------- price sign, canopy, pumps
const PriceSign: React.FC<{L: number}> = ({L}) => (
  <g>
    <rect x={325} y={400} width={14} height={380} fill="#11131b" stroke={INK} strokeWidth={4} />
    <rect x={240} y={300} width={184} height={128} rx={8} fill={mix('#1a1d26', '#d7dcd8', 0.75 * L)} stroke={INK} strokeWidth={OW} />
    <rect x={240} y={300} width={184} height={42} rx={8} fill={mix('#3a1212', '#d23a2a', 0.8 * L)} stroke={INK} strokeWidth={OW} />
    <text x={332} y={334} textAnchor="middle" fontFamily="Bebas Neue, Impact, sans-serif" fontSize={34} fill={mix('#2a2a2a', '#ffffff', L)} letterSpacing={3}>GAS</text>
    <rect x={256} y={352} width={152} height={62} rx={4} fill="#0a0b0e" />
    <text x={332} y={402} textAnchor="middle" fontFamily="Bebas Neue, Impact, sans-serif" fontSize={56} letterSpacing={4}>
      <tspan fill="#ff3b2a">3</tspan><tspan fill="#ff3b2a">.</tspan><tspan fill="#3a1410">8</tspan><tspan fill="#ff3b2a">9</tspan>
    </text>
    <Glow x={332} y={364} rx={170} ry={120} rgb="235,240,236" a={0.22 * L} id="e-price" />
  </g>
);

const Pump: React.FC<{x: number; L: number; hose?: 'hang' | 'ground'}> = ({x, L, hose = 'hang'}) => {
  const c = mix('#2a2f3a', '#c9cfd2', 0.8 * L);
  return (
    <g>
      <rect x={x - 70} y={790} width={140} height={18} fill={mix('#2a2e36', '#bfc4c0', 0.8 * L)} stroke={INK} strokeWidth={OW} />
      <rect x={x - 70} y={790} width={140} height={6} fill={mix('#3a3418', '#e2c63a', 0.85 * L)} />
      <rect x={x - 34} y={676} width={68} height={114} rx={6} fill={c} stroke={INK} strokeWidth={OW} />
      <rect x={x - 34} y={676} width={68} height={22} rx={6} fill={mix('#3a1212', '#cf3a2c', 0.8 * L)} stroke={INK} strokeWidth={4} />
      <rect x={x - 22} y={706} width={44} height={22} rx={3} fill={mix('#0c1410', '#3c8a5a', 0.6 + 0.4 * L)} stroke={INK} strokeWidth={3} />
      <rect x={x + 30} y={730} width={14} height={20} rx={3} fill={INK} />
      {hose === 'hang' ? (
        <path d={`M${x + 40} 748Q${x + 64} 790 ${x + 42} 770`} fill="none" stroke={INK} strokeWidth={6} />
      ) : (
        <>
          <path d={`M${x + 40} 748Q${x + 90} 800 ${x + 160} 868`} fill="none" stroke={INK} strokeWidth={6} />
          <path d={`M${x + 150} 862l30 4l-4 12l-30 -6z`} fill="#1b1d22" stroke={INK} strokeWidth={3} />
        </>
      )}
    </g>
  );
};

const Canopy: React.FC<{L: number; t: number}> = ({L, t}) => {
  const tubes = [500, 655, 810, 965];
  const moths = [];
  for (let i = 0; i < 7; i++) {
    const tx = tubes[i % 4];
    const a = t * (5 + hash(i) * 4) + i * 2;
    moths.push(<circle key={i} cx={tx + Math.cos(a) * (18 + 12 * hash(i * 2))} cy={530 + Math.sin(a * 1.3) * 12} r={2.2} fill="#f2f2e0" opacity={0.75 * L} />);
  }
  return (
    <g>
      {[470, 1040].map((x) => (
        <rect key={x} x={x - 16} y={515} width={32} height={285} fill={mix('#2a2e38', '#c3c8c6', 0.65 * L)} stroke={INK} strokeWidth={OW} />
      ))}
      {/* underside (seen from below the horizon line) */}
      <path d="M400 503L1110 503L1080 530L430 530Z" fill={mix('#151821', '#e2e8e4', 0.75 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      {tubes.map((x) => (
        <rect key={x} x={x - 52} y={511} width={104} height={9} rx={3} fill={mix('#202630', P.tube, L)} />
      ))}
      {/* fascia */}
      <rect x={392} y={448} width={726} height={58} fill={mix('#2b2f37', '#e9ece8', 0.55 + 0.25 * L)} stroke={INK} strokeWidth={OW} />
      <rect x={392} y={474} width={726} height={12} fill={mix('#3a1414', '#d03a2b', 0.55 + 0.3 * L)} />
      {tubes.map((x, i) => <Glow key={x} x={x} y={522} rx={170} ry={90} rgb={P.tubeGlow} a={0.75 * L} id={`e-tube${i}`} />)}
      {moths}
    </g>
  );
};

// ---------------------------------------------------------------- pickup + trailer
const Wheel: React.FC<{x: number; y: number; r: number; L: number; turned?: boolean}> = ({x, y, r, L, turned}) => (
  <g>
    {turned ? (
      <>
        <ellipse cx={x} cy={y} rx={r * 0.62} ry={r} fill="#0d0e12" stroke={INK} strokeWidth={OW} />
        <ellipse cx={x - r * 0.18} cy={y} rx={r * 0.5} ry={r * 0.92} fill="#18191e" />
        {[-0.6, -0.3, 0, 0.3, 0.6].map((k) => <line key={k} x1={x - r * 0.52} y1={y + k * r} x2={x - r * 0.1} y2={y + k * r} stroke="#2a2b31" strokeWidth={3} />)}
      </>
    ) : (
      <>
        <circle cx={x} cy={y} r={r} fill="#0d0e12" stroke={INK} strokeWidth={OW} />
        <circle cx={x} cy={y} r={r * 0.55} fill={mix('#3a3f48', '#b7c0c6', 0.6 * L)} stroke={INK} strokeWidth={4} />
        <circle cx={x} cy={y} r={r * 0.18} fill="#222" />
      </>
    )}
  </g>
);

const Pickup: React.FC<{L: number; t: number}> = ({L, t}) => {
  const lit = 0.45 * L;
  const body = mix(P.truckDark, P.truckLit, lit);
  const top = mix(P.truckDark, P.truckLit, 0.25 + 0.6 * L);
  const dome = 0.85 + 0.15 * Math.sin(t * 2);
  return (
    // local: x 0 = front bumper, y 0 = ground; tilted = parked crooked
    <g transform="translate(560 852) rotate(-2.2)">
      <ellipse cx={215} cy={2} rx={250} ry={12} fill="#000" opacity={0.45} />
      {/* headlight beam left along the lot */}
      <g style={{mixBlendMode: 'screen'}}>
        <defs>
          <linearGradient id="e-beam" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#fff3c8" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#fff3c8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d="M2 -64L-420 -120L-470 20L2 -44Z" fill="url(#e-beam)" />
      </g>
      {/* trailer (jackknifed: tilted back and away) */}
      <g transform="translate(438 -8) rotate(4.5)">
        <line x1={-30} y1={-36} x2={10} y2={-40} stroke={INK} strokeWidth={8} />
        <rect x={6} y={-112} width={250} height={74} fill={mix('#2c2418', '#8f7a52', 0.35 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
        {[70, 140, 200].map((x) => <line key={x} x1={6 + x} y1={-112} x2={6 + x} y2={-38} stroke={INK} strokeWidth={3} opacity={0.6} />)}
        <path d="M20 -112Q40 -168 120 -160Q210 -172 244 -112Z" fill={mix('#141c22', '#3d5560', 0.3 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
        <path d="M60 -150L80 -112M150 -164L150 -112" stroke={INK} strokeWidth={3} opacity={0.6} />
        <Wheel x={130} y={-26} r={26} L={L} />
        <rect x={244} y={-70} width={14} height={14} fill={mix('#3a0808', '#ff2a1a', 0.5)} stroke={INK} strokeWidth={3} />
      </g>
      {/* body */}
      <path
        d="M-4 -44L-4 -92Q-2 -106 20 -108L132 -112L168 -176L258 -178L262 -114L432 -114L436 -44Z"
        fill={body} stroke={INK} strokeWidth={OW} strokeLinejoin="round"
      />
      <path d="M20 -108L132 -112L168 -176L258 -178L262 -114L432 -114" fill="none" stroke={top} strokeWidth={6} strokeLinejoin="round" transform="translate(0 4)" opacity={0.9} />
      {/* bed rail + tail light */}
      <line x1={262} y1={-104} x2={432} y2={-104} stroke={INK} strokeWidth={4} opacity={0.6} />
      <rect x={424} y={-104} width={12} height={26} fill={mix('#3a0808', '#ff2a1a', 0.55)} stroke={INK} strokeWidth={3} />
      {/* open cab: warm dome light on, seat and wheel inside */}
      <path d="M140 -112L170 -168L252 -170L254 -48L140 -48Z" fill={mix('#3a2a16', '#ffd38a', 0.75 * dome)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d="M206 -134Q236 -142 248 -128L250 -56L210 -56Z" fill="#6b4a2c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <ellipse cx={168} cy={-112} rx={9} ry={24} fill="none" stroke="#2a2018" strokeWidth={7} transform="rotate(-18 168 -112)" />
      <Glow x={200} y={-120} rx={120} ry={90} rgb="255,206,130" a={0.55 * dome} id="e-dome" />
      <Glow x={190} y={6} rx={120} ry={22} rgb="255,206,130" a={0.45 * dome} id="e-domefloor" />
      {/* windshield */}
      <path d="M134 -114L166 -170L172 -170L142 -114Z" fill={mix('#131a26', '#5d6f86', 0.4 * L)} />
      {/* driver door hanging open toward camera (~50 deg): hangs below the body line */}
      <g>
        <path d="M138 -174L213 -162L215 -12L140 -46Z" fill={mix(P.truckDark, P.truckLit, 0.3 + 0.2 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
        <path d="M144 -167L207 -157L207 -106L144 -114Z" fill={mix('#3a2a16', '#ffcf85', 0.55 * dome)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M150 -160L178 -156L150 -124Z" fill="#fff" opacity={0.18} />
        <line x1={142} y1={-96} x2={212} y2={-84} stroke={INK} strokeWidth={3} opacity={0.5} />
        <rect x={196} y={-82} width={14} height={7} rx={3} fill={mix('#222', P.chrome, 0.5 * L)} />
        <path d="M136 -150l-22 -4l0 22l20 2z" fill="#191b20" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      {/* hood line, grille, bumper, headlight */}
      <line x1={22} y1={-98} x2={130} y2={-102} stroke={INK} strokeWidth={3} opacity={0.6} />
      <rect x={-10} y={-62} width={24} height={20} rx={4} fill={mix('#3a3d44', P.chrome, 0.6 * L)} stroke={INK} strokeWidth={4} />
      <rect x={-4} y={-90} width={16} height={18} rx={3} fill="#fff6d0" stroke={INK} strokeWidth={3} />
      {/* wheel wells + wheels */}
      <path d="M38 -44A42 42 0 0 1 120 -44Z" fill={INK} />
      <path d="M306 -44A42 42 0 0 1 388 -44Z" fill={INK} />
      <Wheel x={78} y={-34} r={34} L={L} turned />
      <Wheel x={347} y={-34} r={34} L={L} />
    </g>
  );
};

/** A tipped jerry can + puddle (tiny, wide shot). */
const SmallCan: React.FC<{L: number}> = ({L}) => (
  <g transform="translate(1010 872) rotate(-8)">
    <ellipse cx={-28} cy={6} rx={60} ry={9} fill="#0a0c10" opacity={0.85} />
    <ellipse cx={-38} cy={6} rx={34} ry={5} fill={mix('#1c2030', '#6d7690', 0.4 * L)} opacity={0.7} />
    <rect x={-6} y={-16} width={42} height={22} rx={4} fill={mix('#3e0e0b', '#c4291d', 0.5 * L)} stroke={INK} strokeWidth={4} />
    <rect x={-14} y={-10} width={10} height={8} fill="#222" stroke={INK} strokeWidth={3} />
  </g>
);

/** The first shape, at the edge of the light. */
const Shape: React.FC<{t: number; L: number}> = ({t, L}) => {
  const u = clamp((t - B.shapeIn) / 2.6);
  if (u <= 0) return null;
  const x = lerp(70, 140, easeInOutSine(u)) + 3 * Math.sin(t * 3.1);
  const sway = 3 * Math.sin(t * 2.2);
  return (
    <g transform={`translate(${x} 742) rotate(${sway})`} opacity={clamp(u * 3)}>
      <path d="M-20 0L-16 -58Q-30 -70 -24 -92Q-12 -104 4 -100Q22 -96 22 -76L30 -60L36 -18L28 -22L20 -50L18 0Z" fill={P.shape} />
      <circle cx={-6} cy={-108} r={13} fill={P.shape} />
      <path d="M20 -94Q30 -78 32 -58" fill="none" stroke={P.shapeRim} strokeWidth={2.5} opacity={0.35 * L} />
      <path d="M4 -120Q16 -114 14 -100" fill="none" stroke={P.shapeRim} strokeWidth={2.5} opacity={0.35 * L} />
    </g>
  );
};

const Road: React.FC<{L: number}> = ({L}) => {
  const dashes = [];
  for (let x = -400; x < 2400; x += 150) dashes.push(<rect key={x} x={x} y={944} width={86} height={7} fill="#7a6a2a" />);
  const joints = [];
  for (let x = -300; x < 2300; x += 140) joints.push(<line key={x} x1={x} y1={705} x2={x - 60} y2={872} stroke={INK} strokeOpacity={0.35} strokeWidth={2} />);
  return (
    <g>
      <rect x={-400} y={HZ + 30} width={2800} height={90} fill="#070b15" />
      <rect x={-400} y={700} width={2800} height={175} fill={P.concrete} />
      {joints}
      <line x1={-400} y1={790} x2={2400} y2={790} stroke={INK} strokeOpacity={0.3} strokeWidth={2} />
      {/* light pool under the canopy */}
      <g style={{mixBlendMode: 'screen'}}>
        <defs>
          <radialGradient id="e-pool">
            <stop offset="0%" stopColor="#cfeee2" stopOpacity={0.55 * L} />
            <stop offset="60%" stopColor="#cfeee2" stopOpacity={0.2 * L} />
            <stop offset="100%" stopColor="#cfeee2" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={755} cy={800} rx={560} ry={110} fill="url(#e-pool)" />
      </g>
      <rect x={-400} y={875} width={2800} height={12} fill="#141821" />
      <rect x={-400} y={887} width={2800} height={128} fill={P.asphalt} />
      <rect x={-400} y={893} width={2800} height={5} fill="#5d6268" opacity={0.7} />
      <rect x={-400} y={1004} width={2800} height={5} fill="#5d6268" opacity={0.6} />
      {dashes}
      <rect x={-400} y={1015} width={2800} height={400} fill="#080b10" />
    </g>
  );
};

const Weeds: React.FC<{t: number}> = ({t}) => {
  const blades = [];
  for (let i = 0; i < 60; i++) {
    const x = -200 + i * 40 + hash(i) * 30;
    const h = 40 + hash(i * 3) * 110;
    const bend = 10 * vnoise(t * 0.7 + i * 0.3) + 8;
    blades.push(<path key={i} d={`M${x} 1140Q${x + bend * 0.5} ${1140 - h * 0.6} ${x + bend} ${1140 - h}`} fill="none" stroke="#020306" strokeWidth={7 + hash(i * 7) * 6} strokeLinecap="round" />);
  }
  return <g style={{filter: 'blur(3px)'}}>{blades}</g>;
};

export const Establish: React.FC<{t: number}> = ({t}) => {
  const L = flick(t);
  const u = easeInOutSine(clamp(t / 5));
  const h = handheld(t, 0.35, 3);
  const cx = lerp(990, 860, u) + h.x;
  const cy = lerp(640, 720, u) + h.y;
  const s = lerp(1.0, 1.16, u);
  return (
    <Frame x={cx} y={cy} s={s} r={h.r} bg={P.skyTop}>
      <Sky t={t} />
      <PowerLine />
      <Treeline />
      <Road L={L} />
      <Shape t={t} L={L} />
      <PriceSign L={L} />
      <Station L={L} t={t} />
      <Pump x={580} L={L} />
      <Pump x={920} L={L} />
      <Canopy L={L} t={t} />
      <SmallCan L={L} />
      <Pickup L={L} t={t} />
      <Weeds t={t} />
    </Frame>
  );
};
