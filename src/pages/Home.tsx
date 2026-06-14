import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Cpu, Orbit, Rocket, Atom as AtomIcon, CircleDot } from "lucide-react";
import { useMood } from "@/hooks/useMood";
import { site } from "@/config/site";
import { getFeaturedProjects, getLatestArticles } from "@/content";
import Seo from "@/components/Seo";
import SectionHeading from "@/components/SectionHeading";
import ProjectCard from "@/components/ProjectCard";
import ArticleCard from "@/components/ArticleCard";
import Reveal from "@/components/Reveal";
import SocialLinks from "@/components/SocialLinks";
import Typing from "@/components/Typing";
import Marquee from "@/components/Marquee";
import Terminal, { T } from "@/components/Terminal";

const stats = [
  { value: "10+", label: "Shipped projects" },
  { value: "25+", label: "Essays & guides" },
  { value: "5", label: "Universe stations" },
  { value: "∞", label: "Curiosity" },
];

const pillars = [
  {
    Icon: Cpu,
    title: "Applied AI",
    body: "Agents, RAG pipelines, LLM fine-tuning and voice automation — built to run reliably, often fully local.",
  },
  {
    Icon: Orbit,
    title: "Deep Tech",
    body: "Where AI meets quantum computing and frontier science — the tools for humanity's next leap.",
  },
  {
    Icon: Rocket,
    title: "Space & Cosmology",
    body: "A lifelong fascination with the universe, driving toward a future space / deep-tech venture.",
  },
];

const stations = [
  { to: "/projects", label: "Workstation", desc: "Things I've built", Icon: Cpu },
  { to: "/articles", label: "Singularity", desc: "Writing & ideas", Icon: CircleDot },
  { to: "/about", label: "Atomic Lab", desc: "Who I am", Icon: AtomIcon },
  { to: "/contact", label: "Deep Space", desc: "Get in touch", Icon: Rocket },
];

const stack = [
  "Python", "PyTorch", "LangChain", "Ollama", "FAISS", "ChromaDB", "RAG", "Multi-Agent",
  "LLM fine-tuning", "Voice AI", "TypeScript", "React", "Three.js", "OpenAPI", "Vector DBs",
];

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "Founder · AI Engineer",
  description: site.summary,
  sameAs: [site.social.github, site.social.linkedin, site.social.twitter],
  knowsAbout: ["Artificial Intelligence", "LLMs", "RAG", "Multi-Agent Systems", "Deep Tech", "Cosmology"],
};

