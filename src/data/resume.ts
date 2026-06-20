// Structured résumé — single source for the /resume page (and easy to edit or
// later feed from Sanity). Update freely; the page re-renders from this.
export const resume = {
  summary:
    "AI & Data Science graduate and founder. I build AI agents, RAG pipelines and multi-agent systems with a hands-on, build-first approach — and I'm driven by a long-term mission across AI, quantum computing and space exploration.",

  experience: [
    {
      role: "Founder",
      org: "Aurora AI",
      period: "Present",
      points: [
        "Deliver AI-driven solutions that help businesses automate and scale.",
        "Design and ship agentic systems, RAG pipelines and voice-AI automation.",
      ],
    },
    {
      role: "AI / ML Engineer",
      org: "Independent",
      period: "2023 — Present",
      points: [
        "Built an autonomous multi-agent AI debating platform on local LLMs with a custom PDF-based RAG pipeline.",
        "Built a production-style RAG system (LangChain + FAISS + Ollama) for grounded, context-aware answers.",
        "Fine-tuned LLMs and built small language models from scratch in Python.",
      ],
    },
    {
      role: "Web, SaaS & Brand",
      org: "Freelance",
      period: "2014 — 2022",
      points: [
        "Shipped SaaS platforms, API/OpenAPI design and marketing sites (Tubelight Communications, Harper Collins, TextEdu).",
        "Delivered brand, logo and packaging systems for startups and shows.",
      ],
    },
  ],

  education: [
    { credential: "B.E. — Artificial Intelligence & Data Science", org: "Graduate", period: "" },
  ],

  skills: [
    { group: "AI / ML", items: ["LLM fine-tuning", "RAG pipelines", "Multi-agent systems", "Voice AI", "Deep learning"] },
    { group: "Tools", items: ["Python", "LangChain", "Ollama", "FAISS / ChromaDB", "Streamlit"] },
    { group: "Engineering", items: ["TypeScript", "React", "APIs / OpenAPI", "SaaS architecture"] },
    { group: "Interests", items: ["Cosmology", "Astrophysics", "Quantum computing", "Space missions"] },
  ],

  highlights: [
    "Multi-agent AI debating society (autonomous, local LLMs)",
    "Production RAG system with vector retrieval",
    "2.54M-parameter small language model in Python",
  ],
} as const;
