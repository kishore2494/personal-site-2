// The article outline rule, in one place.
//
// Articles sync in from Medium, where `#` is how people write a *section* heading, so bodies
// arrive full of h1s — one had 34 — and the page already renders the real title as its single
// h1. Something has to re-rank them.
//
// The first attempt shifted every heading by `2 - shallowest`, which put the top section at h2
// but preserved the GAPS: Medium authors type `#` and `###` and essentially never `##`, so
// {1,3} became {2,4} and the outline jumped h2 -> h4.
//
// The second attempt — ranking the DISTINCT levels onto consecutive numbers — fixed the gaps
// and looked right, but it maps by value and ignores document order. Three articles open with
// a `###` lead-in before their first `#`, so their levels are [3,1,1,3,...]: the ranking
// correctly yields {1->2, 3->3}, and the page still renders h1 (title) then h3. No gap in the
// SET, a skipped level in the DOCUMENT. That is the version the audit kept complaining about,
// and the complaint was right.
//
// So rank by position in the outline, not by value. Walk the headings in order keeping the
// chain of open ancestors: a heading deeper than the one above it nests one level below it, a
// heading at or above it closes the chain back to its own depth. The first heading is always
// h2, a level is never skipped, and relative nesting is preserved exactly.
//
// Used by BOTH pipelines — scripts/markdown-pipeline.mjs (crawlers, prerender) and
// src/lib/rehypeDemoteHeadings.ts (after hydration). One implementation, imported twice, so
// they cannot disagree; the same move scripts/site-urls.mjs made for the head tags.

/**
 * Map heading levels, in document order, onto a well-formed outline under the page's h1.
 * @param {number[]} levels source levels (1-6) in the order they appear
 * @returns {number[]} rendered levels, same length and order
 */
export function outlineLevels(levels) {
  const out = [];
  const ancestors = [];
  for (const lvl of levels) {
    // Anything at or above this level is a sibling or an uncle, not a parent.
    while (ancestors.length && ancestors[ancestors.length - 1] >= lvl) ancestors.pop();
    ancestors.push(lvl);
    // +1 because the page title occupies h1; clamp so pathological nesting cannot exceed h6.
    out.push(Math.min(6, 1 + ancestors.length));
  }
  return out;
}
