import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGlowTexture } from "./textures";
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

type Comet = { start: THREE.Vector3; dir: THREE.Vector3; len: number; speed: number; t: number };

/** Occasional comets streaking across the deep field. */
export default function Comets({ count = 4 }: { count?: number }) {
  const heads = useRef<(THREE.Sprite | null)[]>([]);
  const tails = useRef<(THREE.Sprite | null)[]>([]);
  const glow = useMemo(() => makeGlowTexture("rgba(200,240,255,0.95)", "rgba(120,200,255,0)"), []);

  const comets = useMemo<Comet[]>(() => {
    const rand = rng(13);
    return Array.from({ length: count }, () => {
      const start = new THREE.Vector3((rand() - 0.5) * 70, (rand() - 0.5) * 60, (rand() - 0.5) * 20);
      const dir = new THREE.Vector3(rand() - 0.5, rand() - 0.5, (rand() - 0.5) * 0.3).normalize();
      return { start, dir, len: 50 + rand() * 40, speed: 6 + rand() * 8, t: rand() };
    });
  }, [count]);

  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = sceneState.reduced ? 0 : delta;
    comets.forEach((c, i) => {
      c.t += (dt * c.speed) / c.len;
      if (c.t > 1.3) c.t = -0.3;
      const travel = c.t * c.len;
      pos.copy(c.dir).multiplyScalar(travel).add(c.start);
      const head = heads.current[i];
      const tail = tails.current[i];
      const visible = c.t > 0 && c.t < 1;
      if (head) {
        head.position.copy(pos);
        (head.material as THREE.SpriteMaterial).opacity = visible ? 0.9 : 0;
      }
      if (tail) {
        tail.position.copy(pos).addScaledVector(c.dir, -1.2);
        (tail.material as THREE.SpriteMaterial).opacity = visible ? 0.35 : 0;
      }
    });
  });

  return (
    <group>
      {comets.map((_, i) => (
        <group key={i}>
          <sprite ref={(el) => (heads.current[i] = el)} scale={[1.1, 1.1, 1]}>
            <spriteMaterial map={glow} blending={THREE.AdditiveBlending} transparent depthWrite={false} toneMapped={false} />
          </sprite>
          <sprite ref={(el) => (tails.current[i] = el)} scale={[3.2, 0.5, 1]}>
            <spriteMaterial map={glow} blending={THREE.AdditiveBlending} transparent depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
      ))}
    </group>
  );
}
