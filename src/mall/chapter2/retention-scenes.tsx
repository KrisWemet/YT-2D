import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Screen} from '../Overlays';
import {Guard, Zed, Vignette} from '../shots';
import {jointsOf, POSES, Pose} from '../Stick';
import {Theo, Jug} from './scenes';
import {blendPose, ease, idlePose} from './motion';

const INK='#0b0c0c';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const crawl:Pose={lean:80,head:-40,armF:[65,88],armN:[70,93],legF:[-85,-90],legN:[-75,-85],sit:true};
const Plate:React.FC<{name:string;zoom?:number;origin?:string}>=({name,zoom=1,origin='50% 50%'})=>
 <Img src={staticFile(`mall/bg/${name}.jpg`)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',transform:`scale(${zoom})`,transformOrigin:origin}}/>;

export const CeilingAngle:React.FC<{up?:boolean;time:number;boot?:boolean;leg?:boolean}>=({up,time,boot=false,leg=true})=><AbsoluteFill style={{background:'#0c141c'}}>
 <Plate name={`ch2-retention-ceiling-${up?'up':'down'}`} zoom={1+.008*Math.sin(time*.25)}/>
 <Screen>
 {up?<>
  {/* Only the trapped leg is visible from the floor. The torso stays above the hole. */}
  <path d={`M1030 285L1015 525L${1005+Math.sin(time*3)*3} 760`} fill="none" stroke={INK} strokeWidth={42} strokeLinecap="round"/>
  <path d="M992 733h39v68l59 9q35 8 24 32h-124Z" fill="#29313c" stroke={INK} strokeWidth={12}/>
  {Array.from({length:7},(_,i)=><path key={i} d="M-6-3L7-5L5 8Z" fill="#b9b4a0" transform={`translate(${1000+(i*67)%250},${585+(time*67+i*101)%380}) rotate(${i*23})`}/>)}
 </>:<>
  {Array.from({length:43},(_,i)=>{
   const rand=(n:number)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v)};
   const x=620+rand(i+2)*680,y=390+rand(i+73)*490;
   if((x-960)**2+(y-720)**2<130**2)return null;
   return <g key={i} transform={`translate(${x+Math.sin(time*.7+i)*2},${y})`}>
    <path d="M-15 8L-27 26M15 8l26 9" stroke={INK} strokeWidth={9} strokeLinecap="round"/>
    <ellipse cy={12} rx={17} ry={26} fill={i%6?'#495647':'#283c5a'} stroke={INK} strokeWidth={6}/>
    <circle cy={-6} r={16} fill={i%3?'#8b9672':'#707b63'} stroke={INK} strokeWidth={5}/>
   </g>;
  })}
  {leg&&<g transform={`translate(${boot?960:1350},${boot?570+clamp((time-1207.1)/.8)*165:890}) rotate(${boot?lerp(-20,70,clamp((time-1207.1)/.8)):-30}) scale(${boot?.6:1.3})`}>
   {!boot&&<path d="M-22 160L-25-20" stroke={INK} strokeWidth={36} strokeLinecap="round"/>}
   <path d="M-42-63H8v54l72 12q31 13 15 41H-43Z" fill="#2a323c" stroke={INK} strokeWidth={10}/>
  </g>}
 </>}
 </Screen><Vignette o={.14}/>
 </AbsoluteFill>;

export const GripAngle:React.FC<{time:number}>=({time})=>{
 const slip=clamp((time-1154.6)/3.2),recover=clamp((time-1158.5)/2);
 const d=16*slip-14*recover;
 return <AbsoluteFill style={{background:'#101b23'}}><Plate name="ch2-ceiling" zoom={2}/>
  <AbsoluteFill style={{background:'#06101a99'}}/><Screen>
   <path d="M-100 140L2010 400" stroke={INK} strokeWidth={65}/><path d="M-100 140L2010 400" stroke="#647475" strokeWidth={43}/>
   <path d="M-50 800L600 420L899 546" fill="none" stroke={INK} strokeWidth={112} strokeLinecap="round"/>
   <path d="M-50 800L600 420L899 546" fill="none" stroke="#61776c" strokeWidth={82} strokeLinecap="round"/>
   <path d={`M1990 950L1360 795L${1020+d} ${600+d}`} fill="none" stroke={INK} strokeWidth={108} strokeLinecap="round"/>
   <path d={`M1990 950L1360 795L${1020+d} ${600+d}`} fill="none" stroke="#294b78" strokeWidth={78} strokeLinecap="round"/>
   <path d={`M${1053+d} ${623+d}L934 553Q880 499 853 537Q830 574 875 599L988 666Z`} fill="#c49b76" stroke={INK} strokeWidth={12}/>
   <path d="M875 520q42-19 74 18l35 45q13 35-17 45q-22 8-40-17l-34-20q-42-12-18-71Z" fill="#d3ac87" stroke={INK} strokeWidth={12}/>
   <path d="M907 550l38 45M926 538l40 44" stroke={INK} strokeWidth={8} strokeLinecap="round"/>
   <path d="M718 210L850 665L1030 635" fill="none" stroke={INK} strokeWidth={25}/><path d="M718 210L850 665L1030 635" fill="none" stroke="#bda26b" strokeWidth={14}/>
  </Screen><Vignette o={.18}/></AbsoluteFill>;
};

