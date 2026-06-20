# Kishore Kumar A — Site 2 🌌

An immersive **cosmos + AI** portfolio. A deep-space starfield and drifting nebula
back a glowing **neural constellation** — nodes and pulsing connections that read as
both stars and an AI network. The 3D layer is one persistent WebGL canvas that
subtly shifts mood as you move between pages.

> This is **Site 2** — a more advanced companion to the original portfolio
> ([Site 1](https://kishore2494.github.io/personal-site)), which stays online and
> untouched. Full blog articles live on Site 1; Site 2 curates and links to them.

## Stack

- **React 18 + TypeScript + Vite** — fast static build
- **Three.js** via **@react-three/fiber** + **drei** + **postprocessing** (bloom) — the 3D
- **Framer Motion** — page transitions, scroll reveals
- **Tailwind CSS** — styling
- **React Router** — multi-page SPA (Home · Projects · Writing · About · Contact)

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build
```

## Deploy to GitHub Pages

A workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
deploys on every push to `main`.

1. Create a repo (default assumes the name **`personal-site-2`**) and push this code.
2. In **Settings → Pages**, set **Source = GitHub Actions**.
3. Push to `main`. The site publishes at
   `https://<username>.github.io/personal-site-2/`.

### Using a different repo name or a custom domain

The base path lives in **one place** — the `BASE` constant in
[`vite.config.ts`](vite.config.ts):

- **Project page** (`user.github.io/<repo>/`): set `BASE = "/<repo>/"`.
- **User page** (`user.github.io`) or a **custom domain**: set `BASE = "/"`, and
  in [`public/404.html`](public/404.html) set `pathSegmentsToKeep = 0`.

The router base path is derived automatically from `BASE`, and `404.html` provides
SPA deep-link fallback for client-side routing on GitHub Pages.

## Content, SEO & the portal (CMS-ready)

- **Real content pages** — articles render full Markdown at `/articles/<slug>` and
  `/blog/<slug>`; projects at `/projects/<slug>`. Article bodies live in
  [`src/content/articles/`](src/content/articles/).
- **Single source of truth** — every page reads content through
  [`src/content/index.ts`](src/content/index.ts). Today it reads local Markdown +
  structured data; when the **Sanity** portal is wired, only this file changes, so
  the same content can feed both this site and the original blog.
- **SEO** — per-page `<title>`, description, canonical, Open Graph & Twitter cards
  and JSON-LD via [`src/components/Seo.tsx`](src/components/Seo.tsx). Canonical URLs
  point at this site (set `url` in [`src/config/site.ts`](src/config/site.ts)).
  `sitemap.xml` is generated at build ([`scripts/gen-sitemap.mjs`](scripts/gen-sitemap.mjs))
  and `robots.txt` lives in `public/`.
- **Google Tag Manager** — set `gtmId` in `src/config/site.ts` (e.g. `GTM-XXXXXXX`)
  and it loads automatically; add GA4/ads through GTM.
- **Note:** full static prerendering (SSG) is the next SEO step — see below.

## Admin dashboard (local CMS)

Run a local admin board to manage everything — no cloud account:

```bash
npm run dashboard      # → http://localhost:4321
```

Tabs:
- **Posts** — create / edit / delete blog articles (Markdown in `src/content/articles/`).
- **Projects** — structured editor over `src/data/projects.json`.
- **Résumé** — edits `src/data/resume.json` (drives `/resume` + the PDF).
- **Settings** — identity, social links, GTM id and the homepage foundations
  ticker (`src/config/site.json`).

Hit **Publish (commit & push)** and it commits the content and pushes — the
GitHub Pages workflow then redeploys automatically (~2 min). All content is
plain JSON / Markdown in the repo, so it's fully yours and version-controlled.

## Project structure

```
src/
  three/        # WebGL: Starfield, Nebula, NeuralConstellation, Effects, Rig, SceneCanvas
  components/   # Navbar, Footer, cards, transitions, reveals
  pages/        # Home, Projects, Articles, About, Contact, NotFound
  data/         # projects.ts, articles.ts  (curated from real content)
  config/       # site.ts (identity + social links)
  hooks/        # useMood, useSceneSync
```

## Accessibility & performance

- Honors `prefers-reduced-motion` (slows/limits the 3D, disables bloom).
- Auto-detects device class (cores / viewport) and scales star count, node count and
  effects up or down.
- The 3D layer is lazy-loaded behind a CSS gradient backdrop, so the UI paints instantly.

---

Built with React, Three.js & Vite.
