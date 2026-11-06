import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CCTV_FILTER, CctvOverlay, Clock, Screen, Txt, W} from '../Overlays';
import {Beyond, HoldGate, P, Scene} from '../shots';
import {Look, LOOKS, Pose, POSES, Stick, StickProps} from '../Stick';
import {BgName, Cam} from '../World';
import {LILY_WIN, TowerWindow} from '../vertical';

/* Scene set-ups that come back again and again in Chapter 1 (16:9, picture px of each background). */

// ---------- inside Summit Outdoors, looking at the gate (sportsinside) ----------
// The gate opening is x 1148-1712, y 432-932; the floor inside runs down to y 1584.
export const GATE = {x: 1430, floor: 936};
export const marcusHurt: Look = {...LOOKS.marcus, skin: '#8e8a80', shirt: '#2f4472'};
export const marcusDead: Look = LOOKS.marcusZ;

export const GateScene: React.FC<{
  p: P;
  a: Cam;
  b?: Cam;
  beyond?: React.ReactNode; // out in the hallway, behind the gate
  gate?: number; // how far down the gate is (1 = shut)
  gateOpacity?: number;
  filter?: string;
  over?: React.ReactNode;
  screen?: React.ReactNode;
  shakeXY?: [number, number];
  children?: React.ReactNode; // inside the store, in front of the gate
}> = ({p, a, b, beyond, gate = 1, gateOpacity = 0.85, filter = 'brightness(0.85)', over, screen, shakeXY, children}) => (
  <Scene bg="sportsinside" a={a} b={b} p={p} filter={filter} over={over} screen={screen} shakeXY={shakeXY}>
    {beyond && <Beyond>{beyond}</Beyond>}
    {gate > 0 && <HoldGate frac={gate} opacity={gateOpacity} />}
    {children}
  </Scene>
);

// Marcus standing at the gate, seen from inside (alive and hurt, or dead).
export const MarcusAtGate: React.FC<Partial<StickProps> & {dead?: boolean}> = ({dead, ...p}) => (
  <Stick
    x={1420}
    y={936}
    h={330}
    look={dead ? marcusDead : marcusHurt}
    pose={dead ? POSES.frontPress : POSES.frontStand}
    front
    eyes={dead ? 'zombie' : 'worried'}
    mouth={dead ? 'zombie' : 'flat'}
    wobble={9}
    shadow={0}
    {...p}
  />
);

// The crowd in the hallway beyond the gate.
export const HALL_ROWS: [number, number, number][] = [
  [1220, 905, 250],
  [1330, 900, 240],
  [1460, 902, 245],
  [1590, 906, 252],
  [1680, 900, 240],
  [1260, 930, 300],
  [1400, 926, 290],
  [1540, 932, 305],
  [1650, 928, 296],
];

// ---------- the security office ----------
// The nine monitors on the back wall (picture px).
export const MONITORS = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({x0: [924, 1280, 1636][c], y0: [280, 508, 736][r], w: 290, h: 176})));
export type MonitorShow = 'zombies' | 'black' | 'crowd' | 'one';

const MonitorContent: React.FC<{i: number; show: MonitorShow; t: number}> = ({i, show, t}) => {
  const m = MONITORS[i];
  const id = `mon${i}${show}`;
  if (show === 'black') {
    return (
      <g>
        <rect x={m.x0} y={m.y0} width={m.w} height={m.h} rx={10} fill="#05070a" />
        <text x={m.x0 + m.w / 2} y={m.y0 + m.h / 2 + 12} textAnchor="middle" fontFamily="DejaVu Sans Mono, monospace" fontWeight={700} fontSize={30} fill="#d8d8d8">
          NO SIGNAL
        </text>
        <text x={m.x0 + 16} y={m.y0 + 32} fontFamily="DejaVu Sans Mono, monospace" fontWeight={700} fontSize={22} fill="#9a9a9a">
          CAM 14
        </text>
      </g>
    );
  }
  const n = show === 'one' ? 1 : show === 'zombies' ? 4 : 8;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={m.x0} y={m.y0} width={m.w} height={m.h} rx={10} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {new Array(n).fill(0).map((_, k) => {
          const depth = (k % 3) / 3;
          const hh = 70 + 40 * (1 - depth);
          const x = m.x0 + 30 + ((k * 61 + i * 37) % (m.w - 60)) + Math.sin(t * 0.8 + k) * 6;
          const y = m.y0 + m.h - 8 - depth * 26;
          return <Stick key={k} x={x} y={y} h={hh} look={LOOKS.zombieA} pose={k % 2 ? POSES.zShamble : POSES.zShambleB} ghost face={k % 2 ? 1 : -1} shadow={0} />;
        })}
      </g>
      <rect x={m.x0 + m.w - 22} y={m.y0 + 12} width={12} height={12} rx={6} fill="#ff3b30" opacity={Math.floor(t * 2) % 2 ? 0.3 : 1} />
    </g>
  );
};

