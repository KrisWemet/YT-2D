import React from 'react';
import {AbsoluteFill} from 'remotion';
import {K} from './sprites';
import {T, DUR} from './timing';
import {camKeys, clamp, easeInCubic, easeInOutCubic, easeOutBack, inv, key, lerp, pop, shake, spring} from '../pigeon/lib';
import {Layer, Pic, Pos, toScreen} from '../pigeon/world';
import {INK, RED} from '../pigeon/fx';
import {FONT} from '../thumbs/Thumbs';

type Cam = {x: number; y: number; z: number};

// ---------------------------------------------------------------- world (depth-1000 plane)
const YG = 1560; // floor line
const GX = 380; // scientist's feet
const HEADR = 150; // scientist head radius
type GName = 'g_self' | 'g_laugh' | 'g_palm';
const gS = (n: GName) => HEADR / K[n].head[2];
const at = (n: GName, px: number, py: number) => ({x: GX + (px - K[n].feet[0]) * gS(n), y: YG + (py - K[n].feet[1]) * gS(n)});
const HEAD = at('g_self', K.g_self.head[0], K.g_self.head[1]);
const ARMPIT = at('g_self', 270, 760); // where the feather touches him
const PALM = at('g_palm', K.g_palm.palm[0], K.g_palm.palm[1]);
const STICK = at('g_palm', 470, 965); // joystick
// robot: feather tip resting just above the open palm
const SR = (YG - (PALM.y - 8)) / (K.robot.base[1] - K.robot.tip[1]);
const RX = PALM.x + (K.robot.base[0] - K.robot.tip[0]) * SR;
// thought bubble with the brain, up and right of the head
const BB = {x: 650, y: 520, r: 205};
const BS = 300 / K.brain.w; // brain sprite scale

// ---------------------------------------------------------------- camera [t, x, y, k]
const CAM: Array<[number, number, number, number]> = [
  [0, 630, 1110, 1.18], // frame 0: the payoff (robot tickling, laughing, meter maxed)
  [3.2, 632, 1108, 1.19],
  [3.85, 552, 790, 1.4], // the explanation: self-tickle and the brain bubble
  [8.6, 556, 782, 1.43],
  [9.5, 640, 1170, 1.02], // the experiment: robot rolls in
  [12.3, 650, 1160, 1.05],
  [14.0, 640, 1080, 1.25],
  [14.85, 620, 870, 1.2], // the prediction is off: bubble back
  [16.5, 620, 860, 1.2],
  [17.1, 630, 1110, 1.18], // back to the frame-0 framing (loop)
  [DUR, 630, 1110, 1.18],
];
const IMPACTS: Array<[number, number, number]> = [[T.down, 6, 0.1], [T.experiment + 0.6, 6, 0.1], [T.tickly, 12, 0.18], [T.off, 5, 0.1]];
const camAt = (t: number): Cam => {
  const c = camKeys(t, CAM);
  let a = 0;
  for (const [t0, amp, tau] of IMPACTS) if (t >= t0) a += amp * Math.exp(-(t - t0) / tau);
  if (a < 0.05) return c;
  const s = shake(t, a);
  const k = 1000 / (1000 - c.z);
  return {...c, x: c.x + s.x / k, y: c.y + s.y / k};
};

// ---------------------------------------------------------------- scientist
const breath = (t: number) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
const SWAPS: Array<[number, GName]> = [[0, 'g_laugh'], [T.your, 'g_self'], [T.experiment, 'g_palm'], [T.tickly, 'g_laugh']];
const guyState = (t: number) => {
  let i = 0;
  while (i + 1 < SWAPS.length && t >= SWAPS[i + 1][0]) i++;
  const [t0, name] = SWAPS[i];
  const next = SWAPS[i + 1]?.[0] ?? Infinity;
  let sy = 1;
  if (t > next - 0.09) sy = 1 - 0.07 * Math.sin((Math.PI / 2) * inv(next - 0.09, next, t)); // squash before the swap
  else if (i > 0) sy = 1 + 0.06 * (1 - spring(t - t0, 3.2, 0.3)); // stretch out of it
  let rot = 0;
  if (name === 'g_laugh') {
    sy *= 1 + 0.035 * Math.abs(Math.sin((2 * Math.PI * 22 * t) / DUR));
    rot = 2.2 * Math.sin((2 * Math.PI * 20 * t) / DUR);
  }
  if (name === 'g_self') rot = 0.6 * Math.sin(2 * Math.PI * 0.5 * t);
  return {name, sy: sy * breath(t), rot};
};
const Guy: React.FC<{t: number}> = ({t}) => {
  const g = guyState(t);
  const p = K[g.name];
  return (
    <Pos x={GX} y={YG} s={gS(g.name)} sx={2 - g.sy} sy={g.sy} rot={g.rot}>
      <Pic file={p.file} w={p.w} h={p.h} ax={p.feet[0]} ay={p.feet[1]} />
    </Pos>
  );
};

