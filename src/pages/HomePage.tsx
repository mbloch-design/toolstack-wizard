import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts, type Post, type ToolSummary } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, lazy, Suspense, useRef } from "react";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Clock, Clock3, Database, Euro, Layers3, ShieldCheck, Sparkles, TrendingDown } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { useArticleTools, getArticleGradient } from "@/hooks/useArticleTools";
import { STACKS } from "@/data/stacks";

import HeroSection from "@/components/home/HeroSection";
import TickerBar from "@/components/home/TickerBar";
import StatsSection from "@/components/home/StatsSection";
import PersonasSection from "@/components/home/PersonasSection";
import FaqBlock from "@/components/FaqBlock";
import ToolLogo from "@/components/ToolLogo";

const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const DiffTable = lazy(() => import("@/components/home/DiffTable"));
const FinalCTA = lazy(() => import("@/components/home/FinalCTA"));

const FAQ_FR = [
  { q: "Comment ToolTrim analyse-t-il ma stack ?", a: "ToolTrim compare vos outils à une base d'outils vérifiés. Il détecte les doublons, les outils dormants et les remplacements possibles, avec des prix vérifiés sur les pages officielles." },
  { q: "Les recommandations sont-elles vraiment fiables ?", a: "ToolTrim ne prescrit que lorsque les données sont vérifiées. Chaque prix est issu de la page officielle de l'outil. Les recommandations incertaines sont signalées explicitement." },
  { q: "ToolTrim est-il gratuit ?", a: "Oui, l'analyse de base est entièrement gratuite." },
  { q: "Combien de temps prend l'analyse ?", a: "Moins de 3 minutes. Vous répondez à quelques questions sur votre profil, sélectionnez vos outils, et recevez instantanément vos recommandations personnalisées." },
  { q: "ToolTrim est-il affilié aux outils recommandés ?", a: "Non. ToolTrim est 100% indépendant. Aucun accord d'affiliation ne biaise les recommandations. Les résultats sont basés uniquement sur votre profil et les données objectives." },
];

const FAQ_EN = [
  { q: "How does ToolTrim analyze my stack?", a: "ToolTrim compares your tools against a database of verified tools. It detects duplicates, dormant tools, and possible replacements, with prices verified on official pages." },
  { q: "Are the recommendations really reliable?", a: "ToolTrim only prescribes when data is verified. Each price comes from the tool's official page. Uncertain recommendations are explicitly flagged." },
  { q: "Is ToolTrim free?", a: "Yes, the basic analysis is completely free." },
  { q: "How long does the analysis take?", a: "Less than 3 minutes. You answer a few questions about your profile, select your tools, and instantly receive personalized recommendations." },
  { q: "Is ToolTrim affiliated with recommended tools?", a: "No. ToolTrim is 100% independent. No affiliate deals bias the recommendations. Results are based solely on your profile and objective data." },
];

