import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, ArrowUpRight, Search, X } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import ToolLogo from "@/components/ToolLogo";
import { FEATURED_COMPARISONS } from "@/data/comparisons";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: ToolSummary[], idOrSlug: string): ToolSummary | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function compactToolPositioning(tool: ToolSummary, lang: "fr" | "en"): string {
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
  a: ToolSummary,
  b: ToolSummary,
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
const COMPARISONS_BATCH_SIZE = 12;

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
  const { tools, loading } = useToolSummaries();

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
  const [visibleCount, setVisibleCount] = useState(COMPARISONS_BATCH_SIZE);

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

  const visibleComparisons = useMemo(
    () => filteredComparisons.slice(0, visibleCount),
    [filteredComparisons, visibleCount],
  );
  const remainingComparisons = Math.max(filteredComparisons.length - visibleComparisons.length, 0);

  /* A new search, category or order should always restart from the shortest,
     most readable version of the listing. */
  useEffect(() => {
    setVisibleCount(COMPARISONS_BATCH_SIZE);
  }, [query, categoryFilter, sortBy]);

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

  {/* useToolSummaries() seeds `tools` synchronously from the bundled JSON
      fallback (see staticToolSummaries), so real data is already there even
      while `loading` is still true — only block on it when there's nothing
      to show yet. Gating on `loading` alone left this page stuck on the
      spinner forever during SSR, where the effect that flips it false never
      runs. */}
  if (loading && tools.length === 0) {
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

          <CatalogToolbar
            className="cix-toolbar"
            stuck={toolbarStuck}
            navLabel={t("Filtrer par catégorie", "Filter by category") as string}
            pills={COMPARE_CATEGORY_FILTERS.map((filter) => ({
              id: filter.id,
              label: (lang === "fr" ? filter.label : filter.labelEn) as string,
              active: categoryFilter === filter.id,
              onClick: () => setCategoryFilter(filter.id),
            }))}
            panelTitle={t("Filtres", "Filters") as string}
            moreLabel={t("Plus de filtres", "More filters") as string}
            sort={{
              value: sortBy,
              options: [
                { value: "featured", label: t("Sélection", "Featured") as string },
                { value: "name", label: t("A → Z", "A → Z") as string },
              ],
              onChange: (value) => setSortBy(value as CompareSortId),
              ariaLabel: t("Trier par", "Sort by") as string,
              title: t("Trier les comparatifs", "Sort comparisons") as string,
            }}
          />

          {/* Decision grid — each card keeps the duel and its two choices together. */}
          {filteredComparisons.length > 0 ? (
            <>
              <ul className="cix-grid" role="list">
                {visibleComparisons.map((c) => {
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

              {remainingComparisons > 0 && (
                <div className="cix-load-more">
                  <button
                    type="button"
                    className="cix-load-more-button"
                    onClick={() => setVisibleCount((count) => count + COMPARISONS_BATCH_SIZE)}
                  >
                    {t("Afficher plus de comparatifs", "Show more comparisons")}
                  </button>
                  <p className="cix-load-more-meta" aria-live="polite">
                    {t(
                      `${visibleComparisons.length} affichés · ${remainingComparisons} restants`,
                      `${visibleComparisons.length} shown · ${remainingComparisons} remaining`,
                    )}
                  </p>
                </div>
              )}
            </>
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
