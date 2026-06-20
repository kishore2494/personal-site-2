import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { sceneState } from "@/three/scene-state";
import Typing from "@/components/Typing";

// Foundational ML works the neural net "processes" — signals domain depth.
const PAPERS = [
  '"Attention Is All You Need"',
  "Transformers",
  "self-attention",
  "RAG · retrieval-augmented",
  "Mixture-of-Experts",
  "RLHF",
  "chain-of-thought",
  "diffusion models",
  "neural scaling laws",
];

const STATION: Record<string, { label: string; sub: string }> = {
  "/": { label: "NEURAL CORE", sub: "sector 00 · origin" },
  "/projects": { label: "WORKSTATION", sub: "sector 01 · build bay" },
  "/articles": { label: "SINGULARITY", sub: "sector 02 · event horizon" },
  "/about": { label: "ATOMIC LAB", sub: "sector 03 · quantum deck" },
  "/contact": { label: "DEEP SPACE", sub: "sector 04 · comms relay" },
};

function Bracket({ className }: { className: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-6 w-6 border-nebula-400/40 ${className}`}
      aria-hidden
    />
  );
}

export default function HUD() {
  const { pathname } = useLocation();
  const station = STATION[pathname] ?? { label: "UNKNOWN", sub: "off-grid" };

  const coordRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = sceneState.pointer;
      if (coordRef.current)
        coordRef.current.textContent = `x:${p.x.toFixed(2)} y:${p.y.toFixed(2)}`;
      if (scrollRef.current)
        scrollRef.current.textContent = `${Math.round(sceneState.scroll * 100)
          .toString()
          .padStart(3, "0")}%`;
      if (distRef.current)
        distRef.current.textContent = `${sceneState.cam.length().toFixed(1)}u`;
      if (barRef.current) {
        const v = 0.5 + 0.5 * Math.sin(performance.now() / 600);
        barRef.current.style.width = `${30 + v * 70}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 hidden font-mono text-[10px] tracking-wider text-nebula-300/70 md:block">
      {/* corner brackets */}
      <Bracket className="left-3 top-3 border-l border-t" />
      <Bracket className="right-3 top-3 border-r border-t" />
      <Bracket className="bottom-3 left-3 border-b border-l" />
      <Bracket className="bottom-3 right-3 border-b border-r" />

      {/* top-left station readout */}
      <div className="absolute left-7 top-20">
        <div className="flex items-center gap-2 text-nebula-300/90">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-nebula-400" />
          <span className="text-white/80">KKA-OS</span>
          <span className="text-slate-500">v2.0</span>
        </div>
        <div className="mt-2 text-ember-300/80">▸ {station.label}</div>
        <div className="text-slate-500">{station.sub}</div>

        {pathname === "/" && (
          <div className="mt-3 max-w-[240px] text-slate-500">
            <div>┗ knowledge base</div>
            <div className="text-nebula-300/80">
              ▸ processing <Typing phrases={PAPERS} className="text-nebula-200" />
            </div>
          </div>
        )}
      </div>

      {/* bottom-left telemetry */}
      <div className="absolute bottom-8 left-7 space-y-1 text-slate-500">
        <div>
          PTR <span ref={coordRef} className="text-nebula-300/80">x:0.00 y:0.00</span>
        </div>
        <div>
          SCRL <span ref={scrollRef} className="text-nebula-300/80">000%</span>
        </div>
        <div>
          DIST <span ref={distRef} className="text-nebula-300/80">15.0u</span>
        </div>
      </div>

      {/* bottom-right signal meter */}
      <div className="absolute bottom-8 right-7 w-32 text-right text-slate-500">
        <div>SIGNAL · LOCKED</div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <span ref={barRef} className="block h-full rounded-full bg-gradient-to-r from-nebula-500 to-ember-400" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
}
