import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import type {CWord} from './cues';
import {makeChapter} from './MallChapter';
import {Txt} from './Overlays';
import {Captions, VScreen} from './vertical';
import {CHAPTER1_DEF} from './chapter1/chapter1';
import ch1 from './chapter1/ch1.json';

/*
 * Vertical Shorts cut straight from a finished chapter (16:9 picture in the middle of a 9:16 frame).
 * Built from the first vidIQ read of the channel (Nov 10):
 *  - the hook is big on-screen text from the very first frame (40% of viewers scrolled past early);
 *  - slow backstory lines are cut out, so the second line keeps the tension (the big drop was 6–17 s);
 *  - no end card: each Short ends on its cliff line and loops (the end card lost a third of viewers);
 *  - the last seconds ask a question people can answer in the comments (comments were 0–2).
 */

export const FPS = 30;
const VW = 1080;
const VH = 1920;
const PIC_W = 1300; // the 16:9 picture, a little wider than the frame (about 6% cropped off each side)
const PIC_H = (PIC_W * 1080) / 1920; // 731
const PIC_Y = 590; // top of the picture
const GOLD = '#f0c53c';
const INK = '#1d1a1a';

type Seg = {s: number; e: number; text: string; kind: string};
const SEGS = (ch1 as {segments: Seg[]}).segments;
const WORDS = (ch1 as {cwords: CWord[]}).cwords;

export type CutDef = {
  id: string;
  part: number;
  lines: number[]; // chapter line (segment) indexes to keep, in order; gaps become jump cuts
  skipWords?: number; // drop this many words from the start of the first line ("Then my phone…" → "my phone…")
  hook: string[]; // big text on the first frames
  question: string[]; // big text over the last seconds
};

// Time ranges for a list of line indexes: consecutive lines merge into one piece.
const piecesOf = (def: CutDef): [number, number][] => {
  const runs: number[][] = [];
  for (const i of def.lines) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i);
    else runs.push([i]);
  }
  return runs.map((r, k) => {
    const a = SEGS[r[0]];
    const b = SEGS[r[r.length - 1]];
    let s = Math.max(0, a.s - 0.12);
    if (k === 0 && def.skipWords) {
      const ws = WORDS.filter((w) => w.s >= a.s - 0.05 && w.s < a.e);
      s = ws[def.skipWords].s - 0.06;
    }
    const next = SEGS[r[r.length - 1] + 1];
    const e = Math.min(b.e + 0.3, next ? next.s - 0.05 : b.e + 0.3);
    return [s, e];
  });
};

const TAIL = 0.35;
export const cutFrames = (def: CutDef) => Math.round((piecesOf(def).reduce((n, [s, e]) => n + (e - s), 0) + TAIL) * FPS);

// The chapter without its corner "where and when" tags: the side crop would cut them, and the
// top band already says what this is.
const Chapter1 = makeChapter({...CHAPTER1_DEF, tags: []});

const BigLines: React.FC<{lines: string[]; o: number; y: number; color?: string}> = ({lines, o, y, color = '#ffffff'}) => {
  const size = Math.min(88, 980 / Math.max(...lines.map((l) => l.length * 0.56)));
  return (
    <g opacity={o}>
      {lines.map((l, i) => (
        <Txt key={i} x={VW / 2} y={y + (i - (lines.length - 1) / 2) * size * 1.12} size={size} fill={i === lines.length - 1 ? GOLD : color}>
          {l}
        </Txt>
      ))}
    </g>
  );
};

