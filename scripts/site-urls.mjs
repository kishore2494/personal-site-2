// The URL rules the two head pipelines must agree on.
//
// This site renders its <head> twice — scripts/prerender.mjs for crawlers and first paint,
// src/components/Seo.tsx after hydration — and they had already drifted:
//
//   prerender.mjs  canonical = SITE + path + "/"     (trailing slash, with a comment saying why)
//   Seo.tsx        canonical = site.url + path       (no trailing slash)
//
// So the prerendered canonical was right, React hydrated, and rewrote it to the slashless form
// that Pages 301s away from — undoing the fix in the very page the fix was for. Nothing caught
// it, because the build-time audit reads dist/, which is the half that was correct.
//
// Rather than checking the two for agreement, there is now one implementation and they both
// call it. Drift is not detected here; it is unrepresentable.

/** Canonical URL for a route. Pages serves directory URLs and 301s the slashless form, so the
 *  trailing slash names the URL actually served rather than one that redirects to it. */
export function canonicalFor(site, path) {
  const root = String(site).replace(/\/$/, "");
  const p = String(path || "/");
  return p === "/" ? `${root}/` : `${root}${p.replace(/\/$/, "")}/`;
}

/** og:image / twitter:image, always absolute.
 *  Social crawlers fetch these with no page context, so a root-relative path is a 404 to every
 *  one of them — the share silently loses its preview image and the page still looks fine. */
export function absoluteImage(site, image) {
  const root = String(site).replace(/\/$/, "");
  const v = String(image || "").trim();
  if (!v) return `${root}/og.png`;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  // Already carries the base path ("/personal-site-2/images/…"), so it hangs off the origin.
  if (v.startsWith("/")) return new URL(root).origin + v;
  return `${root}/${v}`;
}

// Content migrated from the first site still points at that site's base path. The files live in
// THIS repo's public/, so the references are simply stale — and they resolve today only because
// site 1 happens to still be up serving identical copies. Retargeting at load time rather than
// editing the markdown keeps it working for anything else migrated later, and matches how the
// empty-Medium-anchor strip is handled in the same two loaders.
export const LEGACY_BASES = ["/personal-site"];

/** Repoint legacy absolute paths at this site's own base. */
export function retargetLegacy(text, base = "/personal-site-2") {
  const b = String(base).replace(/\/$/, "");
  let out = String(text ?? "");
  for (const legacy of LEGACY_BASES) {
    if (legacy === b) continue;
    out = out.split(`${legacy}/`).join(`${b}/`);
  }
  return out;
}
