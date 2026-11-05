import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {FONT, useFont} from '../thumbs/Thumbs';
import {Head, Look, LOOKS} from './Stick';

/*
 * Thumbnails for the mall Shorts, 1080x1920.
 *
 * A Short's thumbnail shows in full (9:16) on the channel's Shorts tab and the Shorts shelves,
 * but some surfaces crop it to a wide band through the middle (about 3:2). So the faces and the
 * words sit inside BAND; above and below it is only scene.
 */
const TW = 1080;
const TH = 1920;
export const BAND = {y0: (TH - TW / 1.5) / 2, y1: (TH + TW / 1.5) / 2}; // 600..1320

const INK = '#1d1a1a';
const GOLD = '#f0c53c';
const RED = '#e8433a';

const Wobble: React.FC<{id: string; seed?: number}> = ({id, seed = 1}) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={2} seed={seed} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);

/** Thick limb with an ink outline, in the rig's style (local units). */
const Limb: React.FC<{pts: Array<[number, number]>; w: number; c: string}> = ({pts, w, c}) => {
  const d = pts.map((p) => p.join(',')).join(' ');
  return (
    <>
      <polyline points={d} fill="none" stroke={INK} strokeWidth={w + 7.6} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
};

// Marcus, dead, front-on, gripping the two gate bars beside his face. Local units: head radius 28
// at the origin, bars at x = ±BAR_X.
const BAR_X = 46;
// No drawn beard: front-on, its outline reads as a grin. Stubble and a gaping mouth are drawn below.
const ZLOOK: Look = {...LOOKS.marcusZ, skin: '#8ea66c', beard: false};
const R = 28;
const ZombieFace: React.FC = () => (
  <g transform="rotate(5)">
    {/* stubble, and patches of decay */}
    <path d={`M ${-R * 0.86} ${R * 0.12} Q ${-R * 0.8} ${R * 0.9} 0 ${R * 0.95} Q ${R * 0.8} ${R * 0.9} ${R * 0.86} ${R * 0.12} Q ${R * 0.45} ${R * 0.5} 0 ${R * 0.52} Q ${-R * 0.45} ${R * 0.5} ${-R * 0.86} ${R * 0.12} Z`} fill="#2b3320" opacity={0.42} />
    <ellipse cx={-19} cy={2} rx={4} ry={3} fill="#5d6e45" opacity={0.7} />
    <ellipse cx={17} cy={6} rx={3.2} ry={2.4} fill="#5d6e45" opacity={0.7} />
    {/* gaping mouth with broken teeth */}
    <path d="M -9.5 9.5 Q 0 7 9.5 10 L 7.5 22 Q 0 26.5 -7 22.5 Z" fill="#2a1212" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    <path d="M -7 21 Q 0 24 6 21.5 L 5.5 23.5 Q 0 25.5 -6.5 23.2 Z" fill="#6b2a2a" />
    {[-6.5, -2.2, 2.3, 6.4].map((x, i) => (
      <path key={x} d={`M ${x - 1.8} ${9.3 + (i === 2 ? 0.4 : 0)} L ${x + 1.8} ${9.3 + (i === 2 ? 0.4 : 0)} L ${x + 1.2} ${i % 2 ? 13 : 12} L ${x - 1.4} ${i % 2 ? 12.6 : 13.4} Z`} fill="#e9e4c8" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
    ))}
    <path d="M 3 22.8 L 4.6 20 L 6 22.4 Z M -5 23 L -3.6 20.4 L -2.4 23.4 Z" fill="#e9e4c8" stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
  </g>
);
const ZombieMarcus: React.FC = () => {
  const skin = ZLOOK.skin as string;
  const shirt = ZLOOK.shirt as string;
  const arm = (sx: number) => {
    const sh: [number, number] = [46 * sx, 50];
    const el: [number, number] = [70 * sx, 74];
    const fist: [number, number] = [BAR_X * sx, 30];
    const sleeveEnd: [number, number] = [sh[0] + (el[0] - sh[0]) * 0.7, sh[1] + (el[1] - sh[1]) * 0.7];
    return (
      <g key={sx}>
        <Limb pts={[el, fist]} w={11} c={skin} />
        <Limb pts={[sh, el]} w={14.5} c={skin} />
        <Limb pts={[sh, sleeveEnd]} w={17} c={shirt} />
      </g>
    );
  };
  return (
    <g filter="url(#t1Wob)">
      {/* neck and torn uniform */}
      <rect x={-6.5} y={18} width={13} height={28} fill={skin} stroke={INK} strokeWidth={4.2} />
      {arm(-1)}
      {arm(1)}
      <path d="M -66 170 L -61 62 Q -57 45 -32 40 L 32 40 Q 57 45 61 62 L 66 170 Z" fill={shirt} stroke={INK} strokeWidth={4.2} strokeLinejoin="round" />
      <path d="M -32 40 Q -57 45 -61 62 L -66 170 L -36 170 L -30 52 Z" fill="#000" opacity={0.15} />
      <path d="M -15 40 L -4 54 L -22 50 Z M 15 40 L 4 54 L 22 50 Z" fill="#26375e" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M 18 92 l 5 6 l -3 5 l 6 7 M -40 104 l 6 4 l -2 6 l 7 5" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      {/* radio, still on, and the badge */}
      <g transform="translate(-26 70)">
        <line x1={4} y1={-9} x2={4} y2={-24} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
        <rect x={-7} y={-10} width={15} height={22} rx={3} fill="#262629" stroke={INK} strokeWidth={2.6} />
        <rect x={-3.5} y={-6} width={8} height={5.5} fill="#8fd18a" />
      </g>
      <path transform="translate(26 66) scale(1.6)" d="M 0 -6 L 5 -3.5 L 4 3.5 L 0 7 L -4 3.5 L -5 -3.5 Z" fill="#e0b94a" stroke={INK} strokeWidth={1.6} />
      <Head c={[0, 0]} tilt={5} look={ZLOOK} eyes="zombie" mouth="none" gaze={0} back={false} front ghost={false} ink={INK} />
      <ZombieFace />
    </g>
  );
};

/** The fists round the bars, drawn over them (local units). */
const ZombieFists: React.FC = () => (
  <g filter="url(#t1Wob)">
    {[-1, 1].map((sx) => (
      <g key={sx} transform={`translate(${BAR_X * sx} 30)`}>
        <rect x={-10} y={-8} width={20} height={16} rx={7} fill={ZLOOK.skin} stroke={INK} strokeWidth={3.4} />
        {[-4.5, 0, 4.5].map((dx) => (
          <line key={dx} x1={dx} y1={-6} x2={dx} y2={1} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        ))}
      </g>
    ))}
  </g>
);

/** Two gate bars and the rails that hold them (local units). */
const Bars: React.FC = () => (
  <g>
    {[-1, 1].map((sx) => (
      <g key={sx}>
        <rect x={BAR_X * sx - 4} y={-200} width={8} height={420} fill="url(#t1Steel)" stroke={INK} strokeWidth={2.4} />
      </g>
    ))}
    {[-52, 132].map((y) => (
      <rect key={y} x={-120} y={y} width={240} height={8} fill="url(#t1SteelH)" stroke={INK} strokeWidth={2.4} />
    ))}
  </g>
);

/** Outlined headline line; `parts` lets one line mix colours. */
const Headline: React.FC<{x: number; y: number; size: number; parts: Array<[string, string]>; rot?: number}> = ({x, y, size, parts, rot = 0}) => {
  const common = {
    x,
    y,
    textAnchor: 'middle' as const,
    fontFamily: FONT,
    fontSize: size,
    strokeWidth: size * 0.17,
    strokeLinejoin: 'round' as const,
    paintOrder: 'stroke',
    letterSpacing: '0.02em',
  };
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <text {...common} fill="#05070c" stroke="#05070c" transform={`translate(${size * 0.05} ${size * 0.075})`}>
        {parts.map(([t]) => t).join('')}
      </text>
      <text {...common} stroke={INK}>
        {parts.map(([t, c], i) => (
          <tspan key={i} fill={c}>
            {t}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ Short 1: The Gate
export const NightGuardShort1Thumb: React.FC = () => {
  useFont();
  const MX = 540; // Marcus's head centre
  const MY = 838;
  const S = 7.15; // px per rig unit (head radius 200 px)
  const hand = {x: 214, y: 1590}; // Danny's flashlight hand, bottom left
  const lens = {x: 300, y: 1470};
  return (
    <AbsoluteFill style={{background: '#070a12', overflow: 'hidden'}}>
      <svg width={TW} height={TH} viewBox={`0 0 ${TW} ${TH}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <Wobble id="t1Wob" seed={9} />
          <linearGradient id="t1Steel" x1={0} y1={0} x2={1} y2={0}>
            <stop offset={0} stopColor="#1f2530" />
            <stop offset={0.35} stopColor="#7f8a9b" />
            <stop offset={0.55} stopColor="#c3cbd6" />
            <stop offset={1} stopColor="#2a313d" />
          </linearGradient>
          <linearGradient id="t1SteelH" x1={0} y1={0} x2={0} y2={1}>
            <stop offset={0} stopColor="#2a313d" />
            <stop offset={0.4} stopColor="#9aa5b4" />
            <stop offset={1} stopColor="#1f2530" />
          </linearGradient>
          <radialGradient id="t1Alarm" cx={MX} cy={MY - 40} r={640} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor="#ff4632" stopOpacity={0.68} />
            <stop offset={0.5} stopColor="#c8261c" stopOpacity={0.22} />
            <stop offset={1} stopColor="#c8261c" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="t1Dark" cx={MX} cy={MY + 120} r={1050} gradientUnits="userSpaceOnUse">
            <stop offset={0.32} stopColor="#04060b" stopOpacity={0} />
            <stop offset={0.7} stopColor="#04060b" stopOpacity={0.6} />
            <stop offset={1} stopColor="#04060b" stopOpacity={0.9} />
          </radialGradient>
          <radialGradient id="t1Spot" cx={MX - 40} cy={MY + 40} r={330} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor="#fff3cc" stopOpacity={0.16} />
            <stop offset={1} stopColor="#fff3cc" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="t1Beam" x1={lens.x} y1={lens.y} x2={MX} y2={MY} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor="#fff6cf" stopOpacity={0.6} />
            <stop offset={1} stopColor="#fff6cf" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="t1Lens" cx={0.5} cy={0.5} r={0.5}>
            <stop offset={0} stopColor="#ffffff" stopOpacity={1} />
            <stop offset={0.22} stopColor="#fff3c4" stopOpacity={0.95} />
            <stop offset={1} stopColor="#fff3c4" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* the concourse behind him, out of focus, and the red of an alarm light */}
        <image
          href={staticFile('mall/bg/concourse.jpg')}
          x={(TW - TH * (2816 / 1584)) / 2}
          y={0}
          width={TH * (2816 / 1584)}
          height={TH}
          style={{filter: 'blur(8px) brightness(0.6) saturate(1.2)'}}
        />
        <rect x={0} y={0} width={TW} height={TH} fill="#0a1838" opacity={0.4} />
        <rect x={0} y={0} width={TW} height={TH} fill="url(#t1Alarm)" />

        <g transform={`translate(${MX} ${MY}) scale(${S})`}>
          <ZombieMarcus />
          <Bars />
          <ZombieFists />
        </g>
        <rect x={0} y={0} width={TW} height={TH} fill="url(#t1Spot)" style={{mixBlendMode: 'screen'}} />
        <rect x={0} y={0} width={TW} height={TH} fill="url(#t1Dark)" />

        {/* Danny's flashlight, from the bottom left */}
        <polygon points={`${lens.x - 30},${lens.y + 10} ${MX - 300},${MY - 120} ${MX + 260},${MY + 60} ${lens.x + 30},${lens.y + 30}`} fill="url(#t1Beam)" style={{mixBlendMode: 'screen'}} />
        <g filter="url(#t1Wob)">
          <Limb pts={[[-60, 2010], [hand.x, hand.y]]} w={70} c="#d6a17a" />
          <g transform={`translate(${hand.x} ${hand.y}) rotate(${(Math.atan2(lens.x - hand.x, -(lens.y - hand.y)) * 180) / Math.PI})`}>
            <rect x={-30} y={-175} width={60} height={150} rx={14} fill="#2a2a2e" stroke={INK} strokeWidth={14} />
            <rect x={-40} y={-200} width={80} height={46} rx={10} fill="#3b3b40" stroke={INK} strokeWidth={14} />
            <circle cx={0} cy={0} r={46} fill="#d6a17a" stroke={INK} strokeWidth={14} />
          </g>
        </g>
        <circle cx={lens.x} cy={lens.y} r={150} fill="url(#t1Lens)" style={{mixBlendMode: 'screen'}} />

        {/* the words, inside the band every crop keeps */}
        <Headline x={TW / 2} y={1158} size={136} parts={[['MY BEST', '#ffffff']]} rot={-3} />
        <Headline x={TW / 2} y={1306} size={188} parts={[['FRIEND', GOLD], ['?!', RED]]} rot={-3} />

        {/* series tag, top (scene only, fine to lose in a crop) */}
        <text x={TW / 2} y={168} textAnchor="middle" fontFamily={FONT} fontSize={56} fill={GOLD} stroke={INK} strokeWidth={9} paintOrder="stroke" letterSpacing="0.04em">
          THE NIGHT GUARD
        </text>
        <rect x={TW / 2 - 92} y={196} width={184} height={58} rx={29} fill="#0f1218" stroke={INK} strokeWidth={5} opacity={0.92} />
        <text x={TW / 2} y={238} textAnchor="middle" fontFamily={FONT} fontSize={38} fill="#eef1f6" letterSpacing="0.06em">
          PART 1
        </text>
      </svg>
    </AbsoluteFill>
  );
};
