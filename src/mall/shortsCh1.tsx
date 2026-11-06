import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {ShortData} from './cues';
import {Padlock, Ring, Rattle, Waves, Grille} from './Overlays';
import {
  Beyond,
  Crowd,
  crouchRadio,
  Guard,
  hC,
  hG,
  hI,
  HoldGate,
  holdKeys,
  insideGuardSit,
  Marcus,
  Marcus3,
  marcusRadio,
  SF,
  Vignette,
  Zed,
} from './shots';
import {jointsOf, LOOKS, POSES, Stick} from './Stick';
import {ShortDef} from './MallShort';
import {
  B3Door,
  EndCard,
  HeartPop,
  KeyRing,
  LILY_WIN,
  MapNoB3,
  SosStrip,
  sosAt,
  threeBlinks,
  TowerWindow,
  VClock,
  VNameTag,
  VNoSignal,
  VRewind,
  VScene,
  VShot,
  VTag,
} from './vertical';
import s1 from './shorts/s1.json';
import s2 from './shorts/s2.json';
import s3 from './shorts/s3.json';

// The first three Shorts of Chapter 1 (series outline, segments 1-3), vertical 1080x1920.

const OFFICE_DANNY = {x: 2150, y: 1545, h: 880};
const radioHand = () => jointsOf(POSES.radio, OFFICE_DANNY.x, OFFICE_DANNY.y, OFFICE_DANNY.h, -1).handN;

// the crowd behind Marcus at the gate (picture px, inside the gate opening)
const hallCrowd: [number, number, number, (1 | -1)?][] = [
  [1235, 905, 250, 1],
  [1610, 908, 255, -1],
  [1320, 880, 205, 1],
  [1530, 882, 210, -1],
  [1200, 872, 190, 1],
  [1660, 874, 192, -1],
  [1400, 866, 175, 1],
  [1470, 862, 168, -1],
];

/* ---------------- Short 1: The Gate ---------------- */

const SHORT1: VShot[] = [
  {
    at: '0',
    draw: (p) => (
      <VScene bg="sportsinside" a={{x: 1420, y: 760, z: 3.0}} b={{x: 1420, y: 740, z: 3.4}} p={p}>
        <Beyond>
          <Stick {...Marcus3({dim: 1.05})} />
        </Beyond>
        <HoldGate frac={1} opacity={0.6} />
      </VScene>
    ),
  },
  {
    at: "best friend's",
    draw: (p) => (
      <AbsoluteFill>
        <VScene bg="garage" a={{x: 1350, y: 1110, z: 2.6}} b={{x: 1352, y: 1100, z: 2.8}} p={p} filter="sepia(0.7) brightness(1.08) blur(1px)">
          <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.laugh} propN="radio" eyes="closed" mouth="open" />
        </VScene>
        <Vignette o={0.8} />
      </AbsoluteFill>
    ),
  },
  {
    at: 'Behind him',
    draw: (p) => (
      <VScene bg="sportsinside" a={{x: 1430, y: 740, z: 1.85}} b={{x: 1430, y: 720, z: 2.0}} p={p} filter="brightness(0.9)">
        <Beyond>
          <Crowd rows={hallCrowd} front dim={0.85} seed={1} />
          <Stick {...Marcus3({dim: 1.05})} />
        </Beyond>
        <HoldGate frac={1} opacity={0.65} />
      </VScene>
    ),
  },
  {
    at: 'The radio on his',
    draw: (p) => {
      const r = marcusRadio();
      return (
        <VScene bg="sportsinside" a={{x: r.x, y: r.y - 10, z: 4.4}} b={{x: r.x, y: r.y - 10, z: 4.9}} p={p} over={<Ring x={r.x} y={r.y} rx={30} ry={36} t={p.t} at={0.15} w={5} />}>
          <Beyond>
            <Stick {...Marcus3({dim: 0.8})} />
          </Beyond>
          <HoldGate frac={1} opacity={0.8} />
        </VScene>
      );
    },
  },
  {
    at: 'tell every one',
    draw: (p) => (
      <VScene bg="sportsinside" a={{x: 1180, y: 790, z: 1.9}} b={{x: 1180, y: 790, z: 2.05}} p={p} filter="brightness(0.8)">
        <HoldGate frac={1} />
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="wide" sweat />
      </VScene>
    ),
  },
  {
    at: 'An hour ago',
    draw: (p) => (
      <VScene bg="concourse" a={{x: 1360, y: 1160, z: 1.5}} b={{x: 1360, y: 1140, z: 1.6}} p={p} filter="brightness(1.1) saturate(1.15)">
        <Guard x={1360} y={1500} h={hC(1500)} look={LOOKS.dannyCrown} pose={holdKeys} propN="keys" eyes="closed" mouth="smile" />
      </VScene>
    ),
  },
  {
    at: 'Let me back',
    draw: (p) => (
      <AbsoluteFill>
        <VScene bg="concourse" a={{x: 1360, y: 1140, z: 1.6}} b={{x: 1360, y: 1160, z: 1.35}} p={p} filter="grayscale(0.7) contrast(1.2) brightness(0.9)" shakeXY={[Math.sin(p.frame * 2.1) * 8, 0]}>
          <Guard x={1360} y={1500} h={hC(1500)} look={LOOKS.dannyCrown} pose={holdKeys} propN="keys" eyes="closed" mouth="smile" />
        </VScene>
        <VRewind t={p.t} frame={p.frame} />
      </AbsoluteFill>
    ),
  },
  {at: '>+back up', draw: (p) => <EndCard t={p.t} line="FOLLOW FOR PART 2" />},
];

