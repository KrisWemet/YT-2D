import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {FONT} from '../thumbs/Thumbs';
import {H, Screen, Txt, W} from './Overlays';
import {FULL, World} from './World';

const INK = '#1d1a1a';
const fade = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const KeyGlyph: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = '#f0c53c'}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(-35)`}>
    <circle cx={-46} cy={0} r={34} fill="none" stroke={INK} strokeWidth={22} />
    <circle cx={-46} cy={0} r={34} fill="none" stroke={color} strokeWidth={11} />
    <path d="M -12 0 H 78 M 52 0 V 26 M 70 0 V 20" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path d="M -12 0 H 78 M 52 0 V 26 M 70 0 V 20" stroke={color} strokeWidth={11} strokeLinecap="round" />
  </g>
);

// The series title over a dark, blurred hallway.
export const SeriesTitle: React.FC<{t: number; sub?: string}> = ({t, sub}) => {
  const o = fade(t, 0, 0.25);
  const k = fade(t, 0.15, 0.6);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <World bg="concourse" cam={{...FULL, z: 1.05 + 0.03 * t}} width={W} height={H} filter="blur(7px) brightness(0.42) saturate(0.8)" />
      <Screen>
        <g opacity={o}>
          <KeyGlyph x={W / 2} y={300} s={1.1 + 0.08 * k} />
          <Txt x={W / 2} y={540} size={120}>
            THE NIGHT GUARD
          </Txt>
          <Txt x={W / 2} y={690} size={150} fill="#f0c53c">
            HAD EVERY KEY
          </Txt>
          {sub && (
            <Txt x={W / 2} y={810} size={52} fill="#cfd6e6" opacity={fade(t, 0.8, 1.2)}>
              {sub}
            </Txt>
          )}
        </g>
      </Screen>
    </AbsoluteFill>
  );
};

// Black card with one or two big lines.
export const BigCard: React.FC<{t: number; line1: string; line2?: string; color2?: string}> = ({t, line1, line2, color2 = '#ff4d3a'}) => (
  <AbsoluteFill style={{background: '#07080b'}}>
    <Screen>
      <Txt x={W / 2} y={line2 ? 470 : 590} size={170} opacity={fade(t, 0.05, 0.35)}>
        {line1}
      </Txt>
      {line2 && (
        <Txt x={W / 2} y={680} size={110} fill={color2} opacity={fade(t, 0.5, 0.9)}>
          {line2}
        </Txt>
      )}
    </Screen>
  </AbsoluteFill>
);

// Lily's crayon drawing: "MY DAD IS THE KING OF THE MALL".
const Crayon: React.FC<{d: string; c: string; w?: number}> = ({d, c, w = 11}) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
);

const KidLetters: React.FC<{text: string; x: number; y: number; size: number; colors: string[]; seed: string}> = ({text, x, y, size, colors, seed}) => {
  const step = size * 0.66;
  const x0 = x - (text.length * step) / 2;
  return (
    <g>
      {text.split('').map((ch, i) =>
        ch === ' ' ? null : (
          <text
            key={i}
            x={x0 + i * step + step / 2}
            y={y + (random(`${seed}y${i}`) - 0.5) * size * 0.18}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={size * (0.92 + random(`${seed}s${i}`) * 0.16)}
            fill={colors[i % colors.length]}
            transform={`rotate(${(random(`${seed}r${i}`) - 0.5) * 16} ${x0 + i * step + step / 2} ${y})`}
          >
            {ch}
          </text>
        ),
      )}
    </g>
  );
};

export const KidDrawing: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.035 * t;
  return (
    <AbsoluteFill style={{background: '#3a2a20'}}>
      <Screen>
        <defs>
          <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={4} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <pattern id="wood" width={240} height={40} patternUnits="userSpaceOnUse">
            <rect width={240} height={40} fill="#5a4030" />
            <path d="M 0 12 Q 60 6 120 14 T 240 10 M 0 30 Q 80 24 160 32 T 240 28" stroke="#4a3426" strokeWidth={4} fill="none" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#wood)" />
        <g transform={`translate(${W / 2},${H / 2}) scale(${z}) rotate(-2.5) translate(${-W / 2},${-H / 2})`}>
          <rect x={300} y={110} width={1320} height={860} fill="#000" opacity={0.35} transform="translate(14,18)" />
          <rect x={300} y={110} width={1320} height={860} fill="#fbf6e9" stroke="#d9cfb4" strokeWidth={4} />
          <rect x={430} y={88} width={190} height={56} fill="#e8dcb0" opacity={0.85} transform="rotate(-8 525 116)" />
          <rect x={1300} y={88} width={190} height={56} fill="#e8dcb0" opacity={0.85} transform="rotate(7 1395 116)" />
          <g filter="url(#crayon)">
            <KidLetters text="MY DAD IS THE" x={960} y={250} size={92} colors={['#d8443a', '#2f6fd0', '#3fa35b', '#e08a1a', '#8a4fc8']} seed="a" />
            <KidLetters text="KING OF THE MALL" x={960} y={370} size={100} colors={['#e08a1a', '#d8443a', '#2f6fd0', '#8a4fc8', '#3fa35b']} seed="b" />
            {/* the sun */}
            <circle cx={1500} cy={520} r={52} fill="#f6d34a" stroke="#e8a21a" strokeWidth={8} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const a = (i / 8) * Math.PI * 2;
              return <Crayon key={i} d={`M ${1500 + Math.cos(a) * 70} ${520 + Math.sin(a) * 70} L ${1500 + Math.cos(a) * 100} ${520 + Math.sin(a) * 100}`} c="#e8a21a" w={9} />;
            })}
            {/* the mall */}
            <Crayon d="M 1180 900 V 640 H 1460 V 900" c="#7a6a5a" />
            <Crayon d="M 1220 640 V 600 H 1420 V 640" c="#7a6a5a" />
            <Crayon d="M 1290 900 V 790 H 1350 V 900" c="#2f6fd0" />
            <text x={1320} y={740} textAnchor="middle" fontFamily={FONT} fontSize={54} fill="#7a6a5a">
              MALL
            </text>
            {/* dad: big head, crown, mustache, keys */}
            <circle cx={720} cy={560} r={78} fill="#fffaf0" stroke="#3a3a3a" strokeWidth={9} />
            <path d="M 650 500 L 646 410 L 690 460 L 720 395 L 752 460 L 794 410 L 790 500 Z" fill="#f6d34a" stroke="#e8a21a" strokeWidth={8} strokeLinejoin="round" />
            <circle cx={695} cy={550} r={9} fill="#3a3a3a" />
            <circle cx={748} cy={550} r={9} fill="#3a3a3a" />
            <Crayon d="M 690 588 Q 720 572 752 588" c="#5a3a22" w={14} />
            <Crayon d="M 692 606 Q 720 626 750 606" c="#d8443a" w={8} />
            <Crayon d="M 720 640 V 800" c="#2f4fa0" w={34} />
            <Crayon d="M 720 800 L 670 900 M 720 800 L 770 900" c="#3a3a3a" />
            <Crayon d="M 720 680 L 610 610 M 720 680 L 840 720" c="#3a3a3a" />
            <circle cx={858} cy={735} r={26} fill="none" stroke="#e8a21a" strokeWidth={9} />
            <Crayon d="M 870 758 L 880 800 M 852 760 L 848 804 M 838 752 L 818 790" c="#e8a21a" w={9} />
            {/* Lily holding his hand */}
            <circle cx={980} cy={700} r={52} fill="#fffaf0" stroke="#3a3a3a" strokeWidth={8} />
            <Crayon d="M 935 680 Q 900 690 905 730 M 1025 680 Q 1060 690 1055 730" c="#8a5a2a" w={12} />
            <circle cx={962} cy={694} r={7} fill="#3a3a3a" />
            <circle cx={1000} cy={694} r={7} fill="#3a3a3a" />
            <Crayon d="M 960 722 Q 980 738 1000 722" c="#d8443a" w={7} />
            <Crayon d="M 980 752 V 850" c="#e46a9a" w={28} />
            <Crayon d="M 980 850 L 950 910 M 980 850 L 1010 910" c="#3a3a3a" />
            <Crayon d="M 980 780 L 900 760 L 860 740" c="#3a3a3a" w={9} />
            {/* hearts */}
            <path d="M 560 330 c -20 -26 -60 -6 -40 24 l 40 36 l 40 -36 c 20 -30 -20 -50 -40 -24 Z" fill="#e85a8c" transform="translate(-60 120) scale(0.7)" />
            <path d="M 560 330 c -20 -26 -60 -6 -40 24 l 40 36 l 40 -36 c 20 -30 -20 -50 -40 -24 Z" fill="#d8443a" transform="translate(560 330) scale(0.55)" />
            <text x={1500} y={930} textAnchor="middle" fontFamily={FONT} fontSize={48} fill="#8a4fc8" transform="rotate(-6 1500 930)">
              LILY 7
            </text>
          </g>
        </g>
      </Screen>
    </AbsoluteFill>
  );
};
