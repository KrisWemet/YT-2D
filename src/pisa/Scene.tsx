import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {P} from './sprites';
import {S} from '../pigeon/sprites';
import {DUR, T} from './timing';
import {camKeys, clamp, easeInOutCubic, inv, pop, shake, spring} from '../pigeon/lib';
import {Layer, Pic, Pos} from '../pigeon/world';
import {INK, RED} from '../pigeon/fx';
import {FONT} from '../thumbs/Thumbs';

type Cam = {x: number; y: number; z: number};
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- world (depth-1000 plane)
const GY = 1260; // lawn surface
const TX = 380; // tower base centre
const TB = GY + 30; // tower base sits a little below the lawn line
const TS = 1080 / (P.tower.base[1] - P.tower.top[1]); // tower is 1080 world px tall
const LEAN = 5; // degrees (University of Bristol: "leaning ... at a five-degree angle")
const HEADR = 95;
const rad = (d: number) => (d * Math.PI) / 180;

// scientist poses (the pushing pose faces left; the pigeon-Short poses face right, so they are mirrored)
type GName = 'g_push' | 'g_hero' | 'g_balance' | 'g_clip';
const SPR = {g_push: P.g_push, g_hero: S.g_hero, g_balance: S.g_balance, g_clip: S.g_clip};
const MIRROR: Record<GName, boolean> = {g_push: false, g_hero: true, g_balance: true, g_clip: true};
const gS = (n: GName) => HEADR / SPR[n].head[2];
// put the pushing palms on the tower's right side
const GX = (() => {
  const s = gS('g_push');
  const pdx = (P.g_push.palm[0] - P.g_push.feet[0]) * s;
  const pdy = (P.g_push.palm[1] - P.g_push.feet[1]) * s;
  const hb = TB - (GY + pdy); // palm height above the tower base
  const hw = (P.tower.shaftW / 2) * TS;
  const th = rad(LEAN);
  const v = (hb + hw * Math.sin(th)) / Math.cos(th);
  const edgeX = hw * Math.cos(th) + v * Math.sin(th);
  return TX + edgeX - pdx - 6;
})();

// ---------------------------------------------------------------- camera [t, x, y, k]
const CAM: Array<[number, number, number, number]> = [
  [0, 600, 960, 1.18],
  [3.0, 602, 962, 1.2],
  [5.3, 604, 964, 1.2],
  [6.15, 500, 930, 1.1],
  [9.5, 500, 930, 1.1],
  [10.3, 520, 1010, 1.12],
  [12.3, 520, 1010, 1.12],
  [13.2, 500, 940, 1.1],
  [17.0, 500, 940, 1.1],
  [18.4, 600, 960, 1.18],
  [DUR, 600, 960, 1.18],
];

// ---------------------------------------------------------------- earthquakes
const env = (t: number, a: number, b: number, up: number, down: number) =>
  t < a ? 0 : t < a + up ? (t - a) / up : t < b ? 1 : Math.max(0, 1 - (t - b) / down);
const BADGES = [T.four, T.four + 0.22, T.four + 0.44, T.four + 0.66];
const quake = (t: number) => Math.max(env(t, T.survived - 0.05, 8.75, 0.3, 0.5), 0.6 * env(t, T.sways - 0.1, 16.95, 0.35, 0.4));
const groundShift = (t: number) => {
  const q = quake(t);
  return {x: q * (12 * Math.sin(TAU * 7.3 * t) + 6 * Math.sin(TAU * 11.7 * t + 1.1)), y: q * 3 * Math.sin(TAU * 9.1 * t)};
};
// the tower rides the shaking: a slow, small sway (different rhythm)
const towerSway = (t: number) => quake(t) * 1.3 * Math.sin(TAU * 0.6 * (t - T.survived));
const towerExtra = (t: number) => 1.1 * Math.sin(Math.PI * inv(2.72, 3.55, t)) + 0.7 * Math.sin(Math.PI * inv(T.tilted - 0.05, T.tilted + 0.7, t));
const IMPACTS: Array<[number, number, number]> = [...BADGES.map((b): [number, number, number] => [b, 7, 0.12]), [T.doesnt, 7, 0.12]];
const camAt = (t: number): Cam => {
  const c = camKeys(t, CAM);
  let a = quake(t) * 5;
  for (const [t0, amp, tau] of IMPACTS) if (t >= t0) a += amp * Math.exp(-(t - t0) / tau);
  if (a < 0.05) return c;
  const s = shake(t, a);
  const k = 1000 / (1000 - c.z);
  return {...c, x: c.x + s.x / k, y: c.y + s.y / k};
};

