import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePostBySlug, usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useEffect, useState, useMemo } from "react";
import { ArrowRight, Clock, Tag, ChevronUp, Wrench, Link2, Check } from "lucide-react";
import { useArticleTools, getArticleGradient } from "@/hooks/useArticleTools";
import { ToolMentionedCard } from "@/components/ToolMentionedCard";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";

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
    const seoTitle = post.seo?.metaTitle || `${post.title} — ToolTrim`;
    const seoDesc = post.seo?.metaDescription || post.excerpt;
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

    return () => cleanupSeo(["article-jsonld"]);
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

  const gradient = getArticleGradient(post.slug, post.category);
  const htmlContent = markdownToHtml(post.content, toc, post.title);

  return (
    <>
      {/* Reading progress */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted">
        <div className="h-full bg-primary transition-[width] duration-150 ease-out" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Hero banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,transparent_0%,hsl(var(--background))_70%)]" />
        <div className="container mx-auto max-w-4xl px-4 relative">
          <div className="flex items-center justify-center py-10 md:py-14">
            {mentionedTools.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {mentionedTools.slice(0, 6).map((tool) => (
                  <div key={tool.id} className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/50 bg-card/90 shadow-md backdrop-blur-sm md:h-16 md:w-16">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getToolDomain(tool)}&sz=128`}
                      alt={tool.name}
                      className="h-8 w-8 rounded-lg object-contain md:h-9 md:w-9"
                      loading="lazy"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                        el.parentElement!.innerHTML = `<span class="text-base font-bold text-muted-foreground">${tool.name.charAt(0)}</span>`;
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-card/50 backdrop-blur-sm">
                <Wrench className="h-8 w-8 text-primary/30" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto max-w-4xl px-4 pb-8 pt-6">
          {/* Breadcrumb */}
          <div className="mb-5">
            <Breadcrumb items={[
              { label: t("Guides", "Guides"), href: `${prefix}/guides` },
              { label: post.title },
            ]} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {post.category && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{post.category}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readTime}</span>
            <span>{post.date}</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tighter md:text-4xl lg:text-[2.75rem]">
            {post.title}
          </h1>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>

          {/* Tags + Share */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1 text-xs text-muted-foreground">
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
      </header>

      {/* Body */}
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="flex gap-10">
          {/* Sidebar: compact TOC + tools */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-16 space-y-6">
              {compactToc.length > 1 && (
                <nav>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {t("Sommaire", "Contents")}
                  </p>
                  <ul className="space-y-0.5 border-l border-border">
                    {compactToc.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="block border-l-2 border-transparent py-0.5 pl-3 text-[13px] leading-snug text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {mentionedTools.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1">
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
            {/* Mobile tools */}
            {mentionedTools.length > 0 && (
              <div className="mb-6 lg:hidden">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1">
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
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tighter prose-headings:scroll-mt-20
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
                prose-h3:text-xl prose-h3:mt-7 prose-h3:mb-2
                prose-p:leading-[1.75] prose-p:text-foreground/90
                prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-4 prose-li:leading-relaxed
                prose-table:text-sm prose-table:border prose-table:border-border
                prose-th:bg-secondary prose-th:px-4 prose-th:py-2
                prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border
                prose-blockquote:border-primary prose-blockquote:bg-accent/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                prose-hr:border-border prose-hr:my-8
                prose-img:rounded-xl prose-img:shadow-md
                prose-code:text-primary prose-code:bg-accent/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Share bottom */}
            <div className="mt-10 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
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

/* ── Helpers ── */
function getToolDomain(tool: { websiteUrl?: string; affiliateLink: string }): string {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return "";
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", ""); }
  catch { return ""; }
}

function markdownToHtml(md: string, toc: { id: string; level: number; text: string }[], articleTitle: string): string {
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
  return html;
}

export default GuideDetailPage;
