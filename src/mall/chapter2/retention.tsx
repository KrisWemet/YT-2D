import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {makeChapter} from '../MallChapter';
import {CHAPTER2_DEF, CHAPTER2_READY} from './chapter2';
import {RetentionContinuity} from './retention-context';
import {Chapter2Scene} from './scenes';
import {LADDER_APPROACH, LADDER_START, LADDER_DETAIL, LADDER_END} from './continuity';
import {CeilingAngle, FoodChoice, FrozenChoice, GripAngle, ReturnChoice, SecondLight, WallPrints} from './retention-scenes';
import edit from './retention-edit.json';
import ch2 from './ch2.json';
import {IllustratedFigures} from '../Stick';
import {PaintedStoryFrame} from './story-art';

const SourcePicture=makeChapter(CHAPTER2_DEF,{audio:false});
export const RETENTION_FRAMES=edit.frames;
export const RETENTION_READY=CHAPTER2_READY&&edit.audioReady;
const pulses=ch2.cwords.filter(w=>['one','two','three'].includes(w.n)&&w.s>1690&&w.s<1695).map(w=>w.s);

export const Chapter2Retention:React.FC<{styleReview?:boolean}>=({styleReview=false})=>{
 const frame=useCurrentFrame();
 const clip=edit.clips.find(c=>frame>=c.start&&frame<c.start+c.frames)??edit.clips[edit.clips.length-1];
 const local=frame-clip.start;
 const source=('source' in clip?clip.source:0)??0;
 const sourceFrame=source+local,time=sourceFrame/30;
 const angle=clip.kind==='source'?edit.cutaways.find(c=>sourceFrame>=c.sourceStart&&sourceFrame<c.sourceEnd):undefined;
 let picture:React.ReactNode=<SourcePicture sourceFrame={sourceFrame}/>;
 if(clip.kind==='return-choice')picture=<ReturnChoice frame={local}/>;
 else if(styleReview&&frame<408){
  const seconds=frame/30;
  picture=<PaintedStoryFrame name={seconds<6.6||seconds>=10.2?'hook-boot':'hook-grip'} t={seconds<6.6?seconds:seconds<10.2?seconds-6.6:seconds-10.2} dur={seconds<6.6?6.6:seconds<10.2?3.6:3.4} view={seconds>=10.2?'detail':'base'}/>;
 }
 else if(time>=LADDER_APPROACH&&time<LADDER_END){
  const descending=time>=LADDER_START-.2;
  picture=<Chapter2Scene mode={descending?'ladder':'walkway'} section={descending?11:10} variant={0}
   view={descending?(time<LADDER_DETAIL?'base':'detail'):'wide'}
   p={{frame:sourceFrame,t:Math.max(0,time-(descending?LADDER_START:LADDER_APPROACH)),dur:descending?LADDER_END-LADDER_START:5,ev:{}}}/>;
 }
 else if(time>=637.762&&time<657.6)picture=styleReview?<PaintedStoryFrame name="conversation" t={(time-637.762)%7} dur={7} view={time<644.762?'danny':time<651.762?'theo':'wide'}/>:<FoodChoice time={time}/>;
 else if(angle){
  const kind=angle.view;
  if(kind==='ceiling-up'||kind==='ceiling-down')picture=<CeilingAngle up={kind==='ceiling-up'} time={time} boot={time>1200} leg={time<8||time>1073}/>;
  if(kind==='prints-wall')picture=<WallPrints time={time}/>;
  if(kind==='grip')picture=<GripAngle time={time}/>;
  if(kind==='second-light')picture=<SecondLight time={time} pulses={pulses}/>;
  if(kind==='freeze')picture=<FrozenChoice time={time}/>;
 }
 return <RetentionContinuity.Provider value={true}><IllustratedFigures.Provider value={styleReview}><AbsoluteFill style={{background:'#050a10'}}>
  {picture}
  {edit.audioReady&&<Audio src={staticFile('mall/ch2/retention.mp3')}/>}
 </AbsoluteFill></IllustratedFigures.Provider></RetentionContinuity.Provider>;
};
