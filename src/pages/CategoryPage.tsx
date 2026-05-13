import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Search, ExternalLink, ChevronDown, ArrowRight, X, TrendingDown, Sparkles } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getToolDomain } from "@/lib/toolUtils";
import { asText, stripLeadingEmoji } from "@/lib/text";
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

// ── Breadcrumb — minimal, matches ToolsPage visual density ──
const Breadcrumb = ({ items }: { items: { label: string; href?: string }[] }) => (
  <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1.5">
        {i > 0 && (
          <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>/</span>
        )}
        {item.href ? (
          <Link
            to={item.href}
            className="text-[11px] font-medium transition-colors hover:text-foreground"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {item.label}
          </Link>
        ) : (
          <span className="text-[11px] font-medium" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>
            {item.label}
          </span>
        )}
      </span>
    ))}
  </nav>
);

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

      {/* ══════════════ HERO — même langage que ToolsPage ══════════════ */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "hsl(230 40% 97%)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Breadcrumb items={[
            { label: t("Outils", "Tools"), href: `${prefix}/tools` },
            { label: displayName },
          ]} />

          <div className="mt-5 flex items-center justify-between gap-8">
            {/* Left: text */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {allCatTools.length} {t("outils analysés", "tools analyzed")}
              </p>
              <h1
                className="font-display"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, color: "hsl(var(--foreground))" }}
              >
                {displayName}
              </h1>
              <p className="mt-3 leading-relaxed" style={{ fontSize: "0.9375rem", color: "hsl(var(--muted-foreground))", maxWidth: "48ch", fontWeight: 400 }}>
                {catDesc}
              </p>
              {/* Stats inline — mêmes chips que ToolsPage */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {freeCount > 0 && (
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "#dcfce7", color: "#15803d" }}>
                    {freeCount} {t("gratuits ou freemium", "free or freemium")}
                  </span>
                )}
                {avgPrice > 0 && (
                  <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                    ~{Math.round(avgPrice)}€ {t("prix moyen", "avg price")}
                  </span>
                )}
              </div>
            </div>

            {/* Right: category icon large */}
            <div
              className="hidden lg:flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl"
              style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
              aria-hidden
            >
              <Icon className="h-11 w-11" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-10">
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

            {/* ── CTA — ToolsPage style, no border card ── */}
            <div className="border-t border-border pt-5">
              <p className="text-sm font-semibold leading-snug text-foreground">
                {t("Votre stack coûte combien ?", "How much is your stack?")}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("Calculez ce que vous payez vraiment.", "Calculate what you're actually paying.")}
              </p>
              <Link
                to={`${prefix}/selector`}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground) / 0.85)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground))"; }}
              >
                {t("Calculer mon stack", "Calculate my stack")}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
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

            {/* Cards */}
            <div className="space-y-3">
              {visible.map((tool) => {
                const domain        = getToolDomain(tool);
                const isFree        = tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid;
                const isFreemium    = !!(tool.pricing?.free && tool.pricing?.paid);
                const freeAltSlug   = tool.freeAlternative;
                const betterAlt     = tool.betterAlternative;
                const pricingV5     = tool.pricing_v5 as PricingV5 | null | undefined;
                const toolType      = tool.tool_type as ToolType;

                // Type pill label
                const TYPE_SHORT: Record<string, string> = {
                  ia: "IA", metier: "Métier", gestion: "Gestion", plugin: "Plugin", satellite: "Satellite",
                };

                // Savings strip logic — show only the strongest signal
                const hasSavingsStrip = !!(freeAltSlug || (betterAlt && betterAlt.saving > 0));
                const stripVariant: "free" | "cheaper" = freeAltSlug ? "free" : "cheaper";

                return (
                  <div
                    key={tool.id}
                    className="surface-card-hover group overflow-hidden"
                  >
                    {/* ── Main body ── */}
                    <div className="flex items-start gap-4 p-5">

                      {/* Logo */}
                      <div className="shrink-0 mt-0.5">
                        <ToolLogo tool={tool} size={56} className="rounded-xl" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">

                        {/* Row 1: name + type badge + price */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className="font-display text-foreground group-hover:text-primary transition-colors duration-150"
                                style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em" }}
                              >
                                {tool.name}
                              </h3>
                              {/* Tool type badge */}
                              {toolType && toolType !== "satellite" && (
                                <span
                                  className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5"
                                  style={{
                                    fontSize: "0.65rem",
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    background: "hsl(var(--secondary))",
                                    color: "hsl(var(--muted-foreground))",
                                    border: "1px solid hsl(var(--border))",
                                    fontWeight: 500,
                                  }}
                                >
                                  {TYPE_SHORT[toolType] ?? toolType}
                                </span>
                              )}
                              {/* Free / Freemium badge — aligned with ToolsPage (green) */}
                              {(isFree || isFreemium) && (
                                <span
                                  className="inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                  style={{ background: "#dcfce7", color: "#15803d" }}
                                >
                                  {isFree ? t("Gratuit", "Free") : t("Plan gratuit", "Free plan")}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p
                              className="mt-1.5 line-clamp-2"
                              style={{
                                fontSize: "0.8125rem",
                                lineHeight: 1.55,
                                color: "hsl(var(--muted-foreground))",
                                fontWeight: 400,
                              }}
                            >
                              {t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}
                            </p>
                          </div>

                          {/* Price block — paid tools */}
                          {!isFree && !isFreemium && tool.defaultMonthlyPrice > 0 && (
                            <div className="shrink-0 text-right">
                              <div className="flex items-baseline gap-0.5 justify-end">
                                <span
                                  className="text-xl font-bold text-foreground"
                                  style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "-0.02em" }}
                                >
                                  {tool.defaultMonthlyPrice}€
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "hsl(var(--muted-foreground) / 0.6)", fontFamily: "ui-monospace, monospace" }}
                                >
                                  /{t("mois", "mo")}
                                </span>
                              </div>
                              {pricingV5?.compare_plan_name && (
                                <p
                                  className="mt-0.5 text-right"
                                  style={{
                                    fontFamily: "ui-monospace, monospace",
                                    fontSize: "0.58rem",
                                    letterSpacing: "0.05em",
                                    color: "hsl(var(--muted-foreground) / 0.4)",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {t("Plan", "Plan")} {pricingV5.compare_plan_name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Row 2: pros + CTAs */}
                        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                          {tool.pros?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(lang === "fr" ? tool.pros : (tool.prosEn || tool.pros))
                                .slice(0, 2)
                                .map((pro: string, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs"
                                    style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit" }}
                                  >
                                    {pro.length > 35 ? pro.slice(0, 35) + "…" : pro}
                                  </span>
                                ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0 ml-auto">
                            <Link
                              to={`${prefix}/tool/${tool.slug || tool.id}`}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/40 hover:text-primary"
                              style={{ fontFamily: "inherit" }}
                            >
                              {t("Voir l'outil", "Learn more")}
                            </Link>
                            {domain && (
                              <a
                                href={`https://${domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
                                style={{
                                  background: "hsl(var(--foreground))",
                                  color: "hsl(var(--background))",
                                  fontFamily: "inherit",
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground) / 0.85)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground))";
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {t("Visiter", "Visit")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Savings strip ── */}
                    {hasSavingsStrip && (
                      <div
                        className="flex items-center gap-3 border-t px-5 py-2.5"
                        style={{
                          borderColor: stripVariant === "free"
                            ? "hsl(var(--savings) / 0.15)"
                            : "hsl(var(--cancel) / 0.15)",
                          background: stripVariant === "free"
                            ? "hsl(var(--savings) / 0.04)"
                            : "hsl(var(--cancel) / 0.04)",
                        }}
                      >
                        {stripVariant === "free" ? (
                          <Sparkles
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "hsl(var(--savings))" }}
                          />
                        ) : (
                          <TrendingDown
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "hsl(var(--cancel))" }}
                          />
                        )}

                        <p
                          className="flex-1 text-xs"
                          style={{
                            fontFamily: "inherit",
                            color: stripVariant === "free"
                              ? "hsl(var(--savings))"
                              : "hsl(var(--cancel))",
                          }}
                        >
                          {stripVariant === "free" ? (
                            <>
                              <span className="font-medium">
                                {t("Alt. gratuite :", "Free alt:")}
                              </span>{" "}
                              <span>{asText(freeAltSlug).split(/[\s([/]/)[0]}</span>
                              {tool.defaultMonthlyPrice > 0 && (
                                <span style={{ opacity: 0.7 }}>
                                  {" "}· {t("économisez", "save")} {tool.defaultMonthlyPrice}€/{t("mois", "mo")}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="font-medium">
                                {t("Moins cher :", "Cheaper:")}
                              </span>{" "}
                              <span>{asText(betterAlt?.tool).split(/[\s([/]/)[0]}</span>
                              {betterAlt && betterAlt.saving > 0 && (
                                <span style={{ opacity: 0.7 }}>
                                  {" "}· −{betterAlt.saving}€/{t("mois", "mo")}
                                </span>
                              )}
                            </>
                          )}
                        </p>

                        <Link
                          to={`${prefix}/tool/${tool.slug || tool.id}`}
                          className="shrink-0 text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontSize: "0.65rem",
                            color: stripVariant === "free"
                              ? "hsl(var(--savings))"
                              : "hsl(var(--cancel))",
                          }}
                        >
                          {t("Voir l'analyse →", "See analysis →")}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
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

            {/* Related categories */}
            {relatedCats.length > 0 && (
              <div className="mt-14 border-t border-border pt-10">
                <h2 className="font-display" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t("Catégories connexes", "Related categories")}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedCats.map((cat) => {
                    const CIcon = getCategoryIcon(cat.id);
                    const count = tools.filter((tool) => tool.categoryId === cat.id).length;
                    const cName = stripLeadingEmoji(cat.name, cat.id);
                    return (
                      <Link
                        key={cat.id}
                        to={`${prefix}/category/${cat.slug}`}
                        className="surface-card-hover group p-4"
                      >
                        <div
                          className="mb-2.5 inline-flex rounded-lg p-2"
                          style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
                        >
                          <CIcon className="h-4 w-4" />
                        </div>
                        <p className="font-semibold group-hover:text-primary transition-colors" style={{ fontFamily: "inherit" }}>
                          {t(cName, cat.nameEn || cName)}
                        </p>
                        <p className="mt-1 text-xs font-medium" style={{ color: "hsl(var(--primary))", fontFamily: "ui-monospace, monospace" }}>
                          {count} {t("outils", "tools")} →
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