export const SHORT1_DEF: ShortDef = {
  data: s1 as unknown as ShortData,
  vo: 'mall/shorts/s1-vo.mp3',
  shots: SHORT1,
  tags: [
    {at: '0', text: 'NIGHT 1 · 2:45 A.M.'},
    {at: 'An hour ago', text: 'ONE HOUR EARLIER'},
  ],
  hits: [
    {file: 'breath', at: 0.15, db: -12},
    {file: 'crackle', at: 'about to tell', db: -16},
    {file: 'rewind', at: 'Let me back', db: -9, offset: 0.05},
    {file: 'slam', at: '>+back up', db: -10},
  ],
  beds: [
    {file: 'groans', from: 0, to: 'An hour ago', db: [[0, -30], [0.4, -25], [1, -26]]},
    {file: 'shuffle', from: 0, to: 'An hour ago', db: -30},
    {file: 'drone', from: 0, to: 'An hour ago', db: [[0, -34], [0.3, -26], [1, -24]]},
    {file: 'mallhum', from: 'An hour ago', to: '>+back up', db: -31},
  ],
};

/* ---------------- Short 2: Forty-Two Keys ---------------- */

const SHORT2: VShot[] = [
  {
    at: '0',
    draw: (p) => (
      <VScene bg="concourse" a={{x: 1300, y: 1150, z: 1.5}} b={{x: 1300, y: 1120, z: 1.62}} p={p}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={holdKeys} propN="keys" mouth="smile" />
      </VScene>
    ),
  },
  {at: 'The man who gave', ev: {last: 'last one'}, draw: (p) => <KeyRing t={p.t} glowAt={p.ev.last} />},
  {
    at: "I'm Danny",
    draw: (p) => (
      <VScene bg="concourse" a={{x: 1420, y: 1150, z: 1.5}} b={{x: 1420, y: 1130, z: 1.6}} p={p} screen={<VNameTag name="DANNY RUIZ" sub="NIGHT GUARD · MAPLECREST MALL" t={p.t} at={0.2} />}>
        <Guard x={1420} y={1500} h={hC(1500)} pose={POSES.standRelax} mouth="smile" />
      </VScene>
    ),
  },
  {
    at: 'I work nights',
    ev: {clock: 'three-fifteen'},
    draw: (p) => (
      <VScene bg="busstop" a={{x: 1250, y: 1188, z: 2.0}} b={{x: 1255, y: 1188, z: 2.1}} p={p} screen={<VClock text="3:15" ampm="PM" t={p.t} at={p.ev.clock - 0.2} />}>
        <Guard x={1250} y={1440} h={430} look={LOOKS.dannyHome} pose={POSES.standRelax} mouth="smile" look2={1} />
      </VScene>
    ),
  },
  {
    at: 'when my daughter',
    draw: (p) => (
      <VScene bg="busstop" a={{x: 1700, y: 1188, z: 1.45}} b={{x: 1710, y: 1188, z: 1.55}} p={p}>
        <Guard x={1520} y={1445} h={430} look={LOOKS.dannyHome} pose={POSES.kneelOpen} eyes="closed" mouth="smile" />
        <Stick x={1880} y={1420} h={300} face={-1} look={LOOKS.lily} pose={POSES.runArms} eyes="closed" mouth="open" />
      </VScene>
    ),
  },
  {
    at: 'We live with',
    ev: {floor: 'tenth floor'},
    draw: (p) => (
      <VScene bg="parkview" a={{x: 1010, y: 900, z: 1.0}} b={{x: 1000, y: 452, z: 1.75}} p={p} over={<Ring x={LILY_WIN.x} y={LILY_WIN.y} rx={26} ry={30} t={p.t} at={p.ev.floor} w={5} />}>
        <TowerWindow on={0} />
      </VScene>
    ),
  },
  {
    at: 'Every night at nine',
    ev: {blinks: 'blinks her lamp'},
    draw: (p) => (
      <VScene bg="parkview" a={{x: 1000, y: 340, z: 2.7}} b={{x: 1000, y: 320, z: 3.0}} p={p} screen={<VClock text="9:00" ampm="PM" t={p.t} at={0.15} y={410} />}>
        <TowerWindow on={threeBlinks(p.t, p.ev.blinks)} />
      </VScene>
    ),
  },
  {
    at: 'It means I love',
    ev: {love: 'love you', blink: 'blink my flashlight'},
    draw: (p) => {
      const on = threeBlinks(p.t, p.ev.blink);
      return (
        <VScene bg="parkview" a={{x: 1050, y: 700, z: 1.15}} b={{x: 1050, y: 700, z: 1.2}} p={p} over={<HeartPop x={LILY_WIN.x + 80} y={LILY_WIN.y + 10} t={p.t} at={p.ev.love} s={1.6} />}>
          <TowerWindow on={0} />
          <Stick x={1200} y={1950} h={1150} face={-1} back look={LOOKS.guard} pose={POSES.pointUp} propN="flashlight" beam={on > 0.5 ? 900 : 0} />
        </VScene>
      );
    },
  },
  {
    at: 'I taught her',
    ev: {sos: 'S-O-S'},
    draw: (p) => {
      const s = sosAt(p.t, p.ev.sos);
      return (
        <VScene bg="parkview" a={{x: 1000, y: 330, z: 2.9}} b={{x: 1000, y: 320, z: 3.1}} p={p} screen={p.t >= p.ev.sos ? <SosStrip step={s.step} y={1040} /> : undefined}>
          <TowerWindow on={s.on} />
        </VScene>
      );
    },
  },
  {
    at: 'Forty-two keys',
    draw: (p) => (
      <VScene bg="concourse" a={{x: 1360, y: 880, z: 3.0}} b={{x: 1362, y: 870, z: 3.3}} p={p}>
        <Guard x={1300} y={1500} h={hC(1500)} pose={holdKeys} propN="keys" mouth="flat" />
      </VScene>
    ),
  },
  {
    at: 'Old Walt had',
    draw: (p) => (
      <VScene bg="office" a={{x: 1950, y: 924, z: 1.2}} b={{x: 1950, y: 910, z: 1.28}} p={p} screen={<VNameTag name="WALT" sub="THE NIGHT GUARD BEFORE ME" t={p.t} at={0.25} />}>
        <Stick x={1700} y={1545} h={860} face={1} look={LOOKS.walt} pose={holdKeys} propN="keys" eyes="dot" mouth="flat" />
        <Guard x={2210} y={1545} h={880} face={-1} pose={POSES.standRelax} mouth="flat" />
      </VScene>
    ),
  },
  {at: 'he tapped the', draw: (p) => <KeyRing t={p.t} glowAt={0.2} />},
  {
    at: '"That one',
    draw: (p) => (
      <VScene bg="office" a={{x: 1700, y: 820, z: 2.5}} b={{x: 1700, y: 810, z: 2.75}} p={p} filter="brightness(0.92)">
        <Stick x={1700} y={1545} h={860} face={1} look={LOOKS.walt} pose={POSES.point} eyes="angry" mouth="flat" />
      </VScene>
    ),
  },
  {at: 'Its tag says', draw: (p) => <KeyRing t={p.t} glowAt={0} tagBig={Math.min(1, p.t / 0.6)} />},
  {at: 'There is no', ev: {no: 'no B3'}, draw: (p) => <MapNoB3 t={p.t} dur={p.dur} stampAt={p.ev.no + 0.25} />},
  {
    at: "Tonight I'd only",
    ev: {one: 'one of them'},
    draw: (p) => (
      <VScene bg="sportsfront" a={{x: 1408, y: 1200, z: 2.0}} b={{x: 1408, y: 1220, z: 2.25}} p={p} over={<Padlock x={1405} y={1300} s={1.3} />} screen={<VTag text="ONLY ONE" t={p.t} at={p.ev.one - 0.3} />}>
        <Grille x0={SF.x0} y0={SF.y0} x1={SF.x1} y1={SF.y1} frac={1} />
      </VScene>
    ),
  },
  {at: 'In thirty days', draw: (p) => <B3Door t={p.t} dur={p.dur} frame={p.frame} />},
  {at: '>+opens', draw: (p) => <EndCard t={p.t} line="FOLLOW FOR PART 3" />},
];

