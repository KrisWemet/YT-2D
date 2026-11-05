// Shot 7 (14.5-17.5 s): close-up from the roof (Marcus's side). Samantha looks up into his
// flashlight. "LOOK AT ME!" ... and she looks down. Pupils shrink. Hard cut to black.
import React from 'react';
import {B, Frame, Glow, INK, P, VO, flick, handheld, hash, jolt, mix, vnoise} from './kit';
import {clamp, easeInOutCubic, easeInOutSine, lerp} from '../pigeon/lib';
import {GrabHand} from './Ladder';

const OWF = 8;
const FACE = 'M0 -330C170 -330 262 -200 260 -40C258 92 202 200 112 268C70 300 -70 300 -112 268C-202 200 -258 92 -260 -40C-262 -200 -170 -330 0 -330Z';

// ---------------------------------------------------------------- the view down the ladder
const Below: React.FC<{t: number; L: number}> = ({t, L}) => {
  const VPy = 1900;
  const rails = [[380, 820], [1540, 1100]];
  const rungs = [];
  for (let i = 0; i < 9; i++) {
    const u = 1 - Math.pow(0.78, i + 1);
    const y = lerp(-80, VPy, u);
    const xl = lerp(rails[0][0], rails[0][1], (y + 80) / (VPy + 80) * 1.6);
    const xr = lerp(rails[1][0], rails[1][1], (y + 80) / (VPy + 80) * 1.6);
    rungs.push(<line key={i} x1={xl} y1={y} x2={xr} y2={y} stroke={mix(P.rustDark, P.rust, 0.5 * L)} strokeWidth={30 * (1 - u * 0.8)} strokeLinecap="round" />);
  }
  const hands = [];
  for (let i = 0; i < 9; i++) {
    const x = [180, 300, 420, 1500, 1620, 1740, 250, 1680, 1560][i] + 24 * Math.sin(t * 2 + i);
    const y = [930, 980, 900, 920, 960, 900, 1040, 1030, 1050][i] + 18 * Math.sin(t * 3 + i * 2);
    hands.push(<GrabHand key={i} x={x} y={y} ang={(i % 2 ? 1 : -1) * 12} grip={0.5 + 0.5 * Math.sin(t * 6 + i)} L={0.35} s={0.75} />);
  }
  return (
    <g style={{filter: 'blur(7px)'}}>
      <rect x={-300} y={-300} width={2600} height={1800} fill="#1c1d25" />
      {Array.from({length: 14}, (_, i) => {
        const y = lerp(-200, 1150, Math.pow(i / 13, 0.8));
        return <line key={i} x1={-300} y1={y} x2={2300} y2={y} stroke="#0e0f14" strokeWidth={10 - i * 0.5} />;
      })}
      {Array.from({length: 18}, (_, i) => {
        const x = -400 + i * 160;
        return <line key={`v${i}`} x1={x} y1={-200} x2={960 + (x - 960) * 0.25} y2={1500} stroke="#0e0f14" strokeWidth={6} />;
      })}
      <Glow x={1300} y={150} rx={700} ry={500} rgb={P.lamp} a={0.4 * L} id="f-lamp" />
      {rungs}
      {rails.map(([a, b], i) => <line key={i} x1={a} y1={-200} x2={b} y2={1300} stroke={mix(P.rustDark, P.rustLit, 0.5 * L)} strokeWidth={46} strokeLinecap="round" />)}
      <rect x={-300} y={650} width={2600} height={900} fill="url(#f-dark)" />
      {hands}
    </g>
  );
};

