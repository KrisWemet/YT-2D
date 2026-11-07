import React from 'react';
import type {ShortData} from '../cues';
import {ChapterDef,CShot,FPS} from '../MallChapter';
import {Chapter2Scene,Mode} from './scenes';
import {ROOF_RECUT_END, ROOF_RECUT_START, RoofCutaways} from './roof-cutaways';
import type {P} from '../shots';
import ch2 from './ch2.json';

export const CHAPTER2_READY=ch2.timing==='recorded'&&ch2.voiceReady;
type Chunk=(typeof ch2.segments)[number];
const modeFor=(c:Chunk):Mode=>{
 const t=c.text.toLowerCase(),n=c.section;
 if(t.includes('let me back up'))return 'rewind';
 if(c.who==='vera')return 'vera';
 if(n===1){if(/faces|woman with|cleaner/.test(t))return 'crowd';if(/empty clip|and marcus|he comes/.test(t))return 'marcus';if(/theo|kid i nearly/.test(t))return 'rescue';return 'fall';}
 if(n===2){if(/phone|radio|button|volume|speaker/.test(t))return 'radio';if(/window|blinked|highway/.test(t))return 'window';return 'roof';}
 if(n===3){if(/padlock|key thirty/.test(t))return 'lock';if(/roof|nine|blinks|flashlight/.test(t))return 'window';if(/slept|sleep|sleeping/.test(t))return 'sleep';return 'food';}
 if(n===4){if(/pipe|shelf|tile|up once|above/.test(t))return 'rack';if(/trail|footprint|trainer|print|square of/.test(t))return 'prints';return 'chalk';}
 if(n===5){if(/tile lifted|fingers appeared|lowering|rack|shelf/.test(t))return 'theo';if(/shadow|dragged|hallway/.test(t))return 'lock';return 'talk';}
 if(n===6){if(/elevator|song|sing/.test(t))return 'theo';if(/ceiling|projection|cinema/.test(t))return 'cinema';if(/bottle|ten days|gallons|ones left/.test(t))return 'water';return 'talk';}
 if(n===7){if(/eight thousand|fountain|tank/.test(t))return 'tank';if(/route|ladder|pump.room|above the cinema/.test(t))return 'plan';if(/roof|blinked|insulin|highway/.test(t))return 'window';if(/container|carry|bottles|water/.test(t))return 'water';return 'talk';}
 if(n===8){if(/radio|battery/.test(t))return 'radio';if(/many|every night|annoying|keys/.test(t))return 'keys';if(/key seventeen|lock turn|climbing around/.test(t))return 'door';if(/walkway|heads|proper walkway|floor is/.test(t))return 'ceiling';if(/blanket|photograph|hoodie|cinema|bed/.test(t))return 'cinema';return 'ceiling';}
 if(n===9){if(/folded|dropped|leg punched|pieces fell|head turned|caught my wrist|foot|boot/.test(t))return 'fall';if(/marcus|rattled|next one|who it was/.test(t))return 'marcus';if(/hundred|fountain|shoulder to shoulder/.test(t))return 'crowd';return 'ceiling';}
 if(n===10){if(/boot finally|landed inside/.test(t))return 'boot';if(/trouser|blood|brace|shoe|water dripped/.test(t))return 'cut';if(/elbow|strap|knee slid|palms|breathing/.test(t))return 'rescue';return 'fall';}
 if(n===11){if(/drill|three of them|one.thirty|first night|cutting|chainsaw|keep drilling/.test(t))return 'drill';if(/tank|thousand|glass|hand against/.test(t))return 'tank';return 'pump';}
 if(n===12){if(/drill|same voice|right below|they saw|one of the men|machine|kept saying/.test(t))return 'drill';if(/roof|nine|lights from lily/.test(t))return 'window';if(/first.aid|cut|bucket|bandage/.test(t))return 'bandage';if(/boot|marcus|return trip|containers|blanket|cinema/.test(t))return 'ceiling';if(/back to summit|padlock|gate|lock/.test(t))return 'store';return 'pump';}
 if(n===13){if(/bandage|cut|leg|wrapper|scrape/.test(t))return 'bandage';if(/radio|button|vera called/.test(t))return 'radio';if(/flashlight|five to nine|see\?/.test(t))return 'roof';return 'tent';}
 if(n===14){if(/b3|keys|last red|tag|walt|last key|hanging from/.test(t))return 'keys';if(/department store roof|right|stranger|pointed|somebody else|woman copying/.test(t))return 'signal';if(/window|nine|one\. two|answered|highway/.test(t))return 'window';return 'roof';}
 return 'store';
};

const shots:CShot[]=[];
for(let i=0;i<ch2.segments.length;i++){
 const c=ch2.segments[i];const mode=modeFor(c);const start=Math.max(0,c.s-.08);
 const draw = (p: P, variant: number) => c.section === 2 && p.frame >= ROOF_RECUT_START * FPS && p.frame < ROOF_RECUT_END * FPS
  ? <RoofCutaways frame={p.frame} />
  : <Chapter2Scene p={p} mode={mode} section={c.section} speaker={c.who} variant={variant}/>;
 shots.push({at:i===0?'0':`=${start}`,draw:p=>draw(p,i)});
 // A second angle keeps extended narration moving, anchored to the recorded chunk.
 if(c.e-c.s>12){
  const mid=(c.s+c.e)/2;
  shots.push({at:`=${mid}`,draw:p=>draw(p,i+1)});
 }
 if(c.section===1&&(i===ch2.segments.length-1||ch2.segments[i+1].section!==1)){
  shots.push({at:`=${c.e+.15}`,draw:p=><Chapter2Scene p={p} mode="title" section={1} variant={0}/>});
 }
}
shots.push({at:`=${ch2.duration}`,draw:p=><Chapter2Scene p={p} mode="end" section={14} variant={0}/>});
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
