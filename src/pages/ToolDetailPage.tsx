import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolBySlug, useToolSummaries, useCategories, usePosts, SsrRelatedPostsContext } from "@/hooks/useSupabaseData";
import { useContext, useEffect } from "react";
import { ArrowRight, Check, CirclePlus, CircleMinus } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PinToolButton from "@/components/PinToolButton";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { FEATURED_COMPARISONS } from "@/data/comparisons";
import { getToolDomain, getDomainFromUrl, formatPriceLabel, resolveVerdict, resolveToolOverview } from "@/lib/toolUtils";
import { stripLeadingEmoji } from "@/lib/text";
import { hasGenuineFreeTier, resolveMonthlyPrice } from "@/lib/pricing";

import ToolSummaryBlock from "@/components/tool/ToolSummaryBlock";
import ToolPricingSection from "@/components/tool/ToolPricingSection";
import ToolBundleSection from "@/components/tool/ToolBundleSection";
import ToolFeaturesBlock from "@/components/tool/ToolFeaturesBlock";
import ToolComparisonTable from "@/components/tool/ToolComparisonTable";
import ToolAudienceBlock from "@/components/tool/ToolAudienceBlock";
import ToolPluginsBlock from "@/components/tool/ToolPluginsBlock";
import ToolProfitabilityBlock from "@/components/tool/ToolProfitabilityBlock";
import ToolCostBreakdownTable from "@/components/tool/ToolCostBreakdownTable";
import ToolBillingTrapsBlock from "@/components/tool/ToolBillingTrapsBlock";
import ToolAiBlock from "@/components/tool/ToolAiBlock";
import ToolGallery from "@/components/tool/ToolGallery";
import ToolTutorialsSection from "@/components/tool/ToolTutorialsSection";
import { getToolTutorials } from "@/data/toolTutorials";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { findSimilarTools } from "@/lib/alternativesSimilarity";
import ToolFAQSection from "@/components/tool/ToolFAQSection";
import ToolJsonLd from "@/components/tool/ToolJsonLd";
import StickyDecisionCard from "@/components/tool/StickyDecisionCard";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolDetailPage — editorial redesign
   - Left: scrollable main content (tab sections)
   - Right: sticky StickyDecisionCard
   - Hero: large tool name + short description + metadata row
───────────────────────────────────────────────────────────────────────────── */

