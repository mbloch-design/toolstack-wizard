import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePostBySlug, usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useEffect, useState, useMemo } from "react";
import { ArrowRight, BookOpen, Clock, List, Tag, ChevronUp, Wrench, Link2, Check } from "lucide-react";
import { useArticleTools, getArticleGradient } from "@/hooks/useArticleTools";
import { ToolMentionedCard } from "@/components/ToolMentionedCard";
import ToolLogo from "@/components/ToolLogo";
import PageHero from "@/components/PageHero";
import { setSeoTags, setMeta, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import DOMPurify from "dompurify";

const GuideDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t, prefix } = useLang();
  const { post, loading } = usePostBySlug(slug, lang);
  const { posts: allPosts } = usePosts(lang);
  const { tools } = useTools();
  const mentionedTools = useArticleTools(post, tools);
  const [readProgress, setReadProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // SEO
  useEffect(() => {
    if (!post) return;
    const fallbackDesc = lang === "fr"
      ? `Guide ToolTrim — ${post.title}. Prix vérifiés, outils testés, sans affiliation.`
      : `ToolTrim guide — ${post.title}. Verified pricing, tested tools, no affiliate bias.`;
    const seoTitle = post.seo?.metaTitle || `${post.title} | ToolTrim`;
    const rawDesc = post.seo?.metaDescription || post.excerpt || fallbackDesc;
    const seoDesc = rawDesc.length > 155 ? rawDesc.slice(0, 152).trimEnd() + "…" : rawDesc;
    const canonicalUrl = `https://tooltrim.com/${lang}/guide/${post.slug}`;

    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, type: "article" });
    setHreflang(`/${lang}/guide/${post.slug}`);
    setMeta("article:published_time", post.date || "");

    setJsonLd("article-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: seoDesc,
      datePublished: post.date,
      url: canonicalUrl,
      author: { "@type": "Organization", name: "ToolTrim" },
      publisher: { "@type": "Organization", name: "ToolTrim" },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
      ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
    });

    // FAQPage JSON-LD when post.faq is provided
    const faqList = (post as Post & { faq?: { question: string; answer: string }[] }).faq;
    if (faqList && faqList.length > 0) {
      setJsonLd("article-faq-jsonld", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqList.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }

    return () => cleanupSeo(["article-jsonld", "article-faq-jsonld"]);
  }, [post, lang]);

  // TOC: only H2s for compact view
  const toc = useMemo(() => {
    if (!post?.content) return [];
    const matches = [...post.content.matchAll(/^(#{2,3}) (.+)$/gm)];
    return matches.map((m, i) => ({
      id: `heading-${i}`,
      level: m[1].length as 2 | 3,
      text: m[2],
    }));
  }, [post?.content]);

  // Only show H2s in sidebar for compact TOC
  const compactToc = useMemo(() => toc.filter((item) => item.level === 2), [toc]);

  useEffect(() => {
    if (compactToc.length === 0) return;
    setActiveHeading((current) => current || compactToc[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveHeading(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] },
    );

    compactToc.forEach((item) => {
      const heading = document.getElementById(item.id);
      if (heading) observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [compactToc]);

  const relatedPosts = useMemo(() => {
    if (!post || allPosts.length === 0) return [];
    return allPosts
      .filter((p) => p.slug !== post.slug)
      .map((p) => {
        let score = 0;
        if (p.category === post.category) score += 3;
        const sharedTags = (p.tags || []).filter((tag) => (post.tags || []).includes(tag));
        score += sharedTags.length;
        return { post: p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r) => r.post);
  }, [post, allPosts]);

  // Build tool name → internal URL map for auto-linking
  const toolLinkMap = useMemo(() => {
    const map = new Map<string, string>();
    tools.forEach(t => {
      if (t.name.length >= 3) {
        map.set(t.name, `/${lang}/tool/${t.slug || t.id}`);
      }
    });
    return map;
  }, [tools, lang]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post?.title || "");
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank", "noopener");
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener");
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-48 w-full rounded-2xl bg-muted" />
          <div className="h-10 w-3/4 rounded bg-muted" />
          <div className="h-5 w-1/2 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t("Article introuvable", "Article not found")}</h1>
        <Link to={`${prefix}/guides`} className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
          {t("Retour aux guides", "Back to guides")}
        </Link>
      </div>
    );
  }

  const htmlContent = markdownToHtml(post.content, toc, post.title, toolLinkMap);

  return (
    <>
      {/* Reading progress */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted">
        <div className="h-full bg-primary transition-[width] duration-150 ease-out" style={{ width: `${readProgress}%` }} />
      </div>

      <PageHero
        breadcrumb={[
          { label: t("Guides", "Guides"), href: `${prefix}/guides` },
          { label: post.title },
        ]}
        eyebrow={post.category || t("Guide", "Guide")}
        icon={<BookOpen className="h-3.5 w-3.5" />}
        title={post.title}
        description={post.excerpt}
        maxWidth="article"
      >
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">{post.date}</span>
          </div>

          {mentionedTools.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Dans ce guide", "In this guide")}
              </span>
              {mentionedTools.slice(0, 6).map((tool) => (
                <Link
                  key={tool.id}
                  to={`${prefix}/tool/${tool.slug || tool.id}`}
                  className="group inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-2.5 pr-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card">
                    <ToolLogo tool={tool} size={18} />
                  </span>
                  <span>{tool.name}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
            )}
            <ShareButtons
              copied={copied}
              onCopy={handleCopyLink}
              onTwitter={handleShareTwitter}
              onLinkedIn={handleShareLinkedIn}
              t={t}
            />
          </div>
        </div>
      </PageHero>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-center xl:grid-cols-[240px_minmax(0,780px)]">
          {/* Sidebar: compact TOC + tools */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-8">
              {compactToc.length > 1 && (
                <nav>
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                      <List className="h-3.5 w-3.5" />
                      {t("Lecture", "Reading")}
                    </p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${readProgress}%` }} />
                    </div>
                  </div>

                  <ul className="relative mt-5 space-y-1 before:absolute before:left-[4.5px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                    {compactToc.map((item) => (
                      <li key={item.id} className="relative">
                        <a
                          href={`#${item.id}`}
                          aria-current={activeHeading === item.id ? "location" : undefined}
                          className={`group flex gap-3 rounded-md py-2 pl-5 pr-2 text-[13px] leading-snug transition-colors ${
                            activeHeading === item.id
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span
                            className={`absolute left-0 top-3.5 z-10 h-2.5 w-2.5 rounded-full border transition-all ${
                              activeHeading === item.id
                                ? "border-primary bg-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.10)]"
                                : "border-border bg-background group-hover:border-primary/50"
                            }`}
                          />
                          <span>{item.text}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {mentionedTools.length > 0 && (
                <div>
                  <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                    <Wrench className="h-3 w-3" />
                    {t("Outils", "Tools")}
                  </p>
                  <div className="space-y-1.5">
                    {mentionedTools.slice(0, 5).map((tool) => (
                      <ToolMentionedCard key={tool.id} tool={tool} prefix={prefix} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Article */}
          <article className="min-w-0 flex-1">
            {compactToc.length > 1 && (
              <nav className="mb-6 rounded-lg border border-border bg-card p-4 lg:hidden">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {t("Sommaire", "Contents")}
                </p>
                <div className="flex snap-x gap-2 overflow-x-auto pb-1">
                  {compactToc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="snap-start whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </nav>
            )}

            {/* Mobile tools */}
            {mentionedTools.length > 0 && (
              <div className="mb-6 lg:hidden">
                <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <Wrench className="h-3 w-3" />{t("Outils mentionnés", "Tools mentioned")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {mentionedTools.slice(0, 5).map((tool) => (
                    <ToolMentionedCard key={tool.id} tool={tool} prefix={prefix} compact />
                  ))}
                </div>
              </div>
            )}

            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-[17px]
                prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
                prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl prose-h2:leading-tight md:prose-h2:text-[1.85rem]
                prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl
                prose-h4:mt-6 prose-h4:text-base prose-h4:font-semibold
                prose-p:my-5 prose-p:leading-[1.82] prose-p:text-foreground/90
                prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-5 prose-ol:my-5 prose-li:my-1.5 prose-li:leading-[1.75]
                prose-table:text-sm prose-table:border prose-table:border-border
                prose-th:bg-secondary prose-th:px-4 prose-th:py-2
                prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border
                prose-blockquote:my-8 prose-blockquote:rounded-lg prose-blockquote:border prose-blockquote:border-primary/20 prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-1 prose-blockquote:not-italic
                prose-hr:border-border prose-hr:my-10
                prose-img:rounded-xl prose-img:shadow-md
                prose-code:text-primary prose-code:bg-accent/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
            />

            {/* Share bottom */}
            <div className="mt-12 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-medium text-muted-foreground">{t("Cet article vous a été utile ?", "Found this useful?")}</span>
              <div className="ml-auto">
                <ShareButtons
                  copied={copied}
                  onCopy={handleCopyLink}
                  onTwitter={handleShareTwitter}
                  onLinkedIn={handleShareLinkedIn}
                  t={t}
                  showLabel
                />
              </div>
            </div>

            {/* Mentioned tools — full cards */}
            {mentionedTools.length > 0 && (
              <section className="mt-14 rounded-lg border border-border bg-card p-5 md:p-6">
                <h2 className="font-display text-xl font-bold tracking-tight">
                  {t("Outils mentionnés dans cet article", "Tools mentioned in this article")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("Consultez la fiche complète de chaque outil pour un avis détaillé.", "See the full review of each tool for a detailed verdict.")}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {mentionedTools.slice(0, 6).map((tool) => (
                    <ToolMentionedCard key={tool.id} tool={tool} prefix={prefix} />
                  ))}
                </div>
              </section>
            )}

            {/* CTA diagnostic */}
            <div className="mt-10 flex flex-col gap-4 rounded-lg border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">{t("Analysez votre stack complète", "Analyze your full stack")}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t("Diagnostic gratuit en 3 minutes — recommandations personnalisées.", "Free 3-minute diagnostic — personalized recommendations.")}</p>
              </div>
              <Link to={`${prefix}/diagnostic`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors shrink-0">
                {t("Lancer le diagnostic", "Start diagnostic")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Related */}
            {relatedPosts.length > 0 && (
              <section className="mt-14">
                <h2 className="text-xl font-bold tracking-tighter mb-5">{t("Articles connexes", "Related articles")}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((rp) => (
                    <RelatedCard key={rp.slug} post={rp} prefix={prefix} tools={tools} />
                  ))}
                </div>
              </section>
            )}

            <div className="mt-10 border-t border-border pt-6">
              <Link to={`${prefix}/guides`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                ← {t("Tous les guides", "All guides")}
              </Link>
            </div>
          </article>
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

/* ── Share buttons ── */
function ShareButtons({ copied, onCopy, onTwitter, onLinkedIn, t, showLabel }: {
  copied: boolean; onCopy: () => void; onTwitter: () => void; onLinkedIn: () => void;
  t: (fr: string, en: string) => string; showLabel?: boolean;
}) {
  const btnClass = "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:border-primary/30 hover:text-primary";
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <button onClick={onCopy} className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? t("Copié", "Copied") : t("Copier", "Copy")}
        </button>
      )}
      {!showLabel && (
        <button onClick={onCopy} className={btnClass} title={t("Copier le lien", "Copy link")}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
        </button>
      )}
      <button onClick={onTwitter} className={btnClass} title="X">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </button>
      <button onClick={onLinkedIn} className={btnClass} title="LinkedIn">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </button>
    </div>
  );
}

/* ── Related card ── */
function RelatedCard({ post, prefix, tools }: { post: Post; prefix: string; tools: import("@/data/types").Tool[] }) {
  const mentionedTools = useArticleTools(post, tools);
  const gradient = getArticleGradient(post.slug, post.category);

  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} px-3 py-3`}>
        {mentionedTools.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {mentionedTools.slice(0, 3).map((tool) => (
              <div key={tool.id} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm">
                <ToolLogo tool={tool} size={18} />
              </div>
            ))}
          </div>
        ) : (
          <Wrench className="h-5 w-5 text-primary/25" />
        )}
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {post.category && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{post.category}</span>}
          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {post.readTime}</span>
        </div>
        <h3 className="mt-2 text-sm font-bold tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

function markdownToHtml(md: string, toc: { id: string; level: number; text: string }[], articleTitle: string, toolMap?: Map<string, string>): string {
  let html = md;
  let tocIndex = 0;

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_m, header, _s, body) => {
    const hs = header.split("|").filter((c: string) => c.trim());
    const rows = body.trim().split("\n").map((r: string) => r.split("|").filter((c: string) => c.trim()));
    return `<div class="overflow-x-auto rounded-lg border border-border my-6"><table><thead><tr>${hs.map((h: string) => `<th>${h.trim()}</th>`).join("")}</tr></thead><tbody>${rows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${c.trim()}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  });
  html = html.replace(/^(#{2,3}) (.+)$/gm, (_m, h, text) => {
    const level = h.length;
    const id = toc[tocIndex]?.id || `heading-${tocIndex}`;
    tocIndex++;
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^# (.+)$/gm, (_m, text) => {
    if (text.trim().toLowerCase() === articleTitle.trim().toLowerCase()) return "";
    return `<h1>${text}</h1>`;
  });
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  html = html.replace(/- ☐ (.+)/g, '<li class="list-none">☐ $1</li>');
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/^(?!<[a-z/]|$)(.+)$/gm, "<p>$1</p>");
  html = html.replace(/<p>\s*<\/p>/g, "");

  // Auto-link tool names (only first occurrence per tool, skip already-linked text)
  if (toolMap && toolMap.size > 0) {
    const linked = new Set<string>();
    toolMap.forEach((slug, name) => {
      if (linked.has(name)) return;
      // Only match tool name NOT already inside an <a> tag or href
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?<!<[^>]*)\\b(${escaped})\\b(?![^<]*<\\/a>)`, "i");
      const match = html.match(regex);
      if (match) {
        html = html.replace(regex, `<a href="${slug}" class="text-primary underline underline-offset-2">${match[1]}</a>`);
        linked.add(name);
      }
    });
  }

  return html;
}

export default GuideDetailPage;
