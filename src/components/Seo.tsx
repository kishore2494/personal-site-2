import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { site } from "@/config/site";

type Props = {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "profile";
  /** JSON-LD structured data object(s). */
  jsonLd?: object | object[];
};

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const JSONLD_ID = "seo-jsonld";

/**
 * Per-page SEO: title, description, Open Graph, Twitter, canonical + JSON-LD.
 * Works at runtime now and is structured to drop straight into SSG later.
 */
export default function Seo({ title, description, image, type = "website", jsonLd }: Props) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = pathname === "/" ? title : `${title} · ${site.shortName}`;
    const canonical = site.url + (pathname === "/" ? "" : pathname);
    const ogImage = image ?? `${site.url}/favicon.svg`;

    document.title = fullTitle;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertLink("canonical", canonical);

    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonical);
    upsertMeta('meta[property="og:image"]', "property", "og:image", ogImage);
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", site.name);

    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);

    // JSON-LD
    let script = document.getElementById(JSONLD_ID) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = JSONLD_ID;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, image, type, jsonLd, pathname]);

  return null;
}
