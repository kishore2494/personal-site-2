import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState } from "./scene-state";

/** A holographic wireframe planet with atmosphere, a ring and orbiting moons. */
export default function Planet() {
  const core = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);
  const moons = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const dt = sceneState.reduced ? delta * 0.3 : delta;
    if (core.current) core.current.rotation.y += dt * 0.12;
    if (wire.current) wire.current.rotation.y -= dt * 0.05;
    if (moons.current) moons.current.rotation.y += dt * 0.5;
  });

  return (
    <group>
      {/* surface */}
      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[3, 6]} />
          <meshBasicMaterial color="#0a2740" toneMapped={false} />
        </mesh>
        <mesh ref={wire}>
          <icosahedronGeometry args={[3.02, 3]} />
          <meshBasicMaterial color="#34d3ff" wireframe transparent opacity={0.5} toneMapped={false} />
        </mesh>
      </group>

      {/* atmosphere glow */}
      <mesh scale={1.18}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial
          color="#1fb6e6"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ring */}
      <mesh rotation={[1.9, 0.3, 0]}>
        <ringGeometry args={[4.2, 5.6, 96]} />
        <meshBasicMaterial
          color="#ffb454"
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* moons */}
      <group ref={moons} rotation={[0.4, 0, 0.2]}>
        <mesh position={[6.5, 0, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#cfe9ff" toneMapped={false} />
        </mesh>
        <mesh position={[-7.4, 0, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
