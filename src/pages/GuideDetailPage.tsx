import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import { useLang } from "@/hooks/useLang";
import { usePostBySlug, type Post } from "@/hooks/useSupabaseData";
import { Check, Clock, Link2 } from "@/lib/icons";
import { buildGuideToc, renderGuideMarkdown, type GuideTocItem } from "@/lib/guideMarkdown";
import { cleanupSeo, setHreflang, setJsonLd, setMeta, setSeoTags } from "@/lib/seo";
import { getToolForGuide } from "@/lib/toolGuides";

/**
 * Mostly-static article document. There is deliberately no scroll listener,
 * scroll-spy, catalogue scan or runtime network refresh on this page.
 */
const GuideDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t, prefix } = useLang();
  const { post, loading } = usePostBySlug(slug, lang, { refreshRemote: false });
  const [copied, setCopied] = useState(false);

  const toc = useMemo(() => buildGuideToc(post?.content), [post?.content]);
  // Resolved from the guide's `toolId` through a build-time index, so this
  // stays a static read — the page loads no catalogue at runtime.
  const relatedTool = useMemo(() => getToolForGuide(post?.slug, lang), [post?.slug, lang]);
  const h2Toc = useMemo(() => toc.filter((item) => item.level === 2), [toc]);
  const isStory = post?.category === "Stories";
  const htmlContent = useMemo(() => (
    post
      ? renderGuideMarkdown(post.content, toc, post.title, {
          isStory,
          storyHero: post.thumbnail,
        })
      : ""
  ), [isStory, post, toc]);

  useEffect(() => {
    if (!post) return;
    const fallbackDescription = lang === "fr"
      ? `Guide ToolTrim — ${post.title}. Prix vérifiés, outils testés, sans affiliation.`
      : `ToolTrim guide — ${post.title}. Verified pricing, tested tools, no affiliate bias.`;
    const title = post.seo?.metaTitle || `${post.title} | ToolTrim`;
    const rawDescription = post.seo?.metaDescription || post.excerpt || fallbackDescription;
    const description = rawDescription.length > 155
      ? `${rawDescription.slice(0, 152).trimEnd()}…`
      : rawDescription;
    const canonicalUrl = `https://tooltrim.com/${lang}/guide/${post.slug}`;

    setSeoTags({ title, description, url: canonicalUrl, type: "article" });
    setHreflang(`/${lang}/guide/${post.slug}`);
    setMeta("article:published_time", post.date || "");
    if (post.thumbnail) {
      const image = new URL(post.thumbnail, "https://tooltrim.com").toString();
      setMeta("og:image", image);
      setMeta("twitter:image", image);
    }
    setJsonLd("article-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description,
      datePublished: post.date,
      url: canonicalUrl,
      author: { "@type": "Organization", name: "ToolTrim" },
      publisher: { "@type": "Organization", name: "ToolTrim" },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
      ...(post.thumbnail ? { image: new URL(post.thumbnail, "https://tooltrim.com").toString() } : {}),
      ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
    });

    const faq = (post as Post & { faq?: { question: string; answer: string }[] }).faq;
    if (faq?.length) {
      setJsonLd("article-faq-jsonld", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      });
    }
    return () => cleanupSeo(["article-jsonld", "article-faq-jsonld"]);
  }, [lang, post]);

  useEffect(() => {
    if (loading || post) return;
    document.title = lang === "fr" ? "Article introuvable - ToolTrim" : "Article not found - ToolTrim";
    setMeta("robots", "noindex, nofollow");
    return () => {
      document.querySelector<HTMLMetaElement>('meta[name="robots"][content*="noindex"]')?.remove();
    };
  }, [lang, loading, post]);

  if (loading) return <GuideLoadingState />;
  if (!post) {
    return (
      <div className="ga-not-found">
        <h1>{t("Article introuvable", "Article not found")}</h1>
        <Link to={`${prefix}/guides`}>← {t("Retour aux guides", "Back to guides")}</Link>
      </div>
    );
  }

  const formattedDate = post.date
    ? new Date(`${post.date}T12:00:00`).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={isStory ? "ga-page ga-page--story" : "ga-page"}>
      <header className={`ga-header${isStory ? " ga-header--story" : ""}`}>
        <div className="ga-container">
          <div className="ga-hero-main">
            <Breadcrumb
              items={[
                { label: t("Guides", "Guides"), href: `${prefix}/guides` },
                { label: post.title },
              ]}
              includeSchema={false}
            />
            <div className="ga-eyebrow-row">
              {formattedDate ? (
                <time className="ga-eyebrow-item" dateTime={post.date}>
                  {isStory ? formattedDate : `${lang === "fr" ? "Mis à jour le" : "Updated"} ${formattedDate}`}
                </time>
              ) : null}
              {post.category ? <span className="ga-eyebrow-item">{post.category}</span> : null}
              {post.readTime ? (
                <span className="ga-eyebrow-item ga-eyebrow-time">
                  <Clock aria-hidden="true" />
                  {post.readTime}
                </span>
              ) : null}
            </div>
            <h1 className="ga-title">{post.title}</h1>
            {post.excerpt ? <p className="ga-standfirst">{post.excerpt}</p> : null}
          </div>
        </div>
      </header>

      {isStory && post.thumbnail ? (
        <figure className="ga-story-hero-media"><img src={post.thumbnail} alt={post.title} /></figure>
      ) : null}

      <main className={`ga-body-outer${isStory ? " ga-body-outer--story" : ""}`}>
        <div className={`ga-body-grid${isStory ? " ga-body-grid--story" : ""}`}>
          <article>
            {!isStory && h2Toc.length > 1 ? (
              <MobileTableOfContents items={h2Toc} label={t("Sommaire", "Contents") as string} />
            ) : null}

            <div className="ga-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />

            {relatedTool ? (
              <aside className="ga-tool-link">
                <p className="ga-tool-link-label">
                  {t("L’outil de ce guide", "The tool covered here")}
                </p>
                <p className="ga-tool-link-name">{relatedTool.name}</p>
                <div className="ga-tool-link-actions">
                  <Link to={`${prefix}/tool/${relatedTool.slug}`}>
                    {t(`Fiche ${relatedTool.name}`, `${relatedTool.name} overview`)}
                  </Link>
                  {relatedTool.hasPricing ? (
                    <Link to={`${prefix}/tool/${relatedTool.slug}${lang === "en" ? "/pricing" : "/prix"}`}>
                      {t(`Prix de ${relatedTool.name}`, `${relatedTool.name} pricing`)}
                    </Link>
                  ) : null}
                </div>
              </aside>
            ) : null}

            <div className={`ga-share-row${isStory ? " ga-share-row--story" : ""}`}>
              <span className="ga-share-label">{t("Cet article vous a été utile ?", "Found this useful?")}</span>
              <button type="button" onClick={copyLink} className="ga-share-btn" aria-label={t("Copier le lien", "Copy link") as string}>
                {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
              </button>
            </div>

            <div className={isStory ? "ga-story-back" : "ga-article-back"}>
              <Link to={`${prefix}/guides`}>← {t("Tous les guides", "All guides")}</Link>
            </div>
          </article>

          {!isStory && h2Toc.length > 1 ? (
            <DesktopTableOfContents items={h2Toc} label={t("Sommaire", "Contents") as string} />
          ) : null}
        </div>
      </main>
    </div>
  );
};

