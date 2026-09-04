/**
 * What "reduce motion" actually has to mean on this site.
 *
 * The CSS half was already right: transitions and CSS animations are flattened under
 * `prefers-reduced-motion: reduce`. But nothing on this page moves because of CSS. The motion
 * comes from two places CSS cannot touch:
 *
 *   framer-motion, in 14 components, animating inline styles from JavaScript
 *   react-three-fiber, running a WebGL render loop 60 times a second
 *
 * And the 3D scene treated the preference as a QUALITY hint — a user who asked for less motion
 * got fewer stars and the same continuous animation. People set this because motion makes them
 * ill; a smaller number of moving objects is not the request.
 *
 * `frameloop: "demand"` renders the scene once and then stops until something explicitly asks
 * for a frame, so the scene is still there and still looks like itself — it just holds still.
 */

export type Quality = "high" | "medium" | "low";

export function prefersReducedMotion(win: Pick<Window, "matchMedia"> | undefined = typeof window === "undefined" ? undefined : window): boolean {
  return win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export interface SceneMotion {
  quality: Quality;
  /** react-three-fiber's Canvas frameloop: "always" animates, "demand" renders once and holds. */
  frameloop: "always" | "demand";
}

/**
 * Decide quality and whether the render loop runs at all.
 * Split out from SceneCanvas so it can be tested without a WebGL context.
 */
export function sceneMotion(opts: {
  reduced: boolean;
  width: number;
  cores: number;
}): SceneMotion {
  const { reduced, width, cores } = opts;
  // Reduced motion stops the loop. It also keeps the low preset: a still frame costs nothing to
  // draw, and the same machines that benefit from fewer objects are the ones most likely to be
  // running with the preference on.
  if (reduced) return { quality: "low", frameloop: "demand" };
  if (cores <= 4) return { quality: "low", frameloop: "always" };
  if (width < 760) return { quality: "medium", frameloop: "always" };
  return { quality: "high", frameloop: "always" };
}
