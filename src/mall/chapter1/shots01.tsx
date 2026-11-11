import React from 'react';
import {AbsoluteFill} from 'remotion';
import {KidDrawing} from '../Cards';
import type {CShot} from '../MallChapter';
import {Grille, NameTag, Padlock, RewindFx, Ring, Screen, Shout, Tag, Txt, W, Waves} from '../Overlays';
import {Beyond, crouchRadio, Crowd, Guard, hC, hG, HoldGate, holdKeys, insideGuardSit, ItemTag, Marcus, Marcus3, marcusRadio, Scene, SF, Vignette, Zed} from '../shots';
import {jointsOf, LOOKS, POSES, Stick} from '../Stick';
import {FULL} from '../World';
import {HeartPop, sosAt, threeBlinks} from '../vertical';
import {B3Door16, ChapterTitle, KeyRing16, MapCard, Pretzel, RadioCard} from './props';
import {GateScene, HALL_ROWS, LILY_WIN, OfficeScene, TopClock, TowerNight} from './scenes';

/* Chapter 1, segments 1-3: the cold open, forty-two keys, one-forty. Same words as Shorts 1-3. */

const GOLD = '#f0c53c';

// The SOS pattern spelled out under the tower (16:9), the current symbol lit.
const SosStrip16: React.FC<{step: number}> = ({step}) => {
  let x = W / 2 - 400;
  const y = 930;
  const marks: React.ReactNode[] = [];
  ['.', '.', '.', '-', '-', '-', '.', '.', '.'].forEach((sym, i) => {
    const fill = i === step ? '#fff6d2' : '#5b6274';
    if (sym === '.') {
      marks.push(<circle key={i} cx={x + 18} cy={y} r={18} fill={fill} stroke="#1d1a1a" strokeWidth={5} />);
      x += 62;
    } else {
      marks.push(<rect key={i} x={x} y={y - 16} width={86} height={32} rx={16} fill={fill} stroke="#1d1a1a" strokeWidth={5} />);
      x += 112;
    }
    if (i === 2 || i === 5) x += 34;
  });
  return (
    <g>
      <rect x={W / 2 - 440} y={y - 120} width={880} height={170} rx={40} fill="#0f1218" opacity={0.82} stroke="#1d1a1a" strokeWidth={5} />
      {marks}
      <Txt x={W / 2} y={y - 44} size={56} fill={GOLD}>
        S · O · S
      </Txt>
    </g>
  );
};

const officeRadio = POSES.radio;

