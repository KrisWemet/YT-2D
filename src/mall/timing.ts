import data from './words.json';

export const FPS = 30;
export const TAIL = 4.5; // hold the end card after the last word
export const DUR = data.duration + TAIL;

type Word = {w: string; s: number; e: number; g: string; n: string};
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9']/g, '');
const WORDS: Word[] = data.words.map((w) => ({...w, n: norm(w.w)}));
export const SEGMENTS = data.segments as {kind: string; id?: string; s: number; e: number; text: string}[];

const LEAD = 0.12; // cut a touch before the word lands

// Index of the first word of `phrase` at or after word index `from`.
const findIdx = (phrase: string, from: number): number => {
  const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
  for (let i = from; i < WORDS.length; i++) {
    if (toks.every((tk, j) => WORDS[i + j] && WORDS[i + j].n === tk)) return i;
  }
  throw new Error(`cue not found after word ${from}: "${phrase}"`);
};
const idxAt = (time: number) => {
  const i = WORDS.findIndex((w) => w.s >= time - 0.05);
  return i < 0 ? WORDS.length : i;
};

/*
 * Cue syntax:
 *   "some words"   cut just before these words are spoken
 *   ">some words"  cut in the pause after these words
 *   ">+some words" cut right after these words end
 *   "=61.5"        an absolute time in seconds
 *   "@id"          start of a radio line (segment id)
 *   "0"            the very start
 */
export const resolveCue = (cue: string, fromTime: number): number => {
  if (cue === '0') return 0;
  if (cue.startsWith('=')) return Number(cue.slice(1)); // an absolute time in seconds
  if (cue.startsWith('@')) {
    const g = SEGMENTS.find((x) => x.id === cue.slice(1));
    if (!g) throw new Error(`no segment ${cue}`);
    return g.s - 0.1;
  }
  const right = cue.startsWith('>+'); // cut right after the phrase ends
  const after = right || cue.startsWith('>');
  const phrase = right ? cue.slice(2) : after ? cue.slice(1) : cue;
  const i = findIdx(phrase, idxAt(fromTime));
  if (!after) return Math.max(0, WORDS[i].s - LEAD);
  const last = i + phrase.split(/\s+/).filter(Boolean).length - 1;
  const next = WORDS[last + 1];
  if (right) return WORDS[last].e + 0.15;
  return next ? (WORDS[last].e + next.s) / 2 : WORDS[last].e + 0.3;
};

// Absolute time a phrase starts, searching from a time.
export const wordTime = (phrase: string, fromTime: number) => WORDS[findIdx(phrase, idxAt(fromTime))].s;
// Absolute time a phrase ends.
export const wordEnd = (phrase: string, fromTime: number) => {
  const i = findIdx(phrase, idxAt(fromTime));
  return WORDS[i + phrase.split(/\s+/).filter(Boolean).length - 1].e;
};
export const segment = (id: string) => SEGMENTS.find((x) => x.id === id)!;
// wordTime that returns null instead of throwing (for cues a script may not have)
export const maybeWordTime = (phrase: string, fromTime: number): number | null => {
  try {
    return wordTime(phrase, fromTime);
  } catch {
    return null;
  }
};
