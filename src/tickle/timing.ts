// Beat times in composition seconds (voice at VO_AT = 0.1 s). Word times from faster-whisper (images/tickle/words.json) + 0.1.
// Take 2 (hook re-cut): opens on the payoff claim, explains, and ends back on it, so the narration loops with the picture.
export const FPS = 60;
export const VO_AT = 0.1;
export const DUR = 19.0;
export const T = {
  // "You can tickle yourself."
  you: 0.1, tickle: 0.42, yourself: 0.76, l1End: 1.06,
  // "You just need a robot and a fifth of a second."
  need: 1.42, robot1: 1.82, fifth1: 2.36, second1: 2.78, l2End: 3.04,
  // "Your brain predicts what your own touch will feel like and turns it down, so it barely registers."
  your: 3.38, brain: 3.46, predicts: 3.78, touch: 4.82, feel: 5.3, turns: 5.86, down: 6.38, barely: 7.42, registers: 7.74, l3End: 8.2,
  // "But in one experiment, people tickled their own hand through a robot."
  but: 8.92, experiment: 9.26, people: 9.82, tickled: 9.98, hand: 10.72, robot2: 11.32, l4End: 11.64,
  // "When the robot waited a fifth of a second,"
  when: 12.38, waited: 12.86, fifth2: 13.56, second2: 13.86, l5End: 14.16,
  // "the prediction was off,"
  prediction: 14.68, off: 15.24, l6End: 15.54,
  // "and it felt about as tickly as someone else doing it."
  felt: 16.26, tickly: 16.78, someone: 17.32, doing: 17.76, l7End: 18.22,
} as const;
