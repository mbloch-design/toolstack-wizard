import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { categories, tools, blogPosts } from "@/data/content";
import { ArrowRight, TrendingDown, Zap, Search } from "lucide-react";

const HomePage = () => {
  const { t, prefix } = useLang();
  const featuredTools = tools.slice(0, 6);
  const featuredPosts = blogPosts.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {t("Pour freelances & petites équipes", "For freelancers & small teams")}
            </div>
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              {t(
                "Arrêtez de payer trop cher pour vos outils",
                "Stop overpaying for your tools"
              )}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              {t(
                "Tooltrim analyse votre stack d'outils et vous recommande les meilleurs — en éliminant les abonnements inutiles.",
                "Tooltrim analyzes your tool stack and recommends the best ones — eliminating unnecessary subscriptions."
              )}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to={`${prefix}/selector`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                {t("Analyser ma stack gratuitement", "Analyze my stack for free")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={`${prefix}/tools`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {t("Explorer les outils", "Explore tools")}
              </Link>
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
              <p className="font-heading text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center font-heading text-3xl font-bold">{t("Comment ça marche", "How it works")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            {t("3 minutes pour optimiser votre stack d'outils.", "3 minutes to optimize your tool stack.")}
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Search className="h-6 w-6" />,
                title: t("1. Décrivez votre profil", "1. Describe your profile"),
                desc: t("Métier, taille d'équipe, objectifs et outils actuels.", "Job, team size, goals and current tools."),
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: t("2. Analyse personnalisée", "2. Personalized analysis"),
                desc: t("Notre algorithme évalue chaque outil selon votre profil.", "Our algorithm evaluates each tool based on your profile."),
              },
              {
                icon: <TrendingDown className="h-6 w-6" />,
                title: t("3. Économisez", "3. Save money"),
                desc: t("Recevez vos recommandations avec les économies estimées.", "Get your recommendations with estimated savings."),
              },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 inline-flex rounded-lg bg-accent p-3 text-accent-foreground">
                  {step.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-border bg-secondary/20 py-20">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold">{t("Catégories d'outils", "Tool categories")}</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`${prefix}/category/${cat.slug}`}
                className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <p className="font-heading font-semibold group-hover:text-primary">{t(cat.name, cat.nameEn)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(cat.description, cat.descriptionEn)}</p>
                <p className="mt-2 text-xs text-primary">
                  {tools.filter((tool) => tool.categoryId === cat.id).length} {t("outils", "tools")} →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-3xl font-bold">{t("Outils populaires", "Popular tools")}</h2>
            <Link to={`${prefix}/tools`} className="text-sm text-primary hover:underline">
              {t("Voir tout", "See all")} →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <Link
                key={tool.id}
                to={`${prefix}/tool/${tool.slug}`}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.logo}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold group-hover:text-primary">{tool.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tool.pricing === "free" ? "bg-accent text-accent-foreground" :
                        tool.pricing === "freemium" ? "bg-secondary text-secondary-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {tool.pricing}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}</p>
                    {tool.defaultMonthlyPrice > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">{t("À partir de", "From")} {tool.defaultMonthlyPrice}€/{t("mois", "mo")}</p>
                    )}
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
            <h2 className="font-heading text-3xl font-bold">{t("Derniers guides", "Latest guides")}</h2>
            <Link to={`${prefix}/guides`} className="text-sm text-primary hover:underline">
              {t("Tous les guides", "All guides")} →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link
                key={post.slug}
                to={`${prefix}/guide/${post.slug}`}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
              >
                <p className="text-xs text-muted-foreground">{post.date} · {post.readingTime} min</p>
                <h3 className="mt-2 font-heading font-semibold group-hover:text-primary">{t(post.title, post.titleEn || post.title)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(post.excerpt, post.excerptEn || post.excerpt)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-accent/50 p-10 text-center">
            <h2 className="font-heading text-2xl font-bold">
              {t("Prêt à optimiser votre stack ?", "Ready to optimize your stack?")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              {t(
                "Répondez à quelques questions et recevez des recommandations personnalisées en 3 minutes.",
                "Answer a few questions and get personalized recommendations in 3 minutes."
              )}
            </p>
            <Link
              to={`${prefix}/selector`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              {t("Commencer l'analyse", "Start the analysis")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
