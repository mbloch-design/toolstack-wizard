import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { useEffect } from "react";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { Search } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS } from "@/data/comparisons";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function getPriceLabel(tool: Tool, t: (fr: string, en: string) => string): string {
  const v5 = tool.pricing_v5?.compare_price_monthly_eur;
  const price = v5 != null && v5 > 0 ? v5 : tool.defaultMonthlyPrice;
  if (price > 0) return `${price}€/${t("mois", "mo")}`;
  return t("Gratuit", "Free");
}

/* ─── Category detection from slugPair ───────────────────────────────────── */
type CompareCategoryId = "all" | "ia" | "productivite" | "design" | "crm" | "automatisation";

function getSlugCategory(slugPair: string): CompareCategoryId {
  if (
    ["chatgpt", "claude", "gemini", "copilot", "cursor", "midjourney", "deepseek",
     "firefly", "grammarly", "prowritingaid"].some(k => slugPair.includes(k))
  ) return "ia";
  if (
    ["notion", "asana", "clickup", "linear", "jira", "trello", "todoist",
     "basecamp", "wrike", "hive", "smartsuite", "obsidian", "coda"].some(k => slugPair.includes(k))
  ) return "productivite";
  if (
    ["figma", "canva", "visme", "prezi", "pitch", "webflow", "framer"].some(k => slugPair.includes(k))
  ) return "design";
  if (
    ["zapier", "make", "albato"].some(k => slugPair.includes(k))
  ) return "automatisation";
  if (
    ["pipedrive", "salesforce", "zoho", "close-vs", "vs-close", "capsule"].some(k => slugPair.includes(k))
  ) return "crm";
  return "productivite"; // default
}

const COMPARE_CATEGORY_FILTERS: { id: CompareCategoryId; label: string; labelEn: string }[] = [
  { id: "all",           label: "Tous",            labelEn: "All" },
  { id: "ia",            label: "IA",              labelEn: "AI" },
  { id: "productivite",  label: "Productivité",    labelEn: "Productivity" },
  { id: "design",        label: "Design",          labelEn: "Design" },
  { id: "automatisation",label: "Automatisation",  labelEn: "Automation" },
  { id: "crm",           label: "CRM / Ventes",    labelEn: "CRM / Sales" },
];

/* ─── Suggestions ────────────────────────────────────────────────────────── */
const SUGGESTIONS = [
  { label: "Notion vs Airtable", slugPair: "notion-vs-airtable" },
  { label: "ChatGPT vs Claude",  slugPair: "chatgpt-vs-claude" },
  { label: "Zapier vs Make",     slugPair: "zapier-vs-make" },
  { label: "Figma vs Canva",     slugPair: "figma-vs-canva" },
  { label: "Linear vs Jira",     slugPair: "linear-vs-jira" },
];

/* ─── Card description derived from tool data ────────────────────────────── */
function deriveCardDesc(a: Tool, b: Tool, lang: "fr" | "en"): string {
  const keepA = lang === "fr"
    ? (a.verdict?.keepIf || [])[0]
    : (a.verdictEn?.keepIf || a.verdict?.keepIf || [])[0];
  const keepB = lang === "fr"
    ? (b.verdict?.keepIf || [])[0]
    : (b.verdictEn?.keepIf || b.verdict?.keepIf || [])[0];
  if (keepA && keepB) {
    return lang === "fr"
      ? `${a.name} si ${keepA.toLowerCase()}. ${b.name} si ${keepB.toLowerCase()}.`
      : `${a.name} if ${keepA.toLowerCase()}. ${b.name} if ${keepB.toLowerCase()}.`;
  }
  const sd = lang === "fr"
    ? (a.shortDescription || "") + (b.shortDescription ? ` vs ${b.shortDescription}` : "")
    : (a.shortDescriptionEn || a.shortDescription || "");
  return sd || (lang === "fr"
    ? `Comparer ${a.name} et ${b.name} selon ton usage.`
    : `Compare ${a.name} and ${b.name} based on your use case.`);
}

