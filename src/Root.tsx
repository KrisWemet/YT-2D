import React from 'react';
import {Composition, Still} from 'remotion';
import {RigTest} from './pigeon/RigTest';
import {PigeonShort} from './pigeon/Short';
import {DUR, FPS} from './pigeon/timing';
import {HurricaneShort} from './hurricane/Short';
import {HurricaneThumb, PigeonThumb, TickleThumb} from './thumbs/Thumbs';
import {DUR as HDUR} from './hurricane/timing';
import {ChannelBanner, ChannelPicture} from './channel/Channel';
import {TickleShort} from './tickle/Short';
import {DUR as TDUR} from './tickle/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PigeonShort" component={PigeonShort} durationInFrames={Math.round(DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="HurricaneShort" component={HurricaneShort} durationInFrames={Math.round(HDUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="TickleShort" component={TickleShort} durationInFrames={Math.round(TDUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Still id="PigeonThumb" component={PigeonThumb} width={1080} height={1920} />
    <Still id="HurricaneThumb" component={HurricaneThumb} width={1080} height={1920} />
    <Still id="TickleThumb" component={TickleThumb} width={1080} height={1920} />
    <Still id="ChannelBanner" component={ChannelBanner} width={2560} height={1440} />
    <Still id="ChannelPicture" component={ChannelPicture} width={800} height={800} />
    <Composition id="RigTest" component={RigTest} durationInFrames={1} fps={60} width={1080} height={1920} />
  </>
);
