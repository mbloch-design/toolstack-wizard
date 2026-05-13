import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search, X, Flame } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import type { Tool } from "@/data/types";

const TOOLS_PER_PAGE = 40;

const HERO_TOOL_IDS = [
  "notion", "stripe", "hubspot", "zapier", "figma",
  "slack", "airtable", "linear", "framer", "intercom",
  "google-analytics", "webflow",
];

const MOSAIC_POSITIONS: [string, string, number, string, number][] = [
  ["4%",  "2%",  64, "rotate(-6deg)", 2],
  ["0%",  "24%", 56, "rotate(4deg)",  3],
  ["2%",  "46%", 72, "rotate(-2deg)", 4],
  ["0%",  "67%", 80, "rotate(3deg)",  5],
  ["30%", "12%", 56, "rotate(5deg)",  2],
  ["28%", "34%", 88, "rotate(-4deg)", 5],
  ["26%", "57%", 64, "rotate(6deg)",  3],
  ["28%", "77%", 72, "rotate(-3deg)", 4],
  ["56%", "5%",  64, "rotate(3deg)",  2],
  ["55%", "27%", 56, "rotate(-5deg)", 3],
  ["54%", "50%", 80, "rotate(2deg)",  4],
  ["52%", "72%", 60, "rotate(-4deg)", 3],
];

type SortKey = "popular" | "name" | "price-asc" | "free-first";
type PriceFilter = "all" | "free" | "paid";

function isTrending(tool: Tool) {
  return tool.prescription_quality === "ferme";
}
function isRecommended(tool: Tool) {
  return tool.prescription_quality === "oui" || tool.prescription_quality === "ferme";
}

const ToolsPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("popular");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);

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

  const heroTools = useMemo(() =>
    HERO_TOOL_IDS.map(id => tools.find(t => t.id === id || t.slug === id)).filter(Boolean) as Tool[],
    [tools]
  );

  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) =>
      tools.filter(t => t.categoryId === b.id).length - tools.filter(t => t.categoryId === a.id).length
    ), [categories, tools]
  );

  // Noteworthy: top recommended tools (not filtered by category/search)
  const noteworthy = useMemo(() =>
    tools.filter(isRecommended).slice(0, 8),
    [tools]
  );

  // All tools filtered + sorted
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = tools.filter(tool => {
      const matchSearch = !search
        || (tool.name ?? "").toLowerCase().includes(q)
        || (tool.shortDescription ?? "").toLowerCase().includes(q);
      const matchCat = !selectedCategory || tool.categoryId === selectedCategory;
      const matchPrice =
        priceFilter === "free" ? tool.defaultMonthlyPrice === 0 :
        priceFilter === "paid" ? tool.defaultMonthlyPrice > 0 :
        true;
      return matchSearch && matchCat && matchPrice;
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
  }, [tools, search, selectedCategory, priceFilter, sort]);

  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, selectedCategory, priceFilter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const selectedCatObj = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
  const getCatLabel = (cat: typeof categories[0]) =>
    t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)));

  const isFiltering = !!(search || selectedCategory || priceFilter !== "all");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

      {/* ══════════════ HERO ══════════════ */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "hsl(230 40% 97%)" }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 px-6 py-14 lg:grid-cols-2 lg:items-center" style={{ minHeight: 300 }}>
          <div className="relative z-10">
            <h1
              className="font-display"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, color: "hsl(var(--foreground))" }}
            >
              {t("Trouvez les bons outils\npour votre stack", "Find the right tools\nfor your stack")}
            </h1>
            <p className="mt-3 leading-relaxed" style={{ fontSize: "0.9375rem", color: "hsl(var(--muted-foreground))", maxWidth: "44ch", fontWeight: 400 }}>
              {t("Prix vérifiés, alternatives visibles, verdicts honnêtes. Aucune commission.", "Verified pricing, visible alternatives, honest verdicts. No commissions.")}
            </p>
            <div
              className="relative mt-6 flex items-center rounded-xl border bg-white"
              style={{ maxWidth: 460, borderColor: "hsl(var(--border))", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}
            >
              <Search className="pointer-events-none absolute left-4 h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
              <input
                type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil…", "Search a tool…")}
                className="h-12 w-full rounded-xl border-0 bg-transparent pr-10 text-sm font-medium outline-none placeholder:text-muted-foreground"
                style={{ paddingLeft: "2.5rem", fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--foreground))" }}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full hover:bg-secondary">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Floating logos */}
          <div className="relative hidden h-64 lg:block" aria-hidden>
            {heroTools.slice(0, 12).map((tool, i) => {
              const [top, left, size, rotate, zIdx] = MOSAIC_POSITIONS[i] ?? ["0%", "0%", 56, "", 1];
              return (
                <div key={tool.id} className="absolute" style={{ top, left, zIndex: zIdx, transform: rotate }}>
                  <div className="overflow-hidden rounded-2xl" style={{ width: size, height: size, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
                    <ToolLogo tool={tool} size={size} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ BODY ══════════════ */}
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[200px_1fr]">

        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("Catégories", "Categories")}
            </p>
            <nav className="space-y-0.5">
              {/* All */}
              <SidebarItem
                active={!selectedCategory}
                onClick={() => setSelectedCategory(null)}
                icon={
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1.5"/>
                    <rect x="9" y="1" width="6" height="6" rx="1.5"/>
                    <rect x="1" y="9" width="6" height="6" rx="1.5"/>
                    <rect x="9" y="9" width="6" height="6" rx="1.5"/>
                  </svg>
                }
                label={t("Tous", "All") as string}
              />
              {sortedCategories.map(cat => {
                const Icon = getCategoryIcon(cat.id);
                return (
                  <SidebarItem
                    key={cat.id}
                    active={selectedCategory === cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    icon={<Icon className="h-4 w-4 shrink-0" />}
                    label={getCatLabel(cat) as string}
                  />
                );
              })}
            </nav>

            {/* Bottom CTA */}
            <div className="mt-8 border-t border-border pt-6">
              <p className="text-[0.8125rem] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {t("Prêt à optimiser ?", "Ready to optimize?")}
              </p>
              <p className="mt-1 text-[0.75rem] leading-5" style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>
                {t("Analysez votre stack actuelle.", "Analyze your current stack.")}
              </p>
              <Link
                to={`${prefix}/diagnostic`}
                className="mt-3 inline-block rounded-lg px-4 py-2 text-xs font-semibold transition-colors hover:opacity-90"
                style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
              >
                {t("Lancer le diagnostic →", "Start diagnostic →")}
              </Link>
            </div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <main className="min-w-0">

          {/* Mobile category tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden" style={{ scrollbarWidth: "none" }}>
            <PillTab active={!selectedCategory} onClick={() => setSelectedCategory(null)} label={t("Tous", "All") as string} />
            {sortedCategories.map(cat => (
              <PillTab key={cat.id} active={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                label={getCatLabel(cat) as string} />
            ))}
          </div>

          {/* ── Section 1: Noteworthy (only when not filtering) ── */}
          {!isFiltering && noteworthy.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-5 font-display" style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
                {t("Recommandés & à la une", "New & Noteworthy")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {noteworthy.map(tool => <AppCard key={tool.id} tool={tool} prefix={prefix} t={t} />)}
              </div>
            </section>
          )}

          {/* ── Section 2: All apps ── */}
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display" style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
                {isFiltering
                  ? (selectedCatObj ? (getCatLabel(selectedCatObj) as string) : t("Résultats", "Results"))
                  : t("Tous les outils", "Apps")}
              </h2>
              <div className="flex items-center gap-2">
                {/* Price filter */}
                <div className="relative">
                  <select
                    value={priceFilter}
                    onChange={e => setPriceFilter(e.target.value as PriceFilter)}
                    className="h-9 cursor-pointer appearance-none rounded-lg border bg-background pl-3 pr-8 text-sm font-semibold focus:outline-none"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  >
                    <option value="all">{t("Payant + Gratuit", "Paid + Free")}</option>
                    <option value="free">{t("Gratuit seulement", "Free only")}</option>
                    <option value="paid">{t("Payant seulement", "Paid only")}</option>
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value as SortKey)}
                    className="h-9 cursor-pointer appearance-none rounded-lg border bg-background pl-3 pr-8 text-sm font-semibold focus:outline-none"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  >
                    <option value="popular">{t("Populaire", "Popular")}</option>
                    <option value="name">{t("A → Z", "A → Z")}</option>
                    <option value="price-asc">{t("Prix croissant", "Price: low to high")}</option>
                    <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "hsl(var(--border))" }}>
                <Search className="mx-auto h-8 w-8" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
                <p className="mt-3 font-semibold" style={{ color: "hsl(var(--foreground))" }}>{t("Aucun outil trouvé", "No tools found")}</p>
                <button type="button" onClick={() => { setSearch(""); setSelectedCategory(null); setPriceFilter("all"); }}
                  className="mt-4 rounded-full border px-4 py-1.5 text-sm font-semibold hover:text-primary"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                  {t("Réinitialiser", "Reset")}
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {visible.map(tool => <AppCard key={tool.id} tool={tool} prefix={prefix} t={t} />)}
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
        </main>
      </div>
    </div>
  );
};

