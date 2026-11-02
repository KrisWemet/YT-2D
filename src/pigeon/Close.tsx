import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {S} from './sprites';
import {camKeys, clamp, pop, spring} from './lib';
import {Layer, Pos} from './world';
import {Brow, Eye} from './Pigeon';
import {Poster} from './fx';
import {blinkAt} from './Street';
import {T} from './timing';

const P = S.p_close;
const SC = 0.7;
// place the close-up so the eye sits at world (520, 930) on the depth-1000 plane
const EX = 520, EY = 930;
const left = EX - P.eye.cx * SC;
const top = EY - P.eye.cy * SC;

/** 4-point sparkle */
const Sparkle: React.FC<{x: number; y: number; s: number; r: number}> = ({x, y, s, r}) => {
  if (s <= 0.001) return null;
  const d = `M0 ${-r}Q${r * 0.12} ${-r * 0.12} ${r} 0Q${r * 0.12} ${r * 0.12} 0 ${r}Q${-r * 0.12} ${r * 0.12} ${-r} 0Q${-r * 0.12} ${-r * 0.12} 0 ${-r}Z`;
  return (
    <svg width={r * 3} height={r * 3} viewBox={`${-r * 1.5} ${-r * 1.5} ${r * 3} ${r * 3}`} style={{position: 'absolute', left: x - r * 1.5, top: y - r * 1.5, overflow: 'visible'}}>
      <path d={d} transform={`scale(${s}) rotate(${s * 20})`} fill="#ffffff" stroke="#0b0b0b" strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
};

export const Close: React.FC<{t: number}> = ({t}) => {
  const cam = camKeys(t, [[T.cutClose, EX + 20, EY - 10, 1], [17.96, EX + 10, EY - 25, 1.2, (u) => u * (2 - u)]]);
  const vis = t > T.vision ? spring(t - T.vision, 3.2, 0.3) : 0;
  const e = P.eye;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#cfe8dd'}} />
      <Layer cam={cam} z={1600} blur={9}>
        <div style={{position: 'absolute', left: -7000, top: 1500, width: 14000, height: 6000, background: '#bfded2'}} />
        <Poster x={1180} y={180} w={420} h={530} />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Pos x={left} y={top} s={SC}>
          <Img src={staticFile(P.file)} style={{position: 'absolute', left: 0, top: 0, width: P.w, height: P.h, maxWidth: 'none'}} />
          <svg width={P.w} height={P.h} viewBox={`0 0 ${P.w} ${P.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <Eye e={e} fill={P.headFill} ring={e.ring} id="ce" pop={1 + 0.16 * vis} look={[8 * vis, -6 * vis]} blink={blinkAt(t, [16.75, 16.95])} />
            <Brow b={P.eyebrow} raise={28 * vis} tilt={-4 * vis} />
          </svg>
        </Pos>
        <Sparkle x={EX + 95} y={EY - 120} s={pop(t, T.vision + 0.05, 17.9, 0.3)} r={46} />
        <Sparkle x={EX - 120} y={EY - 160} s={pop(t, T.vision + 0.14, 17.9, 0.3) * 0.7} r={34} />
      </Layer>
    </AbsoluteFill>
  );
};
