import React from 'react';
import {AbsoluteFill} from 'remotion';
import {S} from '../pigeon/sprites';
import {PigeonRig, Pose} from '../pigeon/Pigeon';
import {Pic, Pos} from '../pigeon/world';
import {INK, RED} from '../pigeon/fx';
import {HUR, Hurricane} from '../hurricane/Scene';
import {FONT, useFont} from '../thumbs/Thumbs';

/*
 * YouTube channel art, built from the Shorts' own cut-outs.
 *
 * Banner 2560x1440: TVs show all of it, desktops a full-width 2560x423 strip
 * through the middle, phones only the middle 1546x423 (SAFE). The scientist
 * and the slogan sit inside SAFE; the hurricane and the pigeon are desktop
 * extras; the doodles fill the TV-only area.
 *
 * Channel picture 800x800: YouTube shows it as a circle, down to about 98 px.
 */
const BW = 2560;
const BH = 1440;
export const SAFE = {x0: (BW - 1546) / 2, x1: (BW + 1546) / 2, y0: (BH - 423) / 2, y1: (BH + 423) / 2};

const YELLOW = '#ffc93a';
const DOODLE = '#e9a21c';

const Sunburst: React.FC<{at: string; ray: number; glow?: number}> = ({at, ray, glow = 0.55}) => (
  <>
    <AbsoluteFill style={{background: `repeating-conic-gradient(from 0deg at ${at}, #ffd75a 0deg ${ray}deg, #ffc12b ${ray}deg ${2 * ray}deg)`}} />
    <AbsoluteFill style={{background: `radial-gradient(closest-side at ${at}, rgba(255,255,255,${glow}), rgba(255,255,255,0) 80%)`}} />
  </>
);

/** The round-headed scientist (thinking pose), placed by his head centre with head radius r. */
const Scientist: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
  const g = S.g_hero;
  const s = r / g.head[2];
  return (
    <Pos x={x} y={y} s={s}>
      <Pic file={g.file} w={g.w} h={g.h} ax={g.head[0]} ay={g.head[1]} style={{filter: `drop-shadow(${9 / s}px ${12 / s}px 0 rgba(11,11,11,0.16))`}} />
    </Pos>
  );
};

/** Outlined cartoon text: ink stroke behind the fill plus a solid offset shadow. */
const Outlined: React.FC<{x: number; y: number; size: number; color: string; children: string; rot?: number; anchor?: 'start' | 'middle' | 'end'}> = ({
  x, y, size, color, children, rot = 0, anchor = 'middle',
}) => {
  const common = {
    x, y, textAnchor: anchor, fontFamily: FONT, fontSize: size, strokeWidth: size * 0.16, stroke: INK,
    strokeLinejoin: 'round' as const, paintOrder: 'stroke', style: {letterSpacing: '0.02em'},
  };
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <text {...common} fill={INK} transform={`translate(${size * 0.05} ${size * 0.07})`}>{children}</text>
      <text {...common} fill={color}>{children}</text>
    </g>
  );
};

