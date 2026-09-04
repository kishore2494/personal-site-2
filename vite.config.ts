import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages base path.
// - For a PROJECT page (https://<user>.github.io/<repo>/) set base to "/<repo>/".
// - For a USER page (https://<user>.github.io/) or a custom domain, set base to "/".
// Change ONLY this constant if you rename the repo.
const BASE = "/personal-site-2/";

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    // Keep the WebGL layer out of the FIRST PAINT, which is what App.tsx already intends:
    //   // Heavy WebGL layer — loaded after first paint so the UI is instant.
    //   const SceneCanvas = lazy(() => import("@/three/SceneCanvas"));
    //
    // The lazy() was doing its job and the BUILD was undoing it. manualChunks pulls three and
    // r3f into named chunks, and Vite then emits <link rel="modulepreload"> for them in
    // index.html — so the browser fetched 251 kB gzip of 3D engine as part of the initial load,
    // competing with the critical path, on a site whose whole point is being fast and indexed.
    //
    // Filtering them out of the preload list leaves the manual chunks alone (so they stay
    // separately cacheable, and the names check-bundle-size.mjs budgets stay valid) and lets
    // them load when the lazy import actually runs.
    modulePreload: {
      resolveDependencies: (_filename: string, deps: string[]) =>
        deps.filter((d) => !/(^|\/)(three|r3f)-[A-Za-z0-9_-]+\.js$/.test(d)),
    },
    target: "es2020",
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"],
          vendor: ["react", "react-dom", "react-router-dom", "framer-motion"],
        },
      },
    },
  },
});
