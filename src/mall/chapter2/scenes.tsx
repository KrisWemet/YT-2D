import React, {useContext} from 'react';
import {RetentionContinuity} from './retention-context';
import {AbsoluteFill} from 'remotion';
import {Screen, Txt, Grille, Padlock, Waves, RewindFx} from '../Overlays';
import {Scene, Guard, Zed, P, Beyond, HoldGate, Vignette} from '../shots';
import {Stick, StickProps, LOOKS, Pose, POSES, jointsOf, skeleton} from '../Stick';
import {GateScene, OfficeScene, ROOF_WIN} from '../chapter1/scenes';
import {FPS} from '../MallChapter';
import {blendPose, blink, climbPose, ease, idlePose, runPose, shamblePose} from './motion';
import type {Speech} from './motion';
import type {PictureMode} from './picture-edit';
import type {ShotView} from './additional-views';
import {KeyRing16, KeyInHand, RadioCard, SleepingBag, B3Door16} from '../chapter1/props';
import {threeBlinks} from '../vertical';
import {World, FULL} from '../World';

const INK='#0b0c0c', GOLD='#f0c53c';
export type Mode=PictureMode|'store'|'sleep'|'food'|'lock'|'chalk'|'prints'|'rack'|'theo'|'talk'|'water'|'plan'|'ceiling'|'fall'|'rescue'|'crowd'|'marcus'|'boot'|'cinema'|'door'|'pump'|'tank'|'drill'|'bandage'|'cut'|'tent'|'roof'|'window'|'signal'|'vera'|'radio'|'keys'|'title'|'rewind'|'end';
export const THEO={skin:'#d3ac87',shirt:'#61776c',hair:'messy' as const,hairColor:'#392d25',hat:'hood' as const,hatColor:'#61776c',bulk:.82};
const crawl:Pose={lean:80,head:-40,armF:[65,88],armN:[70,93],legF:[-85,-90],legN:[-75,-85],sit:true};
const bandagePose:Pose={lean:60,head:-20,armF:[50,20],armN:[55,20],legF:[75,-70],legN:[95,-5],sit:true};
const hanging:Pose={lean:-76,head:45,armF:[-65,-95],armN:[-65,-95],legF:[88,92],legN:[8,0],sit:true};
const pull:Pose={lean:80,head:-55,armF:[68,95],armN:[70,100],legF:[-90,-85],legN:[-90,-85],sit:true};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const lerp=(a:number,b:number,k:number)=>a+(b-a)*k;
const cam=(x:number,y:number,z:number)=>({x,y,z});

const clock = (p: P) => p.frame / FPS;
type TheoProps = Partial<StickProps> & {hurt?: boolean; bandaged?: boolean; clean?: boolean; time?: number; speech?: Speech};

export const Theo: React.FC<TheoProps> = ({hurt=false, bandaged=false, clean=false, time, speech, ...props}) => {
 const {x=1840, y=1430, h=610, face=1, pose=POSES.stand, eyes='worried', mouth='flat'} = props;
 const actedPose = time === undefined ? pose : {
  ...pose, head: (pose.head ?? 0) + 2.8 * Math.sin(time * 1.4 + 1) - 4.5 * (speech?.accent ?? 0),
 };
 const {kneeN, footN} = skeleton(actedPose);
 const calf = [lerp(kneeN[0], footN[0], .67), lerp(kneeN[1], footN[1], .67)];
 return <>
  <Stick x={x} y={y} h={h} look={{...THEO,...(clean?{shirt:'#628694',hatColor:'#628694'}:{})}} shadow={.18} {...props}
   pose={actedPose} eyes={time===undefined?eyes:blink(eyes,time,1.3)} mouth={speech?.open?'open':mouth}/>
  {hurt&&<g transform={`translate(${x},${y}) scale(${face*h/300},${h/300}) translate(${calf}) rotate(${-pose.legN[1]})`}>
   {bandaged?<><path d="M-6-5H7V7H-6Z" fill="#dad7c5" stroke={INK} strokeWidth={2}/><path d="M-3-4l6 10M1-4l5 8" stroke="#aeabb0" strokeWidth={1}/></>
    :<path d="M-2-7L3 7" stroke="#9f5044" strokeWidth={4} strokeLinecap="round"/>}
  </g>}
 </>;
};

const Danny: React.FC<React.ComponentProps<typeof Guard> & {time: number}> = ({
 time, pose=POSES.stand, eyes='worried', look2, ...props
}) => <Guard {...props} pose={idlePose(pose,time)} eyes={blink(eyes,time)}
 look2={look2 ?? .22 * Math.sin(time * 1.37)}/>;

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

