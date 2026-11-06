import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FONT, useFont} from '../thumbs/Thumbs';
import {CHAPTER1_DEF} from './chapter1/chapter1';
import {ChapterSfx, resolveChapter} from './MallChapter';
import {ShortLayout} from './ShortLayout';
import {Captions, VRadioBadge, VScreen} from './vertical';

export const SHORT_HOOKS = [
  {title: 'The Gate', opening: 'My dead best friend is at my gate.', closing: 'How did my best friend end up dead?'},
  {title: 'Forty-Two Keys', opening: 'I have every key. One is forbidden.', closing: 'B3 is missing from the map. What does it open?'},
  {title: 'One-Forty', opening: 'He always joked. Tonight, he whispered.', closing: 'What happened to Marcus?'},
  {title: 'Camera Six', opening: 'I watched my best friend get attacked.', closing: 'How long until the glass gives way?'},
  {title: 'Four Minutes', opening: 'Four minutes. Which store saves your life?', closing: 'I reached the gate. Was I fast enough?'},
  {title: 'Key Thirty-One', opening: 'The dead were outside. Then someone knocked.', closing: 'Would you unlock it for your best friend?'},
  {title: 'The Last Joke', opening: 'He begged me to open it. I refused.', closing: 'He stopped breathing. Why did he stand up?'},
  {title: 'The Radio', opening: 'A dead man’s radio could get me killed.', closing: 'What happens when she calls again?'},
  {title: 'Through the Bars', opening: 'His teeth were an inch from my wrist.', closing: 'How did a stranger learn my name?'},
  {title: 'She Knew My Name', opening: 'A stranger knew my name. And my keys.', closing: 'Who was hiding in the mall?'},
  {title: 'Rounds', opening: 'He died last night. He still does his rounds.', closing: 'Why did Mom text “Do NOT come”?'},
  {title: 'Thirty Days', opening: 'Rescue in thirty days. Insulin for ten.', closing: 'How do I reach her before the insulin runs out?'},
  {title: 'The Roof', opening: 'I could see her window. I couldn’t reach her.', closing: 'Would my daughter’s light ever come back?'},
  {title: 'Three Blinks', opening: 'Three blinks meant she was alive. Then blackout.', closing: 'Who’s watching my daughter’s window?'},
];

const chapter = resolveChapter(CHAPTER1_DEF);
const FPS = 30;
const starts = chapter.tags.map((tag) => Math.ceil(tag.t * FPS));
export const CHAPTER_CUTS = SHORT_HOOKS.map((hook, i) => {
  const start = starts[i];
  // Replace the long chapter title/end card with each Short's own closing hook.
  const end = i === 0
    ? Math.ceil((CHAPTER1_DEF.data.segments.find((segment) => segment.text === 'Let me back up.')!.e + 0.2) * FPS)
    : i === 13 ? Math.ceil((CHAPTER1_DEF.data.segments[CHAPTER1_DEF.data.segments.length - 1].e + 0.25) * FPS) : starts[i + 1];
  const tail = Math.ceil(Math.max(3.2, hook.closing.split(' ').length / 3 + 0.4) * FPS);
  return {...hook, start, end, tail, frames: end - start + tail};
});

// Wide maps, CCTV feeds and multi-person scenes retain their full frame.
// Other shots use a taller camera window centered on their existing subject.
const portraitTypes = new Set(['Scene', 'GateScene', 'OfficeScene', 'RoofScene', 'TowerNight', 'RadioOnChest', 'CctvScene', 'BackToBack']);
const wideCues = new Set([
  'And I lay there', "She didn't sound scared", "I didn't say a word",
  "I didn't sleep", "I don't remember falling", 'I waited an hour',
  'So I stayed up there', 'he tapped the last', 'Eight lanes of cars', 'Smoke over downtown',
  'On the roof of the hotel', 'And on the other side',
  'I could see my daughter', 'And if I somehow made it',
  'Behind them more', 'They weren\'t running', 'Every head in that hallway',
]);

const portraitCards = new Set(['KeyRing16', 'KeyInHand', 'PhoneCard', 'RadioCard', 'B3Door16']);

const visualElement = (node: React.ReactNode): React.ReactElement<Record<string, unknown>> | null => {
  if (!React.isValidElement<{children?: React.ReactNode}>(node)) return null;
  if (node.type === AbsoluteFill || node.type === React.Fragment) {
    return visualElement(React.Children.toArray(node.props.children)[0]);
  }
  return node as React.ReactElement<Record<string, unknown>>;
};

const linesOf = (text: string, max: number) => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines;
};