// ---------------------------------------------------------------- Samantha's face
type FaceState = {gx: number; gy: number; lid: number; pupil: number; blink: number; brow: number; mouth: number; tilt: number; drop: number};
const faceAt = (t: number): FaceState => {
  const shout = VO.m4;
  // gaze: up toward the light (and Marcus), then slowly down
  const down = easeInOutCubic(clamp((t - B.lookDown) / 0.5));
  const sacc = (1 - down) * 0.12 * Math.sign(Math.sin(t * 7.3)) * (t > shout + 0.2 && t < B.lookDown ? 1 : 0.3);
  const gx = lerp(0.55 + sacc, -0.05, down);
  const gy = lerp(-0.62, 0.95, down);
  const bl = (c: number) => Math.max(0, 1 - Math.abs(t - c) / 0.07);
  const blink = Math.max(bl(shout + 0.12), bl(15.9));
  const pupil = lerp(1.0, 0.42, easeInOutSine(clamp((t - B.pupils) / 0.18)));
  const brow = 0.75 + 0.25 * clamp((t - shout) / 0.15) - 0.15 * down + 0.2 * clamp((t - B.pupils) / 0.12);
  const lid = 0.04 + 0.3 * down - 0.34 * clamp((t - B.pupils) / 0.12); // eyes snap wide at what she sees
  const mouth = 0.5 + 0.25 * Math.sin(t * 2 * Math.PI * 1.6) + 0.2 * clamp((t - B.pupils) / 0.15);
  return {gx, gy, lid, pupil, blink, brow, mouth, tilt: 3 * down, drop: 26 * down};
};

