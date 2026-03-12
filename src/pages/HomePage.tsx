import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { blogPosts } from "@/data/content";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { useEffect } from "react";
import { ArrowRight, TrendingDown, Zap, Search } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, cleanupSeo } from "@/lib/seo";

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
  const featuredTools = tools.slice(0, 6);
  const featuredPosts = blogPosts.slice(0, 3);

  // SEO
  useEffect(() => {
    const title = lang === "fr"
      ? "ToolTrim — Arrêtez de payer trop cher pour vos outils SaaS"
      : "ToolTrim — Stop overpaying for your SaaS tools";
    const desc = lang === "fr"
      ? "Tooltrim compare et recommande les meilleurs outils SaaS pour freelances et petites équipes. Optimisez votre stack, réduisez vos coûts."
      : "Tooltrim compares and recommends the best SaaS tools for freelancers and small teams. Optimize your stack, reduce costs.";
    const url = `https://tooltrim.com/${lang}`;

    setSeoTags({ title, description: desc, url });

    setJsonLd("home-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ToolTrim",
      url,
      description: desc,
      potentialAction: {
        "@type": "SearchAction",
        target: `${url}/tools?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    return () => cleanupSeo(["home-jsonld"]);
  }, [lang]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {t("Pour freelances & petites équipes", "For freelancers & small teams")}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-6xl">
              {t("Arrêtez de payer trop cher pour vos outils", "Stop overpaying for your tools")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t(
                "Tooltrim analyse votre stack d'outils et vous recommande les meilleurs — en éliminant les abonnements inutiles.",
                "Tooltrim analyzes your tool stack and recommends the best ones — eliminating unnecessary subscriptions."
              )}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to={`${prefix}/selector`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/85 hover:shadow-xl hover:shadow-primary/30">
                {t("Analyser ma stack gratuitement", "Analyze my stack for free")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={`${prefix}/tools`} className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-secondary">
                {t("Explorer les outils", "Explore tools")}
              </Link>
            </div>
            <div className="mt-10">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">{t("200+ outils analysés dont", "200+ tools analyzed including")}</p>
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
            { value: "200+", label: t("Outils analysés", "Tools analyzed") },
            { value: "12", label: t("Catégories", "Categories") },
            { value: "47€", label: t("Économie moyenne/mois", "Avg savings/month") },
            { value: "100%", label: t("Gratuit", "Free") },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tighter">{t("Comment ça marche", "How it works")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">{t("3 minutes pour optimiser votre stack d'outils.", "3 minutes to optimize your tool stack.")}</p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { icon: <Search className="h-6 w-6" />, title: t("1. Décrivez votre profil", "1. Describe your profile"), desc: t("Métier, taille d'équipe, objectifs et outils actuels.", "Job, team size, goals and current tools.") },
              { icon: <Zap className="h-6 w-6" />, title: t("2. Analyse personnalisée", "2. Personalized analysis"), desc: t("Notre algorithme évalue chaque outil selon votre profil.", "Our algorithm evaluates each tool based on your profile.") },
              { icon: <TrendingDown className="h-6 w-6" />, title: t("3. Économisez", "3. Save money"), desc: t("Recevez vos recommandations avec les économies estimées.", "Get your recommendations with estimated savings.") },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
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
          <h2 className="text-3xl font-bold tracking-tighter">{t("Catégories d'outils", "Tool categories")}</h2>
          <p className="mt-2 text-muted-foreground">{t("Explorez nos outils classés par usage pour trouver exactement ce qu'il vous faut.", "Browse our tools by use case to find exactly what you need.")}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              return (
                <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                  <div className="mb-2 inline-flex rounded-lg bg-accent p-2 text-accent-foreground"><Icon className="h-4 w-4" /></div>
                  <p className="font-semibold group-hover:text-primary">{t(cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), cat.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""))}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(cat.description, cat.descriptionEn)}</p>
                  <p className="mt-2 text-xs font-medium text-primary">{tools.filter((tool) => tool.categoryId === cat.id).length} {t("outils", "tools")} →</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold tracking-tighter">{t("Outils populaires", "Popular tools")}</h2>
            <Link to={`${prefix}/tools`} className="text-sm font-medium text-primary hover:underline">{t("Voir tout", "See all")} →</Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                <div className="flex items-start gap-3">
                  <ToolLogo tool={tool} size={36} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold group-hover:text-primary">{tool.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tool.defaultMonthlyPrice === 0 ? "bg-accent text-accent-foreground" : tool.pricing?.free ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {tool.defaultMonthlyPrice === 0 ? (tool.pricing?.free ? "Freemium" : t("Gratuit", "Free")) : t("Payant", "Paid")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}</p>
                    {tool.defaultMonthlyPrice > 0 && <p className="mt-2 text-xs text-muted-foreground">{t("À partir de", "From")} {tool.defaultMonthlyPrice}€/{t("mois", "mo")}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="border-t border-border bg-secondary/20 py-20">
        <div className="container">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold tracking-tighter">{t("Derniers guides", "Latest guides")}</h2>
            <Link to={`${prefix}/guides`} className="text-sm font-medium text-primary hover:underline">{t("Tous les guides", "All guides")} →</Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link key={post.slug} to={`${prefix}/guide/${post.slug}`} className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-xs text-muted-foreground">{post.date} · {post.readingTime} min</p>
                <h3 className="mt-2 font-semibold group-hover:text-primary">{t(post.title, post.titleEn || post.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(post.excerpt, post.excerptEn || post.excerpt)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-accent/50 p-10 text-center">
            <h2 className="text-2xl font-bold tracking-tighter">{t("Prêt à optimiser votre stack ?", "Ready to optimize your stack?")}</h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">{t("Répondez à quelques questions et recevez des recommandations personnalisées en 3 minutes.", "Answer a few questions and get personalized recommendations in 3 minutes.")}</p>
            <Link to={`${prefix}/selector`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/85">
              {t("Commencer l'analyse", "Start the analysis")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
