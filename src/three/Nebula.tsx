import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGlowTexture } from "./textures";
import { sceneState } from "./scene-state";

type Cloud = {
  pos: [number, number, number];
  scale: number;
  color: "cyan" | "amber" | "violet";
  drift: number;
  phase: number;
};

const CLOUDS: Cloud[] = [
  { pos: [-9, 3, -14], scale: 22, color: "cyan", drift: 0.6, phase: 0 },
  { pos: [11, -4, -18], scale: 28, color: "violet", drift: 0.4, phase: 1.7 },
  { pos: [6, 6, -12], scale: 16, color: "amber", drift: 0.7, phase: 3.1 },
  { pos: [-12, -6, -20], scale: 30, color: "cyan", drift: 0.3, phase: 4.4 },
  { pos: [2, -9, -16], scale: 18, color: "amber", drift: 0.5, phase: 2.2 },
];

export default function Nebula() {
  const group = useRef<THREE.Group>(null);
  const sprites = useRef<THREE.Sprite[]>([]);

  const textures = useMemo(
    () => ({
      cyan: makeGlowTexture("rgba(52,211,255,0.55)", "rgba(52,211,255,0)"),
      amber: makeGlowTexture("rgba(255,180,84,0.5)", "rgba(255,180,84,0)"),
      violet: makeGlowTexture("rgba(150,120,255,0.45)", "rgba(150,120,255,0)"),
    }),
    [],
  );

  const materials = useMemo(
    () =>
      ({
        cyan: new THREE.SpriteMaterial({
          map: textures.cyan,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0.5,
        }),
        amber: new THREE.SpriteMaterial({
          map: textures.amber,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0.45,
        }),
        violet: new THREE.SpriteMaterial({
          map: textures.violet,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0.4,
        }),
      }) as const,
    [textures],
  );

  useFrame((_, delta) => {
    const t = (performance?.now?.() ?? 0) / 1000;
    if (group.current) {
      // gentle parallax toward the pointer
      group.current.position.x +=
        (sceneState.pointer.x * 1.4 - group.current.position.x) * Math.min(1, delta * 1.5);
      group.current.position.y +=
        (-sceneState.pointer.y * 0.9 - group.current.position.y) * Math.min(1, delta * 1.5);
    }
    sprites.current.forEach((s, i) => {
      if (!s) return;
      const c = CLOUDS[i];
      s.position.y = c.pos[1] + Math.sin(t * 0.18 * c.drift + c.phase) * 1.4;
      s.position.x = c.pos[0] + Math.cos(t * 0.12 * c.drift + c.phase) * 1.1;
      // accent shifts emphasis between cool (cyan/violet) and warm (amber)
      const warm = sceneState.accent;
      const base =
        c.color === "amber" ? 0.14 + warm * 0.4 : 0.4 - warm * 0.22;
      (s.material as THREE.SpriteMaterial).opacity =
        base * (0.85 + 0.15 * Math.sin(t * 0.5 + c.phase));
    });
  });

  return (
    <group ref={group}>
      {CLOUDS.map((c, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) sprites.current[i] = el;
          }}
          position={c.pos}
          scale={[c.scale, c.scale, 1]}
          material={materials[c.color]}
        />
      ))}
    </group>
  );
}
