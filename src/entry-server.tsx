import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import DynamicCanonical from "@/components/DynamicCanonical";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LangLayout } from "@/App";
// Direct, eager import — App.tsx's own AppRoutes uses React.lazy() for this
// (correctly, to keep it out of every other page's bundle), but lazy +
// renderToString don't mix: a suspended boundary just renders its fallback
// here, it's never retried. This SSR-only entry needs the real component.
import ToolDetailPage from "@/pages/ToolDetailPage";
import { SsrToolContext, SsrRelatedPostsContext, loadLocalPosts } from "@/hooks/useSupabaseData";
import type { Tool } from "@/data/types";

export interface RenderedToolPage {
  html: string;
  relatedPosts: { slug: string; title: string; readTime: string }[];
}

// Server-side render of a single tool page, used by staticPrerenderPlugin
// (vite.config.ts) to fill <div id="root"> with real markup instead of
// shipping it empty. Mirrors App.tsx's provider tree exactly (StaticRouter
// instead of BrowserRouter) so client hydration matches with no mismatch.
//
// Also pre-computes the "related guides" list (normally populated by
// usePosts()'s client-only fetch, which starts empty) so the desktop
// sidebar doesn't grow from nothing to 1-3 cards after hydration — that
// was a guaranteed, full-page layout shift on every load.
export async function renderToolPage(path: string, tool: Tool, lang: string): Promise<RenderedToolPage> {
  const allPosts = await loadLocalPosts(lang);
  const relatedPosts = allPosts
    .filter((p) => `${p.title ?? ""} ${p.excerpt ?? ""} ${p.content ?? ""}`.toLowerCase().includes((tool.name ?? "").toLowerCase()))
    .slice(0, 3)
    .map((p) => ({ slug: p.slug, title: p.title, readTime: p.readTime }));

  const queryClient = new QueryClient();

  const html = renderToString(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <StaticRouter location={path}>
            <ScrollToTop />
            <DynamicCanonical />
            <ErrorBoundary>
              <Suspense fallback={null}>
                <SsrToolContext.Provider value={tool}>
                  <SsrRelatedPostsContext.Provider value={relatedPosts}>
                    <Routes>
                      <Route path="/:lang" element={<LangLayout />}>
                        <Route path="tool/:slug" element={<ToolDetailPage />} />
                      </Route>
                    </Routes>
                  </SsrRelatedPostsContext.Provider>
                </SsrToolContext.Provider>
              </Suspense>
            </ErrorBoundary>
          </StaticRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );

  return { html, relatedPosts };
}
