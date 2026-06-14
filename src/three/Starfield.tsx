import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { sceneState } from "./scene-state";

/** Layered deep-space starfield with subtle pointer parallax + slow drift. */
export default function Starfield({ count = 4500 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const speed = sceneState.reduced ? 0.2 : 1;
    group.current.rotation.y += delta * 0.008 * speed;
    group.current.rotation.x += delta * 0.002 * speed;
    // parallax toward pointer
    const px = sceneState.pointer.x * 0.12;
    const py = sceneState.pointer.y * 0.12;
    group.current.position.x += (px * 2 - group.current.position.x) * Math.min(1, delta);
    group.current.position.y += (-py * 2 - group.current.position.y) * Math.min(1, delta);
  });

  return (
    <group ref={group}>
      <Stars radius={60} depth={50} count={count} factor={3.2} saturation={0} fade speed={0.6} />
      <Stars radius={90} depth={40} count={Math.round(count * 0.5)} factor={5} saturation={0} fade speed={0.3} />
    </group>
  );
}
