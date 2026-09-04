// Prove what the live site is actually serving, instead of inferring it from a green push.
//
// Deployment is `on: push` to GitHub Pages. That trigger cannot be trusted on its own — the
// Daylog repo observed a push land and register NO workflow run at all, so the site stayed on
// the previous version while every command reported success. This site also receives content
// automatically (the Medium / Site-1 sync), so a silently stale deploy would go unnoticed
// indefinitely: the commits look pushed, the workflow list looks fine, and nobody reloads the
// page expecting the old one.
//
// prerender.mjs stamps <meta name="build-commit"> into every page. This fetches the live URL
// and compares.
//
//   npm run verify:live              expect the current git HEAD
//   node scripts/verify-live.mjs abc1234    expect a specific commit
//
// Exits non-zero if the live site is serving something else, so CI or a deploy script can
// actually fail on it.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The URL is overridable so this script can be pointed at a fixture and TESTED. It is the last
// gate before a deploy is called good — if its comparison were vacuous, every broken deploy
// would pass — and until now nothing checked that it actually fails when it should. Production
// and CI pass nothing and get the real site.
const SITE = process.env.VERIFY_SITE ?? "https://kishore2494.github.io/personal-site-2/";
const TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS ?? 420_000);   // Pages builds here run past 3 min
const POLL_MS = 10_000;

const expected = (process.argv[2] ?? execSync("git rev-parse HEAD", { encoding: "utf8" }).trim()).slice(0, 12);

