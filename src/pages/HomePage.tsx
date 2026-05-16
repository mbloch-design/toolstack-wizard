import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, lazy, Suspense, useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Database, Euro, ShieldCheck, Sparkles } from "lucide-react";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { STACKS } from "@/data/stacks";

import HeroSection from "@/components/home/HeroSection";
import TickerBar from "@/components/home/TickerBar";
import StatsSection from "@/components/home/StatsSection";
import PersonasSection from "@/components/home/PersonasSection";
import FaqBlock from "@/components/FaqBlock";
import EditorialSection from "@/components/EditorialSection";
import GuideCardEditorial from "@/components/GuideCardEditorial";

const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const DiffTable = lazy(() => import("@/components/home/DiffTable"));
const FinalCTA = lazy(() => import("@/components/home/FinalCTA"));

const FAQ_FR = [
  { q: "Comment fonctionne l'audit de stack ?", a: "Tu répondes à quelques questions sur ton profil et tu listes tes outils actuels. ToolTrim détecte les doublons, les outils dormants et les abonnements que tu peux couper ou réduire, avec des prix vérifiés sur les pages officielles." },
  { q: "Les recommandations sont-elles vraiment fiables ?", a: "ToolTrim ne recommande que lorsque les données sont vérifiées. Chaque prix est issu de la page officielle de l'outil. Les recommandations incertaines sont signalées explicitement." },
  { q: "ToolTrim est-il gratuit ?", a: "Oui, l'audit de base est entièrement gratuit." },
  { q: "Combien de temps prend l'audit ?", a: "Moins de 3 minutes. Tu réponds à quelques questions sur ton profil, tu sélectionnes tes outils, et tu reçois instantanément tes recommandations personnalisées." },
  { q: "ToolTrim est-il affilié aux outils recommandés ?", a: "Non. ToolTrim est 100% indépendant. Aucun accord d'affiliation ne biaise les recommandations. Les résultats sont basés uniquement sur ton profil et les données objectives." },
];

