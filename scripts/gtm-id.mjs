// What is allowed to become a request to googletagmanager.com.
//
// Shared by the runtime loader (src/lib/gtm.ts) and the build guard (check-gtm-id.mjs), because
// this repo has already been bitten once by a rule implemented twice — see check-pipeline-parity.
//
// The two failures worth naming:
//
//   `GTM-XXXXXXX` is what Google's documentation shows. It is well-formed, so a format check
//   passes it, and every visitor's browser then requests a container that does not exist.
//
//   `G-ABC1234` is a GA4 *measurement* id and `UA-…` an old Analytics property id. Either one in
//   a GTM field fails silently — no error, no data, noticed weeks later.

const CONTAINER = /^GTM-[A-Z0-9]{4,}$/;
// Google's sample is all X's. A genuine all-X container is possible in theory; the cost of that
// false negative is one line saying exactly why, which beats silently loading the placeholder.
const PLACEHOLDER = /^GTM-X+$/;

/**
 * @param {string|null|undefined} raw
 * @returns {{load: true, id: string} | {load: false, reason: string}}
 */
export function gtmDecision(raw) {
  // Container ids are uppercase in the console; normalising means a lowercase paste works rather
  // than being rejected for a reason that would look arbitrary.
  const id = (raw ?? "").trim().toUpperCase();
  if (!id) return { load: false, reason: "no container id configured" };
  if (PLACEHOLDER.test(id)) return { load: false, reason: `"${id}" is Google's placeholder id, not a container` };
  if (/^G-/.test(id)) return { load: false, reason: `"${id}" is a GA4 measurement id; gtmId needs a GTM- container` };
  if (/^UA-/.test(id)) return { load: false, reason: `"${id}" is a Universal Analytics property id; gtmId needs a GTM- container` };
  if (/^(AW|DC)-/.test(id)) return { load: false, reason: `"${id}" is a Google Ads id; gtmId needs a GTM- container` };
  if (!CONTAINER.test(id)) return { load: false, reason: `"${id}" is not a GTM container id (expected GTM-XXXXXXX)` };
  return { load: true, id };
}
