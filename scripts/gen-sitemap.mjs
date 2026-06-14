// Generates public/sitemap.xml from the static routes + article/project slugs.
// Runs before `vite build` (see package.json). Keep SITE_URL in sync with
// src/config/site.ts `url`.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SITE_URL = "https://kishore2494.github.io/personal-site-2";

const staticRoutes = ["/", "/projects", "/articles", "/about", "/contact"];

// article slugs from markdown filenames
const articleSlugs = readdirSync(join(root, "src/content/articles"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));

// project slugs parsed from src/data/projects.ts
const projectsTs = readFileSync(join(root, "src/data/projects.ts"), "utf8");
const projectSlugs = [...projectsTs.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);

const urls = [
  ...staticRoutes,
  ...articleSlugs.map((s) => `/articles/${s}`),
  ...projectSlugs.map((s) => `/projects/${s}`),
];

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${SITE_URL}${u === "/" ? "" : u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u === "/" ? "weekly" : "monthly"}</changefreq>\n    <priority>${u === "/" ? "1.0" : "0.7"}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(join(root, "public/sitemap.xml"), xml);
console.log(`sitemap.xml: ${urls.length} urls (${articleSlugs.length} articles, ${projectSlugs.length} projects)`);
