import { useLocation, useParams, Link } from "react-router-dom";
import { fitBrandedTitle } from "@/lib/seoTitle";
import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { ChevronDown, Filter, X } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { hasGenuineFreeTier, isFreemiumPricing } from "@/lib/pricing";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import { getExplorerHref } from "@/lib/toolExploration";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import Breadcrumb from "@/components/Breadcrumb";
import { GuideCardEditorial } from "@/components/GuideCardEditorial";
import ToolLogo from "@/components/ToolLogo";
import { TOOL_IMAGE_BLOCKLIST } from "@/lib/toolImageBlocklist";

type SortKey = "name" | "price-asc" | "price-desc" | "free-first" | "savings";
type PriceFilter = "all" | "free" | "freemium" | "paid";
const PER_PAGE = 20;
const REDIRECTED_TOOL_SLUGS = new Set(["anthropic", "motion-app", "anchor-spotify"]);

// ── Profile options (mapped from relevantFor values) ──
const PROFILE_OPTIONS = [
  { key: "consultant", labelFr: "Consultant", labelEn: "Consultant" },
  { key: "tech",       labelFr: "Tech / Dev",  labelEn: "Tech / Dev"  },
  { key: "designer",   labelFr: "Designer",    labelEn: "Designer"    },
  { key: "writer",     labelFr: "Rédacteur",   labelEn: "Writer"      },
  { key: "content-creator", labelFr: "Content", labelEn: "Content"   },
];

// ── Tool type options ──
const TYPE_OPTIONS = [
  { key: "ia",        labelFr: "Intelligence artificielle", labelEn: "Artificial intelligence", short: "IA" },
  { key: "metier",    labelFr: "Outil métier",  labelEn: "Core tool",   short: "Métier"  },
  { key: "gestion",   labelFr: "Gestion",       labelEn: "Management",  short: "Gestion" },
  { key: "satellite", labelFr: "Satellite",     labelEn: "Satellite",   short: "Satellite" },
  { key: "plugin",    labelFr: "Plugin / Extension", labelEn: "Plugin / Extension", short: "Plugin" },
];

// ── Savings potential options ──
const SAVINGS_OPTIONS = [
  { key: "freeAlt",     labelFr: "Alternative gratuite dispo",    labelEn: "Free alternative available" },
  { key: "substitutable", labelFr: "Outil remplaçable",           labelEn: "Replaceable tool"           },
  { key: "cheaperAlt",  labelFr: "Alternative moins chère",       labelEn: "Cheaper alternative exists" },
];

