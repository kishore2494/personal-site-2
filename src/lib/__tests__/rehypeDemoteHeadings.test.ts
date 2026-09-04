import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import demote from "../rehypeDemoteHeadings";

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
