import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import {makeCues, ShortData} from './cues';
import {Captions, VRadioBadge, VScreen, TopTag, VShot} from './vertical';

// One vertical Short of the mall series: shots cued by words, captions, the where/when tag,
// the radio badge while Marcus talks, the voice and the sound.
export const FPS = 30;
export const TAIL = 1.6; // seconds of end card after the voice track ends

export type TagDef = {at: string; text: string};
export type HitDef = {file: string; at: string | number; db: number; offset?: number};
export type BedDef = {file: string; from: string | number; to: string | number; db: [number, number][] | number};
export type ShortDef = {data: ShortData; vo: string; shots: VShot[]; tags: TagDef[]; hits: HitDef[]; beds: BedDef[]};

export const shortFrames = (def: ShortDef) => Math.round((def.data.duration + TAIL) * FPS);

const resolveShort = (def: ShortDef) => {
  const cues = makeCues(def.data);
  const DUR = def.data.duration + TAIL;
  let prev = 0;
  const starts = def.shots.map((s) => {
    const t = cues.resolveCue(s.at, prev);
    if (t < prev - 0.001) throw new Error(`shot "${s.at}" starts before the previous one`);
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
  const tags = def.tags.map((g) => ({t: cues.resolveCue(g.at, 0), text: g.text}));
  const time = (x: string | number) => (typeof x === 'number' ? x : x === 'end' ? DUR : cues.resolveCue(x, 0));
  const hits = def.hits.map((h) => ({...h, t: time(h.at) + (h.offset ?? 0)}));
  const beds = def.beds.map((b) => ({...b, t0: time(b.from), t1: time(b.to)}));
  return {cues, DUR, shots, tags, hits, beds, endStart: starts[starts.length - 1]};
};

const db = (d: number) => 10 ** (d / 20);
const f = (s: number) => Math.max(0, Math.round(s * FPS));

const ShortSfx: React.FC<{r: ReturnType<typeof resolveShort>}> = ({r}) => (
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
              const edge = Math.min(1, fr / 8, (len - fr) / 8);
              return db(d) * Math.max(0, edge);
            }}
          />
        </Sequence>
      );
    })}
  </>
);

export const makeShort = (def: ShortDef): React.FC => {
  const r = resolveShort(def);
  const Short: React.FC = () => {
    useFont();
    const frame = useCurrentFrame();
    const t = frame / FPS;
    let i = r.shots.findIndex((s) => t >= s.start && t < s.end);
    if (i < 0) i = r.shots.length - 1;
    const sh = r.shots[i];
    const ending = t >= r.endStart;
    const tag = [...r.tags].reverse().find((g) => t >= g.t);
    const radio = r.cues.segments.find((g) => g.kind === 'radio' && t >= g.s - 0.05 && t <= g.e + 0.15);
    return (
      <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
        {sh.draw({t: t - sh.start, dur: sh.end - sh.start, frame, ev: sh.ev})}
        {!ending && (
          <VScreen>
            {tag && <TopTag text={tag.text} t={t - tag.t} />}
            {radio && <VRadioBadge name="MARCUS" t={t} />}
            <Captions words={r.cues.words} t={t} until={r.endStart} />
          </VScreen>
        )}
        <Audio src={staticFile(def.vo)} />
        <ShortSfx r={r} />
      </AbsoluteFill>
    );
  };
  return Short;
};