const Store:React.FC<DetailProps & {variant:number}>=({p,mode,variant,speaker,speech,section,view='base'})=>{
 const retention=useContext(RetentionContinuity);
 const detail=variant%3;const dropping=mode==='theo'&&section===5;const isTalk=['talk','theo','water','tent'].includes(mode);
 const baseFocus=mode==='rack'?cam(2130,780,1.55):mode==='chalk'||mode==='prints'?cam(1690,1270,1.9):['food','food-two','inventory'].includes(mode)?cam(1330,1200,1.72):mode==='sleep'||mode==='search-bag'?cam(1020,1300,1.7):mode==='bandage'?cam(1720,1250,2.2):
 isTalk?(detail===1?cam(speaker==='theo'?1820:1020,1100,1.9):cam(1460,1110,1.35)):cam(1408,960,1.15);
 const subjectY=mode==='tent'?1140:1100;
 const detailFocus=mode==='bandage'?cam(1810,1260,3.3):
  ['food','food-two','inventory','water'].includes(mode)?cam(1490,1340,2.4):
  mode==='chalk'||mode==='prints'?cam(1770,1320,2.7):mode==='rack'?cam(2120,470,2.3):
  mode==='lock'?cam(1430,950,2.9):mode==='sleep'||mode==='search-bag'?cam(1210,1400,2.4):
  cam(1850,subjectY,2.35);
 const focus=view==='base'?baseFocus:view==='wide'?cam(1460,1110,1.32):view==='danny'?cam(1030,1160,2.12):
  view==='theo'?cam(1870,subjectY,2.12):detailFocus;
 const danPose=mode==='sleep'?POSES.sitHug:mode==='search-bag'?POSES.crouch:mode==='chalk'||mode==='prints'?POSES.crouch:mode==='rack'?POSES.lookUp:mode==='bandage'?bandagePose:isTalk?POSES.think:POSES.standRelax;
 const time=clock(p);
 const answer=speech?.accent ?? 0;
 const theoBase=mode==='tent'?POSES.standRelax:POSES.sitChair;
 const theoPose=idlePose(blendPose(theoBase,{...theoBase,armN:[52,117],head:-4},answer*.66),time+1.4);
 const listening=blendPose(danPose,{...danPose,head:(danPose.head??0)+9,lean:(danPose.lean??0)+4},answer*.7);
 return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.06,x:focus.x+(variant%2?12:-12)}} p={p} filter="brightness(.94)">
 <Beyond><Zed x={1420+Math.sin(p.t*.15)*30} y={930} h={270} dim={.55} ghost/></Beyond><HoldGate frac={1} opacity={.7}/>
 {(['chalk','prints','rack'].includes(mode)||dropping)&&<Rack tile t={p.t} open={mode==='theo'||mode==='rack'}/>} 
 {['chalk','prints'].includes(mode)&&<g>{Array.from({length:38},(_,i)=><ellipse key={i} cx={1100+(i*137)%950} cy={1220+(i*59)%225} rx={20+i%5*7} ry={4+i%3} fill="#ced6c9" opacity={.13}/>)}</g>}
 {mode==='prints'&&<g>{[0,1,2,3,4,5].map(i=>footprint(1240+i*118,1400-i*12,65+(i%2?12:-12),i))}{[0,1,2].map(i=>footprint(1960+i*42,1240-i*230,-9,i+6))}</g>}
 {!dropping&&<Danny time={time} x={mode==='bandage'?1530:1010} y={mode==='sleep'?1430:mode==='bandage'?1370:1470} h={mode==='sleep'?630:680} pose={listening} propN={mode==='rack'?'flashlight':mode==='lock'?'keys':'none'} eyes={mode==='sleep'?'closed':mode==='rack'?'wide':'worried'} sweat={mode==='rack'}/>}
 {((isTalk&&mode!=='tent')||mode==='bandage')&&!dropping&&<g><ellipse cx={mode==='bandage'?1830:1900} cy={1460} rx={76} ry={24} fill={INK} opacity={.25}/><path d={`M${(mode==='bandage'?1830:1900)-65} 1280H${(mode==='bandage'?1830:1900)+65}L${(mode==='bandage'?1830:1900)+54} 1450H${(mode==='bandage'?1830:1900)-54}Z`} fill="#687d7d" stroke={INK} strokeWidth={7}/></g>}
 {(mode==='sleep'||mode==='search-bag')&&<SleepingBag x={1180} y={1435} s={1.6}/>}
 {dropping?<Theo x={2080} y={1020-lerp(240,0,clamp(p.t/2))} h={535} pose={POSES.sneak} face={-1}/>:isTalk||mode==='bandage'?<Theo x={mode==='bandage'?1830:1900} y={mode==='tent'?1470:1310} h={600} pose={theoPose} time={time} speech={speech} face={-1} hurt={section>=10} bandaged={section>=13} clean={section>=13}/>:null}
 {['food','sleep','chalk','prints','talk'].includes(mode)&&<Box x={1250} y={1370} s={.9} open={mode==='food'&&detail===1}/>}
 {['food','food-two','inventory'].includes(mode)&&<>
  <Bar x={1295} y={1350} s={1.16}/>{mode==='food-two'&&<Bar x={1130} y={1375}/>}
  {mode==='inventory'&&[0,1,2].map(i=><g key={i}><rect x={1390+i*63} y={1280} width={47} height={69} rx={7} fill="#9aa5ab" stroke={INK} strokeWidth={5}/><path d={`M${1396+i*63} 1300h35v27h-35Z`} fill="#987951"/></g>)}
  {mode==='inventory'&&[0,1,2].map(i=><Jug key={i} x={1620+i*83} y={1395} s={.55}/>)}
 </>}
 {['water','tent'].includes(mode)&&<><Jug x={1420} y={1410} s={.9}/><Jug x={1580} y={1425} s={.9} full={!(retention&&section>=12)}/></>}
 {mode==='lock'&&<Padlock x={1430} y={950} s={1.1}/>}
 {mode==='tent'&&<g><path d="M1540 1445Q1680 1100 2025 1445Z" fill="#365f68" stroke={INK} strokeWidth={12}/><path d="M1740 1445L1785 1250L1840 1445Z" fill="#0e1b24" stroke={INK} strokeWidth={7}/><path d="M1540 1445H2025" stroke="#a4b19d" strokeWidth={8}/></g>}
 {mode==='bandage'&&<g><rect x={1170} y={1330} width={180} height={100} rx={15} fill="#e4ded0" stroke={INK} strokeWidth={7}/><path d="M1259 1350V1410M1229 1380H1289" stroke="#a64e43" strokeWidth={14}/></g>}
 </Scene>;
};

