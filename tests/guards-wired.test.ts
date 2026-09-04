// Every guard in scripts/ must actually run.
//
// This is the mistake that happened here, in this repo, on the day these guards were written:
// check-bundle-size.mjs was created, mutation-tested, and the mutation "escaped" — not because
// the check was wrong, but because it had never been added to postbuild. It was not in the
// pipeline at all. The test that was supposed to prove it worked instead proved it was absent,
// and only reading the output carefully caught that.
//
// A guard nobody runs is worse than no guard, because its existence gets counted as coverage.
//
// This lives in the vitest suite rather than in scripts/ on purpose. A script that checks
// whether scripts are wired has to be wired itself, and unwiring THAT would silence everything.
// `npm test` is its own CI step, so this cannot be switched off by editing a build chain.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("build guards", () => {
  it("every check-*/verify-* script is referenced by an npm script", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const allScripts = Object.values(pkg.scripts ?? {}).join(" ");

    const guards = readdirSync(join(root, "scripts"))
      .filter((f) => /^(check|verify)-.*\.mjs$/.test(f));

    expect(guards.length, "found no guard scripts — this check has gone stale").toBeGreaterThanOrEqual(5);

    const unwired = guards.filter((f) => !allScripts.includes(f));
    expect(unwired, `guard scripts nothing runs: ${unwired.join(", ")}`).toEqual([]);
  });

  it("every script an npm command invokes actually exists", () => {
    // The other direction: a build chain naming a file that was renamed or deleted fails the
    // build loudly, which is fine — but it fails at the worst moment, usually mid-deploy. This
    // says so during `npm test` instead.
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const referenced = [
      ...new Set(
        [...Object.values(pkg.scripts ?? {}).join(" ").matchAll(/scripts\/([a-zA-Z0-9._-]+\.mjs)/g)]
          .map((m) => m[1]),
      ),
    ];
    expect(referenced.length, "no scripts/ references found — this check has gone stale").toBeGreaterThanOrEqual(5);

    const missing = referenced.filter((f) => !existsSync(join(root, "scripts", f)));
    expect(missing, `npm scripts invoke files that do not exist: ${missing.join(", ")}`).toEqual([]);
  });
});
