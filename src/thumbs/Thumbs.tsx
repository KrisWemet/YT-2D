import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {S} from '../pigeon/sprites';
import {OX, PigeonRig, Pose} from '../pigeon/Pigeon';
import {Pic, Pos} from '../pigeon/world';
import {DashedLine, INK, PauseBadge} from '../pigeon/fx';
import {H} from '../hurricane/sprites';
import {HUR, Hurricane, Sparks} from '../hurricane/Scene';

export const FONT = 'Luckiest Guy';
export const useFont = () => {
  const [handle] = useState(() => delayRender('thumbnail font'));
  useEffect(() => {
    const f = new FontFace(FONT, `url(${staticFile('fonts/LuckiestGuy-Regular.ttf')})`);
    f.load()
      .then((ff) => {
        (document.fonts as unknown as {add: (f: FontFace) => void}).add(ff);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);
};

/** Big outlined headline (SVG text so the outline sits behind the fill). */
const Headline: React.FC<{lines: Array<{text: string; size: number; color: string}>; y: number; tilt?: number}> = ({lines, y, tilt = 0}) => {
  let cy = y;
  const rows = lines.map((l, i) => {
    cy += l.size * (i === 0 ? 0.8 : 0.98);
    return (
      <text
        key={i}
        x={540}
        y={cy}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={l.size}
        fill={l.color}
        stroke={INK}
        strokeWidth={l.size * 0.16}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{letterSpacing: '0.02em'}}
      >
        {l.text}
      </text>
    );
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`rotate(${tilt} 540 ${y + 200})`}>
        <g transform="translate(8 12)">{rows.map((r) => React.cloneElement(r, {key: `s${r.key}`, fill: INK}))}</g>
        {rows}
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ pigeon on a treadmill
export const PigeonThumb: React.FC = () => {
  useFont();
  const tm = S.treadmill;
  const TS = 0.66;
  const tfoot = tm.h - 12;
  const floorY = 1800;
  const tmX = 540 - (tm.w * TS) / 2 + 20;
  const beltY = floorY - (tfoot - tm.beltTop) * TS;
  const ps = 0.6;
  const px = 505;
  const headDx = -8;
  const pose: Pose = {headDx, near: {x: 100, lift: 42, curl: -20}, far: {x: -75}, eyePop: 1.18, brow: 18, look: [10, 2]};
  const beakX = px + ps * (1462 - OX + headDx) + 16;
  const headTop = beltY - ps * S.rig.ground;
  const slat = 74;
  return (
    <AbsoluteFill style={{background: '#ffc93a', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'repeating-conic-gradient(from 0deg at 50% 60%, #ffd75a 0deg 9deg, #ffc12b 9deg 18deg)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(closest-side at 50% 60%, rgba(255,255,255,0.55), rgba(255,255,255,0) 75%)'}} />
      <div style={{position: 'absolute', left: 0, top: floorY - 60, width: 1080, height: 400, background: '#e9e6df', borderTop: `8px solid ${INK}`}} />
      <Pos x={tmX} y={floorY} s={TS}>
        <Pic file={tm.file} w={tm.w} h={tm.h} ax={0} ay={tfoot} />
        <div style={{position: 'absolute', left: 212, top: tm.bandTop - tfoot + 6, width: 1594 - 212, height: tm.bandBot - tm.bandTop - 10, overflow: 'hidden'}}>
          {Array.from({length: 22}, (_, i) => (
            <div key={i} style={{position: 'absolute', left: i * slat - 30, top: 0, width: 16, height: 200, background: '#68707c', transform: 'skewX(-18deg)'}} />
          ))}
        </div>
      </Pos>
      {/* motion lines behind the feet: the belt is running */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 150 - i * 20, top: beltY - 70 + i * 34, width: 170 - i * 30, height: 14, borderRadius: 7, background: '#ffffff', border: `4px solid ${INK}`}} />
      ))}
      <DashedLine x={beakX} y0={headTop - 70} y1={beltY + 10} s={1} />
      <Pos x={px} y={beltY} s={ps}>
        <PigeonRig pose={pose} id="thumbp" />
      </Pos>
      <PauseBadge x={beakX + 78} y={headTop - 4} s={1} r={66} />
      <Headline y={120} tilt={-3} lines={[{text: "IT'S NOT", size: 170, color: '#ffffff'}, {text: 'BALANCE', size: 205, color: '#ff5a4a'}]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ just nuke it?
const Bolt: React.FC<{x: number; y: number; s: number; rot: number}> = ({x, y, s, rot}) => (
  <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
    <path d="M0 0L60 0L28 90L80 90L-10 260L14 130L-30 130Z" transform={`rotate(${rot}) scale(${s})`} fill="#ffe14d" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
  </svg>
);

export const HurricaneThumb: React.FC = () => {
  useFont();
  const k = 540 / HUR.R; // hurricane radius on screen
  const g = H.g_bomb_hold;
  const gs = 0.56;
  const gx = 420;
  const gy = 2140;
  const fx = gx + (g.fuse[0] - g.feet[0]) * gs;
  const fy = gy + (g.fuse[1] - g.feet[1]) * gs;
  return (
    <AbsoluteFill style={{background: '#2b4462', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #24384f 0%, #3f5f80 45%, #8aa7c2 70%, #b9cbd9 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(closest-side at 50% 21%, rgba(255,160,70,0.35), rgba(255,160,70,0) 80%)'}} />
      <Bolt x={110} y={150} s={1.1} rot={12} />
      <Bolt x={950} y={560} s={0.75} rot={-18} />
      {/* hurricane with a smug face, looking down at him */}
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(560px, 400px) scale(${k}) translate(${-HUR.x}px, ${-HUR.y}px)`}}>
        <Hurricane t={6.2} glow={0.2} look={[-0.75, 0.62]} />
      </div>
      {/* sea and beach */}
      <div style={{position: 'absolute', left: 0, top: 1240, width: 1080, height: 700, background: '#3f86a8', borderTop: `8px solid ${INK}`}} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{position: 'absolute', left: 60 + i * 180 + (i % 2) * 60, top: 1300 + (i % 3) * 60, width: 110, height: 14, borderRadius: 7, background: '#7cbcd6'}} />
      ))}
      <div style={{position: 'absolute', left: 0, top: 1560, width: 1080, height: 400, background: '#f1d49b', borderTop: `8px solid ${INK}`}} />
      <Pos x={gx} y={gy} s={gs}>
        <Pic file={g.file} w={g.w} h={g.h} ax={g.feet[0]} ay={g.feet[1]} />
      </Pos>
      <Sparks x={fx} y={fy} t={0.83} s={1.4} />
      <Headline y={620} tilt={-4} lines={[{text: 'JUST', size: 150, color: '#ffffff'}, {text: 'NUKE IT?', size: 215, color: '#ffd84a'}]} />
    </AbsoluteFill>
  );
};
