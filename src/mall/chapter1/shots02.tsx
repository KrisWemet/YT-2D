import React from 'react';
import {AbsoluteFill} from 'remotion';
import {KidDrawing} from '../Cards';
import type {CShot} from '../MallChapter';
import {BigTimer, Flash, Grille, Padlock, Rattle, Screen, Shards, shake, Tag, Txt, W} from '../Overlays';
import {Attack, Crowd, Guard, hC, hG, insideGuardSit, ItemTag, Marcus, outsideGlass, ramp10, ramp6, rampMany, Scene, SF, SpeedLines, Zed} from '../shots';
import {jointsOf, LOOKS, POSES, Stick} from '../Stick';
import {FULL} from '../World';
import {KeyInHand, KeyRing16, ListCard, MapCard, NapkinPlan, NewsCard, PhoneCard, Polaroids, Raccoon, RadioCard, SleepingBag} from './props';
import {CctvScene, GateScene, HALL_ROWS, handOnBar, MarcusAtGate, marcusHurt, OfficeScene, TopClock} from './scenes';

/* Chapter 1, segments 4-7: camera six, four minutes, key thirty-one, the last joke. */

const RED = '#e0433a';
const Mark: React.FC<{kind: 'x' | 'check'; k: number}> = ({kind, k}) =>
  k <= 0 ? null : (
    <g transform={`translate(${W - 300}, 300) scale(${Math.min(1, k * 1.2)})`}>
      <circle r={130} fill={kind === 'x' ? RED : '#3fb36b'} stroke="#1d1a1a" strokeWidth={14} />
      {kind === 'x' ? (
        <path d="M -55 -55 L 55 55 M 55 -55 L -55 55" stroke="#fff" strokeWidth={30} strokeLinecap="round" />
      ) : (
        <path d="M -60 0 L -15 50 L 65 -50" stroke="#fff" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </g>
  );
const after = (t: number, at: number) => Math.min(1, Math.max(0, (t - at) / 0.18));

// crowd rows facing the other way (toward the mall)
const flip = (rows: [number, number, number, (1 | -1)?][]) => rows.map(([x, y, h]) => [x, y, h, 1] as [number, number, number, 1]);

// people crossing the lot toward the mall entrance (exterior), seen from behind
const LOT_DEAD: [number, number, number][] = [
  [1050, 1250, 210],
  [1250, 1180, 180],
  [1480, 1300, 230],
  [1700, 1210, 190],
  [1900, 1330, 240],
  [1180, 1400, 280],
  [1620, 1420, 290],
  [2080, 1260, 200],
];

// hallway walkers on the concourse (hC perspective)
const HALL_WALK: [number, number][] = [
  [1180, 1020],
  [1420, 1060],
  [1640, 1000],
  [1300, 1180],
  [1560, 1220],
];

const officeDoorX = 550;

export const SHOTS_4_7: CShot[] = [
  // ================= 4. Camera Six =================
  {
    at: 'I said his name',
    draw: (p) => <OfficeScene p={p} a={{x: 2060, y: 880, z: 1.8}} b={{x: 2070, y: 870, z: 1.95}} danny={{pose: POSES.radio, propN: 'radio', eyes: 'worried', mouth: 'o'}} />,
  },
  {
    at: 'Then I said it again',
    draw: (p) => {
      const j = jointsOf(POSES.radio, 2150, 1545, 880, -1);
      return <OfficeScene p={p} a={{x: j.head[0], y: j.head[1] + 50, z: 3.2}} b={{x: j.head[0], y: j.head[1] + 50, z: 3.5}} danny={{pose: POSES.radio, propN: 'radio', eyes: 'wide', mouth: 'o', sweat: true}} />;
    },
  },
  {at: '>said it again', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="nosignal" />},
  {
    at: 'The security office has',
    draw: (p) => <OfficeScene p={p} a={FULL} b={{x: 1430, y: 650, z: 1.35}} danny={{x: 2250, pose: POSES.stand, look2: -1}} />,
  },
  {
    at: 'In six years',
    ev: {rac: 'raccoon'},
    draw: (p) => (
      <CctvScene p={p} bg="foodcourt" a={{x: 1300, y: 1000, z: 1.6}} b={{x: 1310, y: 995, z: 1.68}} cam="CAM 9 · FOOD COURT" clock="03:12:40">
        {p.t >= p.ev.rac - 0.3 && <Raccoon x={1180} y={1030} s={1.1} />}
      </CctvScene>
    ),
  },
  {
    at: 'Twice',
    draw: (p) => (
      <CctvScene p={p} bg="foodcourt" a={{x: 1700, y: 1050, z: 1.8}} b={{x: 1705, y: 1045, z: 1.9}} cam="CAM 9 · FOOD COURT" clock="02:47:05">
        <Raccoon x={1820} y={1120} s={1.2} />
        <g transform="translate(1820, 880)">
          <rect x={-230} y={-50} width={460} height={80} rx={14} fill="#10141c" opacity={0.85} />
          <text x={0} y={10} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={52} fill="#f0c53c">
            SAME RACCOON
          </text>
        </g>
      </CctvScene>
    ),
  },
  {
    at: 'I pulled up camera six',
    draw: (p) => <CctvScene p={p} bg="garage" a={FULL} b={{x: 1408, y: 830, z: 1.08}} cam="CAM 6 · GARAGE L2" clock="01:41:22" />,
  },
  {
    at: 'Marcus was on the ground',
    draw: (p) => (
      <CctvScene p={p} bg="garage" a={{x: 1260, y: 1050, z: 1.9}} b={{x: 1270, y: 1050, z: 2.05}} cam="CAM 6 · GARAGE L2" clock="01:41:30">
        <Attack />
      </CctvScene>
    ),
  },
  {
    at: 'Behind them more',
    ev: {ten: 'Ten', thirty: 'Thirty'},
    draw: (p) => {
      const rows = p.t >= p.ev.thirty - 0.1 ? rampMany : p.t >= p.ev.ten - 0.1 ? ramp10 : ramp6;
      const label = p.t >= p.ev.thirty - 0.1 ? '30' : p.t >= p.ev.ten - 0.1 ? '10' : '6';
      return (
        <AbsoluteFill>
          <CctvScene p={p} bg="garage" a={{x: 1800, y: 990, z: 1.45}} b={{x: 1810, y: 985, z: 1.5}} cam="CAM 6 · GARAGE L2" clock="01:41:41">
            <Attack />
            <Crowd rows={rows} />
          </CctvScene>
          <Screen>
            <Txt x={300} y={300} size={170} fill={RED}>
              {label}
            </Txt>
          </Screen>
        </AbsoluteFill>
      );
    },
  },
  {
    at: "They weren't running",
    draw: (p) => (
      <Scene bg="garage" a={{x: 1900, y: 1000, z: 1.5}} b={{x: 1920, y: 995, z: 1.6}} p={p} filter="brightness(0.9)">
        <Crowd rows={rampMany} />
      </Scene>
    ),
  },
  {
    at: 'like a crowd leaving',
    draw: (p) => (
      <Scene bg="garage" a={{x: 2150, y: 960, z: 2.6}} b={{x: 2140, y: 960, z: 2.8}} p={p} filter="brightness(0.85)">
        <Crowd rows={rampMany} />
      </Scene>
    ),
  },
  {
    at: "Danny don't come down",
    draw: (p) => (
      <CctvScene p={p} bg="garage" a={{x: 1290, y: 1120, z: 3.0}} b={{x: 1290, y: 1120, z: 3.25}} cam="CAM 6 · GARAGE L2" clock="01:42:02">
        <Attack />
      </CctvScene>
    ),
  },
  {
    at: "I'd like to tell you",
    draw: (p) => (
      <OfficeScene p={p} a={{x: 700, y: 900, z: 1.7}} b={{x: 710, y: 890, z: 1.82}} danny={{x: officeDoorX, y: 1520, h: 900, pose: POSES.point, eyes: 'worried'}} />
    ),
  },
  {
    at: "I didn't",
    draw: (p) => {
      const j = jointsOf(POSES.point, officeDoorX, 1520, 900, -1);
      return <OfficeScene p={p} a={{x: j.head[0], y: j.head[1] + 60, z: 3.0}} b={{x: j.head[0], y: j.head[1] + 60, z: 3.3}} danny={{x: officeDoorX, y: 1520, h: 900, pose: POSES.point, eyes: 'wide', sweat: true}} />;
    },
  },
  {
    at: 'and I watched',
    draw: (p) => (
      <OfficeScene p={p} a={{x: 1430, y: 760, z: 1.3}} b={{x: 1430, y: 700, z: 1.5}} danny={false} screens={{0: 'zombies', 1: 'crowd', 2: 'one', 3: 'crowd', 4: 'zombies', 5: 'one', 6: 'zombies', 7: 'crowd', 8: 'zombies'}}>
        <Stick x={1420} y={1600} h={1050} face={1} look={LOOKS.guard} pose={POSES.stand} back />
      </OfficeScene>
    ),
  },
  {
    at: 'Then I picked up the phone',
    ev: {busy: 'all circuits'},
    draw: (p) => (
      <OfficeScene
        p={p}
        a={{x: 2050, y: 900, z: 1.7}}
        b={{x: 2060, y: 890, z: 1.82}}
        danny={{pose: POSES.radio, propN: 'phone', eyes: 'worried'}}
        screen={<Tag x={W / 2} y={190} text="ALL CIRCUITS ARE BUSY" t={p.t} at={p.ev.busy - 0.2} size={74} anchor="middle" kind="no" />}
      />
    ),
  },
  {at: 'and then a recording', draw: (p) => <ListCard t={p.t} lines={['ALL CIRCUITS', 'ARE BUSY']} at={[0.3, 0.55]} />},
  {at: "My mom's phone", ev: {vm: 'voicemail'}, draw: (p) => <PhoneCard t={p.t} mode="calling" vmAt={p.ev.vm} />},
  {at: 'So did the next', draw: (p) => <PhoneCard t={p.t} mode="log" />},
  {
    at: 'And then every one of them',
    draw: (p) => (
      <CctvScene p={p} bg="garage" a={{x: 1800, y: 990, z: 1.45}} b={{x: 1790, y: 985, z: 1.5}} cam="CAM 6 · GARAGE L2" clock="01:43:10">
        <Crowd rows={flip(rampMany)} />
      </CctvScene>
    ),
  },
  {
    at: 'Toward the mall',
    draw: (p) => (
      <CctvScene p={p} bg="exterior" a={{x: 1408, y: 1000, z: 1.25}} b={{x: 1408, y: 960, z: 1.35}} cam="CAM 1 · NORTH LOT" clock="01:43:24">
        {LOT_DEAD.map(([x, y, h], i) => (
          <Zed key={i} k={i} x={x} y={y} h={h} back face={i % 2 ? 1 : -1} />
        ))}
      </CctvScene>
    ),
  },
  {
    at: 'One camera after another',
    draw: (p) => {
      const n = Math.floor(p.t / 0.35);
      const screens: Record<number, 'zombies' | 'crowd' | 'one'> = {};
      [4, 0, 8, 2, 6, 1, 7, 3].slice(0, n).forEach((i, k) => (screens[i] = k % 3 === 0 ? 'crowd' : k % 3 === 1 ? 'zombies' : 'one'));
      return <OfficeScene p={p} a={{x: 1430, y: 600, z: 1.7}} b={{x: 1430, y: 600, z: 1.85}} danny={false} screens={screens} />;
    },
  },
  {
    at: 'The loading dock',
    draw: (p) => (
      <CctvScene p={p} bg="exterior" a={{x: 2300, y: 1050, z: 2.0}} b={{x: 2290, y: 1050, z: 2.1}} cam="CAM 3 · LOADING DOCK" clock="01:43:38">
        {[2150, 2320, 2480].map((x, i) => (
          <Zed key={i} k={i + 2} x={x} y={1200 + i * 25} h={260 + i * 20} face={-1} />
        ))}
      </CctvScene>
    ),
  },
  {
    at: 'The service hall',
    draw: (p) => (
      <CctvScene p={p} bg="concourse" a={{x: 1400, y: 1000, z: 1.7}} b={{x: 1400, y: 990, z: 1.8}} cam="CAM 7 · SERVICE HALL" clock="01:43:45">
        {HALL_WALK.map(([x, y], i) => (
          <Zed key={i} k={i} x={x} y={y} h={hC(y)} face={i % 2 ? 1 : -1} />
        ))}
      </CctvScene>
    ),
  },
  {
    at: 'The doors by the restrooms',
    draw: (p) => (
      <CctvScene p={p} bg="concourse" a={{x: 2100, y: 1050, z: 2.0}} b={{x: 2090, y: 1045, z: 2.1}} cam="CAM 11 · RESTROOMS" clock="01:43:51">
        {[1900, 2100, 2300].map((x, i) => (
          <Zed key={i} k={i + 1} x={x} y={1100 + i * 40} h={hC(1100 + i * 40)} face={-1} />
        ))}
      </CctvScene>
    ),
  },
  {
    at: 'The only screen',
    draw: (p) => (
      <OfficeScene p={p} a={{x: 1430, y: 600, z: 1.7}} b={{x: 1640, y: 560, z: 2.3}} danny={false} screens={{0: 'zombies', 1: 'crowd', 2: 'black', 3: 'crowd', 4: 'zombies', 5: 'one', 6: 'zombies', 7: 'crowd', 8: 'zombies'}} />
    ),
  },
  {
    at: 'It had been out',
    ev: {ticket: 'ticket'},
    draw: (p) => (
      <OfficeScene
        p={p}
        a={{x: 1780, y: 380, z: 4.2}}
        b={{x: 1780, y: 380, z: 4.5}}
        danny={false}
        screens={{2: 'black'}}
        over={
          p.t >= p.ev.ticket - 0.4 ? (
            <g transform="translate(1870, 440) rotate(6)">
              <rect x={-70} y={-60} width={140} height={120} fill="#f6e27a" stroke="#c9b14a" strokeWidth={3} />
              <text x={0} y={-12} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={22} fill="#2f4475">
                TICKET
              </text>
              <text x={0} y={18} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={22} fill="#2f4475">
                PUT IN
              </text>
              <text x={0} y={48} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={22} fill="#d8443a">
                TUESDAY
              </text>
            </g>
          ) : null
        }
      />
    ),
  },
  {at: 'They were all heading', draw: (p) => <MapCard t={p.t} dur={p.dur} arrows mode="plain" />},
  {
    at: 'And the food court is made',
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 2000, y: 900, z: 1.3}} b={{x: 2100, y: 900, z: 1.45}} p={p} filter="brightness(0.85)">
        <Crowd rows={outsideGlass} dim={0.6} />
      </Scene>
    ),
  },

  // ================= 5. Four Minutes =================
  {at: 'I did the math', draw: (p) => <AbsoluteFill style={{background: '#07080b'}}><Screen><BigTimer text="4:00" t={p.t} /></Screen></AbsoluteFill>},
  {at: 'Four minutes to pick', draw: (p) => <MapCard t={p.t} dur={p.dur} mode="pick" />},
  {
    at: 'Which one would you pick',
    draw: (p) => (
      <AbsoluteFill>
        <MapCard t={p.t + 1} dur={p.dur + 1} mode="pick" />
        <Screen>
          <Txt x={W / 2} y={620} size={300} fill="#f0c53c">
            ?
          </Txt>
        </Screen>
      </AbsoluteFill>
    ),
  },
  {at: "Here's the thing about malls", draw: (p) => <Scene bg="concourse" a={FULL} b={{x: 1408, y: 760, z: 1.12}} p={p} />},
  {
    at: 'But every store has',
    draw: (p) => (
      <Scene bg="sportsfront" a={{x: 1408, y: 1000, z: 1.4}} b={{x: 1408, y: 1000, z: 1.55}} p={p}>
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={Math.min(1, p.t / 0.8)} />
      </Scene>
    ),
  },
  {at: 'And I have every key', draw: (p) => <KeyRing16 t={p.t} />},
  {
    at: 'The pharmacy has medicine',
    ev: {glass: 'glass'},
    draw: (p) => (
      <Scene bg="pharmacy" a={{x: 1408, y: 900, z: 1.2}} b={{x: 1408, y: 900, z: 1.3}} p={p} screen={<Mark kind="x" k={after(p.t, p.ev.glass - 0.1)} />} />
    ),
  },
  {
    at: 'The food court has food',
    ev: {going: 'going'},
    draw: (p) => (
      <Scene bg="foodcourt" a={{x: 1700, y: 900, z: 1.2}} b={{x: 1750, y: 900, z: 1.3}} p={p} screen={<Mark kind="x" k={after(p.t, p.ev.going - 0.1)} />}>
        <Crowd rows={outsideGlass} dim={0.6} />
      </Scene>
    ),
  },
  {
    at: 'The department store has beds',
    ev: {ent: 'entrances'},
    draw: (p) => (
      <Scene bg="deptstore" a={{x: 1408, y: 850, z: 1.15}} b={{x: 1408, y: 850, z: 1.25}} p={p} screen={<Mark kind="x" k={after(p.t, p.ev.ent - 0.1)} />} />
    ),
  },
  {
    at: 'And Summit Outdoors has',
    ev: {way: 'one way in'},
    draw: (p) => (
      <Scene
        bg="sportsfront"
        a={{x: 1408, y: 950, z: 1.2}}
        b={{x: 1408, y: 950, z: 1.32}}
        p={p}
        over={
          <text x={1408} y={420} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={78} fill="#fff6e0" stroke="#1d1a1a" strokeWidth={8} paintOrder="stroke">
            SUMMIT OUTDOORS
          </text>
        }
        screen={<Mark kind="check" k={after(p.t, p.ev.way - 0.1)} />}
      />
    ),
  },
  {at: 'Every night guard has', draw: (p) => <NapkinPlan t={p.t} />},
  {
    at: 'I just never thought',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1400, y: 1100, z: 1.9}} b={{x: 1405, y: 1090, z: 2.0}} p={p}>
        <Guard x={1400} y={1500} h={hC(1500)} pose={POSES.shrug} eyes="worried" mouth="flat" />
      </Scene>
    ),
  },
  {
    at: "Mall cops aren't exactly",
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1300, y: 1050, z: 1.5}} b={{x: 1340, y: 1050, z: 1.6}} p={p}>
        <Guard x={1000 + p.t * 120} y={1450} h={hC(1450)} pose={p.frame % 10 < 5 ? POSES.run : POSES.runLight} eyes="wide" mouth="o" />
      </Scene>
    ),
  },
  {
    at: 'I ran',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1500, y: 1150, z: 2.3}} b={{x: 1540, y: 1150, z: 2.4}} p={p} screen={<SpeedLines t={p.t} />}>
        <Guard x={1450 + p.t * 140} y={1460} h={hC(1460)} pose={p.frame % 10 < 5 ? POSES.run : POSES.runLight} eyes="wide" mouth="grit" sweat />
      </Scene>
    ),
  },
  {
    at: 'Down the escalator',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1550, y: 860, z: 2.2}} b={{x: 1590, y: 860, z: 2.3}} p={p} screen={<SpeedLines t={p.t} />}>
        <Guard x={1350 + p.t * 90} y={1010} h={hC(1010)} pose={p.frame % 10 < 5 ? POSES.run : POSES.runLight} propN="keys" />
      </Scene>
    ),
  },
  {
    at: 'past the pretzel place',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 900, y: 1050, z: 2.0}} b={{x: 950, y: 1050, z: 2.1}} p={p} screen={<SpeedLines t={p.t} />}>
        <Guard x={700 + p.t * 160} y={1300} h={hC(1300)} pose={p.frame % 10 < 5 ? POSES.run : POSES.runLight} propN="keys" eyes="wide" />
      </Scene>
    ),
  },
  {
    at: 'I was ten feet',
    draw: (p) => (
      <Scene bg="sportsfront" a={{x: 1408, y: 1000, z: 1.5}} b={{x: 1408, y: 1010, z: 1.65}} p={p}>
        <Guard x={1100} y={1450} h={760} pose={POSES.lookBack} propN="keys" eyes="wide" mouth="o" />
      </Scene>
    ),
  },
  {
    at: 'Behind me the food court',
    ev: {boom: 'exploded'},
    draw: (p) => {
      const tb = p.t - p.ev.boom;
      return (
        <AbsoluteFill>
          <Scene bg="foodcourt" a={{x: 2100, y: 900, z: 1.6}} b={{x: 2100, y: 900, z: 1.75}} p={p} shakeXY={shake(p.t, p.ev.boom, 22)}>
            <Crowd rows={outsideGlass.map(([x, y, h, f]) => [x - (tb > 0 ? Math.min(tb, 1) * 140 : 0), y, h, f] as [number, number, number, (1 | -1)?])} />
            {tb > 0 && <Shards x={2120} y={850} t={tb} n={60} scale={1.4} />}
          </Scene>
          <Flash t={p.t} at={p.ev.boom} />
        </AbsoluteFill>
      );
    },
  },

  // ================= 6. Key Thirty-One =================
  {at: 'Key thirty-one', draw: (p) => <KeyInHand t={p.t} tag="31" />},
  {
    at: 'Under the gate',
    ev: {lock: 'lock it'},
    draw: (p) => (
      <GateScene p={p} a={{x: 1430, y: 715, z: 2.1}} b={{x: 1430, y: 725, z: 2.2}} gate={Math.min(1, p.t / Math.max(0.3, p.ev.lock))} gateOpacity={1}>
        <Guard x={1380} y={1000} h={hI(1000)} pose={POSES.pullDown} eyes="wide" back />
      </GateScene>
    ),
  },
  {
    at: "I've done that",
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 1430, y: 900, z: 4.0}} b={{x: 1430, y: 900, z: 4.3}} p={p} filter="brightness(0.85)" over={<Padlock x={1430} y={905} s={1.0} />}>
        <Grille x0={1148} y0={432} x1={1712} y1={932} frac={1} dark={1} />
      </Scene>
    ),
  },
  {
    at: 'I have never done',
    draw: (p) => (
      <GateScene p={p} a={{x: 1300, y: 745, z: 2.5}} b={{x: 1300, y: 750, z: 2.65}} gateOpacity={1}>
        <Guard x={1300} y={1010} h={hI(1010)} pose={POSES.scared} eyes="wide" mouth="o" sweat />
      </GateScene>
    ),
  },
  {
    at: 'Then I sat down',
    draw: (p) => (
      <GateScene p={p} a={{x: 1220, y: 820, z: 2.8}} b={{x: 1220, y: 820, z: 3.05}} filter="brightness(0.75)" gateOpacity={1}>
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="wide" sweat />
      </GateScene>
    ),
  },
  {
    at: 'Through the gate',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 700, z: 2.4}}
        b={{x: 1430, y: 700, z: 2.55}}
        filter="brightness(0.7)"
        beyond={HALL_ROWS.slice(0, 5).map(([x, y, h], i) => (
          <Stick key={i} x={x + ((p.t * 90 * (i % 2 ? 1 : -1)) % 200)} y={y} h={h} look={LOOKS.zombieC} pose={i % 2 ? POSES.zShamble : POSES.zShambleB} ghost face={i % 2 ? 1 : -1} shadow={0} />
        ))}
      />
    ),
  },
  {
    at: 'Dozens of feet',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 880, z: 4.0}}
        b={{x: 1430, y: 880, z: 4.2}}
        filter="brightness(0.7)"
        beyond={[0, 1, 2, 3].map((i) => (
          <Stick key={i} x={1200 + ((p.t * 160 + i * 140) % 560)} y={935} h={300} look={LOOKS.zombieA} pose={i % 2 ? POSES.walkA : POSES.walkB} ghost face={1} shadow={0} />
        ))}
      />
    ),
  },
  {
    at: 'I did the breathing',
    draw: (p) => (
      <GateScene p={p} a={{x: 1180, y: 760, z: 3.6}} b={{x: 1180, y: 760, z: 3.9}} filter="brightness(0.75)" gateOpacity={1}>
        <Guard {...insideGuardSit} pose={POSES.sitHug} eyes="closed" />
      </GateScene>
    ),
  },
  {
    at: 'Once something leaned',
    ev: {groan: 'groaned'},
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 720, z: 2.6}}
        b={{x: 1430, y: 720, z: 2.8}}
        filter="brightness(0.75)"
        shakeXY={shake(p.t, p.ev.groan - 0.2, 12, 0.8)}
        beyond={<Zed k={3} x={1450} y={936} h={330} front pose={POSES.frontPress} dim={0.6} />}
        over={<Rattle x={1430} y={700} s={1.6} t={p.t} />}
      />
    ),
  },
  {
    at: 'Then it moved on',
    draw: (p) => (
      <GateScene p={p} a={{x: 1430, y: 720, z: 2.6}} b={{x: 1430, y: 720, z: 2.7}} filter="brightness(0.72)" beyond={<Zed k={3} x={1450 + p.t * 120} y={930} h={320} face={1} dim={0.5} />} />
    ),
  },
  {at: "Lily's drawing", draw: (p) => <AbsoluteFill style={{filter: 'brightness(0.55) saturate(0.7)'}}><KidDrawing t={p.t} /></AbsoluteFill>},
  {
    at: 'the king of the mall is hiding',
    draw: (p) => (
      <GateScene p={p} a={{x: 1560, y: 900, z: 2.4}} b={{x: 1560, y: 900, z: 2.55}} filter="brightness(0.8)" gateOpacity={1}>
        <Guard x={1330} y={1080} h={hI(1080) * 0.9} look={LOOKS.dannyCrown} pose={POSES.crouch} eyes="worried" />
      </GateScene>
    ),
  },
  {
    at: 'Twenty minutes went by',
    draw: (p) => <GateScene p={p} a={{x: 1300, y: 760, z: 1.7}} b={{x: 1300, y: 760, z: 1.8}} filter="brightness(0.6)" screen={<TopClock text="2:08" ampm="AM" t={p.t} />} />,
  },
  {
    at: 'Then thirty',
    draw: (p) => <GateScene p={p} a={{x: 1300, y: 760, z: 1.8}} b={{x: 1300, y: 760, z: 1.9}} filter="brightness(0.6)" screen={<TopClock text="2:18" ampm="AM" t={p.t} />} />,
  },
  {
    at: 'I started to think',
    draw: (p) => (
      <GateScene p={p} a={{x: 1180, y: 760, z: 3.4}} b={{x: 1180, y: 760, z: 3.6}} filter="brightness(0.8)" gateOpacity={1}>
        <Guard {...insideGuardSit} pose={{...POSES.sitHug, head: -16}} eyes="closed" mouth="smile" />
      </GateScene>
    ),
  },
  {at: "in the morning it'd be", draw: (p) => <NewsCard t={p.t} headline="MALL COP SPENDS NIGHT IN TENT" />},
  {
    at: 'And then somebody knocked',
    draw: (p) => <GateScene p={p} a={{x: 1430, y: 700, z: 2.2}} b={{x: 1430, y: 700, z: 2.4}} filter="brightness(0.55)" gateOpacity={1} />,
  },
  {
    at: 'One knock',
    ev: {two: 'Two quick', more: 'One more'},
    draw: (p) => {
      const kick = (a: number) => shake(p.t, a, 10, 0.18);
      const s = [kick(0.05), kick(p.ev.two), kick(p.ev.two + 0.22), kick(p.ev.more)].reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1]] as [number, number], [0, 0] as [number, number]);
      return <GateScene p={p} a={{x: 1430, y: 760, z: 3.4}} b={{x: 1430, y: 760, z: 3.5}} filter="brightness(0.55)" gateOpacity={1} shakeXY={s} />;
    },
  },
  {
    at: 'Our knock',
    draw: (p) => {
      const j = jointsOf(POSES.sitHug, insideGuardSit.x, insideGuardSit.y, insideGuardSit.h, 1);
      return (
        <GateScene p={p} a={{x: j.head[0], y: j.head[1] + 20, z: 5}} b={{x: j.head[0], y: j.head[1] + 20, z: 5.4}} filter="brightness(0.75)" gateOpacity={1}>
          <Guard {...insideGuardSit} pose={POSES.sitHug} eyes="wide" sweat />
        </GateScene>
      );
    },
  },
  {
    at: "Danny It's me",
    draw: (p) => <GateScene p={p} a={{x: 1430, y: 720, z: 2.6}} b={{x: 1430, y: 720, z: 2.8}} filter="brightness(0.55)" beyond={<MarcusAtGate ghost />} />,
  },
  {
    at: 'He knew which store',
    draw: (p) => (
      <GateScene p={p} a={{x: 1180, y: 760, z: 3.6}} b={{x: 1180, y: 760, z: 3.8}} filter="brightness(0.7)" gateOpacity={1}>
        <Guard {...insideGuardSit} pose={POSES.sitHug} eyes="closed" />
      </GateScene>
    ),
  },
  {
    at: 'I turned on my flashlight',
    draw: (p) => (
      <GateScene p={p} a={{x: 1400, y: 740, z: 1.8}} b={{x: 1400, y: 730, z: 1.9}} filter="brightness(0.6)" beyond={<MarcusAtGate dim={0.4} />}>
        <Guard x={1180} y={1120} h={hI(1120)} pose={POSES.flashlight} propN="flashlight" beam={p.t > 0.3 ? 380 : 0} back />
      </GateScene>
    ),
  },
  {
    at: 'His face was gray',
    ev: {sleeve: 'sleeve'},
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1420, y: 700, z: 3.6}}
        b={{x: 1420, y: 700, z: 3.9}}
        filter="brightness(1.05)"
        gateOpacity={0.7}
        beyond={
          <>
            <MarcusAtGate pose={POSES.frontStand} sleeve={p.t >= p.ev.sleeve - 0.3 ? 1 : 0} />
          </>
        }
      />
    ),
  },
  {at: 'I had the key in my hand', draw: (p) => <KeyInHand t={p.t} tag="31" shake={0.6} />},

  // ================= 7. The Last Joke =================
  {
    at: 'Come on man',
    draw: (p) => <GateScene p={p} a={{x: 1410, y: 700, z: 3.2}} b={{x: 1410, y: 700, z: 3.45}} filter="brightness(0.95)" gateOpacity={0.75} beyond={<MarcusAtGate pose={handOnBar} eyes="worried" mouth="open" sleeve={1} />} />,
  },
  {
    at: 'There was a bite',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1436, y: 760, z: 6.0}}
        b={{x: 1436, y: 762, z: 6.4}}
        filter="brightness(1.0)"
        gateOpacity={0.6}
        beyond={<MarcusAtGate pose={POSES.frontStand} sleeve={1} bite />}
      />
    ),
  },
  {
    at: 'And past him',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 640, z: 3.4}}
        b={{x: 1430, y: 630, z: 3.7}}
        filter="brightness(0.7)"
        beyond={<Crowd rows={HALL_ROWS.slice(0, 5).map(([x, y, h]) => [x, y - 20, h * 0.6, -1] as [number, number, number, -1])} dim={0.55} front seed={4} />}
      />
    ),
  },
  {
    at: 'If I opened that gate',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1400, y: 740, z: 1.8}}
        b={{x: 1400, y: 730, z: 1.9}}
        filter="brightness(0.75)"
        beyond={
          <>
            <Crowd rows={HALL_ROWS.slice(0, 5).map(([x, y, h]) => [x, y - 20, h * 0.6, -1] as [number, number, number, -1])} dim={0.5} front seed={4} />
            <MarcusAtGate />
          </>
        }
      >
        <Guard x={1250} y={1120} h={hI(1120)} pose={holdKeysLow} propN="keys" back />
      </GateScene>
    ),
  },
  {at: 'My hand was shaking', draw: (p) => <KeyRing16 t={p.t} shake={1} />},
  {
    at: 'I had to press them',
    draw: (p) => (
      <GateScene p={p} a={{x: 1180, y: 780, z: 3.2}} b={{x: 1180, y: 780, z: 3.4}} filter="brightness(0.75)" gateOpacity={1}>
        <Guard {...insideGuardSit} pose={POSES.sitHug} propN="keys" eyes="closed" mouth="grit" />
      </GateScene>
    ),
  },
  {
    at: 'Marcus watched my face',
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 640, z: 4.6}} b={{x: 1420, y: 640, z: 4.9}} gateOpacity={0.6} filter="brightness(0.95)" beyond={<MarcusAtGate eyes="dot" sleeve={1} />} />,
  },
  {
    at: 'And he got it',
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 640, z: 4.9}} b={{x: 1420, y: 640, z: 5.1}} gateOpacity={0.6} filter="brightness(0.95)" beyond={<MarcusAtGate eyes="closed" sleeve={1} />} />,
  },
  {
    at: "Hey It's okay",
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 650, z: 4.2}} b={{x: 1420, y: 650, z: 4.4}} gateOpacity={0.6} filter="brightness(0.95)" beyond={<MarcusAtGate eyes="dot" mouth="smile" sleeve={1} />} />,
  },
  {
    at: 'He sat down with his back',
    draw: (p) => <BackToBack p={p} a={{x: 1330, y: 790, z: 2.4}} b={{x: 1330, y: 795, z: 2.55}} />,
  },
  {
    at: 'And we whispered',
    draw: (p) => <BackToBack p={p} a={{x: 1300, y: 770, z: 3.5}} b={{x: 1300, y: 770, z: 3.75}} />,
  },
  {
    at: 'About stupid stuff',
    ev: {bills: 'Bills', lasagna: 'lasagna', fit: 'fitting room'},
    draw: (p) => (
      <Polaroids t={p.t} at={[Math.max(0, p.ev.bills - 0.25), p.ev.lasagna - 0.25, p.ev.fit - 0.4]}>
        {[
          <g key="tv">
            <rect width={440} height={420} fill="#3a4a6a" />
            <rect x={70} y={60} width={300} height={190} rx={12} fill="#2a6a3a" stroke="#1d1a1a" strokeWidth={8} />
            <line x1={220} y1={60} x2={220} y2={250} stroke="#eef" strokeWidth={4} />
            <circle cx={220} cy={155} r={30} fill="none" stroke="#eef" strokeWidth={4} />
            <Stick x={140} y={420} h={300} look={LOOKS.guard} pose={POSES.laugh} back />
            <Stick x={300} y={420} h={310} look={LOOKS.marcus} pose={POSES.thumbsUp} back face={-1} />
          </g>,
          <g key="lasagna">
            <rect width={440} height={420} fill="#7a5a3a" />
            <rect x={60} y={150} width={320} height={170} rx={20} fill="#c8c8d0" stroke="#1d1a1a" strokeWidth={8} />
            <rect x={80} y={160} width={280} height={120} rx={12} fill="#d8603a" />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M 84 ${185 + i * 32} Q 220 ${170 + i * 32} 356 ${185 + i * 32}`} stroke="#f6e2a0" strokeWidth={12} fill="none" />
            ))}
            <path d="M 160 120 q 10 -30 0 -60 M 220 120 q 10 -30 0 -60 M 280 120 q 10 -30 0 -60" stroke="#eee" strokeWidth={6} fill="none" opacity={0.7} />
          </g>,
          <g key="fit">
            <rect width={440} height={420} fill="#6c5a8e" />
            <rect x={110} y={40} width={220} height={380} fill="#b85a6a" stroke="#1d1a1a" strokeWidth={8} />
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1={130 + i * 44} y1={50} x2={130 + i * 44} y2={420} stroke="#8e3a4a" strokeWidth={6} />
            ))}
            <Stick x={250} y={520} h={420} look={LOOKS.marcus} pose={POSES.stand} eyes="wide" mouth="o" front />
          </g>,
        ]}
      </Polaroids>
    ),
  },
  {
    at: "I'm not gonna lie",
    draw: (p) => <BackToBack p={p} a={{x: 1280, y: 780, z: 3.8}} b={{x: 1280, y: 780, z: 4.0}} marcusHead={-18} />,
  },
  {
    at: 'So was I',
    draw: (p) => <BackToBack p={p} a={{x: 1350, y: 830, z: 3.4}} b={{x: 1350, y: 830, z: 3.6}} dannyEyes="closed" />,
  },
  {
    at: 'Which was true',
    draw: (p) => <BackToBack p={p} a={{x: 1320, y: 810, z: 2.8}} b={{x: 1320, y: 810, z: 3.0}} dannyEyes="worried" />,
  },
  {
    at: "Tell Lily the king's",
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 650, z: 4.4}} b={{x: 1420, y: 650, z: 4.7}} gateOpacity={0.6} filter="brightness(0.9)" beyond={<MarcusAtGate eyes="closed" mouth="smile" sleeve={1} />} />,
  },
  {
    at: "Then because he's Marcus",
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 660, z: 3.8}} b={{x: 1420, y: 660, z: 4.0}} gateOpacity={0.6} filter="brightness(0.9)" beyond={<MarcusAtGate eyes="dot" mouth="smile" sleeve={1} />} />,
  },
  {
    at: "What's a zombie's favorite",
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 640, z: 4.8}} b={{x: 1420, y: 640, z: 5.0}} gateOpacity={0.6} filter="brightness(0.9)" beyond={<MarcusAtGate eyes="dot" mouth="smile" sleeve={1} />} />,
  },
  {
    at: 'A human bean',
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 650, z: 4.5}} b={{x: 1420, y: 650, z: 4.6}} gateOpacity={0.6} filter="brightness(0.9)" beyond={<MarcusAtGate eyes="closed" mouth="open" sleeve={1} />} />,
  },
  {
    at: "It wasn't funny",
    draw: (p) => {
      const j = jointsOf(POSES.sitHug, insideGuardSit.x, insideGuardSit.y, insideGuardSit.h, 1);
      return (
        <GateScene p={p} a={{x: j.head[0] + 20, y: j.head[1] + 40, z: 3.4}} b={{x: j.head[0] + 20, y: j.head[1] + 40, z: 3.6}} filter="brightness(0.8)" gateOpacity={1} shakeXY={[Math.sin(p.t * 30) * 2, 0]}>
          <Guard {...insideGuardSit} pose={POSES.sitHug} eyes="closed" mouth="open" />
          <SleepingBag x={j.head[0] + 10} y={j.head[1] + 30} s={0.75} rot={-8} />
        </GateScene>
      );
    },
  },
  {
    at: 'And Danny I still owe',
    ev: {bucks: 'twenty bucks'},
    draw: (p) => (
      <GateScene p={p} a={{x: 1420, y: 700, z: 3.4}} b={{x: 1420, y: 700, z: 3.6}} gateOpacity={0.65} filter="brightness(0.85)" beyond={<MarcusAtGate pose={handOnBar} eyes="closed" mouth="smile" sleeve={1} />} screen={<ItemTag text="$20" p={p} at={p.ev.bucks - 0.3} />} />
    ),
  },
  {
    at: 'At two thirty-one',
    draw: (p) => (
      <GateScene p={p} a={{x: 1430, y: 760, z: 2.4}} b={{x: 1430, y: 760, z: 2.6}} filter="brightness(0.6)" beyond={<MarcusAtGate pose={POSES.sitHug} eyes="closed" x={1300} y={936} h={300} />} screen={<TopClock text="2:31" ampm="AM" t={p.t} />} />
    ),
  },
  {
    at: 'At two thirty-nine',
    ev: {up: 'stood up'},
    draw: (p) => {
      const up = p.t >= p.ev.up - 0.05;
      return (
        <AbsoluteFill>
          <GateScene
            p={p}
            a={{x: 1430, y: 720, z: 2.8}}
            b={{x: 1430, y: 690, z: 3.4}}
            filter="brightness(0.7)"
            beyond={up ? <MarcusAtGate dead /> : <MarcusAtGate pose={POSES.sitHug} eyes="closed" x={1300} y={936} h={300} />}
            screen={<TopClock text="2:39" ampm="AM" t={p.t} />}
          />
          <Flash t={p.t} at={p.ev.up} color="#9fe3a0" />
        </AbsoluteFill>
      );
    },
  },
];

// where the two of them sit, back to back through the gate
const B2B = {danny: 1352, marcus: 1268};

// Danny holding the keys out low toward the lock
const holdKeysLow = {...POSES.holdUp, armN: [70, 110] as [number, number]};

// The two of them sitting back to back with the gate between them.
const BackToBack: React.FC<{p: Parameters<CShot['draw']>[0]; a: {x: number; y: number; z: number}; b?: {x: number; y: number; z: number}; marcusHead?: number; dannyEyes?: 'closed' | 'worried' | 'dot'}> = ({
  p,
  a,
  b,
  marcusHead = 8,
  dannyEyes = 'dot',
}) => (
  <GateScene
    p={p}
    a={a}
    b={b}
    filter="brightness(0.8)"
    gateOpacity={1}
    beyond={<Stick x={B2B.marcus} y={934} h={300} look={marcusHurt} pose={{...POSES.sitHug, head: marcusHead}} back face={-1} shadow={0} />}
  >
    <Stick x={B2B.danny} y={952} h={hI(952)} look={LOOKS.guard} pose={POSES.sitHug} front eyes={dannyEyes} mouth="flat" shadow={0.3} />
  </GateScene>
);

// the store's inside perspective (copied from shots.tsx so this file stands alone)
function hI(y: number) {
  return 2.2 * (y - 780);
}
void hG;
void Marcus;
