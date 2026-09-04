import { visit } from "unist-util-visit";
import { outlineLevels } from "../../scripts/heading-outline.mjs";

/** Map an article body's heading levels onto consecutive levels starting at h2.
 *
 * Shared by both markdown pipelines. scripts/markdown-pipeline.mjs implements the identical
 * rule for the prerendered HTML, and src/lib/__tests__/pipelineParity.test.tsx renders the same
 * markdown through both to check they still agree.
 */
// The outline rule itself lives in scripts/heading-outline.mjs, shared with the prerender
// pipeline so the two cannot disagree.

/**
 * Normalise heading levels in an article body so it has a real outline under the page title.
 *
 * The article page already renders the title as the page's single `<h1>`. Articles sync in
 * from Medium, where `#` is the normal way to write a *section* heading, so bodies arrive
 * full of `<h1>`s — one page had 34. That leaves a document with no outline: search engines
 * get no hierarchy, and a screen-reader user cycling headings hears three dozen top-level
 * items instead of a structure.
 *
 * This used to shift every heading by `2 - shallowest`, which put the top section at h2 but
 * preserved the GAPS between levels. Medium authors reach for `#` and `###` and essentially
 * never type `##`, so `{1,3}` shifted to `{2,4}` and the outline jumped h2 -> h4. The audit
 * caught that on five articles; a skipped level is a genuine accessibility complaint, not a
 * cosmetic one.
 *
 * So the levels are RANKED rather than shifted: the distinct levels present are mapped onto
 * consecutive levels from h2 up. `{1,3}` becomes `{2,3}`, `{2,4}` becomes `{2,3}`, `{1,2,4}`
 * becomes `{2,3,4}`. Relative nesting is preserved exactly — a heading deeper than another
 * stays deeper — while the gaps that produce the jumps disappear. Ranks clamp at h6, so an
 * article with more than five distinct levels flattens at the bottom rather than overflowing.
 */
export default function rehypeDemoteHeadings() {
  return function transform(tree: unknown): undefined {
    const levels: number[] = [];
    visit(tree as never, "element", (node: { tagName?: string }) => {
      const m = /^h([1-6])$/.exec(node.tagName ?? "");
      if (m) levels.push(Number(m[1]));
    });
    if (!levels.length) return;
    // Positional: one rank per heading in document order, consumed in the same order.
    const ranks = outlineLevels(levels);
    let i = 0;
    visit(tree as never, "element", (node: { tagName?: string }) => {
      const m = /^h([1-6])$/.exec(node.tagName ?? "");
      if (m) node.tagName = `h${ranks[i++]}`;
    });
  };
}
