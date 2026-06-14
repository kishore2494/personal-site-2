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

// three electron orbits at different inclinations
const ORBITS: { radius: number; rot: [number, number, number]; speed: number; warm: boolean }[] = [
  { radius: 3.4, rot: [0.4, 0, 0], speed: 1.1, warm: false },
  { radius: 3.4, rot: [1.7, 0.9, 0], speed: -0.9, warm: true },
  { radius: 3.4, rot: [-1.0, -0.8, 0.4], speed: 1.3, warm: false },
];

function Orbit({ radius, rot, speed, warm }: (typeof ORBITS)[number]) {
  const electron = useRef<THREE.Mesh>(null);
  const angle = useRef(Math.random() * Math.PI * 2);
  const color = warm ? "#ffb454" : "#34d3ff";

  useFrame((_, delta) => {
    angle.current += speed * (sceneState.reduced ? delta * 0.3 : delta);
    if (electron.current) {
      electron.current.position.set(
        Math.cos(angle.current) * radius,
        0,
        Math.sin(angle.current) * radius,
      );
    }
  });

  return (
    <group rotation={rot}>
      {/* orbit ring (lies in XZ plane) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.018, 12, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* electron */}
      <mesh ref={electron}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Atom() {
  const group = useRef<THREE.Group>(null);
  const nucleus = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const glow = useMemo(() => makeGlowTexture("rgba(255,200,120,0.8)", "rgba(255,120,40,0)"), []);

  const nucleons = useMemo(() => {
    const rand = rng(5);
    const N = 14;
    const items: { pos: THREE.Vector3; color: THREE.Color }[] = [];
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5)
        .normalize()
        .multiplyScalar(0.35 + rand() * 0.45);
      items.push({
        pos: v,
        color: new THREE.Color(rand() > 0.5 ? "#ff7a3c" : "#9fb4c8").multiplyScalar(1.3),
      });
    }
    return items;
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * (sceneState.reduced ? 0.05 : 0.18);
    const mesh = nucleus.current;
    if (mesh && !(mesh.userData.init as boolean)) {
      nucleons.forEach((n, i) => {
        dummy.position.copy(n.pos);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, n.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.userData.init = true;
    }
  });

  return (
    <group ref={group}>
      {/* nucleus glow */}
      <sprite scale={[3, 3, 1]}>
        <spriteMaterial
          map={glow}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.7}
        />
      </sprite>

      {/* nucleons */}
      <instancedMesh ref={nucleus} args={[undefined, undefined, nucleons.length]}>
        <sphereGeometry args={[0.32, 18, 18]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {ORBITS.map((o, i) => (
        <Orbit key={i} {...o} />
      ))}
    </group>
  );
}
