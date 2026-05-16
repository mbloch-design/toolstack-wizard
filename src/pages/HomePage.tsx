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

      {/* 6. Stacks par objectif — concret et contextualisé */}
      <BusinessObjectivesSection />

      {/* 7. Ce que ToolTrim cherche (couper / doublons / downgrade) */}
      <StatsSection toolCount={stats.total} categoryCount={stats.categories} />

      {/* 8. Pour quel profil */}
      <PersonasSection />

      {/* 9. How it works */}
      <Suspense fallback={null}><HowItWorks /></Suspense>

      {/* 10. Différences vs annuaires classiques */}
      <Suspense fallback={null}><DiffTable toolCount={stats.total} /></Suspense>

      {/* 11. Témoignages */}
      <Suspense fallback={null}><TestimonialsSection /></Suspense>

      {/* 12. Guides */}
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

      {/* 13. FAQ */}
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

      {/* 14. Final CTA */}
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
      href: `${prefix}/selector`,
    },
    {
      number: "02",
      titleFr: "Trouver ma stack",
      titleEn: "Find my stack",
      descFr: "Pars de ton métier, ton budget et ton niveau pour construire un setup simple.",
      descEn: "Start from your job, budget and level to build a lean setup.",
      href: `${prefix}/stacks`,
    },
    {
      number: "03",
      titleFr: "Comparer deux outils",
      titleEn: "Compare two tools",
      descFr: "Décide entre deux solutions selon ton usage réel, pas selon une liste de fonctionnalités.",
      descEn: "Choose between two tools based on your actual use case, not a feature list.",
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
              <span className="hp-entry-link">
                {t("Commencer", "Get started")}
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

          {/* Right — text */}
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
      fr: "Les doublons fonctionnels",
      en: "Functional duplicates",
    },
    {
      fr: "Les outils dormants",
      en: "Dormant tools",
    },
    {
      fr: "Les abonnements trop tôt",
      en: "Premature subscriptions",
    },
    {
      fr: "Les alternatives trop lourdes",
      en: "Overcomplicated alternatives",
    },
    {
      fr: "Les stacks qui coûtent plus qu'elles ne rapportent",
      en: "Stacks that cost more than they deliver",
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

          {/* Right — list + CTA */}
          <div>
            <ul className="hp-cuts-list" role="list">
              {cuts.map((cut) => (
                <li key={cut.fr} className="hp-cuts-item">
                  <span className="hp-cuts-item-dash" aria-hidden="true" />
                  {t(cut.fr, cut.en)}
                </li>
              ))}
            </ul>

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


export default HomePage;
