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
import DynamicCanonical from "@/components/DynamicCanonical";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Critical: HomePage loaded eagerly for FCP
import HomePage from "@/pages/HomePage";

// Lazy-loaded pages (below the fold / secondary routes)
const SelectorPage = lazy(() => import("@/pages/SelectorPage"));
const ResultsPage = lazy(() => import("@/pages/ResultsPage"));
const ToolsPage = lazy(() => import("@/pages/ToolsPage"));
const ToolDetailPage = lazy(() => import("@/pages/ToolDetailPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const CategoriesIndexPage = lazy(() => import("@/pages/CategoriesIndexPage"));
const GuidesPage = lazy(() => import("@/pages/GuidesPage"));
const GuideDetailPage = lazy(() => import("@/pages/GuideDetailPage"));
const StacksPage = lazy(() => import("@/pages/StacksPage"));
const StackDetailPage = lazy(() => import("@/pages/StackDetailPage"));
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
const AuditLanding = lazy(() => import("@/pages/AuditLanding"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const PersonaPillarPage = lazy(() => import("@/pages/PersonaPillarPage"));
const ArticleFacturation = lazy(() => import("@/pages/ArticleFacturation"));
const BackOfficePage = lazy(() => import("@/pages/BackOfficePage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 min — avoid refetching on every mount
      gcTime: 30 * 60 * 1000,    // 30 min — keep unused data in cache
      retry: 1,
    },
  },
});

const GUIDE_SLUG_ALTERNATES: Record<string, string> = {
  "loom-prix-alternatives": "loom-pricing-alternatives",
  "conseils-ia-freelances-2026": "ai-tips-freelancers-2026",
  "notion-gratuit-ou-payant": "notion-free-or-paid",
  "toggl-track-gratuit-ou-payant": "toggl-track-free-or-paid",
  "calendly-gratuit-suffisant": "calendly-free-enough",
  "chatgpt-plus-utile-ou-inutile": "chatgpt-plus-worth-it",
  "grammarly-gratuit-ou-payant": "grammarly-free-or-paid",
  "stripe-vs-virement": "stripe-vs-bank-transfer",
  "claude-vs-chatgpt-2026-lequel-choisir-business": "claude-vs-chatgpt-deepseek",
  "grammarly-vs-languagetool-comparaison": "grammarly-vs-languagetool-comparison-2026",
  "notion-vs-coda-comparatif-2026": "notion-vs-coda-comparison-2026",
  "chatgpt-vs-claude-comparatif-2026": "chatgpt-vs-claude-comparison-2026",
  "zapier-vs-make-comparatif-2026": "zapier-vs-make-comparison-2026",
  "figma-vs-canva-comparatif-2026": "figma-vs-canva-comparison-2026",
  "slack-vs-teams-comparatif-2026": "slack-vs-teams-comparison-2026",
  "stack-redactrice-freelance": "stack-freelance-writer",
};

const GUIDE_EN_TO_FR = Object.fromEntries(
  Object.entries(GUIDE_SLUG_ALTERNATES).map(([fr, en]) => [en, fr]),
) as Record<string, string>;

const GUIDE_COMPARISON_REDIRECTS: Record<string, string> = {
  "notion-vs-coda-comparatif-2026": "notion-vs-coda",
  "notion-vs-coda-comparison-2026": "notion-vs-coda",
  "chatgpt-vs-claude-comparatif-2026": "chatgpt-vs-claude",
  "chatgpt-vs-claude-comparison-2026": "chatgpt-vs-claude",
  "zapier-vs-make-comparatif-2026": "zapier-vs-make",
  "zapier-vs-make-comparison-2026": "zapier-vs-make",
  "figma-vs-canva-comparatif-2026": "figma-vs-canva",
  "figma-vs-canva-comparison-2026": "figma-vs-canva",
};

const GUIDE_FR_ONLY_SLUGS = new Set([
  "claude-sonnet-4-6-vs-chatgpt-vs-deepseek-vs-gemini-fevrier-2026",
  "meilleurs-outils-ia-freelances-2026",
  "claude-opus-4-6-guide-complet-freelances",
  "alternatives-gratuites-notion-freelance-2026",
  "stack-minimaliste-freelance-2026",
  "stripe-freelance-tarifs-alternatives",
  "perplexity-vs-chatgpt-recherche",
  "notion-gratuit-vs-payant-vrai-calcul",
]);

const LangLayout = () => {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const validLang: Lang = lang === "en" ? "en" : "fr";

  // Also derive lang from pathname to stay in sync on internal navigations
  const pathLang = location.pathname.split("/")[1];
  const effectiveLang: Lang = pathLang === "en" ? "en" : validLang;
  const isDiagnosticFocusRoute = /^\/(fr|en)\/selector\/?$/.test(location.pathname);

  return (
    <LangContext.Provider
      value={{
        lang: effectiveLang,
        t: (fr, en) => (effectiveLang === "en" ? en : fr),
        prefix: `/${effectiveLang}`,
      }}
    >
      <div className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-to-content">
          {effectiveLang === "en" ? "Skip to main content" : "Aller au contenu"}
        </a>
        {!isDiagnosticFocusRoute && <Navbar />}
        <main id="main-content" className={`flex-1 ${isDiagnosticFocusRoute ? "" : "pt-[68px]"}`}>
          <Outlet key={effectiveLang} />
        </main>
        {!isDiagnosticFocusRoute && <Footer />}
      </div>
    </LangContext.Provider>
  );
};

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <DynamicCanonical />
        <ErrorBoundary>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/fr" replace />} />

            {/* Legacy redirects */}
            <Route path="/methodology" element={<Navigate to="/fr/methodology" replace />} />
            <Route path="/blog" element={<Navigate to="/fr/guides" replace />} />
            <Route path="/blog/:slug" element={<RedirectBlogToGuide />} />
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
              <Route path="tool/:slug/prix" element={<LocalizedToolSubpage subpage="prix" />} />
              <Route path="tool/:slug/pricing" element={<LocalizedToolSubpage subpage="pricing" />} />
              <Route path="tool/:slug/alternatives" element={<ToolDetailPage />} />
              <Route path="tool/:slug/avis" element={<ToolDetailPage />} />
              <Route path="tool/:slug/reviews" element={<ToolDetailPage />} />
              <Route path="tool/:slug/faq" element={<ToolDetailPage />} />
              <Route path="outils/:slug" element={<RedirectOutils />} />
              <Route path="category" element={<CategoriesIndexPage />} />
              <Route path="category/:slug" element={<CategoryPage />} />
              <Route path="guides" element={<GuidesPage />} />
              <Route path="stacks" element={<StacksPage />} />
              <Route path="stacks/:slug" element={<StackDetailPage />} />
              {/* Persona pillar pages — declared BEFORE guide/:slug to take precedence */}
              <Route path="guide/meilleurs-outils-developpeur-freelance" element={<PersonaPillarPage persona="THEO" lang="fr" />} />
              <Route path="guide/best-tools-freelance-developer" element={<PersonaPillarPage persona="THEO" lang="en" />} />
              <Route path="guide/meilleurs-outils-designer-freelance" element={<PersonaPillarPage persona="SOFIA" lang="fr" />} />
              <Route path="guide/best-tools-freelance-designer" element={<PersonaPillarPage persona="SOFIA" lang="en" />} />
              <Route path="guide/meilleurs-outils-consultant-freelance" element={<PersonaPillarPage persona="MARC" lang="fr" />} />
              <Route path="guide/best-tools-freelance-consultant" element={<PersonaPillarPage persona="MARC" lang="en" />} />
              <Route path="guide/meilleurs-outils-createur-contenu-freelance" element={<PersonaPillarPage persona="ALIX" lang="fr" />} />
              <Route path="guide/best-tools-freelance-content-creator" element={<PersonaPillarPage persona="ALIX" lang="en" />} />
              <Route path="guide/meilleurs-outils-ops-manager-freelance" element={<PersonaPillarPage persona="CLAIRE" lang="fr" />} />
              <Route path="guide/best-tools-freelance-ops-manager" element={<PersonaPillarPage persona="CLAIRE" lang="en" />} />
              <Route path="guide/outils-facturation-freelance-2026" element={<ArticleFacturation />} />
              <Route path="guide/:slug" element={<LocalizedGuidePage />} />
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
              {/* SEO landing — localized slugs (FR + EN) under same LangLayout */}
              <Route path="search" element={<SearchPage />} />
              <Route path="audit-saas-gratuit" element={<AuditLanding />} />
              <Route path="free-saas-audit" element={<AuditLanding />} />
              <Route path="back-office" element={<BackOfficePage />} />
            </Route>
<Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
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

/** Keep localized tool sub-pages canonical: FR=/prix, EN=/pricing */
function LocalizedToolSubpage({ subpage }: { subpage: "prix" | "pricing" }) {
  const { slug, lang } = useParams();
  if (lang === "en" && subpage === "prix") {
    return <Navigate to={`/en/tool/${slug}/pricing`} replace />;
  }
  if (lang !== "en" && subpage === "pricing") {
    return <Navigate to={`/${lang || "fr"}/tool/${slug}/prix`} replace />;
  }
  return <ToolDetailPage />;
}

/** Keep guide slugs canonical per language and avoid mixed-language duplicates */
function LocalizedGuidePage() {
  const { slug = "", lang } = useParams();
  const comparisonSlug = GUIDE_COMPARISON_REDIRECTS[slug];
  if (comparisonSlug) {
    return <Navigate to={`/${lang || "fr"}/comparatif/${comparisonSlug}`} replace />;
  }
  if (lang === "en") {
    const enSlug = GUIDE_SLUG_ALTERNATES[slug];
    if (enSlug) return <Navigate to={`/en/guide/${enSlug}`} replace />;
    if (GUIDE_FR_ONLY_SLUGS.has(slug)) return <Navigate to={`/fr/guide/${slug}`} replace />;
  }
  if (lang !== "en") {
    const frSlug = GUIDE_EN_TO_FR[slug];
    if (frSlug) return <Navigate to={`/${lang || "fr"}/guide/${frSlug}`} replace />;
  }
  return <GuideDetailPage />;
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

/** Redirect /blog/:slug → /fr/guide/:slug */
function RedirectBlogToGuide() {
  const { slug } = useParams();
  return <Navigate to={`/fr/guide/${slug}`} replace />;
}

/** Redirect /category/:slug → /fr/category/:slug */
function RedirectCategoryToFr() {
  const { slug } = useParams();
  return <Navigate to={`/fr/category/${slug}`} replace />;
}

export default App;