const Eye: React.FC<{cx: number; side: number; s: FaceState; L: number; t: number}> = ({cx, side, s, L, t}) => {
  const w = 66, h = 42;
  const cy = -80;
  const lidY = cy - h + (2 * h) * clamp(s.lid + s.blink * 1.2, 0, 1); // upper lid edge
  const ix = cx + s.gx * 30 + 1.2 * Math.sin(t * 2 * Math.PI * 8 + side);
  const iy = cy + s.gy * 22;
  const shape = `M${cx - w} ${cy + 4}Q${cx - w * 0.3} ${cy - h * 1.35} ${cx + w * 0.55} ${cy - h * 0.95}Q${cx + w * 0.9} ${cy - h * 0.6} ${cx + w} ${cy}Q${cx + w * 0.4} ${cy + h * 1.05} ${cx - w * 0.4} ${cy + h * 0.85}Q${cx - w * 0.85} ${cy + h * 0.6} ${cx - w} ${cy + 4}Z`;
  const id = `f-eye${side}`;
  return (
    <g transform={side < 0 ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
      <defs>
        <clipPath id={id}><path d={shape} /></clipPath>
      </defs>
      {/* socket shade */}
      <ellipse cx={cx} cy={cy - 6} rx={w * 1.15} ry={h * 1.5} fill={P.skinShade} opacity={0.28} />
      <path d={shape} fill="#f3eee6" />
      <g clipPath={`url(#${id})`}>
        <g transform={side < 0 ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
          <circle cx={side < 0 ? 2 * cx - ix : ix} cy={iy} r={31} fill="#6a4628" stroke="#2a180c" strokeWidth={4} />
          <circle cx={side < 0 ? 2 * cx - ix : ix} cy={iy} r={22} fill="#87603a" opacity={0.6} />
          <circle cx={side < 0 ? 2 * cx - ix : ix} cy={iy} r={16 * s.pupil} fill="#0a0604" />
          <circle cx={(side < 0 ? 2 * cx - ix : ix) + 10} cy={iy - 11} r={7} fill="#ffffff" opacity={0.95} />
          <circle cx={(side < 0 ? 2 * cx - ix : ix) - 9} cy={iy + 10} r={3} fill="#ffffff" opacity={0.6} />
        </g>
        {/* upper lid shadow + lid */}
        <rect x={cx - w - 10} y={cy - h * 2} width={w * 2 + 20} height={lidY - (cy - h * 2) + 10} fill="#d8cabd" opacity={0.6} />
        <rect x={cx - w - 10} y={cy - h * 2} width={w * 2 + 20} height={lidY - (cy - h * 2)} fill={mix(P.skinShade, P.skin, 0.6 + 0.3 * L)} />
      </g>
      {/* lid line + lashes */}
      <path d={`M${cx - w} ${Math.max(cy + 4, lidY)}Q${cx - w * 0.3} ${Math.min(cy - h * 1.35, lidY - 6) + (lidY - (cy - h)) * 0.3} ${cx + w * 0.55} ${Math.max(cy - h * 0.95, lidY - 4)}Q${cx + w * 0.9} ${Math.max(cy - h * 0.6, lidY)} ${cx + w + 6} ${Math.max(cy - 4, lidY)}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${cx + w - 2} ${cy - 4}l20 -12M${cx + w - 14} ${cy - h * 0.55}l16 -16`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d={`M${cx - w * 0.4} ${cy + h * 0.85}Q${cx + w * 0.4} ${cy + h * 1.05} ${cx + w} ${cy}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      {/* crease above */}
      <path d={`M${cx - w * 0.8} ${cy - h * 1.3 - 6}Q${cx} ${cy - h * 1.9} ${cx + w * 0.8} ${cy - h * 1.2}`} fill="none" stroke={INK} strokeWidth={3.5} opacity={0.45} />
    </g>
  );
};

const Brow: React.FC<{side: number; s: FaceState}> = ({side, s}) => {
  // fear: inner ends up and pulled together
  const k = s.brow;
  const inner = [side * 46, -176 - 44 * k];
  const mid = [side * 112, -196 - 14 * k];
  const outer = [side * 190, -166 + 10 * k];
  return (
    <path
      d={`M${inner[0]} ${inner[1]}Q${mid[0]} ${mid[1] - 10} ${outer[0]} ${outer[1]}`}
      fill="none" stroke={P.hair} strokeWidth={20} strokeLinecap="round"
    />
  );
};

const SamFace: React.FC<{t: number; L: number}> = ({t, L}) => {
  const s = faceAt(t);
  const skin = mix(P.skin, P.skinLit, 0.65);
  const shade = mix(P.skinShade, P.skin, 0.3);
  const hair = mix(P.hair, P.hairLit, 0.35);
  const lipTremble = 2.5 * Math.sin(t * 2 * Math.PI * 11) + 1.5 * vnoise(t * 20);
  const mo = s.mouth;
  const swallow = Math.max(0, 1 - Math.abs(t - 15.85) / 0.18);
  return (
    <g>
      <defs>
        <clipPath id="f-face"><path d={FACE} /></clipPath>
      </defs>
      {/* back hair mass */}
      <path d="M-300 160Q-340 -160 -200 -320Q-60 -420 90 -400Q290 -360 320 -120Q340 60 296 170Q260 110 250 0L-250 0Q-262 110 -300 160Z" fill={hair} stroke={INK} strokeWidth={OWF} strokeLinejoin="round" />
      {/* neck, stretched (she is looking up) + collar */}
      <path d="M-104 200Q-96 330 -150 430L150 430Q96 330 104 200Z" fill={shade} stroke={INK} strokeWidth={OWF} strokeLinejoin="round" />
      <path d="M-104 260Q-60 300 -30 330" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
      <path d={`M-30 ${340 - 22 * swallow}Q0 ${356 - 26 * swallow} 30 ${340 - 22 * swallow}`} fill="none" stroke={INK} strokeWidth={4} opacity={0.4} />
      {/* ears */}
      <path d="M-250 -60Q-300 -70 -296 -10Q-290 50 -244 50Z" fill={shade} stroke={INK} strokeWidth={OWF} strokeLinejoin="round" />
      <path d="M250 -60Q300 -70 296 -10Q290 50 244 50Z" fill={shade} stroke={INK} strokeWidth={OWF} strokeLinejoin="round" />
      {/* face */}
      <path d={FACE} fill={skin} />
      <g clipPath="url(#f-face)">
        <path d={FACE} fill="none" stroke={shade} strokeWidth={70} opacity={0.55} />
        <ellipse cx={-30} cy={-230} rx={150} ry={70} fill="#fff" opacity={0.18} />
        {/* cheeks, freckles, grease smudge */}
        <ellipse cx={-150} cy={50} rx={60} ry={34} fill={P.blush} opacity={0.35} />
        <ellipse cx={150} cy={50} rx={60} ry={34} fill={P.blush} opacity={0.35} />
        {Array.from({length: 14}, (_, i) => (
          <circle key={i} cx={(i % 2 ? 1 : -1) * (40 + 120 * hash(i * 3))} cy={-10 + 50 * hash(i * 7)} r={3.5} fill="#8a4f36" opacity={0.6} />
        ))}
        <path d="M120 120Q170 100 200 130Q180 160 130 150Z" fill="#3a2a22" opacity={0.35} />
        {/* under-chin shadow */}
        <path d="M-160 220Q0 330 160 220L160 360L-160 360Z" fill={shade} opacity={0.6} />
      </g>
      <path d={FACE} fill="none" stroke={INK} strokeWidth={OWF} />
      {/* eyes + brows */}
      <Eye cx={-112} side={-1} s={s} L={L} t={t} />
      <Eye cx={112} side={1} s={s} L={L} t={t} />
      <Brow side={-1} s={s} />
      <Brow side={1} s={s} />
      <path d="M-18 -214Q-8 -190 -16 -170M18 -214Q8 -190 16 -170" fill="none" stroke={INK} strokeWidth={3.5} opacity={0.35} />
      {/* nose */}
      <path d="M-14 -40Q-28 20 -40 52" fill="none" stroke={shade} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
      <path d="M-44 56Q-50 84 -22 86Q0 98 22 86Q50 84 44 56" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={-20} cy={78} rx={10} ry={6} fill="#5a3022" />
      <ellipse cx={20} cy={78} rx={10} ry={6} fill="#5a3022" />
      <ellipse cx={4} cy={50} rx={14} ry={10} fill="#fff" opacity={0.35} />
      {/* mouth: open, breathing hard, lips trembling */}
      <g transform={`translate(0 ${170})`}>
        <path d={`M-66 ${lipTremble * 0.3}Q-30 ${-16 - lipTremble} 0 ${-10}Q30 ${-16 + lipTremble} 66 ${-lipTremble * 0.3}Q30 ${24 + 26 * mo} 0 ${26 + 28 * mo}Q-30 ${24 + 26 * mo} -66 ${lipTremble * 0.3}Z`} fill="#3a1414" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M-40 ${-4}Q0 ${4} 40 ${-4}L36 ${6}Q0 ${12} -36 ${6}Z`} fill="#f2ece4" opacity={0.9} />
        <path d={`M-66 ${lipTremble * 0.3}Q-30 ${-16 - lipTremble} 0 -10Q30 ${-16 + lipTremble} 66 ${-lipTremble * 0.3}Q30 -2 0 -2Q-30 -2 -66 ${lipTremble * 0.3}Z`} fill="#b0605a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M-60 ${4 + 6 * mo}Q0 ${34 + 30 * mo} 60 ${4 + 6 * mo}Q0 ${48 + 32 * mo} -60 ${4 + 6 * mo}Z`} fill="#c06c63" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {/* front hair: hairline cap with a side part, loose sweaty strands */}
      <path d="M-262 -40Q-280 -250 -150 -330Q-20 -400 120 -360Q270 -300 264 -40Q236 -150 160 -214Q110 -250 40 -242Q-10 -262 -60 -250Q-160 -232 -220 -150Q-250 -100 -262 -40Z" fill={hair} stroke={INK} strokeWidth={OWF} strokeLinejoin="round" />
      <path d="M-60 -250Q-90 -320 -40 -380M40 -242Q120 -300 190 -300M-150 -230Q-210 -260 -240 -200" fill="none" stroke={P.hairLit} strokeWidth={6} opacity={0.6} strokeLinecap="round" />
      <path d={`M-30 -248Q-70 -170 -40 ${-110 + 4 * Math.sin(t * 3)}`} fill="none" stroke={hair} strokeWidth={9} strokeLinecap="round" />
      <path d={`M60 -240Q100 -170 84 ${-120 + 4 * Math.sin(t * 2.6)}`} fill="none" stroke={hair} strokeWidth={7} strokeLinecap="round" />
      <path d={`M-258 -30Q-290 100 ${-262 + 6 * Math.sin(t * 2)} 220`} fill="none" stroke={hair} strokeWidth={14} strokeLinecap="round" />
      <path d={`M258 -30Q290 100 ${266 + 6 * Math.sin(t * 2.2)} 210`} fill="none" stroke={hair} strokeWidth={12} strokeLinecap="round" />
      {/* sweat */}
      {[[-170, -210, 0], [150, -190, 0.4], [210, -100, 0.9]].map(([x, y, ph], i) => {
        const slide = ((t * 0.25 + ph) % 1) * 60;
        return (
          <g key={i} transform={`translate(${x} ${y + (i === 2 ? slide : 0)})`}>
            <path d="M0 -12Q8 0 6 6Q0 12 -6 6Q-8 0 0 -12Z" fill="#e8f2ff" stroke={INK} strokeWidth={2.5} opacity={0.85} />
          </g>
        );
      })}
    </g>
  );
};

/** a rail in the foreground and her hand clutching it (world px), forearm in to her shoulder */
const RailHand: React.FC<{side: number; t: number; L: number}> = ({side, t, L}) => {
  const skin = mix(P.skin, P.skinLit, 0.45);
  const shade = mix(P.skinShade, P.skin, 0.4);
  const white = '#fbeee2';
  // rail line (matches the blurred rails below): from top of frame to past her shoulder
  const top = side < 0 ? [470, -200] : [1450, -200];
  const bot = side < 0 ? [760, 1300] : [1160, 1300];
  const ang = (Math.atan2(bot[0] - top[0], bot[1] - top[1]) * 180) / Math.PI;
  const u = 0.56;
  const hx = lerp(top[0], bot[0], u) + 3 * Math.sin(t * 2 * Math.PI * 9 + side);
  const hy = lerp(top[1], bot[1], u);
  const shoulder = [940 + side * 330, 1060];
  return (
    <g>
      <line x1={top[0]} y1={top[1]} x2={bot[0]} y2={bot[1]} stroke={INK} strokeWidth={70 + 2 * OWF} strokeLinecap="round" />
      <line x1={top[0]} y1={top[1]} x2={bot[0]} y2={bot[1]} stroke={mix(P.rustDark, P.rust, 0.75)} strokeWidth={70} strokeLinecap="round" />
      <line x1={top[0] - 18} y1={top[1]} x2={bot[0] - 18} y2={bot[1]} stroke={P.rustLit} strokeWidth={8} opacity={0.4} />
      {/* forearm from her shoulder up to the hand */}
      <line x1={shoulder[0]} y1={shoulder[1]} x2={hx - side * 50} y2={hy + 60} stroke={INK} strokeWidth={96 + 2 * OWF} strokeLinecap="round" />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={hx - side * 50} y2={hy + 60} stroke={skin} strokeWidth={96} strokeLinecap="round" />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={lerp(shoulder[0], hx, 0.35)} y2={lerp(shoulder[1], hy, 0.35)} stroke={INK} strokeWidth={130 + 2 * OWF} strokeLinecap="round" />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={lerp(shoulder[0], hx, 0.35)} y2={lerp(shoulder[1], hy, 0.35)} stroke={mix(P.shirtDark, P.shirt, 0.75)} strokeWidth={130} strokeLinecap="round" />
      <g transform={`translate(${hx} ${hy}) rotate(${-ang})`}>
        {/* back of the hand on the inner side of the rail */}
        <path d={`M${-side * 20} -70Q${-side * 120} -60 ${-side * 130} 20Q${-side * 120} 100 ${-side * 30} 96Z`} fill={skin} stroke={INK} strokeWidth={OWF} strokeLinejoin="round" />
        {/* fingers wrapped over the rail */}
        {[-62, -20, 22, 62].map((fy, i) => (
          <g key={i}>
            <rect x={side < 0 ? -40 : -56} y={fy - 19} width={96} height={38} rx={19} fill={skin} stroke={INK} strokeWidth={6} />
            <ellipse cx={side * -22} cy={fy} rx={14} ry={11} fill={white} />
            <path d={`M${side * 30} ${fy - 12}Q${side * 44} ${fy} ${side * 30} ${fy + 12}`} fill="none" stroke={shade} strokeWidth={4} />
          </g>
        ))}
      </g>
    </g>
  );
};

const Breath: React.FC<{t: number}> = ({t}) => {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const t0 = 14.55 + k * 0.62;
    const u = (t - t0) / 1.1;
    if (u < 0 || u > 1) continue;
    out.push(
      <g key={k} opacity={0.35 * Math.sin(Math.PI * u)} style={{filter: 'blur(10px)'}}>
        <ellipse cx={20 + 120 * u} cy={190 - 260 * u} rx={60 + 120 * u} ry={40 + 80 * u} fill="#e8eef8" />
      </g>,
    );
  }
  return <g>{out}</g>;
};

export const FaceShot: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const L = clamp(flick(t + 0.37));
  const s = faceAt(t);
  const h = handheld(t, 1.1, 61);
  const j = jolt(t, [[VO.m4, 7, 0.12]]);
  // slow push, then a fast push into her eyes as she looks down
  const push = easeInOutCubic(clamp((t - 16.7) / 0.8));
  const sc = lerp(1.0, 1.06, clamp(lt / 2)) * lerp(1, 1.55, push);
  const cx = lerp(960, 935, push) + h.x / sc + j.x / sc;
  const cy = lerp(540, 470, push) + h.y / sc + j.y / sc;
  const tremble = {x: 2.4 * Math.sin(t * 2 * Math.PI * 9.4), y: 1.6 * Math.sin(t * 2 * Math.PI * 7.1 + 1)};
  return (
    <Frame
      x={cx}
      y={cy}
      s={sc}
      r={3 + h.r}
      bg="#07080d"
      defs={
        <linearGradient id="f-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={INK} stopOpacity={0} />
          <stop offset="100%" stopColor={INK} stopOpacity={0.95} />
        </linearGradient>
      }
    >
      <Below t={t} L={L} />
      {/* shoulders below her raised chin */}
      <g transform={`translate(${940 + tremble.x * 0.5} ${1010})`}>
        <path d="M-460 260Q-440 -30 -150 -100L150 -100Q440 -30 460 260Z" fill={mix(P.shirtDark, P.shirt, 0.75)} stroke={INK} strokeWidth={OWF} strokeLinejoin="round" />
        <path d="M-210 -86L-150 260M210 -86L150 260" stroke={INK} strokeWidth={70} />
        <path d="M-210 -86L-150 260M210 -86L150 260" stroke={P.denim} strokeWidth={56} />
        <rect x={-182} y={20} width={44} height={36} rx={6} fill="#c9ccd2" stroke={INK} strokeWidth={5} transform="rotate(10 -160 38)" />
        <rect x={138} y={20} width={44} height={36} rx={6} fill="#c9ccd2" stroke={INK} strokeWidth={5} transform="rotate(-10 160 38)" />
      </g>
      <g transform={`translate(${930 + tremble.x} ${470 + tremble.y + s.drop}) rotate(${s.tilt})`}>
        <SamFace t={t} L={L} />
        <Breath t={t} />
      </g>
      <RailHand side={-1} t={t} L={L} />
      <RailHand side={1} t={t} L={L} />
      {/* the flashlight from above, on her face */}
      <Glow x={980} y={250} rx={900} ry={700} rgb="236,242,255" a={0.22} id="f-torch" />
      <rect x={-300} y={-300} width={2600} height={1800} fill="#02030a" opacity={0.1 + 0.25 * (1 - L)} />
    </Frame>
  );
};
