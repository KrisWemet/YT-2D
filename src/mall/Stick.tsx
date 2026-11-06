import React from 'react';

/*
 * Code-drawn figures for the mall series: round heads and inked lines follow the shared pose rig.
 * Costume colors and small accessories distinguish figures even in long shots.
 *
 * Local units: the feet stand on y = 0 and a standing figure is ~300 units tall.
 * Angles are in degrees. 0 points straight down; positive swings toward the way
 * the figure faces (forward). Limb angles are absolute (not relative to the parent).
 */

export type Eyes = 'dot' | 'wide' | 'closed' | 'angry' | 'zombie' | 'worried' | 'side';
export type Mouth = 'none' | 'smile' | 'flat' | 'o' | 'frown' | 'grit' | 'zombie' | 'open';
export type Hair = 'none' | 'messy' | 'ponytail' | 'bun' | 'spiky' | 'pigtails' | 'short' | 'hightop';
export type Hat = 'none' | 'guard' | 'beanie' | 'hood' | 'crown';
export type Prop = 'none' | 'flashlight' | 'radio' | 'keys' | 'bat' | 'phone' | 'book';

export type Pose = {
  lean?: number; // torso, forward-positive
  head?: number; // head tilt
  armF: [number, number]; // far arm: upper, lower
  armN: [number, number]; // near arm
  legF: [number, number]; // far leg: thigh, shin
  legN: [number, number]; // near leg
  sit?: boolean; // hips rest on the ground line instead of the feet
};

export type Look = {
  skin?: string;
  shirt?: string; // shirt colour
  sleeves?: boolean | 'short' | 'long'; // true = short sleeves
  pants?: string;
  shoes?: string;
  hat?: Hat;
  hatColor?: string;
  hair?: Hair;
  hairColor?: string;
  mustache?: boolean;
  beard?: boolean;
  badge?: boolean;
  torn?: boolean; // ragged clothes (zombies)
  radioOnChest?: boolean;
  keysOnBelt?: boolean;
  backpack?: string; // backpack colour
  kid?: boolean; // child proportions: bigger head
  vest?: string; // hi-vis vest colour, worn over the shirt, with two reflective stripes
  glasses?: boolean | 'cracked';
  goatee?: boolean;
  bulk?: number; // build: 1 = average, more = a broader torso and thicker limbs
  radioFlip?: boolean; // the chest radio clipped on upside down (antenna down)
};

export type StickProps = {
  x: number;
  y: number; // ground point in parent units
  h: number; // height of a standing figure in parent units
  face?: 1 | -1; // 1 = facing right
  pose: Pose;
  look: Look;
  eyes?: Eyes;
  mouth?: Mouth;
  look2?: number; // pupil offset, -1..1 (look back / forward)
  propN?: Prop; // prop in the near hand
  propF?: Prop; // prop in the far hand
  beam?: number; // flashlight beam length (0 = off)
  shadow?: number; // ground shadow opacity
  dim?: number; // 1 = full brightness
  opacity?: number;
  wobble?: number; // seed for the hand-drawn line wobble
  ghost?: boolean; // silhouette only (dark shape, e.g. behind frosted glass)
  back?: boolean; // seen from behind: no face
  front?: boolean; // facing the camera: face centred
  sweat?: boolean;
};

type V2 = [number, number];
const INK = '#0b0c0c';
const LW = 3.6; // outline width
const R = 28; // head radius
const NECK = 8;
const TORSO = 94;
const UPPER = 52;
const FORE = 48;
const THIGH = 67;
const SHIN = 64;

const rad = (d: number) => (d * Math.PI) / 180;
// vector of length l at angle a (0 = down, + = forward/right in local space)
const v = (a: number, l: number): V2 => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
const add = (p: V2, q: V2): V2 => [p[0] + q[0], p[1] + q[1]];
const lerp = (p: V2, q: V2, t: number): V2 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const shade = (hex: string, k: number) => {
  // darken (k < 1) or lighten (k > 1) a #rrggbb colour
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => Math.max(0, Math.min(255, Math.round(k < 1 ? x * k : x + (255 - x) * (k - 1)))));
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
};

