import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {FONT} from '../thumbs/Thumbs';
import type {CWord} from './cues';
import {MallMap} from './MallMap';
import {Clock, Tag, Txt} from './Overlays';
import {BgName, Cam, lerpCam, World} from './World';

// Vertical (9:16) building blocks for the mall Shorts.
export const VW = 1080;
export const VH = 1920;
const INK = '#1d1a1a';
const GOLD = '#f0c53c';
const RADIO_GREEN = '#8fd18a';

export type VP = {t: number; dur: number; frame: number; ev: Record<string, number>};
export type VShot = {at: string; ev?: Record<string, string>; draw: (p: VP) => React.ReactNode};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const camAt = (a: Cam, b: Cam | undefined, p: VP) => (b ? lerpCam(a, b, clamp01(p.t / Math.max(p.dur, 0.01))) : a);
const fadeIn = (t: number, at: number, len = 0.25) => clamp01((t - at) / len);

// Screen-space layer for vertical overlays (1080x1920 SVG).
export const VScreen: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);

export const VScene: React.FC<{
  bg: BgName;
  a: Cam;
  b?: Cam;
  p: VP;
  filter?: string;
  shakeXY?: [number, number];
  children?: React.ReactNode;
  over?: React.ReactNode;
  screen?: React.ReactNode;
}> = ({bg, a, b, p, filter, shakeXY, children, over, screen}) => (
  <AbsoluteFill>
    <World bg={bg} cam={camAt(a, b, p)} width={VW} height={VH} filter={filter} shake={shakeXY} over={over}>
      {children}
    </World>
    {screen && <VScreen>{screen}</VScreen>}
  </AbsoluteFill>
);

/* ---------------- overlays ---------------- */

// Series name and where/when, top of the frame (below the phone's status icons).
export const TopTag: React.FC<{text: string; t: number}> = ({text, t}) => {
  const o = fadeIn(t, 0.05, 0.3);
  const size = 40;
  const w = text.length * size * 0.6 + 70;
  return (
    <g opacity={o} transform={`translate(${VW / 2}, 232)`}>
      <Txt x={0} y={-44} size={34} fill={GOLD}>
        THE NIGHT GUARD
      </Txt>
      <rect x={-w / 2} y={-26} width={w} height={64} rx={32} fill="#0f1218" opacity={0.82} stroke={INK} strokeWidth={4} />
      <text x={0} y={18} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={size - 6} fill="#eef1f6" letterSpacing="0.06em">
        {text}
      </text>
    </g>
  );
};

