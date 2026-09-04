// Fail the build on an article date that is not a date.
//
// toISO() falls back to the epoch for anything it cannot parse. That fallback exists so a bad
// value cannot produce a crash or a truncated string — it is not an answer. "1970-01-01" in a
// sitemap's lastmod and in JSON-LD datePublished is a claim about when the article was written,
// and a false one; crawlers treat a 1970 lastmod as "ancient, do not bother".
//
// The old behaviour was worse and is what prompted this: String(d).slice(0, 10) turned
// "Sep 5, 2026" into "Sep 5, 202", which shipped verbatim into structured data. Google drops the
// Article rich result over an invalid date, silently, and the only symptom is a result that
// stops appearing.
//
// The rule lives in article-fields.mjs, shared with the site itself, so this guard cannot reach a
// different conclusion than the pages it is guarding.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { toISO } from "./article-fields.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "src/content/articles");

const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
if (files.length < 5) {
  console.error(`✗ only ${files.length} articles found — check-article-dates.mjs has gone stale`);
  process.exit(1);
}

const problems = [];
let checked = 0;

for (const file of files) {
  const src = readFileSync(join(dir, file), "utf8");
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src);
  if (!fm) { problems.push(`${file}: no frontmatter block`); continue; }

  const line = /^date:\s*(.+)$/m.exec(fm[1]);
  if (!line) { problems.push(`${file}: no \`date:\` in frontmatter`); continue; }

  const raw = line[1].trim().replace(/^["']|["']$/g, "");
  checked++;
  const iso = toISO(raw);
  if (iso === "1970-01-01" && !/^1970-01-01/.test(raw)) {
    problems.push(`${file}: date \`${raw}\` is not a date toISO() can read`);
  }
}

// Being unable to check is not the same as everything being fine.
if (checked === 0) {
  console.error("✗ no article dates were checked — the frontmatter shape must have changed");
  process.exit(1);
}

if (problems.length) {
  console.error(`\n\x1b[31m✗ ${problems.length} article date problem(s):\x1b[0m`);
  problems.forEach((p) => console.error(`   ${p}`));
  console.error("\n   These reach sitemap lastmod and JSON-LD datePublished. Use YYYY-MM-DD.\n");
  process.exit(1);
}

console.log(`article dates: ${checked} articles, all parseable`);
