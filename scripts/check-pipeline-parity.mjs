// Guard against the two markdown pipelines drifting apart.
//
// This project renders article markdown TWICE, through completely separate stacks:
//
//   crawlers + first paint   scripts/prerender.mjs   markdown-it   loader scripts/data.mjs
//   after hydration          src/components/Markdown.tsx  react-markdown  loader src/content/index.ts
//
// They must agree, and nothing enforced that. It has already bitten once: the heading-level
// fix was applied to the React side only and changed nothing in dist/ — the half that
// actually matters for SEO — and the missing syntax highlighting in dist/ was the same drift
// showing up as a symptom.
//
// Rather than diffing rendered HTML (brittle: two serializers, attribute order, whitespace),
// this checks that both sides DECLARE the same rules, which is where the realistic drift
// happens: someone adds a language or changes a threshold in one file and not the other.
//
// Runs in prebuild. Warns rather than failing — a content build should not be blocked by
// this — but says exactly which files disagree.

import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const problems = [];

// ── 1. registered highlight.js grammars, declared in three places ──────────────
// The markdown-it half now lives in its own module so it can be imported and tested;
// prerender.mjs just calls renderBody(). Read the pipeline module, not the script.
const prerender = read("scripts/markdown-pipeline.mjs");
const clientPlugin = read("src/lib/rehypeHighlightMinimal.ts");
const langGuard = read("scripts/check-code-languages.mjs");

const set = (arr) => [...new Set(arr)].sort();
const prerenderLangs = set([...prerender.matchAll(/hljs\.registerLanguage\("([a-z0-9+#-]+)"/g)].map((m) => m[1]));
const clientLangs = set((clientPlugin.match(/createLowlight\(\{([^}]*)\}/)?.[1] ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean));
const guardLangs = set([...(langGuard.match(/const REGISTERED = new Set\(\[([^\]]*)\]/)?.[1] ?? "")
  .matchAll(/"([a-z0-9+#-]+)"/g)].map((m) => m[1]));

const langSources = {
  "scripts/markdown-pipeline.mjs": prerenderLangs,
  "src/lib/rehypeHighlightMinimal.ts": clientLangs,
  "scripts/check-code-languages.mjs": guardLangs,
};
const langKeys = Object.values(langSources).map((v) => v.join(","));
if (new Set(langKeys).size !== 1) {
  problems.push(
    "highlight grammars disagree between pipelines:\n" +
    Object.entries(langSources).map(([f, v]) => `     ${f}: [${v.join(", ")}]`).join("\n") +
    "\n     Add the grammar to ALL THREE, or a fence highlights on one side only."
  );
}
if (langKeys[0] === "") problems.push("could not parse any registered grammars — this check has gone stale");

// ── 2. heading normalisation, declared twice ──────────────────────────────────
const clientHeadings = read("src/lib/rehypeDemoteHeadings.ts");
// The shared rule marker. Was /2 - Math\.min/ while headings were SHIFTED; it is now a rank
// map, and this had to move with it — a guard that greps for a vanished string reports
// "implemented on neither side" and looks like a pass if you only read the exit code.
const rule = /normaliseLevels/;
const inPrerender = rule.test(prerender);
const inClient = rule.test(clientHeadings);
if (inPrerender !== inClient) {
  problems.push(
    "heading normalisation is implemented on only one side:\n" +
    `     scripts/markdown-pipeline.mjs: ${inPrerender ? "yes" : "NO"}\n` +
    `     src/lib/rehypeDemoteHeadings.ts: ${inClient ? "yes" : "NO"}\n` +
    "     Both must rank heading levels onto consecutive levels starting at h2."
  );
}

// ── 3. the Medium empty-anchor strip, declared in both loaders ────────────────
const stripRe = /\\\[\\\]\\\(/;
const inDataLoader = stripRe.test(read("scripts/data.mjs"));
const inContentLoader = stripRe.test(read("src/content/index.ts"));
if (inDataLoader !== inContentLoader) {
  problems.push(
    "the Medium empty-link strip is in only one loader:\n" +
    `     scripts/data.mjs: ${inDataLoader ? "yes" : "NO"}\n` +
    `     src/content/index.ts: ${inContentLoader ? "yes" : "NO"}\n` +
    "     Both load article bodies; a strip in one leaves inert anchors in the other."
  );
}

if (problems.length === 0) {
  console.log("pipeline parity: prerender and app agree (grammars, headings, link strip)");
} else {
  console.warn("\n\x1b[33m⚠ the two markdown pipelines have drifted:\x1b[0m");
  for (const p of problems) console.warn(`   ${p}`);
  console.warn("   Whatever renders in the app must also render for crawlers — see the");
  console.warn("   dual-pipeline note in scripts/markdown-pipeline.mjs.\n");
}