// Word-by-word captions: up to three words (16 letters) at a time, the word being said in gold,
// Marcus's radio words in radio green.
type Group = {words: CWord[]; s: number; e: number};
const groupWords = (words: CWord[]): Group[] => {
  const out: Group[] = [];
  let cur: CWord[] = [];
  const flush = () => {
    if (cur.length) out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e});
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    if (prev && (prev.seg !== w.seg || cur.length >= 3 || chars > 16 || w.s - prev.e > 0.45)) flush();
    cur.push(w);
    if (/[.,!?;:"”]$/.test(w.w) && (words[i + 1]?.s ?? 1e9) - w.e > 0.12) flush();
  });
  flush();
  return out;
};
// strip quotes and trailing punctuation, but keep abbreviations like "a.m." whole
const show = (w: string) => {
  const x = w.replace(/["“”]/g, '');
  if (/^[ap]\.m\.?[,;:]?$/i.test(x)) return x.replace(/[,;:]$/, '').replace(/\.?$/, '.').toUpperCase();
  return x.replace(/[.,;:]+$/g, '').toUpperCase();
};

export const Captions: React.FC<{words: CWord[]; t: number; y?: number; until?: number}> = ({words, t, y = 1290, until = 1e9}) => {
  const groups = React.useMemo(() => groupWords(words), [words]);
  if (t >= until) return null;
  const gi = groups.findIndex((g, i) => t >= g.s - 0.05 && t < Math.max(g.e + 0.35, 0) && (i + 1 >= groups.length || t < groups[i + 1].s - 0.05));
  if (gi < 0) return null;
  const g = groups[gi];
  const text = g.words.map((w) => show(w.w)).join(' ');
  const size = Math.min(96, 940 / Math.max(1, text.length * 0.6));
  const pop = interpolate(t - g.s, [-0.05, 0.06], [0.88, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let cur = -1;
  g.words.forEach((w, i) => {
    if (t >= w.s - 0.03) cur = i;
  });
  return (
    <g transform={`translate(${VW / 2}, ${y}) scale(${pop})`}>
      <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontSize={size} stroke={INK} strokeWidth={size * 0.17} strokeLinejoin="round" paintOrder="stroke" letterSpacing="0.02em">
        {g.words.map((w, i) => (
          <tspan key={i} fill={w.kind === 'radio' ? (i === cur ? '#d4ffc8' : RADIO_GREEN) : i === cur ? GOLD : '#ffffff'}>
            {(i ? ' ' : '') + show(w.w)}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// Lower-third style name tag, sliding in from the left, placed high so captions stay clear.
export const VNameTag: React.FC<{name: string; sub: string; t: number; at?: number; y?: number}> = ({name, sub, t, at = 0.2, y = 400}) => {
  const k = interpolate(t, [at, at + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (k <= 0) return null;
  const x = -760 + 820 * (1 - (1 - k) ** 3);
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={700} height={140} rx={10} fill="#101420" opacity={0.9} stroke={INK} strokeWidth={6} />
      <rect x={0} y={0} width={18} height={140} rx={6} fill={GOLD} />
      <Txt x={44} y={74} size={66} anchor="start">
        {name}
      </Txt>
      <text x={46} y={116} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={27} fill="#cfd6e6" letterSpacing="0.06em">
        {sub}
      </text>
    </g>
  );
};

// Who is talking on the radio, above the captions.
export const VRadioBadge: React.FC<{name: string; t: number; color?: string; y?: number}> = ({name, t, color = RADIO_GREEN, y = 1120}) => (
  <g transform={`translate(${VW / 2}, ${y})`}>
    <rect x={-300} y={-52} width={600} height={104} rx={52} fill="#101216" opacity={0.88} stroke={INK} strokeWidth={6} />
    <g transform="translate(-238, 0)">
      <line x1={8} y1={-22} x2={8} y2={-42} stroke="#cfd3da" strokeWidth={5} strokeLinecap="round" />
      <rect x={-15} y={-25} width={34} height={52} rx={6} fill="#2a2b30" stroke="#cfd3da" strokeWidth={4} />
      <rect x={-8} y={-17} width={20} height={12} fill={color} />
    </g>
    <Txt x={-186} y={17} size={46} anchor="start" fill={color}>
      {name}
    </Txt>
    {new Array(10).fill(0).map((_, i) => {
      const h = 7 + Math.abs(Math.sin(t * 13 + i * 1.7) * Math.sin(t * 5.3 + i)) * 38;
      return <rect key={i} x={92 + i * 16} y={-h / 2} width={9} height={h} rx={4} fill={color} />;
    })}
  </g>
);

export const VNoSignal: React.FC<{t: number; at: number; y?: number}> = ({t, at, y = 1120}) => {
  if (t < at) return null;
  const blink = Math.floor((t - at) * 2.5) % 2 === 0;
  return (
    <g transform={`translate(${VW / 2}, ${y})`}>
      <rect x={-300} y={-52} width={600} height={104} rx={52} fill="#101216" opacity={0.88} stroke={INK} strokeWidth={6} />
      <line x1={-90} y1={0} x2={250} y2={0} stroke={RADIO_GREEN} strokeWidth={6} strokeLinecap="round" />
      <Txt x={-262} y={16} size={44} anchor="start" fill={blink ? '#ff4d3a' : '#8a3a33'}>
        NO SIGNAL
      </Txt>
    </g>
  );
};

export const VClock: React.FC<{text: string; ampm: string; t: number; at?: number; y?: number}> = ({text, ampm, t, at = 0.1, y = 440}) => (
  <g>
    <Clock x={VW / 2 - 40} y={y} text={text} t={t} at={at} />
    {t >= at && (
      <Txt x={VW / 2 + 172} y={y + 24} size={52} anchor="start">
        {ampm}
      </Txt>
    )}
  </g>
);

export const VTag: React.FC<{text: string; t: number; at?: number; y?: number; size?: number; kind?: 'ok' | 'no' | 'key' | 'info' | 'none'}> = ({
  text,
  t,
  at = 0.05,
  y = 430,
  size = 78,
  kind = 'none',
}) => <Tag x={VW / 2} y={y} text={text} t={t} at={at} size={size} anchor="middle" kind={kind} />;

// Tape-rewind look, vertical.
export const VRewind: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const y = (random(`vrw${i}-${Math.floor(frame / 2)}`) * VH) | 0;
    lines.push(<rect key={i} x={0} y={y} width={VW} height={5 + (i % 3) * 4} fill="#ffffff" opacity={0.22} />);
  }
  return (
    <VScreen>
      {lines}
      <g transform="translate(90, 400)" opacity={Math.floor(t * 4) % 2 === 0 ? 1 : 0.6}>
        <path d="M 60 -40 L 0 0 L 60 40 Z M 120 -40 L 60 0 L 120 40 Z" fill="#ffffff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <Txt x={150} y={22} size={60} anchor="start">
          REWIND
        </Txt>
      </g>
    </VScreen>
  );
};

// End card: series title and what to do next.
export const EndCard: React.FC<{t: number; line: string}> = ({t, line}) => {
  const o = fadeIn(t, 0, 0.3);
  const k = fadeIn(t, 0.15, 0.4);
  const bob = Math.sin(t * 6) * 10;
  return (
    <AbsoluteFill style={{background: `rgba(8,10,14,${0.82 * o})`}}>
      <VScreen>
        <g opacity={k} transform={`translate(${VW / 2}, 820) scale(${0.9 + 0.1 * k})`}>
          <circle cx={-70} cy={-170} r={34} fill="none" stroke={GOLD} strokeWidth={14} />
          <path d="M -40 -170 H 90 M 50 -170 V -140 M 76 -170 V -146" stroke={GOLD} strokeWidth={14} strokeLinecap="round" fill="none" />
          <Txt x={0} y={0} size={104}>
            THE NIGHT GUARD
          </Txt>
          <Txt x={0} y={150} size={66} fill={GOLD}>
            {line}
          </Txt>
          <path d={`M -40 ${250 + bob} L 0 ${290 + bob} L 40 ${250 + bob}`} fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </VScreen>
    </AbsoluteFill>
  );
};

/* ---------------- new pictures for the Shorts ---------------- */

// Lily's window in the Parkview tower (picture px on the parkview background): 10th floor, 4th from the left.
export const LILY_WIN = {x: 1000, y: 234, w: 26, h: 30};
export const TowerWindow: React.FC<{on: number}> = ({on}) => {
  const {x, y, w, h} = LILY_WIN;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#1b2236" />
      {on > 0 && (
        <g opacity={on}>
          <circle cx={x} cy={y} r={70} fill="url(#lilyGlow)" />
          <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#fff6d2" />
        </g>
      )}
      <defs>
        <radialGradient id="lilyGlow">
          <stop offset="0%" stopColor="#fff2b8" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ffd36b" stopOpacity={0} />
        </radialGradient>
      </defs>
    </g>
  );
};

// Light patterns: three blinks ("I love you") and SOS. Both return 0..1 (on/off with soft edges).
const soft = (t: number, a: number, b: number) => clamp01(Math.min((t - a) / 0.04, (b - t) / 0.04, 1));
export const threeBlinks = (t: number, start: number) => {
  let v = 0;
  for (let i = 0; i < 3; i++) v = Math.max(v, soft(t, start + i * 0.55, start + i * 0.55 + 0.32));
  return v;
};
// SOS: dot 0.2 s, dash 0.6 s, 0.18 s between symbols, 0.45 s between letters, 1 s before repeating.
const SOS_STEPS: [number, number][] = (() => {
  const out: [number, number][] = [];
  let t = 0;
  [['.', '.', '.'], ['-', '-', '-'], ['.', '.', '.']].forEach((letter, li) => {
    letter.forEach((sym, si) => {
      const len = sym === '.' ? 0.2 : 0.6;
      out.push([t, t + len]);
      t += len + (si < 2 ? 0.18 : li < 2 ? 0.45 : 0);
    });
  });
  return out;
})();
const SOS_LEN = SOS_STEPS[SOS_STEPS.length - 1][1] + 1.0;
export const sosAt = (t: number, start: number) => {
  if (t < start) return {on: 0, step: -1};
  const u = (t - start) % SOS_LEN;
  const k = SOS_STEPS.findIndex(([a, b]) => u >= a && u < b);
  return {on: k >= 0 ? soft(u, SOS_STEPS[k][0], SOS_STEPS[k][1]) : 0, step: k};
};
// The SOS pattern spelled out under the tower, the current symbol lit.
export const SosStrip: React.FC<{step: number; y?: number}> = ({step, y = 1060}) => {
  let x = VW / 2 - 400;
  const marks: React.ReactNode[] = [];
  ['.', '.', '.', '-', '-', '-', '.', '.', '.'].forEach((sym, i) => {
    const lit = i === step;
    const fill = lit ? '#fff6d2' : '#5b6274';
    if (sym === '.') {
      marks.push(<circle key={i} cx={x + 18} cy={y} r={18} fill={fill} stroke={INK} strokeWidth={5} />);
      x += 62;
    } else {
      marks.push(<rect key={i} x={x} y={y - 16} width={86} height={32} rx={16} fill={fill} stroke={INK} strokeWidth={5} />);
      x += 112;
    }
    if (i === 2 || i === 5) x += 34;
  });
  return (
    <g transform={`translate(${VW / 2}, ${y}) scale(1.15) translate(${-VW / 2}, ${-y})`}>
      <rect x={VW / 2 - 440} y={y - 130} width={880} height={180} rx={40} fill="#0f1218" opacity={0.82} stroke={INK} strokeWidth={5} />
      {marks}
      <Txt x={VW / 2} y={y - 50} size={60} fill={GOLD}>
        S · O · S
      </Txt>
    </g>
  );
};

// A heart that pops up beside the window ("it means I love you"), picture px.
export const HeartPop: React.FC<{x: number; y: number; t: number; at: number; s?: number}> = ({x, y, t, at, s = 1}) => {
  const k = interpolate(t - at, [0, 0.18, 0.3], [0, 1.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (k <= 0) return null;
  return (
    <path
      transform={`translate(${x},${y}) scale(${k * s})`}
      d="M 0 12 C -30 -10 -22 -38 0 -24 C 22 -38 30 -10 0 12 Z"
      fill="#e8445a"
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  );
};

// A ring of keys in close-up, one key with a red tag. Full-frame, screen px.
export const KeyRing: React.FC<{t: number; glowAt?: number; tagBig?: number}> = ({t, glowAt = 1e9, tagBig = 0}) => {
  const swing = Math.sin(t * 1.6) * 3;
  const glow = t >= glowAt ? 0.5 + 0.5 * Math.sin((t - glowAt) * 7) : 0;
  const keys = [-62, -46, -31, -16, -2, 12, 27, 42, 57];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #2c3446 0%, #10141c 70%)'}}>
      <VScreen>
        <g transform={`translate(${VW / 2}, ${640 - tagBig * 90}) scale(${1.55 + tagBig * 0.45}) rotate(${swing})`}>
          <circle cx={0} cy={0} r={96} fill="none" stroke="#c9ccd2" strokeWidth={16} />
          <circle cx={0} cy={0} r={96} fill="none" stroke={INK} strokeWidth={4} />
          {keys.map((a, i) => {
            const last = i === keys.length - 1;
            const brass = i % 2 === 0;
            const c = last ? '#b9bec7' : brass ? '#d9b44a' : '#c8ccd4';
            return (
              <g key={i} transform={`rotate(${a}) translate(0, 96)`}>
                <circle cx={0} cy={44} r={30} fill={c} stroke={INK} strokeWidth={6} />
                <circle cx={0} cy={44} r={9} fill="#10141c" stroke={INK} strokeWidth={3} />
                <rect x={-10} y={70} width={20} height={190} fill={c} stroke={INK} strokeWidth={6} />
                <path d={`M 10 190 h 22 v 16 h -12 v 14 h 10 v 16 h -20`} fill={c} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
                {last && (
                  <g>
                    {glow > 0 && <circle cx={0} cy={150} r={120} fill="#ffd36b" opacity={0.18 * glow} />}
                    <path d="M 0 60 C 40 90 70 100 86 130" stroke="#e9e2cf" strokeWidth={4} fill="none" />
                    <g transform="translate(86, 130) rotate(-20)">
                      <rect x={-6} y={0} width={84} height={56} rx={10} fill="#c8332f" stroke={INK} strokeWidth={6} />
                      <circle cx={8} cy={28} r={6} fill="#10141c" />
                      <text x={46} y={42} textAnchor="middle" fontFamily={FONT} fontSize={38} fill="#fff6e0">
                        B3
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </VScreen>
    </AbsoluteFill>
  );
};

// A steel door in the dark with B3 stencilled on it. Full-frame, screen px.
export const B3Door: React.FC<{t: number; dur: number; frame: number}> = ({t, dur, frame}) => {
  const z = 1 + 0.08 * clamp01(t / Math.max(dur, 0.1));
  const flick = random(`bulb${Math.floor(frame / 3)}`) > 0.86 ? 0.35 : 1;
  return (
    <AbsoluteFill style={{background: '#07080b', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '50% 45%'}}>
        <VScreen>
          <defs>
            <radialGradient id="b3light" cx="50%" cy="22%" r="60%">
              <stop offset="0%" stopColor="#f2d38a" stopOpacity={0.55 * flick} />
              <stop offset="100%" stopColor="#f2d38a" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="b3wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b2e33" />
              <stop offset="100%" stopColor="#15171b" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={VW} height={VH} fill="url(#b3wall)" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={i} x1={0} y1={260 + i * 190} x2={VW} y2={260 + i * 190} stroke="#0e1013" strokeWidth={4} opacity={0.6} />
          ))}
          <rect x={0} y={1500} width={VW} height={420} fill="#101114" />
          {/* the door */}
          <rect x={250} y={520} width={580} height={985} fill="#3a4048" stroke={INK} strokeWidth={14} />
          <rect x={280} y={550} width={520} height={925} fill="#454c55" stroke="#2a2f35" strokeWidth={6} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <circle cx={300} cy={600 + i * 200} r={8} fill="#2a2f35" />
              <circle cx={780} cy={600 + i * 200} r={8} fill="#2a2f35" />
            </g>
          ))}
          <rect x={300} y={1000} width={480} height={34} rx={8} fill="#2a2f35" stroke={INK} strokeWidth={5} />
          <text x={540} y={880} textAnchor="middle" fontFamily={FONT} fontSize={250} fill="#d9b44a" opacity={0.78} letterSpacing="0.08em">
            B3
          </text>
          <rect x={250} y={1500} width={580} height={10} fill="#f2d38a" opacity={0.35 * flick} />
          {/* the caged bulb */}
          <line x1={540} y1={300} x2={540} y2={400} stroke="#1a1c20" strokeWidth={8} />
          <circle cx={540} cy={430} r={34} fill="#f6e2a6" opacity={flick} />
          <path d="M 506 430 A 34 34 0 0 1 574 430 M 510 412 L 570 448 M 570 412 L 510 448" stroke="#1a1c20" strokeWidth={5} fill="none" />
          <rect x={0} y={0} width={VW} height={VH} fill="url(#b3light)" />
        </VScreen>
      </div>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
    </AbsoluteFill>
  );
};

// The mall map, fitted to the vertical frame, with a "no B3 anywhere" stamp.
export const MapNoB3: React.FC<{t: number; dur: number; stampAt: number}> = ({t, dur, stampAt}) => {
  const s = VW / 1920;
  const k = interpolate(t - stampAt, [0, 0.12, 0.22], [2.2, 0.95, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#10141c'}}>
      <div style={{position: 'absolute', left: 0, top: (VH - 1080 * s) / 2 - 80, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: '0 0'}}>
        <MallMap mode="keys" t={t} dur={dur} />
      </div>
      <VScreen>
        {t >= stampAt && (
          <g transform={`translate(${VW / 2}, 900) rotate(-8) scale(${k})`} opacity={0.95}>
            <rect x={-250} y={-90} width={500} height={150} rx={18} fill="none" stroke="#e0433a" strokeWidth={16} />
            <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontSize={110} fill="#e0433a" letterSpacing="0.06em">
              NO B3
            </text>
          </g>
        )}
      </VScreen>
    </AbsoluteFill>
  );
};
