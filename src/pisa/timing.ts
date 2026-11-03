// Beat times in composition seconds (voice at VO_AT = 0.1 s). Word times from faster-whisper (images/pisa/words.json) + 0.1.
export const FPS = 60;
export const VO_AT = 0.1;
export const DUR = 22.2;
export const T = {
  // "The soft ground that makes the Leaning Tower of Pisa lean also helps keep it standing."
  soft: 0.28, ground: 0.58, leaning: 1.62, pisa: 2.58, lean: 2.76, also: 3.7, helps: 4.02, keep: 4.28, standing: 4.62, l1End: 5.04,
  // "It's survived at least four strong earthquakes since twelve-eighty."
  survived: 6.04, four: 6.66, strong: 7.08, earthquakes: 7.54, since: 7.94, y1280: 8.36, l2End: 8.84,
  // "Engineers found that a tall, stiff tower on soft soil"
  engineers: 9.76, tall: 10.54, stiff: 10.96, soft2: 11.88, soil2: 12.14,
  // "sways to a different rhythm than the ground,"
  sways: 12.5, different: 13.48, rhythm: 13.72, ground2: 14.38, l4a: 14.68,
  // "so the shaking doesn't build up."
  so: 15.12, shaking: 15.64, doesnt: 15.94, build: 16.4, l4End: 16.92,
  // "Basically, the same soil that tilted it is what protects it."
  basically: 17.6, same: 18.54, soil3: 18.76, tilted: 19.28, protects: 20.56, l5End: 21.14,
} as const;
