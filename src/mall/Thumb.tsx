import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useFont} from '../thumbs/Thumbs';
import {Screen, Txt, W} from './Overlays';
import {Beyond, Crowd, Guard, HoldGate, Scene} from './shots';
import {POSES} from './Stick';

// YouTube thumbnail: the guard with his keys, faces at the gate behind him.
export const MallThumb: React.FC = () => {
  useFont();
  const p = {t: 0, dur: 1, frame: 0, ev: {}};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Scene bg="sportsinside" a={{x: 1420, y: 720, z: 2.2}} p={p}>
        <Beyond>
          <Crowd
            rows={[
              [1300, 905, 280],
              [1460, 900, 270],
              [1620, 905, 280],
              [1250, 936, 330],
              [1345, 926, 318],
              [1440, 938, 336],
              [1535, 930, 326],
              [1630, 936, 330],
            ]}
            front
            seed={5}
          />
        </Beyond>
        <HoldGate frac={1} opacity={0.78} />
        <Guard
          x={1000}
          y={1185}
          h={575}
          face={1}
          pose={{...POSES.holdUp, lean: -6, head: -4, armN: [125, 165]}}
          propN="keys"
          eyes="wide"
          mouth="grit"
          sweat
          look2={1}
        />
      </Scene>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 55%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)'}} />
      <Screen>
        <Txt x={W - 60} y={150} size={124} anchor="end">
          HE HAD
        </Txt>
        <Txt x={W - 60} y={300} size={152} anchor="end" fill="#f0c53c">
          EVERY KEY
        </Txt>
      </Screen>
    </AbsoluteFill>
  );
};
