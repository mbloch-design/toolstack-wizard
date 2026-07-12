import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { Search, ChevronDown, X } from "lucide-react";
import FilterDropdown from "@/components/filters/FilterDropdown";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { hasGenuineFreeTier, isFreemiumPricing } from "@/lib/pricing";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import Breadcrumb from "@/components/Breadcrumb";

type SortKey = "name" | "price-asc" | "price-desc" | "free-first" | "savings";
type PriceFilter = "all" | "free" | "freemium" | "paid";
const PER_PAGE = 20;

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
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const category = categories.find((c) => c.slug === slug);
  const allCatTools = useMemo(
    () => category ? tools.filter((tool) => tool.categoryId === category.id) : [],
    [category, tools]
  );

  const [search, setSearch]               = useState("");
  const [sort, setSort]                   = useState<SortKey>("name");
  const [priceFilter, setPriceFilter]     = useState<PriceFilter>("all");
  const [profileFilter, setProfileFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter]       = useState<string[]>([]);
  const [savingsFilter, setSavingsFilter] = useState<string[]>([]);
  const [visibleCount, setVisibleCount]   = useState(PER_PAGE);
  const [isSearchOpen, setIsSearchOpen]   = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [toolbarStuck, setToolbarStuck]   = useState(false);
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
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const hasActiveFilters =
    priceFilter !== "all" || profileFilter.length > 0 || typeFilter.length > 0 || savingsFilter.length > 0 || !!search;

  const resetFilters = () => {
    setSearch(""); setPriceFilter("all");
    setProfileFilter([]); setTypeFilter([]); setSavingsFilter([]);
  };

  // SEO
  useEffect(() => {
    if (!category) return;
    const catName = stripLeadingEmoji(category.name, category.id);
    const catNameEn = stripLeadingEmoji(category.nameEn, catName);
    const title = lang === "fr"
      ? `Outils ${catName} — comparatif prix et alternatives ${year} | ToolTrim`
      : `${catNameEn} tools — pricing comparison & alternatives ${year} | ToolTrim`;
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
      const matchSearch =
        !search ||
        (tool.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (tool.shortDescription ?? "").toLowerCase().includes(search.toLowerCase());

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

      return matchSearch && matchPrice && matchProfile && matchType && matchSavings;
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
  }, [allCatTools, search, sort, priceFilter, profileFilter, typeFilter, savingsFilter]);

  useEffect(() => { setVisibleCount(PER_PAGE); }, [search, sort, priceFilter, profileFilter, typeFilter, savingsFilter]);

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

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#3DFF6E" } as CSSProperties}>

      {/* ── Body — same horizontal constraints used across the site
            (1280 max / 48px gutter). */}
      <div className="cat-body">
        {/* ── Compact header: breadcrumb + title, no banner/stats — same
            pattern as ToolsPage, replacing the old editorial cat-hero. ── */}
        <div className="tt-catalog-compact-header">
          <Breadcrumb items={[
            { label: t("Outils", "Tools"), href: `${prefix}/tools` },
            { label: displayName },
          ]} />
          <h1 className="tt-catalog-compact-title">{displayName}</h1>
        </div>

        <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

        {/* ══════════════ FILTER BAR — same pilule+popover pattern as
            Outils/Comparatifs/Stacks/Guides, replacing the old permanent
            sidebar so every listing page on the site behaves the same way. ══ */}
        <div className={`tt-catalog-toolbar${toolbarStuck ? " tt-catalog-toolbar--stuck" : ""}`}>
          <div className="tt-catalog-toolbar-filters">
            <FilterDropdown
              label={t("Profil", "Profile") as string}
              allLabel={t("Tous les profils", "All profiles") as string}
              options={PROFILE_OPTIONS.map((p) => ({ id: p.key, label: lang === "fr" ? p.labelFr : p.labelEn }))}
              value="all"
              onChange={() => {}}
              multi
              values={profileFilter}
              onChangeMulti={setProfileFilter}
              clearLabel={t("Effacer la sélection", "Clear selections") as string}
            />
            <FilterDropdown
              label={t("Type", "Type") as string}
              allLabel={t("Tous les types", "All types") as string}
              options={TYPE_OPTIONS.map((ty) => ({ id: ty.key, label: ty.short }))}
              value="all"
              onChange={() => {}}
              multi
              values={typeFilter}
              onChangeMulti={setTypeFilter}
              clearLabel={t("Effacer la sélection", "Clear selections") as string}
            />
            <FilterDropdown
              label={t("Tarif", "Pricing") as string}
              allLabel={t("Tous les tarifs", "All pricing") as string}
              options={[
                { id: "free", label: t("Gratuit", "Free") as string },
                { id: "freemium", label: "Freemium" },
                { id: "paid", label: t("Payant", "Paid") as string },
              ]}
              value={priceFilter}
              onChange={(id) => setPriceFilter(id as PriceFilter)}
            />
            <FilterDropdown
              label={t("Économies", "Savings") as string}
              allLabel={t("Toutes", "All") as string}
              options={SAVINGS_OPTIONS.map((s) => ({ id: s.key, label: lang === "fr" ? s.labelFr : s.labelEn }))}
              value="all"
              onChange={() => {}}
              multi
              values={savingsFilter}
              onChangeMulti={setSavingsFilter}
              clearLabel={t("Effacer la sélection", "Clear selections") as string}
            />

            <div className={`tt-catalog-inline-search${isSearchOpen || search ? " tt-catalog-inline-search--open" : ""}`}>
              {isSearchOpen || search ? (
                <div className="tt-catalog-inline-search-field">
                  <Search size={17} aria-hidden />
                  <input
                    ref={searchInputRef}
                    id="category-tool-search"
                    name="category-tool-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => { if (!search) setIsSearchOpen(false); }}
                    onKeyDown={(event) => { if (event.key === "Escape" && !search) setIsSearchOpen(false); }}
                    placeholder={t("Rechercher", "Search") as string}
                    className="tt-catalog-inline-search-input"
                    autoComplete="off"
                  />
                  {search && (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => { setSearch(""); setIsSearchOpen(false); }}
                      className="tt-catalog-inline-search-clear"
                      aria-label={t("Effacer", "Clear") as string}
                    >
                      <X size={15} aria-hidden />
                    </button>
                  )}
                </div>
              ) : (
                <button type="button" className="tt-catalog-inline-search-button" onClick={() => setIsSearchOpen(true)}>
                  <Search size={17} aria-hidden />
                  <span>{t("Rechercher", "Search")}</span>
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="tt-catalog-context-chip"
                onClick={resetFilters}
                aria-label={t("Réinitialiser les filtres", "Reset filters") as string}
              >
                <span>{t("Réinitialiser", "Reset")}</span>
                <X size={14} aria-hidden />
              </button>
            )}
          </div>

          <div className="tt-catalog-toolbar-meta">
            <span>{filtered.length} {t("résultats", "results")}</span>
            <select
              className="tt-catalog-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label={t("Trier par", "Sort by") as string}
            >
              <option value="name">{t("A → Z", "A → Z")}</option>
              <option value="price-asc">{t("Prix croissant", "Price: low to high")}</option>
              <option value="price-desc">{t("Prix décroissant", "Price: high to low")}</option>
              <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
              <option value="savings">{t("Économie max", "Max savings")}</option>
            </select>
          </div>
        </div>

        {/* ══════════════ TOOL LIST — same tc-grid + ToolCardEditorial as
            ToolsPage (image, name, inline price, hover-reveal description
            + CTA on the image) instead of the old editorial list rows. ══ */}
        <div className="min-w-0">
            <div className="tc-grid">
              {visible.map((tool) => (
                <ToolCardEditorial
                  key={tool.id}
                  tool={tool}
                  prefix={prefix}
                  t={t}
                  lang={lang}
                  categoryLabel={displayName}
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
