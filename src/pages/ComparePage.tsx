import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { useEffect, useMemo } from "react";
import { Check, X, ArrowRight, ExternalLink } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
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

function getVerifiedOn(tool: Tool): string {
  return tool.pricing_v5?.verified_on || "—";
}

const ComparePage = () => {
  const { slugPair } = useParams<{ slugPair: string }>();
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();

  const comparison = COMPARISONS.find(c => c.slugPair === slugPair);
  const toolA = useMemo(() => comparison ? findTool(tools, comparison.toolA) : undefined, [tools, comparison]);
  const toolB = useMemo(() => comparison ? findTool(tools, comparison.toolB) : undefined, [tools, comparison]);

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
    return <div className="container py-20 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!comparison || !toolA || !toolB) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Comparatif non trouvé.", "Comparison not found.")}</p>
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">{t("Retour au catalogue", "Back to catalog")}</Link>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const priceA = getPrice(toolA);
  const priceB = getPrice(toolB);
  const verifiedA = getVerifiedOn(toolA);
  const verifiedB = getVerifiedOn(toolB);

  // Determine verdict
  const prescriptionA = toolA.prescription_quality;
  const prescriptionB = toolB.prescription_quality;
  let verdict = "";
  if (prescriptionA === "ferme" && toolA.prescription_output) {
    verdict = t(
      `Notre recommandation : ${toolA.prescription_output.action === "replace-cheaper" || toolA.prescription_output.action === "replace-better" ? `remplacer ${toolA.name} par ${toolA.prescription_output.replacement_tool}` : toolA.prescription_output.action}. Économie potentielle : ${toolA.prescription_output.gain_monthly_eur}€/mois.`,
      `Our recommendation: ${toolA.prescription_output.action === "replace-cheaper" || toolA.prescription_output.action === "replace-better" ? `replace ${toolA.name} with ${toolA.prescription_output.replacement_tool}` : toolA.prescription_output.action}. Potential savings: ${toolA.prescription_output.gain_monthly_eur}€/month.`
    );
  } else if (prescriptionB === "ferme" && toolB.prescription_output) {
    verdict = t(
      `Notre recommandation : ${toolB.prescription_output.action === "replace-cheaper" || toolB.prescription_output.action === "replace-better" ? `remplacer ${toolB.name} par ${toolB.prescription_output.replacement_tool}` : toolB.prescription_output.action}. Économie potentielle : ${toolB.prescription_output.gain_monthly_eur}€/mois.`,
      `Our recommendation: ${toolB.prescription_output.action === "replace-cheaper" || toolB.prescription_output.action === "replace-better" ? `replace ${toolB.name} with ${toolB.prescription_output.replacement_tool}` : toolB.prescription_output.action}. Potential savings: ${toolB.prescription_output.gain_monthly_eur}€/month.`
    );
  } else {
    verdict = t(
      `Les deux outils ont des usages complémentaires. ${toolA.verdict?.threshold || ""} ${toolB.verdict?.threshold || ""}`.trim(),
      `Both tools have complementary uses. ${toolA.verdict?.threshold || ""} ${toolB.verdict?.threshold || ""}`.trim()
    );
  }

  const rows = [
    { label: t("Prix/mois", "Price/mo"), a: priceA, b: priceB },
    { label: t("Plan gratuit", "Free plan"), a: toolA.pricing?.free ? "✅" : "❌", b: toolB.pricing?.free ? "✅" : "❌" },
    {
      label: t("Meilleur pour", "Best for"),
      a: (toolA.verdict?.keepIf || []).slice(0, 2).join(", ") || "—",
      b: (toolB.verdict?.keepIf || []).slice(0, 2).join(", ") || "—",
    },
    {
      label: t("À éviter si", "Avoid if"),
      a: (toolA.verdict?.avoidIf || []).slice(0, 2).join(", ") || "—",
      b: (toolB.verdict?.avoidIf || []).slice(0, 2).join(", ") || "—",
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl text-center">
          {toolA.name} vs {toolB.name} — {t(`lequel choisir en ${year} ?`, `which to choose in ${year}?`)}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground leading-relaxed">
          {t(
            `Comparatif détaillé entre ${toolA.name} et ${toolB.name} avec prix vérifiés, avantages, inconvénients et verdict ToolTrim.`,
            `Detailed comparison between ${toolA.name} and ${toolB.name} with verified pricing, pros, cons, and ToolTrim verdict.`
          )}
        </p>

        {/* Tool headers */}
        <div className="mt-12 grid grid-cols-2 gap-6">
          {[toolA, toolB].map((tool) => (
            <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <ToolLogo tool={tool} size={40} />
              <div>
                <p className="font-semibold">{tool.name}</p>
                <p className="text-sm text-muted-foreground">{getPrice(tool)}/{t("mois", "mo")}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-10 rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="p-4 text-left font-semibold">{t("Critère", "Criteria")}</th>
                <th className="p-4 text-center font-semibold">{toolA.name}</th>
                <th className="p-4 text-center font-semibold">{toolB.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="p-4 font-medium text-muted-foreground">{row.label}</td>
                  <td className="p-4 text-center">{row.a}</td>
                  <td className="p-4 text-center">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verdict */}
        <div className="mt-10 rounded-xl border border-primary/20 bg-accent/30 p-6">
          <h2 className="text-lg font-bold tracking-tighter">{t("Notre verdict ToolTrim", "Our ToolTrim verdict")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{verdict}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Prix vérifiés le", "Prices verified on")} {verifiedA || verifiedB || "2026-03-13"}
            {toolA.pricing_v5?.source_domain && ` — ${t("Sources", "Sources")}: ${toolA.pricing_v5.source_domain}`}
            {toolB.pricing_v5?.source_domain && `, ${toolB.pricing_v5.source_domain}`}
          </p>
        </div>

        {/* Pros/Cons side by side */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[toolA, toolB].map((tool) => (
            <div key={tool.id} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <ToolLogo tool={tool} size={24} /> {tool.name}
              </h3>
              {tool.pros?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-keep mb-2">{t("Avantages", "Pros")}</p>
                  <ul className="space-y-1">
                    {tool.pros.slice(0, 4).map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-keep/60" />{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {tool.cons?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-cancel mb-2">{t("Inconvénients", "Cons")}</p>
                  <ul className="space-y-1">
                    {tool.cons.slice(0, 3).map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cancel/60" />{con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-14 border-t border-border pt-10">
          <h2 className="text-xl font-bold tracking-tighter">{t("Questions fréquentes", "FAQ")}</h2>
          <div className="mt-6 space-y-4">
            <details className="group rounded-xl border border-border bg-card p-5">
              <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                {t(`${toolA.name} ou ${toolB.name} — lequel est moins cher ?`, `${toolA.name} or ${toolB.name} — which is cheaper?`)}
                <ChevronIcon />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(
                  `${toolA.name} coûte ${priceA}/mois et ${toolB.name} coûte ${priceB}/mois. Prix vérifiés sur les pages officielles.`,
                  `${toolA.name} costs ${priceA}/month and ${toolB.name} costs ${priceB}/month. Prices verified on official pages.`
                )}
              </p>
            </details>
            {(toolA.migrationGuide || toolB.migrationGuide) && (
              <details className="group rounded-xl border border-border bg-card p-5">
                <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                  {t(`Peut-on migrer de ${toolA.name} vers ${toolB.name} facilement ?`, `Can I easily migrate from ${toolA.name} to ${toolB.name}?`)}
                  <ChevronIcon />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  {toolA.migrationGuide
                    ? t(`Durée estimée : ${toolA.migrationGuide.timeEstimate}. Étapes : ${toolA.migrationGuide.steps.join(", ")}.`,
                        `Estimated time: ${toolA.migrationGuide.timeEstimate}. Steps: ${toolA.migrationGuide.steps.join(", ")}.`)
                    : toolB.migrationGuide
                    ? t(`Durée estimée : ${toolB.migrationGuide.timeEstimate}. Étapes : ${toolB.migrationGuide.steps.join(", ")}.`,
                        `Estimated time: ${toolB.migrationGuide.timeEstimate}. Steps: ${toolB.migrationGuide.steps.join(", ")}.`)
                    : "—"}
                </p>
              </details>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to={`${prefix}/tool/${toolA.slug}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors">
            {t("Voir la fiche", "See details")} {toolA.name} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={`${prefix}/tool/${toolB.slug}`} className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition-colors">
            {t("Voir la fiche", "See details")} {toolB.name} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
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
