import React from 'react';
import {AbsoluteFill} from 'remotion';

export const INK = '#0b0b0b';
export const RED = '#ff5a4a';
const IW = 4.5; // outline width in world px (matches the pictures' outline at pigeon scale)

const svgAt = (x: number, y: number, w: number, h: number, children: React.ReactNode, style?: React.CSSProperties) => (
  <svg width={w} height={h} viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

/** Vertical dashed guide line (world-pinned). s = pop 0..1 (grows from the middle). */
export const DashedLine: React.FC<{x: number; y0: number; y1: number; s: number; color?: string}> = ({x, y0, y1, s, color = RED}) => {
  if (s <= 0.001) return null;
  const len = y1 - y0;
  const dash = 40, gap = 24, w = 16;
  const n = Math.floor((len + gap) / (dash + gap));
  const items = [];
  for (let i = 0; i < n; i++) {
    const yy = -len / 2 + i * (dash + gap);
    items.push(<rect key={i} x={-w / 2} y={yy} width={w} height={dash} rx={w / 2} fill={color} stroke={INK} strokeWidth={IW * 0.75} />);
  }
  return svgAt(x, (y0 + y1) / 2, 40, len + 40, <g transform={`scale(${Math.min(1, s * 1.1)} ${s})`}>{items}</g>);
};

/** Red round badge with a white pause symbol. */
export const PauseBadge: React.FC<{x: number; y: number; s: number; r?: number}> = ({x, y, s, r = 46}) => {
  if (s <= 0.001) return null;
  return svgAt(x, y, r * 3, r * 3, (
    <g transform={`scale(${s})`}>
      <circle r={r} fill={RED} stroke={INK} strokeWidth={IW} />
      <rect x={-r * 0.42} y={-r * 0.45} width={r * 0.28} height={r * 0.9} rx={r * 0.08} fill="#fff" stroke={INK} strokeWidth={IW * 0.7} />
      <rect x={r * 0.14} y={-r * 0.45} width={r * 0.28} height={r * 0.9} rx={r * 0.08} fill="#fff" stroke={INK} strokeWidth={IW * 0.7} />
    </g>
  ));
};

/** Block arrow; dir 1 = right, -1 = left. */
export const Arrow: React.FC<{x: number; y: number; len: number; s: number; dir?: 1 | -1; color?: string; th?: number}> = ({x, y, len, s, dir = 1, color = '#ffffff', th = 34}) => {
  if (s <= 0.001) return null;
  const hl = th * 1.5, hw = th * 1.25;
  const d = `M${-len / 2} ${-th / 2}L${len / 2 - hl} ${-th / 2}L${len / 2 - hl} ${-hw}L${len / 2} 0L${len / 2 - hl} ${hw}L${len / 2 - hl} ${th / 2}L${-len / 2} ${th / 2}Z`;
  return svgAt(x, y, len + 40, hw * 2 + 40, <path d={d} transform={`scale(${dir * s} ${s})`} fill={color} stroke={INK} strokeWidth={IW} strokeLinejoin="round" />);
};

/** Red X stamp. */
export const XMark: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot = 0}) => {
  if (s <= 0.001) return null;
  const w = r * 0.36;
  const bar = (a: number) => <rect key={a} x={-r} y={-w / 2} width={2 * r} height={w} rx={w / 2} transform={`rotate(${a})`} fill={RED} stroke={INK} strokeWidth={IW} />;
  return svgAt(x, y, r * 3, r * 3, (
    <g transform={`rotate(${rot}) scale(${s})`}>
      {bar(45)}{bar(-45)}
      <rect x={-r} y={-w / 2} width={2 * r} height={w} rx={w / 2} transform="rotate(45)" fill={RED} />
    </g>
  ));
};

/** Speed lines trailing to the left of (x, y). u = 0..1 life. */
export const SpeedLines: React.FC<{x: number; y: number; u: number; len?: number; gap?: number}> = ({x, y, u, len = 150, gap = 46}) => {
  if (u <= 0 || u >= 1) return null;
  const grow = Math.min(1, u * 3);
  const shrink = u > 0.45 ? 1 - (u - 0.45) / 0.55 : 1;
  const L = len * grow * shrink;
  const lines = [-1, 0, 1].map((k) => {
    const l = L * (k === 0 ? 1 : 0.72);
    return (
      <g key={k}>
        <line x1={-l} y1={k * gap} x2={0} y2={k * gap} stroke={INK} strokeWidth={14 + 2 * IW} strokeLinecap="round" />
        <line x1={-l} y1={k * gap} x2={0} y2={k * gap} stroke="#ffffff" strokeWidth={14} strokeLinecap="round" />
      </g>
    );
  });
  return svgAt(x, y, len * 2 + 60, gap * 2 + 80, <g>{lines}</g>);
};