// ---------------------------------------------------------------- scientist
const SWAPS: Array<[number, GName]> = [[0, 'g_push'], [T.keep, 'g_hero'], [T.survived, 'g_balance'], [T.engineers, 'g_clip'], [T.basically, 'g_hero'], [T.protects, 'g_push']];
const breath = (t: number) => 1 + 0.009 * Math.sin(TAU * 0.6 * t);
const guyState = (t: number) => {
  let i = 0;
  while (i + 1 < SWAPS.length && t >= SWAPS[i + 1][0]) i++;
  const [t0, name] = SWAPS[i];
  const next = SWAPS[i + 1]?.[0] ?? Infinity;
  let sy = 1;
  if (t > next - 0.09) sy = 1 - 0.07 * Math.sin((Math.PI / 2) * inv(next - 0.09, next, t));
  else if (i > 0) sy = 1 + 0.06 * (1 - spring(t - t0, 3.2, 0.3));
  let rot = 0;
  if (name === 'g_balance') rot = 4 * Math.sin(TAU * 1.3 * (t - t0)) * env(t, t0, 8.8, 0.2, 0.5);
  if (name === 'g_push') sy *= 1 + 0.02 * Math.sin(Math.PI * inv(2.72, 3.55, t)); // pushes back as it creaks
  return {name, sy: sy * breath(t), rot};
};
const Guy: React.FC<{t: number; gx: number}> = ({t, gx}) => {
  const g = guyState(t);
  const p = SPR[g.name];
  const m = MIRROR[g.name] ? -1 : 1;
  return (
    <Pos x={GX + gx} y={GY} s={gS(g.name)} sx={m * (2 - g.sy)} sy={g.sy} rot={g.rot * m}>
      <Pic file={p.file} w={p.w} h={p.h} ax={p.feet[0]} ay={p.feet[1]} />
    </Pos>
  );
};

// ---------------------------------------------------------------- tower with a face
type Mood = 'open' | 'calm' | 'smug' | 'wink';
const moodAt = (t: number): Mood => {
  if (t > T.protects + 0.05 && t < T.protects + 0.75) return 'wink';
  if ((t > T.keep + 0.1 && t < T.survived - 0.1) || (t > T.protects && t < T.protects + 1.0)) return 'smug';
  if (quake(t) > 0.2) return 'calm';
  return 'open';
};
const TowerFace: React.FC<{t: number; look: [number, number]}> = ({t, look}) => {
  const m = moodAt(t);
  const cx = P.tower.base[0];
  const ey = 830;
  const r = 64;
  const blink = (t % 3.7) > 3.58 && m === 'open' && t < DUR - 0.5;
  const eye = (dx: number, i: number) => {
    const x = cx + dx;
    if ((m === 'wink' && i === 1) || blink) return <path key={i} d={`M${x - r} ${ey}Q${x} ${ey + r * 0.6} ${x + r} ${ey}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />;
    const lid = m === 'calm' ? 0.55 : m === 'smug' ? 0.4 : 0;
    const px = look[0] * r * 0.42, py = look[1] * r * 0.42;
    return (
      <g key={i}>
        <ellipse cx={x} cy={ey} rx={r * 0.88} ry={r} fill="#fff" stroke={INK} strokeWidth={13} />
        <circle cx={x + px} cy={ey + py + (lid > 0 ? r * 0.25 : 0)} r={r * 0.42} fill={INK} />
        <circle cx={x + px + r * 0.14} cy={ey + py - r * 0.14 + (lid > 0 ? r * 0.25 : 0)} r={r * 0.12} fill="#fff" />
        {lid > 0 && <path d={`M${x - r * 0.95} ${ey - r - 6}L${x + r * 0.95} ${ey - r - 6}L${x + r * 0.95} ${ey - r + 2 * r * lid}L${x - r * 0.95} ${ey - r + 2 * r * lid}Z`} fill="#efe6d2" stroke={INK} strokeWidth={12} strokeLinejoin="round" />}
      </g>
    );
  };
  const my = ey + 150;
  const mouth =
    m === 'smug' || m === 'wink' ? <path d={`M${cx - 70} ${my - 6}Q${cx + 10} ${my + 50} ${cx + 82} ${my - 22}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" /> :
    m === 'calm' ? <path d={`M${cx - 50} ${my + 8}L${cx + 50} ${my + 8}`} stroke={INK} strokeWidth={14} strokeLinecap="round" /> :
    <path d={`M${cx - 55} ${my}Q${cx} ${my + 34} ${cx + 55} ${my}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: -P.tower.base[0], top: -P.tower.base[1], overflow: 'visible'}}>
      {[-96, 96].map(eye)}
      {mouth}
      {(m === 'smug' || m === 'wink') && [-150, 150].map((dx) => <ellipse key={dx} cx={cx + dx} cy={my - 20} rx={34} ry={20} fill="#ff9aa8" opacity={0.7} />)}
    </svg>
  );
};
const Tower: React.FC<{t: number; gx: number; gy: number; ghost?: number}> = ({t, gx, gy, ghost}) => {
  const tw = P.tower;
  const rot = ghost !== undefined ? LEAN + ghost : LEAN + towerSway(t) + towerExtra(t);
  const look: [number, number] = t > T.engineers && t < T.sways ? [-0.85, 0.2] : [0.8, 0.45];
  return (
    <Pos x={TX + gx} y={TB + gy} s={TS} rot={rot}>
      {ghost === undefined ? (
        <Pic file={tw.file} w={tw.w} h={tw.h} ax={tw.base[0]} ay={tw.base[1]} />
      ) : (
        <div style={{position: 'absolute', left: -tw.base[0], top: -tw.base[1], width: tw.w, height: tw.h, background: RED, opacity: 0.5, WebkitMaskImage: `url(${staticFile(tw.file)})`, maskImage: `url(${staticFile(tw.file)})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}} />
      )}
      {ghost === undefined && <TowerFace t={t} look={look} />}
    </Pos>
  );
};

