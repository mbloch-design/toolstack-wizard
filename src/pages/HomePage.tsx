import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, lazy, Suspense, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Database, Euro, ShieldCheck, Sparkles } from "lucide-react";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
// STACKS no longer imported here — HomePage only needed each stack's monthlyBudget;
// inlined into BUSINESS_OBJECTIVES below. Saves ~190KB gz on the home bundle.
import { getToolLogoSources } from "@/lib/toolLogos";

import HeroSection from "@/components/home/HeroSection";
import TickerBar from "@/components/home/TickerBar";
import PersonasSection from "@/components/home/PersonasSection";
import FaqBlock from "@/components/FaqBlock";
import EditorialSection from "@/components/EditorialSection";

const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const FinalCTA = lazy(() => import("@/components/home/FinalCTA"));

const FAQ_FR = [
  { q: "ToolTrim est-il affilié aux outils recommandés ?", a: "Non. Les recommandations ne sont pas classées selon des accords commerciaux. ToolTrim regarde ton profil, ton budget, ton usage réel et ta stack existante." },
  { q: "ToolTrim est-il gratuit ?", a: "Oui. L’audit est gratuit, sans carte bancaire." },
  { q: "Comment fonctionne l'audit ?", a: "Tu décris ton profil, ton niveau, ton budget, ton TJM et les outils que tu paies déjà. ToolTrim repère les doublons, les outils dormants et les abonnements à challenger." },
  { q: "Combien de temps prend l'audit ?", a: "Environ 3 minutes. Tu réponds à quelques questions, tu sélectionnes tes outils, puis tu obtiens une lecture claire de ce qu’il faut garder, couper ou challenger." },
  { q: "Les recommandations sont-elles fiables ?", a: "Elles sont construites à partir de ton contexte et des données disponibles sur les outils. Quand une information est incertaine, elle doit être traitée comme un signal à vérifier, pas comme une promesse automatique." },
];

const FAQ_EN = [
  { q: "Is ToolTrim affiliated with recommended tools?", a: "No. Recommendations are not ranked by commercial deals. ToolTrim looks at your profile, budget, real usage and existing stack." },
  { q: "Is ToolTrim free?", a: "Yes. The audit is free, with no credit card." },
  { q: "How does the audit work?", a: "You describe your profile, level, budget, day rate and the tools you already pay for. ToolTrim spots duplicates, dormant tools and subscriptions to challenge." },
  { q: "How long does the audit take?", a: "About 3 minutes. You answer a few questions, select your tools, then get a clear view of what to keep, cut or challenge." },
  { q: "Are the recommendations reliable?", a: "They are built from your context and available tool data. When information is uncertain, treat it as a signal to verify, not as an automatic promise." },
];