const BUSINESS_OBJECTIVES = [
  {
    slug: "developpeur-freelance-shipper",
    labelFr: "Dev freelance",
    labelEn: "Freelance dev",
    titleFr: "Livrer un site client sans payer une stack de startup",
    titleEn: "Ship a client website without paying for a startup stack",
    descriptionFr: "Code, preview, specs et paiement : 4 outils suffisent. On coupe Linear, Jira et les copilotes en double.",
    descriptionEn: "Code, preview, specs, payment: 4 tools are enough. We cut Linear, Jira and duplicate AI copilots.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "consultant-b2b-propre",
    labelFr: "Consultant B2B",
    labelEn: "B2B consultant",
    titleFr: "Suivre ses missions sans usine à CRM",
    titleEn: "Track your missions without a heavy CRM",
    descriptionFr: "Pipeline, agenda, facturation : une stack à 40 €/mois plutôt que HubSpot à 450 €. Conçue pour un solo, pas pour une équipe sales.",
    descriptionEn: "Pipeline, calendar, invoicing: a 40€/mo stack instead of HubSpot at 450€. Built for a solo, not a sales team.",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "createur-contenu-operateur",
    labelFr: "Créateur de contenu",
    labelEn: "Content creator",
    titleFr: "Publier chaque semaine sans cumuler 3 IA payantes",
    titleEn: "Publish weekly without stacking 3 paid AI tools",
    descriptionFr: "ChatGPT, Claude, Jasper, Copy.ai : tu n'en as besoin que d'un. On garde la chaîne courte, du brief jusqu'au visuel.",
    descriptionEn: "ChatGPT, Claude, Jasper, Copy.ai: you only need one. Short chain from brief to final visual.",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "ops-manager-fractional-coo",
    labelFr: "Ops / Fractional COO",
    labelEn: "Ops / Fractional COO",
    titleFr: "Structurer une boîte sans empiler ClickUp, Asana et Monday",
    titleEn: "Structure a company without piling up ClickUp, Asana and Monday",
    descriptionFr: "Un seul PM tool, une doc claire, des automatisations utiles. La stack ops pour un fractional, pas pour un siège social.",
    descriptionEn: "One PM tool, clean docs, useful automations. The ops stack for a fractional, not a HQ.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "freelance-solo-zero-bloat",
    labelFr: "Solo qui démarre",
    labelEn: "Solo starter",
    titleFr: "Vendre et encaisser avant de payer des abonnements",
    titleEn: "Sell and get paid before paying for subscriptions",
    descriptionFr: "Une page d'offre, un formulaire, un lien Stripe. Tant que ça tient, pas besoin d'acheter les outils d'une équipe.",
    descriptionEn: "An offer page, a form, a Stripe link. While it works, no need for team-grade tools.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "automatisation-legere-freelance",
    labelFr: "Automatisation light",
    labelEn: "Light automation",
    titleFr: "Automatiser ce qui se répète, pas ce qui flatte l'ego",
    titleEn: "Automate what repeats, not what flatters the ego",
    descriptionFr: "Make + Tally + Notion : 3 outils pour gagner 5 h par semaine. On évite Zapier Pro et les scénarios qu'on ne maintient jamais.",
    descriptionEn: "Make + Tally + Notion: 3 tools to save 5h per week. We skip Zapier Pro and scenarios no one maintains.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85",
  },
];