// The painted cutaway fixes the ledge at y=426 in screen coordinates. Animate only
// the figures, the tile break, and the loose boot, so all three share the same camera.
const Ceiling:React.FC<DetailProps & {variant:number}>=({p,mode,variant,section,speech,view='base'})=>{
 const time=clock(p);
 const catching=mode==='wrist-catch';
 const strap=mode==='strap';
 const fall=catching||['fall','fall-detail','collapse','strap'].includes(mode);
 const recovery=mode==='rescue-recover';
 const rescue=mode==='rescue'||recovery, cut=mode==='cut';
 const detail=mode==='fall-detail'||strap||catching;
 const memory=mode==='fountain-memory';
 const marcusDetail=mode==='marcus-detail';
 const gatePull=gateTug(p);
 const walking=mode==='marcus';
 const gateTime=p.ev.rattle;
 const walkDistance=Number.isFinite(gateTime)?Math.min(p.t,gateTime)*16+Math.max(0,p.t-gateTime-1.1)*16:p.t*16;
 const marcusX=730+(walking?Math.min(walkDistance,82):0);
 const marcusPose=marcusDetail?POSES.zLimp:fall||mode==='marcus-up'?idlePose(POSES.lookUp,time):
  blendPose(shamblePose(time),POSES.rattle,gatePull);
 const chest=jointsOf(marcusPose,marcusX,1020,235).chestRadio;
 const close=marcusDetail||['marcus','marcus-up','crowd','fountain-memory','boot-rest'].includes(mode);
 const baseZoom=marcusDetail?3.9:cut?2.05:detail?1.85:mode==='crawl-close'||mode==='walkway'?1.4:close?1.45:variant%3===1?1.15:1;
 const basePan=marcusDetail?[960-chest[0]*baseZoom,605-chest[1]*baseZoom]:cut?[-1640,-350]:detail?[-480,-155]:mode==='crawl-close'||mode==='walkway'?[-315,-95]:close?[-330,-405]:baseZoom>1?[-120,-40]:[0,0];
 const crowdView=['crowd','fountain-memory','marcus','marcus-up','boot-rest'].includes(mode);
 const crawlingView=['ceiling','crawl-close','walkway','return'].includes(mode);
 const viewFocus=crowdView?cam(mode==='boot-rest'?1010:700,mode==='boot-rest'?910:875,2.45):
  view==='theo'?cam(crawlingView?1320:675,370,2.65):view==='danny'?cam(crawlingView?800:973,410,2.55):cam(799,410,3.1);
 const zoom=view==='base'?baseZoom:view==='wide'?1.08:viewFocus.z;
 const pan=view==='base'?basePan:view==='wide'?[-75,-20]:
  [960-viewFocus.x*zoom,540-viewFocus.y*zoom];
 const moving=['ceiling','crawl-close','walkway','return'].includes(mode);
 const move=moving?Math.min(115,p.t*10):0;
 const shake=fall?Math.sin(p.t*18)*1.5:0;
 const bootFall=mode==='boot-rest'?1:mode==='boot'?clamp(p.t/1.15):0;
 const collapse=mode==='collapse'?ease(p.t/.48):1;
 const hauled=recovery?1:rescue?ease((p.t-.14)/1.5):0;
 const reach=catching?ease(p.t/.45):1;
 const strain=fall?Math.sin(p.t*7)*Math.exp(-p.t*.32):0;
 const hangingPose: Pose={...hanging,head:45+strain*7,legN:[8+strain*10,strain*12]};
 const dannyPose=fall?blendPose(crawl,hangingPose,collapse)
  :blendPose({...crawl,armN:[77,104]},crawl,hauled);
 const dannyX=980-97*hauled;
 const dannyY=fall?390+38*collapse+strain*3:lerp(429,414,hauled);
 const braced=strap||mode==='rescue';
 const pulling=blendPose({...pull,armN:[39,70]},{
  ...pull,armF:braced?[130,172]:pull.armF,armN:[70+hauled*7,100+hauled*8],
 },reach);
 const theoPose=idlePose(recovery?{...pull,head:-49,armF:[20,38],armN:[39,32]}:pulling,time,1.3);
 const theoX=563-97*hauled+17*reach;
 const theoY=fall?423:414;
 const braceHand=jointsOf(theoPose,theoX,theoY,320).handF;
 const crawlingStep=moving?Math.sin(p.t*4.2)*Math.max(0,1-p.t/12):.15*Math.sin(time*1.7);
 const crawlingPose=(step: number): Pose=>({...crawl,head:-39+4*step,
  armF:[65-12*step,88-9*step],armN:[70+12*step,93+9*step],
  legF:[-85-8*step,-90+11*step],legN:[-75+8*step,-85-11*step]});
 return <AbsoluteFill style={{background:'#111921',overflow:'hidden'}}>
  <AbsoluteFill style={{transform:`translate(${pan[0]}px,${pan[1]}px) scale(${zoom})`,transformOrigin:'0 0'}}>
   <World bg="ch2-ceiling" cam={FULL} width={1920} height={1080}/>
   <Screen>
    {/* Smaller figures occupy the floor behind the fountain, with larger figures in front. */}
    {!memory&&Array.from({length:78},(_,i)=>{
     const row=Math.floor(i/17),span=650+row*260;
     const x=960-span/2+((i*139)%span),y=714+row*47;
     const size=.62+row*.08;
     return <g key={i} transform={`translate(${x},${y}) scale(${size})`} opacity={.78}>
      <circle cy={-68} r={13} fill={i%3?'#68735d':'#8a9574'} stroke={INK} strokeWidth={4}/>
      <path d="M0-53V-18M0-43L-23-27M0-43L22-24M0-18L-12 2M0-18L12 3" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round"/>
     </g>;
    })}
    {!memory&&Array.from({length:16},(_,i)=><Zed key={i} x={100+i*111+Math.sin(p.t*.3+i)*3} y={1018+(i%3)*18} h={178+(i%3)*18} k={i} face={i%2?1:-1} shadow={.1} dim={.88}/>)}
    {!memory&&<Stick x={marcusX} y={1020} h={235} look={{...LOOKS.marcusZ,radioOnChest:false}} pose={marcusPose} eyes="zombie" mouth="zombie" shadow={.15}/>}
    {!memory&&<rect x={chest[0]-5} y={chest[1]-5} width={10} height={16} rx={2} fill="#6d747e" stroke={INK} strokeWidth={2.5}/>}
    {(fall||rescue||mode==='return')&&collapse>.6&&<>
     <path d="M930 431L950 408L974 432L1013 402L1048 430L1080 415L1114 438V475H930Z" fill="#111821" stroke={INK} strokeWidth={6}/>
     <path d="M947 470L985 514L1020 476M1064 467L1102 499" fill="#9b9e93" stroke={INK} strokeWidth={5}/>
    </>}
    {!close&&<g transform={`translate(${shake},0)`}>
     {fall||rescue?<>
      {braced&&<path d={`M405 168L386 170L${braceHand[0]} ${braceHand[1]}`} fill="none" stroke="#c1a364" strokeWidth={8}/>}
      <Guard x={dannyX} y={dannyY} h={350} face={rescue?-1:1} pose={dannyPose} eyes={blink('wide',time)} mouth="grit" sweat shadow={0}/>
      <Theo x={theoX} y={theoY} h={320} face={1} pose={theoPose} time={time} speech={speech}/>
     </>:<>
      <Guard x={660+move} y={411} h={350} pose={crawlingPose(crawlingStep)} eyes={blink('worried',time)} shadow={0}/>
      <Theo x={1270+move} y={411} h={320} pose={crawlingPose(-crawlingStep)} time={time} speech={speech} hurt={mode==='cut'||mode==='return'}/>
      <Jug x={1130+move} y={393} s={.43} full={section>=12}/>
     </>}
    </g>}
    {fall&&collapse>.6&&Array.from({length:8},(_,i)=><path key={i} d="M-6-3L9-6L7 7Z" transform={`translate(${960+i*17},${500+((p.t*74+i*83)%380)}) rotate(${p.t*20+i*32})`} fill="#b7b5a2"/>)}
    {(mode==='boot'||mode==='boot-rest')&&<g transform={`translate(1005,${505+bootFall*407}) rotate(${bootFall*110})`}><path d="M-25-40H24V12H66Q82 20 75 35H-29Z" fill="#34343a" stroke={INK} strokeWidth={8}/></g>}
   </Screen>
  </AbsoluteFill>
  <Vignette o={.16}/>
 </AbsoluteFill>;
};

