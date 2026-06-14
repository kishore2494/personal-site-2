import { Link } from "react-router-dom";
import { ArrowRight, Brain, Rocket, Atom } from "lucide-react";
import { useMood } from "@/hooks/useMood";
import { site } from "@/config/site";
import SectionHeading from "@/components/SectionHeading";
import StationHero from "@/components/StationHero";
import Reveal from "@/components/Reveal";
import Seo from "@/components/Seo";

const helps = [
  {
    Icon: Brain,
    title: "AI Solutions",
    body: "Intelligent systems for automation, customer support and business processes — agents, RAG, fine-tuned LLMs and voice AI.",
  },
  {
    Icon: Rocket,
    title: "Space-Tech Innovation",
    body: "Exploring how AI and deep tech can contribute to space exploration and cosmic research.",
  },
  {
    Icon: Atom,
    title: "Deep-Tech Integration",
    body: "Combining AI, quantum computing and other frontier technologies into breakthrough solutions.",
  },
];

const skills: { group: string; items: string[] }[] = [
  { group: "AI / ML", items: ["LLM fine-tuning", "RAG pipelines", "Multi-agent systems", "Voice AI", "Deep learning"] },
  { group: "Stacks & tools", items: ["Python", "LangChain", "Ollama", "FAISS / ChromaDB", "Streamlit"] },
  { group: "Engineering", items: ["TypeScript", "React", "APIs & OpenAPI", "SaaS architecture", "Vibe-coding"] },
  { group: "Frontier interests", items: ["Cosmology", "Astrophysics", "Quantum computing", "Space missions"] },
];

const timeline = [
  { year: "Now", title: "Founder · Aurora AI", body: "Delivering AI-driven solutions that help businesses streamline and scale." },
  { year: "2024", title: "Multi-agent & RAG systems", body: "Built autonomous debate platforms and production RAG running on local LLMs." },
  { year: "Earlier", title: "Web, SaaS & design", body: "A decade shipping web platforms, developer tooling and brand identities." },
  { year: "Always", title: "Eyes on the cosmos", body: "Chasing astrophysics and space missions — aiming at a future space / deep-tech venture." },
];

export default function About() {
  useMood("about");

  return (
    <>
      <Seo
        title="About — Kishore Kumar A"
        description="AI & Data Science graduate and founder building AI agents, RAG systems and multi-agent platforms, with a long-term mission in space and deep tech."
        type="profile"
      />
      <StationHero>
        <SectionHeading
          eyebrow="About · Atomic Lab"
          title={
            <>
              Build-first engineer with a <span className="gradient-text">cosmic ambition</span>
            </>
          }
          intro="AI & Data Science graduate, founder, and lifelong student of the universe."
        />
      </StationHero>

      <div className="section-pad pb-10 pt-10">
      {/* bio */}
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="space-y-5 text-base leading-relaxed text-slate-300/90">
          <p>
            I'm an AI and Data Science graduate specializing in building AI agents, fine-tuning LLMs,
            and implementing RAG pipelines. I've developed real-world AI solutions across voice
            automation, multi-agent systems and deep learning — always with a hands-on, build-first
            approach.
          </p>
          <p>
            My work with <span className="text-white">Aurora AI</span> focuses on delivering AI-driven
            solutions that help businesses streamline. But my true passion lies in the mysteries of the
            cosmos. I've long been fascinated by space exploration and cosmology, and I envision a future
            where AI, quantum computing and other advanced technologies play a pivotal role in humanity's
            journey to explore the universe.
          </p>
          <p>
            From following groundbreaking space missions to pursuing knowledge in astrophysics and quantum
            mechanics, I'm driven to contribute to humanity's next giant leap. My long-term goal is to
            launch a space or deep-tech startup that bridges scientific discovery and practical
            applications — so we can venture further into the stars.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-slate-500">At a glance</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Role</dt>
                <dd className="text-right text-slate-200">{site.role}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Based in</dt>
                <dd className="text-slate-200">{site.location}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Focus</dt>
                <dd className="text-right text-slate-200">AI · Deep tech · Space</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Status</dt>
                <dd className="text-right text-nebula-300">{site.availability}</dd>
              </div>
            </dl>
            <Link to="/contact" className="btn-primary mt-6 w-full">
              Work with me <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* what I can help with */}
      <section className="mt-24">
        <SectionHeading index={1} eyebrow="How I can help" title="Where I create the most value" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {helps.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.08}>
              <div className="glass glass-hover h-full rounded-2xl p-7">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-ember-400/30 bg-ember-500/10 text-ember-300">
                  <h.Icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{h.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{h.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* skills */}
      <section className="mt-24">
        <SectionHeading index={2} eyebrow="Toolkit" title="Skills & interests" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((s, i) => (
            <Reveal key={s.group} delay={i * 0.06}>
              <div className="glass h-full rounded-2xl p-6">
                <p className="font-display text-sm font-semibold text-nebula-300">{s.group}</p>
                <ul className="mt-4 space-y-2">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="h-1 w-1 rounded-full bg-nebula-400/70" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* timeline */}
      <section className="mt-24">
        <SectionHeading index={3} eyebrow="Trajectory" title="The path so far" />
        <div className="mt-10 space-y-3">
          {timeline.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.06}>
              <div className="glass glass-hover flex flex-col gap-2 rounded-2xl p-6 sm:flex-row sm:items-center sm:gap-8">
                <span className="font-mono text-sm text-nebula-300 sm:w-20 sm:shrink-0">{t.year}</span>
                <div>
                  <h3 className="font-display text-base font-semibold text-white">{t.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{t.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      </div>
    </>
  );
}
