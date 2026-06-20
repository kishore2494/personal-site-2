import data from "./site.json";

// Source of truth: site.json (edited via the admin dashboard → Settings).
export const site = data;

export type Site = typeof site;
