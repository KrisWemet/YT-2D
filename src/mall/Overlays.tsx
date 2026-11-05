import React from 'react';
import {interpolate, random} from 'remotion';
import {FONT} from '../thumbs/Thumbs';

const INK = '#1d1a1a';
export const W = 1920;
export const H = 1080;

const pop = (t: number, at: number, len = 0.18) => {
  if (t < at) return 0;
  const k = Math.min(1, (t - at) / len);
  // small overshoot
  return k < 1 ? 1.12 * Math.sin((k * Math.PI) / 2) - 0.12 * k : 1;
};

// Bold outlined text, used for every on-screen word.
export const Txt: React.FC<{
  x: number;
  y: number;
  size: number;
  children: React.ReactNode;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  rotate?: number;
  opacity?: number;
}> = ({x, y, size, children, fill = '#fff', anchor = 'middle', rotate = 0, opacity = 1}) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    fontFamily={FONT}
    fontSize={size}
    fill={fill}
    stroke={INK}
    strokeWidth={size * 0.16}
    strokeLinejoin="round"
    paintOrder="stroke"
    letterSpacing="0.02em"
    transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    opacity={opacity}
  >
    {children}
  </text>
);

// Screen-space layer (1920x1080 SVG) for text and icons.
export const Screen: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);

const Icon: React.FC<{kind: 'ok' | 'no' | 'key' | 'info'; r: number}> = ({kind, r}) => {
  if (kind === 'ok')
    return (
      <g>
        <circle r={r} fill="#3fb36b" stroke={INK} strokeWidth={r * 0.18} />
        <path d={`M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.38} L ${r * 0.5} ${-r * 0.38}`} fill="none" stroke="#fff" strokeWidth={r * 0.26} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  if (kind === 'no')
    return (
      <g>
        <circle r={r} fill="#d8443a" stroke={INK} strokeWidth={r * 0.18} />
        <path d={`M ${-r * 0.38} ${-r * 0.38} L ${r * 0.38} ${r * 0.38} M ${r * 0.38} ${-r * 0.38} L ${-r * 0.38} ${r * 0.38}`} stroke="#fff" strokeWidth={r * 0.26} strokeLinecap="round" />
      </g>
    );
  if (kind === 'key')
    return (
      <g>
        <circle r={r} fill="#e0b94a" stroke={INK} strokeWidth={r * 0.18} />
        <circle cx={-r * 0.25} cy={0} r={r * 0.25} fill="none" stroke={INK} strokeWidth={r * 0.14} />
        <path d={`M 0 0 L ${r * 0.55} 0 M ${r * 0.35} 0 L ${r * 0.35} ${r * 0.25} M ${r * 0.5} 0 L ${r * 0.5} ${r * 0.2}`} stroke={INK} strokeWidth={r * 0.14} strokeLinecap="round" />
      </g>
    );
  return <circle r={r} fill="#f0c53c" stroke={INK} strokeWidth={r * 0.18} />;
};

// A tag that pops in: icon + label.
export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  kind?: 'ok' | 'no' | 'key' | 'info' | 'none';
  t: number;
  at?: number;
  size?: number;
  anchor?: 'start' | 'middle';
}> = ({x, y, text, kind = 'none', t, at = 0, size = 64, anchor = 'start'}) => {
  const s = pop(t, at);
  if (s <= 0) return null;
  const r = size * 0.48;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {kind !== 'none' && (
        <g transform={`translate(${anchor === 'start' ? r : -size * text.length * 0.27 - r * 1.3},${-size * 0.34})`}>
          <Icon kind={kind} r={r} />
        </g>
      )}
      <Txt x={kind !== 'none' ? (anchor === 'start' ? r * 2.5 : 0) : 0} y={0} size={size} anchor={anchor}>
        {text}
      </Txt>
    </g>
  );
};

// Digital clock in a dark box.
export const Clock: React.FC<{x: number; y: number; text: string; t: number; at?: number; scale?: number}> = ({x, y, text, t, at = 0, scale = 1}) => {
  const s = pop(t, at) * scale;
  if (s <= 0) return null;
  const blink = Math.floor(t * 2) % 2 === 0;
  const [hh, mm] = text.split(':');
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-190} y={-78} width={380} height={130} rx={18} fill="#14161c" stroke={INK} strokeWidth={8} />
      <rect x={-176} y={-64} width={352} height={102} rx={10} fill="#0c0e12" />
      <text x={-12} y={20} textAnchor="end" fontFamily="DejaVu Sans Mono, monospace" fontWeight={700} fontSize={84} fill="#ff4d3a">
        {hh}
      </text>
      <text x={0} y={14} textAnchor="middle" fontFamily="DejaVu Sans Mono, monospace" fontWeight={700} fontSize={84} fill="#ff4d3a" opacity={blink ? 1 : 0.4}>
        :
      </text>
      <text x={12} y={20} textAnchor="start" fontFamily="DejaVu Sans Mono, monospace" fontWeight={700} fontSize={84} fill="#ff4d3a">
        {mm}
      </text>
    </g>
  );
};

