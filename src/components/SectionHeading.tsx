import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  index,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}
    >
      <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-nebula-400">
        <span className="h-px w-6 bg-nebula-400/60" />
        {index !== undefined && (
          <span className="text-ember-300/80">{index.toString().padStart(2, "0")} /</span>
        )}
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-white text-balance sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-slate-400">{intro}</p>}
    </motion.div>
  );
}