export const OfficeScene: React.FC<{
  p: P;
  a: Cam;
  b?: Cam;
  danny?: Partial<StickProps> | false;
  screens?: Partial<Record<number, MonitorShow>>;
  filter?: string;
  screen?: React.ReactNode;
  over?: React.ReactNode;
  children?: React.ReactNode;
}> = ({p, a, b, danny = {}, screens = {}, filter, screen, over, children}) => (
  <Scene bg="office" a={a} b={b} p={p} filter={filter} screen={screen} over={over}>
    {Object.entries(screens).map(([i, s]) => (
      <MonitorContent key={i} i={Number(i)} show={s as MonitorShow} t={p.t} />
    ))}
    {children}
    {danny && <Stick x={2150} y={1545} h={880} face={-1} look={LOOKS.guard} pose={POSES.stand} eyes="dot" mouth="flat" {...danny} />}
  </Scene>
);

// ---------- a security-camera view ----------
export const CctvScene: React.FC<{p: P; bg: BgName; a: Cam; b?: Cam; cam: string; clock: string; children?: React.ReactNode; over?: React.ReactNode}> = ({
  p,
  bg,
  a,
  b,
  cam,
  clock,
  children,
  over,
}) => (
  <AbsoluteFill>
    <Scene bg={bg} a={a} b={b} p={p} filter={CCTV_FILTER} over={over}>
      {children}
    </Scene>
    <CctvOverlay t={p.t} frame={p.frame} cam={cam} clock={clock} />
  </AbsoluteFill>
);

// ---------- the roof ----------
// Lily's tower stands right of centre; her window (10th floor, 4th from the left) is at ROOF_WIN.
export const ROOF_WIN = {x: 1881, y: 291};
export const HOTEL_ROOF = {x: 2470, y: 676};
export const RoofScene: React.FC<{
  p: P;
  a: Cam;
  b?: Cam;
  time?: 'day' | 'dusk' | 'night';
  screen?: React.ReactNode;
  over?: React.ReactNode;
  children?: React.ReactNode;
}> = ({p, a, b, time = 'day', screen, over, children}) => {
  const filter =
    time === 'day' ? 'saturate(1.05)' : time === 'dusk' ? 'sepia(0.35) saturate(1.3) brightness(0.85) hue-rotate(-12deg)' : 'brightness(0.22) saturate(0.6) hue-rotate(185deg)';
  return (
    <Scene bg="roof" a={a} b={b} p={p} filter={filter} screen={screen} over={over}>
      {children}
    </Scene>
  );
};

// ---------- Lily's tower at night, from across the highway (parkview) ----------
export const TowerNight: React.FC<{
  p: P;
  a: Cam;
  b?: Cam;
  blackout?: number; // 0 = lit city, 1 = every light out
  win?: number; // Lily's window, 0..1
  screen?: React.ReactNode;
  children?: React.ReactNode;
}> = ({p, a, b, blackout = 0, win = 0, screen, children}) => {
  const k = blackout;
  const filter = `brightness(${1 - 0.8 * k}) saturate(${1 - 0.5 * k})`;
  return (
    <Scene bg="parkview" a={a} b={b} p={p} filter={filter} screen={screen}>
      {children}
      {(win > 0 || k > 0) && <TowerWindow on={win} />}
    </Scene>
  );
};
export {LILY_WIN};

// A big clock over a scene, top centre.
export const TopClock: React.FC<{text: string; ampm: string; t: number; at?: number}> = ({text, ampm, t, at = 0.1}) => (
  <>
    <Clock x={W / 2} y={215} text={text} t={t} at={at} />
    {t >= at && (
      <Txt x={W / 2 + 250} y={240} size={56} anchor="start">
        {ampm}
      </Txt>
    )}
  </>
);

// Danny (the guard) with sensible defaults, for one-liners in the shot lists.
export const Dan: React.FC<Partial<StickProps> & {pose?: Pose}> = (p) => (
  <Stick x={0} y={0} h={300} look={LOOKS.guard} pose={POSES.stand} eyes="dot" mouth="flat" {...p} />
);

export const ScreenOnly: React.FC<{children: React.ReactNode}> = ({children}) => <Screen>{children}</Screen>;
