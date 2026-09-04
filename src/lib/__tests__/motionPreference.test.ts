// "Reduce motion" has to stop the motion.
//
// The site handled the preference in CSS, which covers nothing that actually moves here: the
// animation comes from framer-motion (JavaScript, inline styles) and from a WebGL render loop.
// Worse, the 3D scene read the preference as a QUALITY hint — a user who asked for less motion
// got fewer stars and the same continuous animation. People set this because motion makes them
// unwell; fewer moving objects is not the request they made.

import { describe, it, expect } from "vitest";
import { sceneMotion, prefersReducedMotion } from "../motionPreference";

describe("sceneMotion", () => {
  it("stops the render loop when the user asked for reduced motion", () => {
    expect(sceneMotion({ reduced: true, width: 1920, cores: 16 })).toEqual({
      quality: "low",
      frameloop: "demand",
    });
  });

  it("stops it regardless of how capable the machine is", () => {
    // The bug being pinned: a fast desktop used to get "high" and a running loop, because the
    // preference only ever fed into the quality ladder.
    for (const [width, cores] of [[1920, 16], [1280, 8], [375, 2]] as const) {
      expect(sceneMotion({ reduced: true, width, cores }).frameloop,
        `${width}px / ${cores} cores ignored the preference`).toBe("demand");
    }
  });

  it("keeps animating for everyone who did not ask", () => {
    expect(sceneMotion({ reduced: false, width: 1920, cores: 16 })).toEqual({ quality: "high", frameloop: "always" });
    expect(sceneMotion({ reduced: false, width: 375, cores: 8 })).toEqual({ quality: "medium", frameloop: "always" });
    expect(sceneMotion({ reduced: false, width: 1920, cores: 4 })).toEqual({ quality: "low", frameloop: "always" });
  });

  it("still lowers quality on weak machines, which is a separate decision", () => {
    // Quality and motion are different questions and were tangled. A 4-core laptop with no
    // preference set gets fewer objects and a moving scene; that is correct and must stay.
    const weak = sceneMotion({ reduced: false, width: 1920, cores: 2 });
    expect(weak.quality).toBe("low");
    expect(weak.frameloop).toBe("always");
  });
});

describe("prefersReducedMotion", () => {
  const win = (matches: boolean) => ({ matchMedia: () => ({ matches }) }) as unknown as Window;

  it("reads the media query", () => {
    expect(prefersReducedMotion(win(true))).toBe(true);
    expect(prefersReducedMotion(win(false))).toBe(false);
  });

  it("defaults to NOT reduced when it cannot tell", () => {
    // Server-side render, or a browser without matchMedia. Defaulting the other way would
    // freeze the scene for everyone, which is a worse failure than animating.
    expect(prefersReducedMotion(undefined)).toBe(false);
    expect(prefersReducedMotion({} as Window)).toBe(false);
  });
});
