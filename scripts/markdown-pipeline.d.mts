// Types for the crawler-side markdown pipeline.
//
// scripts/ is plain JS and outside tsconfig's source roots, but src/lib/__tests__ imports
// renderBody from here to compare the two pipelines' output. Without this declaration `tsc
// --noEmit` fails the build on an implicit any, so the types are declared rather than the
// error suppressed — the test gets a real signature and a typo in it still fails the build.

import type MarkdownIt from "markdown-it";

/** The configured markdown-it instance used for prerendering. */
export declare const md: MarkdownIt;

/** Render article markdown to HTML, with body headings normalised so the shallowest is h2. */
export declare function renderBody(src: string): string;
