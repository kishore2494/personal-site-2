// The crawler-facing markdown pipeline, in one place.
//
// This site renders article markdown TWICE, through separate stacks:
//
//   crawlers + first paint   this file (markdown-it)      via scripts/prerender.mjs
//   after hydration          src/components/Markdown.tsx  (react-markdown)
//
// They must agree, and keeping them agreeing is the whole problem — the heading fix once
// landed on the React side only and changed nothing in dist/, which is the half that matters
// for SEO. This module exists so the prerender half is importable and therefore TESTABLE:
// prerender.mjs writes files at import time, so nothing could exercise its renderer directly.
// tests/pipeline-parity.test.ts now renders the same markdown through both and compares them.
//
// Anything here that has a counterpart on the React side is called out in a comment. See also
// scripts/check-pipeline-parity.mjs, which checks that the two sides still DECLARE the same
// rules, and runs in prebuild.

import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/core";
import hljsPython from "highlight.js/lib/languages/python";
import hljsBash from "highlight.js/lib/languages/bash";
import { outlineLevels } from "./heading-outline.mjs";

// Highlight code fences at PRERENDER time.
//
// Until this existed, dist/ shipped zero hljs classes: highlighting happened only client-side,
// after React hydrated. A crawler saw unstyled code, and so did the reader until the JS landed
// — on the article route that meant waiting for a 356 kB chunk before the page looked right.
//
// Only python and bash are registered, matching src/lib/rehypeHighlightMinimal.ts. lowlight
// (what the client uses) is built on highlight.js, so both pipelines emit identical hljs-*
// markup and the pre- and post-hydration renders agree. scripts/check-code-languages.mjs
// guards the language list for both.
hljs.registerLanguage("python", hljsPython);
hljs.registerLanguage("bash", hljsBash);

export const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (!lang || !hljs.getLanguage(lang)) return "";   // unknown -> markdown-it escapes it plainly
    const out = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    // Emit the wrapper ourselves so the class list matches the client's exactly.
    return `<pre><code class="hljs language-${lang}">${out}</code></pre>`;
  },
});

// Normalise body heading levels so an article gets a real outline under the page title.
//
// The page template emits the title as the single <h1>. Articles sync in from Medium, where
// `#` is how you write a SECTION heading, so bodies arrive full of <h1>s — one article had 34,
// leaving crawlers and screen readers with no outline.
//
// This used to shift every heading by (2 - shallowest). That put the top section at h2 but kept
// the GAPS: Medium authors use `#` and `###` and essentially never type `##`, so {1,3} became
// {2,4} and the outline jumped h2 -> h4. The audit flagged that on five articles.
//
// Heading normalisation lives in scripts/heading-outline.mjs and is shared with
// src/lib/rehypeDemoteHeadings.ts, so the two pipelines cannot drift.
export function renderBody(src) {
  const tokens = md.parse(src, {});
  const levels = tokens.filter((t) => t.type === "heading_open").map((t) => Number(t.tag.slice(1)));
  if (levels.length) {
    // Positional, not by value: outlineLevels returns one rank per heading IN ORDER, so the
    // close tag has to reuse the rank its open tag was given rather than look one up.
    const ranks = outlineLevels(levels);
    let i = -1;
    for (const t of tokens) {
      if (t.type === "heading_open") t.tag = `h${ranks[++i]}`;
      else if (t.type === "heading_close") t.tag = `h${ranks[i]}`;
    }
  }
  return md.renderer.render(tokens, md.options, {});
}
