// Google Tag Manager loader. Activates only when a real container id is configured as `gtmId`
// in src/config/site.json.
//
// The decision of whether to load lives in scripts/gtm-id.mjs so the build guard and the runtime
// cannot drift apart. What is left here is only the DOM work.

import { gtmDecision } from "../../scripts/gtm-id.mjs";

let loaded = false;

export function initGTM(raw: string | null | undefined) {
  const decision = gtmDecision(raw);
  if (!decision.load) {
    // Silent when simply unconfigured — that is the normal state and not worth a warning.
    if ((raw ?? "").trim()) console.warn(`[gtm] not loading: ${decision.reason}`);
    return;
  }
  if (loaded) return; // HMR and double module evaluation would otherwise inject a second tag.
  loaded = true;

  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + decision.id;

  // The classic snippet does `firstScript.parentNode.insertBefore(...)`. On a document with no
  // script element that is a TypeError on undefined, so fall back to the head.
  const first = document.getElementsByTagName("script")[0];
  if (first?.parentNode) first.parentNode.insertBefore(script, first);
  else document.head.appendChild(script);
}