// ------------------------------------------------------------------ background doodles
type Kind = 'atom' | 'q' | 'bolt' | 'spark' | 'planet' | 'mag' | 'flask';
const Doodle: React.FC<{k: Kind; x: number; y: number; s: number; rot: number}> = ({k, x, y, s, rot}) => {
  const st = {fill: 'none', stroke: DOODLE, strokeWidth: 9 / s, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  let body: React.ReactNode = null;
  if (k === 'atom') {
    body = (
      <>
        {[0, 60, 120].map((a) => <ellipse key={a} cx={0} cy={0} rx={60} ry={22} transform={`rotate(${a})`} {...st} />)}
        <circle cx={0} cy={0} r={11} fill={DOODLE} />
      </>
    );
  } else if (k === 'q') {
    body = <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontSize={96} fill={DOODLE}>?</text>;
  } else if (k === 'bolt') {
    body = <path d="M-6 -62L30 -62L10 -8L36 -8L-22 70L-6 14L-32 14Z" fill={DOODLE} />;
  } else if (k === 'spark') {
    body = <path d="M0 -40Q6 -6 40 0Q6 6 0 40Q-6 6 -40 0Q-6 -6 0 -40Z" fill={DOODLE} />;
  } else if (k === 'planet') {
    body = (
      <>
        <circle cx={0} cy={0} r={30} {...st} />
        <ellipse cx={0} cy={0} rx={62} ry={16} transform="rotate(-18)" {...st} />
      </>
    );
  } else if (k === 'mag') {
    body = (
      <>
        <circle cx={-10} cy={-10} r={32} {...st} />
        <path d="M14 14L48 48" {...st} />
      </>
    );
  } else if (k === 'flask') {
    body = <path d="M-14 -50L-14 -12L-42 40Q-46 52 -32 52L32 52Q46 52 42 40L14 -12L14 -50M-22 -50L22 -50M-30 22L30 22" {...st} />;
  }
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>{body}</g>;
};

// Hand-placed so they stay clear of the strip that desktops and phones show.
const DOODLES: Array<[Kind, number, number, number, number]> = [
  ['atom', 150, 110, 1.3, 10], ['q', 430, 250, 1.1, -12], ['bolt', 700, 95, 1.0, 14], ['planet', 980, 300, 1.1, 0],
  ['spark', 1230, 120, 0.9, 0], ['flask', 1500, 300, 1.0, 8], ['mag', 1790, 110, 1.1, -10], ['q', 2050, 300, 1.0, 14],
  ['atom', 2330, 150, 1.2, -20], ['spark', 2480, 380, 0.8, 0], ['spark', 90, 420, 0.7, 0], ['bolt', 1640, 440, 0.7, -16],
  ['spark', 820, 450, 0.6, 0],
  ['mag', 140, 1080, 1.1, 12], ['spark', 420, 1290, 0.9, 0], ['atom', 1010, 1110, 1.2, 25], ['q', 1260, 1320, 1.1, 10],
  ['planet', 1560, 1110, 1.2, 0], ['bolt', 1840, 1300, 1.0, -12], ['flask', 2110, 1080, 1.0, -8], ['q', 2400, 1300, 1.1, -10],
  ['spark', 720, 1360, 0.8, 0], ['spark', 2470, 1010, 0.7, 0], ['spark', 1380, 990, 0.6, 0],
];

// ------------------------------------------------------------------ banner
export const ChannelBanner: React.FC = () => {
  useFont();
  const tx = 1450; // slogan centre
  const pigeonPose: Pose = {headDx: -6, near: {x: 100, lift: 42, curl: -20}, far: {x: -75}, eyePop: 1.1, brow: 12, look: [10, 2]};
  const hr = 215; // hurricane radius on screen
  return (
    <AbsoluteFill style={{background: YELLOW, overflow: 'hidden'}}>
      <Sunburst at="56.6% 50%" ray={6} glow={0.6} />
      <svg width={BW} height={BH} style={{position: 'absolute', left: 0, top: 0}}>
        {DOODLES.map(([k, x, y, s, rot], i) => <Doodle key={i} k={k} x={x} y={y} s={s} rot={rot} />)}
      </svg>

      {/* desktop extras: the hurricane on the left, the pigeon on the right, both looking in */}
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(262px, 712px) scale(${hr / HUR.R}) translate(${-HUR.x}px, ${-HUR.y}px)`}}>
        <Hurricane t={2.0} glow={0} look={[0.75, 0.25]} />
      </div>
      <Pos x={2300} y={903} s={0.26} sx={-1}>
        <PigeonRig pose={pigeonPose} id="bannerp" />
      </Pos>

      {/* phone-safe middle: the scientist wondering, and the slogan */}
      <Scientist x={700} y={652} r={118} />
      <svg width={BW} height={BH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`rotate(-1.5 ${tx} 720)`}>
          <Outlined x={tx} y={642} size={114} color="#ffffff">WEIRD QUESTIONS.</Outlined>
          <Outlined x={tx} y={790} size={154} color={RED}>REAL SCIENCE.</Outlined>
        </g>
      </svg>
      <div
        style={{
          position: 'absolute', left: tx, top: 826, transform: 'translateX(-50%) rotate(-1.5deg)', whiteSpace: 'nowrap',
          background: '#ffffff', border: `6px solid ${INK}`, borderRadius: 999, padding: '10px 34px 4px',
          boxShadow: `6px 8px 0 ${INK}`, fontFamily: FONT, fontSize: 42, color: INK, letterSpacing: '0.03em',
        }}
      >
        ANIMATED SCIENCE SHORTS &bull; EVERY FACT CHECKED
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ channel picture
export const ChannelPicture: React.FC = () => {
  useFont();
  return (
    <AbsoluteFill style={{background: YELLOW, overflow: 'hidden'}}>
      <Sunburst at="50% 50%" ray={10} glow={0.65} />
      <Scientist x={372} y={420} r={252} />
      <svg width={800} height={800} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Outlined x={652} y={330} size={250} color={RED} rot={14}>?</Outlined>
      </svg>
    </AbsoluteFill>
  );
};
