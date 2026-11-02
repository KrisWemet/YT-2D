// Beat times in composition seconds (voice at VO_AT = 0.1 s). Word times from faster-whisper (images/tickle/words.json) + 0.1.
export const FPS = 60;
export const VO_AT = 0.1;
export const DUR = 21.0;
export const T = {
  // "Why can't you tickle yourself?"
  tickle: 0.7, yourself: 1.02, l1End: 1.38,
  // "Because your brain sees it coming."
  because: 2.32, brain: 2.68, sees: 2.92, coming: 3.38, l2End: 3.66,
  // "Every time you move, it predicts what you're about to feel, and turns that feeling down."
  every: 4.22, move: 4.78, predicts: 5.24, feel: 6.18, turns: 6.92, feeling: 7.42, down: 7.68, l3End: 8.0,
  // "In one experiment, people tickled their own hand through a robot."
  experiment: 9.2, people: 9.7, tickled: 9.86, hand: 10.62, robot: 11.22, l4End: 11.52,
  // "When the robot waited just a fifth of a second,"
  when: 12.26, waited: 12.74, fifth: 13.5, second: 13.94, l5End: 14.2,
  // "it felt about as tickly as someone else doing it."
  felt: 14.86, tickly: 15.46, someone: 15.98, doing: 16.36, l6End: 16.92,
  // "Basically, it only tickles when your brain can't predict it."
  basically: 17.48, tickles: 18.26, yourBrain: 19.0, cant: 19.3, predict: 19.64, l7End: 20.0,
} as const;
