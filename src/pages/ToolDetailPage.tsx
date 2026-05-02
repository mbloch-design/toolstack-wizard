import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolBySlug, useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { useEffect } from "react";
import {
  ExternalLink, Check, X, ArrowRight, AlertTriangle,
  TrendingDown, Sparkles, ShieldCheck, CalendarCheck,
} from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { FEATURED_COMPARISONS } from "@/data/comparisons";

import ToolSummaryBlock from "@/components/tool/ToolSummaryBlock";
import ToolVerdictBlock from "@/components/tool/ToolVerdictBlock";
import ToolPricingSection from "@/components/tool/ToolPricingSection";
import ToolFAQSection from "@/components/tool/ToolFAQSection";
import ToolAlternativesSection from "@/components/tool/ToolAlternativesSection";
import ToolJsonLd from "@/components/tool/ToolJsonLd";
import ToolDiagCta from "@/components/tool/ToolDiagCta";

function getToolDomain(tool: any): string {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch { return ""; }
}

const TABS = [
  { id: "presentation", labelFr: "Présentation", labelEn: "Overview",      path: ""             },
  { id: "prix",         labelFr: "Prix",          labelEn: "Pricing",       path: "/prix"        },
  { id: "alternatives", labelFr: "Alternatives",  labelEn: "Alternatives",  path: "/alternatives"},
  { id: "faq",          labelFr: "FAQ",           labelEn: "FAQ",           path: "/faq"         },
] as const;

