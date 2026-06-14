// Generates public/sitemap.xml from the static routes + article/project slugs.
// Runs before `vite build` (see package.json prebuild).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getArticles, getProjects } from "./data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://kishore2494.github.io/personal-site-2";
const staticRoutes = ["/", "/projects", "/articles", "/about", "/contact"];

const articles = getArticles();
const projects = await getProjects();

const urls = [
  ...staticRoutes.map((u) => ({ loc: u, lastmod: null })),
  ...articles.map((a) => ({ loc: `/articles/${a.slug}`, lastmod: a.date })),
  ...projects.map((p) => ({ loc: `/projects/${p.slug}`, lastmod: null })),
];

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) =>
      `  <url>\n    <loc>${SITE_URL}${loc === "/" ? "/" : loc}</loc>\n    <lastmod>${lastmod || today}</lastmod>\n    <changefreq>${loc === "/" ? "weekly" : "monthly"}</changefreq>\n    <priority>${loc === "/" ? "1.0" : "0.7"}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(join(root, "public/sitemap.xml"), xml);
console.log(`sitemap.xml: ${urls.length} urls (${articles.length} articles, ${projects.length} projects)`);
