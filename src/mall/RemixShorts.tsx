import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import type {CWord} from './cues';
import {ChapterSfx} from './MallChapter';
import {Txt} from './Overlays';
import {Captions, VRadioBadge, VScreen} from './vertical';
import {CHAPTER1_DEF} from './chapter1/chapter1';
import {BigLines, CH, FPS, GOLD, INK, SEGS, ShotAt, WORDS} from './ChapterShorts';

/*
 * Remix Shorts: 2–3 minute vertical stories cut from Chapter 1 out of story order, for viewers
 * who have never seen the series. Each one opens on a moment from deep in the night (a cold open),
 * rewinds on tape to how it started, then jumps ahead to a cliffhanger. Same shots, voice and
 * sound as the chapter; everything the Shorts 7–14 fixes taught still holds (hook text from the
 * first frame, no end card, a question in the last seconds).
 *
 * A Short is a list of beats. A beat is a run of chapter lines (any lines, in any order; a gap
 * between two lines is a plain jump cut) at one moment of the story. A clock at the top always
 * says when that moment is. A beat that jumps in time starts with a tape transition: the last
 * picture rewinds (◀◀) or fast-forwards (▶▶) into the next one under a short label
 * ("THE NEXT MORNING"). The transition holds two pictures only, so nothing flashes.
 */

export type Beat = {
  lines: number[]; // chapter lines (segments of chapter1/ch1.json), in the order they play
  clock: string; // when this beat happens, shown at the top
  jump?: 'back' | 'ahead'; // tape transition into this beat
  rel?: string; // the transition's label
  trim?: number; // seconds of breath to cut before the beat's first word (measured on the voice track)
};
export type RemixDef = {id: string; title: string; beats: Beat[]; hook: string[]; question: string[]};

const VW = 1080;
const GAP = {back: 1.0, ahead: 0.8};
const TAIL = 0.35;
const db = (d: number) => 10 ** (d / 20);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// s/e: chapter start/end of the sound; at: where it starts in the Short; a/b: the chapter times
// the picture may show (see picBounds)
type Piece = {s: number; e: number; at: number; beat: number; a: number; b: number; lines: number[]};
type Jump = {at: number; len: number; kind: 'back' | 'ahead'; rel?: string; from: number; to: number};

// Consecutive chapter lines play as one piece; the timing rule is the one Shorts 7–14 use.
const runsOf = (lines: number[]) => {
  const runs: number[][] = [];
  for (const i of lines) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i);
    else runs.push([i]);
  }
  return runs;
};
const pieceTimes = (r: number[]): [number, number] => {
  const a = SEGS[r[0]];
  const b = SEGS[r[r.length - 1]];
  const next = SEGS[r[r.length - 1] + 1];
  return [Math.max(0, a.s - 0.12), Math.min(b.e + 0.3, next ? next.s - 0.05 : b.e + 0.3)];
};

// A line's sound starts before its first word (a breath, radio static), but its shot is cued on the
// word, so a piece's first frames would show the shot of whatever line comes before it in the
// chapter, and its last frames the next line's shot (or, after the last line, the chapter's end
// card). Only a piece's own shots are shown: the first one is held until it starts, and the
// picture stops before any shot cued after the piece's last word.
const shotIdx = (tc: number) => {
  const i = CH.shots.findIndex((sh) => tc >= sh.start && tc < sh.end);
  return i < 0 ? CH.shots.length - 1 : i;
};
const picBounds = (r: number[], s: number, e: number): [number, number] => {
  const first = WORDS.find((w) => w.seg === r[0]);
  const last = [...WORDS].reverse().find((w) => w.seg === r[r.length - 1]);
  let a = s;
  const i = shotIdx(s);
  const next = CH.shots[i + 1];
  if (first && next && CH.shots[i].start < s - 0.05 && next.start > s && next.start <= first.s + 0.6) a = next.start + 0.001;
  let b = e - 0.02;
  const after = last && CH.shots.find((sh) => sh.start > last.e + 0.01 && sh.start < b);
  if (after) b = after.start - 0.001;
  return [a, Math.max(a, b)];
};