const ToolDetailPage = () => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const location = useLocation();
  const { tool, loading } = useToolBySlug(slug);
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);

  // Derive active sub-page from URL path
  const pathEnd = location.pathname.split("/").pop() || "";
  const subPage: "presentation" | "prix" | "alternatives" | "faq" =
    pathEnd === "prix" || pathEnd === "pricing" ? "prix"
    : pathEnd === "alternatives" ? "alternatives"
    : pathEnd === "faq" ? "faq"
    : "presentation";

  // ── SEO — unique title/desc/canonical per sub-page ──
  useEffect(() => {
    if (!tool) return;
    const v5Price = tool.pricing_v5?.compare_price_monthly_eur;
    const price = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
    const hasPrice = price != null && price > 0;
    const year = new Date().getFullYear();
    const baseSlug = tool.slug || tool.id;

    const SEO: Record<string, { titleFr: string; titleEn: string; descFr: string; descEn: string; suffix: string }> = {
      presentation: {
        titleFr: `${tool.name} — Prix, avis et alternatives ${year} | ToolTrim`,
        titleEn: `${tool.name} — Pricing, review & alternatives ${year} | ToolTrim`,
        descFr: hasPrice
          ? `${tool.name} coûte ${price}€/mois. Verdict ToolTrim : vaut-il le coût ? Quelles alternatives moins chères ?`
          : `${tool.name} analysé par ToolTrim : verdict honnête, prix réel et meilleures alternatives testées.`,
        descEn: hasPrice
          ? `${tool.name} costs €${price}/mo. ToolTrim honest verdict: is it worth it? Best cheaper alternatives.`
          : `${tool.name} reviewed by ToolTrim: honest verdict, real pricing and best tested alternatives.`,
        suffix: "",
      },
      prix: {
        titleFr: `${tool.name} : prix et tarifs ${year} | ToolTrim`,
        titleEn: `${tool.name} pricing & plans ${year} | ToolTrim`,
        descFr: hasPrice
          ? `Combien coûte vraiment ${tool.name} ? Plans, tarifs détaillés et comparaison — mis à jour ${year}.`
          : `Plans et tarifs de ${tool.name} : gratuit, freemium ou payant ? Toutes les options détaillées.`,
        descEn: hasPrice
          ? `How much does ${tool.name} really cost? Detailed plans, pricing breakdown — updated ${year}.`
          : `${tool.name} plans and pricing: free, freemium or paid? All options detailed.`,
        suffix: "/prix",
      },
      alternatives: {
        titleFr: `Meilleures alternatives à ${tool.name} en ${year} | ToolTrim`,
        titleEn: `Best ${tool.name} alternatives in ${year} | ToolTrim`,
        descFr: `Quelles sont les meilleures alternatives à ${tool.name} ? ToolTrim compare les options moins chères, gratuites ou plus adaptées.`,
        descEn: `What are the best alternatives to ${tool.name}? ToolTrim compares cheaper, free and better-fit options.`,
        suffix: "/alternatives",
      },
      faq: {
        titleFr: `${tool.name} : questions fréquentes ${year} | ToolTrim`,
        titleEn: `${tool.name} FAQ ${year} | ToolTrim`,
        descFr: `Toutes les questions fréquentes sur ${tool.name} : prix, plans, alternatives, intégrations et conseils d'utilisation.`,
        descEn: `All frequently asked questions about ${tool.name}: pricing, plans, alternatives, integrations and usage tips.`,
        suffix: "/faq",
      },
    };

    const meta = SEO[subPage] ?? SEO.presentation;
    const seoTitle = lang === "fr" ? meta.titleFr : meta.titleEn;
    const seoDesc  = lang === "fr" ? meta.descFr  : meta.descEn;
    const canonicalUrl = `${SEO_BASE}/${lang}/tool/${baseSlug}${meta.suffix}`;

    const toolDomain = tool.websiteUrl || tool.affiliateLink;
    let toolOgImage: string | undefined;
    if (toolDomain) {
      try {
        const hostname = new URL(toolDomain.startsWith("http") ? toolDomain : `https://${toolDomain}`).hostname.replace("www.", "");
        toolOgImage = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch { /* */ }
    }
    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, locale: lang === "fr" ? "fr_FR" : "en_US" });
    if (toolOgImage) setMeta("og:image", toolOgImage);
    setMeta("article:modified_time", tool.pricing_v5?.verified_on || "2026-03-29");
    setHreflang(`/${lang}/tool/${baseSlug}${meta.suffix}`);
    return () => cleanupSeo([]);
  }, [tool, lang, subPage]);


  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tool) return <Navigate to={`${prefix}/tools`} replace />;

  const category = categories.find((c: any) => c.id === tool.categoryId);
  const CategoryIcon = category ? getCategoryIcon(category.id) : null;
  const alternatives = tools
    .filter((tt: any) => tt.categoryId === tool.categoryId && tt.id !== tool.id)
    .slice(0, 6);
  const relatedPosts = posts
    .filter((p: any) => `${p.title} ${p.excerpt} ${p.content}`.toLowerCase().includes(tool.name.toLowerCase()))
    .slice(0, 3);

  const v5Price    = tool.pricing_v5?.compare_price_monthly_eur;
  const displayPrice = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
  const verifiedOn = tool.pricing_v5?.verified_on || "2026-03-29";
  const sourceDomain = tool.pricing_v5?.source_domain;
  const domain     = getToolDomain(tool);
  const isFree     = displayPrice === 0 && !tool.pricing?.paid;
  const isFreemium = !!(tool.pricing?.free && tool.pricing?.paid);
  const freeAlt    = (tool as any).freeAlternative as string | null;
  const betterAlt  = (tool as any).betterAlternative as { tool: string; saving: number } | null;
  const catName    = category?.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || "";
  const catNameEn  = category?.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || catName;

  const TYPE_LABEL: Record<string, { fr: string; en: string }> = {
    ia:        { fr: "Intelligence artificielle", en: "AI tool"     },
    metier:    { fr: "Outil métier",               en: "Core tool"   },
    gestion:   { fr: "Gestion",                    en: "Management"  },
    satellite: { fr: "Satellite",                  en: "Satellite"   },
    plugin:    { fr: "Plugin / Extension",          en: "Plugin"      },
  };
  const toolType = (tool as any).tool_type as string;

  return (
    <article className="min-h-screen" itemScope itemType="https://schema.org/WebPage">
      <ToolJsonLd
        tool={tool} category={category} displayPrice={displayPrice}
        verifiedOn={verifiedOn} alternatives={alternatives} lang={lang}
        includeFaq={subPage === "faq"}
      />

      {/* ── Hero strip: breadcrumb + headline ── */}
      <header
        className="relative overflow-hidden border-b border-border"
        style={{ background: "hsl(var(--card))" }}
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage: "radial-gradient(hsl(var(--border) / 0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 20%, transparent 80%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8">
          <Breadcrumb items={[
            { label: t("Outils", "Tools"), href: `${prefix}/tools` },
            ...(category ? [{
              label: t(catName, catNameEn),
              href: `${prefix}/category/${category.slug}`
            }] : []),
            { label: tool.name },
          ]} />

          <h1
            className="font-display mt-4"
            style={{
              fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.12,
              color: "hsl(var(--foreground))",
            }}
          >
            {(() => {
              if (lang === "fr") {
                if (displayPrice > 0) return <>{tool.name} — <span style={{ color: "hsl(var(--primary))" }}>vaut-il vraiment {displayPrice}€/mois ?</span></>;
                if (isFree || isFreemium) return <>{tool.name} — <span style={{ color: "hsl(var(--primary))" }}>le plan gratuit suffit-il vraiment ?</span></>;
                return <>{tool.name} — <span style={{ color: "hsl(var(--primary))" }}>notre verdict honnête</span></>;
              }
              if (displayPrice > 0) return <>{tool.name} — <span style={{ color: "hsl(var(--primary))" }}>is it really worth €{displayPrice}/mo?</span></>;
              if (isFree || isFreemium) return <>{tool.name} — <span style={{ color: "hsl(var(--primary))" }}>is the free plan really enough?</span></>;
              return <>{tool.name} — <span style={{ color: "hsl(var(--primary))" }}>our honest verdict</span></>;
            })()}
          </h1>
        </div>
      </header>

      {/* ── BODY: left card + tabs + content ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex gap-8 items-start">

          {/* ══════════════ LEFT STICKY CARD ══════════════ */}
          <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-4 sticky top-6">
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: "hsl(var(--card))" }}
            >
              {/* Logo + name */}
              <div className="flex flex-col items-center gap-3 p-5 pb-4 border-b border-border text-center">
                <ToolLogo tool={tool} size={64} className="rounded-2xl shadow-md" />
                <div>
                  <p
                    className="font-display font-bold"
                    style={{ fontSize: "1.1rem", letterSpacing: "-0.025em" }}
                  >
                    {tool.name}
                  </p>
                  {category && (
                    <Link
                      to={`${prefix}/category/${category.slug}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-xs transition-colors hover:text-primary"
                      style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Mono', monospace" }}
                    >
                      {CategoryIcon && <CategoryIcon className="h-2.5 w-2.5" />}
                      {t(catName, catNameEn)}
                    </Link>
                  )}
                </div>
              </div>

              {/* Price block */}
              <div className="px-5 py-4 border-b border-border text-center">
                {isFree || isFreemium ? (
                  <span
                    className="inline-flex items-center rounded-md border px-3 py-1 text-sm font-semibold"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      borderColor: "hsl(var(--primary) / 0.3)",
                      background: "hsl(var(--primary) / 0.08)",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {isFree ? t("Gratuit", "Free") : "Freemium"}
                  </span>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span
                        className="text-2xl font-bold"
                        style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}
                      >
                        {displayPrice}€
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground) / 0.6)", fontFamily: "'DM Mono', monospace" }}
                      >
                        /{t("mois", "mo")}
                      </span>
                    </div>
                    {tool.pricing_v5?.compare_plan_name && (
                      <p
                        className="mt-0.5"
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "0.6rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "hsl(var(--muted-foreground) / 0.45)",
                        }}
                      >
                        {t("Plan", "Plan")} {tool.pricing_v5.compare_plan_name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Short description */}
              <div className="px-5 py-4 border-b border-border">
                <p
                  className="text-xs leading-relaxed line-clamp-4"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 p-4">
                <a
                  href={tool.affiliateLink || tool.websiteUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t("Essayer gratuitement", "Try for free")}
                </a>
                {domain && (
                  <a
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors"
                    style={{
                      background: "hsl(var(--foreground))",
                      color: "hsl(var(--background))",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground) / 0.85)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground))"; }}
                  >
                    {t("Visiter le site", "Visit website")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Savings signal */}
              {(freeAlt || betterAlt) && (
                <div
                  className="px-4 py-3 border-t"
                  style={{
                    borderColor: freeAlt ? "hsl(var(--savings) / 0.2)" : "hsl(var(--cancel) / 0.2)",
                    background: freeAlt ? "hsl(var(--savings) / 0.05)" : "hsl(var(--cancel) / 0.05)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    {freeAlt
                      ? <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--savings))" }} />
                      : <TrendingDown className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--cancel))" }} />
                    }
                    <p
                      className="text-xs leading-snug"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: freeAlt ? "hsl(var(--savings))" : "hsl(var(--cancel))",
                      }}
                    >
                      {freeAlt
                        ? <><span className="font-medium">{t("Alt. gratuite :", "Free alt:")}</span> <span className="capitalize">{freeAlt.replace(/-/g, " ")}</span></>
                        : <><span className="font-medium">{t("Moins cher :", "Cheaper:")}</span> <span className="capitalize">{betterAlt?.tool?.replace(/-/g, " ")}</span> {betterAlt?.saving ? `· −${betterAlt.saving}€/mo` : ""}</>
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Key facts */}
              <div
                className="border-t border-border divide-y divide-border/50"
                style={{ fontSize: "0.72rem", fontFamily: "'DM Sans', sans-serif" }}
              >
                {toolType && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{t("Type", "Type")}</span>
                    <span
                      className="font-medium"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {lang === "fr" ? TYPE_LABEL[toolType]?.fr : TYPE_LABEL[toolType]?.en}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{t("Remplaçable", "Replaceable")}</span>
                  <span style={{ color: (tool as any).substitutable ? "hsl(var(--savings))" : "hsl(var(--muted-foreground))" }}>
                    {(tool as any).substitutable ? t("Oui", "Yes") : t("Non", "No")}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="flex items-center gap-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <ShieldCheck className="h-3 w-3" />
                    {t("Prix vérifié", "Price verified")}
                  </span>
                  <time
                    dateTime={verifiedOn}
                    style={{ color: "hsl(var(--muted-foreground) / 0.6)", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem" }}
                  >
                    {verifiedOn}
                  </time>
                </div>
              </div>
            </div>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div>
                <p className="label-section mb-3">{t("Guides liés", "Related guides")}</p>
                <div className="flex flex-col gap-2">
                  {relatedPosts.map((post: any) => (
                    <Link
                      key={post.slug}
                      to={`${prefix}/guide/${post.slug}`}
                      className="block rounded-lg border border-border bg-card p-3 text-xs transition-all hover:border-primary/30 hover:shadow-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <p className="font-medium text-foreground line-clamp-2">{post.title}</p>
                      {post.readTime && (
                        <p className="mt-1" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem" }}>
                          {post.readTime}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ══════════════ MAIN CONTENT ══════════════ */}
          <div className="flex-1 min-w-0">

            {/* ── Tab nav (sticky) — real links for SEO ── */}
            <nav
              className="sticky top-0 z-20 mb-8 flex items-center gap-1 overflow-x-auto border-b border-border pb-0"
              style={{ background: "hsl(var(--background))" }}
            >
              {TABS.map((tab) => {
                const isActive = subPage === tab.id;
                return (
                  <Link
                    key={tab.id}
                    to={`${prefix}/tool/${slug}${tab.path}`}
                    className="relative shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-150"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      textDecoration: "none",
                    }}
                  >
                    {lang === "fr" ? tab.labelFr : tab.labelEn}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── SECTION: Présentation ── */}
            {subPage === "presentation" && <section className="space-y-8">
              {/* Description longue — mobile only (desktop has left card) */}
              <div className="lg:hidden">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
                </p>
              </div>

              {/* Summary block */}
              <ToolSummaryBlock
                tool={tool} category={category} alternatives={alternatives}
                displayPrice={displayPrice} lang={lang} prefix={prefix} t={t}
              />

              {/* Pros / Cons */}
              <div>
                <h2
                  className="font-display mb-4"
                  style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.022em" }}
                >
                  {t(`Avantages et inconvénients de ${tool.name}`, `${tool.name} — Pros & Cons`)}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-5" style={{ borderColor: "hsl(var(--keep) / 0.25)", background: "hsl(var(--keep) / 0.04)" }}>
                    <h3
                      className="mb-3 flex items-center gap-2 text-sm font-semibold"
                      style={{ color: "hsl(var(--keep))" }}
                    >
                      <Check className="h-4 w-4" /> {t("Avantages", "Pros")}
                    </h3>
                    <ul className="space-y-2">
                      {(lang === "en" && (tool as any).prosEn ? (tool as any).prosEn : tool.pros)?.map((pro: string) => (
                        <li key={pro} className="flex items-start gap-2 text-sm" style={{ color: "hsl(var(--foreground) / 0.8)", fontFamily: "'DM Sans', sans-serif" }}>
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--keep) / 0.7)" }} />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border p-5" style={{ borderColor: "hsl(var(--cancel) / 0.25)", background: "hsl(var(--cancel) / 0.04)" }}>
                    <h3
                      className="mb-3 flex items-center gap-2 text-sm font-semibold"
                      style={{ color: "hsl(var(--cancel))" }}
                    >
                      <X className="h-4 w-4" /> {t("Inconvénients", "Cons")}
                    </h3>
                    <ul className="space-y-2">
                      {(lang === "en" && (tool as any).consEn ? (tool as any).consEn : tool.cons)?.map((con: string) => (
                        <li key={con} className="flex items-start gap-2 text-sm" style={{ color: "hsl(var(--foreground) / 0.8)", fontFamily: "'DM Sans', sans-serif" }}>
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--cancel) / 0.7)" }} />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Use cases */}
              {tool.useCases && tool.useCases.length > 0 && (
                <div>
                  <h2
                    className="font-display mb-4"
                    style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.022em" }}
                  >
                    {t(`À quoi sert ${tool.name} ?`, `What is ${tool.name} used for?`)}
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(lang === "en" && (tool as any).useCasesEn ? (tool as any).useCasesEn : tool.useCases)!.map((uc: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {uc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verdict */}
              <ToolVerdictBlock tool={tool} lang={lang} prefix={prefix} allTools={tools} t={t} />

              {/* Diag CTA */}
              <ToolDiagCta tool={tool} prefix={prefix} lang={lang} t={t} />
            </section>}

            {/* ── SECTION: Prix ── */}
            {subPage === "prix" && <section className="space-y-8">
              <h2
                className="font-display mb-6"
                style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.022em" }}
              >
                {t(`Prix de ${tool.name}`, `${tool.name} pricing`)}
              </h2>
              <ToolPricingSection
                tool={tool} displayPrice={displayPrice}
                verifiedOn={verifiedOn} sourceDomain={sourceDomain}
                prefix={prefix} lang={lang} t={t}
              />
            </section>}

            {/* ── SECTION: Alternatives ── */}
            {subPage === "alternatives" && <section className="space-y-8">
              <ToolAlternativesSection
                tool={tool} category={category} alternatives={alternatives}
                prefix={prefix} lang={lang} t={t}
              />

              {/* Cluster tools */}
              {(tool as any).substitution_cluster_v2 && (() => {
                const clusterTools = tools
                  .filter((ct: any) => ct.substitution_cluster_v2 === (tool as any).substitution_cluster_v2 && ct.id !== tool.id)
                  .slice(0, 6);
                if (!clusterTools.length) return null;
                return (
                  <div className="mt-8">
                    <h3
                      className="font-display mb-3"
                      style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.018em" }}
                    >
                      {t("Outils substituables directement", "Direct substitutes")}
                    </h3>
                    <p
                      className="mb-4 text-sm"
                      style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {t(
                        `Ces outils couvrent les mêmes besoins que ${tool.name} et peuvent le remplacer directement.`,
                        `These tools cover the same needs as ${tool.name} and can replace it directly.`
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {clusterTools.map((ct: any) => (
                        <Link
                          key={ct.id}
                          to={`${prefix}/tool/${ct.slug || ct.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-all hover:border-primary/30 hover:text-primary"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <ToolLogo tool={ct} size={18} />
                          {ct.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Comparisons */}
              {(() => {
                const toolId = tool.slug || tool.id;
                const comparisons = FEATURED_COMPARISONS.filter(
                  (c: any) => c.toolA === toolId || c.toolB === toolId
                );
                const compareTools = comparisons
                  .map((c: any) => {
                    const otherId = c.toolA === toolId ? c.toolB : c.toolA;
                    const other = tools.find((tt: any) => tt.id === otherId || tt.slug === otherId);
                    return other ? { slugPair: c.slugPair, other } : null;
                  })
                  .filter(Boolean) as { slugPair: string; other: any }[];
                if (!compareTools.length) return null;
                return (
                  <div className="mt-8">
                    <h3
                      className="font-display mb-3"
                      style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.018em" }}
                    >
                      {t(`Comparer ${tool.name} avec`, `Compare ${tool.name} with`)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {compareTools.map(({ slugPair, other }) => (
                        <Link
                          key={slugPair}
                          to={`${prefix}/comparatif/${slugPair}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-all hover:border-primary/30 hover:text-primary"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <ToolLogo tool={other} size={18} />
                          {tool.name} vs {other.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </section>}

            {/* ── SECTION: FAQ ── */}
            {subPage === "faq" && <section className="space-y-8">
              <ToolFAQSection
                tool={tool} displayPrice={displayPrice}
                verifiedOn={verifiedOn} alternatives={alternatives}
                lang={lang} t={t}
              />
            </section>}

            {/* ── Freshness footer ── */}
            <footer
              className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-xs"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)", fontFamily: "'DM Mono', monospace" }}
            >
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="h-3 w-3" />
                {t("Mis à jour :", "Updated:")} <time dateTime={verifiedOn}>{verifiedOn}</time>
              </span>
              {sourceDomain && (
                <>
                  <span>·</span>
                  <span>
                    {t("Source :", "Source:")}{" "}
                    <a
                      href={tool.pricing_v5?.official_source_url || `https://${sourceDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-primary transition-colors"
                    >
                      {sourceDomain}
                    </a>
                  </span>
                </>
              )}
              <span>·</span>
              <Link to={`${prefix}/contact`} className="underline underline-offset-2 hover:text-primary transition-colors">
                {t("Signaler un prix incorrect", "Report incorrect pricing")}
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ToolDetailPage;
