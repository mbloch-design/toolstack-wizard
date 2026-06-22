import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import DynamicCanonical from "@/components/DynamicCanonical";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppRoutes } from "@/App";
import { SsrToolContext } from "@/hooks/useSupabaseData";
import type { Tool } from "@/data/types";

// Server-side render of a single tool page, used by staticPrerenderPlugin
// (vite.config.ts) to fill <div id="root"> with real markup instead of
// shipping it empty. Mirrors App.tsx's provider tree exactly (StaticRouter
// instead of BrowserRouter) so client hydration matches with no mismatch.
export function renderToolPage(path: string, tool: Tool): string {
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
                <SsrToolContext.Provider value={tool}>
                  <AppRoutes />
                </SsrToolContext.Provider>
              </Suspense>
            </ErrorBoundary>
          </StaticRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}
