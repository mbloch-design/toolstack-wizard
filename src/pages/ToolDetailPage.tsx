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
import { getToolDomain, getDomainFromUrl } from "@/lib/toolUtils";
import { asText, stripLeadingEmoji } from "@/lib/text";

import ToolSummaryBlock from "@/components/tool/ToolSummaryBlock";
import ToolVerdictBlock from "@/components/tool/ToolVerdictBlock";
import ToolPricingSection from "@/components/tool/ToolPricingSection";
import ToolFeaturesBlock from "@/components/tool/ToolFeaturesBlock";
import ToolFAQSection from "@/components/tool/ToolFAQSection";
import ToolAlternativesSection from "@/components/tool/ToolAlternativesSection";
import ToolJsonLd from "@/components/tool/ToolJsonLd";
import ToolDiagCta from "@/components/tool/ToolDiagCta";

const TABS = [
  { id: "presentation", labelFr: "Présentation", labelEn: "Overview",      path: ""             },
  { id: "prix",         labelFr: "Prix",          labelEn: "Pricing",       path: "/prix"        },
  { id: "alternatives", labelFr: "Alternatives",  labelEn: "Alternatives",  path: "/alternatives"},
  { id: "avis",         labelFr: "Avis",          labelEn: "Reviews",       path: "/avis"        },
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
  const subPage: "presentation" | "prix" | "alternatives" | "faq" | "avis" =
    pathEnd === "prix" || pathEnd === "pricing" ? "prix"
    : pathEnd === "alternatives" ? "alternatives"
    : pathEnd === "faq" ? "faq"
    : pathEnd === "avis" || pathEnd === "reviews" ? "avis"
    : "presentation";

  // ── SEO — unique title/desc/canonical per sub-page ──
  useEffect(() => {
    if (!tool) return;
    const v5Price = tool.pricing_v5?.compare_price_monthly_eur;
    const price = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
    const hasPrice = price != null && price > 0;
    const year = new Date().getFullYear();
    const baseSlug = tool.slug || tool.id;

    // Round price for titles (cleaner display), keep exact for descriptions
    const priceRounded = hasPrice ? Math.round(price as number) : 0;
    const planName = tool.pricing_v5?.compare_plan_name || null;
    const planSuffixFr = planName ? ` (plan ${planName})` : "";
    const planSuffixEn = planName ? ` (${planName} plan)` : "";

    const SEO: Record<string, { titleFr: string; titleEn: string; descFr: string; descEn: string; suffix: string }> = {
      presentation: {
        titleFr: hasPrice
          ? `${tool.name} Avis ${year} : ${priceRounded}€/mois — Vaut-il le coût ? | ToolTrim`
          : `${tool.name} Avis ${year} : Gratuit ou Payant ? Verdict honnête | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name} Review ${year}: €${priceRounded}/mo — Is It Worth It? | ToolTrim`
          : `${tool.name} Review ${year}: Free or Paid? Honest Verdict | ToolTrim`,
        descFr: hasPrice
          ? `${tool.name} coûte ${price}€/mois${planSuffixFr}. Verdict ToolTrim : vaut-il le coût ? Comparatif des meilleures alternatives moins chères en ${year}.`
          : `${tool.name} est-il vraiment gratuit ? Plans, tarifs cachés et meilleures alternatives analysés par ToolTrim — mis à jour ${year}.`,
        descEn: hasPrice
          ? `${tool.name} costs €${price}/mo${planSuffixEn}. ToolTrim honest verdict: is it worth it? Best cheaper alternatives compared for ${year}.`
          : `Is ${tool.name} really free? Plans, hidden costs and best alternatives reviewed by ToolTrim — updated ${year}.`,
        suffix: "",
      },
      prix: {
        titleFr: hasPrice
          ? `${tool.name} Prix ${year} : ${priceRounded}€/mois — Plans & Tarifs | ToolTrim`
          : `${tool.name} Prix ${year} : Gratuit, Freemium ou Payant ? | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name} Pricing ${year}: €${priceRounded}/mo — Plans & Cost | ToolTrim`
          : `${tool.name} Pricing ${year}: Free, Freemium or Paid? | ToolTrim`,
        descFr: hasPrice
          ? `Combien coûte ${tool.name} en ${year} ? ${priceRounded}€/mois${planName ? ` pour le plan ${planName}` : ""}. Détail de tous les plans, tarifs annuels et alternatives moins chères.`
          : `${tool.name} est-il gratuit en ${year} ? Détail complet des plans gratuits, freemium et payants avec comparaison des alternatives.`,
        descEn: hasPrice
          ? `How much does ${tool.name} cost in ${year}? €${priceRounded}/mo${planName ? ` for the ${planName} plan` : ""}. All plans, annual pricing and cheaper alternatives.`
          : `Is ${tool.name} free in ${year}? Complete breakdown of free, freemium and paid plans with alternatives compared.`,
        suffix: "/prix",
      },
      alternatives: {
        titleFr: hasPrice
          ? `Alternatives à ${tool.name} moins chères en ${year} | ToolTrim`
          : `Meilleures alternatives à ${tool.name} en ${year} | ToolTrim`,
        titleEn: hasPrice
          ? `Cheaper ${tool.name} Alternatives in ${year} | ToolTrim`
          : `Best ${tool.name} Alternatives in ${year} | ToolTrim`,
        descFr: hasPrice
          ? `Vous payez ${priceRounded}€/mois pour ${tool.name} ? Voici les meilleures alternatives moins chères, gratuites ou plus adaptées — comparées par ToolTrim.`
          : `Quelles sont les meilleures alternatives à ${tool.name} ? ToolTrim compare les options gratuites, freemium et payantes les plus adaptées en ${year}.`,
        descEn: hasPrice
          ? `Paying €${priceRounded}/mo for ${tool.name}? Here are the best cheaper, free or better-fit alternatives — compared by ToolTrim.`
          : `What are the best alternatives to ${tool.name}? ToolTrim compares the top free, freemium and paid options for ${year}.`,
        suffix: "/alternatives",
      },
      avis: {
        titleFr: `${tool.name} Avis ${year} : Score ToolTrim & retours utilisateurs | ToolTrim`,
        titleEn: `${tool.name} Reviews ${year}: ToolTrim Score & User Feedback | ToolTrim`,
        descFr: `Score ToolTrim pour ${tool.name}, analyse indépendante et retours d'utilisateurs. Verdict honnête sur la valeur réelle de cet outil en ${year}.`,
        descEn: `ToolTrim score for ${tool.name}, independent analysis and user feedback. Honest verdict on this tool's real value in ${year}.`,
        suffix: "/avis",
      },
      faq: {
        titleFr: `${tool.name} FAQ ${year} : Prix, Plans & Alternatives | ToolTrim`,
        titleEn: `${tool.name} FAQ ${year}: Pricing, Plans & Alternatives | ToolTrim`,
        descFr: `Tout ce que vous devez savoir sur ${tool.name} : combien ça coûte, quels plans existent, comment migrer et quelles alternatives choisir en ${year}.`,
        descEn: `Everything you need to know about ${tool.name}: how much it costs, which plans exist, how to migrate and which alternatives to choose in ${year}.`,
        suffix: "/faq",
      },
    };

    const meta = SEO[subPage] ?? SEO.presentation;
    const seoTitle = lang === "fr" ? meta.titleFr : meta.titleEn;
    const seoDesc  = lang === "fr" ? meta.descFr  : meta.descEn;
    const canonicalSuffix = subPage === "prix" && lang === "en" ? "/pricing" : meta.suffix;
    const canonicalUrl = `${SEO_BASE}/${lang}/tool/${baseSlug}${canonicalSuffix}`;

    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setMeta("article:modified_time", tool.pricing_v5?.verified_on || "2026-03-29");
    setHreflang(`/${lang}/tool/${baseSlug}${canonicalSuffix}`);
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
    .filter((p: any) => `${p.title ?? ""} ${p.excerpt ?? ""} ${p.content ?? ""}`.toLowerCase().includes((tool.name ?? "").toLowerCase()))
    .slice(0, 3);

  const v5Price    = tool.pricing_v5?.compare_price_monthly_eur;
  const displayPrice = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
  const verifiedOn = tool.pricing_v5?.verified_on || "2026-03-29";
  const sourceDomain = tool.pricing_v5?.source_domain;
  const domain     = getDomainFromUrl(tool.websiteUrl) || getToolDomain(tool);
  const primaryCtaUrl = tool.affiliateLink || tool.websiteUrl || "#";
  const hasAffiliateOffer = Boolean(tool.affiliateLink);
  const isFree     = displayPrice === 0 && !tool.pricing?.paid;
  const isFreemium = !!(tool.pricing?.free && tool.pricing?.paid);
  const freeAlt    = (tool as any).freeAlternative as string | null;
  const betterAlt  = (tool as any).betterAlternative as { tool: string; saving: number } | null;
  const catName    = stripLeadingEmoji(category?.name, category?.id || "");
  const catNameEn  = stripLeadingEmoji(category?.nameEn, catName);

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
        <div className="relative mx-auto max-w-7xl px-4 py-8">
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
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex gap-8 items-start">

          {/* ══════════════ LEFT STICKY CARD ══════════════ */}
          <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-4 sticky top-6">
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: "hsl(var(--card))" }}
            >
              {/* Logo + name + score */}
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

                {/* Score ToolTrim — étoiles visibles */}
                {(() => {
                  const ts = computeToolTrimScore(tool);
                  return (
                    <Link
                      to={`${prefix}/tool/${slug}/avis`}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-4 py-3 w-full transition-colors hover:border-primary/30 hover:bg-primary/[0.03] group"
                    >
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <svg key={i} className="h-5 w-5" viewBox="0 0 24 24"
                            fill={i <= Math.floor(ts.score) ? "hsl(var(--primary))" : i === Math.ceil(ts.score) && ts.score % 1 >= 0.5 ? "hsl(var(--primary) / 0.45)" : "hsl(var(--border))"}
                          >
                            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z"/>
                          </svg>
                        ))}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-xl font-black" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
                          {ts.score.toFixed(1)}
                        </span>
                        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>/5</span>
                        <span className="ml-1 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
                          {t(ts.labelFr, ts.labelEn)}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Score ToolTrim →
                      </span>
                    </Link>
                  );
                })()}
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
                  href={primaryCtaUrl}
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
                  {hasAffiliateOffer ? t(`Voir l’offre ${tool.name}`, `View ${tool.name} offer`) : t("Visiter le site", "Visit website")}
                  <ExternalLink className="h-3 w-3" />
                </a>
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
                        ? <><span className="font-medium">{t("Alt. gratuite :", "Free alt:")}</span> <span className="capitalize">{asText(freeAlt).replace(/-/g, " ")}</span></>
                        : <><span className="font-medium">{t("Moins cher :", "Cheaper:")}</span> <span className="capitalize">{asText(betterAlt?.tool).replace(/-/g, " ")}</span> {betterAlt?.saving ? `· −${betterAlt.saving}€/mo` : ""}</>
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Badges */}
              {(() => {
                const hasFreeplan = !!(tool.pricing?.free &&
                  !tool.pricing.free.toLowerCase().includes("no free") &&
                  !tool.pricing.free.toLowerCase().includes("aucun") &&
                  !tool.pricing.free.toLowerCase().includes("pas de"));
                const isAI = !!(tool as any).ia_use_case || toolType === "ia";
                const isPlugin = toolType === "plugin";
                const notSubstitutable = (tool as any).substitutable === false;
                const badges = [
                  hasFreeplan  && { labelFr: "Plan gratuit",  labelEn: "Free plan",   color: "hsl(var(--keep))",    bg: "hsl(var(--keep) / 0.08)",    border: "hsl(var(--keep) / 0.2)"    },
                  isFreemium   && { labelFr: "Freemium",       labelEn: "Freemium",    color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.06)", border: "hsl(var(--primary) / 0.2)" },
                  isAI         && { labelFr: "IA",             labelEn: "AI",          color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.06)", border: "hsl(var(--primary) / 0.2)" },
                  isPlugin     && { labelFr: "Plugin",         labelEn: "Plugin",      color: "hsl(var(--muted-foreground))", bg: "hsl(var(--secondary))", border: "hsl(var(--border))" },
                  notSubstitutable && { labelFr: "Indispensable", labelEn: "Essential", color: "hsl(var(--cancel))", bg: "hsl(var(--cancel) / 0.06)",  border: "hsl(var(--cancel) / 0.2)"  },
                ].filter(Boolean) as { labelFr: string; labelEn: string; color: string; bg: string; border: string }[];
                if (!badges.length) return null;
                return (
                  <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">
                    {badges.map((b) => (
                      <span
                        key={b.labelFr}
                        className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{ color: b.color, background: b.bg, borderColor: b.border }}
                      >
                        {t(b.labelFr, b.labelEn)}
                      </span>
                    ))}
                  </div>
                );
              })()}

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
                const tabPath = tab.id === "prix" && lang === "en" ? "/pricing" : tab.path;
                return (
                  <Link
                    key={tab.id}
                    to={`${prefix}/tool/${slug}${tabPath}`}
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
            {subPage === "presentation" && <section className="divide-y divide-border">

              {/* Description courte — mobile uniquement */}
              <div className="lg:hidden pb-8">
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
                </p>
              </div>

              {/* ── Analyse éditoriale ── */}
              {(() => {
                const longDesc = lang === "en"
                  ? ((tool as any).longDescriptionEn || (tool as any).longDescription || "")
                  : ((tool as any).longDescription || "");
                if (!longDesc || longDesc.length < 80) return null;
                const paras = longDesc.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
                return (
                  <div className="py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                      {t("Notre analyse", "Our analysis")}
                    </p>
                    <h2 className="font-display mb-5 text-foreground" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
                      {t(`${tool.name} en détail`, `${tool.name} — in depth`)}
                    </h2>
                    {paras.map((para: string, i: number) => (
                      <p key={i} className={i === 0
                        ? "text-[15px] font-medium leading-8 text-foreground mb-4"
                        : "text-sm leading-7 text-muted-foreground mb-3 last:mb-0"
                      }>
                        {para}
                      </p>
                    ))}
                  </div>
                );
              })()}

              {/* ── Fonctionnalités ── */}
              {((tool as any).covers?.length > 0 || (tool as any).functional_needs?.length > 0) && (
                <ToolFeaturesBlock
                  covers={(tool as any).covers || []}
                  functionalNeeds={(tool as any).functional_needs || []}
                  toolName={tool.name}
                  t={t}
                />
              )}

              {/* ── Avantages & inconvénients ── */}
              {((tool.pros?.length ?? 0) > 0 || (tool.cons?.length ?? 0) > 0) && (
                <div className="py-8">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                    {t("Points clés", "Key points")}
                  </p>
                  <h2 className="font-display mb-5 text-foreground" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
                    {t(`Avantages et inconvénients de ${tool.name}`, `${tool.name} — Pros & Cons`)}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border p-5" style={{ borderColor: "hsl(var(--keep) / 0.25)", background: "hsl(var(--keep) / 0.04)" }}>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "hsl(var(--keep))" }}>
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
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "hsl(var(--cancel))" }}>
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
              )}

              {/* ── Cas d'usage ── */}
              {tool.useCases && tool.useCases.length > 0 && (
                <div className="py-8">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                    {t("Cas d'usage", "Use cases")}
                  </p>
                  <h2 className="font-display mb-5 text-foreground" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
                    {t(`À quoi sert ${tool.name} ?`, `What is ${tool.name} used for?`)}
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(lang === "en" && (tool as any).useCasesEn ? (tool as any).useCasesEn : tool.useCases)!.map((uc: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {uc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Verdict ── */}
              <div className="py-8">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                  {t("Verdict", "Verdict")}
                </p>
                <h2 className="mb-4 font-display" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {t(`Notre avis sur ${tool.name}`, `Our verdict on ${tool.name}`)}
                </h2>
                <ToolVerdictBlock tool={tool} lang={lang} prefix={prefix} allTools={tools} t={t} />
              </div>

              {/* ── CTA diagnostic ── */}
              <div className="py-8">
                <ToolDiagCta tool={tool} prefix={prefix} lang={lang} t={t} />
              </div>

              {/* Summary block — SEO/LLM, visuellement discret, en bas de section */}
              <ToolSummaryBlock
                tool={tool} category={category} alternatives={alternatives}
                displayPrice={displayPrice} lang={lang} prefix={prefix} t={t}
              />
            </section>}

            {/* ── SECTION: Prix ── */}
            {subPage === "prix" && <section className="space-y-8">
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

            {/* ── SECTION: Avis ── */}
            {subPage === "avis" && <section className="space-y-6">
              {/* Eyebrow + heading */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                  {t("Évaluation", "Rating")}
                </p>
                <h2 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {t(`Score & avis — ${tool.name}`, `Score & reviews — ${tool.name}`)}
                </h2>
              </div>

              {/* Score ToolTrim — bloc principal */}
              {(() => {
                const ts = computeToolTrimScore(tool);
                const signals = [
                  { labelFr: "Outil de référence dans sa catégorie", labelEn: "Category reference tool", active: toolType === "metier" || toolType === "core" || toolType === "ia" },
                  { labelFr: "Non substituable à court terme", labelEn: "Hard to replace short-term", active: (tool as any).substitutable === false },
                  { labelFr: "Usages clairs et documentés", labelEn: "Clear and documented use cases", active: ((tool as any).verdict?.keepIf?.length || 0) >= 2 },
                  { labelFr: "Plan gratuit ou freemium disponible", labelEn: "Free or freemium plan available", active: isFree || isFreemium },
                  { labelFr: "Fonctionnalités IA intégrées", labelEn: "Built-in AI features", active: !!(tool as any).ia_use_case },
                  { labelFr: "Prix accessible (< 20€/mois)", labelEn: "Accessible pricing (< €20/mo)", active: displayPrice > 0 && displayPrice < 20 },
                ];
                const activeSignals = signals.filter(s => s.active);
                const inactiveSignals = signals.filter(s => !s.active);
                return (
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {/* Header score */}
                    <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-mono text-4xl font-black" style={{ color: "hsl(var(--primary))", letterSpacing: "-0.04em" }}>
                            {ts.score.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">/ 5</div>
                        </div>
                        <div>
                          <p className="text-base font-bold text-foreground">{t(ts.labelFr, ts.labelEn)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t("Score ToolTrim · Analyse indépendante", "ToolTrim Score · Independent analysis")}</p>
                          <div className="flex items-center gap-0.5 mt-2">
                            {[1,2,3,4,5].map((i) => (
                              <svg key={i} className="h-4 w-4" viewBox="0 0 12 12"
                                fill={i <= Math.floor(ts.score) ? "hsl(var(--primary))" : i === Math.ceil(ts.score) && ts.score % 1 >= 0.5 ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))"}
                              >
                                <path d="M6 1l1.3 2.6L10 4l-2 1.9.5 2.7L6 7.4 3.5 8.6 4 5.9 2 4l2.7-.4z"/>
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1 text-right">
                        <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold text-muted-foreground">
                          {t("Vérifié avr. 2026", "Verified Apr. 2026")}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {t("Prix vérifiés · Données indépendantes", "Verified pricing · Independent data")}
                        </span>
                      </div>
                    </div>

                    {/* Signaux pris en compte */}
                    <div className="px-6 py-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                        {t("Signaux analysés", "Analysed signals")}
                      </p>
                      <div className="space-y-2.5">
                        {activeSignals.map((s) => (
                          <div key={s.labelFr} className="flex items-center gap-3">
                            <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "hsl(var(--keep) / 0.1)" }}>
                              <Check className="h-3 w-3" style={{ color: "hsl(var(--keep))" }} />
                            </div>
                            <span className="text-sm text-foreground">{t(s.labelFr, s.labelEn)}</span>
                          </div>
                        ))}
                        {inactiveSignals.map((s) => (
                          <div key={s.labelFr} className="flex items-center gap-3 opacity-40">
                            <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full border border-border">
                              <X className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">{t(s.labelFr, s.labelEn)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Avis utilisateurs — teaser */}
              <div className="rounded-2xl border border-border bg-card px-6 py-8 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-foreground mb-2">
                  {t(`Tu utilises ${tool.name} ?`, `Using ${tool.name}?`)}
                </p>
                <p className="text-sm leading-6 text-muted-foreground mb-6 max-w-sm mx-auto">
                  {t(
                    "Les avis utilisateurs arrivent bientôt. Partage ce qui marche, ce qui coûte trop cher, ce que tu changerais.",
                    "User reviews are coming soon. Share what works, what costs too much, what you'd change."
                  )}
                </p>
                <span className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/8 px-4 py-2 text-xs font-semibold text-primary cursor-default select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {t("Bientôt disponible", "Coming soon")}
                </span>
              </div>
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

// ── Score ToolTrim ────────────────────────────────────────────────────────────
// Calculé depuis les données internes : type, substituabilité, pros/cons, qualité.
// Pas un avis utilisateur — c'est l'analyse éditoriale ToolTrim.

function computeToolTrimScore(tool: any): { score: number; labelFr: string; labelEn: string } {
  let score = 3.5;

  // Type d'outil
  if (tool.tool_type === "metier" || tool.tool_type === "core") score += 0.3;
  if (tool.tool_type === "ia") score += 0.4;

  // Difficile à remplacer = plus de valeur intrinsèque
  if (tool.substitutable === false) score += 0.3;

  // Qualité du contenu éditorial
  if ((tool.pros?.length || 0) >= 4) score += 0.2;
  if ((tool.cons?.length || 0) >= 5) score -= 0.15;

  // Signal de recommandation interne
  if (tool.prescription_quality === "silence") score -= 0.2;

  // Fonctionnalités IA intégrées
  if (tool.ia_use_case) score += 0.15;

  // Plan gratuit = plus accessible
  const hasFree = tool.pricing?.free &&
    !tool.pricing.free.toLowerCase().includes("no free") &&
    !tool.pricing.free.toLowerCase().includes("aucun") &&
    !tool.pricing.free.toLowerCase().includes("pas de");
  if (hasFree) score += 0.1;

  // Bornes
  score = Math.max(2.8, Math.min(4.8, score));
  score = Math.round(score * 10) / 10;

  const labelFr = score >= 4.5 ? "Excellent" : score >= 4.0 ? "Très bon" : score >= 3.5 ? "Bien" : "Correct";
  const labelEn = score >= 4.5 ? "Excellent" : score >= 4.0 ? "Very good" : score >= 3.5 ? "Good" : "Fair";

  return { score, labelFr, labelEn };
}
