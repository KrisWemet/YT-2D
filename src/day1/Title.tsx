// Title card (24.0-30.0 s): DAY 1 flickers on like the station lights; the episode name types in.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import C from './cues.json';
import {clamp, easeInOutSine, lerp} from '../pigeon/lib';
import {B} from './kit';

const SUB = 'BEFORE WE GO';
export const TYPE_AT = (C as unknown as {typeAt: number}).typeAt;
export const TYPE_STEP = 0.075;

/** on/off toggles: on at each even index, off at each odd index */
const titleOn = (t: number) => {
  const ts = C.titleFlicker;
  let on = false;
  for (const x of ts) if (t >= x) on = !on;
  return on;
};

export const Title: React.FC<{t: number}> = ({t}) => {
  const on = titleOn(t) ? 1 : 0.06;
  const out = 1 - clamp((t - B.titleOut) / 0.6);
  const s = lerp(1.0, 1.045, easeInOutSine(clamp((t - B.titleHit) / 6)));
  const shown = Math.max(0, Math.min(SUB.length, Math.floor((t - TYPE_AT) / TYPE_STEP) + 1));
  const glow = on > 0.5 ? 0.35 + 0.05 * Math.sin(t * 40) : 0;
  return (
    <AbsoluteFill style={{background: '#000', opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${s})`, alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            fontFamily: 'Bebas Neue',
            fontSize: 300,
            letterSpacing: '0.14em',
            paddingLeft: '0.14em',
            color: '#ece6da',
            opacity: on,
            lineHeight: 1,
            textShadow: `0 0 40px rgba(255,236,210,${glow}), 0 0 120px rgba(255,236,210,${glow * 0.4})`,
            marginTop: -60,
          }}
        >
          DAY 1
        </div>
        <div
          style={{
            fontFamily: 'Special Elite',
            fontSize: 46,
            letterSpacing: '0.32em',
            paddingLeft: '0.32em',
            color: '#9f988c',
            marginTop: 26,
            whiteSpace: 'pre',
          }}
        >
          {SUB.split('').map((ch, i) => (
            <span key={i} style={{opacity: i < shown ? 1 : 0}}>{ch}</span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