// ---------------------------------------------------------------- robot
const ROBOT_OUT = T.your + 0.57;
const robotX = (t: number) => {
  if (t < ROBOT_OUT) return RX + 900 * easeInCubic(clamp((t - T.your) / 0.55));
  if (t < T.experiment) return null;
  return RX + 760 * (1 - easeOutBack(clamp((t - T.experiment) / 0.6), 1.6));
};
/** Tickle motion: the arm sways with the joystick; 0.2 s late in the hook and from "waited" on. */
const stick = (t: number) => Math.sin(2 * Math.PI * 2.6 * t);
const robotSway = (t: number) => (robotX(t) === null ? 0 : stick(t < ROBOT_OUT || t >= T.waited ? t - 0.2 : t));
const Robot: React.FC<{t: number}> = ({t}) => {
  const x = robotX(t);
  if (x === null) return null;
  const r = K.robot;
  const roll = t > T.experiment && t < T.experiment + 0.8 ? 4 * Math.sin((t - T.experiment) * 18) * Math.exp(-(t - T.experiment) * 5) : 0;
  const blink = (t > T.robot1 && t < T.robot1 + 0.12) || (t > T.robot2 && t < T.robot2 + 0.12);
  const hop = 0.07 * Math.sin(Math.PI * inv(T.robot1 - 0.05, T.robot1 + 0.45, t)); // "You just need a robot"
  return (
    <Pos x={x} y={YG} s={SR} sx={1 - hop / 2} sy={1 + hop} rot={1.3 * robotSway(t) + roll}>
      <Pic file={r.file} w={r.w} h={r.h} ax={r.base[0]} ay={r.base[1]} />
      {/* eyes: glow, and blink */}
      {r.eyes.map(([ex, ey, er], i) => (
        <div key={i} style={{position: 'absolute', left: ex - r.base[0] - er * 1.1, top: ey - r.base[1] - er * 1.1, width: er * 2.2, height: blink ? er * 0.5 : er * 2.2, marginTop: blink ? er * 0.85 : 0, borderRadius: er * 2, background: '#6ff3ff', boxShadow: `0 0 ${er * 1.6}px #6ff3ff`}} />
      ))}
    </Pos>
  );
};

// ---------------------------------------------------------------- effects
/** Little curved "tickle" marks around a point (world px). */
const TickleMarks: React.FC<{x: number; y: number; t: number; a: number; s?: number; dir?: 1 | -1}> = ({x, y, t, a, s = 1, dir = -1}) => {
  if (a <= 0.01) return null;
  const ph = (t * 5) % 1;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity: a}}>
      {[-1, 0, 1].map((i) => {
        const ang = (dir < 0 ? 180 : 0) + i * 32;
        const d = (60 + 22 * ph) * s;
        const cx = Math.cos((ang * Math.PI) / 180) * d, cy = Math.sin((ang * Math.PI) / 180) * d;
        return <path key={i} d={`M${cx - 14 * s} ${cy - 10 * s}Q${cx} ${cy + 12 * s} ${cx + 14 * s} ${cy - 10 * s}`} fill="none" stroke={INK} strokeWidth={9 * s} strokeLinecap="round" opacity={1 - ph * 0.6} />;
      })}
    </svg>
  );
};

/** Outlined cartoon text (SVG), world or screen px. */
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

