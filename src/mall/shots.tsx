import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {FONT} from '../thumbs/Thumbs';
import {MallMap} from './MallMap';
import {
  Arrow,
  CCTV_FILTER,
  CctvOverlay,
  Clock,
  Cracks,
  Flash,
  Grille,
  H,
  Padlock,
  Rattle,
  Ring,
  Screen,
  Shards,
  shake,
  Tag,
  Txt,
  W,
  Waves,
} from './Overlays';
import {jointsOf, Look, LOOKS, Pose, POSES, Stick, StickProps} from './Stick';
import {BgName, Cam, FULL, lerpCam, World} from './World';

export type P = {t: number; dur: number; frame: number; ev: Record<string, number>};
export type ShotDef = {at: string; ev?: Record<string, string>; draw: (p: P) => React.ReactNode};

/* ---------------- helpers ---------------- */

const camAt = (a: Cam, b: Cam | undefined, p: P) => (b ? lerpCam(a, b, Math.min(1, Math.max(0, p.t / Math.max(p.dur, 0.01)))) : a);

export const Scene: React.FC<{
  bg: BgName;
  a: Cam;
  b?: Cam;
  p: P;
  filter?: string;
  shakeXY?: [number, number];
  children?: React.ReactNode;
  over?: React.ReactNode;
  screen?: React.ReactNode;
}> = ({bg, a, b, p, filter, shakeXY, children, over, screen}) => (
  <AbsoluteFill>
    <World bg={bg} cam={camAt(a, b, p)} width={W} height={H} filter={filter} shake={shakeXY} over={over}>
      {children}
    </World>
    {screen && <Screen>{screen}</Screen>}
  </AbsoluteFill>
);

// Perspective: standing height (picture px) for a figure whose feet are at y.
const hC = (y: number) => 1.1 * (y - 880); // concourse
const hG = (y: number) => 0.57 * (y - 706); // garage
export const hI = (y: number) => 2.2 * (y - 780); // inside the sporting goods store
const hF = (y: number) => 1.1 * (y - 870); // food court

type Fig = Omit<StickProps, 'look' | 'pose'> & {look?: Look; pose?: Pose};
export const Guard: React.FC<Fig> = (p) => <Stick look={LOOKS.guard} pose={POSES.stand} eyes="dot" mouth="flat" {...p} />;
const Marcus: React.FC<Fig> = (p) => <Stick look={LOOKS.marcus} pose={POSES.stand} eyes="dot" mouth="flat" {...p} />;
const ZLOOKS = [LOOKS.zombieA, LOOKS.zombieB, LOOKS.zombieC, LOOKS.zombieD, LOOKS.zombieE];
const Zed: React.FC<Fig & {k?: number}> = ({k = 0, ...p}) => (
  <Stick look={ZLOOKS[k % ZLOOKS.length]} pose={k % 2 ? POSES.zShambleB : POSES.zShamble} eyes="zombie" mouth="zombie" wobble={k + 3} {...p} />
);

// A crowd from [x, y, h, face] rows; poses and looks vary by index.
export const Crowd: React.FC<{rows: [number, number, number, (1 | -1)?][]; dim?: number; front?: boolean; seed?: number; opacity?: number}> = ({
  rows,
  dim = 1,
  front = false,
  seed = 0,
  opacity = 1,
}) => (
  <g>
    {rows.map(([x, y, h, face = -1], i) => (
      <Zed
        key={i}
        k={i + seed}
        x={x}
        y={y}
        h={h}
        face={face}
        dim={dim}
        opacity={opacity}
        front={front}
        {...(front ? {pose: i % 2 ? POSES.frontReach : POSES.frontPress} : {})}
        shadow={0.2}
      />
    ))}
  </g>
);

// The sporting goods entrance as seen from outside / inside (picture px).
const SF = {x0: 716, y0: 690, x1: 2094, y1: 1352};
const SI = {x0: 1148, y0: 432, x1: 1712, y1: 932};
// the green tent stands in front of the right half of the entrance
const TENT = '1400,1012 1430,940 1480,850 1530,795 1580,760 1640,738 1700,732 1760,738 1820,760 1900,830 1900,1012';
// Things beyond the gate: clipped to the opening and hidden behind the tent.
export const Beyond: React.FC<{children: React.ReactNode}> = ({children}) => (
  <g>
    <defs>
      <mask id="beyond" maskUnits="userSpaceOnUse" x={0} y={0} width={2816} height={1584}>
        <rect x={SI.x0} y={SI.y0} width={SI.x1 - SI.x0} height={SI.y1 - SI.y0 + 6} fill="#fff" />
        <polygon points={TENT} fill="#000" />
      </mask>
    </defs>
    <g mask="url(#beyond)">{children}</g>
  </g>
);
// Outline box that draws itself on.
const Box: React.FC<{x0: number; y0: number; x1: number; y1: number; t: number; at: number; color?: string; w?: number}> = ({x0, y0, x1, y1, t, at, color = '#3fb36b', w = 18}) => {
  const k = Math.min(1, Math.max(0, (t - at) / 0.4));
  if (k <= 0) return null;
  const per = 2 * (x1 - x0 + y1 - y0);
  return <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={18} fill="none" stroke={color} strokeWidth={w} strokeDasharray={`${per * k} ${per}`} strokeLinecap="round" />;
};

