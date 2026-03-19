import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolBySlug, useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { useEffect, useState } from "react";
import { ExternalLink, Check, X, Copy, Share2, Users, User, Target, Globe, ArrowRight, AlertTriangle } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getCategoryIcon } from "@/lib/categoryIcons";

const ToolDetailPage = () => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tool, loading } = useToolBySlug(slug);
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const [copied, setCopied] = useState(false);

  // SEO
  useEffect(() => {
    if (!tool) return;
    const v5Price = tool.pricing_v5?.compare_price_monthly_eur;
    const price = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
    const seoTitle = lang === "fr"
      ? `${tool.name} — faut-il garder cet abonnement ? | ToolTrim`
      : `${tool.name} — should you keep this subscription? | ToolTrim`;
    const seoDesc = lang === "fr"
      ? `Prix vérifié à ${price}€/mois. Alternatives, guide de migration et analyse complète.`
      : `Verified price at €${price}/month. Alternatives, migration guide and complete analysis.`;
    const canonicalUrl = `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;

    setSeoTags({ title: seoTitle, description: seoDesc, url: canonicalUrl, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/tool/${tool.slug || tool.id}`);

    // Enriched JSON-LD with Review and Offer
    const ratingValue = tool.prescription_quality === "ferme" ? 3 : 4;
    setJsonLd("tool-jsonld", {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.shortDescription || seoDesc,
      url: tool.websiteUrl || canonicalUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: String(price || 0),
        priceCurrency: "EUR",
        ...(price > 0 && {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            billingDuration: "P1M",
          },
        }),
      },
      review: {
        "@type": "Review",
        reviewBody: tool.verdict?.threshold || tool.pros?.slice(0, 3).join(". ") + "." || "",
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(ratingValue),
          bestRating: "5",
        },
        author: {
          "@type": "Organization",
          name: "ToolTrim",
          url: SEO_BASE,
        },
      },
    });

    // FAQ schema
    const faqEntries: { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[] = [];

    // Q1: price
    faqEntries.push({
      "@type": "Question",
      name: lang === "fr" ? `Combien coûte ${tool.name} ?` : `How much does ${tool.name} cost?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: lang === "fr"
          ? `${tool.name} coûte ${price}€/mois${tool.pricing_v5?.compare_plan_name ? ` (plan ${tool.pricing_v5.compare_plan_name})` : ""}. Prix vérifié le ${tool.pricing_v5?.verified_on || "2026-03-13"}${tool.pricing_v5?.source_domain ? ` sur ${tool.pricing_v5.source_domain}` : ""}.`
          : `${tool.name} costs €${price}/month${tool.pricing_v5?.compare_plan_name ? ` (${tool.pricing_v5.compare_plan_name} plan)` : ""}. Price verified on ${tool.pricing_v5?.verified_on || "2026-03-13"}${tool.pricing_v5?.source_domain ? ` on ${tool.pricing_v5.source_domain}` : ""}.`,
      },
    });

    // Q2: free alternative
    faqEntries.push({
      "@type": "Question",
      name: lang === "fr" ? `Existe-t-il une alternative gratuite à ${tool.name} ?` : `Is there a free alternative to ${tool.name}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: tool.freeAlternative
          ? (lang === "fr" ? `Oui, ${tool.freeAlternative} est une alternative gratuite.` : `Yes, ${tool.freeAlternative} is a free alternative.`)
          : (lang === "fr" ? "Pas d'alternative entièrement gratuite pour cet usage." : "No entirely free alternative for this use case."),
      },
    });

    // Q3: worth it
    if (tool.verdict?.threshold) {
      faqEntries.push({
        "@type": "Question",
        name: lang === "fr" ? `${tool.name} vaut-il le coup ?` : `Is ${tool.name} worth it?`,
        acceptedAnswer: { "@type": "Answer", text: tool.verdict.threshold },
      });
    }

    setJsonLd("tool-faq-jsonld", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntries,
    });

    return () => cleanupSeo(["tool-jsonld", "tool-faq-jsonld"]);
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
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Outil non trouvé.", "Tool not found.")}</p>
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">{t("Retour au catalogue", "Back to catalog")}</Link>
      </div>
    );
  }

  const category = categories.find((c: any) => c.id === tool.categoryId);
  const CategoryIcon = category ? getCategoryIcon(category.id) : null;
  const alternatives = tools
    .filter((t: any) => t.categoryId === tool.categoryId && t.id !== tool.id)
    .slice(0, 6);

  // Related articles
  const relatedPosts = posts.filter(p => {
    const text = `${p.title} ${p.excerpt} ${p.content}`.toLowerCase();
    return text.includes(tool.name.toLowerCase());
  }).slice(0, 3);

  const v5Price = tool.pricing_v5?.compare_price_monthly_eur;
  const displayPrice = v5Price != null && v5Price > 0 ? v5Price : tool.defaultMonthlyPrice;
  const verifiedOn = tool.pricing_v5?.verified_on || "2026-03-13";
  const sourceDomain = tool.pricing_v5?.source_domain;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-accent/60 via-background to-accent/30">
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
                <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl">{tool.name}</h1>
                {category && (
                  <Link to={`${prefix}/category/${category.slug}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5" />}
                    {t(category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), category.nameEn || category.name)}
                  </Link>
                )}
                {/* Price badge */}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${displayPrice === 0 ? "bg-keep/10 text-keep" : "bg-secondary text-foreground"}`}>
                    {displayPrice === 0
                      ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
                      : `${t("À partir de", "From")} ${displayPrice}€/${t("mois", "mo")}`}
                  </span>
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

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-3xl">
            {tool.longDescription || tool.description || tool.shortDescription}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* En une phrase — LLM citable */}
            <div className="rounded-xl border border-border bg-secondary/30 p-5">
              <h2 className="text-lg font-bold tracking-tighter">{t("En une phrase", "In one sentence")}</h2>
              <p className="mt-2 text-sm leading-relaxed">
                {tool.name} {t("coûte", "costs")} {displayPrice === 0 ? t("0€ (gratuit)", "€0 (free)") : `${displayPrice}€/${t("mois", "mo")}`}.{" "}
                {tool.verdict?.threshold || tool.shortDescription}
              </p>
            </div>

            {/* Verdict */}
            <div className="rounded-xl border border-primary/20 bg-accent/30 p-6">
              <h2 className="text-lg font-bold tracking-tighter">{t("Faut-il garder cet abonnement ?", "Should you keep this subscription?")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm font-semibold text-keep">✓ {t("Gardez si", "Keep if")}</span>
                  <ul className="mt-2 space-y-1.5">
                    {(Array.isArray(tool.verdict?.keepIf) ? tool.verdict.keepIf : [tool.verdict?.keepIf]).filter(Boolean).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-keep" />{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-sm font-semibold text-cancel">✗ {t("Évitez si", "Avoid if")}</span>
                  <ul className="mt-2 space-y-1.5">
                    {(Array.isArray(tool.verdict?.avoidIf) ? tool.verdict.avoidIf : [tool.verdict?.avoidIf]).filter(Boolean).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><X className="mt-0.5 h-4 w-4 shrink-0 text-cancel" />{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {tool.verdict?.threshold && (
                <p className="mt-4 text-sm border-t border-border/50 pt-3">
                  <span className="font-semibold">📊 {t("Seuil", "Threshold")} :</span> {tool.verdict.threshold}
                </p>
              )}
            </div>

            {/* Ce que dit ToolTrim — prescription section */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold tracking-tighter">{t("Ce que dit ToolTrim", "What ToolTrim says")}</h2>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {tool.prescription_quality === "ferme" && tool.prescription_output ? (
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      {t("Notre recommandation :", "Our recommendation:")} {tool.prescription_output.action === "replace-cheaper" || tool.prescription_output.action === "replace-better"
                        ? t(`remplacer par ${tool.prescription_output.replacement_tool}`, `replace with ${tool.prescription_output.replacement_tool}`)
                        : tool.prescription_output.action === "cancel"
                        ? t("résilier cet abonnement", "cancel this subscription")
                        : tool.prescription_output.mode}
                    </p>
                    {tool.prescription_output.gain_monthly_eur > 0 && (
                      <p className="text-keep font-medium">
                        {t("Économie", "Savings")}: +{tool.prescription_output.gain_monthly_eur}€/{t("mois", "mo")} · {t("Prix vérifiés le", "Prices verified on")} {tool.prescription_output.verified_on || verifiedOn}
                      </p>
                    )}
                  </div>
                ) : tool.prescription_quality === "question" && tool.prescription_context_questions?.length ? (
                  <div className="space-y-2">
                    <p>{t("Ça dépend de votre usage.", "It depends on your usage.")}</p>
                    <p className="italic">{tool.prescription_context_questions[0]}</p>
                  </div>
                ) : (
                  <p>{t("Outil de production central — non substituable. À conserver.", "Core production tool — not substitutable. Keep it.")}</p>
                )}
              </div>
            </div>

            {/* Pros/Cons */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-keep/20 bg-card p-5">
                <h3 className="font-semibold text-keep flex items-center gap-2">
                  <Check className="h-4 w-4" /> {t("Avantages", "Pros")}
                </h3>
                <ul className="mt-3 space-y-2">
                  {tool.pros?.map((pro: string) => (
                    <li key={pro} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-keep/60" />{pro}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-cancel/20 bg-card p-5">
                <h3 className="font-semibold text-cancel flex items-center gap-2">
                  <X className="h-4 w-4" /> {t("Inconvénients", "Cons")}
                </h3>
                <ul className="mt-3 space-y-2">
                  {tool.cons?.map((con: string) => (
                    <li key={con} className="flex items-start gap-2 text-sm"><X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cancel/60" />{con}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Use cases */}
            {tool.useCases && tool.useCases.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-bold tracking-tighter flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> {t("Cas d'usage", "Use cases")}
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {tool.useCases.map((uc: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {uc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Solo vs Team */}
            {(tool.soloRelevance || tool.teamRelevance) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-bold tracking-tighter">{t("Pour qui ?", "Who is it for?")}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {tool.soloRelevance && (
                    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4">
                      <User className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{t("Solo / Freelance", "Solo / Freelance")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{tool.soloRelevance}</p>
                      </div>
                    </div>
                  )}
                  {tool.teamRelevance && (
                    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4">
                      <Users className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{t("Équipe / Startup", "Team / Startup")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{tool.teamRelevance}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Pricing card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold tracking-tighter">{t("Tarification", "Pricing")}</h3>
              <div className="mt-3 space-y-2 text-sm">
                {tool.pricing?.free && (
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-keep" />
                    <div><span className="font-medium">{t("Gratuit", "Free")}</span><p className="text-muted-foreground">{tool.pricing.free}</p></div>
                  </div>
                )}
                {tool.pricing?.paid && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-base">💳</span>
                    <div><span className="font-medium">{t("Payant", "Paid")}</span><p className="text-muted-foreground">{tool.pricing.paid}</p></div>
                  </div>
                )}
                {displayPrice > 0 && (
                  <p className="pt-2 border-t border-border/50 text-muted-foreground">
                    {t("À partir de", "From")} <strong className="text-foreground">{displayPrice}€/{t("mois", "mo")}</strong>
                  </p>
                )}
              </div>
              <a href={tool.affiliateLink || tool.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors w-full">
                <Globe className="h-4 w-4" /> {t("Voir le site", "Visit website")}
              </a>
            </div>

            {/* Quick facts */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold tracking-tighter">{t("En bref", "Quick facts")}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("Catégorie", "Category")}</dt>
                  <dd className="font-medium">{category ? t(category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), category.nameEn || category.name) : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("Offre gratuite", "Free plan")}</dt>
                  <dd className="font-medium">{tool.pricing?.free ? t("Oui", "Yes") : t("Non", "No")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("Avantages", "Pros")}</dt>
                  <dd className="font-medium text-keep">{tool.pros?.length || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("Inconvénients", "Cons")}</dt>
                  <dd className="font-medium text-cancel">{tool.cons?.length || 0}</dd>
                </div>
                {tool.alternatives && tool.alternatives.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("Alternatives", "Alternatives")}</dt>
                    <dd className="font-medium">{alternatives.length}</dd>
                  </div>
                )}
              </dl>
            </div>

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
          </div>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="mt-14 border-t border-border pt-10">
            <h2 className="text-xl font-bold tracking-tighter">
              {t(`Alternatives à ${tool.name}`, `Alternatives to ${tool.name}`)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                `${alternatives.length} outils similaires dans la catégorie ${category?.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || ""}`,
                `${alternatives.length} similar tools in the ${category?.nameEn || category?.name || ""} category`
              )}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {alternatives.map((alt) => (
                <Link key={alt.id} to={`${prefix}/tool/${alt.slug}`}
                  className="group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <ToolLogo tool={alt} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold group-hover:text-primary truncate">{alt.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {alt.defaultMonthlyPrice > 0 ? `${alt.defaultMonthlyPrice}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{alt.shortDescription}</p>
                  {alt.pros?.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-keep">
                      <Check className="h-3 w-3" /> {alt.pros[0]}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ section (visible for SEO) */}
        <div className="mt-14 border-t border-border pt-10">
          <h2 className="text-xl font-bold tracking-tighter">{t("Questions fréquentes", "FAQ")}</h2>
          <div className="mt-6 space-y-4">
            <details className="group rounded-xl border border-border bg-card p-5">
              <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                {lang === "fr" ? `Combien coûte ${tool.name} ?` : `How much does ${tool.name} cost?`}
                <ChevronIcon />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(
                  `${tool.name} coûte ${displayPrice}€/mois${tool.pricing_v5?.compare_plan_name ? ` (plan ${tool.pricing_v5.compare_plan_name})` : ""}. Prix vérifié le ${verifiedOn}${sourceDomain ? ` sur ${sourceDomain}` : ""}.`,
                  `${tool.name} costs €${displayPrice}/month${tool.pricing_v5?.compare_plan_name ? ` (${tool.pricing_v5.compare_plan_name} plan)` : ""}. Price verified on ${verifiedOn}${sourceDomain ? ` on ${sourceDomain}` : ""}.`
                )}
              </p>
            </details>
            <details className="group rounded-xl border border-border bg-card p-5">
              <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                {lang === "fr" ? `Existe-t-il une alternative gratuite à ${tool.name} ?` : `Is there a free alternative to ${tool.name}?`}
                <ChevronIcon />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                {tool.freeAlternative
                  ? t(`Oui, ${tool.freeAlternative} est une alternative gratuite.`, `Yes, ${tool.freeAlternative} is a free alternative.`)
                  : alternatives.some(a => a.defaultMonthlyPrice === 0)
                  ? t(
                      `Parmi les alternatives gratuites : ${alternatives.filter(a => a.defaultMonthlyPrice === 0).slice(0, 3).map(a => a.name).join(", ")}.`,
                      `Free alternatives include: ${alternatives.filter(a => a.defaultMonthlyPrice === 0).slice(0, 3).map(a => a.name).join(", ")}.`
                    )
                  : t("Pas d'alternative entièrement gratuite référencée pour cet usage.", "No entirely free alternative listed for this use case.")}
              </p>
            </details>
            {tool.verdict?.threshold && (
              <details className="group rounded-xl border border-border bg-card p-5">
                <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                  {lang === "fr" ? `${tool.name} vaut-il le coup ?` : `Is ${tool.name} worth it?`}
                  <ChevronIcon />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  {tool.verdict.threshold}
                </p>
              </details>
            )}
          </div>
        </div>

        {/* Pricing trust footer — E-E-A-T signal */}
        <div className="mt-10 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border pt-6">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("Prix vérifié le", "Price verified on")} {verifiedOn}
            {sourceDomain && (
              <> {t("sur", "on")} <a href={tool.pricing_v5?.official_source_url || `https://${sourceDomain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sourceDomain}</a></>
            )}
          </span>
          <span>·</span>
          <a href={`${prefix}/contact`} className="text-primary hover:underline">
            {t("Signaler un prix incorrect", "Report incorrect pricing")}
          </a>
        </div>
      </div>
    </div>
  );
};

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default ToolDetailPage;
