// Test the last gate.
//
// verify-live.mjs is what decides a deploy actually happened. It runs in the deploy workflow
// right after deploy-pages, and if its comparison were vacuous every broken deploy would report
// success — which is the exact failure it was written to catch on the Daylog repo, where a push
// landed with no workflow run and every command said fine.
//
// Nothing tested it. So: serve a fixture site on localhost, point the script at it with
// VERIFY_SITE, and require it to pass on a good deploy and fail on each way one goes wrong.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "verify-live.mjs");
const COMMIT = "abc123def456";

/** What the fixture serves; mutated per test. */
let routes: Record<string, { status: number; body: string }> = {};
let server: Server;
let base = "";

const page = (commit: string | null) =>
  `<!doctype html><html><head>${commit ? `<meta name="build-commit" content="${commit}">` : ""}` +
  `<title>x</title></head><body>ok</body></html>`;

const sitemap = (urls: string[]) =>
  `<?xml version="1.0"?><urlset>${urls.map((u) => `<url><loc>${u}</loc></url>`).join("")}</urlset>`;

/** A deploy where everything is correct. */
function healthy() {
  routes = {
    "/": { status: 200, body: page(COMMIT) },
    "/sitemap.xml": { status: 200, body: sitemap([`${base}/`, `${base}/articles/a-post/`, `${base}/projects/a-thing/`, `${base}/about/`]) },
    "/articles/a-post/": { status: 200, body: page(COMMIT) },
    "/projects/a-thing/": { status: 200, body: page(COMMIT) },
    "/about/": { status: 200, body: page(COMMIT) },
  };
}

// ASYNC on purpose. spawnSync blocks this worker's event loop, and the fixture server lives in
// the same process — so the script's fetch could never be answered and every case failed with
// "operation aborted due to timeout", looking exactly like a broken script.
//
// cwd is a directory with no dist/, so the script takes its published-sitemap path — the branch
// CI actually uses.
const run = () =>
  new Promise<{ code: number | null; out: string }>((resolve) => {
    execFile("node", [SCRIPT, COMMIT], {
      cwd: "/",
      env: { ...process.env, VERIFY_SITE: `${base}/`, VERIFY_TIMEOUT_MS: "1500", PATH: process.env.PATH ?? "" },
    }, (err, stdout, stderr) => {
      resolve({ code: err ? ((err as NodeJS.ErrnoException & { code?: number }).code ?? 1) as number : 0, out: `${stdout}${stderr}` });
    });
  });

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0]!;
    const hit = routes[path];
    if (!hit) { res.writeHead(404, { "content-type": "text/html" }); res.end("nope"); return; }
    res.writeHead(hit.status, { "content-type": "text/html" });
    res.end(hit.body);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;
  healthy();
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe("verify-live", () => {
  it("passes a deploy where every sampled route serves the expected commit", async () => {
    healthy();
    const { code, out } = await run();
    expect(code, out).toBe(0);
    expect(out).toMatch(/is serving abc123def456/);
    expect(out).toMatch(/all sampled routes serve the expected build/);
  });

  // 30s: past the poll deadline the script shells out to `gh run list` to tell a missed
  // trigger from a merely slow build, which outlives vitest's 5s default.
  it("fails when the homepage is still serving the PREVIOUS commit", async () => {
    // The original failure: a push that never triggered a workflow.
    healthy();
    routes["/"] = { status: 200, body: page("0000000stale") };
    const { code, out } = await run();
    expect(code).toBe(1);
    expect(out).toMatch(/live is 0000000stale/);
  }, 30_000);

  it("fails when the page carries no build-commit at all", async () => {
    healthy();
    routes["/"] = { status: 200, body: page(null) };
    const { code, out } = await run();
    expect(code).toBe(1);
    expect(out).toMatch(/no build-commit meta/);
  }, 30_000);

  it("fails when an ARTICLE route 404s while the homepage is perfect", async () => {
    // The case the deep-link sampling exists for: prerendering stops emitting a category, the
    // homepage is current, and nothing else would notice.
    healthy();
    routes["/articles/a-post/"] = { status: 404, body: "" };
    const { code, out } = await run();
    expect(code).toBe(1);
    expect(out).toMatch(/BAD\s+404/);   // the script pads: "BAD  404"
    expect(out).toMatch(/deep links are not serving/);
  });

  it("fails when a deep link serves a DIFFERENT commit than the homepage", async () => {
    healthy();
    routes["/projects/a-thing/"] = { status: 200, body: page("0000000stale") };
    const { code, out } = await run();
    expect(code).toBe(1);
    expect(out).toMatch(/deep links are not serving/);
  });

  it("fails rather than passing when the sitemap has no urls", async () => {
    // An empty sitemap would otherwise sample nothing and report every route fine.
    healthy();
    routes["/sitemap.xml"] = { status: 200, body: sitemap([]) };
    const { code, out } = await run();
    expect(code).toBe(1);
    expect(out).toMatch(/no <loc> entries|could not fetch the published one/);
  });
});
