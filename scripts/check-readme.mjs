// The README must describe the commands that exist, and only those.
//
// Four scripts added during this trip — test, lint, audit, verify:live — were absent from the
// README, so someone picking the project up would not know the tests existed, let alone that a
// deploy can be proven. Nothing had drifted into being WRONG; it had drifted into being
// incomplete, which is quieter and just as unhelpful.
//
// The same check in the other direction matters more: a README naming a command that no longer
// exists sends the reader to a failure. That is what happened to the FieldOps runbook, where
// BACKUP_CERT had never been a real variable and following the instructions produced
// unencrypted backups.
//
// prebuild/postbuild are excluded: npm runs them for you, and documenting them as things to
// type would be wrong.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const readme = readFileSync(join(root, "README.md"), "utf8");

const AUTOMATIC = new Set(["prebuild", "postbuild"]);
const scripts = Object.keys(pkg.scripts ?? {}).filter((s) => !AUTOMATIC.has(s));

const undocumented = scripts.filter((s) => !readme.includes(`npm run ${s}`)).sort();

// Anything the README tells you to run must be real.
const mentioned = [...new Set([...readme.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)].map((m) => m[1]))];
const phantom = mentioned.filter((s) => !(s in (pkg.scripts ?? {}))).sort();

let failed = false;
if (undocumented.length) {
  failed = true;
  console.error(`\n\x1b[31m✗ package.json has commands the README never mentions: ${undocumented.join(", ")}\x1b[0m`);
  console.error("   Someone reading the README would not know they exist.");
}
if (phantom.length) {
  failed = true;
  console.error(`\n\x1b[31m✗ the README tells you to run commands that do not exist: ${phantom.join(", ")}\x1b[0m`);
  console.error("   Following the instructions would fail.");
}
if (failed) { console.error(""); process.exit(1); }

console.log(`readme: ${scripts.length} commands, all documented and all real`);