/** Light-blue sweat drop with outline and glint. */
export const SweatDrop: React.FC<{x: number; y: number; s: number; r?: number; rot?: number}> = ({x, y, s, r = 26, rot = 0}) => {
  if (s <= 0.001) return null;
  const d = `M0 ${-r * 2}C${r * 0.3} ${-r * 1.2} ${r} ${-r * 0.6} ${r} 0A${r} ${r} 0 0 1 ${-r} 0C${-r} ${-r * 0.6} ${-r * 0.3} ${-r * 1.2} 0 ${-r * 2}Z`;
  return svgAt(x, y, r * 4, r * 6, (
    <g transform={`rotate(${rot}) scale(${s})`}>
      <path d={d} fill="#8fd3ff" stroke={INK} strokeWidth={IW} strokeLinejoin="round" />
      <ellipse cx={-r * 0.38} cy={-r * 0.2} rx={r * 0.18} ry={r * 0.32} fill="#fff" />
    </g>
  ));
};

/** Viewfinder corner brackets centred on (cx, cy). */
export const Brackets: React.FC<{cx: number; cy: number; w: number; h: number; s: number; color?: string}> = ({cx, cy, w, h, s, color = '#ffffff'}) => {
  if (s <= 0.001) return null;
  const L = Math.min(w, h) * 0.26;
  const c = (sx: number, sy: number) => `M${(sx * w) / 2} ${(sy * h) / 2 - sy * L}L${(sx * w) / 2} ${(sy * h) / 2}L${(sx * w) / 2 - sx * L} ${(sy * h) / 2}`;
  const ds = [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)];
  return svgAt(cx, cy, w + 80, h + 80, (
    <g transform={`scale(${s})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {ds.map((d, i) => <path key={`k${i}`} d={d} stroke={INK} strokeWidth={12 + 2 * IW} />)}
      {ds.map((d, i) => <path key={`w${i}`} d={d} stroke={color} strokeWidth={12} />)}
      <circle r={9} fill={RED} stroke={INK} strokeWidth={IW * 0.8} />
    </g>
  ));
};

/** Screen-space sight cone from an eye to a target box. */
export const SightCone: React.FC<{ex: number; ey: number; tx: number; ty: number; th: number; a: number}> = ({ex, ey, tx, ty, th, a}) => {
  if (a <= 0.001) return null;
  const d = `M${ex} ${ey}L${tx} ${ty - th / 2}L${tx} ${ty + th / 2}Z`;
  return (
    <AbsoluteFill style={{opacity: a}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={d} fill="rgba(255,248,214,0.55)" />
        {[-1, 1].map((sg) => (
          <g key={sg}>
            <line x1={ex} y1={ey} x2={tx} y2={ty + (sg * th) / 2} stroke="#0b0b0b" strokeWidth={13} strokeDasharray="1 22" strokeLinecap="round" />
            <line x1={ex} y1={ey} x2={tx} y2={ty + (sg * th) / 2} stroke="#ffffff" strokeWidth={7} strokeDasharray="1 22" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{a: number}> = ({a}) => (a > 0.001 ? <AbsoluteFill style={{background: '#ffffff', opacity: a}} /> : null);

/** Bread crumb (world px). */
const Eyes: React.FC<{r: number; gap: number; mode: 'open' | 'worried' | 'squeeze' | 'closed'; look?: [number, number]}> = ({r, gap, mode, look = [0, 0]}) => {
  const ew = IW * 0.8;
  if (mode === 'squeeze') {
    const c = (sx: number) => `M${sx * gap - sx * r * 0.9} ${-r * 0.8}L${sx * gap + sx * r * 0.5} 0L${sx * gap - sx * r * 0.9} ${r * 0.8}`;
    return <g fill="none" stroke={INK} strokeWidth={ew * 1.2} strokeLinecap="round" strokeLinejoin="round"><path d={c(-1)} /><path d={c(1)} /></g>;
  }
  if (mode === 'closed') {
    return <g fill="none" stroke={INK} strokeWidth={ew} strokeLinecap="round">{[-1, 1].map((sx) => <path key={sx} d={`M${sx * gap - r} 0Q${sx * gap} ${r * 0.7} ${sx * gap + r} 0`} />)}</g>;
  }
  return (
    <g>
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * gap} 0)`}>
          <ellipse rx={r} ry={r * 1.18} fill="#fff" stroke={INK} strokeWidth={ew} />
          <circle cx={look[0] * r * 0.45} cy={look[1] * r * 0.45} r={r * 0.52} fill={INK} />
          <circle cx={look[0] * r * 0.45 + r * 0.18} cy={look[1] * r * 0.45 - r * 0.2} r={r * 0.16} fill="#fff" />
          {mode === 'worried' && <path d={`M${-r * 1.1} ${-r * 1.75 + sx * r * 0.35}L${r * 1.1} ${-r * 1.75 - sx * r * 0.35}`} stroke={INK} strokeWidth={ew * 1.1} strokeLinecap="round" transform={`scale(${sx} 1)`} />}
        </g>
      ))}
    </g>
  );
};

