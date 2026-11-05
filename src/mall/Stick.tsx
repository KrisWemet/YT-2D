import React from 'react';

/*
 * Code-drawn stick figures for the mall series.
 *
 * Local units: the feet stand on y = 0 and a standing figure is ~300 units tall.
 * Angles are in degrees. 0 points straight down; positive swings toward the way
 * the figure faces (forward). Limb angles are absolute (not relative to the parent).
 */

export type Eyes = 'dot' | 'wide' | 'closed' | 'angry' | 'zombie' | 'worried' | 'side';
export type Mouth = 'none' | 'smile' | 'flat' | 'o' | 'frown' | 'grit' | 'zombie' | 'open';
export type Hair = 'none' | 'messy' | 'ponytail' | 'bun' | 'spiky';
export type Hat = 'none' | 'guard' | 'beanie' | 'hood';
export type Prop = 'none' | 'flashlight' | 'radio' | 'keys' | 'bat' | 'phone';

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
  shirt?: string; // torso shape colour; undefined = bare stick
  sleeves?: boolean;
  pants?: string; // undefined = thin stick legs
  hat?: Hat;
  hatColor?: string;
  hair?: Hair;
  hairColor?: string;
  mustache?: boolean;
  beard?: boolean;
  badge?: boolean;
  torn?: boolean; // ragged shirt hem (zombies)
  radioOnChest?: boolean;
  keysOnBelt?: boolean;
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

const INK = '#1d1a1a';
const LW = 6.5;
const R = 34; // head radius
const TORSO = 96;
const UPPER = 50;
const FORE = 48;
const THIGH = 60;
const SHIN = 60;

const rad = (d: number) => (d * Math.PI) / 180;
// vector of length l at angle a (0 = down, + = forward/right in local space)
const v = (a: number, l: number): [number, number] => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
const add = (p: [number, number], q: [number, number]): [number, number] => [p[0] + q[0], p[1] + q[1]];

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
  // zombies
  zShamble: {lean: 12, head: 16, armF: [80, 92], armN: [88, 98], legF: [-12, -8], legN: [16, 6]},
  zShambleB: {lean: 14, head: 22, armF: [92, 100], armN: [76, 86], legF: [10, 2], legN: [-14, -10]},
  zLimp: {lean: 20, head: 30, armF: [10, 18], armN: [70, 82], legF: [-4, -2], legN: [24, 14]},
  zPress: {lean: 8, head: 4, armF: [140, 120], armN: [130, 110], legF: [-8, -4], legN: [10, 6]},
  zCrouchEat: {lean: 70, head: 40, armF: [80, 120], armN: [95, 130], legF: [80, -40], legN: [100, -20]},
  lyingDown: {lean: -88, head: -88, armF: [-70, -60], armN: [-110, -100], legF: [90, 92], legN: [86, 88], sit: true},
} satisfies Record<string, Pose>;

export const LOOKS = {
  guard: {
    shirt: '#2f4475', sleeves: true, hat: 'guard', hatColor: '#24345c', mustache: true,
    badge: true, keysOnBelt: true,
  },
  marcus: {
    shirt: '#2f4475', sleeves: true, hat: 'guard', hatColor: '#24345c', beard: true,
    badge: true, radioOnChest: true,
  },
  marcusZ: {
    skin: '#b7c2a4', shirt: '#2b3c63', sleeves: true, hat: 'guard', hatColor: '#202c4c', beard: true, badge: true,
    radioOnChest: true, torn: true,
  },
  teenA: {shirt: '#c0533e', sleeves: true, hat: 'hood', hatColor: '#c0533e'},
  woman: {shirt: '#3f8a86', sleeves: true, hair: 'ponytail', hairColor: '#6a4128'},
  teenB: {shirt: '#e2b84a', sleeves: true, hair: 'spiky', hairColor: '#3a2b20'},
  zombieA: {skin: '#b5bfa2', shirt: '#7d8a6b', sleeves: true, torn: true, hair: 'messy', hairColor: '#3b2f25'},
  zombieB: {skin: '#aeb9a6', shirt: '#9b6a5a', sleeves: true, torn: true, hair: 'ponytail', hairColor: '#5a3a28'},
  zombieC: {skin: '#bcc3a8', shirt: '#5d6f88', sleeves: true, torn: true},
  zombieD: {skin: '#b0bba0', shirt: '#c2a45c', sleeves: true, torn: true, hair: 'bun', hairColor: '#2c2420'},
  zombieE: {skin: '#b9c1a5', shirt: '#6e5a7e', sleeves: true, torn: true, hair: 'spiky', hairColor: '#7a5a3a'},
} satisfies Record<string, Look>;

