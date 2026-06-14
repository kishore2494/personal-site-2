// Shared content loader for build-time scripts (sitemap + prerender).
// Reads articles from Markdown and projects from the TS source (via esbuild),
// mirroring src/content/index.ts so generated HTML matches the app.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { transform } from "esbuild";
import fm from "front-matter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const COSMOS = ["science", "physics", "philosophy", "space", "cosmology", "society"];
const BUILD = ["tutorial", "coding", "python", "local llm", "software development", "career", "personal"];

function deriveTheme(categories) {
  const lower = categories.map((c) => String(c).toLowerCase());
  if (lower.some((c) => COSMOS.includes(c))) return "Cosmos";
  if (lower.some((c) => BUILD.includes(c))) return "Build";
  return "AI";
}

function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function toISO(d) {
  if (!d) return "1970-01-01";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function deriveExcerpt(excerpt, body) {
  const e = String(excerpt || "").replace(/^\*+|\*+$/g, "").trim();
  if (e) return e;
  const firstPara = body
    .replace(/^#.*$/gm, "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 40);
  const clean = String(firstPara || "").replace(/[#*_>`!\[\]]/g, "");
  return clean.length > 180 ? clean.slice(0, clean.lastIndexOf(" ", 180)) + "…" : clean;
}

export function getArticles() {
  const dir = join(root, "src/content/articles");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = readFileSync(join(dir, f), "utf8");
      const { attributes: a, body } = fm(raw);
      const categories = toArray(a.categories);
      return {
        slug: f.replace(/\.md$/, ""),
        title: a.title || f.replace(/\.md$/, ""),
        excerpt: deriveExcerpt(a.excerpt, body),
        date: toISO(a.date),
        categories,
        tags: toArray(a.tags),
        theme: deriveTheme(categories),
        cover: a.image && String(a.image).trim() ? a.image : "",
        body,
        draft: Boolean(a.draft),
      };
    })
    .filter((a) => !a.draft)
    .sort((x, y) => (x.date < y.date ? 1 : -1));
}

export async function getProjects() {
  const ts = readFileSync(join(root, "src/data/projects.ts"), "utf8");
  const { code } = await transform(ts, { loader: "ts", format: "esm" });
  const mod = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
  return [...mod.projects].sort((a, b) => b.year - a.year);
}
