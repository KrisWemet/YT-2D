import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, VO_AT} from './timing';
import {TickleScene} from './Scene';
import {TickleSfx} from './Sfx';
import {useFont} from '../thumbs/Thumbs';

export const TickleShort: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <TickleScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('tickle/vo/take2.mp3')} />
      </Sequence>
      <TickleSfx />
    </AbsoluteFill>
  );
};
