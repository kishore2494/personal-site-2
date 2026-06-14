import { useEffect } from "react";
import { setMood, type Mood } from "@/three/scene-state";

/** Pages call this to shift the persistent 3D scene's mood on mount. */
export function useMood(mood: Mood) {
  useEffect(() => {
    setMood(mood);
  }, [mood]);
}
