import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useCurrency } from "@/hooks/useCurrency";
import { useToolBySlug, useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CirclePlus, CircleMinus, ExternalLink, Lightbulb, Star, StarSolid } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import { FEATURED_COMPARISONS } from "@/data/comparisons";
import { getToolDomain, getDomainFromUrl, formatPriceLabel, isOneTimePrice, resolveVerdict, resolveToolOverview } from "@/lib/toolUtils";
import { stripLeadingEmoji } from "@/lib/text";
import { hasGenuineFreeTier, isPriceUndisclosed, resolveMonthlyPrice } from "@/lib/pricing";

import ToolSummaryBlock from "@/components/tool/ToolSummaryBlock";
import ToolPricingSection from "@/components/tool/ToolPricingSection";
import ToolBundleSection from "@/components/tool/ToolBundleSection";
import ToolFeaturesBlock from "@/components/tool/ToolFeaturesBlock";
import ToolComparisonTable from "@/components/tool/ToolComparisonTable";
import ToolAudienceBlock from "@/components/tool/ToolAudienceBlock";
import ToolPluginsBlock from "@/components/tool/ToolPluginsBlock";
import ToolProfitabilityBlock from "@/components/tool/ToolProfitabilityBlock";
import ToolBillingTrapsBlock from "@/components/tool/ToolBillingTrapsBlock";
import ToolAiBlock from "@/components/tool/ToolAiBlock";
import ToolGallery from "@/components/tool/ToolGallery";
import { getToolTutorials } from "@/data/toolTutorials";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { findSimilarTools, functionalAffinity } from "@/lib/alternativesSimilarity";
import ToolFAQSection from "@/components/tool/ToolFAQSection";
import { getGuidesForTool } from "@/lib/toolGuides";
import ToolJsonLd from "@/components/tool/ToolJsonLd";
import PinToolButton from "@/components/PinToolButton";
import StickyDecisionCard from "@/components/tool/StickyDecisionCard";
import { relPourLienOutil, relExterne, safeExternalUrl } from "@/lib/externalLink";
import { hasEditorialSubstance } from "@/lib/editorialSubstance";
import { toolPageHeadingSuffix, toolSeoDescription, toolSeoTitle, type ToolSeoPage } from "@/lib/toolSeo";
import { getExplorerHref } from "@/lib/toolExploration";

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
  const { currency } = useCurrency();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { tool, loading } = useToolBySlug(slug);
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const [showCompactHeader, setShowCompactHeader] = useState(false);

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
  const headingSuffix = toolPageHeadingSuffix(subPage === "faq" ? "presentation" : subPage, lang);

  /* ── SEO ── */
  useEffect(() => {
    if (!tool) return;
    // Same builders as the prerender (src/lib/toolSeo.ts): the tab title and
    // the description must not change once the page hydrates.
    // /faq permanently redirects to the fiche (vercel.json): same tags.
    const seoPage: ToolSeoPage = subPage === "faq" ? "presentation" : subPage;
    const year = new Date().getFullYear();
    const baseSlug = tool.slug || tool.id;
    const seoTitle = toolSeoTitle(tool, seoPage, lang, year);
    const seoDesc = toolSeoDescription(tool, seoPage, lang, year);
    const canonicalSuffix =
      seoPage === "prix" ? (lang === "en" ? "/pricing" : "/prix") :
      seoPage === "avis" ? (lang === "en" ? "/reviews" : "/avis") :
      seoPage === "alternatives" ? "/alternatives" :
      "";
    const canonicalPath = `/${lang}/tool/${baseSlug}${canonicalSuffix}`;
    const canonicalUrl = `${SEO_BASE}${canonicalPath}`;

    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, locale: lang === "fr" ? "fr_FR" : "en_US" });
    // Le prerendu conditionne deja cette balise a une vraie date de
    // verification. Le client la posait toujours, avec un repli code en dur :
    // le HTML servi et le DOM apres hydratation annoncaient donc deux choses
    // differentes, et la seconde etait fausse.
    if (tool.pricing_v5?.verified_on) setMeta("article:modified_time", tool.pricing_v5.verified_on);
    setHreflang(canonicalPath);
    return () => cleanupSeo([]);
  }, [tool, lang, subPage]);

  /* ── Tous les hooks doivent être déclarés AVANT les returns conditionnels ──
     (Rules of Hooks — sinon React error #300/#310 en concurrent mode)        */

  /* Redirect outil non trouvé → /tools */
  useEffect(() => {
    if (!loading && !tool) {
      navigate(`${prefix}/tools`, { replace: true });
    }
  }, [loading, tool, navigate, prefix]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !tool) return;

    const scrollRoot = hero.closest(".asv2-content");
    if (!(scrollRoot instanceof HTMLElement)) return;

    let frame = 0;
    let compactAt = 0;
    const measure = () => {
      const rootTop = scrollRoot.getBoundingClientRect().top;
      // Compact exactly when the hero reaches its sticky position. Using its
      // bottom delayed the state change by the full expanded height, allowing
      // following content to slide underneath a still-expanded card.
      compactAt = scrollRoot.scrollTop + hero.getBoundingClientRect().top - rootTop;
      const heroMedia = hero.querySelector<HTMLElement>(".td-hero-media");
      if (heroMedia) hero.style.setProperty("--td-hero-media-h", `${heroMedia.scrollHeight}px`);
    };
    const updateCompactHeader = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setShowCompactHeader(scrollRoot.scrollTop >= compactAt);

      });
    };
    const handleResize = () => {
      if (!hero.classList.contains("is-compact")) measure();
      updateCompactHeader();
    };

    measure();
    updateCompactHeader();
    scrollRoot.addEventListener("scroll", updateCompactHeader, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      scrollRoot.removeEventListener("scroll", updateCompactHeader);
      window.removeEventListener("resize", handleResize);
    };
  }, [tool, subPage]);

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
  const clusterTools = (tool as any).substitution_cluster_v2
    ? findSimilarTools(
        tool,
        tools.filter((ct: any) => ct.substitution_cluster_v2 === (tool as any).substitution_cluster_v2 && ct.id !== tool.id),
      ).slice(0, 6)
    : [];

  // Voisinage de categorie, servi uniquement quand aucun substitut direct
  // n'existe.
  //
  // 525 pages /alternatives sur 1074 ne contenaient aucun bloc : le titre
  // promettait « Meilleures alternatives à X » et la page n'en citait aucune.
  // C'est la deuxieme famille du site en clics et la seule ou une demande
  // mesuree faisait face a une offre vide.
  //
  // La cause est en amont du score : 40 % des outils n'ont pas de cluster de
  // substitution, et 19 % n'ont pas de `verticals`, or la similarite est le
  // produit de deux indices de Jaccard, qu'un ensemble vide annule. Remplir ces
  // champs est le vrai correctif, suivi a part.
  //
  // Le libelle compte autant que la liste. Un audit externe avait trouve des
  // outils d'assurance sante presentes comme « substituables directement » a
  // Asana. On n'affirme donc pas la substituabilite ici : on propose un
  // voisinage de categorie, et on le dit.
  // La categorie seule ne suffit pas a qualifier un voisin : « creation »
  // compte 226 outils, et un classement par note y proposait FLUX AI et
  // Grammarly en face d'Ableton Live. Le recouvrement des besoins fonctionnels
  // fait le tri, et il est le seul champ renseigne sur 100 % du catalogue,
  // contrairement a `verticals`. Sur le meme exemple il remonte Logic Pro et
  // Pro Tools a 1,00, Audacity a 0,40, et ecarte Grammarly a 0.
  const sameCategoryTools = (alternatives.length > 0 || clusterTools.length > 0)
    ? []
    : tools
        .filter((ct: any) => ct.categoryId && ct.categoryId === (tool as any).categoryId && ct.id !== tool.id)
        .map((ct: any) => ({ ct, affinity: functionalAffinity(tool, ct) }))
        .filter((x) => x.affinity > 0)
        .sort((a, b) => b.affinity - a.affinity || String(a.ct.name).localeCompare(String(b.ct.name)))
        // One shared generic need ("creator-workflow") put Adcreative AI next
        // to Acast. A neighbour must share a real part of the needs, and stay
        // within half of the best neighbour's score. Catalogue-wide this
        // empties 3 lists, which fall back to the exploration link below.
        .filter((x, _i, ranked) => x.affinity >= 0.25 && x.affinity >= ranked[0].affinity * 0.5)
        .slice(0, 6)
        .map((x) => x.ct);

  const hasFeaturedComparison = FEATURED_COMPARISONS.some(
    (c: any) => c.toolA === (tool.slug || tool.id) || c.toolB === (tool.slug || tool.id),
  );

  // 105 fiches n'ont aucun voisin partageant un besoin fonctionnel, et leur
  // page /alternatives restait entierement vide sous un titre qui promettait
  // « Meilleures alternatives a X ».
  //
  // Ce n'est pas l'algorithme, c'est la taxonomie : 309 des 573 besoins
  // fonctionnels du catalogue ne sont portes que par un seul outil. Relacher
  // la comparaison au niveau des mots du tag remplirait une soixantaine de ces
  // pages, mais proposerait DocuSign et Ironclad en face de Google Docs, qui
  // est classe a tort dans `legal-contracts` : la relaxation amplifierait
  // l'erreur de classement au lieu de la reveler. Une page vide vaut mieux
  // qu'une page sure d'elle et fausse.
  //
  // On sort donc du cul-de-sac sans rien affirmer : la page renvoie vers
  // l'exploration de voisinage, qui existe deja et qui dit exactement ce
  // qu'elle fait.
  const showExplorationFallback = alternatives.length === 0
    && clusterTools.length === 0
    && sameCategoryTools.length === 0
    && !hasFeaturedComparison;

  // Toujours vrai depuis que la retombee ci-dessus couvre le cas vide. La
  // constante est gardee explicite parce qu'elle pilote aussi l'onglet de la
  // barre de navigation : si la retombee disparait un jour, l'onglet doit
  // redevenir conditionnel plutot que de pointer vers une page vide.
  const hasAlternativesContent = true;

  // App Store style "you might also like" list: real logo, name and the
  // tool's one-line pitch, instead of name-only chips with 18px logos.
  const renderAltShelf = (list: any[]) => (
    <ul className="td-alt-shelf">
      {list.map((ct: any) => {
        const pitch = lang === "en" ? (ct.shortDescriptionEn || ct.shortDescription) : ct.shortDescription;
        return (
          <li key={ct.id}>
            <Link to={`${prefix}/tool/${ct.slug || ct.id}`} className="td-alt-shelf-item">
              <ToolLogo tool={ct} size={44} className="td-alt-shelf-logo" />
              <span className="td-alt-shelf-copy">
                <span className="td-alt-shelf-name">{ct.name}</span>
                {pitch && <span className="td-alt-shelf-pitch">{pitch}</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
  const displayPrice  = resolveMonthlyPrice(tool);
  // Pas de date de repli. Elle valait « 2026-03-29 » et s'affichait comme
  // « Dernière vérification » sur les 325 fiches sans `pricing_v5`, soit 644
  // pages, en plus d'alimenter le `dateModified` des données structurées et la
  // réponse FAQ « Prix vérifié le… ». Une vérification qui n'a pas eu lieu ne
  // se date pas : ToolTrim vend précisément la fiabilité du tarif.
  const verifiedOn    = tool.pricing_v5?.verified_on || null;
  const sourceDomain  = tool.pricing_v5?.source_domain;
  const domain        = getDomainFromUrl(tool.websiteUrl) || getToolDomain(tool);
  const safeAffiliateUrl = safeExternalUrl(tool.affiliateLink);
  const safeWebsiteUrl = safeExternalUrl(tool.websiteUrl);
  const primaryCtaUrl = safeAffiliateUrl || safeWebsiteUrl;
  const isFree        = displayPrice === 0 && !tool.pricing?.paid;
  const primaryCtaLabel = (lang === "en" ? tool.affiliateCtaLabelEn : tool.affiliateCtaLabelFr) || t("Visiter le site", "Visit website");
  const hasFreeplan   = hasGenuineFreeTier(tool.pricing?.free);
  // Was `!!(tool.pricing?.free && tool.pricing?.paid)` — pure truthiness,
  // so a free field describing the ABSENCE of a free plan ("Pas de plan
  // gratuit permanent : essai de 14 jours") still counted as "Freemium"
  // since the string itself is non-empty. Reuse hasFreeplan's semantic
  // check instead.
  const isFreemium    = hasFreeplan && !!tool.pricing?.paid;
  const catName       = stripLeadingEmoji(category?.name, category?.id || "");
  const catNameEn     = stripLeadingEmoji(category?.nameEn, catName);

  const toolType = (tool as any).tool_type as string;

  /* Shared card props */
  const cardProps = { tool, prefix, t, alternatives };
  // Pas de retombee sur le francais : une fiche anglaise sans texte anglais
  // n'affiche pas le bloc plutot que de servir du francais.
  const editorialLongDesc = lang === "en"
    ? ((tool as any).longDescriptionEn || "")
    : ((tool as any).longDescription || "");
  const hasEditorialIntro = hasEditorialSubstance(editorialLongDesc);
  const editorialParas = hasEditorialIntro
    ? editorialLongDesc.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean)
    : [];
  const editorialOverview = resolveToolOverview(tool, lang);
  // Le bloc "Comprendre X" ne porte pas que le paragraphe d'intro : il porte
  // aussi les cas d'usage, les fonctionnalites et l'audience. Le conditionner
  // au seul paragraphe masquait ces trois sous-blocs sur 143 fiches, alors que
  // 142 d'entre elles declarent des fonctionnalites et une audience. On ouvre
  // donc la section des qu'un de ses contenus existe, et le paragraphe reste
  // conditionne a sa propre substance.
  const hasEditorialFacts =
    editorialOverview.useCases.length > 0 ||
    (tool as any).covers?.length > 0 ||
    (tool as any).functional_needs?.length > 0 ||
    (tool as any).relevantFor?.length > 0 ||
    (tool as any).verticals?.length > 0;
  const showEditorialOverview = hasEditorialIntro || hasEditorialFacts;
  const isPresentation = subPage === "presentation";
  const showAnalysis = isPresentation || subPage === "avis";
  const showPricing = isPresentation || subPage === "prix";
  const showAlternatives = isPresentation || subPage === "alternatives";
  const showDeepDive = isPresentation;
  const showReview = isPresentation || subPage === "avis";
  const showFaq = isPresentation || subPage === "faq";
  const relatedGuides = getGuidesForTool(tool.slug || tool.id, lang);
  const baseToolPath = `${prefix}/tool/${tool.slug || tool.id}`;
  const subpageLinks = [
    { key: "presentation", label: t("Vue d’ensemble", "Overview"), to: baseToolPath },
    { key: "prix", label: t("Prix", "Pricing"), to: `${baseToolPath}/${lang === "en" ? "pricing" : "prix"}` },
    ...(hasAlternativesContent ? [{ key: "alternatives", label: t("Alternatives", "Alternatives"), to: `${baseToolPath}/alternatives` }] : []),
    { key: "avis", label: t("Avis", "Reviews"), to: `${baseToolPath}/${lang === "en" ? "reviews" : "avis"}` },
    // /faq is a dead route (vercel.json redirects it back to the fiche to
    // avoid duplicate-content pages), and the FAQ block already renders on
    // the overview tab — link straight to its anchor instead of a URL that
    // bounces the visitor right back to where they started.
    { key: "faq", label: "FAQ", to: `${baseToolPath}#faq` },
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
    <article className={`min-h-screen td-tool-page${showCompactHeader ? " td-tool-page--compact" : ""}`} itemScope itemType="https://schema.org/WebPage">
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

            {/* Hero identity — editorial identity first, supporting OG visual
                below. The product logo remains associated with its name in
                both the expanded and compact sticky states. */}
            <div ref={heroRef} className={`td-hero${showCompactHeader ? " is-compact" : ""}`}>
            {(() => {
              // Keep the hero factual. The verdict belongs to the decision
              // card and to the analysis below, so repeating it here made the
              // first screen say the same thing three times.
              return (
                <>
                  <div className="td-hero-card">
                    <div className="td-hero-heading">
                      <div className="td-hero-identity-grid">
                        <span className="td-hero-logo" aria-hidden="true">
                          <ToolLogo tool={tool} size={56} className="td-hero-logo-image" />
                        </span>

                        <div className="td-hero-name-block">
                          <h1 className="td-hero-h1">
                            {tool.name}
                            {/* Sub-pages say what they are about: "NordPass pricing". */}
                            {headingSuffix ? <span className="td-hero-h1-page">{headingSuffix}</span> : null}
                          </h1>
                          {tool.shortDescription && (
                            <p className="td-hero-desc">
                              {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription)}
                            </p>
                          )}
                        </div>

                        <div className="td-hero-actions">
                        {primaryCtaUrl && <a
                          href={primaryCtaUrl}
                          target="_blank"
                          rel={relPourLienOutil(primaryCtaUrl, tool.affiliateLink, tool.websiteUrl)}
                          className="td-hero-site-link"
                          onClick={() => trackEvent("outbound_tool_click", {
                            tool_slug: tool.slug || tool.id,
                            tool_name: tool.name,
                            cta_location: "tool_hero",
                            cta_label: primaryCtaLabel,
                            destination_domain: getDomainFromUrl(primaryCtaUrl),
                            language: lang,
                            is_affiliate: Boolean(safeAffiliateUrl && primaryCtaUrl === safeAffiliateUrl),
                          })}
                        >
                          {primaryCtaLabel}
                          <ExternalLink aria-hidden />
                        </a>}
                        <PinToolButton slug={tool.slug || tool.id} label={tool.name} t={t} labelMode="icon" />
                        {(lang === "en" ? tool.affiliateDisclosureEn : tool.affiliateDisclosureFr) && <p className="td-hero-affiliate-disclosure">{lang === "en" ? tool.affiliateDisclosureEn : tool.affiliateDisclosureFr}</p>}
                        </div>
                      </div>

                    </div>
                  </div>
                  <div className="td-sidebar-mobile td-opening-verdict">
                    <StickyDecisionCard {...cardProps} section="verdict" />
                  </div>


                </>
              );
            })()}

            </div>
            {/* end hero identity */}

            <div ref={scrollBodyRef} className="td-scroll-body">

            <nav className="td-tool-subnav" aria-label={t(`Explorer la fiche ${tool.name}`, `Explore the ${tool.name} review`)}>
              {subpageLinks.map((item) => (
                <Link key={item.key} to={item.to} aria-current={subPage === item.key ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>

            {showAnalysis && (() => {
              const cover = tool.ogImageUrl ?? (tool as any).og_image_url;
              const images = [cover, ...(tool.galleryImages ?? (tool as any).gallery_images ?? [])]
                .filter((url): url is string => !!url);
              return images.length > 0 || tutorials.length > 0 ? (
                <div className="td-hero-media">
                  <ToolGallery images={images} videos={tutorials} toolName={tool.name} lang={lang} variant="hero" />
                </div>
              ) : null;
            })()}

            {/* Editorial overview: the reference layout is reproduced inside
                the content itself — analysis on the left, factual rail on the
                right. The global sticky decision card remains action-only. */}
            {showAnalysis && showEditorialOverview && (
              <section className="td-editorial-overview">
                <div className="td-editorial-intro">
                  <header className="td-editorial-intro-head">
                    <span className="td-eyebrow">{t("À propos", "About")}</span>
                    <h2 className="td-editorial-intro-title">
                      {t("En pratique.", "In practice.")} <span className="tt-title-muted">{t(`Ce que ${tool.name} permet de faire.`, `What you can do with ${tool.name}.`)}</span>
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
                                <Lightbulb size={15} aria-hidden />
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
                    {((tool as any).covers?.length > 0 || (tool as any).functional_needs?.length > 0) && (
                      <section className="td-editorial-intro-features">
                        <h3 className="td-eyebrow">{t("Fonctionnalités et usages", "Features & use cases")}</h3>
                        <ToolFeaturesBlock
                          covers={(tool as any).covers || []}
                          functionalNeeds={(tool as any).functional_needs || []}
                          toolName={tool.name}
                          t={t}
                        />
                      </section>
                    )}
                  </div>
                </div>

                <aside className="td-editorial-facts" aria-label={t(`Informations sur ${tool.name}`, `${tool.name} facts`)}>
                  <section className="td-editorial-fact-group">
                    <h3>{t("Pour qui", "Best for")}</h3>
                    <ToolAudienceBlock
                      relevantFor={(tool as any).relevantFor?.length > 0
                        ? (tool as any).relevantFor
                        : (tool as any).verticals?.length > 0
                          ? (tool as any).verticals
                          : ((tool as any).functional_needs || [])}
                      soloRelevance={tool.soloRelevance}
                      teamRelevance={tool.teamRelevance}
                      toolName={tool.name}
                      t={t}
                    />
                  </section>

                  <dl className="td-editorial-fact-list">
                    <div>
                      <dt>{t("Prix", "Pricing")}</dt>
                      <dd>{displayPrice === 0 && !isOneTimePrice(tool)
                        ? (isPriceUndisclosed(tool) ? t("Prix non communiqué", "Price not public") : t("Gratuit", "Free"))
                        : displayPrice != null && (displayPrice > 0 || isOneTimePrice(tool))
                          ? formatPriceLabel(tool, displayPrice, t, currency, lang)
                          : t("Sur devis", "Contact sales")}</dd>
                    </div>
                    {catName && (
                      <div>
                        <dt>{t("Catégorie", "Category")}</dt>
                        <dd>
                          <Link className="td-editorial-fact-link" to={`${prefix}/category/${category.slug}`}>
                            {t(catName, catNameEn)}
                          </Link>
                        </dd>
                      </div>
                    )}
                    {(tool as any).host_app && (
                      <div>
                        <dt>{t("Plateforme", "Platform")}</dt>
                        <dd>{(tool as any).host_app}</dd>
                      </div>
                    )}
                    {verifiedOn && (
                      <div>
                        <dt>{t("Dernière vérification", "Last verified")}</dt>
                        <dd>{new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${verifiedOn}T00:00:00`))}</dd>
                      </div>
                    )}
                  </dl>

                  {safeWebsiteUrl && (
                    <section className="td-editorial-fact-group">
                      <h3>{t("Lien", "Link")}</h3>
                      <a className="td-editorial-official-link" href={safeWebsiteUrl} target="_blank" rel={relExterne("source")}>
                        <span>{t("Site officiel", "Official website")}</span>
                        <ExternalLink aria-hidden />
                      </a>
                    </section>
                  )}
                </aside>
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
                      {!showEditorialOverview && ov.useCases.length > 0 && (
                        <div className="td-section td-tool-overview td-tool-overview--uses">
                          <h2 className="td-eyebrow">{t("Usages concrets", "Practical uses")}</h2>
                          <section className="td-overview-group td-overview-group--uses">
                            <ul>{ov.useCases.map((useCase: string) => {
                              const { title, detail } = splitUseCase(useCase);
                              return (
                                <li key={useCase}>
                                  <Lightbulb size={15} aria-hidden />
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
                            <p>{t(`Ce que ${tool.name} fait particulièrement bien et les limites à anticiper.`, `What ${tool.name} does especially well and the limits to anticipate.`)}</p>
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
                  const { keepItems, avoidItems } = resolveVerdict(tool, lang);

                  const keepList = keepItems.slice(0, 2);
                  const challengeList = avoidItems.slice(0, 2);

                  // Ne pas rendre une coquille vide « quand ça a du sens » pour un outil sans
                  // matière de verdict (ex. app de bundle non onboardée) : la section disparaît.
                  // The verdict sentence (threshold) already opens the page in
                  // the decision card; this section only carries the reasons.
                  // Priced tools still get the auto profitability thresholds.
                  if (!keepList.length && !challengeList.length && !(resolveMonthlyPrice(tool) > 0)) return null;

                  return (
                    <div className="td-section td-decision-flow-intro">
                      <h2 className="td-title">
                        {lang === "fr"
                          ? `${tool.name} : quand ça a du sens.`
                          : `${tool.name}: when it makes sense.`}
                      </h2>

                      <ToolProfitabilityBlock
                        tool={tool} lang={lang} t={t}
                        keepItems={keepList} challengeItems={challengeList}
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
                    {t("Tarifs.", "Pricing.")} <span className="tt-title-muted">{t(`Quel budget pour ${tool.name} ?`, `What does ${tool.name} cost?`)}</span>
                  </h2>
                  <ToolPricingSection
                    tool={tool} displayPrice={displayPrice}
                    lang={lang} t={t}
                  />
                  <ToolBillingTrapsBlock tool={tool} lang={lang} t={t} />
                </div>
                <ToolBundleSection tool={tool} tools={tools} lang={lang} t={t} />
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
                    {t("Alternatives.", "Alternatives.")} <span className="tt-title-muted">{t(`Que choisir à la place de ${tool.name} ?`, `What could replace ${tool.name}?`)}</span>
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
                  {clusterTools.length > 0 && (
                    <div className="td-subs">
                      <p className="td-eyebrow td-eyebrow--tight">
                        {t("Substituables directement", "Direct substitutes")}
                      </p>
                      {renderAltShelf(clusterTools)}
                    </div>
                  )}

                  {sameCategoryTools.length > 0 && (
                    <div className="td-subs">
                      <p className="td-eyebrow td-eyebrow--tight">
                        {t("Outils de la même catégorie", "Tools in the same category")}
                      </p>
                      <p className="td-analysis-paragraph">
                        {t(
                          `Ils couvrent les mêmes besoins que ${tool.name}, sans être encore confirmés comme remplaçants directs. À comparer selon ton usage.`,
                          `They cover the same needs as ${tool.name}, but aren't confirmed one-to-one replacements yet. Compare them against your own use.`,
                        )}
                      </p>
                      {renderAltShelf(sameCategoryTools)}
                    </div>
                  )}

                  {showExplorationFallback && (
                    <div className="td-subs">
                      <p className="td-eyebrow td-eyebrow--tight">
                        {t("Pas de substitut établi", "No established substitute")}
                      </p>
                      <p className="td-analysis-paragraph">
                        {t(
                          `Aucun outil du catalogue ne couvre le même besoin que ${tool.name}. Plutôt que d'en proposer un approximatif, voici l'exploration par voisinage.`,
                          `No tool in the catalogue covers the same need as ${tool.name}. Rather than suggest an approximate match, here is the neighbourhood view.`,
                        )}
                      </p>
                      <div className="td-chips">
                        <Link
                          to={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                          className="td-chip"
                        >
                          {t(`Explorer autour de ${tool.name}`, `Explore around ${tool.name}`)}
                        </Link>
                      </div>
                    </div>
                  )}

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
                        {t("Notre avis.", "Our verdict.")} <span className="tt-title-muted">{t(`Ce qu’il faut retenir de ${tool.name}.`, `What to know about ${tool.name}.`)}</span>
                      </h2>

                      {/* The numeric score already lives in the sticky/mobile
                          decision card. This section explains it instead of
                          printing the same large metric twice. */}
                      {ts.source === "v2" && tool.toolTrimRating ? (
                        <div className="td-review-rationale-v2">
                          <div className="td-review-verdict-header">
                            <span className="td-eyebrow td-eyebrow--tight">{t("Pourquoi ce verdict", "Why this verdict")}</span>
                            <p className="td-review-label">{t(ts.labelFr, ts.labelEn)}</p>
                          </div>
                          <div className="td-score-breakdown">
                            {([
                              ["valeurAjoutee", "Valeur ajoutée", "Added value"],
                              ["simplicite", "Simplicité", "Simplicity"],
                              ["utilisation", "Utilisation", "Fit for purpose"],
                              ["puissance", "Puissance", "Performance"],
                              ["reversibilite", "Réversibilité", "Reversibility"],
                            ] as const).map(([key, labelFr, labelEn]) => {
                              const value = tool.toolTrimRating![key] ?? 0;
                              const evidenceText = (lang === "en" && tool.toolTrimRating!.evidenceEn?.[key])
                                || tool.toolTrimRating!.evidence[key];
                              return (
                                <div className="td-score-axis-card" key={key}>
                                  <div className="td-score-axis-row">
                                    <span className="td-score-axis-name">{t(labelFr, labelEn)}</span>
                                    <div className="td-score-meter" aria-label={`${value}/5`}>
                                      {[1, 2, 3, 4, 5].map((i) =>
                                        i <= value
                                          ? <StarSolid key={i} size={16} className="td-score-star td-score-star--filled" aria-hidden="true" />
                                          : <Star key={i} size={16} className="td-score-star" aria-hidden="true" />
                                      )}
                                    </div>
                                  </div>
                                  {evidenceText && (
                                    <p className="td-score-axis-evidence">{evidenceText}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="td-review-rationale">
                          <div>
                            <span className="td-eyebrow td-eyebrow--tight">{t("Pourquoi ce verdict", "Why this verdict")}</span>
                            <p className="td-review-label">{t(ts.labelFr, ts.labelEn)}</p>
                          </div>
                          <p className="td-score-text">
                            {t(`${tool.name} est ${scoreReasonFr}.`, `${tool.name} is ${scoreReasonEn}.`)}
                          </p>
                        </div>
                      )}

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

            {/* ════════════════════════════════
                SECTION: guides couvrant l'outil
                Le seul lien sortant de la fiche vers l'éditorial : sans lui, le
                catalogue ne renvoie que vers lui-même. Réservé à la page de
                présentation, les sous-pages restant des extraits de celle-ci.
            ════════════════════════════════ */}
            {isPresentation && relatedGuides.length > 0 && (
              <div className="td-subpage-content">
                <div className="td-section">
                  <section className="td-guides">
                    <h2 className="td-guides-title">
                      {t(`Nos guides sur ${tool.name}`, `Our guides on ${tool.name}`)}
                    </h2>
                    <ul className="td-guides-list">
                      {relatedGuides.slice(0, 3).map((guide) => (
                        <li key={guide.slug}>
                          <Link to={`${prefix}/guide/${guide.slug}`} className="td-guides-link">
                            <span className="td-guides-link-title">{guide.title}</span>
                            {guide.category ? (
                              <span className="td-guides-link-meta">{guide.category}</span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            )}

            </div>

            <div className="td-sidebar-mobile td-reading-actions">
              <h2>{t("Et maintenant ?", "What’s next?")}</h2>
              <StickyDecisionCard {...cardProps} section="actions" />
            </div>
          </main>
          {/* end main content */}

          {/* ── RIGHT SIDEBAR — StickyDecisionCard ── */}
          <aside className="td-sidebar-desktop">
              <StickyDecisionCard {...cardProps} />
          </aside>

        </div>
      </div>


    </article>
  );
};

export default ToolDetailPage;
