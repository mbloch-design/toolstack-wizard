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
  return Array.from(allNeeds).slice(0, 8).map(need => ({
    label: need.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    a: (toolA.functional_needs || []).includes(need),
    b: (toolB.functional_needs || []).includes(need),
  }));
}

// ── Face-à-face header cards ────────────────────────────────────────────────
function ToolFaceCard({
  tool,
  isWinner,
  accent,
}: {
  tool: Tool;
  isWinner: boolean;
  accent: "primary" | "orange";
}) {
  const accentText = accent === "primary" ? "text-primary" : "text-orange-500";
  const accentBorder = accent === "primary" ? "border-primary/40" : "border-orange-400/40";
  const accentBg = accent === "primary" ? "bg-primary/5" : "bg-orange-500/5";
  const { t, prefix } = useLang();

  return (
    <Link
      to={`${prefix}/tool/${tool.slug}`}
      className={`group relative flex flex-col gap-3 rounded-xl border-2 p-5 transition-colors hover:border-opacity-80 ${
        isWinner ? `${accentBorder} ${accentBg}` : "border-border bg-card hover:bg-secondary/40"
      }`}
    >
      {isWinner && (
        <span
          className={`absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${accentBorder} ${accentBg} ${accentText}`}
        >
          <Trophy className="h-2.5 w-2.5" />
          {t("Recommandé", "Recommended")}
        </span>
      )}
      <div className="flex items-center gap-3">
        <ToolLogo tool={tool} size={36} className="rounded-lg shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {tool.name}
          </p>
          <p className={`text-sm font-bold ${accentText}`}>
            {getPriceNum(tool) > 0 ? `${getPrice(tool)}/mois` : t("Gratuit", "Free")}
          </p>
        </div>
      </div>
      {tool.shortDescription && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {tool.shortDescription}
        </p>
      )}
    </Link>
  );
}