// (Local Breadcrumb component removed — uses the shared editorial
//  Breadcrumb from @/components/Breadcrumb instead, with ▪ publication
//  mark + JSON-LD schema.)

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
      ? tools.filter((tool) => tool.categoryId === category.id && !REDIRECTED_TOOL_SLUGS.has(tool.slug))
      : [],
    [category, tools]
  );

  // Landing-page shelves above the filtered grid: a quality-ranked pick,
  // category-relevant editorial posts, and a second slice of the catalog
  // for browsing before committing to filters — same spirit as the
  // homepage's own shelves, scoped to this category.
  const rankedCatTools = useMemo(() => allCatTools.filter((tool) => !TOOL_IMAGE_BLOCKLIST.has(tool.slug)).sort((a, b) => {
    const recommendationDelta = Number(b.prescription_quality === "ferme") - Number(a.prescription_quality === "ferme");
    if (recommendationDelta) return recommendationDelta;
    const mediaDelta = Number(Boolean(b.ogImageUrl)) - Number(Boolean(a.ogImageUrl));
    if (mediaDelta) return mediaDelta;
    return (a.name ?? "").localeCompare(b.name ?? "");
  }), [allCatTools]);
  const featuredCatTools = useMemo(() => rankedCatTools.slice(0, 4), [rankedCatTools]);
  const moreCatTools = useMemo(() => rankedCatTools.slice(4, 16), [rankedCatTools]);
  const categoryArticles = useMemo(
    () => (category ? posts.filter((post) => post.category === category.id || (post.tags || []).includes(category.id)).slice(0, 3) : []),
    [posts, category]
  );

  const [sort, setSort]                   = useState<SortKey>("name");
  const [priceFilter, setPriceFilter]     = useState<PriceFilter>("all");
  const [profileFilter, setProfileFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter]       = useState<string[]>([]);
  const [savingsFilter, setSavingsFilter] = useState<string[]>([]);
  const [visibleCount, setVisibleCount]   = useState(PER_PAGE);
  const [panelOpen, setPanelOpen]         = useState(false);
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();

  const year = useMemo(() => new Date().getFullYear(), []);

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const secondaryFilterCount = profileFilter.length + typeFilter.length + savingsFilter.length;
  const hasActiveFilters = priceFilter !== "all" || secondaryFilterCount > 0;
  // The panel also holds the sort: a non-default order counts as active.
  const panelBadgeCount = secondaryFilterCount + (sort !== "name" ? 1 : 0);

  const resetFilters = () => {
    setPriceFilter("all");
    setProfileFilter([]); setTypeFilter([]); setSavingsFilter([]);
    setSort("name");
  };

  // SEO
  useEffect(() => {
    if (!category) return;
    const catName = stripLeadingEmoji(category.name, category.id);
    const catNameEn = stripLeadingEmoji(category.nameEn, catName);
    const title = lang === "fr"
      ? fitBrandedTitle(`Outils ${catName} — comparatif prix et alternatives ${year}`)
      : fitBrandedTitle(`${catNameEn} tools — pricing comparison & alternatives ${year}`);
    const desc = lang === "fr"
      ? `On a analysé et classé les meilleurs outils ${catName} : prix vérifiés manuellement, alternatives gratuites identifiées, sans affiliation.`
      : `We ranked the best ${catNameEn} tools with manually verified pricing, free alternatives, and zero affiliate bias.`;
    const url = `${SEO_BASE}/${lang}/category/${category.slug}`;

    if (allCatTools.length === 0) setNoindex();

    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}/category/${category.slug}`);
    setJsonLd("cat-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title, description: desc, url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: allCatTools.length,
        itemListElement: allCatTools.slice(0, 20).map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.name,
          url: `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });
    return () => cleanupSeo(["cat-jsonld"]);
  }, [category, lang, allCatTools, year]);

  // Filter & sort
  const filtered = useMemo(() => {
    const result = allCatTools.filter((tool) => {
      const matchPrice =
        priceFilter === "all" ? true :
        priceFilter === "free" ? (tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid) :
        priceFilter === "freemium" ? isFreemiumPricing(tool.pricing) :
        priceFilter === "paid" ? (tool.defaultMonthlyPrice > 0 && !hasGenuineFreeTier(tool.pricing?.free)) : true;

      const matchProfile =
        profileFilter.length === 0 ||
        profileFilter.some((r) =>
          tool.relevantFor?.includes(r) ||
          tool.relevantFor?.includes("all")
        );

      const matchType =
        typeFilter.length === 0 || typeFilter.includes(tool.tool_type);

      const matchSavings =
        savingsFilter.length === 0 ||
        savingsFilter.every((s) => {
          if (s === "freeAlt")      return !!tool.freeAlternative;
          if (s === "substitutable") return tool.substitutable === true;
          if (s === "cheaperAlt")   return !!tool.betterAlternative;
          return true;
        });

      return matchPrice && matchProfile && matchType && matchSavings;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "name":      return (a.name ?? "").localeCompare(b.name ?? "");
        case "price-asc": return (a.defaultMonthlyPrice || 0) - (b.defaultMonthlyPrice || 0);
        case "price-desc":return (b.defaultMonthlyPrice || 0) - (a.defaultMonthlyPrice || 0);
        case "free-first":return (a.defaultMonthlyPrice === 0 ? 0 : 1) - (b.defaultMonthlyPrice === 0 ? 0 : 1);
        case "savings":   return (b.betterAlternative?.saving || 0) - (a.betterAlternative?.saving || 0);
        default: return 0;
      }
    });
    return result;
  }, [allCatTools, sort, priceFilter, profileFilter, typeFilter, savingsFilter]);

  useEffect(() => { setVisibleCount(PER_PAGE); }, [sort, priceFilter, profileFilter, typeFilter, savingsFilter]);

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Catégorie non trouvée.", "Category not found.")}</p>
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">
          {t("Retour au catalogue", "Back to catalog")}
        </Link>
      </div>
    );
  }

  const catName = stripLeadingEmoji(category.name, category.id);
  const catNameEn = stripLeadingEmoji(category.nameEn, catName);
  const visible   = filtered.slice(0, visibleCount);
  const hasMore   = visibleCount < filtered.length;
  const relatedCats = categories.filter((c) => c.id !== category.id).slice(0, 4);

  const displayName = t(catName, catNameEn) as string;
  const catIntro = lang === "fr"
    ? `On a analysé et classé les meilleurs outils ${catName} : prix vérifiés manuellement, alternatives gratuites identifiées, sans affiliation.`
    : `We ranked the best ${catNameEn} tools with manually verified pricing, free alternatives, and zero affiliate bias.`;

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#78EB2B" } as CSSProperties}>

      {/* ── Body — same horizontal constraints used across the site
            (1280 max / 48px gutter). */}
      <div className="cat-body">
        <Breadcrumb
          items={[
            { label: t("Outils", "Tools") as string, href: `${prefix}/tools` },
            { label: displayName },
          ]}
          includeSchema={false}
        />
        {/* ── Compact header: title + a category-specific lead, so the page
              reads as its own landing page rather than a bare directory
              listing (and carries unique, crawlable copy per category). ── */}
        <div className="tt-catalog-compact-header">
          <h1 className="tt-catalog-compact-title">{displayName}</h1>
          <p className="tt-catalog-compact-intro">{catIntro}</p>
        </div>

        <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

        {/* ══════════════ FILTER BAR — same pilule row + « Plus de filtres »
            popover + libellé de tri that ToolsPage uses, so every catalogue
            listing on the site behaves and reads the same way. ══ */}
        <div data-toolbar="catalog" className={`tt-catalog-toolbar tt-sticky-toolbar${toolbarStuck ? " tt-sticky-toolbar--stuck" : ""}`}>
          <nav className="tt-pillrow" aria-label={t("Filtrer par tarif", "Filter by pricing") as string}>
            <button
              type="button"
              className={`tt-pill${priceFilter === "all" ? " tt-pill--active" : ""}`}
              onClick={() => setPriceFilter("all")}
              aria-pressed={priceFilter === "all"}
            >
              {t("Tout", "All")}
            </button>
            <button
              type="button"
              className={`tt-pill${priceFilter === "free" ? " tt-pill--active" : ""}`}
              onClick={() => setPriceFilter(priceFilter === "free" ? "all" : "free")}
              aria-pressed={priceFilter === "free"}
            >
              {t("Gratuit", "Free")}
            </button>
            <button
              type="button"
              className={`tt-pill${priceFilter === "freemium" ? " tt-pill--active" : ""}`}
              onClick={() => setPriceFilter(priceFilter === "freemium" ? "all" : "freemium")}
              aria-pressed={priceFilter === "freemium"}
            >
              Freemium
            </button>
            <button
              type="button"
              className={`tt-pill${priceFilter === "paid" ? " tt-pill--active" : ""}`}
              onClick={() => setPriceFilter(priceFilter === "paid" ? "all" : "paid")}
              aria-pressed={priceFilter === "paid"}
            >
              {t("Payant", "Paid")}
            </button>
          </nav>

          <div className="tt-catalog-toolbar-tail">
            <Popover open={panelOpen} onOpenChange={setPanelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`tt-pill tt-pill--more${panelBadgeCount > 0 ? " tt-pill--active" : ""}`}
                  aria-label={t("Filtres et tri", "Filters and sort") as string}
                >
                  <Filter size={16} aria-hidden />
                  <span className="tt-pill-label">{t("Filtres", "Filters")}</span>
                  {panelBadgeCount > 0 && <span className="tt-pill-count">{panelBadgeCount}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="tt-filter-panel" align="end" sideOffset={8}>
                <div className="tt-filter-panel-head">
                  <strong>{t("Filtres", "Filters")}</strong>
                  <div className="tt-filter-panel-head-actions">
                    {(hasActiveFilters || panelBadgeCount > 0) && (
                      <button type="button" className="tt-filter-panel-reset" onClick={resetFilters}>
                        {t("Tout effacer", "Clear all")}
                      </button>
                    )}
                    <button
                      type="button"
                      className="tt-filter-panel-close"
                      onClick={() => setPanelOpen(false)}
                      aria-label={t("Fermer", "Close") as string}
                    >
                      <X size={18} aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="tt-filter-panel-body">
                  <section className="tt-filter-group">
                    <h3>{t("Trier par", "Sort by")}</h3>
                    <div className="tt-filter-segmented" role="radiogroup" aria-label={t("Trier par", "Sort by") as string}>
                      {([
                        { id: "name", label: "A → Z" },
                        { id: "price-asc", label: t("Prix croissant", "Price: low to high") },
                        { id: "price-desc", label: t("Prix décroissant", "Price: high to low") },
                        { id: "free-first", label: t("Gratuit d'abord", "Free first") },
                        { id: "savings", label: t("Économie max", "Max savings") },
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
                    <h3>{t("Profil", "Profile")}</h3>
                    <div className="tt-filter-facets">
                      {PROFILE_OPTIONS.map((p) => {
                        const checked = profileFilter.includes(p.key);
                        return (
                          <button
                            key={p.key}
                            type="button"
                            className={`tt-pill${checked ? " tt-pill--active" : ""}`}
                            onClick={() => setProfileFilter(toggleArr(profileFilter, p.key))}
                            aria-pressed={checked}
                          >
                            {lang === "fr" ? p.labelFr : p.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="tt-filter-group">
                    <h3>{t("Type", "Type")}</h3>
                    <div className="tt-filter-facets">
                      {TYPE_OPTIONS.map((ty) => {
                        const checked = typeFilter.includes(ty.key);
                        return (
                          <button
                            key={ty.key}
                            type="button"
                            className={`tt-pill${checked ? " tt-pill--active" : ""}`}
                            onClick={() => setTypeFilter(toggleArr(typeFilter, ty.key))}
                            aria-pressed={checked}
                          >
                            {ty.short}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="tt-filter-group">
                    <h3>{t("Économies", "Savings")}</h3>
                    <div className="tt-filter-facets">
                      {SAVINGS_OPTIONS.map((s) => {
                        const checked = savingsFilter.includes(s.key);
                        return (
                          <button
                            key={s.key}
                            type="button"
                            className={`tt-pill${checked ? " tt-pill--active" : ""}`}
                            onClick={() => setSavingsFilter(toggleArr(savingsFilter, s.key))}
                            aria-pressed={checked}
                          >
                            {lang === "fr" ? s.labelFr : s.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Outside the bar: its stuck-state animation leaves a transform that
            would trap this fixed scrim inside the bar's own box. */}
        {panelOpen && <div className="tt-filter-panel-backdrop" aria-hidden />}

        {/* ══════════════ Landing-page shelves — a quality pick, the category's
            own editorial coverage, and a second browsing slice — all above the
            filtered grid, same spirit as the homepage's own shelves. ══ */}
        <div className="home-v2">
          {featuredCatTools.length > 0 && (
            <section className="v2-catalog-section">
              <div className="v2-section-head">
                <div className="v2-section-heading-copy">
                  <h2 className="v2-section-title">{t("Sélection", "Featured")}</h2>
                  <p className="v2-section-description">
                    {t(
                      `Les outils ${displayName} qu'on recommande en premier, sur la base du prix et de la qualité vérifiée.`,
                      `The ${displayName} tools we'd recommend first, based on verified pricing and quality.`
                    )}
                  </p>
                </div>
              </div>
              <div className="tc-grid">
                {featuredCatTools.map((tool) => (
                  <ToolCardEditorial
                    key={tool.id}
                    tool={tool}
                    prefix={prefix}
                    t={t}
                    lang={lang}
                    categoryLabel={displayName}
                    exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                    exploreState={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: displayName }}
                  />
                ))}
              </div>
            </section>
          )}

          {categoryArticles.length > 0 && (
            <section className="v2-catalog-section">
              <div className="v2-section-head">
                <div className="v2-section-heading-copy">
                  <h2 className="v2-section-title">{t(`Articles ${displayName}`, `${displayName} articles`)}</h2>
                </div>
              </div>
              <div className="cat-article-grid">
                {categoryArticles.map((post) => (
                  <GuideCardEditorial key={post.id} post={post} prefix={prefix} ctaLabel={t("Lire →", "Read →") as string} />
                ))}
              </div>
            </section>
          )}

          {moreCatTools.length > 0 && (
            <section className="v2-catalog-section">
              <div className="v2-section-head">
                <div className="v2-section-heading-copy">
                  <h2 className="v2-section-title">{t("À explorer aussi", "Also worth a look")}</h2>
                  <p className="v2-section-description">
                    {t(
                      `D'autres outils ${displayName} à comparer avant de trancher.`,
                      `More ${displayName} options worth comparing before you commit.`
                    )}
                  </p>
                </div>
              </div>
              <div className="v2-new-grid">
                {moreCatTools.map((tool) => (
                  <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="v2-new-card">
                    <div className="v2-new-logo">
                      <ToolLogo tool={tool} size={40} />
                    </div>
                    <div className="v2-new-info">
                      <span className="v2-new-name">{tool.name}</span>
                      <span className="v2-new-cat">{displayName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ══════════════ TOOL LIST — same tc-grid + ToolCardEditorial as
            ToolsPage (image, name, inline price, hover-reveal description
            + CTA on the image) instead of the old editorial list rows. ══ */}
        <div className="min-w-0">
            <div className="home-v2" style={{ marginTop: "var(--v2-section-gap)" }}>
              <div className="v2-section-head" style={{ marginBottom: 16 }}>
                <div className="v2-section-heading-copy">
                  <h2 className="v2-section-title">{t("Tous les outils", "All tools")}</h2>
                  <p className="v2-section-description">
                    {t(
                      `Le catalogue ${displayName} complet, filtrable par prix, profil et type.`,
                      `The full ${displayName} catalog, filterable by price, profile, and type.`
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="tc-grid">
              {visible.map((tool) => (
                <ToolCardEditorial
                  key={tool.id}
                  tool={tool}
                  prefix={prefix}
                  t={t}
                  lang={lang}
                  categoryLabel={displayName}
                  exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                  exploreState={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: displayName }}
                />
              ))}
            </div>
            {/* Load more */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PER_PAGE)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                  style={{ fontFamily: "inherit" }}
                >
                  <ChevronDown className="h-4 w-4" />
                  {t(
                    `Afficher plus (${filtered.length - visibleCount} restants)`,
                    `Show more (${filtered.length - visibleCount} remaining)`
                  )}
                </button>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="mt-16 text-center">
                <p
                  className="text-sm"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit" }}
                >
                  {t("Aucun outil trouvé pour ces filtres.", "No tools match these filters.")}
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-3 text-xs text-primary underline underline-offset-2"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  {t("Réinitialiser les filtres", "Reset filters")}
                </button>
              </div>
            )}

            {/* Related categories — editorial list, no card grid */}
            {relatedCats.length > 0 && (
              <section className="cat-related">
                <span className="cat-related-eyebrow">{t("Catégories connexes", "Related categories")}</span>
                <ul className="cat-related-list" role="list">
                  {relatedCats.map((cat) => {
                    const count = tools.filter((tool) => tool.categoryId === cat.id).length;
                    const cName = stripLeadingEmoji(cat.name, cat.id);
                    return (
                      <li key={cat.id} className="cat-related-item">
                        <Link to={`${prefix}/category/${cat.slug}`} className="cat-related-row">
                          <span className="cat-related-name">{t(cName, cat.nameEn || cName)}</span>
                          <span className="cat-related-count">
                            {count} {t("outils", "tools")}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
