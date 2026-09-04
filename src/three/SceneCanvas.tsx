import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Starfield from "./Starfield";
import Nebula from "./Nebula";
import NeuralField from "./NeuralField";
import NeuralNetwork from "./NeuralNetwork";
import BlackHole from "./BlackHole";
import Atom from "./Atom";
import Planet from "./Planet";
import Computer from "./Computer";
import FloatingDebris from "./FloatingDebris";
import Comets from "./Comets";
import Effects from "./Effects";
import Rig from "./Rig";
import { STATIONS } from "./scene-state";
import { sceneMotion, prefersReducedMotion } from "../lib/motionPreference";

export default function SceneCanvas() {
  // sceneMotion() decides both, so "reduce motion" cannot end up meaning "fewer particles, same
  // animation" again — see src/lib/motionPreference.ts.
  const { quality, frameloop } = useMemo(
    () => sceneMotion({
      reduced: prefersReducedMotion(),
      width: typeof window === "undefined" ? 1280 : window.innerWidth,
      cores: (typeof navigator === "undefined" ? 8 : navigator.hardwareConcurrency) ?? 8,
    }),
    [],
  );

  const cfg = {
    high: { stars: 4200, nodes: 54, pulses: 48, disk: 2800, debris: 14, comets: 4, field: 72, fieldPulses: 28, bloom: true, lite: false, dpr: [1, 2] as [number, number] },
    medium: { stars: 2600, nodes: 40, pulses: 32, disk: 1700, debris: 10, comets: 3, field: 46, fieldPulses: 16, bloom: true, lite: true, dpr: [1, 1.6] as [number, number] },
    low: { stars: 1400, nodes: 26, pulses: 16, disk: 900, debris: 6, comets: 0, field: 26, fieldPulses: 0, bloom: false, lite: true, dpr: [1, 1.3] as [number, number] },
  }[quality];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        frameloop={frameloop}
        dpr={cfg.dpr}
        camera={{ position: [0, 0.5, 15], fov: 55, near: 0.1, far: 260 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        <color attach="background" args={["#03040a"]} />
        <fog attach="fog" args={["#03040a", 60, 150]} />

        <Suspense fallback={null}>
          {/* deep field — surrounds the whole universe */}
          <Starfield count={cfg.stars} />
          <Nebula />
          <NeuralField nodeCount={cfg.field} pulseCount={cfg.fieldPulses} />
          <FloatingDebris count={cfg.debris} />
          {cfg.comets > 0 && <Comets count={cfg.comets} />}

          {/* stations — the camera flies between these per route.
              Home's neural net is offset to the right so the hero text on the
              left stays clear (camera still looks at the origin). */}
          <group position={[6.8, 0.8, 0]}>
            <NeuralNetwork pulseCount={cfg.pulses} />
          </group>
          <group position={STATIONS.projects}>
            <Computer lite={cfg.lite} />
          </group>
          <group position={STATIONS.articles}>
            <BlackHole count={cfg.disk} />
          </group>
          <group position={STATIONS.about}>
            <Atom />
          </group>
          <group position={STATIONS.contact}>
            <Planet />
          </group>
        </Suspense>

        <Rig />
        {cfg.bloom && <Effects strong={quality === "high"} />}
      </Canvas>
    </div>
  );
}