let filterId = 0;

// Joint positions of a posed figure in parent coordinates (same maths as <Stick>).
export const jointsOf = (pose: Pose, x: number, y: number, h: number, face: 1 | -1 = 1) => {
  const s = h / 300;
  const lean = pose.lean ?? 0;
  const kneeF = v(pose.legF[0], THIGH);
  const footF = add(kneeF, v(pose.legF[1], SHIN));
  const kneeN = v(pose.legN[0], THIGH);
  const footN = add(kneeN, v(pose.legN[1], SHIN));
  const hipY = pose.sit ? -12 : -Math.max(footF[1], footN[1], 20);
  const hip: [number, number] = [0, hipY];
  const neck = add(hip, [Math.sin(rad(lean)) * TORSO, -Math.cos(rad(lean)) * TORSO]);
  const hd = rad(lean + (pose.head ?? 0) * 0.5);
  const head = add(neck, [Math.sin(hd) * (R + 4), -Math.cos(hd) * (R + 4)]);
  const shoulder = add(neck, [-Math.sin(rad(lean)) * 12, Math.cos(rad(lean)) * 12]);
  const handF = add(add(shoulder, v(pose.armF[0], UPPER)), v(pose.armF[1], FORE));
  const handN = add(add(shoulder, v(pose.armN[0], UPPER)), v(pose.armN[1], FORE));
  const P = (q: [number, number]): [number, number] => [x + q[0] * s * face, y + q[1] * s];
  return {head: P(head), neck: P(neck), hip: P(hip), handF: P(handF), handN: P(handN), headR: R * s};
};

const Ln: React.FC<{a: [number, number]; b: [number, number]; w?: number; c?: string}> = ({a, b, w = LW, c = INK}) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
);

