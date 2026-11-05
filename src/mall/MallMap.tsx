import React from 'react';
import {interpolate} from 'remotion';
import {H, Screen, Txt, W} from './Overlays';

const INK = '#1d1a1a';

type Store = {id: string; name: string; x0: number; y0: number; x1: number; y1: number; color: string};

// Floor plan in screen pixels (1920x1080).
export const STORES: Store[] = [
  {id: 'dept', name: 'DEPARTMENT\nSTORE', x0: 250, y0: 230, x1: 500, y1: 900, color: '#6c5a8e'},
  {id: 'shoes', name: 'SHOES', x0: 500, y0: 230, x1: 690, y1: 380, color: '#4f6d8f'},
  {id: 'pharmacy', name: 'PHARMACY', x0: 690, y0: 230, x1: 960, y1: 380, color: '#3f8a6a'},
  {id: 'books', name: 'BOOKS', x0: 960, y0: 230, x1: 1180, y1: 380, color: '#8a6a45'},
  {id: 'phones', name: 'PHONES', x0: 1180, y0: 230, x1: 1400, y1: 380, color: '#4f6d8f'},
  {id: 'candles', name: 'CANDLES', x0: 500, y0: 750, x1: 680, y1: 900, color: '#8a5a6a'},
  {id: 'sports', name: 'SPORTING\nGOODS', x0: 780, y0: 750, x1: 1080, y1: 900, color: '#c0703a'},
  {id: 'toys', name: 'TOYS', x0: 1080, y0: 750, x1: 1240, y1: 900, color: '#7a8a45'},
  {id: 'arcade', name: 'ARCADE', x0: 1240, y0: 750, x1: 1400, y1: 900, color: '#5a5a8e'},
  {id: 'food', name: 'FOOD\nCOURT', x0: 1400, y0: 230, x1: 1650, y1: 900, color: '#3d7a86'},
];
const centre = (s: Store): [number, number] => [(s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2];
export const storeCentre = (id: string) => centre(STORES.find((s) => s.id === id)!);

// The patrol loop runs round the corridor ring.
const LOOP: [number, number][] = [
  [570, 415],
  [1340, 415],
  [1340, 715],
  [570, 715],
  [570, 415],
];
const loopLen = LOOP.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - LOOP[i][0], p[1] - LOOP[i][1]), 0);
const loopPoint = (k: number): [number, number] => {
  let d = ((k % 1) + 1) % 1 * loopLen;
  for (let i = 1; i < LOOP.length; i++) {
    const l = Math.hypot(LOOP[i][0] - LOOP[i - 1][0], LOOP[i][1] - LOOP[i - 1][1]);
    if (d <= l) {
      const u = d / l;
      return [LOOP[i - 1][0] + (LOOP[i][0] - LOOP[i - 1][0]) * u, LOOP[i - 1][1] + (LOOP[i][1] - LOOP[i - 1][1]) * u];
    }
    d -= l;
  }
  return LOOP[0];
};

const GuardIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={30} fill="#fff" stroke={INK} strokeWidth={6} />
    <path d="M -32 -8 Q -28 -40 2 -42 Q 30 -40 31 -10 Z" fill="#24345c" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 4 -12 Q 30 -16 46 -8 Q 30 -4 6 -6 Z" fill="#141a2c" stroke={INK} strokeWidth={4} />
    <circle cx={2} cy={0} r={4} fill={INK} />
    <circle cx={18} cy={0} r={4} fill={INK} />
    <path d="M -2 14 Q 10 6 22 14 Q 10 18 -2 14 Z" fill="#3a2a22" stroke={INK} strokeWidth={2.5} />
  </g>
);

