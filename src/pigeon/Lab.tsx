import React from 'react';
import {AbsoluteFill} from 'remotion';
import {S} from './sprites';
import {Cam, camKeys, clamp, easeInCubic, easeInOutCubic, inv, lerp, pop, spring, withShake} from './lib';
import {Layer, Pic, Pos, toScreen} from './world';
import {makeWalk, STEP} from './gait';
import {OX, Pose} from './Pigeon';
import {DashedLine, Poster, SightCone} from './fx';
import {Guy, HEADR, PigeonAt, blinkAt, breath, walkPose} from './Street';
import {T} from './timing';

const YF = 1700; // floor (depth 1000)
const GX = 300; // scientist feet x
const TS = 0.52; // treadmill scale
const tm = S.treadmill;
const TX = GX + 60; // treadmill left edge (world)
const TFOOT = tm.h - 12; // treadmill feet bottom (sprite px)
const BELT_Y = YF - (TFOOT - tm.beltTop) * TS; // belt top surface
const EYE = S.rig.eye;
// where the drawn pigeon sits in g_hold -> rig origin in world (matched on the orange iris)
const gh = S.g_hold;
const ghs = HEADR / gh.head[2];
export const PSL = ghs * Math.sqrt(gh.pigeonOrange.n / S.rig.orange.n); // lab pigeon scale (world px per rig px)
const LEAN = 2.5; // scientist leans forward while holding the pigeon (deg, about his feet)
const rotV = (x: number, y: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return {x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)};
};
const ho = rotV((gh.pigeonOrange.cx - gh.feet[0]) * ghs, (gh.pigeonOrange.cy - gh.feet[1]) * ghs, LEAN);
const SQX0 = 0.8; // take-off squeeze at the swap hides the drawn pigeon's more compact shape
const SQY0 = 1.07;
const ro = rotV(PSL * SQX0 * (S.rig.orange.cx - OX), PSL * SQY0 * (S.rig.orange.cy - S.rig.ground), LEAN);
const HELD = {x: GX + ho.x - ro.x, y: YF + ho.y - ro.y};
const LAND = {x: HELD.x + 300, y: BELT_Y};
const HOP0 = T.put + 0.06;
const HOP1 = T.put + 0.58;
const BELT_ON = T.treadmill;
const BELT_V = 120; // world px / s at full speed

const beltTravel = (t: number) => {
  // speed ramps up over 0.45 s, then constant (integral of the ramp)
  const r = 0.45;
  const u = t - BELT_ON;
  if (u <= 0) return 0;
  if (u <= r) return (BELT_V * u * u) / (2 * r);
  return BELT_V * (r / 2 + (u - r));
};
// treadmill walk in the belt frame: a thrust each time the belt passes one STEP
export const TW = (() => {
  const starts: Array<[number, number]> = [];
  let next = 0.35 * STEP;
  for (let t = BELT_ON; t < 17; t += 1 / 600) {
    const b = beltTravel(t) / PSL;
    if (b >= next) {
      starts.push([t, t + 0.135]);
      next += STEP;
    }
  }
  return makeWalk(starts, 0.35 * STEP, {headFixed: true, firstFoot: 'near'});
})();

const camLab = (t: number): Cam =>
  camKeys(t, [
    [T.cutLab, GX + 330, YF - 820, 0.8],
    [12.62, GX + 345, YF - 815, 0.84, (u) => u],
    [13.28, LAND.x + 150, BELT_Y - 330, 1.25],
    [16.4, LAND.x + 156, BELT_Y - 335, 1.3, (u) => u],
  ]);

const POSTER = {x: LAND.x + 500, y: BELT_Y - 700, w: 280, h: 350}; // on the wall (depth 1600)

