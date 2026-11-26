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
import {IllustratedPartOne} from './illustrated-part-one';

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
 if(styleReview)return <AbsoluteFill><IllustratedPartOne frame={frame}/>{edit.audioReady&&<Audio src={staticFile('mall/ch2/retention.mp3')}/>}</AbsoluteFill>;
 let picture:React.ReactNode=<SourcePicture sourceFrame={sourceFrame}/>;
 if(clip.kind==='return-choice')picture=<ReturnChoice frame={local}/>;
 else if(time>=LADDER_APPROACH&&time<LADDER_END){
  const descending=time>=LADDER_START-.2;
  picture=<Chapter2Scene mode={descending?'ladder':'walkway'} section={descending?11:10} variant={0}
   view={descending?(time<LADDER_DETAIL?'base':'detail'):'wide'}
   p={{frame:sourceFrame,t:Math.max(0,time-(descending?LADDER_START:LADDER_APPROACH)),dur:descending?LADDER_END-LADDER_START:5,ev:{}}}/>;
 }
 else if(time>=637.762&&time<657.6)picture=<FoodChoice time={time}/>;
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