export default function Home() {
  useMood("home");

  return (
    <>
      <Seo
        title="Kishore Kumar A — AI Engineer & Deep-Tech Explorer"
        description={site.summary}
        jsonLd={personJsonLd}
      />
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[100svh] items-center">
        <div className="section-pad w-full pt-28">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="max-w-3xl"
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-xs font-medium text-slate-300 backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nebula-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-nebula-400" />
              </span>
              {site.availability}
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
              transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white text-balance sm:text-6xl lg:text-7xl"
            >
              Engineering intelligence,
              <br />
              <span className="gradient-text">reaching for the stars.</span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="mt-5 font-mono text-sm text-nebula-300/90"
            >
              <span className="text-slate-500">$</span> specializing in{" "}
              <Typing
                className="text-nebula-200"
                phrases={[
                  "AI agents",
                  "RAG pipelines",
                  "multi-agent systems",
                  "LLM fine-tuning",
                  "voice automation",
                  "deep-tech for space",
                ]}
              />
            </motion.p>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300/90"
            >
              I'm <span className="text-white">{site.name}</span> — {site.role.toLowerCase()}.
              I build AI systems and multi-agent platforms, with my sights set on space and deep tech.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link to="/projects" className="btn-primary">
                Explore the universe <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="btn-ghost">
                Let's collaborate
              </Link>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-10">
              <SocialLinks />
            </motion.div>
          </motion.div>
        </div>

        {/* scroll cue */}
        <div className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 font-mono text-xs text-slate-500"
          >
            <span className="uppercase tracking-[0.2em]">Scroll</span>
            <span className="h-8 w-px bg-gradient-to-b from-nebula-400/60 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ---------- TECH MARQUEE ---------- */}
      <section className="section-pad">
        <Reveal>
          <Marquee items={stack} />
        </Reveal>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="section-pad mt-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div className="glass rounded-2xl px-6 py-7 text-center">
                <p className="font-display text-4xl font-bold gradient-text">{s.value}</p>
                <p className="mt-2 text-sm text-slate-400">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- PILLARS + TERMINAL ---------- */}
      <section className="section-pad mt-28">
        <SectionHeading
          index={1}
          eyebrow="What I do"
          title="Three orbits, one mission"
          intro="My work moves between applied AI, deep tech and the science of the cosmos — each feeding the others."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="glass glass-hover h-full rounded-2xl p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-nebula-400/30 bg-nebula-500/10 text-nebula-300">
                    <p.Icon size={20} />
                  </span>
                  <h3 className="mt-5 font-display text-base font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <Terminal title="kka@cosmos: ~/whoami">
              <T.dim>$</T.dim> <T.cmd>cat</T.cmd> profile.json{"\n"}
              {"{"}
              {"\n"}
              {"  "}
              <T.key>"name"</T.key>: <T.str>"Kishore Kumar A"</T.str>,{"\n"}
              {"  "}
              <T.key>"role"</T.key>: <T.str>"Founder · AI Engineer"</T.str>,{"\n"}
              {"  "}
              <T.key>"focus"</T.key>: [<T.str>"AI"</T.str>, <T.str>"deep-tech"</T.str>, <T.str>"space"</T.str>],{"\n"}
              {"  "}
              <T.key>"builds"</T.key>: <T.str>"agents · RAG · multi-agent"</T.str>,{"\n"}
              {"  "}
              <T.key>"dreaming_of"</T.key>: <T.str>"a space / deep-tech startup"</T.str>,{"\n"}
              {"  "}
              <T.key>"status"</T.key>: <T.str>"online"</T.str>{"\n"}
              {"}"}
              {"\n\n"}
              <T.dim>$</T.dim> <T.cmd>./launch</T.cmd> --mission <T.str>"next giant leap"</T.str>
              <span className="ml-1 inline-block h-3.5 w-2 translate-y-0.5 animate-blink bg-nebula-400" />
            </Terminal>
          </Reveal>
        </div>
      </section>

      {/* ---------- STATION NAVIGATOR ---------- */}
      <section className="section-pad mt-28">
        <SectionHeading
          index={2}
          eyebrow="Navigation"
          title="Tour the universe"
          intro="Each section is a station in one continuous 3D space. Fly between them."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stations.map((s, i) => (
            <Reveal key={s.to} delay={i * 0.06}>
              <Link to={s.to} className="group glass glass-hover flex h-full flex-col rounded-2xl p-6">
                <s.Icon className="text-nebula-300" size={22} />
                <p className="mt-5 font-display text-base font-semibold text-white">{s.label}</p>
                <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-nebula-300 opacity-0 transition-opacity group-hover:opacity-100">
                  warp <ArrowRight size={13} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- FEATURED PROJECTS ---------- */}
      <section className="section-pad mt-28">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            index={3}
            eyebrow="Selected work"
            title="Featured projects"
            intro="A few systems I'm proud of — from autonomous multi-agent debate to production RAG."
          />
          <Link
            to="/projects"
            className="hidden shrink-0 items-center gap-1 font-mono text-sm font-medium text-nebula-300 hover:text-nebula-200 sm:inline-flex"
          >
            all_projects <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {getFeaturedProjects().map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      {/* ---------- LATEST WRITING ---------- */}
      <section className="section-pad mt-28">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            index={4}
            eyebrow="From the notebook"
            title="Latest writing"
            intro="Essays and build-guides on AI, the future, and the universe."
          />
          <Link
            to="/articles"
            className="hidden shrink-0 items-center gap-1 font-mono text-sm font-medium text-nebula-300 hover:text-nebula-200 sm:inline-flex"
          >
            all_writing <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {getLatestArticles(3).map((a, i) => (
            <ArticleCard key={a.slug} article={a} index={i} />
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section-pad mt-28">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-nebula-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl" />
            <Sparkles className="mx-auto text-nebula-300" size={28} />
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold text-white text-balance sm:text-4xl">
              Building something at the edge of AI and space?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              I love collaborating on ambitious, deep-tech ideas. Let's talk.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/contact" className="btn-primary">
                Get in touch <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
