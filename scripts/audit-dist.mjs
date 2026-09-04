// Static audit of the prerendered output: dead internal links, accessibility basics, and
// the SEO tags this site exists to get right.
//
// Deliberately regex-based over the built HTML rather than a headless browser: it audits
// what a crawler and a screen reader actually receive BEFORE React hydrates, which is the
// thing prerendering is for. A browser-driven pass would hydrate first and hide exactly
// the problems worth finding.
//
//   node scripts/audit-dist.mjs           report
//   node scripts/audit-dist.mjs --strict  exit 1 if any ERROR-level finding

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const DIST = "dist";
// The site is served under a base path (GitHub Pages project site), so hrefs are
// "/personal-site-2/...". Strip it before resolving against dist/, which IS that root —
// without this every internal link looks dead.
// vite.config.ts sets `base: BASE` from a const, so read that const, not the `base:` line.
const BASE = (readFileSync("vite.config.ts", "utf8")
  .match(/const\s+BASE\s*=\s*["'`]([^"'`]+)["'`]/)?.[1] ?? "/")
  .replace(/\/$/, "");
const strict = process.argv.includes("--strict");
const failSystemic = process.argv.includes("--fail-systemic");
const errors = [];
const warns = [];
const err = (file, msg) => errors.push({ file, msg });
const warn = (file, msg) => warns.push({ file, msg });

function htmlFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) htmlFiles(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const files = htmlFiles(DIST);
const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1];

// Resolve an internal href to something on disk, the way a static host would.
function resolves(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return existsSync(join(DIST, "index.html"));
  let rel = clean;
  if (BASE && rel.startsWith(BASE)) rel = rel.slice(BASE.length);
  if (rel === "" || rel === "/") return existsSync(join(DIST, "index.html"));
  rel = rel.replace(/^\//, "");
  return (
    existsSync(join(DIST, rel)) ||
    existsSync(join(DIST, rel, "index.html")) ||
    existsSync(join(DIST, rel + ".html"))
  );
}

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const rel = relative(DIST, file);
  // The GitHub Pages SPA shim (public/404.html) stashes the path and bounces to index.html.
  // It is a redirector, not a destination, so page-level SEO/a11y checks do not apply — it
  // just needs to stay out of the index.
  // Match the actual shim, not "any page containing a redirect": keyed on the file name
  // plus the spa-github-pages marker it is built from. A length/keyword heuristic here
  // wrongly swallowed the real /contact page.
  const isRedirectShim = rel === "404.html" && /pathSegmentsToKeep|spa-github-pages/i.test(html);
  if (isRedirectShim) {
    if (!/<meta[^>]*name\s*=\s*"robots"[^>]*noindex/i.test(html)) {
      err(rel, `redirect shim is indexable (add <meta name="robots" content="noindex">)`);
    }
    continue;
  }
  const isArticle = rel.startsWith("articles/") && rel !== "articles/index.html";
  const isProject = rel.startsWith("projects/") && rel !== "projects/index.html";

  // ---- dead internal links ----
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (!href) {
      warn(rel, `<a> with no href`);
      continue;
    }
    if (/^(https?:|mailto:|tel:|#|data:)/i.test(href)) continue;
    if (!resolves(href)) err(rel, `dead internal link -> ${href}`);
  }

  // ---- images ----
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(m[0], "alt") === undefined) err(rel, `<img> without alt: ${attr(m[0], "src") ?? "?"}`);
  }

  // ---- accessible names on interactive elements ----
  for (const m of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = m[1].replace(/<[^>]*>/g, "").trim();
    const named = text || attr(m[0], "aria-label") || attr(m[0], "title");
    if (!named) err(rel, `link with no accessible name: ${attr(m[0], "href") ?? "?"}`);
  }
  for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) {
    const text = m[1].replace(/<[^>]*>/g, "").trim();
    if (!text && !attr(m[0], "aria-label")) err(rel, `button with no accessible name`);
  }

  // ---- document-level a11y ----
  if (!/<html[^>]*\blang\s*=/i.test(html)) err(rel, `<html> has no lang attribute`);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) err(rel, `no <title>`);

  // ---- heading order ----
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s === 0) warn(rel, `no <h1>`);
  if (h1s > 1) warn(rel, `${h1s} <h1> elements (expected 1)`);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      warn(rel, `heading level jumps h${levels[i - 1]} -> h${levels[i]}`);
      break;
    }
  }

  // ---- duplicate ids ----
  const ids = [...html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  if (dupes.length) warn(rel, `duplicate id(s): ${dupes.slice(0, 3).join(", ")}`);

  // ---- SEO tags (this is the SEO-primary site) ----
  const meta = (n) =>
    html.match(new RegExp(`<meta[^>]*(?:name|property)\\s*=\\s*"${n}"[^>]*content\\s*=\\s*"([^"]*)"`, "i"))?.[1];
  if (!meta("description")) err(rel, `no meta description`);
  if (!meta("og:title")) err(rel, `no og:title`);
  if (!meta("og:description")) warn(rel, `no og:description`);
  if (!meta("og:image")) warn(rel, `no og:image`);
  const canon = html.match(/<link[^>]*rel\s*=\s*"canonical"[^>]*href\s*=\s*"([^"]*)"/i)?.[1];
  if (!canon) warn(rel, `no canonical link`);
  else if (!canon.endsWith("/")) {
    // Pages serves directory URLs and 301s the slashless form, so a canonical without the
    // slash names a URL that redirects rather than the one served.
    err(rel, `canonical omits the trailing slash and so points at a redirect: ${canon}`);
  }
  if ((isArticle || isProject) && !/application\/ld\+json/i.test(html)) {
    warn(rel, `no JSON-LD structured data`);
  }
}

