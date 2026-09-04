// ─────────────────────────────────────────────────────────────────────────
//  CONTENT PROVIDER  (single source of truth for the app)
//
//  Today it reads local Markdown (articles) + structured data (projects).
//  When the Sanity portal is wired, ONLY this file changes — every page/
//  component imports content from here, so the swap is invisible to the UI.
// ─────────────────────────────────────────────────────────────────────────
import fm from "front-matter";
import { projects as projectData, type Project } from "@/data/projects";
import { retargetLegacy } from "../../scripts/site-urls.mjs";
import { deriveTheme, toArray, toISO, deriveExcerpt } from "../../scripts/article-fields.mjs";

export type Theme = "AI" | "Cosmos" | "Build";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  categories: string[];
  tags: string[];
  theme: Theme;
  cover?: string;
  body: string; // markdown
  readingMinutes: number;
  draft: boolean;
}

export type { Project };

type RawAttrs = {
  title?: string;
  excerpt?: string;
  date?: string | Date;
  categories?: string[] | string;
  tags?: string[] | string;
  image?: string;
  draft?: boolean;
};






// Eagerly import every article's raw markdown at build time.
const files = import.meta.glob("./articles/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const allArticles: Article[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    // Medium's export leaves inert anchors behind: `[](https://miro.medium.com/...)` with
    // no text and no image, which render as a link with no accessible name. Articles sync
    // in automatically, so strip at load rather than editing content that gets overwritten.
    // Mirrors stripEmptyLinks() in scripts/data.mjs, the prerender pipeline's loader.
    const { attributes, body: rawBody } = fm<RawAttrs>(raw);
    // Images migrated from site 1 still name site 1's base path; retarget them at load,
    // exactly as scripts/data.mjs does. See retargetLegacy() in scripts/site-urls.mjs.
    const body = retargetLegacy(rawBody.replace(/\[\]\([^)\s]*\)/g, ""));
    const categories = toArray(attributes.categories);
    const words = body.split(/\s+/).length;
    return {
      slug,
      title: attributes.title ?? slug,
      excerpt: deriveExcerpt(attributes.excerpt, body),
      date: toISO(attributes.date),
      categories,
      tags: toArray(attributes.tags),
      theme: deriveTheme(categories),
      cover: attributes.image && attributes.image.trim() ? retargetLegacy(attributes.image) : undefined,
      body,
      readingMinutes: Math.max(1, Math.round(words / 200)),
      draft: Boolean(attributes.draft),
    };
  })
  .filter((a) => !a.draft)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

// ── Articles API ──────────────────────────────────────────────────────────
export const getArticles = (): Article[] => allArticles;
export const getArticle = (slug: string): Article | undefined =>
  allArticles.find((a) => a.slug === slug);
export const getArticleSlugs = (): string[] => allArticles.map((a) => a.slug);
export const getLatestArticles = (n: number): Article[] => allArticles.slice(0, n);
export const getArticlesByTheme = (theme: Theme | "All"): Article[] =>
  theme === "All" ? allArticles : allArticles.filter((a) => a.theme === theme);

// ── Projects API ──────────────────────────────────────────────────────────
const allProjects = [...projectData].sort((a, b) => b.year - a.year);
export const getProjects = (): Project[] => allProjects;
export const getProject = (slug: string): Project | undefined =>
  allProjects.find((p) => p.slug === slug);
export const getProjectSlugs = (): string[] => allProjects.map((p) => p.slug);
export const getFeaturedProjects = (): Project[] => allProjects.filter((p) => p.featured);
