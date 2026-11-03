import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, VO_AT} from './timing';
import {PisaScene} from './Scene';
import {PisaSfx} from './Sfx';
import {useFont} from '../thumbs/Thumbs';

export const PisaShort: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <PisaScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('pisa/vo/take2.mp3')} />
      </Sequence>
      <PisaSfx />
    </AbsoluteFill>
  );
};
