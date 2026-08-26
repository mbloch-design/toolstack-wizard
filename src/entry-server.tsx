import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StaticRouter } from "react-router-dom/server";
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import DynamicCanonical from "@/components/DynamicCanonical";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppRoutes } from "@/App";
import { SsrToolContext, SsrRelatedPostsContext, SsrComparePairContext, SsrPostContext, loadLocalPosts } from "@/hooks/useSupabaseData";
import type { Post } from "@/hooks/useSupabaseData";
import type { Tool } from "@/data/types";
import StackDetailPage from "@/pages/StackDetailPage";

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
                    <AppRoutes />
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

// Same idea as renderToolPage, for /guide/:slug. GuideDetailPage must be an
// eager import in App.tsx (renderToString can't resolve a lazy() chunk) and
// usePostBySlug seeds from SsrPostContext so the body renders server-side.
export async function renderGuidePage(path: string, post: Post): Promise<string> {
  const queryClient = new QueryClient();

  return renderToString(
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
                <SsrPostContext.Provider value={post}>
                  <AppRoutes />
                </SsrPostContext.Provider>
              </Suspense>
            </ErrorBoundary>
          </StaticRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

// Same idea as renderToolPage, for /comparatif/:slugPair. ComparePage was
// lazy-loaded (see App.tsx), which silently defeats SSR — renderToString
// can't resolve a lazy() chunk, so it just renders the Suspense fallback.
// Made it an eager import for the same reason ToolDetailPage already is.
export async function renderComparePage(path: string, toolA: Tool, toolB: Tool): Promise<string> {
  const queryClient = new QueryClient();

  return renderToString(
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
                <SsrComparePairContext.Provider value={{ toolA, toolB }}>
                  <AppRoutes />
                </SsrComparePairContext.Provider>
              </Suspense>
            </ErrorBoundary>
          </StaticRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

// Same idea as renderGuidePage, for the homepage (/fr, /en). HomePageV2 is
// already an eager import in App.tsx, so no route-eagerness change is
// needed — it just wasn't wired into a render* function before, and shipped
// with an empty <div id="root"> plus a noscript fallback paragraph instead.
export async function renderHomePage(path: string): Promise<string> {
  const queryClient = new QueryClient();

  return renderToString(
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
                <AppRoutes />
              </Suspense>
            </ErrorBoundary>
          </StaticRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

// Stack detail stays a lazy client route so the rich 1.6 MB stack catalogue
// is not pulled into /stacks. For prerendering, render the detail component
// directly inside the matching route: SSR remains complete without making
// the component eager in the browser application.
export async function renderStackPage(path: string): Promise<string> {
  const queryClient = new QueryClient();

  return renderToString(
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
                <Routes>
                  <Route path="/:lang/stacks/:slug" element={<StackDetailPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </StaticRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}
