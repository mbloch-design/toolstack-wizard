import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search, X } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import type { Tool } from "@/data/types";

const TOOLS_PER_PAGE = 40;

// Featured tool slugs for hero mosaic
const HERO_TOOL_IDS = [
  "notion", "stripe", "hubspot", "zapier", "figma",
  "slack", "airtable", "linear", "framer", "intercom",
  "google-analytics", "webflow",
];

// Hero mosaic positions: [top%, left%, size, rotate, zIndex]
const MOSAIC_POSITIONS: [string, string, number, string, number][] = [
  ["4%",   "2%",  64, "rotate(-6deg)",  2],
  ["0%",   "25%", 56, "rotate(4deg)",   3],
  ["2%",   "48%", 72, "rotate(-2deg)",  4],
  ["0%",   "68%", 80, "rotate(3deg)",   5],
  ["30%",  "12%", 56, "rotate(5deg)",   2],
  ["28%",  "35%", 88, "rotate(-4deg)",  5],
  ["26%",  "58%", 64, "rotate(6deg)",   3],
  ["28%",  "78%", 72, "rotate(-3deg)",  4],
  ["56%",  "5%",  64, "rotate(3deg)",   2],
  ["55%",  "28%", 56, "rotate(-5deg)",  3],
  ["54%",  "50%", 80, "rotate(2deg)",   4],
  ["52%",  "72%", 60, "rotate(-4deg)",  3],
];

function isTrending(tool: Tool) {
  return tool.prescription_quality === "ferme" || tool.prescription_quality === "oui";
}

const ToolsPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);

  // SEO
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
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title, description: desc, url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.slice(0, 30).map((tool, i) => ({
          "@type": "ListItem", position: i + 1,
          name: tool.name,
          url: `https://tooltrim.com/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });
    return () => cleanupSeo(["tools-jsonld"]);
  }, [lang, tools]);

  // Hero mosaic tools
  const heroTools = useMemo(() =>
    HERO_TOOL_IDS.map(id => tools.find(t => t.id === id || t.slug === id)).filter(Boolean) as Tool[],
    [tools]
  );

  // Sorted categories by tool count
  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) =>
      tools.filter(t => t.categoryId === b.id).length - tools.filter(t => t.categoryId === a.id).length
    ),
    [categories, tools]
  );

  // Filtered tools
  const filtered = useMemo(() => tools.filter(tool => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || (tool.name ?? "").toLowerCase().includes(q)
      || (tool.shortDescription ?? "").toLowerCase().includes(q);
    return matchSearch && (!selectedCategory || tool.categoryId === selectedCategory);
  }), [tools, search, selectedCategory]);

  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, selectedCategory]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const selectedCatObj = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
  const getCatLabel = (cat: typeof categories[0]) =>
    t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)));

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

      {/* ══════════════ HERO ══════════════ */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "hsl(230 40% 97%)", minHeight: 320 }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-14 lg:grid-cols-2 lg:items-center">

          {/* Left: text + search */}
          <div className="relative z-10">
            <h1
              className="font-display"
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "hsl(var(--foreground))",
              }}
            >
              {t(
                "Trouvez les bons outils\npour votre stack",
                "Find the right tools\nfor your stack"
              )}
            </h1>
            <p
              className="mt-3 text-base leading-7"
              style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif", maxWidth: "44ch" }}
            >
              {t(
                "Prix vérifiés, alternatives visibles, verdicts honnêtes. Aucun outil mis en avant pour une commission.",
                "Verified pricing, visible alternatives, honest verdicts. No tool promoted for a commission."
              )}
            </p>

            {/* Search */}
            <div
              className="relative mt-7 flex items-center rounded-xl border bg-white shadow-sm"
              style={{
                borderColor: "hsl(var(--border))",
                maxWidth: 480,
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              <Search
                className="pointer-events-none absolute left-4 h-5 w-5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil ou une catégorie…", "Search a tool or category…")}
                className="h-13 w-full rounded-xl border-0 bg-transparent py-3.5 pr-10 text-sm font-medium outline-none placeholder:text-muted-foreground"
                style={{ paddingLeft: "2.75rem", fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--foreground))" }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full hover:bg-secondary"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Right: floating logos mosaic */}
          <div className="relative hidden h-64 lg:block" aria-hidden>
            {heroTools.slice(0, 12).map((tool, i) => {
              const [top, left, size, rotate, zIdx] = MOSAIC_POSITIONS[i] ?? ["0%", "0%", 56, "", 1];
              return (
                <div
                  key={tool.id}
                  className="absolute transition-transform duration-300 hover:scale-105"
                  style={{ top, left, zIndex: zIdx, transform: rotate, willChange: "transform" }}
                >
                  <div
                    className="overflow-hidden rounded-2xl shadow-md"
                    style={{
                      width: size, height: size,
                      background: "white",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                    }}
                  >
                    <ToolLogo tool={tool} size={size} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ MAIN LAYOUT ══════════════ */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[220px_1fr]">

        {/* ── LEFT SIDEBAR: Categories ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p
              className="mb-4 text-sm font-bold"
              style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}
            >
              {t("Catégories", "Categories")}
            </p>
            <nav className="space-y-0.5">
              {/* All */}
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: !selectedCategory ? "hsl(var(--primary) / 0.08)" : "transparent",
                  color: !selectedCategory ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="1" width="6" height="6" rx="1.5"/>
                  <rect x="9" y="1" width="6" height="6" rx="1.5"/>
                  <rect x="1" y="9" width="6" height="6" rx="1.5"/>
                  <rect x="9" y="9" width="6" height="6" rx="1.5"/>
                </svg>
                {t("Tous", "All")}
              </button>

              {/* Category list */}
              {sortedCategories.map(cat => {
                const Icon = getCategoryIcon(cat.id);
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(active ? null : cat.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: active ? "hsl(var(--primary) / 0.08)" : "transparent",
                      color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "hsl(var(--secondary))";
                      if (!active) (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))";
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                      if (!active) (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))";
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{getCatLabel(cat)}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── RIGHT: Content ── */}
        <main className="min-w-0">

          {/* Section heading */}
          <div className="mb-6 flex items-center justify-between">
            <h2
              className="font-display font-bold"
              style={{ fontSize: "1.35rem", letterSpacing: "-0.025em", color: "hsl(var(--foreground))" }}
            >
              {search
                ? t(`Résultats pour "${search}"`, `Results for "${search}"`)
                : selectedCatObj
                  ? getCatLabel(selectedCatObj) as string
                  : t("Recommandés & à la une", "New & Noteworthy")
              }
            </h2>
            <span
              className="text-sm"
              style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Mono', monospace" }}
            >
              {filtered.length} {t("outils", "tools")}
            </span>
          </div>

          {/* Mobile: horizontal category scroll */}
          <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden" style={{ scrollbarWidth: "none" }}>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                background: !selectedCategory ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                color: !selectedCategory ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
              }}
            >
              {t("Tous", "All")}
            </button>
            {sortedCategories.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(active ? null : cat.id)}
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
                  style={{
                    background: active ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                    color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                  }}
                >
                  {getCatLabel(cat) as string}
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
              style={{ borderColor: "hsl(var(--border))" }}>
              <Search className="mx-auto h-8 w-8" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
              <p className="mt-3 font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {t("Aucun outil trouvé", "No tools found")}
              </p>
              <button
                type="button"
                onClick={() => { setSearch(""); setSelectedCategory(null); }}
                className="mt-4 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors hover:text-primary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                {t("Réinitialiser", "Reset")}
              </button>
            </div>
          )}

          {/* 2-column card grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map(tool => (
              <AppCard key={tool.id} tool={tool} prefix={prefix} t={t} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}
                className="rounded-full border px-8 py-3 text-sm font-semibold transition-colors hover:border-primary/30 hover:text-primary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}
              >
                {t(`Afficher plus — ${filtered.length - visibleCount} restants`, `Show more — ${filtered.length - visibleCount} remaining`)}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// ── App Card (Webflow Apps style: horizontal, logo left) ────────────────────

function AppCard({ tool, prefix, t }: {
  tool: Tool;
  prefix: string;
  t: (fr: string | React.ReactNode, en: string | React.ReactNode) => string | React.ReactNode;
}) {
  const isFree = tool.defaultMonthlyPrice === 0;
  const hasFreeTier = !!(tool.pricing?.free);
  const trending = isTrending(tool);

  const priceLabel = isFree
    ? (tool.pricing?.paid ? "Freemium" : (t("Gratuit", "Free") as string))
    : `${tool.defaultMonthlyPrice}€/${t("mois", "mo") as string}`;

  return (
    <Link
      to={`${prefix}/tool/${tool.slug || tool.id}`}
      className="group flex items-start gap-4 rounded-2xl border p-4 transition-all duration-150"
      style={{
        borderColor: "hsl(var(--border))",
        background: "hsl(var(--card))",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.25)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px hsl(var(--foreground) / 0.06)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Logo */}
      <div className="shrink-0">
        <ToolLogo
          tool={tool}
          size={60}
          className="rounded-xl"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className="font-semibold leading-tight transition-colors group-hover:text-primary"
            style={{ fontSize: "0.9rem", color: "hsl(var(--foreground))", letterSpacing: "-0.015em" }}
          >
            {tool.name}
          </h3>

          {/* Free tier badge */}
          {hasFreeTier && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "hsl(var(--keep) / 0.1)", color: "hsl(var(--keep))" }}
            >
              {t("Plan gratuit", "Free plan")}
            </span>
          )}

          {/* Trending badge */}
          {trending && !hasFreeTier && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
            >
              {t("Recommandé", "Top pick")}
            </span>
          )}
        </div>

        {/* Price */}
        <p
          className="mt-0.5 text-xs font-semibold"
          style={{
            color: isFree ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {priceLabel}
        </p>

        {/* Description */}
        <p
          className="mt-1.5 line-clamp-2 text-xs leading-5"
          style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
        >
          {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription) as string}
        </p>
      </div>
    </Link>
  );
}

export default ToolsPage;
