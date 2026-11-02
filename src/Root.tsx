import React from 'react';
import {Composition, Still} from 'remotion';
import {RigTest} from './pigeon/RigTest';
import {PigeonShort} from './pigeon/Short';
import {DUR, FPS} from './pigeon/timing';
import {HurricaneShort} from './hurricane/Short';
import {HurricaneThumb, PigeonThumb} from './thumbs/Thumbs';
import {DUR as HDUR} from './hurricane/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PigeonShort" component={PigeonShort} durationInFrames={Math.round(DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="HurricaneShort" component={HurricaneShort} durationInFrames={Math.round(HDUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Still id="PigeonThumb" component={PigeonThumb} width={1080} height={1920} />
    <Still id="HurricaneThumb" component={HurricaneThumb} width={1080} height={1920} />
    <Composition id="RigTest" component={RigTest} durationInFrames={1} fps={60} width={1080} height={1920} />
  </>
);