export const layoutRemix = (def: RemixDef) => {
  const pieces: Piece[] = [];
  const jumps: Jump[] = [];
  const beats: {start: number; end: number}[] = [];
  let t = 0;
  def.beats.forEach((b, bi) => {
    const runs = runsOf(b.lines);
    const times = runs.map((r, k) => {
      const [s, e] = pieceTimes(r);
      return [k === 0 ? s + (b.trim ?? 0) : s, e];
    });
    if (bi > 0 && b.jump) {
      const len = GAP[b.jump];
      jumps.push({at: t, len, kind: b.jump, rel: b.rel, from: pieces[pieces.length - 1].b, to: picBounds(runs[0], times[0][0], times[0][1])[0]});
      t += len;
    }
    const start = t;
    runs.forEach((r, k) => {
      const [s, e] = times[k];
      const [a, pb] = picBounds(r, s, e);
      pieces.push({s, e, at: t, beat: bi, a, b: pb, lines: r});
      t += e - s;
    });
    beats.push({start, end: t});
  });
  return {pieces, jumps, beats, total: t};
};

export const remixFrames = (def: RemixDef) => Math.round((layoutRemix(def).total + TAIL) * FPS);

// When we are: series name, and the beat's clock in a pill that pops when the clock changes.
const ClockPill: React.FC<{text: string; o: number; pop: number}> = ({text, o, pop}) => {
  const size = 34;
  const w = text.length * size * 0.74 + 84;
  return (
    <g opacity={o}>
      <Txt x={VW / 2} y={200} size={44} fill={GOLD}>
        THE NIGHT GUARD
      </Txt>
      <g transform={`translate(${VW / 2}, 262) scale(${pop})`}>
        <rect x={-w / 2} y={-33} width={w} height={66} rx={33} fill="#0f1218" opacity={0.86} stroke={INK} strokeWidth={5} />
        <text x={0} y={12} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={size} fill="#eef1f6" letterSpacing="0.06em">
          {text}
        </text>
      </g>
    </g>
  );
};

// Tape transition overlay: tracking lines, a rolling band and the ◀◀ / ▶▶ symbol.
const TapeFx: React.FC<{kind: 'back' | 'ahead'; u: number; frame: number}> = ({kind, u, frame}) => {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const y = (random(`tape${i}-${Math.floor(frame / 2)}`) * 1920) | 0;
    lines.push(<rect key={i} x={0} y={y} width={VW} height={4 + (i % 3) * 4} fill="#ffffff" opacity={0.2} />);
  }
  const band = ((kind === 'back' ? 1 - u : u) * 2400) - 240;
  const k = interpolate(u, [0, 0.12, 0.3], [0.6, 1.08, 1], clamp);
  const arrow = kind === 'back' ? 'M 60 -46 L 0 0 L 60 46 Z M 124 -46 L 64 0 L 124 46 Z' : 'M 0 -46 L 60 0 L 0 46 Z M 64 -46 L 124 0 L 64 46 Z';
  return (
    <VScreen>
      {lines}
      <rect x={0} y={band} width={VW} height={110} fill="#ffffff" opacity={0.08} />
      <g transform={`translate(${VW / 2}, 860) scale(${1.5 * k}) translate(-62, 0)`} opacity={Math.floor(u * 8) % 2 === 0 ? 1 : 0.75}>
        <path d={arrow} fill="#ffffff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>
    </VScreen>
  );
};

