import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, ArrowUpRight, Search, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS } from "@/data/comparisons";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function compactToolPositioning(tool: Tool, lang: "fr" | "en"): string {
  const raw = (lang === "fr" ? tool.shortDescription : tool.shortDescriptionEn)
    || tool.shortDescription
    || tool.name;
  return raw
    .trim()
    .replace(/[.!?]+$/, "")
    .replace(lang === "fr" ? /^(le|la|les|l’|l'|un|une)\s*/i : /^(the|a|an)\s*/i, "");
}

function getComparisonSummary(
  comparison: (typeof FEATURED_COMPARISONS)[number],
  a: Tool,
  b: Tool,
  lang: "fr" | "en",
): string {
  const authored = lang === "fr"
    ? comparison.summary
    : (comparison.summaryEn || comparison.summary);
  if (authored) return authored;

  return `${a.name} — ${compactToolPositioning(a, lang)}. ${b.name} — ${compactToolPositioning(b, lang)}.`;
}

/* ─── Category detection ─────────────────────────────────────────────────── */
type CompareCategoryId = "all" | "ia" | "productivite" | "design" | "crm" | "automatisation";
type CompareSortId = "featured" | "name";

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
  return "productivite";
}

const COMPARE_CATEGORY_FILTERS: { id: CompareCategoryId; label: string; labelEn: string }[] = [
  { id: "all",            label: "Tous",          labelEn: "All" },
  { id: "ia",             label: "IA",            labelEn: "AI" },
  { id: "productivite",   label: "Productivité",  labelEn: "Productivity" },
  { id: "design",         label: "Design",        labelEn: "Design" },
  { id: "automatisation", label: "Automatisation",labelEn: "Automation" },
  { id: "crm",            label: "CRM / Ventes",  labelEn: "CRM / Sales" },
];

/* (ToolInput + ToolInputProps removed — replaced by single search field) */

/* ─── Main component ─────────────────────────────────────────────────────── */
const ComparesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();

  /* Single search query + category filter — also accept ?q= and ?cat= URL params
     so deep-links from the navbar (e.g. "Alternative à Notion") pre-fill the field. */
  const [searchParams, setSearchParams] = useSearchParams();
  const isValidCat = (v: string | null): v is CompareCategoryId =>
    v === "all" || v === "ia" || v === "productivite" || v === "design" || v === "crm" || v === "automatisation";
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<CompareCategoryId>(
    () => (isValidCat(searchParams.get("cat")) ? (searchParams.get("cat") as CompareCategoryId) : "all"),
  );
  const [sortBy, setSortBy] = useState<CompareSortId>("featured");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchExpanded = isSearchOpen || query.length > 0;
  useEffect(() => {
    if (isSearchExpanded) searchInputRef.current?.focus();
  }, [isSearchExpanded]);

  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();
  /* Sync state changes back to the URL (replaceState so back-button isn't polluted) */
  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (categoryFilter !== "all") next.set("cat", categoryFilter);
    setSearchParams(next, { replace: true });
  }, [query, categoryFilter, setSearchParams]);

  /* Resolved comparison list */
  const resolvedComparisons = useMemo(() =>
    FEATURED_COMPARISONS.map(c => ({
      ...c,
      toolAData: findTool(tools, c.toolA),
      toolBData: findTool(tools, c.toolB),
    })).filter(c => c.toolAData && c.toolBData),
    [tools],
  );

  /* Filtered listing — single text query (matches either tool's name) + category */
  const filteredComparisons = useMemo(() => {
    let result = resolvedComparisons;
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(c =>
        (c.toolAData?.name ?? "").toLowerCase().includes(q) ||
        (c.toolBData?.name ?? "").toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter(c => getSlugCategory(c.slugPair) === categoryFilter);
    }
    if (sortBy === "name") {
      result = [...result].sort((a, b) =>
        `${a.toolAData?.name ?? ""} ${a.toolBData?.name ?? ""}`.localeCompare(
          `${b.toolAData?.name ?? ""} ${b.toolBData?.name ?? ""}`,
          lang,
        ),
      );
    }
    return result;
  }, [resolvedComparisons, query, categoryFilter, sortBy, lang]);

  /* If query has no matches, surface a few related comparisons */
  const relatedComparisons = useMemo(() => {
    if (filteredComparisons.length > 0 || !query.trim()) return [];
    return resolvedComparisons.slice(0, 4);
  }, [filteredComparisons.length, query, resolvedComparisons]);

  /* SEO */
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
      name: title, description: desc, url,
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      inLanguage: lang,
    });
    return () => cleanupSeo(["compares-index-jsonld"]);
  }, [lang, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-circle)", border: "3px solid var(--color-border)", borderTopColor: "var(--color-text)", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="tt-catalog-page min-h-screen">

      {/* ── Listing section ───────────────────────────────────────────────── */}
      <section className="cix-section">
        <div className="cix-container">

          <header className="tt-catalog-compact-header cix-hero">
            <h1 className="tt-catalog-compact-title cix-hero-title">{t("Comparatifs", "Comparisons")}</h1>
          </header>

          {/* Search-results feedback only — the default editorial title was a
              second H1-ish header the other catalog pages don't have; dropped
              it so the header is just the shared compact header. */}
          {query.trim() && (
            <div className="cix-listing-header">
              <p className="cix-listing-title">
                {t(`Résultats pour "${query.trim()}"`, `Results for "${query.trim()}"`)}
              </p>
            </div>
          )}

          <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

          <div className={`tt-catalog-toolbar cix-toolbar tt-sticky-toolbar${toolbarStuck ? " tt-sticky-toolbar--stuck" : ""}`}>
            <div className="cix-filter-group">
              <div className="tt-catalog-toolbar-filters">
                <nav className="tt-catalog-topic-nav" aria-label={t("Filtrer par catégorie", "Filter by category") as string}>
                  {COMPARE_CATEGORY_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`tt-catalog-topic${categoryFilter === filter.id ? " tt-catalog-topic--active" : ""}`}
                      onClick={() => setCategoryFilter(filter.id)}
                    >
                      {lang === "fr" ? filter.label : filter.labelEn}
                    </button>
                  ))}
                </nav>

                <div className={`tt-catalog-inline-search${isSearchExpanded ? " tt-catalog-inline-search--open" : ""}`}>
                  {isSearchExpanded ? (
                    <div className="tt-catalog-inline-search-field">
                      <Search size={17} aria-hidden />
                      <input
                        ref={searchInputRef}
                        id="cix-search-input"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onBlur={() => {
                          if (!query) setIsSearchOpen(false);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            setQuery("");
                            setIsSearchOpen(false);
                          }
                        }}
                        placeholder={t("Filtrer par outil, ex. Notion, Figma…", "Filter by tool, e.g. Notion, Figma…") as string}
                        className="tt-catalog-inline-search-input"
                        autoComplete="off"
                        aria-label={t("Filtrer les comparatifs", "Filter comparisons") as string}
                      />
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="tt-catalog-inline-search-clear"
                        aria-label={t("Fermer la recherche", "Close search") as string}
                      >
                        <X size={15} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="tt-catalog-inline-search-button"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      <Search size={17} aria-hidden />
                      <span>{t("Rechercher", "Search")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="tt-catalog-toolbar-meta">
              <label className="tt-catalog-sort-control" title={t("Trier les comparatifs", "Sort comparisons") as string}>
                <ArrowUpDown size={18} aria-hidden />
                <select
                  className="tt-catalog-sort-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as CompareSortId)}
                  aria-label={t("Trier par", "Sort by") as string}
                >
                  <option value="featured">{t("Sélection", "Featured")}</option>
                  <option value="name">{t("A → Z", "A → Z")}</option>
                </select>
              </label>
            </div>
          </div>

          {/* Decision grid — each card keeps the duel and its two choices together. */}
          {filteredComparisons.length > 0 ? (
            <ul className="cix-grid" role="list">
              {filteredComparisons.map((c) => {
                const a = c.toolAData!;
                const b = c.toolBData!;
                const catId = getSlugCategory(c.slugPair);
                const catLabel = COMPARE_CATEGORY_FILTERS.find((f) => f.id === catId);
                return (
                  <li key={c.slugPair} className="cix-grid-item">
                    <Link
                      to={`${prefix}/comparatif/${c.slugPair}`}
                      className="cix-card"
                      aria-label={t(`Lire le comparatif ${a.name} vs ${b.name}`, `Read the ${a.name} vs ${b.name} comparison`)}
                    >
                      <div className="cix-card-head">
                        <div className="cix-card-identity">
                          <div className="cix-card-logos" aria-hidden="true">
                            <span className="cix-card-logo"><ToolLogo tool={a} size={40} /></span>
                            <span className="cix-card-logo cix-card-logo--second"><ToolLogo tool={b} size={40} /></span>
                          </div>
                          <div>
                            {catLabel && catLabel.id !== "all" && (
                              <span className="cix-card-eyebrow">
                                {lang === "fr" ? catLabel.label : catLabel.labelEn}
                              </span>
                            )}
                            <h2 className="cix-card-title">{a.name} <span>vs</span> {b.name}</h2>
                            <p className="cix-card-summary">
                              {getComparisonSummary(c, a, b, lang)}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="cix-card-arrow" size={20} aria-hidden />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="cix-empty">
              <p className="cix-empty-title">
                {query.trim()
                  ? t(`Pas encore de comparatif sur "${query.trim()}".`, `No comparison on "${query.trim()}" yet.`)
                  : t("Aucun comparatif trouvé.", "No comparison found.")}
              </p>
              <p className="cix-empty-desc">
                {t("Voici les plus consultés en attendant :", "Most-read in the meantime:")}
              </p>
              <div className="cix-empty-chips">
                {(relatedComparisons.length > 0 ? relatedComparisons : resolvedComparisons.slice(0, 4)).map((c) => (
                  <Link
                    key={c.slugPair}
                    to={`${prefix}/comparatif/${c.slugPair}`}
                    className="cix-suggestion-chip"
                  >
                    {c.toolAData!.name} vs {c.toolBData!.name}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setQuery(""); setCategoryFilter("all"); }}
                className="cix-empty-reset"
              >
                {t("Voir tous les comparatifs", "See all comparisons")}
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default ComparesIndexPage;
