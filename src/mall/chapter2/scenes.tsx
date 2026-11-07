import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Screen, Txt, Padlock, Waves, RewindFx} from '../Overlays';
import {Scene, Guard, Zed, P, Beyond, HoldGate, Vignette} from '../shots';
import {Stick, StickProps, LOOKS, Pose, POSES, jointsOf} from '../Stick';
import {ROOF_WIN} from '../chapter1/scenes';
import {KeyRing16, KeyInHand, RadioCard, SleepingBag} from '../chapter1/props';
import {threeBlinks} from '../vertical';
import {World, FULL} from '../World';

const INK='#0b0c0c', GOLD='#f0c53c';
export type Mode='store'|'sleep'|'food'|'lock'|'chalk'|'prints'|'rack'|'theo'|'talk'|'water'|'plan'|'ceiling'|'fall'|'rescue'|'crowd'|'marcus'|'boot'|'cinema'|'door'|'pump'|'tank'|'drill'|'bandage'|'cut'|'tent'|'roof'|'window'|'signal'|'vera'|'radio'|'keys'|'title'|'rewind'|'end';
export const THEO={skin:'#d3ac87',shirt:'#61776c',hair:'messy' as const,hairColor:'#392d25',hat:'hood' as const,hatColor:'#61776c',bulk:.82};
const crawl:Pose={lean:80,head:-40,armF:[65,88],armN:[70,93],legF:[-85,-90],legN:[-75,-85],sit:true};
const bandagePose:Pose={lean:60,head:-20,armF:[50,20],armN:[55,20],legF:[75,-70],legN:[95,-5],sit:true};
const hanging:Pose={lean:-76,head:45,armF:[-65,-95],armN:[-65,-95],legF:[88,92],legN:[8,0],sit:true};
const pull:Pose={lean:80,head:-55,armF:[68,95],armN:[70,100],legF:[-90,-85],legN:[-90,-85],sit:true};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const lerp=(a:number,b:number,k:number)=>a+(b-a)*k;
const cam=(x:number,y:number,z:number)=>({x,y,z});

export const Theo:React.FC<Partial<StickProps>&{hurt?:boolean;bandaged?:boolean;clean?:boolean}>=({hurt=false,bandaged=false,clean=false,...props})=>{
 const x=props.x??1840,y=props.y??1430,h=props.h??610;
 return <><Stick x={x} y={y} h={h} look={{...THEO,...(clean?{shirt:'#628694',hatColor:'#628694'}:{})}} pose={POSES.stand} mouth="flat" eyes="worried" shadow={.18} {...props}/>
 {hurt&&<g transform={`translate(${x+17*h/300},${y-40*h/300}) scale(${h/300})`}>{bandaged?<><path d="M-6-5H7V7H-6Z" fill="#dad7c5" stroke={INK} strokeWidth={2}/><path d="M-3-4l6 10M1-4l5 8" stroke="#aeabb0" strokeWidth={1}/></>:<path d="M-2-7L3 7" stroke="#9f5044" strokeWidth={4} strokeLinecap="round"/>}</g>}</>;
};
export const Jug:React.FC<{x:number;y:number;s?:number;full?:boolean}>=({x,y,s=1,full=true})=><g transform={`translate(${x},${y}) scale(${s})`}>
 <path d="M-18-72V-93Q0-108 18-93V-72" fill="none" stroke={INK} strokeWidth={12}/>
 <path d="M-46-72Q-52-73-52-57V36Q-52 48-36 48H35Q51 48 51 35V-57Q51-72 34-72Z" fill={full?'#9ab7bd':'#b3c7c5'} stroke={INK} strokeWidth={6}/>
 {full&&<path d="M-44-20Q-15-30 6-21T44-20V35H-44Z" fill="#557f8e" opacity={.9}/>}
 <rect x={25} y={-80} width={25} height={11} rx={4} fill="#697c78" stroke={INK} strokeWidth={4}/>
 <path d="M-31-56V25" stroke="#dfebdc" strokeWidth={5} opacity={.5}/></g>;
const Bar:React.FC<{x:number;y:number;s?:number}>=({x,y,s=1})=><g transform={`translate(${x},${y}) rotate(-6) scale(${s})`}>
 <path d="M-64-23L-52-19H51L64-23V25L52 20H-52L-64 25Z" fill="#c3a064" stroke={INK} strokeWidth={5}/>
 <rect x={-38} y={-17} width={76} height={34} rx={3} fill="#4d665d"/><path d="M-25-7H25M-25 3H12" stroke="#e6d7aa" strokeWidth={4}/></g>;