const BUSINESS_OBJECTIVES = [
  {
    slug: "developpeur-freelance-shipper",
    monthlyBudget: 32,
    labelFr: "Dev freelance",
    labelEn: "Freelance dev",
    titleFr: "Livrer un site client sans payer une stack de startup",
    titleEn: "Ship a client website without paying for a startup stack",
    descriptionFr: "Code, preview, specs et paiement : 4 outils suffisent. On coupe Linear, Jira et les copilotes en double.",
    descriptionEn: "Code, preview, specs, payment: 4 tools are enough. We cut Linear, Jira and duplicate AI copilots.",
    visualTools: ["GitHub", "Vercel", "Notion", "Stripe"],
    challengeFr: "Jira / copilote redondant",
    challengeEn: "Jira / duplicate copilot",
    metaFr: "4 outils · niveau installé · TJM 400–700€",
    metaEn: "4 tools · established level · €400–700 day rate",
  },
  {
    slug: "consultant-b2b-propre",
    monthlyBudget: 37,
    labelFr: "Consultant B2B",
    labelEn: "B2B consultant",
    titleFr: "Suivre ses missions sans usine à CRM",
    titleEn: "Track your missions without a heavy CRM",
    descriptionFr: "Pipeline, agenda, facturation : une stack à 40 €/mois plutôt que HubSpot à 450 €. Conçue pour un solo, pas pour une équipe sales.",
    descriptionEn: "Pipeline, calendar, invoicing: a 40€/mo stack instead of HubSpot at 450€. Built for a solo, not a sales team.",
    visualTools: ["Notion", "Tally", "Pennylane", "Brevo"],
    challengeFr: "CRM trop lourd trop tôt",
    challengeEn: "CRM too heavy too early",
    metaFr: "4 outils · solo B2B · TJM 600–1200€",
    metaEn: "4 tools · solo B2B · €600–1200 day rate",
  },
  {
    slug: "createur-contenu-operateur",
    monthlyBudget: 48,
    labelFr: "Créateur de contenu",
    labelEn: "Content creator",
    titleFr: "Publier chaque semaine sans cumuler 3 IA payantes",
    titleEn: "Publish weekly without stacking 3 paid AI tools",
    descriptionFr: "ChatGPT, Claude, Jasper, Copy.ai : tu n'en as besoin que d'un. On garde la chaîne courte, du brief jusqu'au visuel.",
    descriptionEn: "ChatGPT, Claude, Jasper, Copy.ai: you only need one. Short chain from brief to final visual.",
    visualTools: ["ChatGPT", "Claude", "Canva", "CapCut"],
    challengeFr: "abonnements IA en doublon",
    challengeEn: "duplicate AI subscriptions",
    metaFr: "4 outils · rythme hebdo · budget contenu",
    metaEn: "4 tools · weekly rhythm · content budget",
  },
  {
    slug: "ops-manager-fractional-coo",
    monthlyBudget: 84,
    labelFr: "Ops / Fractional COO",
    labelEn: "Ops / Fractional COO",
    titleFr: "Structurer une boîte sans empiler ClickUp, Asana et Monday",
    titleEn: "Structure a company without piling up ClickUp, Asana and Monday",
    descriptionFr: "Un seul PM tool, une doc claire, des automatisations utiles. La stack ops pour un fractional, pas pour un siège social.",
    descriptionEn: "One PM tool, clean docs, useful automations. The ops stack for a fractional, not a HQ.",
    visualTools: ["Notion", "ClickUp", "Make", "Google Drive"],
    challengeFr: "PM tools en double",
    challengeEn: "duplicate PM tools",
    metaFr: "4 outils · équipe légère · ops récurrentes",
    metaEn: "4 tools · light team · recurring ops",
  },
  {
    slug: "freelance-solo-zero-bloat",
    monthlyBudget: 12,
    labelFr: "Solo qui démarre",
    labelEn: "Solo starter",
    titleFr: "Vendre et encaisser avant de payer des abonnements",
    titleEn: "Sell and get paid before paying for subscriptions",
    descriptionFr: "Une page d'offre, un formulaire, un lien Stripe. Tant que ça tient, pas besoin d'acheter les outils d'une équipe.",
    descriptionEn: "An offer page, a form, a Stripe link. While it works, no need for team-grade tools.",
    visualTools: ["Carrd", "Tally", "Stripe", "Notion"],
    challengeFr: "suite marketing complète",
    challengeEn: "full marketing suite",
    metaFr: "4 outils · démarrage · budget bas",
    metaEn: "4 tools · starter · low budget",
  },
  {
    slug: "automatisation-legere-freelance",
    monthlyBudget: 28,
    labelFr: "Automatisation light",
    labelEn: "Light automation",
    titleFr: "Automatiser ce qui se répète, pas ce qui flatte l'ego",
    titleEn: "Automate what repeats, not what flatters the ego",
    descriptionFr: "Make + Tally + Notion : 3 outils pour gagner 5 h par semaine. On évite Zapier Pro et les scénarios qu'on ne maintient jamais.",
    descriptionEn: "Make + Tally + Notion: 3 tools to save 5h per week. We skip Zapier Pro and scenarios no one maintains.",
    visualTools: ["Make", "Tally", "Notion", "Brevo"],
    challengeFr: "Zapier Pro trop tôt",
    challengeEn: "Zapier Pro too early",
    metaFr: "4 outils · automatisation légère · usage mesuré",
    metaEn: "4 tools · light automation · measured usage",
  },
];