// ── Sidebar item ────────────────────────────────────────────────────────────
function SidebarItem({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors"
      style={{ fontSize: "0.8125rem", fontWeight: active ? 500 : 400 }}
      style={{
        background: active ? "hsl(var(--primary) / 0.08)" : "transparent",
        color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "hsl(var(--secondary))"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))"; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; } }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ── Mobile pill tab ─────────────────────────────────────────────────────────
function PillTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
      style={{
        background: active ? "hsl(var(--foreground))" : "hsl(var(--secondary))",
        color: active ? "hsl(var(--background))" : "hsl(var(--foreground))",
      }}
    >
      {label}
    </button>
  );
}

// ── App Card ────────────────────────────────────────────────────────────────
function AppCard({ tool, prefix, t }: {
  tool: Tool; prefix: string;
  t: (fr: string | React.ReactNode, en: string | React.ReactNode) => string | React.ReactNode;
}) {
  const trending = isTrending(tool);
  const hasFreeTier = !!(tool.pricing?.free
    && !tool.pricing.free.toLowerCase().includes("no free")
    && !tool.pricing.free.toLowerCase().includes("aucun")
    && !tool.pricing.free.toLowerCase().includes("pas de"));
  const isFree = tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid;
  const isFreemium = tool.defaultMonthlyPrice === 0 && !!tool.pricing?.paid;

  return (
    <Link
      to={`${prefix}/tool/${tool.slug || tool.id}`}
      className="group flex items-start gap-4 rounded-2xl border p-4 transition-all duration-150 cursor-pointer"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 14px hsl(var(--foreground) / 0.06)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Logo: large square */}
      <div className="shrink-0 overflow-hidden rounded-xl" style={{ width: 80, height: 80 }}>
        <ToolLogo tool={tool} size={80} className="h-full w-full" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        {/* Name */}
        <h3
          className="font-display leading-snug transition-colors group-hover:text-primary"
          style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}
        >
          {tool.name}
        </h3>

        {/* Badges row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {(isFree || isFreemium || (!isFree && !isFreemium && hasFreeTier)) && (
            <span className="rounded-md px-1.5 py-px text-[11px] font-medium" style={{ background: "#dcfce7", color: "#15803d", letterSpacing: "0" }}>
              {isFree ? t("Gratuit", "Free") : t("Plan gratuit", "Free plan")}
            </span>
          )}
          {!isFree && !isFreemium && !hasFreeTier && tool.defaultMonthlyPrice > 0 && (
            <span className="num-mono text-[11px]" style={{ color: "hsl(var(--muted-foreground))", fontWeight: 500 }}>
              {tool.defaultMonthlyPrice}€/{t("mois", "mo") as string}
            </span>
          )}
          {trending && (
            <span className="flex items-center gap-1 rounded-md px-1.5 py-px text-[11px] font-medium" style={{ background: "#ffedd5", color: "#c2410c" }}>
              <Flame className="h-2.5 w-2.5" />
              Trending
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className="mt-2 line-clamp-2 leading-[1.45]"
          style={{ fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))", fontWeight: 400 }}
        >
          {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription) as string}
        </p>
      </div>
    </Link>
  );
}

export default ToolsPage;
