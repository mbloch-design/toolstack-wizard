import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useState, useMemo, useEffect } from "react";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";
import { useArticleTools, getArticleGradient } from "@/hooks/useArticleTools";
import { ToolLogoStrip } from "@/components/ToolMentionedCard";
import PageHero from "@/components/PageHero";
import { setSeoTags, cleanupSeo } from "@/lib/seo";
import PersonaGuidesSection from "@/components/PersonaGuidesSection";
import type { Tool } from "@/data/types";
import { getToolDomain } from "@/lib/toolUtils";

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
      <PageHero
        breadcrumb={[{ label: t("Guides", "Guides") }]}
        eyebrow={t("Ressources", "Resources")}
        icon={<BookOpen className="h-3.5 w-3.5" />}
        title={t("Guides & Comparatifs", "Guides & Comparisons")}
        description={t(
          "Analyses approfondies, comparatifs détaillés et conseils pratiques pour construire une stack d'outils plus légère.",
          "In-depth analyses, detailed comparisons and practical advice to build a leaner tool stack."
        )}
      >
          {allCategories.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  !activeCategory
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {t("Tous", "All")}
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
      </PageHero>

      {/* Persona pillar guides */}
      <PersonaGuidesSection lang={lang} />

      {/* Content */}
      <section className="container mx-auto max-w-7xl px-4 py-12">
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
  const gradient = getArticleGradient(post.slug, post.category);

  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="surface-card-hover group relative block overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex flex-col gap-6 md:flex-row">
        {/* Visual banner */}
        <div className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} p-8 md:w-72 md:shrink-0`}>
          {mentionedTools.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {mentionedTools.slice(0, 6).map((tool) => (
                <div
                  key={tool.id}
                  className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${getToolDomain(tool)}&sz=64`}
                    alt={tool.name}
                    className="h-8 w-8 rounded-md object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card/50 backdrop-blur-sm">
              <BookOpen className="h-12 w-12 text-primary/30" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 p-6 md:py-8 md:pr-8 md:pl-0">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {post.category && (
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                {post.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readTime}
            </span>
            <span>{post.date}</span>
          </div>
          <h2 className="mt-4 group-hover:text-primary transition-colors duration-150" style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.25 }}>
            {post.title}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>

          {/* Tool logos strip */}
          {mentionedTools.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <ToolLogoStrip tools={mentionedTools} maxDisplay={5} />
              <span className="text-xs text-muted-foreground">
                {mentionedTools.length} {mentionedTools.length > 1 ? "outils" : "outil"}
              </span>
            </div>
          )}

          <div className="mt-5 inline-flex items-center gap-2 font-semibold text-primary text-sm">
            {t("Lire l'article", "Read article")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Article card ── */
function ArticleCard({ post, prefix, tools }: { post: Post; prefix: string; tools: Tool[] }) {
  const mentionedTools = useArticleTools(post, tools);
  const gradient = getArticleGradient(post.slug, post.category);

  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="surface-card-hover group flex flex-col overflow-hidden"
    >
      {/* Visual thumbnail */}
      <div className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} px-4 py-6`}>
        {mentionedTools.length > 0 ? (
          <div className="flex items-center gap-2">
            {mentionedTools.slice(0, 4).map((tool) => (
              <div
                key={tool.id}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getToolDomain(tool)}&sz=64`}
                  alt={tool.name}
                  className="h-6 w-6 rounded object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ))}
            {mentionedTools.length > 4 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card/60 text-xs font-bold text-muted-foreground backdrop-blur-sm">
                +{mentionedTools.length - 4}
              </div>
            )}
          </div>
        ) : (
          <BookOpen className="h-8 w-8 text-primary/25" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.category && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
              {post.category}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {post.readTime}
          </span>
        </div>
        <h3 className="mt-3 text-base font-semibold tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {post.excerpt}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
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
