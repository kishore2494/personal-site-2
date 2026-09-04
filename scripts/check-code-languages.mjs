// Guard for src/lib/rehypeHighlightMinimal.ts.
//
// That plugin registers only the highlight.js grammars the articles actually use, which is
// what keeps the ArticleDetail bundle ~143 kB smaller than rehype-highlight's default
// `common` set. The risk is that articles arrive here automatically (the Medium / Site-1
// sync), so a new post could introduce a language nobody registered — and the failure is
// silent: the fence just renders unhighlighted.
//
// This runs in prebuild and prints a loud warning naming the language and the file. It does
// NOT fail the build: an unhighlighted code block is a cosmetic regression, and a content
// sync should never be able to break a deploy.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REGISTERED = new Set(["python", "bash"]);
// Aliases highlight.js resolves to a grammar we already register.
const ALIASES = new Map([["py", "python"], ["sh", "bash"], ["shell", "bash"], ["zsh", "bash"]]);

const roots = ["src/content", "content"];
const found = new Map(); // lang -> Set<file>
let scanned = 0;         // how many markdown files were actually read

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".md") || name.endsWith(".mdx")) { scanned++; scan(p); }
  }
}

function scan(file) {
  const text = readFileSync(file, "utf8");
  let fenced = false;
  for (const line of text.split("\n")) {
    const m = /^\s*```+\s*([A-Za-z0-9+#_-]+)/.exec(line);
    if (m && !fenced) {
      const lang = m[1].toLowerCase();
      const resolved = ALIASES.get(lang) ?? lang;
      if (!REGISTERED.has(resolved)) {
        if (!found.has(lang)) found.set(lang, new Set());
        found.get(lang).add(file);
      }
      fenced = true;
    } else if (/^\s*```+\s*$/.test(line)) {
      fenced = !fenced;
    }
  }
}

for (const r of roots) walk(r);

// An empty scan is not a pass.
//
// walk() swallows a missing directory, so if the content root ever moves this script happily
// reported "all languages registered" having read nothing at all — success it had not earned,
// which is the exact failure it exists to catch. Verified by moving src/content aside: it
// printed the success line and exited 0.
if (scanned === 0) {
  console.error(`\n\x1b[31m\u2717 scanned NO markdown files under ${roots.join(" or ")}.\x1b[0m`);
  console.error("   The content root has moved, or the sync wrote somewhere else. This check is");
  console.error("   blind until that is fixed — treating it as a pass would be worse than useless.\n");
  process.exit(1);
}

if (found.size === 0) {
  console.log(`code fences: ${scanned} files scanned, all languages registered (${[...REGISTERED].join(", ")})`);
} else {
  console.warn("\n\x1b[33m⚠ unregistered code-fence language(s) — these render WITHOUT highlighting:\x1b[0m");
  for (const [lang, files] of found) {
    console.warn(`   ${lang}  (${files.size} file${files.size > 1 ? "s" : ""})`);
    for (const f of [...files].slice(0, 3)) console.warn(`     - ${f}`);
  }
  console.warn("   Fix: add the grammar to src/lib/rehypeHighlightMinimal.ts and to");
  console.warn("   REGISTERED in this script. Each one costs a few kB in the article bundle.\n");
}
