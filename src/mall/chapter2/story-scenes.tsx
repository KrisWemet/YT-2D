import React from 'react';
import {Guard, Scene} from '../shots';
import {POSES, jointsOf, skeleton} from '../Stick';
import type {Pose} from '../Stick';
import {blink, blendPose, ease} from './motion';
import {STORY_CUES as C, reachHand, storyProgress} from './story-acting';
import type {Chapter2Scene, Theo as TheoType, Jug as JugType} from './scenes';

type Props=React.ComponentProps<typeof Chapter2Scene>&{TheoFigure:typeof TheoType;WaterJug:typeof JugType};
const INK='#0b0c0c',CHALK='#e0dfcb';
const cam=(x:number,y:number,z:number)=>({x,y,z});
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const FoodBar:React.FC<{x:number;y:number;rotate?:number}>=({x,y,rotate=0})=><g transform={`translate(${x},${y}) rotate(${rotate})`}>
 <path d="M-51-17H51l8-5v40l-8-4H-51l-8 4v-40Z" fill="#c4a46c" stroke={INK} strokeWidth={5}/>
 <rect x={-33} y={-13} width={66} height={26} fill="#4e6a60"/><path d="M-18-3h36M-18 5h25" stroke="#d6d4ac" strokeWidth={3}/>
</g>;
const FoodBox:React.FC<{x:number;y:number}>=({x,y})=><g transform={`translate(${x},${y})`}>
 <path d="M-155-80H155L140 70H-140Z" fill="#657c87" stroke={INK} strokeWidth={8}/>
 <path d="M-162-82H162V-65H-162Z" fill="#8b9da4" stroke={INK} strokeWidth={7}/>
 <path d="M-103-65v27M103-65v27" stroke={INK} strokeWidth={13}/>
</g>;

