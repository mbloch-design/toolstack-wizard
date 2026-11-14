import { Link } from "@/lib/routerLinks";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import type { Category } from "@/data/types";
import { getCategoryIcon } from "@/lib/categoryIcons";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Chip from "@/ds/Chip/Chip";
import { LinkArrow, linkClass } from "@/ds/Button/Button";
import { CatalogSection, CatalogTitle, Chapter, FigureCard, FigureCards, FilterBar, LinkRow, LinkRows, PlaceTile, PlaceTiles } from "@/ds/Catalog/Catalog";
import Logo from "@/ds/Logo/Logo";
import { compareByDemand } from "@/lib/catalogFilters";
import { runCatalogFilter, useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import {
  Banknote,
  Boxes,
  Clock3,
  Lightbulb,
  PiggyBank,
  RefreshCw,
  Sparkles,
  Workflow,
} from "@/lib/icons";
import stackCatalog from "@/data/stacks-catalog-index.json";

const STACKS = stackCatalog.stacks;

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
    categoryIds: ["organization", "ai-general", "communication", "email-productivity", "design-tools", "creation"],
  },
  {
    id: "replace",
    icon: RefreshCw,
    labelFr: "Remplacer un outil",
    labelEn: "Replace a tool",
    descriptionFr: "Une option plus simple ou moins chère.",
    descriptionEn: "A simpler or cheaper option.",
    categoryIds: ["finance", "automation", "nocode-web", "analytics", "storage", "email-productivity"],
  },
  {
    id: "automate",
    icon: Workflow,
    labelFr: "Automatiser une tâche",
    labelEn: "Automate a task",
    descriptionFr: "Formulaires, données, workflows.",
    descriptionEn: "Forms, data, workflows.",
    categoryIds: ["automation", "nocode-web", "analytics", "organization", "email-productivity"],
  },
  {
    id: "invoice",
    icon: Banknote,
    labelFr: "Gérer la facturation",
    labelEn: "Manage invoicing",
    descriptionFr: "Temps, factures, contrats, paiements.",
    descriptionEn: "Time, invoices, contracts, payments.",
    categoryIds: ["finance", "productivity-tracking", "legal-contracts", "budgeting-fpa"],
  },
  {
    id: "create",
    icon: Sparkles,
    labelFr: "Créer du contenu",
    labelEn: "Create content",
    descriptionFr: "Contenu, design, IA, pages web.",
    descriptionEn: "Content, design, AI, web pages.",
    categoryIds: ["creation", "design-tools", "ai-general", "nocode-web", "formation-education"],
  },
  {
    id: "structure",
    icon: Lightbulb,
    labelFr: "Structurer le travail",
    labelEn: "Structure work",
    descriptionFr: "Projets, docs, échanges, stockage.",
    descriptionEn: "Projects, docs, communication, storage.",
    categoryIds: ["organization", "project-management", "communication", "communication-team", "storage", "security"],
  },
];

const CATEGORY_GROUPS = [
  {
    titleFr: "Piloter son activité",
    titleEn: "Run the business",
    descriptionFr: "Temps, facturation, projets, contrats et pilotage financier.",
    descriptionEn: "Time, invoicing, projects, contracts, and financial control.",
    categoryIds: ["organization", "project-management", "crm", "finance", "productivity-tracking", "legal-contracts", "budgeting-fpa"],
  },
  {
    titleFr: "Créer et vendre",
    titleEn: "Create and sell",
    descriptionFr: "Contenus, design, IA, email et pages web qui soutiennent l'acquisition.",
    descriptionEn: "Content, design, AI, email, and web pages that support acquisition.",
    categoryIds: ["creation", "design-tools", "prototyping", "ui-components", "ai-general", "email-productivity", "nocode-web", "formation-education"],
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
  },
  {
    slug: "agence-marketing",
    labelFr: "Agence marketing",
    labelEn: "Marketing agency",
    titleFr: "Produire, piloter et reporter sans dispersion",
    titleEn: "Produce, manage, and report without dispersion",
    descriptionFr: "Une stack pour briefs, contenus, campagnes et reporting.",
    descriptionEn: "A stack for briefs, content, campaigns, and reporting.",
  },
  {
    slug: "solopreneur",
    labelFr: "Solopreneur",
    labelEn: "Solopreneur",
    titleFr: "Vendre seul sans construire une usine",
    titleEn: "Sell alone without building a machine",
    descriptionFr: "Offre, contenu, demandes et paiement avec peu d'abonnements.",
    descriptionEn: "Offer, content, requests, and payment with few subscriptions.",
  },
  {
    slug: "ecommerce",
    labelFr: "E-commerce",
    labelEn: "E-commerce",
    titleFr: "Vendre et fidéliser sans empiler les apps",
    titleEn: "Sell and retain without stacking apps",
    descriptionFr: "Boutique, email, support et analytics sans perdre la marge.",
    descriptionEn: "Store, email, support, and analytics without losing margin.",
  },
  {
    slug: "startup-saas",
    labelFr: "Startup SaaS",
    labelEn: "SaaS startup",
    titleFr: "Construire, mesurer et vendre sans suréquiper",
    titleEn: "Build, measure, and sell without over-tooling",
    descriptionFr: "Produit, code, tracking, support et vente pour early-stage.",
    descriptionEn: "Product, code, tracking, support, and sales for early-stage.",
  },
];

