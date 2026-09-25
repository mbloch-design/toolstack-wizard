import { useLocation, useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts, type ToolSummary } from "@/hooks/useSupabaseData";
import { Filter, Search, X } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, removeNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { getExplorerHref } from "@/lib/toolExploration";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import Breadcrumb from "@/components/Breadcrumb";
import { GuideCardEditorial } from "@/components/GuideCardEditorial";
import { CATALOG_NEEDS } from "@/data/catalogNeeds";
import { activePlacements, type CatalogPlacement } from "@/data/catalogPlacements";
import { toolTagline } from "@/data/toolTaglines";
import { compareByDemand, formatFacetLabel, hasFreePlan, isPaid, knownPrice, toolFacets } from "@/lib/catalogFilters";
import { categorySeoDescription, categorySeoTitle, isCategoryIndexable } from "@/lib/categorySeo";

type SortKey = "popular" | "name" | "price-asc";
type PriceFilter = "all" | "free" | "paid";
type TopPick = { entry?: CatalogPlacement; tool: ToolSummary };

const PER_PAGE = 24;
const REDIRECTED_TOOL_SLUGS = new Set(["anthropic", "motion-app", "anchor-spotify"]);

/**
 * Category landing page, the indexable counterpart of /tools?need=…
 *
 * Same logic as the catalogue: sibling categories of the same need as pills,
 * sort, price and uses in the Filters panel, the three most searched tools
 * first (the first slot can be a labelled placement), then the grid. Every
 * tool of the category is also linked in an A to Z index, so the prerendered
 * page is a real crawl path to each fiche, not only to its first page.
 */
