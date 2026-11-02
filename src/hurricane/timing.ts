// Beat times in composition seconds (voice at VO_AT = 0.1 s). Word times from faster-whisper + RMS pauses.
export const FPS = 60;
export const VO_AT = 0.1;
export const DUR = 20.6;
export const T = {
  // "Why don't we just nuke a hurricane?"
  nuke: 0.66, hurricane: 1.12, l1End: 1.56,
  // "Because the hurricane is way stronger than the bomb."
  because: 2.38, way: 3.2, stronger: 3.6, bomb1: 4.4, l2End: 4.72, boom: 4.8,
  // "A big one gives off as much heat as a ten-megaton nuclear bomb every twenty minutes."
  bigOne: 5.26, givesOff: 5.7, heat: 6.36, megaton: 6.88, nuclear: 7.6, bomb2: 8.0, every: 8.36, twenty: 8.56, minutes: 8.88, l3End: 9.16,
  // "So one more bomb might not even slow it down."
  so: 10.12, oneMore: 10.26, bomb3: 10.9, might: 11.3, slow: 12.14, l4End: 12.86,
  // "And the trade winds would carry the radioactive fallout straight to land."
  and: 13.44, tradeWinds: 13.76, carry: 14.38, radioactive: 14.78, fallout: 15.26, straight: 15.76, land: 16.42, l5End: 16.7,
  // "You'd probably keep the storm and add radiation."
  youd: 17.38, storm: 18.1, addRad: 18.54, radiation: 18.78, l6End: 19.2,
  another: 19.95, // pulls out another bomb (loop back to frame 0)
} as const;
