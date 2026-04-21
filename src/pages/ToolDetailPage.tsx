import { useParams, Link, Navigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolBySlug, useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { useEffect, useState } from "react";
import { ExternalLink, Check, X, Copy, User, Users, Target, Globe, ArrowRight, AlertTriangle } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setMeta, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getCategoryIcon } from "@/lib/categoryIcons";

// Reusable tool page components
import ToolSummaryBlock from "@/components/tool/ToolSummaryBlock";
import ToolFactsCard from "@/components/tool/ToolFactsCard";
import ToolVerdictBlock from "@/components/tool/ToolVerdictBlock";
import ToolPricingSection from "@/components/tool/ToolPricingSection";
import ToolFAQSection from "@/components/tool/ToolFAQSection";
import ToolAlternativesSection from "@/components/tool/ToolAlternativesSection";
import ToolJsonLd from "@/components/tool/ToolJsonLd";

const ToolDetailPage = () => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tool, loading } = useToolBySlug(slug);
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const [copied, setCopied] = useState(false);

  // SEO meta tags
  useEffect(() => {
    if (!tool) return;
    const v5Price = tool.pricing_v5?.compare_price_monthly_eur;
    const price = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
    const hasPrice = price != null && price > 0;
    const year = new Date().getFullYear();
    const seoTitle = lang === "fr"
      ? `${tool.name} — Prix, avis et alternatives ${year} | ToolTrim`
      : `${tool.name} — Pricing, review & alternatives ${year} | ToolTrim`;
    const seoDesc = lang === "fr"
      ? (hasPrice
          ? `${tool.name} coûte ${price}€/mois. On l'a testé : voici si ça vaut le coup, et les meilleures alternatives moins chères.`
          : `On a analysé ${tool.name} de fond en comble : verdict, prix réel et alternatives testées.`)
      : (hasPrice
          ? `${tool.name} costs €${price}/mo. We tested it — here's our honest verdict and the best cheaper alternatives.`
          : `We analyzed ${tool.name} thoroughly: verdict, real pricing and tested alternatives.`);
    const canonicalUrl = `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;

    const toolDomain = tool.websiteUrl || tool.affiliateLink;
    let toolOgImage: string | undefined;
    if (toolDomain) {
      try {
        const hostname = new URL(toolDomain.startsWith("http") ? toolDomain : `https://${toolDomain}`).hostname.replace("www.", "");
        toolOgImage = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch { /* fallback */ }
    }

    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, locale: lang === "fr" ? "fr_FR" : "en_US" });
    if (toolOgImage) setMeta("og:image", toolOgImage);
    setMeta("article:modified_time", tool.pricing_v5?.verified_on || "2026-03-29");
    setHreflang(`/${lang}/tool/${tool.slug || tool.id}`);

    return () => cleanupSeo([]);
  }, [tool, lang]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: "twitter" | "linkedin") => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${tool?.name} — ${t("Avis et alternatives", "Review and alternatives")} | ToolTrim`);
    if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    if (platform === "linkedin") window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tool) {
    return <Navigate to={`${prefix}/tools`} replace />;
  }

  const category = categories.find((c: any) => c.id === tool.categoryId);
  const CategoryIcon = category ? getCategoryIcon(category.id) : null;
  const alternatives = tools
    .filter((t: any) => t.categoryId === tool.categoryId && t.id !== tool.id)
    .slice(0, 6);

  const relatedPosts = posts.filter(p => {
    const text = `${p.title} ${p.excerpt} ${p.content}`.toLowerCase();
    return text.includes(tool.name.toLowerCase());
  }).slice(0, 3);

  const v5Price = tool.pricing_v5?.compare_price_monthly_eur;
  const displayPrice = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
  const verifiedOn = tool.pricing_v5?.verified_on || "2026-03-29";
  const sourceDomain = tool.pricing_v5?.source_domain;

  return (
    <article className="min-h-screen" itemScope itemType="https://schema.org/WebPage">
      {/* JSON-LD injection (no visual output) */}
      <ToolJsonLd
        tool={tool}
        category={category}
        displayPrice={displayPrice}
        verifiedOn={verifiedOn}
        alternatives={alternatives}
        lang={lang}
      />

      {/* ── SECTION 1: Hero with H1 ── */}
      <header className="border-b border-border bg-gradient-to-br from-accent/60 via-background to-accent/30">
        <div className="container mx-auto max-w-4xl px-4 pb-8 pt-10 md:pt-14">
          <div className="mb-6">
            <Breadcrumb items={[
              { label: t("Outils", "Tools"), href: `${prefix}/tools` },
              ...(category ? [{
                label: t(category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), category.nameEn || category.name),
                href: `${prefix}/category/${category.slug}`
              }] : []),
              { label: tool.name },
            ]} />
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <ToolLogo tool={tool} size={56} className="ring-2 ring-border rounded-xl" />
              <div>
                <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl">
                  {(() => {
                    const isFreemium = displayPrice === 0 && tool.pricing?.paid;
                    const isFree = displayPrice === 0 && !tool.pricing?.paid;
                    const hasPrice = displayPrice != null && displayPrice > 0;
                    if (lang === "fr") {
                      if (hasPrice) return `${tool.name} — vaut-il vraiment ${displayPrice}€/mois ? Notre avis honnête`;
                      if (isFree || isFreemium) return `${tool.name} — le plan gratuit suffit-il vraiment ?`;
                      return `${tool.name} — payant ou pas, voici ce qu'on en pense`;
                    }
                    if (hasPrice) return `${tool.name} — is it really worth €${displayPrice}/mo? Our honest review`;
                    if (isFree || isFreemium) return `${tool.name} — is the free plan really enough?`;
                    return `${tool.name} — paid or not, here's what we think`;
                  })()}
                </h1>
                {category && (
                  <Link to={`${prefix}/category/${category.slug}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5" />}
                    {t(category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), category.nameEn || category.name)}
                  </Link>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${displayPrice === 0 ? "bg-keep/10 text-keep" : "bg-secondary text-foreground"}`}>
                    {displayPrice === 0
                      ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
                      : `${t("À partir de", "From")} ${displayPrice}€/${t("mois", "mo")}`}
                  </span>
                  <time className="text-xs text-muted-foreground" dateTime={verifiedOn}>
                    {t("Vérifié le", "Verified")} {verifiedOn}
                  </time>
                </div>
              </div>
            </div>

            {/* CTA + Share */}
            <div className="flex flex-col gap-2 shrink-0">
              <a href={tool.affiliateLink || tool.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors">
                {t("Essayer", "Try")} {tool.name} <ExternalLink className="h-4 w-4" />
              </a>
              <div className="flex items-center gap-1">
                <button onClick={handleCopyLink}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:bg-secondary transition-colors">
                  <Copy className="h-3 w-3" /> {copied ? "✓" : t("Copier", "Copy")}
                </button>
                <button onClick={() => handleShare("twitter")}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs hover:bg-secondary transition-colors">𝕏</button>
                <button onClick={() => handleShare("linkedin")}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs hover:bg-secondary transition-colors">in</button>
              </div>
            </div>
          </div>

          {/* Short description — visible in initial HTML */}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-3xl">
            {lang === "en" && tool.longDescriptionEn ? tool.longDescriptionEn : (tool.longDescription || tool.description || tool.shortDescription)}
          </p>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="container mx-auto max-w-4xl px-4 py-10">

        {/* ── SECTION 2: Summary block (machine-readable, plain HTML) ── */}
        <ToolSummaryBlock
          tool={tool}
          category={category}
          alternatives={alternatives}
          displayPrice={displayPrice}
          lang={lang}
          prefix={prefix}
          t={t}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* ── SECTION 3: Use cases ── */}
            {tool.useCases && tool.useCases.length > 0 && (
              <section>
                <h2 className="text-lg font-bold tracking-tighter">
                  {t(`À quoi sert ${tool.name} ?`, `What is ${tool.name} used for?`)}
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(lang === "en" && tool.useCasesEn ? tool.useCasesEn : tool.useCases)!.map((uc: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {uc}
                    </div>
                  ))}
                </div>
                {category && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <Link to={`${prefix}/category/${category.slug}`} className="text-primary hover:underline">
                      {t(`Découvrir tous les outils de ${category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "")}`, `Discover all ${category.nameEn || category.name} tools`)}
                    </Link>
                  </p>
                )}
              </section>
            )}

            {/* ── SECTION 4: Who is it for? ── */}
            {(tool.soloRelevance || tool.teamRelevance) && (
              <section>
                <h2 className="text-lg font-bold tracking-tighter">
                  {t(`Pour qui ${tool.name} est-il adapté ?`, `Who is ${tool.name} best for?`)}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {tool.soloRelevance && (
                    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4">
                      <User className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{t("Solo / Freelance", "Solo / Freelance")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {tool.soloRelevance === "high"
                            ? t(`${tool.name} est très pertinent pour les freelances et indépendants.`, `${tool.name} is highly relevant for freelancers and solopreneurs.`)
                            : tool.soloRelevance === "medium"
                            ? t(`${tool.name} peut être utile pour certains freelances selon leur activité.`, `${tool.name} can be useful for some freelancers depending on their activity.`)
                            : t(`${tool.name} est peu adapté à un usage solo.`, `${tool.name} is less suited for solo use.`)}
                        </p>
                      </div>
                    </div>
                  )}
                  {tool.teamRelevance && (
                    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4">
                      <Users className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{t("Équipe / Startup", "Team / Startup")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {tool.teamRelevance === "high"
                            ? t(`${tool.name} est particulièrement adapté aux équipes et startups.`, `${tool.name} is particularly well-suited for teams and startups.`)
                            : tool.teamRelevance === "medium"
                            ? t(`${tool.name} devient intéressant pour les équipes de taille moyenne.`, `${tool.name} becomes valuable for medium-sized teams.`)
                            : t(`${tool.name} est moins pertinent pour un usage en équipe.`, `${tool.name} is less relevant for team use.`)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── SECTION 5: Pros / Cons ── */}
            <section>
              <h2 className="text-lg font-bold tracking-tighter">
                {t(`Avantages et inconvénients de ${tool.name}`, `${tool.name} Pros and Cons`)}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-keep/20 bg-card p-5">
                  <h3 className="font-semibold text-keep flex items-center gap-2">
                    <Check className="h-4 w-4" /> {t("Avantages", "Pros")}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {(lang === "en" && tool.prosEn ? tool.prosEn : tool.pros)?.map((pro: string) => (
                      <li key={pro} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-keep/60" />{pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-cancel/20 bg-card p-5">
                  <h3 className="font-semibold text-cancel flex items-center gap-2">
                    <X className="h-4 w-4" /> {t("Inconvénients", "Cons")}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {(lang === "en" && tool.consEn ? tool.consEn : tool.cons)?.map((con: string) => (
                      <li key={con} className="flex items-start gap-2 text-sm">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cancel/60" />{con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ── SECTION 6: Verdict ── */}
            <ToolVerdictBlock tool={tool} lang={lang} prefix={prefix} allTools={tools} t={t} />

            {/* ── SECTION 7: Pricing ── */}
            <ToolPricingSection
              tool={tool}
              displayPrice={displayPrice}
              verifiedOn={verifiedOn}
              sourceDomain={sourceDomain}
              prefix={prefix}
              lang={lang}
              t={t}
            />
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Facts card */}
            <ToolFactsCard
              tool={tool}
              category={category}
              alternatives={alternatives}
              displayPrice={displayPrice}
              verifiedOn={verifiedOn}
              lang={lang}
              prefix={prefix}
              t={t}
            />

            {/* Related articles */}
            {relatedPosts.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold tracking-tighter">{t("Articles liés", "Related articles")}</h3>
                <div className="mt-3 space-y-2">
                  {relatedPosts.map(post => (
                    <Link key={post.slug} to={`${prefix}/guide/${post.slug}`}
                      className="block rounded-lg bg-secondary/50 p-3 text-sm hover:bg-secondary transition-colors">
                      <p className="font-medium line-clamp-2">{post.title}</p>
                      {post.readTime && <p className="mt-1 text-xs text-muted-foreground">{post.readTime}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA sidebar */}
            <div className="rounded-xl border border-border bg-card p-5">
              <a href={tool.affiliateLink || tool.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors w-full">
                <Globe className="h-4 w-4" /> {t("Voir le site", "Visit website")}
              </a>
            </div>
          </aside>
        </div>

        {/* ── SECTION 8: Alternatives (full-width) ── */}
        <div className="mt-14">
          <ToolAlternativesSection
            tool={tool}
            category={category}
            alternatives={alternatives}
            prefix={prefix}
            lang={lang}
            t={t}
          />
        </div>

        {/* ── SECTION 8b: Cluster-related tools ── */}
        {tool.substitution_cluster_v2 && (() => {
          const clusterTools = tools
            .filter((ct: any) => ct.substitution_cluster_v2 === tool.substitution_cluster_v2 && ct.id !== tool.id)
            .slice(0, 5);
          if (clusterTools.length === 0) return null;
          return (
            <div className="mt-10 border-t border-border pt-8">
              <h2 className="text-lg font-bold tracking-tighter">
                {t("Outils substituables", "Substitutable tools")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  `Ces outils couvrent les mêmes besoins que ${tool.name} et peuvent le remplacer directement.`,
                  `These tools cover the same needs as ${tool.name} and can directly replace it.`
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {clusterTools.map((ct: any) => (
                  <Link key={ct.id} to={`${prefix}/tool/${ct.slug || ct.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:border-primary/30 hover:text-primary transition-colors">
                    <ToolLogo tool={ct} size={20} />
                    {ct.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── SECTION 9: FAQ (visible in HTML, open by default for top 2) ── */}
        <div className="mt-14 border-t border-border pt-10">
          <ToolFAQSection
            tool={tool}
            displayPrice={displayPrice}
            verifiedOn={verifiedOn}
            alternatives={alternatives}
            lang={lang}
            t={t}
          />
        </div>

        {/* ── SECTION 10: Freshness footer ── */}
        <footer className="mt-10 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border pt-6">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("Dernière mise à jour :", "Last updated:")} <time dateTime={verifiedOn}>{verifiedOn}</time>
          </span>
          {sourceDomain && (
            <>
              <span>·</span>
              <span>{t("Source du prix :", "Price source:")} <a href={tool.pricing_v5?.official_source_url || `https://${sourceDomain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sourceDomain}</a></span>
            </>
          )}
          <span>·</span>
          <a href={`${prefix}/contact`} className="text-primary hover:underline">
            {t("Signaler un prix incorrect", "Report incorrect pricing")}
          </a>
          <span>·</span>
          <a href={`${prefix}/methodology`} className="text-primary hover:underline">
            {t("Notre méthodologie", "Our methodology")}
          </a>
        </footer>
      </div>
    </article>
  );
};

export default ToolDetailPage;
