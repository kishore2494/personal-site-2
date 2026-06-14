import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import SocialLinks from "./SocialLinks";
import { site } from "@/config/site";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/10 bg-void-950/60 backdrop-blur-md">
      <div className="section-pad py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-white">{site.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{site.tagline}</p>
            <SocialLinks className="mt-6" />
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <nav className="flex flex-col gap-2.5">
              <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">Explore</p>
              <Link to="/projects" className="text-slate-400 transition-colors hover:text-white">Projects</Link>
              <Link to="/articles" className="text-slate-400 transition-colors hover:text-white">Writing</Link>
              <Link to="/about" className="text-slate-400 transition-colors hover:text-white">About</Link>
              <Link to="/contact" className="text-slate-400 transition-colors hover:text-white">Contact</Link>
            </nav>
            <nav className="flex flex-col gap-2.5">
              <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">Connect</p>
              <a href={site.social.emailUrl} className="text-slate-400 transition-colors hover:text-white">Email</a>
              <a href={site.social.github} target="_blank" rel="noreferrer" className="text-slate-400 transition-colors hover:text-white">GitHub</a>
              <a href={site.social.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 transition-colors hover:text-white">LinkedIn</a>
            </nav>
            <nav className="flex flex-col gap-2.5">
              <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">More</p>
              <a
                href={site.legacySiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-400 transition-colors hover:text-white"
              >
                The blog <ArrowUpRight size={13} />
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {2026} {site.name}. All rights reserved.</p>
          <p className="text-slate-600">Cosmos + AI · built with React, Three.js &amp; Vite</p>
        </div>
      </div>
    </footer>
  );
}