const HOME_GUIDE_CARDS = [
  {
    slug: "outils-facturation-freelance-2026",
    titleFr: "Facturation freelance : choisir sans se tromper",
    titleEn: "Freelance invoicing: choose without guessing",
    decisionFr: "Décider entre Shine, Pennylane, Indy ou Freebe selon ton volume, ton statut et tes obligations.",
    decisionEn: "Decide between Shine, Pennylane, Indy or Freebe based on your volume, status and obligations.",
    readTime: "8 min",
  },
  {
    slug: "top-5-competences-ia-freelance-2026",
    titleFr: "Compétences IA freelance : quoi apprendre en priorité",
    titleEn: "Freelance AI skills: what to learn first",
    decisionFr: "Identifier les compétences qui augmentent vraiment ta valeur, sans collectionner les formations inutiles.",
    decisionEn: "Identify the skills that truly increase your value, without collecting useless courses.",
    readTime: "9 min",
  },
  {
    slug: "conseils-ia-freelances-2026",
    titleFr: "Stack IA freelance : garder l’essentiel",
    titleEn: "Freelance AI stack: keep the essentials",
    decisionFr: "Savoir quand ChatGPT, Claude ou Perplexity font doublon — et lequel garder selon ton usage.",
    decisionEn: "Know when ChatGPT, Claude or Perplexity overlap — and which one to keep for your use case.",
    readTime: "11 min",
  },
];

