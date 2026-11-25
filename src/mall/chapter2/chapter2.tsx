import React from 'react';
import type {ShortData} from '../cues';
import {ChapterDef,CShot,FPS} from '../MallChapter';
import {Chapter2Scene} from './scenes';
import {STILL} from './motion';
import type {Speech} from './motion';
import {PICTURE_EDIT} from './picture-edit';
import type {PictureMode} from './picture-edit';
import {ADDITIONAL_VIEWS} from './additional-views';
import type {ShotView} from './additional-views';
import {ROOF_RECUT_END, ROOF_RECUT_START, RoofCutaways} from './roof-cutaways';
import ch2 from './ch2.json';

export const CHAPTER2_READY=ch2.timing==='recorded'&&ch2.voiceReady;
const tokens = (text: string) => text.toLowerCase().replace(/’/g, "'").match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? [];
const theoSpeech = ch2.cwords.filter(w => ch2.segments[w.seg].who === 'theo');
const theoAt = (time: number): Speech | undefined => {
 const word = theoSpeech.find(w => time >= w.s && time < w.e);
 if (!word) return;
 const elapsed = time - word.s;
 const progress = elapsed / Math.max(.075, word.e - word.s);
 return {open: Math.sin(Math.PI * progress) > .3 && Math.cos(elapsed * 18) > -.6,
  accent: Math.sin(Math.PI * Math.min(1, (time - ch2.segments[word.seg].s) / .8))};
};

const gateCues: Record<string, string> = {
 "Then I heard two pulls": "two pulls",
 "Outside, Marcus": "rattled",
 "I heard Marcus": "at another gate",
 "Marcus came around": "two pulls",
};
type PictureBeat = {
 start: number;
 mode: PictureMode | 'title' | 'end';
 section: number;
 speaker?: string;
 pulses: Record<string, number>;
 variant: number;
 view: ShotView;
 phrase: string;
};
const beats: PictureBeat[] = [];
for (const part of ch2.parts) {
 const plan = PICTURE_EDIT[part.n as keyof typeof PICTURE_EDIT];
 const words = ch2.cwords.flatMap(w => ch2.segments[w.seg].section === part.n
  ? tokens(w.w).map(token => ({token, time: w.s, speaker: ch2.segments[w.seg].who})) : []);
 let cursor = 0;
 let previousMode: string | undefined;
 let repeat=0;
 for (const [index, [phrase, mode]] of plan.entries()) {
  let start = part.n === 1 ? 0 : part.s - .08;
  let speaker: string | undefined;
  const pulses: Record<string, number> = {};
  if (phrase) {
   const match = tokens(phrase);
   const i = words.findIndex((_, n) => n >= cursor && match.every((token, k) => words[n + k]?.token === token));
   if (i < 0) throw new Error(`Missing picture cue in section ${part.n}: ${phrase}`);
   start = words[i].time - .04;
   speaker = words[i].speaker === 'theo' ? 'theo' : undefined;
   cursor = i + match.length;
   const gateCue = gateCues[phrase];
   if (gateCue) {
    const matchGate = tokens(gateCue);
    const rattle = words.findIndex((_, n) => n >= i && matchGate.every((token, k) => words[n + k]?.token === token));
    if (rattle >= 0) pulses.rattle = words[rattle].time - start;
   }
   if (mode === 'window-count' || mode === 'signal-count') {
    const count = words.findIndex((word, n) => n >= cursor && word.token === 'one'
     && words[n+1]?.token === 'two' && words[n+2]?.token === 'three');
    if (count < 0) throw new Error(`Missing three-flash cue: ${phrase}`);
    for (const [n, name] of ['one','two','three'].entries()) pulses[name] = words[count+n].time - start;
   }
  }
  repeat=mode===previousMode?repeat+1:0;
  previousMode=mode;
  const view:ShotView=repeat===0?'base':
   ['talk','tent','theo-perch','pump-theo'].includes(mode)?repeat%2?'theo':'wide':
   ['roof','roof-lowered'].includes(mode)?repeat%2?'danny':'wide':repeat%2?'detail':'wide';
  beats.push({start,mode,section:part.n,speaker,pulses,variant:index,view,phrase:phrase??part.title});
 }
 if (part.n === 1) beats.push({start:part.e+.15,mode:'title',section:1,pulses:{},variant:0,view:'base',phrase:'Chapter title'});
}
beats.push({start:ch2.duration,mode:'end',section:14,pulses:{},variant:0,view:'base',phrase:'End card'});

const additional=ADDITIONAL_VIEWS.map(cut=>{
 const words=ch2.cwords.filter(w=>ch2.segments[w.seg].section===cut.section)
  .flatMap(w=>tokens(w.w).map(token=>({token,time:w.s})));
 const match=tokens(cut.phrase);
 const i=words.findIndex((_,n)=>match.every((token,k)=>words[n+k]?.token===token));
 if(i<0)throw new Error(`Missing extra view in section ${cut.section}: ${cut.phrase}`);
 return {...cut,start:words[i].time-.04+(cut.after??0)};
});