export const WallPrints:React.FC<{time:number}>=({time})=><AbsoluteFill style={{background:'#18242d'}}>
 <Plate name="sportsinside"/><AbsoluteFill style={{background:'#05101855'}}/><Screen>
 <path d="M650-50L1580-50L1690 1080H770Z" fill="#36424b" stroke={INK} strokeWidth={16}/>
 <path d="M705 0L825 1080M1420 0L1540 1080" stroke="#5a6267" strokeWidth={9}/>
 <path d="M620 74H1590V265H650Z" fill="#141e28" stroke={INK} strokeWidth={14}/>
 <path d="M660 160H1590" stroke="#737a79" strokeWidth={15}/>
 {[0,1,2,3].map(i=><g key={i} transform={`translate(${1010+(i%2)*170},${880-i*175}) rotate(${i%2?12:-16})`} opacity={.85} fill="#d7ddcb">
 <ellipse rx={29} ry={47}/><ellipse cy={58} rx={24} ry={20}/><path d="M-18 37h31v12h-31Z" fill="#36424b"/>
 </g>)}
 <ellipse cx={1120} cy={490} rx={400} ry={560} fill="#e8e3ad" opacity={.05+.01*Math.sin(time)}/>
 </Screen><Vignette o={.25}/></AbsoluteFill>;

export const SecondLight:React.FC<{time:number;pulses:number[]}>=({time,pulses})=>{
 const on=pulses.some(t=>time>=t&&time<t+.24);
 return <AbsoluteFill style={{background:'#08111e'}}><Plate name="ch2-retention-roof-light"/>
 <Screen>{on&&<>
  <path d="M1240 720L245 350L290 378Z" fill="#fff0b2" opacity={.5}/>
  <circle cx={1240} cy={720} r={13} fill="#fffae3"/><circle cx={1240} cy={720} r={38} fill="#fff1c2" opacity={.12}/>
 </>}</Screen><Vignette o={.1}/></AbsoluteFill>;
};

export const FrozenChoice:React.FC<{time:number}>=({time})=><AbsoluteFill style={{background:'#0b1724'}}>
 <Plate name="ch2-roof-night" zoom={1.7} origin="65% 50%"/><Screen>
  <Theo x={1420} y={1250} h={830} pose={POSES.standRelax} face={-1} look2={-1} hurt bandaged clean eyes="worried" dim={.65}/>
  {/* Deliberately held pose: his thumb rests on the switch, without an idle sway. */}
  <Guard x={860} y={1190} h={1080} pose={{...POSES.flashlight,head:1,armN:[45,121]}} propN="flashlight" beam={0} eyes="wide" mouth="flat" look2={-.8} dim={.9}/>
 </Screen><Vignette o={.2}/></AbsoluteFill>;

export const FoodChoice:React.FC<{time:number}>=({time})=>{
 const t=time-637.762,turn=ease((t-9)/1.1),offer=ease((t-1)/1.4)*(1-ease((t-5)/1.5));
 const dp=blendPose(POSES.think,POSES.holdUp,offer*.75);
 const hp=jointsOf(dp,700,1060,660).handN;
 const zoom=t<6?1:t<12?1.15:1.05,pan=t<6?0:t<12?-170:-40;
 return <AbsoluteFill style={{background:'#14212e'}}><Plate name="sportsinside"/><Screen><g transform={`translate(${pan},0) scale(${zoom})`}>
 <Guard x={700} y={1060} h={660} pose={dp} eyes="worried" look2={.7}/>
 <Theo x={1330} y={1040} h={570} pose={{...POSES.sitChair,head:12*turn,lean:7*turn}} look2={-turn} face={-1} eyes="worried"/>
 <path d="M1250 960h160v108h-160Z" fill="#637475" stroke={INK} strokeWidth={8}/>
 <g transform={`translate(${hp[0]},${hp[1]+12}) rotate(-12)`}><rect x={-42} y={-15} width={84} height={30} rx={3} fill="#b8a16f" stroke={INK} strokeWidth={5}/><path d="M-20-12h43v24h-43Z" fill="#4e685e"/></g>
 </g></Screen><Vignette o={.16}/></AbsoluteFill>;
};

