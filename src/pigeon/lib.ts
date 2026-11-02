// Small math helpers: easing, keyframes, springs, camera.
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const inv = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const smooth = (u: number) => u * u * (3 - 2 * u);
export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeOutBack = (u: number, s = 1.7) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
export const easeInOutSine = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;

/** Damped spring response to a step at t=0 (0 -> 1), t in seconds. */
export const spring = (t: number, freq = 4, zeta = 0.35) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};
/** Decaying wobble (starts at 0, oscillates, dies out). */
export const wobble = (t: number, freq = 3, decay = 3) => (t <= 0 ? 0 : Math.sin(2 * Math.PI * freq * t) * Math.exp(-decay * t));

/** Pop-in scale: 0 -> overshoot -> 1 over `dur` seconds starting at t0; pop-out if t1 given. */
export const pop = (t: number, t0: number, t1 = Infinity, dur = 0.28) => {
  if (t < t0) return 0;
  const a = clamp((t - t0) / dur);
  let s = a >= 1 ? 1 : easeOutBack(a, 2.4);
  if (t > t1) s *= 1 - easeInCubic(clamp((t - t1) / 0.18));
  return Math.max(0, s);
};

type Ease = (u: number) => number;
/** Piecewise keyframes: [[time, value, easeIntoThisKey?], ...] */
export const key = (t: number, ks: Array<[number, number, Ease?]>) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1];
      const [t1, v1, e] = ks[i];
      const u = (t - t0) / (t1 - t0);
      return lerp(v0, v1, (e ?? easeInOutCubic)(u));
    }
  }
  return ks[ks.length - 1][1];
};

/** Camera: x, y in world px at depth 1000; k = scale of the depth-1000 plane. z derived. */
export type Cam = {x: number; y: number; z: number};
export const camFromK = (x: number, y: number, k: number): Cam => ({x, y, z: 1000 - 1000 / k});

/** Camera keyframes interpolated with log-space zoom. */
export const camKeys = (t: number, ks: Array<[number, number, number, number, Ease?]>): Cam => {
  if (t <= ks[0][0]) return camFromK(ks[0][1], ks[0][2], ks[0][3]);
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, x0, y0, k0] = ks[i - 1];
      const [t1, x1, y1, k1, e] = ks[i];
      const u = (e ?? easeInOutCubic)((t - t0) / (t1 - t0));
      return camFromK(lerp(x0, x1, u), lerp(y0, y1, u), Math.exp(lerp(Math.log(k0), Math.log(k1), u)));
    }
  }
  const l = ks[ks.length - 1];
  return camFromK(l[1], l[2], l[3]);
};

/** Monotone cubic (Fritsch-Carlson) interpolation through points (xs ascending). */
export const monotone = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d[i];
      m[i + 1] = tau * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const u = (x - xs[i]) / h;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10 = u ** 3 - 2 * u ** 2 + u;
    const h01 = -2 * u ** 3 + 3 * u ** 2;
    const h11 = u ** 3 - u ** 2;
    return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
  };
};

/** Screen shake from sums of sines, amplitude in screen px. */
export const shake = (t: number, amp: number) => ({
  x: amp * (0.6 * Math.sin(2 * Math.PI * 13.3 * t) + 0.4 * Math.sin(2 * Math.PI * 7.1 * t + 1.3)),
  y: amp * (0.6 * Math.sin(2 * Math.PI * 11.7 * t + 0.7) + 0.4 * Math.sin(2 * Math.PI * 5.3 * t + 2.1)),
});

/** Gentle impact shakes (screen px), added to the camera so no frame edge shows. */
export const SHAKES: Array<[number, number, number]> = [ // at, amplitude px, decay s
  [2.28, 7, 0.12], // X stamp
  [10.3, 6, 0.1], // pigeon lands on the treadmill
  [24.02, 3.5, 0.08], // crumb snapped
];
export const withShake = (cam: Cam, t: number): Cam => {
  let a = 0;
  for (const [at, amp, tau] of SHAKES) if (t >= at) a += amp * Math.exp(-(t - at) / tau);
  if (a < 0.05) return cam;
  const s = shake(t, a);
  const k = 1000 / (1000 - cam.z);
  return {...cam, x: cam.x + s.x / k, y: cam.y + s.y / k};
};
