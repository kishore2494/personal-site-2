import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import demote from "../rehypeDemoteHeadings";
import { outlineLevels } from "../../../scripts/heading-outline.mjs";

// The article page renders the title as the page's single <h1>. Articles sync in from Medium,
// where `#` is how you write a SECTION heading, so bodies arrive full of <h1>s — one article
// shipped with 34 of them, leaving crawlers and screen readers no outline at all.
const levels = (md: string) => {
  const tree: any = unified().use(remarkParse).use(remarkRehype)
    .runSync(unified().use(remarkParse).parse(md));
  demote()(tree);
  const out: number[] = [];
  const walk = (n: any) => {
    const m = /^h([1-6])$/.exec(n.tagName ?? "");
    if (m) out.push(Number(m[1]));
    (n.children ?? []).forEach(walk);
  };
  walk(tree);
  return out;
};

describe("rehypeDemoteHeadings", () => {
  it("shifts a body that starts at # so its top section becomes h2", () => {
    expect(levels("# One\n\n## Two\n\n### Three")).toEqual([2, 3, 4]);
  });

  it("leaves a body that already starts at ## alone", () => {
    // A blind one-level demotion was the first attempt and was WRONG here: it pushed these
    // to h3 and jumped straight from the page's h1.
    expect(levels("## Two\n\n### Three")).toEqual([2, 3]);
  });

  it("promotes a body that starts too deep", () => {
    expect(levels("### Three\n\n#### Four")).toEqual([2, 3]);
  });

  it("clamps at h6 rather than inventing h7", () => {
    expect(levels("# a\n\n###### f").every((l) => l >= 2 && l <= 6)).toBe(true);
  });

  it("is a no-op on a body with no headings", () => {
    expect(levels("just a paragraph")).toEqual([]);
  });
});

// Gapped level sets are the case the old shift rule got wrong, and the case the existing tests
// happened not to cover: every one of them used contiguous levels, where shifting and ranking
// agree, so the bug shipped with a green suite. Medium authors reach for `#` and `###` and
// essentially never type `##`, so this is the common shape, not an edge case.
describe("gapped heading levels are closed up, not just shifted", () => {
  it("{1,3} becomes {2,3}, not {2,4}", () => {
    expect(levels("# Section\n\n### Point\n\n# Section Two\n\n### Point Two\n")).toEqual([2, 3, 2, 3]);
  });

  it("{2,4} becomes {2,3}", () => {
    expect(levels("## Alpha\n\n#### Deep\n\n## Beta\n")).toEqual([2, 3, 2]);
  });

  it("{1,2,4} becomes {2,3,4}, keeping three distinct depths", () => {
    expect(levels("# A\n\n## B\n\n#### C\n")).toEqual([2, 3, 4]);
  });

  // This test used to assert [3, 2, 4] — "the h1 outranks the h3 that preceded it". That reads
  // reasonably and was wrong, because it is a statement about SOURCE levels and the output is a
  // document outline. It produced a body whose first heading was h3 directly under the page's
  // h1, and which stepped 2 -> 4. Three real articles open with a `###` lead-in and were
  // rendering exactly that; the audit had been reporting it as "heading level jumps h1 -> h3"
  // the whole time.
  //
  // You cannot both start at h2 and keep a later `#` ranked above an earlier `###`: nothing
  // precedes the first heading for it to nest under. Outline depth wins, so a shallower heading
  // arriving after a deeper one becomes its SIBLING rather than its parent.
  it("a deeper heading before a shallower one still starts the outline at h2", () => {
    const got = levels("### Deep\n\n# Shallow\n\n##### Deepest\n");
    expect(got).toEqual([2, 2, 3]);
    expect(got[0]).toBe(2);                 // never h3 under the page title
    expect(got[2]).toBeGreaterThan(got[1]); // and the deepest still nests under what precedes it
  });

  it("nothing ever skips a level, on any real article body", () => {
    // The property that actually matters, asserted directly instead of via examples. Every one
    // of these shapes is taken from an article in src/content/articles.
    const shapes = [
      [1, 1, 1, 1],                      // pure Medium: every section an h1
      [3, 1, 1, 3, 3, 3, 3, 1],          // ai-in-2027 — the ### lead-in
      [3, 3, 1, 1, 1, 1],                // uncensored-multi-agent — two lead-ins
      [3, 1, 1, 1, 3],                   // vibe-coding
      [1, 2, 3, 4, 5, 6, 6],             // fully nested
      [2, 4, 4, 2],                      // {2,4}
      [5],
    ];
    for (const shape of shapes) {
      const out = outlineLevels(shape);
      expect(out[0], `${JSON.stringify(shape)} must start at h2`).toBe(2);
      for (let i = 1; i < out.length; i++) {
        expect(out[i] - out[i - 1], `${JSON.stringify(shape)} skips at index ${i}`).toBeLessThanOrEqual(1);
      }
      expect(Math.max(...out)).toBeLessThanOrEqual(6);
      expect(out).toHaveLength(shape.length);
    }
  });
});