export const makeRemixShort = (def: RemixDef): React.FC => {
  const {pieces, jumps, beats, total} = layoutRemix(def);
  // the chapter's words, moved onto the Short's timeline: every word of the lines a piece plays
  // (a word timed a hair before the cut is still heard, so it keeps its caption)
  const words: CWord[] = [];
  for (const p of pieces) {
    for (const w of WORDS) {
      if (!p.lines.includes(w.seg) || w.s >= p.e - 0.02) continue;
      const s = Math.max(w.s, p.s);
      const e = Math.min(Math.max(w.e, s + 0.05), p.e);
      words.push({...w, s: s - p.s + p.at, e: e - p.s + p.at});
    }
  }
  const w12 = words.length ? words[Math.min(words.length - 1, 12)].e : 3;
  const hookUntil = Math.max(3.2, Math.min(4.6, w12 + 0.4, beats[0].end - 0.05));
  // the question comes up over the last line, never over a tape transition
  const lastJump = jumps[jumps.length - 1];
  const qFrom = Math.max(total - 3.4, lastJump ? lastJump.at + lastJump.len + 0.1 : 0);

  const Remix: React.FC = () => {
    useFont();
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const jump = jumps.find((j) => t >= j.at && t < j.at + j.len);
    let tc: number;
    let beat: number;
    let look = 0; // 0 = the picture as it is, 1 = the full tape look
    if (jump) {
      const u = (t - jump.at) / jump.len;
      tc = u < 0.5 ? jump.from : jump.to;
      look = u < 0.5 ? interpolate(u, [0, 0.14], [0, 1], clamp) : interpolate(u, [0.5, 1], [1, 0], clamp);
      beat = beats.findIndex((b) => b.start >= jump.at + jump.len - 0.001);
    } else {
      const p = pieces.find((x) => t < x.at + (x.e - x.s)) ?? pieces[pieces.length - 1];
      tc = Math.min(p.b, Math.max(p.a, p.s + (t - p.at)));
      beat = p.beat;
    }
    const hookO = interpolate(t, [0, hookUntil - 0.25, hookUntil], [1, 1, 0], clamp);
    const qO = interpolate(t, [qFrom, qFrom + 0.3], [0, 1], clamp);
    const b = beats[beat];
    const intoBeat = t - b.start;
    // the pill fades out just before a tape transition; at a plain cut it changes in place and pops
    const endFade = def.beats[beat + 1]?.jump ? interpolate(b.end - t, [0, 0.12], [0, 1], clamp) : 1;
    const pillO = jump
      ? 0
      : Math.min(interpolate(t, [hookUntil, hookUntil + 0.25], [0, 1], clamp), interpolate(t, [qFrom - 0.2, qFrom], [1, 0], clamp), endFade);
    const pop = beat > 0 ? interpolate(intoBeat, [0, 0.12, 0.28], [1.3, 0.94, 1], clamp) : 1;
    // the transition's label stays a moment into the new beat, so it can be read
    const lab = jumps.find((j) => j.rel && t >= j.at && t < j.at + j.len + 0.6);
    const labO = lab ? interpolate(t - lab.at, [0, 0.15, lab.len + 0.25, lab.len + 0.6], [0, 1, 1, 0], clamp) : 0;
    const radio = jump ? undefined : CH.cues.segments.find((g) => g.kind === 'radio' && tc >= g.s - 0.05 && tc <= g.e + 0.1);
    const radioName = radio ? CHAPTER1_DEF.radioNames[radio.id ?? ''] ?? 'RADIO' : '';
    const shake = jump ? (random(`shake-${Math.floor(frame / 2)}`) - 0.5) * 26 * look : 0;
    return (
      <AbsoluteFill style={{background: '#07080b', overflow: 'hidden'}}>
        <Img src={staticFile('mall/bg/concourse.jpg')} style={{position: 'absolute', left: -400, top: 0, height: 1920, width: 'auto', filter: 'blur(28px) brightness(0.3) saturate(0.7)'}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: look ? `translateX(${shake}px) scaleX(${1 + 0.03 * look})` : undefined,
            filter: look ? `grayscale(${0.9 * look}) brightness(${1 - 0.3 * look}) contrast(${1 + 0.15 * look})` : undefined,
          }}
        >
          <ShotAt tc={tc} />
        </div>
        {/* shade the top and bottom so the hook, clock and captions read over any picture */}
        <AbsoluteFill style={{background: 'linear-gradient(#03060de6 0%, #03060d99 16%, transparent 30%, transparent 66%, #03060d99 78%, #03060de6 100%)'}} />
        {pieces.map((p, k) => (
          <Sequence key={k} from={Math.round(p.at * FPS)} durationInFrames={Math.round((p.e - p.s) * FPS)} layout="none">
            <Sequence from={-Math.round(p.s * FPS)} layout="none">
              <Audio src={staticFile(CHAPTER1_DEF.vo)} />
              <ChapterSfx r={CH} />
            </Sequence>
          </Sequence>
        ))}
        {jumps.map((j, k) => {
          const len = Math.round(j.len * FPS) + 3;
          return (
            <Sequence key={`j${k}`} from={Math.round(j.at * FPS)} durationInFrames={len} layout="none">
              <Audio src={staticFile('mall/sfx/rewind.mp3')} playbackRate={j.kind === 'ahead' ? 1.2 : 1} volume={(f) => db(-9) * Math.min(1, (len - f) / 6)} />
            </Sequence>
          );
        })}
        {jump && <TapeFx kind={jump.kind} u={(t - jump.at) / jump.len} frame={frame} />}
        <VScreen>
          <BigLines lines={def.hook} o={hookO} y={300} />
          <ClockPill text={def.beats[beat].clock} o={pillO} pop={pop} />
          {lab && labO > 0 && (
            <g opacity={labO} transform={`translate(${VW / 2}, 1040)`}>
              <rect x={-(lab.rel!.length * 64 * 0.62 + 90) / 2} y={-62} width={lab.rel!.length * 64 * 0.62 + 90} height={104} rx={26} fill="#0f1218" opacity={0.88} stroke={INK} strokeWidth={6} />
              <Txt x={0} y={12} size={64} fill={GOLD}>
                {lab.rel}
              </Txt>
            </g>
          )}
          <BigLines lines={def.question} o={qO} y={300} />
          {radioName && <VRadioBadge name={radioName} t={t} y={1330} color={radioName === 'MARCUS' ? '#8fd18a' : radioName === 'EMERGENCY ALERT' ? '#f0c53c' : '#e58fb4'} />}
          {!jump && <Captions words={words} t={t} y={1560} />}
          {qO > 0 && (
            <text x={VW / 2} y={1780} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill="#e3e8f2" opacity={qO} stroke={INK} strokeWidth={6} paintOrder="stroke" letterSpacing="0.08em">
              TELL ME IN THE COMMENTS
            </text>
          )}
        </VScreen>
      </AbsoluteFill>
    );
  };
  return Remix;
};

