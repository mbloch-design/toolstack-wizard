import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { blogPosts } from "@/data/content";

const GuidesPage = () => {
  const { t, prefix } = useLang();

  return (
    <div className="py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold">{t("Guides & Comparatifs", "Guides & Comparisons")}</h1>
        <p className="mt-2 text-muted-foreground">{t("Conseils pratiques pour optimiser votre stack d'outils.", "Practical tips to optimize your tool stack.")}</p>

        <div className="mt-8 space-y-4">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`${prefix}/guide/${post.slug}`}
              className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{post.date} · {post.readingTime} min · {post.category}</p>
                  <h2 className="mt-1 font-heading text-lg font-semibold group-hover:text-primary">{t(post.title, post.titleEn || post.title)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(post.excerpt, post.excerptEn || post.excerpt)}</p>
                  <div className="mt-2 flex gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidesPage;
