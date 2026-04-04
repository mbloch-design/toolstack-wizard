import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangContext } from "@/hooks/useLang";
import { Lang } from "@/data/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import SelectorPage from "@/pages/SelectorPage";
import ResultsPage from "@/pages/ResultsPage";
import ToolsPage from "@/pages/ToolsPage";
import ToolDetailPage from "@/pages/ToolDetailPage";
import UpdateToolsV3 from "@/pages/UpdateToolsV3";
import UpdateToolsV4 from "@/pages/UpdateToolsV4";
import UpdateToolsV10 from "@/pages/UpdateToolsV10";
import CategoryPage from "@/pages/CategoryPage";
import CategoriesIndexPage from "@/pages/CategoriesIndexPage";
import GuidesPage from "@/pages/GuidesPage";
import GuideDetailPage from "@/pages/GuideDetailPage";
import AboutPage from "@/pages/AboutPage";
import MethodologyPage from "@/pages/MethodologyPage";
import TransparencyPage from "@/pages/TransparencyPage";
import ContactPage from "@/pages/ContactPage";
import LegalNoticePage from "@/pages/LegalNoticePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";
import ComparePage from "@/pages/ComparePage";
import NotFound from "@/pages/NotFound";
import ScrollToTop from "@/components/ScrollToTop";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queryClient = new QueryClient();

const LangLayout = () => {
  const { lang } = useParams<{ lang: string }>();
  const validLang: Lang = lang === "en" ? "en" : "fr";

  return (
    <LangContext.Provider
      value={{
        lang: validLang,
        t: (fr, en) => (validLang === "en" ? en : fr),
        prefix: `/${validLang}`,
      }}
    >
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet key={validLang} />
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
          <Route path="/en/tool/:slug" element={<RedirectToolToFr />} />
          <Route path="/article/:slug" element={<RedirectArticleToFr />} />
          <Route path="/category/:slug" element={<RedirectCategoryToFr />} />
          <Route path="/en/category/*" element={<Navigate to="/fr" replace />} />
          

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

/** Redirect /category/:slug → /fr/category/:slug */
function RedirectCategoryToFr() {
  const { slug } = useParams();
  return <Navigate to={`/fr/category/${slug}`} replace />;
}

export default App;
