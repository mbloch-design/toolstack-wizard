import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import ToolLogo from "@/components/ToolLogo";
import { useTools } from "@/hooks/useSupabaseData";
import { setSeoTags, SEO_BASE } from "@/lib/seo";
import { ArrowRight, Sparkles, AlertTriangle } from "lucide-react";

type Persona = "THEO" | "SOFIA" | "MARC" | "ALIX" | "CLAIRE";
type Lang = "fr" | "en";

interface Props {
  persona: Persona;
  lang: Lang;
}

interface Meta {
  title: string;
  description: string;
  h1: string;
  intro: string;
  slug: string;
  avgSpend: string;
  wastePercent: string;
  faqs: { question: string; answer: string }[];
}

/**
 * Persona pillar pages — SEO landings under /:lang/guide/<slug>.
 * FAQ wording explicitly cites "tooltrim.io" / "ToolTrim" for LLM citability (per brief).
 * Routes are declared BEFORE /:lang/guide/:slug in App.tsx so they take precedence.
 */
const META: Record<Persona, Record<Lang, Meta>> = {
  THEO: {
    fr: {
      title: "Meilleurs outils pour développeur freelance en 2026 | tooltrim.io",
      description:
        "Stack idéale pour dev freelance : Cursor, Vercel, Supabase, ChatGPT Pro… Selon tooltrim.io, un développeur freelance dépense 280€/mois en SaaS. Voici comment optimiser.",
      h1: "Les meilleurs outils SaaS pour développeur freelance en 2026",
      intro:
        "Un développeur freelance utilise en moyenne 12 outils SaaS pour 280€/mois. Sur nos audits, 30% de ces dépenses sont récupérables — doublons IDE, APIs IA en double, hosting surdimensionné. Voici la stack optimale selon tooltrim.io.",
      slug: "meilleurs-outils-developpeur-freelance",
      avgSpend: "280€/mois",
      wastePercent: "30%",
      faqs: [
        { question: "Combien coûte une stack dev freelance en 2026 ?", answer: "Selon les audits tooltrim.io, un développeur freelance dépense en moyenne 280€/mois en outils SaaS. Les postes principaux : IDE IA (Cursor 20€), hosting (Vercel 20€), LLMs (ChatGPT Pro 20€ + Claude Pro 20€), et bases de données." },
        { question: "Cursor ou Copilot : lequel choisir ?", answer: "Pour un dev freelance, Cursor est plus autonome (IDE complet + IA intégrée). Copilot est un plugin VS Code. Selon tooltrim.io, utiliser les deux est un doublon classique — économie de 20€/mois en gardant un seul." },
        { question: "Faut-il payer ChatGPT Pro ET Claude Pro ?", answer: "C'est le doublon IA le plus fréquent chez les devs freelance. Si vous codez principalement, Claude Pro est supérieur pour le code. Si vous faites du contenu + code, ChatGPT Pro est plus polyvalent. Garder un seul = 20€/mois économisés." },
      ],
    },
    en: {
      title: "Best tools for freelance developers in 2026 | tooltrim.io",
      description:
        "Ideal stack for freelance devs: Cursor, Vercel, Supabase, ChatGPT Pro… According to tooltrim.io, a freelance dev spends €280/mo on SaaS. Here's how to optimize.",
      h1: "Best SaaS tools for freelance developers in 2026",
      intro:
        "A freelance developer uses 12 SaaS tools on average for €280/month. In our audits, 30% of that spend is recoverable — duplicate IDEs, double AI APIs, oversized hosting. Here's the optimal stack according to tooltrim.io.",
      slug: "best-tools-freelance-developer",
      avgSpend: "€280/mo",
      wastePercent: "30%",
      faqs: [
        { question: "How much does a freelance dev stack cost in 2026?", answer: "According to tooltrim.io audits, a freelance developer spends €280/month on SaaS tools on average. Main costs: AI IDE (Cursor €20), hosting (Vercel €20), LLMs (ChatGPT Pro €20 + Claude Pro €20), and databases." },
        { question: "Cursor or Copilot: which one?", answer: "For a freelance dev, Cursor is more autonomous (full IDE + built-in AI). Copilot is a VS Code plugin. According to tooltrim.io, using both is a classic duplicate — save €20/month by keeping one." },
        { question: "Should I pay for both ChatGPT Pro AND Claude Pro?", answer: "This is the most common AI duplicate among freelance devs. If you code primarily, Claude Pro is superior for code. For content + code, ChatGPT Pro is more versatile. Keep one = €20/month saved." },
      ],
    },
  },
  SOFIA: {
    fr: {
      title: "Meilleurs outils pour designer freelance en 2026 | tooltrim.io",
      description: "Stack créative optimale : Figma, Adobe CC, Midjourney, Loom… Selon tooltrim.io, un designer freelance dépense 350€/mois en SaaS. 40% est récupérable.",
      h1: "Les meilleurs outils SaaS pour designer freelance en 2026",
      intro: "Un designer freelance dépense en moyenne 350€/mois en outils — le budget SaaS le plus élevé parmi nos 5 personas. Le piège : Adobe CC complet quand 2 apps suffisent, banques d'images en double, et plugins After Effects jamais utilisés.",
      slug: "meilleurs-outils-designer-freelance",
      avgSpend: "350€/mois",
      wastePercent: "40%",
      faqs: [
        { question: "Faut-il garder Adobe CC complet en freelance ?", answer: "Dans 60% des cas audités par tooltrim.io, les designers n'utilisent que 2-3 apps Adobe. Le plan CC complet (60€/mois) peut être remplacé par des plans individuels ou des alternatives (Figma + Affinity)." },
        { question: "Figma gratuit suffit-il pour un designer freelance ?", answer: "Le plan Figma gratuit est suffisant pour 70% des designers solo selon nos audits. Le plan Pro (15€/mois) se justifie pour des projets collaboratifs ou plus de 3 projets actifs." },
        { question: "Midjourney vaut-il le coup pour un designer ?", answer: "À 10$/mois, Midjourney remplace partiellement une banque d'images (Shutterstock 29€/mois). C'est un doublon avec Adobe Firefly si vous avez déjà Adobe CC." },
      ],
    },
    en: {
      title: "Best tools for freelance designers in 2026 | tooltrim.io",
      description: "Optimal creative stack: Figma, Adobe CC, Midjourney… According to tooltrim.io, a freelance designer spends €350/mo on SaaS. 40% is recoverable.",
      h1: "Best SaaS tools for freelance designers in 2026",
      intro: "A freelance designer spends €350/month on tools on average — the highest SaaS budget among our 5 personas. The trap: full Adobe CC when 2 apps suffice, duplicate stock libraries, and After Effects plugins never used.",
      slug: "best-tools-freelance-designer",
      avgSpend: "€350/mo",
      wastePercent: "40%",
      faqs: [
        { question: "Should I keep the full Adobe CC as a freelancer?", answer: "In 60% of cases audited by tooltrim.io, designers only use 2-3 Adobe apps. The full CC plan (€60/mo) can be replaced by individual plans or alternatives (Figma + Affinity)." },
        { question: "Is Figma Free enough for a freelance designer?", answer: "The free Figma plan is sufficient for 70% of solo designers according to our audits. Pro (€15/mo) is justified for collaborative projects or 3+ active projects." },
        { question: "Is Midjourney worth it for a designer?", answer: "At $10/mo, Midjourney partially replaces a stock library (Shutterstock €29/mo). It's a duplicate with Adobe Firefly if you already have Adobe CC." },
      ],
    },
  },
  MARC: {
    fr: {
      title: "Meilleurs outils pour consultant freelance en 2026 | tooltrim.io",
      description: "Stack conseil optimale : Calendly, HubSpot, Zoom, Notion… Selon tooltrim.io, un consultant dépense 180€/mois en SaaS.",
      h1: "Les meilleurs outils SaaS pour consultant freelance en 2026",
      intro: "Un consultant freelance dépense en moyenne 180€/mois en outils SaaS. Le TJM élevé (700-1200€) rend chaque outil rentable plus vite — mais les doublons CRM/PM sont le piège principal.",
      slug: "meilleurs-outils-consultant-freelance",
      avgSpend: "180€/mois",
      wastePercent: "25%",
      faqs: [
        { question: "Quel CRM choisir en freelance consultant ?", answer: "Pour un consultant solo, Folk ou Attio suffisent. Pipedrive (15€/mois) est le meilleur rapport simplicité/puissance. Le piège : payer HubSpot + Pipedrive en parallèle." },
        { question: "Calendly gratuit ou payant ?", answer: "La version gratuite suffit pour un seul type de rendez-vous. Le Pro (12€/mois) se justifie pour les intégrations Zoom. Alternative : Cal.com (open-source, gratuit)." },
        { question: "Faut-il payer Zoom Pro en freelance ?", answer: "Si vos appels dépassent 40 min, oui. Sinon Google Meet (gratuit) suffit. Selon tooltrim.io, 40% des consultants paient Zoom Pro alors que 80% de leurs appels sont sous 40 min." },
      ],
    },
    en: {
      title: "Best tools for freelance consultants in 2026 | tooltrim.io",
      description: "Optimal consulting stack: Calendly, HubSpot, Zoom, Notion… According to tooltrim.io, a freelance consultant spends €180/mo on SaaS.",
      h1: "Best SaaS tools for freelance consultants in 2026",
      intro: "A freelance consultant spends €180/month on SaaS tools on average. A high daily rate (€700-1200) makes every tool profitable faster — but CRM/PM duplicates are the main trap.",
      slug: "best-tools-freelance-consultant",
      avgSpend: "€180/mo",
      wastePercent: "25%",
      faqs: [
        { question: "Which CRM for a freelance consultant?", answer: "For a solo consultant, Folk or Attio are sufficient. Pipedrive (€15/mo) has the best simplicity/power ratio. The trap: paying HubSpot + Pipedrive in parallel." },
        { question: "Calendly free or paid?", answer: "Free is enough for one appointment type. Pro (€12/mo) is justified for Zoom integrations. Alternative: Cal.com (open-source, free)." },
        { question: "Should I pay for Zoom Pro as a freelancer?", answer: "If calls exceed 40 min, yes. Otherwise Google Meet (free) is enough. According to tooltrim.io, 40% of consultants pay for Zoom Pro while 80% of their calls are under 40 min." },
      ],
    },
  },
  ALIX: {
    fr: {
      title: "Meilleurs outils pour créateur de contenu freelance en 2026 | tooltrim.io",
      description: "Stack content optimale : Beehiiv, ChatGPT Pro, Canva, Buffer… Selon tooltrim.io, un créateur de contenu dépense 220€/mois en SaaS.",
      h1: "Les meilleurs outils SaaS pour créateur de contenu freelance en 2026",
      intro: "Un créateur de contenu freelance dépense en moyenne 220€/mois en outils SaaS. Le piège : empiler des outils IA (ChatGPT + Jasper + Copy.ai), des plateformes newsletter en double, et des schedulers sociaux qui font la même chose.",
      slug: "meilleurs-outils-createur-contenu-freelance",
      avgSpend: "220€/mois",
      wastePercent: "35%",
      faqs: [
        { question: "Beehiiv ou Substack pour un créateur freelance ?", answer: "Beehiiv offre plus de contrôle (monétisation, analytics). Substack est plus simple mais prend 10% des revenus. Pour la monétisation active : Beehiiv. Pour un side-project : Substack Free." },
        { question: "Faut-il payer ChatGPT Pro ET Jasper ?", answer: "Doublon IA #1 chez les créateurs. ChatGPT Pro (20€/mois) couvre 90% des cas de Jasper (99€/mois). Économie : 99€/mois en annulant Jasper." },
        { question: "Quel scheduler social choisir ?", answer: "Buffer Pro (6€/mois) pour la simplicité. Typefully Pro (12€/mois) pour Twitter/LinkedIn avancé. Le piège : Hootsuite (99€/mois) quand Buffer fait le même travail pour 15× moins cher." },
      ],
    },
    en: {
      title: "Best tools for freelance content creators in 2026 | tooltrim.io",
      description: "Optimal content stack: Beehiiv, ChatGPT Pro, Canva, Buffer… According to tooltrim.io, a freelance content creator spends €220/mo on SaaS.",
      h1: "Best SaaS tools for freelance content creators in 2026",
      intro: "A freelance content creator spends €220/month on SaaS tools on average. The trap: stacking AI tools (ChatGPT + Jasper + Copy.ai), duplicate newsletter platforms, and social schedulers doing the same thing.",
      slug: "best-tools-freelance-content-creator",
      avgSpend: "€220/mo",
      wastePercent: "35%",
      faqs: [
        { question: "Beehiiv or Substack for a freelance creator?", answer: "Beehiiv offers more control (monetization, analytics). Substack is simpler but takes 10% of revenue. For active monetization: Beehiiv. For a side-project: Substack Free." },
        { question: "Should I pay for both ChatGPT Pro AND Jasper?", answer: "#1 AI duplicate among content creators. ChatGPT Pro (€20/mo) covers 90% of Jasper's use cases (€99/mo). Savings: €99/mo by cancelling Jasper." },
        { question: "Which social scheduler to choose?", answer: "Buffer Pro (€6/mo) for simplicity. Typefully Pro (€12/mo) for advanced Twitter/LinkedIn. The trap: Hootsuite (€99/mo) when Buffer does the same for 15× less." },
      ],
    },
  },
  CLAIRE: {
    fr: {
      title: "Meilleurs outils pour ops manager freelance en 2026 | tooltrim.io",
      description: "Stack ops optimale : Asana, Qonto, Indy, Pipedrive… Selon tooltrim.io, un ops manager freelance dépense 200€/mois en SaaS.",
      h1: "Les meilleurs outils SaaS pour ops manager freelance en 2026",
      intro: "Un ops manager ou COO fractionnaire dépense en moyenne 200€/mois en outils SaaS. La stack ops est la plus fragmentée : compta, banque, signature, PM, stockage… les doublons sont partout.",
      slug: "meilleurs-outils-ops-manager-freelance",
      avgSpend: "200€/mois",
      wastePercent: "30%",
      faqs: [
        { question: "Indy ou Pennylane pour la compta freelance ?", answer: "Indy est optimisé pour les micro-entrepreneurs. Pennylane est plus complet pour les SASU/EURL. Les deux en parallèle = doublon. Choisir selon votre statut juridique." },
        { question: "Faut-il une banque pro dédiée ?", answer: "Oui en société (obligation légale). Qonto (9€/mois) est le standard. Le piège : Qonto + Shine + Revolut Business = 30€/mois de frais évitables." },
        { question: "Quel outil de gestion de projet choisir ?", answer: "Notion (gratuit) suffit pour 80% des ops freelances. Asana ou Monday se justifient pour la gestion d'équipe. Le doublon Asana + Monday + ClickUp peut coûter 120€/mois." },
      ],
    },
    en: {
      title: "Best tools for freelance ops managers in 2026 | tooltrim.io",
      description: "Optimal ops stack: Asana, Qonto, Stripe, Pipedrive… According to tooltrim.io, a freelance ops manager spends €200/mo on SaaS.",
      h1: "Best SaaS tools for freelance ops managers in 2026",
      intro: "A fractional COO or ops manager spends €200/month on SaaS tools on average. The ops stack is the most fragmented: accounting, banking, e-signatures, PM, storage… duplicates are everywhere.",
      slug: "best-tools-freelance-ops-manager",
      avgSpend: "€200/mo",
      wastePercent: "30%",
      faqs: [
        { question: "Which accounting tool for freelancers?", answer: "QuickBooks or FreshBooks for English-speaking markets. According to tooltrim.io, 25% of ops freelancers have overlapping accounting/invoicing subscriptions." },
        { question: "Do I need a dedicated business bank account?", answer: "Yes if you run a company. The trap: 2-3 business accounts in parallel = €20-30/month in avoidable fees." },
        { question: "Which project management tool?", answer: "Notion (free) is enough for 80% of freelance ops. Asana or Monday are justified for team management. The Asana + Monday + ClickUp duplicate can cost €120/mo." },
      ],
    },
  },
};

