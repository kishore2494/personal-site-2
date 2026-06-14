import * as THREE from "three";

/** A soft circular gradient sprite — used for nebula clouds and glow points. */
export function makeGlowTexture(
  inner = "rgba(255,255,255,1)",
  outer = "rgba(255,255,255,0)",
  size = 256,
): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, inner);
  g.addColorStop(0.45, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
