import { useEffect, useMemo, useState } from "react";
import { fitBrandedTitle } from "@/lib/seoTitle";
import { Link, useParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import { useLang } from "@/hooks/useLang";
import { localizeGuideCategory } from "@/lib/guideCategory";
import { usePostBySlug, type Post } from "@/hooks/useSupabaseData";
import { Check, Clock, Link2, Linkedin, X as XIcon } from "@/lib/icons";
import { buildGuideToc, renderGuideMarkdown, type GuideTocItem } from "@/lib/guideMarkdown";
import { cleanupSeo, setHreflang, setJsonLd, setMeta, setSeoTags } from "@/lib/seo";
import { getRelatedGuides, getToolForGuide, getToolsForGuide } from "@/lib/toolGuides";
import ToolLogo from "@/components/ToolLogo";
import brandColors from "@/data/brandColors.json";
import GuideCover from "@/components/guide/GuideCover";
import { smartQuotes } from "@/lib/typography";
import { ChevronRight } from "@/lib/icons";

/**
 * Mostly-static article document. There is deliberately no scroll listener,
 * scroll-spy, catalogue scan or runtime network refresh on this page.
 */
// Brand fallback when a guide has no dedicated hero image supplied — the
// same gradient asset the homepage hero already uses, so a guide without
// custom art still gets a real, on-brand visual instead of an empty column.
const DEFAULT_HERO_IMAGE = "/hero/hero-gradient-1800.webp";

const GuideDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t, prefix } = useLang();
  const { post, loading } = usePostBySlug(slug, lang, { refreshRemote: false });
  const [copied, setCopied] = useState(false);

  const toc = useMemo(() => buildGuideToc(post?.content), [post?.content]);
  // Resolved from the guide's `toolId` through a build-time index, so this
  // stays a static read — the page loads no catalogue at runtime.
  const relatedTool = useMemo(() => getToolForGuide(post?.slug, lang), [post?.slug, lang]);
  const coveredTools = useMemo(() => getToolsForGuide(post?.slug, lang), [post?.slug, lang]);
  const relatedGuides = useMemo(() => getRelatedGuides(post?.slug, lang), [post?.slug, lang]);
  const h2Toc = useMemo(() => toc.filter((item) => item.level === 2), [toc]);

  // Scroll-spy: same approach as MethodologyPage/TransparencyPage, but
  // driven by the dynamic h2Toc ids parsed from this guide's own markdown
  // instead of a fixed id list.
  const [activeHeading, setActiveHeading] = useState<string>("");
  useEffect(() => {
    if (h2Toc.length === 0) return;
    setActiveHeading((current) => current || h2Toc[0].id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveHeading(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] },
    );
    h2Toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [h2Toc]);
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
    const title = post.seo?.metaTitle || fitBrandedTitle(`${post.title}`);
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
      {/* Reading progress, driven by CSS scroll timelines: no scroll listener. */}
      <div className="ga-progress" aria-hidden="true" />
      <header className={`ga-header${isStory ? " ga-header--story" : ""}`}>
        <div className="ga-container">
          <div className={isStory ? "ga-hero-main" : "ga-hero-split"}>
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
              {post.category ? <span className="ga-eyebrow-item">{localizeGuideCategory(post.category, lang)}</span> : null}
              {post.readTime ? (
                <span className="ga-eyebrow-item ga-eyebrow-time">
                  <Clock aria-hidden="true" />
                  {post.readTime}
                </span>
              ) : null}
            </div>
            <h1 className="ga-title">{smartQuotes(post.title, lang)}</h1>
            {post.excerpt ? <p className="ga-standfirst">{post.excerpt}</p> : null}
            <div className="ga-hero-share">
              <button
                type="button"
                onClick={copyLink}
                className="ga-hero-share-btn"
                aria-label={t("Copier le lien", "Copy link") as string}
              >
                {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://tooltrim.com/${lang}/guide/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ga-hero-share-btn"
                aria-label={t("Partager sur X", "Share on X") as string}
              >
                <XIcon aria-hidden="true" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://tooltrim.com/${lang}/guide/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ga-hero-share-btn"
                aria-label={t("Partager sur LinkedIn", "Share on LinkedIn") as string}
              >
                <Linkedin aria-hidden="true" />
              </a>
            </div>
          </div>
          {!isStory ? (
            <GuideCover
              thumbnail={post.thumbnail}
              tools={coveredTools}
              fallbackImage={DEFAULT_HERO_IMAGE}
              className="ga-hero-image"
              eager
            />
          ) : null}
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
              <MobileTableOfContents items={h2Toc} label={t("Sur cette page", "On this page") as string} />
            ) : null}

            <div className="ga-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />

            {/* Every tool the article covers, App Store rows: icon, name, the
                fiche and its pricing. Built at build time from toolId + tags. */}
            {coveredTools.length > 0 ? (
              <aside className="ga-tools" aria-labelledby="ga-tools-title">
                <h2 id="ga-tools-title" className="ga-tools-title">
                  {coveredTools.length > 1 ? t("Les outils de cet article", "Tools in this article") : t("L’outil de cet article", "The tool in this article")}
                </h2>
                <ul className="ga-tools-list">
                  {coveredTools.map((tool) => (
                    <li key={tool.slug} className="ga-tools-item">
                      <Link to={`${prefix}/tool/${tool.slug}`} className="ga-tools-main">
                        <ToolLogo tool={tool} size={48} className="ga-tools-icon" />
                        <span className="ga-tools-name">{tool.name}</span>
                      </Link>
                      {tool.hasPricing ? (
                        <Link className="ga-tools-price" to={`${prefix}/tool/${tool.slug}${lang === "en" ? "/pricing" : "/prix"}`}>
                          {t("Prix", "Pricing")}
                        </Link>
                      ) : null}
                      <Link className="ga-tools-open" to={`${prefix}/tool/${tool.slug}`} aria-label={t(`Fiche ${tool.name}`, `${tool.name} overview`) as string}>
                        {t("Voir", "View")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : relatedTool ? (
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
              <span className="ga-share-label">{t("Cet article t'a été utile ?", "Found this useful?")}</span>
              <button type="button" onClick={copyLink} className="ga-share-btn" aria-label={t("Copier le lien", "Copy link") as string}>
                {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
              </button>
            </div>

            {/* Not a dead end: three guides sharing the most tags. */}
            {relatedGuides.length > 0 ? (
              <section className="ga-next" aria-labelledby="ga-next-title">
                <div className="ga-next-head">
                  <h2 id="ga-next-title">{t("À lire ensuite", "Keep reading")}</h2>
                  <Link to={`${prefix}/guides`} className="ga-next-all">{t("Tous les guides", "All guides")} <ChevronRight aria-hidden="true" /></Link>
                </div>
                <ul className="ga-next-list">
                  {relatedGuides.map((guide) => (
                    <li key={guide.slug}>
                      <Link to={`${prefix}/guide/${guide.slug}`} className="ga-next-card">
                        {guide.thumbnail || !guide.tool ? (
                          <span className="ga-next-media"><img src={guide.thumbnail || DEFAULT_HERO_IMAGE} alt="" loading="lazy" decoding="async" /></span>
                        ) : (
                          // No cover: the guide's lead tool on its brand tint.
                          <span className="ga-next-media" data-kind="tool" style={(brandColors as Record<string, string>)[guide.tool.slug] ? { background: `color-mix(in srgb, ${(brandColors as Record<string, string>)[guide.tool.slug]} 16%, #FFFFFF)` } : undefined}>
                            <ToolLogo tool={guide.tool} size={72} className="ga-next-tool" />
                          </span>
                        )}
                        <span className="ga-next-copy">
                          {(guide.category || guide.readTime) ? (
                            <span className="ga-next-meta">{[guide.category ? localizeGuideCategory(guide.category, lang) : "", guide.readTime || ""].filter(Boolean).join(" · ")}</span>
                          ) : null}
                          <span className="ga-next-title">{smartQuotes(guide.title, lang)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <div className={isStory ? "ga-story-back" : "ga-article-back"}>
                <Link to={`${prefix}/guides`}>← {t("Tous les guides", "All guides")}</Link>
              </div>
            )}
          </article>

          {!isStory && h2Toc.length > 1 ? (
            <DesktopTableOfContents
              items={h2Toc}
              label={t("Sur cette page", "On this page") as string}
              activeId={activeHeading}
            />
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

function DesktopTableOfContents({ items, label, activeId }: { items: GuideTocItem[]; label: string; activeId: string }) {
  return (
    <aside className="ga-toc-col">
      <p className="ga-toc-label">{label}</p>
      <nav className="ga-toc-nav" aria-label={label}>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`ga-toc-link${item.id === activeId ? " ga-toc-link--active" : ""}`}
          >
            {item.text}
          </a>
        ))}
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
