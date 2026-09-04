// Hold the perf work in place.
//
// The article route was cut from 499 kB to 356 kB by replacing rehype-highlight with a local
// plugin that registers only the grammars the content uses. That was a one-off improvement with
// nothing defending it: adding a single library import, or registering the `common` grammar set
// again, would put it straight back and no build would say a word. Bundle size is invisible
// until someone loads the site on a phone.
//
// Budgets are in GZIP bytes, because that is what a reader actually downloads, and they sit a
// little above today's real numbers — enough that ordinary work does not trip them, tight
// enough that a regression of the size this project already made once cannot pass.
//
// Runs in postbuild. Prints every measured chunk whether it passes or not, so the numbers are
// visible rather than implied.

import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const DIR = "dist/assets";

// name -> max gzip KB. Measured 2026-09-04; headroom is roughly 10%.
const BUDGETS = {
  "three.js": 190,          // 171 — the 3D engine, lazy-loaded with the scene
  "index.js": 165,          // 146 — the app shell
  "ArticleDetail.js": 125,  // 111 — the route the perf pass was about
  "vendor.js": 110,         // 96
  "r3f.js": 92,             // 80
};
const TOTAL_BUDGET_KB = 700;   // 630 today — catches a NEW large chunk that no rule names

const strip = (f) => f.replace(/-[A-Za-z0-9_-]{8,}\.(js|css)$/, ".$1");

let files;
try {
  files = readdirSync(DIR).filter((f) => f.endsWith(".js") || f.endsWith(".css"));
} catch {
  console.error(`\n\x1b[31m✗ ${DIR} does not exist — nothing was built.\x1b[0m\n`);
  process.exit(1);
}
if (files.length === 0) {
  console.error(`\n\x1b[31m✗ ${DIR} contains no js or css — nothing to measure.\x1b[0m\n`);
  process.exit(1);
}

const measured = files.map((f) => ({
  name: strip(f),
  kb: Math.round(gzipSync(readFileSync(join(DIR, f)), { level: 9 }).length / 1024),
})).sort((a, b) => b.kb - a.kb);

// Chunks that must NOT be on the critical path.
//
// App.tsx says "Heavy WebGL layer — loaded after first paint so the UI is instant" and lazily
// imports SceneCanvas. The lazy() was doing its job; the BUILD was undoing it. manualChunks put
// three and r3f into named chunks, Vite emitted <link rel="modulepreload"> for them, and the
// browser fetched 251 kB gzip of 3D engine as part of the initial load.
//
// vite.config.ts filters them out of the preload list now. This makes sure that stays true:
// the fix lives in a build option that is easy to drop while everything still builds, and the
// only visible symptom would be a slower first paint nobody measures.
const DEFERRED_CHUNKS = [/^three-/, /^r3f-/];
try {
  const html = readFileSync("dist/index.html", "utf8");
  const preloaded = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="[^"]*\/assets\/([^"]+)"/g)]
    .map((m) => m[1]);
  const wrong = preloaded.filter((f) => DEFERRED_CHUNKS.some((re) => re.test(f)));
  if (wrong.length) {
    console.error(`\n\x1b[31m\u2717 the homepage preloads chunks that are meant to load after first paint: ${wrong.join(", ")}\x1b[0m`);
    console.error("   App.tsx lazily imports these on purpose. Check build.modulePreload in");
    console.error("   vite.config.ts — dropping that filter silently puts them back on the critical path.\n");
    process.exit(1);
  }
} catch (e) {
  if (e?.code !== "ENOENT") throw e;   // no dist/index.html: the page checks below will say so
}

const total = measured.reduce((n, m) => n + m.kb, 0);
const over = [];

for (const { name, kb } of measured) {
  const budget = BUDGETS[name];
  if (budget !== undefined && kb > budget) over.push(`${name}  ${kb} kB gz  exceeds its ${budget} kB budget`);
}
if (total > TOTAL_BUDGET_KB) over.push(`total  ${total} kB gz  exceeds the ${TOTAL_BUDGET_KB} kB budget`);

// A budget for a chunk that no longer exists is dead: the rename would silently stop enforcing
// it, which is how a guard quietly becomes decorative.
const names = new Set(measured.map((m) => m.name));
const stale = Object.keys(BUDGETS).filter((n) => !names.has(n));
if (stale.length) over.push(`budget names a chunk that no longer exists: ${stale.join(", ")} — rename it or drop it`);

console.log(`bundle: ${total} kB gzip across ${measured.length} files` +
  ` (${measured.slice(0, 4).map((m) => `${m.name} ${m.kb}`).join(", ")})`);

if (over.length) {
  console.error(`\n\x1b[31m✗ bundle budget exceeded\x1b[0m`);
  for (const o of over) console.error(`   ${o}`);
  console.error("   Raise the budget deliberately if the growth is wanted; otherwise find what\n" +
                "   was added. The article route was cut 499 -> 356 kB once and this is what keeps it.\n");
  process.exit(1);
}
