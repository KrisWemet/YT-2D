import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import plan from './illustrated-part-one.json';

export const ILLUSTRATED_PART_ONE_FRAMES=plan.frames;
export const ILLUSTRATED_PART_ONE_SHOTS=plan.shots;

// This exhaustive final-clock track intentionally bypasses all native figure
// renderers. Each row counts as one image use, regardless of camera treatment.
export const IllustratedPartOne:React.FC<{frame:number}>=({frame})=>{
 const index=plan.shots.findIndex(s=>frame>=s.start&&frame<s.start+s.frames);
 if(index<0)throw new Error(`No illustrated shot for review frame ${frame}`);
 const shot=plan.shots[index];
 const progress=Math.max(0,Math.min(1,(frame-shot.start)/Math.max(1,shot.frames-1)));
 const gate=shot.view==='gate',detail=shot.view==='detail',danny=shot.view==='danny',theo=shot.view==='theo';
 const focusX=gate?40:danny?28:theo?76:detail?62:50;
 const focusY=gate?50:detail?62:46;
 const reverse=index%3===1;
 const zoom=(gate?2.65:detail?1.16:danny||theo?1.1:1.025)+.065*(reverse?1-progress:progress);
 const pan=(index%2?1:-1)*(progress-.5)*12;
 return <AbsoluteFill style={{background:'#0e1826',overflow:'hidden'}}>
  <Img src={staticFile(`mall/ch2/story-art/${shot.asset}.png`)}
   style={{width:'100%',height:'100%',objectFit:'cover',transform:`translateX(${pan}px) scale(${zoom})`,transformOrigin:`${focusX}% ${focusY}%`}}/>
 </AbsoluteFill>;
};
