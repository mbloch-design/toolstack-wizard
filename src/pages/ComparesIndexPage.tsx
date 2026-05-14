import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { useEffect } from "react";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import EditorialHero from "@/components/EditorialHero";
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
  }, [lang, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen">
      <EditorialHero
        breadcrumb={[{ label: t("Comparatifs", "Comparisons") }]}
        eyebrow={t("Analyse indépendante", "Independent analysis")}
        title={
          <>
            {t("Comparer les outils.", "Compare the tools.")}<br />
            {t("Choisir sans empiler.", "Choose without stacking.")}
          </>
        }
        description={t(
          "Prix vérifiés, fonctionnalités comparées, verdicts tranchés. Chaque comparatif aide à choisir sans empiler des abonnements inutiles.",
          "Verified pricing, compared features, clear verdicts. Each comparison helps you choose without stacking unnecessary subscriptions."
        )}
        primaryCta={{ label: t("Créer un comparatif", "Create a comparison"), href: "#comparateur" }}
        meta={[
          { label: t("ANNÉE", "YEAR"), value: year },
          { label: t("PRIX VÉRIFIÉS", "VERIFIED PRICING"), value: "✓" },
          { label: t("VERDICTS", "VERDICTS"), value: "ToolTrim" },
        ]}
        rightModule={
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 14 }}>
              {t("Comparatifs populaires", "Popular comparisons")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { slugPair: "notion-vs-coda", a: "Notion", b: "Coda" },
                { slugPair: "zapier-vs-make", a: "Zapier", b: "Make" },
                { slugPair: "figma-vs-canva", a: "Figma", b: "Canva" },
                { slugPair: "linear-vs-jira", a: "Linear", b: "Jira" },
                { slugPair: "github-copilot-vs-cursor", a: "Copilot", b: "Cursor" },
              ].map(({ slugPair, a, b }) => (
                <Link
                  key={slugPair}
                  to={`${prefix}/comparatif/${slugPair}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#FFFFFF", border: "1px solid #DADAD4", borderRadius: 8,
                    fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
                    color: "#222222", textDecoration: "none",
                    transition: "border-color 160ms ease-out",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#222222"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#DADAD4"; }}
                >
                  <span>{a} <span style={{ color: "#ADADAD", fontWeight: 400 }}>vs</span> {b}</span>
                  <ArrowRight style={{ width: 12, height: 12, color: "#ADADAD", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <main className="px-4 md:px-8 pb-20 max-w-7xl mx-auto space-y-16">
        {/* Custom Comparator */}
        <section id="comparateur" style={{ background: "#FFFFFF", border: "1px solid #DADAD4", borderRadius: 8, padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Sparkles style={{ width: 16, height: 16, color: "#6F6F68" }} />
            <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "#222222" }}>
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
                      id="compare-tool-a"
                      name="compare-tool-a"
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
                      id="compare-tool-b"
                      name="compare-tool-b"
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
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 46, padding: "0 20px",
                  background: selectedA && selectedB ? "#222222" : "#DADAD4",
                  color: "#FFFFFF", border: "none", borderRadius: 8,
                  fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
                  cursor: selectedA && selectedB ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap", transition: "opacity 160ms ease-out",
                }}
                onMouseEnter={e => { if (selectedA && selectedB) (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                {t("Comparer", "Compare")} <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </section>

        {/* Featured comparisons grid */}
        <section>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
            <div>
              <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68", display: "block", marginBottom: 10 }}>
                {t("Comparatifs populaires", "Popular comparisons")}
              </span>
              <h2 style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.04em", color: "#222222", lineHeight: 1.05 }}>
                {t("Outils fréquemment comparés.", "Most compared tools.")}
              </h2>
            </div>
          </div>

          <div className="es-grid">
            {resolvedComparisons.map(c => {
              const a = c.toolAData!;
              const b = c.toolBData!;
              return (
                <Link
                  key={c.slugPair}
                  to={`${prefix}/comparatif/${c.slugPair}`}
                  className="ec-card"
                >
                  <span className="ec-label">{t("COMPARATIF", "COMPARISON")}</span>

                  {/* Logos + names */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #DADAD4", background: "#F8F8F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ToolLogo tool={a} size={26} className="rounded-md" />
                      </div>
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, color: "#222222" }}>{a.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, color: "#ADADAD", marginTop: -12, flexShrink: 0 }}>VS</span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #DADAD4", background: "#F8F8F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ToolLogo tool={b} size={26} className="rounded-md" />
                      </div>
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, color: "#222222" }}>{b.name}</span>
                    </div>
                  </div>

                  {/* Pricing row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "#222222" }}>{getPriceLabel(a, t)}</span>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "#ADADAD" }}>vs</span>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "#222222" }}>{getPriceLabel(b, t)}</span>
                  </div>

                  {/* Verdict snippet */}
                  <p className="ec-text" style={{ marginTop: 0, fontSize: 13, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {t(
                      `${a.name} excelle si ${(a.verdict?.keepIf || [])[0] || "usage avancé"}. ${b.name} convient si ${(b.verdict?.keepIf || [])[0] || "budget limité"}.`,
                      `${a.name} excels if ${(a.verdict?.keepIf || [])[0] || "advanced use"}. ${b.name} fits if ${(b.verdict?.keepIf || [])[0] || "limited budget"}.`
                    )}
                  </p>

                  <span className="ec-cta">
                    {t("Lire le comparatif", "Read comparison")}
                    <ArrowRight className="ec-cta-arrow" style={{ width: 13, height: 13 }} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ paddingTop: 16, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "#6F6F68", marginBottom: 16 }}>
            {t(
              "Vous ne trouvez pas votre comparatif ? Utilisez le sélecteur ci-dessus.",
              "Can't find your comparison? Use the selector above."
            )}
          </p>
          <Link
            to={`${prefix}/selector`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 44, padding: "0 20px",
              border: "1px solid #DADAD4", borderRadius: 8,
              fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
              color: "#222222", textDecoration: "none", background: "#FFFFFF",
              transition: "border-color 160ms ease-out",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#222222"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#DADAD4"; }}
          >
            {t("Analyser ma stack complète", "Analyze my full stack")} <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ComparesIndexPage;
