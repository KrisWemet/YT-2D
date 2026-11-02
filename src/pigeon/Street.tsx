import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {S} from './sprites';
import {Cam, camFromK, camKeys, clamp, easeInOutCubic, easeOutCubic, inv, key, lerp, pop, spring, wobble} from './lib';
import {Layer, Pic, Pos} from './world';
import {makeWalk, regular, Walk} from './gait';
import {OX, PigeonRig, Pose} from './Pigeon';
import {Arrow, Brackets, Crumb, DashedLine, PauseBadge, SpeedLines, SweatDrop, XMark} from './fx';
import {T} from './timing';

export const PS = 0.42; // pigeon: world px per sprite px
export const YG = 1500; // pigeon ground (street, depth 1000)
export const HEADR = 286.6; // scientist head radius in world px
const EYE = S.rig.eye;
const PAVE = '#e4ddd0';

// ---------- backdrop ----------
const YH = 1060; // building base on the depth-3000 layer
const BS = 1.91;
const YR = 1160; // road top (depth 2000)
const YS = 1240; // near sidewalk top (depth 1000)
export const StreetBackdrop: React.FC<{cam: Cam; blurFar?: number}> = ({cam, blurFar = 0}) => {
  const st = S.street;
  const bw = st.w * BS;
  const copies = [-2, -1, 0, 1, 2];
  return (
    <>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #8fcfff 0%, #bfe6ff 55%, #e6f6ff 100%)'}} />
      <Layer cam={cam} z={3000} blur={blurFar}>
        {copies.map((c) => (
          <Pos key={c} x={c * (bw - 30)} y={YH} s={BS}>
            <Pic file={st.file} w={st.w} h={st.h} ax={st.w / 2} ay={st.base} flip={c % 2 !== 0} />
          </Pos>
        ))}
        <div style={{position: 'absolute', left: -20000, top: YH - 4, width: 40000, height: 4000, background: '#d6cfc1', borderTop: '7px solid #0b0b0b'}} />
      </Layer>
      <Layer cam={cam} z={2000} blur={blurFar * 0.6}>
        <div style={{position: 'absolute', left: -20000, top: YR, width: 40000, height: 4000, background: '#8f949c', borderTop: '9px solid #0b0b0b'}} />
        <div style={{position: 'absolute', left: -20000, top: YR + 9, width: 40000, height: 26, background: '#b9b2a6'}} />
        {Array.from({length: 120}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: -20000 + i * 340, top: YR + 150, width: 170, height: 18, borderRadius: 9, background: '#f4f1e8'}} />
        ))}
      </Layer>
      <Layer cam={cam} z={1000}>
        <div style={{position: 'absolute', left: -20000, top: YS, width: 40000, height: 4000, background: PAVE, borderTop: '6px solid #0b0b0b'}} />
        <div style={{position: 'absolute', left: -20000, top: YS + 6, width: 40000, height: 22, background: '#cfc7b9'}} />
        {Array.from({length: 140}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: -20000 + i * 330, top: YS + 28, width: 6, height: 1400, background: '#cfc6b6', transform: 'skewX(-14deg)', transformOrigin: '0 0'}} />
        ))}
      </Layer>
    </>
  );
};

// ---------- pigeon in the world ----------
export const PigeonAt: React.FC<{x: number; y: number; s?: number; pose: Pose; id: string; shadow?: boolean; rot?: number}> = ({x, y, s = PS, pose, id, shadow = true}) => (
  <>
    {shadow && (
      <div style={{position: 'absolute', left: x - 330 * s, top: y - 30 * s, width: 560 * s, height: 60 * s, borderRadius: '50%', background: 'rgba(72,54,42,0.22)', filter: `blur(${5 * s}px)`}} />
    )}
    <Pos x={x} y={y} s={s}>
      <PigeonRig pose={pose} id={id} />
    </Pos>
  </>
);

/** Pose from a walk at time t (+ optional extras). Feet relative to the body. */
export const walkPose = (w: Walk, t: number, extra: Partial<Pose> = {}): Pose => {
  const b = w.body(t);
  const fn = w.foot(t, 'near');
  const ff = w.foot(t, 'far');
  return {
    headDx: w.headDx(t),
    near: {x: fn.x - b, lift: fn.lift, curl: -16 * Math.sin(Math.PI * fn.u)},
    far: {x: ff.x - b, lift: ff.lift, curl: -16 * Math.sin(Math.PI * ff.u)},
    ...extra,
  };
};

