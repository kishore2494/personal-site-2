// Do the two markdown pipelines actually agree?
//
// This site renders article markdown twice: markdown-it at prerender time (what crawlers and
// the first paint see) and react-markdown after hydration (what the reader ends up with).
// scripts/check-pipeline-parity.mjs already checks that both sides DECLARE the same rules, but
// declaring the same rules is not the same as producing the same HTML — the heading fix once
// landed on the React side only, and nothing noticed that dist/ was unchanged.
//
// These tests render the SAME markdown through BOTH and compare the structure that matters for
// SEO and accessibility: heading outline, code-fence languages, and link targets. Prose-level
// differences (smart quotes and similar) are deliberately not asserted here; see the pinned
// typography test at the bottom, which documents where the two genuinely differ and why.

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "@/components/Markdown";
import { renderBody } from "../../../scripts/markdown-pipeline.mjs";

const crawlerHtml = (src: string) => renderBody(src);
const appHtml = (src: string) => renderToStaticMarkup(<Markdown>{src}</Markdown>);

/** The heading outline: the levels, in document order. */
const headings = (html: string) => [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));

/** Languages of ACTUALLY HIGHLIGHTED code blocks, in order.
 *
 * Keyed on the `hljs` class, not on `language-*`. markdown-it emits `language-bash` from the
 * fence label whether or not it highlighted anything, so matching the label made this blind:
 * removing the bash grammar left the label in place and the test still passed. Only a block
 * that was highlighted carries `hljs`. */
const codeLangs = (html: string) =>
  [...html.matchAll(/<code class="[^"]*\bhljs\b[^"]*language-([a-z0-9+#-]+)/g)].map((m) => m[1]);

/** Link targets, in order. */
const hrefs = (html: string) => [...html.matchAll(/<a[^>]+href="([^"]*)"/g)].map((m) => m[1]);

const CASES: Record<string, string> = {
  "medium-style body starting at h1": "# Section One\n\nText.\n\n## Sub\n\nMore.\n\n# Section Two\n\nEnd.\n",
  "body already starting at h2": "## Alpha\n\nText.\n\n### Beta\n\nMore.\n",
  "body starting at h3 (must be promoted)": "### Deep\n\nText.\n\n#### Deeper\n\nMore.\n",
  "mixed depths": "## A\n\n# B\n\n### C\n",
  "no headings at all": "Just a paragraph of prose.\n",
  // The real Medium shape: # for sections, ### for points, ## never typed. The old shift rule
  // turned this into h2/h4 and the audit flagged it on five live articles.
  "gapped levels, the common Medium shape": "# Section\n\nText.\n\n### Point\n\nMore.\n\n# Section Two\n\n### Point Two\n",
  "gapped, starting deep": "### Deep\n\nText.\n\n# Shallow\n\n##### Deepest\n",
};

describe("heading outline agrees across both pipelines", () => {
  for (const [name, src] of Object.entries(CASES)) {
    it(name, () => {
      const a = headings(crawlerHtml(src));
      const b = headings(appHtml(src));
      expect(b, "app pipeline disagrees with the crawler pipeline").toEqual(a);
      // And the rule itself: nothing in a body may be an h1, since the page template owns it.
      expect(a.every((l) => l >= 2), `body emitted an h1: ${a.join(",")}`).toBe(true);
      // No skipped levels. The page's own h1 sits above these, so the shallowest must be h2 and
      // each distinct depth below it must be reachable one step at a time — a jump straight to
      // h4 is what the audit flags and what the old shift rule produced.
      const distinct = [...new Set(a)].sort((x, y) => x - y);
      if (distinct.length) {
        expect(distinct[0], `outline starts at h${distinct[0]}, leaving a gap under the title`).toBe(2);
        distinct.forEach((lvl, i) => {
          expect(lvl, `heading outline skips a level: ${distinct.join(" -> ")}`).toBe(2 + i);
        });
      }
    });
  }
});

describe("code fences agree across both pipelines", () => {
  it("registered languages are highlighted identically", () => {
    const src = "```python\nx = 1\nprint(x)\n```\n\ntext\n\n```bash\necho hi\n```\n";
    expect(codeLangs(appHtml(src))).toEqual(codeLangs(crawlerHtml(src)));
    expect(codeLangs(crawlerHtml(src))).toEqual(["python", "bash"]);
  });

  it("an unregistered language is left unhighlighted by both", () => {
    // If one side highlighted rust and the other did not, hydration would visibly repaint.
    const src = "```rust\nfn main() {}\n```\n";
    const c = crawlerHtml(src);
    const a = appHtml(src);
    expect(/hljs-/.test(c), "crawler pipeline highlighted an unregistered language").toBe(false);
    expect(/hljs-/.test(a), "app pipeline highlighted an unregistered language").toBe(false);
  });

  it("both emit hljs token spans for a registered language", () => {
    const src = "```python\n# a comment\nx = 'str'\n```\n";
    expect(/hljs-/.test(crawlerHtml(src)), "crawler pipeline emitted no hljs tokens").toBe(true);
    expect(/hljs-/.test(appHtml(src)), "app pipeline emitted no hljs tokens").toBe(true);
  });
});

describe("links agree across both pipelines", () => {
  it("ordinary links point at the same targets", () => {
    const src = "See [the docs](https://example.com/docs) and [more](https://example.com/more).\n";
    expect(hrefs(appHtml(src))).toEqual(hrefs(crawlerHtml(src)));
  });
});
