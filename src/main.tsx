import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { site } from "./config/site";
import { initGTM } from "./lib/gtm";
import "./index.css";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

initGTM(site.gtmId);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
