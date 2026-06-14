import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import PageTransition from "@/components/PageTransition";
import HUD from "@/components/HUD";
import BootSequence from "@/components/BootSequence";
import { useSceneSync } from "@/hooks/useSceneSync";

import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";

// Heavy WebGL layer — loaded after first paint so the UI is instant.
const SceneCanvas = lazy(() => import("@/three/SceneCanvas"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

export default function App() {
  useSceneSync();
  const location = useLocation();

  return (
    <>
      {/* static fallback backdrop (visible until/if WebGL loads) */}
      <div
        aria-hidden
        className="fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(1200px 700px at 70% -10%, rgba(17,140,200,0.12), transparent 60%)," +
            "radial-gradient(900px 600px at 10% 110%, rgba(255,148,23,0.08), transparent 60%)," +
            "#03040a",
        }}
      />

      <Suspense fallback={null}>
        <SceneCanvas />
      </Suspense>

      {/* Route-aware legibility veil: light on the hero, stronger over text pages.
          Sits above the WebGL canvas (-z-10) and below content (z-10). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 transition-colors duration-700"
        style={{
          zIndex: 0,
          backgroundColor: location.pathname === "/" ? "rgba(3,4,10,0.16)" : "rgba(3,4,10,0.38)",
        }}
      />

      <div className="fx-overlay" aria-hidden />
      <HUD />
      <ScrollProgress />
      <Navbar />
      <ScrollToTop />

      <AnimatePresence mode="wait">
        <PageTransitionRoutes key={location.pathname} location={location} />
      </AnimatePresence>

      <Footer />
      <BootSequence />
    </>
  );
}

function PageTransitionRoutes({ location }: { location: ReturnType<typeof useLocation> }) {
  return (
    <PageTransition>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/blog/:slug" element={<ArticleDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
}