function splitUseCase(value: string): { title: string; detail?: string } {
  const separators = [" : ", ": ", " qui veut ", " that wants ", " avec ", " with "];
  for (const separator of separators) {
    const index = value.toLowerCase().indexOf(separator.toLowerCase());
    if (index <= 0) continue;
    const title = value.slice(0, index).trim();
    const rawDetail = value.slice(index + separator.length).trim();
    if (!rawDetail) break;
    return {
      title,
      detail: rawDetail.charAt(0).toUpperCase() + rawDetail.slice(1),
    };
  }
  return { title: value };
}

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

  // Normalize trailing slashes so prerendered URLs and client-side routing
  // resolve to the same intent page (`/prix` and `/prix/`, for example).
  const normalizedPathname = location.pathname.replace(/\/+$/, "");
  const pathEnd = normalizedPathname.split("/").pop() || "";
  const subPage: "presentation" | "prix" | "alternatives" | "faq" | "avis" =
    pathEnd === "prix" || pathEnd === "pricing" ? "prix"
    : pathEnd === "alternatives" ? "alternatives"
    : pathEnd === "faq" ? "faq"
    : pathEnd === "avis" || pathEnd === "reviews" ? "avis"
    : "presentation";

  /* ── SEO ── */
  useEffect(() => {
    if (!tool) return;
    const price = resolveMonthlyPrice(tool);
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
          ? `${tool.name} : prix dès ${priceRounded}€, avis et alternatives ${year} | ToolTrim`
          : `${tool.name} : gratuit, avis et alternatives ${year} | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name}: pricing from €${priceRounded}, review & alternatives ${year} | ToolTrim`
          : `${tool.name}: free, review & alternatives ${year} | ToolTrim`,
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
          ? `${tool.name} : prix et tarifs ${year} | ToolTrim`
          : `${tool.name} Tarifs ${year} : Gratuit, Freemium ou Payant ? | ToolTrim`,
        titleEn: hasPrice
          ? `${tool.name} pricing & plans ${year} | ToolTrim`
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
          ? `Meilleures alternatives à ${tool.name} en ${year} | ToolTrim`
          : `Meilleures alternatives à ${tool.name}, ${catLabel} | ToolTrim`,
        titleEn: hasPrice
          ? `Best ${tool.name} alternatives in ${year} | ToolTrim`
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
        titleFr: `${tool.name} : questions fréquentes ${year} | ToolTrim`,
        titleEn: `${tool.name} FAQ ${year} | ToolTrim`,
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
  const tutorials = getToolTutorials(tool.slug || tool.id);
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

  const displayPrice  = resolveMonthlyPrice(tool);
  const verifiedOn    = tool.pricing_v5?.verified_on || "2026-03-29";
  const sourceDomain  = tool.pricing_v5?.source_domain;
  const domain        = getDomainFromUrl(tool.websiteUrl) || getToolDomain(tool);
  const primaryCtaUrl = tool.affiliateLink || tool.websiteUrl || "#";
  const hasAffiliateOffer = Boolean(tool.affiliateLink);
  const isFree        = displayPrice === 0 && !tool.pricing?.paid;
  const hasFreeplan   = hasGenuineFreeTier(tool.pricing?.free);
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
    catName, catNameEn,
  };
  const editorialLongDesc = lang === "en"
    ? ((tool as any).longDescriptionEn || (tool as any).longDescription || "")
    : ((tool as any).longDescription || "");
  const hasEditorialIntro = editorialLongDesc.length >= 80;
  const editorialParas = hasEditorialIntro
    ? editorialLongDesc.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean)
    : [];
  const editorialOverview = resolveToolOverview(tool, lang);
  const isPresentation = subPage === "presentation";
  const showAnalysis = isPresentation || subPage === "avis";
  const showPricing = isPresentation || subPage === "prix";
  const showAlternatives = isPresentation || subPage === "alternatives";
  const showDeepDive = isPresentation;
  const showReview = isPresentation || subPage === "avis";
  const showFaq = isPresentation || subPage === "faq";
  const year = new Date().getFullYear();
  const heroIntent = subPage === "prix"
    ? t(`Prix et tarifs ${year}`, `Pricing and plans ${year}`)
    : subPage === "alternatives"
    ? t(`Meilleures alternatives ${year}`, `Best alternatives ${year}`)
    : subPage === "avis"
    ? t(`Avis et verdict ${year}`, `Review and verdict ${year}`)
    : subPage === "faq"
    ? t(`Questions fréquentes ${year}`, `Frequently asked questions ${year}`)
    : t(`Avis, prix et alternatives ${year}`, `Reviews, pricing and alternatives ${year}`);
  const baseToolPath = `${prefix}/tool/${tool.slug || tool.id}`;
  const subpageLinks = [
    { key: "presentation", label: t("Vue d’ensemble", "Overview"), to: baseToolPath },
    { key: "prix", label: t("Prix", "Pricing"), to: `${baseToolPath}/${lang === "en" ? "pricing" : "prix"}` },
    ...(hasAlternativesContent ? [{ key: "alternatives", label: t("Alternatives", "Alternatives"), to: `${baseToolPath}/alternatives` }] : []),
    { key: "avis", label: t("Avis", "Reviews"), to: `${baseToolPath}/${lang === "en" ? "reviews" : "avis"}` },
    { key: "faq", label: "FAQ", to: `${baseToolPath}/faq` },
  ];
  const subpageBreadcrumbLabel = subPage === "prix"
    ? t("Prix", "Pricing")
    : subPage === "alternatives"
    ? t("Alternatives", "Alternatives")
    : subPage === "avis"
    ? t("Avis", "Reviews")
    : subPage === "faq"
    ? "FAQ"
    : null;

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
        <div className="td-page-breadcrumb">
          <Breadcrumb items={[
            { label: t("Outils", "Tools"), href: `${prefix}/tools` },
            ...(category ? [{
              label: lang === "fr" ? catName : (catNameEn || catName),
              href: `${prefix}/category/${category.slug}`,
            }] : []),
            ...(subpageBreadcrumbLabel
              ? [{ label: tool.name, href: baseToolPath }, { label: subpageBreadcrumbLabel }]
              : [{ label: tool.name }]),
          ]} includeSchema={false} />
        </div>

        <div className="td-body-grid td-page-grid">

          {/* ── MAIN COLUMN (left): hero identity + sections ── */}
          <main className="td-main">

            {/* Hero identity — Ma-stack inspector gabarit: bordered card, cover
                image on top, heading (category eyebrow, H1, description) below. */}
            <div className="td-hero">
            {(() => {
              const ogImg = (tool.ogImageUrl ?? (tool as any).og_image_url) as string | null;
              const extra = ((tool as any).gallery_images as string[] | null) ?? [];
              const imgs = [ogImg, ...extra].filter((u): u is string => !!u);
              const cover = imgs[0] ?? null;
              const rest = imgs.slice(1);
              // Keep the hero factual. The verdict belongs to the decision
              // card and to the analysis below, so repeating it here made the
              // first screen say the same thing three times.
              const priceContext = (() => {
                return isFree
                  ? t("Gratuit.", "Free.")
                  : displayPrice > 0
                  ? `${t("À partir de", "From")} ${formatPriceLabel(tool, displayPrice, t)}.`
                  : null;
              })();

              return (
                <>
                  <div className={`td-hero-card${cover ? " td-hero-card--with-cover" : ""}`}>
                    {cover && (
                      <img
                        className="td-hero-cover"
                        src={cover}
                        alt={t(`Aperçu de ${tool.name}`, `${tool.name} preview`) as string}
                        loading="lazy"
                        width={1200}
                        height={630}
                      />
                    )}
                    <div className="td-hero-heading">
                      <div className="td-hero-eyebrow-row">
                        {category && (
                          <Link className="td-hero-cat" to={`${prefix}/category/${category.slug}`}>
                            {CategoryIcon && <CategoryIcon className="td-icon-xs" />}
                            {t(catName, catNameEn)}
                          </Link>
                        )}
                        <PinToolButton
                          slug={tool.slug || tool.id}
                          label={tool.name}
                          t={t}
                          inline
                          labelMode="full"
                        />
                      </div>

                      {/* Single H1: name + intent subtitle nested in the same tag
                          so Google reads "Notion — Avis, prix et alternatives".
                          The space keeps the raw text from running together. */}
                      <h1 className="td-hero-h1">
                        {tool.name}{" "}
                        <span className="td-hero-h1-sub">
                          {heroIntent}
                        </span>
                      </h1>

                      {tool.shortDescription && (
                        <p className="td-hero-desc">
                          {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
                        </p>
                      )}
                      {priceContext && <p className="td-hero-context">{priceContext}</p>}
                    </div>
                  </div>

                  {/* Remaining screenshots (if any) below the hero card */}
                  {isPresentation && rest.length > 0 && <ToolGallery images={rest} toolName={tool.name} />}
                </>
              );
            })()}

            </div>
            {/* end hero identity */}

            <nav className="td-tool-subnav" aria-label={t(`Explorer la fiche ${tool.name}`, `Explore the ${tool.name} review`)}>
              {subpageLinks.map((item) => (
                <Link key={item.key} to={item.to} aria-current={subPage === item.key ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Immediate orientation: answer what the tool does and who it is
                for before asking the reader to interpret a verdict. */}
            {isPresentation && ((tool as any).relevantFor?.length > 0 || (tool as any).covers?.length > 0 || (tool as any).functional_needs?.length > 0) && (
              <section className="td-quick-context" aria-label={t(`À quoi sert ${tool.name}`, `What ${tool.name} is for`)}>
                {(tool as any).relevantFor?.length > 0 && (
                  <div className="td-quick-context-group">
                    <span className="td-quick-context-label">{t("Pour qui", "Best for")}</span>
                    <ToolAudienceBlock
                      relevantFor={(tool as any).relevantFor || []}
                      soloRelevance={tool.soloRelevance}
                      teamRelevance={tool.teamRelevance}
                      toolName={tool.name}
                      t={t}
                    />
                  </div>
                )}
                {((tool as any).covers?.length > 0 || (tool as any).functional_needs?.length > 0) && (
                  <div className="td-quick-context-group">
                    <span className="td-quick-context-label">{t("Ce que fait l'outil", "What it does")}</span>
                    <ToolFeaturesBlock
                      covers={(tool as any).covers || []}
                      functionalNeeds={(tool as any).functional_needs || []}
                      toolName={tool.name}
                      t={t}
                    />
                  </div>
                )}
              </section>
            )}

            {isPresentation && (
              <ToolTutorialsSection
                tutorials={tutorials}
                toolName={tool.name}
                lang={lang}
                t={t}
              />
            )}

            {/* Mobile completes the opening fiche with its decision card. */}
            <div className="td-sidebar-mobile">
              <StickyDecisionCard {...cardProps} />
            </div>

            {/* Editorial introduction — this frames the whole fiche, so it
                belongs directly after the factual opening rather than in the
                late-stage Details chapter. */}
            {showAnalysis && hasEditorialIntro && (
                <section className="td-editorial-intro">
                  <header className="td-editorial-intro-head">
                    <span className="td-eyebrow">{t("Notre lecture", "Our take")}</span>
                    <h2 className="td-editorial-intro-title">
                      {t(`Comprendre ${tool.name}.`, `Understanding ${tool.name}.`)}
                    </h2>
                  </header>
                  <div className="td-editorial-intro-copy">
                    {editorialParas.map((para: string, i: number) => (
                      <p key={i} className={i === 0 ? "td-analysis-lead" : "td-analysis-paragraph"}>
                        {para}
                      </p>
                    ))}
                    {editorialOverview.useCases.length > 0 && (
                      <section className="td-editorial-intro-usecases">
                        <h3 className="td-eyebrow">{t("Usages concrets", "Practical uses")}</h3>
                        <div className="td-overview-group td-overview-group--uses">
                          <ul>{editorialOverview.useCases.map((useCase: string) => {
                            const { title, detail } = splitUseCase(useCase);
                            return (
                              <li key={useCase}>
                                <Check size={15} aria-hidden />
                                <span>
                                  <strong>{title}</strong>
                                  {detail && <small>{detail}</small>}
                                </span>
                              </li>
                            );
                          })}</ul>
                        </div>
                      </section>
                    )}
                  </div>
                </section>
            )}

            {/* ════════════════════════════════
                SECTION: Analyse / Présentation
            ════════════════════════════════ */}
            {showAnalysis && (
              <div id="analyse" className="td-subpage-content">

                {/* 0 · Vue d'ensemble — même bloc que l'inspecteur de Ma stack.
                    Classes .stack-tool-inspector-* réutilisées telles quelles,
                    pas recopiées : les deux fiches doivent rester identiques
                    sans que personne ait à y penser. Seule différence assumée,
                    la fiche ne tronque aucune liste — c'est la référence. */}
                {(() => {
                  const ov = resolveToolOverview(tool, lang);
                  if (!ov.pros.length && !ov.cons.length && !ov.useCases.length) return null;
                  return (
                    <>
                      {!hasEditorialIntro && ov.useCases.length > 0 && (
                        <div className="td-section td-tool-overview td-tool-overview--uses">
                          <h2 className="td-eyebrow">{t("Usages concrets", "Practical uses")}</h2>
                          <section className="td-overview-group td-overview-group--uses">
                            <ul>{ov.useCases.map((useCase: string) => {
                              const { title, detail } = splitUseCase(useCase);
                              return (
                                <li key={useCase}>
                                  <Check size={15} aria-hidden />
                                  <span>
                                    <strong>{title}</strong>
                                    {detail && <small>{detail}</small>}
                                  </span>
                                </li>
                              );
                            })}</ul>
                          </section>
                        </div>
                      )}
                      {(ov.pros.length > 0 || ov.cons.length > 0) && (
                        <div className="td-section td-tool-overview td-tool-overview--decision">
                          <header className="td-overview-decision-head">
                            <h2 className="td-overview-title">
                              {t("Avantages et inconvénients", "Pros and cons")}
                            </h2>
                            <p>{t(`Ce que ${tool.name} fait particulièrement bien — et les limites à anticiper.`, `What ${tool.name} does especially well — and the limits to anticipate.`)}</p>
                          </header>
                          <div className="td-overview-grid">
                            {ov.pros.length > 0 && (
                              <section className="td-overview-group td-overview-group--pros">
                                <h3 className="td-overview-group-title">
                                  <CirclePlus aria-hidden />
                                  {t("Avantages", "Pros")}
                                </h3>
                                <ul>{ov.pros.map((p: string) => <li key={p}><Check size={15} aria-hidden />{p}</li>)}</ul>
                              </section>
                            )}
                            {ov.cons.length > 0 && (
                              <section className="td-overview-group td-overview-group--limits">
                                <h3 className="td-overview-group-title">
                                  <CircleMinus aria-hidden />
                                  {t("Inconvénients", "Cons")}
                                </h3>
                                <ul>{ov.cons.map((c: string) => <li key={c}>{c}</li>)}</ul>
                              </section>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <section className="td-decision-flow">
                {/* 1 · Décision rapide — 3 blocs éditoriaux */}
                {(() => {
                  const { keepItems, avoidItems, threshold } = resolveVerdict(tool, lang);

                  const keepText = keepItems.length ? keepItems.slice(0, 2).join(". ") : undefined;
                  const challengeText = avoidItems.length ? avoidItems.slice(0, 2).join(". ") : undefined;

                  // Ne pas rendre une coquille vide « quand ça a du sens » pour un outil sans
                  // matière de verdict (ex. app de bundle non onboardée) : la section disparaît.
                  if (!threshold && !keepText && !challengeText) return null;

                  return (
                    <div className="td-section td-decision-flow-intro">
                      <h2 className="td-title">
                        {lang === "fr"
                          ? `${tool.name} : quand ça a du sens.`
                          : `${tool.name}: when it makes sense.`}
                      </h2>

                      {/* Verdict sentence */}
                      {threshold && <p className="td-verdict-lead">{threshold}</p>}

                      <ToolProfitabilityBlock
                        tool={tool} lang={lang} t={t}
                        keepText={keepText} challengeText={challengeText}
                      />
                    </div>
                  );
                })()}

                </section>

              </div>
            )}

            {/* ════════════════════════════════
                SECTION: Prix — moved ahead of the audience/features/long-
                analysis content (was after it). Prix and Alternatives are
                the two sections most readers actually need to decide; the
                "nice to know" content shouldn't sit between the verdict and
                them. Site-wide change, all 1109 tool pages.
            ════════════════════════════════ */}
            {showPricing && (
              <div id="prix" className="td-subpage-content">
                <div className="td-section">
                  <h2 className="td-title">
                    {t(`Combien coûte ${tool.name} ?`, `How much does ${tool.name} cost?`)}
                  </h2>
                  <ToolPricingSection
                    tool={tool} displayPrice={displayPrice}
                    lang={lang} t={t}
                  />
                  <ToolCostBreakdownTable tool={tool} lang={lang} t={t} />
                  <ToolBillingTrapsBlock tool={tool} lang={lang} t={t} />
                </div>
                <ToolBundleSection tool={tool} lang={lang} t={t} />
              </div>
            )}

            {/* ════════════════════════════════
                SECTION: Alternatives — moved up alongside Prix, see comment
                above.
            ════════════════════════════════ */}
            {showAlternatives && hasAlternativesContent && (
              <div id="alternatives" className="td-subpage-content">
                <div className="td-section">
                  <h2 className="td-title">
                    {t(`Meilleures alternatives à ${tool.name}.`, `Best alternatives to ${tool.name}.`)}
                  </h2>

                  {alternatives.length > 0 && (
                    <ToolComparisonTable
                      tool={tool} alternatives={alternatives}
                      prefix={prefix} lang={lang} t={t}
                    />
                  )}

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
                      <div className="td-subs">
                        <p className="td-eyebrow td-eyebrow--tight">
                          {t("Substituables directement", "Direct substitutes")}
                        </p>
                        <div className="td-chips">
                          {clusterTools.map((ct: any) => (
                            <Link
                              key={ct.id}
                              to={`${prefix}/tool/${ct.slug || ct.id}`}
                              className="td-chip"
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
                      <div className="td-subs">
                        <p className="td-eyebrow td-eyebrow--tight">
                          {t(`Comparer ${tool.name} avec`, `Compare ${tool.name} with`)}
                        </p>
                        {compareTools.map(({ slugPair, other }) => (
                          <Link
                            key={slugPair}
                            to={`${prefix}/comparatif/${slugPair}`}
                            className="td-alt-row"
                          >
                            <div className="td-alt-logo">
                              <ToolLogo tool={other} size={24} />
                            </div>
                            <div>
                              <p className="td-alt-name">
                                {tool.name} vs {other.name}
                              </p>
                              <p className="td-alt-meta">
                                {t("Voir la comparaison complète", "See full comparison")}
                              </p>
                            </div>
                            <ArrowRight className="td-alt-arrow" />
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
            {showDeepDive && (
              <div id="approfondir" className="td-subpage-content">
                {/* 9 · Intégrations / Plugins — the block owns its own
                     td-section wrapper and returns null when there's
                     nothing to show, so no empty divider renders. */}
                <ToolPluginsBlock tool={tool} allTools={tools} prefix={prefix} lang={lang} t={t} />

                {/* 10 · L'angle IA : augmenter ou remplacer ? — same. */}
                <ToolAiBlock tool={tool} allTools={tools} prefix={prefix} lang={lang} t={t} />

                {/* Quiet structured recap for search and extraction. Keeping
                    it at the end of the deep dive avoids interrupting the
                    human decision path near the top of the page. */}
                <ToolSummaryBlock
                  tool={tool} category={category} alternatives={alternatives}
                  displayPrice={displayPrice} lang={lang} prefix={prefix} t={t}
                />

              </div>
            )}
            {/* ════════════════════════════════
                SECTION: Avis
            ════════════════════════════════ */}
            {showReview && (
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
                      <h2 className="td-title">
                        {t(`Notre avis sur ${tool.name}.`, `Our verdict on ${tool.name}.`)}
                      </h2>

                      {/* The numeric score already lives in the sticky/mobile
                          decision card. This section explains it instead of
                          printing the same large metric twice. */}
                      <div className="td-review-rationale">
                        <div>
                          <span className="td-eyebrow td-eyebrow--tight">{t("Pourquoi ce verdict", "Why this verdict")}</span>
                          <p className="td-review-label">{t(ts.labelFr, ts.labelEn)}</p>
                        </div>
                        <p className="td-score-text">
                          {t(`${tool.name} est ${scoreReasonFr}.`, `${tool.name} is ${scoreReasonEn}.`)}
                        </p>
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}

            {/* ════════════════════════════════
                SECTION: FAQ
            ════════════════════════════════ */}
            {showFaq && (
              <div id="faq" className="td-subpage-content">
                <div className="td-section">
                  <ToolFAQSection
                    tool={tool} displayPrice={displayPrice}
                    verifiedOn={verifiedOn} alternatives={alternatives}
                    lang={lang} t={t}
                  />
                </div>
              </div>
            )}

          </main>
          {/* end main content */}

          {/* ── RIGHT SIDEBAR — StickyDecisionCard ── */}
          <aside className="td-sidebar-desktop">
              <StickyDecisionCard {...cardProps} />

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className="td-related-guides">
                  <p className="td-eyebrow td-eyebrow--tight">
                    {t("Guides liés", "Related guides")}
                  </p>
                  <div className="td-related-guides-list">
                    {relatedPosts.map((post: any) => (
                      <Link
                        key={post.slug}
                        to={`${prefix}/guide/${post.slug}`}
                        className="td-guide-link"
                      >
                        <p className="td-guide-link-title">
                          {post.title}
                        </p>
                        {post.readTime && (
                          <p className="td-caption">
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


    </article>
  );
};

export default ToolDetailPage;
