export const site = {
  name: "Kishore Kumar A",
  shortName: "Kishore",
  role: "Founder · AI Engineer · Deep-Tech Explorer",
  tagline: "Building the future of AI — and humanity's journey to the stars.",
  summary:
    "AI & Data Science graduate specializing in AI agents, LLM fine-tuning and RAG pipelines. Build-first by nature, with a long-term mission spanning AI, quantum computing and space exploration.",
  location: "India",
  availability: "Open to deep-tech & AI collaborations",

  // Site 2 is the SEO-primary site. Canonical URLs resolve against this.
  // (Swap to a custom domain later — only this line changes.)
  url: "https://kishore2494.github.io/personal-site-2",

  // Google Tag Manager container id — paste yours here (e.g. "GTM-XXXXXXX").
  gtmId: "",

  social: {
    email: "akishorekumar2494@gmail.com",
    emailUrl: "mailto:akishorekumar2494@gmail.com",
    github: "https://github.com/kishore2494",
    linkedin: "https://www.linkedin.com/in/kishore-kumar-11184a196/",
    twitter: "https://twitter.com/kishore2494",
    twitterHandle: "@kishore2494",
    whatsapp: "https://wa.me/919344901628",
  },

  // The original portfolio (Site 1) — linked, never disturbed.
  legacySiteUrl: "https://kishore2494.github.io/personal-site",
} as const;

export type Site = typeof site;