const Hook: React.FC<{text: string; y: number; size: number; color?: string}> = ({text, y, size, color = '#fff7df'}) => (
  <text x={540} y={y} textAnchor="middle" fontFamily={FONT} fontSize={size}
    fill={color} stroke="#080b12" strokeWidth={12} strokeLinejoin="round" paintOrder="stroke">
    {linesOf(text, size >= 76 ? 21 : 26).map((line, i) => <tspan key={i} x={540} dy={i ? size * 1.12 : 0}>{line}</tspan>)}
  </text>
);

const cueForShot = (index: number) => CHAPTER1_DEF.shots[Math.max(0, index)].at;

export const ChapterShort: React.FC<{part: number}> = ({part}) => {
  useFont();
  const frame = useCurrentFrame();
  const cut = CHAPTER_CUTS[part - 1];
  const bodyFrames = cut.end - cut.start;
  const ending = frame >= bodyFrames;
  let originalFrame = cut.start + Math.min(frame, bodyFrames - 1);
  // Keep the final story picture on screen while its last spoken words finish.
  if (part === 1 || part === 14) {
    const cardIndex = part === 1
      ? CHAPTER1_DEF.shots.findIndex((shot) => shot.at === '>+back up')
      : chapter.shots.length - 1;
    originalFrame = Math.min(originalFrame, Math.floor(chapter.shots[cardIndex].start * FPS) - 1);
  }
  const t = originalFrame / FPS;
  const shotIndex = chapter.shots.findIndex((shot) => t >= shot.start && t < shot.end);
  const shot = chapter.shots[Math.max(0, shotIndex)];
  const drawing = shot.draw({t: t - shot.start, dur: shot.end - shot.start, frame: originalFrame, ev: shot.ev});
  const element = visualElement(drawing);
  const componentName = typeof element?.type === 'function' ? element.type.name : '';
  const cue = cueForShot(shotIndex);
  const officeDanny = element?.props.danny as {x?: number} | false | undefined;
  let focusX: number | undefined;
  if (cue === 'I work nights') focusX = 1250;
  if (componentName === 'OfficeScene' && officeDanny !== false && !element?.props.children) {
    focusX = officeDanny?.x ?? 2150;
  }
  const portrait = portraitTypes.has(componentName) && !wideCues.has(cue);
  const cardScale = portraitCards.has(componentName) ? 1 : 0.5625;
  const cardTop = portraitCards.has(componentName) ? 350 : 500;
  const radio = chapter.cues.segments.find((segment) => segment.kind === 'radio' && t >= segment.s - 0.05 && t <= segment.e + 0.1);
  const radioName = radio ? CHAPTER1_DEF.radioNames[radio.id ?? ''] ?? 'RADIO' : '';
  const hookOpacity = interpolate(frame, [0, 120, 138], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const closingLines = linesOf(cut.closing, 21).length;
  return (
    <AbsoluteFill style={{background: '#080d16', overflow: 'hidden'}}>
      <Img src={staticFile('mall/bg/concourse.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.2)'}} />
      {portrait ? (
        <ShortLayout.Provider value={{focusX}}>{drawing}</ShortLayout.Provider>
      ) : (
        <div style={{position: 'absolute', left: (1080 - 1920 * cardScale) / 2, top: cardTop, width: 1920, height: 1080, transformOrigin: 'top left', transform: `scale(${cardScale})`}}>{drawing}</div>
      )}
      <AbsoluteFill style={{background: 'linear-gradient(#03060dcc 0%, transparent 30%, transparent 65%, #03060d99 100%)'}} />
      {ending && <AbsoluteFill style={{background: '#03060dd9'}} />}
      <VScreen>
        <text x={540} y={160} textAnchor="middle" fontFamily={FONT} fontSize={38} fill="#f0c53c" stroke="#080b12" strokeWidth={6} paintOrder="stroke">THE NIGHT GUARD · {part}/14</text>
        {!ending && (
          <>
            <g opacity={hookOpacity}><Hook text={cut.opening} y={270} size={64} /></g>
            {radioName && <VRadioBadge name={radioName} t={t} y={1320} />}
            <Captions words={chapter.cues.words} t={t} y={1510} until={cut.end / FPS} />
          </>
        )}
        {ending && (
          <>
            <Hook text={cut.closing} y={880 - closingLines * 35} size={80} color="#f0c53c" />
            <text x={540} y={1230} textAnchor="middle" fontFamily={FONT} fontSize={37} fill="#fff7df">
              {part < 14 ? `CONTINUED IN PART ${part + 1}` : 'FOLLOW THE NIGHT GUARD'}
            </text>
          </>
        )}
      </VScreen>
      <Sequence from={-cut.start} durationInFrames={cut.end} layout="none">
        <Audio src={staticFile(CHAPTER1_DEF.vo)} />
        <ChapterSfx r={chapter} />
      </Sequence>
    </AbsoluteFill>
  );
};
