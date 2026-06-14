import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Calendar, Tag } from "lucide-react";
import { getProject, getProjects } from "@/content";
import { site } from "@/config/site";
import { useMood } from "@/hooks/useMood";
import Seo from "@/components/Seo";
import ProjectCard from "@/components/ProjectCard";
import NotFound from "./NotFound";

export default function ProjectDetail() {
  useMood("projects");
  const { slug = "" } = useParams();
  const project = getProject(slug);

  if (!project) return <NotFound />;

  const more = getProjects()
    .filter((p) => p.slug !== project.slug && p.category === project.category)
    .slice(0, 3);
  const fallback = getProjects().filter((p) => p.slug !== project.slug).slice(0, 3);
  const related = (more.length ? more : fallback).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    dateCreated: String(project.year),
    keywords: project.tags.join(", "),
    genre: project.category,
    creator: { "@type": "Person", name: site.name, url: site.url },
    url: project.link ?? `${site.url}/projects/${project.slug}`,
  };

  return (
    <article className="relative z-10">
      <Seo title={project.title} description={project.blurb} type="article" jsonLd={jsonLd} />

      <div className="pointer-events-none fixed inset-0 -z-[1] bg-void-950/65" aria-hidden />

      <div className="section-pad max-w-3xl pb-10 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> back to projects
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-xs text-slate-400">
            <span className="chip border border-nebula-400/30 text-nebula-300">{project.category}</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} /> {project.year}
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white text-balance sm:text-4xl lg:text-5xl">
            {project.title}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-slate-300/90">{project.blurb}</p>
        </motion.div>

        <div className="article-body mt-10">
          <p>{project.description}</p>
        </div>

        <div className="mt-8">
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
            <Tag size={13} /> Stack & tags
          </p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="rounded-md bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/projects" className="btn-ghost">
            <ArrowLeft size={16} /> All projects
          </Link>
          {project.link && (
            <a href={project.link} target="_blank" rel="noreferrer" className="btn-primary">
              Visit project <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="section-pad pb-10">
          <h2 className="font-display text-xl font-semibold text-white">Related projects</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
