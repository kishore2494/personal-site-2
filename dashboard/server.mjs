// ─────────────────────────────────────────────────────────────────────────
//  LOCAL CONTENT DASHBOARD
//
//  A tiny, dependency-light admin you run on your own machine:
//    npm run dashboard   →   http://localhost:4321
//
//  Write/edit blog posts in the browser, then hit "Publish" — it commits the
//  Markdown to git and pushes, which triggers the GitHub Pages deploy. No
//  cloud account needed; the content lives as Markdown in src/content/articles.
// ─────────────────────────────────────────────────────────────────────────
import http from "node:http";
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { exec } from "node:child_process";
import fm from "front-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ARTICLES = join(ROOT, "src/content/articles");
const PROJECTS = join(ROOT, "src/data/projects.json");
const RESUME = join(ROOT, "src/data/resume.json");
const SITE = join(ROOT, "src/config/site.json");
const PORT = 4321;

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJSON = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + "\n");

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const toList = (v) =>
  Array.isArray(v) ? v : typeof v === "string" && v.trim() ? v.split(",").map((x) => x.trim()) : [];

function listArticles() {
  return readdirSync(ARTICLES)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { attributes: a } = fm(readFileSync(join(ARTICLES, f), "utf8"));
      return {
        slug: f.replace(/\.md$/, ""),
        title: a.title || f,
        date: a.date ? String(a.date).slice(0, 10) : "",
        draft: Boolean(a.draft),
        categories: toList(a.categories),
      };
    })
    .sort((x, y) => (x.date < y.date ? 1 : -1));
}

function readArticle(slug) {
  const p = join(ARTICLES, `${slug}.md`);
  if (!existsSync(p)) return null;
  const { attributes: a, body } = fm(readFileSync(p, "utf8"));
  return {
    slug,
    title: a.title || "",
    date: a.date ? String(a.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    excerpt: a.excerpt || "",
    categories: toList(a.categories),
    tags: toList(a.tags),
    image: a.image || "",
    draft: Boolean(a.draft),
    body,
  };
}

function writeArticle(data) {
  const slug = data.slug || slugify(data.title || "untitled");
  const front = [
    "---",
    `title: ${JSON.stringify(data.title || "Untitled")}`,
    `path: "/articles/${slug}/"`,
    `date: ${data.date || new Date().toISOString().slice(0, 10)}`,
    `excerpt: ${JSON.stringify(data.excerpt || "")}`,
    `image: ${JSON.stringify(data.image || "")}`,
    `categories: ${JSON.stringify(toList(data.categories))}`,
    `tags: ${JSON.stringify(toList(data.tags))}`,
    `draft: ${Boolean(data.draft)}`,
    "---",
    "",
    (data.body || "").trim(),
    "",
  ].join("\n");
  writeFileSync(join(ARTICLES, `${slug}.md`), front);
  return slug;
}

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: ROOT, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: (stdout || "") + (stderr || "") });
    });
  });
}

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => {
      try {
        resolve(d ? JSON.parse(d) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    if (path === "/") return send(res, 200, readFileSync(join(__dirname, "index.html"), "utf8"), "text/html");

    if (path === "/api/articles" && req.method === "GET") return send(res, 200, listArticles());

    if (path.startsWith("/api/article/") && req.method === "GET") {
      const slug = decodeURIComponent(path.slice("/api/article/".length));
      const a = readArticle(slug);
      return a ? send(res, 200, a) : send(res, 404, { error: "not found" });
    }

    if (path === "/api/article" && req.method === "POST") {
      const data = await readBody(req);
      const slug = writeArticle(data);
      return send(res, 200, { ok: true, slug });
    }

    if (path.startsWith("/api/article/") && req.method === "DELETE") {
      const slug = decodeURIComponent(path.slice("/api/article/".length));
      const p = join(ARTICLES, `${slug}.md`);
      if (existsSync(p)) unlinkSync(p);
      return send(res, 200, { ok: true });
    }

    // ── Projects ──────────────────────────────────────────────────────────
    if (path === "/api/projects" && req.method === "GET") return send(res, 200, readJSON(PROJECTS));

    if (path === "/api/project" && req.method === "POST") {
      const p = await readBody(req);
      const slug = p.slug || slugify(p.title || "untitled");
      const proj = {
        slug,
        title: p.title || "Untitled",
        blurb: p.blurb || "",
        description: p.description || "",
        year: Number(p.year) || new Date().getFullYear(),
        category: p.category || "AI",
        tags: toList(p.tags),
        featured: Boolean(p.featured),
        ...(p.link ? { link: p.link } : {}),
      };
      const arr = readJSON(PROJECTS);
      const i = arr.findIndex((x) => x.slug === slug);
      if (i >= 0) arr[i] = proj;
      else arr.push(proj);
      writeJSON(PROJECTS, arr);
      return send(res, 200, { ok: true, slug });
    }

    if (path.startsWith("/api/project/") && req.method === "DELETE") {
      const slug = decodeURIComponent(path.slice("/api/project/".length));
      writeJSON(PROJECTS, readJSON(PROJECTS).filter((x) => x.slug !== slug));
      return send(res, 200, { ok: true });
    }

    // ── Résumé ────────────────────────────────────────────────────────────
    if (path === "/api/resume" && req.method === "GET") return send(res, 200, readJSON(RESUME));
    if (path === "/api/resume" && req.method === "POST") {
      const body = await readBody(req);
      writeJSON(RESUME, body);
      return send(res, 200, { ok: true });
    }

    // ── Settings (site.json) ──────────────────────────────────────────────
    if (path === "/api/settings" && req.method === "GET") return send(res, 200, readJSON(SITE));
    if (path === "/api/settings" && req.method === "POST") {
      const body = await readBody(req);
      writeJSON(SITE, body);
      return send(res, 200, { ok: true });
    }

    if (path === "/api/status" && req.method === "GET") {
      const { out } = await run("git status --porcelain src/content src/data src/config public");
      return send(res, 200, { changes: out.trim().split("\n").filter(Boolean).length, detail: out.trim() });
    }

    if (path === "/api/publish" && req.method === "POST") {
      const { message } = await readBody(req);
      const msg = (message || "content: update via dashboard").replace(/"/g, "'");
      const r = await run(`git add -A src/content src/data src/config public && git commit -m "${msg}" && git push`);
      return send(res, 200, r);
    }

    send(res, 404, { error: "not found" });
  } catch (e) {
    send(res, 500, { error: String(e) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  ✦ Content dashboard running → http://localhost:${PORT}\n`);
});