async function liveCommit() {
  // Cache-bust: Pages sits behind a CDN that will happily hand back the previous build.
  const res = await fetch(`${SITE}?cb=${Math.random().toString(36).slice(2)}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`live site returned ${res.status}`);
  const html = await res.text();
  const m = html.match(/<meta\s+name="build-commit"\s+content="([^"]+)"/i);
  if (!m) throw new Error("no build-commit meta on the live page (deployed before this was added?)");
  return m[1];
}


// The homepage is not the site.
//
// Everything above proves ONE page carries the expected commit. Prerendering exists so deep
// links — 44 of them — serve real HTML with HTTP 200, which is what a crawler asks for. Pages
// deploys one artifact atomically, so staleness is uniform and the homepage is a fair proxy for
// THAT. It is not a proxy for those pages existing at all: a change to the content loader that
// prerenders fewer routes leaves the homepage perfect while article URLs 404, and nothing here
// would have noticed. audit-dist reports the resulting dead links, but a handful is not
// systemic, so it does not block either.
//
// Sampled rather than exhaustive because this runs in the deploy path and 44 sequential fetches
// is a minute of waiting. One of each shape, so a whole category disappearing is caught rather
// than averaged away.
async function verifyDeepLinks() {
  // Prefer the sitemap this build produced; fall back to the PUBLISHED one.
  //
  // The local file is the better source when it exists: it lists what the build intended, so a
  // route that silently stopped being generated still gets asked for and still 404s. But this
  // now also runs in CI right after deploy-pages, where there is a checkout and no dist/ — and
  // the published sitemap is a perfectly good second-best, since every URL in it is still
  // checked for the expected commit.
  let urls, source;
  try {
    const xml = readFileSync("dist/sitemap.xml", "utf8");
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    source = "dist/sitemap.xml";
  } catch {
    try {
      const res = await fetch(`${SITE}sitemap.xml?cb=${Math.random().toString(36).slice(2)}`, {
        cache: "no-store", signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`live sitemap returned ${res.status}`);
      const xml = await res.text();
      urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      source = "the published sitemap";
    } catch (e) {
      console.error(`FAILED: no dist/sitemap.xml and could not fetch the published one — ${e.message}`);
      process.exit(1);
    }
  }
  if (!urls.length) {
    console.error("FAILED: dist/sitemap.xml contains no <loc> entries");
    process.exit(1);
  }

  const root = SITE.replace(/\/$/, "");
  const pick = (re) => urls.find((u) => re.test(u));
  const sample = [...new Set([
    // A SLUG under each, not the index: /articles/ matches the listing page too, and the first
    // version of this sampled that instead — checking the one route whose absence would be most
    // obvious while the 26 article pages went unchecked.
    pick(/\/articles\/[^/]+\//),
    pick(/\/projects\/[^/]+\//),
    urls.find((u) => !/\/(articles|projects)\//.test(u) && u.replace(/\/$/, "") !== root),
    urls[urls.length - 1],
  ].filter(Boolean))];

  console.log(`checking ${sample.length} deep links of ${urls.length} from ${source}`);
  let bad = 0;
  for (const u of sample) {
    try {
      const res = await fetch(`${u}${u.includes("?") ? "&" : "?"}cb=${Math.random().toString(36).slice(2)}`, {
        cache: "no-store", signal: AbortSignal.timeout(15_000),
      });
      const html = res.ok ? await res.text() : "";
      const commit = html.match(/<meta\s+name="build-commit"\s+content="([^"]+)"/i)?.[1];
      const ok = res.ok && commit === expected;
      console.log(`  ${ok ? "ok  " : "BAD "} ${res.status} ${commit ?? "no build-commit"}  ${u}`);
      if (!ok) bad++;
    } catch (e) {
      console.log(`  BAD  ${e.message}  ${u}`);
      bad++;
    }
  }
  if (bad) {
    console.error(`\nFAILED: ${bad} of ${sample.length} deep links are not serving ${expected}.\n` +
      `The homepage IS current, so this is not a missed deploy — those routes were not\n` +
      `prerendered, or the sitemap lists URLs the build no longer produces.`);
    process.exit(1);
  }
  console.log("deep links: all sampled routes serve the expected build");
}

console.log(`expecting build-commit ${expected}`);
const deadline = Date.now() + TIMEOUT_MS;
let last = null;

for (let attempt = 1; ; attempt++) {
  try {
    last = await liveCommit();
    if (last === expected) {
      console.log(`LIVE: ${SITE} is serving ${last}`);
      await verifyDeepLinks();
      process.exit(0);
    }
    console.log(`  poll ${attempt}: live is ${last}, waiting…`);
  } catch (e) {
    console.log(`  poll ${attempt}: ${e.message}`);
  }
  if (Date.now() > deadline) {
    // Distinguish "no workflow ran" from "the workflow is simply still going". The first
    // draft asserted the former and was wrong on its very first real run — a build WAS in
    // progress, just slower than the timeout. Telling someone to re-run a workflow that is
    // already running sends them to fix the wrong thing.
    let diagnosis =
      `The push may have landed without triggering a workflow run — check the Actions tab and\n` +
      `re-run the Pages workflow manually (workflow_dispatch is enabled).`;
    try {
      const runs = JSON.parse(execSync(
        `gh run list --repo kishore2494/personal-site-2 --limit 10 ` +
        `--json status,conclusion,headSha`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
      const mine = runs.find((r) => r.headSha.startsWith(expected));
      if (!mine) {
        diagnosis = `No workflow run exists for ${expected} — the push did NOT trigger one.\n` +
                    `Re-run the Pages workflow manually (workflow_dispatch is enabled).`;
      } else if (mine.status !== "completed") {
        diagnosis = `The workflow for ${expected} is still ${mine.status} — this is a slow build,\n` +
                    `not a missed trigger. Re-run with a longer VERIFY_TIMEOUT_MS.`;
      } else if (mine.conclusion !== "success") {
        diagnosis = `The workflow for ${expected} finished as ${mine.conclusion}. Note the repo uses\n` +
                    `concurrency.cancel-in-progress, so a rapid follow-up push cancels the previous run.`;
      }
    } catch { /* gh unavailable — keep the generic guidance */ }
    console.error(
      `\nFAILED: after ${Math.round(TIMEOUT_MS / 1000)}s the live site is serving ` +
      `${last ?? "an unreadable page"}, not ${expected}.\n${diagnosis}`
    );
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}
