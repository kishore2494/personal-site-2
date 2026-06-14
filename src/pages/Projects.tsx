import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMood } from "@/hooks/useMood";
import { getProjects, type Project } from "@/content";
import ProjectCard from "@/components/ProjectCard";
import SectionHeading from "@/components/SectionHeading";
import StationHero from "@/components/StationHero";
import Seo from "@/components/Seo";

type Filter = "All" | Project["category"];
const filters: Filter[] = ["All", "AI", "Web", "Design", "Tooling"];

export default function Projects() {
  useMood("projects");
  const [filter, setFilter] = useState<Filter>("All");

  const list = useMemo(
    () => (filter === "All" ? getProjects() : getProjects().filter((p) => p.category === filter)),
    [filter],
  );

  return (
    <>
      <Seo
        title="Projects — AI systems, web platforms & tooling"
        description="Selected work by Kishore Kumar A: autonomous multi-agent AI, production RAG systems, SaaS platforms, developer tooling and brand design."
      />
      <StationHero>
        <SectionHeading
          eyebrow="Projects · Workstation"
          title="Things I've designed, built and shipped"
          intro="A decade of work spanning AI systems, web platforms, developer tooling and brand design. The newest sits at the top."
        />

        <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active ? "text-void-950" : "text-slate-300 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-nebula-400 to-nebula-300"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {!active && (
                <span className="absolute inset-0 -z-10 rounded-full border border-white/10" />
              )}
              {f}
            </button>
          );
        })}
        </div>
      </StationHero>

      <section className="section-pad pb-10">
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <motion.div key={p.slug} layout exit={{ opacity: 0, scale: 0.96 }}>
                <ProjectCard project={p} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </>
  );
}
