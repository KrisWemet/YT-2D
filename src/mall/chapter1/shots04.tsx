import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {CShot} from '../MallChapter';
import {Ring, Screen, Tag, Txt, W} from '../Overlays';
import {Crowd, Guard, insideGuardSit, rampMany, Scene, Zed} from '../shots';
import {jointsOf, Look, LOOKS, POSES, Stick} from '../Stick';
import {AlertCard, ChapterEnd, CrankRadio, Helicopter, HelpSheet, InsulinPen, ListCard, PhoneCard, RadioCard, TwoClocks} from './props';
import {CctvScene, GateScene, LILY_WIN, ROOF_WIN, RoofScene, TopClock, TowerNight} from './scenes';

/* Chapter 1, segments 12-14: thirty days, the roof, three blinks. */

const LITA: Look = {skin: '#f0c9a4', shirt: '#8a6a9a', sleeves: 'long', pants: '#3a3f4f', hair: 'bun', hairColor: '#d6d6d6'};
const DAY = 'brightness(1.3) saturate(0.8)';
const hI = (y: number) => 2.2 * (y - 780);
// the dead on the highway below the roof (picture px; height by distance)
const hRoad = (y: number) => 0.26 * (y - 640);
const ROAD_DEAD: [number, number][] = [
  [260, 1040], [520, 990], [700, 1060], [940, 1010], [1160, 1050], [1420, 980], [1560, 1040], [1820, 1000], [2040, 1060], [2300, 990],
  [2560, 1030], [380, 900], [640, 880], [880, 920], [1180, 870], [1500, 900], [1760, 880], [2060, 910], [2380, 880], [1000, 800],
  [1320, 790], [1640, 810], [2200, 820], [760, 820],
];
const RoadDead: React.FC<{n?: number; t: number}> = ({n = ROAD_DEAD.length, t}) => (
  <g>
    {ROAD_DEAD.slice(0, n).map(([x, y], i) => (
      <Zed key={i} k={i} x={x + Math.sin(t * 0.5 + i) * 8 + (i % 2 ? 1 : -1) * t * 6} y={y} h={hRoad(y)} face={i % 2 ? 1 : -1} shadow={0.15} />
    ))}
  </g>
);
// Danny climbing out of the roof hatch: everything below the hatch rim is hidden.
const HATCH = {x: 1865, rim: 1335};
const Blink: React.FC<{t: number; ats: number[]}> = () => null;

