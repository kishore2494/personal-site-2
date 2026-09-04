// Fail the build on a GTM container id that would not work.
//
// A wrong analytics id is not a crash. The tag loads, or fails to, and the site looks identical
// either way — so the feedback arrives weeks later as "why is there no data", or never, as a
// third-party request on every page view for a container that does not exist.
//
// The runtime warns in the console too, but a console warning on a static site is seen by nobody:
// the person who pastes the id is not the person who opens devtools. This is the check that runs
// before the bytes are built.
//
// The rule itself lives in gtm-id.mjs, shared with src/lib/gtm.ts, so the guard cannot come to a
// different conclusion than the loader it is guarding.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { gtmDecision } from "./gtm-id.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "src/config/site.json");

let raw;
try {
  raw = JSON.parse(readFileSync(configPath, "utf8"));
} catch (e) {
  console.error(`✗ could not read src/config/site.json: ${e.message}`);
  process.exit(1);
}

if (!("gtmId" in raw)) {
  // Being unable to check is not the same as passing. If the key is renamed or dropped, the
  // loader in main.tsx passes undefined forever and this guard would otherwise go quietly blind.
  console.error("✗ src/config/site.json has no `gtmId` key — check-gtm-id.mjs cannot check what it is for.");
  console.error("   If GTM was removed deliberately, delete this guard and initGTM() together.");
  process.exit(1);
}

const configured = String(raw.gtmId ?? "").trim();
if (!configured) {
  console.log("gtm: no container id configured — analytics off (this is a valid state)");
  process.exit(0);
}

const decision = gtmDecision(configured);
if (!decision.load) {
  console.error(`\n✗ gtmId is set but will not load: ${decision.reason}`);
  console.error("   Copy the container id from Tag Manager → Admin → Container ID (GTM-XXXXXXX).");
  console.error("   Leaving gtmId empty is fine; setting it to something that cannot work is not.\n");
  process.exit(1);
}

console.log(`gtm: container ${decision.id} configured`);
