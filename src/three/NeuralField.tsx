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

/**
 * Ambient neural-network web spanning the whole world — present behind every
 * page. Sparse glowing nodes connected by faint edges with pulses travelling
 * along them. Subtle, so the per-station objects still read on top.
 */
export default function NeuralField({
  nodeCount = 70,
  pulseCount = 26,
}: {
  nodeCount?: number;
  pulseCount?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const pulseRef = useRef<THREE.Points>(null);
  const nodeGlow = useMemo(() => makeGlowTexture("rgba(127,232,255,0.9)", "rgba(52,150,220,0)"), []);
  const pulseGlow = useMemo(() => makeGlowTexture(), []);

  const data = useMemo(() => {
    const rand = rng(1701);
    const positions: THREE.Vector3[] = [];
    // spread across the volume the camera travels (covers all stations)
    for (let i = 0; i < nodeCount; i++) {
      positions.push(
        new THREE.Vector3(
          (rand() - 0.5) * 96,
          (rand() - 0.5) * 80,
          (rand() - 0.5) * 30,
        ),
      );
    }

    const nodePos = new Float32Array(nodeCount * 3);
    positions.forEach((p, i) => nodePos.set([p.x, p.y, p.z], i * 3));

    // connect each node to its 2 nearest neighbours
    const seen = new Set<string>();
    const edges: [number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const near = positions
        .map((p, j) => ({ j, d: p.distanceTo(positions[i]) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const { j } of near) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push(i < j ? [i, j] : [j, i]);
        }
      }
    }
    const linePositions = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], e) => {
      linePositions.set([positions[a].x, positions[a].y, positions[a].z], e * 6);
      linePositions.set([positions[b].x, positions[b].y, positions[b].z], e * 6 + 3);
    });

    return { positions, nodePos, edges, linePositions };
  }, [nodeCount]);

  const pulses = useMemo(() => {
    const rand = rng(42);
    return Array.from({ length: pulseCount }, () => ({
      edge: Math.floor(rand() * data.edges.length),
      t: rand(),
      speed: 0.2 + rand() * 0.5,
    }));
  }, [pulseCount, data.edges.length]);

  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3));
    return g;
  }, [pulseCount]);

  useFrame((_, delta) => {
    const t = (performance?.now?.() ?? 0) / 1000;
    const dt = sceneState.reduced ? delta * 0.3 : delta;

    if (group.current) {
      group.current.rotation.y += dt * 0.01;
      group.current.position.x += (sceneState.pointer.x * 1.5 - group.current.position.x) * Math.min(1, delta);
      group.current.position.y += (-sceneState.pointer.y * 1.0 - group.current.position.y) * Math.min(1, delta);
    }
    if (lineRef.current) {
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = 0.16 + 0.05 * Math.sin(t * 0.6);
    }
    if (pulseRef.current) {
      const attr = pulseRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      pulses.forEach((p, i) => {
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.edge = (p.edge + 1 + Math.floor(p.speed * 9)) % data.edges.length;
        }
        const [a, b] = data.edges[p.edge];
        const pa = data.positions[a];
        const pb = data.positions[b];
        const e = p.t * p.t * (3 - 2 * p.t);
        arr[i * 3] = pa.x + (pb.x - pa.x) * e;
        arr[i * 3 + 1] = pa.y + (pb.y - pa.y) * e;
        arr[i * 3 + 2] = pa.z + (pb.z - pa.z) * e;
      });
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[data.linePositions, 3]}
            count={data.linePositions.length / 3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#2f9fd0"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.nodePos, 3]} count={data.positions.length} />
        </bufferGeometry>
        <pointsMaterial
          size={1.1}
          map={nodeGlow}
          color="#8fe6ff"
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <points ref={pulseRef} geometry={pulseGeo}>
        <pointsMaterial
          size={0.6}
          map={pulseGlow}
          color="#bdf0ff"
          transparent
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
