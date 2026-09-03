import { createLowlight } from "lowlight";
import { visit } from "unist-util-visit";
import { toText } from "hast-util-to-text";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";

/**
 * A drop-in replacement for `rehype-highlight` that bundles only the grammars we
 * actually use.
 *
 * `rehype-highlight` does `import {common, createLowlight} from 'lowlight'` at module
 * top level, so lowlight's `common` set (~37 grammars) lands in the bundle no matter
 * what you pass as options — its `languages` option only changes what gets *registered*
 * at runtime, not what gets *bundled*. That was the single biggest thing in the
 * ArticleDetail route.
 *
 * Every code fence across all 26 articles is `python` or `bash`, so only those two are
 * registered here. A fence in any other language still renders as plain text (auto
 * detection stays off, matching rehype-highlight's default), so a future article using
 * something new degrades gracefully instead of breaking the page.
 */
const lowlight = createLowlight({ python, bash });

type El = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: unknown[];
  data?: { language?: string };
};

/** Mirror rehype-highlight's `language()`: false = explicitly opted out. */
function languageOf(node: El): string | false | undefined {
  const list = node.properties?.className;
  if (!Array.isArray(list)) return undefined;
  let name: string | undefined;
  for (const raw of list) {
    const value = String(raw);
    if (value === "no-highlight" || value === "nohighlight") return false;
    if (!name && value.slice(0, 5) === "lang-") name = value.slice(5);
    if (!name && value.slice(0, 9) === "language-") name = value.slice(9);
  }
  return name;
}

export default function rehypeHighlightMinimal() {
  return function transform(tree: unknown): undefined {
    visit(tree as never, "element", (node: El, _index, parent: El | undefined) => {
      if (node.tagName !== "code" || parent?.type !== "element" || parent.tagName !== "pre") {
        return;
      }
      const lang = languageOf(node);
      // No language and detection off (rehype-highlight's default) -> leave alone.
      if (lang === false || !lang) return;

      node.properties = node.properties ?? {};
      if (!Array.isArray(node.properties.className)) node.properties.className = [];
      const classes = node.properties.className as string[];
      if (!classes.includes("hljs")) classes.unshift("hljs");

      let result;
      try {
        result = lowlight.highlight(lang, toText(node as never, { whitespace: "pre" }));
      } catch {
        // Unregistered grammar: render the fence unhighlighted rather than throwing.
        return;
      }
      if (result.children.length > 0) node.children = result.children as unknown[];
    });
  };
}