const HomePage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);

  const stats = useMemo(() => {
    const free = tools.filter(t => t.defaultMonthlyPrice === 0).length;
    const withFree = tools.filter(t => t.pricing?.free).length;
    return { total: tools.length, free, withFree, categories: categories.length };
  }, [tools, categories]);

  const featuredPosts = posts.slice(0, 3);
  const faq = lang === "fr" ? FAQ_FR : FAQ_EN;

  useEffect(() => {
    const title = lang === "fr"
      ? "ToolTrim — Audit stack SaaS, prix vérifiés"
      : "ToolTrim — SaaS Stack Audit | Real Pricing & Verified Alternatives";
    const desc = lang === "fr"
      ? `Audit gratuit de ta stack SaaS. ToolTrim détecte les doublons et trouve des alternatives moins chères. ${stats.total} outils vérifiés.`
      : `Paying for tools you don't use? ToolTrim audits your SaaS stack, spots redundant subscriptions, and finds cheaper alternatives. ${stats.total} tools manually verified.`;
    const url = `${SEO_BASE}/${lang}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}`);
    setJsonLd("home-jsonld", { "@context": "https://schema.org", "@type": "WebSite", name: "ToolTrim", url: SEO_BASE, description: desc, potentialAction: { "@type": "SearchAction", target: `${SEO_BASE}/${lang}/tools?q={search_term_string}`, "query-input": "required name=search_term_string" } });
    setJsonLd("home-org-jsonld", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ToolTrim",
      url: SEO_BASE,
      logo: {
        "@type": "ImageObject",
        url: `${SEO_BASE}/picto-logo.svg`,
        width: 512,
        height: 512,
      },
      description: "Independent SaaS tool directory with human-verified pricing, honest alternatives and zero affiliate bias.",
      foundingDate: "2024",
      email: "contact@tooltrim.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@tooltrim.com",
        url: `${SEO_BASE}/fr/contact`,
        availableLanguage: ["French", "English"],
      },
      sameAs: [
        "https://twitter.com/tooltrim",
        "https://www.linkedin.com/company/tooltrim",
        "https://github.com/tooltrim",
        "https://www.producthunt.com/products/tooltrim",
        "https://www.crunchbase.com/organization/tooltrim",
      ],
    });
    setJsonLd("home-faq-jsonld", { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) });
    return () => cleanupSeo(["home-jsonld", "home-org-jsonld", "home-faq-jsonld"]);
  }, [lang, stats.total, faq]);

  return (
    <div>
      {/* 1. Hero */}
      <HeroSection toolCount={stats.total} />

      {/* 2. Ticker */}
      <TickerBar />

      {/* 3. Stats */}
      <StatsSection toolCount={stats.total} categoryCount={stats.categories} />

      {/* 4. Who it's for */}
      <PersonasSection />

      {/* 5. Business objectives */}
      <BusinessObjectivesSection />

      {/* 6. How it works */}
      <Suspense fallback={null}><HowItWorks /></Suspense>

      {/* 7. Differentiator */}
      <Suspense fallback={null}><DiffTable toolCount={stats.total} /></Suspense>

      {/* 8. Testimonials */}
      <Suspense fallback={null}><TestimonialsSection /></Suspense>

      {/* 9. Categories */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-tag">{t("Catalogue", "Catalog")}</span>
              <h2 className="ts-h2">
                {t("Catégories ", "Tool ")}<em className="text-primary not-italic">{t("d'outils", "categories")}</em>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t(`${stats.categories} catégories couvrant tous les besoins de votre activité.`, `${stats.categories} categories covering all your business needs.`)}
              </p>
            </div>
            <Link to={`${prefix}/category`} className="hidden md:inline-flex shrink-0 text-sm font-medium text-primary hover:underline">{t("Voir toutes →", "See all →")}</Link>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const count = tools.filter((tool) => tool.categoryId === cat.id).length;
              const catName = stripLeadingEmoji(cat.name, cat.id);
              const catNameEn = stripLeadingEmoji(cat.nameEn, catName);
              return (
                <Link
                  key={cat.id}
                  to={`${prefix}/category/${cat.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 cursor-pointer transition-colors duration-150"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ""; }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium tracking-tight group-hover:text-primary transition-colors duration-200 truncate text-sm">
                        {t(catName, catNameEn)}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{count} {t("outils", "tools")}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-30 transition-all duration-200 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
          <Link to={`${prefix}/category`} className="mt-5 inline-flex md:hidden text-sm font-medium text-primary hover:underline">{t("Voir toutes les catégories →", "See all categories →")}</Link>
        </div>
      </section>

      {/* 10. Guides */}
      {featuredPosts.length > 0 && (
        <section className="border-t border-border bg-secondary/20 py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-tag">{t("Guides", "Guides")}</span>
                <h2 className="ts-h2">
                  {t("Derniers ", "Latest ")}<em className="text-primary not-italic">{t("guides", "guides")}</em>
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t("Comparatifs, tutoriels et conseils pour optimiser votre stack.", "Comparisons, tutorials and tips to optimize your stack.")}
                </p>
              </div>
              <Link to={`${prefix}/guides`} className="hidden md:inline-flex shrink-0 text-sm font-medium text-primary hover:underline">{t("Tous les guides", "All guides")} →</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredPosts.map((post) => (
                <GuideCard key={post.slug} post={post} prefix={prefix} tools={tools} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FaqBlock
            eyebrow={t("Questions fréquentes", "Frequently asked questions")}
            title={t("Questions fréquentes", "Frequently asked questions")}
            description={t(
              "Une FAQ pensée comme une vraie zone de décision : périmètre, fiabilité, prix, durée et indépendance.",
              "A FAQ designed as a real decision area: scope, reliability, pricing, timing, and independence."
            )}
            stats={[
              { value: `${stats.total}`, label: t("outils vérifiés", "verified tools") },
              { value: "3 min", label: t("en moyenne", "on average") },
            ]}
            items={faq.map((item, index) => ({
              question: item.q,
              answer: item.a,
              icon: [Database, ShieldCheck, Euro, Clock3, Sparkles][index] || Sparkles,
            }))}
            openCount={2}
          />
        </div>
      </section>

      {/* 12. Final CTA */}
      <Suspense fallback={null}><FinalCTA /></Suspense>
    </div>
  );
};


function BusinessObjectivesSection() {
  const { lang, t, prefix } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const objectiveCards = BUSINESS_OBJECTIVES.map((objective) => ({
    ...objective,
    stack: STACKS.find((stack) => stack.slug === objective.slug),
  })).filter((objective) => objective.stack);

  const scrollCards = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({
      left: direction === "left" ? -460 : 460,
      behavior: "smooth",
    });
  };

  return (
    <section className="overflow-hidden border-t border-border bg-background py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between gap-8">
          <div className="max-w-4xl">
            <span className="section-tag">{t("Stacks par objectif", "Stacks by goal")}</span>
            <h2 className="ts-h2 text-balance">
              {t(
                "Choisissez votre objectif et trouvez la stack qui le sert",
                "Choose your goal and find the stack built for it"
              )}
            </h2>
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollCards("left")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background text-primary transition-colors hover:border-primary hover:bg-primary/5"
              aria-label={t("Objectif précédent", "Previous goal")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCards("right")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label={t("Objectif suivant", "Next goal")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="no-scrollbar grid auto-cols-[minmax(19rem,calc(100vw-3rem))] grid-flow-col gap-5 overflow-x-auto scroll-smooth pb-2 [scroll-snap-type:x_mandatory] sm:auto-cols-[minmax(26rem,42rem)] lg:mr-[calc(50%-50vw)] lg:auto-cols-[minmax(26rem,40rem)] lg:pr-6"
        >
          {objectiveCards.map((objective) => {
            const stack = objective.stack!;
            const title = lang === "fr" ? objective.titleFr : objective.titleEn;
            const label = lang === "fr" ? objective.labelFr : objective.labelEn;
            const desc = lang === "fr" ? objective.descriptionFr : objective.descriptionEn;

            return (
              <Link
                key={objective.slug}
                to={`${prefix}/stacks/${stack.slug}`}
                className="group flex flex-col rounded-lg bg-secondary/70 p-4 transition-colors duration-200 [scroll-snap-align:start] hover:bg-secondary md:p-5"
              >
                {/* Texture visual panel */}
                {/* Photo + overlays */}
                <div className="relative overflow-hidden rounded-md bg-secondary">
                  <img
                    src={objective.image}
                    alt={title}
                    className="aspect-[1.28/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                    loading="lazy"
                  />

                  {/* Bottom vignette so overlays read clearly */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />

                  {/* Budget + savings bar — over photo */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3.5 pb-3 pt-1">
                    <span className="text-[11px] font-medium text-white/70">
                      {t("Stack optimisée", "Optimized stack")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {stack.monthlyBudget}€<span className="font-normal text-white/55 text-xs">/m</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/25 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                        <TrendingDown className="h-2.5 w-2.5" />
                        −{stack.savings}€/m
                      </span>
                    </div>
                  </div>

                  {/* Label badge */}
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm ring-1 ring-white/15">
                    <Layers3 className="h-3 w-3 text-white/70" />
                    {label}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between pt-5">
                  <div>
                    <h3 className="font-display font-semibold leading-snug" style={{ fontSize: "clamp(1.125rem, 1.8vw, 1.375rem)", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {desc}
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {t("Voir la stack type", "View stack template")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Guide card (styled like GuidesPage) ── */
function GuideCard({ post, prefix, tools }: { post: Post; prefix: string; tools: ToolSummary[] }) {
  const mentionedTools = useArticleTools(post, tools);
  const gradient = getArticleGradient(post.slug, post.category);

  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-150"
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.4)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ""; }}
    >
      <div className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} px-4 py-6`}>
        {mentionedTools.length > 0 ? (
          <div className="flex items-center gap-2">
            {mentionedTools.slice(0, 4).map((tool) => (
              <div key={tool.id} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
                <ToolLogo tool={tool} size={24} className="rounded-md" />
              </div>
            ))}
            {mentionedTools.length > 4 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-xs font-bold text-muted-foreground">
                +{mentionedTools.length - 4}
              </div>
            )}
          </div>
        ) : (
          <BookOpen className="h-8 w-8 text-primary/25" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.category && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{post.category}</span>
          )}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime || "5 min"}</span>
        </div>
        <h3 className="mt-3 text-base font-semibold tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{post.excerpt}</p>
      </div>
    </Link>
  );
}

export default HomePage;