const Box:React.FC<{x:number;y:number;s?:number;open?:boolean}>=({x,y,s=1,open=false})=><g transform={`translate(${x},${y}) scale(${s})`}>
 <path d="M-145-85H145L129 70H-128Z" fill="#6a7f88" stroke={INK} strokeWidth={7}/>
 <path d={open?'M-151-86L-170-146H124L152-86Z':'M-151-89H151L146-69H-145Z'} fill="#8e9aa0" stroke={INK} strokeWidth={7}/>
 <rect x={-103} y={-74} width={27} height={30} rx={5} fill="#293d48" stroke={INK} strokeWidth={4}/><rect x={74} y={-74} width={27} height={30} rx={5} fill="#293d48" stroke={INK} strokeWidth={4}/></g>;
const Rack:React.FC<{tile?:boolean;t:number;open?:boolean}>=({tile=false,t,open=false})=><g>
 <path d="M1900 1510V470H2360V1510M1900 1360H2360M1900 1130H2360M1900 900H2360M1900 670H2360" stroke={INK} strokeWidth={22} fill="none"/>
 <path d="M1900 1510V470H2360V1510M1900 1360H2360M1900 1130H2360M1900 900H2360M1900 670H2360" stroke="#7c858b" strokeWidth={11} fill="none"/>
 {[0,1,2].map(i=><g key={i}><rect x={1955+i*109} y={1040} width={90} height={78} rx={4} fill="#9f8760" stroke={INK} strokeWidth={5}/><path d={`M${2000+i*109} 1040V1118`} stroke="#6e603f" strokeWidth={5}/></g>)}
 <path d="M1840 450H2390M2180 450V330" fill="none" stroke={INK} strokeWidth={25}/><path d="M1840 450H2390M2180 450V330" fill="none" stroke="#7b8788" strokeWidth={13}/>
 <rect x={1850} y={160} width={620} height={160} fill="#3b424b" stroke={INK} strokeWidth={8}/>
 <path d="M1850 240H2470M2055 160V320M2260 160V320" stroke="#89918f" strokeWidth={4}/>
 {tile&&<g transform={`translate(2075,178) rotate(${open?-9:0})`}><rect width={192} height={127} fill={open?'#080b12':'#a09e8e'} stroke={INK} strokeWidth={7}/>{open&&<rect x={0} y={-24} width={192} height={39} fill="#aaa592" stroke={INK} strokeWidth={5}/>}</g>}
 </g>;
const footprint=(x:number,y:number,r:number,k:number)=><g key={k} transform={`translate(${x},${y}) rotate(${r})`} opacity={.85} fill="#dbe4d5"><ellipse cx={0} cy={0} rx={19} ry={35}/><ellipse cx={0} cy={43} rx={16} ry={20}/><path d="M-9 40H7V48H-9Z" fill="#33424b"/></g>;