export const CHAPTER2_PICTURE = beats.flatMap((beat,index)=>{
 const end=beats[index+1]?.start??ch2.duration+10;
 const added=additional.filter(c=>c.start>beat.start+.01&&c.start<end-.01);
 return [{...beat,actionStart:beat.start,actionEnd:end},...added.map(cut=>({
  ...beat,start:cut.start,mode:cut.mode??beat.mode,view:cut.view,phrase:cut.phrase,
  actionStart:cut.mode?cut.start:beat.start,actionEnd:end,
 }))];
}).sort((a,b)=>a.start-b.start);

const shots:CShot[]=CHAPTER2_PICTURE.map(beat=>({
 at:`=${beat.start}`,
 draw:p=>beat.section===2&&p.frame>=ROOF_RECUT_START*FPS&&p.frame<ROOF_RECUT_END*FPS
  ? <RoofCutaways frame={p.frame}/>
  : <Chapter2Scene p={{...p,t:p.frame/FPS-beat.actionStart,dur:beat.actionEnd-beat.actionStart,ev:beat.pulses}}
   mode={beat.mode} section={beat.section} speaker={beat.speaker} speech={STILL.on?undefined:theoAt(p.frame/FPS)}
   variant={beat.variant} view={beat.view}/>,
}));
const at=(text:string,section?:number)=>{
 const c=ch2.segments.find(s=>(section===undefined||s.section===section)&&s.text.toLowerCase().includes(text.toLowerCase()));
 if(!c)throw new Error(`Missing Chapter Two sound cue: ${text}`);
 const i=c.text.toLowerCase().indexOf(text.toLowerCase());
 // Per-chunk word alignment replaces this estimate after recording.
 const count=c.text.slice(0,i).trim().split(/\s+/).filter(Boolean).length;
 const words=ch2.cwords.filter(w=>w.seg===ch2.segments.indexOf(c));
 return words[Math.min(count,words.length-1)]?.s??c.s;
};
const hits:ChapterDef['hits']=[
 {file:'creak',at:at('edge of the hole'),db:-21},
 {file:'rattle',at:at('shakes it twice'),db:-21},
 {file:'rewind',at:at('Let me back up'),db:-12},
 {file:'slam',at:ch2.parts[0].e+.15,db:-17},
 {file:'static',at:ch2.parts[1].s+1,db:-22},
 {file:'lock',at:at('padlock was closed'),db:-25},
 {file:'rattle',at:at('two pulls on a gate'),db:-26},
 {file:'creak',at:at('plastic bend'),db:-28},
 {file:'rattle',at:at('Marcus rattled'),db:-24},
 {file:'creak',at:at('shelf knocked'),db:-21},
 {file:'keys',at:at('wrapped the keyring'),db:-26},
 {file:'lock',at:at('Key seventeen fit'),db:-21},
 {file:'rattle',at:at('gate rattled',9),db:-22},
 {file:'creak',at:at('metal under it folded'),db:-14},
 {file:'slam',at:at('leg punched'),db:-24},
 {file:'breath',at:at('Give me your hand'),db:-24},
 {file:'creak',at:at('fabric pull tight'),db:-23},
 {file:'slam',at:at('boot finally came loose')+1.5,db:-19},
 {file:'shuffle',at:at('shoe scraped'),db:-26},
 {file:'slam',at:at('Told them to keep drilling'),db:-22},
 {file:'crackle',at:at('Vera called near dusk'),db:-25},
 {file:'musicbox',at:at('Pick a tent',13),db:-29},
 {file:'slam',at:at('last red tag'),db:-24},
];
const beds:ChapterDef['beds']=[];
for(const p of ch2.parts){
 const roof=[2,14].includes(p.n),danger=[1,9,10].includes(p.n);
 beds.push({file:roof?'wind':danger?'groans':'mallhum',from:p.s,to:p.e,db:roof?-33:danger?-34:-37});
 if(danger)beds.push({file:'heartbeat',from:p.s,to:p.e,db:[[0,-35],[.65,-28],[1,-33]]});
 if([4,8,11,12,14].includes(p.n))beds.push({file:'drone',from:p.s,to:p.e,db:[[0,-38],[.8,-33],[1,-37]]});
}
export const CHAPTER2_DEF:ChapterDef={
 data:ch2 as unknown as ShortData,
 vo:CHAPTER2_READY?'mall/ch2/vo.mp3':'',
 shots,tags:ch2.parts.map(p=>({at:`=${Math.max(0,p.s-.1)}`,text:p.tag.toUpperCase()})),
 tail:10,radioNames:{vera:'VERA'},hits,beds,
};
