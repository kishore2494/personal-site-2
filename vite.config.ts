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
