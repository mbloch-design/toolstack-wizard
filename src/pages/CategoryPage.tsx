import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Search, ExternalLink, ChevronDown, X, TrendingDown, Sparkles } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getToolDomain } from "@/lib/toolUtils";
import { asText, stripLeadingEmoji } from "@/lib/text";
import { ToolRowEditorial } from "@/components/ToolRowEditorial";
import Breadcrumb from "@/components/Breadcrumb";
import type { PricingV5, ToolType } from "@/data/types";

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
        priceFilter === "freemium" ? (tool.pricing?.free && tool.pricing?.paid) :
        priceFilter === "paid" ? (tool.defaultMonthlyPrice > 0 && !tool.pricing?.free) : true;

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

  const Icon = getCategoryIcon(category.id);
  const catName = stripLeadingEmoji(category.name, category.id);
  const catNameEn = stripLeadingEmoji(category.nameEn, catName);
  const freeCount = allCatTools.filter((tool) => tool.defaultMonthlyPrice === 0).length;
  const paidTools = allCatTools.filter((tool) => tool.defaultMonthlyPrice > 0);
  const avgPrice  = paidTools.reduce((s, tool) => s + tool.defaultMonthlyPrice, 0) / (paidTools.length || 1);
  const visible   = filtered.slice(0, visibleCount);
  const hasMore   = visibleCount < filtered.length;
  const relatedCats = categories.filter((c) => c.id !== category.id).slice(0, 4);

  // ── Sidebar chip helper — same visual language as ToolsPage sidebar items ──
  const FilterChip = ({
    active, onClick, children,
  }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-left transition-colors duration-150"
      style={{
        fontSize: "0.8125rem",
        fontWeight: active ? 500 : 400,
        background: active ? "hsl(var(--primary) / 0.08)" : "transparent",
        color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "hsl(var(--secondary))"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))"; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; } }}
    >
      {children}
    </button>
  );

  const displayName = t(catName, catNameEn) as string;
  const catDesc = category.description
    ? t(category.description, (category as any).descriptionEn || category.description) as string
    : t(`Prix vérifiés, alternatives honnêtes — sans commission, sans biais.`, `Verified pricing, honest alternatives — no commissions, no bias.`) as string;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

      {/* ══════════════ HERO — editorial, aligned with cp-hero pattern ══════════════ */}
      <section className="cat-hero">
        <div className="cat-hero-inner">
          <Breadcrumb items={[
            { label: t("Outils", "Tools"), href: `${prefix}/tools` },
            { label: displayName },
          ]} />

          <span className="cat-hero-eyebrow">
            {allCatTools.length} {t("outils analysés", "tools analyzed")}
          </span>
          <h1 className="cat-hero-title">{displayName}</h1>
          {catDesc && <p className="cat-hero-desc">{catDesc}</p>}

          {/* Stats line — editorial, monospace */}
          {(freeCount > 0 || avgPrice > 0) && (
            <p className="cat-hero-stats">
              {freeCount > 0 && (
                <span>{freeCount} {t("gratuits ou freemium", "free or freemium")}</span>
              )}
              {freeCount > 0 && avgPrice > 0 && <span className="cat-hero-stats-sep" aria-hidden="true">·</span>}
              {avgPrice > 0 && (
                <span>~{Math.round(avgPrice)}€ {t("prix moyen", "avg price")}</span>
              )}
            </p>
          )}
        </div>
      </section>

      {/* ── Body — same horizontal constraints as the hero (1280 max / 48px gutter)
            so the sidebar + tool list align vertically with the H1 above. */}
      <div className="cat-body">
        <div className="flex items-start gap-8">

          {/* ══════════════ SIDEBAR ══════════════ */}
          <aside className="hidden lg:flex w-[200px] shrink-0 flex-col gap-5 sticky top-6">

            {/* Search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground) / 0.45)" }}
              />
              <input
                id="category-tool-search"
                name="category-tool-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher…", "Search…")}
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-150"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* ── Profil utilisateur ── */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("Profil", "Profile")}
              </p>
              <div className="flex flex-col gap-0.5">
                {PROFILE_OPTIONS.map((p) => (
                  <FilterChip
                    key={p.key}
                    active={profileFilter.includes(p.key)}
                    onClick={() => setProfileFilter((f) => toggleArr(f, p.key))}
                  >
                    {lang === "fr" ? p.labelFr : p.labelEn}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* ── Type d'outil ── */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("Type", "Type")}
              </p>
              <div className="flex flex-col gap-0.5">
                {TYPE_OPTIONS.map((type) => (
                  <FilterChip
                    key={type.key}
                    active={typeFilter.includes(type.key)}
                    onClick={() => setTypeFilter((f) => toggleArr(f, type.key))}
                  >
                    {type.short}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* ── Tarification ── */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("Tarif", "Pricing")}
              </p>
              <div className="flex flex-col gap-0.5">
                {(["all", "free", "freemium", "paid"] as PriceFilter[]).map((f) => (
                  <FilterChip
                    key={f}
                    active={priceFilter === f}
                    onClick={() => setPriceFilter(f)}
                  >
                    {f === "all" ? t("Tous", "All") :
                     f === "free" ? t("Gratuit", "Free") :
                     f === "freemium" ? "Freemium" : t("Payant", "Paid")}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* ── Potentiel d'économie ── */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("Économies", "Savings")}
              </p>
              <div className="flex flex-col gap-0.5">
                {SAVINGS_OPTIONS.map((s) => (
                  <FilterChip
                    key={s.key}
                    active={savingsFilter.includes(s.key)}
                    onClick={() => setSavingsFilter((f) => toggleArr(f, s.key))}
                  >
                    {lang === "fr" ? s.labelFr : s.labelEn}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* ── Trier par ── */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("Trier par", "Sort by")}
              </p>
              <div className="flex flex-col gap-0.5">
                {([
                  ["name",       t("A → Z", "A → Z")],
                  ["price-asc",  t("Prix croissant", "Price ↑")],
                  ["price-desc", t("Prix décroissant", "Price ↓")],
                  ["free-first", t("Gratuit d'abord", "Free first")],
                  ["savings",    t("Économie max", "Max savings")],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <FilterChip
                    key={key}
                    active={sort === key}
                    onClick={() => setSort(key)}
                  >
                    {label}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* ── Reset ── */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
              >
                <X className="h-3 w-3" />
                {t("Réinitialiser", "Reset")}
              </button>
            )}
          </aside>

          {/* ══════════════ TOOL LIST ══════════════ */}
          <div className="flex-1 min-w-0">

            {/* Top bar */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <p
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.68rem",
                  letterSpacing: "0.06em",
                  color: "hsl(var(--muted-foreground) / 0.5)",
                }}
              >
                {filtered.length} {t("résultats", "results")}
                {search && ` · "${search}"`}
                {hasActiveFilters && !search && (
                  <button
                    onClick={resetFilters}
                    className="ml-2 underline underline-offset-2 transition-colors"
                    style={{ color: "hsl(var(--primary) / 0.7)" }}
                  >
                    {t("réinitialiser", "reset")}
                  </button>
                )}
              </p>

              {/* Mobile controls */}
              <div className="flex gap-2 lg:hidden">
                <select
                  id="category-mobile-price-filter"
                  name="category-mobile-price-filter"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                  className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="all">{t("Tous", "All")}</option>
                  <option value="free">{t("Gratuit", "Free")}</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">{t("Payant", "Paid")}</option>
                </select>
                <select
                  id="category-mobile-sort"
                  name="category-mobile-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="name">A→Z</option>
                  <option value="price-asc">{t("Prix↑", "Price↑")}</option>
                  <option value="price-desc">{t("Prix↓", "Price↓")}</option>
                  <option value="free-first">{t("Gratuit", "Free")}</option>
                  <option value="savings">{t("Économies", "Savings")}</option>
                </select>
              </div>
            </div>

            {/* Cards — editorial list rows */}
            <div className="tcr-list">
              {visible.map((tool, i) => (
                <ToolRowEditorial
                  key={tool.id}
                  tool={tool}
                  prefix={prefix}
                  t={t}
                  lang={lang}
                  rank={i + 1}
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
    </div>
  );
};

export default CategoryPage;
