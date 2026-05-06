import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Search, ExternalLink, ChevronDown, ArrowRight, X, TrendingDown, Sparkles } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PageHero from "@/components/PageHero";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getToolDomain } from "@/lib/toolUtils";

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

const CategoryPage = () => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const category = categories.find((c) => c.slug === slug);
  const allCatTools = category ? tools.filter((tool) => tool.categoryId === category.id) : [];

  const [search, setSearch]               = useState("");
  const [sort, setSort]                   = useState<SortKey>("name");
  const [priceFilter, setPriceFilter]     = useState<PriceFilter>("all");
  const [profileFilter, setProfileFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter]       = useState<string[]>([]);
  const [savingsFilter, setSavingsFilter] = useState<string[]>([]);
  const [visibleCount, setVisibleCount]   = useState(PER_PAGE);

  const year = new Date().getFullYear();

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
    const catName = category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
    const catNameEn = category.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || catName;
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
  }, [category, lang, allCatTools.length]);

  // Filter & sort
  const filtered = useMemo(() => {
    const result = allCatTools.filter((tool) => {
      const matchSearch =
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.shortDescription.toLowerCase().includes(search.toLowerCase());

      const matchPrice =
        priceFilter === "all" ? true :
        priceFilter === "free" ? (tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid) :
        priceFilter === "freemium" ? (tool.pricing?.free && tool.pricing?.paid) :
        priceFilter === "paid" ? (tool.defaultMonthlyPrice > 0 && !tool.pricing?.free) : true;

      const matchProfile =
        profileFilter.length === 0 ||
        profileFilter.some((r) =>
          (tool as any).relevantFor?.includes(r) ||
          (tool as any).relevantFor?.includes("all")
        );

      const matchType =
        typeFilter.length === 0 || typeFilter.includes((tool as any).tool_type);

      const matchSavings =
        savingsFilter.length === 0 ||
        savingsFilter.every((s) => {
          if (s === "freeAlt")      return !!(tool as any).freeAlternative;
          if (s === "substitutable") return (tool as any).substitutable === true;
          if (s === "cheaperAlt")   return !!(tool as any).betterAlternative;
          return true;
        });

      return matchSearch && matchPrice && matchProfile && matchType && matchSavings;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "name":      return a.name.localeCompare(b.name);
        case "price-asc": return (a.defaultMonthlyPrice || 0) - (b.defaultMonthlyPrice || 0);
        case "price-desc":return (b.defaultMonthlyPrice || 0) - (a.defaultMonthlyPrice || 0);
        case "free-first":return (a.defaultMonthlyPrice === 0 ? 0 : 1) - (b.defaultMonthlyPrice === 0 ? 0 : 1);
        case "savings":   return ((b as any).betterAlternative?.saving || 0) - ((a as any).betterAlternative?.saving || 0);
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
  const catName = category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
  const catNameEn = category.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || catName;
  const freeCount = allCatTools.filter((tool) => tool.defaultMonthlyPrice === 0).length;
  const paidTools = allCatTools.filter((tool) => tool.defaultMonthlyPrice > 0);
  const avgPrice  = paidTools.reduce((s, tool) => s + tool.defaultMonthlyPrice, 0) / (paidTools.length || 1);
  const visible   = filtered.slice(0, visibleCount);
  const hasMore   = visibleCount < filtered.length;
  const relatedCats = categories.filter((c) => c.id !== category.id).slice(0, 4);

  // ── Sidebar pill helper ──
  const PillButton = ({
    active, onClick, children,
  }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-150 text-left"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        borderColor: active ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
        background:  active ? "hsl(var(--primary) / 0.1)"  : "hsl(var(--card))",
        color:       active ? "hsl(var(--primary))"         : "hsl(var(--muted-foreground))",
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen">
      <PageHero
        breadcrumb={[
          { label: t("Outils", "Tools"), href: `${prefix}/tools` },
          { label: t(catName, catNameEn) },
        ]}
        eyebrow={t(catName, catNameEn)}
        icon={<Icon className="h-3.5 w-3.5" />}
        title={
          <>
            {t("Meilleurs outils", "Best tools")} <span className="text-primary">{t(catName, catNameEn)}</span>
          </>
        }
        description={
          category.description
            ? t(category.description, (category as any).descriptionEn || category.description)
            : t(`Prix réels, alternatives testées et verdicts ${year}.`, `Real pricing, tested alternatives and ${year} verdicts.`)
        }
        stats={[
          { value: allCatTools.length, label: t("outils analysés", "tools analyzed") },
          ...(freeCount > 0 ? [{ value: freeCount, label: t("gratuits ou freemium", "free or freemium"), tone: "positive" as const }] : []),
          ...(avgPrice > 0 ? [{ value: `${Math.round(avgPrice)}€`, label: t("prix moyen", "avg price") }] : []),
        ]}
      />

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-start gap-8">

          {/* ══════════════ SIDEBAR ══════════════ */}
          <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 sticky top-6">

            {/* Search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground) / 0.45)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil…", "Search a tool…")}
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-150"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
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
              <p className="label-section mb-3">{t("Profil utilisateur", "User profile")}</p>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE_OPTIONS.map((p) => (
                  <PillButton
                    key={p.key}
                    active={profileFilter.includes(p.key)}
                    onClick={() => setProfileFilter((f) => toggleArr(f, p.key))}
                  >
                    {lang === "fr" ? p.labelFr : p.labelEn}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* ── Type d'outil ── */}
            <div>
              <p className="label-section mb-3">{t("Type d'outil", "Tool type")}</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((type) => (
                  <PillButton
                    key={type.key}
                    active={typeFilter.includes(type.key)}
                    onClick={() => setTypeFilter((f) => toggleArr(f, type.key))}
                  >
                    {type.short}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* ── Tarification ── */}
            <div>
              <p className="label-section mb-3">{t("Tarification", "Pricing")}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "free", "freemium", "paid"] as PriceFilter[]).map((f) => (
                  <PillButton
                    key={f}
                    active={priceFilter === f}
                    onClick={() => setPriceFilter(f)}
                  >
                    {f === "all" ? t("Tous", "All") :
                     f === "free" ? t("Gratuit", "Free") :
                     f === "freemium" ? "Freemium" : t("Payant", "Paid")}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* ── Potentiel d'économie ── */}
            <div>
              <p className="label-section mb-3">{t("Potentiel d'économie", "Savings potential")}</p>
              <div className="flex flex-col gap-1.5">
                {SAVINGS_OPTIONS.map((s) => {
                  const active = savingsFilter.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSavingsFilter((f) => toggleArr(f, s.key))}
                      className="flex items-start gap-2.5 rounded-md border px-3 py-2 text-left text-xs transition-all duration-150"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        borderColor: active ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
                        background:  active ? "hsl(var(--primary) / 0.08)" : "transparent",
                        color:       active ? "hsl(var(--primary))"        : "hsl(var(--muted-foreground))",
                      }}
                    >
                      <span
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border flex items-center justify-center transition-all"
                        style={{
                          borderColor: active ? "hsl(var(--primary))" : "hsl(var(--border))",
                          background:  active ? "hsl(var(--primary))" : "transparent",
                        }}
                      >
                        {active && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3.5 6L6.5 2" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {lang === "fr" ? s.labelFr : s.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Trier par ── */}
            <div>
              <p className="label-section mb-3">{t("Trier par", "Sort by")}</p>
              <div className="flex flex-col gap-1.5">
                {([
                  ["name",       t("A → Z", "A → Z")],
                  ["price-asc",  t("Prix croissant", "Price ↑")],
                  ["price-desc", t("Prix décroissant", "Price ↓")],
                  ["free-first", t("Gratuit d'abord", "Free first")],
                  ["savings",    t("Économie max", "Max savings")],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSort(key)}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-all duration-150"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      borderColor: sort === key ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
                      background:  sort === key ? "hsl(var(--primary) / 0.08)" : "transparent",
                      color:       sort === key ? "hsl(var(--primary))"        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {sort === key && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Reset ── */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Mono', monospace" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
              >
                <X className="h-3 w-3" />
                {t("Réinitialiser les filtres", "Reset filters")}
              </button>
            )}

            {/* ── CTA diagnostic ── */}
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "hsl(var(--primary) / 0.2)", background: "hsl(var(--primary) / 0.05)" }}
            >
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {t("Vous utilisez ces outils ?", "Using these tools?")}
              </p>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
              >
                {t(
                  "Détectez les doublons et économisez en 3 min.",
                  "Detect duplicates and save money in 3 min."
                )}
              </p>
              <Link
                to={`${prefix}/selector`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {t("Lancer l'audit", "Start audit")}
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
                  fontFamily: "'DM Mono', monospace",
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
                const freeAltSlug   = (tool as any).freeAlternative as string | null;
                const betterAlt     = (tool as any).betterAlternative as { tool: string; saving: number; performanceGain?: string } | null;
                const pricingV5     = (tool as any).pricing_v5 as { compare_plan_name?: string; verified_on?: string } | null;
                const toolType      = (tool as any).tool_type as string;

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
                        <ToolLogo tool={tool} size={48} className="rounded-xl" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">

                        {/* Row 1: name + type badge + price */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className="font-semibold text-foreground group-hover:text-primary transition-colors duration-150"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                {tool.name}
                              </h3>
                              {/* Tool type badge */}
                              {toolType && toolType !== "satellite" && (
                                <span
                                  className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs"
                                  style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "0.6rem",
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    background: "hsl(var(--muted) / 0.5)",
                                    color: "hsl(var(--muted-foreground) / 0.7)",
                                    border: "1px solid hsl(var(--border))",
                                  }}
                                >
                                  {TYPE_SHORT[toolType] ?? toolType}
                                </span>
                              )}
                              {/* Free / Freemium badge */}
                              {(isFree || isFreemium) && (
                                <span
                                  className="inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    fontFamily: "'DM Mono', monospace",
                                    borderColor: "hsl(var(--primary) / 0.3)",
                                    background: "hsl(var(--primary) / 0.08)",
                                    color: "hsl(var(--primary))",
                                  }}
                                >
                                  {isFree ? t("Gratuit", "Free") : "Freemium"}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p
                              className="mt-1.5 text-sm line-clamp-2"
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                lineHeight: 1.62,
                                color: "hsl(var(--muted-foreground))",
                              }}
                            >
                              {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
                            </p>
                          </div>

                          {/* Price block — paid tools */}
                          {!isFree && !isFreemium && tool.defaultMonthlyPrice > 0 && (
                            <div className="shrink-0 text-right">
                              <div className="flex items-baseline gap-0.5 justify-end">
                                <span
                                  className="text-xl font-bold text-foreground"
                                  style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}
                                >
                                  {tool.defaultMonthlyPrice}€
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "hsl(var(--muted-foreground) / 0.6)", fontFamily: "'DM Mono', monospace" }}
                                >
                                  /{t("mois", "mo")}
                                </span>
                              </div>
                              {pricingV5?.compare_plan_name && (
                                <p
                                  className="mt-0.5 text-right"
                                  style={{
                                    fontFamily: "'DM Mono', monospace",
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
                              {(lang === "fr" ? tool.pros : ((tool as any).prosEn || tool.pros))
                                .slice(0, 2)
                                .map((pro: string, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs"
                                    style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
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
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
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
                                  fontFamily: "'DM Sans', sans-serif",
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
                            fontFamily: "'DM Sans', sans-serif",
                            color: stripVariant === "free"
                              ? "hsl(var(--savings))"
                              : "hsl(var(--cancel))",
                          }}
                        >
                          {stripVariant === "free" ? (
                            <>
                              <span className="font-medium">
                                {t("Alternative gratuite :", "Free alternative:")}
                              </span>{" "}
                              <span className="capitalize">{freeAltSlug?.replace(/-/g, " ")}</span>
                              {tool.defaultMonthlyPrice > 0 && (
                                <span style={{ opacity: 0.7 }}>
                                  {" "}· {t("économisez", "save")} {tool.defaultMonthlyPrice}€/{t("mois", "mo")}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="font-medium">
                                {t("Moins cher :", "Cheaper option:")}
                              </span>{" "}
                              <span className="capitalize">{betterAlt?.tool?.replace(/-/g, " ")}</span>
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
                            fontFamily: "'DM Mono', monospace",
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
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
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
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t("Aucun outil trouvé pour ces filtres.", "No tools match these filters.")}
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-3 text-xs text-primary underline underline-offset-2"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {t("Réinitialiser les filtres", "Reset filters")}
                </button>
              </div>
            )}

            {/* Related categories */}
            {relatedCats.length > 0 && (
              <div className="mt-14 border-t border-border pt-10">
                <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
                  {t("Catégories connexes", "Related categories")}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedCats.map((cat) => {
                    const CIcon = getCategoryIcon(cat.id);
                    const count = tools.filter((tool) => tool.categoryId === cat.id).length;
                    const cName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
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
                        <p className="font-semibold group-hover:text-primary transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {t(cName, cat.nameEn || cName)}
                        </p>
                        <p className="mt-1 text-xs font-medium" style={{ color: "hsl(var(--primary))", fontFamily: "'DM Mono', monospace" }}>
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
