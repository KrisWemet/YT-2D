import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {useFont, FONT} from '../../thumbs/Thumbs';
import {PaintedChapter1Picture, paintedAssetPath} from './painted';
import edit from './four-shorts.json';
import original from './painted-edit.json';

export const FOUR_PAINTED_SHORTS = edit.parts;

// Deliberate portrait cameras. Two-person scenes and wide geography retain the
// full painting; solo portraits get a closer crop without losing their hands.
const FULL = new Set(['walt-handoff','office-knock','bus-stop','back-to-back','family-tower','lita-lily','roof-highway-day','roof-distance-day','road-dead','tower-day','tower-signal','blackout','monitor-invasion','cctv-attack','ramp-crowd','foodcourt-crowd','two-radios','reach-radio','fall-back-radio','dept-bed','garage-ramp','hall-turn','roof-radio-glow','glass-burst','fitting-rescue','garage-filled']);
const FOCUS: Record<string,number> = {
  'crown':.33,'b3-door':.34,'keys-hold':.40,'lily-lamp':.54,'marcus-book':.70,
  'ch2/v10/patrol-corridor':.35,'cleaner-cart':.38,'gate-row':.35,
  'marcus-hurt':.49,'marcus-seated':.40,'marcus-still':.48,'marcus-pleads':.50,
  'ch2/marcus-gate':.55,'ch2/gate-check':.43,'marcus-z-radio':.52,
  'hide-between-tents':.38,'danny-listen':.43,'huddled-radio':.43,
  'office-concern':.44,'ch2/v10/office-radio':.43,'phone-message':.62,
  'roof-flashlight':.38,'night-black':.29,'danny-relief':.33,'danny-watched':.68,
  'desk-radio':.61,'radio-bag':.52,'crowd-drift':.56,'hall-still':.62,
  'pharmacy':.36,'insulin-worry':.39,'gray-concourse':.36,
};

export const Chapter1FourShort: React.FC<{part:number}> = ({part}) => {
  useFont();
  const frame=useCurrentFrame(), plan=edit.parts[part-1];
  if(!plan) throw new Error(`Unknown painted Short ${part}`);
  const f=Math.min(frame,plan.storyFrames-1);
  const cut=plan.cuts.find(c=>f>=c.start&&f<c.start+c.frames)!;
  const source=cut.source+f-cut.start;
  const sourceAsset=original.shots.find(s=>source>=s.start&&source<s.start+s.frames)!.asset;
  const shot=plan.shots.find(s=>f>=s.start&&f<s.start+s.frames)!;
  const asset=shot.asset, full=FULL.has(asset), h=full?660:960, top=full?540:410;
  const scale=h/1080, focus=FOCUS[asset]??.5;
  const left=Math.min(0,Math.max(1080-1920*scale,540-focus*1920*scale));
  const t=f/30, caption=plan.captions.find(c=>t>=c.s&&t<c.e+.10);
  const ending=frame>=plan.storyFrames;
  const tag='tag' in cut&&f-cut.start<100?String(cut.tag):null;
  const speaker=caption?.words[0]?.kind==='radio' ? (caption.words[0].id==='broadcast'?'EMERGENCY BROADCAST':caption.words[0].id==='vera'?'UNKNOWN VOICE':'MARCUS · RADIO') : null;
  return <AbsoluteFill style={{background:'#07101c',color:'#f6f2e8',fontFamily:FONT,overflow:'hidden'}}>
    <Img src={staticFile(paintedAssetPath(asset))} style={{position:'absolute',inset:-40,width:1160,height:2000,objectFit:'cover',filter:'blur(28px) brightness(.28) saturate(.75)',opacity:.8}}/>
    <AbsoluteFill style={{background:'linear-gradient(180deg,#07101cdd 0%,transparent 38%,#07101c77 68%,#07101c 98%)'}}/>
    <div style={{position:'absolute',top:102,left:76,fontSize:32,fontWeight:800,letterSpacing:7,color:'#dcc078'}}>THE NIGHT GUARD</div>
    <div style={{position:'absolute',top:157,left:76,fontSize:28,fontWeight:600,letterSpacing:1,color:'#c5cdd9'}}>CHAPTER 1 · PART {part} OF 4</div>
    <div style={{position:'absolute',left:0,top,width:1080,height:h,overflow:'hidden',boxShadow:'0 20px 80px #0008'}}>
      <div style={{position:'absolute',left,top:0,width:1920,height:1080,transform:`scale(${scale})`,transformOrigin:'0 0'}}>
        {sourceAsset!==asset ? <Img src={staticFile(paintedAssetPath(asset))} style={{width:1920,height:1080,transform:`scale(${1.025+.02*(f-shot.start)/shot.frames})`}}/> : <PaintedChapter1Picture frame={source}/>}
      </div>
    </div>
    {frame<(part===3?plan.cuts[0].frames:150) && <div style={{position:'absolute',top:236,left:76,right:110,fontWeight:900,fontSize:part===4?66:76,lineHeight:1.07,whiteSpace:'pre-line',letterSpacing:-1.5,textShadow:'0 4px 15px #000',opacity:Math.min(1,((part===3?plan.cuts[0].frames:150)-frame)/10)}}>{plan.openingHook}</div>}
    {tag && <div style={{position:'absolute',top:325,left:76,fontWeight:800,fontSize:30,color:'#dcc078',letterSpacing:2}}>{tag}</div>}
    {speaker&&<div style={{position:'absolute',left:76,top:1395,fontWeight:800,fontSize:25,color:caption?.words[0].id==='vera'?'#f0b6d6':'#dcc078',letterSpacing:2}}>{speaker}</div>}
    {!ending&&caption&&<div style={{position:'absolute',top:1460,left:76,right:120,fontFamily:'DejaVu Sans, sans-serif',fontSize:58,fontWeight:850,lineHeight:1.18,textShadow:'0 4px 12px #000',whiteSpace:'pre-line'}}>
      {caption.text.split('\n').map((line,i)=>{
        const before=caption.text.split('\n').slice(0,i).join(' ').split(' ').filter(Boolean).length;
        return <div key={i}>{line.split(' ').map((word,j)=>{const w=caption.words[before+j];return <React.Fragment key={j}><span style={{color:w&&t>=w.s&&t<w.e?'#f4d174':'#fff8ed'}}>{word}</span>{' '}</React.Fragment>;})}</div>;
      })}
    </div>}
    <div style={{position:'absolute',left:76,right:120,top:1730,height:3,background:'#ffffff22'}}><div style={{height:'100%',width:`${Math.min(1,frame/plan.storyFrames)*100}%`,background:'#dcc078'}}/></div>
    {ending&&<AbsoluteFill style={{background:'#040c16d9',justifyContent:'center',padding:'0 85px 100px 76px'}}>
      <div style={{fontSize:30,fontWeight:800,letterSpacing:5,color:'#dcc078',marginBottom:40}}>THE NIGHT GUARD</div>
      <div style={{fontSize:part===2?76:92,fontWeight:900,lineHeight:1.08,whiteSpace:'pre-line',letterSpacing:-2}}>{plan.closingHook}</div>
      <div style={{fontSize:32,fontWeight:800,color:'#dcc078',marginTop:65,letterSpacing:1}}>{plan.nextLabel}</div>
    </AbsoluteFill>}
    <Audio src={staticFile(`mall/ch1/four-shorts-v1/part-${part}.m4a`)}/>
  </AbsoluteFill>;
};