export const SHORT2_DEF: ShortDef = {
  data: s2 as unknown as ShortData,
  vo: 'mall/shorts/s2-vo.mp3',
  shots: SHORT2,
  tags: [{at: '0', text: 'THE NIGHT IT STARTED'}],
  hits: [
    {file: 'keys', at: 'key to every', db: -12},
    {file: 'musicbox', at: 'daughter Lily', db: -22},
    {file: 'tick', at: 'blinks her lamp', db: -18, offset: 0.12},
    {file: 'tick', at: 'blinks her lamp', db: -18, offset: 0.67},
    {file: 'tick', at: 'blinks her lamp', db: -18, offset: 1.22},
    {file: 'tick', at: 'blink my flashlight', db: -16, offset: 0.12},
    {file: 'tick', at: 'blink my flashlight', db: -16, offset: 0.67},
    {file: 'tick', at: 'blink my flashlight', db: -16, offset: 1.22},
    {file: 'keys', at: 'Forty-two keys', db: -13},
    {file: 'lock', at: 'one of them', db: -15},
    {file: 'slam', at: '>+opens', db: -10},
  ],
  beds: [
    {file: 'mallhum', from: 0, to: 'I work nights', db: -31},
    {file: 'suburb', from: 'I work nights', to: 'We live with', db: -25},
    {file: 'drone', from: 'We live with', to: 'Forty-two keys', db: -38},
    {file: 'mallhum', from: 'Forty-two keys', to: "Tonight I'd only", db: -31},
    {file: 'drone', from: "Tonight I'd only", to: '>+opens', db: [[0, -34], [1, -22]]},
  ],
};