/** World x of the pigeon's eye (head) for a walk at t. */
const eyeX = (xOff: number, w: Walk, t: number) => xOff + PS * (w.head(t) + EYE.cx - OX);
const beakX = (xOff: number, w: Walk, t: number) => xOff + PS * (w.head(t) + 1462 - OX) + 14;
const EYE_Y = YG + PS * (EYE.cy - S.rig.ground);
const HEAD_TOP = YG - PS * S.rig.ground;

// blink helper: quick blinks at given times
export const blinkAt = (t: number, times: number[]) => {
  let b = 0;
  for (const bt of times) {
    const u = (t - bt) / 0.16;
    if (u > 0 && u < 1) b = Math.max(b, Math.sin(Math.PI * u));
  }
  return b;
};

// ---------- scientist sprite ----------
type GName = 'g_hero' | 'g_balance' | 'g_hold' | 'g_empty' | 'g_clip' | 'g_camera';
export const Guy: React.FC<{name: GName; x: number; y: number; sx?: number; sy?: number; rot?: number; k?: number}> = ({name, x, y, sx = 1, sy = 1, rot = 0, k = 1}) => {
  const g = S[name];
  const sc = (HEADR / g.head[2]) * k;
  return (
    <Pos x={x} y={y} s={sc} sx={sx} sy={sy} rot={rot}>
      <Pic file={g.file} w={g.w} h={g.h} ax={g.feet[0]} ay={g.feet[1]} />
    </Pos>
  );
};

// =====================================================================
// Shot A (0 -> cutLab): tracking walk, stop, slow-motion head hold, reveal + balance gag
// =====================================================================
const A_STARTS = [-0.58, -0.16, 0.26, 0.68, 1.1, 1.95, 3.1, 5.72, 6.62, 7.1, 7.52, 7.94, 8.36, 8.78, 9.2];
const A_DUR: Record<number, number> = {1.1: 0.16, 1.95: 0.18, 3.1: 0.28, 5.72: 0.3, 6.62: 0.2};
export const WALK_A = makeWalk(A_STARTS.map((s) => [s, s + (A_DUR[s] ?? 0.135)] as [number, number]), 0, {firstFoot: 'near'});
export const XA = 600 - PS * WALK_A.body(0);
const pxA = (t: number) => XA + PS * WALK_A.body(t);
const GUY_X = pxA(7.4) - 800;

export const K0 = 1.2; // street framing: pigeon ~70% of the frame width
export const CY0 = 1160;
const camA = (t: number): Cam => {
  const track = (tt: number) => pxA(tt) - 58;
  if (t <= 1.0) return camFromK(track(t), CY0, K0);
  const v1 = (track(1.0) - track(0.99)) / 0.01;
  const xStop = track(1.0) + 0.3 * v1;
  if (t <= 1.6) {
    const u = t - 1.0;
    return camFromK(track(1.0) + v1 * u - (v1 * u * u) / (2 * 0.6), CY0, K0);
  }
  const cx = pxA(4.55) - 10;
  const guyMid = (GUY_X + pxA(8.2)) / 2 - 40;
  return camKeys(t, [
    [1.6, xStop, CY0, K0],
    [2.72, xStop, CY0, K0],
    [3.34, cx, 1165, 1.5],
    [6.32, cx + 6, 1165, 1.5],
    [7.5, guyMid, 690, 0.72],
    [8.94, guyMid + 25, 690, 0.745, (u) => u],
  ]);
};