export const SHOTS_12_14: CShot[] = [
  // ================= 12. Thirty Days =================
  {at: 'It was from my mom', draw: (p) => <PhoneCard t={p.t} mode="text" />},
  {at: 'And she typed the word', draw: (p) => <PhoneCard t={p.t + 1} mode="text" hl />},
  {
    at: 'My mom is seventy',
    draw: (p) => (
      <Scene bg="apartment" a={{x: 1300, y: 950, z: 1.5}} b={{x: 1310, y: 940, z: 1.6}} p={p}>
        <Stick x={1150} y={1380} h={600} look={LITA} pose={{...POSES.think, head: 4}} eyes="angry" mouth="flat" />
        <Stick x={1560} y={1260} h={360} face={-1} look={LOOKS.lily} pose={POSES.sitChair} eyes="dot" mouth="smile" />
      </Scene>
    ),
  },
  {at: 'I texted back', draw: (p) => <PhoneCard t={p.t} mode="reply" />},
  {
    at: 'It said delivered',
    ev: {zero: 'zero'},
    draw: (p) => <PhoneCard t={p.t + 3} mode="reply" okAt={3.1} barsAt={3 + p.ev.zero - 0.1} />,
  },
  {
    at: "There's a camping radio",
    draw: (p) => {
      const j = jointsOf(POSES.sitChair, 1180, 1110, hI(1110), 1);
      return (
        <GateScene p={p} a={{x: 1250, y: 820, z: 2.9}} b={{x: 1255, y: 815, z: 3.1}} filter={DAY} gateOpacity={1} over={<CrankRadio x={j.handN[0] + 60} y={j.handN[1] - 10} s={1.1} t={p.t} />}>
          <Guard {...insideGuardSit} pose={POSES.sitChair} eyes="dot" mouth="flat" />
        </GateScene>
      );
    },
  },
  {at: 'This is an emergency broadcast', ev: {rescue: 'Rescue teams'}, draw: (p) => <AlertCard t={p.t} line2At={p.ev.rescue - 0.2} />},
  {
    at: 'It played the same',
    draw: (p) => (
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #3a2a1a 0%, #0b0a08 75%)'}}>
        <Screen>
          <CrankRadio x={W / 2} y={600} s={3.2} t={p.t * 0.2} />
        </Screen>
      </AbsoluteFill>
    ),
  },
  {at: 'Thirty days Okay', draw: (p) => <ListCard t={p.t} lines={['DAY 1', 'OF 30']} at={[0.1, 0.35]} />},
  {
    at: "I've done diets",
    draw: (p) => (
      <GateScene p={p} a={{x: 1220, y: 820, z: 3.0}} b={{x: 1225, y: 815, z: 3.2}} filter={DAY} gateOpacity={1}>
        <Guard {...insideGuardSit} pose={{...POSES.sitChair, armN: [60, -40], armF: [-60, 40]}} eyes="closed" mouth="smile" />
      </GateScene>
    ),
  },
  {at: 'So I counted', draw: (p) => <Scene bg="sportsinside" a={{x: 2300, y: 900, z: 1.9}} b={{x: 2280, y: 900, z: 2.05}} p={p} filter={DAY} />},
  {
    at: 'Seventy-two bottles',
    ev: {a: 'Seventy-two', b: 'Forty protein', c: 'freeze-dried', d: 'camp stove', e: 'water filters', f: 'baseball bats'},
    draw: (p) => (
      <ListCard
        t={p.t}
        paper
        title="WHAT I HAVE"
        lines={['72 BOTTLES OF WATER', '40 PROTEIN BARS', 'FREEZE-DRIED MEALS', 'A CAMP STOVE', 'WATER FILTERS', 'WAY TOO MANY BATS']}
        at={[p.ev.a - 0.1, p.ev.b - 0.1, p.ev.c - 0.1, p.ev.d - 0.1, p.ev.e - 0.1, p.ev.f - 0.1]}
      />
    ),
  },
  {at: "If I'm careful", draw: (p) => <ListCard t={p.t} lines={['WATER:', '12 DAYS']} at={[0.1, 0.5]} />},
  {
    at: 'Then I remembered something',
    draw: (p) => {
      const j = jointsOf(POSES.sitChair, insideGuardSit.x, insideGuardSit.y, insideGuardSit.h, 1);
      return (
        <GateScene p={p} a={{x: j.head[0], y: j.head[1] + 30, z: 4.4}} b={{x: j.head[0], y: j.head[1] + 30, z: 4.8}} filter={DAY} gateOpacity={1}>
          <Guard {...insideGuardSit} pose={POSES.sitChair} eyes="wide" mouth="o" />
        </GateScene>
      );
    },
  },
  {
    at: 'My mom is diabetic',
    ev: {ten: 'ten days'},
    draw: (p) => (
      <Scene
        bg="apartment"
        a={{x: 1590, y: 1080, z: 3.0}}
        b={{x: 1590, y: 1080, z: 3.3}}
        p={p}
        over={<InsulinPen x={1420} y={1110} s={0.7} />}
        screen={<Tag x={W / 2} y={190} text="INSULIN: 10 DAYS" t={p.t} at={p.ev.ten - 0.4} size={80} anchor="middle" kind="no" />}
      />
    ),
  },
  {at: 'Rescue was thirty', draw: (p) => <TwoClocks t={p.t} />},

  // ================= 13. The Roof =================
  {at: "There's a ladder", draw: (p) => <Scene bg="stockroom" a={{x: 1408, y: 792, z: 1.05}} b={{x: 1408, y: 600, z: 1.35}} p={p} />},
  {
    at: "Six years I've worked",
    draw: (p) => {
      const rise = Math.min(1, p.t / 1.2);
      return (
        <RoofScene p={p} a={{x: 1800, y: 1150, z: 1.9}} b={{x: 1800, y: 1120, z: 2.0}}>
          <defs>
            <clipPath id="hatchclip">
              <rect x={0} y={0} width={2816} height={HATCH.rim} />
            </clipPath>
          </defs>
          <g clipPath="url(#hatchclip)">
            <Guard x={HATCH.x} y={1700 - rise * 260} h={620} pose={POSES.lookUp} eyes="wide" mouth="o" front />
          </g>
        </RoofScene>
      );
    },
  },
  {at: 'From the roof', draw: (p) => <RoofScene p={p} a={{x: 1408, y: 792, z: 1.0}} b={{x: 1408, y: 760, z: 1.08}}><RoadDead t={p.t} n={14} /></RoofScene>},
  {at: 'The sun was out', draw: (p) => <RoofScene p={p} a={{x: 1408, y: 380, z: 1.8}} b={{x: 1408, y: 360, z: 1.9}} />},
  {
    at: 'Eight lanes of cars',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1300, y: 900, z: 1.7}} b={{x: 1320, y: 900, z: 1.85}}>
        <RoadDead t={p.t} />
      </RoofScene>
    ),
  },
  {
    at: 'And the dead walking between',
    draw: (p) => (
      <RoofScene p={p} a={{x: 900, y: 980, z: 3.0}} b={{x: 930, y: 980, z: 3.2}}>
        <RoadDead t={p.t} />
      </RoofScene>
    ),
  },
  {at: 'Smoke over downtown', draw: (p) => <RoofScene p={p} a={{x: 780, y: 420, z: 2.4}} b={{x: 760, y: 400, z: 2.6}} />},
  {
    at: 'A helicopter',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1408, y: 500, z: 1.4}} b={{x: 1408, y: 500, z: 1.45}}>
        <Helicopter x={2500 - p.t * 520} y={260 + Math.sin(p.t * 2) * 8} s={1.2} t={p.t} />
      </RoofScene>
    ),
  },
  {
    at: 'I waved at it',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1300, y: 900, z: 1.6}} b={{x: 1310, y: 890, z: 1.7}}>
        <Helicopter x={700 - p.t * 300} y={250} s={0.8} t={p.t} />
        <Stick x={1300} y={1420} h={620} look={LOOKS.guard} pose={p.frame % 16 < 8 ? POSES.frontArmsOpen : POSES.frontPress} front eyes="wide" mouth="open" />
      </RoofScene>
    ),
  },
  {
    at: 'On the roof of the hotel',
    draw: (p) => (
      <RoofScene p={p} a={{x: 2440, y: 700, z: 3.0}} b={{x: 2450, y: 695, z: 3.2}}>
        <HelpSheet x={2470} y={640} s={0.55} t={p.t} />
        <Stick x={2330} y={700} h={60} look={LOOKS.shopperB} pose={POSES.waveHi} front shadow={0} />
        <Stick x={2620} y={700} h={58} look={LOOKS.shopperA} pose={POSES.wave} front shadow={0} />
      </RoofScene>
    ),
  },
  {
    at: 'Nobody came for them',
    draw: (p) => (
      <RoofScene p={p} a={{x: 2440, y: 700, z: 3.2}} b={{x: 2440, y: 700, z: 3.3}} time="dusk">
        <HelpSheet x={2470} y={640} s={0.55} t={p.t} />
        <Stick x={2330} y={700} h={60} look={LOOKS.shopperB} pose={POSES.sitHug} front shadow={0} />
      </RoofScene>
    ),
  },
  {
    at: 'And on the other side',
    ev: {win: 'Tenth floor'},
    draw: (p) => (
      <RoofScene p={p} a={{x: 1700, y: 600, z: 1.6}} b={{x: ROOF_WIN.x, y: ROOF_WIN.y + 60, z: 4.0}}>
        {p.t >= p.ev.win - 0.2 && <Ring x={ROOF_WIN.x} y={ROOF_WIN.y} rx={30} ry={30} t={p.t} at={p.ev.win - 0.2} w={5} />}
      </RoofScene>
    ),
  },
  {
    at: 'I could see my daughter',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1500, y: 900, z: 1.25}} b={{x: 1500, y: 880, z: 1.3}}>
        <Stick x={1250} y={1300} h={500} look={LOOKS.guard} pose={POSES.stand} back />
        <Ring x={ROOF_WIN.x} y={ROOF_WIN.y} rx={30} ry={30} t={p.t} at={0.1} w={5} />
      </RoofScene>
    ),
  },
  {
    at: 'It might as well',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1500, y: 700, z: 1.4}} b={{x: 1500, y: 680, z: 1.45}} time="dusk">
        <Stick x={1250} y={1300} h={500} look={LOOKS.guard} pose={POSES.stand} back />
      </RoofScene>
    ),
  },
  {
    at: "I know what you're thinking",
    draw: (p) => (
      <RoofScene p={p} a={{x: 1200, y: 1050, z: 2.4}} b={{x: 1210, y: 1040, z: 2.55}}>
        <Stick x={1200} y={1420} h={600} look={LOOKS.guard} pose={POSES.stand} eyes="worried" mouth="flat" look2={1} />
      </RoofScene>
    ),
  },
  {
    at: 'My car is in the garage',
    draw: (p) => (
      <CctvScene p={p} bg="garage" a={{x: 1700, y: 1000, z: 1.4}} b={{x: 1710, y: 995, z: 1.45}} cam="CAM 6 · GARAGE L2" clock="15:12:40">
        <Crowd rows={rampMany} />
      </CctvScene>
    ),
  },
  {
    at: 'There are eight lanes',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1600, y: 900, z: 2.2}} b={{x: 1620, y: 890, z: 2.4}}>
        <RoadDead t={p.t} />
      </RoofScene>
    ),
  },
  {
    at: 'And if I somehow',
    draw: (p) => {
      const k = Math.min(1, p.t / 3);
      return (
        <RoofScene p={p} a={{x: 1700, y: 760, z: 2.4}} b={{x: 1760, y: 740, z: 2.6}} time="dusk">
          <Stick x={1500 + k * 260} y={800} h={46} look={LOOKS.guard} pose={p.frame % 10 < 5 ? POSES.run : POSES.runLight} shadow={0} />
          {new Array(12).fill(0).map((_, i) => (
            <Zed key={i} k={i} x={1500 + k * 260 - 50 - i * 34} y={800 + (i % 3) * 8} h={42} face={1} shadow={0} />
          ))}
        </RoofScene>
      );
    },
  },
  {
    at: 'So I stayed up there',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1500, y: 900, z: 1.3}} b={{x: 1500, y: 880, z: 1.35}} time="dusk">
        <Stick x={1250} y={1250} h={480} look={LOOKS.guard} pose={POSES.sitHug} back />
      </RoofScene>
    ),
  },
  {
    at: 'I counted every window',
    draw: (p) => (
      <AbsoluteFill>
        <RoofScene p={p} a={{x: 1830, y: 470, z: 3.4}} b={{x: 1830, y: 470, z: 3.6}} time="dusk" />
        <Screen>
          <Txt x={W - 260} y={240} size={120} fill="#f0c53c">
            {String(Math.min(66, Math.floor(p.t * 22)))}
          </Txt>
        </Screen>
      </AbsoluteFill>
    ),
  },
  {
    at: 'At eight fifty-nine',
    ev: {dark: 'went dark'},
    draw: (p) => {
      const k = Math.min(1, Math.max(0, (p.t - p.ev.dark + 0.1) / 0.25));
      return <TowerNight p={p} a={{x: 1000, y: 560, z: 1.4}} b={{x: 1000, y: 540, z: 1.5}} blackout={k} screen={<TopClock text="8:59" ampm="PM" t={p.t} />} />;
    },
  },

  // ================= 14. Three Blinks =================
  {at: 'No streetlights', draw: (p) => <TowerNight p={p} a={{x: 1000, y: 560, z: 1.3}} b={{x: 1000, y: 520, z: 1.4}} blackout={1} />},
  {
    at: 'At nine I turned on',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1500, y: 900, z: 1.4}} b={{x: 1500, y: 890, z: 1.45}} time="night">
        <Stick x={1250} y={1300} h={500} look={LOOKS.guard} pose={POSES.flashlight} propN="flashlight" beam={p.t > 0.4 ? 900 : 0} back />
      </RoofScene>
    ),
  },
  {at: "Nine o'clock Nothing", draw: (p) => <TowerNight p={p} a={{x: 1000, y: 420, z: 2.4}} b={{x: 1000, y: 410, z: 2.5}} blackout={1} screen={<TopClock text="9:00" ampm="PM" t={p.t} />} />},
  {at: 'Nine-oh-one', draw: (p) => <TowerNight p={p} a={{x: 1000, y: 400, z: 2.6}} b={{x: 1000, y: 390, z: 2.7}} blackout={1} screen={<TopClock text="9:01" ampm="PM" t={p.t} />} />},
  {
    at: 'I stood there with my flashlight',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1250, y: 1050, z: 2.4}} b={{x: 1250, y: 1040, z: 2.55}} time="night">
        <Stick x={1250} y={1420} h={600} look={LOOKS.guard} pose={POSES.flashlight} propN="flashlight" eyes="worried" mouth="flat" />
      </RoofScene>
    ),
  },
  {
    at: 'Then one Two Three',
    ev: {one: 'one', two: 'Two', three: 'Three'},
    draw: (p) => {
      const on = [p.ev.one, p.ev.two, p.ev.three].some((a) => p.t >= a - 0.05 && p.t < a + 0.35) ? 1 : 0;
      return <TowerNight p={p} a={{x: 1000, y: 330, z: 3.4}} b={{x: 1000, y: 320, z: 3.6}} blackout={1} win={on} />;
    },
  },
  {at: 'Not her lamp', draw: (p) => <TowerNight p={p} a={{x: LILY_WIN.x, y: LILY_WIN.y, z: 6.0}} b={{x: LILY_WIN.x, y: LILY_WIN.y, z: 6.6}} blackout={1} win={p.t < 1.2 ? 1 : 0} />},
  {
    at: "She's alive",
    draw: (p) => (
      <RoofScene p={p} a={{x: 1250, y: 1000, z: 3.0}} b={{x: 1250, y: 990, z: 3.2}} time="night">
        <Stick x={1250} y={1420} h={600} look={LOOKS.guard} pose={POSES.flashlight} propN="flashlight" eyes="closed" mouth="smile" />
      </RoofScene>
    ),
  },
  {
    at: "She's seven years old",
    draw: (p) => (
      <Scene bg="apartment" a={{x: 2300, y: 820, z: 2.0}} b={{x: 2320, y: 810, z: 2.15}} p={p} filter="brightness(0.32) saturate(0.6) hue-rotate(190deg)">
        <Stick x={2330} y={1180} h={330} look={LOOKS.lily} pose={POSES.pointUp} propN="flashlight" beam={p.frame % 30 < 12 ? 500 : 0} back />
        <Stick x={2060} y={1240} h={560} look={LITA} pose={POSES.stand} back />
      </Scene>
    ),
  },
  {
    at: 'I blinked back',
    draw: (p) => {
      const on = [0.25, 0.8, 1.35].some((a) => p.t >= a && p.t < a + 0.32);
      return (
        <RoofScene p={p} a={{x: 1500, y: 900, z: 1.4}} b={{x: 1500, y: 890, z: 1.45}} time="night">
          <Stick x={1250} y={1300} h={500} look={LOOKS.guard} pose={POSES.pointUp} propN="flashlight" beam={on ? 900 : 0} back />
        </RoofScene>
      );
    },
  },
  {
    at: 'Then I sat down on the roof',
    draw: (p) => (
      <RoofScene p={p} a={{x: 1300, y: 1150, z: 2.2}} b={{x: 1300, y: 1140, z: 2.3}} time="night">
        <g transform={`translate(${Math.sin(p.t * 40) * 1.5}, 0)`}>
          <Stick x={1300} y={1420} h={560} look={LOOKS.guard} pose={POSES.sitHug} front eyes="closed" mouth="grit" propN="flashlight" />
        </g>
      </RoofScene>
    ),
  },
  {at: 'Then the radio in my pocket', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="crackle" />},
  {at: "That's sweet Danny", draw: (p) => <RadioCard t={p.t} frame={p.frame} state="on" />},
  {
    at: "She'd been watching",
    draw: (p) => (
      <RoofScene p={p} a={{x: 1408, y: 792, z: 1.0}} b={{x: 1408, y: 792, z: 1.04}} time="night">
        <Stick x={1300} y={1420} h={560} look={LOOKS.guard} pose={POSES.sitHug} front eyes="wide" mouth="flat" />
      </RoofScene>
    ),
  },
  {at: "Who's in the window", draw: (p) => <TowerNight p={p} a={{x: 1000, y: 380, z: 2.2}} b={{x: LILY_WIN.x, y: LILY_WIN.y, z: 4.2}} blackout={1} />},
  {at: '>+in the window', draw: (p) => <ChapterEnd t={p.t} />},
];

void Blink;
void Guard;