// ---------------------------------------------------------------- ground cross-section
const wavePath = (y0: number, amp: number, ph: number, len: number, x0 = -1200, x1 = 2400) => {
  let d = '';
  for (let x = x0; x <= x1; x += 40) d += `${x === x0 ? 'M' : 'L'}${x} ${(y0 + amp * Math.sin(x / len + ph)).toFixed(1)}`;
  return d;
};
const Ground: React.FC<{t: number; gx: number; gy: number; jelly: number; glow: number}> = ({t, gx, gy, jelly, glow}) => {
  const amp = 7 + 26 * jelly;
  const ph = t * (2.4 + 9 * jelly);
  const ab = wavePath(GY + 205, amp, ph, 95);
  const bc = wavePath(GY + 590, amp * 0.8, -ph * 0.8 + 1, 130);
  const bottom = 'L2400 3200L-1200 3200Z';
  const th = rad(LEAN + 0.5 * (towerSway(t) + towerExtra(t)));
  // foundation ring under the tower, tilted with it
  const fw = 330, fh = 70;
  const corners = [[-fw / 2, -10], [fw / 2, -10], [fw / 2 + 20, fh], [-fw / 2 - 20, fh]].map(([x, y]) => [TX + x * Math.cos(th) - y * Math.sin(th), TB + x * Math.sin(th) + y * Math.cos(th)]);
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: gx, top: gy, overflow: 'visible'}}>
      {/* sandy silt */}
      <rect x={-1200} y={GY + 10} width={3600} height={3000} fill="#d9b77f" />
      {/* soft clay */}
      <path d={ab + 'L2400 3200L-1200 3200Z'} fill="#9fb0c4" stroke={INK} strokeWidth={8} />
      {/* sand */}
      <path d={bc + bottom} fill="#ead79f" stroke={INK} strokeWidth={8} />
      {/* squiggles in the soft clay */}
      {Array.from({length: 22}, (_, i) => {
        const x = -400 + (i % 11) * 200 + (i > 10 ? 100 : 0);
        const y = GY + 300 + (i > 10 ? 170 : 0) + 30 * Math.sin(i * 1.7);
        const a = 1 + jelly * 1.4;
        return <path key={i} d={`M${x} ${y}q22 ${-14 * a} 44 0t44 0t44 0`} fill="none" stroke="#6d7f96" strokeWidth={9} strokeLinecap="round" />;
      })}
      {Array.from({length: 26}, (_, i) => <circle key={i} cx={-500 + i * 130 + 40 * Math.sin(i * 2.3)} cy={GY + 80 + 70 * ((i * 37) % 3) / 2} r={9} fill="#c49c62" />)}
      {/* compressed clay under the leaning side */}
      <path d={`M${TX - 40} ${GY + 205}Q${TX + 120} ${GY + 330} ${TX + 260} ${GY + 205}`} fill="#8094ad" opacity={0.85} />
      <polygon points={corners.map((c) => c.join(',')).join(' ')} fill="#cfc8ba" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      {glow > 0.01 && <path d={ab} fill="none" stroke="#ffd84a" strokeWidth={26} opacity={glow} style={{filter: 'blur(3px)'}} />}
      {glow > 0.01 && <path d={ab} fill="none" stroke="#fff3a6" strokeWidth={10} opacity={glow} />}
      {/* lawn */}
      <rect x={-1200} y={GY - 14} width={3600} height={30} fill="#7cc46a" />
      <line x1={-1200} y1={GY - 14} x2={2400} y2={GY - 14} stroke={INK} strokeWidth={10} />
      <line x1={-1200} y1={GY + 16} x2={2400} y2={GY + 16} stroke={INK} strokeWidth={7} />
      {Array.from({length: 40}, (_, i) => <path key={i} d={`M${-1100 + i * 90} ${GY - 14}l8 -20l8 20`} fill="#7cc46a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />)}
    </svg>
  );
};

