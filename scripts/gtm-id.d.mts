// Types for gtm-id.mjs — the shared module is .mjs so the build guard and the browser bundle
// apply the same rule; this keeps the TypeScript side honest about the result shape.
export type GtmDecision =
  | { load: true; id: string }
  | { load: false; reason: string };

export function gtmDecision(raw: string | null | undefined): GtmDecision;
