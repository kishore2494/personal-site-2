// Catch a lockfile that installs cleanly here but cannot install on CI.
//
// This exists because of a real outage: adding vitest broke the deploy for three runs.
// vitest 4 wants vite 6/7 while this project is on vite 5, so npm gave vitest its OWN nested
// esbuild (0.28.2) beside vite's (0.21.5) — and when it wrote that nested tree it dropped
// `"optional": true` from 26 of the 49 @esbuild/* platform packages.
//
// esbuild ships one prebuilt binary per platform and lists them all as optionalDependencies:
// npm is supposed to install the one matching your machine and skip the rest. An entry that
// has os/cpu constraints but is NOT marked optional is no longer skippable, so npm ci on a
// linux-x64 runner tried to install @esbuild/netbsd-arm64 and died with EBADPLATFORM.
//
// It could not be caught by installing locally: on darwin-arm64 npm 11 accepted the same
// lockfile that CI's npm rejected. The only portable signal is in the lockfile itself —
// a package constrained to a platform must be optional, whatever platform you are on.
//
// Runs in prebuild, so a bad lockfile fails before it is ever pushed.

import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const bad = [];
const copies = new Map();

for (const [path, pkg] of Object.entries(lock.packages)) {
  if (!path) continue;
  // Constrained to specific platforms but installed unconditionally.
  if ((pkg.os || pkg.cpu) && !pkg.optional && !pkg.link) bad.push({ path, os: pkg.os, cpu: pkg.cpu });
  // Track duplicate copies of esbuild — the condition that produced the bad tree.
  const m = path.match(/(?:^|\/)node_modules\/(esbuild)$/);
  if (m) copies.set(path, pkg.version);
}

let failed = false;

if (bad.length) {
  failed = true;
  console.error(`\n\x1b[31m✗ ${bad.length} package(s) are platform-locked but not optional:\x1b[0m`);
  for (const b of bad.slice(0, 8)) {
    console.error(`   ${b.path.replace(/^node_modules\//, "")}  os=${(b.os||["*"]).join(",")} cpu=${(b.cpu||["*"]).join(",")}`);
  }
  if (bad.length > 8) console.error(`   …and ${bad.length - 8} more`);
  console.error("   npm ci will fail with EBADPLATFORM on any machine these do not match —");
  console.error("   including the CI runner, even though installing here worked.");
  console.error("   Fix: rm -rf node_modules package-lock.json && npm install\n");
}

if (copies.size > 1) {
  // Not fatal on its own, but it is the shape that produced the bug above.
  console.warn(`\n\x1b[33m⚠ ${copies.size} separate copies of esbuild in the tree:\x1b[0m`);
  for (const [p, v] of copies) console.warn(`   ${p} @ ${v}`);
  console.warn("   Usually means vite and vitest majors have drifted apart. Keep them paired\n" +
               "   (vite 5 ↔ vitest 2) so the tree dedupes to one esbuild.\n");
}

if (failed) process.exit(1);
console.log(`lockfile: ${Object.keys(lock.packages).length} packages, platform-locked entries all optional, ${copies.size} esbuild copy`);