/** Cartoon eyes for the brain. look: unit vector; wide: 0..1; dizzy: spinning pupils. */
const BrainEyes: React.FC<{x: number; y: number; look: [number, number]; wide: number; lid: number; dizzy: number; t: number}> = ({x, y, look, wide, lid, dizzy, t}) => {
  const r = 34 * (1 + 0.25 * wide);
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      {[-40, 40].map((dx, i) => {
        const sp = dizzy > 0.01 ? [Math.cos(t * 14 + i * 3) * 0.6 * dizzy, Math.sin(t * 14 + i * 3) * 0.6 * dizzy] : [0, 0];
        const lx = clamp(look[0] + sp[0], -1, 1) * r * 0.42, ly = clamp(look[1] + sp[1], -1, 1) * r * 0.42;
        return (
          <g key={i}>
            <ellipse cx={dx} cy={0} rx={r * 0.85} ry={r} fill="#fff" stroke={INK} strokeWidth={8} />
            <circle cx={dx + lx} cy={ly} r={r * 0.42} fill={INK} />
            <circle cx={dx + lx + r * 0.15} cy={ly - r * 0.15} r={r * 0.12} fill="#fff" />
            {lid > 0.01 && <path d={`M${dx - r} ${-r - 4}L${dx + r} ${-r - 4}L${dx + r} ${-r + 2 * r * lid}L${dx - r} ${-r + 2 * r * lid}Z`} fill="#f4a3b6" stroke={INK} strokeWidth={7} />}
          </g>
        );
      })}
    </svg>
  );
};

/** Thought bubble with the brain inside. */
const BrainBubble: React.FC<{t: number; s: number; look: [number, number]; wide: number; lid: number; dizzy: number; tilt: number}> = ({t, s, look, wide, lid, dizzy, tilt}) => {
  if (s <= 0.01) return null;
  const b = K.brain;
  const trail = [
    {x: HEAD.x + 140, y: HEAD.y - 150, r: 18},
    {x: HEAD.x + 195, y: HEAD.y - 225, r: 30},
  ];
  return (
    <>
      {trail.map((c, i) => (
        <div key={i} style={{position: 'absolute', left: c.x - c.r, top: c.y - c.r, width: c.r * 2, height: c.r * 2, borderRadius: '50%', background: '#fff', border: `8px solid ${INK}`, boxSizing: 'border-box', transform: `scale(${clamp(s * 1.6 - i * 0.3)})`}} />
      ))}
      <Pos x={BB.x} y={BB.y} s={s}>
        <div style={{position: 'absolute', left: -BB.r, top: -BB.r, width: BB.r * 2, height: BB.r * 2, borderRadius: '50%', background: '#ffffff', border: `10px solid ${INK}`, boxSizing: 'border-box', boxShadow: '8px 12px 0 rgba(11,11,11,0.16)'}} />
        <Pos x={0} y={8} s={BS} rot={tilt}>
          <Pic file={b.file} w={b.w} h={b.h} ax={b.w / 2} ay={b.h / 2} />
        </Pos>
        <Pos x={0} y={0} s={1} rot={tilt}>
          <BrainEyes x={48} y={-42} look={look} wide={wide} lid={lid} dizzy={dizzy} t={t} />
        </Pos>
      </Pos>
    </>
  );
};

/** Volume-style knob the brain turns down (world px). */
const Knob: React.FC<{x: number; y: number; s: number; ang: number}> = ({x, y, s, ang}) =>
  s <= 0.01 ? null : (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <g transform={`scale(${s})`}>
        {Array.from({length: 9}, (_, i) => {
          const a = ((-135 + i * 33.75) * Math.PI) / 180;
          return <line key={i} x1={Math.sin(a) * 78} y1={-Math.cos(a) * 78} x2={Math.sin(a) * 96} y2={-Math.cos(a) * 96} stroke={INK} strokeWidth={8} strokeLinecap="round" />;
        })}
        <circle r={62} fill="#ffcf3f" stroke={INK} strokeWidth={9} />
        <circle r={44} fill="#ffe27a" />
        <line x1={0} y1={0} x2={Math.sin((ang * Math.PI) / 180) * 50} y2={-Math.cos((ang * Math.PI) / 180) * 50} stroke={INK} strokeWidth={13} strokeLinecap="round" />
      </g>
    </svg>
  );

