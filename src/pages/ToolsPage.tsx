import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search, X } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { ToolCard } from "@/components/ToolCard";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import type { Tool } from "@/data/types";

const TOOLS_PER_PAGE = 40;


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
    const result = tools.filter(tool => {
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

      {/* ══════════════ TOOLS SEARCH HEADER ══════════════ */}
      <div style={{ background: "#F8F8F4", borderBottom: "1px solid #DADAD4", padding: "48px 0 40px" }}>
        <div className="mx-auto max-w-7xl px-6">
          <span style={{ display: "block", fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 16 }}>
            {t("Catalogue", "Catalog")}
          </span>
          <h1
            style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.055em", lineHeight: 0.98, color: "#222222", marginBottom: 20 }}
          >
            {t("Trouver les bons outils.", "Find the right tools.")}
          </h1>
          <div style={{ position: "relative", maxWidth: 460 }}>
            <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#6F6F68", pointerEvents: "none" }} />
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("Rechercher un outil…", "Search a tool…")}
              style={{
                width: "100%", height: 46, paddingLeft: 42, paddingRight: search ? 36 : 14,
                background: "#FFFFFF", border: "1px solid #DADAD4", borderRadius: 8,
                fontFamily: "var(--font-ui)", fontSize: 14, color: "#222222", outline: "none",
                transition: "border-color 160ms ease-out",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#222222"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#DADAD4"; }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#6F6F68" }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>
      </div>

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
                {t("Votre stack coûte combien ?", "How much is your stack costing you?")}
              </p>
              <p className="mt-1 text-[0.75rem] leading-5" style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>
                {t("Calculez ce que vous payez vraiment.", "Calculate what you're actually paying.")}
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
            <section className="mb-12">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("Sélection éditoriale", "Editor's picks")}
              </p>
              <h2 className="mb-5 font-display" style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
                {t("Les outils qu'on recommande vraiment", "Tools we actually recommend")}
              </h2>
              <div className="tc-grid tc-grid--featured-first">
                {noteworthy.map((tool, i) => {
                  const catObj = categories.find(c => c.id === tool.categoryId);
                  const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                  return (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      prefix={prefix}
                      t={t}
                      lang={lang}
                      variant={i === 0 ? "featured" : "default"}
                      categoryLabel={catLabel}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Section 2: All apps ── */}
          <section className={!isFiltering && noteworthy.length > 0 ? "border-t border-border/50 pt-10" : ""}>
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
      style={{
        fontSize: "0.8125rem",
        fontWeight: active ? 500 : 400,
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

export default ToolsPage;