const MallSign: React.FC = () => (
  <text x={1408} y={598} textAnchor="middle" fontFamily={FONT} fontSize={86} fill="#5a3b26" letterSpacing="0.06em">
    MAPLECREST
  </text>
);

const ItemTag: React.FC<{text: string; p: P; at?: number}> = ({text, p, at = 0.05}) => <Tag x={W / 2} y={190} text={text} t={p.t} at={at} size={86} anchor="middle" />;

const SpeedLines: React.FC<{t: number}> = ({t}) => (
  <g stroke="#ffffff" strokeLinecap="round" opacity={0.55}>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const y = 380 + i * 95;
      const x = ((i * 337 + t * 2600) % 1500) - 200;
      return <line key={i} x1={x} y1={y} x2={x + 260 + (i % 3) * 80} y2={y} strokeWidth={10 - (i % 3) * 2} />;
    })}
  </g>
);

const ShoppingList: React.FC<{t: number}> = ({t}) => {
  const s = interpolate(t, [0.1, 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (s <= 0) return null;
  const items = ['PHARMACY', 'FOOD COURT', 'DEPT STORE', 'SPORTING GOODS'];
  return (
    <g transform={`translate(1440, 300) rotate(4) scale(${s})`}>
      <rect x={-20} y={-90} width={470} height={470} fill="#f7f1dc" stroke="#1d1a1a" strokeWidth={8} rx={8} />
      <rect x={140} y={-110} width={150} height={40} fill="#d9c27a" opacity={0.85} />
      <text x={20} y={-20} fontFamily={FONT} fontSize={50} fill="#1d1a1a">
        SHOPPING LIST
      </text>
      {items.map((it, i) => (
        <text key={it} x={20} y={60 + i * 75} fontFamily={FONT} fontSize={42} fill="#2f4475">
          {`${i + 1}. ${it}`}
        </text>
      ))}
    </g>
  );
};

/* ---------------- recurring set-ups ---------------- */

const ramp6: [number, number, number, (1 | -1)?][] = [
  [1990, 1010, 155],
  [2120, 965, 140],
  [2250, 920, 125],
  [2370, 880, 112],
  [2060, 1060, 168],
  [2290, 990, 140],
];
const ramp10 = [...ramp6, [1880, 1060, 172], [2200, 1040, 158], [2430, 930, 118], [1780, 1110, 190]] as [number, number, number, (1 | -1)?][];
const rampMany = [
  ...ramp10,
  [1700, 1150, 205],
  [1620, 1080, 200],
  [1960, 1130, 205],
  [2140, 1120, 190],
  [2330, 1060, 160],
  [2480, 980, 130],
  [1540, 1180, 215],
  [1850, 1190, 220],
  [2050, 1200, 225],
  [2400, 1130, 175],
  [2520, 1060, 150],
  [1450, 1120, 205],
  [1760, 1240, 240],
  [2250, 1210, 215],
] as [number, number, number, (1 | -1)?][];

// Marcus down on the garage floor with the first one over him.
const Attack: React.FC = () => (
  <g>
    <Marcus x={1290} y={1160} h={hG(1160)} pose={POSES.lyingDown} eyes="closed" mouth="flat" shadow={0.3} />
    <Zed k={2} x={1150} y={1166} h={hG(1166)} face={1} pose={POSES.zCrouchEat} />
  </g>
);

const outsideGlass: [number, number, number, (1 | -1)?][] = [
  [1960, 1012, 235, -1],
  [2075, 1000, 215, -1],
  [2240, 1022, 250, -1],
  [2400, 1004, 220, -1],
  [2560, 1030, 262, -1],
  [2700, 1015, 240, -1],
];

const insideGuardSit = {x: 1180, y: 1110, h: hI(1110)};
const marcusAtGate = {x: 1420, y: 936, h: 330};
const marcusRadio = () => {
  const j = jointsOf(POSES.frontPress, marcusAtGate.x, marcusAtGate.y, marcusAtGate.h, 1);
  const s = marcusAtGate.h / 300;
  return {x: j.neck[0] - 9 * s, y: j.neck[1] + 34 * s};
};
const guardRadio = () => {
  const j = jointsOf(POSES.radioBoth, insideGuardSit.x, insideGuardSit.y, insideGuardSit.h, 1);
  return {x: j.handN[0], y: j.handN[1]};
};

export const HoldGate: React.FC<{frac: number; opacity?: number}> = ({frac, opacity = 1}) => (
  <Beyond>
    <g opacity={opacity}>
      <Grille x0={SI.x0} y0={SI.y0} x1={SI.x1} y1={SI.y1} frac={frac} dark={1} />
    </g>
  </Beyond>
);

/* ---------------- the shot list ---------------- */

export const SHOTS: ShotDef[] = [
  // ---------- Chapter 1: The Loop ----------
  {
    at: '0',
    draw: (p) => (
      <Scene bg="concourse" a={FULL} b={{x: 1330, y: 880, z: 1.12}} p={p}>
        <Guard x={1150} y={1420} h={hC(1420)} pose={POSES.walkLight} propN="flashlight" beam={520} />
      </Scene>
    ),
  },
  {
    at: 'Eleven at night',
    ev: {seven: 'seven'},
    draw: (p) => (
      <Scene
        bg="exterior"
        a={{x: 1408, y: 820, z: 1}}
        b={{x: 1408, y: 880, z: 1.12}}
        p={p}
        over={<MallSign />}
        screen={
          <>
            <Clock x={W / 2} y={215} text={p.t < p.ev.seven - 0.1 ? '11:00' : '7:00'} t={p.t} />
            <Txt x={W / 2 + 250} y={240} size={56} anchor="start">
              {p.t < p.ev.seven - 0.1 ? 'PM' : 'AM'}
            </Txt>
          </>
        }
      >
        <Guard x={1405} y={1046} h={118} pose={POSES.walkLight} propN="flashlight" beam={70} shadow={0.2} />
      </Scene>
    ),
  },
  {at: 'I walk the same loop', draw: (p) => <MallMap mode="loop" t={p.t} dur={p.dur} />},
  {
    at: 'I rattle',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 2280, y: 1000, z: 1.9}} b={{x: 2300, y: 990, z: 2}} p={p}>
        <Guard x={2230} y={1330} h={hC(1330)} pose={POSES.rattle} />
        <Rattle x={2372} y={935} s={1.4} t={p.t} />
      </Scene>
    ),
  },
  {
    at: 'I tell the same',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1490, y: 905, z: 2.5}} b={{x: 1505, y: 895, z: 2.65}} p={p}>
        <Stick x={1600} y={905} h={150} face={-1} pose={POSES.standRelax} look={LOOKS.teenA} eyes="dot" mouth="smile" />
        <Stick x={1558} y={802} h={146} face={-1} pose={POSES.shrug} look={LOOKS.teenB} eyes="closed" mouth="smile" />
        <Guard x={1380} y={1185} h={335} pose={POSES.pointUp} eyes="angry" mouth="open" />
      </Scene>
    ),
  },
  {
    at: 'Nothing ever happens',
    draw: (p) => (
      <Scene bg="office" a={FULL} b={{x: 1520, y: 780, z: 1.08}} p={p}>
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.yawn} eyes="closed" mouth="o" />
      </Scene>
    ),
  },
  {
    at: "That's kind of",
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1360, y: 1130, z: 1.85}} b={{x: 1360, y: 1120, z: 1.95}} p={p}>
        <Guard x={1360} y={1500} h={hC(1500)} pose={POSES.thumbsUp} mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'I carry three',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1360, y: 1120, z: 1.7}} b={{x: 1360, y: 1110, z: 1.8}} p={p} screen={<ItemTag text="3 THINGS" p={p} at={0.15} />}>
        <Guard x={1360} y={1500} h={hC(1500)} pose={POSES.standRelax} mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'A flashlight',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1520, y: 1130, z: 1.8}} b={{x: 1540, y: 1120, z: 1.9}} p={p} screen={<ItemTag text="1. FLASHLIGHT" p={p} />}>
        <Guard x={1250} y={1500} h={hC(1500)} pose={POSES.flashlight} propN="flashlight" beam={650} />
      </Scene>
    ),
  },
  {
    at: 'A radio that',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1420, y: 1130, z: 1.8}} b={{x: 1430, y: 1120, z: 1.9}} p={p} screen={<ItemTag text="2. RADIO" p={p} />}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={POSES.radio} propN="radio" mouth="open" />
      </Scene>
    ),
  },
  {
    at: 'the other night guard',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1350, y: 1085, z: 2.5}} b={{x: 1355, y: 1080, z: 2.62}} p={p} screen={<ItemTag text="MARCUS" p={p} at={0.2} />}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.wave} mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'And a ring',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1350, y: 960, z: 2.15}} b={{x: 1355, y: 950, z: 2.3}} p={p} screen={<ItemTag text="3. 42 KEYS" p={p} at={0.6} />}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={{...POSES.holdUp, armN: [120, 160]}} propN="keys" mouth="smile" />
      </Scene>
    ),
  },
  {at: 'One for every store', draw: (p) => <MallMap mode="keys" t={p.t} dur={p.dur} />},

  // ---------- Chapter 2: The Ramp ----------
  {
    at: 'At one forty',
    draw: (p) => (
      <Scene
        bg="office"
        a={FULL}
        b={{x: 1460, y: 780, z: 1.1}}
        p={p}
        screen={
          <>
            <Clock x={W / 2} y={215} text="1:40" t={p.t} at={0.1} />
            <Txt x={W / 2 + 250} y={240} size={56} anchor="start">
              AM
            </Txt>
          </>
        }
      >
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" />
      </Scene>
    ),
  },
  {
    at: '@marcus1',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1760, y: 990, z: 1.75}} b={{x: 1790, y: 985, z: 1.85}} p={p}>
        <Zed k={2} x={2130} y={968} h={150} face={-1} pose={POSES.zLimp} shadow={0.2} />
        <Marcus x={1450} y={1350} h={hG(1350)} pose={POSES.radio} propN="radio" mouth="open" look2={1} />
      </Scene>
    ),
  },
  {
    at: 'Then I hear him',
    draw: (p) => (
      <Scene bg="office" a={{x: 2080, y: 880, z: 1.7}} b={{x: 2090, y: 870, z: 1.8}} p={p}>
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" eyes="worried" />
      </Scene>
    ),
  },
  {
    at: '@marcus2',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1600, y: 1060, z: 2.1}} b={{x: 1610, y: 1050, z: 2.25}} p={p}>
        <Marcus x={1470} y={1350} h={hG(1350)} pose={POSES.wave} eyes="worried" mouth="o" />
        <Zed k={2} x={1770} y={1342} h={hG(1342)} face={-1} pose={POSES.zShamble} />
      </Scene>
    ),
  },
  {
    at: 'Then nothing',
    draw: (p) => (
      <Scene bg="office" a={{x: 2110, y: 790, z: 2.8}} b={{x: 2115, y: 785, z: 3}} p={p}>
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" eyes="wide" sweat />
      </Scene>
    ),
  },
  {
    at: 'I check the cameras',
    draw: (p) => (
      <Scene bg="office" a={{x: 1408, y: 780, z: 1.12}} b={{x: 1408, y: 770, z: 1.2}} p={p}>
        <Guard x={1760} y={1590} h={930} face={-1} pose={POSES.stand} back />
      </Scene>
    ),
  },
  {
    at: 'Garage level',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={FULL} b={{x: 1408, y: 800, z: 1.06}} p={p} filter={CCTV_FILTER}>
          <Attack />
        </Scene>
        <CctvOverlay t={p.t} frame={p.frame} cam="CAM 07 · GARAGE L2" clock="01:41:07" />
      </AbsoluteFill>
    ),
  },
  {
    at: 'Marcus is on the ground',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={{x: 1260, y: 1060, z: 1.9}} b={{x: 1260, y: 1060, z: 2.05}} p={p} filter={CCTV_FILTER}>
          <Attack />
        </Scene>
        <CctvOverlay t={p.t} frame={p.frame} cam="CAM 07 · GARAGE L2" clock="01:41:09" />
      </AbsoluteFill>
    ),
  },
  {
    at: 'The guy is on top',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={{x: 1215, y: 1085, z: 2.7}} b={{x: 1215, y: 1085, z: 2.9}} p={p} filter={CCTV_FILTER}>
          <Attack />
        </Scene>
        <CctvOverlay t={p.t} frame={p.frame} cam="CAM 07 · GARAGE L2" clock="01:41:11" />
      </AbsoluteFill>
    ),
  },
  {
    at: 'behind them',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={{x: 1700, y: 960, z: 1.4}} b={{x: 1750, y: 950, z: 1.5}} p={p} filter={CCTV_FILTER}>
          <Attack />
          <Crowd rows={ramp6.slice(0, 3)} />
        </Scene>
        <CctvOverlay t={p.t} frame={p.frame} cam="CAM 08 · RAMP" clock="01:41:13" />
      </AbsoluteFill>
    ),
  },
  {
    at: 'Six',
    ev: {ten: 'Ten', stop: 'I stop'},
    draw: (p) => {
      const rows = p.t < p.ev.ten - 0.05 ? ramp6 : p.t < p.ev.stop - 0.05 ? ramp10 : rampMany;
      const label = p.t < p.ev.ten - 0.05 ? '6' : p.t < p.ev.stop - 0.05 ? '10' : 'TOO MANY';
      return (
        <AbsoluteFill>
          <Scene bg="garage" a={{x: 1800, y: 950, z: 1.25}} b={{x: 1800, y: 950, z: 1.35}} p={p} filter={CCTV_FILTER}>
            <Attack />
            <Crowd rows={rows} />
          </Scene>
          <CctvOverlay t={p.t} frame={p.frame} cam="CAM 08 · RAMP" clock="01:41:16" />
          <Screen>
            <Txt x={W / 2} y={260} size={label.length > 2 ? 130 : 190} fill="#ff4d3a">
              {label}
            </Txt>
          </Screen>
        </AbsoluteFill>
      );
    },
  },
  {
    at: '>counting',
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 2150, y: 830, z: 1.65}} b={{x: 2120, y: 840, z: 1.8}} p={p}>
        <Crowd rows={outsideGlass} dim={0.5} />
      </Scene>
    ),
  },

  // ---------- Chapter 3: Glass ----------
  {
    at: "Here's the thing",
    draw: (p) => <Scene bg="exterior" a={FULL} b={{x: 1408, y: 830, z: 1.25}} p={p} over={<MallSign />} />,
  },
  {
    at: '>malls',
    ev: {glass: 'glass'},
    draw: (p) => (
      <Scene bg="exterior" a={{x: 1408, y: 840, z: 2.2}} b={{x: 1408, y: 840, z: 2.45}} p={p} over={<MallSign />} screen={<Tag x={W / 2} y={190} text="GLASS" kind="info" t={p.t} at={p.ev.glass} size={96} anchor="middle" />} />
    ),
  },
  {
    at: 'Glass doors',
    draw: (p) => <Scene bg="foodcourt" a={{x: 2010, y: 830, z: 2.5}} b={{x: 2010, y: 830, z: 2.7}} p={p} screen={<ItemTag text="GLASS DOORS" p={p} />} />,
  },
  {
    at: 'Glass walls',
    draw: (p) => <Scene bg="pharmacy" a={{x: 1408, y: 820, z: 1.15}} b={{x: 1408, y: 820, z: 1.3}} p={p} screen={<ItemTag text="GLASS WALLS" p={p} />} />,
  },
  {
    at: 'Glass ceilings',
    draw: (p) => <Scene bg="concourse" a={{x: 1408, y: 330, z: 2}} b={{x: 1408, y: 300, z: 2.2}} p={p} screen={<Tag x={W / 2} y={H - 120} text="GLASS CEILINGS" t={p.t} at={0.05} size={86} anchor="middle" />} />,
  },
  {
    at: 'A mall is built',
    ev: {letting: 'letting'},
    draw: (p) => {
      const k = (d: number) => Math.min(1, Math.max(0, (p.t - p.ev.letting - d) / 0.3));
      return (
        <Scene
          bg="exterior"
          a={{x: 1408, y: 860, z: 1}}
          b={{x: 1408, y: 880, z: 1.08}}
          p={p}
          over={
            <>
              <MallSign />
              <Arrow x0={700} y0={1450} x1={1300} y1={1080} k={k(0)} w={44} />
              <Arrow x0={1408} y0={1560} x1={1408} y1={1110} k={k(0.12)} w={44} />
              <Arrow x0={2120} y0={1450} x1={1520} y1={1080} k={k(0.24)} w={44} />
            </>
          }
        />
      );
    },
  },
  {
    at: 'Tonight',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1380, y: 1130, z: 1.9}} b={{x: 1380, y: 1120, z: 2}} p={p}>
        <Guard x={1380} y={1500} h={hC(1500)} pose={POSES.flashlight} propN="flashlight" beam={520} eyes="angry" />
      </Scene>
    ),
  },
  {
    at: 'But a mall has',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1950, y: 1000, z: 1.35}} b={{x: 1980, y: 990, z: 1.45}} p={p}>
        <Guard x={1720} y={1400} h={hC(1400)} pose={POSES.lookUp} look2={1} />
      </Scene>
    ),
  },
  {
    at: 'Every store has',
    ev: {steel: 'steel'},
    draw: (p) => (
      <Scene bg="concourse" a={{x: 330, y: 830, z: 2.3}} b={{x: 330, y: 820, z: 2.45}} p={p} screen={<Tag x={W / 2} y={190} text="STEEL SECURITY GATE" t={p.t} at={p.ev.steel - 0.1} size={84} anchor="middle" />} />
    ),
  },
  {
    at: 'Pull it down',
    ev: {lock: 'lock'},
    draw: (p) => {
      const locked = p.t >= p.ev.lock - 0.08;
      const pose = {...POSES.pullDown, armF: [150, 160] as [number, number], armN: [140, 155] as [number, number]};
      const j = jointsOf(pose, 1405, 1530, 560, -1);
      const pull = interpolate(p.t, [0, Math.max(0.2, p.ev.lock - 0.1)], [0, 1], {extrapolateRight: 'clamp'});
      const barY = Math.min(SF.y1, j.handN[1] + pull * 120);
      return (
        <Scene
          bg="sportsfront"
          a={{x: 1408, y: 900, z: 1.2}}
          b={{x: 1408, y: 920, z: 1.28}}
          p={p}
          over={locked ? <Padlock x={1405} y={1300} s={1.3} /> : undefined}
        >
          <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={locked ? 1 : (barY - SF.y0) / (SF.y1 - SF.y0)} />
          {locked ? (
            <Guard x={1300} y={1530} h={560} face={1} pose={POSES.crouchLock} back />
          ) : (
            <Guard x={1405} y={1530 + pull * 60} h={560} face={-1} pose={pose} back />
          )}
        </Scene>
      );
    },
  },
  {
    at: 'and that store becomes',
    ev: {vault: 'vault'},
    draw: (p) => (
      <Scene
        bg="sportsfront"
        a={{x: 1408, y: 960, z: 1.12}}
        b={{x: 1408, y: 960, z: 1.22}}
        p={p}
        over={<Padlock x={1405} y={1300} s={1.3} />}
        screen={<Tag x={W / 2} y={190} text="A VAULT" kind="ok" t={p.t} at={p.ev.vault - 0.1} size={96} anchor="middle" />}
      >
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
      </Scene>
    ),
  },
  {at: "So I don't need", draw: (p) => <MallMap mode="all" t={p.t} dur={p.dur} />},
  {at: 'I just need to pick', draw: (p) => <MallMap mode="pick" t={p.t} dur={p.dur} />},

  // ---------- Chapter 4: Shopping ----------
  {
    at: 'I run my loop',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1250, y: 1060, z: 1.45}} b={{x: 1300, y: 1060, z: 1.5}} p={p} screen={<SpeedLines t={p.t} />}>
        <Guard x={1150} y={1450} h={hC(1450)} pose={POSES.runLight} propN="flashlight" beam={420} eyes="angry" mouth="grit" />
      </Scene>
    ),
  },
  {at: 'The same loop', draw: (p) => <MallMap mode="thousand" t={p.t} dur={p.dur} />},
  {
    at: 'But this time',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1300, y: 1120, z: 1.7}} b={{x: 1320, y: 1110, z: 1.78}} p={p} screen={<ShoppingList t={p.t} />}>
        <Guard x={1100} y={1500} h={hC(1500)} pose={POSES.flashlight} propN="flashlight" beam={420} mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'The pharmacy has',
    ev: {med: 'medicine'},
    draw: (p) => (
      <Scene bg="pharmacy" a={{x: 1408, y: 820, z: 1.05}} b={{x: 1380, y: 830, z: 1.15}} p={p} screen={<Tag x={150} y={200} text="MEDICINE" kind="ok" t={p.t} at={p.ev.med - 0.1} size={84} />}>
        <Guard x={2470} y={1565} h={640} face={-1} pose={POSES.flashlight} propN="flashlight" beam={420} />
      </Scene>
    ),
  },
  {
    at: 'But the whole front',
    ev: {glass: 'glass'},
    draw: (p) => (
      <Scene bg="pharmacy" a={{x: 1000, y: 900, z: 1.7}} b={{x: 980, y: 900, z: 1.85}} p={p} screen={<Tag x={150} y={200} text="GLASS FRONT" kind="no" t={p.t} at={p.ev.glass - 0.1} size={84} />} />
    ),
  },
  {
    at: 'The food court has',
    ev: {food: 'freezer'},
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 1300, y: 850, z: 1}} b={{x: 1300, y: 860, z: 1.1}} p={p} screen={<Tag x={150} y={200} text="FREEZER FULL OF FOOD" kind="ok" t={p.t} at={p.ev.food - 0.1} size={80} />}>
        <Guard x={900} y={1450} h={hF(1450)} pose={POSES.flashlight} propN="flashlight" beam={420} />
      </Scene>
    ),
  },
  {
    at: "But that's exactly",
    ev: {coming: 'coming'},
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 2150, y: 830, z: 1.7}} b={{x: 2130, y: 840, z: 1.85}} p={p} screen={<Tag x={150} y={200} text="THEIR WAY IN" kind="no" t={p.t} at={p.ev.coming - 0.1} size={84} />}>
        <Crowd rows={outsideGlass.map(([x, y, h]) => [x, y + 15, h * 1.08, -1] as [number, number, number, -1])} dim={0.55} front seed={1} />
      </Scene>
    ),
  },
  {
    at: 'The department store has',
    ev: {beds: 'beds', floor: 'second'},
    draw: (p) => (
      <Scene
        bg="deptstore"
        a={{x: 1408, y: 792, z: 1}}
        b={{x: 1408, y: 800, z: 1.08}}
        p={p}
        screen={
          <>
            <Tag x={150} y={200} text="BEDS" kind="ok" t={p.t} at={p.ev.beds - 0.1} size={84} />
            <Tag x={1050} y={200} text="2ND FLOOR" kind="ok" t={p.t} at={p.ev.floor - 0.1} size={84} />
          </>
        }
      >
        <Guard x={1700} y={1480} h={520} face={-1} pose={POSES.flashlight} propN="flashlight" beam={360} />
      </Scene>
    ),
  },
  {
    at: "But it's huge",
    draw: (p) => (
      <Scene bg="deptstore" a={{x: 1408, y: 820, z: 1.25}} b={{x: 1408, y: 792, z: 1}} p={p}>
        <Guard x={1420} y={1250} h={230} pose={POSES.standRelax} eyes="worried" />
      </Scene>
    ),
  },
  {
    at: 'Too many doors',
    draw: (p) => (
      <Scene
        bg="deptstore"
        a={FULL}
        b={{x: 1408, y: 800, z: 1.05}}
        p={p}
        over={
          <>
            <Ring x={515} y={955} rx={115} ry={130} t={p.t} at={0.05} />
            <Ring x={965} y={955} rx={170} ry={125} t={p.t} at={0.18} />
            <Ring x={1950} y={950} rx={170} ry={120} t={p.t} at={0.31} />
            <Ring x={2415} y={950} rx={110} ry={110} t={p.t} at={0.44} />
            <Ring x={185} y={880} rx={150} ry={170} t={p.t} at={0.57} />
            <Ring x={2650} y={880} rx={150} ry={180} t={p.t} at={0.7} />
          </>
        }
        screen={<Tag x={W / 2} y={190} text="TOO MANY DOORS" kind="no" t={p.t} at={0.1} size={88} anchor="middle" />}
      />
    ),
  },
  {
    at: 'And the sporting goods',
    ev: {tents: 'tents'},
    draw: (p) => (
      <Scene bg="sportsfront" a={{x: 1408, y: 900, z: 1}} b={{x: 1420, y: 920, z: 1.08}} p={p} screen={<Tag x={150} y={200} text="TENTS" kind="ok" t={p.t} at={p.ev.tents - 0.1} size={84} />}>
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
        <Guard x={2380} y={1565} h={600} face={-1} pose={POSES.flashlight} propN="flashlight" beam={480} />
      </Scene>
    ),
  },
  {
    at: 'water filters',
    ev: {bats: 'aluminum'},
    draw: (p) => (
      <Scene
        bg="sportsfront"
        a={{x: 1300, y: 950, z: 1.9}}
        b={{x: 1320, y: 950, z: 2}}
        p={p}
        screen={
          <>
            <Tag x={150} y={200} text="WATER FILTERS" kind="ok" t={p.t} at={0.05} size={80} />
            <Tag x={150} y={330} text="ALUMINUM BATS" kind="ok" t={p.t} at={p.ev.bats - 0.1} size={80} />
          </>
        }
      >
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
      </Scene>
    ),
  },
  {
    at: 'And only one way',
    ev: {way: 'way'},
    draw: (p) => (
      <Scene
        bg="sportsfront"
        a={FULL}
        b={{x: 1408, y: 800, z: 1.05}}
        p={p}
        over={<Box x0={SF.x0 - 30} y0={SF.y0 - 230} x1={SF.x1 + 30} y1={SF.y1 + 20} t={p.t} at={p.ev.way - 0.25} />}
        screen={<Tag x={W / 2} y={190} text="ONE WAY IN" kind="ok" t={p.t} at={p.ev.way - 0.1} size={96} anchor="middle" />}
      >
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
      </Scene>
    ),
  },

  // ---------- Chapter 5: The Gate ----------
  {
    at: 'Behind me',
    ev: {crack: 'food court doors', shatter: 'shatter'},
    draw: (p) => {
      const broke = p.t >= p.ev.shatter - 0.04;
      const ck = interpolate(p.t, [p.ev.crack, p.ev.shatter], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const pressed: [number, number, number, (1 | -1)?][] = [
        [1985, 1036, 300],
        [2095, 1042, 315],
        [2200, 1034, 298],
        [2330, 1025, 260],
        [2480, 1020, 250],
      ];
      const inside: [number, number, number, (1 | -1)?][] = [
        [1880, 1180, hF(1180), -1],
        [2040, 1230, hF(1230), -1],
        [2200, 1150, hF(1150), -1],
        [2350, 1110, 260, -1],
        [1720, 1260, hF(1260), -1],
      ];
      return (
        <AbsoluteFill>
          <Scene
            bg="foodcourt"
            a={{x: 2050, y: 840, z: 1.7}}
            b={{x: 2050, y: 840, z: 1.78}}
            p={p}
            shakeXY={shake(p.t, p.ev.shatter, 26, 0.6)}
            over={
              broke ? (
                <Shards x={2010} y={830} t={p.t - p.ev.shatter} n={46} />
              ) : (
                ck > 0 && <Cracks x={2010} y={800} r={230} k={ck} />
              )
            }
          >
            {broke ? <Crowd rows={inside} seed={2} /> : <Crowd rows={pressed} dim={0.55} front seed={2} />}
          </Scene>
          <Flash t={p.t} at={p.ev.shatter - 0.02} len={0.3} />
        </AbsoluteFill>
      );
    },
  },
  {
    at: 'I slide under',
    draw: (p) => (
      <Scene bg="sportsfront" a={{x: 1300, y: 1050, z: 1.35}} b={{x: 1330, y: 1060, z: 1.42}} p={p}>
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={0.76} />
        <Guard x={1250} y={1400} h={470} pose={POSES.slide} eyes="wide" mouth="grit" />
        <Zed k={3} x={260} y={1580} h={640} face={1} dim={0.7} />
      </Scene>
    ),
  },
  {
    at: 'yank it down',
    draw: (p) => {
      const pose = {...POSES.pullDown, lean: 4, armF: [150, 162] as [number, number], armN: [142, 158] as [number, number]};
      const j = jointsOf(pose, 1300, 975, hI(975), -1);
      const k = interpolate(p.t, [0, 0.5], [0, 1], {extrapolateRight: 'clamp'});
      const barY = j.handN[1] + k * 90;
      return (
        <Scene bg="sportsinside" a={{x: 1340, y: 740, z: 1.9}} b={{x: 1340, y: 745, z: 1.98}} p={p}>
          <HoldGate frac={(Math.min(SI.y1, barY) - SI.y0) / (SI.y1 - SI.y0)} />
          <Guard x={1300} y={975 + k * 30} h={hI(975)} face={-1} pose={pose} back />
        </Scene>
      );
    },
  },
  {
    at: 'and lock it',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1330, y: 850, z: 2.8}} b={{x: 1330, y: 855, z: 2.95}} p={p}>
        <HoldGate frac={1} />
        <Padlock x={1350} y={912} s={0.5} />
        <Guard x={1250} y={1000} h={hI(1000)} face={1} pose={POSES.crouchLock} back />
      </Scene>
    ),
  },
  {
    at: 'Then I sit',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1300, y: 880, z: 1.25}} b={{x: 1300, y: 880, z: 1.35}} p={p} filter="brightness(0.8)">
        <HoldGate frac={1} />
        <Guard {...insideGuardSit} pose={POSES.sitHug} eyes="wide" />
      </Scene>
    ),
  },
  {
    at: 'and I try not',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1215, y: 800, z: 3}} b={{x: 1215, y: 800, z: 3.2}} p={p} filter="brightness(0.8)">
        <HoldGate frac={1} />
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="wide" sweat />
      </Scene>
    ),
  },
  {
    at: 'Footsteps',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 700, z: 2}} b={{x: 1420, y: 700, z: 2.1}} p={p}>
        <Beyond>
        <Crowd
          rows={[
            [1230, 915, 300, 1],
            [1420, 905, 282, 1],
            [1610, 920, 305, -1],
          ]}
          dim={0.4}
        />
        </Beyond>
        <HoldGate frac={1} />
      </Scene>
    ),
  },
  {
    at: 'shuffling past',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 700, z: 2.1}} b={{x: 1420, y: 700, z: 2.2}} p={p}>
        <Beyond>
        <Crowd
          rows={[
            [1200, 925, 320, 1],
            [1300, 912, 295, 1],
            [1430, 930, 330, -1],
            [1540, 915, 300, 1],
            [1640, 928, 325, -1],
            [1705, 910, 290, 1],
          ]}
          dim={0.45}
          seed={1}
        />
        </Beyond>
        <HoldGate frac={1} />
      </Scene>
    ),
  },
  {
    at: 'One of them stops',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 690, z: 2.5}} b={{x: 1420, y: 685, z: 2.65}} p={p}>
        <Beyond>
        <Crowd
          rows={[
            [1250, 912, 290, 1],
            [1610, 915, 295, -1],
          ]}
          dim={0.35}
          seed={3}
        />
        <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontStand} front eyes="zombie" mouth="zombie" dim={0.5} wobble={9} />
        </Beyond>
        <HoldGate frac={1} />
      </Scene>
    ),
  },
  {
    at: 'It presses its face',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 690, z: 3.4}} b={{x: 1420, y: 685, z: 3.7}} p={p}>
        <Beyond>
          <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontPress} front eyes="zombie" mouth="zombie" dim={0.55} wobble={9} />
        </Beyond>
        <HoldGate frac={1} opacity={0.85} />
      </Scene>
    ),
  },
  {
    at: "It's Marcus",
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 668, z: 5.2}} b={{x: 1420, y: 666, z: 5.5}} p={p}>
        <Beyond>
          <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontPress} front eyes="zombie" mouth="zombie" wobble={9} />
        </Beyond>
        <HoldGate frac={1} opacity={0.72} />
      </Scene>
    ),
  },
  {
    at: "He's still wearing",
    draw: (p) => {
      const r = marcusRadio();
      return (
        <Scene bg="sportsinside" a={{x: r.x, y: r.y, z: 4.6}} b={{x: r.x, y: r.y, z: 4.9}} p={p} over={<Ring x={r.x} y={r.y} rx={34} ry={40} t={p.t} at={0.25} w={5} />}>
          <Beyond>
            <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontPress} front eyes="zombie" mouth="zombie" wobble={9} />
          </Beyond>
          <HoldGate frac={1} />
        </Scene>
      );
    },
  },
  {
    at: 'Then mine crackles',
    draw: (p) => {
      const r = guardRadio();
      return (
        <Scene bg="sportsinside" a={{x: r.x, y: r.y - 60, z: 2.8}} b={{x: r.x, y: r.y - 60, z: 3}} p={p} filter="brightness(0.8)" over={<Waves x={r.x + 20} y={r.y - 20} t={p.t} size={70} />}>
          <HoldGate frac={1} />
          <Guard {...insideGuardSit} pose={POSES.radioBoth} propN="radio" eyes="wide" sweat />
        </Scene>
      );
    },
  },
  {
    at: '@woman',
    draw: (p) => (
      <Scene bg="deptstore" a={{x: 1182, y: 655, z: 4.6}} b={{x: 1186, y: 652, z: 4.85}} p={p}>
        <Stick x={1180} y={692} h={100} look={LOOKS.woman} pose={POSES.radio} propN="radio" eyes="worried" mouth="o" shadow={0.15} />
      </Scene>
    ),
  },
  {
    at: 'Second floor',
    draw: (p) => {
      const r = guardRadio();
      return (
        <Scene bg="sportsinside" a={{x: 1215, y: 830, z: 2.6}} b={{x: 1215, y: 830, z: 2.75}} p={p} filter="brightness(0.8)" over={<Waves x={r.x + 20} y={r.y - 20} t={p.t} size={70} />}>
          <HoldGate frac={1} />
          <Guard {...insideGuardSit} pose={POSES.radioBoth} propN="radio" eyes="wide" mouth="grit" sweat />
        </Scene>
      );
    },
  },
  {
    at: 'Her voice comes',
    draw: (p) => {
      const r = guardRadio();
      return (
        <Scene bg="sportsinside" a={{x: r.x, y: r.y - 20, z: 4.4}} b={{x: r.x, y: r.y - 20, z: 4.7}} p={p} filter="brightness(0.8)" over={<Waves x={r.x + 20} y={r.y - 20} t={p.t} size={90} />}>
          <HoldGate frac={1} />
          <Guard {...insideGuardSit} pose={POSES.radioBoth} propN="radio" eyes="wide" mouth="grit" sweat />
        </Scene>
      );
    },
  },
  {
    at: "And out of Marcus's",
    draw: (p) => {
      const r = marcusRadio();
      return (
        <Scene bg="sportsinside" a={{x: r.x, y: r.y - 30, z: 3.8}} b={{x: r.x, y: r.y - 30, z: 4.1}} p={p} over={<Waves x={r.x - 12} y={r.y} t={p.t} size={60} dir={-1} />}>
          <Beyond>
            <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontPress} front eyes="zombie" mouth="zombie" wobble={9} />
          </Beyond>
          <HoldGate frac={1} />
        </Scene>
      );
    },
  },
  {
    at: 'every head',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1390, y: 720, z: 2.55}} b={{x: 1390, y: 715, z: 2.8}} p={p} shakeXY={shake(p.t, 0.05, 10, 0.4)}>
        <Beyond>
          <Crowd
            rows={[
              [1240, 905, 280],
              [1400, 900, 270],
              [1560, 905, 280],
              [1190, 936, 330],
              [1275, 926, 315],
              [1360, 938, 335],
              [1445, 930, 325],
              [1530, 936, 330],
              [1620, 926, 318],
            ]}
            front
            seed={4}
          />
        </Beyond>
        <HoldGate frac={1} opacity={0.82} />
      </Scene>
    ),
  },
  {
    at: 'That was hour one',
    draw: (p) => {
      const o1 = interpolate(p.t, [0.05, 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const o2 = interpolate(p.t, [1.3, 1.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      return (
        <AbsoluteFill style={{background: '#07080b'}}>
          <Screen>
            <Txt x={W / 2} y={400} size={110} opacity={o1}>
              THAT WAS HOUR ONE.
            </Txt>
            <Txt x={W / 2} y={640} size={64} fill="#f0c53c" opacity={o2}>
              THE NIGHT GUARD HAD EVERY KEY
            </Txt>
            <Txt x={W / 2} y={730} size={44} fill="#9aa6c8" opacity={o2}>
              PILOT
            </Txt>
          </Screen>
        </AbsoluteFill>
      );
    },
  },
];