export const ReturnChoice:React.FC<{frame:number}>=({frame})=>{
 const t=frame/30;
 const buckle=ease((t-2.5)/.65),caught=ease((t-4.2)/.65),haul=ease((t-13)/3);
 const hanging:Pose={lean:-76,head:45,armF:[-65,-95],armN:[-65,-95],legF:[88,92],legN:[8,0],sit:true};
 const pulling:Pose={lean:80,head:-55,armF:[68,95],armN:[70,100],legF:[-90,-85],legN:[-90,-85],sit:true};
 const landed:Pose={lean:-80,head:40,armF:[-65,-88],armN:[-77,-104],legF:[85,90],legN:[75,85],sit:true};
 const tp=blendPose(blendPose(crawl,hanging,buckle),landed,haul);
 const dp=blendPose(crawl,pulling,caught);
 const dx=563-97*haul+17*caught,dy=423;
 const tx=980-97*haul,ty=lerp(428,414,haul);
 const near=jointsOf(dp,dx,dy,320).handN;
 const other=jointsOf(tp,tx,ty,350).handN;
 const release=ease((t-8)/.7),retrieve=ease((t-19)/2.5);
 const jx=lerp(lerp(1270,1370,release),550,retrieve),jy=lerp(lerp(414,680,release),410,retrieve);
 const shot=t<3?0:t<5?1:t<8?2:t<11?3:t<14?4:t<19?5:6;
 const camera=shot===1?[1.7,-680,-150]:shot===2?[1.8,-660,-175]:shot===3?[1.7,-1240,-200]:shot===4?[1.1,-80,-30]:shot===5?[1.5,-350,-140]:[1.15,-85,-25];
 return <AbsoluteFill style={{background:'#0c1722'}}><AbsoluteFill style={{transform:`translate(${camera[1]}px,${camera[2]}px) scale(${camera[0]})`,transformOrigin:'0 0'}}>
 <Plate name="ch2-ceiling"/><Screen>
  {Array.from({length:16},(_,i)=><Zed key={i} x={170+i*104} y={995+(i%3)*20} h={165+i%3*12} dim={.65} eyes="zombie"/>)}
  <path d="M340 438H1420" stroke={INK} strokeWidth={30}/><path d="M340 438H1420" stroke="#687876" strokeWidth={15}/>
  <path d="M920 433L944 414L982 436L1020 409L1080 438V478H920Z" fill="#101a23" stroke={INK} strokeWidth={5}/>
  <path d="M1210 680H1535" stroke={INK} strokeWidth={30}/><path d="M1210 680H1535" stroke="#4a5a5e" strokeWidth={14}/>
  <Jug x={350} y={410} s={.48}/>
  <g transform={`translate(${jx},${jy}) rotate(${release*(1-retrieve)*86})`}><Jug x={0} y={0} s={.48} full={t<9.6}/></g>
  {t>8.7&&t<12.7&&Array.from({length:12},(_,i)=><path key={i} d="M0 0q8 18 2 29" fill="none" stroke="#b6d8df" strokeWidth={3} opacity={.8} transform={`translate(${1355+i*3},${688+((t-8.7)*240+i*29)%220})`}/>)}
  <Guard x={dx} y={dy} h={320} pose={dp} eyes={t>7&&t<9?'side':'wide'} mouth={t>4&&t<16?'grit':'flat'} sweat shadow={0}/>
  <Theo x={tx} y={ty} h={350} face={1} pose={tp} hurt eyes="worried" mouth={t>2.5&&t<6?'open':'flat'} shadow={0}/>
  {caught>.8&&t<16&&<path d={`M${near[0]} ${near[1]}L${other[0]} ${other[1]}`} stroke="#cba47e" strokeWidth={10} strokeLinecap="round"/>}
  {t>18&&t<22&&<path d={`M${near[0]} ${near[1]}Q${near[0]+180} ${near[1]+100} ${jx} ${jy-43}`} fill="none" stroke="#bba06c" strokeWidth={8}/>}
 </Screen></AbsoluteFill><Vignette o={.16}/></AbsoluteFill>;
};
