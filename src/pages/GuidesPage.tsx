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
  if (text.includes("stack")) return "STACK";
  return null;
}

/* ── Tool logo pill stack ─────────────────────────────────────────────────── */
function ToolLogoPillStack({ tools, max = 5 }: { tools: Tool[]; max?: number }) {
  if (tools.length === 0) return null;
  const display = tools.slice(0, max);
  const overflow = tools.length - max;
  return (
    <div className="tool-logo-stack">
      {display.map((tool) => (
        <div key={tool.id} className="tool-logo-pill" title={tool.name}>
          <ToolLogo tool={tool} size={18} />
        </div>
      ))}
      {overflow > 0 && (
        <div className="tool-logo-pill tool-logo-more">+{overflow}</div>
      )}
    </div>
  );
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

  /* ── "Commencer ici" entries ── */
  const startHereItems = lang === "fr"
    ? [
        {
          filter: "comparer",
          icon: "⇌",
          label: "Je veux choisir un outil",
          desc: "Comparatifs honnêtes entre deux solutions proches. Sans biais, avec les vraies différences.",
        },
        {
          filter: "remplacer",
          icon: "→",
          label: "Je veux remplacer un outil trop cher",
          desc: "Alternatives concrètes, gratuites ou moins chères, pour chaque outil de ta stack.",
        },
        {
          filter: "stack",
          icon: "◈",
          label: "Je veux construire ma stack",
          desc: "Stacks commentées par profil : freelance, créateur, consultant, designer, ops.",
        },
      ]
    : [
        {
          filter: "comparer",
          icon: "⇌",
          label: "I want to pick the right tool",
          desc: "Honest comparisons between similar tools. No bias, just the real differences.",
        },
        {
          filter: "remplacer",
          icon: "→",
          label: "I want to replace an expensive tool",
          desc: "Concrete free or cheaper alternatives for every tool in your stack.",
        },
        {
          filter: "stack",
          icon: "◈",
          label: "I want to build my stack",
          desc: "Annotated stacks by profile: freelancer, creator, consultant, designer, ops.",
        },
      ];

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

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId);
    document.getElementById("guides")?.scrollIntoView({ behavior: "smooth" });
  };

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

      {/* ══ 3. Commencer ici ═════════════════════════════════════════════════ */}
      {!loading && (
        <div style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="gi-container" style={{ paddingTop: 56, paddingBottom: 56 }}>
            <p className="gi-section-label">{t("Commencer par le bon angle.", "Start from the right angle.")}</p>
            <div className="gi-start-here-grid">
              {startHereItems.map((item) => (
                <button
                  key={item.filter}
                  className="gi-start-here-item"
                  onClick={() => handleFilterClick(item.filter)}
                >
                  <span className="gi-start-here-icon">{item.icon}</span>
                  <span className="gi-start-here-label">{item.label}</span>
                  <span className="gi-start-here-desc">{item.desc}</span>
                  <span className="gi-start-here-cta">
                    {t("Voir les guides", "See guides")}
                    <ArrowRight style={{ width: 12, height: 12 }} />
                  </span>
                </button>
              ))}
            </div>
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
            <div>
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

        {mentionedTools.length > 0 && (
          <ToolLogoPillStack tools={mentionedTools} max={5} />
        )}

        <span className="gi-featured-cta" style={{ marginTop: mentionedTools.length > 0 ? 28 : 0 }}>
          {t("Lire le guide", "Read the guide")}
          <ArrowRight style={{ width: 14, height: 14 }} />
        </span>
      </div>

      {/* Right: typographic panel */}
      <div className="gi-featured-right">
        <div>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)",
            marginBottom: 20,
          }}>
            {t("Dans ce guide", "In this guide")}
          </p>
          {mentionedTools.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mentionedTools.slice(0, 5).map((tool) => (
                <div key={tool.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: "1px solid var(--color-border)", background: "var(--color-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <ToolLogo tool={tool} size={18} />
                  </div>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
                    {tool.name}
                  </span>
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
    <Link to={`${prefix}/guide/${post.slug}`} className="gi-row">

      {/* Col 1: type + intent + read time */}
      <div className="gi-row-meta">
        <p className="gi-row-cat">{type}</p>
        {intent && <p className="gi-row-intent">{intent}</p>}
        {post.readTime && (
          <p style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
            <Clock style={{ width: 10, height: 10 }} />
            {post.readTime}
          </p>
        )}
      </div>

      {/* Col 2: title + excerpt + tool logos */}
      <div>
        <h3 className="gi-row-title">{post.title}</h3>
        {post.excerpt && <p className="gi-row-excerpt">{post.excerpt}</p>}
        {mentionedTools.length > 0 && (
          <div>
            <p className="gi-row-tools-label">{lang === "fr" ? "OUTILS CITÉS" : "TOOLS CITED"}</p>
            <ToolLogoPillStack tools={mentionedTools} max={5} />
          </div>
        )}
      </div>

      {/* Col 3: read CTA */}
      <div className="gi-row-cta">
        {lang === "fr" ? "Lire →" : "Read →"}
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