const FAQ_EN = [
  { q: "How does the stack audit work?", a: "You answer a few questions about your profile and list your current tools. ToolTrim detects duplicates, dormant tools and subscriptions you can cut or downgrade, with prices verified on official pages." },
  { q: "Are the recommendations really reliable?", a: "ToolTrim only recommends when data is verified. Each price comes from the tool's official page. Uncertain recommendations are explicitly flagged." },
  { q: "Is ToolTrim free?", a: "Yes, the basic audit is completely free." },
  { q: "How long does the audit take?", a: "Less than 3 minutes. You answer a few questions about your profile, select your tools, and instantly receive personalized recommendations." },
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
      ? "ToolTrim — Audite ta stack, coupe ce qui ne sert pas"
      : "ToolTrim — Audit your stack, cut what doesn't work";
    const desc = lang === "fr"
      ? "ToolTrim aide les freelances et solopreneurs à auditer leurs abonnements SaaS, repérer les doublons et construire une stack qui vaut vraiment le coût."
      : "ToolTrim helps freelancers and solopreneurs audit their SaaS subscriptions, spot duplicates and build a stack that's actually worth the cost.";
    const url = `${SEO_BASE}/${lang}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}`);
    setJsonLd("home-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ToolTrim",
      url: SEO_BASE,
      description: desc,
    });
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
      description: "Stack audit tool for freelancers and solopreneurs. Independent, honest, no affiliate bias.",
      foundingDate: "2024",
      email: "contact@tooltrim.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@tooltrim.com",
        url: `${SEO_BASE}/fr/contact`,
        availableLanguage: ["French", "English"],
      },
    });
    return () => cleanupSeo(["home-jsonld", "home-org-jsonld"]);
  }, [lang, stats.total, faq]);

  return (
    <div>
      {/* 1. Hero — repositionné autour de l'audit de stack */}
      <HeroSection />

      {/* 2. Ticker */}
      <TickerBar />

      {/* 3. Entrées — 3 chemins clairs */}
      <EntryCardsSection />

      {/* 4. Manifesto — "Pas un annuaire de plus" */}
      <ManifestoSection />

      {/* 5. Ce que ToolTrim coupe */}
      <WhatWeCutSection />

      {/* 6. Avant / Après — résultat concret */}
      <AvantApresSection />

      {/* 7. Méthode — 3 étapes */}
      <MethodeSection />

      {/* 8. Stacks par objectif — concret et contextualisé */}
      <BusinessObjectivesSection />

      {/* 9. Ce que ToolTrim cherche (couper / doublons / downgrade) */}
      <StatsSection toolCount={stats.total} categoryCount={stats.categories} />

      {/* 10. Pour quel profil */}
      <PersonasSection />

      {/* 11. How it works */}
      <Suspense fallback={null}><HowItWorks /></Suspense>

      {/* 12. Différences vs annuaires classiques */}
      <Suspense fallback={null}><DiffTable toolCount={stats.total} /></Suspense>

      {/* 13. Témoignages */}
      <Suspense fallback={null}><TestimonialsSection /></Suspense>

      {/* 14. Guides */}
      {featuredPosts.length > 0 && (
        <EditorialSection
          eyebrow={t("Guides", "Guides")}
          title={t("Lire avant de choisir.", "Read before you choose.")}
          description={t(
            "Comparatifs, méthodes et stacks commentées pour décider sans empiler.",
            "Comparisons, methods and annotated stacks to decide without stacking."
          )}
          cta={{ label: t("Tous les guides", "All guides"), href: `${prefix}/guides` }}
        >
          <div className="es-grid">
            {featuredPosts.map((post) => (
              <GuideCardEditorial
                key={post.slug}
                post={post}
                prefix={prefix}
                ctaLabel={t("Lire l'article →", "Read article →")}
              />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* 15. FAQ */}
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
              { value: "< 3 min", label: t("pour l'audit complet", "for the full audit") },
              { value: "100%", label: t("indépendant", "independent") },
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

      {/* 16. Final CTA */}
      <Suspense fallback={null}><FinalCTA /></Suspense>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   EntryCardsSection — 3 chemins d'entrée dans ToolTrim
───────────────────────────────────────────────────────────────────────────── */
function EntryCardsSection() {
  const { t, prefix } = useLang();

  const entries = [
    {
      number: "01",
      titleFr: "Auditer ma stack",
      titleEn: "Audit my stack",
      descFr: "Repère les outils utiles, les doublons et les abonnements que tu peux couper.",
      descEn: "Spot useful tools, duplicates and subscriptions you can cut.",
      exampleFr: "Ex. : Loom + Zapier + Trello → 2 doublons détectés, 42 €/mois économisés",
      exampleEn: "E.g. Loom + Zapier + Trello → 2 duplicates found, €42/mo saved",
      ctaFr: "Lancer l'audit",
      ctaEn: "Start audit",
      href: `${prefix}/selector`,
    },
    {
      number: "02",
      titleFr: "Trouver ma stack",
      titleEn: "Find my stack",
      descFr: "Pars de ton métier, ton budget et ton niveau pour construire un setup simple.",
      descEn: "Start from your job, budget and level to build a lean setup.",
      exampleFr: "Ex. : Consultant B2B, 50 €/mois → Notion + Tally + Pennylane",
      exampleEn: "E.g. B2B consultant, €50/mo → Notion + Tally + Pennylane",
      ctaFr: "Voir les stacks",
      ctaEn: "Browse stacks",
      href: `${prefix}/stacks`,
    },
    {
      number: "03",
      titleFr: "Comparer deux outils",
      titleEn: "Compare two tools",
      descFr: "Décide entre deux solutions selon ton usage réel, pas selon une liste de fonctionnalités.",
      descEn: "Choose between two tools based on your actual use case, not a feature list.",
      exampleFr: "Ex. : Notion vs Airtable → lequel tient quand tu grossis ?",
      exampleEn: "E.g. Notion vs Airtable → which scales with you?",
      ctaFr: "Comparer maintenant",
      ctaEn: "Compare now",
      href: `${prefix}/comparatifs`,
    },
  ];

  return (
    <section className="hp-entries">
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--layout-content, 1280px)", padding: "0 var(--layout-gutter, 24px)" }}
      >
        <div className="hp-entries-grid">
          {entries.map((entry) => (
            <Link key={entry.number} to={entry.href} className="hp-entry">
              <span className="hp-entry-number">{entry.number}</span>
              <span className="hp-entry-title">{t(entry.titleFr, entry.titleEn)}</span>
              <p className="hp-entry-desc">{t(entry.descFr, entry.descEn)}</p>
              <p className="hp-entry-example">{t(entry.exampleFr, entry.exampleEn)}</p>
              <span className="hp-entry-link">
                {t(entry.ctaFr, entry.ctaEn)}
                <ArrowRight style={{ width: 13, height: 13 }} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ManifestoSection — "Pas un annuaire de plus"
───────────────────────────────────────────────────────────────────────────── */
function ManifestoSection() {
  const { t } = useLang();

  return (
    <section className="hp-manifesto es-section">
      <div className="es-container">
        <div className="hp-manifesto-inner">
          {/* Left — heading */}
          <div>
            <p className="hp-manifesto-label">{t("Notre position", "Our position")}</p>
            <h2 className="hp-manifesto-heading">
              {t(
                <>Pas un annuaire<br />de plus.</>,
                <>Not another<br />directory.</>,
              )}
            </h2>
          </div>

          {/* Right — text + decision blocks */}
          <div className="hp-manifesto-body">
            <p className="hp-manifesto-para">
              {t(
                <>ToolTrim ne cherche pas à lister tous les outils du marché.<br />L'objectif est plus simple : <strong>t'aider à décider.</strong></>,
                <>ToolTrim doesn't try to list every tool on the market.<br />The goal is simpler: <strong>help you decide.</strong></>,
              )}
            </p>
            <p className="hp-manifesto-para">
              {t(
                <>Quel outil garder.<br />Quel outil couper.<br />Quel outil remplacer.</>,
                <>Which tool to keep.<br />Which tool to cut.<br />Which tool to replace.</>,
              )}
            </p>
            <p className="hp-manifesto-para">
              {t(
                "Un bon outil doit avoir un rôle clair dans ta stack. Sinon, il devient juste un abonnement de plus.",
                "A good tool needs a clear role in your stack. Otherwise, it's just another subscription.",
              )}
            </p>

            {/* Decision blocks */}
            <div className="hp-decisions">
              <div className="hp-decision">
                <span className="hp-decision-key">{t("Garder", "Keep")}</span>
                <span className="hp-decision-desc">
                  {t(
                    <>L'outil a un rôle unique. <strong>Tu l'as utilisé cette semaine.</strong></>,
                    <>The tool has a unique role. <strong>You used it this week.</strong></>,
                  )}
                </span>
              </div>
              <div className="hp-decision">
                <span className="hp-decision-key">{t("Couper", "Cut")}</span>
                <span className="hp-decision-desc">
                  {t(
                    <>L'outil est dormant ou <strong>en doublon avec un autre</strong> de ta stack.</>,
                    <>The tool is dormant or <strong>duplicates another</strong> in your stack.</>,
                  )}
                </span>
              </div>
              <div className="hp-decision">
                <span className="hp-decision-key">{t("Remplacer", "Replace")}</span>
                <span className="hp-decision-desc">
                  {t(
                    <>L'outil coûte trop cher pour ton usage. <strong>Une alternative plus légère existe.</strong></>,
                    <>The tool costs too much for your use. <strong>A lighter alternative exists.</strong></>,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WhatWeCutSection — "Ce que ToolTrim coupe"
───────────────────────────────────────────────────────────────────────────── */
function WhatWeCutSection() {
  const { t, prefix } = useLang();

  const cuts = [
    {
      titleFr: "Les doublons fonctionnels",
      titleEn: "Functional duplicates",
      exampleFr: "Notion + Trello + Asana pour gérer les mêmes projets.",
      exampleEn: "Notion + Trello + Asana for the same projects.",
    },
    {
      titleFr: "Les outils dormants",
      titleEn: "Dormant tools",
      exampleFr: "Loom ouvert 2 fois ce mois. Slack video suffit.",
      exampleEn: "Loom opened twice this month. Slack video does the job.",
    },
    {
      titleFr: "Les abonnements trop tôt",
      titleEn: "Premature subscriptions",
      exampleFr: "Zapier Pro à 49 €/mois pour 1 zap actif.",
      exampleEn: "Zapier Pro at €49/mo for 1 active zap.",
    },
    {
      titleFr: "Les alternatives trop lourdes",
      titleEn: "Overcomplicated alternatives",
      exampleFr: "HubSpot CRM quand Notion + Tally suffit pour un solo.",
      exampleEn: "HubSpot CRM when Notion + Tally is enough for a solo.",
    },
    {
      titleFr: "Les stacks qui coûtent plus qu'elles ne rapportent",
      titleEn: "Stacks that cost more than they deliver",
      exampleFr: "140 €/mois d'abonnements pour facturer 3 clients.",
      exampleEn: "€140/mo in subscriptions to invoice 3 clients.",
    },
  ];

  return (
    <section className="hp-cuts es-section">
      <div className="es-container">
        <div className="hp-cuts-inner">
          {/* Left */}
          <div>
            <p className="hp-cuts-label">{t("Ce que ToolTrim coupe", "What ToolTrim cuts")}</p>
            <h2 className="hp-cuts-heading">
              {t(
                <>Tout ce qui<br />alourdit ta stack<br />sans raison.</>,
                <>Everything that<br />weighs down your<br />stack for no reason.</>,
              )}
            </h2>
          </div>

          {/* Right — decision rows + CTA */}
          <div>
            <div className="hp-cut-rows">
              {cuts.map((cut) => (
                <div key={cut.titleFr} className="hp-cut-row">
                  <div className="hp-cut-row-header">
                    <span className="hp-cut-row-indicator" aria-hidden="true" />
                    <span className="hp-cut-row-title">{t(cut.titleFr, cut.titleEn)}</span>
                  </div>
                  <p className="hp-cut-row-example">{t(cut.exampleFr, cut.exampleEn)}</p>
                </div>
              ))}
            </div>

            <Link to={`${prefix}/selector`} className="hp-cuts-cta">
              {t("Auditer ma stack", "Audit my stack")}
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BusinessObjectivesSection — stacks par objectif/persona concret
───────────────────────────────────────────────────────────────────────────── */
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
    <section className="es-section" style={{ overflow: "hidden" }}>
      <div className="es-container">
        {/* Section header */}
        <div className="es-header">
          <div>
            <span className="es-eyebrow">{t("Stacks par objectif", "Stacks by goal")}</span>
            <h2 className="es-title">
              {t("Des setups concrets, par métier.", "Concrete setups, by job type.")}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => scrollCards("left")}
              className="hidden md:inline-flex"
              aria-label={t("Objectif précédent", "Previous goal")}
              style={{
                width: 40, height: 40,
                border: "1px solid #DADAD4",
                borderRadius: "50%",
                background: "#FFFFFF",
                color: "#222222",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "border-color 160ms ease-out",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#222222"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#DADAD4"; }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <button
              type="button"
              onClick={() => scrollCards("right")}
              className="hidden md:inline-flex"
              aria-label={t("Objectif suivant", "Next goal")}
              style={{
                width: 40, height: 40,
                border: "1px solid #222222",
                borderRadius: "50%",
                background: "#222222",
                color: "#FFFFFF",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "opacity 160ms ease-out",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Scroll rail */}
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "clamp(18rem, calc(100vw - 3rem), 38rem)",
            gap: 16,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            paddingBottom: 4,
            marginRight: "calc(50% - 50vw)",
          }}
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
                style={{ scrollSnapAlign: "start", display: "flex", flexDirection: "column", textDecoration: "none" }}
                className="ec-card"
              >
                {/* Photo */}
                <div style={{ position: "relative", overflow: "hidden", borderRadius: 4, marginBottom: 18 }}>
                  <img
                    src={objective.image}
                    alt={title}
                    style={{ aspectRatio: "16/9", width: "100%", objectFit: "cover", display: "block", transition: "transform 500ms ease" }}
                    loading="lazy"
                  />
                  {/* Vignette */}
                  <div style={{ position: "absolute", inset: "0 0 0 0", background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)", pointerEvents: "none" }} />
                  {/* Budget strip */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 12px" }}>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
                      {stack.monthlyBudget}€<span style={{ fontWeight: 400, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>/m</span>
                      <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>−{stack.savings}€</span>
                    </span>
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    className="ec-title"
                    style={{ fontSize: "clamp(1.0625rem, 1.6vw, 1.25rem)", lineHeight: 1.2 }}
                  >
                    {title}
                  </div>
                  <p className="ec-text" style={{ marginTop: 10, fontSize: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {desc}
                  </p>
                  <span className="ec-cta" style={{ marginTop: 20 }}>
                    {t("Voir la stack →", "View stack →")}
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


/* ─────────────────────────────────────────────────────────────────────────────
   AvantAprèsSection — "Avant / Après ToolTrim"
   2 panels : stack initiale gonflée → stack optimisée
───────────────────────────────────────────────────────────────────────────── */
function AvantApresSection() {
  const { t, prefix } = useLang();

  const before = [
    { nameFr: "Notion", nameEn: "Notion",    price: "16 €" },
    { nameFr: "Trello", nameEn: "Trello",    price: "5 €"  },
    { nameFr: "Asana",  nameEn: "Asana",     price: "12 €" },
    { nameFr: "Loom",   nameEn: "Loom",      price: "8 €"  },
    { nameFr: "Zapier", nameEn: "Zapier",    price: "49 €" },
    { nameFr: "Canva",  nameEn: "Canva",     price: "15 €" },
    { nameFr: "Slack",  nameEn: "Slack",     price: "8 €"  },
    { nameFr: "Stripe", nameEn: "Stripe",    price: "—"    },
    { nameFr: "Calendly", nameEn: "Calendly", price: "10 €" },
  ];

  const after = [
    { nameFr: "Notion",   nameEn: "Notion",   price: "16 €", kept: true  },
    { nameFr: "Trello",   nameEn: "Trello",   price: "5 €",  kept: false },
    { nameFr: "Asana",    nameEn: "Asana",    price: "12 €", kept: false },
    { nameFr: "Loom",     nameEn: "Loom",     price: "8 €",  kept: false },
    { nameFr: "Make",     nameEn: "Make",     price: "9 €",  kept: true  },
    { nameFr: "Canva",    nameEn: "Canva",    price: "15 €", kept: true  },
    { nameFr: "Slack",    nameEn: "Slack",    price: "8 €",  kept: true  },
    { nameFr: "Stripe",   nameEn: "Stripe",   price: "—",    kept: true  },
    { nameFr: "Calendly", nameEn: "Calendly", price: "10 €", kept: false },
  ];

  return (
    <section className="hp-aa es-section">
      <div className="es-container">
        {/* Heading */}
        <div style={{ marginBottom: 48 }}>
          <p className="hp-cuts-label">{t("Résultat concret", "Concrete result")}</p>
          <h2 style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(1.75rem, 3vw, 2.75rem)", fontWeight: 600, color: "#222222", letterSpacing: "-0.04em", lineHeight: 1.15, maxWidth: 480 }}>
            {t(
              <>9 outils, 123 €/mois<br />→ 5 outils, 48 €/mois.</>,
              <>9 tools, €123/mo<br />→ 5 tools, €48/mo.</>,
            )}
          </h2>
        </div>

        <div className="hp-aa-inner">
          {/* Before panel */}
          <div className="hp-aa-panel">
            <div className="hp-aa-panel-header">
              <span className="hp-aa-panel-label">{t("Avant", "Before")}</span>
              <span className="hp-aa-panel-stat">123 €<span style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 400, color: "#9A9A92" }}>/mois</span></span>
            </div>
            <ul className="hp-aa-list">
              {before.map((item) => (
                <li key={item.nameFr} className="hp-aa-item">
                  <span>{t(item.nameFr, item.nameEn)}</span>
                  <span className="hp-aa-item-price">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After panel */}
          <div className="hp-aa-panel hp-aa-panel--after">
            <div className="hp-aa-panel-header">
              <span className="hp-aa-panel-label">{t("Après ToolTrim", "After ToolTrim")}</span>
              <span className="hp-aa-panel-stat">48 €<span style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>/mois</span></span>
            </div>
            <ul className="hp-aa-list">
              {after.map((item) => (
                <li key={item.nameFr} className={`hp-aa-item ${item.kept ? "hp-aa-item--kept" : "hp-aa-item--cut"}`}>
                  <span>{t(item.nameFr, item.nameEn)}{!item.kept && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: "#9A9A92", fontStyle: "normal" }}>
                      {item.nameFr === "Trello" || item.nameFr === "Asana"
                        ? t("doublon", "duplicate")
                        : item.nameFr === "Loom"
                          ? t("dormant", "dormant")
                          : item.nameFr === "Calendly"
                            ? t("trop tôt", "too soon")
                            : ""}
                    </span>
                  )}</span>
                  <span className="hp-aa-item-price">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Saving summary */}
        <div className="hp-aa-saving">
          <span className="hp-aa-saving-label">{t("Économie mensuelle :", "Monthly saving:")}</span>
          <span className="hp-aa-saving-amount">−75 €</span>
          <span className="hp-aa-saving-sub">{t("soit −900 €/an", "that's −€900/yr")}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
          <Link to={`${prefix}/selector`} className="hp-cuts-cta">
            {t("Calculer mon économie", "Calculate my saving")}
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MethodeSection — "Comment ça marche"
   Grille 3 étapes : usage / doublons / décision
───────────────────────────────────────────────────────────────────────────── */
function MethodeSection() {
  const { t, prefix } = useLang();

  const steps = [
    {
      num: "01",
      titleFr: "On analyse ton usage",
      titleEn: "We analyse your usage",
      descFr: "Tu listes tes outils. On regarde ce que tu utilises vraiment — pas ce que tu as payé.",
      descEn: "You list your tools. We look at what you actually use — not what you've paid for.",
      exampleFr: "Fréquence d'usage, rôle dans la stack, doublons potentiels.",
      exampleEn: "Usage frequency, role in your stack, potential duplicates.",
    },
    {
      num: "02",
      titleFr: "On détecte les doublons",
      titleEn: "We detect duplicates",
      descFr: "Deux outils qui font la même chose, c'est un doublon. ToolTrim les signale sans ambiguïté.",
      descEn: "Two tools doing the same thing is a duplicate. ToolTrim flags them clearly.",
      exampleFr: "Notion + Trello = doublon. Loom + Slack video = doublon.",
      exampleEn: "Notion + Trello = duplicate. Loom + Slack video = duplicate.",
    },
    {
      num: "03",
      titleFr: "On te donne une décision",
      titleEn: "We give you a decision",
      descFr: "Garder, couper ou remplacer — avec une raison précise, pas une liste de fonctionnalités.",
      descEn: "Keep, cut or replace — with a specific reason, not a feature list.",
      exampleFr: "\"Zapier Pro → Make à 9€. Même usage, 40€ économisés.\"",
      exampleEn: "\"Zapier Pro → Make at €9. Same use, €40 saved.\"",
    },
  ];

  return (
    <section className="hp-methode es-section">
      <div className="es-container">
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p className="hp-cuts-label">{t("La méthode", "The method")}</p>
            <h2 style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(1.75rem, 3vw, 2.75rem)", fontWeight: 600, color: "#222222", letterSpacing: "-0.04em", lineHeight: 1.15 }}>
              {t("3 étapes. Pas de jargon.", "3 steps. No jargon.")}
            </h2>
          </div>
          <Link to={`${prefix}/selector`} className="hp-cuts-cta" style={{ marginTop: 0, flexShrink: 0 }}>
            {t("Commencer l'audit", "Start the audit")}
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>

        {/* 3-step grid */}
        <div className="hp-methode-grid">
          {steps.map((step) => (
            <div key={step.num} className="hp-methode-step">
              <span className="hp-methode-num">{step.num}</span>
              <span className="hp-methode-title">{t(step.titleFr, step.titleEn)}</span>
              <p className="hp-methode-desc">{t(step.descFr, step.descEn)}</p>
              <p className="hp-methode-example">{t(step.exampleFr, step.exampleEn)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomePage;
