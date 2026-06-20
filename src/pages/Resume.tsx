import { Download, Printer, ArrowLeft, Mail, Github, Linkedin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useMood } from "@/hooks/useMood";
import { site } from "@/config/site";
import { resume } from "@/data/resume";
import Seo from "@/components/Seo";

export default function Resume() {
  useMood("about");

  return (
    <div className="section-pad pb-16 pt-28">
      <Seo
        title="Résumé — Kishore Kumar A"
        description="Résumé of Kishore Kumar A — founder & AI engineer: AI agents, RAG, multi-agent systems, LLM fine-tuning."
        type="profile"
      />

      {/* controls (hidden when printing) */}
      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <Link to="/about" className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-white">
          <ArrowLeft size={14} /> back
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-ghost px-4 py-2 text-xs">
            <Printer size={14} /> Print
          </button>
          <a href={`${import.meta.env.BASE_URL}resume.pdf`} download className="btn-primary px-4 py-2 text-xs">
            <Download size={14} /> PDF
          </a>
        </div>
      </div>

      {/* the printable document */}
      <article id="cv" className="mx-auto max-w-3xl rounded-2xl bg-slate-50 p-8 text-slate-800 shadow-2xl sm:p-12">
        <header className="border-b border-slate-200 pb-6">
          <h1 className="font-display text-3xl font-bold text-slate-900">{site.name}</h1>
          <p className="mt-1 font-medium text-nebula-600">Founder · AI Engineer · Deep-Tech Explorer</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
            <a href={site.social.emailUrl} className="inline-flex items-center gap-1.5 hover:text-nebula-600">
              <Mail size={13} /> {site.social.email}
            </a>
            <a href={site.social.github} className="inline-flex items-center gap-1.5 hover:text-nebula-600">
              <Github size={13} /> github.com/kishore2494
            </a>
            <a href={site.social.linkedin} className="inline-flex items-center gap-1.5 hover:text-nebula-600">
              <Linkedin size={13} /> LinkedIn
            </a>
            <a href={site.url} className="inline-flex items-center gap-1.5 hover:text-nebula-600">
              <Globe size={13} /> kishore2494.github.io
            </a>
          </div>
        </header>

        <Section title="Summary">
          <p className="text-sm leading-relaxed text-slate-700">{resume.summary}</p>
        </Section>

        <Section title="Experience">
          <div className="space-y-5">
            {resume.experience.map((e) => (
              <div key={e.role + e.org}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {e.role} <span className="font-normal text-slate-500">· {e.org}</span>
                  </h3>
                  <span className="font-mono text-xs text-slate-500">{e.period}</span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 marker:text-nebula-500">
                  {e.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid gap-8 sm:grid-cols-2">
          <Section title="Skills">
            <div className="space-y-3">
              {resume.skills.map((s) => (
                <div key={s.group}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.group}</p>
                  <p className="mt-1 text-sm text-slate-700">{s.items.join(" · ")}</p>
                </div>
              ))}
            </div>
          </Section>

          <div>
            <Section title="Education">
              {resume.education.map((ed) => (
                <div key={ed.credential}>
                  <p className="text-sm font-semibold text-slate-900">{ed.credential}</p>
                  <p className="text-sm text-slate-600">{ed.org}{ed.period ? ` · ${ed.period}` : ""}</p>
                </div>
              ))}
            </Section>
            <Section title="Selected Highlights">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 marker:text-nebula-500">
                {resume.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</h2>
      {children}
    </section>
  );
}
