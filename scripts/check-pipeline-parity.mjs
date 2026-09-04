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

// Source with comments removed, for the checks that ask "is this actually CALLED?".
//
// Not a nicety. The JSON-LD check below matched `articleJsonLd(` inside a comment I had written
// two lines above the call — "see articleJsonLd() in scripts/article-fields.mjs" — so deleting
// the real call left the guard perfectly happy. A grep that a comment can satisfy is a grep that
// proves nothing, which is the failure this whole file exists to prevent.
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
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
// Match the CALL, not the identifier. Grepping for the bare name passes on a file that still
// IMPORTS outlineLevels and no longer uses it — which is exactly how a mutation slipped past
// this check, and the same trap the note above records for the last rule that went stale.
const rule = /outlineLevels\s*\(/;
const inPrerender = rule.test(prerender);
const inClient = rule.test(clientHeadings);
if (inPrerender !== inClient) {
  problems.push(
    "heading normalisation is implemented on only one side:\n" +
    `     scripts/markdown-pipeline.mjs: ${inPrerender ? "yes" : "NO"}\n` +
    `     src/lib/rehypeDemoteHeadings.ts: ${inClient ? "yes" : "NO"}\n` +
    "     Both must import outlineLevels() from scripts/heading-outline.mjs — the rule is\n" +
    "     order-sensitive, so two independent copies of it drift silently."
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

// ── 4. the legacy-base retarget, declared in both loaders ─────────────────────
// Same shape as the strip above: content migrated from site 1 names site 1's base path, and a
// retarget in only one loader means the app and the prerendered HTML point at different images.
const legacyRe = /retargetLegacy/;
const inDataLegacy = legacyRe.test(read("scripts/data.mjs"));
const inContentLegacy = legacyRe.test(read("src/content/index.ts"));
if (inDataLegacy !== inContentLegacy) {
  problems.push(
    "the legacy base-path retarget is in only one loader:\n" +
    `     scripts/data.mjs: ${inDataLegacy ? "yes" : "NO"}\n` +
    `     src/content/index.ts: ${inContentLegacy ? "yes" : "NO"}\n` +
    "     Both load article bodies; a retarget in one leaves the other pointing at site 1."
  );
}

// ── 4b. the article metadata rules, shared not copied ────────────────────────
// COSMOS/BUILD, deriveTheme, toArray, toISO and deriveExcerpt were implemented in BOTH loaders,
// character for character. They decide the sitemap date, the JSON-LD date, the meta description
// and the theme — so a divergence tells crawlers and visitors different things about the same
// article, which is the failure this file exists to prevent.
// The article's structured data is built for crawlers and again after hydration. Both used to
// drop `image` when there was no cover, which Google treats as disqualifying for rich results.
for (const f of ["scripts/prerender.mjs", "src/pages/ArticleDetail.tsx"]) {
  if (!/articleJsonLd\s*\(/.test(code(f))) {
    problems.push(
      `${f} no longer builds its JSON-LD with articleJsonLd().\n` +
      "     A local copy is how the crawler and the hydrated page end up describing the same\n" +
      "     article differently — and how the required `image` property goes missing again."
    );
  }
}

for (const f of ["scripts/data.mjs", "src/content/index.ts"]) {
  const src = read(f);
  if (!/from ["'][^"']*article-fields\.mjs["']/.test(src)) {
    problems.push(
      `${f} no longer imports the shared article rules from scripts/article-fields.mjs.\n` +
      "     A local copy of deriveTheme/toISO/deriveExcerpt is how the sitemap date and the\n" +
      "     rendered date stop agreeing."
    );
  }
}

// ── 5. the head rules, which must be shared rather than merely equal ──────────
// prerender.mjs and Seo.tsx both build canonical + og:image. They drifted once (trailing
// slash), so they now import one implementation. This checks they still do, because a
// re-inlined copy is exactly how the drift comes back.
for (const f of ["scripts/prerender.mjs", "src/components/Seo.tsx"]) {
  const src = code(f);
  if (!/canonicalFor\s*\(/.test(src) || !/absoluteImage\s*\(/.test(src)) {
    problems.push(
      `${f} no longer uses the shared head rules from scripts/site-urls.mjs.\n` +
      "     canonical and og:image must come from canonicalFor()/absoluteImage() in BOTH\n" +
      "     pipelines — an inlined copy is how the trailing-slash bug returned last time."
    );
  }
}

if (problems.length === 0) {
  console.log("pipeline parity: prerender and app agree (grammars, headings, link strip, legacy retarget, article fields, shared head rules)");
} else {
  console.warn("\n\x1b[33m⚠ the two markdown pipelines have drifted:\x1b[0m");
  for (const p of problems) console.warn(`   ${p}`);
  console.warn("   Whatever renders in the app must also render for crawlers — see the");
  console.warn("   dual-pipeline note in scripts/markdown-pipeline.mjs.\n");
}