const Pump:React.FC<DetailProps>=({p,mode,speech,section,view='base'})=>{
 const tankDetail=mode==='tank';
 const ladder=mode==='ladder';
 const filling=mode==='fill-jugs';
 const baseFocus=ladder?cam(430,610+350*ease(p.t/4.8),1.68):mode==='gauge'?cam(2030,730,3.1):tankDetail?cam(1404,752,1.57):
  filling||mode==='pump-jugs'?cam(1340,1220,1.75):mode==='pump-theo'?cam(2075,1110,1.6):cam(1408,865,1.02);
 const focus=view==='base'?baseFocus:view==='wide'?cam(1408,930,1.02):
  view==='danny'?cam(830,1110,2.1):view==='theo'?cam(2090,1120,2.1):
  mode==='pump-theo'?cam(2110,1335,3.2):mode==='tank'||mode==='gauge'?cam(2030,730,3.1):
  mode==='ladder'?cam(340,300+Math.min(p.t*120,635),2.1):cam(1410,1390,2.95);
 const time=clock(p);
 const ladderTime=Math.min(p.t,4.8);
 const ladderBase={...POSES.lookUp,head:-9};
 const speakingPose=idlePose(blendPose(POSES.standRelax,POSES.point,(speech?.accent??0)*.32),time+1.2);
 return <Scene bg="ch2-pump" a={focus} b={{...focus,z:focus.z+.05}} p={p}>
  <text x={1404} y={693} fontFamily="DejaVu Sans,sans-serif" fontWeight={900} fontSize={47} textAnchor="middle" fill="#293130">8,000 GALLONS</text>
  <text x={1404} y={739} fontFamily="DejaVu Sans,sans-serif" fontWeight={700} fontSize={19} textAnchor="middle" fill="#3a4039">FOUNTAIN RESERVOIR</text>
  {ladder&&<>
   <Guard x={310} y={650+Math.min(p.t*120,635)} h={500} pose={climbPose(ladderBase,ladderTime,1.22)} back/>
   <Theo x={325} y={355+Math.min(p.t*106,665)} h={415} pose={climbPose(ladderBase,ladderTime+.24,1.13)} back hurt/>
  </>}
  {!ladder&&section!==7&&mode!=='gauge'&&<>
   <Danny time={time} x={filling?1085:810} y={1425} h={590} pose={filling?POSES.crouch:tankDetail?POSES.holdUp:POSES.standRelax} eyes="worried"/>
   <Theo x={2110} y={1430} h={510} face={-1} hurt pose={speakingPose} time={time} speech={speech}/>
   <Jug x={1330} y={1400} s={.87} full={!filling||p.t>1.4}/><Jug x={1500} y={1420} s={.87}/>
   {filling&&<path d="M1337 1274v58" stroke="#9ddbe4" strokeWidth={5+Math.sin(p.t*17)} strokeLinecap="round"/>}
  </>}
 </Scene>;
};

const PumpAction: React.FC<{p:P;mode:Mode}> = ({p,mode}) => {
 const impact=mode==='pump-impact';
 const catching=mode==='pump-catch';
 const nearLadder=impact||catching;
 const recoil=clamp(1-Math.abs(p.t-1.8)/.2);
 const dannyX=nearLadder?520-48*clamp((p.t-.22)/1.15)+25*recoil:1110;
 const theoX=nearLadder?788:1980;
 const dannyPose:Pose=impact
  ? p.t<.34?POSES.crouch:{...POSES.lookBack,lean:-5+recoil*20,head:15}
  : catching?POSES.lookBack:{...POSES.holdUp,armF:[-14,-10]};
 const theoPose=catching?POSES.crouch:POSES.standRelax;
 const hands=jointsOf(dannyPose,dannyX,1375,575,-1);
 const catchHand=jointsOf(theoPose,theoX,1375,480,-1).handN;
 const focus=nearLadder?cam(665,1060,1.9):cam(1490,1115,1.44);
 return <Scene bg="ch2-pump" a={focus} b={{...focus,z:focus.z+.04}} p={p}>
  <Guard x={dannyX} y={1375} h={575} pose={dannyPose} face={-1} eyes="wide" sweat={impact&&recoil>0}/>
  <Theo x={theoX} y={1375} h={480} pose={theoPose} face={-1} hurt/>
  {nearLadder?<>
   <Jug x={catching?catchHand[0]:642} y={catching?catchHand[1]+74-100*(1-clamp(p.t/.33)):1380} s={.82}/>
   <Jug x={875} y={1380} s={.82}/>
  </>:<>
   <Jug x={hands.handN[0]} y={hands.handN[1]+74} s={.82}/>
   <Jug x={hands.handF[0]} y={hands.handF[1]+74} s={.82}/>
  </>}
  {impact&&recoil>0&&<path d="M376 967l-28-15m33-4l-13-29m19 46l-35 10" stroke="#e4ce9d" strokeWidth={6} strokeLinecap="round" opacity={recoil}/>}
 </Scene>;
};

const Cinema:React.FC<DetailProps>=({p,mode,speech})=>{
 const focus=mode==='cinema-bedding'?cam(590,1145,2.2):mode==='door'||mode==='door-open'?cam(1890,925,1.25):cam(1408,836,1.03);
 return <Scene bg="ch2-cinema" a={focus} b={{...focus,z:focus.z+.06}} p={p}>
  <text x={2235} y={521} fill="#30332d" textAnchor="middle" fontFamily="DejaVu Sans,sans-serif" fontSize={25} fontWeight={900}>CINEMA</text>
  <text x={2235} y={549} fill="#30332d" textAnchor="middle" fontFamily="DejaVu Sans,sans-serif" fontSize={22} fontWeight={800}>SERVICE</text>
  <Theo x={1205} y={1425} h={530} pose={idlePose(POSES.standRelax,clock(p)+1.4)} time={clock(p)} speech={speech}/>
  {mode==='door-open'&&<path d="M1900 260L2020 293V1207L1900 1233Z" fill="#121c27" stroke="#55636b" strokeWidth={9}/>}
  {mode!=='cinema-memory'&&<Danny time={clock(p)} x={1840} y={1395} h={625} pose={mode==='door'||mode==='door-open'?POSES.lock:POSES.standRelax} propN={mode==='door'?'keys':'none'} eyes="worried"/>}
 </Scene>;
};

