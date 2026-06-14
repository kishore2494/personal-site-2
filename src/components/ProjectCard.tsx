import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content";

const categoryAccent: Record<Project["category"], string> = {
  AI: "text-nebula-300 border-nebula-400/30",
  Web: "text-ember-300 border-ember-400/30",
  Design: "text-violet-300 border-violet-400/30",
  Tooling: "text-emerald-300 border-emerald-400/30",
};

export default function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/projects/${project.slug}`}
        className="group glass glass-hover relative flex h-full flex-col overflow-hidden rounded-2xl p-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-nebula-500/10 blur-3xl transition-opacity duration-500 group-hover:bg-nebula-500/20" />

        <div className="flex items-center justify-between">
          <span className={`chip border ${categoryAccent[project.category]}`}>{project.category}</span>
          <span className="font-mono text-xs text-slate-500">{project.year}</span>
        </div>

        <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-white">
          {project.title}
          <ArrowUpRight
            size={16}
            className="ml-1 inline -translate-y-px text-slate-500 transition-colors group-hover:text-nebula-300"
          />
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{project.blurb}</p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-white/5 px-2 py-1 font-mono text-[11px] text-slate-400">
              {t}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