function MobileTableOfContents({ items, label }: { items: GuideTocItem[]; label: string }) {
  return (
    <details className="ga-mobile-toc">
      <summary className="ga-mobile-toc-summary">
        <span>{label}</span>
        <span className="ga-mobile-toc-count">{items.length} sections</span>
      </summary>
      <nav className="ga-mobile-toc-list" aria-label={label}>
        {items.map((item) => <a key={item.id} href={`#${item.id}`} className="ga-mobile-toc-link">{item.text}</a>)}
      </nav>
    </details>
  );
}

function DesktopTableOfContents({ items, label }: { items: GuideTocItem[]; label: string }) {
  return (
    <aside className="ga-toc-col">
      <p className="ga-toc-label">{label}</p>
      <nav className="ga-toc-nav" aria-label={label}>
        {items.map((item) => <a key={item.id} href={`#${item.id}`} className="ga-toc-link">{item.text}</a>)}
      </nav>
    </aside>
  );
}

function GuideLoadingState() {
  return (
    <div className="ga-loading" role="status" aria-label="Loading article">
      <div className="ga-loading-line ga-loading-line--meta" />
      <div className="ga-loading-line ga-loading-line--title" />
      <div className="ga-loading-line ga-loading-line--copy" />
    </div>
  );
}

export default GuideDetailPage;
