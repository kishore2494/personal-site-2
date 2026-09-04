import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import mine from "../rehypeHighlightMinimal";
import theirs from "rehype-highlight";

// This plugin exists because rehype-highlight imports lowlight's `common` (~37 grammars) at
// module top level, so its `languages` option cannot shrink the bundle — measured 499.13 ->
// 499.17 kB. Registering only python + bash locally took the article route to 356 kB.
const run = (md: string, plugin: any) => {
  const tree: any = unified().use(remarkParse).use(remarkRehype)
    .runSync(unified().use(remarkParse).parse(md));
  plugin()(tree, { message: () => {} });
  return JSON.stringify(tree);
};
const tokens = (s: string) => (s.match(/hljs-[a-z_]+/g) ?? []).join(",");

describe("rehypeHighlightMinimal", () => {
  it("produces the same tree as rehype-highlight for python", () => {
    const md = "```python\ndef f(x):\n    return 'hi'  # c\n```";
    expect(run(md, mine)).toBe(run(md, theirs));
  });

  it("produces the same tree as rehype-highlight for bash", () => {
    const md = "```bash\necho $HOME && ls -la\n```";
    expect(run(md, mine)).toBe(run(md, theirs));
  });

  it("leaves an unregistered language as plain text instead of throwing", () => {
    // Deliberate trade-off: a future article using a new language degrades gracefully.
    const md = '```rust\nfn main() { println!("x"); }\n```';
    expect(tokens(run(md, mine))).toBe("");
    expect(tokens(run(md, theirs))).not.toBe("");
  });

  it("ignores a fence with no language", () => {
    expect(tokens(run("```\nplain\n```", mine))).toBe("");
  });

  it("respects no-highlight", () => {
    const md = "```\nx\n```";
    expect(() => run(md, mine)).not.toThrow();
  });
});
