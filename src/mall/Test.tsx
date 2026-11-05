import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LOOKS, POSES, Stick} from './Stick';
import {FULL, World} from './World';

// Rig check: every character and a range of poses on the main hallway.
export const MallTest: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <World bg="concourse" cam={FULL} width={1920} height={1080}>
      <Stick x={420} y={1500} h={700} pose={POSES.walkA} look={LOOKS.guard} eyes="dot" mouth="flat" propN="flashlight" beam={420} />
      <Stick x={900} y={1420} h={600} pose={POSES.point} look={LOOKS.guard} eyes="angry" mouth="open" />
      <Stick x={1250} y={1380} h={560} pose={POSES.radio} look={LOOKS.marcus} eyes="worried" mouth="o" propN="radio" />
      <Stick x={1600} y={1360} h={540} face={-1} pose={POSES.zShamble} look={LOOKS.zombieA} eyes="zombie" mouth="zombie" wobble={3} />
      <Stick x={1900} y={1400} h={580} face={-1} pose={POSES.zShambleB} look={LOOKS.zombieB} eyes="zombie" mouth="zombie" wobble={4} />
      <Stick x={2250} y={1450} h={640} face={-1} pose={POSES.zPress} look={LOOKS.marcusZ} eyes="zombie" mouth="zombie" wobble={5} />
      <Stick x={2600} y={1520} h={700} face={-1} pose={POSES.scared} look={LOOKS.guard} eyes="wide" mouth="open" sweat />
      <Stick x={1590} y={905} h={150} pose={POSES.standRelax} look={LOOKS.teenA} eyes="dot" mouth="smile" />
      <Stick x={1555} y={800} h={146} face={-1} pose={POSES.stand} look={LOOKS.teenB} eyes="dot" mouth="smile" />
      <Stick x={700} y={1080} h={250} pose={POSES.sitHug} look={LOOKS.guard} eyes="wide" mouth="flat" />
      <Stick x={1050} y={1060} h={240} pose={POSES.pullDown} look={LOOKS.guard} back />
    </World>
  </AbsoluteFill>
);
