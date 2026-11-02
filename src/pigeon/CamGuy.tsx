import React from 'react';
import {AbsoluteFill} from 'remotion';
import {S} from './sprites';
import {camKeys, clamp} from './lib';
import {Layer, Pic, Pos} from './world';
import {Flash} from './fx';
import {StreetBackdrop, HEADR} from './Street';
import {T} from './timing';

const g = S.g_camera;
export const CamGuy: React.FC<{t: number}> = ({t}) => {
  const cam = camKeys(t, [[T.cutCam, 520, 1190, 1.18], [22.3, 520, 1180, 1.23, (u) => u]]);
  // trembles a little, then holds perfectly still for "still"
  const steady = clamp((t - T.holding) / 0.35);
  const amp = 1 - steady;
  const rot = amp * (0.55 * Math.sin(2 * Math.PI * 6.1 * t) + 0.3 * Math.sin(2 * Math.PI * 9.3 * t + 1));
  const dx = amp * 3 * Math.sin(2 * Math.PI * 4.3 * t + 0.4);
  const flash = t > T.still ? Math.max(0, 1 - (t - T.still) / 0.22) * 0.9 : 0;
  const sc = (HEADR / g.head[2]) * 1.0;
  return (
    <AbsoluteFill>
      <StreetBackdrop cam={cam} blurFar={3} />
      <Layer cam={cam} z={1000}>
        <Pos x={430 + dx} y={1905} s={sc} rot={rot}>
          <Pic file={g.file} w={g.w} h={g.h} ax={g.feet[0]} ay={g.feet[1]} />
        </Pos>
      </Layer>
      <Flash a={flash} />
    </AbsoluteFill>
  );
};
