import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts, type Post } from "@/hooks/useSupabaseData";
import { useState, useMemo } from "react";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";

const GuidesPage = () => {
  const { lang, t, prefix } = useLang();
  const { posts, loading } = usePosts(lang);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
      {/* Hero header */}
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container mx-auto max-w-6xl px-4 pb-10 pt-16 md:pt-20">
          <div className="flex items-center gap-2 text-primary mb-4">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {t("Ressources", "Resources")}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter md:text-5xl">
            {t("Guides & Comparatifs", "Guides & Comparisons")}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t(
              "Analyses approfondies, comparatifs détaillés et conseils pratiques pour construire la stack d'outils parfaite.",
              "In-depth analyses, detailed comparisons and practical advice to build the perfect tool stack."
            )}
          </p>

          {/* Category filter pills */}
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
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto max-w-6xl px-4 py-12">
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            {t("Aucun article pour le moment.", "No articles yet.")}
          </p>
        ) : (
          <>
            {/* Featured article */}
            {featured && <FeaturedCard post={featured} prefix={prefix} t={t} />}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <ArticleCard key={post.slug} post={post} prefix={prefix} />
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
}: {
  post: Post;
  prefix: string;
  t: (fr: string, en: string) => string;
}) {
  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
        {/* Left: text */}
        <div className="flex-1">
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
          <h2 className="mt-4 text-2xl font-bold tracking-tighter leading-tight md:text-3xl group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-6 inline-flex items-center gap-2 font-semibold text-primary text-sm">
            {t("Lire l'article", "Read article")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Right: decorative element */}
        <div className="hidden md:flex shrink-0 items-center justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Article card ── */
function ArticleCard({ post, prefix }: { post: Post; prefix: string }) {
  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
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
      <h3 className="mt-3 text-base font-bold tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
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
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

/* ── Loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse rounded-2xl border border-border bg-card p-8">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-4 h-8 w-3/4 rounded bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="mt-3 h-5 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-4 w-full rounded bg-muted" />
            <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuidesPage;
