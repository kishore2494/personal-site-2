import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  "> initializing KKA-OS v2.0 ...",
  "> mounting WebGL context ............ [ OK ]",
  "> calibrating neural core .......... [ OK ]",
  "> spinning up accretion disk ....... [ OK ]",
  "> stabilizing electron orbits ...... [ OK ]",
  "> linking deep-space relay ......... [ OK ]",
  "> operator authenticated: KISHORE KUMAR A",
  "> launching interface ...",
];

export default function BootSequence() {
  const [done, setDone] = useState(() => {
    try {
      return sessionStorage.getItem("kka_booted") === "1";
    } catch {
      return false;
    }
  });
  const [shown, setShown] = useState<string[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (done) return;
    LINES.forEach((line, i) => {
      const id = window.setTimeout(() => {
        setShown((s) => [...s, line]);
        if (i === LINES.length - 1) {
          window.setTimeout(finish, 600);
        }
      }, 230 * (i + 1));
      timers.current.push(id);
    });
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    try {
      sessionStorage.setItem("kka_booted", "1");
    } catch {
      /* ignore */
    }
    setDone(true);
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={finish}
          className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-void-950"
        >
          <div className="star-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative w-[min(640px,90vw)] px-6">
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-nebula-300 sm:text-sm">
              {shown.map((l, i) => (
                <div key={i}>
                  {l}
                  {i === shown.length - 1 && (
                    <span className="ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-nebula-400" />
                  )}
                </div>
              ))}
            </pre>
            <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
              click to skip
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
