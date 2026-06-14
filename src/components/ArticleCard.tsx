import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/content";

const themeDot: Record<Article["theme"], string> = {
  AI: "bg-nebula-400",
  Cosmos: "bg-violet-400",
  Build: "bg-ember-400",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export default function ArticleCard({ article, index = 0 }: { article: Article; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/articles/${article.slug}`}
        className="group glass glass-hover flex h-full flex-col rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${themeDot[article.theme]}`} />
          <span className="uppercase tracking-wider">{article.theme}</span>
          <span className="text-slate-600">·</span>
          <span>{fmtDate(article.date)}</span>
          <span className="text-slate-600">·</span>
          <span>{article.readingMinutes}m</span>
        </div>

        <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-white transition-colors group-hover:text-nebula-200">
          {article.title}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{article.excerpt}</p>

        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-nebula-300">
          Read article
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}
