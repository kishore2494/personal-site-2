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

const HOT = new THREE.Color("#bfe9ff");
const MID = new THREE.Color("#ffb454");
const COOL = new THREE.Color("#ff5a2c");

export default function BlackHole({ count = 2600 }: { count?: number }) {
  const disk = useRef<THREE.Points>(null);
  const ring = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  const glow = useMemo(() => makeGlowTexture(), []);

  const { geo, radii, angles, speeds } = useMemo(() => {
    const rand = rng(99);
    const inner = 2.3;
    const outer = 7.2;
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const speeds = new Float32Array(count);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // bias toward inner radius for a denser hot core
      const u = rand();
      const r = inner + (outer - inner) * Math.pow(u, 1.7);
      radii[i] = r;
      angles[i] = rand() * Math.PI * 2;
      speeds[i] = (1.7 / Math.sqrt(r)) * (0.9 + rand() * 0.2); // Keplerian-ish

      const tnorm = (r - inner) / (outer - inner);
      if (tnorm < 0.5) tmp.copy(HOT).lerp(MID, tnorm * 2);
      else tmp.copy(MID).lerp(COOL, (tnorm - 0.5) * 2);
      const b = 1.4 - tnorm * 0.7;
      colors[i * 3] = tmp.r * b;
      colors[i * 3 + 1] = tmp.g * b;
      colors[i * 3 + 2] = tmp.b * b;

      const thick = (rand() - 0.5) * (0.25 + tnorm * 0.5);
      positions[i * 3] = Math.cos(angles[i]) * r;
      positions[i * 3 + 1] = thick;
      positions[i * 3 + 2] = Math.sin(angles[i]) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geo, radii, angles, speeds };
  }, [count]);

  useFrame((_, delta) => {
    const dt = sceneState.reduced ? delta * 0.3 : delta;
    if (disk.current) {
      const attr = disk.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < radii.length; i++) {
        angles[i] += speeds[i] * dt;
        const r = radii[i];
        arr[i * 3] = Math.cos(angles[i]) * r;
        arr[i * 3 + 2] = Math.sin(angles[i]) * r;
      }
      attr.needsUpdate = true;
    }
    if (group.current) group.current.rotation.y += dt * 0.05;
    if (ring.current) {
      const t = (performance?.now?.() ?? 0) / 1000;
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * Math.sin(t * 2);
    }
  });

  return (
    <group ref={group}>
      {/* event horizon */}
      <mesh>
        <sphereGeometry args={[1.7, 48, 48]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      {/* dark gravity halo (slightly bends light look) */}
      <mesh>
        <sphereGeometry args={[2.05, 48, 48]} />
        <meshBasicMaterial color="#0a0a12" transparent opacity={0.6} side={THREE.BackSide} />
      </mesh>

      {/* tilted accretion disk + photon ring */}
      <group rotation={[-1.15, 0, 0.25]}>
        <points ref={disk} geometry={geo}>
          <pointsMaterial
            size={0.13}
            map={glow}
            vertexColors
            transparent
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>

        <mesh ref={ring}>
          <torusGeometry args={[2.15, 0.05, 16, 120]} />
          <meshBasicMaterial
            color="#ffe6c0"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
