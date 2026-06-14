import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { useMood } from "@/hooks/useMood";

export default function NotFound() {
  useMood("contact");
  return (
    <div className="section-pad flex min-h-[80svh] flex-col items-center justify-center pt-24 text-center">
      <p className="font-display text-7xl font-bold gradient-text sm:text-8xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-white">Lost in the void</h1>
      <p className="mt-3 max-w-md text-slate-400">
        This page drifted beyond the observable universe. Let's get you back on course.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <Home size={16} /> Back home
        </Link>
        <button onClick={() => window.history.back()} className="btn-ghost">
          <ArrowLeft size={16} /> Go back
        </button>
      </div>
    </div>
  );
}
