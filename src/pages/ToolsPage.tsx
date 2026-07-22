import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, type ToolSummary } from "@/hooks/useSupabaseData";
import { ArrowDown, Search, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import FilterDropdown from "@/components/filters/FilterDropdown";
import { getExplorerHref } from "@/lib/toolExploration";

const TOOLS_PER_PAGE = 40;
const EDITORIAL_SELECTION = ["framer", "notion", "figma"];


type SortKey = "popular" | "name" | "price-asc" | "free-first";
type PriceFilter = "all" | "free" | "paid";

const TOOL_VERTICAL_FILTERS: Record<string, RegExp> = {
  ia: /\bia\b|\bai\b|gpt|llm|claude|chatgpt|midjourney|generation|generative|assistant|prompt/i,
  organisation: /organis|project|projet|task|todo|kanban|note|doc|wiki|calendar|agenda|workspace|collaboration|meeting/i,
  design: /design|figma|prototype|photo|image|visual|visuel|canvas|brand|branding|logo|video|vidéo|motion|3d|rendu|render|illustration|retouche|photoshop|lightroom|blender|sketch|canva|audio|podcast/i,
  automation: /automat|workflow|zapier|make|n8n|integration|api|nocode|no-code|trigger|connector/i,
  marketing: /marketing|seo|content|contenu|social|newsletter|email|campaign|ads|analytics|audience|growth/i,
  vente: /crm|sales|vente|client|lead|prospect|pipeline|ecommerce|shop|payment|checkout|stripe|booking/i,
  finance: /finance|account|compta|invoice|factur|billing|budget|expense|payroll|bank|tax/i,
  dev: /dev|code|github|git|deploy|hosting|database|data|backend|frontend|monitoring|security|securite/i,
};

const TOOL_VERTICAL_LABELS: Record<string, { fr: string; en: string }> = {
  ia: { fr: "IA", en: "AI" },
  organisation: { fr: "Organisation", en: "Organization" },
  design: { fr: "Design", en: "Design" },
  automation: { fr: "Automatisation", en: "Automation" },
  marketing: { fr: "Marketing", en: "Marketing" },
  vente: { fr: "Vente", en: "Sales" },
  finance: { fr: "Finance", en: "Finance" },
  dev: { fr: "Dev", en: "Dev" },
};

function isTrending(tool: ToolSummary) {
  return tool.prescription_quality === "ferme";
}
function isRecommended(tool: ToolSummary) {
  return tool.prescription_quality === "oui" || tool.prescription_quality === "ferme";
}

function normalizeToolText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getToolSearchText(tool: ToolSummary, categoryLabel = "") {
  return normalizeToolText([
    tool.name,
    tool.categoryId,
    categoryLabel,
    tool.shortDescription,
    tool.shortDescriptionEn,
    ...(tool.verticals || []),
    ...(tool.covers || []),
    ...(tool.functional_needs || []),
  ].join(" "));
}

function getVerticalFilterLabel(verticalId: string, lang: string) {
  const label = TOOL_VERTICAL_LABELS[verticalId];
  if (!label) return "";
  return lang === "en" ? label.en : label.fr;
}

const ToolsPage = () => {
  const location = useLocation();
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("q") || "";
  const selectedVertical = searchParams.get("vertical") || "";
  const [search, setSearch] = useState(urlSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("popular");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const title = lang === "fr"
      ? `Comparateur SaaS — ${tools.length} outils avec prix réels et alternatives | ToolTrim`
      : `SaaS Comparison — ${tools.length} tools with real pricing & alternatives | ToolTrim`;
    const desc = lang === "fr"
      ? `${tools.length} outils SaaS analysés indépendamment — prix vérifiés, alternatives visibles, verdicts honnêtes.`
      : `${tools.length} SaaS tools reviewed independently — verified pricing, visible alternatives, honest verdicts.`;
    const url = `https://tooltrim.com/${lang}/tools`;
    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}/tools`);
    setJsonLd("tools-jsonld", {
      "@context": "https://schema.org", "@type": "CollectionPage",
      name: title, description: desc, url,
      mainEntity: {
        "@type": "ItemList", numberOfItems: tools.length,
        itemListElement: tools.slice(0, 30).map((tool, i) => ({
          "@type": "ListItem", position: i + 1,
          name: tool.name, url: `https://tooltrim.com/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });
    return () => cleanupSeo(["tools-jsonld"]);
  }, [lang, tools]);

  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) =>
      tools.filter(t => t.categoryId === b.id).length - tools.filter(t => t.categoryId === a.id).length
    ), [categories, tools]
  );
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  // A short editorial opening, deliberately distinct from the exhaustive grid.
  // Three entries are enough to create hierarchy without duplicating a full row
  // of the catalogue above the catalogue itself.
  const noteworthy = useMemo(() => {
    const selected = EDITORIAL_SELECTION
      .map((slug) => tools.find((tool) => (tool.slug || tool.id) === slug))
      .filter((tool): tool is ToolSummary => Boolean(tool));
    const selectedIds = new Set(selected.map((tool) => tool.id));
    const fallback = tools.filter((tool) => isRecommended(tool) && !selectedIds.has(tool.id));
    return [...selected, ...fallback].slice(0, 3);
  }, [tools]);

  // All tools filtered + sorted
  const filtered = useMemo(() => {
    const q = normalizeToolText(search);
    const verticalPattern = selectedVertical ? TOOL_VERTICAL_FILTERS[selectedVertical] : null;
    const result = tools.filter(tool => {
      const category = categoryById.get(tool.categoryId);
      const categoryLabel = category
        ? `${stripLeadingEmoji(category.name, category.id)} ${stripLeadingEmoji(category.nameEn || category.name, category.id)}`
        : "";
      const searchText = getToolSearchText(tool, categoryLabel);
      const matchSearch = !search || searchText.includes(q);
      const matchVertical = !verticalPattern || verticalPattern.test(searchText);
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes(tool.categoryId);
      const matchPrice =
        priceFilter === "free" ? tool.defaultMonthlyPrice === 0 :
        priceFilter === "paid" ? tool.defaultMonthlyPrice > 0 :
        true;
      return matchSearch && matchVertical && matchCat && matchPrice;
    });

    result.sort((a, b) => {
      if (sort === "popular") {
        const scoreA = (isRecommended(a) ? 2 : 0) + (isTrending(a) ? 1 : 0);
        const scoreB = (isRecommended(b) ? 2 : 0) + (isTrending(b) ? 1 : 0);
        return scoreB - scoreA || (a.name ?? "").localeCompare(b.name ?? "");
      }
      if (sort === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sort === "price-asc") return (a.defaultMonthlyPrice || 0) - (b.defaultMonthlyPrice || 0);
      if (sort === "free-first") return (a.defaultMonthlyPrice === 0 ? 0 : 1) - (b.defaultMonthlyPrice === 0 ? 0 : 1);
      return 0;
    });
    return result;
  }, [categoryById, tools, search, selectedVertical, selectedCategories, priceFilter, sort]);

  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, selectedVertical, selectedCategories, priceFilter, sort]);

  useEffect(() => {
    setSearch(urlSearch);
    if (urlSearch) setIsSearchOpen(true);
  }, [urlSearch]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const getCatLabel = (cat: typeof categories[0]) =>
    t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)));

  const isFiltering = !!(search || selectedVertical || selectedCategories.length > 0 || priceFilter !== "all" || sort !== "popular");
  const isSearchExpanded = isSearchOpen || search.length > 0;
  const selectedVerticalLabel = getVerticalFilterLabel(selectedVertical, lang);
  const resultLabel = lang === "fr"
    ? `${filtered.length} outil${filtered.length > 1 ? "s" : ""}${selectedVerticalLabel ? ` · ${selectedVerticalLabel}` : ""}`
    : `Showing ${filtered.length} ${filtered.length === 1 ? "tool" : "tools"}${selectedVerticalLabel ? ` · ${selectedVerticalLabel}` : ""}`;

  useEffect(() => {
    if (isSearchExpanded) searchInputRef.current?.focus();
  }, [isSearchExpanded]);

  // Toggle the sticky toolbar's "stuck" border once its sentinel (placed
  // right above it) scrolls out of view — .asv2-content is the real scroll
  // container on desktop, not the window, so this must be the observer's
  // root rather than assuming viewport-relative IntersectionObserver
  // defaults still make sense.
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
  }, []);

  function clearUrlParam(paramName: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(paramName);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#10DDD6" } as React.CSSProperties}>

      {/* ══════════════ BODY ══════════════ */}
      <div className="tt-catalog-container">
        {/* ── Compact header: breadcrumb + title, no banner artwork — the
            filter bar right below is the real above-the-fold content. ── */}
        <div className="tt-catalog-compact-header">
          <Breadcrumb items={[{ label: t("Catalogue", "Catalog") }]} />
          <h1 className="tt-catalog-compact-title">{t("Trouver les bons outils.", "Find the right tools.")}</h1>
        </div>

        <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

        {/* ── Filter bar: quick pills for the primary facets ── */}
        <div className={`tt-catalog-toolbar${toolbarStuck ? " tt-catalog-toolbar--stuck" : ""}`}>
          <div className="tt-catalog-toolbar-filters">
            <FilterDropdown
              label={t("Catégorie", "Category") as string}
              allLabel={t("Toutes les catégories", "All categories") as string}
              options={sortedCategories.map((cat) => ({ id: cat.id, label: getCatLabel(cat) as string }))}
              value="all"
              onChange={() => {}}
              multi
              values={selectedCategories}
              onChangeMulti={setSelectedCategories}
              clearLabel={t("Effacer la sélection", "Clear selections") as string}
              searchPlaceholder={t("Rechercher une catégorie…", "Search categories…") as string}
            />

            <FilterDropdown
              label={t("Prix", "Tools") as string}
              allLabel={t("Tous les prix", "All tools") as string}
              options={[
                { id: "free", label: t("Gratuit seulement", "Free only") as string },
                { id: "paid", label: t("Payant seulement", "Paid only") as string },
              ]}
              value={priceFilter}
              onChange={(id) => setPriceFilter(id as PriceFilter)}
            />

            <div className={`tt-catalog-inline-search${isSearchExpanded ? " tt-catalog-inline-search--open" : ""}`}>
              {isSearchExpanded ? (
                <div className="tt-catalog-inline-search-field">
                  <Search size={17} aria-hidden />
                  <input
                    ref={searchInputRef}
                    id="tools-search-input"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => {
                      if (!search) setIsSearchOpen(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && !search) setIsSearchOpen(false);
                    }}
                    placeholder={t("Rechercher", "Search") as string}
                    className="tt-catalog-inline-search-input"
                    autoComplete="off"
                  />
                  {search && (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearch("");
                        setIsSearchOpen(false);
                        clearUrlParam("q");
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

            {selectedVerticalLabel && (
              <button
                type="button"
                className="tt-catalog-context-chip"
                onClick={() => clearUrlParam("vertical")}
                aria-label={t(`Retirer le filtre ${selectedVerticalLabel}`, `Remove ${selectedVerticalLabel} filter`) as string}
              >
                <span>{selectedVerticalLabel}</span>
                <X size={14} aria-hidden />
              </button>
            )}
          </div>

          <div className="tt-catalog-toolbar-meta">
            <span>{resultLabel}</span>
            <select
              className="tt-catalog-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label={t("Trier par", "Sort by") as string}
            >
              <option value="popular">{t("Populaire", "Latest")}</option>
              <option value="name">{t("A → Z", "A → Z")}</option>
              <option value="price-asc">{t("Prix croissant", "Price: low to high")}</option>
              <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
            </select>
          </div>
        </div>

        {/* ── Section 1: editorial opening (only when not filtering) ── */}
        {!isFiltering && noteworthy.length > 0 && (
          <section className="tt-editorial-opening" aria-labelledby="editorial-selection-title">
            <header className="tt-editorial-opening-header">
              <div className="tt-editorial-opening-heading">
                <h2 id="editorial-selection-title" className="tt-editorial-opening-title">
                  {t("Trois outils à découvrir", "Three tools to discover")}
                </h2>
                <p className="tt-editorial-opening-intro">
                  {t(
                    "Une sélection courte pour commencer par les options les plus solides.",
                    "A short selection of strong options to start with.",
                  )}
                </p>
              </div>
              <a className="tt-section-action tt-editorial-opening-link" href="#catalogue-complet">
                {t("Voir tout le catalogue", "View full catalogue")}
                <ArrowDown aria-hidden />
              </a>
            </header>

            <div className="tt-editorial-opening-grid">
              {noteworthy.map((tool) => {
                const catObj = categories.find(c => c.id === tool.categoryId);
                const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                return (
                  <div
                    key={tool.id}
                    className="tt-editorial-opening-item"
                  >
                    <ToolCardEditorial
                      tool={tool}
                      prefix={prefix}
                      t={t}
                      lang={lang}
                      categoryLabel={catLabel}
                      exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                      exploreState={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: t("Catalogue", "Catalog") }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Section 2: All apps ── */}
        <section
          id="catalogue-complet"
          className={!isFiltering && noteworthy.length > 0 ? "tt-catalog-results tt-catalog-results--after-editorial" : "tt-catalog-results"}
          aria-labelledby={filtered.length > 0 ? "catalogue-results-title" : undefined}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "hsl(var(--border))" }}>
              <Search className="mx-auto h-8 w-8" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
              <p className="mt-3 font-semibold" style={{ color: "hsl(var(--foreground))" }}>{t("Aucun outil trouvé", "No tools found")}</p>
              <button type="button" onClick={() => { setSearch(""); setSelectedCategories([]); setPriceFilter("all"); setSearchParams(new URLSearchParams(), { replace: true }); }}
                className="mt-4 rounded-full border px-4 py-1.5 text-sm font-semibold hover:text-primary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                {t("Réinitialiser", "Reset")}
              </button>
            </div>
          ) : (
            <>
              <header className="tt-catalog-results-header">
                <p className="tt-catalog-results-kicker">{t("Catalogue complet", "Full catalogue")}</p>
                <h2 id="catalogue-results-title" className="tt-catalog-results-title">
                  {t(`${filtered.length} outils à comparer`, `${filtered.length} tools to compare`)}
                </h2>
              </header>
              <div className="tc-grid">
                {visible.map(tool => {
                  const catObj = categories.find(c => c.id === tool.categoryId);
                  const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                  return (
                    <ToolCardEditorial
                      key={tool.id}
                      tool={tool}
                      prefix={prefix}
                      t={t}
                      lang={lang}
                      categoryLabel={catLabel}
                      exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                      exploreState={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: t("Catalogue", "Catalog") }}
                    />
                  );
                })}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}
                    className="rounded-full border px-8 py-3 text-sm font-semibold transition-colors hover:border-primary/30 hover:text-primary"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}>
                    {t(`Afficher plus — ${filtered.length - visibleCount} restants`, `Show more — ${filtered.length - visibleCount} remaining`)}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ToolsPage;