const KeyIcon: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(-30)`}>
    <circle cx={-14} cy={0} r={13} fill="#e0b94a" stroke={INK} strokeWidth={5} />
    <circle cx={-14} cy={0} r={4} fill={INK} />
    <rect x={-2} y={-5} width={34} height={10} rx={3} fill="#e0b94a" stroke={INK} strokeWidth={4} />
    <rect x={20} y={2} width={6} height={10} fill="#e0b94a" stroke={INK} strokeWidth={3} />
  </g>
);

export type MapMode = 'loop' | 'keys' | 'all' | 'pick' | 'thousand';

export const MallMap: React.FC<{mode: MapMode; t: number; dur: number}> = ({mode, t, dur}) => {
  const zoom = 1 + 0.04 * (t / Math.max(dur, 0.1));
  const pickIds = ['pharmacy', 'food', 'dept', 'sports'];
  const dim = (id: string) => mode === 'pick' && !pickIds.includes(id);
  const guardK = mode === 'loop' || mode === 'thousand' ? 0.75 + (t / Math.max(dur, 0.1)) * 0.2 : 0.75;
  const [gx, gy] = loopPoint(guardK);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#121a2c'}}>
      <Screen>
        <defs>
          <pattern id="paper" width={48} height={48} patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1f2a44" strokeWidth={2} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#paper)" />
        <g transform={`translate(${W / 2},${H / 2 + 20}) scale(${zoom}) translate(${-W / 2},${-H / 2})`}>
          {/* parking garage beyond the food court */}
          <rect x={1680} y={330} width={200} height={470} fill="#3a3f48" stroke={INK} strokeWidth={8} />
          {[380, 440, 500, 560, 620, 680, 740].map((y) => (
            <line key={y} x1={1700} y1={y} x2={1860} y2={y} stroke="#9aa0aa" strokeWidth={3} strokeDasharray="14 10" />
          ))}
          <Txt x={1780} y={300} size={30} fill="#cfd3da">GARAGE</Txt>
          <rect x={1650} y={520} width={30} height={90} fill="#3a3f48" stroke={INK} strokeWidth={6} />
          {/* building */}
          <rect x={250} y={230} width={1400} height={670} fill="#2a3656" stroke={INK} strokeWidth={14} rx={6} />
          {/* corridor ring + centre court */}
          <rect x={640} y={450} width={640} height={230} fill="#22304d" stroke={INK} strokeWidth={8} rx={4} />
          <rect x={1140} y={450} width={140} height={100} fill="#3b4566" stroke={INK} strokeWidth={6} />
          <Txt x={1210} y={512} size={22} fill="#cfd3da">SECURITY</Txt>
          <g opacity={0.8}>
            <rect x={820} y={520} width={180} height={90} fill="#2d3a5c" stroke={INK} strokeWidth={5} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={835 + i * 28} y1={525} x2={835 + i * 28} y2={605} stroke="#55618a" strokeWidth={4} />
            ))}
            <Txt x={910} y={650} size={22} fill="#9aa6c8">ESCALATORS</Txt>
          </g>
          {STORES.map((s) => {
            const [cx, cy] = centre(s);
            const lines = s.name.split('\n');
            return (
              <g key={s.id} opacity={dim(s.id) ? 0.25 : 1}>
                <rect x={s.x0} y={s.y0} width={s.x1 - s.x0} height={s.y1 - s.y0} fill={s.color} stroke={INK} strokeWidth={8} />
                {lines.map((l, i) => (
                  <Txt key={i} x={cx} y={cy + 12 + (i - (lines.length - 1) / 2) * 34} size={s.id === 'dept' || s.id === 'food' ? 34 : 28}>
                    {l}
                  </Txt>
                ))}
              </g>
            );
          })}
          {/* glass: food court wall, main entrance */}
          <line x1={1650} y1={260} x2={1650} y2={870} stroke="#9fd8ff" strokeWidth={12} />
          <line x1={690} y1={900} x2={770} y2={900} stroke="#9fd8ff" strokeWidth={14} />
          <Txt x={730} y={960} size={28} fill="#9fd8ff">ENTRANCE</Txt>
          {/* patrol loop */}
          {(mode === 'loop' || mode === 'thousand') && (
            <polyline
              points={LOOP.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="#f0c53c"
              strokeWidth={10}
              strokeDasharray="26 18"
              strokeDashoffset={-t * 60}
              strokeLinejoin="round"
            />
          )}
          {mode === 'keys' &&
            STORES.map((s, i) => {
              const [cx, cy] = centre(s);
              const k = interpolate(t, [0.15 + i * 0.12, 0.3 + i * 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return k > 0 ? <KeyIcon key={s.id} x={cx + 40} y={cy - 46} s={k * 1.1} /> : null;
            })}
          {mode === 'pick' &&
            pickIds.map((id, i) => {
              const [cx, cy] = storeCentre(id);
              const k = interpolate(t, [0.2 + i * 0.3, 0.38 + i * 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return k > 0 ? (
                <g key={id} transform={`translate(${cx},${cy - 70}) scale(${k})`}>
                  <circle r={34} fill="#f0c53c" stroke={INK} strokeWidth={7} />
                  <Txt x={0} y={14} size={40} fill={INK}>{`${i + 1}`}</Txt>
                </g>
              ) : null;
            })}
          <GuardIcon x={gx} y={gy} s={1.1} />
        </g>
        {mode === 'all' && (() => {
          const k = interpolate(t, [0.25, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g stroke="#e2392d" strokeWidth={44} strokeLinecap="round" opacity={0.92}>
              <line x1={300} y1={200} x2={300 + (1620 - 300) * k} y2={200 + (930 - 200) * k} />
              {k > 0.5 && <line x1={1620} y1={200} x2={1620 - (1620 - 300) * (k - 0.5) * 2} y2={200 + (930 - 200) * (k - 0.5) * 2} />}
            </g>
          );
        })()}
        {mode === 'thousand' && <Txt x={W / 2} y={H / 2 + 56} size={150} fill="#f0c53c">×1,000</Txt>}
        <Txt x={W / 2} y={120} size={66}>MAPLECREST MALL</Txt>
      </Screen>
    </div>
  );
};
