// Shot 2 (5.0-6.5 s): a jerry can tipped over, gas glugging onto the concrete.
import React from 'react';
import {Frame, Glow, INK, OW, P, flick, handheld, hash, jolt, mix, vnoise} from './kit';
import {clamp, easeOutCubic, lerp} from '../pigeon/lib';

const VP = {x: 960, y: 60};

/** glug rhythm: 0..1 pulses, ~5 per second, irregular */
const glug = (t: number) => {
  const ph = t * 5.2 + 0.35 * Math.sin(t * 3.3);
  const f = ph - Math.floor(ph);
  const k = Math.floor(ph);
  return Math.pow(Math.sin(Math.PI * f), 2) * (0.6 + 0.4 * hash(k));
};

const Background: React.FC<{L: number}> = ({L}) => (
  <g style={{filter: 'blur(14px)'}}>
    {/* canopy tubes far above as bokeh */}
    {[380, 820, 1260].map((x, i) => (
      <ellipse key={i} cx={x} cy={-40} rx={170} ry={40} fill={mix('#1a2027', P.tube, 0.9 * L)} />
    ))}
    {/* pump island curb + pump base (left) */}
    <rect x={-200} y={190} width={760} height={130} fill={mix('#20242c', '#9aa19c', 0.7 * L)} />
    <rect x={-200} y={190} width={760} height={24} fill={mix('#3a3418', '#d8bd34', 0.8 * L)} />
    <rect x={150} y={-200} width={260} height={400} fill={mix('#1d2028', '#aab1b3', 0.7 * L)} />
    <rect x={150} y={-200} width={260} height={60} fill={mix('#3a1212', '#cf3a2c', 0.8 * L)} />
    {/* truck rear wheel + body (right) */}
    <rect x={1050} y={-300} width={1100} height={360} fill={mix(P.truckDark, P.truckLit, 0.35 * L)} />
    <rect x={1050} y={40} width={1100} height={40} fill="#0b0c10" />
    <circle cx={1380} cy={190} r={230} fill="#0b0c10" />
    <circle cx={1380} cy={190} r={118} fill={mix('#2a2e36', '#9aa3aa', 0.5 * L)} />
    <circle cx={1380} cy={190} r={40} fill="#15161a" />
  </g>
);

const Ground: React.FC<{L: number}> = ({L}) => {
  const lines = [];
  for (let i = -6; i <= 6; i++) {
    const x = 960 + i * 520;
    lines.push(<line key={`r${i}`} x1={VP.x + (x - VP.x) * 0.25} y1={VP.y + (300 - VP.y) * 0.25} x2={x + (x - VP.x) * 2} y2={1400} stroke={INK} strokeOpacity={0.35} strokeWidth={4} />);
  }
  for (const y of [420, 640, 1010]) lines.push(<line key={`h${y}`} x1={-300} y1={y} x2={2300} y2={y} stroke={INK} strokeOpacity={0.3} strokeWidth={4} />);
  const stains = [[420, 900, 160, 40], [1450, 760, 220, 46], [1180, 1020, 140, 30], [260, 560, 120, 22]].map(([x, y, rx, ry], i) => (
    <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#0b0d12" opacity={0.35} />
  ));
  return (
    <g>
      <defs>
        <linearGradient id="c-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#07090f" />
          <stop offset="28%" stopColor={mix('#151922', '#4a514f', 0.8 * L)} />
          <stop offset="100%" stopColor={mix('#1e232d', '#7d8580', 0.85 * L)} />
        </linearGradient>
      </defs>
      <rect x={-600} y={-400} width={3200} height={2000} fill="url(#c-ground)" />
      <g style={{mixBlendMode: 'screen'}}>
        <defs>
          <radialGradient id="c-pool">
            <stop offset="0%" stopColor="#d6f2e8" stopOpacity={0.32 * L} />
            <stop offset="100%" stopColor="#d6f2e8" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={900} cy={520} rx={1100} ry={520} fill="url(#c-pool)" />
      </g>
      {stains}
      {lines}
      {/* pebbles */}
      {Array.from({length: 40}, (_, i) => (
        <circle key={i} cx={-100 + hash(i * 2.1) * 2100} cy={340 + hash(i * 5.3) * 800} r={2 + hash(i) * 4} fill="#000" opacity={0.25} />
      ))}
    </g>
  );
};