export const POSES = {
  stand: {lean: 0, head: 0, armF: [-8, -4], armN: [10, 6], legF: [-6, -4], legN: [8, 6]},
  standRelax: {lean: 2, head: 4, armF: [-10, -2], armN: [12, 4], legF: [-7, -5], legN: [7, 6]},
  walkA: {lean: 6, head: 0, armF: [28, 50], armN: [-26, -10], legF: [-24, -14], legN: [24, 10]},
  walkB: {lean: 6, head: 0, armF: [-24, -8], armN: [26, 46], legF: [22, 6], legN: [-20, -32]},
  run: {lean: 16, head: -6, armF: [-50, 10], armN: [55, 120], legF: [-35, -100], legN: [55, 5]},
  sneak: {lean: 22, head: -10, armF: [30, 95], armN: [40, 100], legF: [-20, -40], legN: [35, -10]},
  point: {lean: 2, head: 0, armF: [-8, -4], armN: [95, 92], legF: [-6, -4], legN: [8, 6]},
  holdUp: {lean: 0, head: -4, armF: [-8, -4], armN: [60, 150], legF: [-6, -4], legN: [8, 6]},
  flashlight: {lean: 4, head: 0, armF: [-6, -2], armN: [70, 88], legF: [-8, -4], legN: [10, 6]},
  radio: {lean: 2, head: 8, armF: [-8, -4], armN: [30, 165], legF: [-6, -4], legN: [8, 6]},
  scared: {lean: -10, head: -8, armF: [120, 170], armN: [110, 160], legF: [-14, -6], legN: [16, 8]},
  shrug: {lean: 0, head: 6, armF: [-60, 40], armN: [60, -40], legF: [-6, -4], legN: [8, 6]},
  think: {lean: 0, head: 10, armF: [10, 80], armN: [25, 165], legF: [-6, -4], legN: [8, 6]},
  crouch: {lean: 30, head: -14, armF: [40, 80], armN: [55, 90], legF: [70, -30], legN: [95, -10]},
  sitHug: {lean: 10, head: 10, armF: [60, 110], armN: [70, 115], legF: [95, -5], legN: [80, -15], sit: true},
  slide: {lean: -60, head: -30, armF: [-120, -100], armN: [-140, -110], legF: [100, 95], legN: [80, 85], sit: true},
  pullDown: {lean: 8, head: -10, armF: [170, 175], armN: [160, 172], legF: [-8, -4], legN: [10, 6]},
  lock: {lean: 25, head: 10, armF: [45, 80], armN: [55, 75], legF: [-10, -6], legN: [20, 6]},
  lookBack: {lean: 10, head: -14, armF: [30, 50], armN: [-30, -10], legF: [-26, -10], legN: [30, 12]},
  rattle: {lean: 6, head: -6, armF: [100, 120], armN: [110, 128], legF: [-10, -6], legN: [14, 6]},
  handMouth: {lean: 4, head: 6, armF: [10, 40], armN: [40, 175], legF: [80, -5], legN: [70, -15], sit: true},
  yawn: {lean: -4, head: -12, armF: [150, 175], armN: [-150, -175], legF: [-6, -4], legN: [8, 6]},
  thumbsUp: {lean: 0, head: 4, armF: [-8, -4], armN: [40, 160], legF: [-6, -4], legN: [8, 6]},
  sitChair: {lean: 0, head: 0, armF: [20, 80], armN: [25, 85], legF: [85, 10], legN: [88, 6], sit: true},
  walkLight: {lean: 6, head: 0, armF: [-26, -10], armN: [70, 88], legF: [-24, -14], legN: [24, 10]},
  runLight: {lean: 16, head: -6, armF: [-50, 10], armN: [75, 95], legF: [-35, -100], legN: [55, 5]},
  pointUp: {lean: -2, head: -10, armF: [-8, -4], armN: [128, 128], legF: [-8, -4], legN: [10, 6]},
  wave: {lean: 0, head: 4, armF: [-8, -4], armN: [140, 188], legF: [-6, -4], legN: [8, 6]},
  radioBoth: {lean: 14, head: 16, armF: [40, 150], armN: [50, 160], legF: [95, -5], legN: [80, -15], sit: true},
  crouchLock: {lean: 38, head: 18, armF: [60, 100], armN: [70, 95], legF: [80, -30], legN: [100, -10]},
  lookUp: {lean: -2, head: -16, armF: [-8, -4], armN: [10, 6], legF: [-6, -4], legN: [8, 6]},
  frontStand: {lean: 0, head: 0, armF: [-14, -6], armN: [14, 6], legF: [-8, -4], legN: [8, 4]},
  frontPress: {lean: 0, head: 0, armF: [-148, -172], armN: [148, 172], legF: [-8, -4], legN: [8, 4]},
  frontReach: {lean: 0, head: 6, armF: [-110, -140], armN: [115, 145], legF: [-10, -4], legN: [10, 4]},
  kneelOpen: {lean: 4, head: -6, armF: [75, 120], armN: [100, 140], legF: [8, -95], legN: [85, 5]},
  runArms: {lean: 12, head: -6, armF: [150, 175], armN: [140, 168], legF: [-35, -100], legN: [55, 5]},
  waveHi: {lean: 0, head: 6, armF: [-8, -4], armN: [150, 200], legF: [-6, -4], legN: [8, 6]},
  readBook: {lean: 6, head: 18, armF: [30, 110], armN: [35, 105], legF: [-6, -4], legN: [8, 6]},
  laugh: {lean: -8, head: -18, armF: [20, 100], armN: [30, 160], legF: [-8, -4], legN: [10, 6]},
  facepalm: {lean: 4, head: 14, armF: [-8, -4], armN: [40, 172], legF: [-6, -4], legN: [8, 6]},
  frontShrug: {lean: 0, head: 8, armF: [-60, -120], armN: [60, 120], legF: [-8, -4], legN: [8, 4]},
  frontArmsOpen: {lean: 0, head: 0, armF: [-100, -115], armN: [100, 115], legF: [-10, -4], legN: [10, 4]},
  // zombies
  zShamble: {lean: 12, head: 16, armF: [80, 92], armN: [88, 98], legF: [-12, -8], legN: [16, 6]},
  zShambleB: {lean: 14, head: 22, armF: [92, 100], armN: [76, 86], legF: [10, 2], legN: [-14, -10]},
  zLimp: {lean: 20, head: 30, armF: [10, 18], armN: [70, 82], legF: [-4, -2], legN: [24, 14]},
  zPress: {lean: 8, head: 4, armF: [140, 120], armN: [130, 110], legF: [-8, -4], legN: [10, 6]},
  zCrouchEat: {lean: 70, head: 40, armF: [80, 120], armN: [95, 130], legF: [80, -40], legN: [100, -20]},
  lyingDown: {lean: -88, head: -88, armF: [-70, -60], armN: [-110, -100], legF: [90, 92], legN: [86, 88], sit: true},
} satisfies Record<string, Pose>;

