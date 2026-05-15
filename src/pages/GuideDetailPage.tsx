import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePostBySlug, usePosts, useTools, type Post } from "@/hooks/useSupabaseData";
import { useEffect, useState, useMemo } from "react";
import { ArrowRight, Clock, Check, Link2, ChevronUp } from "lucide-react";
import { useArticleTools } from "@/hooks/useArticleTools";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import DOMPurify from "dompurify";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   GuideDetailPage — editorial redesign
   Layout: full-bleed editorial header + 2-col body (content + sticky TOC)
   Typography: ga-* CSS system — reads like a premium magazine article
───────────────────────────────────────────────────────────────────────────── */

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

  /* ── SEO ── */
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

  useEffect(() => {
    if (loading || post) return;
    document.title = lang === "fr" ? "Article introuvable - ToolTrim" : "Article not found - ToolTrim";
    setMeta("robots", "noindex, nofollow");
    return () => {
      document.querySelector<HTMLMetaElement>('meta[name="robots"][content*="noindex"]')?.remove();
    };
  }, [loading, post, lang]);

  /* ── TOC (H2 only for compact sidebar) ── */
  const toc = useMemo(() => {
    if (!post?.content) return [];
    const matches = [...post.content.matchAll(/^(#{2,3}) (.+)$/gm)];
    return matches.map((m, i) => ({
      id: `heading-${i}`,
      level: m[1].length as 2 | 3,
      text: m[2],
    }));
  }, [post?.content]);

  const h2Toc = useMemo(() => toc.filter((item) => item.level === 2), [toc]);

  useEffect(() => {
    if (h2Toc.length === 0) return;
    setActiveHeading((current) => current || h2Toc[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
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

  /* ── Related posts ── */
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

  /* ── Tool link map ── */
  const toolLinkMap = useMemo(() => {
    const map = new Map<string, string>();
    tools.forEach((tool) => {
      if (tool.name && tool.name.length >= 3) {
        map.set(tool.name, `/${lang}/tool/${tool.slug || tool.id}`);
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

  /* ── Loading state ── */
  if (loading) {
    return (
      <div>
        <div style={{ background: "#F8F8F4", borderBottom: "1px solid #DADAD4", padding: "80px 48px 72px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ height: 14, width: 200, background: "#EDEDE8", borderRadius: 4, marginBottom: 32 }} />
            <div style={{ height: 72, width: "70%", background: "#EDEDE8", borderRadius: 4, marginBottom: 20 }} />
            <div style={{ height: 22, width: "55%", background: "#F0F0EA", borderRadius: 4 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "80px 48px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 32, fontWeight: 600, color: "#222222", marginBottom: 16 }}>
          {t("Article introuvable", "Article not found")}
        </h1>
        <Link
          to={`${prefix}/guides`}
          style={{ fontFamily: "var(--font-ui)", fontSize: 15, color: "hsl(var(--primary))", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          ← {t("Retour aux guides", "Back to guides")}
        </Link>
      </div>
    );
  }

  const htmlContent = markdownToHtml(post.content, toc, post.title, toolLinkMap);

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
      {/* Reading progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 2, background: "#EDEDE8" }}>
        <div style={{
          height: "100%", background: "#222222",
          width: `${readProgress}%`,
          transition: "width 150ms ease-out",
        }} />
      </div>

      {/* ══ 1. Article Header ═══════════════════════════════════════════════ */}
      <header className="ga-header">
        <div className="ga-container">

          <Breadcrumb items={[
            { label: t("Guides", "Guides"), href: `${prefix}/guides` },
            { label: post.title },
          ]} />

          {/* Eyebrow: category · date · read time */}
          <div className="ga-eyebrow-row" style={{ marginTop: 28 }}>
            {post.category && (
              <span className="ga-eyebrow-item">{post.category}</span>
            )}
            {formattedDate && (
              <>
                <span className="ga-eyebrow-sep" />
                <span className="ga-eyebrow-item">
                  {lang === "fr" ? "Mis à jour le" : "Updated"} {formattedDate}
                </span>
              </>
            )}
            {post.readTime && (
              <>
                <span className="ga-eyebrow-sep" />
                <span className="ga-eyebrow-item" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock style={{ width: 11, height: 11 }} />
                  {post.readTime}
                </span>
              </>
            )}
          </div>

          {/* Large editorial title */}
          <h1 className="ga-title">{post.title}</h1>

          {/* Standfirst */}
          {post.excerpt && (
            <p className="ga-standfirst">{post.excerpt}</p>
          )}

          {/* Tools mentioned in this guide */}
          {mentionedTools.length > 0 && (
            <div className="ga-header-tools">
              <span className="ga-header-tools-label">{t("Dans ce guide", "In this guide")}</span>
              {mentionedTools.slice(0, 6).map((tool) => (
                <Link
                  key={tool.id}
                  to={`${prefix}/tool/${tool.slug || tool.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    height: 32, padding: "0 10px 0 6px",
                    border: "1px solid #DADAD4", borderRadius: 6,
                    background: "#FFFFFF", textDecoration: "none",
                    fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "#222222",
                    transition: "border-color 140ms",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#222222"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#DADAD4"; }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ToolLogo tool={tool} size={16} />
                  </div>
                  {tool.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══ 2. Body: article + sticky TOC ═══════════════════════════════════ */}
      <div className="ga-body-outer">
        <div className="ga-body-grid">

          {/* ── Article column ── */}
          <article>

            {/* Mobile TOC */}
            {h2Toc.length > 1 && (
              <div className="ga-mobile-toc">
                <p style={{
                  fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F68",
                  marginBottom: 10,
                }}>
                  {t("Sommaire", "Contents")}
                </p>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8,
                  padding: "14px 16px",
                  border: "1px solid #DADAD4", borderRadius: 8,
                  background: "#F8F8F4",
                }}>
                  {h2Toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      style={{
                        fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68",
                        textDecoration: "none", whiteSpace: "nowrap",
                        padding: "3px 10px",
                        border: "1px solid #DADAD4", borderRadius: 4,
                        background: "#FFFFFF",
                        transition: "color 120ms",
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Article body */}
            <div
              className="ga-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
            />

            {/* Share row */}
            <div className="ga-share-row">
              <span className="ga-share-label">
                {t("Cet article vous a été utile ?", "Found this useful?")}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={handleCopyLink}
                  className="ga-share-btn"
                  title={t("Copier le lien", "Copy link")}
                >
                  {copied
                    ? <Check style={{ width: 14, height: 14, color: "#4A9B6F" }} />
                    : <Link2 style={{ width: 14, height: 14 }} />}
                </button>
                <button onClick={handleShareTwitter} className="ga-share-btn" title="X / Twitter">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button onClick={handleShareLinkedIn} className="ga-share-btn" title="LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Mentioned tools — editorial rows */}
            {mentionedTools.length > 0 && (
              <div className="ga-tools-section">
                <p className="ga-tools-section-label">{t("Outils mentionnés", "Tools mentioned")}</p>
                {mentionedTools.slice(0, 6).map((tool) => (
                  <ToolRow key={tool.id} tool={tool} prefix={prefix} lang={lang} />
                ))}
              </div>
            )}

            {/* Related guides */}
            {relatedPosts.length > 0 && (
              <div className="ga-related">
                <p className="ga-related-label">{t("À lire ensuite", "Read next")}</p>
                <div className="ga-related-grid">
                  {relatedPosts.map((rp) => (
                    <RelatedCard key={rp.slug} post={rp} prefix={prefix} />
                  ))}
                </div>
              </div>
            )}

            {/* Back link */}
            <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid #DADAD4" }}>
              <Link
                to={`${prefix}/guides`}
                style={{
                  fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
                  color: "#6F6F68", textDecoration: "none",
                  transition: "color 140ms",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#222222"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6F6F68"; }}
              >
                ← {t("Tous les guides", "All guides")}
              </Link>
            </div>
          </article>

          {/* ── TOC column (sticky) ── */}
          <aside className="ga-toc-col">
            {h2Toc.length > 1 && (
              <div>
                <p className="ga-toc-label">{t("Sommaire", "Contents")}</p>
                <nav className="ga-toc-nav">
                  {h2Toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`ga-toc-link${activeHeading === item.id ? " ga-toc-link--active" : ""}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {mentionedTools.length > 0 && (
              <div className="ga-toc-tools">
                <p className="ga-toc-tools-label">{t("Dans ce guide", "In this guide")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mentionedTools.slice(0, 5).map((tool) => (
                    <Link
                      key={tool.id}
                      to={`${prefix}/tool/${tool.slug || tool.id}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        textDecoration: "none",
                        fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68",
                        transition: "color 140ms",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#222222"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6F6F68"; }}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: 5,
                        border: "1px solid #DADAD4", background: "#F8F8F4",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <ToolLogo tool={tool} size={15} />
                      </div>
                      <span>{tool.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Progress indicator */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #DADAD4" }}>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9A9A92", marginBottom: 8 }}>
                {t("Lecture", "Reading")}
              </p>
              <div style={{ height: 3, background: "#EDEDE8", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "#222222", borderRadius: 2,
                  width: `${readProgress}%`,
                  transition: "width 150ms ease-out",
                }} />
              </div>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "#9A9A92", marginTop: 6 }}>
                {Math.round(readProgress)}%
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ══ 3. CTA Band ═════════════════════════════════════════════════════ */}
      <div className="ga-cta-band">
        <div className="ga-cta-inner">
          <div>
            <p className="ga-cta-title">
              {t("Construire une stack plus légère.", "Build a leaner stack.")}
            </p>
            <p className="ga-cta-text">
              {t(
                "Analyse tes outils actuels et repère les doublons, alternatives et abonnements à challenger.",
                "Analyze your current tools and spot duplicates, alternatives and subscriptions worth challenging.",
              )}
            </p>
          </div>
          <Link to={`${prefix}/diagnostic`} className="ga-cta-btn">
            {t("Analyser ma stack", "Analyze my stack")}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 40,
            width: 40, height: 40, borderRadius: "50%",
            background: "#222222", color: "#FFFFFF",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity 160ms",
          }}
          title={t("Retour en haut", "Back to top")}
        >
          <ChevronUp style={{ width: 18, height: 18 }} />
        </button>
      )}
    </>
  );
};

/* ── Tool row ── */
function ToolRow({ tool, prefix, lang }: { tool: Tool; prefix: string; lang: string }) {
  const isFree = tool.defaultMonthlyPrice === 0 && !(tool.pricing as any)?.paid;
  const isFreemium = !!(tool.pricing as any)?.free && !!(tool.pricing as any)?.paid;
  const priceLabel = isFree
    ? (lang === "fr" ? "Gratuit" : "Free")
    : isFreemium
    ? "Freemium"
    : tool.defaultMonthlyPrice
    ? `${tool.defaultMonthlyPrice}€/${lang === "fr" ? "mois" : "mo"}`
    : (lang === "fr" ? "Payant" : "Paid");

  return (
    <Link to={`${prefix}/tool/${tool.slug || tool.id}`} className="ga-tool-row">
      <div style={{
        width: 36, height: 36, borderRadius: 7,
        border: "1px solid #DADAD4", background: "#F8F8F4",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <ToolLogo tool={tool} size={22} />
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-brand)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.025em", color: "#222222", marginBottom: 2 }}>
          {tool.name}
        </p>
        {tool.shortDescription && (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68", lineHeight: 1.35 }}>
            {(tool.shortDescription as string).split(".")[0]}
          </p>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "#222222" }}>
          {priceLabel}
        </span>
      </div>
    </Link>
  );
}

/* ── Related card ── */
function RelatedCard({ post, prefix }: { post: Post; prefix: string }) {
  return (
    <Link to={`${prefix}/guide/${post.slug}`} className="ga-related-card">
      {post.category && <p className="ga-related-cat">{post.category}</p>}
      <h3 className="ga-related-title">{post.title}</h3>
      {post.readTime && (
        <p className="ga-related-meta" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock style={{ width: 10, height: 10 }} />
          {post.readTime}
        </p>
      )}
    </Link>
  );
}

/* ── Markdown → HTML renderer ── */
function markdownToHtml(
  md: string,
  toc: { id: string; level: number; text: string }[],
  articleTitle: string,
  toolMap?: Map<string, string>,
): string {
  let html = md;
  let tocIndex = 0;

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_m, header, _s, body) => {
    const hs = header.split("|").filter((c: string) => c.trim());
    const rows = body.trim().split("\n").map((r: string) => r.split("|").filter((c: string) => c.trim()));
    return `<div class="overflow-x-auto my-6"><table><thead><tr>${hs.map((h: string) => `<th>${h.trim()}</th>`).join("")}</tr></thead><tbody>${rows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${c.trim()}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
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
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/^(?!<[a-z/]|$)(.+)$/gm, "<p>$1</p>");
  html = html.replace(/<p>\s*<\/p>/g, "");

  // Auto-link tool names (first occurrence only)
  if (toolMap && toolMap.size > 0) {
    const linked = new Set<string>();
    toolMap.forEach((slug, name) => {
      if (linked.has(name)) return;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?<!<[^>]*)\\b(${escaped})\\b(?![^<]*<\\/a>)`, "i");
      const match = html.match(regex);
      if (match) {
        html = html.replace(regex, `<a href="${slug}" class="text-primary">${match[1]}</a>`);
        linked.add(name);
      }
    });
  }

  return html;
}

export default GuideDetailPage;
