import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { useArticleTools } from "@/hooks/useArticleTools";
import Breadcrumb from "@/components/Breadcrumb";
import FilterDropdown from "@/components/filters/FilterDropdown";
import { setSeoTags, cleanupSeo } from "@/lib/seo";
import { scrollToTop } from "@/lib/scroll";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";

/* ─────────────────────────────────────────────────────────────────────────────
   GuidesPage — editorial redesign v2
   Filtres, tri, logos outils, section "Commencer ici", load more.
───────────────────────────────────────────────────────────────────────────── */

/* ── Filter definitions ───────────────────────────────────────────────────── */
const FILTERS_FR = [
  { id: "all",       label: "Tous" },
  { id: "comparer",  label: "Comparer" },
  { id: "remplacer", label: "Remplacer" },
  { id: "couts",     label: "Réduire les coûts" },
  { id: "stack",     label: "Construire une stack" },
  { id: "ia",        label: "IA" },
  { id: "freelance", label: "Freelance" },
];
const FILTERS_EN = [
  { id: "all",       label: "All" },
  { id: "comparer",  label: "Compare" },
  { id: "remplacer", label: "Replace" },
  { id: "couts",     label: "Cut costs" },
  { id: "stack",     label: "Build a stack" },
  { id: "ia",        label: "AI" },
  { id: "freelance", label: "Freelance" },
];

const SORT_OPTIONS_FR = [
  { id: "recent",    label: "Récents" },
  { id: "selection", label: "Sélection ToolTrim" },
  { id: "short",     label: "Lecture courte" },
];
const SORT_OPTIONS_EN = [
  { id: "recent",    label: "Recent" },
  { id: "selection", label: "ToolTrim picks" },
  { id: "short",     label: "Quick read" },
];

const PAGE_SIZE = 11; /* + 1 featured = 12 total */

/* ── Matching helpers ─────────────────────────────────────────────────────── */
function matchesFilter(post: Post, filterId: string): boolean {
  if (filterId === "all") return true;
  const text = `${post.title ?? ""} ${post.excerpt ?? ""} ${(post.tags ?? []).join(" ")} ${post.category ?? ""}`.toLowerCase();
  switch (filterId) {
    case "comparer":
      return post.category === "Comparatifs" || text.includes("comparatif") || text.includes("vs ") || text.includes(" vs");
    case "remplacer":
      return text.includes("alternativ") || text.includes("remplacer") || text.includes("remplace") || (post.slug ?? "").includes("alternativ");
    case "couts":
      return text.includes("économie") || text.includes("gratuit") || text.includes("coût") || text.includes("tarif") || text.includes("prix") || text.includes("rentabl") || text.includes("réduire") || text.includes("payant") || text.includes("moins cher");
    case "stack":
      return text.includes("stack") || text.includes("minimaliste") || (post.slug ?? "").includes("stack");
    case "ia":
      return text.includes("ia,") || text.includes("ia ") || text.includes(" ia") || text.includes("chatgpt") || text.includes("claude") || text.includes("intelligence artificielle") || text.includes("agent ia") || text.includes("perplexity") || text.includes("gemini") || text.includes("deepseek") || (post.category ?? "").toLowerCase().includes("ia");
    case "freelance":
      return text.includes("freelance") || (post.slug ?? "").includes("freelance");
    default:
      return true;
  }
}

function parseReadTime(rt: string | undefined): number {
  if (!rt) return 99;
  const m = rt.match(/\d+/);
  return m ? parseInt(m[0], 10) : 99;
}

function sortPosts(posts: Post[], sortBy: string): Post[] {
  if (sortBy === "recent") {
    return [...posts].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }
  if (sortBy === "short") {
    return [...posts].sort((a, b) => parseReadTime(a.readTime) - parseReadTime(b.readTime));
  }
  /* "selection" = original data order (ToolTrim curation) */
  return posts;
}

function getPostType(post: Post): string {
  if (post.category === "Comparatifs") return "COMPARATIF";
  const text = `${post.title ?? ""} ${(post.tags ?? []).join(" ")} ${post.slug ?? ""}`.toLowerCase();
  if (text.includes("stack")) return "STACK";
  if (text.includes("alternativ")) return "ALTERNATIVE";
  return "GUIDE";
}

