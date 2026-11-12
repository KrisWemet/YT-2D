import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import type {CWord} from './cues';
import {ChapterSfx, resolveChapter} from './MallChapter';
import {ShortLayout} from './ShortLayout';
import {Txt} from './Overlays';
import {Captions, VRadioBadge, VScreen} from './vertical';
import {CHAPTER1_DEF} from './chapter1/chapter1';
import ch1 from './chapter1/ch1.json';

/*
 * Vertical Shorts cut straight from a finished chapter, full-screen 9:16: each scene is reframed
 * through a tall camera window (Codex's ShortLayout); cards and wide shots sit in a band.
 * Built from the first vidIQ read of the channel (Nov 10):
 *  - the hook is big on-screen text from the very first frame (40% of viewers scrolled past early);
 *  - slow backstory lines are cut out, so the second line keeps the tension (the big drop was 6–17 s);
 *  - no end card: each Short ends on its cliff line and loops (the end card lost a third of viewers);
 *  - the last seconds ask a question people can answer in the comments (comments were 0–2).
 */

export const FPS = 30;
const VW = 1080;
const VH = 1920;
export const GOLD = '#f0c53c';
export const INK = '#1d1a1a';

type Seg = {s: number; e: number; text: string; kind: string};
export const SEGS = (ch1 as {segments: Seg[]}).segments;
export const WORDS = (ch1 as {cwords: CWord[]}).cwords;

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

// The chapter's shots, drawn one at a time. Scenes fill the 9:16 frame through a tall camera window
// (ShortLayout, the framing Codex built for the first 14 cuts); wide maps, cards and wide
// multi-person shots stay whole in a band across the middle.
export const CH = resolveChapter({...CHAPTER1_DEF, tags: []});
const PORTRAIT_TYPES = new Set(['Scene', 'GateScene', 'OfficeScene', 'RoofScene', 'TowerNight', 'RadioOnChest', 'CctvScene', 'BackToBack']);
const WIDE_CUES = new Set(
  [
    'and I lay there', "She didn't sound scared", "I didn't say a word", "I didn't sleep", "I don't remember falling", 'I waited an hour',
    'So I stayed up there', 'Eight lanes of cars', 'Smoke over downtown', 'On the roof of the hotel', 'And on the other side',
    'I could see my', 'And if I somehow made it', 'Every head in that hallway', 'He sat down with his back', 'And we whispered',
  ].map((c) => c.toLowerCase()),
);
const FULL_CARDS = new Set(['KeyRing16', 'KeyInHand', 'PhoneCard', 'RadioCard', 'B3Door16']);

const elementOf = (node: React.ReactNode): React.ReactElement<Record<string, unknown>> | null => {
  if (!React.isValidElement<{children?: React.ReactNode}>(node)) return null;
  if (node.type === AbsoluteFill || node.type === React.Fragment) return elementOf(React.Children.toArray(node.props.children)[0]);
  return node as React.ReactElement<Record<string, unknown>>;
};

export const ShotAt: React.FC<{tc: number}> = ({tc}) => {
  let i = CH.shots.findIndex((sh) => tc >= sh.start && tc < sh.end);
  if (i < 0) i = CH.shots.length - 1;
  const sh = CH.shots[i];
  const frame = Math.round(tc * FPS);
  const drawing = sh.draw({t: tc - sh.start, dur: sh.end - sh.start, frame, ev: sh.ev});
  const el = elementOf(drawing);
  const type = typeof el?.type === 'function' ? (el.type as {name?: string}).name ?? '' : '';
  const cue = CHAPTER1_DEF.shots[i].at.toLowerCase();
  const danny = el?.props.danny as {x?: number} | false | undefined;
  const focusX = type === 'OfficeScene' && danny !== false && !el?.props.children ? danny?.x ?? 2150 : undefined;
  if (PORTRAIT_TYPES.has(type) && !WIDE_CUES.has(cue)) {
    return <ShortLayout.Provider value={{focusX}}>{drawing}</ShortLayout.Provider>;
  }
  const full = FULL_CARDS.has(type);
  const k = full ? 1 : VW / 1920;
  return (
    <div style={{position: 'absolute', left: (VW - 1920 * k) / 2, top: full ? 380 : (VH - 1080 * k) / 2, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
      {drawing}
    </div>
  );
};

export const BigLines: React.FC<{lines: string[]; o: number; y: number; color?: string}> = ({lines, o, y, color = '#ffffff'}) => {
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
  // Short time -> chapter time
  const chapterTime = (t: number) => {
    let k = pieces.length - 1;
    for (let i = 0; i < pieces.length; i++) if (t < offsets[i] + (pieces[i][1] - pieces[i][0])) {
      k = i;
      break;
    }
    return Math.min(pieces[k][1] - 0.02, pieces[k][0] + (t - offsets[k]));
  };

  const Cut: React.FC = () => {
    useFont();
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const tc = chapterTime(t);
    const hookO = interpolate(t, [0, hookUntil - 0.25, hookUntil], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const qO = interpolate(t, [qFrom, qFrom + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const tagO = Math.max(0, 1 - hookO - qO);
    const radio = CH.cues.segments.find((g) => g.kind === 'radio' && tc >= g.s - 0.05 && tc <= g.e + 0.1);
    const radioName = radio ? CHAPTER1_DEF.radioNames[radio.id ?? ''] ?? 'RADIO' : '';
    return (
      <AbsoluteFill style={{background: '#07080b', overflow: 'hidden'}}>
        <Img src={staticFile('mall/bg/concourse.jpg')} style={{position: 'absolute', left: -400, top: 0, height: VH, width: 'auto', filter: 'blur(28px) brightness(0.3) saturate(0.7)'}} />
        <ShotAt tc={tc} />
        {/* shade the top and bottom so the hook and captions read over any picture */}
        <AbsoluteFill style={{background: 'linear-gradient(#03060de6 0%, #03060d99 16%, transparent 30%, transparent 66%, #03060d99 78%, #03060de6 100%)'}} />
        {pieces.map(([s, e], k) => (
          <Sequence key={k} from={Math.round(offsets[k] * FPS)} durationInFrames={Math.round((e - s) * FPS)} layout="none">
            <Sequence from={-Math.round(s * FPS)} layout="none">
              <Audio src={staticFile(CHAPTER1_DEF.vo)} />
              <ChapterSfx r={CH} />
            </Sequence>
          </Sequence>
        ))}
        <VScreen>
          <BigLines lines={def.hook} o={hookO} y={300} />
          <g opacity={tagO}>
            <Txt x={VW / 2} y={200} size={44} fill={GOLD}>
              THE NIGHT GUARD
            </Txt>
            <text x={VW / 2} y={258} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={32} fill="#e3e8f2" stroke={INK} strokeWidth={6} paintOrder="stroke" letterSpacing="0.12em">
              {`PART ${def.part}`}
            </text>
          </g>
          <BigLines lines={def.question} o={qO} y={300} />
          {radioName && <VRadioBadge name={radioName} t={t} y={1330} color={radioName === 'MARCUS' ? '#8fd18a' : radioName === 'EMERGENCY ALERT' ? '#f0c53c' : '#e58fb4'} />}
          <Captions words={words} t={t} y={1560} />
          {qO > 0 && (
            <text x={VW / 2} y={1780} textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={34} fill="#e3e8f2" opacity={qO} stroke={INK} strokeWidth={6} paintOrder="stroke" letterSpacing="0.08em">
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