const CategoryPage = () => {
  const location = useLocation();
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const category = categories.find((c) => c.slug === slug);
  const allCatTools = useMemo(
    () => category
      ? tools.filter((tool) => tool.categoryId === category.id && !REDIRECTED_TOOL_SLUGS.has(tool.slug || tool.id))
      : [],
    [category, tools],
  );
  const toolCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of tools) counts.set(tool.categoryId, (counts.get(tool.categoryId) || 0) + 1);
    return counts;
  }, [tools]);

  const need = category ? CATALOG_NEEDS.find((item) => item.categoryIds.includes(category.id)) : undefined;
  // Pills: the other categories of the same need, in the need's own order.
  const siblings = useMemo(() => (need
    ? need.categoryIds
      .map((id) => categories.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c) && (toolCountByCategory.get(c!.id) || 0) > 0)
    : []), [categories, need, toolCountByCategory]);

  const categoryArticles = useMemo(
    () => (category ? posts.filter((post) => post.category === category.id || (post.tags || []).includes(category.id)).slice(0, 3) : []),
    [posts, category],
  );

  const [sort, setSort] = useState<SortKey>("popular");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();
  const year = useMemo(() => new Date().getFullYear(), []);

  // A new category starts clean.
  useEffect(() => {
    setSort("popular");
    setPriceFilter("all");
    setSelectedTags([]);
    setVisibleCount(PER_PAGE);
  }, [slug]);

  const catName = category ? stripLeadingEmoji(category.name, category.id) : "";
  const catNameEn = category ? stripLeadingEmoji(category.nameEn, catName) : "";
  const displayName = t(catName, catNameEn) as string;
  const lead = category ? (lang === "en" ? category.descriptionEn || category.description : category.description) || "" : "";
  const indexable = isCategoryIndexable(allCatTools.length);

  // SEO: same title and description helpers as the prerender.
  useEffect(() => {
    if (!category) return;
    const name = lang === "fr" ? catName : catNameEn;
    const title = categorySeoTitle(name, lang, year);
    const desc = categorySeoDescription(name, lead, lang);
    const url = `${SEO_BASE}/${lang}/category/${category.slug}`;
    // Client navigation between categories must also lift a previous noindex.
    if (indexable) removeNoindex();
    else setNoindex();
    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}/category/${category.slug}`);
    setJsonLd("cat-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: allCatTools.length,
        itemListElement: [...allCatTools].sort(compareByDemand).slice(0, 20).map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.name,
          url: `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });
    return () => cleanupSeo(["cat-jsonld"]);
  }, [allCatTools, catName, catNameEn, category, indexable, lang, lead, year]);

  const matchesPrice = (tool: ToolSummary) =>
    priceFilter === "free" ? hasFreePlan(tool) : priceFilter === "paid" ? isPaid(tool) : true;

  // Uses of this category, counted as if ticked on top of the current filters.
  const facetOptions = useMemo(() => {
    const pool = allCatTools.filter(matchesPrice);
    const all = new Set<string>();
    const reachable = new Map<string, number>();
    for (const tool of pool) {
      const facets = toolFacets(tool);
      const kept = selectedTags.every((tag) => facets.has(tag));
      for (const facet of facets) {
        all.add(facet);
        if (kept) reachable.set(facet, (reachable.get(facet) || 0) + 1);
      }
    }
    return [...all]
      .map((id) => ({ id, count: reachable.get(id) || 0, label: formatFacetLabel(id, lang) }))
      .filter((facet) => facet.count >= 3 || selectedTags.includes(facet.id))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCatTools, lang, priceFilter, selectedTags]);

  const filtered = useMemo(() => {
    const result = allCatTools.filter((tool) => {
      const facets = toolFacets(tool);
      return matchesPrice(tool) && selectedTags.every((tag) => facets.has(tag));
    });
    result.sort((a, b) => {
      if (sort === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sort === "price-asc") {
        const pa = knownPrice(a), pb = knownPrice(b);
        if (pa === null || pb === null) return (pa === null ? 1 : 0) - (pb === null ? 1 : 0);
        return pa - pb;
      }
      return compareByDemand(a, b);
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCatTools, priceFilter, selectedTags, sort]);

  const isRefined = priceFilter !== "all" || selectedTags.length > 0 || sort !== "popular";
  const activeFilterCount = selectedTags.length + (priceFilter !== "all" ? 1 : 0) + (sort !== "popular" ? 1 : 0);

  // Top picks: a placement for this category first (labelled when paid), then
  // the most searched tools, whatever their cover (a blocked one shows the
  // logo panel). Only on the untouched page.
  const topPicks = useMemo<TopPick[]>(() => {
    if (!category || isRefined) return [];
    const placed = activePlacements(new Date().toISOString().slice(0, 10))
      .filter((entry) => entry.placement === category.id)
      .map((entry) => ({ entry, tool: allCatTools.find((tool) => (tool.slug || tool.id) === entry.slug) }))
      .filter((item): item is { entry: CatalogPlacement; tool: ToolSummary } => Boolean(item.tool));
    const taken = new Set(placed.map((item) => item.tool.id));
    const ranked = filtered
      .filter((tool) => !taken.has(tool.id))
      .map((tool) => ({ tool }));
    return [...placed, ...ranked].slice(0, 3);
  }, [allCatTools, category, filtered, isRefined]);

  const gridTools = useMemo(() => {
    const topIds = new Set(topPicks.map((item) => item.tool.id));
    return filtered.filter((tool) => !topIds.has(tool.id));
  }, [filtered, topPicks]);

  useEffect(() => { setVisibleCount(PER_PAGE); }, [sort, priceFilter, selectedTags]);

  const azTools = useMemo(
    () => [...allCatTools].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", lang)),
    [allCatTools, lang],
  );

  if (!category) {
    return (
      <div className="tt-catalog-page min-h-screen">
        <div className="cat-body tt-catalog-empty">
          <p>{t("Catégorie non trouvée", "Category not found")}</p>
          <Link to={`${prefix}/tools`} className="tt-pill">{t("Voir tout le catalogue", "See the whole catalogue")}</Link>
        </div>
      </div>
    );
  }

  const visible = gridTools.slice(0, visibleCount);
  const hasMore = visibleCount < gridTools.length;
  const needLabel = need ? (lang === "en" ? need.en : need.fr) : "";
  const relatedCats = categories
    .filter((c) => c.id !== category.id && !siblings.some((s) => s.id === c.id) && isCategoryIndexable(toolCountByCategory.get(c.id) || 0))
    .sort((a, b) => (toolCountByCategory.get(b.id) || 0) - (toolCountByCategory.get(a.id) || 0))
    .slice(0, 4);
  const exploreState = { explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: displayName };

  const resetFilters = () => {
    setPriceFilter("all");
    setSelectedTags([]);
    setSort("popular");
  };
  const toggleTag = (id: string) =>
    setSelectedTags((current) => (current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id]));

  function renderPick({ entry, tool }: TopPick) {
    const pitch = (lang === "en" ? entry?.pitchEn : entry?.pitchFr) || toolTagline(tool.slug || tool.id, lang);
    // No category eyebrow: the page already is the category.
    const eyebrow = (lang === "en" ? entry?.eyebrowEn : entry?.eyebrowFr) || "";
    return (
      <Link key={tool.id} to={`${prefix}/tool/${tool.slug || tool.id}`} className="tt-pepite">
        <ToolCardImage tool={tool} logoSize={56} className="tt-pepite-media" />
        {eyebrow || entry?.sponsored ? (
          <span className="tt-pepite-eyebrow">
            {eyebrow}
            {entry?.sponsored ? <span className="tt-sponsored">{t("Sponsorisé", "Sponsored")}</span> : null}
          </span>
        ) : null}
        <span className="tt-pepite-title">{tool.name}</span>
        {pitch ? <span className="tt-pepite-sub">{pitch}</span> : null}
      </Link>
    );
  }

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#78EB2B" } as CSSProperties}>
      <div className="cat-body">
        <Breadcrumb
          items={[
            { label: t("Outils", "Tools") as string, href: `${prefix}/tools` },
            ...(need && siblings.length > 1 ? [{ label: needLabel, href: `${prefix}/tools?need=${need.id}` }] : []),
            { label: displayName },
          ]}
          includeSchema={false}
        />
        {/* Title and the category's own lead: unique, crawlable copy. */}
        <div className="tt-catalog-compact-header">
          <h1 className="tt-catalog-compact-title">{displayName}</h1>
          {lead ? <p className="tt-catalog-compact-intro">{lead}</p> : null}
        </div>

        <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

        <div data-toolbar="catalog" className={`tt-catalog-toolbar tt-sticky-toolbar${toolbarStuck ? " tt-sticky-toolbar--stuck" : ""}`}>
          {/* Real links: each sibling category is its own indexable page. */}
          <nav className="tt-pillrow" aria-label={t(`Catégories ${needLabel}`, `${needLabel} categories`) as string}>
            {siblings.length > 1 && siblings.map((sibling) => {
              const active = sibling.id === category.id;
              const name = stripLeadingEmoji(sibling.name, sibling.id);
              return (
                <Link
                  key={sibling.id}
                  to={`${prefix}/category/${sibling.slug}`}
                  className={`tt-pill${active ? " tt-pill--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {t(name, stripLeadingEmoji(sibling.nameEn, name))}
                </Link>
              );
            })}
          </nav>

          <div className="tt-catalog-toolbar-tail">
            <Popover open={panelOpen} onOpenChange={setPanelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`tt-pill tt-pill--more${activeFilterCount > 0 ? " tt-pill--active" : ""}`}
                  aria-label={t("Filtres et tri", "Filters and sort") as string}
                >
                  <Filter size={16} aria-hidden />
                  <span className="tt-pill-label">{t("Filtres", "Filters")}</span>
                  {activeFilterCount > 0 && <span className="tt-pill-count">{activeFilterCount}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="tt-filter-panel" align="end" sideOffset={8}>
                <div className="tt-filter-panel-head">
                  <strong>{t("Filtres", "Filters")}</strong>
                  <div className="tt-filter-panel-head-actions">
                    {activeFilterCount > 0 && (
                      <button type="button" className="tt-filter-panel-reset" onClick={resetFilters}>
                        {t("Tout effacer", "Clear all")}
                      </button>
                    )}
                    <button type="button" className="tt-filter-panel-close" onClick={() => setPanelOpen(false)} aria-label={t("Fermer", "Close") as string}>
                      <X size={18} aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="tt-filter-panel-body">
                  <section className="tt-filter-group">
                    <h3>{t("Trier par", "Sort by")}</h3>
                    <div className="tt-filter-segmented" role="radiogroup" aria-label={t("Trier par", "Sort by") as string}>
                      {([
                        { id: "popular", label: t("Populaire", "Popular") },
                        { id: "name", label: "A → Z" },
                        { id: "price-asc", label: t("Prix croissant", "Price: low to high") },
                      ] as Array<{ id: SortKey; label: string }>).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={sort === option.id}
                          className={`tt-pill${sort === option.id ? " tt-pill--active" : ""}`}
                          onClick={() => setSort(option.id)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="tt-filter-group">
                    <h3>{t("Prix", "Price")}</h3>
                    <div className="tt-filter-segmented" role="radiogroup" aria-label={t("Prix", "Price") as string}>
                      {([
                        { id: "all", label: t("Tous", "All") },
                        { id: "free", label: t("Plan gratuit", "Free plan") },
                        { id: "paid", label: t("Payant", "Paid") },
                      ] as Array<{ id: PriceFilter; label: string }>).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={priceFilter === option.id}
                          className={`tt-pill${priceFilter === option.id ? " tt-pill--active" : ""}`}
                          onClick={() => setPriceFilter(option.id)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </section>
                  {facetOptions.length > 0 && (
                    <section className="tt-filter-group">
                      <h3>{t("Usages", "Uses")}</h3>
                      <div className="tt-filter-facets">
                        {facetOptions.map((facet) => {
                          const checked = selectedTags.includes(facet.id);
                          return (
                            <button
                              key={facet.id}
                              type="button"
                              className={`tt-pill${checked ? " tt-pill--active" : ""}`}
                              onClick={() => toggleTag(facet.id)}
                              aria-pressed={checked}
                              disabled={!checked && facet.count === 0}
                            >
                              {facet.label}
                              <span className="tt-pill-count">{facet.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Outside the bar: its stuck-state animation leaves a transform that
            would trap this fixed scrim inside the bar's own box. */}
        {panelOpen && <div className="tt-filter-panel-backdrop" aria-hidden />}

        {topPicks.length > 0 && (
          <section className="tt-spotlight" aria-labelledby="cat-top-title">
            <h2 id="cat-top-title" className="tt-section-title">
              {/* "Most searched" would misdescribe a paid slot. */}
              {topPicks.some((item) => item.entry?.sponsored)
                ? t("À la une", "Featured")
                : t("Les plus recherchés", "Most searched")}
            </h2>
            <div className="tt-pepites">{topPicks.map(renderPick)}</div>
          </section>
        )}

        <section className="tt-catalog-results" aria-labelledby="cat-results-title">
          {filtered.length === 0 ? (
            <div className="tt-catalog-empty">
              <Search size={28} aria-hidden />
              <p>{t("Aucun outil ne correspond", "No tool matches")}</p>
              <button type="button" className="tt-pill" onClick={resetFilters}>
                {t("Retirer les filtres", "Remove filters")}
              </button>
            </div>
          ) : (
            <>
              <header className="tt-catalog-results-header">
                <p className="tt-catalog-results-kicker">
                  {t(`${filtered.length} outil${filtered.length > 1 ? "s" : ""}`, `${filtered.length} tool${filtered.length > 1 ? "s" : ""}`)}
                </p>
                <h2 id="cat-results-title" className="tt-catalog-results-title">
                  {topPicks.length > 0
                    ? t(`Plus d'outils ${catName}`, `More ${catNameEn} tools`)
                    : t(`Outils ${catName}`, `${catNameEn} tools`)}
                </h2>
                {activeFilterCount > 0 && (
                  <div className="tt-active-filters" aria-label={t("Filtres actifs", "Active filters") as string}>
                    {priceFilter !== "all" && (
                      <button type="button" className="tt-active-chip" onClick={() => setPriceFilter("all")}>
                        {priceFilter === "free" ? t("Plan gratuit", "Free plan") : t("Payant", "Paid")}
                        <X size={14} aria-hidden />
                      </button>
                    )}
                    {selectedTags.map((tagId) => (
                      <button key={tagId} type="button" className="tt-active-chip" onClick={() => toggleTag(tagId)}>
                        {formatFacetLabel(tagId, lang)}
                        <X size={14} aria-hidden />
                      </button>
                    ))}
                    {sort !== "popular" && (
                      <button type="button" className="tt-active-chip" onClick={() => setSort("popular")}>
                        {sort === "name" ? "A → Z" : t("Prix croissant", "Price: low to high")}
                        <X size={14} aria-hidden />
                      </button>
                    )}
                    {activeFilterCount > 1 && (
                      <button type="button" className="tt-active-clear" onClick={resetFilters}>
                        {t("Tout effacer", "Clear all")}
                      </button>
                    )}
                  </div>
                )}
              </header>
              <div className="tc-grid">
                {visible.map((tool) => (
                  <ToolCardEditorial
                    key={tool.id}
                    tool={tool}
                    prefix={prefix}
                    t={t}
                    lang={lang}
                    // What the tool does; the category is the page itself.
                    categoryLabel={toolTagline(tool.slug || tool.id, lang) || undefined}
                    showPrice={false}
                    identityLogoSize={56}
                    exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                    exploreState={exploreState}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="tt-catalog-more">
                  <button type="button" className="tt-pill" onClick={() => setVisibleCount((count) => count + PER_PAGE)}>
                    {t("Afficher plus", "Show more")}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {categoryArticles.length > 0 && (
          <section className="cat-guides" aria-labelledby="cat-guides-title">
            <h2 id="cat-guides-title" className="tt-section-title">{t("Guides", "Guides")}</h2>
            <div className="cat-article-grid">
              {categoryArticles.map((post) => (
                <GuideCardEditorial key={post.id} post={post} prefix={prefix} ctaLabel={t("Lire", "Read") as string} />
              ))}
            </div>
          </section>
        )}

        {/* Every tool of the category, linked: the grid only shows its first
            page, and crawlers do not press "Show more". */}
        {azTools.length > PER_PAGE && (
          <section className="cat-az" aria-labelledby="cat-az-title">
            <h2 id="cat-az-title" className="cat-az-title">
              {t(`Tous les outils ${catName} de A à Z`, `All ${catNameEn} tools from A to Z`)}
            </h2>
            <ul className="cat-az-list">
              {azTools.map((tool) => (
                <li key={tool.id}>
                  <Link to={`${prefix}/tool/${tool.slug || tool.id}`}>{tool.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {relatedCats.length > 0 && (
          <section className="cat-related">
            <span className="cat-related-eyebrow">{t("Autres catégories", "Other categories")}</span>
            <ul className="cat-related-list" role="list">
              {relatedCats.map((cat) => {
                const name = stripLeadingEmoji(cat.name, cat.id);
                return (
                  <li key={cat.id} className="cat-related-item">
                    <Link to={`${prefix}/category/${cat.slug}`} className="cat-related-row">
                      <span className="cat-related-name">{t(name, cat.nameEn || name)}</span>
                      <span className="cat-related-count">{toolCountByCategory.get(cat.id) || 0} {t("outils", "tools")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
