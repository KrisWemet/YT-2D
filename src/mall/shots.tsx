import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {FONT} from '../thumbs/Thumbs';
import {BigCard, KidDrawing, SeriesTitle} from './Cards';
import {MallMap} from './MallMap';
import {
  BigTimer,
  NameTag,
  NoSignal,
  RewindFx,
  Shout,
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

/* ---------------- v2 set-ups ---------------- */

// Daytime bus stop: perspective is shallow, a grown-up at the curb is ~430 px.
const BUS_DOOR = {x: 2400, y: 1258};
const Vignette: React.FC<{o?: number}> = ({o = 0.75}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${o}) 100%)`}} />
);

const crouchRadio: Pose = {lean: 25, head: 8, armF: [40, 90], armN: [30, 165], legF: [70, -30], legN: [95, -10]};
const holdKeys: Pose = {...POSES.holdUp, armN: [120, 160]};

// Shoppers for the Black Friday shot, zombies for the same shot "tonight".
const lotRows: [number, number, number, (1 | -1)?][] = [
  [700, 1300, 0, 1], [880, 1420, 0, 1], [1040, 1200, 0, 1], [1180, 1480, 0, 1], [1290, 1260, 0, 1],
  [1530, 1250, 0, -1], [1640, 1460, 0, -1], [1780, 1190, 0, -1], [1930, 1380, 0, -1], [2100, 1280, 0, -1],
  [2260, 1470, 0, -1], [560, 1460, 0, 1], [2420, 1330, 0, -1], [1410, 1380, 0, 1],
];
const hLot = (y: number) => 0.55 * (y - 820);
const SHOPPERS = [LOOKS.shopperA, LOOKS.shopperB, LOOKS.shopperC, LOOKS.shopperD, LOOKS.teenA, LOOKS.teenB];
const BlackFridayBanner: React.FC = () => (
  <g transform="rotate(-3 1408 566)">
    <rect x={1140} y={490} width={536} height={150} rx={8} fill="#d8443a" stroke="#1d1a1a" strokeWidth={8} />
    <text x={1408} y={592} textAnchor="middle" fontFamily={FONT} fontSize={74} fill="#fff6c8" stroke="#1d1a1a" strokeWidth={10} paintOrder="stroke">
      BLACK FRIDAY
    </text>
  </g>
);

// The woman up on the department store balcony.
const WOMAN = {x: 1182, y: 692, h: 100};

/* ---------------- the shot list (v2) ---------------- */

export const SHOTS: ShotDef[] = [
  // ---------- Cold open ----------
  {
    at: '0',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 700, z: 3.2}} b={{x: 1420, y: 690, z: 3.6}} p={p}>
        <Beyond>
          <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontPress} front eyes="zombie" mouth="zombie" dim={0.6} wobble={9} />
        </Beyond>
        <HoldGate frac={1} opacity={0.85} />
      </Scene>
    ),
  },
  {
    at: 'used to be',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={{x: 1350, y: 1085, z: 2.5}} b={{x: 1355, y: 1080, z: 2.65}} p={p} filter="sepia(0.7) brightness(1.08) blur(1px)">
          <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.laugh} propN="radio" eyes="closed" mouth="open" />
        </Scene>
        <Vignette o={0.8} />
      </AbsoluteFill>
    ),
  },
  {
    at: 'In about ten',
    ev: {ten: 'ten seconds'},
    draw: (p) => {
      const r = marcusRadio();
      const left = Math.max(1, 10 - Math.floor(p.t * 1.6));
      return (
        <AbsoluteFill>
          <Scene bg="sportsinside" a={{x: r.x, y: r.y - 20, z: 4.4}} b={{x: r.x, y: r.y - 20, z: 4.8}} p={p} over={<Ring x={r.x} y={r.y} rx={34} ry={40} t={p.t} at={0.15} w={5} />}>
            <Beyond>
              <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontPress} front eyes="zombie" mouth="zombie" dim={0.75} wobble={9} />
            </Beyond>
            <HoldGate frac={1} opacity={0.8} />
          </Scene>
          <Screen>
            <Txt x={W / 2} y={200} size={150} fill="#ff4d3a" opacity={p.t > p.ev.ten ? 1 : 0}>
              {`${left}`}
            </Txt>
          </Screen>
        </AbsoluteFill>
      );
    },
  },
  {
    at: 'and tell every',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1215, y: 800, z: 3}} b={{x: 1215, y: 800, z: 3.25}} p={p} filter="brightness(0.8)">
        <HoldGate frac={1} />
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="wide" sweat />
      </Scene>
    ),
  },
  {
    at: 'One hour ago',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1380, y: 1050, z: 1.9}} b={{x: 1380, y: 1040, z: 2.05}} p={p} filter="brightness(1.1) saturate(1.15)">
        <Guard x={1360} y={1500} h={hC(1500)} look={LOOKS.dannyCrown} pose={holdKeys} propN="keys" eyes="closed" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'I had every key',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1400, y: 930, z: 2.9}} b={{x: 1405, y: 925, z: 3.15}} p={p} filter="brightness(1.1) saturate(1.15)">
        <Guard x={1360} y={1500} h={hC(1500)} look={LOOKS.dannyCrown} pose={holdKeys} propN="keys" eyes="closed" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'Let me back',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="concourse" a={{x: 1380, y: 1040, z: 2.05}} b={{x: 1380, y: 1050, z: 1.7}} p={p} filter="grayscale(0.7) contrast(1.2) brightness(0.9)" shakeXY={[Math.sin(p.frame * 2.1) * 8, 0]}>
          <Guard x={1360} y={1500} h={hC(1500)} look={LOOKS.dannyCrown} pose={holdKeys} propN="keys" eyes="closed" mouth="smile" />
        </Scene>
        <RewindFx t={p.t} frame={p.frame} />
      </AbsoluteFill>
    ),
  },
  {at: '>+back up', draw: (p) => <SeriesTitle t={p.t} />},

  // ---------- Chapter 1: The King of the Mall ----------
  {
    at: "My name's Danny",
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1300, y: 1120, z: 1.7}} b={{x: 1310, y: 1110, z: 1.8}} p={p} screen={<NameTag name="DANNY RUIZ" sub="NIGHT SECURITY · MAPLECREST MALL" t={p.t} at={0.4} />}>
        <Guard x={1420} y={1500} h={hC(1500)} pose={POSES.standRelax} mouth="smile" />
      </Scene>
    ),
  },
  {
    at: "Yes I've heard",
    draw: (p) => (
      <Scene
        bg="concourse"
        a={{x: 1490, y: 905, z: 2.5}}
        b={{x: 1505, y: 895, z: 2.62}}
        p={p}
        screen={
          <>
            <Shout x={1430} y={190} text="MALL COP!" t={p.t} at={0.2} />
            <Shout x={1640} y={360} text="HA HA" t={p.t} at={0.6} rotate={6} size={50} />
          </>
        }
      >
        <Stick x={1600} y={905} h={150} face={-1} pose={POSES.laugh} look={LOOKS.teenA} eyes="closed" mouth="open" />
        <Stick x={1558} y={802} h={146} face={-1} pose={POSES.point} look={LOOKS.teenB} eyes="closed" mouth="open" />
        <Guard x={1380} y={1185} h={335} pose={POSES.stand} eyes="dot" mouth="flat" look2={1} />
      </Scene>
    ),
  },
  {
    at: 'I took the night',
    draw: (p) => (
      <Scene bg="busstop" a={{x: 1700, y: 1030, z: 1.3}} b={{x: 1760, y: 1040, z: 1.38}} p={p}>
        <Guard x={1250} y={1440} h={430} look={LOOKS.dannyHome} pose={POSES.standRelax} mouth="smile" look2={1} />
      </Scene>
    ),
  },
  {
    at: 'my daughter Lily',
    draw: (p) => (
      <Scene bg="busstop" a={{x: 1760, y: 1150, z: 1.6}} b={{x: 1770, y: 1150, z: 1.72}} p={p}>
        <Guard x={1520} y={1445} h={430} look={LOOKS.dannyHome} pose={POSES.kneelOpen} eyes="closed" mouth="smile" />
        <Stick x={1880} y={1420} h={300} face={-1} look={LOOKS.lily} pose={POSES.runArms} eyes="closed" mouth="open" />
      </Scene>
    ),
  },
  {at: "She's seven", draw: (p) => <KidDrawing t={p.t} />},
  {
    at: 'Because I have these',
    ev: {keys: 'keys'},
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1350, y: 960, z: 2.15}} b={{x: 1355, y: 950, z: 2.3}} p={p} screen={<ItemTag text="42 KEYS" p={p} at={p.ev.keys - 0.6} />}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={holdKeys} propN="keys" mouth="smile" />
      </Scene>
    ),
  },
  {at: 'One for every single', draw: (p) => <MallMap mode="keys" t={p.t} dur={p.dur} />},
  {
    at: 'Every night',
    draw: (p) => (
      <Scene bg="concourse" a={FULL} b={{x: 1330, y: 880, z: 1.12}} p={p}>
        <Guard x={1150} y={1420} h={hC(1420)} pose={POSES.walkLight} propN="flashlight" beam={520} />
      </Scene>
    ),
  },
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
    at: '>rattle the same gates',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1400, y: 1060, z: 2.2}} b={{x: 1405, y: 1055, z: 2.32}} p={p}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.radio} propN="radio" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'to tell me a terrible',
    ev: {joke: 'terrible'},
    draw: (p) => (
      <Scene bg="garage" a={{x: 1350, y: 1085, z: 2.5}} b={{x: 1355, y: 1080, z: 2.62}} p={p} screen={<ItemTag text="TERRIBLE JOKE #214" p={p} at={p.ev.joke - 0.1} />}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.laugh} propN="radio" eyes="closed" mouth="open" />
      </Scene>
    ),
  },
  {
    at: 'Marcus is twenty',
    ev: {nurse: 'nurse', owes: 'owes'},
    draw: (p) => (
      <Scene
        bg="garage"
        a={{x: 1380, y: 1085, z: 2.45}}
        b={{x: 1385, y: 1080, z: 2.58}}
        p={p}
        screen={
          <>
            <Tag x={1130} y={330} text="MARCUS, 22" kind="info" t={p.t} at={0.15} size={74} />
            <Tag x={1130} y={460} text="NURSING STUDENT" kind="info" t={p.t} at={p.ev.nurse - 0.4} size={64} />
            <Tag x={1130} y={580} text="OWES ME $20" kind="info" t={p.t} at={p.ev.owes - 0.1} size={64} />
          </>
        }
      >
        <Marcus x={1250} y={1250} h={hG(1250)} pose={POSES.readBook} propN="book" mouth="flat" />
      </Scene>
    ),
  },
  {
    at: "Tonight he didn't",
    draw: (p) => (
      <Scene
        bg="office"
        a={FULL}
        b={{x: 1460, y: 780, z: 1.12}}
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
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" eyes="worried" />
      </Scene>
    ),
  },

  // ---------- Chapter 2: The Ramp ----------
  {
    at: '@marcus1',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1760, y: 990, z: 1.75}} b={{x: 1790, y: 985, z: 1.85}} p={p}>
        <Zed k={2} x={2130} y={968} h={150} face={-1} pose={POSES.zLimp} shadow={0.2} />
        <Marcus x={1450} y={1350} h={hG(1350)} pose={crouchRadio} propN="radio" eyes="wide" mouth="o" look2={1} />
      </Scene>
    ),
  },
  {
    at: "He's walking",
    draw: (p) => (
      <Scene bg="garage" a={{x: 2120, y: 900, z: 3.2}} b={{x: 2125, y: 898, z: 3.5}} p={p} filter="brightness(0.85)">
        <Zed k={2} x={2130} y={968} h={150} face={-1} pose={POSES.zLimp} shadow={0.2} />
      </Scene>
    ),
  },
  {
    at: "Marcus doesn't know",
    draw: (p) => (
      <Scene bg="office" a={{x: 2080, y: 880, z: 1.7}} b={{x: 2090, y: 870, z: 1.82}} p={p}>
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
    at: 'Then the radio',
    draw: (p) => (
      <Scene bg="office" a={{x: 2110, y: 790, z: 2.8}} b={{x: 2115, y: 785, z: 3.05}} p={p}>
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" eyes="worried" />
      </Scene>
    ),
  },
  {
    at: 'It goes completely',
    ev: {silent: 'silent'},
    draw: (p) => {
      const j = jointsOf(POSES.radio, 2150, 1545, 880, -1);
      return (
        <Scene bg="office" a={{x: j.handN[0], y: j.handN[1] + 40, z: 3.6}} b={{x: j.handN[0], y: j.handN[1] + 40, z: 3.9}} p={p} screen={<NoSignal t={p.t} at={p.ev.silent - 0.3} />}>
          <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" eyes="wide" sweat />
        </Scene>
      );
    },
  },
  {
    at: 'I run to the cameras',
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
    at: 'The man is on top',
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
    at: 'And behind them',
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
    ev: {ten: 'ten', thirty: 'thirty'},
    draw: (p) => {
      const rows = p.t < p.ev.ten - 0.05 ? ramp6 : p.t < p.ev.thirty - 0.05 ? ramp10 : rampMany;
      const label = p.t < p.ev.ten - 0.05 ? '6' : p.t < p.ev.thirty - 0.05 ? '10' : '30';
      return (
        <AbsoluteFill>
          <Scene bg="garage" a={{x: 1800, y: 950, z: 1.25}} b={{x: 1800, y: 950, z: 1.35}} p={p} filter={CCTV_FILTER}>
            <Attack />
            <Crowd rows={rows} />
          </Scene>
          <CctvOverlay t={p.t} frame={p.frame} cam="CAM 08 · RAMP" clock="01:41:16" />
          <Screen>
            <Txt x={W / 2} y={260} size={190} fill="#ff4d3a">
              {label}
            </Txt>
          </Screen>
        </AbsoluteFill>
      );
    },
  },
  {
    at: "They're not running",
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={{x: 1700, y: 1000, z: 1.1}} b={{x: 1700, y: 1000, z: 1.2}} p={p} filter={CCTV_FILTER}>
          <Attack />
          <Crowd rows={rampMany} />
          <Crowd rows={rampMany.map(([x, y, h]) => [x - 420, y + 60, h * 1.15, -1] as [number, number, number, -1])} seed={3} />
        </Scene>
        <CctvOverlay t={p.t} frame={p.frame} cam="CAM 08 · RAMP" clock="01:41:21" />
      </AbsoluteFill>
    ),
  },
  {at: 'Every one of them is walking', draw: (p) => <MallMap mode="route" t={p.t} dur={p.dur} />},
  {
    at: 'And the food court is made',
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 2150, y: 830, z: 1.65}} b={{x: 2120, y: 840, z: 1.8}} p={p}>
        <Crowd rows={outsideGlass} dim={0.5} />
      </Scene>
    ),
  },

  // ---------- Chapter 3: Glass ----------
  {at: "Here's what nobody", draw: (p) => <Scene bg="exterior" a={FULL} b={{x: 1408, y: 830, z: 1.22}} p={p} over={<MallSign />} />},
  {
    at: "They're built to let",
    ev: {let: 'let people'},
    draw: (p) => {
      const k = (d: number) => Math.min(1, Math.max(0, (p.t - p.ev.let + 0.2 - d) / 0.3));
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
  {at: 'Glass doors', draw: (p) => <Scene bg="foodcourt" a={{x: 2010, y: 830, z: 2.5}} b={{x: 2010, y: 830, z: 2.7}} p={p} screen={<ItemTag text="GLASS DOORS" p={p} />} />},
  {at: 'Glass walls', draw: (p) => <Scene bg="pharmacy" a={{x: 1408, y: 820, z: 1.15}} b={{x: 1408, y: 820, z: 1.3}} p={p} screen={<ItemTag text="GLASS WALLS" p={p} />} />},
  {
    at: 'Glass ceilings',
    draw: (p) => <Scene bg="concourse" a={{x: 1408, y: 330, z: 2}} b={{x: 1408, y: 300, z: 2.2}} p={p} screen={<Tag x={W / 2} y={H - 120} text="GLASS CEILINGS" t={p.t} at={0.05} size={86} anchor="middle" />} />,
  },
  {
    at: '>Glass ceilings',
    draw: (p) => (
      <Scene bg="exterior" a={{x: 1408, y: 1000, z: 1.25}} b={{x: 1408, y: 990, z: 1.33}} p={p} over={<BlackFridayBanner />}>
        {lotRows.map(([x, y, , face], i) => (
          <Stick key={i} x={x} y={y} h={hLot(y)} face={face ?? 1} look={SHOPPERS[i % SHOPPERS.length]} pose={i % 3 ? POSES.run : POSES.runArms} eyes={i % 2 ? 'wide' : 'dot'} mouth={i % 2 ? 'open' : 'smile'} wobble={i + 20} />
        ))}
      </Scene>
    ),
  },
  {
    at: "Tonight it's a death",
    draw: (p) => (
      <Scene bg="exterior" a={{x: 1408, y: 990, z: 1.33}} b={{x: 1408, y: 980, z: 1.42}} p={p} filter="sepia(0.35) hue-rotate(-25deg) saturate(1.5) brightness(0.75)" over={<MallSign />}>
        <Crowd rows={lotRows.map(([x, y, , face]) => [x, y, hLot(y), face] as [number, number, number, (1 | -1)?])} seed={6} />
      </Scene>
    ),
  },
  {
    at: 'But I know something',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1360, y: 930, z: 2.7}} b={{x: 1365, y: 925, z: 2.9}} p={p}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={holdKeys} propN="keys" eyes="angry" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'Every store in this mall',
    ev: {steel: 'steel'},
    draw: (p) => (
      <Scene bg="concourse" a={{x: 330, y: 830, z: 2.3}} b={{x: 330, y: 820, z: 2.45}} p={p} screen={<Tag x={W / 2} y={190} text="STEEL SECURITY GATE" t={p.t} at={p.ev.steel - 0.1} size={84} anchor="middle" />} />
    ),
  },
  {
    at: 'Pull it down',
    ev: {lock: 'Lock it'},
    draw: (p) => {
      const locked = p.t >= p.ev.lock - 0.08;
      const pose = {...POSES.pullDown, armF: [150, 160] as [number, number], armN: [140, 155] as [number, number]};
      const j = jointsOf(pose, 1405, 1530, 560, -1);
      const pull = interpolate(p.t, [0, Math.max(0.2, p.ev.lock - 0.1)], [0, 1], {extrapolateRight: 'clamp'});
      const barY = Math.min(SF.y1, j.handN[1] + pull * 120);
      return (
        <Scene bg="sportsfront" a={{x: 1408, y: 900, z: 1.2}} b={{x: 1408, y: 920, z: 1.28}} p={p} over={locked ? <Padlock x={1405} y={1300} s={1.3} /> : undefined}>
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
    at: 'And that store becomes',
    ev: {vault: 'vault'},
    draw: (p) => (
      <Scene bg="sportsfront" a={{x: 1408, y: 960, z: 1.12}} b={{x: 1408, y: 960, z: 1.22}} p={p} over={<Padlock x={1405} y={1300} s={1.3} />} screen={<Tag x={W / 2} y={190} text="A VAULT" kind="ok" t={p.t} at={p.ev.vault - 0.1} size={96} anchor="middle" />}>
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
      </Scene>
    ),
  },
  {at: "I can't save", draw: (p) => <MallMap mode="all" t={p.t} dur={p.dur} />},
  {at: 'but I can pick', draw: (p) => <MallMap mode="pick" t={p.t} dur={p.dur} />},
  {
    at: 'And I have about four',
    ev: {four: 'four minutes', give: 'gives out'},
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="foodcourt" a={{x: 2030, y: 840, z: 2.2}} b={{x: 2030, y: 840, z: 2.35}} p={p} over={<Cracks x={2010} y={800} r={230} k={Math.min(1, Math.max(0.15, (p.t - p.ev.give + 0.6) / 0.8))} />}>
          <Crowd rows={outsideGlass.slice(0, 4).map(([x, y, h]) => [x, y + 15, h * 1.08, -1] as [number, number, number, -1])} dim={0.5} front seed={2} />
        </Scene>
        <Screen>
          <BigTimer text="4:00" t={p.t} at={p.ev.four - 0.1} />
        </Screen>
      </AbsoluteFill>
    ),
  },

  // ---------- Chapter 4: Four Minutes ----------
  {
    at: 'So I run',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1250, y: 1060, z: 1.45}} b={{x: 1300, y: 1060, z: 1.5}} p={p} screen={<SpeedLines t={p.t} />}>
        <Guard x={1150} y={1450} h={hC(1450)} pose={POSES.runLight} propN="flashlight" beam={420} eyes="angry" mouth="grit" />
      </Scene>
    ),
  },
  {at: 'The same loop', draw: (p) => <MallMap mode="thousand" t={p.t} dur={p.dur} />},
  {
    at: 'Except tonight',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1300, y: 1120, z: 1.7}} b={{x: 1320, y: 1110, z: 1.78}} p={p} screen={<ShoppingList t={p.t} />}>
        <Guard x={1100} y={1500} h={hC(1500)} pose={POSES.flashlight} propN="flashlight" beam={420} eyes="angry" mouth="grit" />
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
    at: 'but the whole front',
    ev: {glass: 'glass', crack: 'crack'},
    draw: (p) => (
      <Scene
        bg="pharmacy"
        a={{x: 1000, y: 900, z: 1.7}}
        b={{x: 980, y: 900, z: 1.85}}
        p={p}
        over={p.t >= p.ev.crack - 0.1 ? <Cracks x={880} y={820} r={300} k={Math.min(1, (p.t - p.ev.crack + 0.1) / 0.25)} /> : undefined}
        screen={<Tag x={150} y={200} text="GLASS FRONT" kind="no" t={p.t} at={p.ev.glass - 0.1} size={84} />}
      />
    ),
  },
  {
    at: 'The food court has',
    ev: {food: 'freezer'},
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 1300, y: 850, z: 1}} b={{x: 1300, y: 860, z: 1.1}} p={p} screen={<Tag x={150} y={200} text="FREEZER FULL OF FOOD" kind="ok" t={p.t} at={p.ev.food - 0.1} size={80} />}>
        <Guard x={900} y={1450} h={hF(1450)} pose={POSES.runLight} propN="flashlight" beam={380} eyes="angry" />
      </Scene>
    ),
  },
  {
    at: "That's exactly why",
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 2150, y: 830, z: 1.7}} b={{x: 2130, y: 840, z: 1.85}} p={p} screen={<Tag x={150} y={200} text="THEIR WAY IN" kind="no" t={p.t} at={0.1} size={84} />}>
        <Crowd rows={outsideGlass.map(([x, y, h]) => [x, y + 15, h * 1.08, -1] as [number, number, number, -1])} dim={0.55} front seed={1} />
      </Scene>
    ),
  },
  {
    at: 'The department store has',
    ev: {beds: 'beds', floor: 'second', doors: 'nine different'},
    draw: (p) => (
      <Scene
        bg="deptstore"
        a={{x: 1408, y: 792, z: 1}}
        b={{x: 1408, y: 800, z: 1.08}}
        p={p}
        screen={
          <>
            <Tag x={150} y={200} text="BEDS" kind="ok" t={p.t} at={p.ev.beds - 0.1} size={84} />
            <Tag x={700} y={200} text="2ND FLOOR" kind="ok" t={p.t} at={p.ev.floor - 0.1} size={84} />
            <Tag x={1400} y={200} text="9 DOORS" kind="no" t={p.t} at={p.ev.doors - 0.1} size={84} />
          </>
        }
      >
        <Guard x={1700} y={1480} h={520} face={-1} pose={POSES.flashlight} propN="flashlight" beam={360} />
      </Scene>
    ),
  },
  {
    at: "I can't guard nine",
    draw: (p) => (
      <Scene
        bg="deptstore"
        a={FULL}
        b={{x: 1408, y: 800, z: 1.05}}
        p={p}
        over={
          <>
            <Ring x={515} y={955} rx={115} ry={130} t={p.t} at={0.05} />
            <Ring x={965} y={955} rx={170} ry={125} t={p.t} at={0.15} />
            <Ring x={1950} y={950} rx={170} ry={120} t={p.t} at={0.25} />
            <Ring x={2415} y={950} rx={110} ry={110} t={p.t} at={0.35} />
            <Ring x={185} y={880} rx={150} ry={170} t={p.t} at={0.45} />
            <Ring x={2650} y={880} rx={150} ry={180} t={p.t} at={0.55} />
          </>
        }
      />
    ),
  },
  {
    at: 'I can barely',
    draw: (p) => (
      <Scene bg="deptstore" a={{x: 1400, y: 1140, z: 1.85}} b={{x: 1400, y: 1135, z: 1.95}} p={p}>
        <Guard x={1400} y={1480} h={520} pose={POSES.frontShrug} front eyes="closed" mouth="flat" />
      </Scene>
    ),
  },
  {
    at: "And then there's the sporting",
    ev: {tents: 'Tents'},
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
    at: 'and only one way',
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
    ev: {crack: 'food court doors', shatter: 'explode'},
    draw: (p) => {
      const broke = p.t >= p.ev.shatter - 0.04;
      const ck = interpolate(p.t, [p.ev.crack, p.ev.shatter], [0.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
            over={broke ? <Shards x={2010} y={830} t={p.t - p.ev.shatter} n={46} /> : <Cracks x={2010} y={800} r={230} k={ck} />}
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
    at: 'Yank it down',
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
    at: 'Lock it with key',
    ev: {key: 'key number'},
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1330, y: 850, z: 2.8}} b={{x: 1330, y: 855, z: 2.95}} p={p} screen={<Tag x={W / 2} y={190} text="KEY #31" kind="key" t={p.t} at={p.ev.key - 0.1} size={92} anchor="middle" />}>
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
    at: 'with my hand over',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1215, y: 800, z: 3}} b={{x: 1215, y: 800, z: 3.2}} p={p} filter="brightness(0.8)">
        <HoldGate frac={1} />
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="wide" sweat />
      </Scene>
    ),
  },
  {
    at: 'thinking about',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="busstop" a={{x: 2150, y: 1000, z: 1.7}} b={{x: 2170, y: 1000, z: 1.85}} p={p} filter="sepia(0.65) brightness(1.05) blur(1.5px)">
          <Stick x={BUS_DOOR.x - 20} y={BUS_DOOR.y} h={280} face={-1} look={LOOKS.lily} pose={POSES.waveHi} eyes="closed" mouth="smile" />
        </Scene>
        <Vignette o={0.85} />
      </AbsoluteFill>
    ),
  },
  {
    at: 'Footsteps',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 700, z: 2}} b={{x: 1420, y: 700, z: 2.1}} p={p}>
        <Beyond>
          <Crowd rows={[[1230, 915, 300, 1], [1420, 905, 282, 1], [1610, 920, 305, -1]]} dim={0.4} />
        </Beyond>
        <HoldGate frac={1} />
      </Scene>
    ),
  },
  {
    at: 'Shuffling past',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 700, z: 2.1}} b={{x: 1420, y: 700, z: 2.2}} p={p}>
        <Beyond>
          <Crowd rows={[[1200, 925, 320, 1], [1300, 912, 295, 1], [1430, 930, 330, -1], [1540, 915, 300, 1], [1640, 928, 325, -1], [1705, 910, 290, 1]]} dim={0.45} seed={1} />
        </Beyond>
        <HoldGate frac={1} />
      </Scene>
    ),
  },
  {
    at: '>Shuffling past the gate',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 690, z: 2.5}} b={{x: 1420, y: 685, z: 2.65}} p={p}>
        <Beyond>
          <Crowd rows={[[1250, 912, 290, 1], [1610, 915, 295, -1]]} dim={0.35} seed={3} />
          <Stick {...marcusAtGate} look={LOOKS.marcusZ} pose={POSES.frontStand} front eyes="zombie" mouth="zombie" dim={0.5} wobble={9} />
        </Beyond>
        <HoldGate frac={1} />
      </Scene>
    ),
  },
  {
    at: '>stops',
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
    at: "And that's when mine",
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
        <Stick {...WOMAN} look={LOOKS.woman} pose={POSES.radio} propN="radio" eyes="worried" mouth="o" shadow={0.15} />
      </Scene>
    ),
  },
  {
    at: "I'm on the second",
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
    at: "I'm not alone",
    draw: (p) => (
      <Scene bg="deptstore" a={{x: 1190, y: 650, z: 4.1}} b={{x: 1190, y: 650, z: 4.4}} p={p}>
        <g opacity={interpolate(p.t, [0.1, 0.6], [0, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <Stick x={1085} y={688} h={108} face={1} look={LOOKS.zombieA} pose={POSES.stand} ghost shadow={0} />
          <Stick x={1270} y={686} h={112} face={-1} look={LOOKS.zombieC} pose={POSES.stand} ghost shadow={0} />
          <Stick x={1320} y={689} h={104} face={-1} look={LOOKS.zombieB} pose={POSES.stand} ghost shadow={0} />
        </g>
        <Stick {...WOMAN} look={LOOKS.woman} pose={POSES.radio} propN="radio" eyes="worried" mouth="o" shadow={0.15} />
      </Scene>
    ),
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
    at: 'Every head',
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
  {at: 'That was hour one', draw: (p) => <BigCard t={p.t} line1="HOUR 1" />},
  {at: "I'd spend the next", draw: (p) => <BigCard t={p.t} line1="HOUR 1" line2="OF 720" color2="#f0c53c" />},
  {
    at: 'And the woman on the radio',
    draw: (p) => {
      const j = jointsOf(POSES.frontStand, WOMAN.x, WOMAN.y, WOMAN.h, 1);
      const s = WOMAN.h / 300;
      return (
        <AbsoluteFill>
          <Scene bg="deptstore" a={{x: WOMAN.x, y: 652, z: 8.2}} b={{x: WOMAN.x, y: 652, z: 9.2}} p={p} filter="brightness(0.55) saturate(0.7)">
            <ellipse cx={j.head[0]} cy={j.head[1] + 6} rx={26} ry={34} fill="#d8443a" opacity={0.3} />
            <Stick {...WOMAN} look={LOOKS.woman} pose={POSES.frontStand} front eyes="dot" mouth="smile" dim={0.35} shadow={0} />
            <circle cx={j.head[0] - 12 * s} cy={j.head[1] - 4 * s} r={2.2} fill="#fff" />
            <circle cx={j.head[0] + 12 * s} cy={j.head[1] - 4 * s} r={2.2} fill="#fff" />
          </Scene>
          <Vignette o={0.9} />
        </AbsoluteFill>
      );
    },
  },
  {at: '>dangerous person in it', draw: (p) => <SeriesTitle t={p.t} sub="EPISODE 1 · COMING SOON" />},
];
