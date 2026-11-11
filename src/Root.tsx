import React from 'react';
import {makeShort, shortFrames, FPS as SFPS} from './mall/MallShort';
import {SHORT1_DEF, SHORT2_DEF, SHORT3_DEF} from './mall/shortsCh1';
import {chapterFrames, makeChapter, FPS as CFPS} from './mall/MallChapter';
import {CHAPTER1_DEF} from './mall/chapter1/chapter1';
import {Composition, Still} from 'remotion';
import {RigTest} from './pigeon/RigTest';
import {PigeonShort} from './pigeon/Short';
import {DUR, FPS} from './pigeon/timing';
import {HurricaneShort} from './hurricane/Short';
import {HurricaneThumb, PigeonThumb} from './thumbs/Thumbs';
import {DUR as HDUR} from './hurricane/timing';
import {ChannelBanner, ChannelPicture} from './channel/Channel';
import {NightGuardBanner, NightGuardPicture} from './mall/ChannelArt';
import {NightGuardShort1Thumb} from './mall/ShortThumbs';
import {DannyVariants, MarcusVariants} from './mall/MarcusVariants';
import {CH1_CUTS, cutFrames, makeCutShort, FPS as CUT_FPS} from './mall/ChapterShorts';
import {MallTest} from './mall/Test';
import {MallPilot} from './mall/Pilot';
import {MallThumb} from './mall/Thumb';
import {DUR as MDUR, FPS as MFPS} from './mall/timing';

const MallShort1 = makeShort(SHORT1_DEF);
const MallShort2 = makeShort(SHORT2_DEF);
const MallShort3 = makeShort(SHORT3_DEF);
const MallChapter1 = makeChapter(CHAPTER1_DEF);
const CUT_COMPONENTS: Record<string, React.FC> = Object.fromEntries(CH1_CUTS.map((c) => [c.id, makeCutShort(c)]));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PigeonShort" component={PigeonShort} durationInFrames={Math.round(DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="HurricaneShort" component={HurricaneShort} durationInFrames={Math.round(HDUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Still id="PigeonThumb" component={PigeonThumb} width={1080} height={1920} />
    <Still id="HurricaneThumb" component={HurricaneThumb} width={1080} height={1920} />
    <Still id="ChannelBanner" component={ChannelBanner} width={2560} height={1440} />
    <Still id="ChannelPicture" component={ChannelPicture} width={800} height={800} />
    <Still id="NightGuardBanner" component={NightGuardBanner} width={2560} height={1440} />
    <Still id="NightGuardPicture" component={NightGuardPicture} width={800} height={800} />
    <Still id="NightGuardShort1Thumb" component={NightGuardShort1Thumb} width={1080} height={1920} />
    <Still id="MarcusVariants" component={MarcusVariants} width={2560} height={1440} />
    <Still id="DannyVariants" component={DannyVariants} width={2560} height={1440} />
    <Composition id="RigTest" component={RigTest} durationInFrames={1} fps={60} width={1080} height={1920} />
    <Still id="MallTest" component={MallTest} width={1920} height={1080} />
    <Still id="MallThumb" component={MallThumb} width={1920} height={1080} />
    <Composition id="MallPilot" component={MallPilot} durationInFrames={Math.round(MDUR * MFPS)} fps={MFPS} width={1920} height={1080} />
    <Composition id="MallShort1" component={MallShort1} durationInFrames={shortFrames(SHORT1_DEF)} fps={SFPS} width={1080} height={1920} />
    <Composition id="MallShort2" component={MallShort2} durationInFrames={shortFrames(SHORT2_DEF)} fps={SFPS} width={1080} height={1920} />
    <Composition id="MallShort3" component={MallShort3} durationInFrames={shortFrames(SHORT3_DEF)} fps={SFPS} width={1080} height={1920} />
    {CH1_CUTS.map((c) => (
      <Composition key={c.id} id={c.id} component={CUT_COMPONENTS[c.id]} durationInFrames={cutFrames(c)} fps={CUT_FPS} width={1080} height={1920} />
    ))}
    <Composition id="MallChapter1" component={MallChapter1} durationInFrames={chapterFrames(CHAPTER1_DEF)} fps={CFPS} width={1920} height={1080} />
  </>
);
