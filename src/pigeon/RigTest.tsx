import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PigeonRig, Pose} from './Pigeon';

const poses: Pose[] = [
  {},
  {headDx: -55, near: {x: 95}, far: {x: -95}},
  {headDx: 55, near: {x: -20, lift: 40, curl: -18}, far: {x: 60}},
  {blink: 0.5, look: [-14, 6], brow: 18, browTilt: -6},
  {blink: 1, near: {x: 20, dy: 40, curl: 30}, far: {x: -10, dy: 46, curl: 34}},
  {eyePop: 1.25, look: [10, -4], brow: 22, headDy: -30},
];
export const RigTest: React.FC = () => {
  useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#cfe6ff'}}>
      {poses.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: 270 + (i % 2) * 540, top: 600 + Math.floor(i / 2) * 620, transform: 'scale(0.33)', transformOrigin: '0 0'}}>
          <PigeonRig pose={p} id={`t${i}`} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
