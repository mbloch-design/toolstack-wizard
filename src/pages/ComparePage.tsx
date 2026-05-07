import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { useEffect, useMemo } from "react";
import { Check, X, ArrowRight, CheckCircle, XCircle, Trophy, DollarSign, GitCompare, RefreshCw } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";

import CompareSidebar from "@/components/compare/CompareSidebar";
import FaqBlock from "@/components/FaqBlock";
import PageHero from "@/components/PageHero";
import CompareStrengthBars from "@/components/compare/CompareStrengthBars";
import CompareVerdictCards from "@/components/compare/CompareVerdictCards";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS as COMPARISONS } from "@/data/comparisons";

function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function QuickVerdict({ toolA, toolB, lang }: { toolA: Tool; toolB: Tool; lang: "fr" | "en" }) {
  const priceA = toolA.pricing_v5?.compare_price_monthly_eur ?? toolA.defaultMonthlyPrice ?? 0;
  const priceB = toolB.pricing_v5?.compare_price_monthly_eur ?? toolB.defaultMonthlyPrice ?? 0;

  const winner: Tool | null = (() => {
    const aFerme = toolA.prescription_quality === "ferme";
    const bFerme = toolB.prescription_quality === "ferme";
    if (aFerme && !bFerme) return toolA;
    if (bFerme && !aFerme) return toolB;
    if (priceA > 0 && priceB > 0) return priceA <= priceB ? toolA : toolB;
    if (priceA === 0 && priceB > 0) return toolA;
    if (priceB === 0 && priceA > 0) return toolB;
    return null;
  })();

  const loser = winner ? (winner === toolA ? toolB : toolA) : null;
  const winnerPrice = winner === toolA ? priceA : priceB;
  const loserPrice = winner === toolA ? priceB : priceA;
  const saving = loserPrice > 0 && winnerPrice < loserPrice ? parseFloat((loserPrice - winnerPrice).toFixed(2)) : 0;
  const keepIf = winner ? (winner.verdict?.keepIf || [])[0] : null;

  const label = lang === "fr" ? "Résultat rapide" : "Quick verdict";
  const winnerLabel = lang === "fr" ? "Recommandé" : "Recommended";
  const drawLabel = lang === "fr" ? "Dépend de votre usage" : "Depends on your use case";
  const savingLabel = lang === "fr"
    ? `Économisez ${saving}€/mois vs ${loser?.name}`
    : `Save €${saving}/mo vs ${loser?.name}`;
  const reasonPrefix = lang === "fr" ? "Idéal si : " : "Best if: ";

  return (
    <div className="surface-accent mt-6 flex items-start gap-4 px-5 py-4">
      <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1">{label}</p>
        {winner ? (
          <>
            <p className="font-bold text-foreground">
              <span className="text-primary">{winner.name}</span>
              {" "}
              <span className="font-normal text-muted-foreground text-sm">— {winnerLabel}</span>
            </p>
            {keepIf && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {reasonPrefix}<span className="font-medium text-foreground">{keepIf}</span>
              </p>
            )}
            {saving > 0 && (
              <p className="mt-1 text-xs font-semibold text-primary">{savingLabel}</p>
            )}
          </>
        ) : (
          <p className="font-semibold text-foreground">{drawLabel}</p>
        )}
      </div>
    </div>
  );
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

  // Parse slugPair dynamically: support any "slugA-vs-slugB" pair
  const parsedPair = useMemo(() => {
    if (!slugPair) return null;
    // Try featured first
    const featured = COMPARISONS.find(c => c.slugPair === slugPair);
    if (featured) return { idA: featured.toolA, idB: featured.toolB };
    // Dynamic: split on "-vs-"
    const parts = slugPair.split("-vs-");
    if (parts.length === 2) return { idA: parts[0], idB: parts[1] };
    return null;
  }, [slugPair]);

  const toolA = useMemo(() => parsedPair ? findTool(tools, parsedPair.idA) : undefined, [tools, parsedPair]);
  const toolB = useMemo(() => parsedPair ? findTool(tools, parsedPair.idB) : undefined, [tools, parsedPair]);

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
    const title = lang === "fr"
      ? `${toolA.name} vs ${toolB.name} ${year} — prix, avis et verdict | ToolTrim`
      : `${toolA.name} vs ${toolB.name} ${year} — pricing, review & verdict | ToolTrim`;
    const desc = lang === "fr"
      ? `${toolA.name} ou ${toolB.name} ? On a testé les deux : prix réels, fonctionnalités clés, et notre verdict sans langue de bois. Décide en 5 minutes.`
      : `${toolA.name} or ${toolB.name}? We tested both — real pricing, key features, and a straight verdict. Decide in 5 minutes.`;
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
  }, [toolA, toolB, lang, slugPair, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!parsedPair || !toolA || !toolB) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Comparatif non trouvé.", "Comparison not found.")}</p>
        <Link to={`${prefix}/comparatifs`} className="mt-4 inline-block text-primary hover:underline">
          {t("Voir tous les comparatifs", "See all comparisons")}
        </Link>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const features = buildFeatureChecklist(toolA, toolB);
  const compareFaqItems = [
    {
      question: t(
        `${toolA.name} ou ${toolB.name} — lequel est moins cher ?`,
        `${toolA.name} or ${toolB.name} — which is cheaper?`
      ),
      answer: t(
        `${toolA.name} coûte ${getPriceNum(toolA) > 0 ? getPrice(toolA) + "/mois" : "Gratuit"} et ${toolB.name} coûte ${getPriceNum(toolB) > 0 ? getPrice(toolB) + "/mois" : "Gratuit"}. Prix vérifiés sur les pages officielles.`,
        `${toolA.name} costs ${getPriceNum(toolA) > 0 ? getPrice(toolA) + "/month" : "Free"} and ${toolB.name} costs ${getPriceNum(toolB) > 0 ? getPrice(toolB) + "/month" : "Free"}. Prices verified on official pages.`
      ),
      icon: DollarSign,
    },
    {
      question: t(
        `${toolA.name} vs ${toolB.name} : lequel choisir en ${year} ?`,
        `${toolA.name} vs ${toolB.name}: which to choose in ${year}?`
      ),
      answer: t(
        `Choisissez ${toolA.name} si : ${(toolA.verdict?.keepIf || []).join(", ") || "usage professionnel"}. Choisissez ${toolB.name} si : ${(toolB.verdict?.keepIf || []).join(", ") || "budget serré"}.`,
        `Choose ${toolA.name} if: ${(toolA.verdict?.keepIf || []).join(", ") || "professional use"}. Choose ${toolB.name} if: ${(toolB.verdict?.keepIf || []).join(", ") || "tight budget"}.`
      ),
      icon: GitCompare,
    },
    ...((toolA.migrationGuide || toolB.migrationGuide)
      ? [{
          question: t(
            `Peut-on migrer de ${toolA.name} vers ${toolB.name} facilement ?`,
            `Can I easily migrate from ${toolA.name} to ${toolB.name}?`
          ),
          answer: toolA.migrationGuide
            ? t(
                `Durée estimée : ${toolA.migrationGuide.timeEstimate}. Étapes : ${toolA.migrationGuide.steps.join(", ")}.`,
                `Estimated time: ${toolA.migrationGuide.timeEstimate}. Steps: ${toolA.migrationGuide.steps.join(", ")}.`
              )
            : toolB.migrationGuide
            ? t(
                `Durée estimée : ${toolB.migrationGuide.timeEstimate}. Étapes : ${toolB.migrationGuide.steps.join(", ")}.`,
                `Estimated time: ${toolB.migrationGuide.timeEstimate}. Steps: ${toolB.migrationGuide.steps.join(", ")}.`
              )
            : "—",
          icon: RefreshCw,
        }]
      : []),
  ];

  return (
    <div className="bg-background min-h-screen">
      <PageHero
        breadcrumb={[
          { label: t("Comparatifs", "Comparisons"), href: `/${lang}/comparatifs` },
          { label: `${toolA.name} vs ${toolB.name}` },
        ]}
        eyebrow={t("Comparatif honnête", "Honest comparison")}
        icon={<Trophy className="h-3.5 w-3.5" />}
        title={
          lang === "fr" ? (
            <>{toolA.name} <span className="text-primary italic">vs</span> {toolB.name} — lequel choisir en {year} ?</>
          ) : (
            <>{toolA.name} <span className="text-primary italic">vs</span> {toolB.name} — which one to pick in {year}?</>
          )
        }
        description={
          lang === "fr"
            ? `${toolA.name} ou ${toolB.name} ? On a testé les deux : prix réels, fonctionnalités clés, et notre verdict sans langue de bois.`
            : `${toolA.name} or ${toolB.name}? We tested both — real pricing, key features, and a straight verdict.`
        }
        maxWidth="normal"
      >
        <div className="max-w-2xl">
          <QuickVerdict toolA={toolA} toolB={toolB} lang={lang} />
        </div>
      </PageHero>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 sticky top-[65px] z-30 pt-4 pb-2 bg-background/95 backdrop-blur-sm">
              <div className="hidden md:block" />
              {[
                { tool: toolA, borderColor: "border-primary" },
                { tool: toolB, borderColor: "border-orange-400" },
              ].map(({ tool, borderColor }) => (
                <Link
                  key={tool.id}
                  to={`${prefix}/tool/${tool.slug}`}
                  className={`surface-card-hover border-t-4 p-5 ${borderColor}`}
                >
                  <ToolLogo tool={tool} size={40} className="mb-3" />
                  <h3 className="text-base font-medium text-foreground" style={{ letterSpacing: "-0.012em" }}>{tool.name}</h3>
                  <p className={`text-xs font-bold mt-1 ${borderColor === "border-primary" ? "text-primary" : "text-orange-500"}`}>
                    {getPriceNum(tool) > 0 ? `${getPrice(tool)}/${t("mois", "mo")}` : t("Gratuit", "Free")}
                  </p>
                </Link>
              ))}
            </div>

            {/* Pricing section */}
            <div className="surface-card overflow-hidden">
              <div className="p-6 md:p-8 border-b border-secondary">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 items-center">
                  <div>
                    <h4 className="font-bold text-lg mb-1">{t("Tarification mensuelle", "Monthly Pricing")}</h4>
                    <p className="text-sm text-muted-foreground">{t("Prix de départ par utilisateur", "Starting per user")}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-3xl font-bold text-foreground">{getPrice(toolA)}</span>
                    {getPriceNum(toolA) > 0 && <span className="text-sm text-muted-foreground">/{t("mois", "mo")}</span>}
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-3xl font-mono font-bold text-foreground">{getPrice(toolB)}</span>
                    {getPriceNum(toolB) > 0 && <span className="text-sm text-muted-foreground">/{t("mois", "mo")}</span>}
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
                <div key={tool.id} className="surface-card p-5 md:p-6">
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
              <FaqBlock
                eyebrow={t("Questions fréquentes", "FAQ")}
                title={t("Questions fréquentes", "Frequently asked questions")}
                description={t(
                  "Prix, usage réel et effort de migration : la FAQ sert à trancher, pas à meubler.",
                  "Pricing, real usage, and migration effort: this FAQ is here to help decide, not fill space."
                )}
                stats={[
                  { value: getPrice(toolA), label: toolA.name },
                  { value: getPrice(toolB), label: toolB.name },
                ]}
                items={compareFaqItems}
                openCount={2}
              />
            </div>

            {/* ── Lequel est fait pour toi ? ── */}
            <div className="surface-accent mt-8 p-6 md:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-2">
                {t("Ton profil", "Your profile")}
              </p>
              <h2 className="text-xl font-semibold tracking-tight">
                {t(`Lequel est fait pour toi ?`, `Which one is right for you?`)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  "Le comparatif t'a donné les faits. Mais le bon choix dépend de comment tu travailles.",
                  "The comparison gave you the facts. But the right choice depends on how you work."
                )}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[toolA, toolB].map((tool, idx) => {
                  const keeps = (lang === "en" ? tool.verdictEn?.keepIf : tool.verdict?.keepIf) || tool.verdict?.keepIf || [];
                  if (keeps.length === 0) return null;
                  const borderColor = idx === 0 ? "border-primary/30" : "border-orange-400/30";
                  const textColor = idx === 0 ? "text-primary" : "text-orange-500";
                  return (
                    <div key={tool.id} className={`rounded-lg border ${borderColor} bg-card p-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <ToolLogo tool={tool} size={20} />
                        <p className={`text-sm font-bold ${textColor}`}>
                          {t(`Prends ${tool.name} si…`, `Pick ${tool.name} if…`)}
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {keeps.slice(0, 3).map((k: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className={`mt-0.5 shrink-0 ${textColor}`}>✓</span>
                            {k}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  to={`${prefix}/selector?from=${slugPair}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors"
                >
                  {t("Analyser ma stack", "Audit my stack")} <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Dis-nous comment tu travailles — on te dit lequel est vraiment adapté à toi.",
                    "Tell us how you work — we'll tell you which one is really right for you."
                  )}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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

export default ComparePage;
