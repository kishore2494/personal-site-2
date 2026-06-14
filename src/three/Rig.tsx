import { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState, MOODS } from "./scene-state";

/** Flies the camera between station "moods" and adds gentle pointer/scroll drift. */
export default function Rig() {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3(0, 0.5, 15));
  const focus = useRef(new THREE.Vector3(0, 0, 0));
  const curFocus = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const m = MOODS[sceneState.mood];
    const k = Math.min(1, delta * 1.3);

    // target camera position: station + pointer parallax + slight scroll dolly toward focus
    desired.current.set(
      m.camPos[0] + sceneState.pointer.x * 1.3,
      m.camPos[1] - sceneState.pointer.y * 0.9,
      m.camPos[2],
    );
    // scroll eases the camera a touch closer to the station (read the page, lean in)
    focus.current.set(m.focus[0], m.focus[1], m.focus[2]);
    desired.current.lerp(focus.current, sceneState.scroll * 0.12);

    camera.position.lerp(desired.current, k);
    curFocus.current.lerp(focus.current, k);
    camera.lookAt(curFocus.current);

    sceneState.cam.copy(camera.position);
  });

  return null;
}
