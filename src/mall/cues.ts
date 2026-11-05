// Cue resolution for any voice track (the pilot's timing.ts does the same for its one track).
// Cues match the script's own words ("cwords", see images/mall/caption_words.py), so a word the
// transcriber misheard still cues correctly.

export type CWord = {w: string; n: string; s: number; e: number; seg: number; kind: string; id?: string | null};
export type Seg = {kind: string; id?: string; s: number; e: number; text: string};
export type ShortData = {duration: number; segments: Seg[]; cwords: CWord[]};

const norm = (x: string) => x.toLowerCase().replace(/-/g, '').replace(/[^a-z0-9']/g, '');
const LEAD = 0.12; // cut a touch before the word lands

export const makeCues = (data: ShortData) => {
  const W = data.cwords;
  const idxAt = (time: number) => {
    const i = W.findIndex((w) => w.s >= time - 0.05);
    return i < 0 ? W.length : i;
  };
  const findIdx = (phrase: string, from: number): number => {
    const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
    for (let i = from; i < W.length; i++) {
      if (toks.every((tk, j) => W[i + j] && norm(W[i + j].w) === tk)) return i;
    }
    throw new Error(`cue not found after word ${from}: "${phrase}"`);
  };
  /*
   * Cue syntax (same as the pilot):
   *   "some words"   cut just before these words      ">some words"  cut in the pause after them
   *   ">+some words" cut right after they end          "=12.5"        absolute seconds
   *   "@id"          start of a radio line (segment id) "#3"           start of segment 3
   *   "0"            the very start
   */
  const resolveCue = (cue: string, fromTime: number): number => {
    if (cue === '0') return 0;
    if (cue.startsWith('=')) return Number(cue.slice(1));
    if (cue.startsWith('#')) return Math.max(0, data.segments[Number(cue.slice(1))].s - 0.1);
    if (cue.startsWith('@')) {
      const g = data.segments.find((x) => x.id === cue.slice(1));
      if (!g) throw new Error(`no segment ${cue}`);
      return Math.max(0, g.s - 0.1);
    }
    const right = cue.startsWith('>+');
    const after = right || cue.startsWith('>');
    const phrase = right ? cue.slice(2) : after ? cue.slice(1) : cue;
    const i = findIdx(phrase, idxAt(fromTime));
    if (!after) return Math.max(0, W[i].s - LEAD);
    const last = i + phrase.split(/\s+/).filter(Boolean).length - 1;
    const next = W[last + 1];
    if (right) return W[last].e + 0.15;
    return next ? (W[last].e + next.s) / 2 : W[last].e + 0.3;
  };
  const wordTime = (phrase: string, fromTime: number) => W[findIdx(phrase, idxAt(fromTime))].s;
  const wordEnd = (phrase: string, fromTime: number) => {
    const i = findIdx(phrase, idxAt(fromTime));
    return W[i + phrase.split(/\s+/).filter(Boolean).length - 1].e;
  };
  return {words: W, segments: data.segments, duration: data.duration, resolveCue, wordTime, wordEnd};
};
export type Cues = ReturnType<typeof makeCues>;
