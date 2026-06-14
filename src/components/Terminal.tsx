import type { ReactNode } from "react";

export default function Terminal({
  title = "kka@cosmos: ~",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-slate-500">{title}</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed text-slate-300 sm:text-sm">
        {children}
      </pre>
    </div>
  );
}

/** convenience colored spans for terminal content */
export const T = {
  cmd: ({ children }: { children: ReactNode }) => (
    <span className="text-nebula-300">{children}</span>
  ),
  key: ({ children }: { children: ReactNode }) => (
    <span className="text-ember-300">{children}</span>
  ),
  str: ({ children }: { children: ReactNode }) => (
    <span className="text-emerald-300">{children}</span>
  ),
  dim: ({ children }: { children: ReactNode }) => (
    <span className="text-slate-500">{children}</span>
  ),
};
