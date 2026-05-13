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
import ToolComparisonTable from "@/components/tool/ToolComparisonTable";
import ToolAudienceBlock from "@/components/tool/ToolAudienceBlock";
import ToolPluginsBlock from "@/components/tool/ToolPluginsBlock";
import { computeToolTrimScore, starFill } from "@/lib/toolTrimScore";
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

    // Unique per-tool signal: first sentence of shortDescription (≤ 90 chars)
    const rawExcerpt = (tool.shortDescription || "").split(/[.!?]/)[0].trim();
    const shortExcerpt = rawExcerpt.length > 90 ? rawExcerpt.slice(0, 87) + "…" : rawExcerpt;

    // Category label for context (computed inside effect to avoid ordering dependency)
    const cat = categories.find((c: any) => c.id === tool.categoryId);
    const catLabel = cat
      ? stripLeadingEmoji(cat.name, cat.id || "")
      : lang === "fr" ? "outil SaaS" : "SaaS tool";

    const SEO: Record<string, { titleFr: string; titleEn: string; descFr: string; descEn: string; suffix: string }> = {
      // Presentation = hub page: focuses on "vaut-il le coût" / pricing signal, NOT "Avis"
      presentation: {
        titleFr: hasPrice
          ? `${tool.name} ${year} : Vaut-il ${priceRounded}€/mois ? Prix & Verdict | ToolTrim`
          : `${tool.name} ${year} : Vraiment gratuit ? Plans & Verdict honnête | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name} ${year}: Worth €${priceRounded}/mo? Pricing & Verdict | ToolTrim`
          : `${tool.name} ${year}: Really Free? Plans & Honest Verdict | ToolTrim`,
        descFr: shortExcerpt
          ? `${shortExcerpt}. ${hasPrice ? `Coûte ${price}€/mois${planSuffixFr} — vaut-il le coût ?` : "Gratuit ou freemium ?"} Alternatives et verdict ToolTrim ${year}.`
          : hasPrice
            ? `${tool.name} coûte ${price}€/mois${planSuffixFr}. Verdict ToolTrim : vaut-il le coût ? Meilleures alternatives moins chères en ${year}.`
            : `${tool.name} est-il vraiment gratuit ? Plans, tarifs cachés et meilleures alternatives analysés — mis à jour ${year}.`,
        descEn: shortExcerpt
          ? `${shortExcerpt}. ${hasPrice ? `Costs €${price}/mo${planSuffixEn} — is it worth it?` : "Free or freemium?"} Alternatives and ToolTrim verdict ${year}.`
          : hasPrice
            ? `${tool.name} costs €${price}/mo${planSuffixEn}. ToolTrim verdict: is it worth it? Best cheaper alternatives for ${year}.`
            : `Is ${tool.name} really free? Plans, hidden costs and best alternatives — updated ${year}.`,
        suffix: "",
      },
      prix: {
        titleFr: hasPrice
          ? `${tool.name} Prix ${year} : ${priceRounded}€/mois — Tous les Plans & Tarifs | ToolTrim`
          : `${tool.name} Tarifs ${year} : Gratuit, Freemium ou Payant ? | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name} Pricing ${year}: €${priceRounded}/mo — All Plans & Costs | ToolTrim`
          : `${tool.name} Pricing ${year}: Free, Freemium or Paid? | ToolTrim`,
        descFr: hasPrice
          ? `Combien coûte ${tool.name} en ${year} ? ${priceRounded}€/mois${planName ? ` (plan ${planName})` : ""}${shortExcerpt ? ` — ${shortExcerpt.charAt(0).toLowerCase() + shortExcerpt.slice(1)}.` : "."} Détail des plans et alternatives moins chères.`
          : `${tool.name} est-il gratuit en ${year} ?${shortExcerpt ? ` ${shortExcerpt}.` : ""} Plans gratuits, freemium et payants comparés avec les meilleures alternatives.`,
        descEn: hasPrice
          ? `How much does ${tool.name} cost in ${year}? €${priceRounded}/mo${planName ? ` (${planName} plan)` : ""}${shortExcerpt ? ` — ${shortExcerpt.charAt(0).toLowerCase() + shortExcerpt.slice(1)}.` : "."} All plans and cheaper alternatives.`
          : `Is ${tool.name} free in ${year}?${shortExcerpt ? ` ${shortExcerpt}.` : ""} Free, freemium and paid plans compared with top alternatives.`,
        suffix: "/prix",
      },
      // Alternatives = category-aware, mentions catLabel for context
      alternatives: {
        titleFr: hasPrice
          ? `Alternatives à ${tool.name} moins chères en ${year} | ToolTrim`
          : `Meilleures alternatives à ${tool.name} — ${catLabel} | ToolTrim`,
        titleEn: hasPrice
          ? `Cheaper ${tool.name} Alternatives in ${year} | ToolTrim`
          : `Best ${tool.name} Alternatives — ${catLabel} | ToolTrim`,
        descFr: hasPrice
          ? `Vous payez ${priceRounded}€/mois pour ${tool.name} (${catLabel}) ? Voici les meilleures alternatives moins chères ou gratuites — comparées par ToolTrim en ${year}.`
          : `Quelles sont les meilleures alternatives à ${tool.name} en ${catLabel} ? ToolTrim compare les options gratuites, freemium et payantes les plus adaptées en ${year}.`,
        descEn: hasPrice
          ? `Paying €${priceRounded}/mo for ${tool.name} (${catLabel})? Best cheaper or free alternatives — compared by ToolTrim for ${year}.`
          : `What are the best alternatives to ${tool.name} in ${catLabel}? ToolTrim compares the top free, freemium and paid options for ${year}.`,
        suffix: "/alternatives",
      },
      // Avis = owns the "Avis / Reviews" keyword, NOT presentation
      avis: {
        titleFr: `Avis ${tool.name} ${year} : Note ToolTrim & Retours d'expérience | ToolTrim`,
        titleEn: `${tool.name} Reviews ${year}: ToolTrim Rating & User Feedback | ToolTrim`,
        descFr: shortExcerpt
          ? `${shortExcerpt}. Score ToolTrim, analyse indépendante et retours d'utilisateurs sur ${tool.name} en ${year}.`
          : `Score ToolTrim pour ${tool.name}, analyse indépendante et retours d'utilisateurs. Verdict honnête sur la valeur réelle en ${year}.`,
        descEn: shortExcerpt
          ? `${shortExcerpt}. ToolTrim score, independent analysis and user feedback on ${tool.name} for ${year}.`
          : `ToolTrim score for ${tool.name}, independent analysis and user feedback. Honest verdict on real value in ${year}.`,
        suffix: "/avis",
      },
      faq: {
        titleFr: `${tool.name} FAQ ${year} : Prix, Utilité & Alternatives | ToolTrim`,
        titleEn: `${tool.name} FAQ ${year}: Pricing, Use Cases & Alternatives | ToolTrim`,
        descFr: shortExcerpt
          ? `${shortExcerpt}. Prix, plans, cas d'usage et alternatives à ${tool.name} — toutes les réponses clés en ${year}.`
          : `Tout ce que vous devez savoir sur ${tool.name} : prix, plans, utilité et meilleures alternatives — mis à jour ${year}.`,
        descEn: shortExcerpt
          ? `${shortExcerpt}. Pricing, plans, use cases and alternatives to ${tool.name} — all key answers for ${year}.`
          : `Everything you need to know about ${tool.name}: pricing, plans, use cases and best alternatives — updated ${year}.`,
        suffix: "/faq",
      },
    };

    const meta = SEO[subPage] ?? SEO.presentation;
    const seoTitle = lang === "fr" ? meta.titleFr : meta.titleEn;
    const seoDesc  = lang === "fr" ? meta.descFr  : meta.descEn;
    const canonicalSuffix =
      subPage === "prix" && lang === "en" ? "/pricing" :
      subPage === "avis" && lang === "en" ? "/reviews" :
      meta.suffix;
    const canonicalUrl = `${SEO_BASE}/${lang}/tool/${baseSlug}${canonicalSuffix}`;

    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setMeta("article:modified_time", tool.pricing_v5?.verified_on || "2026-03-29");
    setHreflang(`/${lang}/tool/${baseSlug}${canonicalSuffix}`);
    return () => cleanupSeo([]);
  }, [tool, lang, subPage, categories]);


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
        canonicalUrl={`https://tooltrim.com/${lang}/tool/${tool.slug || tool.id}${
          subPage === "prix" ? (lang === "en" ? "/pricing" : "/prix") :
          subPage === "alternatives" ? "/alternatives" :
          subPage === "avis" ? (lang === "en" ? "/reviews" : "/avis") :
          subPage === "faq" ? "/faq" : ""
        }`}
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
              fontSize: "clamp(1.375rem, 3vw, 2.125rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.14,
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
          <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-3 sticky top-6">

            {/* ── Main card ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 1px 6px hsl(var(--foreground) / 0.05)",
              }}
            >
              {/* Identity: logo + name + category */}
              <div className="flex flex-col items-center gap-2.5 px-5 pt-6 pb-5 text-center">
                <ToolLogo tool={tool} size={72} className="rounded-2xl" style={{ boxShadow: "0 4px 16px hsl(var(--foreground) / 0.10)" }} />
                <div className="space-y-1">
                  <p className="font-display" style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
                    {tool.name}
                  </p>
                  {category && (
                    <Link
                      to={`${prefix}/category/${category.slug}`}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors hover:text-primary"
                      style={{
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                      {t(catName, catNameEn)}
                    </Link>
                  )}
                </div>

                {/* Score compact — une seule ligne */}
                {(() => {
                  const ts = computeToolTrimScore(tool);
                  return (
                    <Link
                      to={`${prefix}/tool/${slug}/avis`}
                      className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 w-full transition-colors hover:bg-secondary/60 group"
                      style={{ background: "hsl(var(--secondary) / 0.5)" }}
                    >
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((i) => (
                          <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={starFill(i, ts.score)}>
                            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="font-mono text-sm font-bold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>
                        {ts.score.toFixed(1)}
                      </span>
                      <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {t(ts.labelFr, ts.labelEn)}
                      </span>
                      <ArrowRight className="ml-auto h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity" />
                    </Link>
                  );
                })()}
              </div>

              {/* Price + CTA — hero block */}
              <div className="px-5 pb-5 space-y-3">
                {/* Price display */}
                <div className="text-center">
                  {isFree || isFreemium ? (
                    <div>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold"
                        style={{
                          background: "hsl(var(--primary) / 0.08)",
                          color: "hsl(var(--primary))",
                          border: "1px solid hsl(var(--primary) / 0.2)",
                        }}
                      >
                        {isFree ? t("Gratuit", "Free") : "Freemium"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="num-mono" style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", color: "hsl(var(--foreground))" }}>
                          {displayPrice}€
                        </span>
                        <span style={{ fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>
                          /{t("mois", "mo")}
                        </span>
                      </div>
                      {tool.pricing_v5?.compare_plan_name && (
                        <p className="mt-0.5 text-[11px] uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground) / 0.5)", letterSpacing: "0.08em" }}>
                          {t("Plan", "Plan")} {tool.pricing_v5.compare_plan_name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <a
                  href={primaryCtaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[0.8125rem] font-semibold transition-opacity hover:opacity-85"
                  style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
                >
                  {hasAffiliateOffer ? t(`Voir l’offre`, `View offer`) : t("Visiter le site", "Visit website")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                {/* Savings signal — inline sous le CTA */}
                {(freeAlt || betterAlt) && (
                  <div
                    className="flex items-start gap-1.5 rounded-lg px-3 py-2 text-[11px]"
                    style={{
                      background: freeAlt ? "hsl(var(--savings) / 0.07)" : "hsl(var(--cancel) / 0.06)",
                      color: freeAlt ? "hsl(var(--savings))" : "hsl(var(--cancel))",
                    }}
                  >
                    {freeAlt
                      ? <Sparkles className="h-3 w-3 shrink-0 mt-px" />
                      : <TrendingDown className="h-3 w-3 shrink-0 mt-px" />
                    }
                    <span>
                      {freeAlt
                        ? <>{t("Alt. gratuite :", "Free alt:")} <span className="font-medium capitalize">{asText(freeAlt).replace(/-/g, " ")}</span></>
                        : <>{t("Moins cher :", "Cheaper:")} <span className="font-medium capitalize">{asText(betterAlt?.tool).replace(/-/g, " ")}</span>{betterAlt?.saving ? ` · −${betterAlt.saving}€` : ""}</>
                      }
                    </span>
                  </div>
                )}
              </div>

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
                  <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-5 py-3.5">
                    {badges.map((b) => (
                      <span
                        key={b.labelFr}
                        className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ color: b.color, background: b.bg, borderColor: b.border }}
                      >
                        {t(b.labelFr, b.labelEn)}
                      </span>
                    ))}
                  </div>
                );
              })()}

              {/* Key facts */}
              <div className="border-t border-border/60 px-5 py-3.5 space-y-2.5" style={{ fontSize: "0.75rem" }}>
                {toolType && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{t("Type", "Type")}</span>
                    <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                      {lang === "fr" ? TYPE_LABEL[toolType]?.fr : TYPE_LABEL[toolType]?.en}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{t("Remplaçable", "Replaceable")}</span>
                  <span style={{ color: (tool as any).substitutable ? "hsl(var(--savings))" : "hsl(var(--muted-foreground))" }}>
                    {(tool as any).substitutable ? t("Oui", "Yes") : t("Non", "No")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <ShieldCheck className="h-3 w-3" />
                    {t("Vérifié", "Verified")}
                  </span>
                  <time dateTime={verifiedOn} className="num-mono" style={{ color: "hsl(var(--muted-foreground) / 0.55)", fontSize: "0.7rem" }}>
                    {verifiedOn}
                  </time>
                </div>
              </div>
            </div>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div>
                <p className="label-section mb-2">{t("Guides liés", "Related guides")}</p>
                <div className="flex flex-col gap-1.5">
                  {relatedPosts.map((post: any) => (
                    <Link
                      key={post.slug}
                      to={`${prefix}/guide/${post.slug}`}
                      className="block rounded-xl border border-border bg-card px-3 py-2.5 text-[0.8125rem] transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <p className="font-medium text-foreground line-clamp-2 leading-snug">{post.title}</p>
                      {post.readTime && (
                        <p className="mt-1 text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
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

            {/* ── Mobile summary card (lg:hidden — sidebar is hidden on mobile) ── */}
            {(() => {
              const ts = computeToolTrimScore(tool);
              const hasFreeplanMobile = !!(tool.pricing?.free &&
                !tool.pricing.free.toLowerCase().includes("no free") &&
                !tool.pricing.free.toLowerCase().includes("aucun") &&
                !tool.pricing.free.toLowerCase().includes("pas de"));
              const isAIMobile = !!(tool as any).ia_use_case || toolType === "ia";
              const notSubMobile = (tool as any).substitutable === false;

              return (
                <div className="lg:hidden mb-6 rounded-xl border border-border bg-card overflow-hidden">
                  {/* Top row: logo + name + price */}
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                    <ToolLogo tool={tool} size={44} className="rounded-xl shadow-sm shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-foreground truncate" style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                        {tool.name}
                      </p>
                      {category && (
                        <Link
                          to={`${prefix}/category/${category.slug}`}
                          className="text-xs hover:text-primary transition-colors"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {t(catName, catNameEn)}
                        </Link>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {isFree || isFreemium ? (
                        <span
                          className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold"
                          style={{
                            borderColor: "hsl(var(--primary) / 0.3)",
                            background: "hsl(var(--primary) / 0.08)",
                            color: "hsl(var(--primary))",
                            fontFamily: "ui-monospace, monospace",
                          }}
                        >
                          {isFree ? t("Gratuit", "Free") : "Freemium"}
                        </span>
                      ) : (
                        <p style={{ fontFamily: "ui-monospace, monospace" }}>
                          <span className="text-lg font-black text-foreground">{displayPrice}€</span>
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>/{t("mois", "mo")}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score row */}
                  <Link
                    to={`${prefix}/tool/${slug}/avis`}
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((i) => (
                          <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill={starFill(i, ts.score)}>
                            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="font-mono font-black text-sm" style={{ color: "hsl(var(--foreground))" }}>
                        {ts.score.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
                        {t(ts.labelFr, ts.labelEn)}
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "ui-monospace, monospace" }}>
                      Score ToolTrim →
                    </span>
                  </Link>

                  {/* Badges + CTA */}
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {hasFreeplanMobile && (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: "hsl(var(--keep))", background: "hsl(var(--keep)/0.08)", borderColor: "hsl(var(--keep)/0.2)" }}>
                          {t("Plan gratuit", "Free plan")}
                        </span>
                      )}
                      {isAIMobile && (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.06)", borderColor: "hsl(var(--primary)/0.2)" }}>
                          IA
                        </span>
                      )}
                      {notSubMobile && (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: "hsl(var(--cancel))", background: "hsl(var(--cancel)/0.06)", borderColor: "hsl(var(--cancel)/0.2)" }}>
                          {t("Indispensable", "Essential")}
                        </span>
                      )}
                    </div>
                    {primaryCtaUrl && (
                      <a
                        href={primaryCtaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shrink-0 transition-colors"
                        style={{
                          background: "hsl(var(--foreground))",
                          color: "hsl(var(--background))",
                          fontFamily: "inherit",
                        }}
                      >
                        {t("Visiter", "Visit")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

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
                    className="relative shrink-0 px-4 py-3 transition-colors duration-150"
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: isActive ? 500 : 400,
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

              {/* Description courte — lead paragraph, toujours visible */}
              {tool.shortDescription && (
                <div className="pb-8">
                  <p
                    className="text-foreground leading-7"
                    style={{ fontSize: "0.9375rem", maxWidth: "72ch", fontWeight: 400 }}
                  >
                    {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
                  </p>
                </div>
              )}

              {/* ── Analyse éditoriale ── */}
              {(() => {
                const longDesc = lang === "en"
                  ? ((tool as any).longDescriptionEn || (tool as any).longDescription || "")
                  : ((tool as any).longDescription || "");
                if (!longDesc || longDesc.length < 80) return null;
                const paras = longDesc.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
                return (
                  <div className="py-8" style={{ fontFamily: "inherit" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                      {t("Notre analyse", "Our analysis")}
                    </p>
                    <h2 className="font-display mb-5 text-foreground" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
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

              {/* ── Plugins / Host app / Bundle ── */}
              <ToolPluginsBlock
                tool={tool} allTools={tools}
                prefix={prefix} lang={lang} t={t}
              />

              {/* ── Avantages & inconvénients ── */}
              {((tool.pros?.length ?? 0) > 0 || (tool.cons?.length ?? 0) > 0) && (
                <div className="py-8">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                    {t("Points clés", "Key points")}
                  </p>
                  <h2 className="font-display mb-5 text-foreground" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                    {t(`Avantages et inconvénients de ${tool.name}`, `${tool.name} — Pros & Cons`)}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border p-5" style={{ borderColor: "hsl(var(--keep) / 0.25)", background: "hsl(var(--keep) / 0.04)" }}>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "hsl(var(--keep))" }}>
                        <Check className="h-4 w-4" /> {t("Avantages", "Pros")}
                      </h3>
                      <ul className="space-y-2">
                        {(lang === "en" && (tool as any).prosEn ? (tool as any).prosEn : tool.pros)?.map((pro: string) => (
                          <li key={pro} className="flex items-start gap-2 text-sm" style={{ color: "hsl(var(--foreground) / 0.8)", fontFamily: "inherit" }}>
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
                          <li key={con} className="flex items-start gap-2 text-sm" style={{ color: "hsl(var(--foreground) / 0.8)", fontFamily: "inherit" }}>
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
                  <h2 className="font-display mb-5 text-foreground" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                    {t(`À quoi sert ${tool.name} ?`, `What is ${tool.name} used for?`)}
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(lang === "en" && (tool as any).useCasesEn ? (tool as any).useCasesEn : tool.useCases)!.map((uc: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-sm" style={{ fontFamily: "inherit" }}>
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {uc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Pour qui ? ── */}
              {((tool as any).relevantFor?.length > 0) && (
                <ToolAudienceBlock
                  relevantFor={(tool as any).relevantFor || []}
                  soloRelevance={tool.soloRelevance}
                  teamRelevance={tool.teamRelevance}
                  toolName={tool.name}
                  t={t}
                />
              )}

              {/* ── Verdict ── */}
              <div className="py-8">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
                  {t("Verdict", "Verdict")}
                </p>
                <h2 className="mb-4 font-display" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
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

              {/* Intro prose — keyword-rich context for this tab */}
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                  {t("Tarifs", "Pricing")}
                </p>
                <h2 className="font-display" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t(`Combien coûte ${tool.name} ?`, `How much does ${tool.name} cost?`)}
                </h2>
                <p
                  className="text-sm leading-7 pt-1"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit", maxWidth: "72ch" }}
                >
                  {lang === "fr"
                    ? (() => {
                        if (displayPrice === 0)
                          return `${tool.name} propose un plan gratuit${tool.shortDescription ? ` — ${tool.shortDescription.split(/[.!?]/)[0].toLowerCase()}` : ""}. Voici le détail complet des plans disponibles en ${new Date().getFullYear()}.`;
                        const plan = tool.pricing_v5?.compare_plan_name;
                        return `${tool.name} est facturé ${displayPrice}€/mois${plan ? ` (plan ${plan})` : ""}${tool.shortDescription ? ` — ${tool.shortDescription.split(/[.!?]/)[0].toLowerCase()}` : ""}. Voici le détail des tarifs et ce qu'ils incluent réellement.`;
                      })()
                    : (() => {
                        if (displayPrice === 0)
                          return `${tool.name} offers a free plan${tool.shortDescription ? ` — ${((tool as any).shortDescriptionEn || tool.shortDescription).split(/[.!?]/)[0].toLowerCase()}` : ""}. Here's the full breakdown of available plans for ${new Date().getFullYear()}.`;
                        const plan = tool.pricing_v5?.compare_plan_name;
                        return `${tool.name} is priced at €${displayPrice}/mo${plan ? ` (${plan} plan)` : ""}${tool.shortDescription ? ` — ${((tool as any).shortDescriptionEn || tool.shortDescription).split(/[.!?]/)[0].toLowerCase()}` : ""}. Here's what each plan actually includes.`;
                      })()
                  }
                </p>
              </div>

              <ToolPricingSection
                tool={tool} displayPrice={displayPrice}
                verifiedOn={verifiedOn} sourceDomain={sourceDomain}
                prefix={prefix} lang={lang} t={t}
              />
            </section>}

            {/* ── SECTION: Alternatives ── */}
            {subPage === "alternatives" && <section className="space-y-8">

              {/* Intro prose */}
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                  {t("Comparatif", "Comparison")}
                </p>
                <h2 className="font-display" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t(`Meilleures alternatives à ${tool.name}`, `Best alternatives to ${tool.name}`)}
                </h2>
                <p
                  className="text-sm leading-7 pt-1"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit", maxWidth: "72ch" }}
                >
                  {lang === "fr"
                    ? `${alternatives.length > 0 ? `${alternatives.length} alternatives` : "Des alternatives"} à ${tool.name}${catName ? ` dans la catégorie ${catName}` : ""} comparées selon le prix, les fonctionnalités et la pertinence pour les indépendants et petites équipes.${displayPrice > 0 ? ` Certaines sont gratuites ou moins chères que les ${displayPrice}€/mois de ${tool.name}.` : ""}`
                    : `${alternatives.length > 0 ? `${alternatives.length} alternatives` : "Alternatives"} to ${tool.name}${catNameEn ? ` in the ${catNameEn} category` : ""} compared by price, features, and fit for freelancers and small teams.${displayPrice > 0 ? ` Some are free or cheaper than ${tool.name}'s €${displayPrice}/mo.` : ""}`
                  }
                </p>
              </div>

              {/* Comparison table — first thing user sees */}
              {alternatives.length > 0 && (
                <ToolComparisonTable
                  tool={tool} alternatives={alternatives}
                  prefix={prefix} lang={lang} t={t}
                />
              )}

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
                      style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.015em" }}
                    >
                      {t("Outils substituables directement", "Direct substitutes")}
                    </h3>
                    <p
                      className="mb-4 text-sm"
                      style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit" }}
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
                          style={{ fontFamily: "inherit" }}
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
                      style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.015em" }}
                    >
                      {t(`Comparer ${tool.name} avec`, `Compare ${tool.name} with`)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {compareTools.map(({ slugPair, other }) => (
                        <Link
                          key={slugPair}
                          to={`${prefix}/comparatif/${slugPair}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-all hover:border-primary/30 hover:text-primary"
                          style={{ fontFamily: "inherit" }}
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
              {/* Eyebrow + heading + intro prose */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                  {t("Évaluation", "Rating")}
                </p>
                <h2 className="font-display" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t(`Avis sur ${tool.name} — Note & Verdict ToolTrim`, `${tool.name} Reviews — ToolTrim Rating & Verdict`)}
                </h2>
                <p
                  className="text-sm leading-7 pt-1"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit", maxWidth: "72ch" }}
                >
                  {lang === "fr"
                    ? `${tool.shortDescription ? `${tool.shortDescription.split(/[.!?]/)[0]}. ` : ""}Notre analyse indépendante de ${tool.name} en ${new Date().getFullYear()} : score éditorial, signaux de valeur, points forts et limites identifiés.`
                    : `${(tool as any).shortDescriptionEn ? `${((tool as any).shortDescriptionEn as string).split(/[.!?]/)[0]}. ` : tool.shortDescription ? `${tool.shortDescription.split(/[.!?]/)[0]}. ` : ""}Our independent analysis of ${tool.name} for ${new Date().getFullYear()}: editorial score, value signals, key strengths and identified limitations.`
                  }
                </p>
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
                                fill={starFill(i, ts.score)}
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

              {/* Intro prose — same treatment as all other tabs */}
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                  {t("FAQ", "FAQ")}
                </p>
                <h2 className="font-display" style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t(`Questions fréquentes sur ${tool.name}`, `Frequently asked questions about ${tool.name}`)}
                </h2>
                <p
                  className="text-sm leading-7 pt-1"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit", maxWidth: "72ch" }}
                >
                  {lang === "fr"
                    ? `Prix, plans, utilité et alternatives à ${tool.name}${catName ? ` (${catName})` : ""} — les réponses essentielles avant d'ajouter cet outil à votre stack en ${new Date().getFullYear()}.`
                    : `Pricing, plans, use cases and alternatives to ${tool.name}${catNameEn ? ` (${catNameEn})` : ""} — key answers before adding this tool to your stack in ${new Date().getFullYear()}.`
                  }
                </p>
              </div>

              <ToolFAQSection
                tool={tool} displayPrice={displayPrice}
                verifiedOn={verifiedOn} alternatives={alternatives}
                lang={lang} t={t}
              />
            </section>}

            {/* ── Freshness footer ── */}
            <footer
              className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-xs"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)", fontFamily: "ui-monospace, monospace" }}
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

// computeToolTrimScore is now in @/lib/toolTrimScore