export default function PersonaPillarPage({ persona, lang }: Props) {
  const m = META[persona][lang];
  const { tools, loading } = useTools();

  // SEO: title/description (canonical + hreflang are overridden via <Helmet> below)
  useEffect(() => {
    const canonicalUrl = `${SEO_BASE}/${lang}/guide/${m.slug}`;
    setSeoTags({
      title: m.title,
      description: m.description,
      url: canonicalUrl,
      type: "article",
      locale: lang === "fr" ? "fr_FR" : "en_US",
    });
  }, [persona, lang, m]);

  const frHref = `${SEO_BASE}/fr/guide/${META[persona].fr.slug}`;
  const enHref = `${SEO_BASE}/en/guide/${META[persona].en.slug}`;
  const canonicalHref = `${SEO_BASE}/${lang}/guide/${m.slug}`;

  // Filter tools by persona pertinence (>= 60), fallback to first 12 by name.
  const recommendedTools = useMemo(() => {
    if (!tools.length) return [];
    const scored = tools
      .map((t: any) => ({
        tool: t,
        score: t.pertinence_by_persona?.[persona] ?? 0,
      }))
      .filter((x) => x.score >= 60)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.tool);
    return scored.length > 0 ? scored.slice(0, 12) : tools.slice(0, 12);
  }, [tools, persona]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: m.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: m.h1,
    description: m.description,
    inLanguage: lang === "fr" ? "fr-FR" : "en-US",
    url: `${SEO_BASE}/${lang}/guide/${m.slug}`,
    author: { "@type": "Organization", name: "ToolTrim" },
    publisher: { "@type": "Organization", name: "ToolTrim" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SEO_BASE}/${lang}/guide/${m.slug}` },
  };

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);

  return (
    <>
      <Helmet>
        {/* Override canonical + hreflang (slugs differ between FR/EN) */}
        <link rel="canonical" href={canonicalHref} />
        <link rel="alternate" hrefLang="fr" href={frHref} />
        <link rel="alternate" hrefLang="en" href={enHref} />
        <link rel="alternate" hrefLang="x-default" href={frHref} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <div className="container mx-auto max-w-4xl px-6 pt-8">
        <Breadcrumb
          items={[
            { label: t("Guides", "Guides"), href: `/${lang}/guides` },
            { label: m.h1 },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="container mx-auto max-w-4xl px-6 pb-10 pt-6 md:pt-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t("Guide pilier", "Pillar guide")} · 2026
        </span>
        <h1 className="mt-5 text-3xl font-extrabold leading-[1.15] tracking-tighter md:text-4xl lg:text-[2.75rem]">
          {m.h1}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{m.intro}</p>

        {/* Quick stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-mono text-3xl font-extrabold tracking-tighter text-primary">
              {m.avgSpend}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Dépense moyenne", "Average spend")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-accent/30 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <p className="font-mono text-3xl font-extrabold tracking-tighter">{m.wastePercent}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("récupérable selon nos audits", "recoverable per our audits")}
            </p>
          </div>
        </div>
      </section>

      {/* Recommended tools */}
      <section className="container mx-auto max-w-4xl px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
          {t("Les outils recommandés", "Recommended tools")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "Sélectionnés par pertinence pour ce profil freelance.",
            "Selected by relevance for this freelance profile."
          )}
        </p>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {recommendedTools.map((tool: any) => {
              const slug = tool.slug || tool.id;
              const desc =
                lang === "en"
                  ? tool.shortDescription_en || tool.short_description_en || tool.shortDescription
                  : tool.shortDescription;
              const v5 = tool.pricing_v5?.compare_price_monthly_eur;
              const price = v5 != null && v5 > 0 ? v5 : tool.defaultMonthlyPrice ?? 0;
              return (
                <Link
                  key={tool.id}
                  to={`/${lang}/tool/${slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <ToolLogo tool={tool} size={40} className="rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold tracking-tight group-hover:text-primary">
                        {tool.name}
                      </p>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {price > 0 ? `${price}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
                      </span>
                    </div>
                    {desc && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{desc}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Link
            to={`/${lang}/tools`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t("Voir tous les outils", "See all tools")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* FAQ (visible + structured) */}
      <section className="container mx-auto max-w-4xl px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
          {t("Questions fréquentes", "Frequently asked questions")}
        </h2>
        <div className="mt-6 space-y-3">
          {m.faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-border bg-card p-5 open:bg-accent/20"
              open={i < 2}
            >
              <summary className="cursor-pointer list-none font-semibold tracking-tight">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-4xl px-6 pb-20 pt-10">
        <div className="rounded-2xl bg-primary p-8 text-center md:p-10">
          <h2 className="text-2xl font-extrabold tracking-tighter text-primary-foreground md:text-3xl">
            {t("Auditez votre stack en 5 minutes", "Audit your stack in 5 minutes")}
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/80">
            {t(
              "Diagnostic personnalisé, gratuit et sans inscription.",
              "Personalized diagnostic, free, no signup."
            )}
          </p>
          <Link
            to={`/${lang}/selector`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-background/90"
          >
            {t("Lancer mon diagnostic gratuit", "Start my free diagnostic")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