// Chapter tag, top left, fades in and out over the first ~2.4 s of a chapter.
export const ChapterTag: React.FC<{n: number; title: string; t: number}> = ({n, title, t}) => {
  const o = interpolate(t, [0, 0.3, 2.2, 2.7], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  return (
    <g opacity={o} transform={`translate(70, 110)`}>
      <Txt x={0} y={0} size={40} anchor="start" fill="#f0c53c">{`CHAPTER ${n}`}</Txt>
      <Txt x={0} y={66} size={64} anchor="start">{title}</Txt>
    </g>
  );
};

// Radio speaker badge with a moving waveform.
export const RadioBadge: React.FC<{name: string; t: number; color?: string}> = ({name, t, color = '#8fd18a'}) => {
  const bars = 12;
  return (
    <g transform={`translate(${W / 2}, ${H - 120})`}>
      <rect x={-340} y={-62} width={680} height={124} rx={62} fill="#101216" opacity={0.86} stroke={INK} strokeWidth={6} />
      <g transform="translate(-272, 0)">
        <line x1={10} y1={-26} x2={10} y2={-50} stroke="#cfd3da" strokeWidth={6} strokeLinecap="round" />
        <rect x={-18} y={-30} width={40} height={62} rx={7} fill="#2a2b30" stroke="#cfd3da" strokeWidth={4} />
        <rect x={-10} y={-20} width={24} height={14} fill={color} />
      </g>
      <Txt x={-210} y={20} size={52} anchor="start" fill={color}>
        {name}
      </Txt>
      {new Array(bars).fill(0).map((_, i) => {
        const h = 8 + Math.abs(Math.sin(t * 13 + i * 1.7) * Math.sin(t * 5.3 + i)) * 44;
        return <rect key={i} x={122 + i * 16} y={-h / 2} width={9} height={h} rx={4} fill={color} />;
      })}
    </g>
  );
};

// Security camera look: scanlines, noise, vignette, REC and a timestamp.
export const CctvOverlay: React.FC<{t: number; frame: number; cam: string; clock: string}> = ({t, frame, cam, clock}) => {
  const lines = [];
  for (let y = 0; y < H; y += 6) lines.push(<rect key={y} x={0} y={y} width={W} height={2} fill="#000" opacity={0.18} />);
  const glitchY = (random(`g${Math.floor(frame / 3)}`) * H) | 0;
  const sec = Math.floor(t);
  const [h, m, s0] = clock.split(':').map(Number);
  const ss = (s0 + sec) % 60;
  const mm = m + Math.floor((s0 + sec) / 60);
  const stamp = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return (
    <Screen>
      <defs>
        <radialGradient id="vig" cx="50%" cy="50%" r="70%">
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.75} />
        </radialGradient>
      </defs>
      {lines}
      <rect x={0} y={glitchY} width={W} height={10} fill="#fff" opacity={0.08} />
      <rect x={0} y={0} width={W} height={H} fill="url(#vig)" />
      <g fontFamily="DejaVu Sans Mono, monospace" fontWeight={700} fill="#f2f2f2">
        <circle cx={92} cy={86} r={18} fill="#ff3b30" opacity={Math.floor(t * 2) % 2 ? 0.25 : 1} />
        <text x={124} y={100} fontSize={44}>REC</text>
        <text x={W - 70} y={100} fontSize={44} textAnchor="end">{cam}</text>
        <text x={W - 70} y={H - 70} fontSize={44} textAnchor="end">{stamp}</text>
        <text x={70} y={H - 70} fontSize={34} opacity={0.8}>MAPLECREST MALL SECURITY</text>
      </g>
      <path d={`M 60 60 l 70 0 M 60 60 l 0 70 M ${W - 60} 60 l -70 0 M ${W - 60} 60 l 0 70 M 60 ${H - 60} l 70 0 M 60 ${H - 60} l 0 -70 M ${W - 60} ${H - 60} l -70 0 M ${W - 60} ${H - 60} l 0 -70`} stroke="#f2f2f2" strokeWidth={5} fill="none" opacity={0.85} />
    </Screen>
  );
};
export const CCTV_FILTER = 'grayscale(1) contrast(1.25) brightness(0.95) sepia(0.25) hue-rotate(60deg)';