export const StreetA: React.FC<{t: number}> = ({t}) => {
  const cam = camA(t);
  const w = WALK_A;
  const hx = eyeX(XA, w, t);
  // dashed guide lines: one per hold
  const lines: Array<{x: number; in: number; out: number}> = [
    {x: beakX(XA, w, 1.5), in: 1.3, out: 1.95},
    {x: beakX(XA, w, 2.5), in: 2.14, out: 3.1},
    {x: beakX(XA, w, 4.5), in: 3.39, out: 5.72},
    {x: beakX(XA, w, 6.3), in: 6.05, out: 6.55},
  ];
  const bodyX = pxA(t);
  // slow-mo emphasis: blink only outside the hold demo
  const pose = walkPose(w, t, {blink: blinkAt(t, [0.7, 6.9, 8.5]), look: [4, 0]});
  // scientist (shot A part 2)
  const g = (() => {
    if (t < 6.2) return null;
    const anti = inv(T.balance - 0.1, T.balance, t);
    const pre = t < T.balance;
    const squash = pre ? 1 - 0.06 * Math.sin((Math.PI / 2) * anti) : 1 + 0.035 * (1 - spring(t - T.balance, 3.2, 0.3));
    const think = t > T.youd && pre ? 0.02 * Math.sin(Math.PI * clamp((t - T.youd) / 0.35)) : 0;
    const rot = pre ? 0 : 5.5 * Math.sin(2 * Math.PI * 1.25 * (t - T.balance)) + 1.5 * Math.sin(2 * Math.PI * 2.7 * (t - T.balance));
    return {name: (pre ? 'g_hero' : 'g_balance') as GName, sy: squash + think, sx: 2 - squash, rot};
  })();
  const sweat = pop(t, T.balance + 0.28, 8.85);
  const slide = clamp((t - (T.balance + 0.3)) / 0.8);
  return (
    <AbsoluteFill>
      <StreetBackdrop cam={cam} blurFar={t > 2.9 && t < 6.6 ? 2.6 * clamp(Math.min(t - 2.9, 6.6 - t) / 0.4) : 0} />
      <Layer cam={cam} z={1000}>
        {g && <Guy name={g.name} x={GUY_X} y={YG} sx={g.sx} sy={g.sy} rot={g.rot} />}
        {g && (
          <SweatDrop x={GUY_X - 170 + 30 * slide} y={YG - 1420 + 120 * slide} s={sweat} r={28} rot={-14} />
        )}
        {lines.map((l, i) => (
          <DashedLine key={i} x={l.x} y0={HEAD_TOP - 90} y1={YG + 40} s={pop(t, l.in, l.out - 0.1, 0.3)} />
        ))}
        <PigeonAt x={bodyX} y={YG} pose={pose} id="pa" />
        {/* "backward": arrow pointing back from the head, crossed out */}
        <Arrow x={hx - 330} y={EYE_Y - 20} len={250} dir={-1} th={44} s={pop(t, T.moves + 0.02, 2.9)} />
        <XMark x={hx - 330} y={EYE_Y - 20} r={78} s={pop(t, T.backward + 0.06, 2.9, 0.22)} rot={-6 + 6 * Math.sin(10 * (t - T.backward))} />
        {/* freeze badge + body arrow */}
        <PauseBadge x={eyeX(XA, w, 4.5) - 10} y={HEAD_TOP - 120} s={pop(t, T.freezes + 0.04, T.darts - 0.05)} r={52} />
        <Arrow x={bodyX - 60} y={YG + 85} len={260} s={pop(t, T.while + 0.06, T.then, 0.3)} th={36} />
        <SpeedLines x={hx - 120} y={EYE_Y} u={(t - T.darts) / 0.45} len={210} />
      </Layer>
    </AbsoluteFill>
  );
};

// =====================================================================
// Shot B (cutStreet2 -> cutCam): "Each freeze gives a steady view" - viewfinder brackets
// =====================================================================
export const WALK_B = makeWalk(regular(17.2, 21.2, 0.55, 0.3), 0, {firstFoot: 'near'});
const XB = 420 - PS * WALK_B.body(17.96);
export const StreetB: React.FC<{t: number}> = ({t}) => {
  const cam = camKeys(t, [[17.96, 610, 1150, 1.3], [20.42, 650, 1150, 1.34, (u) => u]]);
  const w = WALK_B;
  const hx = eyeX(XB, w, t);
  // brackets follow the head; little snap at each hold start
  const hs = w.holdStart(t);
  const snap = hs > 0 ? 1 + 0.12 * Math.exp(-(t - hs) * 14) * Math.cos((t - hs) * 30) : 1;
  const bs = pop(t, T.each - 0.05, 99, 0.3) * snap;
  const pose = walkPose(w, t, {look: [6, 0], blink: blinkAt(t, [20.15])});
  return (
    <AbsoluteFill>
      <StreetBackdrop cam={cam} />
      <Layer cam={cam} z={1000}>
        <PigeonAt x={XB + PS * w.body(t)} y={YG} pose={pose} id="pb" />
        <Brackets cx={hx + 215} cy={EYE_Y + 6} w={250} h={210} s={bs} />
      </Layer>
    </AbsoluteFill>
  );
};