const SKIN = {danny: '#d6a17a', marcus: '#8d5b3e', lily: '#dfae88', light: '#f0c9a4', tan: '#c98f66', deep: '#6f4630'};
const UNIFORM = {shirt: '#33497d', pants: '#1f2a46', hat: '#25365e'};

export const LOOKS = {
  guard: {
    skin: SKIN.danny, shirt: UNIFORM.shirt, sleeves: 'short', pants: UNIFORM.pants, hat: 'guard', hatColor: UNIFORM.hat,
    hair: 'short', hairColor: '#2e231d', mustache: true, badge: true, keysOnBelt: true,
  },
  marcus: {
    skin: SKIN.marcus, shirt: UNIFORM.shirt, sleeves: 'short', pants: UNIFORM.pants, hat: 'guard', hatColor: UNIFORM.hat,
    hair: 'short', hairColor: '#161212', beard: true, badge: true, radioOnChest: true,
  },
  marcusZ: {
    skin: '#7c8a6c', shirt: '#2c3d63', sleeves: 'short', pants: '#1c2540', hat: 'guard', hatColor: '#202c4c',
    hair: 'short', hairColor: '#161212', beard: true, badge: true, radioOnChest: true, torn: true,
  },
  teenA: {skin: SKIN.light, shirt: '#c0533e', sleeves: 'long', pants: '#3b4a66', hat: 'hood', hatColor: '#c0533e'},
  teenB: {skin: SKIN.tan, shirt: '#e2b84a', sleeves: 'short', pants: '#2f3440', hair: 'spiky', hairColor: '#3a2b20'},
  woman: {skin: SKIN.light, shirt: '#3f8a86', sleeves: 'long', pants: '#2b2f3a', hair: 'ponytail', hairColor: '#6a4128'},
  lily: {skin: SKIN.lily, shirt: '#e46a9a', sleeves: 'short', pants: '#4a6ea8', shoes: '#e8e8f0', hair: 'pigtails', hairColor: '#4a2f1e', backpack: '#7a5ac8', kid: true},
  dannyHome: {skin: SKIN.danny, shirt: '#5f7f4f', sleeves: 'long', pants: '#4a5a78', hair: 'short', hairColor: '#2e231d', mustache: true},
  dannyCrown: {
    skin: SKIN.danny, shirt: UNIFORM.shirt, sleeves: 'short', pants: UNIFORM.pants, hat: 'crown', hair: 'short', hairColor: '#2e231d',
    mustache: true, badge: true, keysOnBelt: true,
  },
  // the old night guard who handed Danny the keys: grey hair and moustache, an older long-sleeved uniform
  walt: {
    skin: SKIN.light, shirt: '#3a4566', sleeves: 'long', pants: '#232a3d', hat: 'guard', hatColor: '#2a3350',
    hair: 'short', hairColor: '#d4d4d0', mustache: true, badge: true, keysOnBelt: true,
  },
  shopperA: {skin: SKIN.tan, shirt: '#d9534f', sleeves: 'short', pants: '#2f3440', hair: 'short', hairColor: '#4a3020'},
  shopperB: {skin: SKIN.light, shirt: '#5bc0de', sleeves: 'long', pants: '#454b5a', hair: 'ponytail', hairColor: '#c9a640'},
  shopperC: {skin: SKIN.deep, shirt: '#f0ad4e', sleeves: 'long', pants: '#2b3d5e', hat: 'beanie', hatColor: '#3d6fb0'},
  shopperD: {skin: SKIN.marcus, shirt: '#9b59b6', sleeves: 'short', pants: '#2f3440', hair: 'bun', hairColor: '#1c1612'},
  zombieA: {skin: '#a4b08f', shirt: '#7d8a6b', sleeves: 'long', pants: '#4a4636', torn: true, hair: 'messy', hairColor: '#3b2f25'},
  zombieB: {skin: '#9daa96', shirt: '#9b6a5a', sleeves: 'short', pants: '#3a3f4f', torn: true, hair: 'ponytail', hairColor: '#5a3a28'},
  zombieC: {skin: '#aab395', shirt: '#5d6f88', sleeves: 'long', pants: '#2f3440', torn: true, hair: 'short', hairColor: '#3a3028'},
  zombieD: {skin: '#7e8b72', shirt: '#c2a45c', sleeves: 'short', pants: '#4a3f36', torn: true, hair: 'bun', hairColor: '#2c2420'},
  zombieE: {skin: '#a8b094', shirt: '#6e5a7e', sleeves: 'long', pants: '#363a46', torn: true, hair: 'spiky', hairColor: '#7a5a3a'},
} satisfies Record<string, Look>;