// Full-frame white flash.
export const Flash: React.FC<{t: number; at?: number; len?: number; color?: string}> = ({t, at = 0, len = 0.35, color = '#fff'}) => {
  const o = interpolate(t, [at, at + 0.04, at + len], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  return <div style={{position: 'absolute', inset: 0, background: color, opacity: o}} />;
};

// Fade to/from black.
export const Fade: React.FC<{o: number}> = ({o}) => (o > 0 ? <div style={{position: 'absolute', inset: 0, background: '#000', opacity: o}} /> : null);

// Camera shake offset (world px) for impacts.
export const shake = (t: number, at: number, amp: number, len = 0.5): [number, number] => {
  const k = t - at;
  if (k < 0 || k > len) return [0, 0];
  const d = amp * (1 - k / len);
  return [Math.sin(k * 90) * d, Math.cos(k * 77) * d * 0.7];
};

/* ---------------- world-space pieces (drawn inside <World>) ---------------- */

// Roll-down security grille with see-through links. frac = how far down (0..1).
export const Grille: React.FC<{x0: number; y0: number; x1: number; y1: number; frac: number; dark?: number}> = ({x0, y0, x1, y1, frac, dark = 0}) => {
  const bottom = y0 + (y1 - y0) * frac;
  if (frac <= 0.001) return null;
  const rods = [];
  const step = (y1 - y0) / 26;
  for (let y = bottom - step; y > y0; y -= step) rods.push(y);
  const links = [];
  const lx = (x1 - x0) / 34;
  for (let i = 0; i < rods.length; i++) {
    const ya = rods[i];
    const yb = Math.min(bottom, ya + step);
    for (let x = x0 + (i % 2 ? lx / 2 : lx); x < x1 - 4; x += lx) links.push(<line key={`${i}-${x}`} x1={x} y1={ya} x2={x} y2={yb} />);
  }
  const steel = dark ? '#3b4250' : '#6d7684';
  const hi = dark ? '#596273' : '#aab3bf';
  return (
    <g>
      <g stroke={INK} strokeWidth={step * 0.42} strokeLinecap="round">
        {rods.map((y) => (
          <line key={y} x1={x0} y1={y} x2={x1} y2={y} />
        ))}
      </g>
      <g stroke={steel} strokeWidth={step * 0.24} strokeLinecap="round">
        {rods.map((y) => (
          <line key={y} x1={x0} y1={y} x2={x1} y2={y} />
        ))}
      </g>
      <g stroke={INK} strokeWidth={lx * 0.16}>{links}</g>
      <g stroke={hi} strokeWidth={lx * 0.07}>{links}</g>
      <rect x={x0 - 6} y={bottom - step * 0.9} width={x1 - x0 + 12} height={step * 1.1} rx={4} fill={steel} stroke={INK} strokeWidth={6} />
      <rect x={(x0 + x1) / 2 - step * 0.5} y={bottom - step * 0.65} width={step} height={step * 0.6} rx={3} fill="#2a2d33" stroke={INK} strokeWidth={4} />
    </g>
  );
};

// Flying glass shards from a point (world coords), t seconds after the break.
export const Shards: React.FC<{x: number; y: number; t: number; n?: number; scale?: number}> = ({x, y, t, n = 40, scale = 1}) => {
  if (t < 0) return null;
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2;
        const v = (300 + random(`v${i}`) * 900) * scale;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 900 * scale * t * t;
        const s = (10 + random(`s${i}`) * 26) * scale;
        const rot = random(`r${i}`) * 360 + t * 600;
        return (
          <path
            key={i}
            transform={`translate(${px},${py}) rotate(${rot})`}
            d={`M 0 ${-s} L ${s * 0.6} ${s * 0.4} L ${-s * 0.5} ${s * 0.6} Z`}
            fill="#d8f0ff"
            fillOpacity={0.75}
            stroke="#ffffff"
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

// Cracks spreading on a glass pane (world coords).
export const Cracks: React.FC<{x: number; y: number; r: number; k?: number}> = ({x, y, r, k = 1}) => (
  <g stroke="#ffffff" strokeWidth={3} strokeOpacity={0.8} fill="none" strokeLinecap="round">
    {new Array(9).fill(0).map((_, i) => {
      const a = (i / 9) * Math.PI * 2 + random(`c${i}`) * 0.5;
      const l = r * k * (0.6 + random(`cl${i}`) * 0.5);
      const mx = x + Math.cos(a + 0.2) * l * 0.5;
      const my = y + Math.sin(a + 0.2) * l * 0.5;
      return <path key={i} d={`M ${x} ${y} L ${mx} ${my} L ${x + Math.cos(a) * l} ${y + Math.sin(a) * l}`} />;
    })}
    <circle cx={x} cy={y} r={r * 0.18 * k} />
  </g>
);

// Sound waves coming out of a point (world coords).
export const Waves: React.FC<{x: number; y: number; t: number; size: number; color?: string; dir?: 1 | -1}> = ({x, y, t, size, color = '#8fd18a', dir = 1}) => (
  <g fill="none" stroke={color} strokeLinecap="round">
    {[0, 1, 2].map((i) => {
      const k = (t * 1.6 + i / 3) % 1;
      const r = size * (0.3 + k);
      return (
        <path
          key={i}
          d={`M ${x + dir * r * 0.5} ${y - r * 0.85} A ${r} ${r} 0 0 ${dir === 1 ? 1 : 0} ${x + dir * r * 0.5} ${y + r * 0.85}`}
          strokeWidth={size * 0.09}
          opacity={1 - k}
        />
      );
    })}
  </g>
);

// Red marker circle around something (world coords), drawn on with t.
export const Ring: React.FC<{x: number; y: number; rx: number; ry: number; t: number; at?: number; color?: string; w?: number}> = ({x, y, rx, ry, t, at = 0, color = '#e2392d', w = 20}) => {
  const k = Math.min(1, Math.max(0, (t - at) / 0.35));
  if (k <= 0) return null;
  const c = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  return (
    <ellipse
      cx={x}
      cy={y}
      rx={rx}
      ry={ry}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeDasharray={`${c * k} ${c}`}
      transform={`rotate(-80 ${x} ${y})`}
      strokeLinecap="round"
    />
  );
};

// Big padlock (world or screen coords).
export const Padlock: React.FC<{x: number; y: number; s: number; open?: boolean}> = ({x, y, s, open = false}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d={open ? 'M -26 -10 L -26 -48 A 26 26 0 0 1 26 -48 L 26 -40' : 'M -26 -10 L -26 -48 A 26 26 0 0 1 26 -48 L 26 -10'} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path d={open ? 'M -26 -10 L -26 -48 A 26 26 0 0 1 26 -48 L 26 -40' : 'M -26 -10 L -26 -48 A 26 26 0 0 1 26 -48 L 26 -10'} fill="none" stroke="#b9c1cc" strokeWidth={11} strokeLinecap="round" />
    <rect x={-46} y={-14} width={92} height={78} rx={12} fill="#e0b94a" stroke={INK} strokeWidth={8} />
    <circle cx={0} cy={18} r={9} fill={INK} />
    <rect x={-4} y={20} width={8} height={22} rx={3} fill={INK} />
  </g>
);

// Arrow from (x0,y0) to (x1,y1), thick, outlined (screen or world coords).
export const Arrow: React.FC<{x0: number; y0: number; x1: number; y1: number; w?: number; color?: string; k?: number}> = ({x0, y0, x1, y1, w = 34, color = '#f0c53c', k = 1}) => {
  if (k <= 0) return null;
  const ex = x0 + (x1 - x0) * k;
  const ey = y0 + (y1 - y0) * k;
  const a = Math.atan2(ey - y0, ex - x0);
  const hx = ex - Math.cos(a) * w * 1.2;
  const hy = ey - Math.sin(a) * w * 1.2;
  const head = `M ${ex} ${ey} L ${hx + Math.cos(a + Math.PI / 2) * w * 1.2} ${hy + Math.sin(a + Math.PI / 2) * w * 1.2} L ${hx - Math.cos(a + Math.PI / 2) * w * 1.2} ${hy - Math.sin(a + Math.PI / 2) * w * 1.2} Z`;
  return (
    <g>
      <line x1={x0} y1={y0} x2={hx} y2={hy} stroke={INK} strokeWidth={w + 14} strokeLinecap="round" />
      <path d={head} fill={INK} stroke={INK} strokeWidth={14} strokeLinejoin="round" />
      <line x1={x0} y1={y0} x2={hx} y2={hy} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={head} fill={color} />
    </g>
  );
};

// Motion lines next to something that rattles or moves (world coords).
export const Rattle: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <g stroke="#ffffff" strokeWidth={6 * s} strokeLinecap="round" opacity={0.85}>
    {[-1, 1].map((side) =>
      [0, 1, 2].map((i) => {
        const j = Math.sin(t * 40 + i) * 4 * s;
        const px = x + side * (60 + i * 6) * s + j;
        const py = y - 50 * s + i * 50 * s;
        return <line key={`${side}${i}`} x1={px} y1={py - 18 * s} x2={px + side * 14 * s} y2={py + 18 * s} />;
      }),
    )}
  </g>
);