/* ---------------- Short 3: One-Forty ---------------- */

const SHORT3: VShot[] = [
  {
    at: '0',
    draw: (p) => (
      <VScene bg="office" a={{x: 2120, y: 1020, z: 1.25}} b={{x: 2120, y: 1000, z: 1.32}} p={p} screen={<VClock text="1:00" ampm="AM" t={p.t} at={0.1} y={400} />}>
        <Guard {...OFFICE_DANNY} face={-1} pose={POSES.radio} propN="radio" mouth="smile" />
      </VScene>
    ),
  },
  {
    at: 'Tonight he whispered',
    draw: (p) => {
      const h = radioHand();
      return (
        <VScene bg="office" a={{x: h[0], y: h[1] + 30, z: 3.4}} b={{x: h[0], y: h[1] + 30, z: 3.8}} p={p} over={<Waves x={h[0] - 40} y={h[1] + 10} t={p.t} size={60} dir={-1} />}>
          <Guard {...OFFICE_DANNY} face={-1} pose={POSES.radio} propN="radio" eyes="wide" sweat />
        </VScene>
      );
    },
  },
  {
    at: 'Marcus guards',
    draw: (p) => (
      <VScene bg="garage" a={{x: 1300, y: 1060, z: 1.9}} b={{x: 1300, y: 1060, z: 2.05}} p={p}>
        <Marcus x={1250} y={1250} h={hG(1250)} pose={POSES.readBook} propN="book" mouth="flat" />
      </VScene>
    ),
  },
  {
    at: "He's twenty-two",
    ev: {age: 'twenty-two', nurse: 'nurse', owes: 'owes me'},
    draw: (p) => (
      <VScene
        bg="garage"
        a={{x: 1250, y: 1100, z: 2.9}}
        b={{x: 1252, y: 1095, z: 3.1}}
        p={p}
        screen={
          <>
            <VTag text="MARCUS, 22" kind="info" t={p.t} at={p.ev.age - 0.2} y={470} size={70} />
            <VTag text="NURSING STUDENT" kind="info" t={p.t} at={p.ev.nurse - 0.3} y={580} size={60} />
            <VTag text="OWES ME $20" kind="no" t={p.t} at={p.ev.owes - 0.1} y={690} size={60} />
          </>
        }
      >
        <Marcus x={1250} y={1250} h={hG(1250)} pose={POSES.readBook} propN="book" mouth="flat" />
      </VScene>
    ),
  },
  {
    at: 'At one on',
    ev: {click: 'radio clicks'},
    draw: (p) => {
      const h = radioHand();
      return (
        <VScene bg="office" a={{x: h[0], y: h[1] + 30, z: 3.0}} b={{x: h[0], y: h[1] + 30, z: 3.3}} p={p} over={p.t >= p.ev.click ? <Waves x={h[0] - 40} y={h[1] + 10} t={p.t} size={60} dir={-1} /> : undefined}>
          <Guard {...OFFICE_DANNY} face={-1} pose={POSES.radio} propN="radio" mouth="smile" />
        </VScene>
      );
    },
  },
  {
    at: '@marcus0',
    draw: (p) => (
      <VScene bg="garage" a={{x: 1350, y: 1110, z: 2.7}} b={{x: 1352, y: 1100, z: 2.9}} p={p}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.radio} propN="radio" mouth="smile" />
      </VScene>
    ),
  },
  {
    at: 'Because they',
    draw: (p) => (
      <VScene bg="garage" a={{x: 1350, y: 1100, z: 2.9}} b={{x: 1352, y: 1095, z: 3.1}} p={p}>
        <Marcus x={1350} y={1250} h={hG(1250)} pose={POSES.laugh} propN="radio" eyes="closed" mouth="open" />
      </VScene>
    ),
  },
  {
    at: 'He laughs',
    draw: (p) => (
      <VScene bg="office" a={{x: 2120, y: 1000, z: 1.5}} b={{x: 2120, y: 990, z: 1.6}} p={p}>
        <Guard {...OFFICE_DANNY} face={-1} pose={POSES.facepalm} propN="radio" eyes="closed" mouth="smile" />
      </VScene>
    ),
  },
  {
    at: 'At one-forty',
    draw: (p) => (
      <VScene bg="office" a={{x: 2120, y: 1020, z: 1.25}} b={{x: 2120, y: 1000, z: 1.32}} p={p} screen={<VClock text="1:40" ampm="AM" t={p.t} at={0.1} y={400} />}>
        <Guard {...OFFICE_DANNY} face={-1} pose={POSES.radio} propN="radio" mouth="flat" />
      </VScene>
    ),
  },
  {
    at: '@marcus1',
    draw: (p) => (
      <VScene bg="garage" a={{x: 1450, y: 1200, z: 2.5}} b={{x: 1455, y: 1195, z: 2.7}} p={p}>
        <Marcus x={1450} y={1350} h={hG(1350)} pose={crouchRadio} propN="radio" eyes="wide" mouth="o" look2={1} />
      </VScene>
    ),
  },
  {
    at: "He's walking",
    draw: (p) => (
      <VScene bg="garage" a={{x: 2130, y: 905, z: 4.6}} b={{x: 2132, y: 902, z: 5.1}} p={p} filter="brightness(0.85)">
        <Zed k={2} x={2130} y={968} h={150} face={-1} pose={POSES.zLimp} shadow={0.2} />
      </VScene>
    ),
  },
  {
    at: "Marcus doesn't",
    draw: (p) => (
      <VScene bg="office" a={{x: 2130, y: 780, z: 2.8}} b={{x: 2130, y: 780, z: 3.1}} p={p}>
        <Guard {...OFFICE_DANNY} face={-1} pose={POSES.radio} propN="radio" eyes="worried" />
      </VScene>
    ),
  },
  {
    at: '@marcus2',
    draw: (p) => (
      <VScene bg="garage" a={{x: 2045, y: 940, z: 3.3}} b={{x: 2050, y: 935, z: 3.6}} p={p} filter="brightness(0.9)">
        <Zed k={2} x={2140} y={968} h={150} face={-1} pose={POSES.zLimp} shadow={0.2} />
        <Marcus x={1960} y={1040} h={hG(1040)} face={1} pose={POSES.walkLight} propN="radio" eyes="worried" mouth="o" />
      </VScene>
    ),
  },
  {
    at: 'Then the radio',
    draw: (p) => {
      const h = radioHand();
      return (
        <VScene bg="office" a={{x: h[0], y: h[1] + 30, z: 3.0}} b={{x: h[0], y: h[1] + 30, z: 3.4}} p={p} filter="brightness(0.9)">
          <Guard {...OFFICE_DANNY} face={-1} pose={POSES.radio} propN="radio" eyes="wide" sweat />
        </VScene>
      );
    },
  },
  {
    at: 'It went completely',
    draw: (p) => {
      const h = radioHand();
      return (
        <VScene bg="office" a={{x: h[0], y: h[1] + 30, z: 3.4}} b={{x: h[0], y: h[1] + 30, z: 3.7}} p={p} filter={`brightness(${Math.max(0.55, 0.9 - p.t * 0.2)})`} screen={<VNoSignal t={p.t} at={0.4} />}>
          <Guard {...OFFICE_DANNY} face={-1} pose={POSES.radio} propN="radio" eyes="wide" sweat />
        </VScene>
      );
    },
  },
  {at: '>+completely silent', draw: (p) => <EndCard t={p.t} line="FOLLOW FOR PART 4" />},
];

