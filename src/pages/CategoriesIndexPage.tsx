import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import EditorialHero from "@/components/EditorialHero";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import {
  ArrowRight,
  Banknote,
  Bot,
  Boxes,
  Clock3,
  Lightbulb,
  PiggyBank,
  RefreshCw,
  Sparkles,
  Workflow,
} from "lucide-react";
import { STACKS } from "@/data/stacks";

const PRIORITY_CATEGORY_IDS = [
  "organization",
  "finance",
  "ai-general",
  "automation",
  "nocode-web",
  "creation",
  "design-tools",
  "email-productivity",
];

const INTENTS = [
  {
    id: "save-money",
    icon: PiggyBank,
    labelFr: "Réduire les coûts",
    labelEn: "Reduce costs",
    descriptionFr: "Doublons, plans inutiles, alternatives gratuites.",
    descriptionEn: "Duplicates, unused plans, free alternatives.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=86",
    categoryIds: ["organization", "ai-general", "communication", "email-productivity", "design-tools", "creation"],
  },
  {
    id: "replace",
    icon: RefreshCw,
    labelFr: "Remplacer un outil",
    labelEn: "Replace a tool",
    descriptionFr: "Une option plus simple ou moins chère.",
    descriptionEn: "A simpler or cheaper option.",
    image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=86",
    categoryIds: ["finance", "automation", "nocode-web", "analytics", "storage", "email-productivity"],
  },
  {
    id: "automate",
    icon: Workflow,
    labelFr: "Automatiser une tâche",
    labelEn: "Automate a task",
    descriptionFr: "Formulaires, données, workflows.",
    descriptionEn: "Forms, data, workflows.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=86",
    categoryIds: ["automation", "nocode-web", "analytics", "organization", "email-productivity"],
  },
  {
    id: "invoice",
    icon: Banknote,
    labelFr: "Gérer la facturation",
    labelEn: "Manage invoicing",
    descriptionFr: "Temps, factures, contrats, paiements.",
    descriptionEn: "Time, invoices, contracts, payments.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=86",
    categoryIds: ["finance", "productivity-tracking", "legal-contracts", "budgeting-fpa"],
  },
  {
    id: "create",
    icon: Sparkles,
    labelFr: "Créer du contenu",
    labelEn: "Create content",
    descriptionFr: "Contenu, design, IA, pages web.",
    descriptionEn: "Content, design, AI, web pages.",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=86",
    categoryIds: ["creation", "design-tools", "ai-general", "nocode-web", "formation-education"],
  },
  {
    id: "structure",
    icon: Lightbulb,
    labelFr: "Structurer le travail",
    labelEn: "Structure work",
    descriptionFr: "Projets, docs, échanges, stockage.",
    descriptionEn: "Projects, docs, communication, storage.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=86",
    categoryIds: ["organization", "project-management", "communication", "communication-team", "storage", "security"],
  },
];

const CATEGORY_GROUPS = [
  {
    titleFr: "Piloter son activité",
    titleEn: "Run the business",
    descriptionFr: "Temps, facturation, projets, contrats et pilotage financier.",
    descriptionEn: "Time, invoicing, projects, contracts, and financial control.",
    categoryIds: ["organization", "project-management", "finance", "productivity-tracking", "legal-contracts", "budgeting-fpa"],
  },
  {
    titleFr: "Créer et vendre",
    titleEn: "Create and sell",
    descriptionFr: "Contenus, design, IA, email et pages web qui soutiennent l'acquisition.",
    descriptionEn: "Content, design, AI, email, and web pages that support acquisition.",
    categoryIds: ["creation", "design-tools", "ai-general", "email-productivity", "nocode-web", "formation-education"],
  },
  {
    titleFr: "Collaborer et automatiser",
    titleEn: "Collaborate and automate",
    descriptionFr: "Communication, workflows, analytics et stockage pour fluidifier l'exécution.",
    descriptionEn: "Communication, workflows, analytics, and storage for smoother execution.",
    categoryIds: ["communication", "communication-team", "automation", "analytics", "storage"],
  },
  {
    titleFr: "Sécuriser l'entreprise",
    titleEn: "Secure the company",
    descriptionFr: "Outils plus structurels pour équipes, risques fournisseurs, paie et ERP.",
    descriptionEn: "More structural tools for teams, vendor risk, payroll, and ERP.",
    categoryIds: ["security", "vendor-risk-data", "hris-payroll", "erp"],
  },
];