const HomePage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();

  const stats = useMemo(() => {
    const free = tools.filter(t => t.defaultMonthlyPrice === 0).length;
    const withFree = tools.filter(t => t.pricing?.free).length;
    return { total: tools.length, free, withFree, categories: categories.length };
  }, [tools, categories]);

  const faq = lang === "fr" ? FAQ_FR : FAQ_EN;

  useEffect(() => {
    const title = lang === "fr"
      ? "ToolTrim — Auditer sa stack SaaS freelance"
      : "ToolTrim — Audit your freelance SaaS stack";
    const desc = lang === "fr"
      ? "ToolTrim analyse ta stack SaaS selon ton profil, ton budget, ton TJM et tes usages réels pour repérer les doublons, challenger les abonnements inutiles et recommander les outils vraiment adaptés."
      : "ToolTrim analyzes your SaaS stack based on your profile, budget, day rate and real usage to spot duplicates, challenge unnecessary subscriptions and recommend tools that actually fit.";
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
    <div className="home-page">
      {/* 1. Hero — repositionné autour de l'audit de stack */}
      <HeroSection />

      {/* 2. Ticker */}
      <TickerBar />

      {/* 3. Entrées — 3 chemins clairs */}
      <EntryCardsSection />

      {/* 4. Position — what ToolTrim spots & cuts (merged with the former Manifesto) */}
      <WhatWeCutSection />

      {/* 6. Méthode — 3 étapes */}
      <MethodeSection />

      {/* 7. Stacks par métier — concret et contextualisé */}
      <BusinessObjectivesSection />

      {/* 8. Pour quel profil */}
      <PersonasSection />

      {/* 9. Cas types */}
      <Suspense fallback={null}><TestimonialsSection /></Suspense>

      {/* 10. Guides */}
      <EditorialSection
        eyebrow={t("Guides", "Guides")}
        title={lang === "fr" ? <>Décider sans se tromper.<br />En moins de 10 minutes.</> : <>Decide without guessing.<br />In under 10 minutes.</>}
        description={t(
          "Des guides courts, directs, orientés action — pour choisir le bon outil, pas le plus populaire.",
          "Short, direct, action-oriented guides — to choose the right tool, not the most popular one."
        )}
        cta={{ label: t("Tous les guides", "All guides"), href: `${prefix}/guides` }}
      >
        <div className="home-guide-grid">
          {HOME_GUIDE_CARDS.map((guide) => (
            <Link key={guide.slug} to={`${prefix}/guide/${guide.slug}`} className="home-guide-card">
              <span className="home-guide-label">{t("Guide", "Guide")}</span>
              <h3 className="home-guide-title">{lang === "en" ? guide.titleEn : guide.titleFr}</h3>
              <p className="home-guide-decision">{lang === "en" ? guide.decisionEn : guide.decisionFr}</p>
              <div className="home-guide-footer">
                <span className="home-guide-meta">{guide.readTime}</span>
                <span className="home-guide-link">{t("Lire le guide →", "Read guide →")}</span>
              </div>
            </Link>
          ))}
        </div>
      </EditorialSection>

      {/* 15. FAQ */}
      <section id="faq" className="es-section es-section--white scroll-mt-24">
        <div className="es-container">
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
   HacLogo — favicon CDN + lettre fallback (pour HomeActionCards)
───────────────────────────────────────────────────────────────────────────── */
function HacLogo({ name, domain }: { name: string; domain: string }) {
  const [err, setErr] = useState(false);
  const src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=32`;
  return (
    <span className="hac-logo">
      {!err ? (
        <img src={src} alt="" aria-hidden="true" width={20} height={20} loading="lazy" onError={() => setErr(true)} />
      ) : (
        <span className="hac-logo-letter">{name[0].toUpperCase()}</span>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EntryCardsSection — 3 cards contour noir · header tableau · logos · verdict
───────────────────────────────────────────────────────────────────────────── */
function EntryCardsSection() {
  const { lang, t, prefix } = useLang();
  const isFr = lang === "fr";

  return (
    <section className="home-actions-section">
      <div className="es-container">

        {/* ── Section header ── */}
        <div className="home-actions-header">
          <span className="home-actions-eyebrow">
            {t("Trois façons d’utiliser ToolTrim", "Three ways to use ToolTrim")}
          </span>
          <h2 className="home-actions-title">
            {t("Pas d’outil universel. Un seul bon point de départ.", "No universal tool. One right starting point.")}
          </h2>
          <p className="home-actions-desc">
            {t(
              "Audite ce que tu paies déjà, pars d’un profil type, ou décide entre deux outils.",
              "Audit what you already pay for, start from a profile, or decide between two tools.",
            )}
          </p>
        </div>

        {/* ── Cards grid ── */}
        <div className="home-actions-grid">

          {/* ── Card 1 — Audit ── */}
          <Link to={`${prefix}/selector`} className="hac-card">
            <div className="hac-header">
              <span className="hac-header-label">{t("Audit", "Audit")}</span>
              <span className="hac-header-num">01</span>
            </div>
            <div className="hac-body">
              <h2 className="hac-title">{t("Auditer ma stack", "Audit my stack")}</h2>
              <p className="hac-desc">
                {t(
                  "Repère les outils utiles, les doublons et les abonnements que tu peux couper.",
                  "Spot useful tools, duplicates and subscriptions you can cut.",
                )}
              </p>
              <div className="hac-scenario">
                <span className="hac-scenario-label">{t("Exemple", "Example")}</span>
                <div className="hac-logos">
                  <HacLogo name="Loom" domain="loom.com" />
                  <HacLogo name="Zapier" domain="zapier.com" />
                  <HacLogo name="Trello" domain="trello.com" />
                </div>
                <p className="hac-scenario-text">
                  {t("2 doublons détectés", "2 duplicates found")}
                </p>
                <span className="hac-capsule">{t("À challenger", "Challenge")}</span>
              </div>
              <span className="hac-cta">
                {t("Lancer l'audit", "Start audit")}
                <ArrowRight className="hac-cta-arrow" style={{ width: 15, height: 15 }} />
              </span>
            </div>
          </Link>

          {/* ── Card 2 — Stack ── */}
          <Link to={`${prefix}/stacks`} className="hac-card">
            <div className="hac-header">
              <span className="hac-header-label">{t("Stack", "Stack")}</span>
              <span className="hac-header-num">02</span>
            </div>
            <div className="hac-body">
              <h2 className="hac-title">{t("Trouver ma stack", "Find my stack")}</h2>
              <p className="hac-desc">
                {t(
                  "Pars de ton métier, ton budget et ton niveau pour construire un setup simple.",
                  "Start from your job, budget and level to build a lean setup.",
                )}
              </p>
              <div className="hac-scenario">
                <span className="hac-scenario-label">{t("Exemple", "Example")}</span>
                <div className="hac-logos">
                  <HacLogo name="Notion" domain="notion.so" />
                  <HacLogo name="Tally" domain="tally.so" />
                  <HacLogo name="Pennylane" domain="pennylane.com" />
                </div>
                <p className="hac-scenario-text">
                  {isFr ? "Consultant B2B · budget cible 50 €/mois" : "B2B consultant · target budget €50/mo"}
                </p>
                <span className="hac-capsule">{t("Stack légère", "Lean stack")}</span>
              </div>
              <span className="hac-cta">
                {t("Voir les stacks", "Browse stacks")}
                <ArrowRight className="hac-cta-arrow" style={{ width: 15, height: 15 }} />
              </span>
            </div>
          </Link>

          {/* ── Card 3 — Comparer ── */}
          <Link to={`${prefix}/comparatifs`} className="hac-card">
            <div className="hac-header">
              <span className="hac-header-label">{t("Comparer", "Compare")}</span>
              <span className="hac-header-num">03</span>
            </div>
            <div className="hac-body">
              <h2 className="hac-title">{t("Comparer deux outils", "Compare two tools")}</h2>
              <p className="hac-desc">
                {t(
                  "Décide entre deux solutions selon ton usage réel, pas selon une liste de fonctionnalités.",
                  "Choose between two tools based on your actual use, not a feature list.",
                )}
              </p>
              <div className="hac-scenario">
                <span className="hac-scenario-label">{t("Exemple", "Example")}</span>
                <div className="hac-logos">
                  <HacLogo name="Notion" domain="notion.so" />
                  <span className="hac-vs-sep">VS</span>
                  <HacLogo name="Airtable" domain="airtable.com" />
                </div>
                <p className="hac-scenario-text">
                  {t(
                    "Documentation souple ou base de données structurée ?",
                    "Flexible docs or structured database?",
                  )}
                </p>
                <span className="hac-capsule">{t("Voir le duel", "See the duel")}</span>
              </div>
              <span className="hac-cta">
                {t("Comparer maintenant", "Compare now")}
                <ArrowRight className="hac-cta-arrow" style={{ width: 15, height: 15 }} />
              </span>
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WhatWeCutSection — "Ce que ToolTrim coupe" (also carries the position thesis)
───────────────────────────────────────────────────────────────────────────── */
function WhatWeCutSection() {
  const { lang, t, prefix } = useLang();

  const cuts = [
    {
      labelFr: "Doublon",
      labelEn: "Duplicate",
      exampleFr: "Notion + Trello + Asana pour suivre les mêmes projets.",
      exampleEn: "Notion + Trello + Asana to track the same projects.",
    },
    {
      labelFr: "Dormant",
      labelEn: "Dormant",
      exampleFr: "Loom ouvert deux fois ce mois-ci.",
      exampleEn: "Loom opened twice this month.",
    },
    {
      labelFr: "Trop tôt",
      labelEn: "Too soon",
      exampleFr: "Zapier Pro payé pour un seul automatisme.",
      exampleEn: "Zapier Pro paid for one automation.",
    },
    {
      labelFr: "Surdimensionné",
      labelEn: "Oversized",
      exampleFr: "HubSpot quand Notion + Tally suffisent.",
      exampleEn: "HubSpot when Notion + Tally are enough.",
    },
    {
      labelFr: "À challenger",
      labelEn: "To challenge",
      exampleFr: "140 €/mois d’outils pour trois clients actifs.",
      exampleEn: "€140/mo in tools for three active clients.",
    },
  ];

  return (
    <section className="hp-cuts es-section">
      <div className="es-container">
        <div className="hp-cuts-inner">
          {/* Left */}
          <div>
            <p className="hp-cuts-label">{t("Ce que ToolTrim repère", "What ToolTrim spots")}</p>
            <h2 className="hp-cuts-heading">
              {lang === "fr"
                ? <>Ce que tu paies encore.<br />Sans toujours l’utiliser.</>
                : <>What you still pay for.<br />Without always using it.</>}
            </h2>
            <p className="hp-cuts-intro">
              {t(
                "Un outil ajouté pour une mission. Un plan activé trop tôt. Deux solutions qui font le même travail. Pris séparément, rien ne semble grave. Ensemble, ta stack devient plus chère que nécessaire.",
                "A tool added for one project. A plan activated too early. Two solutions doing the same job. Separately, none of it feels serious. Together, your stack becomes more expensive than it needs to be.",
              )}
            </p>
            <p className="hp-cuts-product-line">
              {t(
                "Le bon outil dépend de ton contexte : ToolTrim lit ta stack — 3 clients actifs, un TJM, un Trello pas ouvert depuis six semaines — et te montre quoi garder, quoi couper, quoi challenger.",
                "The right tool depends on your context: ToolTrim reads your stack — 3 active clients, a day rate, a Trello untouched for six weeks — and shows what to keep, cut, or challenge.",
              )}
            </p>
            <Link to={`${prefix}/selector`} className="hp-cuts-cta">
              {t("Auditer ma stack", "Audit my stack")}
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>

          {/* Right — diagnostic rows + compact result panel */}
          <div className="hp-diagnostic-content">
            <div className="hp-cut-rows">
              {cuts.map((cut) => (
                <div key={cut.labelFr} className="hp-cut-row">
                  <p className="hp-cut-row-label">{t(cut.labelFr, cut.labelEn)}</p>
                  <p className="hp-cut-row-example">{t(cut.exampleFr, cut.exampleEn)}</p>
                </div>
              ))}
            </div>

            <div className="hp-result-card">
              <p className="hp-result-card-label">{t("Exemple de lecture", "Reading example")}</p>
              <p className="hp-result-card-main">
                {lang === "fr"
                  ? <>9 outils · 123 €/mois<br />→ 5 outils · 48 €/mois</>
                  : <>9 tools · €123/mo<br />→ 5 tools · €48/mo</>}
              </p>
              <p className="hp-result-card-text">
                {t("Résultat illustratif — profil freelance solo, 8 outils.", "Illustrative result — solo freelance profile, 8 tools.")}
              </p>
              <p className="hp-result-card-meta">
                {t(
                  "Doublons supprimés · Plans repoussés · Outils utiles conservés",
                  "Duplicates removed · Plans postponed · Useful tools kept",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BusinessObjectivesSection — stacks par objectif/persona concret
───────────────────────────────────────────────────────────────────────────── */
function StackObjectiveLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const logo = getToolLogoSources({ slug: name, name }, 64)[0];
  const initial = name.charAt(0).toUpperCase();

  return (
    <span className="home-stack-logo" title={name} aria-label={name}>
      {logo && !failed ? (
        <img src={logo} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  );
}

function BusinessObjectivesSection() {
  const { lang, t, prefix } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const objectiveCards = BUSINESS_OBJECTIVES;

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
            <span className="es-eyebrow">{t("Stacks par métier", "Stacks by role")}</span>
            <h2 className="es-title">
              {t("Ta stack existe déjà. Elle t’attend.", "Your stack already exists. It is waiting for you.")}
            </h2>
            <p className="es-description">
              {t(
                "Dev freelance, consultant B2B, créateur de contenu, solo qui démarre : chaque profil a une stack qui correspond à son usage réel et à son budget.",
                "Freelance dev, B2B consultant, content creator, solo starter: each profile has a stack that matches real usage and budget.",
              )}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => scrollCards("left")}
              className="hidden md:inline-flex"
              aria-label={t("Objectif précédent", "Previous goal")}
              style={{
                width: 40, height: 40,
                border: "1px solid var(--color-border)",
                borderRadius: "50%",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "border-color 160ms ease-out",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
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
                border: "1px solid var(--color-border-strong)",
                borderRadius: "50%",
                background: "var(--color-text)",
                color: "var(--color-surface)",
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
            const title = lang === "fr" ? objective.titleFr : objective.titleEn;
            const label = lang === "fr" ? objective.labelFr : objective.labelEn;
            const desc = lang === "fr" ? objective.descriptionFr : objective.descriptionEn;

            return (
              <Link
                key={objective.slug}
                to={`${prefix}/stacks/${objective.slug}`}
                style={{ scrollSnapAlign: "start", display: "flex", flexDirection: "column", textDecoration: "none" }}
                className="home-stack-card"
              >
                <div className="home-stack-panel">
                  <div className="home-stack-panel-top">
                    <span className="home-stack-profile">{label}</span>
                    <span className="home-stack-budget">{t("Budget cible :", "Target budget:")} {objective.monthlyBudget}€/{t("mois", "mo")}</span>
                  </div>
                  <div className="home-stack-logos" aria-label={t("Outils clés", "Key tools")}>
                    {objective.visualTools.map((tool) => (
                      <StackObjectiveLogo key={tool} name={tool} />
                    ))}
                  </div>
                  <div className="home-stack-challenge">
                    <span>{t("À challenger", "To challenge")}</span>
                    <p>{lang === "fr" ? objective.challengeFr : objective.challengeEn}</p>
                  </div>
                </div>

                {/* Text */}
                <div className="home-stack-content">
                  <h3 className="home-stack-title">{title}</h3>
                  <p className="home-stack-description">
                    {desc}
                  </p>
                  <div className="home-stack-footer">
                    <span className="home-stack-meta">{lang === "fr" ? objective.metaFr : objective.metaEn}</span>
                    <span className="home-stack-cta">{t("Voir la stack →", "View stack →")}</span>
                  </div>
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
   MethodeSection — "Comment ça marche"
   Grille 3 étapes : usage / doublons / décision
───────────────────────────────────────────────────────────────────────────── */
function MethodeSection() {
  const { lang, t, prefix } = useLang();

  const steps = [
    {
      num: "01",
      titleFr: "Tu décris comment tu travailles",
      titleEn: "You describe how you work",
      descFr: "Profil, niveau, budget, TJM, outils déjà payés : le point de départ reste ton contexte réel.",
      descEn: "Profile, level, budget, day rate, tools already paid for: the starting point is your real context.",
      exampleFr: "Freelance · TJM 500 € · 8 outils · 2 peu utilisés",
      exampleEn: "Freelance · €500 day rate · 8 tools · 2 rarely used",
    },
    {
      num: "02",
      titleFr: "ToolTrim lit l’ensemble",
      titleEn: "ToolTrim reads the whole picture",
      descFr: "Un outil n’est pas jugé seul. Il est comparé à ton usage, ton budget et aux autres outils déjà en place.",
      descEn: "A tool is not judged alone. It is compared to your usage, budget and tools already in place.",
      exampleFr: "Notion + Trello + Asana → doublon probable",
      exampleEn: "Notion + Trello + Asana → likely duplicate",
    },
    {
      num: "03",
      titleFr: "Tu sais quoi faire",
      titleEn: "You know what to do",
      descFr: "Garder, couper ou challenger — avec une raison claire pour chaque ligne.",
      descEn: "Keep, cut or challenge — with a clear reason for every line.",
      exampleFr: "Zapier Pro → challenger si l’usage reste faible",
      exampleEn: "Zapier Pro → challenge if usage stays low",
    },
  ];

  return (
    <section className="hp-methode es-section">
      <div className="es-container">
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p className="hp-cuts-label">{t("Comment ça marche", "How it works")}</p>
            <h2 style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(1.75rem, 3vw, 2.75rem)", fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.04em", lineHeight: 1.15 }}>
              {lang === "fr"
                ? <>3 minutes.<br />Une décision claire.</>
                : <>3 minutes.<br />One clear decision.</>}
            </h2>
            <p className="hp-methode-subtitle">
              {t(
                "Tu décris comment tu travailles. ToolTrim analyse ta stack dans son ensemble — pas outil par outil. Tu repars avec une liste : garder, couper, challenger. Avec une raison pour chaque ligne.",
                "You describe how you work. ToolTrim analyzes your stack as a whole — not tool by tool. You leave with a list: keep, cut, challenge. With a reason for every line.",
              )}
            </p>
          </div>
          <Link to={`${prefix}/selector`} className="hp-cuts-cta" style={{ marginTop: 0, flexShrink: 0 }}>
            {t("Commencer l’audit", "Start the audit")}
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
