import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { useEffect, useMemo } from "react";
import { Check, X, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import CompareHero from "@/components/compare/CompareHero";
import CompareSidebar from "@/components/compare/CompareSidebar";
import CompareStrengthBars from "@/components/compare/CompareStrengthBars";
import CompareVerdictCards from "@/components/compare/CompareVerdictCards";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import type { Tool } from "@/data/types";

const COMPARISONS: { slugPair: string; toolA: string; toolB: string }[] = [
  { slugPair: "chatgpt-vs-claude", toolA: "chatgpt", toolB: "claude" },
  { slugPair: "dropbox-vs-google-drive", toolA: "dropbox", toolB: "google-drive" },
  { slugPair: "zapier-vs-make", toolA: "zapier", toolB: "make" },
  { slugPair: "notion-vs-obsidian", toolA: "notion", toolB: "obsidian" },
  { slugPair: "typeform-vs-tally", toolA: "typeform", toolB: "tally" },
  { slugPair: "midjourney-vs-firefly", toolA: "midjourney", toolB: "adobe-firefly" },
  { slugPair: "github-copilot-vs-cursor", toolA: "github-copilot", toolB: "cursor" },
  { slugPair: "grammarly-vs-claude", toolA: "grammarly", toolB: "claude" },
];

function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function getPrice(tool: Tool): string {
  const v5 = tool.pricing_v5?.compare_price_monthly_eur;
  if (v5 != null && v5 > 0) return `${v5}€`;
  if (tool.defaultMonthlyPrice > 0) return `${tool.defaultMonthlyPrice}€`;
  return "Gratuit";
}

function getPriceNum(tool: Tool): number {
  return tool.pricing_v5?.compare_price_monthly_eur || tool.defaultMonthlyPrice || 0;
}

/** Build feature checklist from functional_needs union */
function buildFeatureChecklist(toolA: Tool, toolB: Tool): { label: string; a: boolean; b: boolean }[] {
  const allNeeds = new Set([...(toolA.functional_needs || []), ...(toolB.functional_needs || [])]);
  return Array.from(allNeeds).slice(0, 6).map(need => ({
    label: need.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    a: (toolA.functional_needs || []).includes(need),
    b: (toolB.functional_needs || []).includes(need),
  }));
}

const ComparePage = () => {
  const { slugPair } = useParams<{ slugPair: string }>();
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();
  const { categories } = useCategories();

  const comparison = COMPARISONS.find(c => c.slugPair === slugPair);
  const toolA = useMemo(() => comparison ? findTool(tools, comparison.toolA) : undefined, [tools, comparison]);
  const toolB = useMemo(() => comparison ? findTool(tools, comparison.toolB) : undefined, [tools, comparison]);

  const categoryList = useMemo(() => {
    const catSlugs = new Set(COMPARISONS.flatMap(c => {
      const a = findTool(tools, c.toolA);
      const b = findTool(tools, c.toolB);
      return [a?.categoryId, b?.categoryId].filter(Boolean);
    }));
    return categories
      .filter(c => catSlugs.has(c.id))
      .map(c => ({ slug: c.slug, label: c.name }))
      .slice(0, 6);
  }, [tools, categories]);

  useEffect(() => {
    if (!toolA || !toolB) return;
    const year = new Date().getFullYear();
    const title = `${toolA.name} vs ${toolB.name} — ${t("lequel choisir en", "which to choose in")} ${year} ? | ToolTrim`;
    const desc = t(
      `Comparatif ${toolA.name} vs ${toolB.name} : prix vérifiés, fonctionnalités, verdict ToolTrim. Trouvez le meilleur outil pour votre usage.`,
      `${toolA.name} vs ${toolB.name} comparison: verified pricing, features, ToolTrim verdict. Find the best tool for your use case.`
    );
    const url = `${SEO_BASE}/${lang}/comparatif/${slugPair}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/comparatif/${slugPair}`);

    setJsonLd("compare-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: desc,
      url,
      author: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      datePublished: "2026-03-13",
      inLanguage: lang,
    });

    return () => cleanupSeo(["compare-jsonld"]);
  }, [toolA, toolB, lang, slugPair]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!comparison || !toolA || !toolB) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Comparatif non trouvé.", "Comparison not found.")}</p>
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">
          {t("Retour au catalogue", "Back to catalog")}
        </Link>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const features = buildFeatureChecklist(toolA, toolB);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <CompareHero />

      {/* Main: Sidebar + Content */}
      <main className="px-4 md:px-8 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar — hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24">
            <CompareSidebar
              categories={categoryList}
              activeCategorySlug={slugPair || null}
              selectedTools={[toolA, toolB]}
              comparisons={COMPARISONS}
            />
          </div>

          {/* Main content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Sticky tool headers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 sticky top-20 z-30 pt-4 pb-2 bg-background/95 backdrop-blur-sm">
              <div className="hidden md:block" />
              {[
                { tool: toolA, borderColor: "border-primary" },
                { tool: toolB, borderColor: "border-orange-400" },
              ].map(({ tool, borderColor }) => (
                <Link
                  key={tool.id}
                  to={`${prefix}/tool/${tool.slug}`}
                  className={`bg-card p-5 rounded-2xl shadow-sm border-t-4 ${borderColor} hover:shadow-md transition-shadow`}
                >
                  <ToolLogo tool={tool} size={40} className="mb-3" />
                  <h3 className="text-lg font-extrabold text-foreground">{tool.name}</h3>
                  <p className={`text-xs font-bold mt-1 ${borderColor === "border-primary" ? "text-primary" : "text-orange-500"}`}>
                    {getPrice(tool)}/{t("mois", "mo")}
                  </p>
                </Link>
              ))}
            </div>

            {/* Pricing section */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-secondary">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 items-center">
                  <div>
                    <h4 className="font-bold text-lg mb-1">{t("Tarification mensuelle", "Monthly Pricing")}</h4>
                    <p className="text-sm text-muted-foreground">{t("Prix de départ par utilisateur", "Starting per user")}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-3xl font-mono font-black text-foreground">{getPrice(toolA)}</span>
                    <span className="text-sm text-muted-foreground">/{t("mois", "mo")}</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-3xl font-mono font-black text-foreground">{getPrice(toolB)}</span>
                    <span className="text-sm text-muted-foreground">/{t("mois", "mo")}</span>
                  </div>
                </div>
              </div>

              {/* Strength bars */}
              <CompareStrengthBars toolA={toolA} toolB={toolB} />

              {/* Feature checklist */}
              <div className="p-6 md:p-8">
                <h4 className="font-bold text-lg mb-6">{t("Fonctionnalités clés", "Key Features")}</h4>
                <div className="space-y-4">
                  {features.map((feat, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 items-center py-3 border-b border-secondary last:border-0"
                    >
                      <span className="col-span-2 md:col-span-1 font-semibold text-foreground text-sm">{feat.label}</span>
                      <div className="flex justify-center md:justify-start">
                        {feat.a ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex justify-center md:justify-start">
                        {feat.b ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verdict bento cards */}
            <CompareVerdictCards toolA={toolA} toolB={toolB} />

            {/* Pros/Cons side by side */}
            <div className="grid gap-6 md:grid-cols-2">
              {[toolA, toolB].map((tool) => (
                <div key={tool.id} className="bg-card rounded-2xl p-5 md:p-6 shadow-sm border border-border/15">
                  <h3 className="font-bold flex items-center gap-2 mb-4">
                    <ToolLogo tool={tool} size={24} /> {tool.name}
                  </h3>
                  {tool.pros?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-keep mb-2">{t("Avantages", "Pros")}</p>
                      <ul className="space-y-1.5">
                        {tool.pros.slice(0, 4).map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-keep/60" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {tool.cons?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-cancel mb-2">{t("Inconvénients", "Cons")}</p>
                      <ul className="space-y-1.5">
                        {tool.cons.slice(0, 3).map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cancel/60" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="mt-8 pt-8">
              <h2 className="text-xl font-bold tracking-tighter mb-6">{t("Questions fréquentes", "FAQ")}</h2>
              <div className="space-y-3">
                <details className="group bg-card rounded-2xl p-5 shadow-sm border border-border/15">
                  <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                    {t(
                      `${toolA.name} ou ${toolB.name} — lequel est moins cher ?`,
                      `${toolA.name} or ${toolB.name} — which is cheaper?`
                    )}
                    <ChevronIcon />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t(
                      `${toolA.name} coûte ${getPrice(toolA)}/mois et ${toolB.name} coûte ${getPrice(toolB)}/mois. Prix vérifiés sur les pages officielles.`,
                      `${toolA.name} costs ${getPrice(toolA)}/month and ${toolB.name} costs ${getPrice(toolB)}/month. Prices verified on official pages.`
                    )}
                  </p>
                </details>

                <details className="group bg-card rounded-2xl p-5 shadow-sm border border-border/15">
                  <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                    {t(
                      `${toolA.name} vs ${toolB.name} : lequel choisir en ${year} ?`,
                      `${toolA.name} vs ${toolB.name}: which to choose in ${year}?`
                    )}
                    <ChevronIcon />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t(
                      `Choisissez ${toolA.name} si : ${(toolA.verdict?.keepIf || []).join(", ") || "usage professionnel"}. Choisissez ${toolB.name} si : ${(toolB.verdict?.keepIf || []).join(", ") || "budget serré"}.`,
                      `Choose ${toolA.name} if: ${(toolA.verdict?.keepIf || []).join(", ") || "professional use"}. Choose ${toolB.name} if: ${(toolB.verdict?.keepIf || []).join(", ") || "tight budget"}.`
                    )}
                  </p>
                </details>

                {(toolA.migrationGuide || toolB.migrationGuide) && (
                  <details className="group bg-card rounded-2xl p-5 shadow-sm border border-border/15">
                    <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                      {t(
                        `Peut-on migrer de ${toolA.name} vers ${toolB.name} facilement ?`,
                        `Can I easily migrate from ${toolA.name} to ${toolB.name}?`
                      )}
                      <ChevronIcon />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {toolA.migrationGuide
                        ? t(
                            `Durée estimée : ${toolA.migrationGuide.timeEstimate}. Étapes : ${toolA.migrationGuide.steps.join(", ")}.`,
                            `Estimated time: ${toolA.migrationGuide.timeEstimate}. Steps: ${toolA.migrationGuide.steps.join(", ")}.`
                          )
                        : toolB.migrationGuide
                        ? t(
                            `Durée estimée : ${toolB.migrationGuide.timeEstimate}. Étapes : ${toolB.migrationGuide.steps.join(", ")}.`,
                            `Estimated time: ${toolB.migrationGuide.timeEstimate}. Steps: ${toolB.migrationGuide.steps.join(", ")}.`
                          )
                        : "—"}
                    </p>
                  </details>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to={`${prefix}/tool/${toolA.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/85 transition-colors shadow-lg shadow-primary/20"
              >
                {t("Voir la fiche", "See details")} {toolA.name} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={`${prefix}/tool/${toolB.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-secondary transition-colors"
              >
                {t("Voir la fiche", "See details")} {toolB.name} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default ComparePage;