// Chapter 1 remixes, in posting order (no two neighbours share a line). Line numbers are the
// segments of chapter1/ch1.json (0 = "Right now there's a zombie…", 188 = "Who's in the window?");
// clocks follow the chapter's own where-and-when tags.
export const CH1_REMIXES: RemixDef[] = [
  {
    id: 'Ch1Remix1',
    title: 'I had the key',
    hook: ['I HAD THE KEY.', "I DIDN'T OPEN", 'THE GATE.'],
    beats: [
      {lines: [97, 98], clock: '2:39 A.M.'},
      {lines: [21, 22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34], clock: '1:00 A.M.', jump: 'back', rel: 'EARLIER THAT NIGHT'},
      {lines: [63, 65, 72, 73, 74, 75, 76, 77, 78, 79], clock: '1:48 A.M.', jump: 'ahead', rel: '8 MINUTES LATER'},
      {lines: [80, 81, 82, 83, 85, 86, 87, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98], clock: '2:00 A.M.'},
      {lines: [137, 138, 139, 140], clock: 'DAY 1 · 6:40 A.M.', jump: 'ahead', rel: 'THE NEXT MORNING'},
    ],
    question: ['WOULD YOU HAVE', 'OPENED THE GATE?'],
  },
  {
    id: 'Ch1Remix2',
    title: 'Ten days',
    hook: ["I'M LOCKED IN A MALL.", 'MY FAMILY IS ACROSS', 'THE HIGHWAY.'],
    beats: [
      {lines: [160], clock: 'DAY 1 OF 30'},
      {lines: [38, 39, 40, 44, 11, 45], clock: '1:41 A.M.', jump: 'back', rel: 'THE NIGHT BEFORE'},
      {lines: [145, 146, 147, 149, 150], clock: 'DAY 1 · 6:40 A.M.', jump: 'ahead', rel: 'THE NEXT MORNING'},
      {lines: [151, 152, 153, 154, 155, 156, 157, 158, 159, 160], clock: 'DAY 1 OF 30'},
      {lines: [170, 171, 172, 173], clock: 'DAY 1 · 3:00 P.M.', jump: 'ahead', rel: 'THAT AFTERNOON'},
    ],
    question: ['WHAT WOULD', 'YOU DO?'],
  },
  {
    id: 'Ch1Remix3',
    title: "It isn't a zombie",
    hook: ['THE MOST DANGEROUS', 'THING IN MY MALL', "ISN'T A ZOMBIE."],
    beats: [
      {lines: [120], clock: '3:05 A.M.'},
      {lines: [0, 1, 2, 101, 102, 103, 104, 105, 106, 107, 108, 109], clock: '2:45 A.M.', jump: 'back', rel: '20 MINUTES EARLIER'},
      {lines: [110, 111, 112, 113, 114, 115, 116, 117], clock: '2:46 A.M.'},
      {lines: [118, 119, 120, 121, 122, 123, 124, 125, 126, 128, 129, 130, 131], clock: '3:05 A.M.'},
      {lines: [5, 16, 17, 18, 20], clock: '9:00 P.M.', jump: 'back', rel: 'THE NIGHT IT STARTED'},
      {lines: [123], clock: '3:05 A.M.', jump: 'ahead'},
    ],
    question: ['WHAT DO YOU THINK', 'B3 OPENS?'],
  },
  {
    id: 'Ch1Remix4',
    title: "Who's in the window",
    hook: ['EVERY NIGHT AT 9,', 'MY DAUGHTER BLINKS', '"I LOVE YOU" TO ME.'],
    beats: [
      {lines: [175, 177, 178, 179], clock: 'DAY 1 · 9:00 P.M.'},
      {lines: [12, 13, 14, 15], clock: 'NIGHT 1 · 9:00 P.M.', jump: 'back', rel: 'THE NIGHT BEFORE', trim: 0.7},
      {lines: [135, 145, 146, 147, 149, 150], clock: 'DAY 1 · 6:40 A.M.', jump: 'ahead', rel: 'THE NEXT MORNING'},
      {lines: [163, 165, 169, 170, 171, 172, 173, 174], clock: 'DAY 1 · 3:00 P.M.', jump: 'ahead', rel: 'THAT AFTERNOON'},
      {lines: [175], clock: 'DAY 1 · 8:59 P.M.'},
      {lines: [180, 181, 182, 183, 184, 185, 186, 187, 188], clock: 'DAY 1 · 9:00 P.M.'},
    ],
    question: ['WHO IS THE WOMAN', 'ON THE RADIO?'],
  },
  {
    id: 'Ch1Remix5',
    title: 'Four minutes',
    hook: ['THE DEAD ARE COMING.', 'I HAVE 4 MINUTES', 'TO PICK A STORE.'],
    beats: [
      {lines: [51], clock: '1:44 A.M.'},
      {lines: [29, 30, 31, 32, 33, 34], clock: '1:40 A.M.', jump: 'back', rel: '4 MINUTES EARLIER'},
      {lines: [38, 39, 40, 42, 46, 47, 49], clock: '1:41 A.M.'},
      {lines: [50, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62], clock: '1:44 A.M.'},
      {lines: [63, 64, 65, 66, 68, 70, 72, 73, 74, 75, 76, 77, 78, 79], clock: '1:48 A.M.'},
    ],
    question: ['WHICH STORE', 'WOULD YOU PICK?'],
  },
  {
    id: 'Ch1Remix6',
    title: 'Still at work',
    hook: ['THE DEAD IN MY MALL', 'STILL SHOW UP', 'FOR WORK.'],
    beats: [
      {lines: [141], clock: 'DAY 1 · 6:40 A.M.'},
      {lines: [0, 1, 2, 101, 102, 104, 105, 106, 107, 108], clock: '2:45 A.M.', jump: 'back', rel: 'THE NIGHT BEFORE'},
      {lines: [110, 111, 112, 114, 115, 116, 117], clock: '2:46 A.M.'},
      {lines: [132, 133, 134, 135, 137, 138, 139, 140, 141, 142, 143, 145], clock: 'DAY 1 · 6:40 A.M.', jump: 'ahead', rel: 'THE NEXT MORNING'},
    ],
    question: ['WHAT DO YOU', 'THINK IT SAYS?'],
  },
];
