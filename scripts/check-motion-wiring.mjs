// The reduced-motion decision has to be CONNECTED, not just correct.
//
// src/lib/motionPreference.ts is unit-tested and would keep passing while nothing called it.
// Both integration points are one line each and both are easy to drop in a refactor:
//
//   main.tsx        <MotionConfig reducedMotion="user">  — without it, framer-motion animates
//                                                          in 14 components regardless
//   SceneCanvas     frameloop={frameloop}                — without it, the Canvas defaults to
//                                                          "always" and the WebGL loop runs
//
// That is exactly how this site's heading fix once landed on the React side only and changed
// nothing for crawlers. Fails the build rather than warning: unlike the pipeline-parity notice,
// there is no content that could legitimately trip this.

import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const problems = [];

const main = read("src/main.tsx");
if (!/<MotionConfig\b[^>]*reducedMotion=["']user["']/.test(main)) {
  problems.push(
    'src/main.tsx does not wrap the app in <MotionConfig reducedMotion="user">.\n' +
    "     framer-motion does not read the OS setting on its own, so every motion component\n" +
    "     animates for users who asked it not to. The CSS rules in index.css do not reach it:\n" +
    "     it animates inline styles from JavaScript."
  );
}

const canvas = read("src/three/SceneCanvas.tsx");
if (!/frameloop=\{/.test(canvas)) {
  problems.push(
    "src/three/SceneCanvas.tsx does not pass frameloop to <Canvas>.\n" +
    '     It then defaults to "always" and the render loop runs 60 times a second no matter\n' +
    "     what the user asked for."
  );
}
if (!/sceneMotion\s*\(/.test(canvas)) {
  problems.push(
    "src/three/SceneCanvas.tsx no longer calls sceneMotion().\n" +
    "     Quality and motion are separate decisions and were tangled once already: the\n" +
    "     preference only fed the quality ladder, so 'reduce motion' meant 'fewer stars,\n" +
    "     same animation'."
  );
}
// The old shape, in case it is reintroduced alongside the new one.
if (/function detectQuality\s*\(/.test(canvas)) {
  problems.push("src/three/SceneCanvas.tsx has a local detectQuality() again — the decision must stay in one place.");
}

if (problems.length) {
  console.error("\n\x1b[31m✗ reduced motion is not wired up:\x1b[0m");
  for (const p of problems) console.error(`   ${p}`);
  console.error("");
  process.exit(1);
}
console.log("motion: reduced-motion honoured by framer-motion and by the 3D render loop");