// =====================================================================
// Shot C (cutStreet3 -> end): spots a falling crumb and snaps it out of the air; loops to frame 0
// =====================================================================
const C_STARTS = Array.from({length: 9}, (_, i) => 24.74 - 0.42 * (8 - i)); // ... 23.90 (catch), 24.32, 24.74
export const WALK_C = makeWalk(C_STARTS.map((s) => [s, s + 0.135] as [number, number]), 0, {firstFoot: 'near'});
// align: frame DUR matches frame 0 of shot A (same phase, same place) -> seamless loop
const XC = XA + PS * WALK_A.body(0) - PS * WALK_C.body(24.9);
const CATCH = 23.9;
export const catchExtra = (t: number) => {
  const u = (t - CATCH) / 0.14;
  if (u <= 0) return {dx: 0, dy: 0};
  if (u <= 1) {
    const e = easeOutCubic(u);
    return {dx: 85 * e, dy: -70 * e};
  }
  const v = clamp((t - CATCH - 0.14) / 0.32);
  const e = easeInOutCubic(v);
  return {dx: 85 * (1 - e), dy: -70 * (1 - e) + 14 * Math.sin(Math.PI * v)};
};
const beakWorld = (t: number) => {
  const c = catchExtra(t);
  const w = WALK_C;
  return {x: XC + PS * (w.head(t) + c.dx + 1452 - OX), y: YG + PS * (282 + c.dy - S.rig.ground)};
};
export const StreetC: React.FC<{t: number}> = ({t}) => {
  const w = WALK_C;
  const bodyX = XC + PS * w.body(t);
  const cam = camFromK(bodyX - 58, CY0, K0);
  const c = catchExtra(t);
  const spot = t > T.spot ? spring(t - T.spot, 3.5, 0.32) : 0;
  const unspot = clamp((t - 24.25) / 0.3);
  const eyePop = 1 + 0.24 * spot * (1 - unspot);
  const gulp = t > CATCH + 0.12 && t < CATCH + 0.4 ? Math.sin(Math.PI * ((t - CATCH - 0.12) / 0.28)) : 0;
  const pose = walkPose(w, t, {
    headDx: w.headDx(t) + c.dx,
    headDy: c.dy,
    eyePop,
    look: [lerp(4, 16, spot * (1 - unspot)), lerp(0, -16, spot * (1 - unspot))],
    brow: 16 * spot * (1 - unspot),
    blink: Math.max(gulp * 0.85, blinkAt(t, [22.6])),
  });
  // crumb: falls (gravity) to meet the beak at CATCH + 0.12
  const tc = CATCH + 0.12;
  const target = beakWorld(tc);
  const t0 = 23.0;
  const fall = clamp((t - t0) / (tc - t0));
  const y0 = target.y - 1050;
  const cy = y0 + (target.y - y0) * fall * fall;
  const cx = target.x + 26 + 60 * (1 - fall) + 18 * Math.sin(5 * (t - t0)) * (1 - fall);
  const crumbVisible = t >= t0 && t < tc;
  return (
    <AbsoluteFill>
      <StreetBackdrop cam={cam} />
      <Layer cam={cam} z={1000}>
        <PigeonAt x={bodyX} y={YG} pose={pose} id="pc" />
        {crumbVisible && fall > 0.12 && (
          <div style={{position: 'absolute', left: cx - 6, top: cy - 70 - 160 * fall, width: 12, height: 50 + 160 * fall, borderRadius: 6, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.85))'}} />
        )}
        {crumbVisible && <Crumb x={cx} y={cy} s={1} rot={260 * (t - t0)} r={46} />}
      </Layer>
    </AbsoluteFill>
  );
};
