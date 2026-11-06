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
export const hC = (y: number) => 1.1 * (y - 880); // concourse
export const hG = (y: number) => 0.57 * (y - 706); // garage
export const hI = (y: number) => 2.2 * (y - 780); // inside the sporting goods store
export const hF = (y: number) => 1.1 * (y - 870); // food court

type Fig = Omit<StickProps, 'look' | 'pose'> & {look?: Look; pose?: Pose};
export const Guard: React.FC<Fig> = (p) => <Stick look={LOOKS.guard} pose={POSES.stand} eyes="dot" mouth="flat" {...p} />;
export const Marcus: React.FC<Fig> = (p) => <Stick look={LOOKS.marcus} pose={POSES.stand} eyes="dot" mouth="flat" {...p} />;
const ZLOOKS = [LOOKS.zombieA, LOOKS.zombieB, LOOKS.zombieC, LOOKS.zombieD, LOOKS.zombieE];
export const Zed: React.FC<Fig & {k?: number}> = ({k = 0, ...p}) => (
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
export const SF = {x0: 716, y0: 690, x1: 2094, y1: 1352};
export const SI = {x0: 1148, y0: 432, x1: 1712, y1: 932};
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

export const MallSign: React.FC = () => (
  <text x={1408} y={598} textAnchor="middle" fontFamily={FONT} fontSize={86} fill="#5a3b26" letterSpacing="0.06em">
    MAPLECREST
  </text>
);

export const ItemTag: React.FC<{text: string; p: P; at?: number}> = ({text, p, at = 0.05}) => <Tag x={W / 2} y={190} text={text} t={p.t} at={at} size={86} anchor="middle" />;

export const SpeedLines: React.FC<{t: number}> = ({t}) => (
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

export const ramp6: [number, number, number, (1 | -1)?][] = [
  [1990, 1010, 155],
  [2120, 965, 140],
  [2250, 920, 125],
  [2370, 880, 112],
  [2060, 1060, 168],
  [2290, 990, 140],
];
export const ramp10 = [...ramp6, [1880, 1060, 172], [2200, 1040, 158], [2430, 930, 118], [1780, 1110, 190]] as [number, number, number, (1 | -1)?][];
export const rampMany = [
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
export const Attack: React.FC = () => (
  <g>
    <Marcus x={1290} y={1160} h={hG(1160)} pose={POSES.lyingDown} eyes="closed" mouth="flat" shadow={0.3} />
    <Zed k={2} x={1150} y={1166} h={hG(1166)} face={1} pose={POSES.zCrouchEat} />
  </g>
);

export const outsideGlass: [number, number, number, (1 | -1)?][] = [
  [1960, 1012, 235, -1],
  [2075, 1000, 215, -1],
  [2240, 1022, 250, -1],
  [2400, 1004, 220, -1],
  [2560, 1030, 262, -1],
  [2700, 1015, 240, -1],
];

export const insideGuardSit = {x: 1180, y: 1110, h: hI(1110)};
export const marcusAtGate = {x: 1420, y: 936, h: 330};
export const marcusRadio = () => {
  const j = jointsOf(POSES.frontPress, marcusAtGate.x, marcusAtGate.y, marcusAtGate.h, 1);
  return {x: j.chestRadio[0], y: j.chestRadio[1]};
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
export const Vignette: React.FC<{o?: number}> = ({o = 0.75}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${o}) 100%)`}} />
);

export const crouchRadio: Pose = {lean: 25, head: 8, armF: [40, 90], armN: [30, 165], legF: [70, -30], legN: [95, -10]};
export const holdKeys: Pose = {...POSES.holdUp, armN: [120, 160]};

// Shoppers for the Black Friday shot, zombies for the same shot "tonight".
export const lotRows: [number, number, number, (1 | -1)?][] = [
  [700, 1300, 0, 1], [880, 1420, 0, 1], [1040, 1200, 0, 1], [1180, 1480, 0, 1], [1290, 1260, 0, 1],
  [1530, 1250, 0, -1], [1640, 1460, 0, -1], [1780, 1190, 0, -1], [1930, 1380, 0, -1], [2100, 1280, 0, -1],
  [2260, 1470, 0, -1], [560, 1460, 0, 1], [2420, 1330, 0, -1], [1410, 1380, 0, 1],
];
export const hLot = (y: number) => 0.55 * (y - 820);
export const SHOPPERS = [LOOKS.shopperA, LOOKS.shopperB, LOOKS.shopperC, LOOKS.shopperD, LOOKS.teenA, LOOKS.teenB];
export const BlackFridayBanner: React.FC = () => (
  <g transform="rotate(-3 1408 566)">
    <rect x={1140} y={490} width={536} height={150} rx={8} fill="#d8443a" stroke="#1d1a1a" strokeWidth={8} />
    <text x={1408} y={592} textAnchor="middle" fontFamily={FONT} fontSize={74} fill="#fff6c8" stroke="#1d1a1a" strokeWidth={10} paintOrder="stroke">
      BLACK FRIDAY
    </text>
  </g>
);

// The woman up on the department store balcony.
const WOMAN = {x: 1182, y: 692, h: 100};

/* ---------------- the shot list (v3: the first minute) ---------------- */

export const Marcus3 = (p: Partial<StickProps>) => ({...marcusAtGate, look: LOOKS.marcusZ, pose: POSES.frontPress, front: true, eyes: 'zombie' as const, mouth: 'zombie' as const, wobble: 9, ...p});

export const SHOTS: ShotDef[] = [
  // ---------- Cold open ----------
  {
    at: '0',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1420, y: 668, z: 4.8}} b={{x: 1420, y: 660, z: 5.4}} p={p}>
        <Beyond>
          <Stick {...Marcus3({dim: 1.05})} />
        </Beyond>
        <HoldGate frac={1} opacity={0.6} />
      </Scene>
    ),
  },
  {
    at: "And it's wearing",
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1424, y: 735, z: 5.2}} b={{x: 1424, y: 735, z: 5.6}} p={p}>
        <Beyond>
          <Stick {...Marcus3({dim: 1.05})} />
        </Beyond>
        <HoldGate frac={1} opacity={0.6} />
      </Scene>
    ),
  },
  {
    at: "best friend's",
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
    at: 'The radio on his',
    draw: (p) => {
      const r = marcusRadio();
      return (
        <Scene bg="sportsinside" a={{x: r.x, y: r.y - 20, z: 4.4}} b={{x: r.x, y: r.y - 20, z: 4.8}} p={p} over={<Ring x={r.x} y={r.y} rx={30} ry={36} t={p.t} at={0.15} w={5} />}>
          <Beyond>
            <Stick {...Marcus3({dim: 0.8})} />
          </Beyond>
          <HoldGate frac={1} opacity={0.8} />
        </Scene>
      );
    },
  },
  {
    at: 'tell every',
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1220, y: 820, z: 2.8}} b={{x: 1220, y: 820, z: 3.05}} p={p} filter="brightness(0.8)">
        <HoldGate frac={1} />
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="wide" sweat />
      </Scene>
    ),
  },
  {
    at: 'An hour ago',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1380, y: 1050, z: 1.9}} b={{x: 1380, y: 1040, z: 2.05}} p={p} filter="brightness(1.1) saturate(1.15)">
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
  // ---------- Chapter 1 ----------
  {
    at: "I'm Danny",
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1300, y: 1120, z: 1.7}} b={{x: 1310, y: 1110, z: 1.8}} p={p} screen={<NameTag name="DANNY RUIZ" sub="NIGHT SECURITY · MAPLECREST MALL" t={p.t} at={0.25} />}>
        <Guard x={1420} y={1500} h={hC(1500)} pose={POSES.standRelax} mouth="smile" />
      </Scene>
    ),
  },
  {
    at: "yeah I've heard",
    draw: (p) => (
      <Scene
        bg="concourse"
        a={{x: 1490, y: 905, z: 2.5}}
        b={{x: 1505, y: 895, z: 2.62}}
        p={p}
        screen={
          <>
            <Shout x={1430} y={190} text="MALL COP!" t={p.t} at={0.15} />
            <Shout x={1640} y={360} text="HA HA" t={p.t} at={0.5} rotate={6} size={50} />
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
    at: 'I work nights',
    draw: (p) => (
      <Scene bg="office" a={FULL} b={{x: 1520, y: 780, z: 1.08}} p={p}>
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.yawn} eyes="closed" mouth="o" />
      </Scene>
    ),
  },
  {
    at: '>one reason',
    draw: (p) => (
      <Scene
        bg="busstop"
        a={{x: 1700, y: 1030, z: 1.3}}
        b={{x: 1760, y: 1040, z: 1.38}}
        p={p}
        screen={
          <>
            <Clock x={W / 2} y={215} text="3:15" t={p.t} at={0.15} />
            <Txt x={W / 2 + 250} y={240} size={56} anchor="start">
              PM
            </Txt>
          </>
        }
      >
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
    at: 'because I carry',
    ev: {keys: 'keys'},
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1350, y: 960, z: 2.15}} b={{x: 1355, y: 950, z: 2.3}} p={p} screen={<ItemTag text="42 KEYS" p={p} at={p.ev.keys - 0.6} />}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={holdKeys} propN="keys" mouth="smile" />
      </Scene>
    ),
  },
  {at: 'One for every store', draw: (p) => <MallMap mode="keys" t={p.t} dur={p.dur} />},
  {
    at: "Tonight I'd only",
    ev: {one: 'one of them'},
    draw: (p) => (
      <Scene bg="sportsfront" a={{x: 1408, y: 1150, z: 1.9}} b={{x: 1408, y: 1180, z: 2.2}} p={p} over={<Padlock x={1405} y={1300} s={1.3} />} screen={<ItemTag text="ONLY ONE" p={p} at={p.ev.one - 0.3} />}>
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
      </Scene>
    ),
  },
  {
    at: "The job's pretty",
    draw: (p) => (
      <Scene bg="concourse" a={FULL} b={{x: 1330, y: 880, z: 1.1}} p={p}>
        <Guard x={1150} y={1420} h={hC(1420)} pose={POSES.walkLight} propN="flashlight" beam={520} />
      </Scene>
    ),
  },
  {at: 'Walk the loop', draw: (p) => <MallMap mode="loop" t={p.t} dur={p.dur} />},
  {
    at: 'rattle the gates',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 2280, y: 1000, z: 1.9}} b={{x: 2300, y: 990, z: 2}} p={p}>
        <Guard x={2230} y={1330} h={hC(1330)} pose={POSES.rattle} />
        <Rattle x={2380} y={930} s={1.4} t={p.t} />
      </Scene>
    ),
  },
  {
    at: '>rattle the gates',
    draw: (p) => (
      <Scene
        bg="office"
        a={FULL}
        b={{x: 1460, y: 780, z: 1.1}}
        p={p}
        screen={
          <>
            <Clock x={W / 2} y={215} text="1:00" t={p.t} at={0.1} />
            <Txt x={W / 2 + 250} y={240} size={56} anchor="start">
              AM
            </Txt>
          </>
        }
      >
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'Marcus calls',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1400, y: 1060, z: 2.2}} b={{x: 1405, y: 1055, z: 2.32}} p={p}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.radio} propN="radio" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'Marcus is twenty',
    ev: {nurse: 'nurse'},
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
          </>
        }
      >
        <Marcus x={1250} y={1250} h={hG(1250)} pose={POSES.readBook} propN="book" mouth="flat" />
      </Scene>
    ),
  },
  {
    at: 'and he tells the worst',
    ev: {worst: 'worst'},
    draw: (p) => (
      <Scene bg="garage" a={{x: 1350, y: 1085, z: 2.5}} b={{x: 1355, y: 1080, z: 2.62}} p={p} screen={<ItemTag text="WORST JOKES ON EARTH" p={p} at={p.ev.worst - 0.2} />}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.laugh} propN="radio" eyes="closed" mouth="open" />
      </Scene>
    ),
  },
  {
    at: 'Tonight he calls',
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
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'No joke',
    draw: (p) => (
      <Scene bg="office" a={{x: 2080, y: 880, z: 1.7}} b={{x: 2090, y: 870, z: 1.82}} p={p}>
        <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" eyes="worried" />
      </Scene>
    ),
  },
  {
    at: "He's whispering",
    draw: (p) => {
      const j = jointsOf(POSES.radio, 2150, 1545, 880, -1);
      return (
        <Scene bg="office" a={{x: j.handN[0], y: j.handN[1] + 30, z: 3.4}} b={{x: j.handN[0], y: j.handN[1] + 30, z: 3.7}} p={p} over={<Waves x={j.handN[0] - 40} y={j.handN[1] + 10} t={p.t} size={60} dir={-1} />}>
          <Guard x={2150} y={1545} h={880} face={-1} pose={POSES.radio} propN="radio" eyes="wide" sweat />
        </Scene>
      );
    },
  },
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
      <Scene bg="garage" a={{x: 2120, y: 905, z: 3.4}} b={{x: 2125, y: 900, z: 3.8}} p={p} filter="brightness(0.85)">
        <Zed k={2} x={2130} y={968} h={150} face={-1} pose={POSES.zLimp} shadow={0.2} />
      </Scene>
    ),
  },
  {at: '>+wrong', draw: (p) => <SeriesTitle t={p.t} sub="TO BE CONTINUED" />},
];
