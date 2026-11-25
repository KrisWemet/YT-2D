import ch2 from './ch2.json';

const cue=(phrase:string,section:number)=>{
 const tokens=phrase.toLowerCase().match(/[a-z0-9]+/g)??[];
 const words=ch2.cwords.filter(w=>ch2.segments[w.seg].section===section);
 const index=words.findIndex((_,i)=>tokens.every((n,k)=>words[i+k]?.n===n));
 if(index<0)throw Error(`Missing continuity cue: ${phrase}`);
 return words[index].s-.04;
};
export const LADDER_APPROACH=cue('Somewhere ahead',10);
export const LADDER_START=cue('The maintenance ladder',11);
export const LADDER_DETAIL=cue('I put my good foot',11);
export const LADDER_END=cue('The tank took up',11);
export const CEILING_MIRROR_X=1900;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const k=clamp(x);return k*k*(3-2*k)};

// One source-clock descent survives every camera cut. Each actor steps clear before
// the next reaches the floor, so they never overlap on the bottom rung.
export const ladderState=(sourceTime:number)=>{
 const t=Math.max(0,sourceTime-LADDER_START);
 const dannyDown=clamp(t/9.4),theoDown=clamp((t-.45)/12.1);
 const dannyStep=ease((t-9.4)/2.1),theoStep=ease((t-12.55)/1.7);
 return {t,dannyDown,theoDown,dannyStep,theoStep,
  dannyX:310+450*dannyStep,dannyY:650+775*dannyDown,
  theoX:325+725*theoStep,theoY:355+1070*theoDown};
};
