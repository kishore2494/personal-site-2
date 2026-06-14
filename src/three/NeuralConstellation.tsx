import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGlowTexture } from "./textures";
import { sceneState, MOODS } from "./scene-state";

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
const AMBER = new THREE.Color("#ffb454");
const WHITE = new THREE.Color("#dff6ff");

type Built = {
  positions: THREE.Vector3[];
  colors: THREE.Color[];
  scales: number[];
  phases: number[];
  edges: [number, number][];
  linePositions: Float32Array;
};

function build(nodeCount: number): Built {
  const rand = mulberry32(20260614);
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const scales: number[] = [];
  const phases: number[] = [];

  for (let i = 0; i < nodeCount; i++) {
    // distribute on a jittered fibonacci sphere, then vary radius for depth
    const y = 1 - (i / (nodeCount - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * 2.399963229728653; // golden angle
    const radius = 3.2 + rand() * 3.6;
    const v = new THREE.Vector3(
      Math.cos(phi) * r * radius,
      y * radius * 0.85 + (rand() - 0.5) * 1.2,
      Math.sin(phi) * r * radius,
    );
    positions.push(v);

    const roll = rand();
    colors.push(roll > 0.82 ? AMBER.clone() : roll > 0.68 ? WHITE.clone() : CYAN.clone());
    scales.push(0.06 + rand() * 0.13);
    phases.push(rand() * Math.PI * 2);
  }

  // connect each node to its k nearest neighbours
  const edgeKey = new Set<string>();
  const edges: [number, number][] = [];
  const k = 3;
  for (let i = 0; i < nodeCount; i++) {
    const dists = positions
      .map((p, j) => ({ j, d: p.distanceTo(positions[i]) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    for (const { j } of dists) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!edgeKey.has(key)) {
        edgeKey.add(key);
        edges.push(i < j ? [i, j] : [j, i]);
      }
    }
  }

  const linePositions = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], e) => {
    linePositions.set([positions[a].x, positions[a].y, positions[a].z], e * 6);
    linePositions.set([positions[b].x, positions[b].y, positions[b].z], e * 6 + 3);
  });

  return { positions, colors, scales, phases, edges, linePositions };
}

type Pulse = { edge: number; t: number; speed: number; warm: boolean };

export default function NeuralConstellation({ nodeCount = 38, pulseCount = 16 }) {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const pulseRef = useRef<THREE.Points>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => build(nodeCount), [nodeCount]);
  const glowTex = useMemo(() => makeGlowTexture(), []);

  // pulse bookkeeping
  const pulses = useMemo<Pulse[]>(() => {
    const rand = mulberry32(7);
    return Array.from({ length: pulseCount }, () => ({
      edge: Math.floor(rand() * data.edges.length),
      t: rand(),
      speed: 0.25 + rand() * 0.5,
      warm: rand() > 0.6,
    }));
  }, [pulseCount, data.edges.length]);

  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3));
    const col = new Float32Array(pulseCount * 3);
    pulses.forEach((p, i) => {
      const c = p.warm ? AMBER : CYAN;
      col.set([c.r, c.g, c.b], i * 3);
    });
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [pulseCount, pulses]);

  // set initial node matrices + colors once
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const t = (performance?.now?.() ?? 0) / 1000;
    const m = MOODS[sceneState.mood];

    // smooth accent toward the active mood (read by other layers too)
    sceneState.accent += (m.accent - sceneState.accent) * Math.min(1, delta * 1.5);

    // continuous spin (slowed under reduced motion)
    if (spin.current) {
      spin.current.rotation.y += delta * 0.06 * (sceneState.reduced ? 0.25 : 1);
    }

    // pointer + scroll tilt
    if (tilt.current) {
      const tx = -sceneState.pointer.y * 0.3 + sceneState.scroll * 0.5;
      const ty = sceneState.pointer.x * 0.4;
      tilt.current.rotation.x += (tx - tilt.current.rotation.x) * Math.min(1, delta * 2);
      tilt.current.rotation.z += (ty * 0.2 - tilt.current.rotation.z) * Math.min(1, delta * 2);
    }

    // nodes: place once, then modulate brightness ("firing")
    const mesh = nodesRef.current;
    if (mesh) {
      if (!initialized.current) {
        data.positions.forEach((p, i) => {
          dummy.position.copy(p);
          dummy.scale.setScalar(data.scales[i] * 14);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        initialized.current = true;
      }
      for (let i = 0; i < data.positions.length; i++) {
        const pulse = 0.55 + 0.45 * Math.sin(t * 1.4 + data.phases[i]);
        tmpColor.copy(data.colors[i]).multiplyScalar(0.8 + pulse * 1.4);
        mesh.setColorAt(i, tmpColor);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // edges: subtle breathing opacity
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.16 + 0.06 * Math.sin(t * 0.8);
    }

    // pulses travel along edges
    if (pulseRef.current) {
      const attr = pulseRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      pulses.forEach((p, i) => {
        p.t += delta * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.edge = (p.edge + 1 + Math.floor(p.speed * 7)) % data.edges.length;
        }
        const [a, b] = data.edges[p.edge];
        const pa = data.positions[a];
        const pb = data.positions[b];
        const e = p.t * p.t * (3 - 2 * p.t); // smoothstep
        arr[i * 3] = pa.x + (pb.x - pa.x) * e;
        arr[i * 3 + 1] = pa.y + (pb.y - pa.y) * e;
        arr[i * 3 + 2] = pa.z + (pb.z - pa.z) * e;
      });
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        {/* edges */}
        <lineSegments ref={lineRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[data.linePositions, 3]}
              count={data.linePositions.length / 3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#3fbfe6"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {/* nodes */}
        <instancedMesh ref={nodesRef} args={[undefined, undefined, data.positions.length]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        {/* pulses */}
        <points ref={pulseRef} geometry={pulseGeo}>
          <pointsMaterial
            size={0.7}
            map={glowTex}
            vertexColors
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