/** puddle edge: wobbly blob that grows with u */
const puddlePath = (u: number, t: number) => {
  const n = 28;
  const cx = lerp(590, 520, u), cy = lerp(780, 860, u);
  const rx = lerp(50, 430, u), ry = lerp(18, 150, u);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + 0.12 * Math.sin(a * 3 + 1.3) + 0.08 * Math.sin(a * 5 + 0.4) + 0.03 * Math.sin(a * 7 + t * 2);
    // spreads more toward camera / left
    const bias = 1 + 0.25 * Math.max(0, Math.sin(a)) + 0.15 * Math.max(0, -Math.cos(a));
    pts.push([cx + Math.cos(a) * rx * wob * bias, cy + Math.sin(a) * ry * wob * bias]);
  }
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % n];
    d += `Q${p0[0]} ${p0[1]} ${(p0[0] + p1[0]) / 2} ${(p0[1] + p1[1]) / 2}`;
  }
  return d + 'Z';
};

const Puddle: React.FC<{u: number; t: number; L: number}> = ({u, t, L}) => {
  const d = puddlePath(u, t);
  return (
    <g>
      <defs>
        <clipPath id="c-pud"><path d={d} /></clipPath>
        <linearGradient id="c-sheen" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#7a3cff" stopOpacity={0.12} />
          <stop offset="30%" stopColor="#21d4b0" stopOpacity={0.3} />
          <stop offset="55%" stopColor="#ffd23a" stopOpacity={0.3} />
          <stop offset="80%" stopColor="#ff4f8a" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#3a7bff" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <path d={d} fill="#0c0f16" stroke={INK} strokeWidth={4} />
      <g clipPath="url(#c-pud)">
        {/* reflected tubes */}
        {[220, 560, 900].map((x, i) => (
          <rect key={i} x={x - 120 + 20 * Math.sin(t * 2 + i)} y={700 + i * 18} width={240} height={14} rx={7} fill={P.tube} opacity={0.85 * L} transform={`skewX(-20)`} />
        ))}
        <g style={{mixBlendMode: 'screen', filter: 'blur(5px)'}} opacity={0.55}>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${200 + i * 60} ${900 - i * 40}C${420 + i * 30} ${760 - i * 30 + 20 * Math.sin(t + i)} ${700 - i * 20} ${980 - i * 50} ${980 - i * 40} ${830 - i * 30}`} fill="none" stroke={['#7a3cff', '#21d4b0', '#ffd23a', '#ff4f8a'][i]} strokeWidth={16 - i * 2} opacity={0.55} />
          ))}
        </g>
        {/* concentric ripples where the stream lands */}
        {[0, 1, 2].map((i) => {
          const ph = (t * 1.6 + i / 3) % 1;
          return <ellipse key={i} cx={590} cy={772} rx={30 + 160 * ph} ry={10 + 50 * ph} fill="none" stroke="#c6d6d0" strokeWidth={3} opacity={(1 - ph) * 0.5 * L} />;
        })}
      </g>
    </g>
  );
};

/** red jerry can lying on its narrow side, top (handles + spout) to the left */
const Can: React.FC<{L: number; t: number}> = ({L, t}) => {
  const face = mix('#4a0d09', '#c42a1e', 0.35 + 0.45 * L);
  const top = mix('#5a110c', '#e2483a', 0.45 + 0.5 * L);
  const dark = mix('#2a0605', '#7e1712', 0.4 + 0.4 * L);
  const g = glug(t);
  return (
    <g transform="translate(1010 700) rotate(-4)">
      <ellipse cx={0} cy={22} rx={330} ry={38} fill="#000" opacity={0.5} />
      {/* top side strip (narrow face, seen from above) */}
      <path d="M-226 -320L226 -320Q246 -320 238 -336L222 -356L-238 -356Q-262 -356 -254 -336Z" fill={top} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      {/* big face */}
      <rect x={-250} y={-320} width={500} height={330} rx={26} fill={face} stroke={INK} strokeWidth={OW} />
      {/* recessed X */}
      <g strokeLinecap="round">
        <path d="M-200 -270L200 -40M-200 -40L200 -270" stroke={dark} strokeWidth={46} />
        <path d="M-200 -270L200 -40M-200 -40L200 -270" stroke={face} strokeWidth={26} />
        <path d="M-196 -276L196 -50M-196 -34L196 -264" stroke={top} strokeWidth={6} opacity={0.6} />
      </g>
      <rect x={-224} y={-296} width={448} height={280} rx={18} fill="none" stroke={dark} strokeWidth={10} />
      {/* scuffs */}
      {[[-120, -290, 60], [130, -60, 40], [40, -200, 30], [-170, -90, 50]].map(([x, y, w], i) => (
        <line key={i} x1={x} y1={y} x2={x + w} y2={y + 6} stroke="#e9d6c8" strokeWidth={3} opacity={0.35} strokeLinecap="round" />
      ))}
      {/* three handles on the left end */}
      {[-250, -170, -90].map((y, i) => (
        <path key={i} d={`M-250 ${y + 6}L-300 ${y + 14}L-300 ${y + 60}L-250 ${y + 66}`} fill="none" stroke={INK} strokeWidth={OW + 18} strokeLinejoin="round" />
      ))}
      {[-250, -170, -90].map((y, i) => (
        <path key={`h${i}`} d={`M-250 ${y + 6}L-300 ${y + 14}L-300 ${y + 60}L-250 ${y + 66}`} fill="none" stroke={top} strokeWidth={14} strokeLinejoin="round" />
      ))}
      {/* spout at the bottom-left corner, cap hanging open */}
      <path d="M-240 -30L-332 6L-356 -42L-262 -84Z" fill={mix('#1f2228', '#8d959b', 0.6 * L)} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      <path d="M-262 -76L-350 -36" stroke="#fff" strokeOpacity={0.25 * L} strokeWidth={5} />
      <ellipse cx={-344} cy={-18} rx={14} ry={27} transform="rotate(-22 -344 -18)" fill="#06070a" stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${8 * Math.sin(t * 9) * g} -300 -78)`}>
        <rect x={-322} y={-110} width={44} height={30} rx={6} fill={mix('#1f2228', '#a7afb4', 0.6 * L)} stroke={INK} strokeWidth={4} />
      </g>
      <Glow x={0} y={-340} rx={360} ry={70} rgb={P.tubeGlow} a={0.25 * L} id="c-top" />
    </g>
  );
};

