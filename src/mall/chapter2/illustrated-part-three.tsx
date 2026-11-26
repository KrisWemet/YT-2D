import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import plan from './illustrated-part-three.json';

export const ILLUSTRATED_PART_THREE_FRAMES=plan.frames;
export const ILLUSTRATED_PART_THREE_SHOTS=plan.shots;
const active=(t:number,starts:number[],duration=.2)=>starts.some(s=>t>=s&&t<s+duration);

// Source-clock pulses are seek-safe; every spoken three-flash signal is three
// distinct on/off events, and no code-generated character layers are used.
export const finaleSignals=(frame:number)=>{
 const t=frame/30;
 return {
  soloWindow:active(t,[182.998,183.398,183.798]),
  soloFlashlight:active(t,[184.358,184.758,185.158]),
  lily:active(t,[330.505,330.985,331.485]),
  danny:active(t,[333.1,333.6,334.1]),
  vera:active(t,[345.996,346.476,347.076]),
 };
};

export const IllustratedPartThreePicture:React.FC<{frame:number}>=({frame})=>{
 const index=plan.shots.findIndex(s=>frame>=s.start&&frame<s.start+s.frames);
 if(index<0)throw new Error(`No finale painting at frame ${frame}`);
 const shot=plan.shots[index],t=frame/30;
 const p=Math.max(0,Math.min(1,(frame-shot.start)/Math.max(1,shot.frames-1)));
 const close=shot.view!=='wide';
 const zoom=(close?1.065:1.025)+.045*(index%3===1?1-p:p);
 const pan=(index%2?1:-1)*(p-.5)*10;
 const name=shot.asset.split('/').at(-1);
 const signal=finaleSignals(frame);
 const lights=[
  {id:'soloWindow',on:name==='roof-solo'&&signal.soloWindow,x:88.1,y:23.1,w:.8,h:1.7},
  {id:'soloFlashlight',on:name==='roof-solo'&&signal.soloFlashlight,x:28.29,y:50.9,w:1.4,h:2.2},
  {id:'lily',on:name==='lily-window'&&signal.lily,x:91.27,y:15.1,w:1.35,h:2.5},
  {id:'danny',on:name==='danny-answer'&&signal.danny,x:30.8,y:42.9,w:2.2,h:3.6},
  {id:'vera',on:name==='vera-signal'&&signal.vera,x:86.9,y:50.0,w:.65,h:1.15},
 ];
 const tag=name==='keys-loose'?{x:44,y:73.5,angle:25,size:37}:name==='b3-final'?{x:57.3,y:61.2,angle:-19,size:43}:null;
 return <AbsoluteFill style={{background:'#0a1423',overflow:'hidden'}}>
  <AbsoluteFill style={{transform:`translateX(${pan}px) scale(${zoom})`,transformOrigin:close?'50% 52%':'50% 47%'}}>
   <Img src={staticFile(`mall/ch2/story-art/${shot.asset}.png`)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
   {lights.filter(l=>l.on).map(l=><div key={l.id} data-signal={l.id} style={{position:'absolute',left:`${l.x}%`,top:`${l.y}%`,width:`${l.w}%`,height:`${l.h}%`,transform:'translate(-50%,-50%)',borderRadius:l.id.toLowerCase().includes('window')||l.id==='lily'?2:'50%',background:'#fff7d0',boxShadow:'0 0 9px 3px #fff0b9, 0 0 35px 10px #e7d7ac99',opacity:.96}}/>)}
   {tag&&<div data-key-tag="B3" style={{position:'absolute',left:`${tag.x}%`,top:`${tag.y}%`,transform:`translate(-50%,-50%) rotate(${tag.angle}deg)`,font:`700 ${tag.size}px Georgia, serif`,letterSpacing:1,color:'#d9c495',textShadow:'1px 1px 2px #572e1c',opacity:.9}}>B3</div>}
  </AbsoluteFill>
  {t<3&&<div style={{position:'absolute',left:65,top:54,padding:'13px 22px',borderLeft:'3px solid #cdb375',background:'#081321cf',color:'#e9e6dc',font:'600 23px DejaVu Sans, sans-serif',letterSpacing:2}}>FIRST NIGHT · 1:30 A.M.</div>}
  {t>=220.7&&t<224.7&&<div style={{position:'absolute',left:65,top:54,padding:'13px 22px',background:'#081321cf',color:'#e9e6dc',font:'600 23px DejaVu Sans, sans-serif'}}>DAY 5 · SUMMIT OUTDOORS</div>}
  {t>=310.1&&t<314&&<div style={{position:'absolute',left:65,top:54,padding:'13px 22px',background:'#081321cf',color:'#e9e6dc',font:'600 23px DejaVu Sans, sans-serif'}}>DAY 5 · NINE O’CLOCK</div>}
  {frame>=plan.frames-300&&<AbsoluteFill data-end-card style={{justifyContent:'center',alignItems:'center',background:'#050d1dbd',color:'#eee8da',fontFamily:'DejaVu Sans, sans-serif',textAlign:'center'}}>
   <div style={{fontSize:28,letterSpacing:7,color:'#d6b870',marginBottom:24}}>THE NIGHT GUARD · CHAPTER TWO</div>
   <div style={{fontSize:65,fontWeight:700,marginBottom:28}}>What’s behind B3?</div>
   <div style={{fontSize:27,color:'#c0c8d7'}}>Next chapter · The Pharmacy</div>
  </AbsoluteFill>}
 </AbsoluteFill>;
};

export const IllustratedPartThree:React.FC=()=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill><IllustratedPartThreePicture frame={frame}/><Audio src={staticFile('mall/ch2/retention.mp3')} startFrom={plan.retentionStartFrame} endAt={plan.retentionStoryEndFrame}/></AbsoluteFill>;
};
