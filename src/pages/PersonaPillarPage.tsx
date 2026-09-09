import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import FaqBlock from "@/components/FaqBlock";
import ToolLogo from "@/components/ToolLogo";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { setSeoTags, SEO_BASE } from "@/lib/seo";
import { ArrowRight, Sparkles, AlertTriangle, HelpCircle, Layers, ShieldCheck } from "@/lib/icons";

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
  faqs: { question: string; answer: string }[];
}

/**
 * Persona pillar pages : SEO landings under /:lang/guide/<slug>.
 * Le contenu ne cite aucune statistique non sourcee : ToolTrim n'a pas de
 * panel d'audit, donc aucune moyenne de depense ni pourcentage de population
 * ne peut lui etre attribue.
 * Routes are declared BEFORE /:lang/guide/:slug in App.tsx so they take precedence.
 */
const META: Record<Persona, Record<Lang, Meta>> = {
  THEO: {
    fr: {
      title: "Meilleurs outils pour développeur freelance en 2026 | tooltrim.com",
      description: "Stack dev freelance : Cursor, Vercel, Supabase, ChatGPT Pro. Les doublons qui coûtent le plus cher, et comment trancher entre deux outils qui font le même travail.",
      h1: "Les meilleurs outils SaaS pour développeur freelance en 2026",
      intro: "La stack d'un développeur freelance se construit vite et se nettoie rarement. Les postes qui pèsent le plus : un IDE avec IA, l'hébergement, les abonnements LLM. Le gaspillage vient rarement d'un outil de trop, il vient de deux outils qui font la même chose.",
      slug: "meilleurs-outils-developpeur-freelance",
      faqs: [
        { question: "Combien coûte une stack dev freelance en 2026 ?", answer: "Ça dépend surtout de ton hébergement et du nombre d'abonnements IA que tu cumules. Les postes récurrents sont l'IDE avec IA, l'hébergement, les bases de données et un ou deux LLM. Le tarif de chaque outil est sur sa fiche, avec sa date de vérification." },
        { question: "Cursor ou Copilot : lequel choisir ?", answer: "Cursor est un IDE complet avec l'IA intégrée, Copilot est un plugin qui se greffe sur VS Code. Payer les deux revient à payer deux fois la même assistance au code. Garder celui qui correspond à ta façon de travailler suffit." },
        { question: "Faut-il payer ChatGPT Pro ET Claude Pro ?", answer: "C'est le cumul le plus fréquent chez les développeurs. Si tu codes principalement, Claude est plus à l'aise sur le code. Si tu alternes contenu et code, ChatGPT couvre un spectre plus large. Le cas où les deux se justifient est rare." },
      ],
    },
    en: {
      title: "Best tools for freelance developers in 2026 | tooltrim.com",
      description: "Freelance dev stack: Cursor, Vercel, Supabase, ChatGPT Pro. The duplicates that cost the most, and how to choose between two tools doing the same job.",
      h1: "Best SaaS tools for freelance developers in 2026",
      intro: "A freelance developer's stack gets built fast and cleaned rarely. The heaviest line items are an AI-enabled IDE, hosting and LLM subscriptions. Waste rarely comes from one tool too many, it comes from two tools doing the same thing.",
      slug: "best-tools-freelance-developer",
      faqs: [
        { question: "How much does a freelance dev stack cost in 2026?", answer: "It depends mostly on your hosting and how many AI subscriptions you stack. The recurring line items are an AI-enabled IDE, hosting, databases and one or two LLMs. Each tool's price sits on its own page, with the date it was verified." },
        { question: "Cursor or Copilot: which one?", answer: "Cursor is a full IDE with AI built in, Copilot is a plugin that sits inside VS Code. Paying for both means paying twice for the same coding assistance. Keeping whichever matches how you work is enough." },
        { question: "Should I pay for both ChatGPT Pro and Claude Pro?", answer: "This is the most common overlap among developers. If you mostly write code, Claude handles code more comfortably. If you alternate between content and code, ChatGPT covers a wider range. Cases where both earn their place are rare." },
      ],
    },
  },
  SOFIA: {
    fr: {
      title: "Meilleurs outils pour designer freelance en 2026 | tooltrim.com",
      description: "Stack designer freelance : Figma, Adobe, Midjourney, Loom. Où part le budget créatif, et quels abonnements font double emploi sans que ça se voie.",
      h1: "Les meilleurs outils SaaS pour designer freelance en 2026",
      intro: "Le budget outils d'un designer freelance part rarement là où il croit. Les postes à surveiller : un abonnement Adobe complet quand deux applications suffisent, deux banques d'images en parallèle, et des plugins achetés puis jamais rouverts.",
      slug: "meilleurs-outils-designer-freelance",
      faqs: [
        { question: "Faut-il garder Adobe CC complet en freelance ?", answer: "Ça dépend du nombre d'applications que tu ouvres vraiment dans le mois. Si tu en utilises deux ou trois, les plans individuels ou une combinaison Figma et Affinity reviennent moins cher. Compte les applications avant de renouveler." },
        { question: "Figma gratuit suffit-il pour un designer freelance ?", answer: "Le plan gratuit couvre le travail en solo sur un nombre limité de projets actifs. Le plan payant se justifie quand tu collabores avec des clients dans le fichier ou que tu dépasses la limite de projets. Le détail des limites est sur la fiche Figma." },
        { question: "Midjourney vaut-il le coup pour un designer ?", answer: "Il remplace partiellement une banque d'images, ce qui peut rendre un abonnement stock inutile. En revanche il recoupe Adobe Firefly, donc si tu as déjà Adobe complet, tu paies deux fois pour de la génération d'images." },
      ],
    },
    en: {
      title: "Best tools for freelance designers in 2026 | tooltrim.com",
      description: "Freelance designer stack: Figma, Adobe, Midjourney, Loom. Where the creative budget actually goes, and which subscriptions quietly overlap.",
      h1: "Best SaaS tools for freelance designers in 2026",
      intro: "A freelance designer's tool budget rarely goes where they think it does. The line items worth checking: a full Adobe plan when two apps would do, two stock libraries running in parallel, and plugins bought once and never reopened.",
      slug: "best-tools-freelance-designer",
      faqs: [
        { question: "Should I keep the full Adobe CC as a freelancer?", answer: "It depends on how many apps you actually open in a month. If it is two or three, individual plans or a Figma and Affinity combination costs less. Count the apps before you renew." },
        { question: "Is Figma Free enough for a freelance designer?", answer: "The free plan covers solo work on a limited number of active projects. The paid plan earns its place once clients collaborate inside the file or you pass the project limit. The exact limits are on the Figma page." },
        { question: "Is Midjourney worth it for a designer?", answer: "It partly replaces a stock library, which can make a stock subscription redundant. It also overlaps Adobe Firefly, so if you already have full Adobe you are paying twice for image generation." },
      ],
    },
  },
  MARC: {
    fr: {
      title: "Meilleurs outils pour consultant freelance en 2026 | tooltrim.com",
      description: "Stack consultant freelance : Calendly, CRM, visio, Notion. Le cumul CRM qui passe inaperçu et les abonnements que ton volume d'appels ne justifie pas.",
      h1: "Les meilleurs outils SaaS pour consultant freelance en 2026",
      intro: "Un consultant a peu d'outils mais les paie cher, parce que ce sont des outils de vente. Le piège principal reste le cumul de deux CRM, l'un gardé par habitude, l'autre adopté pour une fonction précise puis jamais abandonné.",
      slug: "meilleurs-outils-consultant-freelance",
      faqs: [
        { question: "Quel CRM choisir en freelance consultant ?", answer: "En solo, un CRM léger de type Folk ou Attio suffit dans la plupart des cas. Pipedrive vise un bon équilibre entre simplicité et profondeur. Le vrai piège n'est pas le choix, c'est de garder l'ancien en parallèle du nouveau." },
        { question: "Calendly gratuit ou payant ?", answer: "La version gratuite convient tant que tu n'as qu'un seul type de rendez-vous. Le plan payant se justifie pour plusieurs types d'événements ou des intégrations visio. Cal.com est l'alternative open source si tu veux héberger toi-même." },
        { question: "Faut-il payer Zoom Pro en freelance ?", answer: "La question se règle en regardant la durée réelle de tes appels. Le plan gratuit de Zoom coupe à 40 minutes en réunion de groupe. Si tes rendez-vous tiennent sous cette limite, Google Meet fait le travail sans abonnement." },
      ],
    },
    en: {
      title: "Best tools for freelance consultants in 2026 | tooltrim.com",
      description: "Freelance consultant stack: Calendly, CRM, video, Notion. The CRM overlap nobody notices, and the subscriptions your call volume does not justify.",
      h1: "Best SaaS tools for freelance consultants in 2026",
      intro: "A consultant runs few tools but pays a lot for them, because they are sales tools. The main trap is running two CRMs at once, one kept out of habit and one adopted for a single feature then never dropped.",
      slug: "best-tools-freelance-consultant",
      faqs: [
        { question: "Which CRM for a freelance consultant?", answer: "Working solo, a lightweight CRM such as Folk or Attio covers most cases. Pipedrive aims at a good balance between simplicity and depth. The real trap is not the choice, it is keeping the old one running alongside the new one." },
        { question: "Calendly free or paid?", answer: "The free tier works as long as you only offer one appointment type. The paid plan earns its place with several event types or video integrations. Cal.com is the open-source alternative if you would rather self-host." },
        { question: "Should I pay for Zoom Pro as a freelancer?", answer: "Settle it by looking at how long your calls actually run. Zoom's free plan cuts group meetings at 40 minutes. If your calls stay under that, Google Meet does the job with no subscription." },
      ],
    },
  },
  ALIX: {
    fr: {
      title: "Meilleurs outils créateur de contenu freelance | tooltrim.com",
      description: "Stack créateur de contenu : newsletter, IA rédactionnelle, Canva, scheduler. Les trois familles d'outils où le cumul est le plus coûteux.",
      h1: "Les meilleurs outils SaaS pour créateur de contenu freelance en 2026",
      intro: "La stack d'un créateur de contenu grossit par empilement : un outil IA ajouté pour un cas précis, un scheduler testé puis gardé, une plateforme newsletter jamais migrée. Trois familles concentrent l'essentiel des doublons.",
      slug: "meilleurs-outils-createur-contenu-freelance",
      faqs: [
        { question: "Beehiiv ou Substack pour un créateur freelance ?", answer: "Beehiiv donne plus de contrôle sur la monétisation et les statistiques. Substack est plus simple à lancer mais prélève une part de tes revenus payants. Si tu monétises activement, la part prélevée finit par peser plus que l'abonnement." },
        { question: "Faut-il payer ChatGPT Pro ET Jasper ?", answer: "C'est le cumul IA le plus fréquent chez les créateurs. Jasper est construit sur des gabarits marketing, ChatGPT est généraliste. Si tu écris déjà tes propres consignes, le gabarit n'apporte pas grand-chose que tu ne saches faire." },
        { question: "Quel scheduler social choisir ?", answer: "Buffer couvre la publication programmée simple. Typefully est plus adapté si tu travailles surtout Twitter et LinkedIn. Le piège est de payer un outil d'équipe pour un usage solo : compare le prix par publication, pas le prix affiché." },
      ],
    },
    en: {
      title: "Best tools for freelance content creators in 2026 | tooltrim.com",
      description: "Content creator stack: newsletter, writing AI, Canva, scheduler. The three tool families where stacking costs the most.",
      h1: "Best SaaS tools for freelance content creators in 2026",
      intro: "A content creator's stack grows by accretion: an AI tool added for one case, a scheduler trialled then kept, a newsletter platform never migrated away from. Three families account for most of the overlap.",
      slug: "best-tools-freelance-content-creator",
      faqs: [
        { question: "Beehiiv or Substack for a freelance creator?", answer: "Beehiiv gives more control over monetization and analytics. Substack is simpler to launch but takes a cut of your paid revenue. Once you monetize seriously, that cut ends up costing more than a subscription would." },
        { question: "Should I pay for both ChatGPT Pro and Jasper?", answer: "This is the most common AI overlap among creators. Jasper is built around marketing templates, ChatGPT is general purpose. If you already write your own prompts, the templates add little you cannot do yourself." },
        { question: "Which social scheduler should I choose?", answer: "Buffer covers straightforward scheduled publishing. Typefully suits you better if you work mainly on Twitter and LinkedIn. The trap is paying for a team tool on a solo workload: compare cost per post, not the headline price." },
      ],
    },
  },
  CLAIRE: {
    fr: {
      title: "Meilleurs outils pour ops manager freelance en 2026 | tooltrim.com",
      description: "Stack ops freelance : compta, banque pro, signature, gestion de projet. La stack la plus fragmentée, donc celle où les doublons se cachent le mieux.",
      h1: "Les meilleurs outils SaaS pour ops manager freelance en 2026",
      intro: "La stack d'un ops manager ou d'un COO à temps partagé est la plus fragmentée de toutes : compta, banque, signature électronique, gestion de projet, stockage. Plus il y a de familles d'outils, plus les recouvrements passent inaperçus.",
      slug: "meilleurs-outils-ops-manager-freelance",
      faqs: [
        { question: "Indy ou Pennylane pour la compta freelance ?", answer: "Indy vise les micro-entrepreneurs, Pennylane couvre des structures plus complexes de type SASU ou EURL. Le choix se fait sur ton statut juridique, pas sur les fonctionnalités. Garder les deux en parallèle n'a pas de sens." },
        { question: "Faut-il une banque pro dédiée ?", answer: "En société, un compte dédié est une obligation légale. Le piège vient après : ouvrir un deuxième puis un troisième compte pro pour une fonction précise, et payer trois frais de tenue de compte pour une seule activité." },
        { question: "Quel outil de gestion de projet choisir ?", answer: "Si tu travailles seul, un outil de documentation comme Notion couvre souvent le besoin sans outil de projet dédié. Asana ou Monday se justifient dès que tu coordonnes une équipe. Le cumul de trois outils de projet est le doublon le plus cher de cette stack." },
      ],
    },
    en: {
      title: "Best tools for freelance ops managers in 2026 | tooltrim.com",
      description: "Freelance ops stack: accounting, business banking, e-signature, project management. The most fragmented stack, so the one where duplicates hide best.",
      h1: "Best SaaS tools for freelance ops managers in 2026",
      intro: "An ops manager's or fractional COO's stack is the most fragmented of all: accounting, banking, e-signature, project management, storage. The more tool families there are, the easier overlaps are to miss.",
      slug: "best-tools-freelance-ops-manager",
      faqs: [
        { question: "Which accounting tool for freelancers?", answer: "Pick on legal structure rather than features: tools aimed at sole traders and tools built for incorporated companies solve different problems. The common waste is an accounting tool and an invoicing tool that both issue invoices." },
        { question: "Do I need a dedicated business bank account?", answer: "If you run a company, a dedicated account is a legal requirement. The trap comes afterwards: opening a second then a third business account for one specific feature, and paying three account fees for one business." },
        { question: "Which project management tool?", answer: "Working alone, a documentation tool such as Notion often covers the need without a dedicated project tool. Asana or Monday earn their place once you coordinate a team. Running three project tools at once is the most expensive duplicate in this stack." },
      ],
    },
  },
};

export default function PersonaPillarPage({ persona, lang }: Props) {
  const m = META[persona][lang];
  const { tools, loading } = useToolSummaries({ refreshRemote: false });

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
        <h1 className="mt-5 text-3xl font-semibold leading-[1.15] tracking-tighter md:text-4xl lg:text-[2.75rem]">
          {m.h1}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{m.intro}</p>

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
              const price = tool.compareMonthlyPrice != null && tool.compareMonthlyPrice > 0
                ? tool.compareMonthlyPrice
                : tool.defaultMonthlyPrice ?? 0;
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
        <FaqBlock
          eyebrow={t("Questions fréquentes", "Frequently asked questions")}
          title={t("Questions fréquentes", "Frequently asked questions")}
          description={t(
            "On garde une lecture concrète : profil, stack, limites et prochaines décisions utiles.",
            "We keep it practical: profile, stack, limits, and useful next decisions."
          )}
          items={m.faqs.map((faq, index) => ({
            question: faq.question,
            answer: faq.answer,
            icon: [HelpCircle, Layers, ShieldCheck, Sparkles][index] || HelpCircle,
          }))}
          openCount={2}
        />
      </section>
    </>
  );
}
