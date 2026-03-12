import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { useEffect, useMemo } from "react";
import { ArrowRight, TrendingDown, Zap, Search, Check, BarChart3, Shield } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";

const TRUSTED_LOGOS = [
  { name: "Notion", domain: "notion.so" },
  { name: "Slack", domain: "slack.com" },
  { name: "Figma", domain: "figma.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Canva", domain: "canva.com" },
  { name: "ChatGPT", domain: "openai.com" },
  { name: "Trello", domain: "trello.com" },
  { name: "Airtable", domain: "airtable.com" },
];

const HomePage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);

  const stats = useMemo(() => {
    const free = tools.filter(t => t.defaultMonthlyPrice === 0).length;
    const withFree = tools.filter(t => t.pricing?.free).length;
    return { total: tools.length, free, withFree, categories: categories.length };
  }, [tools, categories]);

  // Top tools: pick ones with most pros
  const featuredTools = useMemo(() =>
    [...tools].sort((a, b) => (b.pros?.length || 0) - (a.pros?.length || 0)).slice(0, 6),
    [tools]
  );

  const featuredPosts = posts.slice(0, 3);

  // SEO
  useEffect(() => {
    const title = lang === "fr"
      ? "ToolTrim — Arrêtez de payer trop cher pour vos outils SaaS"
      : "ToolTrim — Stop overpaying for your SaaS tools";
    const desc = lang === "fr"
      ? `Tooltrim compare ${stats.total}+ outils SaaS pour freelances et petites équipes. Optimisez votre stack, réduisez vos coûts.`
      : `Tooltrim compares ${stats.total}+ SaaS tools for freelancers and small teams. Optimize your stack, reduce costs.`;
    const url = `https://tooltrim.com/${lang}`;

    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}`);

    setJsonLd("home-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ToolTrim",
      url: "https://tooltrim.com",
      description: desc,
      potentialAction: {
        "@type": "SearchAction",
        target: `https://tooltrim.com/${lang}/tools?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    setJsonLd("home-org-jsonld", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ToolTrim",
      url: "https://tooltrim.com",
      logo: "https://tooltrim.com/favicon.ico",
      sameAs: [],
    });

    return () => cleanupSeo(["home-jsonld", "home-org-jsonld"]);
  }, [lang, stats.total]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 lg:py-28">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {t(`${stats.total}+ outils analysés`, `${stats.total}+ tools analyzed`)}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              {t("Arrêtez de payer trop cher pour vos outils", "Stop overpaying for your tools")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t(
                "Tooltrim analyse votre stack d'outils et vous recommande les meilleurs en éliminant les abonnements inutiles.",
                "Tooltrim analyzes your tool stack and recommends the best ones — eliminating unnecessary subscriptions."
              )}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to={`${prefix}/selector`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/85 hover:shadow-xl hover:shadow-primary/30">
                {t("Analyser ma stack gratuitement", "Analyze my stack for free")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={`${prefix}/tools`} className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3.5 font-semibold text-foreground transition-colors hover:bg-secondary">
                {t("Explorer les outils", "Explore tools")}
              </Link>
            </div>
            <div className="mt-12">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">{t("Ils font confiance aux outils que nous analysons", "Trusted tools we analyze")}</p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {TRUSTED_LOGOS.map((logo) => (
                  <img key={logo.domain} src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`} alt={logo.name} className="h-7 w-7 opacity-40 grayscale transition-all hover:opacity-70 hover:grayscale-0" loading="lazy" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/30 py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { value: `${stats.total}+`, label: t("Outils analysés", "Tools analyzed"), icon: <BarChart3 className="h-5 w-5 text-primary" /> },
            { value: `${stats.categories}`, label: t("Catégories", "Categories"), icon: <Search className="h-5 w-5 text-primary" /> },
            { value: `${stats.withFree}`, label: t("Avec offre gratuite", "With free plan"), icon: <Check className="h-5 w-5 text-primary" /> },
            { value: "100%", label: t("Indépendant", "Independent"), icon: <Shield className="h-5 w-5 text-primary" /> },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-2">
              {s.icon}
              <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter">{t("Comment ça marche", "How it works")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t("3 minutes pour optimiser votre stack d'outils.", "3 minutes to optimize your tool stack.")}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "01", icon: <Search className="h-6 w-6" />, title: t("Décrivez votre profil", "Describe your profile"), desc: t("Métier, taille d'équipe, objectifs et outils actuels.", "Job, team size, goals and current tools.") },
              { step: "02", icon: <Zap className="h-6 w-6" />, title: t("Analyse personnalisée", "Personalized analysis"), desc: t("Notre algorithme évalue chaque outil selon votre profil.", "Our algorithm evaluates each tool based on your profile.") },
              { step: "03", icon: <TrendingDown className="h-6 w-6" />, title: t("Économisez", "Save money"), desc: t("Recevez vos recommandations avec les économies estimées.", "Get your recommendations with estimated savings.") },
            ].map((step) => (
              <div key={step.step} className="relative rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <span className="absolute -top-3 -left-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{step.step}</span>
                <div className="mb-4 inline-flex rounded-lg bg-accent p-3 text-accent-foreground">{step.icon}</div>
                <h3 className="text-lg font-semibold tracking-tighter">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-border bg-secondary/20 py-20">
        <div className="container">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter">{t("Catégories d'outils", "Tool categories")}</h2>
              <p className="mt-2 text-muted-foreground">{t(`${stats.categories} catégories couvrant tous les besoins de votre activité.`, `${stats.categories} categories covering all your business needs.`)}</p>
            </div>
            <Link to={`${prefix}/category`} className="hidden md:inline-flex text-sm font-medium text-primary hover:underline">{t("Voir toutes →", "See all →")}</Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const count = tools.filter((tool) => tool.categoryId === cat.id).length;
              return (
                <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex rounded-lg bg-accent p-2 text-accent-foreground shrink-0"><Icon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold group-hover:text-primary truncate">{t(cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), cat.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""))}</p>
                      <p className="mt-1 text-xs text-primary font-medium">{count} {t("outils", "tools")} →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link to={`${prefix}/category`} className="mt-4 inline-flex md:hidden text-sm font-medium text-primary hover:underline">{t("Voir toutes les catégories →", "See all categories →")}</Link>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter">{t("Outils populaires", "Popular tools")}</h2>
              <p className="mt-2 text-muted-foreground">{t("Les outils les mieux notés par notre équipe.", "Top-rated tools by our team.")}</p>
            </div>
            <Link to={`${prefix}/tools`} className="text-sm font-medium text-primary hover:underline">{t("Voir tout", "See all")} →</Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => {
              const priceBadge = tool.defaultMonthlyPrice === 0
                ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
                : `${tool.defaultMonthlyPrice}€/${t("mois", "mo")}`;
              const badgeClass = tool.defaultMonthlyPrice === 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground";

              return (
                <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <ToolLogo tool={tool} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold group-hover:text-primary truncate">{tool.name}</h3>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>{priceBadge}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}</p>
                    </div>
                  </div>
                  {tool.pros?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 mt-0.5 shrink-0 text-primary" /><span className="line-clamp-1">{tool.pros[0]}</span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blog */}
      {featuredPosts.length > 0 && (
        <section className="border-t border-border bg-secondary/20 py-20">
          <div className="container">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter">{t("Derniers guides", "Latest guides")}</h2>
                <p className="mt-2 text-muted-foreground">{t("Comparatifs, tutoriels et conseils pour optimiser votre stack.", "Comparisons, tutorials and tips to optimize your stack.")}</p>
              </div>
              <Link to={`${prefix}/guides`} className="text-sm font-medium text-primary hover:underline">{t("Tous les guides", "All guides")} →</Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {featuredPosts.map((post) => (
                <Link key={post.slug} to={`${prefix}/guide/${post.slug}`} className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  {post.category && (
                    <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground mb-2">{post.category}</span>
                  )}
                  <h3 className="font-semibold group-hover:text-primary line-clamp-2">{post.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{post.date} · {post.readTime || "5 min"}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/60 to-accent/20 p-10 text-center">
            <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">{t("Prêt à optimiser votre stack ?", "Ready to optimize your stack?")}</h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">{t("Répondez à quelques questions et recevez des recommandations personnalisées en 3 minutes.", "Answer a few questions and get personalized recommendations in 3 minutes.")}</p>
            <Link to={`${prefix}/selector`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/85">
              {t("Commencer l'analyse", "Start the analysis")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
