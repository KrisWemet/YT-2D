// Beat times in composition seconds (voice at VO_AT = 0.1 s). Word times from faster-whisper (images/pisa/words.json) + 0.1.
// Take 2 (hook re-cut): opens mid-earthquake with the result, opens a loop ("the same thing that made it lean"), closes it last.
export const FPS = 60;
export const VO_AT = 0.1;
export const DUR = 22.8;
export const T = {
  // "The Leaning Tower of Pisa has survived at least four strong earthquakes without damage."
  pisa: 0.9, survived: 1.36, four: 1.98, strong: 2.44, earthquakes: 3.0, without: 3.46, damage: 3.82, l1End: 4.28,
  // "And what's protecting it is the same thing that made it lean."
  and: 4.7, protecting: 4.9, same: 5.98, thing: 6.24, made: 6.7, lean: 7.12, l2End: 7.34,
  // "The ground under it is soft."
  theGround: 8.12, ground: 8.22, soft1: 8.98, l3End: 9.38,
  // "A tall, stiff tower on soft soil sways to a different rhythm than the shaking ground."
  tall: 10.22, stiff: 10.62, soft2: 11.48, soil2: 11.74, sways: 12.1, different: 13.42, rhythm: 13.68, shaking1: 14.24, l4a: 14.84,
  // "So the shaking doesn't build up."
  so: 15.48, shaking2: 15.74, doesnt: 15.98, build: 16.4, l4End: 16.88,
  // "Basically, the soil that tilted it is the soil that saves it."
  basically: 17.62, soil3: 18.56, tilted: 19.02, soil4: 20.4, saves: 21.26, l5End: 21.8,
} as const;
