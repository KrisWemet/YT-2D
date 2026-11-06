import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {CShot} from '../MallChapter';
import {Flash, Padlock, Rattle, Ring, Screen, shake, Tag, Txt, W} from '../Overlays';
import {BlackFridayBanner, Crowd, Guard, hC, hLot, HoldGate, insideGuardSit, lotRows, Marcus3, marcusRadio, Scene, SHOPPERS, Zed, Beyond} from '../shots';
import {jointsOf, LOOKS, POSES, Stick} from '../Stick';
import {FULL} from '../World';
import {CardboardBear, CleanerCart, KeyRing16, ListCard, MapCard, PhoneCard, RadioCard, SleepingBag} from './props';
import {GateScene, HALL_ROWS, MarcusAtGate, TopClock} from './scenes';

/* Chapter 1, segments 8-11: the radio, through the bars, she knew my name, rounds. */

const MORNING = 'brightness(1.12) saturate(0.55) contrast(0.95)';
const hI = (y: number) => 2.2 * (y - 780);
// Danny lying on the store floor: hips here, head toward the gate side (-x), feet toward the tent
const LIE_X = 1750;
const pressRows = HALL_ROWS.map(([x, y, h]) => [x, y, h, -1] as [number, number, number, -1]);

// Dead Marcus at the gate, his radio circled (cold-open framing).
const RadioOnChest: React.FC<{p: Parameters<CShot['draw']>[0]; z?: number; blink?: boolean}> = ({p, z = 4.4, blink}) => {
  const r = marcusRadio();
  const on = blink ? Math.floor(p.t * 3) % 2 === 0 : true;
  return (
    <GateScene
      p={p}
      a={{x: r.x, y: r.y - 20, z}}
      b={{x: r.x, y: r.y - 20, z: z + 0.4}}
      gateOpacity={0.8}
      filter="none"
      over={
        <>
          {on && <circle cx={r.x + 6} cy={r.y - 6} r={16} fill="#8fd18a" opacity={0.55} />}
          <Ring x={r.x} y={r.y} rx={30} ry={36} t={p.t} at={0.1} w={5} />
        </>
      }
      beyond={<Stick {...Marcus3({dim: 0.9})} />}
    />
  );
};

// Danny reaching through the bars for the radio.
const reachPose = {lean: 24, head: -6, armF: [30, 60] as [number, number], armN: [96, 92] as [number, number], legF: [70, -30] as [number, number], legN: [95, -10] as [number, number]};

