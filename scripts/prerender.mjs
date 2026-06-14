// Post-build prerender: writes a real static HTML file for every route
// (dist/<route>/index.html) so GitHub Pages serves deep links with HTTP 200,
// each carrying its own <title>/description/OG/Twitter/JSON-LD + crawlable
// content. The React SPA then mounts and replaces the content for humans.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import MarkdownIt from "markdown-it";
import { getArticles, getProjects } from "./data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://kishore2494.github.io/personal-site-2";
const BASE = "/personal-site-2";
const NAME = "Kishore Kumar A";

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const template = readFileSync(join(dist, "index.html"), "utf8");

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

function page({ path, title, description, type = "website", image, jsonLd, contentHtml }) {
  let html = template;
  // strip the default SEO tags from the template
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/i, "");

  const canonical = SITE + (path === "/" ? "/" : path);
  const ogImage = image || `${SITE}/favicon.svg`;
  const fullTitle = path === "/" ? title : `${title} · Kishore`;

  const head = `    <title>${esc(fullTitle)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${esc(fullTitle)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${esc(ogImage)}" />
    <meta property="og:site_name" content="${esc(NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(fullTitle)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(ogImage)}" />
${jsonLd ? `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
  `;
  html = html.replace("</head>", head + "</head>");

  // Crawlable fallback content + a tasteful loading splash. React clears #root
  // on mount, so humans see the full app; crawlers/non-JS see this.
  const splash = `<div id="prerender" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:2rem;background:#03040a;color:#cbd5e1;font-family:Inter,system-ui,sans-serif;z-index:1">
  <div style="max-width:720px">
    <p style="font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.2em;color:#34d3ff;text-transform:uppercase">${esc(NAME)}</p>
    <div style="margin-top:1rem">${contentHtml}</div>
    <p style="margin-top:2rem;font-family:'JetBrains Mono',monospace;font-size:12px;color:#475569">loading interface…</p>
  </div>