function cleanCategoryName(name: string) {
  return name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
}

const CategoriesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
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
      .filter((cat): cat is Category => Boolean(cat));
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

  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();
  const toolsLabel = (count: number) => t(`${count} outils`, `${count} tools`);
  const categoryRow = (cat: Category) => {
    const Icon = getCategoryIcon(cat.id);
    const name = cleanCategoryName(cat.name);
    return <LinkRow key={cat.id} name={t(name, cat.nameEn || name)} icon={<Icon />}
      detail={cat.description ? t(cat.description, cat.descriptionEn || cat.description) : undefined}
      note={toolsLabel(categoryStats.get(cat.id)?.count || 0)}
      renderLink={(className, content) => <Link to={`${prefix}/category/${cat.slug}`} className={className}>{content}</Link>} />;
  };

  // The strongest tools of a category, as faces on its tile.
  const facesOf = (catId: string) => tools.filter((tool) => tool.categoryId === catId).sort(compareByDemand).slice(0, 4)
    .map((tool) => <Logo key={tool.id} tool={tool} size={24} />);

  // The catalogue's language (12/11/2026): title and figure, the needs as the filter bar, then sections of rows.
  return (
    <Page>
      <Breadcrumb items={[{ label: t("Outils", "Tools") as string, href: `${prefix}/tools` }, { label: t("Catégories", "Categories") as string }]} includeSchema={false} />
      <CatalogTitle title={t("Catégories", "Categories") as string} count={categories.length} countLabel={t("catégories", "categories") as string}
        lead={t(`${tools.length} outils SaaS à comparer, rangés par usage. Partez d'un besoin.`, `${tools.length} SaaS tools to compare, sorted by use. Start from a need.`) as string}
        sentinelRef={toolbarSentinelRef} />

      <FilterBar stuck={toolbarStuck} railLabel={t("Besoins", "Needs") as string}
        prevLabel={t("Besoins précédents", "Previous needs") as string} nextLabel={t("Besoins suivants", "Next needs") as string}
        rail={INTENTS.map((intent) => <Chip key={intent.id} pressed={activeIntent === intent.id}
          onClick={() => { if (activeIntent !== intent.id) void runCatalogFilter(() => setActiveIntent(intent.id)); }}>{t(intent.labelFr, intent.labelEn)}</Chip>)} />

      {/* The strong moment: the need's categories as large tiles. */}
      <CatalogSection id="cats-need" title={t(activeIntentConfig.descriptionFr, activeIntentConfig.descriptionEn).replace(/\.$/, "")} count={priorityCategories.length}>
        <PlaceTiles label={t(activeIntentConfig.labelFr, activeIntentConfig.labelEn) as string}>{priorityCategories.map((cat) => {
          const Icon = getCategoryIcon(cat.id);
          const name = cleanCategoryName(cat.name);
          return <PlaceTile key={cat.id} icon={<Icon />} name={t(name, cat.nameEn || name)} faces={facesOf(cat.id)}
            detail={cat.description ? t(cat.description, cat.descriptionEn || cat.description) : undefined}
            note={toolsLabel(categoryStats.get(cat.id)?.count || 0)}
            renderLink={(className, content) => <Link to={`${prefix}/category/${cat.slug}`} className={className}>{content}</Link>} />;
        })}</PlaceTiles>
      </CatalogSection>

      <CatalogSection id="cats-stacks" title={t("Partir d'une situation réelle", "Start from a real situation")}
        action={<Link to={`${prefix}/stacks`} className={linkClass()}>{t("Toutes les stacks types", "All stack templates")}<LinkArrow /></Link>}>
        <FigureCards label={t("Stacks types", "Stack templates") as string}>{featuredStacks.slice(0, 4).map((template) => {
          const stack = template.stack!;
          return <FigureCard key={template.slug} figure={t(`${stack.monthlyBudget} €`, `€${stack.monthlyBudget}`)} unit={t("/mois", "/mo")}
            name={t(template.labelFr, template.labelEn)} detail={t(template.titleFr, template.titleEn)}
            renderLink={(className, content) => <Link to={`${prefix}/stacks/${template.slug}`} className={className}>{content}</Link>} />;
        })}</FigureCards>
      </CatalogSection>

      {CATEGORY_GROUPS.map((group, index) => {
        const groupCategories = group.categoryIds
          .map((id) => categories.find((cat) => cat.id === id))
          .filter((cat): cat is Category => Boolean(cat));
        if (groupCategories.length === 0) return null;
        return <Chapter key={group.titleFr} id={`cats-group-${index}`} title={t(group.titleFr, group.titleEn)} count={groupCategories.length}
          detail={t(group.descriptionFr, group.descriptionEn)}>
          <LinkRows>{groupCategories.map(categoryRow)}</LinkRows>
        </Chapter>;
      })}
    </Page>
  );
};

export default CategoriesIndexPage;