const Store:React.FC<{p:P;mode:Mode;variant:number;speaker?:string;section:number}>=({p,mode,variant,speaker,section})=>{
 const detail=variant%3;const dropping=mode==='theo'&&section===5;const isTalk=['talk','theo','water','tent'].includes(mode);
 const focus=mode==='rack'?cam(2130,780,1.55):mode==='chalk'||mode==='prints'?cam(1690,1270,1.9):mode==='food'?cam(1170,1230,2.0):mode==='sleep'?cam(1020,1300,1.7):mode==='bandage'?cam(1720,1250,2.2):
 isTalk?(detail===1?cam(speaker==='theo'?1820:1020,1100,1.9):cam(1460,1110,1.35)):cam(1408,960,1.15);
 const danPose=mode==='sleep'?POSES.sitHug:mode==='chalk'||mode==='prints'?POSES.crouch:mode==='rack'?POSES.lookUp:mode==='bandage'?bandagePose:isTalk?POSES.think:POSES.standRelax;
 const shift=Math.sin(p.t*.8)*1.2;
 return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.06,x:focus.x+(variant%2?12:-12)}} p={p} filter="brightness(.94)">
 <Beyond><Zed x={1420+Math.sin(p.t*.15)*30} y={930} h={270} dim={.55} ghost/></Beyond><HoldGate frac={1} opacity={.7}/>
 {(['chalk','prints','rack'].includes(mode)||dropping)&&<Rack tile t={p.t} open={mode==='theo'||mode==='rack'}/>} 
 {['chalk','prints'].includes(mode)&&<g>{Array.from({length:38},(_,i)=><ellipse key={i} cx={1100+(i*137)%950} cy={1220+(i*59)%225} rx={20+i%5*7} ry={4+i%3} fill="#ced6c9" opacity={.13}/>)}</g>}
 {mode==='prints'&&<g>{[0,1,2,3,4,5].map(i=>footprint(1240+i*118,1400-i*12,65+(i%2?12:-12),i))}{[0,1,2].map(i=>footprint(1960+i*42,1240-i*230,-9,i+6))}</g>}
 {!dropping&&<Guard x={mode==='bandage'?1530:1010} y={mode==='sleep'?1430:mode==='bandage'?1370:1470+shift} h={mode==='sleep'?630:680} pose={danPose} propN={mode==='rack'?'flashlight':mode==='lock'?'keys':'none'} eyes={mode==='sleep'?'closed':mode==='rack'?'wide':'worried'} mouth={speaker==='danny'&&isTalk&&Math.floor(p.t*5)%3!==0?'open':'flat'} sweat={mode==='rack'}/>}
 {((isTalk&&mode!=='tent')||mode==='bandage')&&!dropping&&<g><ellipse cx={mode==='bandage'?1830:1900} cy={1460} rx={76} ry={24} fill={INK} opacity={.25}/><path d={`M${(mode==='bandage'?1830:1900)-65} 1280H${(mode==='bandage'?1830:1900)+65}L${(mode==='bandage'?1830:1900)+54} 1450H${(mode==='bandage'?1830:1900)-54}Z`} fill="#687d7d" stroke={INK} strokeWidth={7}/></g>}
 {mode==='sleep'&&<SleepingBag x={1180} y={1435} s={1.6}/>}
 {dropping?<Theo x={2080} y={1020-lerp(240,0,clamp(p.t/2))} h={535} pose={POSES.sneak} face={-1}/>:isTalk||mode==='bandage'?<Theo x={mode==='bandage'?1830:1900} y={mode==='tent'?1470:1310} h={600} pose={mode==='bandage'?POSES.sitChair:mode==='tent'?POSES.standRelax:POSES.sitChair} face={-1} hurt={section>=10} bandaged={section>=13} clean={section>=13} mouth={speaker==='theo'&&Math.floor(p.t*5)%3!==0?'open':'flat'}/>:null}
 {['food','sleep','chalk','prints','talk'].includes(mode)&&<Box x={1250} y={1370} s={.9} open={mode==='food'&&detail===1}/>}
 {mode==='food'&&<><Bar x={1300} y={1250} s={1.3}/><Bar x={1130} y={1330}/>{[0,1,2,3].map(i=><Jug key={i} x={1600+i*83} y={1395} s={.55}/>)}</>}
 {['water','tent'].includes(mode)&&<><Jug x={1420} y={1410} s={.9}/><Jug x={1580} y={1425} s={.9}/></>}
 {mode==='lock'&&<Padlock x={1430} y={950} s={1.1}/>}
 {mode==='tent'&&<g><path d="M1540 1445Q1680 1100 2025 1445Z" fill="#365f68" stroke={INK} strokeWidth={12}/><path d="M1740 1445L1785 1250L1840 1445Z" fill="#0e1b24" stroke={INK} strokeWidth={7}/><path d="M1540 1445H2025" stroke="#a4b19d" strokeWidth={8}/></g>}
 {mode==='bandage'&&<g><rect x={1170} y={1330} width={180} height={100} rx={15} fill="#e4ded0" stroke={INK} strokeWidth={7}/><path d="M1259 1350V1410M1229 1380H1289" stroke="#a64e43" strokeWidth={14}/></g>}
 </Scene>;
};

