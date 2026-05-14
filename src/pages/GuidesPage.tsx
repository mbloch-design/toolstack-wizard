import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useState, useMemo, useEffect } from "react";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { useArticleTools } from "@/hooks/useArticleTools";
import { ToolLogoStrip } from "@/components/ToolMentionedCard";
import EditorialHero from "@/components/EditorialHero";
import { setSeoTags, cleanupSeo } from "@/lib/seo";
import PersonaGuidesSection from "@/components/PersonaGuidesSection";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";

const GuidesPage = () => {
  const { lang, t, prefix } = useLang();
  const { posts, loading } = usePosts(lang);
  const { tools } = useTools();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // SEO for listing page
  useEffect(() => {
    const title = lang === "fr"
      ? "Guides & Comparatifs d'outils SaaS — ToolTrim"
      : "SaaS Tool Guides & Comparisons — ToolTrim";
    const desc = lang === "fr"
      ? "Analyses approfondies, comparatifs détaillés et conseils pratiques pour construire la stack d'outils parfaite."
      : "In-depth analyses, detailed comparisons and practical advice to build the perfect tool stack.";
    setSeoTags({
      title,
      description: desc,
      url: `https://tooltrim.com/${lang}/guides`,
      locale: lang === "fr" ? "fr_FR" : "en_US",
    });
    return () => cleanupSeo([]);
  }, [lang]);

  const allCategories = useMemo(() => {
    const cats = new Set(posts.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [posts]);

  const filtered = activeCategory
    ? posts.filter((p) => p.category === activeCategory)
    : posts;

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen">
      <EditorialHero
        eyebrow={t("Ressources", "Resources")}
        title={
          <>
            {t("Des guides pour mieux choisir.", "Guides to help you choose better.")}
            <br />
            {t("Pas pour lire plus.", "Not to read more.")}
          </>
        }
        description={t(
          "Méthodes, comparatifs et stacks commentées pour construire une stack plus claire, plus utile et plus légère.",
          "Methods, comparisons and annotated stacks to build a clearer, more useful and leaner tool stack.",
        )}
        primaryCta={{ label: t("Lire les guides", "Read the guides"), href: `#guides` }}
        secondaryCta={{ label: t("Explorer ToolTrim", "Explore ToolTrim"), href: `${prefix}/tools` }}
        rightModule={
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 14 }}>
              {t("Index des guides", "Guide index")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(lang === "fr"
                ? [
                    { key: null,                     label: "Tous les guides" },
                    { key: "Guides d'achat",          label: "Guides d'achat" },
                    { key: "Stacks commentées",       label: "Stacks commentées" },
                    { key: "Alternatives",            label: "Alternatives moins chères" },
                    { key: "Méthodes",                label: "Méthodes" },
                  ]
                : [
                    { key: null,                     label: "All guides" },
                    { key: "Buying guides",          label: "Buying guides" },
                    { key: "Annotated stacks",       label: "Annotated stacks" },
                    { key: "Alternatives",           label: "Cheaper alternatives" },
                    { key: "Methods",                label: "Methods" },
                  ]
              ).map(({ key, label }) => (
                <a
                  key={label}
                  href="#guides"
                  onClick={(e) => { e.preventDefault(); setActiveCategory(key); document.getElementById("guides")?.scrollIntoView({ behavior: "smooth" }); }}
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
      />

      {/* Persona pillar guides */}
      <PersonaGuidesSection lang={lang} />

      {/* Category filter chips */}
      {allCategories.length > 1 && (
        <div className="container mx-auto max-w-7xl px-4 pt-10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-ui)",
              cursor: "pointer",
              transition: "all 150ms ease",
              background: activeCategory === null ? "#222222" : "#FFFFFF",
              color: activeCategory === null ? "#FFFFFF" : "#6F6F68",
              border: `1px solid ${activeCategory === null ? "#222222" : "#DADAD4"}`,
            }}
          >
            {t("Tous", "All")}
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-ui)",
                cursor: "pointer",
                transition: "all 150ms ease",
                background: activeCategory === cat ? "#222222" : "#FFFFFF",
                color: activeCategory === cat ? "#FFFFFF" : "#6F6F68",
                border: `1px solid ${activeCategory === cat ? "#222222" : "#DADAD4"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <section id="guides" className="container mx-auto max-w-7xl px-4 py-12">
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            {t("Aucun article pour le moment.", "No articles yet.")}
          </p>
        ) : (
          <>
            {featured && <FeaturedCard post={featured} prefix={prefix} t={t} tools={tools} />}
            {rest.length > 0 && (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <ArticleCard key={post.slug} post={post} prefix={prefix} tools={tools} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

/* ── Featured card ── */
function FeaturedCard({
  post,
  prefix,
  t,
  tools,
}: {
  post: Post;
  prefix: string;
  t: (fr: string, en: string) => string;
  tools: Tool[];
}) {
  const mentionedTools = useArticleTools(post, tools);

  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="ec-card"
      style={{ flexDirection: "row", padding: 0, overflow: "hidden" }}
    >
      {/* Tool logos panel */}
      <div style={{
        width: 220, flexShrink: 0,
        background: "#F0F0EA", borderRight: "1px solid #DADAD4",
        display: "flex", flexWrap: "wrap", gap: 10,
        alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
        className="hidden md:flex"
      >
        {mentionedTools.slice(0, 6).map((tool) => (
          <div
            key={tool.id}
            style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid #DADAD4", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ToolLogo tool={tool} size={26} className="rounded-md" />
          </div>
        ))}
        {mentionedTools.length === 0 && (
          <BookOpen style={{ width: 36, height: 36, color: "#DADAD4" }} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          {post.category && (
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68" }}>
              {post.category}
            </span>
          )}
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "#ADADAD", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock style={{ width: 11, height: 11 }} /> {post.readTime}
          </span>
        </div>
        <h2
          className="ec-title"
          style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", lineHeight: 1.2 }}
        >
          {post.title}
        </h2>
        <p className="ec-text" style={{ marginTop: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.excerpt}
        </p>
        {mentionedTools.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <ToolLogoStrip tools={mentionedTools} maxDisplay={5} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "#6F6F68" }}>
              {mentionedTools.length} {mentionedTools.length > 1 ? "outils" : "outil"}
            </span>
          </div>
        )}
        <span className="ec-cta">
          {t("Lire l'article", "Read article")}
          <ArrowRight className="ec-cta-arrow" style={{ width: 14, height: 14 }} />
        </span>
      </div>
    </Link>
  );
}

/* ── Article card ── */
function ArticleCard({ post, prefix, tools }: { post: Post; prefix: string; tools: Tool[] }) {
  const mentionedTools = useArticleTools(post, tools);

  return (
    <Link to={`${prefix}/guide/${post.slug}`} className="ec-card">
      {/* Thumbnail */}
      <div style={{
        background: "#F0F0EA", borderRadius: 4, padding: "16px 14px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 8, minHeight: 60,
      }}>
        {mentionedTools.slice(0, 4).map((tool) => (
          <div
            key={tool.id}
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #DADAD4", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <ToolLogo tool={tool} size={20} className="rounded" />
          </div>
        ))}
        {mentionedTools.length > 4 && (
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, color: "#6F6F68" }}>+{mentionedTools.length - 4}</span>
        )}
        {mentionedTools.length === 0 && (
          <BookOpen style={{ width: 22, height: 22, color: "#ADADAD" }} />
        )}
      </div>

      <span className="ec-label">{post.category || "GUIDE"}</span>
      <div
        className="ec-title"
        style={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {post.title}
      </div>
      <p className="ec-text" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.excerpt}
      </p>
      <hr className="ec-divider" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14 }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "#6F6F68", display: "flex", alignItems: "center", gap: 4 }}>
          <Clock style={{ width: 11, height: 11 }} /> {post.readTime}
        </span>
        <span className="ec-cta" style={{ marginTop: 0 }}>
          Lire <ArrowRight className="ec-cta-arrow" style={{ width: 13, height: 13 }} />
        </span>
      </div>
    </Link>
  );
}

/* ── Loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col md:flex-row">
          <div className="h-40 bg-muted md:w-72" />
          <div className="flex-1 p-8 space-y-4">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-3/4 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-28 bg-muted" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuidesPage;
