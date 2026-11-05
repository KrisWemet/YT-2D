// Shared look for the Day 1 cold open: palette, flicker, camera, grain, small drawing helpers.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import C from './cues.json';
import {clamp} from '../pigeon/lib';

export const W = 1920;
export const H = 1080;
export const FPS = C.fps;
export const DUR = C.dur;
export const SHOT = C.shots as unknown as Record<string, [number, number]>;
export const VO = C.vo as Record<string, number>;
export const B = C.beats;

export const INK = '#07080f';
export const OW = 6; // main outline width (px at 1080p)

export const P = {
  skyTop: '#04060f', skyBot: '#16203f', far: '#0a1022', trees: '#060a17',
  tube: '#effff7', tubeGlow: '200,255,236',
  lamp: '255,214,150', // warm caged bulb on the side wall
  asphalt: '#1b1f2a', asphaltLit: '#3a404c', concrete: '#2a303e', concreteLit: '#a3aba6',
  block: '#4b4c55', blockLit: '#b8b19a', mortar: '#2d2e35', mortarLit: '#8e8875',
  rust: '#9b4a25', rustDark: '#5f2a15', rustLit: '#cf7440', steel: '#59606b',
  truck: '#8f2520', truckDark: '#4f1513', truckLit: '#c9392f', chrome: '#c9d2d8',
  skin: '#c68a64', skinShade: '#94604a', skinLit: '#efc29f', blush: '#d77f6e',
  hair: '#2e1c14', hairLit: '#5b3a28',
  denim: '#3e5b8c', denimDark: '#283c61', denimLit: '#6385bd',
  shirt: '#cf9a3a', shirtDark: '#946a22', shirtLit: '#f0c165',
  boot: '#16161a', bootLit: '#3c3d45', sole: '#2b2a2c',
  shape: '#04050b', shapeRim: '#7e8fa8', hand: '#8d978a', handShade: '#5b6559', handLit: '#b9c2b2',
  gas: '#c9a24a',
};

/** Mix two #rrggbb colours (u = 0 -> a, 1 -> b). */
export const mix = (a: string, b: string, u: number) => {
  const p = (c: string, i: number) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
  const k = clamp(u);
  const ch = (i: number) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(1)}${ch(2)}`;
};

/** Deterministic hash noise in [0, 1). */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** Smooth value noise in [-1, 1]. */
export const vnoise = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1;
};

/** Brightness of the failing lights (1 = full on). Same schedule drives the buzz in sfx.py. */
export const flick = (t: number) => {
  let dip = 0;
  for (const [t0, d, depth] of C.flicker) {
    if (t >= t0 && t < t0 + d) {
      const f = Math.floor((t - t0) * 60); // stutter inside longer drop-outs
      const stutter = d > 0.15 ? 0.75 + 0.25 * hash(f + t0 * 100) : 1;
      dip = Math.max(dip, depth * stutter);
    }
  }
  return 1 - dip + 0.025 * vnoise(t * 23);
};

/** Handheld camera drift in px / degrees. */
export const handheld = (t: number, amp = 1, seed = 0) => ({
  x: amp * (7 * vnoise(t * 0.9 + seed) + 2.5 * vnoise(t * 3.1 + seed + 40)),
  y: amp * (5 * vnoise(t * 0.8 + seed + 13) + 2 * vnoise(t * 2.7 + seed + 77)),
  r: amp * (0.25 * vnoise(t * 0.6 + seed + 5)),
});

/** Decaying impact shake (px) for hits at given times. */
export const jolt = (t: number, hits: Array<[number, number, number]>) => {
  let a = 0;
  for (const [at, amp, tau] of hits) if (t >= at) a += amp * Math.exp(-(t - at) / tau);
  return {
    x: a * (0.6 * Math.sin(2 * Math.PI * 17 * t) + 0.4 * Math.sin(2 * Math.PI * 9.3 * t + 1.1)),
    y: a * (0.6 * Math.sin(2 * Math.PI * 15.1 * t + 0.4) + 0.4 * Math.sin(2 * Math.PI * 6.7 * t + 2.3)),
  };
};

/** Full-frame SVG with a 2D camera: (x, y) is the world point at frame centre, s zoom, r degrees. */
export const Frame: React.FC<{x?: number; y?: number; s?: number; r?: number; bg?: string; children: React.ReactNode; defs?: React.ReactNode}> = ({
  x = W / 2, y = H / 2, s = 1, r = 0, bg, children, defs,
}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {defs && <defs>{defs}</defs>}
      <g transform={`translate(${W / 2} ${H / 2}) rotate(${r}) scale(${s}) translate(${-x} ${-y})`}>{children}</g>
    </svg>
  </AbsoluteFill>
);

/** Film grain (pre-baked noise tiles, a new one every frame) + vignette. */
export const FilmLook: React.FC<{frame: number; grain?: number; vignette?: number}> = ({frame, grain = 0.16, vignette = 0.75}) => {
  const g = frame % 8;
  const ox = Math.floor(hash(frame * 3.7) * 200);
  const oy = Math.floor(hash(frame * 9.1) * 200);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`}} />
      <AbsoluteFill style={{overflow: 'hidden', mixBlendMode: 'overlay', opacity: grain}}>
        <Img src={staticFile(`day1/grain/g${g}.jpg`)} style={{position: 'absolute', left: -ox, top: -oy, width: W + 400, height: H + 400, maxWidth: 'none'}} />
      </AbsoluteFill>
    </>
  );
};

/** Soft glow blob (additive look) in world px. */
export const Glow: React.FC<{x: number; y: number; rx: number; ry?: number; rgb: string; a: number; id: string}> = ({x, y, rx, ry, rgb, a, id}) =>
  a <= 0.002 ? null : (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={`rgb(${rgb})`} stopOpacity={clamp(a)} />
          <stop offset="35%" stopColor={`rgb(${rgb})`} stopOpacity={clamp(a) * 0.45} />
          <stop offset="100%" stopColor={`rgb(${rgb})`} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx} fill={`url(#${id})`} />
    </g>
  );

/** Darkness from below (shapes live here). */
export const DarkFrom: React.FC<{y0: number; y1: number; id: string; a?: number; x0?: number; x1?: number}> = ({y0, y1, id, a = 1, x0 = -400, x1 = W + 400}) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={INK} stopOpacity={0} />
        <stop offset="100%" stopColor={INK} stopOpacity={a} />
      </linearGradient>
    </defs>
    <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id})`} />
  </>
);