/** Stopwatch badge filling one fifth (world px). */
const Stopwatch: React.FC<{x: number; y: number; s: number; fill: number; t: number}> = ({x, y, s, fill, t}) => {
  if (s <= 0.01) return null;
  const R = 90;
  const a = fill * 2 * Math.PI;
  const ex = Math.sin(a) * R, ey = -Math.cos(a) * R;
  const wedge = fill > 0.001 ? `M0 0L0 ${-R}A${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${ex} ${ey}Z` : '';
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <g transform={`scale(${s}) rotate(${4 * Math.sin(t * 3)})`}>
        <rect x={-18} y={-R - 40} width={36} height={26} rx={6} fill="#cfd6dd" stroke={INK} strokeWidth={8} />
        <circle r={R + 12} fill="#ffffff" stroke={INK} strokeWidth={10} />
        {wedge && <path d={wedge} fill={RED} opacity={0.9} />}
        <line x1={0} y1={0} x2={ex * 0.92} y2={ey * 0.92} stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <circle r={10} fill={INK} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- tickle meter (screen px)
const meterAt = (t: number) => {
  const jit = 0.02 * Math.sin(t * 23) * Math.sin(t * 7.3);
  const HIGH = 0.86;
  if (t < T.your) return HIGH + jit;
  if (t < 9.6) return key(t, [[T.your, HIGH], [T.your + 0.5, 0.26, easeInOutCubic], [T.turns, 0.26], [T.down + 0.2, 0.05, easeInOutCubic], [9.6, 0.06]]) + jit;
  if (t < T.fifth2) return 0.07 + jit;
  if (t < T.tickly) return key(t, [[T.fifth2, 0.07], [T.l5End, 0.22], [T.off + 0.2, 0.36], [T.tickly - 0.05, 0.38]]) + jit;
  return 0.38 + (HIGH - 0.38) * spring(t - T.tickly, 1.8, 0.45) + jit;
};
const Face: React.FC<{x: number; y: number; laugh: boolean}> = ({x, y, laugh}) => (
  <svg width={10} height={10} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
    <circle r={38} fill={laugh ? '#ffd23f' : '#ffffff'} stroke={INK} strokeWidth={7} />
    {laugh ? (
      <>
        <path d="M-20 -8Q-13 -18 -6 -8M6 -8Q13 -18 20 -8" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d="M-20 6Q0 34 20 6Z" fill="#5a2230" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </>
    ) : (
      <>
        <circle cx={-12} cy={-8} r={5} fill={INK} />
        <circle cx={12} cy={-8} r={5} fill={INK} />
        <line x1={-14} y1={14} x2={14} y2={14} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      </>
    )}
  </svg>
);
const Meter: React.FC<{t: number}> = ({t}) => {
  const v = clamp(meterAt(t));
  const x0 = 170, x1 = 910, y = 230, h = 58;
  const W = x1 - x0;
  const other = 0.86; // "someone else" mark
  const mark = t < T.your + 0.3 ? pop(t, -1, T.your, 0.3) : pop(t, T.someone - 0.12, 99, 0.3);
  const fillCol = v > 0.6 ? '#ff6a4a' : v > 0.3 ? '#ffb83f' : '#7ed37a';
  return (
    <>
      <div style={{position: 'absolute', left: x0, top: y - h / 2, width: W, height: h, borderRadius: h / 2, background: '#ffffff', border: `8px solid ${INK}`, boxSizing: 'border-box', overflow: 'hidden', boxShadow: '6px 8px 0 rgba(11,11,11,0.25)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${v * 100}%`, background: fillCol, borderRight: v > 0.02 ? `6px solid ${INK}` : undefined}} />
      </div>
      <Face x={x0 - 50} y={y} laugh={false} />
      <Face x={x1 + 50} y={y} laugh />
      {mark > 0.01 && (
        <svg width={10} height={10} style={{position: 'absolute', left: x0 + W * other, top: y + h / 2 + 8, overflow: 'visible'}}>
          <g transform={`scale(${mark * 1.5})`}>
            <path d="M0 0L-22 34L22 34Z" fill={RED} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
            {/* someone else: another round-headed person */}
            <circle cx={0} cy={78} r={30} fill="#ffffff" stroke={INK} strokeWidth={7} />
            <circle cx={-9} cy={74} r={4.5} fill={INK} />
            <circle cx={9} cy={74} r={4.5} fill={INK} />
            <path d="M-10 88Q0 96 10 88" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </g>
        </svg>
      )}
    </>
  );
};

// ---------------------------------------------------------------- room
const Wall: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -2500, top: -2000, width: 6000, height: 3700, background: 'linear-gradient(180deg, #cde9df 0%, #d9efe7 100%)'}} />
    {/* window */}
    <div style={{position: 'absolute', left: 1180, top: 330, width: 460, height: 560, background: 'linear-gradient(180deg, #8fd3ff, #c7ecff)', border: `12px solid ${INK}`, borderRadius: 18, boxSizing: 'border-box'}}>
      <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 12, marginLeft: -6, background: INK}} />
      <div style={{position: 'absolute', top: '50%', left: 0, right: 0, height: 12, marginTop: -6, background: INK}} />
      <div style={{position: 'absolute', left: 50, top: 70, width: 130, height: 46, borderRadius: 30, background: '#fff'}} />
    </div>
    {/* chart poster */}
    <div style={{position: 'absolute', left: -380, top: 380, width: 360, height: 440, background: '#fffaf0', border: `10px solid ${INK}`, borderRadius: 14, boxSizing: 'border-box'}}>
      {[0.35, 0.6, 0.85, 0.5].map((v, i) => (
        <div key={i} style={{position: 'absolute', bottom: 40, left: 40 + i * 72, width: 50, height: v * 300, background: ['#7ed37a', '#ffb83f', '#ff6a4a', '#8fb7ff'][i], border: `6px solid ${INK}`, boxSizing: 'border-box'}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: -2500, top: 1655, width: 6000, height: 26, background: '#9cc9bb', borderTop: `8px solid ${INK}`}} />
  </>
);
const Floor: React.FC = () => (
  <div style={{position: 'absolute', left: -2500, top: YG - 30, width: 6000, height: 2000, background: 'linear-gradient(180deg, #e9e4da, #d8d1c4)', borderTop: `10px solid ${INK}`}}>
    {Array.from({length: 30}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: i * 220, top: 0, width: 6, height: 2000, background: 'rgba(11,11,11,0.07)'}} />
    ))}
  </div>
);
const Shadow: React.FC<{x: number; w: number}> = ({x, w}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: YG - 22, width: w, height: 44, borderRadius: '50%', background: 'rgba(11,11,11,0.16)'}} />
);

