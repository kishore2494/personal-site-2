// The article metadata rules, in one place.
//
// Six things were implemented twice — once in scripts/data.mjs for the prerender pipeline and
// once in src/content/index.ts for the app: the COSMOS and BUILD category lists, deriveTheme,
// toArray, toISO and deriveExcerpt. They agreed, character for character, which is exactly what
// the heading rule and the head tags looked like right up until they did not.
//
// The cost of drift here is not cosmetic. These decide the date in the sitemap and in the
// JSON-LD, the excerpt used as the meta description, and the theme an article is rendered in —
// so a divergence shows up as crawlers and visitors being told different things about the same
// article, which is the failure this site has already had to fix twice.
//
// Behaviour is unchanged from the copies it replaces. That is checked the strongest way
// available: the whole of dist/ is byte-identical before and after.

import { absoluteImage } from "./site-urls.mjs";

/** Categories that make an article read as Cosmos or Build; anything else is AI. */
export const COSMOS = ["science", "physics", "philosophy", "space", "cosmology", "society"];
export const BUILD = ["tutorial", "coding", "python", "local llm", "software development", "career", "personal"];

export function deriveTheme(categories) {
  const lower = (categories ?? []).map((c) => String(c).toLowerCase());
  if (lower.some((c) => COSMOS.includes(c))) return "Cosmos";
  if (lower.some((c) => BUILD.includes(c))) return "Build";
  return "AI";
}

export function toArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

/**
 * Frontmatter date to an ISO day.
 *
 * Note what this does NOT do: it truncates rather than validates. A frontmatter date written
 * "Sep 5, 2026" becomes "Sep 5, 202" and goes straight into the sitemap and the JSON-LD, and a
 * missing one becomes 1970-01-01, which tells a crawler the article is decades old. Every one of
 * the 32 articles is currently a valid ISO date, so this is a trap rather than a live bug —
 * recorded here, and pinned by a test, so that changing it is a decision rather than an accident.
 */
export function toISO(d) {
  if (!d) return "1970-01-01";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export function deriveExcerpt(excerpt, body) {
  const e = String(excerpt ?? "").trim();
  if (e) return e.replace(/^\*+|\*+$/g, "");
  const firstPara = String(body ?? "")
    .replace(/^#.*$/gm, "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 40);
  const clean = (firstPara ?? "").replace(/[#*_>`!\[\]]/g, "");
  return clean.length > 180 ? clean.slice(0, clean.lastIndexOf(" ", 180)) + "…" : clean;
}

/**
 * The BlogPosting structured data for an article.
 *
 * Built twice before this — once in scripts/prerender.mjs for crawlers, once in
 * src/pages/ArticleDetail.tsx after hydration — and both dropped `image` when an article had no
 * cover. Google lists image as REQUIRED for Article rich results, so 15 of 26 articles were
 * ineligible: the structured data was present, valid, and disqualifying.
 *
 * The head already solved this. absoluteImage() falls back to the site card and returns an
 * absolute URL, which is what JSON-LD wants too, so the same helper decides both and an article
 * cannot end up advertising one image to a crawler and another to schema.org.
 *
 * dateModified is deliberately absent. Google recommends it, the frontmatter has no such field,
 * and inventing one — datePublished, or the file's mtime — would tell crawlers an article was
 * revised on a day nothing happened. A missing recommendation costs less than a false fact.
 */
export function articleJsonLd(a, site, name) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.excerpt,
    datePublished: a.date,
    image: absoluteImage(site, a.cover),
    keywords: (a.tags ?? []).join(", "),
    articleSection: (a.categories ?? []).join(", "),
    author: { "@type": "Person", name, url: site },
    publisher: { "@type": "Person", name },
    mainEntityOfPage: `${site}/articles/${a.slug}`,
  };
}