// ── Pricing section ──────────────────────────────────────────────────────────
function PricingSection({ toolA, toolB }: { toolA: Tool; toolB: Tool }) {
  const { t } = useLang();
  const priceA = getPriceNum(toolA);
  const priceB = getPriceNum(toolB);
  const cheaperTool = priceA <= priceB ? toolA : toolB;
  const cheaperPrice = Math.min(priceA, priceB);
  const pricierPrice = Math.max(priceA, priceB);
  const annualSaving = parseFloat(((pricierPrice - cheaperPrice) * 12).toFixed(2));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[toolA, toolB].map((tool, idx) => {
          const price = getPriceNum(tool);
          const annual = price > 0 ? parseFloat((price * 12).toFixed(2)) : 0;
          const isCheaper = price === cheaperPrice && cheaperPrice !== pricierPrice;
          return (
            <div
              key={tool.id}
              className={`rounded-xl border p-5 ${isCheaper ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <ToolLogo tool={tool} size={20} className="rounded" />
                <span className="text-sm font-semibold text-foreground">{tool.name}</span>
                {isCheaper && annualSaving > 0 && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-primary">
                    {t("Le moins cher", "Cheaper")}
                  </span>
                )}
              </div>
              <p
                className="font-bold text-foreground"
                style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", letterSpacing: "-0.03em", lineHeight: 1 }}
              >
                {price > 0 ? `${price}€` : t("Gratuit", "Free")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("/mois par utilisateur", "/month per user")}</p>
              {annual > 0 && (
                <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
                  {t("soit", "i.e.")} <span className="font-semibold text-foreground">{annual}€/an</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {annualSaving > 0 && (
        <div className="rounded-xl bg-primary/8 border border-primary/20 px-5 py-4 flex items-start gap-3">
          <DollarSign className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <p className="text-sm text-foreground">
            {t(
              `En choisissant ${cheaperTool.name}, vous économisez `,
              `By choosing ${cheaperTool.name}, you save `
            )}
            <span className="font-bold text-primary">{annualSaving}€/an</span>
            {t(" par rapport à l'alternative.", " vs the alternative.")}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Feature diff ─────────────────────────────────────────────────────────────
function FeatureDiff({
  toolA,
  toolB,
  features,
}: {
  toolA: Tool;
  toolB: Tool;
  features: { label: string; a: boolean; b: boolean }[];
}) {
  const { t } = useLang();
  const onlyA = features.filter(f => f.a && !f.b);
  const onlyB = features.filter(f => f.b && !f.a);
  const both = features.filter(f => f.a && f.b);

  if (features.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* Exclusive features side by side */}
      {(onlyA.length > 0 || onlyB.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Only in A */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-3">
              {t(`Uniquement dans ${toolA.name}`, `Only in ${toolA.name}`)}
            </p>
            {onlyA.length > 0 ? (
              <ul className="space-y-2">
                {onlyA.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                    {f.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("Pas d'exclusivité détectée", "No exclusives detected")}
              </p>
            )}
          </div>

          {/* Only in B */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-500 mb-3">
              {t(`Uniquement dans ${toolB.name}`, `Only in ${toolB.name}`)}
            </p>
            {onlyB.length > 0 ? (
              <ul className="space-y-2">
                {onlyB.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 shrink-0 text-orange-500" />
                    {f.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("Pas d'exclusivité détectée", "No exclusives detected")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Shared features */}
      {both.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {t("Les deux proposent", "Both offer")}
          </p>
          <div className="flex flex-wrap gap-2">
            {both.map(f => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                <Check className="h-3 w-3" />
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pros / Cons ───────────────────────────────────────────────────────────────
function ProsConsSection({ toolA, toolB }: { toolA: Tool; toolB: Tool }) {
  const { t } = useLang();
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[toolA, toolB].map((tool, idx) => (
        <div key={tool.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <ToolLogo tool={tool} size={22} className="rounded" />
            <span className="font-semibold text-foreground text-sm">{tool.name}</span>
          </div>
          {tool.pros?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-2">
                {t("Points forts", "Pros")}
              </p>
              <ul className="space-y-1.5">
                {tool.pros.slice(0, 4).map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tool.cons?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-destructive/60 mb-2">
                {t("Limites", "Cons")}
              </p>
              <ul className="space-y-1.5">
                {tool.cons.slice(0, 3).map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/50" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Quick verdict in hero ─────────────────────────────────────────────────────
function QuickVerdict({ toolA, toolB, lang }: { toolA: Tool; toolB: Tool; lang: "fr" | "en" }) {
  const priceA = getPriceNum(toolA);
  const priceB = getPriceNum(toolB);

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
  const saving = loserPrice > 0 && winnerPrice < loserPrice
    ? parseFloat((loserPrice - winnerPrice).toFixed(2))
    : 0;
  const keepIf = winner ? (winner.verdict?.keepIf || [])[0] : null;

  return (
    <div className="surface-accent mt-6 flex items-start gap-4 px-5 py-4">
      <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1">
          {lang === "fr" ? "Résultat rapide" : "Quick verdict"}
        </p>
        {winner ? (
          <>
            <p className="font-bold text-foreground">
              <span className="text-primary">{winner.name}</span>
              {" "}
              <span className="font-normal text-muted-foreground text-sm">
                — {lang === "fr" ? "Recommandé" : "Recommended"}
              </span>
            </p>
            {keepIf && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {lang === "fr" ? "Idéal si : " : "Best if: "}
                <span className="font-medium text-foreground">{keepIf}</span>
              </p>
            )}
            {saving > 0 && (
              <p className="mt-1 text-xs font-semibold text-primary">
                {lang === "fr"
                  ? `Économisez ${saving}€/mois vs ${loser?.name}`
                  : `Save €${saving}/mo vs ${loser?.name}`}
              </p>
            )}
          </>
        ) : (
          <p className="font-semibold text-foreground">
            {lang === "fr" ? "Dépend de votre usage" : "Depends on your use case"}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const ComparePage = () => {
  const { slugPair } = useParams<{ slugPair: string }>();
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();
  const { categories } = useCategories();

  const parsedPair = useMemo(() => {
    if (!slugPair) return null;
    const featured = COMPARISONS.find(c => c.slugPair === slugPair);
    if (featured) return { idA: featured.toolA, idB: featured.toolB };
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

  // Determine winner for face card highlights
  const priceA = getPriceNum(toolA);
  const priceB = getPriceNum(toolB);
  const winner: Tool | null = (() => {
    const aFerme = toolA.prescription_quality === "ferme";
    const bFerme = toolB.prescription_quality === "ferme";
    if (aFerme && !bFerme) return toolA;
    if (bFerme && !aFerme) return toolB;
    if (priceA > 0 && priceB > 0) return priceA <= priceB ? toolA : toolB;
    return null;
  })();

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

      <main className="px-4 md:px-8 pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
          <div className="hidden lg:block lg:col-span-3 sticky top-[65px]">
            <CompareSidebar
              categories={categoryList}
              activeCategorySlug={slugPair || null}
              selectedTools={[toolA, toolB]}
              comparisons={COMPARISONS}
            />
          </div>

          {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
          <div className="lg:col-span-9">

            {/* ── FACE À FACE ─────────────────────────────────────────── */}
            <section className="border-b border-border py-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-4">
                {t("Face à face", "Head to head")}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <ToolFaceCard tool={toolA} isWinner={winner === toolA} accent="primary" />
                <ToolFaceCard tool={toolB} isWinner={winner === toolB} accent="orange" />
              </div>
            </section>

            {/* ── TARIFICATION ────────────────────────────────────────── */}
            <section className="border-b border-border py-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-6">
                {t("Tarification", "Pricing")}
              </p>
              <PricingSection toolA={toolA} toolB={toolB} />
            </section>

            {/* ── FORCE DE LA PLATEFORME ──────────────────────────────── */}
            <section className="border-b border-border py-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-6">
                {t("Force de la plateforme", "Platform strength")}
              </p>
              <CompareStrengthBars toolA={toolA} toolB={toolB} />
            </section>

            {/* ── CE QUI LES DISTINGUE ────────────────────────────────── */}
            {features.length > 0 && (
              <section className="border-b border-border py-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
                  {t("Ce qui les distingue", "Key differences")}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {t(
                    "Seules les fonctionnalités différenciantes sont listées ici.",
                    "Only differentiating features are listed here."
                  )}
                </p>
                <FeatureDiff toolA={toolA} toolB={toolB} features={features} />
              </section>
            )}

            {/* ── VERDICT ─────────────────────────────────────────────── */}
            <section className="border-b border-border py-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-6">
                {t("Notre avis", "Our take")}
              </p>
              <CompareVerdictCards toolA={toolA} toolB={toolB} />
            </section>

            {/* ── POUR QUI ? ──────────────────────────────────────────── */}
            {([toolA, toolB].some(tool => (
              (lang === "en" ? tool.verdictEn?.keepIf : tool.verdict?.keepIf) || tool.verdict?.keepIf || []
            ).length > 0)) && (
              <section className="border-b border-border py-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
                  {t("Pour qui ?", "Who is it for?")}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {t(
                    "Le bon outil dépend de comment tu travailles, pas de la liste de features.",
                    "The right tool depends on how you work, not just the feature list."
                  )}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[toolA, toolB].map((tool, idx) => {
                    const keeps = (lang === "en" ? tool.verdictEn?.keepIf : tool.verdict?.keepIf) || tool.verdict?.keepIf || [];
                    if (keeps.length === 0) return null;
                    const isA = idx === 0;
                    const borderColor = isA ? "border-primary/30" : "border-orange-400/30";
                    const bgColor = isA ? "bg-primary/5" : "bg-orange-500/5";
                    const textColor = isA ? "text-primary" : "text-orange-500";
                    const checkColor = isA ? "text-primary/70" : "text-orange-500/70";
                    return (
                      <div key={tool.id} className={`rounded-xl border ${borderColor} ${bgColor} p-5`}>
                        <div className="flex items-center gap-2 mb-4">
                          <ToolLogo tool={tool} size={18} className="rounded" />
                          <p className={`text-sm font-bold ${textColor}`}>
                            {t(`Prends ${tool.name} si…`, `Pick ${tool.name} if…`)}
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {keeps.slice(0, 4).map((k: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <span className={`mt-0.5 shrink-0 text-base leading-none ${checkColor}`}>✓</span>
                              {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── POINTS FORTS & LIMITES ──────────────────────────────── */}
            <section className="border-b border-border py-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-6">
                {t("Points forts & limites", "Pros & cons")}
              </p>
              <ProsConsSection toolA={toolA} toolB={toolB} />
            </section>

            {/* ── FAQ ─────────────────────────────────────────────────── */}
            <section className="border-b border-border py-10">
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
            </section>

            {/* ── CTA FINAL ───────────────────────────────────────────── */}
            <section className="py-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-3">
                {t("Diagnostic", "Diagnostic")}
              </p>
              <h2
                className="font-display text-foreground mb-4"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}
              >
                {t(
                  "Ce comparatif part d'un cas général. Toi, tu as déjà une stack.",
                  "This comparison starts from a general case. You already have a stack."
                )}
              </h2>
              <p className="text-sm leading-7 text-muted-foreground mb-8 max-w-xl">
                {t(
                  "Le diagnostic personnalisé regarde ce que tu paies vraiment — outils actifs vs dormants, doublons, plans surévalués. Résultat en moins de 3 minutes.",
                  "The personalized diagnostic looks at what you actually pay — active vs dormant tools, duplicates, overpriced plans. Result in under 3 minutes."
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={`${prefix}/selector?from=${slugPair}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {t("Analyser ma stack", "Audit my stack")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={`${prefix}/tool/${toolA.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  {t("Fiche complète", "Full review")} {toolA.name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={`${prefix}/tool/${toolB.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  {t("Fiche complète", "Full review")} {toolB.name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ComparePage;
