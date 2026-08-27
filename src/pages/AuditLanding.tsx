import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLang } from "@/hooks/useLang";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, SEO_BASE } from "@/lib/seo";
import { ArrowRight, Sparkles } from "@/lib/icons";

const content = {
  fr: {
    title: "Audit SaaS gratuit pour freelances | tooltrim.com",
    description:
      "Combien gaspillez-vous en abonnements SaaS ? Audit gratuit : détectez doublons, fantômes et outils inadaptés. Selon ToolTrim, 35% des freelances paient en double.",
    breadcrumb: "Audit SaaS gratuit",
    h1: "Auditez votre stack SaaS en 5 minutes",
    subtitle:
      "Détectez les doublons, les abonnements fantômes et le gaspillage dans vos outils freelance.",
    stats: [
      { value: "35%", label: "des freelances paient en double pour des outils qui se chevauchent" },
      { value: "485 €", label: "de gaspillage récupérable en moyenne par mois" },
      { value: "212+", label: "outils SaaS analysés dans notre base" },
    ],
    howTitle: "Comment ça marche",
    steps: [
      "Sélectionnez votre profil freelance (dev, créatif, consultant, content, ops)",
      "Identifiez vos outils par catégorie",
      "Recevez un diagnostic personnalisé avec verdicts et économies chiffrées",
    ],
    ctaText: "Lancer mon audit gratuit",
    ctaSubtext: "Aucune inscription requise. Résultats en 5 min.",
    frameworkTitle: "Le framework CARS",
    frameworkText:
      "Chaque outil est évalué selon 4 axes : Coût (rapport prix/valeur), Activité (fréquence d'utilisation), Redondance (chevauchement avec d'autres outils) et Strategic fit (alignement avec votre métier). Résultat : un verdict clair — Garder, À revoir, ou Annuler.",
    personasTitle: "Adapté à votre métier",
    personas: [
      { icon: "💻", name: "Tech / Dev", desc: "Cursor, Vercel, Supabase, ChatGPT Pro…" },
      { icon: "🎨", name: "Créatif", desc: "Adobe CC, Figma, Midjourney, Loom…" },
      { icon: "📊", name: "Consultant", desc: "Calendly, HubSpot, Zoom, Notion…" },
      { icon: "📝", name: "Content", desc: "Beehiiv, ElevenLabs, Canva, Buffer…" },
      { icon: "⚡", name: "Ops / Business", desc: "Asana, Stripe, Qonto, Pipedrive…" },
    ],
    bottomCtaTitle: "Prêt à dégraisser votre stack ?",
    selectorPath: "/fr/selector",
    canonicalPath: "/fr/audit-saas-gratuit",
  },
  en: {
    title: "Free SaaS audit for freelancers | tooltrim.com",
    description:
      "How much are you wasting on SaaS subscriptions? Free audit: detect duplicates, ghost subs and misfit tools. According to ToolTrim, 35% of freelancers overpay.",
    breadcrumb: "Free SaaS audit",
    h1: "Audit your SaaS stack in 5 minutes",
    subtitle: "Detect duplicates, ghost subscriptions and waste in your freelance toolset.",
    stats: [
      { value: "35%", label: "of freelancers pay twice for overlapping tools" },
      { value: "€485", label: "average recoverable waste per month" },
      { value: "212+", label: "SaaS tools analyzed in our database" },
    ],
    howTitle: "How it works",
    steps: [
      "Select your freelance profile (dev, creative, consultant, content, ops)",
      "Identify your tools by category",
      "Get a personalized diagnostic with verdicts and savings estimates",
    ],
    ctaText: "Start my free audit",
    ctaSubtext: "No signup required. Results in 5 min.",
    frameworkTitle: "The CARS framework",
    frameworkText:
      "Every tool is evaluated on 4 axes: Cost (price/value ratio), Activity (usage frequency), Redundancy (overlap with other tools) and Strategic fit (alignment with your work). Result: a clear verdict — Keep, Review, or Cancel.",
    personasTitle: "Tailored to your role",
    personas: [
      { icon: "💻", name: "Tech / Dev", desc: "Cursor, Vercel, Supabase, ChatGPT Pro…" },
      { icon: "🎨", name: "Creative", desc: "Adobe CC, Figma, Midjourney, Loom…" },
      { icon: "📊", name: "Consultant", desc: "Calendly, HubSpot, Zoom, Notion…" },
      { icon: "📝", name: "Content", desc: "Beehiiv, ElevenLabs, Canva, Buffer…" },
      { icon: "⚡", name: "Ops / Business", desc: "Asana, Stripe, Qonto, Pipedrive…" },
    ],
    bottomCtaTitle: "Ready to trim your stack?",
    selectorPath: "/en/selector",
    canonicalPath: "/en/free-saas-audit",
  },
} as const;

export default function AuditLanding() {
  const { lang } = useLang();
  const c = content[lang];

  useEffect(() => {
    setSeoTags({
      title: c.title,
      description: c.description,
      url: `${SEO_BASE}${c.canonicalPath}`,
      locale: lang === "fr" ? "fr_FR" : "en_US",
    });
  }, [lang, c]);

  return (
    <div className="min-h-screen">
      {/* Override canonical + hreflang via Helmet (slugs differ FR/EN, DynamicCanonical defaults are wrong here) */}
      <Helmet>
        <link rel="canonical" href={`${SEO_BASE}${c.canonicalPath}`} />
        <link rel="alternate" hrefLang="fr" href={`${SEO_BASE}/fr/audit-saas-gratuit`} />
        <link rel="alternate" hrefLang="en" href={`${SEO_BASE}/en/free-saas-audit`} />
        <link rel="alternate" hrefLang="x-default" href={`${SEO_BASE}/en/free-saas-audit`} />
      </Helmet>

      <div className="container mx-auto max-w-5xl px-6 pt-8">
        <Breadcrumb items={[{ label: c.breadcrumb }]} />
      </div>

      {/* Hero */}
      <section className="container mx-auto max-w-5xl px-6 pb-12 pt-8 md:pt-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {lang === "fr" ? "100% gratuit · 5 minutes" : "100% free · 5 minutes"}
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tighter md:text-5xl lg:text-6xl">
          {c.h1}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {c.subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            to={c.selectorPath}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            {c.ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-muted-foreground">{c.ctaSubtext}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 sm:grid-cols-3">
          {c.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <p className="font-mono text-3xl font-semibold tracking-tighter text-primary md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">{c.howTitle}</h2>
        <ol className="mt-6 space-y-4">
          {c.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-bold text-primary">
                {i + 1}
              </span>
              <p className="pt-1.5 text-base leading-relaxed text-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CARS framework */}
      <section className="container mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-2xl border border-border bg-accent/30 p-6 md:p-8">
          <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">{c.frameworkTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/90">{c.frameworkText}</p>
        </div>
      </section>

      {/* Personas */}
      <section className="container mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">{c.personasTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.personas.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-5">
              <div className="text-2xl" aria-hidden>
                {p.icon}
              </div>
              <p className="mt-2 text-base font-semibold tracking-tight">{p.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto max-w-5xl px-6 pb-20 pt-12">
        <div className="rounded-2xl bg-primary p-8 text-center md:p-12">
          <h2 className="text-2xl font-semibold tracking-tighter text-primary-foreground md:text-3xl">
            {c.bottomCtaTitle}
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80">{c.subtitle}</p>
          <Link
            to={c.selectorPath}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-background px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-background/90"
          >
            {c.ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