</div>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${splash}</div>`);
  return html;
}

function write(routePath, html) {
  const out =
    routePath === "/"
      ? join(dist, "index.html")
      : join(dist, routePath.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

const articles = getArticles();
const projects = await getProjects();

// ── static pages ──────────────────────────────────────────────────────────
const SUMMARY =
  "AI & Data Science graduate and founder building AI agents, RAG pipelines and multi-agent systems, with a long-term mission spanning AI, quantum computing and space exploration.";

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: NAME,
  url: SITE,
  jobTitle: "Founder · AI Engineer",
  description: SUMMARY,
  sameAs: [
    "https://github.com/kishore2494",
    "https://www.linkedin.com/in/kishore-kumar-11184a196/",
    "https://twitter.com/kishore2494",
  ],
  knowsAbout: ["Artificial Intelligence", "LLMs", "RAG", "Multi-Agent Systems", "Deep Tech", "Cosmology"],
};

const staticPages = [
  {
    path: "/",
    title: "Kishore Kumar A — AI Engineer & Deep-Tech Explorer",
    description: SUMMARY,
    type: "profile",
    jsonLd: personLd,
    contentHtml: `<h1 style="font-size:2rem;font-weight:700;color:#fff">${esc(NAME)}</h1><p style="margin-top:.5rem;color:#94a3b8">Founder · AI Engineer · Deep-Tech Explorer</p><p style="margin-top:1rem">${esc(SUMMARY)}</p>`,
  },
  {
    path: "/projects",
    title: "Projects — AI systems, web platforms & tooling",
    description:
      "Selected work by Kishore Kumar A: autonomous multi-agent AI, production RAG systems, SaaS platforms, developer tooling and brand design.",
    contentHtml:
      `<h1 style="font-size:2rem;font-weight:700;color:#fff">Projects</h1><ul style="margin-top:1rem">` +
      projects.map((p) => `<li><a href="${BASE}/projects/${p.slug}">${esc(p.title)}</a> — ${esc(p.blurb)}</li>`).join("") +
      `</ul>`,
  },
  {
    path: "/articles",
    title: "Writing — AI, the future & the universe",
    description:
      "Essays and build-guides by Kishore Kumar A on AI, RAG, multi-agent systems, the future of technology, and cosmology.",
    contentHtml:
      `<h1 style="font-size:2rem;font-weight:700;color:#fff">Writing</h1><ul style="margin-top:1rem">` +
      articles.map((a) => `<li><a href="${BASE}/articles/${a.slug}">${esc(a.title)}</a></li>`).join("") +
      `</ul>`,
  },
  {
    path: "/about",
    title: "About — Kishore Kumar A",
    description:
      "AI & Data Science graduate and founder building AI agents, RAG systems and multi-agent platforms, with a long-term mission in space and deep tech.",
    type: "profile",
    jsonLd: personLd,
    contentHtml: `<h1 style="font-size:2rem;font-weight:700;color:#fff">About</h1><p style="margin-top:1rem">${esc(SUMMARY)}</p>`,
  },
  {
    path: "/contact",
    title: "Contact — Kishore Kumar A",
    description: "Get in touch with Kishore Kumar A about AI systems, deep-tech ideas, or collaboration.",
    contentHtml: `<h1 style="font-size:2rem;font-weight:700;color:#fff">Contact</h1><p style="margin-top:1rem">Email: akishorekumar2494@gmail.com</p>`,
  },
];

for (const p of staticPages) write(p.path, page(p));

// ── article pages ─────────────────────────────────────────────────────────
for (const a of articles) {
  const bodyHtml = md.render(a.body).replace(/src="\/images\//g, `src="${BASE}/images/`);
  const cover = a.cover ? `<img src="${esc(a.cover)}" alt="${esc(a.title)}" style="max-width:100%;border-radius:1rem;margin:1rem 0" />` : "";
  const html = page({
    path: `/articles/${a.slug}`,
    title: a.title,
    description: a.excerpt,
    type: "article",
    image: a.cover || undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: a.title,
      description: a.excerpt,
      datePublished: a.date,
      image: a.cover || undefined,
      keywords: a.tags.join(", "),
      articleSection: a.categories.join(", "),
      author: { "@type": "Person", name: NAME, url: SITE },
      publisher: { "@type": "Person", name: NAME },
      mainEntityOfPage: `${SITE}/articles/${a.slug}`,
    },
    contentHtml: `<p style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#34d3ff">${esc(a.theme)} · ${esc(fmtDate(a.date))}</p><h1 style="font-size:2rem;font-weight:700;color:#fff;margin-top:.5rem">${esc(a.title)}</h1>${cover}<div style="margin-top:1rem">${bodyHtml}</div>`,
  });
  write(`/articles/${a.slug}`, html);
}

// ── project pages ─────────────────────────────────────────────────────────
for (const p of projects) {
  const html = page({
    path: `/projects/${p.slug}`,
    title: p.title,
    description: p.blurb,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: p.title,
      description: p.description,
      dateCreated: String(p.year),
      keywords: p.tags.join(", "),
      genre: p.category,
      creator: { "@type": "Person", name: NAME, url: SITE },
      url: p.link ?? `${SITE}/projects/${p.slug}`,
    },
    contentHtml: `<p style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#34d3ff">${esc(p.category)} · ${p.year}</p><h1 style="font-size:2rem;font-weight:700;color:#fff;margin-top:.5rem">${esc(p.title)}</h1><p style="margin-top:1rem">${esc(p.blurb)}</p><p style="margin-top:.5rem">${esc(p.description)}</p>`,
  });
  write(`/projects/${p.slug}`, html);
}

console.log(`prerendered: ${staticPages.length} static + ${articles.length} articles + ${projects.length} projects = ${staticPages.length + articles.length + projects.length} pages`);
