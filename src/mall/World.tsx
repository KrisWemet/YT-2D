import React from 'react';
import {staticFile} from 'remotion';

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
  shake?: [number, number];
  children?: React.ReactNode;
  over?: React.ReactNode; // drawn above the characters, still in picture space
}> = ({bg, cam, width, height, filter, shake = [0, 0], children, over}) => {
  const c = camWindow(cam, width, height);
  const vb = `${c.x - c.w / 2 + shake[0]} ${c.y - c.h / 2 + shake[1]} ${c.w} ${c.h}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={vb}
      preserveAspectRatio="xMidYMid slice"
      style={{position: 'absolute', inset: 0, filter}}
    >
      <image href={staticFile(`mall/bg/${bg}.jpg`)} x={0} y={0} width={BG_W} height={BG_H} />
      {children}
      {over}
    </svg>
  );
};