// These are scenes in Maplecrest, not generic object cards. The existing frame
// clock drives each physical action across every additional camera angle.
export const CharacterStoryScene:React.FC<Props>=props=>{
 const {p,mode,section,view='base',speech,TheoFigure:Theo,WaterJug:Jug}=props;
 const time=p.frame/30;
 const isDetail=view==='detail';
 if(mode==='vera'){
  const roof=section===2,hall=section===12;
  const x=roof?1190:hall?1310:1110,y=roof?1530:1460,h=roof?595:650;
  const lift=ease(p.t/.55);
  const pose=blendPose({...POSES.radio,head:1,armN:[37,133]},POSES.radio,lift);
  const focus=view==='wide'?cam(1410,1130,1.35):cam(x+100,y-390,isDetail?2.5:2.05);
  return <Scene bg={roof?'ch2-roof-night':hall?'ch2-pump':section===3?'stockroom':'sportsinside'} a={focus} b={{...focus,z:focus.z+.025}} p={p} filter={roof?'brightness(.85)':'brightness(.91)'}>
   <Guard x={x} y={y} h={h} pose={pose} propN="radio" eyes={blink('worried',time)} look2={-.5*lift} dim={roof?.88:1}/>
   {section>=13&&<Theo x={1880} y={1320} h={555} face={-1} pose={{...POSES.sitChair,head:-6}} time={time} hurt bandaged clean eyes="worried"/>}
  </Scene>;
 }
 if(mode==='talk'){
  const shrug=time>=594&&time<603.5,point=time>=609&&time<618;
  const small=time>=774&&time<778,consider=time>=792&&time<810;
  const theta=point?1:0,gesture=shrug?ease((time-594)/.7):small?ease((time-774)/.6):0;
  let tp:Pose={...POSES.sitChair,head:consider?9:-3};
  if(shrug||small)tp={...tp,armN:[25+35*gesture,85-113*gesture],armF:[20-65*gesture,80-40*gesture],head:6*gesture};
  if(point)tp={...tp,armN:[68,70],head:-4};
  const dp:Pose={...POSES.standRelax,head:point?19:consider?13:4,armN:[18,50],armF:[-8,-4]};
  const focus=view==='theo'?cam(1840,1100,2.15):view==='danny'?cam(1130,1100,2.1):cam(1470,1110,1.43);
  return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.03}} p={p} filter="brightness(.94)">
   <path d="M1830 1285h145l-15 170h-115Z" fill="#667d7e" stroke={INK} strokeWidth={8}/>
   <Guard x={1110} y={1460} h={655} pose={dp} eyes={blink('worried',time)} look2={.65}/>
   <Theo x={1900} y={1310} h={575} face={-1} pose={tp} time={time} speech={speech} look2={theta||consider?-1:-.5}/>
   {consider&&<><Jug x={1450} y={1415} s={.8} full={false}/><Jug x={1610} y={1415} s={.8} full={false}/></>}
  </Scene>;
 }
 if(mode==='plan'){
  const progress=storyProgress(time,C.route,10.4);
  const dx=1050,tx=1740,y=1460,h=590;
  const distance=progress*155;
  const target:[number,number]=distance<30?[1540,1365-distance]:distance<90?[1540-(distance-30),1335]:distance<120?[1480,1335+distance-90]:[1480-(distance-120),1365];
  const tp=reachHand({...POSES.crouch,lean:65,head:-20,armF:[-12,10]},tx,y,h,-1,target);
  const hand=jointsOf(tp,tx,y,h,-1).handN;
  const focus=isDetail?cam(1480,1310,2.4):cam(1430,1200,1.55);
  return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.025}} p={p}>
   <Guard x={dx} y={y} h={650} pose={{...POSES.crouch,head:16}} eyes="worried" look2={.8}/>
   <path d="M1540 1365V1335H1480V1365H1445" fill="none" stroke={CHALK} strokeWidth={6} strokeLinecap="round" strokeDasharray="155" strokeDashoffset={155*(1-progress)} opacity={.9}/>
   {progress>.35&&<text x={1560} y={1420} fontSize={24} fill={CHALK} fontFamily="sans-serif">CINEMA</text>}
   {progress>.85&&<text x={1370} y={1420} fontSize={24} fill={CHALK} fontFamily="sans-serif">PUMP ROOM</text>}
   <Theo x={tx} y={y} h={h} face={-1} pose={tp} time={time} look2={-1}/>
   <circle cx={hand[0]} cy={hand[1]+4} r={6} fill={CHALK}/>
  </Scene>;
 }
 if(mode==='bandage'){
  const k=storyProgress(time,C.bandage,6),dx=1560,dy=1495,dh=610,tx=1870,ty=1290,th=570;
  const tp:Pose={...POSES.sitChair,legN:[75,-15],head:17};
  // The wound is on the same near calf used by Theo's shared renderer.
  const leg=skeleton(tp),s=th/300;
  const target:[number,number]=[tx-mix(leg.kneeN[0],leg.footN[0],.67)*s,ty+mix(leg.kneeN[1],leg.footN[1],.67)*s];
  const dp=reachHand({...POSES.crouch,lean:65,head:-20,armF:[-12,10]},dx,dy,dh,1,[target[0]-8+16*k,target[1]-8]);
  const hand=jointsOf(dp,dx,dy,dh).handN;
  const focus=isDetail?cam(1750,1310,2.65):cam(1650,1160,1.67);
  return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.025}} p={p}>
   <path d="M1795 1270h150l-15 175h-120Z" fill="#647a7a" stroke={INK} strokeWidth={8}/>
   <Theo x={tx} y={ty} h={th} pose={tp} face={-1} hurt bandaged clean time={time} speech={speech} look2={-.4}/>
   <Guard x={dx} y={dy} h={dh} pose={dp} eyes={blink('worried',time)} look2={.7}/>
   <path d={`M${target[0]} ${target[1]}Q${target[0]-16} ${target[1]-12} ${hand[0]} ${hand[1]}`} fill="none" stroke="#dad7c5" strokeWidth={10}/>
   <circle cx={hand[0]} cy={hand[1]} r={12} fill="#d8d4bf" stroke={INK} strokeWidth={3}/>
   <path d="M1270 1350h160v100h-160Z" fill="#dedbca" stroke={INK} strokeWidth={7}/><path d="M1350 1370v60m-30-30h60" stroke="#9c5144" strokeWidth={12}/>
  </Scene>;
 }
 if(mode==='trainer'){
  const k=storyProgress(time,C.tape,.9)*(1-storyProgress(time,C.tape+2,1));
  const tp:Pose={...POSES.sitChair,lean:75,head:-35,legN:[82,-10],armF:[-12,10]};
  const handTarget:[number,number]=[1665-15*k,1390-35*k];
  const acted=reachHand(tp,1770,1280,570,-1,handTarget);
  const hand=jointsOf(acted,1770,1280,570,-1).handN;
  const focus=cam(1660,1250,isDetail?2.8:2.15);
  return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.025}} p={p}>
   <path d="M1700 1270h140l-15 180h-110Z" fill="#667a78" stroke={INK} strokeWidth={8}/>
   <Theo x={1770} y={1280} h={570} face={-1} pose={acted} time={time} eyes="worried"/>
   <path d={`M1665 1390L${hand[0]} ${hand[1]}`} stroke="#c1bba1" strokeWidth={13} strokeLinecap="round"/>
  </Scene>;
 }
 const chalk=mode==='chalk',bait=mode==='box-bait',receipt=mode==='receipt',water=mode==='water';
 const progress=chalk?storyProgress(time,C.chalk,5.6):bait?storyProgress(time,C.bait,1.4):water?storyProgress(time,C.water,1.1):0;
 let x=chalk?1080+160*progress:1190,y=1460,h=650;
 let base:Pose={...POSES.crouch,lean:65,head:-20,armF:[-12,10]};
 let target:[number,number]=chalk?[1360+160*progress,1380]:bait?[mix(1360,1480,progress),mix(1220,1305,progress)]:water?[1435,1338]:[1370,1290];
 if(water&&section===6)base={...base,head:9+10*storyProgress(time,C.water+1.2,1)};
 if(!chalk&&!bait&&!water&&!receipt){
  const count=ease((Math.floor(Math.max(0,time-C.count)/1.7)%3)/2);
  target=[1370+110*count,1290+20*count];
 }
 let dp=reachHand(base,x,y,h,1,target);
 if(water&&section===6){
  const rest=jointsOf(base,x,y,h).handN;
  dp=reachHand(base,x,y,h,1,[mix(rest[0],target[0],progress),mix(rest[1],target[1],progress)]);
 }
 let hand=jointsOf(dp,x,y,h).handN;
 if(receipt){
  const writing=1-storyProgress(time,C.remember,.8);
  const phase=Math.max(0,time-C.receipt);
  const holding=reachHand(base,x,y,h,1,[1353,1350],'F');
  dp=reachHand(holding,x,y,h,1,[1400+writing*(phase%1.8)*20,1270+writing*10*Math.sin(phase*11)]);
  hand=jointsOf(dp,x,y,h).handN;
 }
 const focus=isDetail?cam(receipt?1400:1460,receipt?1295:1350,2.65):cam(1440,1190,1.62);
 const held=bait&&progress<1;
 return <Scene bg={receipt||bait?'stockroom':'sportsinside'} a={focus} b={{...focus,z:focus.z+.025}} p={p} filter="brightness(.94)">
  {chalk||bait?<FoodBox x={1500} y={1390}/>:!receipt&&<>
   <FoodBar x={1460} y={1300}/><FoodBar x={1585} y={1310}/>
   {[0,1,2].map(i=><g key={i}><rect x={1510+i*65} y={1350} width={45} height={62} rx={7} fill="#a3acaa" stroke={INK} strokeWidth={5}/><rect x={1515+i*65} y={1367} width={35} height={27} fill="#96815e"/></g>)}
  </>}
  {chalk&&<path d="M1360 1405H1520" fill="none" stroke={CHALK} strokeWidth={16} strokeDasharray="160" strokeDashoffset={160*(1-progress)} opacity={.7}/>}
  {receipt&&<g transform="translate(1435 1315) rotate(-9)">
   <rect x={-82} y={-105} width={164} height={210} rx={3} fill="#ddd6c0" stroke={INK} strokeWidth={5}/>
   {['SUPPLIES','BARS  ||||','CANS  |||','WATER ||||'].map((line,i)=><text key={line} x={-66} y={-65+i*46} fontSize={19} fontFamily="monospace" fill="#273043">{line}</text>)}
  </g>}
  <Guard x={x} y={y} h={h} pose={dp} eyes={blink('worried',time)} look2={.65}/>
  {chalk&&<g transform={`translate(${hand[0]},${hand[1]}) rotate(30)`}><path d="M-17-30H17L21 9Q0 20-21 9Z" fill={CHALK} stroke={INK} strokeWidth={4}/><path d="M-14-24H14" stroke="#a6a692" strokeWidth={4}/></g>}
  {chalk&&progress>0&&progress<1&&[0,1,2,3].map(i=><circle key={i} cx={hand[0]-5+i*4} cy={hand[1]+16+(time*35+i*7)%15} r={2.5} fill={CHALK}/>)}
  {receipt&&<path d={`M${hand[0]} ${hand[1]}l20-42`} stroke="#d5a650" strokeWidth={9} strokeLinecap="round"/>}
  {bait&&<FoodBar x={held?hand[0]:1480} y={held?hand[1]+9:1305} rotate={held?-12:0}/>}
  {!chalk&&!bait&&!receipt&&<>
   <Jug x={1435} y={1410} s={.77} full={!water||section===6}/><Jug x={1610} y={1425} s={.77} full={!water||section===6}/>
   {mode==='inventory'&&<Jug x={1785} y={1425} s={.77}/>}
  </>}
  {water&&<>
   <path d="M1810 1285h145l-15 165h-115Z" fill="#647b7d" stroke={INK} strokeWidth={8}/>
   <Theo x={1880} y={1310} h={575} face={-1} pose={{...POSES.sitChair,head:8,armN:section===7?[48,35]:[25,85]}} time={time} speech={speech} look2={-1}/>
  </>}
 </Scene>;
};
