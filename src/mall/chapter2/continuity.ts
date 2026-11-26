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
// Vera's fitting-room story and Danny's empty corridor share one slow push, so the room can
// dissolve from occupied to empty without the camera resetting.
export const FITTING_SPAN=[cue('I was trying on a coat',2),cue('What coat',2)] as const;
export const STRAP_CUE=cue('He was reaching for the strap',10);
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const k=clamp(x);return k*k*(3-2*k)};

// The crawl above the ceiling, on the same principle: positions come from the source clock, so a
// camera cut can never send Danny and Theo back to a starting mark. Movement follows the narration
// (stopping, single reaches on "Next hand ... I moved it", stillness while Marcus passes) and the
// court crossing ends on the marks the collapse uses (screen x 920 and 1320).
type Move = {from: number; to: number; dist: number};
const glide = (moves: Move[], t: number, period: number) => {
  let x = 0, step = 0, active = false;
  for (const m of moves) {
    if (t <= m.from) break;
    const dur = m.to - m.from, ramp = Math.min(.42, dur / 3), v = m.dist / (dur - ramp);
    const tau = Math.min(dur, t - m.from);
    x += tau < ramp ? v * tau * tau / (2 * ramp)
      : tau <= dur - ramp ? v * (ramp / 2 + tau - ramp)
      : m.dist - v * (dur - tau) ** 2 / (2 * ramp);
    if (t < m.to) {
      active = true;
      step = Math.sin((t - m.from) * 2 * Math.PI / period) * Math.min(1, tau / ramp, (dur - tau) / ramp);
    }
  }
  return {x, step, active};
};
const span = (from: number, to: number, speed: number): Move => ({from, to, dist: speed * (to - from)});
const reach = (from: number, dist = 14): Move => ({from, to: from + .8, dist});
// Danny follows Theo above the store; the gap stays as it was drawn.
const STORE = {start: 923.09, end: 940.82, danny: 520, gap: 490,
  moves: [span(923.3, 940.8, 10)]};
const COURT_DANNY = [span(969.6, 977.6, 11), span(978, 984.4, 11), span(1000, 1008.2, 8), reach(1025.3), reach(1027.6),
  span(1029.6, 1044, 11), reach(1069.5, 12)];
const COURT_THEO = [span(969.6, 977.6, 11), span(978, 984.4, 11), span(996.4, 998.8, 30), span(1029.6, 1044, 11),
  {from: 1068.1, to: 1068.9, dist: -58}];
const COURT = {start: 969.26, end: 1071.05, danny: 498, theo: 990};
// After the rescue they set off toward the ladder from where the haul left them (screen x of the
// recovered rescue staging: Danny 1900-883, Theo 1900-483), slowly, Danny in one boot.
const APPROACH = {start: LADDER_APPROACH, end: LADDER_START - .2, danny: 1017, theo: 1417};
const APPROACH_DANNY = [span(LADDER_APPROACH + .9, LADDER_START - .2, 7)];
const APPROACH_THEO = [span(LADDER_APPROACH + .5, LADDER_START - .2, 7)];

export const crawlState = (sourceTime: number) => {
  const sway = (k: number) => .12 * Math.sin(sourceTime * 1.7 + k);
  if (sourceTime >= STORE.start && sourceTime < STORE.end) {
    const g = glide(STORE.moves, sourceTime, 1.55);
    const step = g.active ? g.step : sway(0);
    return {dannyX: STORE.danny + g.x, theoX: STORE.danny + STORE.gap + g.x, dannyStep: step, theoStep: -step};
  }
  if (sourceTime >= COURT.start && sourceTime < COURT.end) {
    const d = glide(COURT_DANNY, sourceTime, 1.55), th = glide(COURT_THEO, sourceTime, 1.25);
    return {dannyX: COURT.danny + d.x, theoX: COURT.theo + th.x,
      dannyStep: d.active ? d.step : sway(0), theoStep: th.active ? -th.step : sway(2.1)};
  }
  if (sourceTime >= APPROACH.start && sourceTime < APPROACH.end) {
    const d = glide(APPROACH_DANNY, sourceTime, 1.7), th = glide(APPROACH_THEO, sourceTime, 1.5);
    return {dannyX: APPROACH.danny + d.x, theoX: APPROACH.theo + th.x,
      dannyStep: d.active ? d.step : sway(0), theoStep: th.active ? -th.step : sway(2.1)};
  }
  return undefined;
};
// The camera trails a crawler smoothly rather than stepping with every reach.
export const crawlFocus = (sourceTime: number, who: 'danny' | 'theo') => {
  let sum = 0;
  for (let k = 0; k < 9; k++) {
    const s = crawlState(Math.max(sourceTime - k * .5, sourceTime < COURT.start ? STORE.start : sourceTime < APPROACH.start ? COURT.start : APPROACH.start));
    sum += s ? (who === 'danny' ? s.dannyX : s.theoX) : 0;
  }
  return sum / 9;
};

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