// ---------------------------------------------------------------- sky
const Sky: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -3000, top: -3000, width: 8000, height: 4300, background: 'linear-gradient(180deg, #7cc8f5 0%, #b8e3fb 70%, #dff3ff 100%)'}} />
    <div style={{position: 'absolute', left: 1080, top: 120, width: 170, height: 170, borderRadius: '50%', background: '#ffe066', border: `10px solid ${INK}`, boxShadow: '0 0 60px rgba(255,224,102,0.8)'}} />
    {[[-160, 260, 1], [760, 420, 0.8], [180, 660, 0.7]].map(([x, y, s], i) => (
      <svg key={i} width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
        <path d="M0 40Q0 0 40 4Q60 -30 100 -6Q140 -26 160 16Q200 18 196 46Z" transform={`scale(${s * 1.4})`} fill="#ffffff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </svg>
    ))}
    {/* distant hills */}
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d="M-1500 1250Q-900 1040 -300 1180Q200 1060 700 1170Q1200 1040 2200 1190L2200 1500L-1500 1500Z" fill="#a9d79a" stroke={INK} strokeWidth={9} />
    </svg>
  </>
);

// ---------------------------------------------------------------- overlays
const Txt: React.FC<{x: number; y: number; size: number; color: string; s: number; rot?: number; children: string}> = ({x, y, size, color, s, rot = 0, children}) =>
  s <= 0.01 ? null : (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <g transform={`rotate(${rot}) scale(${s})`}>
        {[INK, color].map((c, i) => (
          <text key={i} x={i ? 0 : size * 0.05} y={size * 0.35 + (i ? 0 : size * 0.07)} textAnchor="middle" fontFamily={FONT} fontSize={size} fill={c} stroke={INK} strokeWidth={size * 0.16} strokeLinejoin="round" paintOrder="stroke">
            {children}
          </text>
        ))}
      </g>
    </svg>
  );
const Tag: React.FC<{x: number; y: number; s: number; rot?: number; bg?: string; children: string}> = ({x, y, s, rot = 0, bg = '#ffffff', children}) =>
  s <= 0.01 ? null : (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, whiteSpace: 'nowrap', background: bg, border: `7px solid ${INK}`, borderRadius: 999, padding: '8px 26px 2px', fontFamily: FONT, fontSize: 52, color: INK, boxShadow: `5px 7px 0 ${INK}`}}>
      {children}
    </div>
  );
