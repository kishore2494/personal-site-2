// Audit the auditor.
//
// scripts/audit-dist.mjs decides whether 45 prerendered pages are fit to deploy, and it runs on
// every build. It is 326 lines of hand-rolled regex over HTML, and nothing tested it. A bug in
// resolves(), or in the sitemap comparison, does not announce itself — it reports "clean" on a
// broken site, which is worse than having no audit at all, because the green is believed.
//
// So: build a tiny dist/ in a temp directory, seed exactly one defect at a time, and require the
// real script to catch each one. The clean fixture must pass, or every "caught" below would just
// be the audit failing for some unrelated reason.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "audit-dist.mjs");
const SITE = "https://example.test/base";

let dir: string;

/** A minimal page that passes every check, so a test only ever changes one thing. */
function page(path: string, overrides: Partial<Record<string, string>> = {}) {
  const canonical = overrides.canonical ?? `${SITE}${path === "/" ? "/" : `${path}/`}`;
  return `<!doctype html><html lang="en"><head>
<title>${overrides.title ?? `Page ${path}`}</title>
<meta name="description" content="${overrides.description ?? `About ${path}`}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${overrides.title ?? `Page ${path}`}">
<meta property="og:description" content="d">
<meta property="og:url" content="${overrides.ogUrl ?? canonical}">
<meta property="og:image" content="${overrides.ogImage ?? `${SITE}/og.png`}">
</head><body>
<h1>Heading</h1>
${overrides.body ?? ""}
</body></html>`;
}

function write(rel: string, content: string) {
  const full = join(dir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/** A clean two-page site with a matching sitemap. */
function fixture() {
  write("vite.config.ts", `const BASE = "/base/";\nexport default { base: BASE };\n`);
  write("dist/index.html", page("/"));
  write("dist/about/index.html", page("/about"));
  write(
    "dist/sitemap.xml",
    `<?xml version="1.0"?><urlset><url><loc>${SITE}/</loc></url><url><loc>${SITE}/about/</loc></url></urlset>`,
  );
}

const run = (...args: string[]) => {
  const r = spawnSync("node", [SCRIPT, ...args], { cwd: dir, encoding: "utf8" });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
};

beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "audit-fixture-")); fixture(); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("audit-dist catches what it claims to", () => {
  it("passes a clean site — otherwise nothing below means anything", () => {
    const { code, out } = run("--strict", "--fail-systemic");
    expect(code, out).toBe(0);
    expect(out).toContain("audited 2 prerendered pages");
  });

  it("catches a dead internal link", () => {
    write("dist/about/index.html", page("/about", { body: `<a href="/base/ghost/">gone</a>` }));
    const { code, out } = run("--strict");
    expect(code).toBe(1);
    expect(out).toMatch(/dead internal link/);
  });

  it("catches an image with no alt", () => {
    write("dist/about/index.html", page("/about", { body: `<img src="/base/x.png">` }));
    const { code, out } = run("--strict");
    expect(code).toBe(1);
    expect(out).toMatch(/without alt/);
  });

  it("catches a canonical pointing at a different page", () => {
    write("dist/about/index.html", page("/about", { canonical: `${SITE}/somewhere-else/` }));
    const { code, out } = run("--strict");
    expect(code).toBe(1);
    expect(out).toMatch(/canonical points at/);
  });

  it("catches two pages claiming the same canonical", () => {
    // The regression that collapses a whole site into one indexed page. Hard-fails, so it does
    // not need --strict.
    write("dist/about/index.html", page("/about", { canonical: `${SITE}/` }));
    const { code, out } = run();
    expect(code).toBe(1);
    expect(out).toMatch(/claimed by more than one page/);
  });

  it("catches og:url disagreeing with canonical", () => {
    write("dist/about/index.html", page("/about", { ogUrl: `${SITE}/` }));
    const { code, out } = run("--strict");
    expect(code).toBe(1);
    expect(out).toMatch(/og:url .* disagrees with canonical/);
  });

  it("catches a relative og:image", () => {
    write("dist/about/index.html", page("/about", { ogImage: "/base/og.png" }));
    const { code, out } = run("--strict");
    expect(code).toBe(1);
    expect(out).toMatch(/og:image is relative/);
  });

  it("catches a sitemap URL that was never built", () => {
    const xml = readFileSync(join(dir, "dist/sitemap.xml"), "utf8")
      .replace("</urlset>", `<url><loc>${SITE}/phantom/</loc></url></urlset>`);
    write("dist/sitemap.xml", xml);
    const { code, out } = run();
    expect(code).toBe(1);
    expect(out).toMatch(/listed but not built/);
  });

  it("catches a page missing from the sitemap", () => {
    write("dist/hidden/index.html", page("/hidden"));
    const { code, out } = run();
    expect(code).toBe(1);
    expect(out).toMatch(/built but not listed/);
  });

  it("refuses to call an EMPTY dist clean", () => {
    // The failure that makes every other check vacuous: audit nothing, report nothing wrong.
    // An EMPTY sitemap too, deliberately: the sitemap comparison runs before this check, so
    // deleting dist/ wholesale trips "sitemap.xml is missing" instead and proves something else.
    // Isolating the case is the difference between testing this check and testing that one.
    rmSync(join(dir, "dist"), { recursive: true, force: true });
    mkdirSync(join(dir, "dist"));
    write("dist/sitemap.xml", `<?xml version="1.0"?><urlset></urlset>`);
    const { code, out } = run("--strict");
    expect(code).toBe(1);
    expect(out).toMatch(/audited NO pages/);
  });

  it("catches a missing sitemap rather than skipping the comparison", () => {
    rmSync(join(dir, "dist/sitemap.xml"));
    const { code, out } = run();
    expect(code).toBe(1);
    expect(out).toMatch(/sitemap\.xml is missing/);
  });
});