const Route:React.FC<{p:P}>=({p})=><AbsoluteFill style={{background:'#17212e'}}><World bg="concourse" cam={FULL} width={1920} height={1080} filter="brightness(.18) blur(5px)"/><Screen>
 <Txt x={960} y={220} size={70} fill={GOLD}>THE WAY THROUGH</Txt>
 {[{x:350,y:700,w:310,h:220,t:'SUMMIT OUTDOORS'},{x:800,y:370,w:330,h:180,t:'CINEMA'},{x:1370,y:700,w:310,h:220,t:'PUMP ROOM'}].map(a=><g key={a.t}><rect x={a.x-a.w/2} y={a.y-a.h/2} width={a.w} height={a.h} rx={25} fill="#4b626c" stroke={INK} strokeWidth={9}/><text x={a.x} y={a.y+10} textAnchor="middle" fontFamily="DejaVu Sans,sans-serif" fontSize={25} fontWeight={800} fill="#e7e3d1">{a.t}</text></g>)}
 <path d="M350 580V330H1370V580" fill="none" stroke={GOLD} strokeWidth={13} strokeDasharray="20 15" strokeDashoffset={-p.t*12}/><path d="M1345 550L1370 590L1395 550" fill="none" stroke={GOLD} strokeWidth={12}/>
 <path d="M610 700H1130" stroke="#ae594a" strokeWidth={13}/><Txt x={870} y={790} size={40} fill="#e5ba9b">THE COURT BELOW</Txt>
 </Screen></AbsoluteFill>;