export const Crumb: React.FC<{x: number; y: number; s: number; rot?: number; r?: number; face?: 'worried' | 'squeeze'; look?: [number, number]}> = ({x, y, s, rot = 0, r = 30, face, look}) => {
  if (s <= 0.001) return null;
  const d = `M${-r} ${-r * 0.2}C${-r * 0.9} ${-r * 0.9} ${-r * 0.1} ${-r * 1.05} ${r * 0.35} ${-r * 0.8}C${r * 0.95} ${-r * 0.55} ${r * 1.1} ${r * 0.2} ${r * 0.7} ${r * 0.6}C${r * 0.2} ${r * 0.95} ${-r * 0.8} ${r * 0.8} ${-r} ${-r * 0.2}Z`;
  return svgAt(x, y, r * 3, r * 3, (
    <g transform={`rotate(${rot}) scale(${s})`}>
      <path d={d} fill="#e0a35a" stroke={INK} strokeWidth={IW} strokeLinejoin="round" />
      <path d={d} transform="scale(0.62) translate(-4 -2)" fill="#f7dfaa" />
      {!face && <circle cx={-r * 0.2} cy={-r * 0.15} r={r * 0.08} fill="#d49752" />}
      {!face && <circle cx={r * 0.25} cy={r * 0.15} r={r * 0.07} fill="#d49752" />}
      {face && <g transform={`translate(${-r * 0.08} ${-r * 0.12})`}><Eyes r={r * 0.2} gap={r * 0.3} mode={face} look={look} /></g>}
      {face === 'worried' && <path d={`M${-r * 0.22} ${r * 0.32}Q${-r * 0.08} ${r * 0.22} ${r * 0.06} ${r * 0.32}`} fill="none" stroke={INK} strokeWidth={IW * 0.8} strokeLinecap="round" />}
    </g>
  ));
};

/** Framed poster with a slice of bread (world px, top-left at x, y). */
export const Poster: React.FC<{x: number; y: number; w: number; h: number; blink?: number; look?: number}> = ({x, y, w, h, blink = 0, look = 0}) => {
  const bw = w * 0.56, bh = h * 0.52;
  const bread = `M${-bw / 2} ${bh * 0.5}L${-bw / 2} ${-bh * 0.1}C${-bw * 0.62} ${-bh * 0.55} ${-bw * 0.3} ${-bh * 0.62} ${-bw * 0.12} ${-bh * 0.5}C${-bw * 0.05} ${-bh * 0.62} ${bw * 0.05} ${-bh * 0.62} ${bw * 0.12} ${-bh * 0.5}C${bw * 0.3} ${-bh * 0.62} ${bw * 0.62} ${-bh * 0.55} ${bw / 2} ${-bh * 0.1}L${bw / 2} ${bh * 0.5}Z`;
  return (
    <svg width={w + 20} height={h + 20} viewBox={`-10 -10 ${w + 20} ${h + 20}`} style={{position: 'absolute', left: x - 10, top: y - 10, overflow: 'visible'}}>
      <rect x={0} y={0} width={w} height={h} rx={10} fill="#f6efe1" stroke={INK} strokeWidth={IW * 1.4} />
      <rect x={w * 0.08} y={h * 0.07} width={w * 0.84} height={h * 0.86} rx={6} fill="#ffd27a" stroke={INK} strokeWidth={IW} />
      <g transform={`translate(${w / 2} ${h * 0.52})`}>
        <path d={bread} fill="#c98a45" stroke={INK} strokeWidth={IW} strokeLinejoin="round" />
        <path d={bread} transform="scale(0.78) translate(0 6)" fill="#f8e3b4" />
        <g transform={`translate(0 ${bh * 0.02})`}>
          <Eyes r={bw * 0.075} gap={bw * 0.16} mode={blink > 0.5 ? 'closed' : 'open'} look={[look * 0.9, 0.1]} />
        </g>
        <path d={`M${-bw * 0.1} ${bh * 0.2}Q0 ${bh * 0.3} ${bw * 0.1} ${bh * 0.2}`} fill="none" stroke={INK} strokeWidth={IW * 0.8} strokeLinecap="round" />
      </g>
      <path d={`M${w * 0.3} 0L${w / 2} ${-h * 0.09}L${w * 0.7} 0`} fill="none" stroke={INK} strokeWidth={IW} strokeLinejoin="round" />
      <circle cx={w / 2} cy={-h * 0.09} r={7} fill="#b8b8b8" stroke={INK} strokeWidth={IW * 0.7} />
    </svg>
  );
};
