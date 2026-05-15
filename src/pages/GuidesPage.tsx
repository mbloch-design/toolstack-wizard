import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useState, useMemo, useEffect } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { useArticleTools } from "@/hooks/useArticleTools";
import { ToolLogoStrip } from "@/components/ToolMentionedCard";
import EditorialHero from "@/components/EditorialHero";
import { setSeoTags, cleanupSeo } from "@/lib/seo";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";

/* ─────────────────────────────────────────────────────────────────────────────
   GuidesPage — editorial redesign
   Feels like a curated decision library, not a SaaS blog grid.
───────────────────────────────────────────────────────────────────────────── */

const GuidesPage = () => {
  const { lang, t, prefix } = useLang();
  const { posts, loading } = usePosts(lang);
  const { tools } = useTools();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  const filtered = activeCategory
    ? posts.filter((p) => p.category === activeCategory)
    : posts;

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  /* ── Theme columns (editorial navigation, not dynamic filters) ── */
  const themeColumns = lang === "fr"
    ? [
        {
          label: "Choisir un outil",
          items: ["Comparer deux solutions", "Comprendre les prix", "Éviter les abonnements inutiles", "Repérer les doublons"],
        },
        {
          label: "Construire une stack",
          items: ["Stack freelance", "Stack designer", "Stack consultant", "Stack créateur", "Stack ops / COO"],
        },
        {
          label: "IA & Productivité",
          items: ["Compétences IA", "Automatisation", "Recherche augmentée", "Production de contenu"],
        },
        {
          label: "Alternatives",
          items: ["Alternatives gratuites", "Outils moins chers", "Remplacer un outil lourd", "Open-source"],
        },
      ]
    : [
        {
          label: "Choosing a tool",
          items: ["Comparing two solutions", "Understanding pricing", "Avoiding useless subscriptions", "Spotting duplicates"],
        },
        {
          label: "Building a stack",
          items: ["Freelance stack", "Designer stack", "Consultant stack", "Creator stack", "Ops / COO stack"],
        },
        {
          label: "AI & Productivity",
          items: ["AI skills", "Automation", "Augmented research", "Content production"],
        },
        {
          label: "Alternatives",
          items: ["Free alternatives", "Cheaper tools", "Replace heavy tools", "Open-source"],
        },
      ];

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
                    { key: null,               label: "Tous les guides" },
                    { key: "Stacks commentées", label: "Stacks commentées" },
                    { key: "Alternatives",      label: "Alternatives" },
                    { key: "IA",                label: "IA & Productivité" },
                    { key: "Méthodes",          label: "Méthodes" },
                  ]
                : [
                    { key: null,              label: "All guides" },
                    { key: "Stacks",          label: "Annotated stacks" },
                    { key: "Alternatives",    label: "Alternatives" },
                    { key: "AI",              label: "AI & Productivity" },
                    { key: "Methods",         label: "Methods" },
                  ]
              ).map(({ key, label }) => (
                <a
                  key={label}
                  href="#guides"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveCategory(key);
                    document.getElementById("guides")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: activeCategory === key ? "#222222" : "#FFFFFF",
                    border: `1px solid ${activeCategory === key ? "#222222" : "#DADAD4"}`,
                    borderRadius: 8,
                    fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
                    color: activeCategory === key ? "#FFFFFF" : "#222222",
                    textDecoration: "none", cursor: "pointer",
                    transition: "all 160ms ease-out",
                  }}
                  onMouseEnter={e => { if (activeCategory !== key) (e.currentTarget as HTMLElement).style.borderColor = "#222222"; }}
                  onMouseLeave={e => { if (activeCategory !== key) (e.currentTarget as HTMLElement).style.borderColor = "#DADAD4"; }}
                >
                  <span>{label}</span>
                  <ArrowRight style={{ width: 12, height: 12, color: activeCategory === key ? "#FFFFFF" : "#ADADAD", flexShrink: 0 }} />
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

      {/* ══ 2. Featured — À lire en premier ══════════════════════════════════ */}
      {!loading && featured && (
        <div id="guides" style={{ borderBottom: "1px solid #DADAD4" }}>
          <div className="gi-container" style={{ paddingTop: 72, paddingBottom: 72 }}>
            <p className="gi-section-label">{t("À lire en premier", "Read first")}</p>
            <FeaturedBlock post={featured} prefix={prefix} lang={lang} t={t} tools={tools} />
          </div>
        </div>
      )}

      {/* ══ 3. Guides récents — editorial rows ═══════════════════════════════ */}
      {!loading && rest.length > 0 && (
        <div style={{ borderBottom: "1px solid #DADAD4" }}>
          <div className="gi-container" style={{ paddingTop: 72, paddingBottom: 72 }}>
            <p className="gi-section-label">{t("Guides récents", "Recent guides")}</p>
            <div>
              {rest.map((post) => (
                <ArticleRow key={post.slug} post={post} prefix={prefix} lang={lang} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading placeholder */}
      {loading && (
        <div id="guides" className="gi-container" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <LoadingSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div id="guides" className="gi-container" style={{ paddingTop: 72, paddingBottom: 72, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 16, color: "#9A9A92" }}>
            {t("Aucun guide pour cette catégorie.", "No guides for this category.")}
          </p>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ marginTop: 16, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500, color: "#222222", cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}
          >
            {t("Voir tous les guides", "See all guides")}
          </button>
        </div>
      )}

      {/* ══ 4. Par thème ═════════════════════════════════════════════════════ */}
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

      {/* ══ 5. CTA band ══════════════════════════════════════════════════════ */}
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
            <Link to={`${prefix}/diagnostic`} className="gi-cta-band-btn">
              {t("Analyser ma stack", "Analyze my stack")}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

/* ── Featured guide block ── */
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <ToolLogoStrip tools={mentionedTools} maxDisplay={5} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "#9A9A92" }}>
              {mentionedTools.length} {t("outils", "tools")}
            </span>
          </div>
        )}

        <span className="gi-featured-cta">
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
            <div>
              {post.category && (
                <p style={{ fontFamily: "var(--font-brand)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", color: "#222222", lineHeight: 1.1 }}>
                  {post.category}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          {post.readTime && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock style={{ width: 12, height: 12, color: "#9A9A92" }} />
              <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "#9A9A92" }}>
                {post.readTime}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Article row (editorial list format) ── */
function ArticleRow({ post, prefix, lang }: { post: Post; prefix: string; lang: string }) {
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <Link to={`${prefix}/guide/${post.slug}`} className="gi-row">
      {/* Col 1: date + category */}
      <div className="gi-row-meta">
        {post.category && <p className="gi-row-cat">{post.category}</p>}
        {formattedDate && <p>{formattedDate}</p>}
        {post.readTime && (
          <p style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock style={{ width: 10, height: 10 }} />
            {post.readTime}
          </p>
        )}
      </div>

      {/* Col 2: title + excerpt */}
      <div>
        <h3 className="gi-row-title">{post.title}</h3>
        {post.excerpt && <p className="gi-row-excerpt">{post.excerpt}</p>}
      </div>

      {/* Col 3: read CTA */}
      <div className="gi-row-cta">
        {lang === "fr" ? "Lire →" : "Read →"}
      </div>
    </Link>
  );
}

/* ── Loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "130px 1fr auto",
          gap: 32, padding: "32px 0", borderTop: i > 1 ? "1px solid #DADAD4" : "none",
        }}>
          <div style={{ height: 14, background: "#EDEDE8", borderRadius: 4 }} />
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