// The painted cutaway fixes the ledge at y=426 in screen coordinates. Animate only
// the figures, the tile break, and the loose boot, so all three share the same camera.
const Ceiling:React.FC<{p:P;mode:Mode;variant:number;section:number}>=({p,mode,variant,section})=>{
 const fall=mode==='fall', rescue=mode==='rescue', cut=mode==='cut';
 const close=mode==='marcus'||mode==='crowd';
 const zoom=cut?1.8:close?1.45:variant%3===1?1.15:1;
 const pan=cut?[-1230,-270]:close?[-330,-405]:zoom>1?[-120,-40]:[0,0];
 const move=mode==='ceiling'?Math.min(70,p.t*4):0;
 const shake=fall?Math.sin(p.t*18)*1.5:0;
 const bootFall=mode==='boot'?clamp(p.t/1.7):0;
 return <AbsoluteFill style={{background:'#111921',overflow:'hidden'}}>
  <AbsoluteFill style={{transform:`translate(${pan[0]}px,${pan[1]}px) scale(${zoom})`,transformOrigin:'0 0'}}>
   <World bg="ch2-ceiling" cam={FULL} width={1920} height={1080}/>
   <Screen>
    {/* Smaller figures occupy the floor behind the fountain, with larger figures in front. */}
    {Array.from({length:78},(_,i)=>{
     const row=Math.floor(i/17),span=650+row*260;
     const x=960-span/2+((i*139)%span),y=714+row*47;
     const size=.62+row*.08;
     return <g key={i} transform={`translate(${x},${y}) scale(${size})`} opacity={.78}>
      <circle cy={-68} r={13} fill={i%3?'#68735d':'#8a9574'} stroke={INK} strokeWidth={4}/>
      <path d="M0-53V-18M0-43L-23-27M0-43L22-24M0-18L-12 2M0-18L12 3" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round"/>
     </g>;
    })}
    {Array.from({length:16},(_,i)=><Zed key={i} x={100+i*111+Math.sin(p.t*.3+i)*3} y={1018+(i%3)*18} h={178+(i%3)*18} k={i} face={i%2?1:-1} shadow={.1} dim={.88}/>)}
    <Stick x={730+Math.sin(p.t*.25)*12} y={1020} h={235} look={{...LOOKS.marcusZ,radioOnChest:false}} pose={mode==='marcus'?POSES.rattle:fall?POSES.lookUp:POSES.zLimp} eyes="zombie" mouth="zombie" shadow={.15}/>
    {(fall||rescue)&&<>
     <path d="M930 431L950 408L974 432L1013 402L1048 430L1080 415L1114 438V475H930Z" fill="#111821" stroke={INK} strokeWidth={6}/>
     <path d="M947 470L985 514L1020 476M1064 467L1102 499" fill="#9b9e93" stroke={INK} strokeWidth={5}/>
    </>}
    <g transform={`translate(${shake},0)`}>
     {fall?<>
      <Guard x={980} y={428} h={350} pose={hanging} eyes="wide" mouth="grit" sweat shadow={0}/>
      <Theo x={563} y={423} h={320} face={1} pose={pull}/>
     </>:rescue?<>
      <path d="M650 353L405 168L386 170L619 362" fill="none" stroke="#c1a364" strokeWidth={8}/>
      <Guard x={980} y={414} h={350} face={-1} pose={crawl} eyes="wide" mouth="grit" sweat shadow={0}/>
      <Theo x={563} y={414} h={320} face={1} pose={pull} hurt/>
     </>:<>
      <Guard x={660+move} y={411} h={350} pose={crawl} eyes="worried" shadow={0}/>
      <Theo x={1270+move} y={411} h={320} pose={crawl} hurt={section>=10}/>
      <Jug x={1130+move} y={393} s={.43} full={section>=12}/>
     </>}
    </g>
    {fall&&Array.from({length:8},(_,i)=><path key={i} d="M-6-3L9-6L7 7Z" transform={`translate(${960+i*17},${500+((p.t*74+i*83)%380)}) rotate(${p.t*20+i*32})`} fill="#b7b5a2"/>)}
    {mode==='boot'&&<g transform={`translate(1005,${505+bootFall*407}) rotate(${bootFall*110})`}><path d="M-25-40H24V12H66Q82 20 75 35H-29Z" fill="#34343a" stroke={INK} strokeWidth={8}/></g>}
   </Screen>
  </AbsoluteFill>
  <Vignette o={.16}/>
 </AbsoluteFill>;
};

const Pump:React.FC<{p:P;mode:Mode;variant:number;speaker?:string;section:number}>=({p,mode,speaker,section})=>{
 const tankDetail=mode==='tank';
 const focus=tankDetail?cam(1404,752,1.57):cam(1408,865,1.02);
 return <Scene bg="ch2-pump" a={focus} b={{...focus,z:focus.z+.05}} p={p}>
  <text x={1404} y={693} fontFamily="DejaVu Sans,sans-serif" fontWeight={900} fontSize={47} textAnchor="middle" fill="#293130">8,000 GALLONS</text>
  <text x={1404} y={739} fontFamily="DejaVu Sans,sans-serif" fontWeight={700} fontSize={19} textAnchor="middle" fill="#3a4039">FOUNTAIN RESERVOIR</text>
  {section!==7&&<>
   <Guard x={810} y={1425} h={590} pose={tankDetail?POSES.holdUp:POSES.standRelax} eyes="worried" mouth={speaker==='danny'&&Math.floor(p.t*5)%3?'open':'flat'}/>
   <Theo x={2110} y={1430} h={510} face={-1} hurt mouth={speaker==='theo'&&Math.floor(p.t*5)%3?'open':'flat'}/>
   <Jug x={1330} y={1400} s={.87}/><Jug x={1500} y={1420} s={.87}/>
  </>}
 </Scene>;
};

