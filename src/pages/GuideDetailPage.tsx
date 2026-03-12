import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePostBySlug, useTools } from "@/hooks/useSupabaseData";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Clock, Tag, ChevronUp, Wrench } from "lucide-react";
import { useArticleTools, getArticleGradient } from "@/hooks/useArticleTools";
import { ToolMentionedCard } from "@/components/ToolMentionedCard";

const GuideDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t, prefix } = useLang();
  const { post, loading } = usePostBySlug(slug, lang);
  const { tools } = useTools();
  const mentionedTools = useArticleTools(post, tools);
  const [readProgress, setReadProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

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

  const toc = useMemo(() => {
    if (!post?.content) return [];
    const matches = [...post.content.matchAll(/^(#{2,3}) (.+)$/gm)];
    return matches.map((m, i) => ({
      id: `heading-${i}`,
      level: m[1].length as 2 | 3,
      text: m[2],
    }));
  }, [post?.content]);

  if (loading) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20" />
        <div className="container mx-auto max-w-4xl px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-48 w-full rounded-2xl bg-muted" />
            <div className="h-10 w-3/4 rounded bg-muted" />
            <div className="h-5 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t("Article introuvable", "Article not found")}</h1>
        <Link to={`${prefix}/guides`} className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("Retour aux guides", "Back to guides")}
        </Link>
      </div>
    );
  }

  const gradient = getArticleGradient(post.slug, post.category);
  const htmlContent = markdownToHtml(post.content, toc);

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Hero banner with tool logos */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,transparent_0%,hsl(var(--background))_70%)]" />
        <div className="container mx-auto max-w-4xl px-4 relative">
          <div className="flex items-center justify-center py-12 md:py-16">
            {mentionedTools.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-4">
                {mentionedTools.slice(0, 6).map((tool) => (
                  <div
                    key={tool.id}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-card/90 shadow-md backdrop-blur-sm transition-transform hover:scale-105 md:h-20 md:w-20"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getToolDomain(tool)}&sz=128`}
                      alt={tool.name}
                      className="h-9 w-9 rounded-lg object-contain md:h-11 md:w-11"
                      loading="lazy"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                        el.parentElement!.innerHTML = `<span class="text-lg font-bold text-muted-foreground">${tool.name.charAt(0)}</span>`;
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card/50 backdrop-blur-sm">
                <Wrench className="h-10 w-10 text-primary/30" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article header */}
      <header className="border-b border-border">
        <div className="container mx-auto max-w-4xl px-4 pb-10 pt-8">
          <Link
            to={`${prefix}/guides`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Tous les guides", "All guides")}
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {post.category && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {post.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.readTime}
            </span>
            <span>{post.date}</span>
          </div>

          <h1 className="mt-5 text-3xl font-extrabold leading-[1.15] tracking-tighter md:text-4xl lg:text-[2.75rem]">
            {post.title}
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1 text-xs text-muted-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="flex gap-12">
          {/* Sidebar: TOC + Tools */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20 space-y-8">
              {/* Table of contents */}
              {toc.length > 2 && (
                <nav>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {t("Sommaire", "Contents")}
                  </p>
                  <ul className="space-y-1.5 border-l border-border">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={`block border-l-2 border-transparent py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground ${
                            item.level === 2 ? "pl-4 font-medium" : "pl-7 text-xs"
                          }`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {/* Tools mentioned */}
              {mentionedTools.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                    <Wrench className="h-3 w-3" />
                    {t("Outils mentionnés", "Tools mentioned")}
                  </p>
                  <div className="space-y-2">
                    {mentionedTools.slice(0, 6).map((tool) => (
                      <ToolMentionedCard key={tool.id} tool={tool} prefix={prefix} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Article content */}
          <article className="min-w-0 flex-1">
            {/* Mobile tools strip */}
            {mentionedTools.length > 0 && (
              <div className="mb-8 lg:hidden">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Wrench className="h-3 w-3" />
                  {t("Outils mentionnés", "Tools mentioned")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {mentionedTools.slice(0, 6).map((tool) => (
                    <ToolMentionedCard key={tool.id} tool={tool} prefix={prefix} compact />
                  ))}
                </div>
              </div>
            )}

            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tighter prose-headings:scroll-mt-20
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:leading-[1.75] prose-p:text-foreground/90
                prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-4 prose-li:leading-relaxed
                prose-table:text-sm prose-table:border prose-table:border-border
                prose-th:bg-secondary prose-th:px-4 prose-th:py-2
                prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border
                prose-blockquote:border-primary prose-blockquote:bg-accent/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                prose-hr:border-border prose-hr:my-10
                prose-img:rounded-xl prose-img:shadow-md
                prose-code:text-primary prose-code:bg-accent/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            <div className="mt-16 flex items-center justify-between border-t border-border pt-8">
              <Link
                to={`${prefix}/guides`}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("Tous les guides", "All guides")}
              </Link>
            </div>
          </article>
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

function getToolDomain(tool: { websiteUrl?: string; affiliateLink: string }): string {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

// ── Markdown → HTML ──
function markdownToHtml(
  md: string,
  toc: { id: string; level: number; text: string }[]
): string {
  let html = md;
  let tocIndex = 0;

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_match, header, _sep, body) => {
    const headers = header.split("|").filter((c: string) => c.trim());
    const rows = body.trim().split("\n").map((r: string) => r.split("|").filter((c: string) => c.trim()));
    const ths = headers.map((h: string) => `<th>${h.trim()}</th>`).join("");
    const trs = rows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${c.trim()}</td>`).join("")}</tr>`).join("");
    return `<div class="overflow-x-auto rounded-lg border border-border my-6"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  });

  html = html.replace(/^(#{2,3}) (.+)$/gm, (_match, hashes, text) => {
    const level = hashes.length;
    const id = toc[tocIndex]?.id || `heading-${tocIndex}`;
    tocIndex++;
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

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
