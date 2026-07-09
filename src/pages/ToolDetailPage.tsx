import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolBySlug, useToolSummaries, useCategories, usePosts, SsrRelatedPostsContext } from "@/hooks/useSupabaseData";
import { useContext, useEffect, useRef } from "react";
import {
  ExternalLink, ArrowRight, CalendarCheck,
} from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PinToolButton from "@/components/PinToolButton";
import SectionPillNav from "@/components/SectionPillNav";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getScrollTop, scrollToY } from "@/lib/scroll";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { FEATURED_COMPARISONS } from "@/data/comparisons";
import { getToolDomain, getDomainFromUrl, formatPriceLabel, resolveVerdict } from "@/lib/toolUtils";
import { asText, stripLeadingEmoji } from "@/lib/text";

import ToolSummaryBlock from "@/components/tool/ToolSummaryBlock";
import ToolPricingSection from "@/components/tool/ToolPricingSection";
import ToolFeaturesBlock from "@/components/tool/ToolFeaturesBlock";
import ToolComparisonTable from "@/components/tool/ToolComparisonTable";
import ToolAudienceBlock from "@/components/tool/ToolAudienceBlock";
import ToolPluginsBlock from "@/components/tool/ToolPluginsBlock";
import ToolProfitabilityBlock from "@/components/tool/ToolProfitabilityBlock";
import ToolCostBreakdownTable from "@/components/tool/ToolCostBreakdownTable";
import ToolBillingTrapsBlock from "@/components/tool/ToolBillingTrapsBlock";
import ToolProfileRecommendationTable from "@/components/tool/ToolProfileRecommendationTable";
import ToolAiBlock from "@/components/tool/ToolAiBlock";
import ToolGallery from "@/components/tool/ToolGallery";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { findSimilarTools } from "@/lib/alternativesSimilarity";
import ToolFAQSection from "@/components/tool/ToolFAQSection";
import ToolAlternativesSection from "@/components/tool/ToolAlternativesSection";
import ToolJsonLd from "@/components/tool/ToolJsonLd";
import StickyDecisionCard from "@/components/tool/StickyDecisionCard";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolDetailPage — editorial redesign
   - Left: scrollable main content (tab sections)
   - Right: sticky StickyDecisionCard
   - Hero: large tool name + short description + metadata row
───────────────────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "presentation", labelFr: "Analyse",       labelEn: "Overview",      path: ""             },
  { id: "prix",         labelFr: "Prix",          labelEn: "Pricing",       path: "/prix"        },
  { id: "alternatives", labelFr: "Alternatives",  labelEn: "Alternatives",  path: "/alternatives"},
  { id: "avis",         labelFr: "Avis",          labelEn: "Reviews",       path: "/avis"        },
  { id: "faq",          labelFr: "FAQ",           labelEn: "FAQ",           path: "/faq"         },
] as const;

