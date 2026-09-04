// What is allowed to become a request to googletagmanager.com.
//
// The old loader guarded one thing — an empty string. Everything else it handed straight to a
// <script src>. That makes two realistic mistakes invisible:
//
//   pasting Google's documentation placeholder, which loads a container that does not exist on
//   every page view, and pasting a GA4 measurement id into a GTM field, which is silent: no
//   error, no data, discovered weeks later.
//
// The site is a personal portfolio with no privacy page and no "we don't track you" claim, so
// this is not a compliance question — it is about not making a third-party request the site does
// not benefit from, and about failing loudly when the id is wrong.

import { describe, it, expect } from "vitest";
import { gtmDecision } from "../../../scripts/gtm-id.mjs";

const reasonFor = (id: string) => {
  const d = gtmDecision(id);
  if (d.load) throw new Error(`expected "${id}" to be rejected, but it would load`);
  return d.reason;
};

describe("gtmDecision", () => {
  it("loads a real container id", () => {
    expect(gtmDecision("GTM-ABC1234")).toEqual({ load: true, id: "GTM-ABC1234" });
    expect(gtmDecision("GTM-WXYZ9")).toEqual({ load: true, id: "GTM-WXYZ9" });
  });

  it("normalises a lowercase paste rather than rejecting it", () => {
    // Container ids are uppercase in the console; a lowercase paste is a copy artefact, not a
    // different container. Rejecting it would look arbitrary.
    expect(gtmDecision("gtm-abc1234")).toEqual({ load: true, id: "GTM-ABC1234" });
    expect(gtmDecision("  GTM-ABC1234  ")).toEqual({ load: true, id: "GTM-ABC1234" });
  });

  it("stays quiet when nothing is configured — the current state of this site", () => {
    for (const empty of ["", "   ", null, undefined]) {
      expect(gtmDecision(empty).load).toBe(false);
    }
    expect(reasonFor("")).toMatch(/no container id/);
  });

  it("refuses Google's documentation placeholder", () => {
    // This is the one that costs real requests: it is well-formed, so a format check alone
    // passes it, and it is what you get by following the setup docs literally.
    expect(reasonFor("GTM-XXXXXXX")).toMatch(/placeholder/);
    expect(reasonFor("gtm-xxxxxxx")).toMatch(/placeholder/);
  });

  it("names the wrong-id-type mistake instead of failing silently", () => {
    expect(reasonFor("G-ABC1234")).toMatch(/GA4/);
    expect(reasonFor("UA-12345-1")).toMatch(/Universal Analytics/);
    expect(reasonFor("AW-12345")).toMatch(/Google Ads/);
    // Each says what was given AND what is wanted — a reason that only says "invalid" leaves
    // you re-reading the same wrong string.
    expect(reasonFor("G-ABC1234")).toMatch(/GTM-/);
  });

  it("refuses ids that are merely malformed", () => {
    for (const bad of ["GTM-", "GTM-AB", "GTM_ABC1234", "ABC1234", "GTM-ABC 1234", "<script>", "GTM-ABC!234"]) {
      expect(gtmDecision(bad).load, `${bad} was accepted`).toBe(false);
    }
  });

  it("never returns an id it was not given", () => {
    // The loaded id goes straight into a script src, so a decision that loads must carry exactly
    // the configured container and nothing else.
    const d = gtmDecision("GTM-ABC1234");
    expect(d.load && d.id).toBe("GTM-ABC1234");
  });
});
