import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/articles", label: "Writing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function Mark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Home">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-nebula-400/30 bg-void-800/70">
        <span className="absolute inset-0 rounded-xl shadow-glow opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="h-2 w-2 rounded-full bg-nebula-400 shadow-glow" />
      </span>
      <span className="font-display text-sm font-semibold tracking-wide text-white">
        Kishore<span className="text-nebula-400">.</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-300 ${
          scrolled ? "border-b border-white/10 bg-void-950/70 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <nav className="section-pad flex h-16 items-center justify-between">
          <Mark />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full border border-nebula-400/30 bg-white/[0.06]"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    {l.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-200 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden"
          >
            <div className="section-pad pb-4">
              <div className="glass flex flex-col gap-1 rounded-2xl p-2">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive ? "bg-white/[0.07] text-white" : "text-slate-300 hover:bg-white/5"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
