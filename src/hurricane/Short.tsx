import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, VO_AT} from './timing';
import {HurricaneScene} from './Scene';
import {HurricaneSfx} from './Sfx';

export const HurricaneShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <HurricaneScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('hurricane/vo/take1.mp3')} />
      </Sequence>
      <HurricaneSfx />
    </AbsoluteFill>
  );
};
