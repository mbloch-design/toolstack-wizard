import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { SsrToolContext, SsrRelatedPostsContext, SsrComparePairContext, SsrPostContext } from "@/hooks/useSupabaseData";
import { SsrStackContext } from "@/hooks/useStackDetailData";
import "./index.css";
import { installToolTrimSystem } from "./styles/tooltrim-system.js";

// Système ToolTrim : l'étoile filante des appels qui mènent (mêmes sélecteurs
// que le bloc « Système ToolTrim appliqué au site » de index.css).
installToolTrimSystem({
  sparkSelector: ".tt-cta, .tt-page-hero-cta > .tt-button-primary, .ss-cta, .sl-final-cta, .sp-payment-cta, .sp-upgrade-cta, .hv2-cta, .td-hero-site-link, .td-decision-cta-main, .cp-guide-outbound-button--primary, .tt-footer-action--primary, .so-primary",
});

const container = document.getElementById("root")!;
const ssrToolEl = document.getElementById("__SSR_TOOL__");
const ssrCompareEl = document.getElementById("__SSR_COMPARE__");
const ssrPostEl = document.getElementById("__SSR_POST__");
const ssrStackEl = document.getElementById("__SSR_STACK__");

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
} else if (ssrCompareEl) {
  // Server-rendered comparison page (see entry-server.tsx's
  // renderComparePage) — same idea, seeds useToolPair so client hydration
  // matches the server markup instead of refetching and flashing a loader.
  const ssrCompare = JSON.parse(ssrCompareEl.textContent || "null");
  hydrateRoot(
    container,
    <HelmetProvider>
      <SsrComparePairContext.Provider value={ssrCompare}>
        <App />
      </SsrComparePairContext.Provider>
    </HelmetProvider>
  );
} else if (ssrStackEl) {
  const ssrStack = JSON.parse(ssrStackEl.textContent || "null");
  hydrateRoot(
    container,
    <HelmetProvider>
      <SsrStackContext.Provider value={ssrStack}>
        <App />
      </SsrStackContext.Provider>
    </HelmetProvider>
  );
} else if (ssrPostEl) {
  // Server-rendered guide page (see entry-server.tsx's renderGuidePage) —
  // seeds usePostBySlug so client hydration matches the server markup
  // instead of refetching and flashing a loader.
  const ssrPost = JSON.parse(ssrPostEl.textContent || "null");
  hydrateRoot(
    container,
    <HelmetProvider>
      <SsrPostContext.Provider value={ssrPost}>
        <App />
      </SsrPostContext.Provider>
    </HelmetProvider>
  );
} else {
  createRoot(container).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