export const SHOTS_1_3: CShot[] = [
  // ================= 1. The Gate (cold open) =================
  {
    at: '0',
    draw: (p) => (
      <GateScene p={p} a={{x: 1420, y: 668, z: 4.8}} b={{x: 1420, y: 660, z: 5.4}} gateOpacity={0.6} filter="none" beyond={<Stick {...Marcus3({dim: 1.05})} />} />
    ),
  },
  {
    at: "and it's wearing",
    draw: (p) => (
      <GateScene p={p} a={{x: 1424, y: 735, z: 5.2}} b={{x: 1424, y: 735, z: 5.6}} gateOpacity={0.6} filter="none" beyond={<Stick {...Marcus3({dim: 1.05})} />} />
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
    at: 'Behind him',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 690, z: 2.9}}
        b={{x: 1430, y: 690, z: 3.15}}
        beyond={
          <>
            <Crowd rows={HALL_ROWS.slice(0, 5).map(([x, y, h]) => [x, y, h, -1] as [number, number, number, -1])} dim={0.6} front seed={2} />
            <Stick {...Marcus3({dim: 1.05})} />
          </>
        }
      />
    ),
  },
  {
    at: 'The radio on his',
    draw: (p) => {
      const r = marcusRadio();
      return (
        <GateScene
          p={p}
          a={{x: r.x, y: r.y - 20, z: 4.4}}
          b={{x: r.x, y: r.y - 20, z: 4.8}}
          gateOpacity={0.8}
          filter="none"
          over={<Ring x={r.x} y={r.y} rx={30} ry={36} t={p.t} at={0.15} w={5} />}
          beyond={<Stick {...Marcus3({dim: 0.8})} />}
        />
      );
    },
  },
  {
    at: "exactly where I'm",
    draw: (p) => (
      <GateScene p={p} a={{x: 1220, y: 820, z: 2.8}} b={{x: 1220, y: 820, z: 3.05}} filter="brightness(0.8)" gateOpacity={1}>
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="wide" sweat />
      </GateScene>
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
  {at: '>+back up', draw: (p) => <ChapterTitle t={p.t} />},

  // ================= 2. Forty-Two Keys =================
  {
    at: 'I have a key',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1350, y: 960, z: 2.15}} b={{x: 1355, y: 950, z: 2.3}} p={p}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={holdKeys} propN="keys" mouth="smile" />
      </Scene>
    ),
  },
  {at: 'The man who gave', ev: {last: 'last one'}, draw: (p) => <KeyRing16 t={p.t} glowAt={p.ev.last} />},
  {
    at: "I'm Danny",
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1300, y: 1120, z: 1.7}} b={{x: 1310, y: 1110, z: 1.8}} p={p} screen={<NameTag name="DANNY RUIZ" sub="NIGHT GUARD · MAPLECREST MALL" t={p.t} at={0.25} />}>
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
    ev: {clock: 'three-fifteen'},
    draw: (p) => (
      <Scene bg="busstop" a={{x: 1700, y: 1030, z: 1.3}} b={{x: 1760, y: 1040, z: 1.38}} p={p} screen={<TopClock text="3:15" ampm="PM" t={p.t} at={p.ev.clock - 0.15} />}>
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
  {
    at: 'My shift is nine',
    ev: {five: 'five'},
    draw: (p) => (
      <Scene bg="concourse" a={FULL} b={{x: 1330, y: 880, z: 1.1}} p={p} screen={<Tag x={W / 2} y={190} text="9 PM – 5 AM" t={p.t} at={p.ev.five - 0.3} size={80} anchor="middle" />}>
        <Guard x={1150} y={1420} h={hC(1420)} pose={POSES.walkLight} propN="flashlight" beam={520} />
      </Scene>
    ),
  },
  {
    at: 'and I eat the pretzels',
    draw: (p) => {
      const pose = POSES.holdUp;
      const j = jointsOf(pose, 1500, 1330, 560, 1);
      return (
        <Scene bg="foodcourt" a={{x: 1480, y: 1040, z: 2.1}} b={{x: 1490, y: 1030, z: 2.25}} p={p} over={<Pretzel x={j.handN[0] + 6} y={j.handN[1] - 30} s={1.5} />}>
          <Guard x={1500} y={1330} h={560} pose={pose} eyes="closed" mouth="smile" />
        </Scene>
      );
    },
  },
  {
    at: "She's seven",
    draw: (p) => (
      <Scene bg="busstop" a={{x: 1880, y: 1180, z: 2.6}} b={{x: 1885, y: 1175, z: 2.75}} p={p}>
        <Stick x={1880} y={1420} h={300} face={-1} look={LOOKS.lily} pose={POSES.waveHi} eyes="closed" mouth="open" />
      </Scene>
    ),
  },
  {at: 'She drew me a picture', draw: (p) => <KidDrawing t={p.t} />},
  {
    at: "It's taped to the monitor",
    draw: (p) => (
      <OfficeScene
        p={p}
        a={{x: 1430, y: 600, z: 2.6}}
        b={{x: 1430, y: 600, z: 2.8}}
        danny={false}
        over={
          <g transform="translate(1426, 596) rotate(-4)">
            <rect x={-120} y={-80} width={240} height={160} fill="#fbf6e9" stroke="#d9cfb4" strokeWidth={3} />
            <rect x={-40} y={-96} width={80} height={26} fill="#e8dcb0" opacity={0.9} />
            <circle cx={-40} cy={10} r={26} fill="#fffaf0" stroke="#3a3a3a" strokeWidth={4} />
            <path d="M -62 -10 L -64 -46 L -50 -28 L -40 -52 L -30 -28 L -16 -46 L -18 -10 Z" fill="#f6d34a" stroke="#e8a21a" strokeWidth={3} />
            <text x={40} y={-20} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={22} fill="#d8443a">
              MY DAD
            </text>
            <text x={40} y={10} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={22} fill="#2f6fd0">
              IS THE KING
            </text>
            <text x={40} y={40} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={22} fill="#3fa35b">
              OF THE MALL
            </text>
          </g>
        }
      />
    ),
  },
  {
    at: 'We live with my mom',
    draw: (p) => (
      <TowerNight p={p} a={{x: 1000, y: 600, z: 1.5}} b={{x: 1000, y: 520, z: 2.2}}>
        <Ring x={LILY_WIN.x} y={LILY_WIN.y} rx={34} ry={34} t={p.t} at={1.2} w={6} />
      </TowerNight>
    ),
  },
  {
    at: 'Every night at nine',
    ev: {three: 'three times'},
    draw: (p) => (
      <TowerNight p={p} a={{x: 1000, y: 420, z: 2.6}} b={{x: 1000, y: 400, z: 2.9}} win={threeBlinks(p.t, p.ev.three)} screen={<TopClock text="9:00" ampm="PM" t={p.t} />} />
    ),
  },
  {
    at: 'It means I love you',
    draw: (p) => (
      <TowerNight p={p} a={{x: 1000, y: 330, z: 3.6}} b={{x: 1000, y: 320, z: 3.9}} win={1}>
        <HeartPop x={LILY_WIN.x + 60} y={LILY_WIN.y - 40} t={p.t} at={0.2} s={1.4} />
      </TowerNight>
    ),
  },
  {
    at: 'I blink my flashlight back',
    draw: (p) => {
      const on = threeBlinks(p.t, 0.5) > 0.5;
      return (
        <Scene bg="exterior" a={{x: 1400, y: 1000, z: 1.7}} b={{x: 1410, y: 990, z: 1.8}} p={p} filter="brightness(0.9)">
          <Guard x={1300} y={1330} h={520} pose={POSES.pointUp} propN="flashlight" beam={on ? 700 : 0} eyes="closed" mouth="smile" />
        </Scene>
      );
    },
  },
  {
    at: 'I taught her',
    ev: {sos: 'S-O-S'},
    draw: (p) => {
      const s = sosAt(p.t, Math.max(0, p.ev.sos - 0.2));
      return <TowerNight p={p} a={{x: 1000, y: 380, z: 2.8}} b={{x: 1000, y: 370, z: 3.1}} win={s.on} screen={<SosStrip16 step={s.step} />} />;
    },
  },
  {
    at: 'I really hope',
    draw: (p) => (
      <Scene bg="exterior" a={{x: 1400, y: 900, z: 1.5}} b={{x: 1400, y: 880, z: 1.6}} p={p} filter="brightness(0.85)">
        <Guard x={1400} y={1330} h={520} pose={POSES.lookUp} eyes="worried" />
      </Scene>
    ),
  },
  {
    at: 'Forty-two keys',
    draw: (p) => (
      <AbsoluteFill>
        <KeyRing16 t={p.t} />
        <Screen>
          <Txt x={W / 2} y={930} size={130} fill="#f0c53c">
            42 KEYS
          </Txt>
        </Screen>
      </AbsoluteFill>
    ),
  },
  {
    at: 'Old Walt had this job',
    draw: (p) => (
      <OfficeScene p={p} a={{x: 1900, y: 1000, z: 1.6}} b={{x: 1910, y: 990, z: 1.7}} danny={{x: 2250, pose: holdKeys, propN: 'keys', look2: -1}}>
        <Stick x={1650} y={1545} h={880} face={1} look={LOOKS.walt} pose={POSES.stand} eyes="dot" mouth="flat" />
      </OfficeScene>
    ),
  },
  // Walt's finger on the last key on the ring
  {
    at: 'he tapped the last',
    draw: (p) => (
      <OfficeScene p={p} a={{x: 2010, y: 790, z: 3.0}} b={{x: 2015, y: 790, z: 3.25}} danny={{x: 2250, pose: holdKeys, propN: 'keys', look2: -1}}>
        <Stick x={1650} y={1545} h={880} face={1} look={LOOKS.walt} pose={POSES.point} eyes="dot" mouth="flat" />
      </OfficeScene>
    ),
  },
  {
    at: 'That one you never',
    draw: (p) => (
      <OfficeScene p={p} a={{x: 1700, y: 830, z: 2.6}} b={{x: 1705, y: 825, z: 2.8}} danny={{x: 2250, pose: holdKeys, propN: 'keys'}}>
        <Stick x={1650} y={1545} h={880} face={1} look={LOOKS.walt} pose={POSES.point} eyes="angry" mouth="flat" />
      </OfficeScene>
    ),
  },
  {at: 'Its tag says', draw: (p) => <KeyRing16 t={p.t} glowAt={0.2} tagBig={1} />},
  {at: 'There is no B3', ev: {no: 'no'}, draw: (p) => <MapCard t={p.t} dur={p.dur} stamp="NO B3" stampAt={p.ev.no + 0.2} />},
  {
    at: "Tonight I'd only",
    ev: {one: 'one of them'},
    draw: (p) => (
      <Scene bg="sportsfront" a={{x: 1408, y: 1150, z: 1.9}} b={{x: 1408, y: 1180, z: 2.2}} p={p} over={<Padlock x={1405} y={1300} s={1.3} />} screen={<ItemTag text="ONLY ONE" p={p} at={p.ev.one - 0.3} />}>
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
      </Scene>
    ),
  },
  {at: 'In thirty days', draw: (p) => <B3Door16 t={p.t} dur={p.dur} frame={p.frame} />},

  // ================= 3. One-Forty =================
  {
    at: 'Every night at one',
    draw: (p) => (
      <OfficeScene p={p} a={FULL} b={{x: 1460, y: 780, z: 1.1}} danny={{pose: officeRadio, propN: 'radio', mouth: 'smile'}} screen={<TopClock text="1:00" ampm="AM" t={p.t} />} />
    ),
  },
  {at: 'Tonight he whispered', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="on" />},
  {
    at: 'Marcus guards',
    ev: {nurse: 'nurse', bucks: 'twenty bucks'},
    draw: (p) => (
      <Scene
        bg="garage"
        a={{x: 1380, y: 1085, z: 2.45}}
        b={{x: 1385, y: 1080, z: 2.58}}
        p={p}
        screen={
          <>
            <Tag x={1130} y={300} text="MARCUS, 22" kind="info" t={p.t} at={0.6} size={70} />
            <Tag x={1130} y={420} text="NURSING STUDENT" kind="info" t={p.t} at={p.ev.nurse - 0.4} size={60} />
            <Tag x={1130} y={540} text="OWES ME $20" kind="info" t={p.t} at={p.ev.bucks - 0.4} size={60} />
          </>
        }
      >
        <Marcus x={1250} y={1250} h={hG(1250)} pose={POSES.readBook} propN="book" mouth="flat" />
      </Scene>
    ),
  },
  {
    at: 'He lost a bet',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1300, y: 1090, z: 2.6}} b={{x: 1305, y: 1085, z: 2.75}} p={p} screen={<ItemTag text="$20" p={p} at={0.3} />}>
        <Marcus x={1300} y={1250} h={hG(1250)} pose={POSES.shrug} eyes="closed" mouth="smile" />
      </Scene>
    ),
  },
  {at: 'At one on the dot', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="crackle" />},
  {
    at: "Why don't zombies",
    draw: (p) => (
      <Scene bg="garage" a={{x: 1400, y: 1060, z: 2.2}} b={{x: 1405, y: 1055, z: 2.32}} p={p}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.radio} propN="radio" mouth="smile" />
      </Scene>
    ),
  },
  {
    at: 'Because they taste',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1350, y: 1085, z: 2.5}} b={{x: 1355, y: 1080, z: 2.62}} p={p}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.laugh} propN="radio" eyes="closed" mouth="open" />
      </Scene>
    ),
  },
  {
    at: 'He laughs at his own',
    draw: (p) => (
      <OfficeScene p={p} a={{x: 2080, y: 880, z: 1.7}} b={{x: 2090, y: 870, z: 1.82}} danny={{pose: officeRadio, propN: 'radio', mouth: 'smile', eyes: 'closed'}} />
    ),
  },
  {
    at: 'At one-forty',
    draw: (p) => <OfficeScene p={p} a={FULL} b={{x: 1460, y: 780, z: 1.12}} danny={{pose: officeRadio, propN: 'radio'}} screen={<TopClock text="1:40" ampm="AM" t={p.t} />} />,
  },
  {
    at: "There's a guy on the ramp",
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
  {
    at: "Marcus doesn't whisper",
    draw: (p) => {
      const j = jointsOf(officeRadio, 2150, 1545, 880, -1);
      return (
        <OfficeScene
          p={p}
          a={{x: j.head[0], y: j.head[1] + 40, z: 3.2}}
          b={{x: j.head[0], y: j.head[1] + 40, z: 3.5}}
          danny={{pose: officeRadio, propN: 'radio', eyes: 'wide', sweat: true}}
          over={<Waves x={j.handN[0] - 40} y={j.handN[1] + 10} t={p.t} size={60} dir={-1} />}
        />
      );
    },
  },
  {
    at: 'Sir Sir',
    draw: (p) => (
      <Scene bg="garage" a={{x: 1850, y: 1000, z: 2.1}} b={{x: 1870, y: 995, z: 2.25}} p={p}>
        <Zed k={2} x={2030} y={1010} h={175} face={-1} pose={POSES.zLimp} shadow={0.2} />
        <Marcus x={1700} y={1150} h={hG(1150) * 1.1} pose={POSES.walkA} eyes="worried" mouth="o" />
      </Scene>
    ),
  },
  {
    at: 'Then the radio did',
    draw: (p) => <OfficeScene p={p} a={{x: 2000, y: 900, z: 1.6}} b={{x: 2010, y: 890, z: 1.75}} danny={{pose: officeRadio, propN: 'radio', eyes: 'wide'}} />,
  },
  {at: 'It went completely silent', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="nosignal" />},
];

// unused imports kept tidy
void Beyond;
void HoldGate;