const STACK_TEMPLATES = [
  {
    slug: "freelance",
    labelFr: "Freelance",
    labelEn: "Freelance",
    titleFr: "Vendre, livrer et encaisser sans outil inutile",
    titleEn: "Sell, deliver, and get paid without useless tools",
    descriptionFr: "Le socle clair pour gérer clients, livrables et paiement.",
    descriptionEn: "A clear baseline for clients, deliverables, and payment.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "agence-marketing",
    labelFr: "Agence marketing",
    labelEn: "Marketing agency",
    titleFr: "Produire, piloter et reporter sans dispersion",
    titleEn: "Produce, manage, and report without dispersion",
    descriptionFr: "Une stack pour briefs, contenus, campagnes et reporting.",
    descriptionEn: "A stack for briefs, content, campaigns, and reporting.",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "solopreneur",
    labelFr: "Solopreneur",
    labelEn: "Solopreneur",
    titleFr: "Vendre seul sans construire une usine",
    titleEn: "Sell alone without building a machine",
    descriptionFr: "Offre, contenu, demandes et paiement avec peu d'abonnements.",
    descriptionEn: "Offer, content, requests, and payment with few subscriptions.",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "ecommerce",
    labelFr: "E-commerce",
    labelEn: "E-commerce",
    titleFr: "Vendre et fidéliser sans empiler les apps",
    titleEn: "Sell and retain without stacking apps",
    descriptionFr: "Boutique, email, support et analytics sans perdre la marge.",
    descriptionEn: "Store, email, support, and analytics without losing margin.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "startup-saas",
    labelFr: "Startup SaaS",
    labelEn: "SaaS startup",
    titleFr: "Construire, mesurer et vendre sans suréquiper",
    titleEn: "Build, measure, and sell without over-tooling",
    descriptionFr: "Produit, code, tracking, support et vente pour early-stage.",
    descriptionEn: "Product, code, tracking, support, and sales for early-stage.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85",
  },
];

function cleanCategoryName(name: string) {
  return name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="font-display font-semibold text-foreground"
      style={{
        fontSize: "clamp(1.875rem, 3vw, 2.5rem)",
        letterSpacing: "-0.025em",
        lineHeight: 1.1,
      }}
    >
      {children}
    </h2>
  );
}

const CategoriesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [activeIntent, setActiveIntent] = useState(INTENTS[0].id);

  const categoryStats = useMemo(() => {
    return new Map(categories.map((cat) => {
      const catTools = tools.filter((tool) => tool.categoryId === cat.id);
      return [cat.id, {
        count: catTools.length,
        freeCount: catTools.filter((tool) => tool.defaultMonthlyPrice === 0 || tool.pricing?.free).length,
        paidCount: catTools.filter((tool) => tool.defaultMonthlyPrice > 0).length,
      }];
    }));
  }, [categories, tools]);

  const activeIntentConfig = INTENTS.find((intent) => intent.id === activeIntent) || INTENTS[0];

  const priorityCategories = useMemo(() => {
    const ids = activeIntentConfig.categoryIds.length > 0
      ? activeIntentConfig.categoryIds
      : PRIORITY_CATEGORY_IDS;

    return ids
      .map((id) => categories.find((cat) => cat.id === id))
      .filter(Boolean);
  }, [activeIntentConfig, categories]);

  const featuredStacks = useMemo(() => {
    return STACK_TEMPLATES.map((template) => ({
      ...template,
      stack: STACKS.find((stack) => stack.slug === template.slug),
    })).filter((template) => template.stack);
  }, []);

  useEffect(() => {
    const title = lang === "fr"
      ? `${categories.length} catégories d'outils SaaS — ToolTrim`
      : `${categories.length} SaaS tool categories — ToolTrim`;
    const desc = lang === "fr"
      ? `Explorez ${categories.length} catégories d'outils SaaS : IA, gestion de projet, communication, design et plus. Trouvez les meilleurs outils par usage.`
      : `Explore ${categories.length} SaaS tool categories: AI, project management, communication, design and more. Find the best tools by use case.`;
    const url = `https://tooltrim.com/${lang}/category`;

    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}/category`);
    setJsonLd("cats-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
    });
    return () => cleanupSeo(["cats-jsonld"]);
  }, [lang, categories.length]);

  return (
    <div className="min-h-screen">
      <EditorialHero
        breadcrumb={[
          { label: t("Outils", "Tools"), href: `${prefix}/tools` },
          { label: t("Catégories", "Categories") },
        ]}
        eyebrow={t("Catégories", "Categories")}
        title={
          <>
            {t("Explorer les outils", "Explore tools")}<br />
            {t("par usage.", "by use case.")}
          </>
        }
        description={t(
          `${categories.length} catégories pour comparer ${tools.length}+ outils SaaS par besoin.`,
          `${categories.length} categories to compare ${tools.length}+ SaaS tools by need.`
        )}
        primaryCta={{ label: t("Tous les outils", "All tools"), href: `${prefix}/tools` }}
        secondaryCta={{ label: t("Voir les stacks", "See stacks"), href: `${prefix}/stacks` }}
        meta={[
          { label: t("CATÉGORIES", "CATEGORIES"), value: categories.length },
          { label: t("OUTILS", "TOOLS"), value: `${tools.length}+` },
        ]}
      />

      <section className="border-b border-border bg-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <p className="label-section">{t("Par besoin", "By need")}</p>
            <p className="max-w-xl text-sm text-muted-foreground md:text-right">
              {t("Choisis un point de départ.", "Choose a starting point.")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {INTENTS.map((intent) => {
              const Icon = intent.icon;
              const isActive = activeIntent === intent.id;

              return (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => setActiveIntent(intent.id)}
                  className={`group flex min-h-[20rem] flex-col rounded-lg p-3 text-left transition-colors duration-200 ${
                    isActive
                      ? "bg-secondary"
                      : "bg-secondary/70 hover:bg-secondary"
                  }`}
                >
                  <div className="relative overflow-hidden rounded-md bg-background">
                    <img
                      src={intent.image}
                      alt={t(intent.labelFr, intent.labelEn)}
                      className="aspect-[1.45/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      loading="lazy"
                    />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      {isActive ? t("Sélectionné", "Selected") : t("Explorer", "Explore")}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between px-1 pb-1 pt-4">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                        {t(intent.labelFr, intent.labelEn)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t(intent.descriptionFr, intent.descriptionEn)}
                      </p>
                    </div>
                    <span className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      {t("Voir la sélection", "View selection")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="label-section mb-2">{t("Stacks types", "Stack templates")}</p>
              <SectionTitle>{t("Pars d'une situation réelle", "Start from a real situation")}</SectionTitle>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t(
                  "Une catégorie aide à comparer. Une stack type aide à décider quoi garder, remplacer ou éviter selon ton profil.",
                  "A category helps you compare. A stack template helps you decide what to keep, replace, or avoid for your profile."
                )}
              </p>
            </div>
            <Link
              to={`${prefix}/stacks`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {t("Toutes les stacks types", "All stack templates")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {featuredStacks.map((template) => {
              const stack = template.stack!;
              return (
                <Link
                  key={template.slug}
                  to={`${prefix}/stacks/${template.slug}`}
                  className="group flex min-h-[27rem] flex-col rounded-lg bg-secondary/70 p-3 transition-colors duration-200 hover:bg-secondary"
                >
                  <div className="relative overflow-hidden rounded-md bg-background">
                    <img
                      src={template.image}
                      alt={t(template.labelFr, template.labelEn)}
                      className="aspect-[1.2/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      loading="lazy"
                    />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                      <Boxes className="h-3.5 w-3.5 text-primary" />
                      {t(template.labelFr, template.labelEn)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between px-1 pb-1 pt-5">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                        {t(template.titleFr, template.titleEn)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t(template.descriptionFr, template.descriptionEn)}
                      </p>
                    </div>
                    <div className="mt-5 border-t border-border/70 pt-4">
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                        <span>
                          <span className="num-mono text-foreground">{stack.monthlyBudget}€</span>/{t("mois", "mo")}
                        </span>
                        <span>
                          {t("jusqu'à", "up to")} <span className="num-mono text-primary">{stack.savings}€</span> {t("à revoir", "to review")}
                        </span>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        {t("Voir la stack", "View stack")}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="label-section mb-2">{t("Recommandé", "Recommended")}</p>
              <SectionTitle>{t("À regarder d'abord", "Check first")}</SectionTitle>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {priorityCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                prefix={prefix}
                t={t}
                stats={categoryStats.get(cat.id)}
                featured
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8">
            <p className="label-section mb-2">{t("Bibliothèque", "Library")}</p>
            <SectionTitle>{t("Toutes les catégories par usage", "All categories by use case")}</SectionTitle>
          </div>

          <div className="space-y-10">
            {CATEGORY_GROUPS.map((group) => {
              const groupCategories = group.categoryIds
                .map((id) => categories.find((cat) => cat.id === id))
                .filter(Boolean);

              if (groupCategories.length === 0) return null;

              return (
                <div key={group.titleFr}>
                  <div className="mb-4 flex flex-col justify-between gap-2 border-b border-border pb-3 md:flex-row md:items-end">
                    <div>
                      <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
                        {t(group.titleFr, group.titleEn)}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(group.descriptionFr, group.descriptionEn)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {groupCategories.length} {t("catégories", "categories")}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {groupCategories.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        cat={cat}
                        prefix={prefix}
                        t={t}
                        stats={categoryStats.get(cat.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
          <div>
            <p className="label-section mb-2">{t("Tu hésites ?", "Not sure?")}</p>
            <h2
              className="font-display font-semibold text-foreground"
              style={{
                fontSize: "clamp(1.5rem, 2.4vw, 2rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {t("Laisse le diagnostic trouver les doublons à ta place.", "Let the diagnostic find duplicates for you.")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t(
                "Sélectionne tes outils actuels : ToolTrim calcule les économies potentielles, les remplacements utiles et les abonnements à couper.",
                "Select your current tools: ToolTrim calculates potential savings, useful replacements, and subscriptions to cut."
              )}
            </p>
          </div>
          <Link to={`${prefix}/selector`} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Bot className="h-4 w-4" />
            {t("Lancer l'audit", "Start audit")}
          </Link>
        </div>
      </section>
    </div>
  );
};

function CategoryCard({
  cat,
  prefix,
  t,
  stats,
  featured = false,
}: {
  cat: ReturnType<typeof useCategories>["categories"][number];
  prefix: string;
  t: (fr: string, en?: string) => string;
  stats?: { count: number; freeCount: number; paidCount: number };
  featured?: boolean;
}) {
  const Icon = getCategoryIcon(cat.id);
  const catName = cleanCategoryName(cat.name);
  const englishName = cat.nameEn || catName;

  return (
    <Link
      to={`${prefix}/category/${cat.slug}`}
      className="group rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
              {t(catName, englishName)}
            </h3>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-50 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
          </div>
          {cat.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {t(cat.description, cat.descriptionEn)}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="font-semibold text-foreground">
              <span className="num-mono">{stats?.count || 0}</span> {t("outils", "tools")}
            </span>
            {(stats?.freeCount || 0) > 0 && (
              <span className="text-primary">
                <span className="num-mono">{stats?.freeCount}</span> {t("gratuits ou freemium", "free or freemium")}
              </span>
            )}
            {(stats?.paidCount || 0) > 0 && featured && (
              <span className="text-muted-foreground">
                <span className="num-mono">{stats?.paidCount}</span> {t("plans payants", "paid plans")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CategoriesIndexPage;
