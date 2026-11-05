// "Day 1: Before We Go" — cold open (0:00-0:30). 1920x1080, 30 fps.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {FPS, FilmLook, SHOT} from './kit';
import {Establish} from './Establish';
import {JerryCan} from './JerryCan';
import {Window} from './Window';
import {BootsShot, LadderShot} from './Ladder';
import {KnucklesShot} from './Knuckles';
import {FaceShot} from './Face';
import {Title} from './Title';
import {Day1Sfx} from './Sfx';

export const useFonts = () => {
  const [handle] = useState(() => delayRender('day1 fonts'));
  useEffect(() => {
    const fonts = [
      new FontFace('Bebas Neue', `url(${staticFile('fonts/BebasNeue-Regular.woff2')})`),
      new FontFace('Special Elite', `url(${staticFile('fonts/SpecialElite-Regular.woff2')})`),
    ];
    Promise.all(fonts.map((f) => f.load()))
      .then((ff) => {
        ff.forEach((f) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(f));
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);
};

const shotAt = (t: number) => {
  for (const [name, [a, b]] of Object.entries(SHOT)) if (t >= a && t < b) return name;
  return 'title';
};

export const Day1ColdOpen: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shot = shotAt(t);
  const lt = t - SHOT[shot][0];
  let body: React.ReactNode = null;
  if (shot === 'establish') body = <Establish t={t} />;
  if (shot === 'can') body = <JerryCan t={t} lt={lt} />;
  if (shot === 'window') body = <Window t={t} lt={lt} />;
  if (shot === 'ladder') body = <LadderShot t={t} lt={lt} />;
  if (shot === 'knuckles') body = <KnucklesShot t={t} lt={lt} />;
  if (shot === 'boots') body = <BootsShot t={t} lt={lt} />;
  if (shot === 'face') body = <FaceShot t={t} lt={lt} />;
  if (shot === 'title') body = <Title t={t} />;
  const black = shot === 'black';
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {body}
      {!black && <FilmLook frame={frame} grain={shot === 'title' ? 0.1 : 0.16} />}
      <Day1Sfx />
    </AbsoluteFill>
  );
};