// ---------------------------------------------------------------- scene
export const TickleScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const kk = 1000 / (1000 - cam.z);
  const g = guyState(t);
  // brain bubble: lines 2-3, and again at the end
  const bubble = Math.max(pop(t, T.brain - 0.12, T.but, 0.32), pop(t, T.prediction - 0.25, 16.45, 0.32));
  const feather = g.name === 'g_self' ? ARMPIT : PALM;
  const eyeFrom = {x: BB.x + 30, y: BB.y - 20};
  let look: [number, number] = [0.3, 0.2];
  const toward = (p: {x: number; y: number}): [number, number] => {
    const dx = p.x - eyeFrom.x, dy = p.y - eyeFrom.y, L = Math.hypot(dx, dy) || 1;
    return [dx / L, dy / L];
  };
  if (t > T.predicts - 0.1 && t < T.but) look = toward(feather);
  if (t > T.turns - 0.15 && t < T.down + 0.5) look = toward({x: BB.x + 260, y: BB.y + 260});
  const wide = t > 14 ? clamp((t - (T.off - 0.05)) / 0.12) : pop(t, T.predicts - 0.05, T.predicts + 0.7, 0.2) * 0.6;
  const lid = t > T.down + 0.1 && t < T.but ? 0.35 : 0; // smug "got it"
  const dizzy = t > T.prediction - 0.2 && t < 16.45 ? clamp((t - (T.prediction - 0.2)) / 0.3) : 0; // "the prediction was off"
  const tilt = dizzy * 8 * Math.sin(t * 6);
  const cone = t > T.predicts && t < T.turns ? clamp((t - T.predicts) / 0.25) * (1 - clamp((t - (T.turns - 0.2)) / 0.2)) : 0;
  // knob the brain turns down
  const knobS = pop(t, T.turns - 0.25, T.but - 0.2, 0.28);
  const knobAng = key(t, [[T.turns, 110], [T.down + 0.15, -110, easeInOutCubic]]);
  // "?" when the prediction is off
  const q1 = 0;
  const q2 = pop(t, T.off, 16.45, 0.3);
  // tickle marks: self (barely), robot in sync (barely), robot delayed (lots)
  const selfMarks = g.name === 'g_self' ? 0.55 : 0;
  const robotOn = robotX(t) !== null && (t < T.your || t > T.people - 0.1);
  const robotMarks = robotOn ? (g.name === 'g_laugh' ? 1 : 0.55) : 0;
  const stickMarks = g.name === 'g_palm' && t > T.people - 0.1 ? 0.8 : 0;
  // stopwatch: pops on "waited", sweeps one fifth on "a fifth of a second"
  const swS = Math.max(pop(t, T.fifth1 - 0.2, T.your, 0.28), pop(t, T.waited - 0.15, 16.6, 0.3));
  const swFill = t < 6 ? 0.2 * easeInOutCubic(clamp((t - (T.fifth1 - 0.1)) / 0.6)) : 0.2 * easeInOutCubic(clamp((t - (T.fifth2 - 0.2)) / 0.75));
  // laugh lines around the head while laughing
  const laugh = g.name === 'g_laugh' ? (t < T.your ? 1 : clamp((t - T.tickly) / 0.15)) : 0;
  const lh = at('g_laugh', K.g_laugh.head[0], K.g_laugh.head[1]);
  const wallBlur = Math.max(0, (kk - 1.05) * 6);
  return (
    <AbsoluteFill style={{background: '#cde9df', overflow: 'hidden'}}>
      <Layer cam={cam} z={1500} blur={wallBlur}>
        <Wall />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Floor />
        <Shadow x={GX + 20} w={360} />
        {robotX(t) !== null && <Shadow x={(robotX(t) as number) - 10} w={280} />}
        <Robot t={t} />
        <Guy t={t} />
        <TickleMarks x={feather.x} y={feather.y} t={t} a={g.name === 'g_self' ? selfMarks : robotMarks} s={g.name === 'g_self' ? 0.8 : 0.9} />
        {g.name !== 'g_self' && <TickleMarks x={STICK.x} y={STICK.y - 10} t={t} a={stickMarks} s={0.6} dir={-1} />}
        {laugh > 0.01 && (
          <svg width={10} height={10} style={{position: 'absolute', left: lh.x, top: lh.y, overflow: 'visible', opacity: laugh}}>
            {[-150, -115, -65, -30, 20].map((a, i) => {
              const r0 = 190 + 12 * Math.sin(t * 20 + i), r1 = r0 + 70;
              const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
              return <line key={i} x1={c * r0} y1={s * r0} x2={c * r1} y2={s * r1} stroke={INK} strokeWidth={12} strokeLinecap="round" />;
            })}
          </svg>
        )}
        <Stopwatch x={RX - 230} y={YG - 760} s={swS} fill={swFill} t={t} />
        {swS > 0.01 && <Txt x={RX - 230} y={YG - 600} size={74} color="#ffffff" s={swS} rot={-4}>0.2 SEC</Txt>}
        {cone > 0.01 && (
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: cone}}>
            {[[INK, 15], ['#ffffff', 8]].map(([c, w], i) => (
              <line key={i} x1={eyeFrom.x} y1={eyeFrom.y} x2={lerp(eyeFrom.x, feather.x, cone)} y2={lerp(eyeFrom.y, feather.y, cone)} stroke={c as string} strokeWidth={w as number} strokeDasharray="1 26" strokeLinecap="round" />
            ))}
            <circle cx={feather.x} cy={feather.y} r={44 * cone} fill="none" stroke={RED} strokeWidth={9} strokeDasharray="14 12" />
          </svg>
        )}
        <BrainBubble t={t} s={bubble} look={look} wide={wide} lid={lid} dizzy={dizzy} tilt={tilt} />
        <Knob x={BB.x + 150} y={BB.y + 168} s={knobS * 0.8} ang={knobAng} />
        <Txt x={HEAD.x + 190} y={HEAD.y - 250} size={150} color={RED} s={q1} rot={12}>?</Txt>
        <Txt x={BB.x - 235} y={BB.y - 60} size={130} color={RED} s={q2} rot={-12}>?</Txt>
      </Layer>
      <Meter t={t} />
    </AbsoluteFill>
  );
};
export const _debug = {HEAD, ARMPIT, PALM, STICK, SR, RX, toScreen};
