// Shared content loader for build-time scripts (sitemap + prerender).
// Reads articles from Markdown and projects from the TS source (via esbuild),
// mirroring src/content/index.ts so generated HTML matches the app.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { transform } from "esbuild";
import fm from "front-matter";
import { retargetLegacy } from "./site-urls.mjs";
import { deriveTheme, toArray, toISO, deriveExcerpt } from "./article-fields.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");





// Medium's export leaves inert anchors behind: `[](https://miro.medium.com/...)` with no
// text and no image. They render as a link with no accessible name, which is a real a11y
// error and pure noise. Articles sync in automatically, so strip them at load rather than
// editing content that will be overwritten.
const stripEmptyLinks = (md) => md.replace(/\[\]\([^)\s]*\)/g, "");
// Images migrated from site 1 still name site 1's base path. They live in this repo's
// public/, and resolve today only because site 1 is still up serving copies. See
// retargetLegacy() in scripts/site-urls.mjs. Mirrored in src/content/index.ts.


export function getArticles() {
  const dir = join(root, "src/content/articles");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = readFileSync(join(dir, f), "utf8");
      const { attributes: a, body: rawBody } = fm(raw);
      const body = retargetLegacy(stripEmptyLinks(rawBody));
      const categories = toArray(a.categories);
      return {
        slug: f.replace(/\.md$/, ""),
        title: a.title || f.replace(/\.md$/, ""),
        excerpt: deriveExcerpt(a.excerpt, body),
        date: toISO(a.date),
        categories,
        tags: toArray(a.tags),
        theme: deriveTheme(categories),
        cover: a.image && String(a.image).trim() ? retargetLegacy(String(a.image)) : "",
        body,
        draft: Boolean(a.draft),
      };
    })
    .filter((a) => !a.draft)
    .sort((x, y) => (x.date < y.date ? 1 : -1));
}

export function getProjects() {
  const data = JSON.parse(readFileSync(join(root, "src/data/projects.json"), "utf8"));
  return [...data].sort((a, b) => b.year - a.year);
}
