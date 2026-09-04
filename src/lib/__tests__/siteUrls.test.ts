// The head rules that prerender.mjs and Seo.tsx now share.
//
// These existed as two separate inline expressions and had already diverged on the trailing
// slash — the prerendered canonical was right and hydration rewrote it to a URL that 301s.
// One implementation removes the possibility; these tests pin what it does.

import { describe, it, expect } from "vitest";
import { canonicalFor, absoluteImage, retargetLegacy } from "../../../scripts/site-urls.mjs";

const SITE = "https://kishore2494.github.io/personal-site-2";

describe("canonicalFor", () => {
  it("always ends in a slash, because Pages 301s the slashless form", () => {
    expect(canonicalFor(SITE, "/about")).toBe(`${SITE}/about/`);
    expect(canonicalFor(SITE, "/articles/some-slug")).toBe(`${SITE}/articles/some-slug/`);
  });

  it("is idempotent — a path that already ends in a slash does not gain a second one", () => {
    expect(canonicalFor(SITE, "/about/")).toBe(`${SITE}/about/`);
  });

  it("maps the root to the site root, not to a bare origin", () => {
    expect(canonicalFor(SITE, "/")).toBe(`${SITE}/`);
  });

  it("tolerates a site url written with a trailing slash", () => {
    expect(canonicalFor(`${SITE}/`, "/about")).toBe(`${SITE}/about/`);
  });
});

describe("absoluteImage", () => {
  it("returns an absolute url for a root-relative path", () => {
    // The bug this exists for: social crawlers fetch og:image with no page context, so a
    // root-relative value is a 404 to every one of them and the share loses its preview.
    expect(absoluteImage(SITE, "/personal-site-2/images/a.webp"))
      .toBe("https://kishore2494.github.io/personal-site-2/images/a.webp");
  });

  it("does not touch an already-absolute url", () => {
    expect(absoluteImage(SITE, "https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });

  it("falls back to the site og image when there is none", () => {
    expect(absoluteImage(SITE, "")).toBe(`${SITE}/og.png`);
    expect(absoluteImage(SITE, null)).toBe(`${SITE}/og.png`);
  });

  it("never returns something a crawler would treat as relative", () => {
    for (const input of ["", null, "a.png", "/x/y.png", "//cdn.example.com/a.png"]) {
      expect(absoluteImage(SITE, input)).toMatch(/^https:\/\//);
    }
  });
});

describe("retargetLegacy", () => {
  it("repoints site 1 paths at this site's base", () => {
    expect(retargetLegacy("/personal-site/images/a.webp")).toBe("/personal-site-2/images/a.webp");
  });

  it("rewrites every occurrence in a body, not just the first", () => {
    const body = "![a](/personal-site/images/a.webp) and ![b](/personal-site/images/b.webp)";
    expect(retargetLegacy(body)).not.toContain("/personal-site/");
    expect(retargetLegacy(body).match(/personal-site-2/g)).toHaveLength(2);
  });

  it("leaves already-correct paths alone", () => {
    const ok = "/personal-site-2/images/a.webp";
    expect(retargetLegacy(ok)).toBe(ok);
  });

  it("does not corrupt the base it is rewriting to", () => {
    // "/personal-site" is a prefix of "/personal-site-2", so a careless replace turns
    // /personal-site-2/… into /personal-site-2-2/…. Matching on the trailing slash prevents it.
    expect(retargetLegacy("/personal-site-2/images/a.webp")).not.toContain("-2-2");
  });
});