// polyline through points with round joins
const Poly: React.FC<{pts: [number, number][]; w?: number; c?: string}> = ({pts, w = LW, c = INK}) => (
  <polyline
    points={pts.map((p) => p.join(',')).join(' ')}
    fill="none"
    stroke={c}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const PropShape: React.FC<{p: Prop; at: [number, number]; ang: number; beam?: number}> = ({p, at, ang, beam = 0}) => {
  // ang: direction of the forearm (0 = down), prop drawn along it
  const rot = p === 'keys' ? 0 : -ang; // svg rotate: our 0 = down is svg +y; keys always dangle
  if (p === 'none') return null;
  return (
    <g transform={`translate(${at[0]},${at[1]}) rotate(${rot})`}>
      {p === 'flashlight' && (
        <>
          {beam > 0 && (
            <path
              d={`M -9 30 L ${-beam * 0.42} ${beam} L ${beam * 0.42} ${beam} L 9 30 Z`}
              fill="url(#beamGrad)"
              opacity={0.75}
            />
          )}
          <rect x={-6.5} y={-8} width={13} height={34} rx={3} fill="#2a2a2e" stroke={INK} strokeWidth={4} />
          <rect x={-9} y={22} width={18} height={10} rx={2} fill="#3b3b40" stroke={INK} strokeWidth={4} />
          <rect x={-6} y={30} width={12} height={3} fill="#fff6c8" />
        </>
      )}
      {p === 'radio' && (
        <>
          <line x1={6} y1={-6} x2={6} y2={-36} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <rect x={-10} y={-12} width={22} height={34} rx={4} fill="#262629" stroke={INK} strokeWidth={4} />
          <rect x={-5} y={-6} width={12} height={8} rx={1} fill="#8fd18a" />
          <circle cx={1} cy={12} r={3} fill="#555" />
        </>
      )}
      {p === 'keys' && (
        <>
          <circle cx={0} cy={10} r={12} fill="none" stroke="#c9a640" strokeWidth={4.5} />
          {[-50, -20, 10, 40, 70].map((a, i) => (
            <g key={i} transform={`translate(0,10) rotate(${a}) translate(0,12)`}>
              <rect x={-3} y={0} width={6} height={20} rx={2} fill={i % 2 ? '#c9c9c9' : '#d9b64c'} stroke={INK} strokeWidth={2.5} />
            </g>
          ))}
        </>
      )}
      {p === 'bat' && (
        <path
          d="M -4 -14 L 4 -14 L 9 110 Q 0 122 -9 110 Z"
          fill="#c7ccd2"
          stroke={INK}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
      )}
      {p === 'phone' && <rect x={-9} y={-4} width={18} height={30} rx={3} fill="#222" stroke={INK} strokeWidth={4} />}
    </g>
  );
};

const Head: React.FC<{
  c: [number, number];
  tilt: number;
  look: Look;
  eyes: Eyes;
  mouth: Mouth;
  gaze: number;
  back?: boolean;
  front?: boolean;
}> = ({c, tilt, look, eyes, mouth, gaze, back = false, front = false}) => {
  const skin = look.skin ?? '#ffffff';
  const fx = front ? 0 : R * 0.32; // face centre offset toward the facing side (three-quarter view)
  const ex1 = front ? -12 : fx - 11;
  const ex2 = front ? 12 : fx + 13;
  const ey = -4;
  const g = gaze * 3.5;
  const eye = (x: number, k: number) => {
    switch (eyes) {
      case 'wide':
        return (
          <g key={k}>
            <circle cx={x} cy={ey} r={7.5} fill="#fff" stroke={INK} strokeWidth={3.2} />
            <circle cx={x + g} cy={ey} r={3.2} fill={INK} />
          </g>
        );
      case 'closed':
        return <path key={k} d={`M ${x - 5} ${ey} Q ${x} ${ey + 4} ${x + 5} ${ey}`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
      case 'angry':
        return (
          <g key={k}>
            <circle cx={x + g} cy={ey + 1} r={3.6} fill={INK} />
            <line x1={x - 7} y1={ey - 10 + (k ? 3 : -1)} x2={x + 7} y2={ey - 10 + (k ? -1 : 3)} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          </g>
        );
      case 'worried':
        return (
          <g key={k}>
            <circle cx={x + g} cy={ey + 1} r={3.8} fill={INK} />
            <line x1={x - 6} y1={ey - 9 + (k ? -3 : 2)} x2={x + 6} y2={ey - 9 + (k ? 2 : -3)} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
          </g>
        );
      case 'zombie':
        return (
          <g key={k}>
            <circle cx={x} cy={ey} r={7.5} fill="#e9ecd6" stroke={INK} strokeWidth={3} />
            <circle cx={x + g * 0.6} cy={ey + 0.5} r={1.8} fill={INK} />
            <path d={`M ${x - 7} ${ey + 9} Q ${x} ${ey + 13} ${x + 7} ${ey + 9}`} stroke="#6e7562" strokeWidth={2.5} fill="none" />
          </g>
        );
      case 'side':
        return <circle key={k} cx={x + 3.5} cy={ey} r={3.8} fill={INK} />;
      default:
        return <circle key={k} cx={x + g} cy={ey} r={4} fill={INK} />;
    }
  };
  const my = 13;
  const mx = fx + 2;
  const mouthEl = (() => {
    switch (mouth) {
      case 'smile':
        return <path d={`M ${mx - 7} ${my} Q ${mx} ${my + 6} ${mx + 7} ${my}`} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />;
      case 'flat':
        return <line x1={mx - 5} y1={my + 2} x2={mx + 6} y2={my + 2} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />;
      case 'o':
        return <ellipse cx={mx} cy={my + 3} rx={4.5} ry={5.5} fill={INK} />;
      case 'open':
        return <ellipse cx={mx} cy={my + 3} rx={7} ry={6} fill={INK} />;
      case 'frown':
        return <path d={`M ${mx - 7} ${my + 5} Q ${mx} ${my - 1} ${mx + 7} ${my + 5}`} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />;
      case 'grit':
        return (
          <g>
            <rect x={mx - 8} y={my - 1} width={16} height={8} rx={2} fill="#fff" stroke={INK} strokeWidth={2.8} />
            <line x1={mx - 8} y1={my + 3} x2={mx + 8} y2={my + 3} stroke={INK} strokeWidth={2} />
          </g>
        );
      case 'zombie':
        return (
          <path
            d={`M ${mx - 8} ${my} L ${mx - 4} ${my + 3} L ${mx} ${my} L ${mx + 4} ${my + 3} L ${mx + 8} ${my} L ${mx + 7} ${my + 8} L ${mx - 7} ${my + 8} Z`}
            fill="#3a2a2a"
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        );
      default:
        return null;
    }
  })();

  const hairColor = look.hairColor ?? INK;
  const hatColor = look.hatColor ?? '#24345c';
  return (
    <g transform={`translate(${c[0]},${c[1]}) rotate(${tilt})`}>
      {look.hair === 'ponytail' && (
        <path d={`M ${-R * 0.7} ${-R * 0.5} q -26 6 -22 40 q 10 -12 24 -18 Z`} fill={hairColor} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      )}
      {look.hair === 'bun' && <circle cx={-R * 0.55} cy={-R * 0.85} r={13} fill={hairColor} stroke={INK} strokeWidth={3.5} />}
      {look.hat === 'hood' && (
        <path d={`M ${-R - 9} 6 A ${R + 10} ${R + 10} 0 1 1 ${R + 6} -6 L ${R - 2} 8 A ${R - 2} ${R - 2} 0 1 0 ${-R + 4} 16 Z`} fill={hatColor} stroke={INK} strokeWidth={4} />
      )}
      <circle cx={0} cy={0} r={R} fill={skin} stroke={INK} strokeWidth={LW} />
      {look.hair === 'messy' && (
        <path
          d={`M ${-R + 2} -12 Q -26 -40 -8 -36 Q -2 -46 10 -38 Q 24 -44 26 -30 Q 36 -26 ${R - 2} -14 Q 20 -26 6 -24 Q -10 -30 ${-R + 2} -12 Z`}
          fill={hairColor}
          stroke={INK}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
      )}
      {look.hair === 'spiky' && (
        <path
          d={`M ${-R + 4} -14 L -30 -40 L -16 -30 L -10 -48 L 0 -32 L 10 -48 L 14 -30 L 28 -42 L ${R - 4} -14 Q 0 -30 ${-R + 4} -14 Z`}
          fill={hairColor}
          stroke={INK}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
      )}
      {(look.hair === 'ponytail' || look.hair === 'bun') && (
        <path d={`M ${-R + 1} -6 Q -20 -44 10 -36 Q 30 -30 ${R - 3} -12 Q 10 -24 -4 -22 Q -20 -20 ${-R + 1} -6 Z`} fill={hairColor} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      )}
      {look.hat === 'guard' && (
        <g>
          <path d={`M ${-R - 2} -12 Q -30 -48 2 -50 Q 32 -50 ${R + 1} -14 Z`} fill={hatColor} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          {!back && !front && <path d={`M 6 -15 Q 34 -20 ${R + 22} -10 Q 36 -6 8 -9 Z`} fill="#141a2c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />}
          {front && <path d={`M ${-R - 4} -12 Q 0 -2 ${R + 4} -12 Q 0 -22 ${-R - 4} -12 Z`} fill="#141a2c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />}
          {!back && <path d={`M ${front ? 0 : 4} -40 l 5 4 l 0 7 l -5 3 l -5 -3 l 0 -7 Z`} fill="#e0b94a" stroke={INK} strokeWidth={2} />}
        </g>
      )}
      {look.hat === 'beanie' && <path d={`M ${-R} -8 Q -30 -54 4 -52 Q 34 -50 ${R} -8 Z`} fill={hatColor} stroke={INK} strokeWidth={4.5} />}
      {!back && eye(ex1, 0)}
      {!back && eye(ex2, 1)}
      {look.mustache && !back && (
        <path
          d={`M ${mx - 13} ${my - 1} Q ${mx - 8} ${my - 9} ${mx} ${my - 5} Q ${mx + 8} ${my - 9} ${mx + 13} ${my - 1} Q ${mx + 6} ${my + 1} ${mx} ${my - 1} Q ${mx - 6} ${my + 1} ${mx - 13} ${my - 1} Z`}
          fill="#3a2a22"
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      )}
      {look.beard && !back && (
        <path
          d={front ? `M ${-R * 0.8} ${R * 0.3} Q 0 ${R * 1.35} ${R * 0.8} ${R * 0.3} Q 0 ${R * 0.78} ${-R * 0.8} ${R * 0.3} Z` : `M ${-R * 0.35} ${R * 0.55} Q ${fx} ${R * 1.25} ${R * 0.95} ${R * 0.25} Q ${fx + 6} ${R * 0.7} ${fx} ${R * 0.62} Q ${fx - 8} ${R * 0.7} ${-R * 0.35} ${R * 0.55} Z`}
          fill="#2e2621"
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      )}
      {!back && !look.mustache && mouthEl}
      {!back && look.mustache && mouth !== 'none' && mouth !== 'smile' && mouth !== 'flat' && <g transform="translate(0,4)">{mouthEl}</g>}
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
  const lean = pose.lean ?? 0;
  // leg end points relative to the hip
  const kneeF = v(pose.legF[0], THIGH);
  const footF = add(kneeF, v(pose.legF[1], SHIN));
  const kneeN = v(pose.legN[0], THIGH);
  const footN = add(kneeN, v(pose.legN[1], SHIN));
  // hip height: lowest foot on the ground, or the hip itself sits on the ground
  const hipY = pose.sit ? -12 : -Math.max(footF[1], footN[1], 20);
  const hip: [number, number] = [0, hipY];
  const neck = add(hip, [Math.sin(rad(lean)) * TORSO, -Math.cos(rad(lean)) * TORSO]);
  const headC = add(neck, [Math.sin(rad(lean + (pose.head ?? 0) * 0.5)) * (R + 4), -Math.cos(rad(lean + (pose.head ?? 0) * 0.5)) * (R + 4)]);
  const shoulder = add(neck, [-Math.sin(rad(lean)) * 12, Math.cos(rad(lean)) * 12]);
  const elbowF = add(shoulder, v(pose.armF[0], UPPER));
  const handF = add(elbowF, v(pose.armF[1], FORE));
  const elbowN = add(shoulder, v(pose.armN[0], UPPER));
  const handN = add(elbowN, v(pose.armN[1], FORE));
  const kF = add(hip, kneeF);
  const fF = add(hip, footF);
  const kN = add(hip, kneeN);
  const fN = add(hip, footN);
  const footLen = 14;

  // torso shape: a trapezoid along the spine
  const dir: [number, number] = [Math.sin(rad(lean)), -Math.cos(rad(lean))];
  const perp: [number, number] = [-dir[1], dir[0]];
  const top = add(shoulder, [-dir[0] * 2, -dir[1] * 2]);
  const bot = add(hip, [dir[0] * 6, dir[1] * 6]);
  const tw = 17;
  const bw = 14;
  const p1 = add(top, [perp[0] * tw, perp[1] * tw]);
  const p2 = add(top, [-perp[0] * tw, -perp[1] * tw]);
  const p3 = add(bot, [-perp[0] * bw, -perp[1] * bw]);
  const p4 = add(bot, [perp[0] * bw, perp[1] * bw]);
  let shirtPath = `M ${p1.join(' ')} L ${p2.join(' ')} L ${p3.join(' ')} `;
  if (look.torn) {
    const n = 5;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const b = add(p3, [(p4[0] - p3[0]) * t, (p4[1] - p3[1]) * t]);
      const jag = i % 2 ? 9 : 0;
      shirtPath += `L ${b[0] - dir[0] * jag} ${b[1] - dir[1] * jag} `;
    }
  }
  shirtPath += `L ${p4.join(' ')} Z`;

  const fid = React.useMemo(() => `wob${filterId++}`, []);
  const sleeve = (el: [number, number]) => {
    const e: [number, number] = [shoulder[0] + (el[0] - shoulder[0]) * 0.5, shoulder[1] + (el[1] - shoulder[1]) * 0.5];
    return (
      <>
        <Ln a={shoulder} b={e} w={17} />
        <Ln a={shoulder} b={e} w={9.5} c={look.shirt} />
      </>
    );
  };
  const forearmAngle = (e: [number, number], hnd: [number, number]) => (Math.atan2(hnd[0] - e[0], hnd[1] - e[1]) * 180) / Math.PI;
  const inkC = ghost ? '#20232b' : INK;

  const limbsFar = (
    <g opacity={ghost ? 1 : 0.92}>
      <Poly pts={[hip, kF, fF, [fF[0] + footLen, fF[1]]]} c={inkC} />
      {look.shirt && look.sleeves && !ghost && sleeve(elbowF)}
      <Poly pts={[shoulder, elbowF, handF]} c={inkC} />
      {!ghost && <PropShape p={propF} at={handF} ang={forearmAngle(elbowF, handF)} beam={beam} />}
    </g>
  );

  return (
    <g transform={`translate(${x},${y}) scale(${s * face},${s})`} opacity={opacity}>
      {shadow > 0 && <ellipse cx={0} cy={2} rx={pose.sit ? 70 : 46} ry={9} fill="#000" opacity={shadow} />}
      <g filter={`url(#${fid})`} style={dim !== 1 ? {filter: `brightness(${dim})`} : undefined}>
        <defs>
          <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={wobble} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={4} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff7c4" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff7c4" stopOpacity={0} />
          </linearGradient>
        </defs>
        {limbsFar}
        {/* spine */}
        <Ln a={hip} b={neck} c={inkC} />
        {look.shirt && !ghost && (
          <path d={shirtPath} fill={look.shirt} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        )}
        {look.badge && !ghost && !back && (
          <path
            transform={`translate(${top[0] + dir[0] * -26 + perp[0] * 8},${top[1] + dir[1] * -26 + perp[1] * 8}) rotate(${lean})`}
            d="M 0 -7 L 6 -4 L 5 4 L 0 8 L -5 4 L -6 -4 Z"
            fill="#e0b94a"
            stroke={INK}
            strokeWidth={2.2}
          />
        )}
        {look.radioOnChest && !ghost && !back && (
          <g transform={`translate(${top[0] + dir[0] * -22 - perp[0] * 9},${top[1] + dir[1] * -22 - perp[1] * 9}) rotate(${lean})`}>
            <line x1={4} y1={-8} x2={4} y2={-24} stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <rect x={-7} y={-9} width={15} height={22} rx={3} fill="#262629" stroke={INK} strokeWidth={3} />
            <rect x={-3} y={-5} width={8} height={5} fill="#8fd18a" />
          </g>
        )}
        {look.shirt && !ghost && (
          <Ln a={add(p3, [-dir[0] * 3, -dir[1] * 3])} b={add(p4, [-dir[0] * 3, -dir[1] * 3])} w={6} c="#14161f" />
        )}
        {look.keysOnBelt && !ghost && (
          <g transform={`translate(${bot[0] + perp[0] * 10},${bot[1] + perp[1] * 10 + 6})`}>
            <circle cx={0} cy={4} r={7} fill="none" stroke="#c9a640" strokeWidth={3} />
            <rect x={-6} y={8} width={4} height={11} rx={1.5} fill="#d9b64c" stroke={INK} strokeWidth={1.8} />
            <rect x={1} y={9} width={4} height={10} rx={1.5} fill="#cfcfcf" stroke={INK} strokeWidth={1.8} />
          </g>
        )}
        <Head c={headC} tilt={pose.head ?? 0} look={ghost ? {skin: '#20232b'} : look} eyes={ghost ? 'dot' : eyes} mouth={ghost ? 'none' : mouth} gaze={look2} back={back || ghost} front={front} />
        {sweat && !ghost && (
          <path
            transform={`translate(${headC[0] - R * 0.75},${headC[1] - R * 0.35})`}
            d="M 0 -12 Q 7 0 0 6 Q -7 0 0 -12 Z"
            fill="#9fd3ff"
            stroke={INK}
            strokeWidth={2.5}
          />
        )}
        <Poly pts={[hip, kN, fN, [fN[0] + footLen, fN[1]]]} c={inkC} />
        {look.shirt && look.sleeves && !ghost && sleeve(elbowN)}
        <Poly pts={[shoulder, elbowN, handN]} c={inkC} />
        {!ghost && <PropShape p={propN} at={handN} ang={forearmAngle(elbowN, handN)} beam={beam} />}
      </g>
    </g>
  );
};
