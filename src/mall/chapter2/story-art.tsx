import React from 'react';
import {AbsoluteFill,Img,staticFile} from 'remotion';
import {Screen} from '../Overlays';

// Full character-in-environment illustrations, generated from the user's visual
// reference and the existing mall plates. Detail cuts keep the jointed rig alive.
export const storyArtwork=(mode:string,section:number,view:string,time=0)=>{
 if(mode==='sleep')return 'sleep';
 if(mode==='search-bag')return 'search-bag';
 if(mode==='food-two')return 'two-bars';
 if(mode==='food')return 'one-bar';
 if(mode==='lock')return 'gate-check';
 if(mode==='inventory'||mode==='receipt')return 'inventory';
 if(mode==='stock-wait'||mode==='stock-box')return 'stock-wait';
 if(mode==='stock-radio'||mode==='vera'&&section===3)return 'stock-radio';
 if(mode==='box-detail')return 'box-latch';
 if(mode==='chalk')return 'chalk-no-bait';
 if(mode==='box-bait')return 'chalk';
 if(mode==='prints')return 'prints';
 if(['rack','rack-prints','rack-top','tile'].includes(mode))return 'rack-look';
 if(mode==='rack-wait')return 'rack-wait';
 if(['theo-box','theo-holds-bar','theo-close'].includes(mode))return 'theo-food';
 if(mode==='theo-perch')return 'theo-perch';
 if(mode==='confront'&&section===5)return time<514?'theo-food':'theo-perch';
 if(mode==='confront'&&section===6&&time<674)return 'conversation';
 if(mode==='trainer'&&section===6)return 'theo-tape';
 if(mode==='hall-marcus'||mode==='gate-shadow')return 'marcus-gate';
 if(mode==='water'&&section===6)return 'water-choice';
 if(mode==='plan'&&view==='base')return 'route';
 if(mode==='bandage'&&section===13&&view==='base')return 'bandage';
 if((mode==='vera'||mode==='roof-radio'||mode==='roof')&&section===2)return 'roof-radio';
 if(mode==='tank'&&section===11&&view==='base')return 'pump';
 if(mode==='talk'&&section<=7)return 'conversation';
 return undefined;
};

export const PaintedStoryFrame:React.FC<{name:string;t:number;dur:number;view?:string;mode?:string}>=({name,t,dur,view='base',mode})=>{
 const progress=Math.max(0,Math.min(1,t/Math.max(.1,dur)));
 const close=view==='detail',character=view==='danny'||view==='theo';
 const zoom=(close?1.18:character?1.12:1)+.022*progress;
 const origin=view==='danny'?'30% 44%':view==='theo'?'76% 46%':
  close&&name==='rack-look'?'80% 22%':close&&name==='prints'?'65% 78%':
  close&&['inventory','chalk','chalk-no-bait','box-latch'].includes(name)?'65% 72%':name==='roof-radio'?'35% 42%':'50% 60%';
 return <AbsoluteFill style={{background:'#0e1826',overflow:'hidden'}}>
  <AbsoluteFill style={{transform:`scale(${zoom})`,transformOrigin:origin}}>
   <Img src={staticFile(`mall/ch2/story-art/${name}.png`)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
   {name==='pump'&&<Screen><text x={954} y={482} textAnchor="middle" fill="#353a33" fontFamily="DejaVu Sans,sans-serif" fontSize={27} fontWeight={900}>8,000 GALLONS</text></Screen>}
  </AbsoluteFill>
 </AbsoluteFill>;
};