export const Lab: React.FC<{t: number}> = ({t}) => {
  const cam = withShake(camLab(t), t);
  // ----- scientist pose
  let gName: 'g_hold' | 'g_empty' | 'g_clip' = 'g_hold';
  let sy = 1;
  let rot = 0;
  if (t < T.put) {
    rot = LEAN * easeInOutCubic(clamp((t - T.scientists) / 0.3));
  } else if (t < T.bobbing - 0.02) {
    gName = 'g_empty';
    sy = 1 + 0.025 * Math.sin(Math.PI * clamp((t - T.put - 0.05) / 0.3));
    rot = LEAN * (1 - easeInOutCubic(clamp((t - T.put) / 0.5)));
  } else {
    gName = 'g_clip';
    sy = 1 + 0.045 * (1 - spring(t - T.bobbing + 0.02, 3.5, 0.28));
  }
  if (t > T.bobbing - 0.12 && t < T.bobbing - 0.02) sy = 1 - 0.05 * Math.sin((Math.PI / 2) * inv(T.bobbing - 0.12, T.bobbing - 0.02, t));
  const exitU = clamp((t - 12.7) / 0.55);
  const exitX = 900 * easeInCubic(exitU);
  const exitY = 40 * Math.abs(Math.sin(exitU * Math.PI * 3));
  // ----- pigeon
  let px = HELD.x;
  let py = HELD.y;
  let pose: Pose;
  const dangle: Pose = {near: {x: 28, dy: 34, curl: 30}, far: {x: -24, dy: 40, curl: 34}};
  const sq = easeInOutCubic(clamp((t - T.put) / 0.22));
  const sqx = lerp(SQX0, 1, sq);
  const sqy = lerp(SQY0, 1, sq);
  if (t < HOP0) {
    pose = {...dangle, rot: LEAN, look: [10, 2], sx: sqx, sy: sqy * breath(t, 0.008, 0.7)};
  } else if (t < HOP1) {
    const u = (t - HOP0) / (HOP1 - HOP0);
    px = lerp(HELD.x, LAND.x, easeInOutCubic(u));
    py = lerp(HELD.y, LAND.y, easeInCubic(u)) - 70 * Math.sin(Math.PI * u);
    const ext = clamp((u - 0.55) / 0.4);
    pose = {
      near: {x: lerp(28, 50, ext), dy: lerp(34, 0, ext), curl: lerp(30, 0, ext)},
      far: {x: lerp(-24, -50, ext), dy: lerp(40, 0, ext), curl: lerp(34, 0, ext)},
      look: [10, 4],
      rot: LEAN * (1 - easeInOutCubic(clamp(u / 0.6))),
      sx: sqx,
      sy: sqy,
    };
  } else {
    px = LAND.x;
    py = LAND.y;
    const land = t - HOP1;
    const squash = land < 0.6 ? 1 - 0.08 * Math.exp(-land * 7) * Math.cos(land * 22) : 1;
    if (t < BELT_ON + 0.08) {
      pose = {near: {x: 50}, far: {x: -50}, sy: squash * breath(t, 0.008, 0.7), sx: 2 - squash, look: [lerp(8, -10, clamp((t - 10.45) / 0.2)), 0], blink: blinkAt(t, [10.55])};
    } else {
      pose = walkPose(TW, t, {headDx: 0, look: [8, 0], blink: blinkAt(t, [12.05, 14.2, 15.6])});
      // ease the first step in from the standing pose
      const e = clamp((t - BELT_ON - 0.08) / 0.2);
      pose.near = {...pose.near!, x: lerp(50, pose.near!.x, e)};
      pose.far = {...pose.far!, x: lerp(-50, pose.far!.x, e)};
    }
  }
  // surprised scientist reacts; pigeon puzzled brow on "stopped"
  if (t > T.stopped) pose.brow = 12 * spring(t - T.stopped, 3, 0.4);
  const eyeWX = LAND.x + PSL * (EYE.cx - OX);
  const eyeWY = LAND.y + PSL * (EYE.cy - S.rig.ground);
  // ----- belt slats
  const slat = 74;
  const off = ((beltTravel(t) / TS) % slat + slat) % slat;
  const nSl = Math.ceil((1594 - 212) / slat) + 2;
  // ----- sight cone (screen space)
  const eS = toScreen(cam, 1000, eyeWX + 22, eyeWY - 4);
  const pS = toScreen(cam, 1600, POSTER.x + POSTER.w * 0.08, POSTER.y + POSTER.h / 2);
  const coneA = clamp((t - (T.view - 0.12)) / 0.25) * (1 - clamp((t - 16.38) / 0.05));
  const pulse = 1 + 0.03 * Math.sin((t - T.view) * 6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#cfe8dd'}} />
      <Layer cam={cam} z={1600}>
        <div style={{position: 'absolute', left: -7000, top: YF - 900, width: 14000, height: 6000, background: '#bfded2', borderTop: '6px solid #a7cbbd'}} />
        <div style={{position: 'absolute', left: -7000, top: YF - 300, width: 14000, height: 6000, background: '#a9c9bc', borderTop: '7px solid #0b0b0b'}} />
        <Poster x={POSTER.x} y={POSTER.y} w={POSTER.w} h={POSTER.h} blink={blinkAt(t, [11.1, 15.25])} look={t > T.view ? -1 : 0} />
      </Layer>
      <Layer cam={cam} z={1000}>
        <div style={{position: 'absolute', left: -7000, top: YF - 90, width: 14000, height: 6000, background: '#e9e6df', borderTop: '6px solid #0b0b0b'}} />
        <div style={{position: 'absolute', left: -7000, top: YF + 120, width: 14000, height: 6000, background: '#e1ddd4'}} />
        {/* treadmill + moving belt slats */}
        <Pos x={TX} y={YF} s={TS}>
          <Pic file={tm.file} w={tm.w} h={tm.h} ax={0} ay={TFOOT} />
          <div style={{position: 'absolute', left: 212, top: tm.bandTop - TFOOT + 6, width: 1594 - 212, height: tm.bandBot - tm.bandTop - 10, overflow: 'hidden'}}>
            {Array.from({length: nSl}, (_, i) => (
              <div key={i} style={{position: 'absolute', left: i * slat - off, top: 0, width: 16, height: 200, background: '#68707c', transform: 'skewX(-18deg)'}} />
            ))}
          </div>
          {t > BELT_ON && (
            <div style={{position: 'absolute', left: tm.green[0] - tm.green[2] - 10, top: tm.green[1] - TFOOT - tm.green[2] - 10, width: 2 * tm.green[2] + 20, height: 2 * tm.green[2] + 20, borderRadius: '50%', background: 'rgba(120,255,150,0.55)', filter: 'blur(6px)', opacity: 0.5 + 0.5 * Math.sin((t - BELT_ON) * 9) ** 2}} />
          )}
        </Pos>

        <DashedLine x={LAND.x + PSL * (1462 - OX) + 14} y0={LAND.y - PSL * S.rig.ground - 90} y1={LAND.y + 30} s={pop(t, T.bobbing + 0.04, 99, 0.3)} />
        {t < 13.4 && <Guy name={gName} x={GX - exitX} y={YF - exitY} sy={sy} sx={2 - sy} rot={rot - 6 * exitU} t={t} />}
        {t >= T.put && <PigeonAt x={px} y={py} s={PSL} pose={pose} id="pl" shadow={t >= HOP1 - 0.05} />}
      </Layer>
      <SightCone ex={eS.x} ey={eS.y} tx={pS.x} ty={pS.y} th={POSTER.h * pS.k * 0.8 * pulse} a={coneA} />
    </AbsoluteFill>
  );
};
