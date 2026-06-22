// Polyfill critique pour Supabase
if (typeof Object.hasOwn !== "function") {
  Object.hasOwn = (obj: object, prop: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, prop);
}

import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { SsrToolContext, SsrRelatedPostsContext } from "@/hooks/useSupabaseData";
import "./index.css";

const container = document.getElementById("root")!;
const ssrToolEl = document.getElementById("__SSR_TOOL__");

if (ssrToolEl) {
  // Server-rendered tool page (see entry-server.tsx / staticPrerenderPlugin):
  // hydrate the existing markup instead of wiping and re-rendering from
  // scratch, and seed useToolBySlug with the same data so the first client
  // render matches the server markup exactly.
  const ssrTool = JSON.parse(ssrToolEl.textContent || "null");
  const ssrRelatedPostsEl = document.getElementById("__SSR_RELATED_POSTS__");
  const ssrRelatedPosts = ssrRelatedPostsEl ? JSON.parse(ssrRelatedPostsEl.textContent || "[]") : [];
  hydrateRoot(
    container,
    <HelmetProvider>
      <SsrToolContext.Provider value={ssrTool}>
        <SsrRelatedPostsContext.Provider value={ssrRelatedPosts}>
          <App />
        </SsrRelatedPostsContext.Provider>
      </SsrToolContext.Provider>
    </HelmetProvider>
  );
} else {
  createRoot(container).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