/* ─── Main component ─────────────────────────────────────────────────────── */
const ComparesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();
  const navigate = useNavigate();

  /* ── State ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CompareCategoryId>("all");

  /* ── Custom comparator state ── */
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

  /* ── Resolved comparisons ── */
  const resolvedComparisons = useMemo(() =>
    FEATURED_COMPARISONS.map(c => ({
      ...c,
      toolAData: findTool(tools, c.toolA),
      toolBData: findTool(tools, c.toolB),
    })).filter(c => c.toolAData && c.toolBData),
    [tools],
  );

  /* ── Filtered comparisons (search + category) ── */
  const filteredComparisons = useMemo(() => {
    let result = resolvedComparisons;
    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(c => getSlugCategory(c.slugPair) === categoryFilter);
    }
    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(c => {
        const a = c.toolAData!;
        const b = c.toolBData!;
        return (
          a.name.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          c.slugPair.includes(q)
        );
      });
    }
    return result;
  }, [resolvedComparisons, searchQuery, categoryFilter]);

  const handleCompare = () => {
    if (!selectedA || !selectedB) return;
    const slugA = selectedA.slug || selectedA.id;
    const slugB = selectedB.slug || selectedB.id;
    navigate(`${prefix}/comparatif/${slugA}-vs-${slugB}`);
  };

  /* ── SEO ── */
  useEffect(() => {
    const year = new Date().getFullYear();
    const title = t(
      `Comparatifs d'outils SaaS ${year} — Analyse indépendante | ToolTrim`,
      `SaaS Tool Comparisons ${year} — Independent Analysis | ToolTrim`,
    );
    const desc = t(
      "Des comparatifs clairs pour comprendre les différences, les limites et le bon choix selon ton usage.",
      "Clear comparisons to understand differences, limitations and the right choice for your use case.",
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
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #DADAD4", borderTopColor: "#222222", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="cix-hero">
        <div className="cix-hero-inner">

          {/* Eyebrow */}
          <span className="cix-hero-eyebrow">{t("Comparatifs", "Comparisons")}</span>

          {/* H1 */}
          <h1 className="cix-hero-h1">
            {t("Comparer les outils.", "Compare the tools.")}<br />
            {t("Choisir sans empiler.", "Choose without stacking.")}
          </h1>

          {/* Description */}
          <p className="cix-hero-desc">
            {t(
              "Des comparatifs clairs pour comprendre les différences, les limites et le bon choix selon ton usage.",
              "Clear comparisons to understand differences, limitations and the right choice for your use case.",
            )}
          </p>

          {/* Search */}
          <div className="cix-search-wrap">
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute", right: 16, top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9A9A92", pointerEvents: "none",
                }}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); }}
                placeholder={t("Rechercher un comparatif : Notion, Airtable, Figma…", "Search a comparison: Notion, Airtable, Figma…")}
                className="cix-search-input"
              />
            </div>

            {/* Suggestion chips */}
            <div className="cix-suggestions">
              <span className="cix-suggestions-label">{t("Populaires", "Popular")}</span>
              {SUGGESTIONS.map(s => (
                <Link
                  key={s.slugPair}
                  to={`${prefix}/comparatif/${s.slugPair}`}
                  className="cix-suggestion-chip"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Featured comparisons grid ─────────────────────────────────────── */}
      <section className="cix-section">
        <div className="cix-container">

          {/* Section header + category filters */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              <p style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                fontWeight: 600, letterSpacing: "-0.04em",
                color: "#222222", lineHeight: 1.05,
              }}>
                {t("Comparatifs éditoriaux.", "Editorial comparisons.")}
              </p>
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: 13, color: "#9A9A92",
              }}>
                {filteredComparisons.length}&nbsp;{t("comparatifs", "comparisons")}
              </span>
            </div>

            {/* Category filter pills */}
            <div className="cix-filter-row">
              {COMPARE_CATEGORY_FILTERS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCategoryFilter(f.id)}
                  className={`gi-filter-pill${categoryFilter === f.id ? " gi-filter-pill--active" : ""}`}
                >
                  {lang === "fr" ? f.label : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filteredComparisons.length > 0 ? (
            <div className="cix-grid">
              {filteredComparisons.map(c => {
                const a = c.toolAData!;
                const b = c.toolBData!;
                const desc = deriveCardDesc(a, b, lang);
                const catId = getSlugCategory(c.slugPair);
                const catLabel = COMPARE_CATEGORY_FILTERS.find(f => f.id === catId);
                return (
                  <Link
                    key={c.slugPair}
                    to={`${prefix}/comparatif/${c.slugPair}`}
                    className="cix-card"
                  >
                    {/* Label */}
                    <p className="cix-card-label">
                      {t("COMPARATIF", "COMPARISON")}
                      {catLabel && catLabel.id !== "all" && (
                        <>
                          <span style={{ margin: "0 6px", color: "#DADAD4" }}>·</span>
                          {lang === "fr" ? catLabel.label : catLabel.labelEn}
                        </>
                      )}
                    </p>

                    {/* VS block */}
                    <div className="cix-card-vs">
                      <div className="cix-card-vs-tool">
                        <div className="cix-card-vs-logo">
                          <ToolLogo tool={a} size={18} />
                        </div>
                        <span className="cix-card-vs-name">{a.name}</span>
                      </div>
                      <span className="cix-card-vs-sep">VS</span>
                      <div className="cix-card-vs-tool">
                        <div className="cix-card-vs-logo">
                          <ToolLogo tool={b} size={18} />
                        </div>
                        <span className="cix-card-vs-name">{b.name}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="cix-card-title">{a.name} vs {b.name}</p>

                    {/* Description */}
                    <p className="cix-card-desc">{desc}</p>

                    {/* Pricing line */}
                    <p className="cix-card-pricing">
                      {getPriceLabel(a, t)}
                      <span style={{ margin: "0 6px", color: "#DADAD4" }}>vs</span>
                      {getPriceLabel(b, t)}
                    </p>

                    {/* CTA */}
                    <span className="cix-card-cta">
                      {t("Lire le comparatif", "Read comparison")}
                      <span className="cix-card-cta-arrow" aria-hidden> →</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div style={{ padding: "56px 0", textAlign: "center", borderTop: "1px solid #DADAD4" }}>
              <p style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                fontWeight: 600, letterSpacing: "-0.04em",
                color: "#222222", marginBottom: 8,
              }}>
                {t("Aucun comparatif trouvé.", "No comparison found.")}
              </p>
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: 15, color: "#6F6F68", marginBottom: 24,
              }}>
                {t(
                  "Essaie avec un autre outil ou explore tous les comparatifs.",
                  "Try with another tool or explore all comparisons.",
                )}
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                style={{
                  display: "inline-flex", alignItems: "center",
                  height: 40, padding: "0 18px",
                  border: "1px solid #222222", borderRadius: 8,
                  fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
                  color: "#222222", background: "transparent", cursor: "pointer",
                }}
              >
                {t("Voir tous les comparatifs", "See all comparisons")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Custom comparator ─────────────────────────────────────────────── */}
      <section id="comparateur" className="cix-section cix-section--alt">
        <div className="cix-container">
          <span style={{
            fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase" as const,
            color: "#6F6F68", display: "block", marginBottom: 10,
          }}>
            {t("Comparatif personnalisé", "Custom comparison")}
          </span>
          <p style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(1.25rem, 2.5vw, 2rem)",
            fontWeight: 600, letterSpacing: "-0.045em",
            color: "#222222", marginBottom: 28,
          }}>
            {t("Comparer deux outils au choix.", "Compare any two tools.")}
          </p>

          <div className="cix-comparator-grid">
            {/* Tool A selector */}
            <div className="cix-comparator-col">
              <label className="cix-comparator-label">{t("Outil 1", "Tool 1")}</label>
              {selectedA ? (
                <div className="cix-comparator-selected">
                  <ToolLogo tool={selectedA} size={22} />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500 }}>{selectedA.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedA(null); setSearchA(""); }}
                    className="cix-comparator-clear"
                    aria-label={t("Supprimer", "Remove")}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={searchA}
                    onChange={e => setSearchA(e.target.value)}
                    onFocus={() => setFocusedInput("a")}
                    onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                    placeholder={t("Rechercher un outil…", "Search a tool…")}
                    className="cix-comparator-input"
                  />
                  {focusedInput === "a" && filteredToolsA.length > 0 && (
                    <div className="cix-comparator-dropdown">
                      {filteredToolsA.map(tool => (
                        <button
                          key={tool.id}
                          type="button"
                          onMouseDown={() => { setSelectedA(tool); setSearchA(""); setFocusedInput(null); }}
                          className="cix-comparator-option"
                        >
                          <ToolLogo tool={tool} size={18} />
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500 }}>{tool.name}</span>
                          <span style={{ marginLeft: "auto", fontFamily: "var(--font-ui)", fontSize: 12, color: "#9A9A92" }}>
                            {getPriceLabel(tool, t)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* VS divider */}
            <div className="cix-comparator-vs">vs</div>

            {/* Tool B selector */}
            <div className="cix-comparator-col">
              <label className="cix-comparator-label">{t("Outil 2", "Tool 2")}</label>
              {selectedB ? (
                <div className="cix-comparator-selected">
                  <ToolLogo tool={selectedB} size={22} />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500 }}>{selectedB.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedB(null); setSearchB(""); }}
                    className="cix-comparator-clear"
                    aria-label={t("Supprimer", "Remove")}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={searchB}
                    onChange={e => setSearchB(e.target.value)}
                    onFocus={() => setFocusedInput("b")}
                    onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                    placeholder={t("Rechercher un outil…", "Search a tool…")}
                    className="cix-comparator-input"
                  />
                  {focusedInput === "b" && filteredToolsB.length > 0 && (
                    <div className="cix-comparator-dropdown">
                      {filteredToolsB.map(tool => (
                        <button
                          key={tool.id}
                          type="button"
                          onMouseDown={() => { setSelectedB(tool); setSearchB(""); setFocusedInput(null); }}
                          className="cix-comparator-option"
                        >
                          <ToolLogo tool={tool} size={18} />
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500 }}>{tool.name}</span>
                          <span style={{ marginLeft: "auto", fontFamily: "var(--font-ui)", fontSize: 12, color: "#9A9A92" }}>
                            {getPriceLabel(tool, t)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compare button */}
            <div className="cix-comparator-action">
              <button
                type="button"
                onClick={handleCompare}
                disabled={!selectedA || !selectedB}
                className="cix-comparator-btn"
                style={{
                  background: selectedA && selectedB ? "#222222" : "#DADAD4",
                  cursor: selectedA && selectedB ? "pointer" : "not-allowed",
                }}
              >
                {t("Comparer →", "Compare →")}
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ComparesIndexPage;
