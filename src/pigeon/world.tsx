import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Cam} from './lib';

/** A flat layer at depth z seen by the multiplane camera (F = 1000). World coords inside. */
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; opacity?: number; children: React.ReactNode}> = ({
  cam, z, blur = 0, minDepth = 300, opacity, children,
}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined, opacity}}>
      <div
        style={{
          position: 'absolute', left: 0, top: 0, transformOrigin: '0 0',
          transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Screen position of a world point on a layer at depth z. */
export const toScreen = (cam: Cam, z: number, x: number, y: number) => {
  const k = 1000 / (z - cam.z);
  return {x: 540 + k * (x - cam.x), y: 960 + k * (y - cam.y), k};
};

/** Group placed at a world point; children use local coords (rotation/scale about the point). */
export const Pos: React.FC<{x: number; y: number; s?: number; sx?: number; sy?: number; rot?: number; opacity?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  x, y, s = 1, sx = 1, sy = 1, rot = 0, opacity, style, children,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transformOrigin: '0 0', transform: `rotate(${rot}deg) scale(${s * sx}, ${s * sy})`, opacity, ...style}}>
    {children}
  </div>
);

/** A picture whose anchor (ax, ay) in picture px sits at the parent's origin. */
export const Pic: React.FC<{file: string; w: number; h: number; ax?: number; ay?: number; flip?: boolean; style?: React.CSSProperties}> = ({file, w, h, ax = 0, ay = 0, flip, style}) => (
  <Img
    src={staticFile(file)}
    style={{position: 'absolute', left: -ax, top: -ay, width: w, height: h, maxWidth: 'none', transform: flip ? 'scaleX(-1)' : undefined, transformOrigin: `${ax}px ${ay}px`, ...style}}
  />
);