const Cinema:React.FC<{p:P;mode:Mode;variant:number}>=({p,mode,variant})=>{
 const focus=mode==='door'?cam(1890,925,1.25):cam(1408,836,1.03);
 return <Scene bg="ch2-cinema" a={focus} b={{...focus,z:focus.z+.06}} p={p}>
  <text x={2235} y={521} fill="#30332d" textAnchor="middle" fontFamily="DejaVu Sans,sans-serif" fontSize={25} fontWeight={900}>CINEMA</text>
  <text x={2235} y={549} fill="#30332d" textAnchor="middle" fontFamily="DejaVu Sans,sans-serif" fontSize={22} fontWeight={800}>SERVICE</text>
  <Theo x={1205} y={1425} h={530} pose={POSES.standRelax}/>
  <Guard x={1840} y={1395} h={625} pose={mode==='door'?POSES.lock:POSES.standRelax} propN={mode==='door'?'keys':'none'} eyes="worried"/>
 </Scene>;
};

const Route:React.FC<{p:P}>=({p})=><AbsoluteFill style={{background:'#17212e'}}><World bg="concourse" cam={FULL} width={1920} height={1080} filter="brightness(.18) blur(5px)"/><Screen>
 <Txt x={960} y={220} size={70} fill={GOLD}>THE WAY THROUGH</Txt>
 {[{x:350,y:700,w:310,h:220,t:'SUMMIT OUTDOORS'},{x:800,y:370,w:330,h:180,t:'CINEMA'},{x:1370,y:700,w:310,h:220,t:'PUMP ROOM'}].map(a=><g key={a.t}><rect x={a.x-a.w/2} y={a.y-a.h/2} width={a.w} height={a.h} rx={25} fill="#4b626c" stroke={INK} strokeWidth={9}/><text x={a.x} y={a.y+10} textAnchor="middle" fontFamily="DejaVu Sans,sans-serif" fontSize={25} fontWeight={800} fill="#e7e3d1">{a.t}</text></g>)}
 <path d="M350 580V330H1370V580" fill="none" stroke={GOLD} strokeWidth={13} strokeDasharray="20 15" strokeDashoffset={-p.t*12}/><path d="M1345 550L1370 590L1395 550" fill="none" stroke={GOLD} strokeWidth={12}/>
 <path d="M610 700H1130" stroke="#ae594a" strokeWidth={13}/><Txt x={870} y={790} size={40} fill="#e5ba9b">THE COURT BELOW</Txt>
 </Screen></AbsoluteFill>;

const Roof:React.FC<{p:P;mode:Mode;variant:number;section:number}>=({p,mode,section})=>{
 const phase=threeBlinks(p.t,.3);
 const windowShot=mode==='window';
 const focus=windowShot?cam(ROOF_WIN.x,402,3.0):cam(1430,955,1.025);
 const signal=mode==='signal'?phase:0;
 return <Scene bg="ch2-roof-night" a={focus} b={{...focus,z:focus.z+.04}} p={p}>
  {windowShot?<>
   <ellipse cx={ROOF_WIN.x} cy={ROOF_WIN.y} rx={22} ry={18} fill="#ffebad" opacity={phase*.23}/>
   <rect x={ROOF_WIN.x-9} y={ROOF_WIN.y-10} width={18} height={20} fill="#fff3c3" opacity={phase}/>
  </>:<>
   <Guard x={1190} y={1530} h={595} pose={mode==='radio'?POSES.radio:POSES.flashlight} propN={mode==='radio'?'radio':'flashlight'} eyes={mode==='signal'?'wide':'worried'} mouth="flat" dim={.83}/>
   {section>=13&&<Theo x={865} y={1520} h={500} face={1} pose={POSES.standRelax} hurt bandaged clean dim={.83}/>}
  </>}
  {mode==='signal'&&<g>
   {/* The copied signal comes from the low painted department store roof. */}
   <path d={`M2450 715L${ROOF_WIN.x-8} ${ROOF_WIN.y-14}L${ROOF_WIN.x+15} ${ROOF_WIN.y+9}Z`} fill="#fff0ab" opacity={signal*.48}/>
   <circle cx={2450} cy={715} r={13} fill="#fff8d8" opacity={signal}/>
   <text x={2510} y={870} textAnchor="middle" fontFamily="DejaVu Sans,sans-serif" fontSize={29} fontWeight={800} fill="#8192a4">DEPARTMENT STORE</text>
  </g>}
 </Scene>;
};

