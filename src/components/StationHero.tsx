import type { ReactNode } from "react";

/**
 * Tall hero band for inner pages: the page's 3D station object is showcased in
 * the open upper area, while a gradient scrim anchors the title/controls at the
 * bottom and transitions into the content below.
 */
export default function StationHero({ children }: { children: ReactNode }) {
  return (
    <section className="relative flex min-h-[82svh] items-end">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void-950 via-void-950/45 to-transparent" />
      <div className="section-pad relative w-full pb-2 pt-32">{children}</div>
    </section>
  );
}