function getPostIntent(post: Post): string | null {
  if (post.category === "Comparatifs") return "COMPARER";
  const text = `${post.title ?? ""} ${post.excerpt ?? ""} ${(post.tags ?? []).join(" ")}`.toLowerCase();
  if (text.includes("vs ") || text.includes("comparatif")) return "COMPARER";
  if (text.includes("alternativ") || text.includes("remplacer")) return "REMPLACER";
  if (text.includes("gratuit") || text.includes("économie") || text.includes("tarif") || text.includes("coût") || text.includes("réduire") || text.includes("payant") || text.includes("rentabl")) return "RÉDUIRE LES COÛTS";
  // Was "STACK" — identical to getPostType's own "STACK" case, so any
  // stack guide with no other angle showed a nonsensical "STACK · STACK"
  // tag. "CONSTRUIRE" actually adds information (the reader's angle),
  // distinct from the type badge.
  if (text.includes("stack")) return "CONSTRUIRE";
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
const GuidesPage = () => {
  const { lang, t, prefix } = useLang();
  const { posts, loading } = usePosts(lang);
  const { tools } = useTools();

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showAll, setShowAll] = useState(false);
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);

  /* Reset pagination on filter/sort change */
  useEffect(() => { setShowAll(false); }, [activeFilter, sortBy]);

  // Toggle the sticky toolbar's "stuck" border once its sentinel (placed
  // right above it) scrolls out of view — same pattern as ToolsPage/
  // StacksPage. .asv2-content is the real scroll container on desktop.
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

  useEffect(() => {
    const title = lang === "fr"
      ? "Guides & Comparatifs d'outils SaaS — ToolTrim"
      : "SaaS Tool Guides & Comparisons — ToolTrim";
    const desc = lang === "fr"
      ? "Méthodes, comparatifs et stacks commentées pour construire une stack plus claire, plus utile et plus légère."
      : "Methods, comparisons and annotated stacks to build a clearer, more useful and leaner tool stack.";
    setSeoTags({
      title, description: desc,
      url: `https://tooltrim.com/${lang}/guides`,
      locale: lang === "fr" ? "fr_FR" : "en_US",
    });
    return () => cleanupSeo([]);
  }, [lang]);

  const filters = lang === "fr" ? FILTERS_FR : FILTERS_EN;
  const sortOptions = lang === "fr" ? SORT_OPTIONS_FR : SORT_OPTIONS_EN;

  /* ── Filtered + sorted posts ── */
  const filteredPosts = useMemo(() => {
    const matched = posts.filter(p => matchesFilter(p, activeFilter));
    return sortPosts(matched, sortBy);
  }, [posts, activeFilter, sortBy]);

  const featured    = filteredPosts[0] ?? null;
  const listPosts   = filteredPosts.slice(1);
  const visibleList = showAll ? listPosts : listPosts.slice(0, PAGE_SIZE);
  const hasMore     = !showAll && listPosts.length > PAGE_SIZE;

  /* ── Theme columns ── */
  const themeColumns = lang === "fr"
    ? [
        { label: "Choisir un outil",   items: ["Comparer deux solutions", "Comprendre les prix", "Éviter les abonnements inutiles", "Repérer les doublons"] },
        { label: "Construire une stack", items: ["Stack freelance", "Stack designer", "Stack consultant", "Stack créateur", "Stack ops / COO"] },
        { label: "IA & Productivité",   items: ["Compétences IA", "Automatisation", "Recherche augmentée", "Production de contenu"] },
        { label: "Alternatives",        items: ["Alternatives gratuites", "Outils moins chers", "Remplacer un outil lourd", "Open-source"] },
      ]
    : [
        { label: "Choosing a tool",   items: ["Comparing two solutions", "Understanding pricing", "Avoiding useless subscriptions", "Spotting duplicates"] },
        { label: "Building a stack",  items: ["Freelance stack", "Designer stack", "Consultant stack", "Creator stack", "Ops / COO stack"] },
        { label: "AI & Productivity", items: ["AI skills", "Automation", "Augmented research", "Content production"] },
        { label: "Alternatives",      items: ["Free alternatives", "Cheaper tools", "Replace heavy tools", "Open-source"] },
      ];

  return (
    <div className="min-h-screen">

      {/* ══ 1. Compact header: breadcrumb + title, no banner artwork —
          same pattern as ToolsPage, replacing the tall gradient hero.
          paddingTop 40 matches .tt-catalog-container's own top padding
          exactly, so the header sits at the same vertical offset as
          Tools/Category/Stacks/Comparatifs. ══ */}
      <div className="gi-container" style={{ paddingTop: 40 }}>
        <div className="tt-catalog-compact-header">
          <Breadcrumb items={[{ label: t("Guides", "Guides") }]} />
          <h1 className="tt-catalog-compact-title">{t("Mieux choisir ses outils.", "Choose tools with less noise.")}</h1>
        </div>
      </div>

      {/* ══ 2. Featured ══════════════════════════════════════════════════════ */}
      {!loading && featured && (
        <div style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="gi-container" style={{ paddingTop: 72, paddingBottom: 72 }}>
            <p className="gi-section-label">{t("À lire en premier", "Read first")}</p>
            <FeaturedBlock post={featured} prefix={prefix} lang={lang} t={t} tools={tools} />
          </div>
        </div>
      )}


      {/* ══ 4. Filter bar + guides list — same tt-catalog-container padding
          (40/40) and no border, matching Outils' filter block exactly. ══ */}
      <div id="guides">
        <div className="gi-container tt-catalog-container">

          <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

          {/* Filter bar — same pilule+popover pattern as Outils/Comparatifs/Stacks */}
          <div className={`tt-catalog-toolbar${toolbarStuck ? " tt-catalog-toolbar--stuck" : ""}`}>
            <div className="tt-catalog-toolbar-filters">
              <FilterDropdown
                label={t("Filtrer par", "Filter by") as string}
                allLabel={t("Tous", "All") as string}
                options={filters.filter((f) => f.id !== "all").map((f) => ({ id: f.id, label: f.label }))}
                value={activeFilter}
                onChange={(id) => { setActiveFilter(id); setShowAll(false); }}
              />
            </div>
            <div className="tt-catalog-toolbar-meta">
              <select
                className="tt-catalog-sort-select"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setShowAll(false); }}
                aria-label={t("Trier par", "Sort by") as string}
              >
                {sortOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Guides list */}
          {loading && <LoadingSkeleton />}

          {!loading && filteredPosts.length === 0 && (
            <div style={{ paddingTop: 48, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 16, color: "var(--color-muted-light)" }}>
                {t("Aucun guide pour ce filtre.", "No guides for this filter.")}
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                style={{ marginTop: 16, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500, color: "var(--color-text)", cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}
              >
                {t("Voir tous les guides", "See all guides")}
              </button>
            </div>
          )}

          {!loading && visibleList.length > 0 && (
            <div className="sk-results-grid">
              {visibleList.map((post) => (
                <ArticleRow key={post.slug} post={post} prefix={prefix} lang={lang} tools={tools} />
              ))}
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && (
            <div style={{ paddingTop: 40, display: "flex", justifyContent: "center" }}>
              <button
                className="gi-load-more"
                onClick={() => setShowAll(true)}
              >
                {t(
                  `Afficher plus de guides (${listPosts.length - PAGE_SIZE} restants)`,
                  `Show more guides (${listPosts.length - PAGE_SIZE} remaining)`,
                )}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ══ 5. Par thème ═════════════════════════════════════════════════════ */}
      <div style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="gi-container" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <p className="gi-section-label">{t("Par thème", "By theme")}</p>
          <div className="gi-theme-grid">
            {themeColumns.map((col) => (
              <div key={col.label}>
                <p className="gi-theme-col-label">{col.label}</p>
                {col.items.map((item) => (
                  <a
                    key={item}
                    href={`${prefix}/guides`}
                    className="gi-theme-link"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTop("smooth");
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

/* ── Featured guide block ──────────────────────────────────────────────────── */
function FeaturedBlock({
  post, prefix, lang, t, tools,
}: {
  post: Post; prefix: string; lang: string;
  t: (fr: string, en: string) => string; tools: Tool[];
}) {
  const mentionedTools = useArticleTools(post, tools);

  return (
    <Link to={`${prefix}/guide/${post.slug}`} className="gi-featured">
      {/* Left: text */}
      <div className="gi-featured-left">
        <div className="gi-featured-meta">
          {post.category && <span className="gi-featured-meta-item">{post.category}</span>}
          {post.date && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--color-border)", flexShrink: 0 }} />
              <span className="gi-featured-meta-item">{post.date.slice(0, 4)}</span>
            </>
          )}
          {post.readTime && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--color-border)", flexShrink: 0 }} />
              <span className="gi-featured-meta-item">{post.readTime}</span>
            </>
          )}
        </div>

        <h2 className="gi-featured-title">{post.title}</h2>
        <p className="gi-featured-excerpt">{post.excerpt}</p>

        <span className="gi-featured-cta">
          {t("Lire le guide", "Read the guide")}
          <ArrowRight style={{ width: 14, height: 14 }} />
        </span>
      </div>

      {/* Right: visual panel — large tool-logo tiles instead of a thin
          text list, so the card has an actual visual anchor built from
          real data (cited tools) rather than a fabricated cover image. */}
      <div className="gi-featured-right">
        <div>
          <p className="gi-featured-right-label">
            {t("Dans ce guide", "In this guide")}
          </p>
          {mentionedTools.length > 0 ? (
            <div className="gi-featured-tools-grid">
              {mentionedTools.slice(0, 4).map((tool) => (
                <div key={tool.id} className="gi-featured-tool-tile" title={tool.name}>
                  <ToolLogo tool={tool} size={30} />
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          ) : (
            post.category && (
              <p style={{ fontFamily: "var(--font-brand)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", color: "var(--color-text)", lineHeight: 1.1 }}>
                {post.category}
              </p>
            )
          )}
        </div>
        {post.readTime && (
          <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock style={{ width: 12, height: 12, color: "var(--color-muted-light)" }} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted-light)" }}>{post.readTime}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Article row (enhanced) ────────────────────────────────────────────────── */
function ArticleRow({
  post, prefix, lang, tools,
}: {
  post: Post; prefix: string; lang: string; tools: Tool[];
}) {
  const mentionedTools = useArticleTools(post, tools);
  const type   = getPostType(post);
  const intent = getPostIntent(post);

  return (
    <Link to={`${prefix}/guide/${post.slug}`} className="sk-card">
      <span className="sk-card-tag">{intent && intent !== type ? `${type} · ${intent}` : type}</span>

      <h3 className="sk-card-title">{post.title}</h3>
      {post.excerpt && <p className="sk-card-verdict">{post.excerpt}</p>}

      {mentionedTools.length > 0 && (
        <div className="sk-card-tools" aria-label={lang === "fr" ? "Outils cités" : "Tools cited"}>
          {mentionedTools.slice(0, 5).map((tool) => (
            <span key={tool.id} title={tool.name} className="sk-card-tool">
              <ToolLogo tool={tool} size={22} />
            </span>
          ))}
          {mentionedTools.length > 5 && (
            <span className="sk-card-tool sk-card-tool-more">+{mentionedTools.length - 5}</span>
          )}
        </div>
      )}

      <div className="sk-card-footer">
        {post.readTime && (
          <div className="sk-card-stats">
            <span className="sk-card-stat" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Clock style={{ width: 12, height: 12 }} aria-hidden />
              {post.readTime}
            </span>
          </div>
        )}
        <span className="sk-card-cta">
          {lang === "fr" ? "Lire" : "Read"}
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "150px 1fr auto",
          gap: 32, padding: "32px 0", borderTop: i > 1 ? "1px solid var(--color-border)" : "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 12, background: "var(--color-surface-soft)", borderRadius: 4, width: 64 }} />
            <div style={{ height: 12, background: "var(--color-surface-soft)", borderRadius: 4, width: 88 }} />
          </div>
          <div>
            <div style={{ height: 28, background: "var(--color-surface-soft)", borderRadius: 4, marginBottom: 10, maxWidth: 480 }} />
            <div style={{ height: 14, background: "var(--color-surface-soft)", borderRadius: 4, maxWidth: 600 }} />
          </div>
          <div style={{ height: 14, background: "var(--color-surface-soft)", borderRadius: 4, width: 40 }} />
        </div>
      ))}
    </div>
  );
}

export default GuidesPage;
