import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts } from "@/hooks/useSupabaseData";

const GuidesPage = () => {
  const { lang, t, prefix } = useLang();
  const { posts, loading } = usePosts(lang);

  return (
    <div className="py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tighter">{t("Guides & Comparatifs", "Guides & Comparisons")}</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">{t("Conseils pratiques pour optimiser votre stack d'outils.", "Practical tips to optimize your tool stack.")}</p>

        {loading ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="mt-2 h-5 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-4 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`${prefix}/guide/${post.slug}`}
                className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div>
                  <p className="text-xs text-muted-foreground">
                    {post.date} · {post.readTime} · {post.category}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tighter group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {posts.length === 0 && (
              <p className="text-muted-foreground">{t("Aucun article pour le moment.", "No articles yet.")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidesPage;
