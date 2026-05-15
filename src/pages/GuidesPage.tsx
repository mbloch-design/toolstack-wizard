import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useState, useMemo, useEffect } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { useArticleTools } from "@/hooks/useArticleTools";
import EditorialHero from "@/components/EditorialHero";
import { setSeoTags, cleanupSeo } from "@/lib/seo";
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

  /* Reset pagination on filter/sort change */
  useEffect(() => { setShowAll(false); }, [activeFilter, sortBy]);

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

      {/* ══ 1. Hero ══════════════════════════════════════════════════════════ */}
      <EditorialHero
        eyebrow={t("Ressources", "Resources")}
        title={
          <>
            {t("Des guides pour mieux choisir.", "Guides to help you choose.")}
            <br />
            {t("Pas pour lire plus.", "Not to read more.")}
          </>
        }
        description={t(
          "Méthodes, comparatifs et stacks commentées pour construire une stack plus claire, plus utile et plus légère.",
          "Methods, comparisons and annotated stacks to build a clearer, more useful and leaner tool stack.",
        )}
        rightModule={
          <div style={{ paddingTop: 4 }}>
            <p style={{
              fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68",
              marginBottom: 14,
            }}>
              {t("Index des guides", "Guide index")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(lang === "fr"
                ? [
                    { filter: "all",       label: "Tous les guides" },
                    { filter: "comparer",  label: "Comparatifs" },
                    { filter: "remplacer", label: "Alternatives" },
                    { filter: "ia",        label: "IA & Productivité" },
                    { filter: "stack",     label: "Stacks commentées" },
                    { filter: "freelance", label: "Freelance" },
                  ]
                : [
                    { filter: "all",       label: "All guides" },
                    { filter: "comparer",  label: "Comparisons" },
                    { filter: "remplacer", label: "Alternatives" },
                    { filter: "ia",        label: "AI & Productivity" },
                    { filter: "stack",     label: "Annotated stacks" },
                    { filter: "freelance", label: "Freelance" },
                  ]
              ).map(({ filter, label }) => (
                <a
                  key={label}
                  href="#guides"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFilterClick(filter);
                  }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: activeFilter === filter ? "#222222" : "#FFFFFF",
                    border: `1px solid ${activeFilter === filter ? "#222222" : "#DADAD4"}`,
                    borderRadius: 8,
                    fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
                    color: activeFilter === filter ? "#FFFFFF" : "#222222",
                    textDecoration: "none", cursor: "pointer",
                    transition: "all 160ms ease-out",
                  }}
                  onMouseEnter={e => { if (activeFilter !== filter) (e.currentTarget as HTMLElement).style.borderColor = "#222222"; }}
                  onMouseLeave={e => { if (activeFilter !== filter) (e.currentTarget as HTMLElement).style.borderColor = "#DADAD4"; }}
                >
                  <span>{label}</span>
                  <ArrowRight style={{ width: 12, height: 12, color: activeFilter === filter ? "#FFFFFF" : "#ADADAD", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        }
      >
        {/* Metadata tags below description */}
        <div className="gi-hero-tags">
          {[
            t("Guides pratiques", "Practical guides"),
            t("Stacks commentées", "Annotated stacks"),
            t("Alternatives", "Alternatives"),
            t("Prix vérifiés", "Verified pricing"),
          ].map((tag) => (
            <span key={tag} className="gi-hero-tag">{tag}</span>
          ))}
        </div>
      </EditorialHero>

      {/* ══ 2. Featured ══════════════════════════════════════════════════════ */}
      {!loading && featured && (
        <div style={{ borderBottom: "1px solid #DADAD4" }}>
          <div className="gi-container" style={{ paddingTop: 72, paddingBottom: 72 }}>
            <p className="gi-section-label">{t("À lire en premier", "Read first")}</p>
            <FeaturedBlock post={featured} prefix={prefix} lang={lang} t={t} tools={tools} />
          </div>
        </div>
      )}

      {/* ══ 3. Commencer ici ═════════════════════════════════════════════════ */}
      {!loading && (
        <div style={{ borderBottom: "1px solid #DADAD4" }}>
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

      {/* ══ 4. Filter bar + guides list ══════════════════════════════════════ */}
      <div id="guides" style={{ borderBottom: "1px solid #DADAD4" }}>
        <div className="gi-container" style={{ paddingTop: 56, paddingBottom: 72 }}>

          {/* Section label */}
          <p className="gi-section-label">{t("Guides récents", "Recent guides")}</p>

          {/* Filter bar */}
          <div className="gi-filter-bar">
            <div className="gi-filter-pills">
              {filters.map((f) => (
                <button
                  key={f.id}
                  className={`gi-filter-pill${activeFilter === f.id ? " gi-filter-pill--active" : ""}`}
                  onClick={() => { setActiveFilter(f.id); setShowAll(false); }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="gi-sort-wrapper">
              <span className="gi-sort-label">{t("TRIER PAR", "SORT BY")}</span>
              <select
                className="gi-sort-select"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setShowAll(false); }}
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
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 16, color: "#9A9A92" }}>
                {t("Aucun guide pour ce filtre.", "No guides for this filter.")}
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                style={{ marginTop: 16, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500, color: "#222222", cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}
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
      <div style={{ borderBottom: "1px solid #DADAD4" }}>
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
                      window.scrollTo({ top: 0, behavior: "smooth" });
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

      {/* ══ 6. CTA band ══════════════════════════════════════════════════════ */}
      <div className="gi-cta-band">
        <div className="gi-container">
          <div className="gi-cta-band-inner">
            <div>
              <p className="gi-cta-band-title">
                {t("Construire une stack plus légère.", "Build a leaner stack.")}
              </p>
              <p className="gi-cta-band-text">
                {t(
                  "Analyse tes outils actuels et repère les doublons, alternatives et abonnements à challenger.",
                  "Analyze your current tools and spot duplicates, alternatives and subscriptions worth challenging.",
                )}
              </p>
            </div>
            <Link to={`${prefix}/selector`} className="gi-cta-band-btn">
              {t("Analyser ma stack", "Analyze my stack")}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
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
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#DADAD4", flexShrink: 0 }} />
              <span className="gi-featured-meta-item">{post.date.slice(0, 4)}</span>
            </>
          )}
          {post.readTime && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#DADAD4", flexShrink: 0 }} />
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
            letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68",
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
                    border: "1px solid #DADAD4", background: "#FFFFFF",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <ToolLogo tool={tool} size={18} />
                  </div>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "#222222" }}>
                    {tool.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            post.category && (
              <p style={{ fontFamily: "var(--font-brand)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", color: "#222222", lineHeight: 1.1 }}>
                {post.category}
              </p>
            )
          )}
        </div>
        {post.readTime && (
          <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock style={{ width: 12, height: 12, color: "#9A9A92" }} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "#9A9A92" }}>{post.readTime}</span>
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
          gap: 32, padding: "32px 0", borderTop: i > 1 ? "1px solid #DADAD4" : "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 12, background: "#EDEDE8", borderRadius: 4, width: 64 }} />
            <div style={{ height: 12, background: "#F0F0EA", borderRadius: 4, width: 88 }} />
          </div>
          <div>
            <div style={{ height: 28, background: "#EDEDE8", borderRadius: 4, marginBottom: 10, maxWidth: 480 }} />
            <div style={{ height: 14, background: "#F0F0EA", borderRadius: 4, maxWidth: 600 }} />
          </div>
          <div style={{ height: 14, background: "#EDEDE8", borderRadius: 4, width: 40 }} />
        </div>
      ))}
    </div>
  );
}

export default GuidesPage;
