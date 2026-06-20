import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGlowTexture } from "./textures";
import { sceneState } from "./scene-state";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CYAN = new THREE.Color("#34d3ff");
const ICE = new THREE.Color("#dff6ff");
const AMBER = new THREE.Color("#ffb454");

// Classic feed-forward shape: input → hidden layers → output.
const LAYERS = [4, 7, 9, 7, 3];
const WIDTH = 9.8;
const HEIGHT = 7.6;

type Built = {
  pos: THREE.Vector3[];
  layerOf: number[];
  colors: THREE.Color[];
  scales: number[];
  phases: number[];
  edges: [number, number][];
  linePositions: Float32Array;
  outgoing: number[][];
  inputEdges: number[];
};

function build(): Built {
  const rand = mulberry32(99173);
  const pos: THREE.Vector3[] = [];
  const layerOf: number[] = [];
  const colors: THREE.Color[] = [];
  const scales: number[] = [];
  const phases: number[] = [];
  const layerIdx: number[][] = [];
  const L = LAYERS.length;

  let gi = 0;
  for (let l = 0; l < L; l++) {
    const n = LAYERS[l];
    const x = -WIDTH / 2 + l * (WIDTH / (L - 1));
    const idxs: number[] = [];
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? 0 : -HEIGHT / 2 + (i + 0.5) * (HEIGHT / n);
      const z = (rand() - 0.5) * 0.9;
      pos.push(new THREE.Vector3(x, y, z));
      layerOf.push(l);
      const isEdgeLayer = l === 0 || l === L - 1;
      colors.push(isEdgeLayer ? AMBER.clone() : rand() > 0.7 ? ICE.clone() : CYAN.clone());
      scales.push(isEdgeLayer ? 0.15 : 0.11);
      phases.push(rand() * Math.PI * 2);
      idxs.push(gi++);
    }
    layerIdx.push(idxs);
  }

  // fully connect adjacent layers
  const edges: [number, number][] = [];
  const outgoing: number[][] = pos.map(() => []);
  const inputEdges: number[] = [];
  for (let l = 0; l < L - 1; l++) {
    for (const a of layerIdx[l]) {
      for (const b of layerIdx[l + 1]) {
        const e = edges.length;
        edges.push([a, b]);
        outgoing[a].push(e);
        if (l === 0) inputEdges.push(e);
      }
    }
  }

  const linePositions = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], e) => {
    linePositions.set([pos[a].x, pos[a].y, pos[a].z], e * 6);
    linePositions.set([pos[b].x, pos[b].y, pos[b].z], e * 6 + 3);
  });

  return { pos, layerOf, colors, scales, phases, edges, linePositions, outgoing, inputEdges };
}

type Pulse = { edge: number; t: number; speed: number };

export default function NeuralNetwork({ pulseCount = 26 }: { pulseCount?: number }) {
  const tilt = useRef<THREE.Group>(null);
  const sway = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const pulseRef = useRef<THREE.Points>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  const data = useMemo(build, []);
  const glow = useMemo(() => makeGlowTexture(), []);
  const inited = useRef(false);

  const pulses = useMemo<Pulse[]>(() => {
    const rand = mulberry32(7);
    return Array.from({ length: pulseCount }, () => ({
      edge: data.inputEdges[Math.floor(rand() * data.inputEdges.length)],
      t: rand(),
      speed: 0.4 + rand() * 0.5,
    }));
  }, [pulseCount, data.inputEdges]);

  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3));
    return g;
  }, [pulseCount]);

  useFrame((_, delta) => {
    const t = (performance?.now?.() ?? 0) / 1000;
    const dt = sceneState.reduced ? delta * 0.3 : delta;

    // gentle sway so the layered structure stays readable (no full spin)
    if (sway.current) {
      sway.current.rotation.y = -0.32 + Math.sin(t * 0.2) * 0.26;
    }
    if (tilt.current) {
      const tx = -sceneState.pointer.y * 0.18;
      const ty = sceneState.pointer.x * 0.22;
      tilt.current.rotation.x += (tx - tilt.current.rotation.x) * Math.min(1, delta * 2);
      tilt.current.rotation.z += (ty * 0.15 - tilt.current.rotation.z) * Math.min(1, delta * 2);
    }

    // nodes: place once, then "fire" (brightness)
    const mesh = nodesRef.current;
    if (mesh) {
      if (!inited.current) {
        data.pos.forEach((p, i) => {
          dummy.position.copy(p);
          dummy.scale.setScalar(data.scales[i] * 14);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        inited.current = true;
      }
      for (let i = 0; i < data.pos.length; i++) {
        const fire = 0.5 + 0.5 * Math.sin(t * 1.6 + data.phases[i]);
        tmp.copy(data.colors[i]).multiplyScalar(0.85 + fire * 1.5);
        mesh.setColorAt(i, tmp);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    if (lineRef.current) {
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = 0.3 + 0.06 * Math.sin(t * 0.8);
    }

    // pulses propagate forward (input → output), then continue along an outgoing
    // edge of the node they reached — looks like signals firing through the net.
    if (pulseRef.current) {
      const attr = pulseRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      pulses.forEach((p, i) => {
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          const reached = data.edges[p.edge][1];
          const outs = data.outgoing[reached];
          p.edge =
            outs.length > 0
              ? outs[Math.floor(Math.random() * outs.length)]
              : data.inputEdges[Math.floor(Math.random() * data.inputEdges.length)];
        }
        const [a, b] = data.edges[p.edge];
        const pa = data.pos[a];
        const pb = data.pos[b];
        const e = p.t * p.t * (3 - 2 * p.t);
        arr[i * 3] = pa.x + (pb.x - pa.x) * e;
        arr[i * 3 + 1] = pa.y + (pb.y - pa.y) * e;
        arr[i * 3 + 2] = pa.z + (pb.z - pa.z) * e;
      });
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={tilt}>
      <group ref={sway}>
        <lineSegments ref={lineRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[data.linePositions, 3]}
              count={data.linePositions.length / 3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#52c8ee"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        <instancedMesh ref={nodesRef} args={[undefined, undefined, data.pos.length]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        <points ref={pulseRef} geometry={pulseGeo}>
          <pointsMaterial
            size={0.78}
            map={glow}
            color="#cdf3ff"
            transparent
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      </group>
    </group>
  );
}
