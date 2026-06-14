import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useMood } from "@/hooks/useMood";
import { getArticlesByTheme, type Theme } from "@/content";
import ArticleCard from "@/components/ArticleCard";
import SectionHeading from "@/components/SectionHeading";
import StationHero from "@/components/StationHero";
import Seo from "@/components/Seo";
import { site } from "@/config/site";

type Filter = "All" | Theme;
const filters: Filter[] = ["All", "AI", "Build", "Cosmos"];

export default function Articles() {
  useMood("articles");
  const [filter, setFilter] = useState<Filter>("All");

  const list = useMemo(() => getArticlesByTheme(filter), [filter]);

  return (
    <>
      <Seo
        title="Writing — AI, the future & the universe"
        description="Essays and build-guides by Kishore Kumar A on AI, RAG, multi-agent systems, the future of technology, and cosmology."
      />
      <StationHero>
        <SectionHeading
          eyebrow="Writing · Singularity"
          title="Notes on AI, the future & the universe"
          intro="A curated selection of essays and build-guides. Each one opens the full piece on the blog."
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
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
                    layoutId="article-filter-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-nebula-400 to-nebula-300"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {!active && <span className="absolute inset-0 -z-10 rounded-full border border-white/10" />}
                {f}
              </button>
            );
          })}
        </div>

        <a
          href={site.legacySiteUrl + "/articles/"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white"
        >
          Full archive <ArrowUpRight size={14} />
        </a>
        </div>
      </StationHero>

      <section className="section-pad pb-10">
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((a, i) => (
              <motion.div key={a.slug} layout exit={{ opacity: 0, scale: 0.96 }}>
                <ArticleCard article={a} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </>
  );
}
