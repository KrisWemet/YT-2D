import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import plan from './illustrated-part-two.json';

export const ILLUSTRATED_PART_TWO_FRAMES = plan.frames;
export const ILLUSTRATED_PART_TWO_SHOTS = plan.shots;
const storyFrames = plan.retentionStoryEndFrame - plan.retentionStartFrame;

// A complete painting owns each frame. Camera changes count as image uses;
// this track never falls back to the native character renderers.
export const IllustratedPartTwoPicture: React.FC<{frame: number}> = ({frame}) => {
  const index = plan.shots.findIndex(s => frame >= s.start && frame < s.start + s.frames);
  if (index < 0) throw new Error(`No Part Two painting for frame ${frame}`);
  const shot = plan.shots[index];
  const p = Math.max(0, Math.min(1, (frame - shot.start) / Math.max(1, shot.frames - 1)));
  const close = shot.view !== 'wide';
  const zoom = (close ? 1.07 : 1.025) + .045 * (index % 3 === 1 ? 1 - p : p);
  const pan = (index % 2 ? 1 : -1) * (p - .5) * 10;
  const t = frame / 30;
  return <AbsoluteFill style={{background: '#0e1826', overflow: 'hidden'}}>
    <Img src={staticFile(`mall/ch2/story-art/${shot.asset}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translateX(${pan}px) scale(${zoom})`, transformOrigin: close ? '50% 54%' : '50% 47%'}}/>
    {((t < 4) || (t >= 124 && t < 128)) && <div style={{position: 'absolute', left: 65, top: 54, padding: '13px 22px', borderLeft: '3px solid #cdb375', background: '#081321cf', color: '#e9e6dc', font: '600 23px DejaVu Sans, sans-serif', letterSpacing: 2}}>{t < 4 ? 'DAY 3 · THE WATER PLAN' : 'DAY 4 · BEFORE DAWN'}</div>}
    {t >= 201.6 && t < 207 && <div style={{position: 'absolute', left: 65, bottom: 60, padding: '15px 23px', background: '#081321d9', color: '#e9e6dc', font: '600 26px DejaVu Sans, sans-serif'}}>KEY 17 · CINEMA SERVICE</div>}
    {t >= 503 && t < 508 && <div style={{position: 'absolute', left: 65, bottom: 60, padding: '16px 25px', background: '#081321dc', color: '#e9e6dc', font: '600 30px DejaVu Sans, sans-serif'}}>TANK CAPACITY · 8,000 GALLONS</div>}
    {t >= 585.5 && t < 589.5 && <div style={{position: 'absolute', left: 65, bottom: 60, padding: '14px 23px', background: '#081321df', color: '#e9e6dc', font: '600 25px DejaVu Sans, sans-serif'}}>FIRST NIGHT · 1:30 A.M.</div>}
    {frame >= storyFrames && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '65px 85px', background: 'linear-gradient(transparent,#030811ed)', color: '#eee9df', textAlign: 'center', font: '600 39px DejaVu Sans, sans-serif', letterSpacing: 1}}>What were they trying to reach?</div>}
  </AbsoluteFill>;
};

export const IllustratedPartTwo: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill>
    <IllustratedPartTwoPicture frame={frame}/>
    <Sequence durationInFrames={storyFrames}>
      <Audio src={staticFile('mall/ch2/retention.mp3')} startFrom={plan.retentionStartFrame} endAt={plan.retentionStoryEndFrame}/>
    </Sequence>
  </AbsoluteFill>;
};