// Skeleton in local units (shared by <Stick>, jointsOf and the other figure styles).
export const HEAD_R = 28;
export const skeleton = (pose: Pose) => {
  const lean = pose.lean ?? 0;
  const kneeF = v(pose.legF[0], THIGH);
  const footF = add(kneeF, v(pose.legF[1], SHIN));
  const kneeN = v(pose.legN[0], THIGH);
  const footN = add(kneeN, v(pose.legN[1], SHIN));
  const hipY = pose.sit ? -14 : -Math.max(footF[1] + 5, footN[1] + 5, kneeF[1] + 8, kneeN[1] + 8, 20);
  const hip: V2 = [0, hipY];
  const dir: V2 = [Math.sin(rad(lean)), -Math.cos(rad(lean))]; // up the spine
  const neck = add(hip, [dir[0] * TORSO, dir[1] * TORSO]);
  const hd = rad(lean + (pose.head ?? 0) * 0.5);
  const headC = add(neck, [Math.sin(hd) * (R + NECK), -Math.cos(hd) * (R + NECK)]);
  const shoulder = add(neck, [-dir[0] * 9, -dir[1] * 9]);
  const elbowF = add(shoulder, v(pose.armF[0], UPPER));
  const handF = add(elbowF, v(pose.armF[1], FORE));
  const elbowN = add(shoulder, v(pose.armN[0], UPPER));
  const handN = add(elbowN, v(pose.armN[1], FORE));
  return {
    lean, dir, hip, neck, headC, shoulder, elbowF, handF, elbowN, handN,
    kneeF: add(hip, kneeF), footF: add(hip, footF), kneeN: add(hip, kneeN), footN: add(hip, footN),
  };
};

// Joint positions of a posed figure in parent coordinates.
export const jointsOf = (pose: Pose, x: number, y: number, h: number, face: 1 | -1 = 1) => {
  const s = h / 300;
  const k = skeleton(pose);
  const P = (q: V2): V2 => [x + q[0] * s * face, y + q[1] * s];
  // where a radio clipped on the chest sits (same spot <Stick> draws it)
  const perp: V2 = [-k.dir[1], k.dir[0]];
  const radio: V2 = [k.neck[0] - k.dir[0] * 24 - perp[0] * 10, k.neck[1] - k.dir[1] * 24 - perp[1] * 10];
  return {head: P(k.headC), neck: P(k.neck), hip: P(k.hip), elbowN: P(k.elbowN), handF: P(k.handF), handN: P(k.handN), headR: R * s, chestRadio: P(radio)};
};

let filterId = 0;