/** stream of gas from the spout to the puddle, pulsing with the glugs */
const Stream: React.FC<{t: number; L: number}> = ({t, L}) => {
  const g = glug(t);
  const w = 12 + 30 * g;
  const x0 = 668, y0 = 707;
  const x1 = 590, y1 = 770;
  const drops = [];
  for (let i = 0; i < 6; i++) {
    const ph = (t * 2.4 + i / 6) % 1;
    const a = -2.2 + hash(i * 3) * 1.4;
    drops.push(<circle key={i} cx={x1 + Math.cos(a) * 90 * ph} cy={y1 + Math.sin(a) * 50 * ph + 120 * ph * ph} r={(4 + 4 * hash(i)) * (1 - ph)} fill={P.gas} opacity={0.8 * (1 - ph)} />);
  }
  return (
    <g>
      <path d={`M${x0} ${y0}Q${x0 - 70} ${y0 + 4} ${x1} ${y1}`} fill="none" stroke={INK} strokeWidth={w + 9} strokeLinecap="round" opacity={0.75} />
      <path d={`M${x0} ${y0}Q${x0 - 70} ${y0 + 4} ${x1} ${y1}`} fill="none" stroke={mix('#5a4818', P.gas, 0.55 + 0.45 * L)} strokeWidth={w} strokeLinecap="round" opacity={0.92} />
      <path d={`M${x0 - 6} ${y0 - w * 0.25}Q${x0 - 74} ${y0 - 2} ${x1 + 4} ${y1 - 10}`} fill="none" stroke="#fff6d8" strokeWidth={Math.max(2, w * 0.16)} strokeLinecap="round" opacity={0.75 * L} />
      {[0, 1, 2].map((i) => {
        const ph = (t * 5.2 + i / 3) % 1;
        return <circle key={i} cx={lerp(x0 - 10, x1 + 10, ph)} cy={lerp(y0 + 2, y1 - 6, ph) - 18 * Math.sin(Math.PI * ph)} r={(4 + 7 * g) * (1 - 0.4 * ph)} fill="#fff6d8" opacity={0.55} />;
      })}
      {drops}
    </g>
  );
};

export const JerryCan: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const L = flick(t);
  const h = handheld(t, 1.4, 11);
  const j = jolt(lt, [[0, 10, 0.12]]);
  const s = lerp(1.42, 1.28, easeOutCubic(clamp(lt / 0.35))) + 0.05 * clamp(lt / 1.5);
  const pu = easeOutCubic(clamp((lt + 0.5) / 2.6));
  return (
    <Frame x={800 + h.x + j.x} y={610 + h.y + j.y} s={s} r={-3 + h.r} bg="#06080f">
      <Ground L={L} />
      <Background L={L} />
      <Puddle u={pu} t={t} L={L} />
      <Stream t={t} L={L} />
      <Can L={L} t={t} />
      <rect x={-300} y={-300} width={2600} height={1700} fill="#05070f" opacity={0.18 + 0.25 * (1 - L) + 0.05 * vnoise(t * 4)} />
    </Frame>
  );
};
