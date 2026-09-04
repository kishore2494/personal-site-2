export const COSMOS: string[];
export const BUILD: string[];
export function deriveTheme(categories: string[]): "AI" | "Cosmos" | "Build";
export function toArray(v?: string[] | string): string[];
export function toISO(d?: string | Date): string;
export function deriveExcerpt(excerpt: string | undefined, body: string): string;
