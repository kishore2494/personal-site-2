import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, ArrowUpRight } from "lucide-react";
import { getArticle, getLatestArticles } from "@/content";
import { site } from "@/config/site";
import { useMood } from "@/hooks/useMood";
import Seo from "@/components/Seo";
import Markdown from "@/components/Markdown";
import ArticleCard from "@/components/ArticleCard";
import NotFound from "./NotFound";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function ArticleDetail() {
  useMood("articles");
  const { slug = "" } = useParams();
  const article = getArticle(slug);

  if (!article) return <NotFound />;

  const related = getLatestArticles(4)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    image: article.cover,
    keywords: article.tags.join(", "),
    articleSection: article.categories.join(", "),
    author: { "@type": "Person", name: site.name, url: site.url },
    publisher: { "@type": "Person", name: site.name },
    mainEntityOfPage: `${site.url}/articles/${article.slug}`,
  };

  return (
    <article className="relative z-10">
      <Seo
        title={article.title}
        description={article.excerpt}
        image={article.cover}
        type="article"
        jsonLd={jsonLd}
      />

      {/* dark legibility scrim so long-form text stays readable over the scene */}
      <div className="pointer-events-none fixed inset-0 -z-[1] bg-void-950/72" aria-hidden />

      <div className="section-pad max-w-3xl pb-10 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> back to writing
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-xs text-slate-400">
            <span className="chip border border-nebula-400/30 text-nebula-300">{article.theme}</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} /> {fmtDate(article.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} /> {article.readingMinutes} min read
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white text-balance sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          {article.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {article.tags.slice(0, 6).map((t) => (
                <span key={t} className="rounded-md bg-white/5 px-2 py-1 font-mono text-[11px] text-slate-400">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {article.cover && (
            <img
              src={article.cover}
              alt={article.title}
              loading="lazy"
              className="mt-8 w-full rounded-2xl border border-white/10"
            />
          )}
        </motion.div>

        <div className="mt-10">
          <Markdown>{article.body}</Markdown>
        </div>

        {/* footer */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/articles" className="btn-ghost">
            <ArrowLeft size={16} /> All writing
          </Link>
          <a
            href={`${site.legacySiteUrl}/articles/${article.slug}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-300"
          >
            view on the original blog <ArrowUpRight size={13} />
          </a>
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="section-pad pb-10">
          <h2 className="font-display text-xl font-semibold text-white">More writing</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a, i) => (
              <ArticleCard key={a.slug} article={a} index={i} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