const Roof:React.FC<DetailProps>=({p,mode,section,speech,view='base'})=>{
 const cueFlashes=(mode==='window-count'||mode==='signal-count')?[p.ev.one,p.ev.two,p.ev.three]:[];
 const phase=cueFlashes.length ? Number(cueFlashes.some(t=>Number.isFinite(t)&&p.t>=t&&p.t<t+.25)) : threeBlinks(p.t,.3);
 const windowShot=['window','window-count','dark-window'].includes(mode);
 const windowPulse=mode==='dark-window'?0:phase;
 const reply=mode==='roof-reply';
 const radio=mode==='roof-radio';
 const door=mode==='roof-door';
 const signal=mode==='signal'||mode==='signal-count'?phase:0;
 const baseFocus=windowShot?cam(ROOF_WIN.x,402,3.0):door?cam(2460,739,2.15):radio?cam(1210,1120,2.25):cam(1430,955,1.025);
 const focus=windowShot?(view==='base'?baseFocus:view==='wide'?cam(ROOF_WIN.x,440,1.85):cam(ROOF_WIN.x,ROOF_WIN.y+27,4.1)):
  view==='base'?baseFocus:view==='wide'?cam(1410,1010,1.02):
  view==='theo'?cam(870,1190,2.15):view==='detail'?cam(1210,1110,2.5):cam(1200,1200,2.15);
 const time=clock(p);
 const base=radio?POSES.radio:mode==='roof-lowered'?{...POSES.standRelax,head:16}:POSES.lookUp;
 const torchPose=idlePose(reply?blendPose(POSES.lookUp,POSES.pointUp,ease(p.t/.25)):base,time);
 const {handN}=jointsOf(torchPose,1190,1530,595,1);
 return <Scene bg="ch2-roof-night" a={focus} b={{...focus,z:focus.z+.04}} p={p}>
  {windowShot?<>
   <ellipse cx={ROOF_WIN.x} cy={ROOF_WIN.y} rx={22} ry={18} fill="#ffebad" opacity={windowPulse*.23}/>
   <rect x={ROOF_WIN.x-9} y={ROOF_WIN.y-10} width={18} height={20} fill="#fff3c3" opacity={windowPulse}/>
  </>:<>
   {!door&&<Guard x={1190} y={1530} h={595} pose={torchPose} look2={.28*Math.sin(time*1.3)} propN={radio?'radio':'flashlight'} back={reply} eyes={blink('worried',time)} dim={.83}/>}
   {!door&&section>=13&&<Theo x={865} y={1520} h={500} face={1} pose={idlePose(POSES.standRelax,time+1.3)} time={time} speech={speech} hurt bandaged clean dim={.83}/>}
  </>}
  {reply&&<path d={`M${handN[0]} ${handN[1]}L${ROOF_WIN.x-12} ${ROOF_WIN.y-10}L${ROOF_WIN.x+12} ${ROOF_WIN.y+11}Z`} fill="#fff0ab" opacity={phase*.6}/>}
  {(mode==='signal'||mode==='signal-count'||door)&&<g>
   <path d={`M2450 715L${ROOF_WIN.x-8} ${ROOF_WIN.y-14}L${ROOF_WIN.x+15} ${ROOF_WIN.y+9}Z`} fill="#fff0ab" opacity={signal*.56}/>
   <circle cx={2450} cy={715} r={13} fill="#fff8d8" opacity={signal}/>
   {door&&section===2&&<ellipse cx={2450+Math.sin(p.t*2)*8} cy={715} rx={19} ry={7} fill="#e8d4a3" opacity={Math.max(0,.62-p.t*.14)}/>}
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

type DetailProps = {p: P; mode: Mode; section: number; speaker?: string; speech?: Speech; view?:ShotView};

const gateTug = (p: P) => {
 const t = p.t - p.ev.rattle;
 if (!Number.isFinite(t) || t < -.24 || t > 1.1) return 0;
 const first = Math.max(0, 1 - Math.abs(t - .06)/.24);
 const second = Math.max(0, 1 - Math.abs(t - .49)/.24);
 return ease(Math.max(first,second));
};

const GateBeat: React.FC<DetailProps> = ({p, mode}) => {
 const isMarcus = mode==='hall-marcus';
 const time=clock(p);
 const tug=gateTug(p);
 const at=p.ev.rattle;
 const holdsGate=Number.isFinite(at)&&p.t>=at-.28&&p.t<at+.95;
 const shift=Number.isFinite(at)
  ? -28*(1-ease(p.t/Math.max(.4,at)))+65*ease((p.t-at-.95)/1.7)
  : Math.min(90,p.t*25);
 const pose=blendPose(holdsGate?POSES.frontStand:shamblePose(time),{...POSES.frontPress,lean:-8},tug);
 return <GateScene p={p} a={cam(1440,735,2.6)} b={cam(1450,729,2.75)} shakeXY={[tug*Math.sin(p.t*38)*2.6,0]}
  beyond={isMarcus
   ? <Stick x={1385+shift} y={955} h={330} pose={pose} front look={{...LOOKS.marcusZ,radioOnChest:false}} eyes="zombie" mouth="zombie" dim={.8}/>
   : <Zed x={1380+shift} y={954} h={305} ghost dim={.53}/>}
 />;
};

const Stockroom: React.FC<DetailProps> = ({p,mode,section,view='base'}) => {
 const radio=mode==='stock-radio';
 const seated=mode==='stock-wait'||mode==='receipt';
 const detail=['box-detail','box-bait','receipt'].includes(mode);
 const baseFocus=detail?cam(mode==='receipt'?1060:1450,1270,2.8):cam(1440,1050,1.33);
 const focus=view==='base'?baseFocus:view==='wide'?cam(1440,1100,1.25):
  view==='danny'||radio?cam(1030,1120,2.13):mode==='receipt'?cam(1110,1260,3.4):
  mode==='theo-sleep'?cam(1310,1280,2.3):cam(1450,1280,2.8);
 return <Scene bg="stockroom" a={focus} b={{...focus,z:focus.z+.09}} p={p} filter="brightness(.81)">
  <Box x={1450} y={1325} s={.98} open={mode==='stock-box'&&section===3}/>
  {mode==='box-bait'&&<Bar x={1430} y={1224} s={.82}/>}
  {mode==='box-detail'&&<path d="M1518 1243l32-13v33h-31Z" fill="#69757b" stroke={INK} strokeWidth={4}/>}
  {mode==='theo-sleep'?<>
   <SleepingBag x={1290} y={1440} s={1.5}/>
   <Theo x={1320} y={1370} h={500} pose={idlePose(POSES.sitHug,clock(p),.8)} eyes="closed" hurt bandaged/>
   <Jug x={1630} y={1425} s={.85}/><Jug x={1770} y={1425} s={.85}/>
  </>:!detail&&<Danny time={clock(p)} x={1030} y={1460} h={625} pose={radio?POSES.radio:seated?POSES.sitHug:POSES.crouch} propN={radio?'radio':'none'} eyes="worried"/>}
  {mode==='receipt'&&<g transform="translate(1100 1260) rotate(-11)">
   <path d="M-102-156H102V148l-21-11-20 13-22-13-21 12-21-12-21 12-20-12-20 12-20-12-18 12Z" fill="#ddd6c0" stroke={INK} strokeWidth={5}/>
   {['SUPPLIES','BARS   ||||','CANS   |||','WATER  ||||'].map((line,i)=><text key={line} x={-79} y={-102+i*54} fontSize={24} fontFamily="monospace" fill="#273043">{line}</text>)}
   <path d="M125 96l37-168" stroke="#dba84e" strokeWidth={12} strokeLinecap="round"/>
  </g>}
 </Scene>;
};

const RackAction: React.FC<DetailProps> = ({p,mode,section,speech,view='base'}) => {
 const tile=['tile','tile-dust','tile-dark','rack-top'].includes(mode);
 const print=mode==='rack-prints';
 const chase=mode==='theo-run';
 const drop=mode==='theo-drop';
 const ascending=mode==='theo-up';
 const practice=mode==='rack-practice';
 const climbing=ascending||mode==='theo-climb'||mode==='rack-return';
 const grabbing=mode==='theo-grab';
 const perch=mode==='theo-perch'||grabbing;
 const closed=mode==='rack-wait'||mode==='tile';
 const theoHere=drop||chase||practice||climbing||perch||['theo-box','theo-holds-bar','theo-leaves-bar','theo-close','confront','blanket'].includes(mode);
 const foodAction=['theo-box','theo-holds-bar','theo-leaves-bar'].includes(mode);
 const floor=foodAction||chase||mode==='confront';
 const danHere=!tile&&!print&&!drop;
 const baseFocus=tile?cam(2185,385,2.52):print?cam(2120,980,2.18):drop?cam(2095,650,1.42):climbing||perch||practice?cam(2060,885,1.43):
  mode==='theo-close'?cam(1825,1100,2.1):floor?cam(1470,1110,1.4):cam(1990,1070,1.55);
 const time=clock(p);
 const travel=Math.max(.6,Math.min(p.dur-.15,chase?1.9:ascending?2.1:3.2));
 const progress=ease(p.t/travel);
 const strideTime=Math.min(p.t,travel);
 const settle=ease((p.t-travel+.24)/.42);
 const jolt=grabbing?Math.sin(p.t*11)*Math.exp(-p.t*2.8):0;
 const theoX=chase?lerp(1785,1185,progress):practice||floor||mode==='theo-close'||mode==='blanket'?1800:2070+12*jolt;
 const theoY=drop?lerp(630,860,progress):ascending?lerp(1410,1010,progress):climbing?lerp(845,1400,progress)
  :perch?990+jolt*11:1445-(chase?10*Math.abs(Math.sin(strideTime*13.2))*(1-settle):0);
 const shelfPose=climbPose(POSES.lookUp,strideTime,ascending?1.25:.81);
 const perchPose:Pose={...POSES.pointUp,lean:8+13*jolt,head:-15+12*jolt,legF:[-22,-12],legN:[27,-18]};
 const foodPose=mode==='theo-holds-bar'?blendPose(POSES.crouch,{...POSES.crouch,armN:[45,137]},ease(p.t/.53)):POSES.crouch;
 const theoPose=chase?blendPose(runPose(strideTime),POSES.lookBack,settle):
  climbing||drop?blendPose(shelfPose,drop?perchPose:ascending?POSES.pointUp:POSES.standRelax,settle)
  :perch?perchPose:idlePose(foodAction?foodPose:POSES.standRelax,time);
 const hand=jointsOf(theoPose,theoX,theoY,535,-1).handN;
 const focus=view==='base'?baseFocus:view==='wide'?cam(1820,1050,1.2):
  view==='danny'?cam(practice?1980:1100,practice?880:1180,practice?1.9:2.05):
  view==='theo'?cam(theoX,theoY-250,2.1):
  tile?cam(2185,240,3.25):print?cam(2075,1100,2.8):
  perch?cam(theoX,theoY-240,2.2):foodAction?cam(hand[0],hand[1],2.4):mode==='theo-close'?cam(theoX-20,theoY-335,3.1):
  cam(2110,practice?1060:920,2.25);
 const reaching=blendPose(POSES.lookUp,POSES.pointUp,ease(p.t/.5));
 const dannyPose=mode==='rack-wait'?POSES.crouch:practice?climbPose(POSES.lookUp,strideTime,.7):grabbing?reaching:POSES.lookUp;
 return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.06}} p={p} filter={mode==='tile-dark'?'brightness(.37)':'brightness(.9)'}>
  <HoldGate frac={1} opacity={.7}/>
  <Rack tile t={p.t} open={!closed}/>
  {print&&[0,1,2].map(i=>footprint(1960+i*42,1240-i*230,-9,i))}
  {mode==='tile-dust'&&Array.from({length:8},(_,i)=><ellipse key={i} cx={2150+(i*29)%110} cy={305+((p.t*95+i*31)%460)} rx={3} ry={5} fill="#c9c6b3" opacity={.62}/>)}
  {danHere&&<Danny time={time} x={grabbing?lerp(1810,1885,ease(p.t/.55)):mode==='rack-wait'?1770:practice?1990:mode==='rack-return'?1820:chase?lerp(1100,1000,ease((p.t-.5)/.5)):1100}
   y={practice?lerp(1430,1180,progress):grabbing?1250:1480} h={655} pose={dannyPose} eyes="worried"/>}
  {theoHere&&<Theo x={theoX} y={theoY} h={535} pose={theoPose} face={-1} time={time} speech={speech} hurt={section>=12} bandaged={section>=13}/>}
  {foodAction&&<>
   <Box x={1530} y={1380} s={.8}/>
   <Bar x={mode==='theo-holds-bar'?hand[0]:1570} y={mode==='theo-holds-bar'?hand[1]:mode==='theo-leaves-bar'?lerp(hand[1],1300,clamp(p.t/.65)):1300} s={.8}/>
  </>}
  {mode==='blanket'&&<rect x={1820} y={1170} width={170} height={76} rx={30} fill="#777967" stroke={INK} strokeWidth={7}/>}
 </Scene>;
};

