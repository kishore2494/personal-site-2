import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ErrorBoundary } from "./ErrorBoundary";
import { sceneState } from "./scene-state";

const MODEL_URL = `${import.meta.env.BASE_URL}desktop_pc/scene.gltf`;

/** The real GLTF workstation. */
function GLTFComputer() {
  const { scene } = useGLTF(MODEL_URL);
  return (
    <primitive object={scene} scale={0.62} position={[0, -3.0, 0]} rotation={[-0.05, -0.35, 0]} />
  );
}
useGLTF.preload(MODEL_URL);

/** Holographic retro-terminal fallback (shown while loading or if the model fails). */
function ProceduralComputer() {
  const screen = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = (performance?.now?.() ?? 0) / 1000;
    if (screen.current) {
      (screen.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.25 * Math.sin(t * 3);
    }
  });
  return (
    <group position={[0, -0.5, 0]}>
      {/* monitor body */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[5, 3.2, 0.4]} />
        <meshBasicMaterial color="#0a1422" toneMapped={false} />
      </mesh>
      {/* glowing screen */}
      <mesh ref={screen} position={[0, 1.6, 0.23]}>
        <planeGeometry args={[4.5, 2.7]} />
        <meshBasicMaterial color="#34d3ff" transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {/* screen wireframe overlay */}
      <mesh position={[0, 1.6, 0.25]}>
        <planeGeometry args={[4.5, 2.7, 9, 6]} />
        <meshBasicMaterial color="#7fe8ff" wireframe transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {/* stand */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.2, 12]} />
        <meshBasicMaterial color="#13314a" toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[1, 1.2, 0.2, 24]} />
        <meshBasicMaterial color="#13314a" toneMapped={false} />
      </mesh>
      {/* keyboard */}
      <mesh position={[0, -1.0, 1.7]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[4, 0.18, 1.4]} />
        <meshBasicMaterial color="#0a1422" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Computer({ lite = false }: { lite?: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      // gentle showcase rotation, eased by pointer
      const target = sceneState.pointer.x * 0.3;
      group.current.rotation.y += (target - group.current.rotation.y) * Math.min(1, delta * 1.2);
      group.current.position.y = Math.sin((performance?.now?.() ?? 0) / 1400) * 0.2;
    }
  });

  return (
    <group>
      {/* lighting — only the GLTF (standard materials) responds; everything else is unlit */}
      <ambientLight intensity={0.7} />
      <pointLight position={[4, 6, 6]} intensity={120} color="#9fe6ff" distance={40} />
      <pointLight position={[-6, 2, 4]} intensity={80} color="#ffb454" distance={40} />
      <spotLight position={[0, 10, 8]} angle={0.6} penumbra={1} intensity={150} color="#ffffff" distance={50} />

      <group ref={group}>
        {lite ? (
          <ProceduralComputer />
        ) : (
          <ErrorBoundary fallback={<ProceduralComputer />}>
            <Suspense fallback={<ProceduralComputer />}>
              <GLTFComputer />
            </Suspense>
          </ErrorBoundary>
        )}
      </group>

      {/* holo base ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <ringGeometry args={[4, 4.3, 64]} />
        <meshBasicMaterial color="#34d3ff" transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}
