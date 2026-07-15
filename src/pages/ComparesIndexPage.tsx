import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import FilterDropdown from "@/components/filters/FilterDropdown";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS } from "@/data/comparisons";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

/* ─── Category detection ─────────────────────────────────────────────────── */
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

/* ─── Popular suggestions ────────────────────────────────────────────────── */
const POPULAR_SUGGESTIONS = [
  { label: "Notion vs Airtable", slugPair: "notion-vs-airtable" },
  { label: "ChatGPT vs Claude",  slugPair: "chatgpt-vs-claude" },
  { label: "Zapier vs Make",     slugPair: "zapier-vs-make" },
  { label: "Figma vs Canva",     slugPair: "figma-vs-canva" },
  { label: "Linear vs Jira",     slugPair: "linear-vs-jira" },
];

/* The two tools' "choose this if…" conditions, shown one per tool on the card
   as a clear side-by-side split — replaces the old question + "best for" pair
   that repeated the exact same keepIf data twice. Returns null when a tool has
   no keepIf, so the card can fall back to a generic prompt. */
function getCardChoices(a: Tool, b: Tool, lang: "fr" | "en"): { a: string; b: string } | null {
  const keepA = lang === "fr"
    ? (a.verdict?.keepIf || [])[0]
    : (a.verdictEn?.keepIf || a.verdict?.keepIf || [])[0];
  const keepB = lang === "fr"
    ? (b.verdict?.keepIf || [])[0]
    : (b.verdictEn?.keepIf || b.verdict?.keepIf || [])[0];
  if (keepA && keepB) return { a: keepA, b: keepB };
  return null;
}
/* (getCardRisk removed — cards no longer surface "Risque" signals;
   risk content lives inside the comparison page, not the listing card.) */

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchExpanded = isSearchOpen || query.length > 0;
  useEffect(() => {
    if (isSearchExpanded) searchInputRef.current?.focus();
  }, [isSearchExpanded]);

  // Sticky toolbar "stuck" state — same sentinel + IntersectionObserver as the
  // other catalog pages, so the accent band shows when the filter bar pins.
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = toolbarSentinelRef.current;
    if (!sentinel) return;
    const scrollRoot = sentinel.closest(".asv2-content");
    const observer = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!entry.isIntersecting),
      { root: scrollRoot, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // Depend on `loading`: this page early-returns a spinner while loading, so
    // the sentinel isn't in the DOM on first mount. Re-run once content renders.
  }, [loading]);
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
    return result;
  }, [resolvedComparisons, query, categoryFilter]);

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
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#33D9FF" } as CSSProperties}>

      {/* ── Listing section ───────────────────────────────────────────────── */}
      <section className="cix-section">
        <div className="cix-container">

          {/* ── Compact header: breadcrumb + title, no banner artwork —
              same pattern as ToolsPage, replacing the tall gradient hero. ── */}
          <div className="tt-catalog-compact-header">
            <Breadcrumb items={[{ label: t("Comparatifs", "Comparisons") }]} />
            <h1 className="tt-catalog-compact-title">{t("Comparer sans empiler.", "Compare without stacking.")}</h1>
          </div>

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

          {/* ── Filter bar: same toolbar pattern as the Outils page ── */}
          <div className={`tt-catalog-toolbar${toolbarStuck ? " tt-catalog-toolbar--stuck" : ""}`}>
            <div className="tt-catalog-toolbar-filters">
              <FilterDropdown
                label={t("Catégorie", "Category") as string}
                allLabel={t("Toutes les catégories", "All categories") as string}
                options={COMPARE_CATEGORY_FILTERS.filter((f) => f.id !== "all").map((f) => ({
                  id: f.id,
                  label: (lang === "fr" ? f.label : f.labelEn) as string,
                }))}
                value={categoryFilter}
                onChange={(id) => setCategoryFilter(id as CompareCategoryId)}
              />

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
                        if (event.key === "Escape" && !query) setIsSearchOpen(false);
                      }}
                      placeholder={t("Filtrer par outil, ex. Notion, Figma…", "Filter by tool, e.g. Notion, Figma…") as string}
                      className="tt-catalog-inline-search-input"
                      autoComplete="off"
                      aria-label={t("Filtrer les comparatifs", "Filter comparisons") as string}
                    />
                    {query && (
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="tt-catalog-inline-search-clear"
                        aria-label={t("Effacer", "Clear") as string}
                      >
                        <X size={15} aria-hidden />
                      </button>
                    )}
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

            <div className="tt-catalog-toolbar-meta">
              <span>{filteredComparisons.length}&nbsp;{t("comparatifs", "comparisons")}</span>
            </div>
          </div>

          {/* Popular shortcuts */}
          <div className="cix-popular">
            <span className="cix-popular-label">{t("Populaires", "Popular")}</span>
            {POPULAR_SUGGESTIONS.map((s) => (
              <Link
                key={s.slugPair}
                to={`${prefix}/comparatif/${s.slugPair}`}
                className="cix-suggestion-chip"
              >
                {s.label}
              </Link>
            ))}
          </div>

          {/* Editorial list — one comparison per row, 4 zones each */}
          {filteredComparisons.length > 0 ? (
            <ul className="cix-list" role="list">
              {filteredComparisons.map((c) => {
                const a = c.toolAData!;
                const b = c.toolBData!;
                const choices = getCardChoices(a, b, lang);
                const catId = getSlugCategory(c.slugPair);
                const catLabel = COMPARE_CATEGORY_FILTERS.find((f) => f.id === catId);
                return (
                  <li key={c.slugPair} className="cix-list-item">
                    <Link
                      to={`${prefix}/comparatif/${c.slugPair}`}
                      className="cix-card"
                      aria-label={t(`Lire le comparatif ${a.name} vs ${b.name}`, `Read the ${a.name} vs ${b.name} comparison`)}
                    >
                      <div className="cix-card-logos" aria-hidden="true">
                        <span className="cix-card-logo"><ToolLogo tool={a} size={34} /></span>
                        <span className="cix-card-vs">vs</span>
                        <span className="cix-card-logo"><ToolLogo tool={b} size={34} /></span>
                      </div>
                      <div className="cix-card-body">
                        <h3 className="cix-card-title">{a.name} vs {b.name}</h3>
                        {choices ? (
                          <div className="cix-card-split">
                            <p className="cix-card-choice">
                              <span className="cix-card-choice-name">{a.name}</span>
                              <span className="cix-card-choice-when">{choices.a.toLowerCase()}</span>
                            </p>
                            <p className="cix-card-choice">
                              <span className="cix-card-choice-name">{b.name}</span>
                              <span className="cix-card-choice-when">{choices.b.toLowerCase()}</span>
                            </p>
                          </div>
                        ) : (
                          <p className="cix-card-choice-fallback">
                            {t("Lequel colle le mieux à ton usage réel ?", "Which one fits your real use case?")}
                          </p>
                        )}
                      </div>
                      {catLabel && catLabel.id !== "all" && (
                        <span className="cix-card-cat" aria-hidden="true">
                          {lang === "fr" ? catLabel.label : catLabel.labelEn}
                        </span>
                      )}
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
