import { useLocation, useParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { REDIRECTED_TOOL_SLUGS } from "@/lib/redirectedTools";
import { useState, useEffect, useMemo, useRef } from "react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts, type ToolSummary } from "@/hooks/useSupabaseData";
import { Search } from "@/lib/icons";
import Page from "@/ds/Page/Page";
import Chip, { Chips, chipLinkAttrs } from "@/ds/Chip/Chip";
import Drawer, { DrawerTitle } from "@/ds/Drawer/Drawer";
import Segmented from "@/ds/Segmented/Segmented";
import Button, { TextButton, buttonAttrs } from "@/ds/Button/Button";
import MediaCard, { MediaCards } from "@/ds/MediaCard/MediaCard";
import { SheetSection } from "@/ds/ToolSheet/ToolSheet";
import { ActiveFilter, ActiveFilters, CatalogSection, CatalogTitle, EmptyState, FilterBar, FiltersButton, FiltersFoot, FiltersPanel, LinkIndex, LinkRow, LinkRows } from "@/ds/Catalog/Catalog";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, removeNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import Breadcrumb from "@/components/Breadcrumb";
import { GuideCardEditorial } from "@/components/GuideCardEditorial";
import { CATALOG_NEEDS } from "@/data/catalogNeeds";
import { activePlacements, type CatalogPlacement } from "@/data/catalogPlacements";
import { toolTagline } from "@/data/toolTaglines";
import { compareByDemand, formatFacetLabel, hasFreePlan, isPaid, knownPrice, toolFacets } from "@/lib/catalogFilters";
import { categorySeoDescription, categorySeoTitle, isCategoryIndexable, isCategoryLinkable } from "@/lib/categorySeo";

type SortKey = "popular" | "name" | "price-asc";
type PriceFilter = "all" | "free" | "paid";
type TopPick = { entry?: CatalogPlacement; tool: ToolSummary };

const PER_PAGE = 24;

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
  // The filters sheet hands the focus back to the button that opened it.
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
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
      <div className="tt-catalog-page" data-catalog="">
        <Page>
          <EmptyState icon={<Search />} title={t("Catégorie non trouvée", "Category not found") as string}
            action={<Link to={`${prefix}/tools`} {...buttonAttrs("secondary")}>{t("Voir tout le catalogue", "See the whole catalogue")}</Link>} />
        </Page>
      </div>
    );
  }

  const visible = gridTools.slice(0, visibleCount);
  const hasMore = visibleCount < gridTools.length;
  const needLabel = need ? (lang === "en" ? need.en : need.fr) : "";
  const relatedCats = categories
    .filter((c) => c.id !== category.id && !siblings.some((s) => s.id === c.id) && isCategoryLinkable(toolCountByCategory.get(c.id) || 0))
    .sort((a, b) => (toolCountByCategory.get(b.id) || 0) - (toolCountByCategory.get(a.id) || 0))
    .slice(0, 4);

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
      <MediaCard key={tool.id} lang={lang === "en" ? "en" : "fr"} tool={tool} dataTool={tool.slug || tool.id}
        image={<ToolCardImage tool={tool} logoSize={56} />}
        category={[eyebrow, entry?.sponsored ? t("Sponsorisé", "Sponsored") : ""].filter(Boolean).join(" · ") || undefined} reason={pitch || undefined}
        renderLink={(className, content) => <Link to={`${prefix}/tool/${tool.slug || tool.id}`} className={className}>{content}</Link>} />
    );
  }

  const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: "popular", label: t("Populaire", "Popular") },
    { value: "name", label: "A → Z" },
    { value: "price-asc", label: t("Prix croissant", "Price: low to high") },
  ];
  const priceOptions: Array<{ value: PriceFilter; label: string }> = [
    { value: "all", label: t("Tous", "All") },
    { value: "free", label: t("Plan gratuit", "Free plan") },
    { value: "paid", label: t("Payant", "Paid") },
  ];

  // The category on the system (12/11/2026), the same build as Tools: title and lead, sibling categories as link
  // chips on the filter bar, filters in the side sheet, top picks as media cards, then the full list and its index.
  return (
    <div className="tt-catalog-page" data-catalog="">
      <Page>
        <Breadcrumb
          items={[
            { label: t("Outils", "Tools") as string, href: `${prefix}/tools` },
            ...(need && siblings.length > 1 ? [{ label: needLabel, href: `${prefix}/tools?need=${need.id}` }] : []),
            { label: displayName },
          ]}
          includeSchema={false}
        />
        <CatalogTitle title={displayName} lead={lead || undefined} sentinelRef={toolbarSentinelRef} />

        {/* Real links: each sibling category is its own indexable page. */}
        <FilterBar stuck={toolbarStuck} railLabel={t(`Catégories ${needLabel}`, `${needLabel} categories`) as string}
          prevLabel={t("Catégories précédentes", "Previous categories") as string} nextLabel={t("Catégories suivantes", "Next categories") as string}
          rail={siblings.length > 1 ? siblings.map((sibling) => {
            const name = stripLeadingEmoji(sibling.name, sibling.id);
            return <Link key={sibling.id} to={`${prefix}/category/${sibling.slug}`} {...chipLinkAttrs(sibling.id === category.id)}>{t(name, stripLeadingEmoji(sibling.nameEn, name))}</Link>;
          }) : null}
          tail={<FiltersButton ref={filtersButtonRef} label={t("Filtres", "Filters") as string} count={activeFilterCount} open={panelOpen} onClick={() => setPanelOpen(true)} ariaLabel={t("Filtres et tri", "Filters and sort") as string} />} />

        <Drawer open={panelOpen} onClose={() => setPanelOpen(false)} closeLabel={t("Fermer", "Close") as string}
          onCloseAutoFocus={(event) => { event.preventDefault(); filtersButtonRef.current?.focus(); }}>
          <DrawerTitle>{t("Filtres", "Filters")}</DrawerTitle>
          <FiltersPanel>
            <SheetSection title={t("Trier par", "Sort by") as string}>
              <Segmented label={t("Trier par", "Sort by") as string} value={sort} options={sortOptions} onChange={setSort} />
            </SheetSection>
            <SheetSection title={t("Prix", "Price") as string}>
              <Segmented label={t("Prix", "Price") as string} value={priceFilter} options={priceOptions} onChange={setPriceFilter} />
            </SheetSection>
            {facetOptions.length > 0 && <SheetSection title={t("Usages", "Uses") as string}>
              <Chips label={t("Usages", "Uses") as string}>
                {facetOptions.map((facet) => {
                  const on = selectedTags.includes(facet.id);
                  return <Chip key={facet.id} pressed={on} check count={facet.count} disabled={!on && facet.count === 0} onClick={() => toggleTag(facet.id)}>{facet.label}</Chip>;
                })}
              </Chips>
            </SheetSection>}
            <FiltersFoot>
              <Button variant="primary" onClick={() => setPanelOpen(false)}>
                {filtered.length === 0 ? t("Aucun outil", "No tools") : t(`Voir ${filtered.length} outil${filtered.length > 1 ? "s" : ""}`, `Show ${filtered.length} tool${filtered.length > 1 ? "s" : ""}`)}
              </Button>
              {activeFilterCount > 0 && <TextButton tone="quiet" onClick={resetFilters}>{t("Tout effacer", "Clear all")}</TextButton>}
            </FiltersFoot>
          </FiltersPanel>
        </Drawer>

        {topPicks.length > 0 && (
          <CatalogSection id="cat-top-title" title={topPicks.some((item) => item.entry?.sponsored) ? t("À la une", "Featured") : t("Les plus recherchés", "Most searched")}>
            <MediaCards label={t("Les plus recherchés", "Most searched") as string}>{topPicks.map(renderPick)}</MediaCards>
          </CatalogSection>
        )}

        <section aria-labelledby={filtered.length > 0 ? "cat-results-title" : undefined} data-catalog-results="">
          {filtered.length === 0 ? (
            <EmptyState icon={<Search />} title={t("Aucun outil ne correspond", "No tool matches") as string}
              action={<Button onClick={resetFilters}>{t("Retirer les filtres", "Remove filters")}</Button>} />
          ) : (
            <CatalogSection id="cat-results-title" count={filtered.length}
              title={topPicks.length > 0 ? t(`Plus d’outils ${catName}`, `More ${catNameEn} tools`) : t(`Outils ${catName}`, `${catNameEn} tools`)}>
              {activeFilterCount > 0 && (
                <ActiveFilters label={t("Filtres actifs", "Active filters") as string}>
                  {priceFilter !== "all" && <ActiveFilter onRemove={() => setPriceFilter("all")} removeLabel={t("Retirer ce filtre", "Remove this filter") as string}>{priceFilter === "free" ? t("Plan gratuit", "Free plan") : t("Payant", "Paid")}</ActiveFilter>}
                  {selectedTags.map((tagId) => <ActiveFilter key={tagId} onRemove={() => toggleTag(tagId)} removeLabel={t("Retirer ce filtre", "Remove this filter") as string}>{formatFacetLabel(tagId, lang)}</ActiveFilter>)}
                  {sort !== "popular" && <ActiveFilter onRemove={() => setSort("popular")} removeLabel={t("Retirer ce tri", "Remove this sort") as string}>{sort === "name" ? "A → Z" : t("Prix croissant", "Price: low to high")}</ActiveFilter>}
                  {activeFilterCount > 1 && <TextButton tone="quiet" onClick={resetFilters}>{t("Tout effacer", "Clear all")}</TextButton>}
                </ActiveFilters>
              )}
              <MediaCards label={t(`Outils ${catName}`, `${catNameEn} tools`) as string}>
                {visible.map((tool) => (
                  <MediaCard key={tool.id} lang={lang === "en" ? "en" : "fr"} tool={tool} dataTool={tool.slug || tool.id}
                    image={<ToolCardImage tool={tool} logoSize={56} />}
                    reason={toolTagline(tool.slug || tool.id, lang) || undefined}
                    renderLink={(className, content) => <Link to={`${prefix}/tool/${tool.slug || tool.id}`} className={className}>{content}</Link>} />
                ))}
              </MediaCards>
              {hasMore && <div><Button onClick={() => setVisibleCount((count) => count + PER_PAGE)}>{t("Afficher plus", "Show more")}</Button></div>}
            </CatalogSection>
          )}
        </section>

        {categoryArticles.length > 0 && (
          <CatalogSection id="cat-guides-title" title={t("Guides", "Guides")}>
            <div className="cat-article-grid">
              {categoryArticles.map((post) => (
                <GuideCardEditorial key={post.id} post={post} prefix={prefix} ctaLabel={t("Lire", "Read") as string} />
              ))}
            </div>
          </CatalogSection>
        )}

        {/* Every tool of the category, linked: the grid only shows its first page, and crawlers do not press "Show more". */}
        {azTools.length > PER_PAGE && (
          <CatalogSection id="cat-az-title" title={t(`Tous les outils ${catName} de A à Z`, `All ${catNameEn} tools from A to Z`)}>
            <LinkIndex label={t(`Tous les outils ${catName}`, `All ${catNameEn} tools`) as string}>
              {azTools.map((tool) => <li key={tool.id}><Link to={`${prefix}/tool/${tool.slug || tool.id}`}>{tool.name}</Link></li>)}
            </LinkIndex>
          </CatalogSection>
        )}

        {relatedCats.length > 0 && (
          <CatalogSection id="cat-related-title" title={t("Autres catégories", "Other categories")}>
            <LinkRows>
              {relatedCats.map((cat) => {
                const name = stripLeadingEmoji(cat.name, cat.id);
                return <LinkRow key={cat.id} name={t(name, cat.nameEn || name) as string} note={`${toolCountByCategory.get(cat.id) || 0} ${t("outils", "tools")}`}
                  renderLink={(className, content) => <Link to={`${prefix}/category/${cat.slug}`} className={className}>{content}</Link>} />;
              })}
            </LinkRows>
          </CatalogSection>
        )}
      </Page>
    </div>
  );
};

export default CategoryPage;
