import React, {useContext} from 'react';
import {AbsoluteFill} from 'remotion';
import {RetentionContinuity} from './retention-context';
import {World} from '../World';
import {FPS} from '../MallChapter';
import {OfficeScene, ROOF_WIN} from '../chapter1/scenes';
import {CardBackdrop, PhoneCard} from '../chapter1/props';
import {Guard, Scene, Vignette} from '../shots';
import {LOOKS, POSES, Stick} from '../Stick';
import {threeBlinks} from '../vertical';
import type {P} from '../shots';

export const ROOF_RECUT_START = 96;
export const ROOF_RECUT_END = 133;

const roofShots = {
  radio: {x: 1350, y: 1075, z: 2.4},
  hesitation: {x: 1170, y: 1140, z: 3.15},
  message: {x: 1245, y: 1150, z: 2.2},
  reply: {x: 1535, y: 970, z: 1.25},
  listen: {x: 1230, y: 1105, z: 2.8},
};

const DannyOnRoof: React.FC<{p: P; angle: keyof typeof roofShots}> = ({p, angle}) => {
  const camera = roofShots[angle];
  const replying = angle === 'reply';
  const reading = angle === 'message';
  const holdingRadio = angle === 'radio' || angle === 'listen';
  const pose = replying ? POSES.pointUp : holdingRadio ? POSES.radio : {
    ...POSES.standRelax,
    head: reading ? 24 : 8,
    armN: reading ? [35, 125] as [number, number] : POSES.standRelax.armN,
  };
  return (
    <Scene bg="ch2-roof-night" a={camera} b={{...camera, x: camera.x + 24, z: camera.z + .11}} p={p}>
      <Guard
        x={1190} y={1530} h={595} pose={pose}
        propN={replying ? 'flashlight' : reading ? 'phone' : 'radio'}
        propF={reading ? 'radio' : undefined}
        beam={replying && threeBlinks(p.t, .15) > .3 ? 840 : 0}
        eyes="worried" mouth="flat" back={replying} dim={.9}
      />
    </Scene>
  );
};

// Mom's message, held over the night roof in the revised edit rather than a plain backdrop.
const PhoneOnRoof: React.FC<{p: P}> = ({p}) => {
  const phone = <PhoneCard t={p.t + .23} mode="text" barsAt={-.9} />;
  if (!useContext(RetentionContinuity)) return phone;
  return (
    <AbsoluteFill style={{background: '#05080c'}}>
      <World bg="ch2-roof-night" cam={{x: 1250, y: 980, z: 1.25}} width={1920} height={1080} filter="brightness(.45) saturate(.85)" />
      <Vignette o={.55} />
      <CardBackdrop.Provider value={false}>{phone}</CardBackdrop.Provider>
    </AbsoluteFill>
  );
};

// The cuts follow the recorded narration. The last beat returns to Danny
// listening before the existing radio insert resumes at 2:13.
const cutaways: {at: number; draw: (p: P) => React.ReactNode}[] = [
  {at: ROOF_RECUT_START, draw: p => <DannyOnRoof p={p} angle="radio" />},
  {at: 97.55, draw: p => (
    <OfficeScene
      p={p} a={{x: 1660, y: 870, z: 1.16}} b={{x: 1770, y: 870, z: 1.3}}
      filter="brightness(1.1) saturate(.88)"
      danny={{x: 2070, y: 1510, h: 735, pose: POSES.radio, propN: 'radio', mouth: p.t > 1.1 && p.t < 2.5 ? 'open' : 'flat'}}
    />
  )},
  {at: 102.36, draw: p => <DannyOnRoof p={p} angle="hesitation" />},
  {at: 105.35, draw: p => <PhoneOnRoof p={p} />},
  {at: 111.9, draw: p => <DannyOnRoof p={p} angle="message" />},
  {at: 118.2, draw: p => (
    <Scene bg="ch2-roof-night" a={{x: ROOF_WIN.x, y: 460, z: 1.6}} b={{x: ROOF_WIN.x, y: 401, z: 2.65}} p={p} />
  )},
  {at: 122.7, draw: p => (
    <Scene
      bg="apartment" a={{x: 2295, y: 855, z: 2}} b={{x: 2320, y: 830, z: 2.15}} p={p}
      filter="brightness(.74) saturate(.78)" bgFilter="brightness(.6) saturate(.78) hue-rotate(190deg)"
    >
      <Stick x={2330} y={1180} h={330} look={LOOKS.lily} pose={POSES.pointUp} propN="flashlight" beam={threeBlinks(p.t, .16) > .3 ? 500 : 0} back />
    </Scene>
  )},
  {at: 125.4, draw: p => <DannyOnRoof p={p} angle="reply" />},
  {at: 127.6, draw: p => <DannyOnRoof p={p} angle="listen" />},
];

// Source times of the sequence's internal cuts (still screens hold one picture per cut).
export const ROOF_CUTS = cutaways.map(shot => shot.at);

export const RoofCutaways: React.FC<{frame: number}> = ({frame}) => {
  const now = frame / FPS;
  const next = cutaways.findIndex(shot => shot.at > now);
  const index = next < 0 ? cutaways.length - 1 : next - 1;
  const shot = cutaways[index];
  const end = cutaways[index + 1]?.at ?? ROOF_RECUT_END;
  return <>{shot.draw({frame, t: now - shot.at, dur: end - shot.at, ev: {}})}</>;
};
