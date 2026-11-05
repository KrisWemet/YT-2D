import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {FONT, useFont} from '../thumbs/Thumbs';
import {Zed} from './shots';
import {Head, LOOKS, Pose, POSES, Stick} from './Stick';

/*
 * Channel art for The Night Guard, drawn with the series' own figures and backgrounds.
 *
 * Banner 2560x1440: TVs show all of it, desktops a full-width 2560x423 strip through the
 * middle, phones only the middle 1546x423 (SAFE). Danny and the title sit inside SAFE;
 * the zombies behind the store gates on both sides are desktop extras; the ceiling and the
 * floor are TV-only.
 *
 * Picture 800x800: YouTube shows it as a circle, as small as about 24 px next to comments.
 */
const BW = 2560;
const BH = 1440;
export const NG_SAFE = {x0: (BW - 1546) / 2, x1: (BW + 1546) / 2, y0: (BH - 423) / 2, y1: (BH + 423) / 2};

const INK = '#1d1a1a';
const GOLD = '#f0c53c';
const NIGHT = '#0d1322';

// Widths of the tagline's two halves in Luckiest Guy, in ems (measured, with the 0.02 em letter spacing).
const EM = {story: 12.12, daily: 10.4};

type Anchor = 'start' | 'middle' | 'end';
/** Outlined cartoon text: ink stroke behind the fill, plus a dark offset shadow. */
const Outlined: React.FC<{x: number; y: number; size: number; fill: string; anchor?: Anchor; shadow?: number; children: string}> = ({
  x,
  y,
  size,
  fill,
  anchor = 'middle',
  shadow = 0.07,
  children,
}) => {
  const common = {
    x,
    y,
    textAnchor: anchor,
    fontFamily: FONT,
    fontSize: size,
    strokeWidth: size * 0.16,
    strokeLinejoin: 'round' as const,
    paintOrder: 'stroke',
    letterSpacing: '0.02em',
  };
  return (
    <g>
      {shadow > 0 && (
        <text {...common} fill="#05070c" stroke="#05070c" opacity={0.9} transform={`translate(${size * shadow * 0.7} ${size * shadow})`}>
          {children}
        </text>
      )}
      <text {...common} fill={fill} stroke={INK}>
        {children}
      </text>
    </g>
  );
};

/** "THE" over "NIGHT GUARD", with the tagline pill underneath; (x, y) is the NIGHT GUARD baseline centre. */
const TitleLockup: React.FC<{x: number; y: number; big: number}> = ({x, y, big}) => {
  const small = big * 0.5;
  const tag = big * 0.25;
  const gap = tag * 0.9; // between the two halves of the tagline, around the dot
  const leftW = EM.story * tag;
  const rightW = EM.daily * tag;
  const pad = tag * 0.95;
  const pillW = leftW + rightW + gap * 2 + pad * 2;
  const pillH = tag * 1.62;
  const pillY = y + big * 0.3;
  const x0 = x - pillW / 2;
  const dotX = x0 + pad + leftW + gap;
  const textY = pillY + pillH / 2 + tag * 0.36;
  return (
    <g>
      <Outlined x={x} y={y - big * 0.86} size={small} fill="#eef1f6">
        THE
      </Outlined>
      <Outlined x={x} y={y} size={big} fill={GOLD} shadow={0.06}>
        NIGHT GUARD
      </Outlined>
      <rect x={x0 + 8} y={pillY + 10} width={pillW} height={pillH} rx={pillH / 2} fill="#05070c" opacity={0.8} />
      <rect x={x0} y={pillY} width={pillW} height={pillH} rx={pillH / 2} fill="#101624" stroke={INK} strokeWidth={6} />
      <text x={dotX - gap} y={textY} textAnchor="end" fontFamily={FONT} fontSize={tag} fill="#eef1f6" letterSpacing="0.02em">
        A ZOMBIE SURVIVAL STORY
      </text>
      <circle cx={dotX} cy={textY - tag * 0.36} r={tag * 0.13} fill={GOLD} />
      <text x={dotX + gap} y={textY} textAnchor="start" fontFamily={FONT} fontSize={tag} fill={GOLD} letterSpacing="0.02em">
        NEW PARTS EVERY DAY
      </text>
    </g>
  );
};

// Danny with the flashlight held out in front, the beam on the floor ahead.
const DANNY_POSE: Pose = {lean: 3, head: -2, armF: [-10, -4], armN: [62, 78], legF: [-8, -4], legN: [10, 6]};

// The two store gates at the edges of the concourse picture (banner px), and the dead behind them.
const GATE_L = '0,328 486,484 486,1050 0,1178';
const GATE_R = '2118,490 2560,326 2560,1180 2118,1056';
const BG_LOOK = 'brightness(0.62) saturate(0.85)';

// The gates' bars, as a mask made from the painting by images/mall/gate_mask.py: drawing the
// painting again through it puts the bars back in front of whatever stands behind the gates.
const GateBars: React.FC = () => (
  <defs>
    <mask id="ngBarsMask" maskUnits="userSpaceOnUse" x={0} y={0} width={BW} height={BH}>
      <image href={staticFile('mall/brand/concourse-gates-mask.png')} x={0} y={0} width={BW} height={BH} />
    </mask>
    <clipPath id="ngGates">
      <polygon points={GATE_L} />
      <polygon points={GATE_R} />
    </clipPath>
  </defs>
);

