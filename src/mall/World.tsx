import React, {useContext} from 'react';
import {ShortLayout} from './ShortLayout';
import {Img, staticFile} from 'remotion';

// Background sizes in pixels (Seedream 5 Flash 2K, 16:9).
export const BG_W = 2816;
export const BG_H = 1584;

export type BgName =
  | 'concourse'
  | 'exterior'
  | 'office'
  | 'garage'
  | 'foodcourt'
  | 'pharmacy'
  | 'deptstore'
  | 'sportsfront'
  | 'sportsinside'
  | 'busstop'
  | 'parkview'
  | 'roof'
  | 'stockroom'
  | 'apartment';

// Camera: centre point (image px) and zoom (1 = whole image fills the frame).
export type Cam = {x: number; y: number; z: number};
export const FULL: Cam = {x: BG_W / 2, y: BG_H / 2, z: 1};

export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});

// The camera window for an output shape: as wide as the picture allows at zoom z for a wide
// frame; for a tall frame (a vertical Short), the full height at z with the frame's own width,
// so a vertical shot can be centred anywhere across the picture. Kept inside the picture.
const camWindow = (c: Cam, width: number, height: number) => {
  const z = Math.max(1, c.z);
  const aspect = width / height;
  const tall = aspect < BG_W / BG_H;
  const h = tall ? BG_H / z : BG_W / z / aspect;
  const w = tall ? h * aspect : BG_W / z;
  const x = Math.min(BG_W - w / 2, Math.max(w / 2, c.x));
  const y = Math.min(BG_H - h / 2, Math.max(h / 2, c.y));
  return {x, y, w, h};
};

export const World: React.FC<{
  bg: BgName;
  cam: Cam;
  width: number;
  height: number;
  filter?: string;
  bgFilter?: string; // applied to the background picture only (e.g. day-for-night), under `filter`
  shake?: [number, number];
  children?: React.ReactNode;
  over?: React.ReactNode; // drawn above the characters, still in picture space
}> = ({bg, cam, width, height, filter, bgFilter, shake = [0, 0], children, over}) => {
  const vertical = useContext(ShortLayout);
  if (vertical) {
    width = 1080;
    height = 1920;
    cam = {...cam, x: vertical.focusX ?? cam.x, z: Math.max(1, cam.z * 0.6)};
  }
  const c = camWindow(cam, width, height);
  const vx = c.x - c.w / 2 + shake[0];
  const vy = c.y - c.h / 2 + shake[1];
  const vb = `${vx} ${vy} ${c.w} ${c.h}`;
  // The painting is an HTML <Img> (Remotion waits for it to load before taking the frame; an SVG
  // <image> isn't waited for, so the first frames after a cut could still show the last picture),
  // placed exactly where the SVG's "slice" viewBox puts picture pixels. The figures stay in the SVG.
  const s = Math.max(width / c.w, height / c.h);
  const left = (width - c.w * s) / 2 - vx * s;
  const top = (height - c.h * s) / 2 - vy * s;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden', filter}}>
      <Img src={staticFile(`mall/bg/${bg}.jpg`)} style={{position: 'absolute', left, top, width: BG_W * s, height: BG_H * s, maxWidth: 'none', filter: bgFilter}} />
      <svg width={width} height={height} viewBox={vb} preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', left: 0, top: 0}}>
        {children}
        {over}
      </svg>
    </div>
  );
};