const group = (list) => {
  const byMsg = new Map();
  for (const { file, msg } of list) {
    const kind = msg.replace(/->.*$/, "->").replace(/:.*$/, ":").trim();
    if (!byMsg.has(kind)) byMsg.set(kind, []);
    byMsg.get(kind).push({ file, msg });
  }
  return [...byMsg.entries()].sort((a, b) => b[1].length - a[1].length);
};

console.log(`audited ${files.length} prerendered pages\n`);
for (const [label, list] of [["ERROR", errors], ["WARN", warns]]) {
  if (!list.length) continue;
  console.log(`${label} (${list.length})`);
  for (const [kind, items] of group(list)) {
    console.log(`  ${kind}  x${items.length}`);
    for (const it of items.slice(0, 3)) console.log(`     ${it.file}: ${it.msg}`);
    if (items.length > 3) console.log(`     … +${items.length - 3} more`);
  }
  console.log("");
}
if (!errors.length && !warns.length) console.log("clean");
if (strict && errors.length) process.exit(1);

// --fail-systemic: fail the build only for errors that look like a TEMPLATE regression.
//
// Deploys deliberately do not block on audit findings. Articles sync in automatically, and a
// stale live site is worse than an unaltered SEO warning — one badly-formed import must never
// be able to stop a deploy. That reasoning is sound and it is why postbuild runs without
// --strict.
//
// It leaves one thing uncovered, and it happens to be the worst case for a site whose whole
// purpose is being indexed: a change to the page template that breaks canonicals, or the lang
// attribute, or the title, on EVERY page at once. Nothing blocked that, and nothing would have
// noticed until the rankings moved.
//
// The two are easy to tell apart by how far the error spreads. One bad article is one page out
// of forty-five; a broken template is all of them. So an error kind occurring on more than half
// the audited pages fails the build, and anything narrower is reported and allowed through.
if (failSystemic && errors.length) {
  const threshold = Math.max(2, Math.ceil(files.length / 2));
  const systemic = group(errors).filter(([, items]) => items.length >= threshold);
  if (systemic.length) {
    console.error(`\n\x1b[31m✗ ${systemic.length} error kind(s) affect ${threshold}+ of ${files.length} pages — that is the template, not one article:\x1b[0m`);
    for (const [kind, items] of systemic) console.error(`   ${kind}  on ${items.length}/${files.length} pages`);
    console.error("   A single malformed article is reported and allowed through; this is not that.\n");
    process.exit(1);
  }
}