/** Earthquake badge: zigzag crack in a red circle (screen px). */
const QuakeBadge: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s <= 0.01 ? null : (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <g transform={`scale(${s})`}>
        <circle r={66} fill="#ff6a4a" stroke={INK} strokeWidth={9} />
        <path d="M-44 6L-22 -18L-6 14L12 -22L28 10L46 -8" fill="none" stroke="#fff" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-40 34L40 34" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
      </g>
    </svg>
  );
/** Metronome (screen px); icon 'ground' or 'tower'. */
const Metronome: React.FC<{x: number; y: number; s: number; ang: number; icon: 'ground' | 'tower'; col: string}> = ({x, y, s, ang, icon, col}) =>
  s <= 0.01 ? null : (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <g transform={`scale(${s})`}>
        <path d="M-46 -96L46 -96L80 96L-80 96Z" fill={col} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <rect x={-92} y={90} width={184} height={22} rx={8} fill="#7a5230" stroke={INK} strokeWidth={8} />
        {icon === 'ground' ? (
          <g transform="translate(0 58)">
            <path d="M-40 0q10 -12 20 0t20 0t20 0t20 0" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
            <path d="M-40 14q10 -12 20 0t20 0t20 0t20 0" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          </g>
        ) : (
          <g transform="translate(0 58) rotate(6)">
            <rect x={-12} y={-34} width={24} height={52} rx={4} fill="#fff" stroke={INK} strokeWidth={6} />
            {[-22, -8, 6].map((yy) => <line key={yy} x1={-12} y1={yy} x2={12} y2={yy} stroke={INK} strokeWidth={4} />)}
          </g>
        )}
        <g transform={`translate(0 30) rotate(${ang})`}>
          <line x1={0} y1={0} x2={0} y2={-150} stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <rect x={-20} y={-118} width={40} height={30} rx={6} fill="#ffd84a" stroke={INK} strokeWidth={7} />
        </g>
        <circle cx={0} cy={30} r={11} fill={INK} />
      </g>
    </svg>
  );
const Shield: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s <= 0.01 ? null : (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <g transform={`scale(${s})`}>
        <path d="M0 -120Q60 -90 110 -96Q118 40 0 120Q-118 40 -110 -96Q-60 -90 0 -120Z" fill="#4fbf6a" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
        <path d="M-44 0L-12 32L48 -36" fill="none" stroke="#fff" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );

