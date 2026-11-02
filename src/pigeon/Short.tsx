import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, T, VO_AT} from './timing';
import {StreetA, StreetB, StreetC} from './Street';
import {Lab} from './Lab';
import {Close} from './Close';
import {CamGuy} from './CamGuy';
import {Sfx} from './Sfx';

export const PigeonShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < T.cutLab) scene = <StreetA t={t} />;
  else if (t < T.cutClose) scene = <Lab t={t} />;
  else if (t < T.cutStreet2) scene = <Close t={t} />;
  else if (t < T.cutCam) scene = <StreetB t={t} />;
  else if (t < T.cutStreet3) scene = <CamGuy t={t} />;
  else scene = <StreetC t={t} />;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {scene}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('pigeon/vo/take1.mp3')} />
      </Sequence>
      <Sfx />
    </AbsoluteFill>
  );
};