export const SHOTS_8_11: CShot[] = [
  // ================= 8. The Radio =================
  {
    at: "He didn't look at me",
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 668, z: 4.6}} b={{x: 1420, y: 660, z: 5.0}} gateOpacity={0.6} filter="none" beyond={<Stick {...Marcus3({dim: 1.0})} />} />,
  },
  {
    at: 'Two forty-five',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 700, z: 2.9}}
        b={{x: 1430, y: 700, z: 3.1}}
        screen={<TopClock text="2:45" ampm="AM" t={p.t} />}
        beyond={
          <>
            <Crowd rows={HALL_ROWS.slice(0, 5).map(([x, y, h]) => [x, y, h, -1] as [number, number, number, -1])} dim={0.6} front seed={2} />
            <Stick {...Marcus3({dim: 1.0})} />
          </>
        }
      />
    ),
  },
  {at: 'Then my radio crackled', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="crackle" />},
  {at: 'Is anyone still in the mall', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="on" />},
  {
    at: "I'm on the second floor",
    draw: (p) => <Scene bg="deptstore" a={{x: 1408, y: 700, z: 1.5}} b={{x: 1408, y: 520, z: 2.4}} p={p} filter="brightness(0.62) saturate(0.7)" />,
  },
  {
    at: "I'm not alone up here",
    draw: (p) => <Scene bg="deptstore" a={{x: 1408, y: 470, z: 2.6}} b={{x: 1408, y: 460, z: 2.9}} p={p} filter="brightness(0.55) saturate(0.6)" />,
  },
  {
    at: 'A woman Whispering',
    draw: (p) => (
      <Scene bg="deptstore" a={{x: 1300, y: 460, z: 3.2}} b={{x: 1310, y: 455, z: 3.5}} p={p} filter="brightness(0.5) saturate(0.6)">
        <circle cx={1240 + Math.sin(p.t * 2) * 30} cy={430} r={26} fill="#fff2c2" opacity={0.25} />
      </Scene>
    ),
  },
  {at: 'Her voice came out', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="on" />},
  {at: 'And then one second later', draw: (p) => <RadioOnChest p={p} />},
  {
    at: 'Every head in that hallway',
    draw: (p) => (
      <GateScene p={p} a={{x: 1430, y: 690, z: 2.6}} b={{x: 1430, y: 690, z: 2.9}} filter="brightness(0.85)" beyond={<><Crowd rows={pressRows} dim={0.7} front seed={6} /><Stick {...Marcus3({dim: 1.0})} /></>} />
    ),
  },
  {
    at: 'Forty of them',
    ev: {gate: 'One gate'},
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 760, z: 1.9}}
        b={{x: 1430, y: 760, z: 2.0}}
        filter="brightness(0.8)"
        beyond={<><Crowd rows={pressRows} dim={0.65} front seed={6} /><Stick {...Marcus3({dim: 1.0})} /></>}
        screen={
          <>
            <Txt x={360} y={330} size={190} fill="#e0433a">
              40
            </Txt>
            {p.t >= p.ev.gate - 0.2 && (
              <Txt x={W - 380} y={330} size={120} fill="#f0c53c">
                1 GATE
              </Txt>
            )}
          </>
        }
      />
    ),
  },
  {
    at: "They didn't run at it",
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 700, z: 2.4}}
        b={{x: 1430, y: 700, z: 2.6}}
        filter="brightness(0.85)"
        shakeXY={[Math.sin(p.t * 9) * 3, 0]}
        beyond={<Crowd rows={pressRows} dim={0.75} front seed={7} />}
      />
    ),
  },
  {
    at: 'the way a crowd leans',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="exterior" a={{x: 1408, y: 1000, z: 1.3}} b={{x: 1408, y: 980, z: 1.4}} p={p} filter="sepia(0.6) brightness(1.05)" over={<BlackFridayBanner />}>
          {lotRows.map(([x, y, , f], i) => (
            <Stick key={i} x={x} y={y} h={hLot(y)} face={(f ?? 1) as 1 | -1} look={SHOPPERS[i % SHOPPERS.length]} pose={i % 2 ? POSES.run : POSES.walkA} eyes="wide" mouth="open" shadow={0.2} />
          ))}
        </Scene>
      </AbsoluteFill>
    ),
  },
  {
    at: 'And the steel started',
    draw: (p) => {
      const push = 1 + 0.035 * (0.5 + 0.5 * Math.sin(p.t * 7));
      return (
        <Scene bg="sportsinside" a={{x: 1430, y: 700, z: 2.6}} b={{x: 1430, y: 700, z: 2.8}} p={p} filter="brightness(0.8)" shakeXY={shake(p.t, 0.1, 14, 1.5)}>
          <Beyond>
            <Crowd rows={pressRows} dim={0.75} front seed={7} />
          </Beyond>
          <g transform={`translate(1430, 680) scale(${push}) translate(-1430, -680)`}>
            <HoldGate frac={1} opacity={0.95} />
          </g>
        </Scene>
      );
    },
  },
  {at: 'And she was about to', draw: (p) => <RadioOnChest p={p} z={5.0} blink />},

  // ================= 9. Through the Bars =================
  {at: 'I switched my radio off', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="on" offAt={0.45} />},
  {at: 'But his was still on', draw: (p) => <RadioOnChest p={p} blink />},
  {
    at: 'There was only one way',
    draw: (p) => (
      <GateScene p={p} a={{x: 1380, y: 800, z: 2.4}} b={{x: 1380, y: 800, z: 2.55}} filter="brightness(0.8)" beyond={<Stick {...Marcus3({dim: 0.9})} />}>
        <Guard x={1250} y={1060} h={hI(1060)} pose={POSES.crouch} eyes="wide" sweat />
      </GateScene>
    ),
  },
  {
    at: 'I had to reach through',
    draw: (p) => (
      <GateScene p={p} a={{x: 1380, y: 760, z: 2.8}} b={{x: 1390, y: 760, z: 3.0}} filter="brightness(0.85)" beyond={<Stick {...Marcus3({dim: 0.9})} />}>
        <Guard x={1215} y={1050} h={hI(1050)} pose={reachPose} eyes="wide" mouth="grit" sweat />
      </GateScene>
    ),
  },
  {
    at: 'His teeth were about',
    draw: (p) => {
      const r = marcusRadio();
      return (
        <GateScene p={p} a={{x: r.x - 20, y: r.y - 80, z: 4.6}} b={{x: r.x - 20, y: r.y - 80, z: 5.0}} filter="brightness(0.9)" gateOpacity={0.7} beyond={<Stick {...Marcus3({dim: 0.95})} />}>
          <Guard x={1215} y={1050} h={hI(1050)} pose={reachPose} eyes="wide" mouth="grit" sweat />
        </GateScene>
      );
    },
  },
  {
    at: 'The whole time',
    draw: (p) => <GateScene p={p} a={{x: 1420, y: 625, z: 6.2}} b={{x: 1420, y: 625, z: 6.6}} gateOpacity={0.55} filter="none" beyond={<Stick {...Marcus3({dim: 1.0})} />} />,
  },
  {at: 'And the clip stuck', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="on" clipUpside />},
  {
    at: 'He always wore it',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={{x: 1380, y: 1080, z: 2.4}} b={{x: 1385, y: 1075, z: 2.5}} p={p} filter="sepia(0.7) brightness(1.08) blur(1px)">
          <Stick x={1250} y={1250} h={430} look={LOOKS.marcus} pose={POSES.shrug} eyes="closed" mouth="smile" />
          <Stick x={1520} y={1250} h={430} face={-1} look={LOOKS.guard} pose={POSES.point} eyes="dot" mouth="open" />
        </Scene>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.8) 100%)'}} />
      </AbsoluteFill>
    ),
  },
  {
    at: 'I must have told him',
    draw: (p) => (
      <AbsoluteFill>
        <Scene bg="garage" a={{x: 1480, y: 1060, z: 3.0}} b={{x: 1485, y: 1055, z: 3.2}} p={p} filter="sepia(0.7) brightness(1.08) blur(1px)">
          <Stick x={1250} y={1250} h={430} look={LOOKS.marcus} pose={POSES.laugh} eyes="closed" mouth="open" />
          <Stick x={1520} y={1250} h={430} face={-1} look={LOOKS.guard} pose={POSES.facepalm} eyes="closed" mouth="flat" />
        </Scene>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.8) 100%)'}} />
      </AbsoluteFill>
    ),
  },
  {
    at: 'I twisted it',
    ev: {fell: 'fell back'},
    draw: (p) => (
      <GateScene p={p} a={{x: 1300, y: 850, z: 2.4}} b={{x: 1300, y: 850, z: 2.5}} filter="brightness(0.8)" shakeXY={shake(p.t, p.ev.fell - 0.1, 14, 0.4)} beyond={<Stick {...Marcus3({dim: 0.9})} />}>
        {p.t < p.ev.fell - 0.1 ? (
          <Guard x={1215} y={1050} h={hI(1050)} pose={reachPose} eyes="wide" mouth="grit" />
        ) : (
          <Guard x={1100} y={1120} h={hI(1120)} pose={POSES.slide} propN="radio" eyes="wide" mouth="o" />
        )}
      </GateScene>
    ),
  },
  {at: 'I stuffed it', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="bag" />},
  {
    at: 'and I lay there',
    draw: (p) => (
      <GateScene p={p} a={{x: 1640, y: 1050, z: 2.2}} b={{x: 1640, y: 1050, z: 2.35}} filter="brightness(0.6)">
        <SleepingBag x={1235} y={1112} s={0.9} />
        <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={POSES.lyingDown} eyes="wide" />
      </GateScene>
    ),
  },
  {
    at: 'Without the noise',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 700, z: 2.4}}
        b={{x: 1430, y: 700, z: 2.5}}
        filter="brightness(0.7)"
        beyond={
          <>
            {HALL_ROWS.slice(0, 6).map(([x, y, h], i) => (
              <Zed key={i} k={i} x={x + (i % 2 ? 1 : -1) * p.t * 60} y={y} h={h} face={i % 2 ? 1 : -1} dim={0.6} />
            ))}
            <Stick {...Marcus3({dim: 0.9})} />
          </>
        }
      />
    ),
  },
  {
    at: 'One by one',
    draw: (p) => (
      <GateScene
        p={p}
        a={{x: 1430, y: 700, z: 2.4}}
        b={{x: 1430, y: 700, z: 2.5}}
        filter="brightness(0.7)"
        beyond={
          <>
            {HALL_ROWS.slice(0, 2).map(([x, y, h], i) => (
              <Zed key={i} k={i} x={x + (i % 2 ? 1 : -1) * (120 + p.t * 60)} y={y} h={h * 0.8} face={i % 2 ? 1 : -1} dim={0.5} />
            ))}
            <Stick {...Marcus3({dim: 0.9})} />
          </>
        }
      />
    ),
  },
  {
    at: 'All except Marcus',
    draw: (p) => <GateScene p={p} a={{x: 1430, y: 690, z: 2.8}} b={{x: 1430, y: 690, z: 3.1}} filter="brightness(0.7)" beyond={<Stick {...Marcus3({dim: 1.0})} />} />,
  },
  {at: 'Then from inside the sleeping', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="bag" />},

  // ================= 10. She Knew My Name =================
  {at: 'When I grabbed that radio', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="bag" label="TALK BUTTON STUCK" />},
  {at: 'Danny right', draw: (p) => <RadioCard t={p.t} frame={p.frame} state="bag" />},
  {
    at: 'I can hear you breathing',
    draw: (p) => {
      const j = jointsOf(POSES.lyingDown, LIE_X, 1180, hI(1180) * 0.9, 1);
      return (
        <GateScene p={p} a={{x: j.head[0], y: j.head[1], z: 4.6}} b={{x: j.head[0], y: j.head[1], z: 5.0}} filter="brightness(0.65)">
          <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={POSES.lyingDown} eyes="wide" sweat />
        </GateScene>
      );
    },
  },
  {
    at: "She didn't sound scared",
    draw: (p) => (
      <GateScene p={p} a={{x: 1560, y: 1060, z: 2.4}} b={{x: 1560, y: 1060, z: 2.6}} filter="brightness(0.65)">
        <SleepingBag x={1235} y={1112} s={0.9} glow={1} />
        <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={POSES.lyingDown} eyes="wide" />
      </GateScene>
    ),
  },
  {at: "Don't worry", draw: (p) => <RadioCard t={p.t} frame={p.frame} state="bag" />},
  {at: "You've got all the keys", draw: (p) => <KeyRing16 t={p.t} glowAt={0.3} />},
  {
    at: "I didn't say a word",
    draw: (p) => (
      <GateScene p={p} a={{x: 1400, y: 1150, z: 3.4}} b={{x: 1400, y: 1150, z: 3.6}} filter="brightness(0.6)">
        <SleepingBag x={1235} y={1112} s={0.9} glow={0.6} />
        <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={{...POSES.lyingDown, armN: [-20, 10]}} eyes="closed" />
      </GateScene>
    ),
  },
  {at: "That's okay", draw: (p) => <RadioCard t={p.t} frame={p.frame} state="bag" />},
  {at: 'Then the little light', ev: {out: 'went out'}, draw: (p) => <RadioCard t={p.t} frame={p.frame} state="bag" offAt={p.ev.out} />},
  {
    at: "I didn't sleep",
    draw: (p) => (
      <GateScene p={p} a={{x: 1640, y: 1040, z: 2.6}} b={{x: 1640, y: 1040, z: 2.75}} filter="brightness(0.55)">
        <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={POSES.lyingDown} eyes="dot" />
      </GateScene>
    ),
  },
  {
    at: 'listened to Marcus lean',
    draw: (p) => {
      const lean = Math.sin(p.t * 1.6) > 0.6;
      return (
        <GateScene p={p} a={{x: 1430, y: 690, z: 2.8}} b={{x: 1430, y: 690, z: 3.0}} filter="brightness(0.6)" shakeXY={lean ? [Math.sin(p.t * 40) * 3, 0] : [0, 0]} beyond={<Stick {...Marcus3({dim: 0.9, pose: lean ? POSES.zPress : POSES.frontPress})} />} />
      );
    },
  },
  {at: "Here's what bothered me", draw: (p) => <MapCard t={p.t} dur={p.dur} mode="keys" />},
  {
    at: 'The mall closes at nine',
    ev: {mid: 'midnight'},
    draw: (p) => (
      <Scene bg="concourse" a={FULL} b={{x: 1330, y: 880, z: 1.1}} p={p} screen={p.t >= p.ev.mid - 0.2 ? <TopClock text="12:00" ampm="AM" t={p.t - p.ev.mid + 0.3} /> : undefined}>
        <Guard x={1150} y={1420} h={hC(1420)} pose={POSES.walkLight} propN="flashlight" beam={520} />
      </Scene>
    ),
  },
  {
    at: 'The department store was locked',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 2280, y: 1000, z: 1.9}} b={{x: 2300, y: 990, z: 2.0}} p={p} screen={<Tag x={W / 2} y={190} text="LOCKED" t={p.t} at={0.3} size={84} anchor="middle" kind="ok" />}>
        <Guard x={2230} y={1330} h={hC(1330)} pose={POSES.rattle} />
        <Rattle x={2380} y={930} s={1.4} t={p.t} />
        <Padlock x={2380} y={1180} s={1.1} />
      </Scene>
    ),
  },
  {at: 'Nobody was in here', draw: (p) => <Scene bg="concourse" a={{x: 1408, y: 792, z: 1.0}} b={{x: 1408, y: 760, z: 1.15}} p={p} filter="brightness(0.85)" />},
  {
    at: 'So who was she',
    draw: (p) => (
      <Scene bg="deptstore" a={{x: 1408, y: 520, z: 2.0}} b={{x: 1408, y: 480, z: 2.4}} p={p} filter="brightness(0.55) saturate(0.6)">
        <path d={`M ${1250 + Math.sin(p.t * 1.3) * 120} 430 L ${1050 + Math.sin(p.t * 1.3) * 120} 620 L ${1300 + Math.sin(p.t * 1.3) * 120} 640 Z`} fill="#fff2c2" opacity={0.3} />
      </Scene>
    ),
  },

  // ================= 11. Rounds =================
  {
    at: "I don't remember falling",
    draw: (p) => (
      <GateScene p={p} a={{x: 1640, y: 1040, z: 2.6}} b={{x: 1640, y: 1040, z: 2.7}} filter="brightness(0.75) saturate(0.6)">
        <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={POSES.lyingDown} eyes="closed" />
      </GateScene>
    ),
  },
  {
    at: 'I remember waking up',
    draw: (p) => {
      const j = jointsOf(POSES.lyingDown, LIE_X, 1180, hI(1180) * 0.9, 1);
      return (
        <GateScene p={p} a={{x: j.head[0], y: j.head[1], z: 4.4}} b={{x: j.head[0], y: j.head[1], z: 4.6}} filter="brightness(0.85) saturate(0.6)">
          <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={POSES.lyingDown} eyes="wide" />
        </GateScene>
      );
    },
  },
  {at: 'Gray light', draw: (p) => <Scene bg="concourse" a={{x: 1408, y: 700, z: 1.0}} b={{x: 1408, y: 600, z: 1.15}} p={p} filter={MORNING} />},
  {
    at: 'I waited an hour',
    draw: (p) => (
      <GateScene p={p} a={{x: 1620, y: 980, z: 2.0}} b={{x: 1620, y: 980, z: 2.1}} filter="brightness(0.95) saturate(0.6)" screen={<TopClock text="7:40" ampm="AM" t={p.t} />}>
        <Guard x={LIE_X} y={1180} h={hI(1180) * 0.9} pose={POSES.lyingDown} eyes="dot" />
      </GateScene>
    ),
  },
  {
    at: 'Then I crawled to the gate',
    draw: (p) => (
      <GateScene p={p} a={{x: 1400, y: 860, z: 2.2}} b={{x: 1400, y: 860, z: 2.35}} filter="brightness(0.95) saturate(0.6)" gateOpacity={0.9}>
        <Guard x={1180 + p.t * 40} y={1060} h={hI(1060)} pose={POSES.crouchLock} eyes="wide" />
      </GateScene>
    ),
  },
  {
    at: 'Out in the hallway',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1408, y: 900, z: 1.4}} b={{x: 1408, y: 890, z: 1.5}} p={p} filter={MORNING}>
        {[
          [1100, 1060],
          [1700, 1020],
          [1420, 1200],
          [900, 1250],
          [1950, 1180],
        ].map(([x, y], i) => (
          <Zed key={i} k={i} x={x} y={y} h={hC(y)} face={i % 2 ? 1 : -1} pose={POSES.zLimp} />
        ))}
      </Scene>
    ),
  },
  {
    at: 'Like they were waiting',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 2150, y: 1000, z: 2.2}} b={{x: 2160, y: 995, z: 2.35}} p={p} filter={MORNING}>
        {[2060, 2220, 2370].map((x, i) => (
          <Zed key={i} k={i + 1} x={x} y={1120 + i * 20} h={hC(1120 + i * 20)} face={1} pose={POSES.zLimp} />
        ))}
      </Scene>
    ),
  },
  {at: 'In the daylight', draw: (p) => <Scene bg="concourse" a={{x: 1408, y: 792, z: 1.0}} b={{x: 1408, y: 792, z: 1.08}} p={p} filter={MORNING} />},
  {
    at: 'Then way off down',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1250, y: 760, z: 3.2}} b={{x: 1250, y: 760, z: 3.5}} p={p} filter={MORNING}>
        <Rattle x={1170} y={720} s={0.7} t={p.t} />
      </Scene>
    ),
  },
  {
    at: 'Then another one',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1000, y: 850, z: 2.2}} b={{x: 1000, y: 850, z: 2.35}} p={p} filter={MORNING}>
        <Rattle x={880} y={820} s={1.1} t={p.t} />
      </Scene>
    ),
  },
  {
    at: 'It was Marcus',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 2280, y: 1000, z: 1.9}} b={{x: 2300, y: 990, z: 2.0}} p={p} filter={MORNING}>
        <Stick x={2230} y={1330} h={hC(1330)} look={LOOKS.marcusZ} pose={POSES.rattle} eyes="zombie" mouth="zombie" />
        <Rattle x={2380} y={930} s={1.4} t={p.t} />
      </Scene>
    ),
  },
  {at: 'the way he did every single', draw: (p) => <MapCard t={p.t} dur={p.dur} mode="loop" />},
  {
    at: 'He shook mine too',
    draw: (p) => (
      <GateScene p={p} a={{x: 1430, y: 700, z: 2.6}} b={{x: 1430, y: 700, z: 2.8}} filter="brightness(1.0) saturate(0.6)" shakeXY={[Math.sin(p.t * 38) * 4, 0]} beyond={<Stick {...Marcus3({dim: 1.0, pose: POSES.rattle, front: false, face: -1})} />} over={<Rattle x={1430} y={640} s={1.4} t={p.t} />} />
    ),
  },
  {
    at: "He didn't even look in",
    draw: (p) => <GateScene p={p} a={{x: 1430, y: 700, z: 2.4}} b={{x: 1430, y: 700, z: 2.5}} filter="brightness(1.0) saturate(0.6)" beyond={<Stick {...Marcus3({dim: 1.0, pose: POSES.zShamble, front: false, face: 1, x: 1380 + p.t * 110})} />} />,
  },
  {
    at: 'Down by the escalator',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1560, y: 900, z: 2.4}} b={{x: 1570, y: 895, z: 2.55}} p={p} filter={MORNING}>
        <CleanerCart x={1720 + Math.abs(Math.sin(p.t * 2.2)) * 12} y={1050} s={0.9} />
        <Zed k={1} x={1610 + Math.abs(Math.sin(p.t * 2.2)) * 12} y={1052} h={hC(1052)} face={1} pose={{...POSES.zShamble, armN: [70, 85], armF: [65, 80]}} />
      </Scene>
    ),
  },
  {
    at: 'Over and over',
    draw: (p) => (
      <Scene bg="concourse" a={{x: 1680, y: 930, z: 3.4}} b={{x: 1680, y: 930, z: 3.6}} p={p} filter={MORNING}>
        <CleanerCart x={1720 + Math.abs(Math.sin(p.t * 2.2)) * 12} y={1050} s={0.9} />
        <Zed k={1} x={1610 + Math.abs(Math.sin(p.t * 2.2)) * 12} y={1052} h={hC(1052)} face={1} pose={{...POSES.zShamble, armN: [70, 85], armF: [65, 80]}} />
      </Scene>
    ),
  },
  {
    at: "That's when I figured out",
    ev: {snd: 'They follow sound', quiet: "when it's quiet"},
    draw: (p) => (
      <ListCard t={p.t} title="RULE ONE" lines={['THEY FOLLOW SOUND', 'IN THE QUIET, THEY GO', 'BACK TO THEIR HABITS']} at={[p.ev.snd - 0.1, p.ev.quiet - 0.1, p.ev.quiet + 0.5]} />
    ),
  },
  {
    at: 'I had breakfast',
    draw: (p) => (
      <GateScene p={p} a={{x: 1200, y: 800, z: 3.0}} b={{x: 1200, y: 800, z: 3.2}} filter="brightness(1.0) saturate(0.7)" gateOpacity={1}>
        <Guard {...insideGuardSit} pose={POSES.handMouth} eyes="closed" mouth="flat" />
      </GateScene>
    ),
  },
  {
    at: 'Summit Outdoors by daylight',
    draw: (p) => <Scene bg="sportsinside" a={{x: 1408, y: 792, z: 1.0}} b={{x: 1408, y: 820, z: 1.12}} p={p} filter="brightness(1.35) saturate(0.8)" />,
  },
  {
    at: 'and a cardboard bear',
    ev: {twice: 'twice'},
    draw: (p) => (
      <Scene bg="sportsinside" a={{x: 2150, y: 1000, z: 2.0}} b={{x: 2140, y: 1000, z: 2.15}} p={p} filter="brightness(1.3) saturate(0.8)" shakeXY={shake(p.t, p.ev.twice - 0.2, 8, 0.3)}>
        <CardboardBear x={2350} y={1260} s={1.4} />
        <Guard x={1950} y={1300} h={hI(1300) * 0.62} pose={POSES.scared} eyes="wide" mouth="o" />
      </Scene>
    ),
  },
  {at: 'Then my phone buzzed', draw: (p) => <PhoneCard t={p.t} mode="notify" />},
];

void Flash;
void Screen;
void MarcusAtGate;
