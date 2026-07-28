import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts } from "@/hooks/useSupabaseData";
import { cleanupSeo, setHreflang, setSeoTags } from "@/lib/seo";

export default function StoriesPage() {
  const { lang, prefix, t } = useLang();
  const { posts, loading } = usePosts(lang);
  const stories = posts
    .filter((post) => post.category === "Stories")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  useEffect(() => {
    const title = t("Stories | ToolTrim", "Stories | ToolTrim");
    const description = t(
      "Des portraits sur les indépendants, leurs outils et les nouvelles manières de travailler.",
      "Portraits of independent workers, their tools, and new ways of working.",
    );
    const url = `https://tooltrim.com/${lang}/stories`;
    setSeoTags({ title, description, url });
    setHreflang(`/${lang}/stories`);
    return () => cleanupSeo([]);
  }, [lang, t]);

  return (
    <div className="st-page">
      <header className="st-hero">
        <div className="st-container">
          <p className="st-kicker">ToolTrim Stories</p>
          <h1 className="st-title">
            {t(
              "Celles et ceux qui inventent de nouvelles manières de travailler.",
              "The people inventing new ways to work.",
            )}
          </h1>
          <p className="st-intro">
            {t(
              "Des portraits documentaires sur les indépendants, leurs choix, leurs outils et les idées qui transforment leur métier.",
              "Documentary portraits about independent workers, their choices, their tools, and the ideas reshaping their craft.",
            )}
          </p>
          <p className="st-disclosure">
            {t(
              "La série débute avec des portraits fictifs signalés comme tels. Les prochaines Stories donneront la parole à de vrais indépendants.",
              "The series begins with fictional portraits clearly identified as such. Future Stories will feature real independent workers.",
            )}
          </p>
        </div>
      </header>

      <main className="st-main">
        <div className="st-container">
          {loading ? (
            <div className="st-loading" aria-label={t("Chargement", "Loading")} />
          ) : stories.length === 0 ? (
            <p className="st-empty">
              {t(
                "La première Story arrive bientôt.",
                "The first Story is coming soon.",
              )}
            </p>
          ) : (
            <div className="st-list">
              {stories.map((story, index) => (
                <Link
                  key={story.slug}
                  to={`${prefix}/story/${story.slug}`}
                  className={`st-card${index === 0 ? " st-card--lead" : ""}`}
                >
                  <div className="st-card-media">
                    {story.thumbnail ? (
                      <img
                        src={story.thumbnail}
                        alt=""
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    ) : (
                      <div className="st-card-placeholder" />
                    )}
                  </div>
                  <div className="st-card-copy">
                    <div className="st-card-meta">
                      <span>Story</span>
                      {story.date && (
                        <time dateTime={story.date}>
                          {new Date(story.date).toLocaleDateString(
                            lang === "fr" ? "fr-FR" : "en-US",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </time>
                      )}
                    </div>
                    <h2 className="st-card-title">{story.title}</h2>
                    <p className="st-card-excerpt">{story.excerpt}</p>
                    <span className="st-card-link">
                      {t("Lire la Story", "Read the Story")}
                      <ArrowUpRight aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
