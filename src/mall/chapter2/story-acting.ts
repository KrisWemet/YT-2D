import {jointsOf, skeleton} from '../Stick';
import type {Pose} from '../Stick';
import {ease} from './motion';
import ch2 from './ch2.json';

export const storyCue = (phrase: string, section: number): number => {
 const tokens=phrase.toLowerCase().replace(/’/g,"'").match(/[a-z0-9]+(?:'[a-z]+)?/g)??[];
 const words=ch2.cwords.filter(w=>ch2.segments[w.seg].section===section)
  .flatMap(w=>(w.w.toLowerCase().replace(/’/g,"'").match(/[a-z0-9]+(?:'[a-z]+)?/g)??[]).map(token=>({token,time:w.s})));
 const i=words.findIndex((_,n)=>tokens.every((token,k)=>words[n+k]?.token===token));
 if(i<0)throw Error(`Missing character-action cue: ${section}: ${phrase}`);
 return words[i].time-.04;
};

export const STORY_CUES={
 chalk:storyCue('I spread it',4), bait:storyCue('I left a fresh bar',4),
 count:storyCue('I counted the water',3), lineUp:storyCue('I lined everything up',3),
 receipt:storyCue('Wrote the numbers',3), remember:storyCue('For a while I sat',3),
 water:storyCue('I reached for a bottle',6), tape:storyCue('Theo peeled',6),
 route:storyCue('He drew a route',7), column:storyCue('Down inside the big column',7),
 bandage:storyCue("We'd got back",13),
};

export const storyProgress=(time:number,start:number,duration:number)=>ease((time-start)/duration);

// Two-bone arm IK in the existing rig's local units. All props below use the
// resulting joint, so a camera cut cannot detach a tool from its owner's hand.
export const reachHand=(pose:Pose,x:number,y:number,h:number,face:1|-1,target:[number,number],arm:'N'|'F'='N'):Pose=>{
 const shoulder=skeleton(pose).shoulder,s=h/300;
 const dx=(target[0]-x)/(s*face)-shoulder[0],dy=(target[1]-y)/s-shoulder[1];
 const distance=Math.max(4.01,Math.min(99.95,Math.hypot(dx,dy))),direction=Math.atan2(dx,dy);
 const angle=direction-Math.acos(Math.max(-1,Math.min(1,(52*52+distance*distance-48*48)/(2*52*distance))));
 const tx=Math.sin(direction)*distance,ty=Math.cos(direction)*distance;
 const fore=Math.atan2(tx-52*Math.sin(angle),ty-52*Math.cos(angle));
 return {...pose,[arm==='N'?'armN':'armF']:[angle*180/Math.PI,fore*180/Math.PI]};
};

export const STORY_MODES=['inventory','receipt','chalk','box-bait','water','plan','bandage','vera','trainer','talk'] as const;
export const hasStoryAction=(mode:string,section:number,time:number)=>
 ['inventory','receipt','chalk','box-bait','water','plan'].includes(mode)
 ||mode==='bandage'&&section===13
 ||mode==='trainer'&&section===6
 ||mode==='vera'&&section>1
 ||mode==='talk'&&(time>=594&&time<618||time>=774&&time<810||time>=828&&time<835);

export const actionHand=(pose:Pose,x:number,y:number,h:number,face:1|-1=1)=>jointsOf(pose,x,y,h,face).handN;
