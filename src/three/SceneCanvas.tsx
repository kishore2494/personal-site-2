import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Starfield from "./Starfield";
import Nebula from "./Nebula";
import NeuralField from "./NeuralField";
import NeuralConstellation from "./NeuralConstellation";
import BlackHole from "./BlackHole";
import Atom from "./Atom";
import Planet from "./Planet";
import Computer from "./Computer";
import FloatingDebris from "./FloatingDebris";
import Comets from "./Comets";
import Effects from "./Effects";
import Rig from "./Rig";
import { STATIONS } from "./scene-state";

type Quality = "high" | "medium" | "low";

function detectQuality(): Quality {
  if (typeof window === "undefined") return "high";
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const narrow = window.innerWidth < 760;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (reduced || cores <= 4) return "low";
  if (narrow) return "medium";
  return "high";
}

export default function SceneCanvas() {
  const quality = useMemo(detectQuality, []);

  const cfg = {
    high: { stars: 4200, nodes: 42, pulses: 18, disk: 2800, debris: 14, comets: 4, field: 72, fieldPulses: 28, bloom: true, lite: false, dpr: [1, 2] as [number, number] },
    medium: { stars: 2600, nodes: 32, pulses: 12, disk: 1700, debris: 10, comets: 3, field: 46, fieldPulses: 16, bloom: true, lite: true, dpr: [1, 1.6] as [number, number] },
    low: { stars: 1400, nodes: 22, pulses: 7, disk: 900, debris: 6, comets: 0, field: 26, fieldPulses: 0, bloom: false, lite: true, dpr: [1, 1.3] as [number, number] },
  }[quality];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
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

          {/* stations — the camera flies between these per route */}
          <group position={STATIONS.home}>
            <NeuralConstellation nodeCount={cfg.nodes} pulseCount={cfg.pulses} />
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
