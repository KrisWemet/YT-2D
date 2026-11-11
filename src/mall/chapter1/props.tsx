import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {FONT} from '../../thumbs/Thumbs';
import {MallMap} from '../MallMap';
import {H, NoSignal, Screen, Txt, W, Waves} from '../Overlays';
import {FULL, World} from '../World';

/* New pictures for Chapter 1, 16:9. Full-frame cards draw in screen px (1920x1080); props meant to
   sit inside a scene (helicopter, bedsheet, cart...) draw in picture px around their own origin. */

const INK = '#1d1a1a';
const GOLD = '#f0c53c';
const RED = '#e0433a';
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const fade = (t: number, a: number, len = 0.25) => clamp01((t - a) / len);
const pop = (t: number, at: number) => interpolate(t - at, [0, 0.12, 0.22], [0, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/* ---------------- title and end cards ---------------- */

const KeyGlyph: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(-35)`}>
    <circle cx={-46} cy={0} r={34} fill="none" stroke={INK} strokeWidth={22} />
    <circle cx={-46} cy={0} r={34} fill="none" stroke={GOLD} strokeWidth={11} />
    <path d="M -12 0 H 78 M 52 0 V 26 M 70 0 V 20" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path d="M -12 0 H 78 M 52 0 V 26 M 70 0 V 20" stroke={GOLD} strokeWidth={11} strokeLinecap="round" />
  </g>
);

export const ChapterTitle: React.FC<{t: number}> = ({t}) => {
  const o = fade(t, 0, 0.3);
  const k = fade(t, 0.2, 0.6);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <World bg="concourse" cam={{...FULL, z: 1.05 + 0.03 * t}} width={W} height={H} filter="blur(7px) brightness(0.4) saturate(0.8)" />
      <Screen>
        <g opacity={o}>
          <KeyGlyph x={W / 2} y={290} s={1.05 + 0.06 * k} />
          <Txt x={W / 2} y={520} size={126}>
            THE NIGHT GUARD
          </Txt>
          <g opacity={k}>
            <Txt x={W / 2} y={630} size={58} fill="#cfd6e6">
              CHAPTER ONE
            </Txt>
            <Txt x={W / 2} y={770} size={130} fill={GOLD}>
              THE KING OF THE MALL
            </Txt>
          </g>
        </g>
      </Screen>
    </AbsoluteFill>
  );
};

export const ChapterEnd: React.FC<{t: number}> = ({t}) => {
  const o = fade(t, 0, 0.5);
  const k = fade(t, 0.6, 0.5);
  const s = fade(t, 1.6, 0.5);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <World bg="parkview" cam={{x: 1000, y: 420, z: 1.6 + 0.02 * t}} width={W} height={H} filter="blur(5px) brightness(0.28) saturate(0.7)" />
      <Screen>
        <g opacity={o}>
          <Txt x={W / 2} y={300} size={70} fill="#cfd6e6">
            THE NIGHT GUARD
          </Txt>
          <g opacity={k}>
            <Txt x={W / 2} y={430} size={60} fill={GOLD}>
              NEXT: CHAPTER TWO
            </Txt>
            <Txt x={W / 2} y={570} size={128}>
              THE BOY IN THE CEILING
            </Txt>
          </g>
          <g opacity={s}>
            <rect x={W / 2 - 330} y={680} width={660} height={96} rx={48} fill={RED} stroke={INK} strokeWidth={6} />
            <Txt x={W / 2} y={748} size={56}>
              SUBSCRIBE
            </Txt>
            <text x={W / 2} y={850} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill="#cfd6e6" letterSpacing="0.05em">
              so you don't miss what's in the window
            </text>
          </g>
        </g>
      </Screen>
    </AbsoluteFill>
  );
};

/* ---------------- close-up cards ---------------- */

// The key ring: one key with a red B3 tag. glowAt makes the tag glow; tagBig zooms toward it; shake shakes it.
export const KeyRing16: React.FC<{t: number; glowAt?: number; tagBig?: number; shake?: number; tag?: string}> = ({t, glowAt = 1e9, tagBig = 0, shake = 0, tag = 'B3'}) => {
  const swing = Math.sin(t * 1.6) * 3 + (shake ? Math.sin(t * 47) * 4 * shake : 0);
  const dx = shake ? Math.sin(t * 39) * 9 * shake : 0;
  const glow = t >= glowAt ? 0.5 + 0.5 * Math.sin((t - glowAt) * 7) : 0;
  const keys = [-62, -46, -31, -16, -2, 12, 27, 42, 57];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #2c3446 0%, #10141c 70%)'}}>
      <Screen>
        <g transform={`translate(${W / 2 + dx - tagBig * 260}, ${330 - tagBig * 170}) scale(${1.05 + tagBig * 0.6}) rotate(${swing})`}>
          <circle cx={0} cy={0} r={96} fill="none" stroke="#c9ccd2" strokeWidth={16} />
          <circle cx={0} cy={0} r={96} fill="none" stroke={INK} strokeWidth={4} />
          {keys.map((a, i) => {
            const last = i === keys.length - 1;
            const c = last ? '#b9bec7' : i % 2 === 0 ? '#d9b44a' : '#c8ccd4';
            return (
              <g key={i} transform={`rotate(${a}) translate(0, 96)`}>
                <circle cx={0} cy={44} r={30} fill={c} stroke={INK} strokeWidth={6} />
                <circle cx={0} cy={44} r={9} fill="#10141c" stroke={INK} strokeWidth={3} />
                <rect x={-10} y={70} width={20} height={190} fill={c} stroke={INK} strokeWidth={6} />
                <path d="M 10 190 h 22 v 16 h -12 v 14 h 10 v 16 h -20" fill={c} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
                {last && (
                  <g>
                    {glow > 0 && <circle cx={0} cy={150} r={120} fill="#ffd36b" opacity={0.18 * glow} />}
                    <path d="M 0 60 C 40 90 70 100 86 130" stroke="#e9e2cf" strokeWidth={4} fill="none" />
                    <g transform="translate(86, 130) rotate(-20)">
                      <rect x={-6} y={0} width={84} height={56} rx={10} fill="#c8332f" stroke={INK} strokeWidth={6} />
                      <circle cx={8} cy={28} r={6} fill="#10141c" />
                      <text x={46} y={42} textAnchor="middle" fontFamily={FONT} fontSize={38} fill="#fff6e0">
                        {tag}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </Screen>
    </AbsoluteFill>
  );
};

// One key held in a hand, close (the key to the gate).
export const KeyInHand: React.FC<{t: number; shake?: number; tag?: string}> = ({t, shake = 0, tag = '31'}) => {
  const dx = Math.sin(t * 41) * 7 * shake;
  const dy = Math.cos(t * 37) * 5 * shake;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #252b3a 0%, #090b10 75%)'}}>
      <Screen>
        <g transform={`translate(${W / 2 + dx}, ${560 + dy}) scale(${2.2 + 0.05 * t}) rotate(-24)`}>
          <circle cx={-120} cy={0} r={48} fill="#d9b44a" stroke={INK} strokeWidth={8} />
          <circle cx={-120} cy={0} r={14} fill="#090b10" stroke={INK} strokeWidth={4} />
          <rect x={-74} y={-14} width={200} height={28} fill="#d9b44a" stroke={INK} strokeWidth={8} />
          <path d="M 70 14 v 26 h 14 v -14 h 14 v 22 h 14 v -34" fill="#d9b44a" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <g transform="translate(-150, 40) rotate(28)">
            <rect x={-30} y={0} width={60} height={42} rx={8} fill="#e9e2cf" stroke={INK} strokeWidth={5} />
            <text x={0} y={32} textAnchor="middle" fontFamily={FONT} fontSize={30} fill={INK}>
              {tag}
            </text>
          </g>
        </g>
      </Screen>
    </AbsoluteFill>
  );
};

// A steel door in the dark, stencilled B3.
export const B3Door16: React.FC<{t: number; dur: number; frame: number}> = ({t, dur, frame}) => {
  const z = 1 + 0.08 * clamp01(t / Math.max(dur, 0.1));
  const flick = random(`bulb${Math.floor(frame / 3)}`) > 0.86 ? 0.35 : 1;
  return (
    <AbsoluteFill style={{background: '#07080b', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '50% 45%'}}>
        <Screen>
          <defs>
            <radialGradient id="b3l16" cx="50%" cy="12%" r="70%">
              <stop offset="0%" stopColor="#f2d38a" stopOpacity={0.5 * flick} />
              <stop offset="100%" stopColor="#f2d38a" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={W} height={H} fill="#1d2025" />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={0} y1={140 + i * 180} x2={W} y2={140 + i * 180} stroke="#0e1013" strokeWidth={4} opacity={0.6} />
          ))}
          <rect x={0} y={900} width={W} height={180} fill="#101114" />
          <rect x={700} y={180} width={520} height={724} fill="#3a4048" stroke={INK} strokeWidth={12} />
          <rect x={728} y={208} width={464} height={668} fill="#454c55" stroke="#2a2f35" strokeWidth={6} />
          <rect x={750} y={560} width={420} height={30} rx={8} fill="#2a2f35" stroke={INK} strokeWidth={5} />
          <text x={W / 2} y={470} textAnchor="middle" fontFamily={FONT} fontSize={230} fill="#d9b44a" opacity={0.78} letterSpacing="0.08em">
            B3
          </text>
          <rect x={700} y={900} width={520} height={8} fill="#f2d38a" opacity={0.35 * flick} />
          <line x1={W / 2} y1={0} x2={W / 2} y2={70} stroke="#1a1c20" strokeWidth={8} />
          <circle cx={W / 2} cy={100} r={30} fill="#f6e2a6" opacity={flick} />
          <rect x={0} y={0} width={W} height={H} fill="url(#b3l16)" />
        </Screen>
      </div>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
    </AbsoluteFill>
  );
};

// The mall map with something on top: a stamp ("NO B3") or arrows converging on the food court.
export const MapCard: React.FC<{t: number; dur: number; stamp?: string; stampAt?: number; arrows?: boolean; mode?: 'keys' | 'pick' | 'loop' | 'route' | 'all' | 'plain'}> = ({
  t,
  dur,
  stamp,
  stampAt = 0.4,
  arrows,
  mode = 'keys',
}) => {
  const k = interpolate(t - stampAt, [0, 0.12, 0.22], [2.2, 0.95, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const a = clamp01(t / 1.2);
  return (
    <AbsoluteFill style={{background: '#10141c'}}>
      <MallMap mode={mode} t={t} dur={dur} />
      <Screen>
        {arrows && (
          <g>
            <rect x={1400} y={230} width={250} height={670} fill={RED} opacity={0.25 + 0.2 * Math.sin(t * 6)} />
            {[
              [1880, 300],
              [1880, 820],
              [1525, 1040],
              [1525, 110],
              [1200, 980],
              [1200, 140],
            ].map(([x, y], i) => {
              const tx = 1525;
              const ty = 565;
              const len = Math.hypot(tx - x, ty - y);
              const k = Math.min(1, a) * 0.62;
              const x1 = x + (tx - x) * k;
              const y1 = y + (ty - y) * k;
              const ang = (Math.atan2(ty - y, tx - x) * 180) / Math.PI;
              return (
                <g key={i} opacity={len > 0 ? 1 : 0}>
                  <line x1={x} y1={y} x2={x1} y2={y1} stroke={INK} strokeWidth={30} strokeLinecap="round" />
                  <line x1={x} y1={y} x2={x1} y2={y1} stroke={RED} strokeWidth={16} strokeLinecap="round" />
                  <path transform={`translate(${x1},${y1}) rotate(${ang})`} d="M 26 0 L -18 -24 L -18 24 Z" fill={RED} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
                </g>
              );
            })}
          </g>
        )}
        {stamp && t >= stampAt && (
          <g transform={`translate(${W / 2}, ${H / 2 + 40}) rotate(-8) scale(${k})`} opacity={0.95}>
            <rect x={-280} y={-100} width={560} height={160} rx={18} fill="#10141c" opacity={0.6} />
            <rect x={-280} y={-100} width={560} height={160} rx={18} fill="none" stroke={RED} strokeWidth={16} />
            <text x={0} y={26} textAnchor="middle" fontFamily={FONT} fontSize={110} fill={RED} letterSpacing="0.06em">
              {stamp}
            </text>
          </g>
        )}
      </Screen>
    </AbsoluteFill>
  );
};

// A walkie-talkie in close-up. state: on (talking), crackle, off, nosignal, bag (glowing inside a sleeping bag).
export const RadioCard: React.FC<{t: number; frame: number; state: 'on' | 'crackle' | 'off' | 'nosignal' | 'bag'; offAt?: number; label?: string; clipUpside?: boolean}> = ({
  t,
  frame,
  state,
  offAt = 1e9,
  label,
  clipUpside,
}) => {
  const lit = state !== 'off' && t < offAt;
  const z = 1 + 0.03 * t;
  const bag = state === 'bag';
  const noise = state === 'crackle' ? random(`rc${Math.floor(frame / 2)}`) : 0;
  return (
    <AbsoluteFill style={{background: bag ? '#141018' : 'radial-gradient(ellipse at 50% 50%, #2a3140 0%, #0b0d12 75%)'}}>
      <Screen>
        <g transform={`translate(${W / 2}, ${H / 2 + 30}) scale(${z})`}>
          {bag && (
            <g>
              <path d="M -760 -380 Q -200 -460 380 -360 Q 820 -280 760 380 L -760 380 Z" fill="#3c5a3a" stroke={INK} strokeWidth={10} />
              {[-500, -250, 0, 250, 500].map((x) => (
                <path key={x} d={`M ${x} -400 Q ${x + 40} 0 ${x - 20} 380`} stroke="#2c442b" strokeWidth={8} fill="none" />
              ))}
              {lit && <ellipse cx={0} cy={20} rx={260} ry={190} fill="#8fd18a" opacity={0.18 + 0.08 * Math.sin(t * 9)} />}
            </g>
          )}
          <g opacity={bag ? 0.55 : 1} transform={bag ? 'scale(0.7)' : undefined}>
            <rect x={40} y={-330} width={34} height={190} rx={14} fill="#26272b" stroke={INK} strokeWidth={8} />
            <rect x={-130} y={-170} width={260} height={420} rx={36} fill="#2c2d32" stroke={INK} strokeWidth={10} />
            <rect x={-96} y={-130} width={192} height={110} rx={10} fill={lit ? '#8fd18a' : '#22301f'} stroke={INK} strokeWidth={6} />
            {lit && state !== 'nosignal' && (
              <g>
                {new Array(9).fill(0).map((_, i) => {
                  const h = state === 'crackle' ? 10 + noise * 60 * random(`b${i}${frame}`) : 12 + Math.abs(Math.sin(t * 13 + i * 1.7) * Math.sin(t * 5.3 + i)) * 70;
                  return <rect key={i} x={-82 + i * 20} y={-75 - h / 2} width={11} height={h} rx={4} fill="#1f3a1d" />;
                })}
              </g>
            )}
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1={-80} y1={30 + i * 34} x2={80} y2={30 + i * 34} stroke="#1a1b1f" strokeWidth={14} strokeLinecap="round" />
            ))}
            <circle cx={90} cy={-196} r={14} fill={lit ? '#ff5a3a' : '#3a1a14'} stroke={INK} strokeWidth={5} />
            <rect x={-150} y={-60} width={24} height={110} rx={8} fill="#3a3b40" stroke={INK} strokeWidth={6} />
            {clipUpside !== undefined && (
              <g transform={`translate(0, ${clipUpside ? -230 : 270}) ${clipUpside ? 'rotate(180)' : ''}`}>
                <rect x={-60} y={-20} width={120} height={50} rx={10} fill="#1a1b1f" stroke={INK} strokeWidth={7} />
                <rect x={-40} y={-40} width={80} height={30} rx={8} fill="#1a1b1f" stroke={INK} strokeWidth={7} />
              </g>
            )}
          </g>
          {lit && (state === 'on' || state === 'bag') && <Waves x={bag ? 140 : 190} y={-90} t={t} size={bag ? 70 : 110} />}
          {state === 'crackle' && lit && (
            <g opacity={0.5}>
              {new Array(14).fill(0).map((_, i) => (
                <line key={i} x1={-500 + random(`cx${i}${Math.floor(frame / 2)}`) * 1000} y1={-300 + i * 45} x2={-300 + random(`cy${i}${Math.floor(frame / 2)}`) * 900} y2={-300 + i * 45} stroke="#cfd6e6" strokeWidth={3} />
              ))}
            </g>
          )}
        </g>
        {state === 'nosignal' && <NoSignal t={t} at={0.15} />}
        {label && (
          <Txt x={W / 2} y={150} size={64} fill={GOLD}>
            {label}
          </Txt>
        )}
      </Screen>
    </AbsoluteFill>
  );
};

// A phone in close-up. mode: calling (then voicemail at vmAt), log (ten missed calls), notify (lock screen
// notification), text (a message), reply (a typed reply, then Delivered at okAt, then the bars drop at barsAt).
export const PhoneCard: React.FC<{
  t: number;
  mode: 'calling' | 'log' | 'notify' | 'text' | 'reply';
  vmAt?: number;
  okAt?: number;
  barsAt?: number;
  hl?: boolean; // highlight NOT in the text
}> = ({t, mode, vmAt = 1e9, okAt = 1e9, barsAt = 1e9, hl}) => {
  const z = 1 + 0.025 * t;
  const bars = t < barsAt ? 4 : Math.max(0, 4 - Math.floor((t - barsAt) / 0.25));
  const buzz = mode === 'notify' && t < 0.8 ? Math.sin(t * 90) * 5 : 0;
  const sx = W / 2;
  const top = 90;
  const inner = (x0: number, y0: number) => {
    if (mode === 'calling')
      return (
        <g>
          <circle cx={x0 + 230} cy={y0 + 260} r={90} fill="#5a6f9a" stroke={INK} strokeWidth={6} />
          <text x={x0 + 230} y={y0 + 290} textAnchor="middle" fontFamily={FONT} fontSize={86} fill="#fff">
            M
          </text>
          <Txt x={x0 + 230} y={y0 + 450} size={74}>
            MOM
          </Txt>
          <text x={x0 + 230} y={y0 + 520} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontSize={34} fill={t < vmAt ? '#cfd6e6' : RED} fontWeight={700}>
            {t < vmAt ? 'calling…' : 'VOICEMAIL'}
          </text>
          <circle cx={x0 + 230} cy={y0 + 700} r={52} fill="#e0433a" stroke={INK} strokeWidth={6} />
          <path d={`M ${x0 + 200} ${y0 + 702} q 30 -24 60 0`} stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" />
        </g>
      );
    if (mode === 'log')
      return (
        <g>
          <text x={x0 + 40} y={y0 + 130} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={36} fill="#cfd6e6">
            Recents
          </text>
          {new Array(10).fill(0).map((_, i) => (
            <g key={i} opacity={fade(t, 0.05 + i * 0.12, 0.1)}>
              <text x={x0 + 40} y={y0 + 200 + i * 62} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill={RED}>
                Mom
              </text>
              <text x={x0 + 420} y={y0 + 200 + i * 62} textAnchor="end" fontFamily="DejaVu Sans, sans-serif" fontSize={28} fill="#8a93a8">
                {`1:${42 + Math.floor(i / 3)} AM`}
              </text>
              <line x1={x0 + 40} y1={y0 + 218 + i * 62} x2={x0 + 420} y2={y0 + 218 + i * 62} stroke="#2a3040" strokeWidth={2} />
            </g>
          ))}
        </g>
      );
    if (mode === 'notify')
      return (
        <g>
          <text x={x0 + 230} y={y0 + 230} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={300} fontSize={120} fill="#eef1f6">
            6:58
          </text>
          <g transform={`translate(${x0 + 30}, ${y0 + 330})`} opacity={fade(t, 0.15, 0.2)}>
            <rect x={0} y={0} width={400} height={150} rx={26} fill="#eef1f6" opacity={0.92} />
            <text x={24} y={50} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={28} fill="#333">
              MOM · 2:14 AM
            </text>
            <text x={24} y={100} fontFamily="DejaVu Sans, sans-serif" fontSize={28} fill="#333">
              1 new message
            </text>
          </g>
        </g>
      );
    if (mode === 'text')
      return (
        <g>
          <text x={x0 + 230} y={y0 + 110} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill="#cfd6e6">
            Mom
          </text>
          <g opacity={fade(t, 0.1, 0.2)}>
            <rect x={x0 + 30} y={y0 + 180} width={380} height={300} rx={34} fill="#3a3f4c" />
            {['Lily is with me.', 'Door locked.', 'Do NOT come.'].map((l, i) => (
              <text key={i} x={x0 + 62} y={y0 + 260 + i * 80} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={42} fill="#eef1f6">
                {l}
              </text>
            ))}
            {hl && <rect x={x0 + 150} y={y0 + 375} width={116} height={64} rx={10} fill="none" stroke={RED} strokeWidth={7} />}
            <text x={x0 + 40} y={y0 + 520} fontFamily="DejaVu Sans, sans-serif" fontSize={24} fill="#8a93a8">
              2:14 AM
            </text>
          </g>
        </g>
      );
    // reply
    // typed out letter by letter, wrapped at word boundaries
    const wrapped = ['Stay put. I love', 'you. Tell Lily', 'the king’s still', 'in his castle.'];
    const total = wrapped.reduce((k, l) => k + l.length + 1, 0);
    let n = Math.floor(clamp01(t / 2.2) * total);
    const lines = wrapped.map((l) => {
      const shown = l.slice(0, Math.max(0, n));
      n -= l.length + 1;
      return shown;
    });
    return (
      <g>
        <text x={x0 + 230} y={y0 + 110} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill="#cfd6e6">
          Mom
        </text>
        <rect x={x0 + 60} y={y0 + 180} width={360} height={290} rx={34} fill="#3d7ae0" />
        {lines.map((l, i) => (
          <text key={i} x={x0 + 90} y={y0 + 250 + i * 60} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={36} fill="#fff">
            {l}
          </text>
        ))}
        {t >= okAt && (
          <text x={x0 + 410} y={y0 + 510} textAnchor="end" fontFamily="DejaVu Sans, sans-serif" fontSize={26} fill="#8a93a8">
            Delivered
          </text>
        )}
        {bars === 0 && (
          <text x={x0 + 230} y={y0 + 640} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill={RED}>
            No Service
          </text>
        )}
      </g>
    );
  };
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #263042 0%, #0a0c11 75%)'}}>
      <Screen>
        <g transform={`translate(${sx + buzz}, ${top}) scale(${z}) translate(${-sx}, ${-top})`}>
          <rect x={sx - 250} y={top} width={500} height={900} rx={64} fill="#111318" stroke={INK} strokeWidth={10} />
          <rect x={sx - 230} y={top + 20} width={460} height={860} rx={50} fill="#1b1f2a" />
          <rect x={sx - 60} y={top + 34} width={120} height={26} rx={13} fill="#0b0c10" />
          {/* signal bars */}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={sx + 130 + i * 18} y={top + 66 - i * 8} width={12} height={14 + i * 8} rx={2} fill={i < bars ? '#eef1f6' : '#3a4050'} />
          ))}
          {inner(sx - 230, top + 20)}
        </g>
      </Screen>
    </AbsoluteFill>
  );
};

// An emergency-alert screen.
export const AlertCard: React.FC<{t: number; line2At?: number}> = ({t, line2At = 1e9}) => {
  const blink = Math.floor(t * 2.5) % 2 === 0;
  return (
    <AbsoluteFill style={{background: '#0b0d12'}}>
      <Screen>
        <rect x={0} y={0} width={W} height={150} fill={blink ? '#c8332f' : '#8e231f'} />
        <text x={W / 2} y={100} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={64} fill="#fff" letterSpacing="0.1em">
          EMERGENCY ALERT
        </text>
        <Txt x={W / 2} y={470} size={130}>
          SHELTER IN PLACE
        </Txt>
        <g opacity={fade(t, line2At, 0.3)}>
          <Txt x={W / 2} y={680} size={96} fill={GOLD}>
            RESCUE WITHIN 30 DAYS
          </Txt>
        </g>
        <rect x={0} y={150} width={W} height={80} fill="#1d2230" />
        <text x={W / 2 + 300 - ((t * 200) % 600)} y={204} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={36} fill="#cfd6e6">
          STAY INDOORS · AVOID CONTACT · STAY TUNED
        </text>
      </Screen>
    </AbsoluteFill>
  );
};

// A plain card: a few lines appearing one by one (rules, lists, day counters).
export const ListCard: React.FC<{t: number; title?: string; lines: string[]; at?: number[]; color?: string; paper?: boolean}> = ({t, title, lines, at, color = GOLD, paper}) => (
  <AbsoluteFill style={{background: paper ? '#3a2a20' : '#0b0d12'}}>
    <Screen>
      {paper && (
        <g transform={`translate(${W / 2}, ${H / 2}) rotate(-2) translate(${-W / 2}, ${-H / 2})`}>
          <rect x={430} y={80} width={1060} height={920} fill="#000" opacity={0.3} transform="translate(12,16)" />
          <rect x={430} y={80} width={1060} height={920} fill="#f7f1dc" stroke="#d9cfb4" strokeWidth={4} />
        </g>
      )}
      {title &&
        (paper ? (
          <text x={W / 2} y={210} textAnchor="middle" fontFamily={FONT} fontSize={80} fill="#c8332f">
            {title}
          </text>
        ) : (
          <Txt x={W / 2} y={230} size={96} fill={color}>
            {title}
          </Txt>
        ))}
      {lines.map((l, i) => {
        const a = at ? at[i] : 0.25 + i * 0.35;
        const k = pop(t, a);
        if (k <= 0) return null;
        const y = (title ? (paper ? 330 : 400) : 380) + i * (paper ? 105 : 130);
        return (
          <g key={i} transform={`translate(${W / 2}, ${y}) scale(${k}) translate(${-W / 2}, ${-y})`}>
            {paper ? (
              <text x={540} y={y} fontFamily={FONT} fontSize={62} fill="#2f4475">
                {l}
              </text>
            ) : (
              <Txt x={W / 2} y={y} size={lines.length > 3 ? 76 : 96}>
                {l}
              </Txt>
            )}
          </g>
        );
      })}
    </Screen>
  </AbsoluteFill>
);

// Two countdowns side by side: rescue vs insulin.
export const TwoClocks: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#0b0d12'}}>
    <Screen>
      {[
        ['RESCUE', '30', '#cfd6e6', 520, 0.1],
        ['INSULIN', '10', RED, 1400, 0.7],
      ].map(([label, n, c, x, a]) => (
        <g key={label as string} opacity={fade(t, a as number, 0.25)}>
          <Txt x={x as number} y={330} size={80} fill={c as string}>
            {label as string}
          </Txt>
          <Txt x={x as number} y={640} size={300} fill={c as string}>
            {n as string}
          </Txt>
          <Txt x={x as number} y={770} size={80} fill={c as string}>
            DAYS
          </Txt>
        </g>
      ))}
      <Txt x={W / 2} y={560} size={90} fill="#5a6274">
        VS
      </Txt>
    </Screen>
  </AbsoluteFill>
);

// A TV news lower third over a dim scene (the funny story he imagines).
export const NewsCard: React.FC<{t: number; headline: string}> = ({t, headline}) => (
  <AbsoluteFill>
    <World bg="sportsinside" cam={{x: 1300, y: 900, z: 1.6 + 0.02 * t}} width={W} height={H} filter="brightness(0.9) saturate(1.1)" />
    <Screen>
      <g opacity={fade(t, 0.1, 0.25)}>
        <rect x={0} y={770} width={W} height={170} fill="#0d2a5c" />
        <rect x={0} y={770} width={330} height={170} fill="#c8332f" />
        <text x={165} y={872} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={52} fill="#fff">
          LOCAL
        </text>
        <text x={370} y={880} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={58} fill="#fff">
          {headline}
        </text>
      </g>
    </Screen>
  </AbsoluteFill>
);

// Napkin doodle: the zombie plan.
export const NapkinPlan: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#4a3426'}}>
    <Screen>
      <g transform={`translate(${W / 2}, ${H / 2}) rotate(3) scale(${1 + 0.03 * t}) translate(${-W / 2}, ${-H / 2})`}>
        <rect x={560} y={150} width={800} height={780} fill="#000" opacity={0.3} transform="translate(12,16)" />
        <rect x={560} y={150} width={800} height={780} fill="#f4f1ea" stroke="#d6d0c4" strokeWidth={4} />
        <path d="M 560 150 L 1360 930 M 1360 150 L 560 930" stroke="#e6e0d4" strokeWidth={3} />
        <text x={960} y={290} textAnchor="middle" fontFamily={FONT} fontSize={74} fill="#2f4475">
          ZOMBIE PLAN
        </text>
        {['1. SUMMIT OUTDOORS', '2. LOCK THE GATE', "3. DON'T DIE"].map((l, i) => (
          <text key={l} x={640} y={450 + i * 130} fontFamily={FONT} fontSize={62} fill="#2f4475" opacity={fade(t, 0.2 + i * 0.3, 0.15)}>
            {l}
          </text>
        ))}
        <ellipse cx={905} cy={428} rx={300} ry={64} fill="none" stroke={RED} strokeWidth={8} opacity={fade(t, 0.5, 0.2)} />
      </g>
    </Screen>
  </AbsoluteFill>
);

// Polaroid memories over a dark wall: up to three, sliding in at the given times.
export const Polaroids: React.FC<{t: number; at: number[]; children: React.ReactNode[]}> = ({t, at, children}) => (
  <AbsoluteFill style={{background: '#16121a'}}>
    <Screen>
      {children.map((c, i) => {
        const k = clamp01((t - at[i]) / 0.3);
        if (k <= 0) return null;
        const x = 360 + i * 600;
        const rot = [-6, 4, -3][i % 3];
        return (
          <g key={i} transform={`translate(${x}, ${540 + (1 - k) * 600}) rotate(${rot})`}>
            <rect x={-250} y={-280} width={500} height={560} fill="#000" opacity={0.35} transform="translate(10,14)" />
            <rect x={-250} y={-280} width={500} height={560} fill="#f4f1ea" />
            <g transform="translate(-220, -250)">
              <svg x={0} y={0} width={440} height={420} viewBox="0 0 440 420" style={{overflow: 'hidden'}}>
                <rect width={440} height={420} fill="#2a2a30" />
                <g style={{filter: 'sepia(0.55) saturate(1.1)'}}>{c}</g>
              </svg>
            </g>
          </g>
        );
      })}
    </Screen>
  </AbsoluteFill>
);

/* ---------------- props that sit inside a scene (picture px, drawn around their own origin) ---------------- */

export const Helicopter: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={60} ry={28} fill="#2f3a46" stroke={INK} strokeWidth={6} />
    <rect x={40} y={-8} width={110} height={14} rx={6} fill="#2f3a46" stroke={INK} strokeWidth={5} />
    <rect x={140} y={-30} width={14} height={40} rx={4} fill="#2f3a46" stroke={INK} strokeWidth={4} />
    <ellipse cx={-26} cy={-4} rx={22} ry={14} fill="#9fc2d8" stroke={INK} strokeWidth={4} />
    <line x1={-30} y1={34} x2={40} y2={34} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <line x1={0} y1={-28} x2={0} y2={-40} stroke={INK} strokeWidth={6} />
    <ellipse cx={0} cy={-42} rx={Math.abs(Math.cos(t * 40)) * 110 + 10} ry={5} fill={INK} opacity={0.7} />
  </g>
);

export const HelpSheet: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  const wave = Math.sin(t * 3) * 6;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={`M -150 -60 Q 0 ${-70 + wave} 150 -60 L 150 60 Q 0 ${50 - wave} -150 60 Z`} fill="#f2efe6" stroke={INK} strokeWidth={6} />
      <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontSize={88} fill="#c8332f">
        HELP
      </text>
    </g>
  );
};

export const CleanerCart: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-70} y={-110} width={140} height={90} rx={8} fill="#e0b94a" stroke={INK} strokeWidth={6} />
    <rect x={-60} y={-160} width={36} height={50} fill="#5bc0de" stroke={INK} strokeWidth={5} />
    <rect x={-14} y={-150} width={30} height={40} fill="#f0f0f0" stroke={INK} strokeWidth={5} />
    <line x1={50} y1={-110} x2={70} y2={-230} stroke="#9a9a9a" strokeWidth={8} />
    <rect x={-80} y={-20} width={160} height={14} fill="#555" stroke={INK} strokeWidth={4} />
    <circle cx={-56} cy={0} r={12} fill="#333" stroke={INK} strokeWidth={4} />
    <circle cx={56} cy={0} r={12} fill="#333" stroke={INK} strokeWidth={4} />
  </g>
);

export const CardboardBear: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M -70 0 L -80 -160 Q -100 -230 -40 -250 Q -60 -300 -20 -310 Q 0 -340 20 -310 Q 60 -300 40 -250 Q 100 -230 80 -160 L 70 0 Z" fill="#7a4e2c" stroke={INK} strokeWidth={6} />
    <circle cx={-46} cy={-312} r={18} fill="#7a4e2c" stroke={INK} strokeWidth={5} />
    <circle cx={46} cy={-312} r={18} fill="#7a4e2c" stroke={INK} strokeWidth={5} />
    <circle cx={-14} cy={-282} r={5} fill={INK} />
    <circle cx={14} cy={-282} r={5} fill={INK} />
    <ellipse cx={0} cy={-262} rx={14} ry={9} fill="#c49a6c" stroke={INK} strokeWidth={3} />
    <path d="M -80 -160 L -150 -230 M 80 -160 L 150 -230" stroke="#7a4e2c" strokeWidth={30} strokeLinecap="round" />
    <rect x={-60} y={-120} width={120} height={60} rx={6} fill="#e9dcc0" stroke={INK} strokeWidth={4} />
    <text x={0} y={-80} textAnchor="middle" fontFamily={FONT} fontSize={30} fill="#3a5a2c">
      CAMP!
    </text>
  </g>
);

export const CrankRadio: React.FC<{x: number; y: number; s: number; t: number; lit?: boolean}> = ({x, y, s, t, lit = true}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-90} y={-70} width={180} height={120} rx={20} fill="#d8682a" stroke={INK} strokeWidth={6} />
    <rect x={-70} y={-50} width={90} height={40} rx={6} fill={lit ? '#f6d985' : '#5a4a2a'} stroke={INK} strokeWidth={4} />
    <circle cx={50} cy={-20} r={18} fill="#2a2a2e" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={-70} y1={12 + i * 10} x2={20} y2={12 + i * 10} stroke="#7a3a14" strokeWidth={5} />
    ))}
    <g transform={`translate(90, 20) rotate(${t * 400})`}>
      <line x1={0} y1={0} x2={0} y2={-46} stroke="#2a2a2e" strokeWidth={8} strokeLinecap="round" />
      <circle cx={0} cy={-46} r={8} fill="#2a2a2e" />
    </g>
    <line x1={-60} y1={-70} x2={-110} y2={-170} stroke="#9a9a9a" strokeWidth={6} />
  </g>
);

export const Raccoon: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={-30} rx={60} ry={34} fill="#8a8a8a" stroke={INK} strokeWidth={6} />
    <path d="M -56 -40 Q -110 -60 -120 -20 Q -100 0 -60 -24" fill="#8a8a8a" stroke={INK} strokeWidth={5} />
    {[-108, -92, -76].map((x0) => (
      <line key={x0} x1={x0} y1={-48} x2={x0 + 6} y2={-14} stroke={INK} strokeWidth={6} />
    ))}
    <circle cx={52} cy={-58} r={30} fill="#9a9a9a" stroke={INK} strokeWidth={6} />
    <path d="M 30 -64 Q 52 -54 76 -64 L 76 -50 Q 52 -42 30 -50 Z" fill={INK} />
    <circle cx={44} cy={-58} r={4} fill="#fff" />
    <circle cx={62} cy={-58} r={4} fill="#fff" />
    <path d="M 34 -84 L 40 -100 L 48 -86 M 58 -86 L 66 -100 L 70 -84" fill="#9a9a9a" stroke={INK} strokeWidth={4} />
    <circle cx={80} cy={-50} r={5} fill={INK} />
    <path d="M -30 0 v 12 M 30 0 v 12" stroke={INK} strokeWidth={8} strokeLinecap="round" />
  </g>
);

export const SleepingBag: React.FC<{x: number; y: number; s: number; rot?: number; glow?: number}> = ({x, y, s, rot = 0, glow = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -150 -40 Q -160 -70 -120 -70 L 140 -60 Q 170 -55 170 -20 L 170 30 Q 170 60 140 62 L -120 66 Q -160 66 -150 30 Z" fill="#3c6a42" stroke={INK} strokeWidth={6} />
    <path d="M -80 -66 L -80 64 M 0 -64 L 0 64 M 80 -62 L 80 62" stroke="#2c4e30" strokeWidth={5} />
    {glow > 0 && <ellipse cx={20} cy={0} rx={90} ry={40} fill="#8fd18a" opacity={0.35 * glow} />}
  </g>
);

export const InsulinPen: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) rotate(-20) scale(${s})`}>
    <rect x={-180} y={-26} width={300} height={52} rx={22} fill="#e9edf3" stroke={INK} strokeWidth={6} />
    <rect x={120} y={-20} width={70} height={40} rx={10} fill="#3d7ae0" stroke={INK} strokeWidth={6} />
    <rect x={-100} y={-14} width={120} height={28} rx={6} fill="#f6d985" stroke={INK} strokeWidth={4} />
    <line x1={-180} y1={0} x2={-220} y2={0} stroke="#999" strokeWidth={6} />
  </g>
);

// A pretzel, for his hand.
export const Pretzel: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M 0 10 C -40 -30 -40 -40 -20 -40 C 0 -40 10 -10 0 10 C -10 -10 0 -40 20 -40 C 40 -40 40 -30 0 10 Z" fill="none" stroke="#a8652a" strokeWidth={12} strokeLinejoin="round" />
    <path d="M -26 -6 C -10 8 10 8 26 -6" fill="none" stroke="#a8652a" strokeWidth={12} strokeLinecap="round" />
    <circle cx={-14} cy={-30} r={2.4} fill="#fff" />
    <circle cx={12} cy={-34} r={2.4} fill="#fff" />
  </g>
);

// Stand-in "funny story" headline helper kept short.
export const fadeIn = fade;
export {clamp01};
