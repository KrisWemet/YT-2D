import React from 'react';
import {AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {makeChapter, makeChapterOverlay, resolveChapter} from '../MallChapter';
import {SubpixelCamera} from '../World';
import {CHAPTER2_DEF, CHAPTER2_PICTURE, CHAPTER2_READY} from './chapter2';
import {RetentionContinuity} from './retention-context';
import {Chapter2Scene} from './scenes';
import {LADDER_APPROACH, LADDER_START, LADDER_DETAIL, LADDER_END} from './continuity';
import {CeilingAngle, FoodChoice, FrozenChoice, GripAngle, ReturnChoice, SecondLight, WallPrints} from './retention-scenes';
import {ROOF_RECUT_END, ROOF_RECUT_START, RoofCutaways} from './roof-cutaways';
import edit from './retention-edit.json';
import ch2 from './ch2.json';

const FPS=30;
// Painted backgrounds glide on the same sub-pixel camera as the figures (render with
// {"subpixel": false} to compare against the earlier whole-pixel placement).
const SUBPIXEL=((typeof window==='undefined'?{}:getInputProps()) as {subpixel?:boolean}).subpixel!==false;
const SourcePicture=makeChapter(CHAPTER2_DEF,{audio:false,overlays:false});
const Overlay=makeChapterOverlay(CHAPTER2_DEF);
const sourceShots=resolveChapter(CHAPTER2_DEF).shots;
export const RETENTION_FRAMES=edit.frames;
export const RETENTION_READY=CHAPTER2_READY&&edit.audioReady;
const pulses=ch2.cwords.filter(w=>['one','two','three'].includes(w.n)&&w.s>1690&&w.s<1695).map(w=>w.s);
const FOOD_START=637.762,FOOD_END=657.6;
// Nothing on screen may last less than half a second unless it was drawn that way.
const MIN_SHOT=15;

type Clip={kind:string;start:number;frames:number;source?:number;label:string};
const clips=edit.clips as Clip[];
const clipStarts=new Set(clips.map(c=>c.start));
// The danger hook and chapter title carry no tags or badges.
const storyStart=clips.find(c=>c.label==='Story')?.start??0;
const clipAt=(frame:number)=>clips.find(c=>frame>=c.start&&frame<c.start+c.frames)??clips[clips.length-1];
const sourceFrameAt=(frame:number)=>{
 const clip=clipAt(frame);
 return clip.kind==='source'?(clip.source??0)+frame-clip.start:null;
};

// The picture each output frame would show if every edit point were left as cut. `clock` is the
// source frame, or the frame within the visual-only return insert.
const natural=(frame:number):{unit:string;clock:number}=>{
 const clip=clipAt(frame);
 const local=frame-clip.start;
 if(clip.kind==='return-choice')return {unit:'return',clock:local};
 const sf=(clip.source??0)+local,time=sf/FPS;
 if(time>=LADDER_APPROACH&&time<LADDER_END)
  return {unit:time<LADDER_START-.2?'walkway':time<LADDER_DETAIL?'ladder-base':'ladder-detail',clock:sf};
 if(time>=FOOD_START&&time<FOOD_END)return {unit:'food',clock:sf};
 const angle=edit.cutaways.findIndex(c=>sf>=c.sourceStart&&sf<c.sourceEnd);
 if(angle>=0)return {unit:`cutaway:${angle}`,clock:sf};
 let shot=sourceShots.findIndex(s=>time>=s.start&&time<s.end);
 if(shot<0)shot=sourceShots.length-1;
 if(CHAPTER2_PICTURE[shot]?.section===2&&sf>=ROOF_RECUT_START*FPS&&sf<ROOF_RECUT_END*FPS)return {unit:'roof',clock:sf};
 return {unit:`shot:${shot}`,clock:sf};
};

// Runs of one picture on a continuous clock. `end` is exclusive; a run's clock carries on past its
// natural range when it absorbs a neighbour.
type Run={unit:string;start:number;end:number;anchor:number;clock:number};
const buildPlan=()=>{
 const runs:Run[]=[];
 for(let f=0;f<edit.frames;f++){
  const n=natural(f),last=runs[runs.length-1];
  if(last&&last.unit===n.unit&&n.clock===last.clock+f-last.anchor){last.end=f+1;continue;}
  runs.push({unit:n.unit,start:f,end:f+1,anchor:f,clock:n.clock});
 }
 // A trimmed edit can leave a few frames of a neighbouring shot on screen. Give those frames to
 // the picture beside them: at an edit point the cut lands on the edit; beside an inserted
 // picture, the cut stays on the narration word that cued it.
 for(let k=0;k<runs.length;){
  const run=runs[k],prev=runs[k-1],next=runs[k+1];
  if(run.end-run.start>=MIN_SHOT||(!prev&&!next)){k++;continue;}
  let intoNext:boolean;
  if(!prev||!next)intoNext=!prev;
  else if(clipStarts.has(run.start))intoNext=true;
  else if(clipStarts.has(run.end))intoNext=false;
  else{
   const shot=run.unit.startsWith('shot:')?sourceShots[+run.unit.slice(5)]:undefined;
   intoNext=!!shot&&Math.abs(shot.start*FPS-run.clock)<=1.5;
  }
  if(intoNext)next.start=run.start;else prev.end=run.end;
  runs.splice(k,1);
  k=Math.max(0,k-1);
 }
 return runs;
};
const plan=buildPlan();
const runAt=(frame:number)=>{
 let lo=0,hi=plan.length-1;
 while(lo<hi){const mid=(lo+hi+1)>>1;if(plan[mid].start<=frame)lo=mid;else hi=mid-1;}
 return plan[lo];
};
export const RETENTION_PLAN=plan.map(r=>({unit:r.unit,start:r.start,end:r.end}));

// The inserted angles are painted plates. A slow push toward each subject keeps them alive like the
// drifting camera everywhere else; the frozen thumb-on-switch moment creeps in for tension.
const PUSH:Record<string,[number,string]>={
 'ceiling-up':[1.05,'53% 48%'],'ceiling-down':[1.035,'50% 56%'],'prints-wall':[1.06,'57% 55%'],
 grip:[1.07,'47% 52%'],'second-light':[1.06,'64% 66%'],freeze:[1.09,'44% 32%'],
};
const Push:React.FC<{zoom:number;origin:string;children:React.ReactNode}>=({zoom,origin,children})=>
 <AbsoluteFill style={{overflow:'hidden'}}><AbsoluteFill style={{transform:`scale(${zoom})`,transformOrigin:origin}}>{children}</AbsoluteFill></AbsoluteFill>;

const draw=(unit:string,clock:number):React.ReactNode=>{
 const time=clock/FPS;
 if(unit==='return')return <ReturnChoice frame={clock}/>;
 if(unit==='food')return <FoodChoice time={time}/>;
 if(unit==='roof')return <RoofCutaways frame={clock}/>;
 if(unit==='walkway'||unit.startsWith('ladder')){
  const descending=unit!=='walkway';
  return <Chapter2Scene mode={descending?'ladder':'walkway'} section={descending?11:10} variant={0}
   view={descending?(unit==='ladder-base'?'base':'detail'):'wide'}
   p={{frame:clock,t:Math.max(0,time-(descending?LADDER_START:LADDER_APPROACH)),dur:descending?LADDER_END-LADDER_START:5,ev:{}}}/>;
 }
 if(unit.startsWith('cutaway:')){
  const angle=edit.cutaways[+unit.slice(8)],kind=angle.view;
  const k=(clock-angle.sourceStart)/(angle.sourceEnd-angle.sourceStart);
  const [to,origin]=PUSH[kind]??[1,'50% 50%'];
  const view=kind==='ceiling-up'||kind==='ceiling-down'?<CeilingAngle up={kind==='ceiling-up'} time={time} boot={time>1200} leg={time<8||time>1073}/>:
   kind==='prints-wall'?<WallPrints time={time}/>:kind==='grip'?<GripAngle time={time}/>:
   kind==='second-light'?<SecondLight time={time} pulses={pulses}/>:<FrozenChoice time={time}/>;
  return <Push zoom={1+(to-1)*Math.max(0,Math.min(1.25,k))} origin={origin}>{view}</Push>;
 }
 return <SourcePicture sourceFrame={clock} shot={+unit.slice(5)}/>;
};

// "Where and when" tags follow the edit: each section's tag opens on its first retained frame,
// including sections whose opening sentences were trimmed. The cold open stays untitled.
const firstRetained=(n:number)=>{
 const part=ch2.parts.find(p=>p.n===n)!;
 for(const clip of clips){
  if(clip.kind!=='source')continue;
  const a=Math.max(clip.source??0,Math.round((part.s-.1)*FPS)),b=Math.min((clip.source??0)+clip.frames,Math.round(part.e*FPS));
  if(a<b)return clip.start+a-(clip.source??0);
 }
 return undefined;
};
const tagStarts=ch2.parts.filter(p=>p.n>=2).map(p=>({frame:firstRetained(p.n),text:p.tag.toUpperCase(),n:p.n}))
 .filter((t):t is {frame:number;text:string;n:number}=>t.frame!==undefined);

// Fades through black only where the story moves to another night, day or place. Each sits on the
// picture cut nearest the new section; continuous action between sections keeps its hard cuts.
const DIPS:Record<number,[number,number]>={2:[10,12],3:[12,12],4:[12,12],5:[8,9],8:[12,12],13:[12,12],14:[8,10]};
const cuts=plan.slice(1).map(r=>r.start);
const nearestCut=(frame:number)=>cuts.reduce((best,c)=>Math.abs(c-frame)<Math.abs(best-frame)?c:best,cuts[0]);
const endCard=Math.round(ch2.duration*FPS);
const endCardFrame=(()=>{for(const clip of clips){if(clip.kind==='source'&&endCard>=(clip.source??0)&&endCard<(clip.source??0)+clip.frames)return clip.start+endCard-(clip.source??0);}return edit.frames-300;})();
const dips=[
 ...tagStarts.filter(t=>DIPS[t.n]).map(t=>({at:nearestCut(t.frame),out:DIPS[t.n][0],in:DIPS[t.n][1]})),
 {at:nearestCut(endCardFrame),out:12,in:15},
];
const smooth=(x:number)=>{const k=Math.max(0,Math.min(1,x));return k*k*(3-2*k);};
const brightness=(frame:number)=>{
 let k=Math.min(smooth((frame+1)/7),smooth((edit.frames-frame)/24));
 for(const d of dips){
  if(frame<d.at&&frame>=d.at-d.out)k=Math.min(k,smooth((d.at-frame-.5)/d.out));
  if(frame>=d.at&&frame<d.at+d.in)k=Math.min(k,smooth((frame-d.at+.5)/d.in));
 }
 return k;
};
export const RETENTION_DIPS=dips;

// Memories and imagined scenes dissolve in and out; everything else keeps the edit's hard cuts.
const MEMORY=new Set(['fitting','fitting-empty','office-memory','cinema-memory','medicine','drill','drill-clock','service-crowd','service-exit','dept-gate']);
const modeOf=(unit:string)=>unit.startsWith('shot:')?CHAPTER2_PICTURE[+unit.slice(5)]?.mode:unit;
// The woman in Vera's story fades out of the fitting room as Danny remembers finding it empty.
const SLOW_DISSOLVE:Record<string,number>={'fitting>fitting-empty':24};
const dissolves=plan.slice(1).map((next,k)=>({at:next.start,prev:plan[k],next,
  len:SLOW_DISSOLVE[`${modeOf(plan[k].unit)}>${modeOf(next.unit)}`]??8}))
 .filter(c=>c.len>8||MEMORY.has(modeOf(c.prev.unit)??'')!==MEMORY.has(modeOf(c.next.unit)??''))
 .filter(c=>!dips.some(d=>Math.abs(d.at-c.at)<30));
export const RETENTION_DISSOLVES=dissolves.map(c=>c.at);
const runPicture=(run:Run,frame:number)=>draw(run.unit,run.clock+frame-run.anchor);

export const Chapter2Retention:React.FC=()=>{
 const frame=useCurrentFrame();
 const blend=dissolves.find(c=>frame>=c.at-c.len/2&&frame<c.at+c.len/2);
 const picture=blend?<>
  {runPicture(blend.prev,frame)}
  <AbsoluteFill style={{opacity:smooth((frame-blend.at+blend.len/2+.5)/blend.len)}}>{runPicture(blend.next,frame)}</AbsoluteFill>
 </>:runPicture(runAt(frame),frame);
 const sf=sourceFrameAt(frame);
 const tag=[...tagStarts].reverse().find(t=>frame>=t.frame);
 const elapsed=tag?(frame-tag.frame)/FPS:Infinity;
 const light=brightness(frame);
 return <RetentionContinuity.Provider value={true}><SubpixelCamera.Provider value={SUBPIXEL}><AbsoluteFill style={{background:'#050a10'}}>
  <AbsoluteFill style={{opacity:light}}>{picture}</AbsoluteFill>
  {sf!==null&&frame>=storyStart&&<Overlay t={sf/FPS} tag={tag&&elapsed<4?{text:tag.text,t:sf/FPS-elapsed}:null}/>}
  {edit.audioReady&&<Audio src={staticFile('mall/ch2/retention.mp3')}/>}
 </AbsoluteFill></SubpixelCamera.Provider></RetentionContinuity.Provider>;
};