const StoreInsert: React.FC<DetailProps> = ({p,mode,section,view='base'}) => {
 const boots=mode==='trainer'||mode==='print-detail';
 const carrying=mode==='carry-test';
 const pack=mode==='pack'||carrying;
 const grip=jointsOf(POSES.holdUp,1070,1450,655).handN;
 const focus=view==='base'?(boots?cam(1490,1280,2.25):cam(1500,1140,1.6)):
  view==='wide'?cam(1450,1160,1.4):view==='danny'?cam(1070,1150,2.05):carrying?cam(1360,1170,2.15):cam(1490,1270,boots?3.3:2.75);
 return <Scene bg="sportsinside" a={focus} b={{...focus,z:focus.z+.075}} p={p} filter="brightness(.88)">
  {boots&&<g transform="translate(1490 1290) rotate(-12)">
   {mode==='trainer'?<>
    <path d="M-135 21L-133-30Q-91-48-70-26L-45 1l67 16q28 12 14 37H-133Z" fill="#434d53" stroke={INK} strokeWidth={8}/>
    <path d="M-131 45H33v21H-130Z" fill="#898983" stroke={INK} strokeWidth={6}/>
    {section<=6&&<path d="M-116-37L-78-35V65H-114Z" fill="#b6ad8d" opacity={.85}/>}
   </>:<>{footprint(0,-10,-30,0)}{footprint(125,70,-10,1)}</>}
  </g>}
  {pack&&<>
   <Guard x={1070} y={1450} h={655} pose={carrying?POSES.holdUp:POSES.crouch} propN={mode==='pack'?'flashlight':'none'} eyes="worried"/>
   <Jug x={carrying?grip[0]:1450} y={carrying?grip[1]+90:1380} s={.95} full={carrying}/><Jug x={1620} y={1395} s={.95} full={carrying}/>
   {mode==='pack'&&<path d="M1720 1390q150-130 190-40q20 60-165 60q-86 0-4-56" fill="none" stroke="#bb9a60" strokeWidth={12}/>}
  </>}
  {mode==='wrapped-key'&&<g transform="translate(1490 1190) rotate(-12)">
   <path d="M-76-127H65v141l96 24q49 20 34 65q-17 38-86 31l-156-39q-40-16-32-61Z" fill="#6f6b64" stroke={INK} strokeWidth={9}/>
   <path d="M-41-122v182l142 44" fill="none" stroke="#8a8376" strokeWidth={6}/>
   <circle cx={7} cy={-111} r={39} fill="none" stroke="#8c9192" strokeWidth={10}/>
  </g>}
  {(mode==='sweatshirt'||mode==='wrap-detail')&&<g transform="translate(1500 1290)">
   <rect x={-155} y={-90} width={310} height={150} rx={16} fill={mode==='sweatshirt'?'#628694':'#b9b3a1'} stroke={INK} strokeWidth={7}/>
   <path d="M-140 18H143M-60-81q60 66 120 0" fill="none" stroke="#3c515c" strokeWidth={6}/>
  </g>}
 </Scene>;
};

const Fitting: React.FC<DetailProps> = ({p,mode}) => (
 <Scene bg="deptstore" a={cam(1530,1030,1.25)} b={cam(1560,1020,1.34)} p={p} filter="brightness(.76) saturate(.75)">
  <path d="M1110 390H2180V1290H1110Z" fill="#3b4250" stroke={INK} strokeWidth={14}/>
  <path d="M1160 450H1560V1275H1160Z M1710 450H2125V1275H1710Z" fill="#495264" stroke={INK} strokeWidth={10}/>
  <path d="M1715 440H2115v712q-65-25-132 3q-72-25-138 0q-66-25-130 0Z" fill="#575069" stroke={INK} strokeWidth={7}/>
  <text x={1635} y={363} fontSize={40} textAnchor="middle" fontFamily="sans-serif" fill="#c6c3bc" fontWeight={700}>FITTING ROOMS</text>
  {mode==='fitting'&&<>
   <path d="M1200 1250H1525V1300H1200Z" fill="#796752" stroke={INK} strokeWidth={9}/>
   <Stick x={1350} y={1238} h={500} pose={POSES.sitChair} look={{...LOOKS.woman,shirt:'#5d5968'}} eyes="closed" back ghost/>
  </>}
 </Scene>
);

