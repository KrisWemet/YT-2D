import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import {makeCues, ShortData} from './cues';
import {RadioBadge, Screen, Txt} from './Overlays';
import type {P} from './shots';

/*
 * One long chapter of the mall series in 16:9: shots cued by the narration's words, the
 * "where and when" tag at the start of each segment, a badge while a radio voice talks, the
 * voice and the sound. No burned-in captions (the long video gets a captions file instead).
 */
export const FPS = 30;

export type CShot = {at: string; ev?: Record<string, string>; draw: (p: P) => React.ReactNode};
export type TagDef = {at: string; text: string};
export type HitDef = {file: string; at: string | number; db: number; offset?: number};
export type BedDef = {file: string; from: string | number; to: string | number; db: [number, number][] | number};
export type ChapterDef = {
  data: ShortData;
  vo: string;
  shots: CShot[];
  tags: TagDef[];
  hits: HitDef[];
  beds: BedDef[];
  tail: number; // seconds of end card after the voice
  radioNames: Record<string, string>; // radio segment id -> badge name
};

export const chapterFrames = (def: ChapterDef) => Math.round((def.data.duration + def.tail) * FPS);

export const resolveChapter = (def: ChapterDef) => {
  const cues = makeCues(def.data);
  const DUR = def.data.duration + def.tail;
  let prev = 0;
  const starts = def.shots.map((s, i) => {
    let t: number;
    try {
      t = cues.resolveCue(s.at, prev);
    } catch (e) {
      throw new Error(`shot ${i} "${s.at}": ${(e as Error).message}`);
    }
    if (t < prev - 0.001) throw new Error(`shot ${i} "${s.at}" starts before the previous one`);
    prev = t;
    return t;
  });
  const shots = def.shots.map((s, i) => {
    const start = starts[i];
    const end = i + 1 < def.shots.length ? starts[i + 1] : DUR;
    const ev: Record<string, number> = {};
    for (const [k, ph] of Object.entries(s.ev ?? {})) ev[k] = cues.wordTime(ph, start) - start;
    return {start, end, ev, draw: s.draw};
  });
  let tprev = 0;
  const tags = def.tags.map((g) => {
    tprev = cues.resolveCue(g.at, tprev);
    return {t: tprev, text: g.text};
  });
  const time = (x: string | number) => (typeof x === 'number' ? x : x === 'end' ? DUR : cues.resolveCue(x, 0));
  const hits = def.hits.map((h) => ({...h, t: time(h.at) + (h.offset ?? 0)}));
  const beds = def.beds.map((b) => ({...b, t0: time(b.from), t1: time(b.to)}));
  return {cues, DUR, shots, tags, hits, beds};
};

const db = (d: number) => 10 ** (d / 20);
const f = (s: number) => Math.max(0, Math.round(s * FPS));

export const ChapterSfx: React.FC<{r: ReturnType<typeof resolveChapter>}> = ({r}) => (
  <>
    {r.hits.map((h, i) => (
      <Sequence key={`h${i}`} from={f(h.t)} layout="none">
        <Audio src={staticFile(`mall/sfx/${h.file}.mp3`)} volume={db(h.db)} />
      </Sequence>
    ))}
    {r.beds.map((b, i) => {
      const from = f(b.t0);
      const len = Math.max(1, f(b.t1) - from);
      const curve = typeof b.db === 'number' ? [[0, b.db] as [number, number]] : b.db;
      return (
        <Sequence key={`b${i}`} from={from} durationInFrames={len} layout="none">
          <Audio
            src={staticFile(`mall/sfx/${b.file}.mp3`)}
            loop
            volume={(fr) => {
              const k = fr / Math.max(len, 1); // curve points are 0..1 across the bed
              const d =
                curve.length === 1
                  ? curve[0][1]
                  : interpolate(k, curve.map((c) => c[0]), curve.map((c) => c[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const edge = Math.min(1, fr / 15, (len - fr) / 15);
              return db(d) * Math.max(0, edge);
            }}
          />
        </Sequence>
      );
    })}
  </>
);

// "Where and when", top left, for the first few seconds of a segment.
const SegTag: React.FC<{text: string; t: number}> = ({text, t}) => {
  const o = interpolate(t, [0, 0.35, 3.4, 3.9], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  const size = 40;
  const w = text.length * size * 0.62 + 64;
  return (
    <g opacity={o} transform={`translate(70, 92)`}>
      <Txt x={0} y={-22} size={30} anchor="start" fill="#f0c53c">
        THE NIGHT GUARD
      </Txt>
      <rect x={0} y={0} width={w} height={62} rx={31} fill="#0f1218" opacity={0.84} stroke="#1d1a1a" strokeWidth={4} />
      <text x={32} y={43} fontFamily="DejaVu Sans, sans-serif" fontWeight={700} fontSize={size - 8} fill="#eef1f6" letterSpacing="0.06em">
        {text}
      </text>
    </g>
  );
};

// Start and end of every shot (seconds), for QA tools.
export const shotTimes = (def: ChapterDef) => resolveChapter(def).shots.map((s) => [s.start, s.end] as [number, number]);

export const makeChapter = (def: ChapterDef): React.FC => {
  const r = resolveChapter(def);
  const Chapter: React.FC = () => {
    useFont();
    const frame = useCurrentFrame();
    const t = frame / FPS;
    let i = r.shots.findIndex((s) => t >= s.start && t < s.end);
    if (i < 0) i = r.shots.length - 1;
    const sh = r.shots[i];
    const tag = [...r.tags].reverse().find((g) => t >= g.t);
    const radio = r.cues.segments.find((g) => g.kind === 'radio' && t >= g.s - 0.05 && t <= g.e + 0.2);
    const name = radio ? def.radioNames[radio.id ?? ''] ?? 'RADIO' : null;
    return (
      <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
        {sh.draw({t: t - sh.start, dur: sh.end - sh.start, frame, ev: sh.ev})}
        {t < def.data.duration && (
          <Screen>
            {tag && <SegTag text={tag.text} t={t - tag.t} />}
            {name && <RadioBadge name={name} t={t} color={name === 'MARCUS' ? '#8fd18a' : name === 'EMERGENCY ALERT' ? '#f0c53c' : '#e58fb4'} />}
          </Screen>
        )}
        <Audio src={staticFile(def.vo)} />
        <ChapterSfx r={r} />
      </AbsoluteFill>
    );
  };
  return Chapter;
};