// ------------------------------------------------------------------ banner
export const NightGuardBanner: React.FC = () => {
  useFont();
  const danny = {x: 612, y: 1380, h: 800};
  return (
    <AbsoluteFill style={{background: NIGHT, overflow: 'hidden'}}>
      <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} style={{position: 'absolute', inset: 0}}>
        <GateBars />
        <defs>
          <radialGradient id="ngTitleDark" cx={0.596} cy={0.5} r={0.34}>
            <stop offset={0} stopColor={NIGHT} stopOpacity={0.8} />
            <stop offset={0.6} stopColor={NIGHT} stopOpacity={0.45} />
            <stop offset={1} stopColor={NIGHT} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ngVignette" cx={0.5} cy={0.5} r={0.75}>
            <stop offset={0.45} stopColor="#000" stopOpacity={0} />
            <stop offset={1} stopColor="#000" stopOpacity={0.7} />
          </radialGradient>
        </defs>
        <image href={staticFile('mall/bg/concourse.jpg')} x={0} y={0} width={BW} height={BH} style={{filter: BG_LOOK}} />

        {/* desktop extras: the dead pressed up against both store gates, Marcus (still in his uniform) on the right */}
        {/* heads sit below the gates' upper cross-bracing so the faces show between the bars */}
        <g clipPath="url(#ngGates)">
          <Zed k={2} x={238} y={1160} h={480} dim={0.95} front pose={POSES.frontReach} shadow={0} />
          <Zed k={0} x={110} y={1262} h={640} dim={1.25} front pose={POSES.frontPress} shadow={0} />
          <Zed k={4} x={372} y={1236} h={610} dim={1.2} front pose={POSES.frontReach} shadow={0} />
          <Zed k={1} x={2212} y={1150} h={470} dim={0.95} front pose={POSES.frontReach} shadow={0} />
          <Zed k={3} x={2482} y={1262} h={640} dim={1.2} front pose={POSES.frontReach} shadow={0} />
          <Stick x={2330} y={1250} h={660} look={LOOKS.marcusZ} pose={POSES.frontPress} front eyes="zombie" mouth="zombie" wobble={9} dim={1.4} shadow={0} />
          <image href={staticFile('mall/bg/concourse.jpg')} x={0} y={0} width={BW} height={BH} mask="url(#ngBarsMask)" style={{filter: BG_LOOK}} />
        </g>

        <rect x={0} y={0} width={BW} height={BH} fill="#0b1830" opacity={0.28} />
        <rect x={0} y={0} width={BW} height={BH} fill="url(#ngTitleDark)" />
        <rect x={0} y={0} width={BW} height={BH} fill="url(#ngVignette)" />

        {/* phone-safe: Danny and the title */}
        <Stick
          x={danny.x}
          y={danny.y}
          h={danny.h}
          look={LOOKS.guard}
          pose={DANNY_POSE}
          eyes="wide"
          mouth="grit"
          look2={1}
          propN="flashlight"
          beam={330}
          sweat
          shadow={0.35}
        />
        <TitleLockup x={1525} y={762} big={160} />
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ channel picture
// Danny head-and-shoulders, facing us, eyes darting to the side. The rig's head is reused as is;
// the shoulders are drawn here (the rig's arms start mid-chest, which only works side-on).
const SHIRT = LOOKS.guard.shirt;
const Bust: React.FC<{cx: number; cy: number; s: number}> = ({cx, cy, s}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`} filter="url(#ngWob)">
    <defs>
      <filter id="ngWob" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={2} seed={1} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    {/* neck, then the uniform shirt over it */}
    <rect x={-6.5} y={18} width={13} height={28} fill={LOOKS.guard.skin} stroke={INK} strokeWidth={4.2} />
    <path d="M -64 96 L -61 62 Q -57 45 -32 40 L 32 40 Q 57 45 61 62 L 64 96 Z" fill={SHIRT} stroke={INK} strokeWidth={4.2} strokeLinejoin="round" />
    {/* shade on the far side, collar, shoulder straps, badge */}
    <path d="M -32 40 Q -57 45 -61 62 L -64 96 L -36 96 L -30 52 Z" fill="#000" opacity={0.13} />
    <path d="M -15 40 L 0 58 L 15 40" fill="none" stroke="#1f2c4d" strokeWidth={3.4} strokeLinejoin="round" />
    <path d="M -15 40 L -4 54 L -22 50 Z M 15 40 L 4 54 L 22 50 Z" fill="#2b3e6b" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
    <path d="M -52 47 L -36 42 L -35 49 L -51 54 Z M 52 47 L 36 42 L 35 49 L 51 54 Z" fill="#25365e" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
    <path transform="translate(27 63) scale(1.6)" d="M 0 -6 L 5 -3.5 L 4 3.5 L 0 7 L -4 3.5 L -5 -3.5 Z" fill="#e0b94a" stroke={INK} strokeWidth={1.6} />
    <Head c={[0, 0]} tilt={-3} look={LOOKS.guard} eyes="wide" mouth="flat" gaze={1} back={false} front ghost={false} ink={INK} />
    {/* a nervous bead of sweat at the temple */}
    <path transform="translate(-31 -2)" d="M 0 -10 Q 6 0 0 5 Q -6 0 0 -10 Z" fill="#9fd3ff" stroke={INK} strokeWidth={2} />
  </g>
);

export const NightGuardPicture: React.FC = () => {
  const S = 800;
  return (
    <AbsoluteFill style={{background: NIGHT, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 41%, #ffe08a 0%, #f6bf45 30%, #c9862c 45%, #4a3a33 60%, #1a2236 72%, ${NIGHT} 86%)`,
        }}
      />
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{position: 'absolute', inset: 0}}>
        <Bust cx={S / 2} cy={330} s={6.25} />
      </svg>
    </AbsoluteFill>
  );
};
