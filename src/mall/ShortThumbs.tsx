import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {FONT, useFont} from '../thumbs/Thumbs';
import {jointsOf, LOOKS, Pose, POSES, Stick} from './Stick';

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

// Same Marcus rig as the episode. The head is the thumbnail's local origin and
// this pose puts both hands on the existing gate bars at (±46, 30).
const BAR_X = 46;
const grip: Pose = {...POSES.frontStand, head: 5, armF: [-50.8, -175.1], armN: [51.3, 171.6]};
const {head} = jointsOf(grip, 0, 0, 300);
const thumbLook = {...LOOKS.marcusZ, skin: '#8ea66c', beard: false};
const ZombieMarcus: React.FC = () => (
  <Stick x={-head[0]} y={-head[1]} h={300} look={thumbLook} pose={grip}
    front eyes="zombie" mouth="zombie" shadow={0} wobble={9} />
);

// The hands wrap in front of the bars, the rest of Marcus stays behind them.
const ZombieFists: React.FC = () => (
  <g filter="url(#t1Wob)" stroke={INK} strokeWidth={2.2} fill={thumbLook.skin}>
    {[-BAR_X, BAR_X].map((x) => <circle key={x} cx={x} cy={30} r={5.5} />)}
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
          <g strokeLinecap="round">
            <line x1={-60} y1={2010} x2={hand.x} y2={hand.y} stroke={INK} strokeWidth={60} />
            <line x1={-60} y1={2010} x2={hand.x} y2={hand.y} stroke={INK} strokeWidth={36} />
          </g>
          <g transform={`translate(${hand.x} ${hand.y}) rotate(${(Math.atan2(lens.x - hand.x, -(lens.y - hand.y)) * 180) / Math.PI})`}>
            <rect x={-30} y={-175} width={60} height={150} rx={14} fill="#2a2a2e" stroke={INK} strokeWidth={14} />
            <rect x={-40} y={-200} width={80} height={46} rx={10} fill="#3b3b40" stroke={INK} strokeWidth={14} />
            <circle cx={0} cy={0} r={28} fill={LOOKS.guard.skin} stroke={INK} strokeWidth={9} />
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

// ------------------------------------------------------------------ Short 2: Forty-Two Keys
export const NightGuardShort2Thumb: React.FC = () => {
  useFont();
  const pose: Pose = {...POSES.frontStand, armF: [-10, -5], armN: [86.7, 179.3]};
  const scale = 8;
  const head = jointsOf(pose, 0, 0, 300).head;
  const floor = 830 - head[1] * scale;
  return (
    <AbsoluteFill style={{background: '#060b16', overflow: 'hidden'}}>
      <svg width={TW} height={TH} viewBox={`0 0 ${TW} ${TH}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="keyAlarm" cx="75%" cy="45%" r="70%">
            <stop offset="0" stopColor="#ed342f" stopOpacity={0.8} />
            <stop offset="0.48" stopColor="#8e111d" stopOpacity={0.34} />
            <stop offset="1" stopColor="#050917" stopOpacity={0.1} />
          </radialGradient>
          <linearGradient id="keyMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fcffff" />
            <stop offset="0.25" stopColor="#b9d3e1" />
            <stop offset="0.5" stopColor="#f1f7f9" />
            <stop offset="0.74" stopColor="#718b9c" />
            <stop offset="1" stopColor="#dce7ec" />
          </linearGradient>
          <linearGradient id="keyVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#02050b" stopOpacity={0.78} />
            <stop offset="0.4" stopColor="#02050b" stopOpacity={0} />
            <stop offset="0.76" stopColor="#02050b" stopOpacity={0} />
            <stop offset="1" stopColor="#02050b" stopOpacity={0.94} />
          </linearGradient>
        </defs>
        <image href={staticFile('mall/bg/concourse.jpg')} x={-1167} y={0} width={3414} height={1920}
          style={{filter: 'blur(5px) brightness(0.32) saturate(0.6)'}} />
        <rect width={TW} height={TH} fill="url(#keyAlarm)" />
        <Stick x={330} y={floor} h={300 * scale} look={LOOKS.guard} pose={pose}
          front eyes="wide" mouth="o" look2={1} wobble={3} shadow={0} />
        {/* The forbidden key has the same silver finish and red B3 tag as the story. */}
        <g transform="translate(750,710) rotate(28)" stroke="#080b10" strokeWidth={15} strokeLinejoin="round">
          <path d="M -24 95 L -24 340 L 56 340 L 56 302 L 20 302 L 20 273 L 62 273 L 62 240 L 20 240 L 20 95 Z" fill="url(#keyMetal)" />
          <circle r={110} fill="url(#keyMetal)" />
          <circle r={51} fill="#111c2c" strokeWidth={13} />
          <path d="M -68 -58 Q -20 -103 48 -68 M -7 140 V 235" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        </g>
        <path d="M 830 780 Q 920 824 843 892" fill="none" stroke="#080b10" strokeWidth={15} />
        <path d="M 830 780 Q 920 824 843 892" fill="none" stroke="#d0b37c" strokeWidth={7} />
        <g transform="translate(850,935) rotate(10)">
          <rect x={-107} y={-62} width={214} height={124} rx={16} fill="#e6322b" stroke="#080b10" strokeWidth={13} />
          <circle cx={-80} cy={-40} r={8} fill="#090c12" />
          <text x={4} y={33} textAnchor="middle" fontFamily={FONT} fontSize={99} fill="#fff6dc" stroke="#080b10" strokeWidth={5} paintOrder="stroke">B3</text>
        </g>
        <rect width={TW} height={TH} fill="url(#keyVignette)" />
        <Headline x={TW / 2} y={1160} size={148} parts={[["NEVER USE", '#ffffff']]} rot={-2} />
        <Headline x={TW / 2} y={1320} size={184} parts={[["THIS KEY", GOLD]]} rot={-2} />
        <text x={TW / 2} y={215} textAnchor="middle" fontFamily={FONT} fontSize={62} fill={GOLD}
          stroke="#080b10" strokeWidth={10} paintOrder="stroke">THE NIGHT GUARD</text>
      </svg>
    </AbsoluteFill>
  );
};
