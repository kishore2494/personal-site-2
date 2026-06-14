// ─────────────────────────────────────────────────────────────────────────
//  CONTENT PROVIDER  (single source of truth for the app)
//
//  Today it reads local Markdown (articles) + structured data (projects).
//  When the Sanity portal is wired, ONLY this file changes — every page/
//  component imports content from here, so the swap is invisible to the UI.
// ─────────────────────────────────────────────────────────────────────────
import fm from "front-matter";
import { projects as projectData, type Project } from "@/data/projects";

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

const COSMOS = ["science", "physics", "philosophy", "space", "cosmology", "society"];
const BUILD = ["tutorial", "coding", "python", "local llm", "software development", "career", "personal"];

function deriveTheme(categories: string[]): Theme {
  const lower = categories.map((c) => c.toLowerCase());
  if (lower.some((c) => COSMOS.includes(c))) return "Cosmos";
  if (lower.some((c) => BUILD.includes(c))) return "Build";
  return "AI";
}

function toArray(v?: string[] | string): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function toISO(d?: string | Date): string {
  if (!d) return "1970-01-01";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function deriveExcerpt(excerpt: string | undefined, body: string): string {
  const e = (excerpt ?? "").trim();
  if (e) return e.replace(/^\*+|\*+$/g, "");
  const firstPara = body
    .replace(/^#.*$/gm, "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 40);
  const clean = (firstPara ?? "").replace(/[#*_>`!\[\]]/g, "");
  return clean.length > 180 ? clean.slice(0, clean.lastIndexOf(" ", 180)) + "…" : clean;
}

// Eagerly import every article's raw markdown at build time.
const files = import.meta.glob("./articles/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const allArticles: Article[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const { attributes, body } = fm<RawAttrs>(raw);
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
      cover: attributes.image && attributes.image.trim() ? attributes.image : undefined,
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
