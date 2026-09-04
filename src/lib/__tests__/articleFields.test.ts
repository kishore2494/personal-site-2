// The article metadata rules, now shared by both loaders.
//
// These decide the date in the sitemap and the JSON-LD, the excerpt used as the meta
// description, and the theme an article renders in. They were implemented TWICE — identically,
// which is what the heading rule and the head tags looked like right up until they drifted.

import { describe, it, expect } from "vitest";
import { deriveTheme, toArray, toISO, deriveExcerpt, articleJsonLd, COSMOS, BUILD } from "../../../scripts/article-fields.mjs";

describe("deriveTheme", () => {
  it("routes by category, case-insensitively", () => {
    expect(deriveTheme(["Physics"])).toBe("Cosmos");
    expect(deriveTheme(["PYTHON"])).toBe("Build");
    expect(deriveTheme(["machine learning"])).toBe("AI");
  });

  it("prefers Cosmos when an article is both", () => {
    // Order matters and is load-bearing: an article tagged both would otherwise flip theme
    // depending on which list was consulted first.
    expect(deriveTheme(["python", "physics"])).toBe("Cosmos");
  });

  it("falls back to AI for no categories at all", () => {
    expect(deriveTheme([])).toBe("AI");
    expect(deriveTheme(undefined as unknown as string[])).toBe("AI");
  });

  it("keeps the two lists disjoint", () => {
    // An entry in both would make the Cosmos-first rule silently decide a category's meaning.
    const both = COSMOS.filter((c) => BUILD.includes(c));
    expect(both, `categories in both lists: ${both.join(", ")}`).toEqual([]);
  });
});

describe("toArray", () => {
  it("accepts a comma string or an array, trimming and dropping blanks", () => {
    expect(toArray("a, b ,, c")).toEqual(["a", "b", "c"]);
    expect(toArray([" x ", "y", ""])).toEqual(["x", "y"]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray("")).toEqual([]);
  });
});

describe("toISO", () => {
  it("passes an ISO date through unchanged", () => {
    expect(toISO("2025-03-07")).toBe("2025-03-07");
    expect(toISO("2025-03-07T12:00:00Z")).toBe("2025-03-07");
  });

  it("renders a Date as its UTC day", () => {
    expect(toISO(new Date("2024-05-20T00:00:00Z"))).toBe("2024-05-20");
  });

  it("TRUNCATES rather than validating — pinned so changing it is a decision", () => {
    // Not an endorsement. A frontmatter date written any other way lands in the sitemap and the
    // JSON-LD as nonsense, and a missing one claims the article is from 1970. All 32 articles
    // currently carry valid ISO dates, so this is a trap rather than a live bug — but the
    // behaviour is documented here rather than discovered later by a crawler.
    expect(toISO("Sep 5, 2026")).toBe("Sep 5, 202");
    expect(toISO(undefined)).toBe("1970-01-01");
    expect(toISO("")).toBe("1970-01-01");
  });
});

describe("deriveExcerpt", () => {
  it("prefers an explicit excerpt, stripping decorative asterisks", () => {
    expect(deriveExcerpt("**A summary**", "body")).toBe("A summary");
    expect(deriveExcerpt("  spaced  ", "body")).toBe("spaced");
  });

  it("falls back to the first real paragraph, skipping headings and short lines", () => {
    const body = "# Title\n\nshort\n\nThis paragraph is definitely long enough to be chosen as the excerpt.\n";
    expect(deriveExcerpt(undefined, body)).toBe("This paragraph is definitely long enough to be chosen as the excerpt.");
  });

  it("truncates on a word boundary, not mid-word", () => {
    // Several word lengths, because ALIGNMENT decides whether this test can see the bug at
    // all: with 17-character repeats, character 180 lands exactly on a space, so a naive
    // slice(0, 180) and a proper word-boundary cut produce the same string. My first version
    // used only that fixture and the mutation walked straight past it.
    for (const word of ["alpha", "abcdefg", "hi", "considerable"]) {
      // Sized by word length, not a fixed repeat count: "hi ".repeat(40) is 123 characters, so
      // it never reaches the 180 threshold and the fixture silently tested nothing.
      const reps = Math.ceil(300 / (word.length + 1));
      const long = `${`${word} `.repeat(reps)}end`;
      const out = deriveExcerpt(undefined, long);
      expect(out.length, word).toBeLessThanOrEqual(182);
      expect(out.endsWith("…"), word).toBe(true);
      const text = out.slice(0, -1);
      expect(long.startsWith(text), `${word}: the excerpt is not a prefix of the body`).toBe(true);
      expect(long[text.length], `${word}: cut mid-word at ${JSON.stringify(long.slice(text.length - 4, text.length + 4))}`).toBe(" ");
    }
  });

  it("keeps the whole first paragraph when it is short enough", () => {
    const long = `${"alpha beta gamma ".repeat(20)}end`;
    const out = deriveExcerpt(undefined, long);
    expect(out.endsWith("…")).toBe(true);

    // The property, stated properly. My first attempt asserted the text did not END in a
    // letter, which a correct word-boundary cut always does — it ends on a whole word. What
    // actually distinguishes a clean cut is that the character FOLLOWING it in the source is a
    // space, so no word was sliced in half.
    expect(long.startsWith(out.slice(0, -1))).toBe(true);
  });

  it("returns empty rather than throwing when there is nothing to use", () => {
    expect(deriveExcerpt(undefined, "")).toBe("");
    expect(deriveExcerpt(undefined, "# only a heading")).toBe("");
  });
});

describe("articleJsonLd", () => {
  const SITE = "https://kishore2494.github.io/personal-site-2";
  const base = {
    title: "A Title", excerpt: "A summary.", date: "2025-03-07", slug: "a-title",
    tags: ["ai"], categories: ["Machine Learning"],
  };

  it("always carries an absolute image, even with no cover", () => {
    // Google lists image as REQUIRED for Article rich results. Both builders dropped the
    // property when an article had no cover, so 15 of 26 articles shipped structured data that
    // was present, valid, and disqualifying.
    const withCover = articleJsonLd({ ...base, cover: "https://cdn.example.com/a.jpg" }, SITE, "K");
    expect(withCover.image).toBe("https://cdn.example.com/a.jpg");

    for (const cover of [undefined, "", null as unknown as string]) {
      const out = articleJsonLd({ ...base, cover }, SITE, "K");
      expect(out.image, `cover=${JSON.stringify(cover)} produced no image`).toBeTruthy();
      expect(String(out.image)).toMatch(/^https:\/\//);
    }
  });

  it("carries every property Google requires", () => {
    const ld = articleJsonLd(base, SITE, "K") as Record<string, unknown>;
    for (const k of ["@context", "@type", "headline", "image", "datePublished", "author"]) {
      expect(ld[k], `missing ${k}`).toBeTruthy();
    }
    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.mainEntityOfPage).toBe(`${SITE}/articles/a-title`);
  });

  it("does not invent a dateModified", () => {
    // Recommended by Google, absent from the frontmatter. Filling it with datePublished or a
    // file mtime would tell crawlers the article was revised on a day nothing happened — a
    // missing recommendation costs less than a false fact.
    expect(articleJsonLd(base, SITE, "K")).not.toHaveProperty("dateModified");
  });

  it("survives an article with no tags or categories", () => {
    const ld = articleJsonLd({ ...base, tags: undefined, categories: undefined }, SITE, "K");
    expect(ld.keywords).toBe("");
    expect(ld.articleSection).toBe("");
  });
});