const Drill:React.FC<{p:P;variant:number}>=({p})=>{
 const workerX=950,workerY=1440,workerH=640;
 const drillPose:Pose={...POSES.flashlight,armN:[90,90],armF:[100,82]};
 const {handN}=jointsOf(drillPose,workerX,workerY,workerH,-1);
 return <Scene bg="ch2-service-hall" a={cam(1350,890,1.035)} b={cam(1320,890,1.09)} p={p} filter="sepia(.15) brightness(.92)">
  <Stick x={2260} y={1190} h={425} look={LOOKS.teenB} pose={POSES.scared} back ghost/>
  <Stick x={1510} y={1375} h={520} look={{...LOOKS.woman,shirt:'#4e6573'}} pose={POSES.point} face={-1} back ghost/>
  <Stick x={workerX} y={workerY} h={workerH} look={{...LOOKS.shopperC,bulk:1.2}} pose={drillPose} face={-1} back ghost/>
  <g transform={`translate(${handN[0]-62+Math.sin(p.t*40)*2},${handN[1]-61})`}>
   <rect x={-112} y={-35} width={208} height={74} rx={14} fill="#a98d4d" stroke={INK} strokeWidth={10}/>
   <path d="M42 37V72H72V37" fill="#39464b" stroke={INK} strokeWidth={10}/>
   <path d="M-200 0H-111" stroke="#9ba8aa" strokeWidth={13}/>
  </g>
  <Waves x={510} y={handN[1]-62} t={p.t} size={95} color="#d5b45b" dir={-1}/>
 </Scene>;
};

export const Chapter2Scene:React.FC<{p:P;mode:Mode;variant:number;section:number;speaker?:string}>=props=>{
 const {p,mode,variant,section}=props;
 if(['ceiling','fall','rescue','crowd','marcus','boot','cut'].includes(mode))return <Ceiling {...props}/>;
 if(['pump','tank'].includes(mode))return <Pump {...props}/>;
 if(['cinema','door'].includes(mode))return <Cinema {...props}/>;
 if(mode==='plan')return <Route p={p}/>;
 if(mode==='drill')return <Drill {...props}/>;
 if(mode==='keys')return <KeyRing16 t={p.t} tagBig={section===14?.9:0} glowAt={section===14?.2:1e9}/>;
 if(mode==='radio'||mode==='vera')return <RadioCard t={p.t} frame={p.frame} state={mode==='vera'?'crackle':'off'} label={mode==='vera'?'VERA':'NO TRANSMISSION'}/>;
 if(['roof','window','signal'].includes(mode))return <Roof {...props}/>;
 if(mode==='title'||mode==='end')return <AbsoluteFill style={{background:'#101924'}}>
 <World bg={mode==='end'?'parkview':'concourse'} cam={{...FULL,z:1.05+.025*Math.min(p.t,8)}} width={1920} height={1080} filter="brightness(.25) blur(5px)"/>
 <Screen><g opacity={clamp(p.t/.35)}><Txt x={960} y={280} size={86}>THE NIGHT GUARD</Txt><Txt x={960} y={410} size={52} fill="#cbd2dd">{mode==='end'?'NEXT · CHAPTER THREE':'CHAPTER TWO'}</Txt><Txt x={960} y={580} size={mode==='end'?148:100} fill={GOLD}>{mode==='end'?'THE PHARMACY':'THE BOY IN THE CEILING'}</Txt><Txt x={960} y={755} size={42} fill="#cbd2dd">{mode==='end'?"SUBSCRIBE TO FOLLOW DANNY’S STORY":'BOOK ONE · FORTY-TWO KEYS'}</Txt></g></Screen>
 </AbsoluteFill>;
 if(mode==='rewind')return <AbsoluteFill><Ceiling {...props} mode="fall"/><RewindFx t={p.t} frame={p.frame}/></AbsoluteFill>;
 return <Store {...props}/>;
};
