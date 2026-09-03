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

const SITE = "https://kishore2494.github.io/personal-site-2/";
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

console.log(`expecting build-commit ${expected}`);
const deadline = Date.now() + TIMEOUT_MS;
let last = null;

for (let attempt = 1; ; attempt++) {
  try {
    last = await liveCommit();
    if (last === expected) {
      console.log(`LIVE: ${SITE} is serving ${last}`);
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
