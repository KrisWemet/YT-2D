import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../../thumbs/Thumbs';
import {ChapterSfx, FPS, resolveChapter, SegTag} from '../MallChapter';
import {RadioBadge, Screen} from '../Overlays';
import {CHAPTER1_DEF} from './chapter1';
import plan from './painted-edit.json';

export const PAINTED_CHAPTER1_FRAMES = plan.frames;
export const PAINTED_CHAPTER1_SHOTS = plan.shots;
const chapter = resolveChapter(CHAPTER1_DEF);
export const paintedAssetPath = (asset: string) => asset.startsWith('ch2/')
  ? `mall/ch2/story-art/${asset.slice(4)}.png`
  : `mall/ch1/story-art/painted-v1/${asset}.png`;

// Every cut uses one complete painting. Reframes count as uses of that same
// source image; there are no code-generated people layered onto these frames.
export const PaintedChapter1Picture: React.FC<{frame: number}> = ({frame}) => {
  const index = plan.shots.findIndex(s => frame >= s.start && frame < s.start + s.frames);
  if (index < 0) throw new Error(`No Chapter One painting for frame ${frame}`);
  const shot = plan.shots[index];
  const progress = Math.max(0, Math.min(1, (frame - shot.start) / Math.max(1, shot.frames - 1)));
  const reverse = index % 3 === 1;
  const close = shot.view === 'detail' || shot.view === 'character';
  const phoneClose = shot.asset === 'phone-message' && close;
  const signalClose = shot.asset === 'tower-signal' && close;
  const zoom = (phoneClose ? 1.61 : signalClose ? 1.8 : close ? 1.09 : 1.025) + .055 * (reverse ? 1 - progress : progress);
  const focus = phoneClose ? '68% 50%' : signalClose ? '78% 12%' : '50% 47%';
  const pan = (index % 2 ? 1 : -1) * (progress - .5) * 10;
  const t = frame / FPS;
  // Three distinct flashes on the existing spoken "one / two / three" cues.
  const signalOn = t >= 847.5 || [[846.521,846.72],[846.832,847.03],[847.143,847.39]].some(([a,b]) => t >= a && t < b);
  return <AbsoluteFill style={{background: '#0e1826', overflow: 'hidden'}}>
    <AbsoluteFill style={{transform: `translateX(${pan}px) scale(${zoom})`, transformOrigin: focus}}>
      <Img src={staticFile(paintedAssetPath(shot.asset))} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {shot.asset === 'tower-signal' && !signalOn && <div style={{position: 'absolute', left: '76.35%', top: '9.35%', width: '3.9%', height: '3.75%', background: '#030b16', opacity: .97, transform: 'skewY(-6deg)'}}/>}
      {shot.asset === 'tower-signal' && signalOn && <div style={{position: 'absolute', left: '78.38%', top: '12.15%', width: 38, height: 38, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(circle,#fff 0 5%,#ecf4ffc9 8%,#d6e8ff3b 24%,transparent 70%)', mixBlendMode: 'screen'}}/>}
      {shot.asset === 'phone-message' && <div style={{position: 'absolute', left: '62.2%', top: '26.2%', width: '12.1%', height: '46.5%', padding: '22px 15px', boxSizing: 'border-box', overflow: 'hidden', color: '#f0f3fb', fontFamily: 'DejaVu Sans, sans-serif', transform: 'rotate(.8deg)'}}>
        <div style={{fontSize: 25, fontWeight: 700, marginBottom: 8}}>Mom</div>
        <div style={{fontSize: 17, color: '#a6bbd5', marginBottom: 25}}>2:14 A.M.</div>
        {t >= 668.653 ? <div style={{fontSize: 25, lineHeight: 1.45}}>Lily is with me.<br/>Door locked.<br/>Do <strong>NOT</strong> come.</div> : <div style={{fontSize: 21, color: '#c9d9ec'}}>1 new message</div>}
      </div>}
      {shot.asset === 'phone-reply' && <div style={{position: 'absolute', left: '46.45%', top: '49%', width: '5.8%', height: '17.8%', padding: '10px 5px', boxSizing: 'border-box', overflow: 'hidden', color: '#dce6f4', fontFamily: 'DejaVu Sans, sans-serif', fontSize: 10, lineHeight: 1.4}}>
        <div style={{fontWeight: 700, marginBottom: 8}}>Mom</div>Stay put. I love you. Tell Lily the king’s still in his castle.
        <div style={{marginTop: 9, color: '#96b3c5'}}>{t >= 687.105 ? 'Delivered · No signal' : 'Sending…'}</div>
      </div>}
    </AbsoluteFill>
  </AbsoluteFill>;
};

const InformationCard: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) =>
  <div style={{position: 'absolute', right: 72, bottom: 72, maxWidth: 650, padding: '26px 34px', borderLeft: '5px solid #dab95a', borderRadius: 12, background: '#0b1526ed', color: '#f0eee5', fontFamily: 'DejaVu Sans, sans-serif', boxShadow: '0 8px 30px #0008'}}>
    <div style={{fontSize: 24, fontWeight: 700, letterSpacing: 3, color: '#dab95a', marginBottom: 12}}>{label}</div>
    <div style={{fontSize: 34, lineHeight: 1.4}}>{children}</div>
  </div>;

// Readable story information stays native text; all characters and scenery
// come from the artwork. These cards follow the existing spoken-word clock.
export const PaintedChapter1Information: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  const shot = plan.shots.find(s => frame >= s.start && frame < s.start + s.frames);
  if (shot?.overlay === 'title' || shot?.overlay === 'end') {
    const title = shot.overlay === 'title';
    return <AbsoluteFill style={{justifyContent: 'center', alignItems: title ? 'flex-end' : 'center', padding: 110, background: title ? 'linear-gradient(90deg,transparent 20%,#07101cd9 74%)' : '#07101c9c', color: '#f2eee3', fontFamily: 'DejaVu Sans, sans-serif', textAlign: title ? 'right' : 'center'}}>
      <div style={{maxWidth: title ? 1000 : 1500}}>
        <div style={{fontSize: 30, letterSpacing: 8, color: '#d9b75d', fontWeight: 700, marginBottom: 24}}>{title ? 'THE NIGHT GUARD · CHAPTER ONE' : 'THE NIGHT GUARD · CHAPTER TWO'}</div>
        <div style={{fontSize: title ? 88 : 92, lineHeight: 1.12, fontWeight: 800, whiteSpace: 'pre-line', textShadow: '0 5px 22px #000'}}>{title ? 'THE KING\nOF THE MALL' : 'THE BOY IN THE CEILING'}</div>
        {!title && <div style={{fontSize: 34, marginTop: 30, color: '#c8d0dc'}}>The story continues.</div>}
      </div>
    </AbsoluteFill>;
  }
  if (t >= 246.828 && t < 251.113) return <InformationCard label="UNTIL THEY REACH THE OFFICE">4 MINUTES</InformationCard>;
  if (t >= 680.677 && t < 692.201) return <InformationCard label={t < 687.105 ? 'DANNY' : 'DELIVERED · NO SIGNAL'}>Stay put. I love you.<br/>Tell Lily the king’s still in his castle.</InformationCard>;
  if (t >= 717.262 && t < 734.875) return <InformationCard label="SUPPLIES">72 water bottles · 40 bars<br/>{t >= 727.188 ? 'About 12 days of water' : 'Meals · Stove · Filters'}</InformationCard>;
  if (t >= 739.497 && t < 745.578) return <InformationCard label="THE PROBLEM">Rescue: 30 days<br/>Mom’s insulin: 10 days</InformationCard>;
  return null;
};

export const PaintedChapter1: React.FC = () => {
  useFont();
  const frame = useCurrentFrame(), t = frame / FPS;
  const tag = [...chapter.tags].reverse().find(g => t >= g.t);
  const radio = chapter.cues.segments.find(g => g.kind === 'radio' && t >= g.s - .05 && t <= g.e + .2);
  const name = radio ? CHAPTER1_DEF.radioNames[radio.id ?? ''] ?? 'RADIO' : null;
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <PaintedChapter1Picture frame={frame}/>
    <PaintedChapter1Information frame={frame}/>
    {t < CHAPTER1_DEF.data.duration && <Screen>
      {tag && <SegTag text={tag.text} t={t - tag.t}/>}
      {name && <RadioBadge name={name === 'EMERGENCY ALERT' ? 'EMERGENCY' : name} t={t} color={name === 'MARCUS' ? '#8fd18a' : name === 'EMERGENCY ALERT' ? '#f0c53c' : '#e58fb4'}/>}
    </Screen>}
    <Audio src={staticFile(CHAPTER1_DEF.vo)}/>
    <ChapterSfx r={chapter}/>
  </AbsoluteFill>;
};
