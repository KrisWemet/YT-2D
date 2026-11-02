// Beat times in composition seconds (voice placed at VO_AT). Word times from faster-whisper + RMS pauses.
export const FPS = 60;
export const VO_AT = 0.1;
export const DUR = 24.9;
export const T = {
  // line 1: "A walking pigeon's head never actually moves backward."
  walking: 0.26, head: 1.06, never: 1.18, actually: 1.44, moves: 1.84, backward: 2.22, l1End: 2.7,
  // line 2: "It freezes in place while the body moves forward, then darts ahead."
  freezes: 3.38, inPlace: 3.66, while: 4.22, body: 4.48, forward: 5.08, then: 5.62, darts: 5.72, ahead: 6.04, l2End: 6.38,
  // line 3: "You'd think that's for balance."
  youd: 7.22, think: 7.4, balance: 7.88, l3End: 8.3,
  // line 4: "But when scientists put pigeons on a treadmill, the bobbing stopped."
  cutLab: 8.94, scientists: 9.32, put: 9.72, pigeons: 10.04, treadmill: 10.82, bobbing: 11.82, stopped: 12.22, l4End: 12.6,
  // line 5: "Their legs kept walking, but their view never changed."
  legs: 13.4, kept: 13.6, walking2: 13.88, but: 14.46, view: 14.84, never2: 15.1, changed: 15.38, l5End: 15.84,
  // line 6: "So it's mostly about vision."
  cutClose: 16.4, so: 16.48, mostly: 16.78, vision: 17.28, l6End: 17.62,
  // line 7: "Each freeze gives a steady view, like holding a camera still, which probably helps them spot movement."
  cutStreet2: 17.96, each: 18.38, freeze: 18.54, steady: 19.58, view2: 19.86, l7aEnd: 20.2,
  cutCam: 20.42, like: 20.7, holding: 20.88, camera: 21.3, still: 21.56, l7bEnd: 21.86,
  cutStreet3: 22.3, which: 22.5, probably: 22.7, helps: 23.1, spot: 23.68, movement: 23.96, end: 24.24,
} as const;