export const makeCutShort = (def: CutDef): React.FC => {
  const pieces = piecesOf(def);
  const offsets: number[] = [];
  pieces.reduce((o, [s, e]) => {
    offsets.push(o);
    return o + (e - s);
  }, 0);
  const total = offsets[offsets.length - 1] + (pieces[pieces.length - 1][1] - pieces[pieces.length - 1][0]);
  // the chapter's words, moved onto the Short's timeline
  const words: CWord[] = [];
  pieces.forEach(([s, e], k) => {
    for (const w of WORDS) if (w.s >= s && w.e <= e + 0.05) words.push({...w, s: w.s - s + offsets[k], e: w.e - s + offsets[k]});
  });
  const firstLineEnd = words.length ? words[Math.min(words.length - 1, 12)].e : 3;
  const hookUntil = Math.max(3.2, Math.min(4.6, firstLineEnd + 0.4));
  const qFrom = total - 3.4;

  const Cut: React.FC = () => {
    useFont();
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const hookO = interpolate(t, [0, hookUntil - 0.25, hookUntil], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const qO = interpolate(t, [qFrom, qFrom + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const tagO = Math.max(0, 1 - hookO - qO);
    return (
      <AbsoluteFill style={{background: '#07080b', overflow: 'hidden'}}>
        <Img src={staticFile('mall/bg/concourse.jpg')} style={{position: 'absolute', left: -400, top: 0, height: VH, width: 'auto', filter: 'blur(28px) brightness(0.32) saturate(0.7)'}} />
        {pieces.map(([s, e], k) => {
          const from = Math.round(offsets[k] * FPS);
          const len = Math.round((e - s) * FPS) + (k === pieces.length - 1 ? Math.round(TAIL * FPS) : 0);
          return (
            <Sequence key={k} from={from} durationInFrames={len} layout="none">
              <Sequence from={-Math.round(s * FPS)} layout="none">
                <div style={{position: 'absolute', left: (VW - PIC_W) / 2, top: PIC_Y, width: 1920, height: 1080, transform: `scale(${PIC_W / 1920})`, transformOrigin: '0 0', overflow: 'hidden'}}>
                  <Chapter1 />
                </div>
              </Sequence>
            </Sequence>
          );
        })}
        <VScreen>
          <rect x={0} y={PIC_Y - 4} width={VW} height={4} fill={GOLD} opacity={0.5} />
          <rect x={0} y={PIC_Y + PIC_H} width={VW} height={4} fill={GOLD} opacity={0.5} />
          <BigLines lines={def.hook} o={hookO} y={310} />
          <g opacity={tagO}>
            <Txt x={VW / 2} y={290} size={44} fill={GOLD}>
              THE NIGHT GUARD
            </Txt>
            <text x={VW / 2} y={350} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={32} fill="#cfd6e6" letterSpacing="0.12em">
              {`PART ${def.part}`}
            </text>
          </g>
          <BigLines lines={def.question} o={qO} y={310} />
          <Captions words={words} t={t} y={1530} />
          {qO > 0 && (
            <text x={VW / 2} y={1760} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill="#cfd6e6" opacity={qO} stroke={INK} strokeWidth={6} paintOrder="stroke" letterSpacing="0.08em">
              TELL ME IN THE COMMENTS
            </text>
          )}
        </VScreen>
      </AbsoluteFill>
    );
  };
  return Cut;
};

// Chapter 1, parts 7–14 (parts 1–6 are already on the channel).
export const CH1_CUTS: CutDef[] = [
  {
    id: 'Ch1Part07', part: 7, lines: [80, 81, 82, 83, 85, 86, 87, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98],
    hook: ['MY BEST FRIEND', 'WAS BITTEN. HE BEGGED', 'ME TO OPEN THE GATE.'],
    question: ['WOULD YOU HAVE', 'OPENED THE GATE?'],
  },
  {
    id: 'Ch1Part08', part: 8, lines: [99, 101, 102, 103, 104, 105, 106, 107, 108, 109],
    hook: ['MY BEST FRIEND TURNED.', 'THEN A STRANGER CALLED', 'ON HIS RADIO.'],
    question: ['WOULD YOU REACH', 'THROUGH THE BARS?'],
  },
  {
    id: 'Ch1Part09', part: 9, lines: [110, 111, 112, 113, 114, 115, 116, 117, 118],
    hook: ['I HAD TO TAKE THE RADIO', "OFF MY DEAD BEST", "FRIEND'S CHEST."],
    question: ['COULD YOU', 'HAVE DONE IT?'],
  },
  {
    id: 'Ch1Part10', part: 10, lines: [119, 120, 121, 122, 123, 124, 125, 126, 128, 129, 130, 131],
    hook: ['A STRANGER IN MY', 'LOCKED MALL', 'KNEW MY NAME.'],
    question: ['WHO DO YOU', 'THINK SHE IS?'],
  },
  {
    id: 'Ch1Part11', part: 11, lines: [135, 137, 138, 139, 140, 141, 142],
    hook: ['MY BEST FRIEND DIED LAST', "NIGHT. THIS MORNING HE'S", 'STILL DOING HIS ROUNDS.'],
    question: ["WHAT'S YOUR", 'RULE NUMBER TWO?'],
  },
  {
    id: 'Ch1Part12', part: 12, lines: [145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 157, 158, 159, 160], skipWords: 1,
    hook: ['DAY ONE OF THE', 'OUTBREAK. MY MOM', 'SENT ONE TEXT.'],
    question: ['HOW WOULD YOU', 'GET INSULIN ACROSS', 'THE HIGHWAY?'],
  },
  {
    id: 'Ch1Part13', part: 13, lines: [163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175],
    hook: ["I CAN SEE MY DAUGHTER'S", 'WINDOW FROM HERE.', "I CAN'T GET TO HER."],
    question: ['WOULD YOU HAVE', 'TRIED TO CROSS?'],
  },
  {
    id: 'Ch1Part14', part: 14, lines: [176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188],
    hook: ['EVERY NIGHT MY DAUGHTER', "BLINKS 'I LOVE YOU.'", 'TONIGHT THE POWER IS OUT.'],
    question: ['WHO DO YOU THINK', 'IS IN THE WINDOW?'],
  },
];
