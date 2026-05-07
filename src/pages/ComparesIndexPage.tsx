import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { useEffect } from "react";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { ArrowRight, Search, Sparkles, Scale } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PageHero from "@/components/PageHero";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS } from "@/data/comparisons";

function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function getPrice(tool: Tool): string {
  const v5 = tool.pricing_v5?.compare_price_monthly_eur;
  if (v5 != null && v5 > 0) return `${v5}€`;
  if (tool.defaultMonthlyPrice > 0) return `${tool.defaultMonthlyPrice}€`;
  return "Gratuit";
}

function getPriceLabel(tool: Tool, t: (fr: string, en: string) => string): string {
  const v5 = tool.pricing_v5?.compare_price_monthly_eur;
  const price = v5 != null && v5 > 0 ? v5 : tool.defaultMonthlyPrice;
  if (price > 0) return `${price}€/${t("mois", "mo")}`;
  return t("Gratuit", "Free");
}

const ComparesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();
  const navigate = useNavigate();

  // Custom comparator state
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [selectedA, setSelectedA] = useState<Tool | null>(null);
  const [selectedB, setSelectedB] = useState<Tool | null>(null);
  const [focusedInput, setFocusedInput] = useState<"a" | "b" | null>(null);

  const filteredToolsA = useMemo(() => {
    if (!searchA.trim()) return [];
    const q = searchA.toLowerCase();
    return tools.filter(t => (t.name ?? "").toLowerCase().includes(q) && t.id !== selectedB?.id).slice(0, 6);
  }, [searchA, tools, selectedB]);

  const filteredToolsB = useMemo(() => {
    if (!searchB.trim()) return [];
    const q = searchB.toLowerCase();
    return tools.filter(t => (t.name ?? "").toLowerCase().includes(q) && t.id !== selectedA?.id).slice(0, 6);
  }, [searchB, tools, selectedA]);

  const resolvedComparisons = useMemo(() =>
    FEATURED_COMPARISONS.map(c => ({
      ...c,
      toolAData: findTool(tools, c.toolA),
      toolBData: findTool(tools, c.toolB),
    })).filter(c => c.toolAData && c.toolBData),
    [tools]
  );

  const handleCompare = () => {
    if (!selectedA || !selectedB) return;
    const slugA = selectedA.slug || selectedA.id;
    const slugB = selectedB.slug || selectedB.id;
    navigate(`${prefix}/comparatif/${slugA}-vs-${slugB}`);
  };

  // SEO
  useEffect(() => {
    const year = new Date().getFullYear();
    const title = t(
      `Comparatifs d'outils SaaS ${year} — Analyse indépendante | ToolTrim`,
      `SaaS Tool Comparisons ${year} — Independent Analysis | ToolTrim`
    );
    const desc = t(
      `Comparez les meilleurs outils SaaS : prix vérifiés, fonctionnalités, verdicts d'experts. Trouvez l'outil idéal pour votre usage.`,
      `Compare the best SaaS tools: verified pricing, features, expert verdicts. Find the ideal tool for your use case.`
    );
    const url = `${SEO_BASE}/${lang}/comparatifs`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/comparatifs`);
    setJsonLd("compares-index-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      inLanguage: lang,
    });
    return () => cleanupSeo(["compares-index-jsonld"]);
  }, [lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="bg-background min-h-screen">
      <PageHero
        breadcrumb={[{ label: t("Comparatifs", "Comparisons") }]}
        eyebrow={t("Analyse indépendante", "Independent analysis")}
        icon={<Scale className="h-3.5 w-3.5" />}
        title={
          <>
            {t("Comparatifs d'outils SaaS", "SaaS tool comparisons")}{" "}
            <span className="text-primary">{year}</span>
          </>
        }
        description={t(
          "Prix vérifiés, fonctionnalités comparées, verdicts tranchés. Chaque comparatif aide à choisir sans empiler des abonnements inutiles.",
          "Verified pricing, compared features, clear verdicts. Each comparison helps you choose without stacking unnecessary subscriptions."
        )}
      />

      <main className="px-4 md:px-8 pb-20 max-w-7xl mx-auto space-y-16">
        {/* Custom Comparator */}
        <section className="surface-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {t("Créer un comparatif personnalisé", "Create a custom comparison")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto] gap-4 items-start">
            {/* Tool A selector */}
            <div className="relative">
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-widest">
                {t("Outil 1", "Tool 1")}
              </label>
              {selectedA ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3">
                  <ToolLogo tool={selectedA} size={24} />
                  <span className="font-medium text-sm">{selectedA.name}</span>
                  <button onClick={() => { setSelectedA(null); setSearchA(""); }} className="ml-auto text-muted-foreground hover:text-foreground">
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchA}
                      onChange={e => setSearchA(e.target.value)}
                      onFocus={() => setFocusedInput("a")}
                      onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                      placeholder={t("Rechercher un outil…", "Search a tool…")}
                      className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {focusedInput === "a" && filteredToolsA.length > 0 && (
                    <div className="surface-card absolute top-full z-20 mt-1 w-full overflow-hidden shadow-lg">
                      {filteredToolsA.map(tool => (
                        <button
                          key={tool.id}
                          onMouseDown={() => { setSelectedA(tool); setSearchA(""); setFocusedInput(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors text-left"
                        >
                          <ToolLogo tool={tool} size={20} />
                          <span className="font-medium">{tool.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{getPriceLabel(tool, t)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* VS badge */}
            <div className="flex items-center justify-center pt-6">
              <span className="text-sm font-bold text-muted-foreground/60">VS</span>
            </div>

            {/* Tool B selector */}
            <div className="relative">
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-widest">
                {t("Outil 2", "Tool 2")}
              </label>
              {selectedB ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3">
                  <ToolLogo tool={selectedB} size={24} />
                  <span className="font-medium text-sm">{selectedB.name}</span>
                  <button onClick={() => { setSelectedB(null); setSearchB(""); }} className="ml-auto text-muted-foreground hover:text-foreground">
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchB}
                      onChange={e => setSearchB(e.target.value)}
                      onFocus={() => setFocusedInput("b")}
                      onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                      placeholder={t("Rechercher un outil…", "Search a tool…")}
                      className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {focusedInput === "b" && filteredToolsB.length > 0 && (
                    <div className="surface-card absolute top-full z-20 mt-1 w-full overflow-hidden shadow-lg">
                      {filteredToolsB.map(tool => (
                        <button
                          key={tool.id}
                          onMouseDown={() => { setSelectedB(tool); setSearchB(""); setFocusedInput(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors text-left"
                        >
                          <ToolLogo tool={tool} size={20} />
                          <span className="font-medium">{tool.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{getPriceLabel(tool, t)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Compare button */}
            <div className="flex items-end pt-6">
              <button
                onClick={handleCompare}
                disabled={!selectedA || !selectedB}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/85 transition-colors shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {t("Comparer", "Compare")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Featured comparisons grid */}
        <section>
          <h2 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-foreground mb-8">
            {t("Comparatifs populaires", "Popular Comparisons")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resolvedComparisons.map(c => {
              const a = c.toolAData!;
              const b = c.toolBData!;
              return (
                <Link
                  key={c.slugPair}
                  to={`${prefix}/comparatif/${c.slugPair}`}
                  className="surface-card-hover group p-5"
                >
                  {/* Logos side by side */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <ToolLogo tool={a} size={36} className="rounded-lg" />
                      <span className="text-xs font-bold text-foreground">{a.name}</span>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground/40 mt-[-16px]">VS</span>
                    <div className="flex flex-col items-center gap-1.5">
                      <ToolLogo tool={b} size={36} className="rounded-lg" />
                      <span className="text-xs font-bold text-foreground">{b.name}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="font-mono font-bold text-foreground">{getPriceLabel(a, t)}</span>
                    <span className="text-muted-foreground/50">{t("vs", "vs")}</span>
                    <span className="font-mono font-bold text-foreground">{getPriceLabel(b, t)}</span>
                  </div>

                  {/* Verdict snippet */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {t(
                      `${a.name} excelle si ${(a.verdict?.keepIf || [])[0] || "usage avancé"}. ${b.name} convient si ${(b.verdict?.keepIf || [])[0] || "budget limité"}.`,
                      `${a.name} excels if ${(a.verdict?.keepIf || [])[0] || "advanced use"}. ${b.name} fits if ${(b.verdict?.keepIf || [])[0] || "limited budget"}.`
                    )}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-1 text-primary text-xs font-bold group-hover:gap-2 transition-all">
                    {t("Voir le comparatif", "See comparison")} <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center pt-4">
          <p className="text-muted-foreground text-sm mb-4">
            {t(
              "Vous ne trouvez pas votre comparatif ? Utilisez le sélecteur ci-dessus pour comparer n'importe quels outils.",
              "Can't find your comparison? Use the selector above to compare any tools."
            )}
          </p>
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-secondary transition-colors"
          >
            {t("Analyser ma stack complète", "Analyze my full stack")} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ComparesIndexPage;
