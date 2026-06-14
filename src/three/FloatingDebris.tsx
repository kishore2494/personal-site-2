import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState } from "./scene-state";

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Shape = {
  kind: number;
  pos: [number, number, number];
  scale: number;
  rotSpeed: [number, number, number];
  phase: number;
  warm: boolean;
};

/** Wireframe polyhedra scattered through the void — seen while flying between stations. */
export default function FloatingDebris({ count = 16 }: { count?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const shapes = useMemo<Shape[]>(() => {
    const rand = rng(31);
    return Array.from({ length: count }, () => ({
      kind: Math.floor(rand() * 4),
      pos: [(rand() - 0.5) * 78, (rand() - 0.5) * 64, (rand() - 0.5) * 26] as [number, number, number],
      scale: 0.5 + rand() * 1.6,
      rotSpeed: [(rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.3] as [number, number, number],
      phase: rand() * Math.PI * 2,
      warm: rand() > 0.7,
    }));
  }, [count]);

  useFrame((_, delta) => {
    const t = (performance?.now?.() ?? 0) / 1000;
    const dt = sceneState.reduced ? delta * 0.3 : delta;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const s = shapes[i];
      m.rotation.x += s.rotSpeed[0] * dt;
      m.rotation.y += s.rotSpeed[1] * dt;
      m.rotation.z += s.rotSpeed[2] * dt;
      m.position.y = s.pos[1] + Math.sin(t * 0.3 + s.phase) * 1.2;
    });
  });

  return (
    <group>
      {shapes.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={s.pos}
          scale={s.scale}
        >
          {s.kind === 0 && <icosahedronGeometry args={[1, 0]} />}
          {s.kind === 1 && <octahedronGeometry args={[1, 0]} />}
          {s.kind === 2 && <torusGeometry args={[0.8, 0.28, 8, 18]} />}
          {s.kind === 3 && <dodecahedronGeometry args={[1, 0]} />}
          <meshBasicMaterial
            color={s.warm ? "#ffb454" : "#2aa9d6"}
            wireframe
            transparent
            opacity={0.22}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