const Limb: React.FC<{pts: V2[]; w: number; c: string; ink?: string}> = ({pts, w, c, ink = INK}) => {
  const d = pts.map((p) => p.join(',')).join(' ');
  return (
    <>
      <polyline points={d} fill="none" stroke={ink} strokeWidth={w + 3.6} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
};

const PropShape: React.FC<{p: Prop; at: V2; ang: number; beam?: number}> = ({p, at, ang, beam = 0}) => {
  // ang: direction of the forearm (0 = down), prop drawn along it
  const rot = p === 'keys' ? 0 : -ang; // svg rotate: our 0 = down is svg +y; keys always dangle
  if (p === 'none') return null;
  return (
    <g transform={`translate(${at[0]},${at[1]}) rotate(${rot})`}>
      {p === 'flashlight' && (
        <>
          {beam > 0 && <path d={`M -9 30 L ${-beam * 0.42} ${beam} L ${beam * 0.42} ${beam} L 9 30 Z`} fill="url(#beamGrad)" opacity={0.75} />}
          <rect x={-6} y={-6} width={12} height={30} rx={3} fill="#2a2a2e" stroke={INK} strokeWidth={3.5} />
          <rect x={-8.5} y={20} width={17} height={10} rx={2} fill="#3b3b40" stroke={INK} strokeWidth={3.5} />
          <rect x={-5.5} y={28} width={11} height={3} fill="#fff6c8" />
        </>
      )}
      {p === 'radio' && (
        <>
          <line x1={5} y1={-6} x2={5} y2={-32} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <rect x={-9} y={-11} width={20} height={31} rx={4} fill="#262629" stroke={INK} strokeWidth={3.5} />
          <rect x={-4.5} y={-5.5} width={11} height={7} rx={1} fill="#8fd18a" />
          <circle cx={1} cy={11} r={2.6} fill="#555" />
        </>
      )}
      {p === 'keys' && (
        <>
          <circle cx={0} cy={9} r={11} fill="none" stroke="#c9a640" strokeWidth={4} />
          {[-50, -20, 10, 40, 70].map((a, i) => (
            <g key={i} transform={`translate(0,9) rotate(${a}) translate(0,11)`}>
              <rect x={-2.6} y={0} width={5.2} height={18} rx={2} fill={i % 2 ? '#c9c9c9' : '#d9b64c'} stroke={INK} strokeWidth={2.2} />
            </g>
          ))}
        </>
      )}
      {p === 'bat' && <path d="M -4 -14 L 4 -14 L 9 110 Q 0 122 -9 110 Z" fill="#c7ccd2" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />}
      {p === 'phone' && <rect x={-8} y={-4} width={16} height={28} rx={3} fill="#222" stroke={INK} strokeWidth={3.5} />}
      {p === 'book' && (
        <g transform="rotate(90)">
          <rect x={-19} y={-13} width={38} height={28} rx={2} fill="#f4f1e6" stroke={INK} strokeWidth={3.2} />
          <rect x={-21} y={-16} width={42} height={7} rx={2} fill="#3d6fb0" stroke={INK} strokeWidth={3.2} />
          <line x1={0} y1={-9} x2={0} y2={14} stroke={INK} strokeWidth={2.2} />
        </g>
      )}
    </g>
  );
};

export const Head: React.FC<{
  c: V2;
  tilt: number;
  look: Look;
  eyes: Eyes;
  mouth: Mouth;
  gaze: number;
  back: boolean;
  front: boolean;
  ghost: boolean;
  ink: string;
}> = ({c, tilt, look, eyes, mouth, gaze, back, front, ghost, ink}) => {
  const skin = ghost ? '#20232b' : shade(look.skin ?? SKIN.light, look.torn ? 1.08 : 1.04);
  const hairC = ghost ? '#20232b' : look.hairColor ?? '#2b211b';
  const hatC = ghost ? '#20232b' : look.hatColor ?? UNIFORM.hat;
  const infected = eyes === 'zombie';
  const g = gaze * 2.2 + (eyes === 'side' ? -2 : 0);
  // three-quarter view: the face sits toward +x; front view: centred
  const ex = front ? [-10, 10] : [-1, 14];
  const ey = -R * 0.1;
  const browY = ey - 7;
  const mx = front ? 0 : R * 0.5;
  const my = R * 0.46;
  const face = !back && !ghost;

  const eye = (x: number, k: number) => {
    switch (eyes) {
      case 'wide':
        return (
          <g key={k}>
            <ellipse cx={x} cy={ey} rx={6} ry={7} fill="#fff" stroke={ink} strokeWidth={2.2} />
            <circle cx={x + g + 0.6} cy={ey + 0.4} r={2.2} fill={ink} />
          </g>
        );
      case 'closed':
        return <path key={k} d={`M ${x - 4} ${ey} Q ${x} ${ey + 3} ${x + 4} ${ey}`} stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
      case 'zombie':
        return (
          <g key={k}>
            <ellipse cx={x} cy={ey + 2} rx={8} ry={9} fill="#465335" opacity={0.6} />
            <path d={`M ${x - 7} ${ey - 3} Q ${x} ${ey + 2} ${x + 7} ${ey - 3} Q ${x + 7} ${ey + 11} ${x} ${ey + 9} Q ${x - 7} ${ey + 8} ${x - 7} ${ey - 3} Z`}
              fill="#fff9e9" stroke={ink} strokeWidth={1.8} />
            <circle cx={x + g * 0.5} cy={ey + 4} r={1.5} fill={ink} />
            <path d={`M ${x - 7} ${ey - (k === 0 ? 5 : 1)} L ${x + 7} ${ey - (k === 0 ? 1 : 5)}`}
              stroke={ink} strokeWidth={3.8} strokeLinecap="round" />
          </g>
        );
      default:
        return <circle key={k} cx={x + g} cy={ey} r={3.3} fill={ink} />;
    }
  };
  const brow = (x: number, k: number) => {
    if (eyes !== 'angry' && eyes !== 'worried' && eyes !== 'wide') return null;
    const slope = (eyes === 'angry' ? 2.2 : -2.2) * (k === 0 ? 1 : -1);
    return <line key={`b${k}`} x1={x - 4} y1={browY - slope} x2={x + 4} y2={browY + slope} stroke={ink} strokeWidth={2.6} strokeLinecap="round" />;
  };
  const mouthEl = (() => {
    const w = 6;
    switch (mouth) {
      case 'smile':
        return <path d={`M ${mx - w} ${my} Q ${mx} ${my + 5} ${mx + w} ${my}`} stroke={ink} strokeWidth={2.3} fill="none" strokeLinecap="round" />;
      case 'flat':
        return <line x1={mx - 4.5} y1={my + 1.5} x2={mx + 4.5} y2={my + 1.5} stroke={ink} strokeWidth={2.3} strokeLinecap="round" />;
      case 'o':
        return <ellipse cx={mx} cy={my + 2} rx={3} ry={3.8} fill="#4a2a2a" stroke={ink} strokeWidth={1.6} />;
      case 'open':
        return <path d={`M ${mx - w} ${my} Q ${mx} ${my + 10} ${mx + w} ${my} Z`} fill="#4a2a2a" stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />;
      case 'frown':
        return <path d={`M ${mx - w} ${my + 4} Q ${mx} ${my - 1} ${mx + w} ${my + 4}`} stroke={ink} strokeWidth={2.3} fill="none" strokeLinecap="round" />;
      case 'grit':
        return (
          <g>
            <rect x={mx - 6} y={my - 1} width={12} height={6} rx={1.6} fill="#fff" stroke={ink} strokeWidth={1.8} />
            <line x1={mx - 6} y1={my + 2} x2={mx + 6} y2={my + 2} stroke={ink} strokeWidth={1.2} />
          </g>
        );
      case 'zombie':
        return (
          <g transform={`translate(${front ? 0 : 8},12)`} stroke={ink} strokeLinejoin="round">
            <path d="M -14 -2 Q -9 -9 -1 -3 Q 4 1 12 -2 Q 18 -1 15 8 Q 6 5 0 9 Q -7 12 -15 7 Z" fill="#12110d" strokeWidth={2.2} />
            <path d="M -11 -3 L -8 4 L -5 -3 Z M -2 -1 L 1 5 L 4 0 Z M 8 -1 L 11 4 L 13 -1 Z M -12 7 L -9 2 L -6 9 Z M -3 8 L 0 3 L 3 7 Z M 7 6 L 10 2 L 12 7 Z"
              fill="#e8d569" strokeWidth={0.7} />
            <path d="M -8 14 Q 0 10 7 12" fill="none" strokeWidth={1.6} strokeLinecap="round" />
          </g>
        );
      default:
        return null;
    }
  })();

  return (
    <g transform={`translate(${c[0]},${c[1]}) rotate(${tilt}) scale(1.1)`}>
      {/* hair that hangs behind the head */}
      {look.hair === 'ponytail' && <path d={`M ${-R * 0.75} ${-R * 0.4} q -22 6 -18 34 q 8 -10 20 -15 Z`} fill={hairC} stroke={ink} strokeWidth={3} strokeLinejoin="round" />}
      {look.hair === 'bun' && <circle cx={-R * 0.6} cy={-R * 0.8} r={10} fill={hairC} stroke={ink} strokeWidth={3} />}
      {look.hat === 'hood' && <path d={`M ${-R - 8} 6 A ${R + 9} ${R + 9} 0 1 1 ${R + 5} -6 L ${R - 2} 8 A ${R - 2} ${R - 2} 0 1 0 ${-R + 3} 14 Z`} fill={hatC} stroke={ink} strokeWidth={3.5} />}
      {/* the head */}
      <circle cx={0} cy={0} r={R} fill={skin} stroke={ink} strokeWidth={LW} />
      {/* hair on top */}
      {look.hair === 'short' && !look.hat && (
        <path
          d={front ? `M ${-R + 1} -6 Q ${-R + 2} ${-R - 6} 0 ${-R - 5} Q ${R - 2} ${-R - 6} ${R - 1} -6 Q 10 -18 0 -17 Q -10 -18 ${-R + 1} -6 Z` : `M ${-R + 2} 4 Q ${-R - 2} ${-R - 2} 2 ${-R - 5} Q ${R - 2} ${-R - 4} ${R - 2} ${-R * 0.42} Q ${R * 0.35} ${-R * 0.62} ${-R * 0.05} ${-R * 0.55} Q ${-R * 0.35} ${-R * 0.3} ${-R * 0.5} 4 Z`}
          fill={hairC}
          stroke={ink}
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
      )}
      {look.hair === 'hightop' && !look.hat && (
        <path
          d={front ? `M ${-R + 1} -4 L ${-R - 1} ${-R - 4} Q ${-R} ${-R - 15} ${-R + 7} ${-R - 15} L ${R - 7} ${-R - 15} Q ${R} ${-R - 15} ${R + 1} ${-R - 4} L ${R - 1} -4 Q 10 -19 0 -18 Q -10 -19 ${-R + 1} -4 Z` : `M ${-R + 1} 3 L ${-R - 1} ${-R + 2} Q ${-R} ${-R - 15} ${-R + 8} ${-R - 15} L ${R - 9} ${-R - 13} Q ${R - 3} ${-R - 12} ${R - 3} ${-R - 6} L ${R - 2} ${-R * 0.48} Q ${R * 0.4} ${-R * 0.64} ${R * 0.05} ${-R * 0.54} Q ${-R * 0.34} ${-R * 0.32} ${-R * 0.44} 4 Z`}
          fill={hairC}
          stroke={ink}
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
      )}
      {look.hair === 'messy' && (
        <path d={`M ${-R + 2} -10 Q -22 -36 -6 -32 Q 0 -40 10 -33 Q 22 -38 24 -26 Q 32 -22 ${R - 2} -12 Q 18 -22 4 -20 Q -10 -26 ${-R + 2} -10 Z`} fill={hairC} stroke={ink} strokeWidth={2.8} strokeLinejoin="round" />
      )}
      {look.hair === 'spiky' && (
        <path d={`M ${-R + 3} -12 L -26 -34 L -14 -26 L -8 -40 L 0 -27 L 9 -40 L 12 -26 L 24 -35 L ${R - 3} -12 Q 0 -26 ${-R + 3} -12 Z`} fill={hairC} stroke={ink} strokeWidth={2.8} strokeLinejoin="round" />
      )}
      {(look.hair === 'ponytail' || look.hair === 'bun' || look.hair === 'pigtails') && (
        <path d={`M ${-R + 1} -4 Q -18 -38 8 -31 Q 26 -26 ${R - 2} -8 Q 8 -21 -4 -18 Q -16 -16 ${-R + 1} -4 Z`} fill={hairC} stroke={ink} strokeWidth={2.8} strokeLinejoin="round" />
      )}
      {look.hair === 'pigtails' && (
        <g fill={hairC} stroke={ink} strokeWidth={2.8} strokeLinejoin="round">
          <path d={`M ${-R + 2} -10 q -24 -4 -21 20 q 7 -8 18 -10 Z`} />
          <path d={`M ${R - 2} -10 q 24 -4 21 20 q -7 -8 -18 -10 Z`} />
          <circle cx={-R - 2} cy={-7} r={3.8} fill="#e85a8c" />
          <circle cx={R + 2} cy={-7} r={3.8} fill="#e85a8c" />
        </g>
      )}
      {/* hats */}
      {look.hat === 'guard' && (
        <g>
          <path d={`M ${-R - 2} -9 Q -24 -40 2 -42 Q 27 -42 ${R + 1} -11 Z`} fill={hatC} stroke={ink} strokeWidth={3.6} strokeLinejoin="round" />
          {!back && !front && <path d={`M 5 -12 Q 28 -16 ${R + 17} -8 Q 30 -4 7 -7 Z`} fill={shade(hatC, 0.55)} stroke={ink} strokeWidth={3.2} strokeLinejoin="round" />}
          {front && <path d={`M ${-R - 3} -10 Q 0 -2 ${R + 3} -10 Q 0 -18 ${-R - 3} -10 Z`} fill={shade(hatC, 0.55)} stroke={ink} strokeWidth={3.2} strokeLinejoin="round" />}
          {!back && <path d={`M ${front ? 0 : 4} -33 l 4 3 l 0 6 l -4 2.5 l -4 -2.5 l 0 -6 Z`} fill="#e0b94a" stroke={ink} strokeWidth={1.6} />}
        </g>
      )}
      {look.hat === 'crown' && (
        <g>
          <path d={`M ${-R + 3} -15 L ${-R + 1} -50 L -13 -33 L 0 -55 L 13 -33 L ${R - 1} -50 L ${R - 3} -15 Z`} fill="#f2c94c" stroke={ink} strokeWidth={3.2} strokeLinejoin="round" />
          <circle cx={-11} cy={-23} r={3.6} fill="#e2392d" stroke={ink} strokeWidth={1.6} />
          <circle cx={2} cy={-25} r={3.6} fill="#3d6fb0" stroke={ink} strokeWidth={1.6} />
          <circle cx={14} cy={-23} r={3.6} fill="#3fb36b" stroke={ink} strokeWidth={1.6} />
        </g>
      )}
      {look.hat === 'beanie' && <path d={`M ${-R} -6 Q -24 -44 3 -43 Q 28 -42 ${R} -6 Z`} fill={hatC} stroke={ink} strokeWidth={3.6} />}
      {/* the face */}
      {face && (
        <g>
          {eye(ex[0], 0)}
          {eye(ex[1], 1)}
          {brow(ex[0], 0)}
          {brow(ex[1], 1)}
          {look.beard && !infected && (
            <path
              d={front ? `M ${-R * 0.82} ${R * 0.22} Q 0 ${R * 1.22} ${R * 0.82} ${R * 0.22} Q 0 ${R * 0.7} ${-R * 0.82} ${R * 0.22} Z` : `M ${-R * 0.12} ${R * 0.5} Q ${R * 0.4} ${R * 1.12} ${R * 0.92} ${R * 0.32} Q ${R * 0.62} ${R * 0.66} ${R * 0.44} ${R * 0.6} Q ${R * 0.2} ${R * 0.66} ${-R * 0.12} ${R * 0.5} Z`}
              fill={hairC}
              opacity={0.9}
              stroke={ink}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
          )}
          {look.mustache && (
            <path
              d={`M ${mx - 8} ${my - 3} Q ${mx - 4} ${my - 8} ${mx} ${my - 5} Q ${mx + 4} ${my - 8} ${mx + 8} ${my - 3} Q ${mx + 4} ${my - 1.5} ${mx} ${my - 3} Q ${mx - 4} ${my - 1.5} ${mx - 8} ${my - 3} Z`}
              fill={hairC}
              stroke={ink}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          )}
          {look.goatee && (
            <path d={`M ${mx - 5.5} ${my + 3.5} Q ${mx} ${my + 13} ${mx + 5.5} ${my + 3.5} Q ${mx} ${my + 7} ${mx - 5.5} ${my + 3.5} Z`} fill={hairC} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
          )}
          {infected && (
            <g fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round">
              <path d="M -2 -10 l 1 4 M 2 -10 l -1 4 M 2 2 l 2 7 l -4 1" />
              <path d="M -20 7 l -2 3 M -17 9 l -2 4 M 20 8 l 2 3 M 18 10 l 2 4" />
            </g>
          )}
          {mouthEl}
          {look.glasses && (
            <g fill="#fff" fillOpacity={0.16} stroke={ink} strokeWidth={2.2}>
              {front ? (
                <>
                  <circle cx={ex[0]} cy={ey} r={6.6} />
                  <circle cx={ex[1]} cy={ey} r={6.6} />
                  <path d={`M ${ex[0] + 6.6} ${ey} L ${ex[1] - 6.6} ${ey} M ${ex[0] - 6.6} ${ey} L ${-R + 1} ${ey - 2} M ${ex[1] + 6.6} ${ey} L ${R - 1} ${ey - 2}`} fill="none" />
                </>
              ) : (
                <>
                  <ellipse cx={ex[0]} cy={ey} rx={4.8} ry={6} />
                  <circle cx={ex[1]} cy={ey} r={6.4} />
                  <path d={`M ${ex[0] + 4.8} ${ey} L ${ex[1] - 6.4} ${ey} M ${ex[0] - 4.8} ${ey} L ${-R * 0.45} ${ey - 1.5}`} fill="none" />
                </>
              )}
              {look.glasses === 'cracked' && <path d={`M ${ex[1] - 4} ${ey - 5} L ${ex[1] - 0.5} ${ey - 1} L ${ex[1] - 3} ${ey + 1.5} L ${ex[1] + 2.5} ${ey + 5}`} fill="none" strokeWidth={1.5} />}
            </g>
          )}
        </g>
      )}
    </g>
  );
};

export const Stick: React.FC<StickProps> = ({
  x,
  y,
  h,
  face = 1,
  pose,
  look,
  eyes = 'dot',
  mouth = 'none',
  look2 = 0,
  propN = 'none',
  propF = 'none',
  beam = 0,
  shadow = 0.28,
  dim = 1,
  opacity = 1,
  wobble = 1,
  ghost = false,
  back = false,
  front = false,
  sweat = false,
}) => {
  const s = h / 300;
  const k = skeleton(pose);
  const {lean, hip, neck, headC, shoulder} = k;
  const bulk = look.bulk ?? 1;
  const ink = ghost ? '#1a1c22' : INK;
  const shirt = look.shirt ?? '#7a8494';
  const skin = look.skin ?? SKIN.light;
  const fid = React.useMemo(() => `wob${filterId++}`, []);

  const leg = (knee: V2, foot: V2, far: boolean) => (
    <>
      <Limb pts={[add(hip, [far ? -7 : 7, 0]), knee, foot]} w={5.5 * bulk} c={ink} ink={ink} />
      <Limb pts={[foot, add(foot, [12, 2])]} w={5.5 * bulk} c={ink} ink={ink} />
    </>
  );
  const arm = (elbow: V2, hand: V2, prop: Prop, far: boolean, angle: number) => (
    <>
      <Limb pts={[add(shoulder, [(far ? -16 : 16) * Math.cos(rad(lean)), (far ? -16 : 16) * Math.sin(rad(lean))]), elbow, hand]} w={4.8 * bulk} c={ink} ink={ink} />
      <circle cx={hand[0]} cy={hand[1]} r={4.6 * bulk} fill={ghost ? ink : skin} stroke={ink} strokeWidth={2.5} />
      {!ghost && <PropShape p={prop} at={hand} ang={angle} beam={beam} />}
    </>
  );

  return (
    <g transform={`translate(${x},${y}) scale(${s * face},${s})`} opacity={opacity}>
      {shadow > 0 && <ellipse cx={0} cy={3} rx={pose.sit ? 70 : 44} ry={8} fill="#000" opacity={shadow} />}
      <g filter={`url(#${fid})`} style={dim !== 1 ? {filter: `brightness(${dim})`} : undefined}>
        <defs>
          <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={wobble} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff7c4" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff7c4" stopOpacity={0} />
          </linearGradient>
        </defs>
        {leg(k.kneeF, k.footF, true)}
        {leg(k.kneeN, k.footN, false)}
        {arm(k.elbowF, k.handF, propF, true, pose.armF[1])}
        <Limb pts={[headC, shoulder]} w={5 * bulk} c={ink} ink={ink} />
        <g transform={`translate(${neck}) rotate(${lean})`}>
          <defs>
            <linearGradient id={`${fid}Uniform`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={shade(shirt, 0.8)} />
              <stop offset="0.55" stopColor={shirt} />
              <stop offset="1" stopColor={shade(shirt, 0.9)} />
            </linearGradient>
          </defs>
          <path d="M -14 -7 Q -24 12 -21 63 L -18 86 Q -15 100 0 100 Q 15 100 18 86 L 21 63 Q 24 12 14 -7 Q 0 -14 -14 -7 Z"
            transform={`scale(${bulk},1)`} fill={ghost ? ink : `url(#${fid}Uniform)`} stroke={ink} strokeWidth={4} />
          {!ghost && (
            <g>
              <path d="M -19 78 H 19" stroke={ink} strokeWidth={7} />
              <rect x={-5} y={74} width={10} height={8} rx={2} fill="#40516a" stroke={ink} strokeWidth={2} />
            </g>
          )}
          {look.backpack && !ghost && <rect x={-29} y={25} width={18} height={42} rx={7} fill={look.backpack} stroke={ink} strokeWidth={3} />}
          {look.vest && !ghost && (
            <g>
              <path d="M 0 14 V 68" fill="none" stroke={ink} strokeWidth={34} strokeLinecap="round" />
              <path d="M 0 14 V 68" fill="none" stroke={look.vest} strokeWidth={29} strokeLinecap="round" />
              <path d="M -15 45 H 15 M -15 57 H 15" fill="none" stroke="#e8eef1" strokeWidth={4} />
            </g>
          )}
          {look.torn && !ghost && <path d="M 9 61 l 4 -5 l -1 5 l 4 -3" fill="none" stroke={ink} strokeWidth={2.4} />}
          {look.badge && !ghost && !back && (
            <path d="M 9 16 l 6 3 v 8 l -6 5 l -6 -5 v -8 Z" fill="#e0b94a" stroke={ink} strokeWidth={1.8} />
          )}
          {look.radioOnChest && !ghost && !back && (
            <g transform={`translate(-10,24) rotate(${look.radioFlip ? 180 : 0})`}>
              <line x1={3.5} y1={-7} x2={3.5} y2={-20} stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
              <rect x={-6} y={-8} width={13} height={19} rx={2.6} fill="#262629" stroke={ink} strokeWidth={2.4} />
              <rect x={-2.5} y={-4.5} width={7} height={4.5} fill="#8fd18a" />
            </g>
          )}
          {look.keysOnBelt && !ghost && (
            <g transform={`translate(17,${TORSO - 12})`}>
              <circle cx={0} cy={3} r={5.5} fill="none" stroke="#c9a640" strokeWidth={2.4} />
              <rect x={-4.5} y={6} width={3.2} height={9} rx={1.2} fill="#d9b64c" stroke={ink} strokeWidth={1.4} />
              <rect x={0.8} y={7} width={3.2} height={8} rx={1.2} fill="#cfcfcf" stroke={ink} strokeWidth={1.4} />
            </g>
          )}
        </g>
        <g transform={look.kid ? `translate(${headC[0]},${headC[1] - 4}) scale(1.28) translate(${-headC[0]},${-headC[1]})` : undefined}>
          <Head c={headC} tilt={pose.head ?? 0} look={look} eyes={eyes} mouth={mouth} gaze={look2} back={back} front={front} ghost={ghost} ink={ink} />
        </g>
        {sweat && !ghost && (
          <path transform={`translate(${headC[0] - R * 0.7},${headC[1] - R * 0.4})`} d="M 0 -10 Q 6 0 0 5 Q -6 0 0 -10 Z" fill="#9fd3ff" stroke={ink} strokeWidth={2} />
        )}
        {/* near arm and its held prop overlap the body. */}
        {arm(k.elbowN, k.handN, propN, false, pose.armN[1])}
      </g>
    </g>
  );
};