export const SHORT3_DEF: ShortDef = {
  data: s3 as unknown as ShortData,
  vo: 'mall/shorts/s3-vo.mp3',
  shots: SHORT3,
  tags: [
    {at: '0', text: '1:00 A.M. · MAPLECREST MALL'},
    {at: 'At one-forty', text: '1:40 A.M. · MAPLECREST MALL'},
  ],
  hits: [
    {file: 'crackle', at: 'radio clicks', db: -14, offset: 0.2},
    {file: 'static', at: '@marcus0', db: -16, offset: -0.2},
    {file: 'crackle', at: 'clicks again', db: -14, offset: 0.15},
    {file: 'static', at: '@marcus1', db: -16, offset: -0.2},
    {file: 'static', at: '@marcus2', db: -16, offset: -0.2},
    {file: 'static', at: 'Then the radio', db: -18, offset: -0.6},
    {file: 'slam', at: '>+completely silent', db: -10},
  ],
  beds: [
    {file: 'mallhum', from: 0, to: 'It went completely', db: -31},
    {file: 'garage', from: 'Marcus guards', to: 'At one on', db: -27},
    {file: 'garage', from: '@marcus0', to: 'He laughs', db: -27},
    {file: 'garage', from: '@marcus1', to: "Marcus doesn't", db: -26},
    {file: 'garage', from: '@marcus2', to: 'Then the radio', db: -26},
    {file: 'drone', from: 'At one-forty', to: '>+completely silent', db: [[0, -38], [0.8, -26], [1, -40]]},
    {file: 'groans', from: "He's walking", to: 'Then the radio', db: -34},
  ],
};
