// Polyfill critique pour Supabase
if (typeof Object.hasOwn !== "function") {
  Object.hasOwn = (obj: object, prop: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, prop);
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
