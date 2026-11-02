import React from 'react';
import {Composition} from 'remotion';
import {RigTest} from './pigeon/RigTest';
import {PigeonShort} from './pigeon/Short';
import {DUR, FPS} from './pigeon/timing';
import {HurricaneShort} from './hurricane/Short';
import {DUR as HDUR} from './hurricane/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PigeonShort" component={PigeonShort} durationInFrames={Math.round(DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="HurricaneShort" component={HurricaneShort} durationInFrames={Math.round(HDUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="RigTest" component={RigTest} durationInFrames={1} fps={60} width={1080} height={1920} />
  </>
);
