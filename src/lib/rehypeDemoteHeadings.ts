import { visit } from "unist-util-visit";

/**
 * Normalise heading levels in an article body so its shallowest heading becomes `<h2>`.
 *
 * The article page already renders the title as the page's single `<h1>`. Articles sync in
 * from Medium, where `#` is the normal way to write a *section* heading, so bodies arrive
 * full of `<h1>`s — one page had 34. That leaves a document with no outline: search engines
 * get no hierarchy, and a screen-reader user cycling headings hears three dozen top-level
 * items instead of a structure.
 *
 * A blind one-level demotion is not enough, because other articles start their sections at
 * `##` and would then jump h1 -> h3. Shifting every heading by `2 - shallowest` puts the top
 * section at h2 either way, and promotes an article that starts at `###`. Levels clamp to
 * 2..6 so nothing overflows past h6 or climbs back into h1.
 *
 * Mirrors `renderBody()` in scripts/prerender.mjs, which does the same for the prerendered
 * HTML via a separate markdown pipeline.
 */
export default function rehypeDemoteHeadings() {
  return function transform(tree: unknown): undefined {
    const levels: number[] = [];
    visit(tree as never, "element", (node: { tagName?: string }) => {
      const m = /^h([1-6])$/.exec(node.tagName ?? "");
      if (m) levels.push(Number(m[1]));
    });
    if (!levels.length) return;
    const shift = 2 - Math.min(...levels);
    if (shift === 0) return;
    visit(tree as never, "element", (node: { tagName?: string }) => {
      const m = /^h([1-6])$/.exec(node.tagName ?? "");
      if (m) node.tagName = `h${Math.min(6, Math.max(2, Number(m[1]) + shift))}`;
    });
  };
}
