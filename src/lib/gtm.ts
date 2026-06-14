// Google Tag Manager loader. Activates only when a container id is configured
// in src/config/site.ts (gtmId). Through GTM you can add GA4, ads, etc.
export function initGTM(id: string) {
  if (!id) return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const first = document.getElementsByTagName("script")[0];
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + id;
  first.parentNode?.insertBefore(script, first);
}