const HallBeat: React.FC<DetailProps> = ({p,mode}) => (
 <Scene bg="ch2-service-hall" a={cam(1730,885,1.2)} b={cam(1760,881,1.28)} p={p} filter="brightness(.79)">
  {mode==='service-crowd'&&Array.from({length:8},(_,i)=><Zed key={i} x={2010-i*124-Math.min(p.t*26,115)} y={1115+i*47} h={265+i*19} k={i} face={-1} dim={.75}/>)}
  {mode==='service-exit'&&[0,1,2].map(i=><Stick key={i} x={1530+i*145+Math.min(p.t*68,205)} y={1330-i*34} h={500-i*45} look={i===0?LOOKS.woman:LOOKS.teenB} pose={blendPose(POSES.walkA,POSES.walkB,.5+.5*Math.sin(p.t*9+i))} ghost back/>)}
 </Scene>
);

const InsertView:React.FC<{view:ShotView;origin?:string;children:React.ReactNode}>=({view,origin='50% 54%',children})=>
 <AbsoluteFill style={{overflow:'hidden'}}><AbsoluteFill style={{transform:`scale(${view==='detail'?1.38:1})`,transformOrigin:origin}}>{children}</AbsoluteFill></AbsoluteFill>;

export const Chapter2Scene:React.FC<DetailProps & {variant:number}>=props=>{
 const {p,mode,variant,section,view='base'}=props;
 if(['ceiling','fall','fall-detail','wrist-catch','collapse','rescue','rescue-recover','strap','crowd','marcus','marcus-detail','marcus-up','boot','boot-rest','cut','crawl-close','walkway','return','fountain-memory'].includes(mode))return <Ceiling {...props}/>;
 if(['pump','tank','ladder','gauge','pump-theo','pump-jugs','fill-jugs'].includes(mode))return <Pump {...props}/>;
 if(['pump-impact','pump-catch','pump-pickup'].includes(mode))return <PumpAction {...props}/>;
 if(mode==='dept-gate')return <Scene bg="deptstore" a={cam(1450,940,1.37)} b={cam(1485,922,1.44)} p={p} filter="brightness(.65) saturate(.8)">
  <Grille x0={790} y0={235} x1={2090} y1={1350} frac={1}/>
  <Guard x={1005} y={1510} h={650} pose={POSES.lookUp} back/>
 </Scene>;
 if(['cinema','door','door-open','cinema-memory','cinema-bedding'].includes(mode))return <Cinema {...props}/>;
 if(mode==='hall-marcus'||mode==='gate-shadow')return <GateBeat {...props}/>;
 if(['stock-box','stock-wait','stock-radio','box-detail','box-bait','receipt','theo-sleep'].includes(mode))return <Stockroom {...props}/>;
 if(['tile','tile-dust','tile-dark','rack-top','rack-prints','rack-wait','rack-practice','rack-return','theo-drop','theo-climb','theo-up','theo-box','theo-holds-bar','theo-leaves-bar','confront','theo-close','theo-run','theo-grab','theo-perch','blanket'].includes(mode))return <RackAction {...props}/>;
 if(['trainer','print-detail','carry-test','pack','wrapped-key','wrap-detail','sweatshirt'].includes(mode))return <StoreInsert {...props}/>;
 if(mode==='fitting'||mode==='fitting-empty')return <Fitting {...props}/>;
 if(['pump-door','service-crowd','service-exit'].includes(mode))return <HallBeat {...props}/>;
 if(mode==='office-memory')return <OfficeScene p={p} a={cam(1590,899,1.18)} b={cam(1630,881,1.27)} danny={{pose:POSES.radio,propN:'radio'}}/>;
 if(mode==='medicine')return <Scene bg="apartment" a={cam(1320,1090,2.1)} b={cam(1345,1095,2.2)} p={p} filter="brightness(.65)"><g transform="translate(1320 1180)"><rect x={-118} y={-67} width={236} height={134} rx={12} fill="#555d69" stroke={INK} strokeWidth={8}/><rect x={-83} y={-13} width={165} height={25} rx={8} fill="#d8d8ce"/><rect x={36} y={-14} width={48} height={28} rx={7} fill="#769da5"/></g></Scene>;
 if(mode==='drill-clock')return <AbsoluteFill><Drill {...props}/><Screen><Txt x={1510} y={198} size={60} fill={GOLD}>1:30 A.M.</Txt></Screen></AbsoluteFill>;
 if(mode==='b3-door')return <B3Door16 t={p.t} dur={p.dur} frame={p.frame}/>;
 if(mode==='key17')return <KeyInHand t={p.t} tag="17"/>;
 if(mode==='keys-plain')return <InsertView view={view}><KeyRing16 t={p.t} tag=""/></InsertView>;
 if(mode==='plan')return <InsertView view={view} origin="70% 50%"><Route p={p}/></InsertView>;
 if(mode==='drill')return <Drill {...props}/>;
 if(mode==='keys')return <InsertView view={view} origin="67% 64%"><KeyRing16 t={p.t} tagBig={section===14?.9:0} glowAt={section===14?.2:1e9}/></InsertView>;
 if(mode==='radio'||mode==='vera')return <InsertView view={view}><RadioCard t={p.t} frame={p.frame} state={mode==='vera'?'crackle':'off'} label={mode==='vera'?'VERA':'NO TRANSMISSION'}/></InsertView>;
 if(['roof','window','dark-window','window-count','signal','signal-count','roof-reply','roof-radio','roof-door','roof-lowered'].includes(mode))return <Roof {...props}/>;
 if(mode==='title'||mode==='end')return <AbsoluteFill style={{background:'#101924'}}>
 <World bg={mode==='end'?'parkview':'concourse'} cam={{...FULL,z:1.05+.025*Math.min(p.t,8)}} width={1920} height={1080} filter="brightness(.25) blur(5px)"/>
 <Screen><g opacity={clamp(p.t/.35)}><Txt x={960} y={280} size={86}>THE NIGHT GUARD</Txt><Txt x={960} y={410} size={52} fill="#cbd2dd">{mode==='end'?'NEXT · CHAPTER THREE':'CHAPTER TWO'}</Txt><Txt x={960} y={580} size={mode==='end'?148:100} fill={GOLD}>{mode==='end'?'THE PHARMACY':'THE BOY IN THE CEILING'}</Txt><Txt x={960} y={755} size={42} fill="#cbd2dd">{mode==='end'?"SUBSCRIBE TO FOLLOW DANNY’S STORY":'BOOK ONE · FORTY-TWO KEYS'}</Txt></g></Screen>
 </AbsoluteFill>;
 if(mode==='rewind')return <AbsoluteFill><Ceiling {...props} mode="fall"/><RewindFx t={p.t} frame={p.frame}/></AbsoluteFill>;
 return <Store {...props}/>;
};
