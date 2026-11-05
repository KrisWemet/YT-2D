import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LOOKS, POSES, Stick} from './Stick';
import {FULL, World} from './World';

// Rig check: the cast and a range of poses on the main hallway.
export const MallTest: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <World bg="concourse" cam={{...FULL, y: 1000, z: 1.25}} width={1920} height={1080}>
      <Stick x={380} y={1500} h={680} pose={POSES.walkLight} look={LOOKS.guard} eyes="dot" mouth="flat" propN="flashlight" beam={380} />
      <Stick x={760} y={1470} h={650} pose={POSES.standRelax} look={LOOKS.marcus} eyes="dot" mouth="smile" look2={-1} face={-1} />
      <Stick x={1080} y={1450} h={620} pose={POSES.radio} look={LOOKS.guard} eyes="worried" mouth="o" propN="radio" />
      <Stick x={1400} y={1460} h={420} pose={POSES.runArms} look={LOOKS.lily} eyes="closed" mouth="open" face={-1} />
      <Stick x={1700} y={1450} h={630} face={-1} pose={POSES.zShamble} look={LOOKS.zombieA} eyes="zombie" mouth="zombie" wobble={3} />
      <Stick x={2020} y={1470} h={640} pose={POSES.frontPress} front look={LOOKS.marcusZ} eyes="zombie" mouth="zombie" wobble={5} />
      <Stick x={2360} y={1490} h={660} face={-1} pose={POSES.zShambleB} look={LOOKS.zombieB} eyes="zombie" mouth="zombie" wobble={4} />
      <Stick x={2650} y={1500} h={670} face={-1} pose={POSES.kneelOpen} look={LOOKS.dannyHome} eyes="closed" mouth="smile" />
    </World>
  </AbsoluteFill>
);
