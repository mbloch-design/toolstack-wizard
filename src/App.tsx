import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams, useLocation, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangContext } from "@/hooks/useLang";
import { Lang } from "@/data/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

// Critical: HomePage loaded eagerly for FCP
import HomePage from "@/pages/HomePage";

// Lazy-loaded pages (below the fold / secondary routes)
const SelectorPage = lazy(() => import("@/pages/SelectorPage"));
const ResultsPage = lazy(() => import("@/pages/ResultsPage"));
const ToolsPage = lazy(() => import("@/pages/ToolsPage"));
const ToolDetailPage = lazy(() => import("@/pages/ToolDetailPage"));
const UpdateToolsV3 = lazy(() => import("@/pages/UpdateToolsV3"));
const UpdateToolsV4 = lazy(() => import("@/pages/UpdateToolsV4"));
const UpdateToolsV10 = lazy(() => import("@/pages/UpdateToolsV10"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const CategoriesIndexPage = lazy(() => import("@/pages/CategoriesIndexPage"));
const GuidesPage = lazy(() => import("@/pages/GuidesPage"));
const GuideDetailPage = lazy(() => import("@/pages/GuideDetailPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const MethodologyPage = lazy(() => import("@/pages/MethodologyPage"));
const TransparencyPage = lazy(() => import("@/pages/TransparencyPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const LegalNoticePage = lazy(() => import("@/pages/LegalNoticePage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const ComparePage = lazy(() => import("@/pages/ComparePage"));
const ComparesIndexPage = lazy(() => import("@/pages/ComparesIndexPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queryClient = new QueryClient();

const LangLayout = () => {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const validLang: Lang = lang === "en" ? "en" : "fr";

  // Also derive lang from pathname to stay in sync on internal navigations
  const pathLang = location.pathname.split("/")[1];
  const effectiveLang: Lang = pathLang === "en" ? "en" : validLang;

  return (
    <LangContext.Provider
      value={{
        lang: effectiveLang,
        t: (fr, en) => (effectiveLang === "en" ? en : fr),
        prefix: `/${effectiveLang}`,
      }}
    >
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet key={effectiveLang} />
        </main>
        <Footer />
      </div>
    </LangContext.Provider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Navigate to="/fr" replace />} />

          {/* Legacy redirects (301-like via Navigate replace) */}
          <Route path="/methodology" element={<Navigate to="/fr/methodology" replace />} />
          <Route path="/blog" element={<Navigate to="/fr/guides" replace />} />
          <Route path="/blog/*" element={<Navigate to="/fr/guides" replace />} />
          <Route path="/guides" element={<Navigate to="/fr/guides" replace />} />
          <Route path="/tool/:slug" element={<RedirectToolToFr />} />
          <Route path="/article/:slug" element={<RedirectArticleToFr />} />
          <Route path="/category/:slug" element={<RedirectCategoryToFr />} />
          

          <Route path="/:lang" element={<LangLayout />}>
            <Route index element={<HomePage />} />
            <Route path="selector" element={<SelectorPage />} />
            <Route path="selector/results" element={<ResultsPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tool/:slug" element={<ToolDetailPage />} />
            <Route path="outils/:slug" element={<RedirectOutils />} />
            <Route path="category" element={<CategoriesIndexPage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="guides" element={<GuidesPage />} />
            <Route path="guide/:slug" element={<GuideDetailPage />} />
            <Route path="article/:slug" element={<RedirectArticleToGuide />} />
            <Route path="comparatifs" element={<ComparesIndexPage />} />
            <Route path="comparatif/:slugPair" element={<ComparePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="methodology" element={<MethodologyPage />} />
            <Route path="methodologie" element={<MethodologyPage />} />
            <Route path="transparency" element={<TransparencyPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="legal-notice" element={<LegalNoticePage />} />
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="update-tools-v3" element={<UpdateToolsV3 />} />
            <Route path="update-tools-v4" element={<UpdateToolsV4 />} />
            <Route path="update-tools-v10" element={<UpdateToolsV10 />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

/** Redirect /tool/:slug and /en/tool/:slug → /fr/tool/:slug */
function RedirectToolToFr() {
  const { slug } = useParams();
  return <Navigate to={`/fr/tool/${slug}`} replace />;
}

/** Redirect /fr/outils/:slug → /fr/tool/:slug */
function RedirectOutils() {
  const { slug, lang } = useParams();
  return <Navigate to={`/${lang || "fr"}/tool/${slug}`} replace />;
}

/** Redirect /article/:slug → /fr/guide/:slug */
function RedirectArticleToFr() {
  const { slug } = useParams();
  return <Navigate to={`/fr/guide/${slug}`} replace />;
}

/** Redirect /:lang/article/:slug → /:lang/guide/:slug */
function RedirectArticleToGuide() {
  const { slug, lang } = useParams();
  return <Navigate to={`/${lang || "fr"}/guide/${slug}`} replace />;
}

/** Redirect /category/:slug → /fr/category/:slug */
function RedirectCategoryToFr() {
  const { slug } = useParams();
  return <Navigate to={`/fr/category/${slug}`} replace />;
}

export default App;
