import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, lazy, Suspense, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Database, Euro, ShieldCheck, Sparkles } from "lucide-react";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { STACKS } from "@/data/stacks";
import { getToolLogoSources, type LogoCandidateTool } from "@/lib/toolLogos";

import HeroSection from "@/components/home/HeroSection";
import TickerBar from "@/components/home/TickerBar";
import PersonasSection from "@/components/home/PersonasSection";
import FaqBlock from "@/components/FaqBlock";
import EditorialSection from "@/components/EditorialSection";
import GuideCardEditorial from "@/components/GuideCardEditorial";

const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
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

      {/* 4. Manifesto — position + decision framework */}
      <ManifestoSection />

      {/* 5. Ce que ToolTrim coupe */}
      <WhatWeCutSection />

      {/* 6. Méthode — 3 étapes */}
      <MethodeSection />

      {/* 7. Stacks par objectif — concret et contextualisé */}
      <BusinessObjectivesSection />

      {/* 8. Pour quel profil */}
      <PersonasSection />

      {/* 9. Témoignages */}
      <Suspense fallback={null}><TestimonialsSection /></Suspense>

      {/* 10. Guides */}
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
   HacLogo — favicon CDN + lettre fallback (pour HomeActionCards)
───────────────────────────────────────────────────────────────────────────── */
function HacLogo({ name, domain }: { name: string; domain: string }) {
  const [err, setErr] = useState(false);
  const src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=32`;
  return (
    <span className="hac-logo">
      {!err ? (
        <img src={src} alt="" aria-hidden="true" onError={() => setErr(true)} />
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
            {t("Trois façons de décider", "Three ways to decide")}
          </span>
          <h2 className="home-actions-title">
            {t("Commence par la bonne question.", "Start with the right question.")}
          </h2>
          <p className="home-actions-desc">
            {t(
              "Audite ta stack, pars d'un profil type ou compare deux outils selon ton usage réel.",
              "Audit your stack, start from a profile, or compare two tools based on your actual use.",
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
   ManifestoSection — editorial noise + animated logo cloud
───────────────────────────────────────────────────────────────────────────── */
type ManifestoTool = LogoCandidateTool & {
  name: string;
  domain: string;
};

type LogoCloudItem = ManifestoTool & {
  top: string;
  left: string;
  size?: "small" | "default" | "large";
  delay: string;
  depth?: "foreground" | "mid" | "back";
  motion?: "a" | "b" | "c" | "d";
};

const manifestoTools: Record<string, ManifestoTool> = {
  notion: { name: "Notion", slug: "notion", domain: "notion.so", websiteUrl: "https://www.notion.so" },
  canva: { name: "Canva", slug: "canva", domain: "canva.com", websiteUrl: "https://www.canva.com" },
  slack: { name: "Slack", slug: "slack", domain: "slack.com", websiteUrl: "https://slack.com" },
  zoom: { name: "Zoom", slug: "zoom", domain: "zoom.us", websiteUrl: "https://zoom.us" },
  teams: { name: "Teams", slug: "microsoftteams", domain: "microsoft.com", websiteUrl: "https://www.microsoft.com/microsoft-teams" },
  trello: { name: "Trello", slug: "trello", domain: "trello.com", websiteUrl: "https://trello.com" },
  zapier: { name: "Zapier", slug: "zapier", domain: "zapier.com", websiteUrl: "https://zapier.com" },
  loom: { name: "Loom", slug: "loom", domain: "loom.com", websiteUrl: "https://www.loom.com" },
  figma: { name: "Figma", slug: "figma", domain: "figma.com", websiteUrl: "https://www.figma.com" },
  airtable: { name: "Airtable", slug: "airtable", domain: "airtable.com", websiteUrl: "https://airtable.com" },
  hubspot: { name: "HubSpot", slug: "hubspot", domain: "hubspot.com", websiteUrl: "https://www.hubspot.com" },
  brevo: { name: "Brevo", slug: "brevo", domain: "brevo.com", websiteUrl: "https://www.brevo.com" },
  coda: { name: "Coda", slug: "coda", domain: "coda.io", websiteUrl: "https://coda.io" },
  clickup: { name: "ClickUp", slug: "clickup", domain: "clickup.com", websiteUrl: "https://clickup.com" },
  linear: { name: "Linear", slug: "linear", domain: "linear.app", websiteUrl: "https://linear.app" },
  framer: { name: "Framer", slug: "framer", domain: "framer.com", websiteUrl: "https://www.framer.com" },
  webflow: { name: "Webflow", slug: "webflow", domain: "webflow.com", websiteUrl: "https://webflow.com" },
  drive: { name: "Google Drive", slug: "google-drive", domain: "google.com", websiteUrl: "https://drive.google.com" },
};

function HomeLogoCloudItem({ item }: { item: LogoCloudItem }) {
  const sources = useMemo(() => getToolLogoSources(item, 64), [item]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const logoSrc = sources[sourceIndex];

  return (
    <span
      className={`home-logo-cloud-item is-${item.size || "default"} is-${item.depth || "mid"} motion-${item.motion || "a"}`}
      style={{ top: item.top, left: item.left, animationDelay: item.delay }}
      title={item.name}
    >
      {logoSrc ? (
        <img
          className="home-logo-cloud-image"
          src={logoSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setSourceIndex((index) => index + 1)}
        />
      ) : (
        <span className="home-logo-cloud-fallback">{item.name.charAt(0)}</span>
      )}
      <span className="sr-only">{item.name}</span>
    </span>
  );
}

function ManifestoSection() {
  const { t } = useLang();

  const logoCloudItems: LogoCloudItem[] = [
    { ...manifestoTools.notion, top: "29%", left: "36%", size: "large", delay: "-1.2s", depth: "foreground", motion: "a" },
    { ...manifestoTools.slack, top: "43%", left: "57%", size: "large", delay: "-4.1s", depth: "foreground", motion: "b" },
    { ...manifestoTools.figma, top: "57%", left: "45%", size: "large", delay: "-6.2s", depth: "foreground", motion: "c" },
    { ...manifestoTools.canva, top: "68%", left: "30%", delay: "-5.4s", depth: "mid", motion: "a" },
    { ...manifestoTools.zapier, top: "50%", left: "70%", delay: "-0.8s", depth: "mid", motion: "b" },
    { ...manifestoTools.airtable, top: "67%", left: "56%", delay: "-3.3s", depth: "mid", motion: "c" },
    { ...manifestoTools.trello, top: "34%", left: "73%", delay: "-7.1s", depth: "mid", motion: "a" },
    { ...manifestoTools.coda, top: "42%", left: "23%", delay: "-4.9s", depth: "mid", motion: "b" },
    { ...manifestoTools.linear, top: "77%", left: "73%", delay: "-6.8s", depth: "mid", motion: "a" },
    { ...manifestoTools.brevo, top: "22%", left: "20%", delay: "-0.4s", depth: "mid", motion: "c" },
    { ...manifestoTools.framer, top: "21%", left: "54%", size: "small", delay: "-8.4s", depth: "back", motion: "d" },
    { ...manifestoTools.webflow, top: "82%", left: "29%", size: "small", delay: "-9.1s", depth: "back", motion: "b" },
    { ...manifestoTools.loom, top: "18%", left: "73%", size: "small", delay: "-2.7s", depth: "back", motion: "b" },
    { ...manifestoTools.hubspot, top: "60%", left: "17%", size: "small", delay: "-2.1s", depth: "back", motion: "c" },
    { ...manifestoTools.clickup, top: "25%", left: "48%", size: "small", delay: "-1.8s", depth: "back", motion: "d" },
    { ...manifestoTools.zoom, top: "77%", left: "43%", size: "small", delay: "-3.9s", depth: "back", motion: "b" },
    { ...manifestoTools.teams, top: "47%", left: "84%", size: "small", delay: "-5.9s", depth: "back", motion: "a" },
    { ...manifestoTools.drive, top: "83%", left: "58%", size: "small", delay: "-7.6s", depth: "back", motion: "a" },
  ];

  return (
    <section className="home-noise-section es-section">
      <div className="es-container home-noise-grid">
        <div className="home-noise-copy">
          <p className="home-noise-eyebrow">{t("Notre différence", "Our difference")}</p>
          <h2 className="home-noise-title">
            {t(
              "Le bon outil dépend de ta réalité.",
              "The right tool depends on your reality.",
            )}
          </h2>
          <p className="home-noise-subtitle">
            {t(
              "Un outil ne se choisit pas seul. Il dépend de ton profil, de ton niveau, de ton budget, de ton TJM, de tes usages et de ce que tu paies déjà.",
              "A tool is never chosen in isolation. It depends on your profile, level, budget, day rate, usage and what you already pay for.",
            )}
          </p>
          <p className="home-noise-line">
            {t(
              "ToolTrim regarde la stack dans son ensemble pour recommander ce qui sert vraiment — sans sous-calibrer, ni suréquiper.",
              "ToolTrim looks at the stack as a whole to recommend what truly helps — without undersizing or over-equipping.",
            )}
          </p>
        </div>

        <div className="home-logo-cloud" aria-label={t("Exemples d’outils dans une stack", "Examples of tools in a stack")}>
          <div className="home-logo-cloud-axis" aria-hidden="true" />
          <div className="home-logo-cloud-fade" aria-hidden="true" />
          {logoCloudItems.map((item) => (
            <HomeLogoCloudItem key={item.slug} item={item} />
          ))}
          <span className="home-logo-cloud-label is-keep">{t("À garder", "Keep")}</span>
          <span className="home-logo-cloud-label is-cut">{t("À couper", "Cut")}</span>
          <span className="home-logo-cloud-label is-replace">{t("À remplacer", "Replace")}</span>
          <span className="home-logo-cloud-label is-challenge">{t("À challenger", "Challenge")}</span>
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
      labelFr: "Doublon",
      labelEn: "Duplicate",
      titleFr: "Les doublons fonctionnels",
      titleEn: "Functional duplicates",
      exampleFr: "Notion + Trello + Asana pour gérer les mêmes projets.",
      exampleEn: "Notion + Trello + Asana for the same projects.",
    },
    {
      labelFr: "Dormant",
      labelEn: "Dormant",
      titleFr: "Les outils dormants",
      titleEn: "Dormant tools",
      exampleFr: "Loom ouvert deux fois ce mois-ci. Slack vidéo suffit.",
      exampleEn: "Loom opened twice this month. Slack video is enough.",
    },
    {
      labelFr: "Trop tôt",
      labelEn: "Too soon",
      titleFr: "Les abonnements pris trop tôt",
      titleEn: "Subscriptions bought too soon",
      exampleFr: "Zapier Pro à 49 €/mois pour un seul zap actif.",
      exampleEn: "Zapier Pro at €49/mo for one active zap.",
    },
    {
      labelFr: "Trop lourd",
      labelEn: "Too heavy",
      titleFr: "Les outils surdimensionnés",
      titleEn: "Oversized tools",
      exampleFr: "HubSpot CRM quand Notion + Tally suffit pour un solo.",
      exampleEn: "HubSpot CRM when Notion + Tally is enough for a solo.",
    },
    {
      labelFr: "Trop cher",
      labelEn: "Too costly",
      titleFr: "Les stacks qui coûtent plus qu’elles ne rapportent",
      titleEn: "Stacks that cost more than they return",
      exampleFr: "140 €/mois d’abonnements pour facturer trois clients.",
      exampleEn: "€140/mo in subscriptions to invoice three clients.",
    },
  ];

  const before = [
    { nameFr: "Notion", nameEn: "Notion", price: "16 €" },
    { nameFr: "Trello", nameEn: "Trello", price: "5 €" },
    { nameFr: "Asana", nameEn: "Asana", price: "12 €" },
    { nameFr: "Loom", nameEn: "Loom", price: "8 €" },
    { nameFr: "Zapier", nameEn: "Zapier", price: "49 €" },
    { nameFr: "Canva", nameEn: "Canva", price: "15 €" },
    { nameFr: "Slack", nameEn: "Slack", price: "8 €" },
    { nameFr: "Stripe", nameEn: "Stripe", price: "—" },
    { nameFr: "Calendly", nameEn: "Calendly", price: "10 €" },
  ];

  const after = [
    { nameFr: "Notion", nameEn: "Notion", price: "16 €", kept: true },
    { nameFr: "Trello", nameEn: "Trello", price: "5 €", kept: false },
    { nameFr: "Asana", nameEn: "Asana", price: "12 €", kept: false },
    { nameFr: "Loom", nameEn: "Loom", price: "8 €", kept: false },
    { nameFr: "Make", nameEn: "Make", price: "9 €", kept: true },
    { nameFr: "Canva", nameEn: "Canva", price: "15 €", kept: true },
    { nameFr: "Slack", nameEn: "Slack", price: "8 €", kept: true },
    { nameFr: "Stripe", nameEn: "Stripe", price: "—", kept: true },
    { nameFr: "Calendly", nameEn: "Calendly", price: "10 €", kept: false },
  ];

  return (
    <section className="hp-cuts es-section">
      <div className="es-container">
        <div className="hp-cuts-inner">
          {/* Left */}
          <div>
            <p className="hp-cuts-label">{t("Ce que ToolTrim révèle", "What ToolTrim reveals")}</p>
            <h2 className="hp-cuts-heading">
              {t(
                <>Ce qui alourdit ta stack.<br />Et ce que tu peux vraiment couper.</>,
                <>What weighs down your stack.<br />And what you can actually cut.</>,
              )}
            </h2>
            <p className="hp-cuts-intro">
              {t(
                "Un outil rarement ouvert, un doublon discret, un plan trop haut : le vrai coût d’une stack ne se voit pas toujours dans la facture. ToolTrim remet chaque outil en contexte pour distinguer l’utile du superflu.",
                "A rarely opened tool, a quiet duplicate, a plan that is too high: the real cost of a stack is not always visible on the invoice. ToolTrim puts every tool back in context to separate what is useful from what is excess.",
              )}
            </p>
          </div>

          {/* Right — decision rows + CTA */}
          <div>
            <div className="hp-cut-rows">
              {cuts.map((cut) => (
                <div key={cut.titleFr} className="hp-cut-row">
                  <p className="hp-cut-row-label">{t(cut.labelFr, cut.labelEn)}</p>
                  <div>
                    <p className="hp-cut-row-title">{t(cut.titleFr, cut.titleEn)}</p>
                    <p className="hp-cut-row-example">{t(cut.exampleFr, cut.exampleEn)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hp-result-block">
          <div className="hp-result-header">
            <p className="hp-cuts-label">{t("Exemple de résultat", "Result example")}</p>
            <h3 className="hp-result-title">
              {t(
                <>9 outils, 123 €/mois<br />→ 5 outils, 48 €/mois.</>,
                <>9 tools, €123/mo<br />→ 5 tools, €48/mo.</>,
              )}
            </h3>
            <p className="hp-result-text">
              {t(
                "Un exemple de lecture ToolTrim : les outils gardés ont un rôle clair, les doublons sont supprimés, les plans trop tôt sont repoussés.",
                "One example of a ToolTrim reading: kept tools have a clear role, duplicates are removed, and premature plans are pushed back.",
              )}
            </p>
          </div>

          <div className="hp-aa-inner">
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

          <div className="hp-aa-saving">
            <span className="hp-aa-saving-label">{t("Économie mensuelle :", "Monthly saving:")}</span>
            <span className="hp-aa-saving-amount">−75 €</span>
            <span className="hp-aa-saving-sub">{t("soit −900 €/an", "that's −€900/yr")}</span>
          </div>

          <Link to={`${prefix}/selector`} className="hp-cuts-cta hp-result-cta">
            {t("Auditer ma stack", "Audit my stack")}
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
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