// ---------------------------------------------------------------- the world alone (used by the thumbnail)
export const PisaWorld: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const g = groundShift(t);
  return (
    <AbsoluteFill style={{background: '#b8e3fb', overflow: 'hidden'}}>
      <Layer cam={cam} z={2400} blur={0.6}>
        <Sky />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Tower t={t} gx={g.x} gy={g.y} />
        <Ground t={t} gx={g.x} gy={g.y} jelly={quake(t) * 0.55} glow={0} />
        <div style={{position: 'absolute', left: GX + g.x - 170, top: GY - 26, width: 340, height: 40, borderRadius: '50%', background: 'rgba(11,11,11,0.16)'}} />
        <Guy t={t} gx={g.x} />
      </Layer>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scene
export const PisaScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const g = groundShift(t);
  const jelly = Math.max(pop(t, T.soft - 0.05, T.ground + 0.6, 0.25) * 0.8, pop(t, T.soft2 - 0.05, T.soil2 + 0.7, 0.25), quake(t) * 0.55);
  const glow = Math.max(0.9 * pop(t, T.keep, T.standing + 0.7, 0.3), 0.9 * pop(t, T.same, 21.7, 0.3)) * (0.75 + 0.25 * Math.sin(t * 9));
  // ghost tower: what resonance would do (sway building up), crossed out on "doesn't"
  const ghostA = 7 * easeInOutCubic(inv(T.so - 0.05, T.doesnt, t));
  const ghostOn = t > T.so - 0.05 && t < T.doesnt + 0.45;
  const ghostFade = inv(T.so - 0.05, T.so + 0.15, t) * (1 - inv(T.doesnt + 0.1, T.doesnt + 0.45, t));
  const xMark = pop(t, T.doesnt, T.doesnt + 0.55, 0.22);
  // overlays
  const ruler = pop(t, T.tall - 0.05, T.sways - 0.1, 0.3);
  const shieldS = pop(t, T.protects - 0.05, 21.75, 0.32);
  const towerTop = {x: TX + 1080 * Math.sin(rad(LEAN)), y: TB - 1080 * Math.cos(rad(LEAN))};
  const metroS = pop(t, T.different - 0.15, 17.55, 0.3);
  return (
    <AbsoluteFill style={{background: '#b8e3fb', overflow: 'hidden'}}>
      <Layer cam={cam} z={2400} blur={0.6}>
        <Sky />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Tower t={t} gx={g.x} gy={g.y} />
        {ghostOn && (
          <div style={{opacity: ghostFade}}>
            <Tower t={t} gx={g.x} gy={g.y} ghost={ghostA * Math.sin(TAU * 2.1 * (t - T.so))} />
          </div>
        )}
        <Ground t={t} gx={g.x} gy={g.y} jelly={jelly} glow={glow} />
        <div style={{position: 'absolute', left: GX + g.x - 170, top: GY - 26, width: 340, height: 40, borderRadius: '50%', background: 'rgba(11,11,11,0.16)'}} />
        <Guy t={t} gx={g.x} />
        {/* line 3: tall, stiff, soft */}
        {ruler > 0.01 && (
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: Math.min(1, ruler)}}>
            {[[INK, 16], ['#ffffff', 7]].map(([c, w], i) => (
              <g key={i} stroke={c as string} strokeWidth={w as number} strokeLinecap="round" fill="none">
                <line x1={TX - 220} y1={GY} x2={TX - 220} y2={GY - (GY - towerTop.y) * Math.min(1, ruler)} />
                <line x1={TX - 250} y1={GY} x2={TX - 190} y2={GY} />
                <line x1={TX - 250} y1={towerTop.y} x2={TX - 190} y2={towerTop.y} opacity={ruler > 0.95 ? 1 : 0} />
              </g>
            ))}
          </svg>
        )}
        <Tag x={TX - 220} y={(GY + towerTop.y) / 2} s={ruler} rot={-4}>58 m</Tag>
        <Tag x={TX + 40} y={GY - 300} s={pop(t, T.stiff - 0.05, T.sways - 0.1, 0.28)} rot={4} bg="#d6e4f2">STIFF</Tag>
        <Tag x={TX + 330} y={GY + 380} s={pop(t, T.soft2 - 0.05, T.sways - 0.1, 0.28)} rot={-3} bg="#ffe3a3">SOFT</Tag>
        {xMark > 0.01 && (
          <svg width={10} height={10} style={{position: 'absolute', left: TX + 60, top: GY - 560, overflow: 'visible'}}>
            <g transform={`scale(${xMark}) rotate(-8)`}>
              {[[INK, 64], [RED, 40]].map(([c, w], i) => (
                <g key={i} stroke={c as string} strokeWidth={w as number} strokeLinecap="round">
                  <line x1={-150} y1={-150} x2={150} y2={150} />
                  <line x1={150} y1={-150} x2={-150} y2={150} />
                </g>
              ))}
            </g>
          </svg>
        )}
        <Shield x={TX + 120} y={GY + 330} s={shieldS * 1.05} />
      </Layer>
      {/* screen-space: earthquake tally and the two metronomes (left column) */}
      {BADGES.map((b, i) => <QuakeBadge key={i} x={128} y={470 + i * 165} s={pop(t, b, 9.45, 0.26)} />)}
      <div style={{position: 'absolute', left: 128, top: 1150, transform: `translate(-50%,-50%) scale(${pop(t, T.y1280 - 0.05, 9.45, 0.3)})`, width: 210, height: 150, background: '#ffffff', border: `8px solid ${INK}`, borderRadius: 28, boxShadow: `6px 8px 0 ${INK}`, textAlign: 'center', fontFamily: FONT, color: INK}}>
        <div style={{fontSize: 40, marginTop: 14}}>SINCE</div>
        <div style={{fontSize: 64, lineHeight: '64px', color: RED, WebkitTextStroke: `3px ${INK}`}}>1280</div>
      </div>
      <Metronome x={128} y={560} s={metroS} ang={32 * Math.sin(TAU * 3.0 * t)} icon="ground" col="#e9a06a" />
      <Metronome x={128} y={1000} s={metroS} ang={24 * Math.sin(TAU * 0.6 * (t - T.survived))} icon="tower" col="#a9c9ee" />
    </AbsoluteFill>
  );
};
export const _debug = {GX, TS};