const ToolDetailPage = () => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { tool, loading } = useToolBySlug(slug);
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  // Hooks must run unconditionally on every render — this was previously
  // called after the `if (!tool) return null` guard below, so it was
  // skipped during the loading render but called once `tool` resolved,
  // changing the hook count between renders (React error #310, "Rendered
  // more hooks than during the previous render").
  const ssrRelatedPosts = useContext(SsrRelatedPostsContext);

  const pathEnd = location.pathname.split("/").pop() || "";
  const subPage: "presentation" | "prix" | "alternatives" | "faq" | "avis" =
    pathEnd === "prix" || pathEnd === "pricing" ? "prix"
    : pathEnd === "alternatives" ? "alternatives"
    : pathEnd === "faq" ? "faq"
    : pathEnd === "avis" || pathEnd === "reviews" ? "avis"
    : "presentation";

  /* ── SEO ── */
  useEffect(() => {
    if (!tool) return;
    const v5Price = tool.pricing_v5?.compare_price_monthly_eur;
    const price = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
    const hasPrice = price != null && price > 0;
    const year = new Date().getFullYear();
    const baseSlug = tool.slug || tool.id;
    const priceRounded = hasPrice ? Math.round(price as number) : 0;
    const planName = tool.pricing_v5?.compare_plan_name || null;
    const planSuffixFr = planName ? ` (plan ${planName})` : "";
    const planSuffixEn = planName ? ` (${planName} plan)` : "";
    const rawExcerpt = (tool.shortDescription || "").split(/[.!?]/)[0].trim();
    const shortExcerpt = rawExcerpt.length > 90 ? rawExcerpt.slice(0, 87) + "…" : rawExcerpt;
    const cat = categories.find((c: any) => c.id === tool.categoryId);
    const catLabel = cat
      ? stripLeadingEmoji(cat.name, cat.id || "")
      : lang === "fr" ? "outil SaaS" : "SaaS tool";

    const SEO: Record<string, { titleFr: string; titleEn: string; descFr: string; descEn: string; suffix: string }> = {
      presentation: {
        titleFr: hasPrice
          ? `${tool.name} ${year} : Vaut-il ${priceRounded}€/mois ? Prix & Verdict | ToolTrim`
          : `${tool.name} ${year} : Vraiment gratuit ? Plans & Verdict honnête | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name} ${year}: Worth €${priceRounded}/mo? Pricing & Verdict | ToolTrim`
          : `${tool.name} ${year}: Really Free? Plans & Honest Verdict | ToolTrim`,
        descFr: shortExcerpt
          ? `${shortExcerpt}. ${hasPrice ? `Coûte ${price}€/mois${planSuffixFr}, vaut-il le coût ?` : "Gratuit ou freemium ?"} Alternatives et verdict ToolTrim ${year}.`
          : hasPrice
            ? `${tool.name} coûte ${price}€/mois${planSuffixFr}. Verdict ToolTrim : vaut-il le coût ? Meilleures alternatives moins chères en ${year}.`
            : `${tool.name} est-il vraiment gratuit ? Plans, tarifs cachés et meilleures alternatives analysés, mis à jour ${year}.`,
        descEn: shortExcerpt
          ? `${shortExcerpt}. ${hasPrice ? `Costs €${price}/mo${planSuffixEn}, is it worth it?` : "Free or freemium?"} Alternatives and ToolTrim verdict ${year}.`
          : hasPrice
            ? `${tool.name} costs €${price}/mo${planSuffixEn}. ToolTrim verdict: is it worth it? Best cheaper alternatives for ${year}.`
            : `Is ${tool.name} really free? Plans, hidden costs and best alternatives, updated ${year}.`,
        suffix: "",
      },
      prix: {
        titleFr: hasPrice
          ? `${tool.name} Prix ${year} : ${priceRounded}€/mois, Tous les Plans & Tarifs | ToolTrim`
          : `${tool.name} Tarifs ${year} : Gratuit, Freemium ou Payant ? | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name} Pricing ${year}: €${priceRounded}/mo, All Plans & Costs | ToolTrim`
          : `${tool.name} Pricing ${year}: Free, Freemium or Paid? | ToolTrim`,
        descFr: hasPrice
          ? `Combien coûte ${tool.name} en ${year} ? ${priceRounded}€/mois${planName ? ` (plan ${planName})` : ""}${shortExcerpt ? `, ${shortExcerpt.charAt(0).toLowerCase() + shortExcerpt.slice(1)}.` : "."} Détail des plans et alternatives moins chères.`
          : `${tool.name} est-il gratuit en ${year} ?${shortExcerpt ? ` ${shortExcerpt}.` : ""} Plans gratuits, freemium et payants comparés avec les meilleures alternatives.`,
        descEn: hasPrice
          ? `How much does ${tool.name} cost in ${year}? €${priceRounded}/mo${planName ? ` (${planName} plan)` : ""}${shortExcerpt ? `, ${shortExcerpt.charAt(0).toLowerCase() + shortExcerpt.slice(1)}.` : "."} All plans and cheaper alternatives.`
          : `Is ${tool.name} free in ${year}?${shortExcerpt ? ` ${shortExcerpt}.` : ""} Free, freemium and paid plans compared with top alternatives.`,
        suffix: "/prix",
      },
      alternatives: {
        titleFr: hasPrice
          ? `Alternatives à ${tool.name} moins chères en ${year} | ToolTrim`
          : `Meilleures alternatives à ${tool.name}, ${catLabel} | ToolTrim`,
        titleEn: hasPrice
          ? `Cheaper ${tool.name} Alternatives in ${year} | ToolTrim`
          : `Best ${tool.name} Alternatives, ${catLabel} | ToolTrim`,
        descFr: hasPrice
          ? `Vous payez ${priceRounded}€/mois pour ${tool.name} (${catLabel}) ? Voici les meilleures alternatives moins chères ou gratuites, comparées par ToolTrim en ${year}.`
          : `Quelles sont les meilleures alternatives à ${tool.name} en ${catLabel} ? ToolTrim compare les options gratuites, freemium et payantes les plus adaptées en ${year}.`,
        descEn: hasPrice
          ? `Paying €${priceRounded}/mo for ${tool.name} (${catLabel})? Best cheaper or free alternatives, compared by ToolTrim for ${year}.`
          : `What are the best alternatives to ${tool.name} in ${catLabel}? ToolTrim compares the top free, freemium and paid options for ${year}.`,
        suffix: "/alternatives",
      },
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
          ? `${shortExcerpt}. Prix, plans, cas d'usage et alternatives à ${tool.name}, toutes les réponses clés en ${year}.`
          : `Tout ce que vous devez savoir sur ${tool.name} : prix, plans, utilité et meilleures alternatives, mis à jour ${year}.`,
        descEn: shortExcerpt
          ? `${shortExcerpt}. Pricing, plans, use cases and alternatives to ${tool.name}, all key answers for ${year}.`
          : `Everything you need to know about ${tool.name}: pricing, plans, use cases and best alternatives, updated ${year}.`,
        suffix: "/faq",
      },
    };

    const meta = SEO[subPage] ?? SEO.presentation;
    // tool.seo.<prefix>Title/MetaDescription override the generic per-subpage
    // template when there's a sharper, situational hook (e.g. "X merged into Y",
    // a concrete plan detail, or a missing-localization angle).
    const overridePrefix = subPage === "alternatives" ? "alt" : subPage;
    const seoOverrides = (tool as any).seo || {};
    const overrideTitle = lang === "fr"
      ? seoOverrides[`${overridePrefix}TitleFr`]
      : seoOverrides[`${overridePrefix}TitleEn`];
    const overrideDesc = lang === "fr"
      ? seoOverrides[`${overridePrefix}MetaDescriptionFr`]
      : seoOverrides[`${overridePrefix}MetaDescriptionEn`];
    const seoTitle = overrideTitle || (lang === "fr" ? meta.titleFr : meta.titleEn);
    const seoDesc  = overrideDesc  || (lang === "fr" ? meta.descFr  : meta.descEn);
    const canonicalSuffix =
      subPage === "prix" && lang === "en" ? "/pricing" :
      subPage === "avis" && lang === "en" ? "/reviews" :
      meta.suffix;
    const canonicalPath = `/${lang}/tool/${baseSlug}${canonicalSuffix}`;
    const canonicalUrl = `${SEO_BASE}${canonicalPath}`;

    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setMeta("article:modified_time", tool.pricing_v5?.verified_on || "2026-03-29");
    setHreflang(canonicalPath);
    return () => cleanupSeo([]);
  }, [tool, lang, subPage, categories]);

  /* ── Tous les hooks doivent être déclarés AVANT les returns conditionnels ──
     (Rules of Hooks — sinon React error #300/#310 en concurrent mode)        */

  /* Redirect outil non trouvé → /tools */
  useEffect(() => {
    if (!loading && !tool) {
      navigate(`${prefix}/tools`, { replace: true });
    }
  }, [loading, tool, navigate, prefix]);

  /* Tabs — smooth scroll vers la section active.
     <Link> gère la navigation (URL + SEO).
     L'effect détecte le changement de subPage et scrolle vers la section,
     uniquement lors d'un changement initié par l'utilisateur
     (pas sur le premier rendu ni lors du changement d'outil).
  */
  const prevSubPageRef = useRef<string | null>(null);
  const prevSlugRef    = useRef<string | null>(null);

  /* Single-scroll article: all sections render together. Sub-routes
     (/prix, /alternatives, /avis, /faq) are deep-links that scroll to the
     matching anchor — instant on fresh load (SEO landing), smooth on
     in-page nav clicks. The bare tool route never auto-scrolls. */
  useEffect(() => {
    const id = subPage === "presentation" ? "analyse" : subPage;
    const isFirst = prevSubPageRef.current === null;
    const toolChanged = prevSlugRef.current !== (slug ?? null);
    prevSubPageRef.current = subPage;
    prevSlugRef.current = slug ?? null;

    // Only auto-scroll on a fresh deep-link landing (direct entry to a
    // sub-route URL). In-page navigation is owned by the floating pill nav,
    // which scrolls itself — re-scrolling here would double-fire and race
    // it (the pill nav's smooth scrollIntoView starts first, then this
    // effect's instant window.scrollTo would jump on top of it mid-flight).
    // skipScrollReset is the explicit signal the pill nav sets on every
    // navigate() it triggers, so check it directly instead of relying only
    // on the isFirst/toolChanged heuristic.
    if ((location.state as { skipScrollReset?: boolean } | null)?.skipScrollReset) return;
    if (!isFirst && !toolChanged) return;
    if (subPage === "presentation") return; // bare route never auto-scrolls

    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const headerOffset = 92;
      const top = el.getBoundingClientRect().top + getScrollTop() - headerOffset;
      scrollToY(top, "auto");
    });
  }, [subPage, slug]);

  /* ── Loading / not found ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tool) return null;

  /* ── Derived values ── */
  const category   = categories.find((c: any) => c.id === tool.categoryId);
  const CategoryIcon = category ? getCategoryIcon(category.id) : null;
  const sameCategoryAlts = tools
    .filter((tt: any) => tt.categoryId === tool.categoryId && tt.id !== tool.id);
  const toolCovers = new Set((tool as any).covers || []);
  const coverOverlapAlts = toolCovers.size
    ? sameCategoryAlts
        .filter((tt: any) => (tt.covers || []).some((c: string) => toolCovers.has(c)))
        .sort((a: any, b: any) =>
          (b.covers || []).filter((c: string) => toolCovers.has(c)).length -
          (a.covers || []).filter((c: string) => toolCovers.has(c)).length
        )
    : [];
  const curatedAlts = ((tool as any).alternatives || [])
    .map((slug: string) => tools.find((tt: any) => tt.id === slug || tt.slug === slug))
    .filter(Boolean);
  // curatedAlts always wins its slots unconditionally; seenAltIds dedupes
  // the lower-priority tier (cover-overlap) against it. Deliberately NOT
  // falling back to sameCategoryAlts (every tool sharing the same broad
  // categoryId, unfiltered) when curated/cover-overlap are empty — that
  // tier has no relevance signal at all (categories like "organization"
  // hold 100+ unrelated tools, e.g. Allstate/Auvik next to Asana) and
  // produced the same generic 6-tool list for any tool lacking real data.
  // An empty alternatives list is the honest result in that case.
  const seenAltIds = new Set<string>();
  const alternatives = [curatedAlts, coverOverlapAlts].reduce(
    (acc: any[], list: any[]) => {
      for (const tt of list) {
        if (acc.length >= 6 || seenAltIds.has(tt.id)) continue;
        seenAltIds.add(tt.id);
        acc.push(tt);
      }
      return acc;
    },
    [] as any[]
  );
  // Whether the "Alternatives" section/pill has anything to show at all —
  // curated/cover-overlap alternatives above, OR a same-cluster substitute
  // that clears the similarity gate, OR a featured head-to-head comparison.
  // Drives both the pill nav (hide the tab) and the section itself (don't
  // render a heading + intro paragraph above nothing).
  const hasAlternativesContent = alternatives.length > 0
    || ((tool as any).substitution_cluster_v2
      ? findSimilarTools(tool, tools.filter((ct: any) => ct.substitution_cluster_v2 === (tool as any).substitution_cluster_v2 && ct.id !== tool.id)).length > 0
      : false)
    || FEATURED_COMPARISONS.some((c: any) => c.toolA === (tool.slug || tool.id) || c.toolB === (tool.slug || tool.id));
  const relatedPosts = ssrRelatedPosts !== undefined
    ? ssrRelatedPosts
    : posts
        .filter((p: any) => `${p.title ?? ""} ${p.excerpt ?? ""} ${p.content ?? ""}`.toLowerCase().includes((tool.name ?? "").toLowerCase()))
        .slice(0, 3);

  const v5Price       = tool.pricing_v5?.compare_price_monthly_eur;
  const displayPrice  = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
  const verifiedOn    = tool.pricing_v5?.verified_on || "2026-03-29";
  const sourceDomain  = tool.pricing_v5?.source_domain;
  const domain        = getDomainFromUrl(tool.websiteUrl) || getToolDomain(tool);
  const primaryCtaUrl = tool.affiliateLink || tool.websiteUrl || "#";
  const hasAffiliateOffer = Boolean(tool.affiliateLink);
  const isFree        = displayPrice === 0 && !tool.pricing?.paid;
  const hasFreeplan   = !!(tool.pricing?.free &&
    !tool.pricing.free.toLowerCase().includes("no free") &&
    !tool.pricing.free.toLowerCase().includes("aucun") &&
    !tool.pricing.free.toLowerCase().includes("pas de"));
  // Was `!!(tool.pricing?.free && tool.pricing?.paid)` — pure truthiness,
  // so a free field describing the ABSENCE of a free plan ("Pas de plan
  // gratuit permanent : essai de 14 jours") still counted as "Freemium"
  // since the string itself is non-empty. Reuse hasFreeplan's semantic
  // check instead.
  const isFreemium    = hasFreeplan && !!tool.pricing?.paid;
  const catName       = stripLeadingEmoji(category?.name, category?.id || "");
  const catNameEn     = stripLeadingEmoji(category?.nameEn, catName);

  const priceLabel = isFree
    ? t("Gratuit", "Free")
    : isFreemium
    ? "Freemium"
    : displayPrice > 0
    ? formatPriceLabel(tool, displayPrice, t)
    : t("Sur devis", "On request");

  const toolType = (tool as any).tool_type as string;

  /* Shared card props */
  const cardProps = {
    tool, displayPrice, verifiedOn, isFree, isFreemium, hasFreeplan,
    prefix, lang, t, primaryCtaUrl, hasAffiliateOffer,
    alternatives, catName, catNameEn,
  };

  // Memoized: a fresh array on every render would tear down and recreate
  // SectionPillNav's IntersectionObserver/keyboard listener on every
  // unrelated state update (e.g. activeProfile), causing visible jank.
  // "Alternatives" is dropped when there's nothing to show there (see the
  // alternatives computation above — no curated/cover-overlap data, an
  // honest empty result rather than a tab that leads to a half-empty page).
  // Not memoized: this must stay a plain computation (no hook) since it's
  // reached after the `if (!tool) return null` guard above — a useMemo
  // here would only run once tool resolves, changing the hook count
  // between the loading and loaded renders (React error #310). The
  // array-identity churn this produces on every render is handled inside
  // SectionPillNav itself (keyed off a content-derived string, not the
  // array reference), not here.
  const pillSections = TABS
    .filter((tab) => tab.id !== "alternatives" || hasAlternativesContent)
    .map((tab) => ({
      id: tab.id === "presentation" ? "analyse" : tab.id,
      label: lang === "fr" ? tab.labelFr : tab.labelEn,
    }));

  return (
    <article className="min-h-screen" itemScope itemType="https://schema.org/WebPage">
      <ToolJsonLd
        tool={tool} category={category} displayPrice={displayPrice}
        verifiedOn={verifiedOn} alternatives={alternatives} lang={lang}
        includeFaq={subPage === "faq" || subPage === "presentation"}
        canonicalUrl={`https://tooltrim.com/${lang}/tool/${tool.slug || tool.id}${
          subPage === "prix" ? (lang === "en" ? "/pricing" : "/prix") :
          subPage === "alternatives" ? "/alternatives" :
          subPage === "avis" ? (lang === "en" ? "/reviews" : "/avis") :
          subPage === "faq" ? "/faq" : ""
        }`}
      />

      {/* ══════════════════════════════════════════════════════════
          HERO — tool identity & positioning
      ══════════════════════════════════════════════════════════ */}
      <div className="td-container">
        <div className="td-body-grid td-page-grid">

          {/* ── MAIN COLUMN (left): hero identity + sections ── */}
          <div>

            {/* Hero identity */}
            <div className="td-hero">

            <Breadcrumb items={[
              { label: t("Outils", "Tools"), href: `${prefix}/tools` },
              ...(category ? [{
                label: t(catName, catNameEn),
                href: `${prefix}/category/${category.slug}`,
              }] : []),
              { label: tool.name },
            ]} />

            {/* Logo + category badge */}
            <div className="td-identity-row">
              <div style={{
                width: 56, height: 56, borderRadius: 10,
                border: "1px solid var(--color-border)", background: "var(--color-surface)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ToolLogo tool={tool} size={36} />
              </div>
              {category && (
                <Link
                  to={`${prefix}/category/${category.slug}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    height: 32, padding: "0 14px",
                    background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 999,
                    fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
                    color: "var(--color-text)", textDecoration: "none",
                    transition: "border-color 140ms",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-text)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
                >
                  {CategoryIcon && <CategoryIcon style={{ width: 11, height: 11, color: "var(--color-muted)" }} />}
                  {t(catName, catNameEn)}
                </Link>
              )}
              <div className="td-selection-action">
                <PinToolButton
                  slug={tool.slug || tool.id}
                  label={tool.name}
                  t={t}
                  inline
                  labelMode="full"
                />
              </div>
            </div>

            {/* H1 — clamp réduit pour les noms courts (≤5 chars) pour éviter la disproportion.
                Le minimum doit rester bas (~2.5rem) : à 8vw, la valeur préférée ne dépasse
                4.5rem qu'au-delà de ~900px de viewport, donc tout mobile/tablette se figeait
                sur le plancher (72-104px) — largement assez pour faire déborder un nom de
                10+ caractères ("Eventbrite", "Twitch"...) sans espace pour se replier.
                overflowWrap en filet de sécurité quel que soit le nom. */}
            <h1 style={{
              fontFamily: "var(--font-brand)",
              fontSize: tool.name.length <= 5
                ? "clamp(2.5rem, 8vw, 6.5rem)"   /* max 104px — Box, Slack, Zoom… */
                : "clamp(2.5rem, 8vw, 7.75rem)",  /* max 124px — noms longs */
              fontWeight: 600, lineHeight: 0.9,
              letterSpacing: "-0.07em", color: "var(--color-text)",
              margin: 0, overflowWrap: "break-word", wordBreak: "break-word",
            }}>
              {tool.name}
              {/* Space so the raw H1 text reads "Notion Avis, prix…" not
                  "NotionAvis…" — the block span below adds no whitespace of
                  its own, so screen readers and text extractors would run the
                  name into the subtitle without it. Visually collapsed (the
                  span starts a new line), so no layout impact. */}
              {" "}
              {/* SXO finding: the H1 held only the bare tool name (e.g. just
                  "Notion"), no intent signal for "avis"/"prix"/"alternatives"
                  searches. Nested in the same <h1> so it's part of the tag
                  Google reads, sized down so the giant poster name stays the
                  visual anchor — turned out to read as a natural subtitle,
                  not just a crawler-only addition. */}
              <span style={{
                display: "block",
                fontSize: "1rem", fontWeight: 500,
                letterSpacing: "-0.01em", lineHeight: 1.4,
                color: "var(--color-muted)", marginTop: 8,
              }}>
                {t(`Avis, prix et alternatives ${new Date().getFullYear()}`, `Reviews, pricing and alternatives ${new Date().getFullYear()}`)}
              </span>
            </h1>

            {/* Short description */}
            {tool.shortDescription && (
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--tt-size-hero-sub)",
                lineHeight: 1.35, letterSpacing: "-0.025em",
                color: "var(--color-text)", maxWidth: 780,
                marginTop: 28,
              }}>
                {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
              </p>
            )}

            {/* Short context: price + usage framing */}
            {(() => {
              const pricePart = isFree
                ? t("Gratuit.", "Free.")
                : displayPrice > 0
                ? `${t("À partir de", "From")} ${formatPriceLabel(tool, displayPrice, t)}.`
                : null;
              const verdict = (tool as any).verdict;
              const fullThreshold = lang === "en" && (tool as any).verdictEn?.threshold
                ? (tool as any).verdictEn.threshold
                : verdict?.threshold as string | undefined;
              // First sentence only — the hero is a teaser, not the full
              // reasoning. "Décision rapide" further down is the one place
              // that shows the complete threshold; repeating all of it here
              // meant the same two sentences appeared twice within the
              // first screen of the page. Site-wide change, all 1109 tools.
              const threshold = fullThreshold?.split(/(?<=[.!?])\s+/)[0];
              const text = [pricePart, threshold].filter(Boolean).join(" ");
              if (!text) return null;
              return (
                <p style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 17,
                  lineHeight: 1.5, letterSpacing: "-0.015em",
                  color: "var(--color-muted)", maxWidth: 760,
                  marginTop: 16,
                }}>
                  {text}
                </p>
              );
            })()}

            </div>
            {/* end hero identity */}

            {/* Gallery — shown only for tools with images in Supabase */}
            {(() => {
              const ogImg = (tool.ogImageUrl ?? (tool as any).og_image_url) as string | null;
              const extra = ((tool as any).gallery_images as string[] | null) ?? [];
              const imgs = [ogImg, ...extra].filter((u): u is string => !!u);
              return imgs.length > 0 ? <ToolGallery images={imgs} toolName={tool.name} /> : null;
            })()}

            {/* Mobile decision card */}
            <div className="td-sidebar-mobile" style={{ marginBottom: 32 }}>
              <StickyDecisionCard {...cardProps} />
            </div>

            {/* ════════════════════════════════
                SECTION: Analyse / Présentation
            ════════════════════════════════ */}
            {(
              <div id="analyse" className="td-subpage-content">

                {/* 1 · Décision rapide — 3 blocs éditoriaux */}
                {(() => {
                  const { keepItems, avoidItems, threshold } = resolveVerdict(tool, lang);
                  const consArr = lang === "en" && (tool as any).consEn ? (tool as any).consEn : (tool.cons ?? []);
                  const limitText: string | null = consArr.length > 0 ? consArr[0] : (avoidItems[0] ?? null);

                  const blocks = [
                    { label: t("À garder si", "Keep if"),           text: keepItems.length  ? keepItems.slice(0, 2).join(". ")  : null },
                    { label: t("À challenger si", "Challenge if"),   text: avoidItems.length ? avoidItems.slice(0, 2).join(". ") : null },
                    { label: t("Limite principale", "Main limitation"), text: limitText },
                  ].filter((b): b is { label: string; text: string } => !!b.text);

                  return (
                    <div className="td-section">
                      <span className="td-eyebrow">{t("Décision rapide", "Quick decision")}</span>
                      <h2 className="td-title">
                        {lang === "fr"
                          ? `${tool.name} : quand ça a du sens.`
                          : `${tool.name}: when it makes sense.`}
                      </h2>

                      {/* Verdict sentence */}
                      {threshold && (
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: 17, lineHeight: 1.55, color: "var(--color-text)", maxWidth: 760, marginBottom: 0 }}>
                          {threshold}
                        </p>
                      )}

                      {/* 3-column editorial blocks */}
                      {blocks.length > 0 && (
                        <div className="td-dr-grid">
                          {blocks.map(block => (
                            <div key={block.label} className="td-dr-block">
                              <span className="td-dr-label">{block.label}</span>
                              <p className="td-dr-text">{block.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 1.5 · Rentable si / trop cher si — usage thresholds,
                     distinct from the keepIf/avoidIf reasoning above so the
                     page doesn't repeat the same argument twice. Renders
                     nothing on tools without this data. */}
                <ToolProfitabilityBlock tool={tool} lang={lang} t={t} />

                {/* 2.5 · Résumé machine-readable — placé tôt (juste après le
                     verdict) pour l'extraction LLM/RAG (GEO), avant les
                     sections éditoriales plus longues qui suivent. */}
                <ToolSummaryBlock
                  tool={tool} category={category} alternatives={alternatives}
                  displayPrice={displayPrice} lang={lang} prefix={prefix} t={t}
                />
              </div>
            )}

            {/* ════════════════════════════════
                SECTION: Prix — moved ahead of the audience/features/long-
                analysis content (was after it). Prix and Alternatives are
                the two sections most readers actually need to decide; the
                "nice to know" content shouldn't sit between the verdict and
                them. Site-wide change, all 1109 tool pages.
            ════════════════════════════════ */}
            {(
              <div id="prix" className="td-subpage-content">
                <div className="td-section">
                  <span className="td-eyebrow">{t("Tarifs", "Pricing")}</span>
                  <h2 className="td-title">
                    {t(`Combien coûte ${tool.name} ?`, `How much does ${tool.name} cost?`)}
                  </h2>
                  <p className="td-body td-muted" style={{ marginBottom: 32 }}>
                    {lang === "fr"
                      ? (() => {
                          if (displayPrice === 0)
                            return `${tool.name} propose un plan gratuit${tool.shortDescription ? `, ${tool.shortDescription.split(/[.!?]/)[0].toLowerCase()}` : ""}. Voici le détail complet des plans disponibles en ${new Date().getFullYear()}.`;
                          const plan = tool.pricing_v5?.compare_plan_name;
                          return `${tool.name} est facturé ${displayPrice}€/mois${plan ? ` (plan ${plan})` : ""}. Voici le détail des tarifs et ce qu'ils incluent réellement.`;
                        })()
                      : (() => {
                          if (displayPrice === 0)
                            return `${tool.name} offers a free plan. Here's the full breakdown of available plans for ${new Date().getFullYear()}.`;
                          const plan = tool.pricing_v5?.compare_plan_name;
                          return `${tool.name} is priced at €${displayPrice}/mo${plan ? ` (${plan} plan)` : ""}. Here's what each plan actually includes.`;
                        })()
                    }
                  </p>
                  <ToolPricingSection
                    tool={tool} displayPrice={displayPrice}
                    verifiedOn={verifiedOn} sourceDomain={sourceDomain}
                    prefix={prefix} lang={lang} t={t}
                  />
                  <ToolCostBreakdownTable tool={tool} lang={lang} t={t} />
                  <ToolBillingTrapsBlock tool={tool} lang={lang} t={t} />
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                SECTION: Alternatives — moved up alongside Prix, see comment
                above.
            ════════════════════════════════ */}
            {hasAlternativesContent && (
              <div id="alternatives" className="td-subpage-content">
                <div className="td-section">
                  <span className="td-eyebrow">{t("Comparatif", "Comparison")}</span>
                  <h2 className="td-title">
                    {t(`Meilleures alternatives à ${tool.name}.`, `Best alternatives to ${tool.name}.`)}
                  </h2>
                  <p className="td-body td-muted" style={{ marginBottom: 32 }}>
                    {lang === "fr"
                      ? `${alternatives.length > 0 ? `${alternatives.length} alternatives` : "Des alternatives"} à ${tool.name}${catName ? ` dans la catégorie ${catName}` : ""}, comparées par prix, fonctionnalités et pertinence pour les indépendants et petites équipes.${displayPrice > 0 ? ` Certaines sont gratuites ou moins chères que les ${displayPrice}€/mois ${/^[aeiouyàâéèêëîïôûü]/i.test(tool.name) ? `d'${tool.name}` : `de ${tool.name}`}.` : ""}`
                      : `${alternatives.length > 0 ? `${alternatives.length} alternatives` : "Alternatives"} to ${tool.name}${catNameEn ? ` in the ${catNameEn} category` : ""}, compared by price, features, and fit for freelancers and small teams.${displayPrice > 0 ? ` Some are free or cheaper than ${tool.name}'s €${displayPrice}/mo.` : ""}`
                    }
                  </p>

                  {alternatives.length > 0 && (
                    <ToolComparisonTable
                      tool={tool} alternatives={alternatives}
                      prefix={prefix} lang={lang} t={t}
                    />
                  )}

                  <ToolProfileRecommendationTable tool={tool} alternatives={alternatives} lang={lang} t={t} />

                  <ToolAlternativesSection
                    tool={tool} category={category} alternatives={alternatives}
                    prefix={prefix} lang={lang} t={t}
                  />

                  {/* Substitution cluster — substitution_cluster_v2 groups
                       candidates roughly, but sharing a cluster tag (or a
                       broad category) doesn't guarantee the tools actually
                       do the same job (an external audit found health
                       insurance and network-monitoring tools surfacing as
                       "direct substitutes" for Asana this way). The
                       similarity score is a second, independent gate:
                       cluster membership generates candidates, the score
                       decides which of them are actually relevant enough
                       to show. */}
                  {(tool as any).substitution_cluster_v2 && (() => {
                    const clusterCandidates = tools
                      .filter((ct: any) => ct.substitution_cluster_v2 === (tool as any).substitution_cluster_v2 && ct.id !== tool.id);
                    const clusterTools = findSimilarTools(tool, clusterCandidates).slice(0, 6);
                    if (!clusterTools.length) return null;
                    return (
                      <div style={{ marginTop: 40 }}>
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--tt-size-kicker)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 12 }}>
                          {t("Substituables directement", "Direct substitutes")}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {clusterTools.map((ct: any) => (
                            <Link
                              key={ct.id}
                              to={`${prefix}/tool/${ct.slug || ct.id}`}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "8px 14px",
                                background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8,
                                fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "var(--color-text)",
                                textDecoration: "none", transition: "border-color 140ms",
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-text)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
                            >
                              <ToolLogo tool={ct} size={18} />
                              {ct.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Featured comparisons */}
                  {(() => {
                    const toolId = tool.slug || tool.id;
                    const comparisons = FEATURED_COMPARISONS.filter(
                      (c: any) => c.toolA === toolId || c.toolB === toolId
                    );
                    const seenOtherIds = new Set<string>();
                    const compareTools = comparisons
                      .map((c: any) => {
                        const otherId = c.toolA === toolId ? c.toolB : c.toolA;
                        const other = tools.find((tt: any) => tt.id === otherId || tt.slug === otherId);
                        return other ? { slugPair: c.slugPair, other } : null;
                      })
                      .filter(Boolean)
                      // comparisons.ts occasionally lists both directions of
                      // the same pair (e.g. asana-vs-clickup AND clickup-vs-
                      // asana) — keep only the first occurrence per target.
                      .filter((c: any) => {
                        if (seenOtherIds.has(c.other.id)) return false;
                        seenOtherIds.add(c.other.id);
                        return true;
                      }) as { slugPair: string; other: any }[];
                    if (!compareTools.length) return null;
                    return (
                      <div style={{ marginTop: 40 }}>
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--tt-size-kicker)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 12 }}>
                          {t(`Comparer ${tool.name} avec`, `Compare ${tool.name} with`)}
                        </p>
                        {compareTools.map(({ slugPair, other }) => (
                          <Link
                            key={slugPair}
                            to={`${prefix}/comparatif/${slugPair}`}
                            className="td-alt-row"
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <div style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <ToolLogo tool={other} size={24} />
                            </div>
                            <div>
                              <p style={{ fontFamily: "var(--font-brand)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-text)", lineHeight: 1.2 }}>
                                {tool.name} vs {other.name}
                              </p>
                              <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)", marginTop: 2 }}>
                                {t("Voir la comparaison complète", "See full comparison")}
                              </p>
                            </div>
                            <ArrowRight style={{ width: 14, height: 14, color: "var(--color-muted-light)" }} />
                          </Link>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                SECTION: Analyse (continued) — audience, pros/cons,
                features, use cases, long-form analysis, plugins, AI angle.
                Background context now that price/alternatives are answered.
            ════════════════════════════════ */}
            {(
              <div className="td-subpage-content">

                {/* 3 · Pour qui */}
                {(tool as any).relevantFor?.length > 0 && (
                  <div className="td-section">
                    <span className="td-eyebrow">{t("Audience", "Audience")}</span>
                    <h2 className="td-title">
                      {t(`Pour qui est ${tool.name} ?`, `Who is ${tool.name} for?`)}
                    </h2>
                    <ToolAudienceBlock
                      relevantFor={(tool as any).relevantFor || []}
                      soloRelevance={tool.soloRelevance}
                      teamRelevance={tool.teamRelevance}
                      toolName={tool.name}
                      t={t}
                    />
                  </div>
                )}

                {/* 4-5 · Points forts / limites — side by side so + and − can be confronted directly */}
                {((tool.pros?.length ?? 0) > 0 || (tool.cons?.length ?? 0) > 0) && (
                  <div className="td-section">
                    <span className="td-eyebrow">{t("Forces et limites", "Strengths and limitations")}</span>
                    <h2 className="td-title">
                      {t(`${tool.name} en force et en limites.`, `${tool.name}, strengths and limitations.`)}
                    </h2>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: (tool.pros?.length ?? 0) > 0 && (tool.cons?.length ?? 0) > 0 ? "1fr 1fr" : "1fr",
                        gap: 32,
                        marginTop: 8,
                      }}
                      className="sm:grid-cols-2"
                    >
                      {(tool.pros?.length ?? 0) > 0 && (
                        <div>
                          <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 12 }}>
                            {t("Ce qu'il fait bien", "What it does well")}
                          </p>
                          <ul className="td-judgment">
                            {(lang === "en" && (tool as any).prosEn ? (tool as any).prosEn : tool.pros)?.map((pro: string) => (
                              <li key={pro} className="td-judgment-item td-judgment-item--pro">
                                <span className="td-judgment-marker td-judgment-marker--pro" aria-hidden="true">+</span>
                                <span className="td-judgment-text">{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(tool.cons?.length ?? 0) > 0 && (
                        <div>
                          <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 12 }}>
                            {t("Là où il montre ses limites", "Where it falls short")}
                          </p>
                          <ul className="td-judgment">
                            {(lang === "en" && (tool as any).consEn ? (tool as any).consEn : tool.cons)?.map((con: string) => (
                              <li key={con} className="td-judgment-item td-judgment-item--con">
                                <span className="td-judgment-marker td-judgment-marker--con" aria-hidden="true">−</span>
                                <span className="td-judgment-text">{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6 · Fonctionnalités */}
                {((tool as any).covers?.length > 0 || (tool as any).functional_needs?.length > 0) && (
                  <div className="td-section">
                    <span className="td-eyebrow">{t("Fonctionnalités", "Features")}</span>
                    <h2 className="td-title">
                      {t(`Ce que couvre ${tool.name}.`, `What ${tool.name} covers.`)}
                    </h2>
                    <ToolFeaturesBlock
                      covers={(tool as any).covers || []}
                      functionalNeeds={(tool as any).functional_needs || []}
                      toolName={tool.name}
                      t={t}
                    />
                  </div>
                )}

                {/* 7 · Cas d'usage */}
                {tool.useCases && tool.useCases.length > 0 && (
                  <div className="td-section">
                    <span className="td-eyebrow">{t("Cas d'usage", "Use cases")}</span>
                    <h2 className="td-title">
                      {t(`À quoi sert ${tool.name} ?`, `What is ${tool.name} used for?`)}
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                      {(lang === "en" && (tool as any).useCasesEn ? (tool as any).useCasesEn : tool.useCases)!.map((uc: string, i: number) => (
                        <div
                          key={i}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 10,
                            padding: "12px 16px",
                            background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8,
                            fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--color-text)", lineHeight: 1.45,
                          }}
                        >
                          <ArrowRight style={{ width: 13, height: 13, flexShrink: 0, marginTop: 3, color: "var(--color-text-strong)" }} />
                          {uc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8 · Analyse éditoriale (long description) */}
                {(() => {
                  const longDesc = lang === "en"
                    ? ((tool as any).longDescriptionEn || (tool as any).longDescription || "")
                    : ((tool as any).longDescription || "");
                  if (!longDesc || longDesc.length < 80) return null;
                  const paras = longDesc.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
                  return (
                    <div className="td-section">
                      <span className="td-eyebrow">{t("Analyse ToolTrim", "ToolTrim Analysis")}</span>
                      <h2 className="td-title">
                        {t(`Notre analyse de ${tool.name}.`, `Our take on ${tool.name}.`)}
                      </h2>
                      <div className="td-body">
                        {paras.map((para: string, i: number) => (
                          <p key={i} style={i === 0 ? { fontWeight: 500, fontSize: "clamp(1rem, 1.2vw, 1.0625rem)" } : { color: "var(--color-muted)", marginTop: "1em" }}>
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 9 · Intégrations / Plugins — the block owns its own
                     td-section wrapper and returns null when there's
                     nothing to show, so no empty divider renders. */}
                <ToolPluginsBlock tool={tool} allTools={tools} prefix={prefix} lang={lang} t={t} />

                {/* 10 · L'angle IA : augmenter ou remplacer ? — same. */}
                <ToolAiBlock tool={tool} allTools={tools} prefix={prefix} lang={lang} t={t} />

              </div>
            )}
            {/* ════════════════════════════════
                SECTION: Avis
            ════════════════════════════════ */}
            {(
              <div id="avis" className="td-subpage-content">
                {(() => {
                  const ts = computeToolTrimScore(tool);
                  // One synthesized sentence instead of a 6-item checklist
                  // with half the items greyed out — a list of "things that
                  // are NOT true about this tool" reads as padding, not
                  // analysis. Same underlying signals, phrased as the 2-3
                  // most decision-relevant clauses joined into prose.
                  const hardToReplace = (tool as any).substitutable === false;
                  const clearUseCases = ((tool as any).verdict?.keepIf?.length || 0) >= 2;
                  const hasFreeTier = isFree || isFreemium;
                  const scoreReasonFr = [
                    hardToReplace ? "difficile à remplacer à court terme" : "remplaçable assez facilement par une alternative",
                    hasFreeTier ? "un plan gratuit accessible pour tester avant de payer" : "aucun palier gratuit pour tester avant de payer",
                    clearUseCases ? "des cas d'usage clairement documentés" : "des cas d'usage encore à préciser selon ton contexte",
                  ].join(", ");
                  const scoreReasonEn = [
                    hardToReplace ? "hard to replace short-term" : "fairly easy to replace with an alternative",
                    hasFreeTier ? "a free tier to test before paying" : "no free tier to test before paying",
                    clearUseCases ? "clearly documented use cases" : "use cases that still depend on your specific context",
                  ].join(", ");
                  return (
                    <div className="td-section">
                      <span className="td-eyebrow">{t("Évaluation", "Rating")}</span>
                      <h2 className="td-title">
                        {t(`Notre avis sur ${tool.name}.`, `Our verdict on ${tool.name}.`)}
                      </h2>

                      {/* Score card */}
                      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 32, padding: "28px 32px", borderBottom: "1px solid var(--color-border-soft)" }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
                            <span style={{ fontFamily: "var(--font-brand)", fontSize: 80, fontWeight: 600, lineHeight: 0.9, letterSpacing: "-0.07em", color: "var(--color-text)" }}>
                              {ts.score.toFixed(1)}
                            </span>
                            <span style={{ fontFamily: "var(--font-ui)", fontSize: 24, color: "var(--color-muted-light)", lineHeight: 1, paddingBottom: 10 }}>/5</span>
                          </div>
                          <div>
                            <p style={{ fontFamily: "var(--font-ui)", fontSize: 20, fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.2 }}>
                              {t(ts.labelFr, ts.labelEn)}
                            </p>
                            <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)", marginTop: 6 }}>
                              {t("Score éditorial ToolTrim · Analyse indépendante", "ToolTrim editorial score · Independent analysis")}
                            </p>
                            {ts.score < 3.5 && resolveVerdict(tool, lang).keepItems.length > 0 && (
                              <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--color-muted-light)", marginTop: 4 }}>
                                {t("Score pour un usage générique : la fiche détaille les profils où c'est un bon choix.", "Score for generic use: the fiche details the profiles where it's a good fit.")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div style={{ padding: "24px 32px" }}>
                          <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--tt-size-kicker)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 12 }}>
                            {t("Pourquoi ce score", "Why this score")}
                          </p>
                          <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, lineHeight: 1.6, color: "var(--color-text)" }}>
                            {t(
                              `${tool.name} est ${scoreReasonFr}.`,
                              `${tool.name} is ${scoreReasonEn}.`,
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Reviews coming soon */}
                      <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "40px 32px", textAlign: "center" }}>
                        <p style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(1.125rem, 2vw, 1.5rem)", fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-text)", marginBottom: 10 }}>
                          {t(`Tu utilises ${tool.name} ?`, `Using ${tool.name}?`)}
                        </p>
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, lineHeight: 1.55, color: "var(--color-muted)", maxWidth: 420, margin: "0 auto 24px" }}>
                          {t(
                            "Les avis utilisateurs arrivent bientôt. Partage ce qui marche, ce qui coûte trop cher, ce que tu changerais.",
                            "User reviews are coming soon. Share what works, what costs too much, what you'd change.",
                          )}
                        </p>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "8px 16px",
                          border: "1px solid var(--color-border)", borderRadius: 6,
                          background: "var(--color-surface-soft)",
                          fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600,
                          color: "var(--color-text-strong)", letterSpacing: "0.02em",
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-strong)", animation: "pulse 2s infinite" }} />
                          {t("Bientôt disponible", "Coming soon")}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ════════════════════════════════
                SECTION: FAQ
            ════════════════════════════════ */}
            {(
              <div id="faq" className="td-subpage-content">
                <div className="td-section">
                  <span className="td-eyebrow">{t("FAQ", "FAQ")}</span>
                  <h2 className="td-title">
                    {t(`Questions sur ${tool.name}.`, `Questions about ${tool.name}.`)}
                  </h2>
                  <p className="td-body td-muted" style={{ marginBottom: 32 }}>
                    {lang === "fr"
                      ? `Prix, plans, utilité et alternatives à ${tool.name}${catName ? ` (${catName})` : ""}, les réponses essentielles avant d'ajouter cet outil à votre stack en ${new Date().getFullYear()}.`
                      : `Pricing, plans, use cases and alternatives to ${tool.name}${catNameEn ? ` (${catNameEn})` : ""}, key answers before adding this tool to your stack in ${new Date().getFullYear()}.`
                    }
                  </p>
                  <ToolFAQSection
                    tool={tool} displayPrice={displayPrice}
                    verifiedOn={verifiedOn} alternatives={alternatives}
                    lang={lang} t={t}
                  />
                </div>
              </div>
            )}

            {/* ── Freshness footer ── */}
            <footer style={{
              marginTop: 24,
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16,
              borderTop: "1px solid var(--color-border)", paddingTop: 24,
              fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--color-muted-light)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CalendarCheck style={{ width: 12, height: 12 }} />
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
                      style={{ color: "var(--color-muted)", textDecoration: "underline", textUnderlineOffset: 3 }}
                    >
                      {sourceDomain}
                    </a>
                  </span>
                </>
              )}
              <span>·</span>
              <Link
                to={`${prefix}/contact`}
                style={{ color: "var(--color-muted)", textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                {t("Signaler un prix incorrect", "Report incorrect pricing")}
              </Link>
            </footer>

          </div>
          {/* end main content */}

          {/* ── RIGHT SIDEBAR — StickyDecisionCard ── */}
          <aside className="td-sidebar-desktop">
              <StickyDecisionCard {...cardProps} />

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--tt-size-kicker)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10 }}>
                    {t("Guides liés", "Related guides")}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {relatedPosts.map((post: any) => (
                      <Link
                        key={post.slug}
                        to={`${prefix}/guide/${post.slug}`}
                        style={{
                          display: "block", padding: "12px 16px",
                          background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8,
                          textDecoration: "none", transition: "border-color 140ms",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-text)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
                      >
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "var(--color-text)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {post.title}
                        </p>
                        {post.readTime && (
                          <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--color-muted-light)", marginTop: 4 }}>
                            {post.readTime}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </aside>

        </div>
      </div>

      <SectionPillNav
        sections={pillSections}
        logoTo={`${prefix}/tools`}
        logoAriaLabel={t("Retour aux outils", "Back to tools")}
        ariaLabel={t("Navigation de la fiche outil", "Tool page navigation")}
        heroSelector=".td-hero"
        onSelect={(id) => {
          // Update the URL to the dedicated route (SEO), but let the pill
          // handle the scroll itself (return false) so it works even when the
          // route is already current.
          const tab = TABS.find((tb) => (tb.id === "presentation" ? "analyse" : tb.id) === id);
          if (tab) {
            const path = tab.id === "prix" && lang === "en" ? "/pricing"
              : tab.id === "avis" && lang === "en" ? "/reviews"
              : tab.path;
            // replace: true — this is in-page anchor navigation, not a real
            // page change. With replace: false every pill click pushed a
            // history entry, so the back button stepped through tabs
            // instead of leaving the tool page.
            navigate(`${prefix}/tool/${slug}${path}`, { replace: true, state: { skipScrollReset: true } });
          }
          return false;
        }}
      />

    </article>
  );
};

export default ToolDetailPage;
