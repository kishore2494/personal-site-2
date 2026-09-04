import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { site } from "./config/site";
import { initGTM } from "./lib/gtm";
import "./index.css";
import { MotionConfig } from "framer-motion";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

initGTM(site.gtmId);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* framer-motion animates inline styles from JavaScript, so the CSS reduced-motion rules in
        index.css never touched it — 14 components kept animating for users who had asked them
        not to. reducedMotion="user" makes every motion component honour the OS setting. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
