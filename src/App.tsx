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
import CategoryPage from "@/pages/CategoryPage";
import GuidesPage from "@/pages/GuidesPage";
import GuideDetailPage from "@/pages/GuideDetailPage";
import AboutPage from "@/pages/AboutPage";
import TransparencyPage from "@/pages/TransparencyPage";
import ContactPage from "@/pages/ContactPage";
import NotFound from "@/pages/NotFound";

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
          <Outlet />
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
        <Routes>
          <Route path="/" element={<Navigate to="/fr" replace />} />
          <Route path="/:lang" element={<LangLayout />}>
            <Route index element={<HomePage />} />
            <Route path="selector" element={<SelectorPage />} />
            <Route path="selector/results" element={<ResultsPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tool/:slug" element={<ToolDetailPage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="guides" element={<GuidesPage />} />
            <Route path="guide/:slug" element={<GuideDetailPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="methodology" element={<AboutPage />} />
            <Route path="transparency" element={<TransparencyPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
