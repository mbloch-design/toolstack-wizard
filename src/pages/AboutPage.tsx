import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { useMemo, useEffect } from "react";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo } from "@/lib/seo";
import { Target, Eye, Shield, TrendingDown, Users, BarChart3 } from "lucide-react";

const AboutPage = () => {
  const { t, prefix, lang } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();

  const stats = useMemo(() => ({
    tools: tools.length,
    categories: categories.length,
  }), [tools, categories]);

  useEffect(() => {
    const title = t(
      "À propos de ToolTrim — Notre mission anti-suréquipement",
      "About ToolTrim — Our anti-bloat mission"
    );
    const desc = t(
      `ToolTrim analyse ${stats.tools}+ outils SaaS pour aider les freelances à optimiser leur stack. Découvrez notre méthodologie indépendante.`,
      `ToolTrim analyzes ${stats.tools}+ SaaS tools to help freelancers optimize their stack. Discover our independent methodology.`
    );
    setSeoTags({ title, description: desc, url: `https://tooltrim.io/${lang}/about` });
    setHreflang(`/${lang}/about`);
    setJsonLd("about-jsonld", {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "ToolTrim",
      url: `https://tooltrim.io/${lang}/about`,
      description: desc,
    });
    return () => cleanupSeo(["about-jsonld"]);
  }, [lang, stats.tools]);

  const values = [
    {
      icon: Target,
      title: t("Prescription, pas catalogue", "Prescription, not catalog"),
      desc: t(
        "Chaque outil est analysé individuellement avec un verdict clair : garder, remplacer ou supprimer. Pas de liste générique.",
        "Each tool is individually analyzed with a clear verdict: keep, replace, or drop. No generic lists."
      ),
    },
    {
      icon: Eye,
      title: t("Transparence totale", "Full transparency"),
      desc: t(
        "Nos données sont sourcées, nos prix vérifiés, nos liens affiliés clairement identifiés. Zéro contenu sponsorisé.",
        "Our data is sourced, prices verified, affiliate links clearly identified. Zero sponsored content."
      ),
    },
    {
      icon: Shield,
      title: t("Indépendance éditoriale", "Editorial independence"),
      desc: t(
        "Aucun éditeur ne paie pour apparaître ou être recommandé. Notre scoring est basé sur des critères objectifs et documentés.",
        "No vendor pays to appear or be recommended. Our scoring is based on objective, documented criteria."
      ),
    },
    {
      icon: TrendingDown,
      title: t("Anti-suréquipement", "Anti-bloat"),
      desc: t(
        "Notre mission est de réduire votre stack, pas de l'agrandir. Moins d'outils, mieux utilisés, pour plus de rentabilité.",
        "Our mission is to shrink your stack, not grow it. Fewer tools, better used, for more profitability."
      ),
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-4xl">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground mb-6">
            {t("Notre mission", "Our mission")}
          </span>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            {t("Arrêtez de payer pour des outils", "Stop paying for tools")}
            <br />
            <span className="text-primary">{t("que vous n'utilisez pas", "you don't use")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t(
              "ToolTrim est le premier comparateur SaaS conçu pour les freelances et petites équipes qui veulent une stack efficace — sans abonnements superflus ni outils dormants.",
              "ToolTrim is the first SaaS comparator built for freelancers and small teams who want an efficient stack — without unnecessary subscriptions or dormant tools."
            )}
          </p>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-3 gap-6 rounded-2xl border border-border bg-card p-8">
          {[
            { value: `${stats.tools}+`, label: t("Outils analysés", "Tools analyzed") },
            { value: `${stats.categories}`, label: t("Catégories", "Categories") },
            { value: "100%", label: t("Indépendant", "Independent") },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="mt-20">
          <h2 className="text-center font-heading text-2xl font-bold">
            {t("Ce qui nous différencie", "What makes us different")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <v.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div className="mt-20 rounded-2xl border border-border bg-accent/30 p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                {t("Notre méthodologie", "Our methodology")}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>{t(
                  "Chaque outil est évalué selon des critères précis : prix réel vérifié (pas les prix marketing), pertinence par profil (freelance solo vs équipe), qualité des fonctionnalités couvertes, et existence d'alternatives gratuites ou moins chères.",
                  "Each tool is evaluated on precise criteria: verified real pricing (not marketing prices), profile relevance (solo freelancer vs team), quality of covered features, and existence of free or cheaper alternatives."
                )}</p>
                <p>{t(
                  "Notre diagnostic V10 utilise un moteur de prescription qui analyse votre stack complète : doublons entre clusters d'outils, abonnements dormants, et opportunités de downgrade. Chaque recommandation est sourcée et vérifiable.",
                  "Our V10 diagnostic uses a prescription engine that analyzes your complete stack: duplicates between tool clusters, dormant subscriptions, and downgrade opportunities. Every recommendation is sourced and verifiable."
                )}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mt-20 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-accent">
            <Users className="h-6 w-6 text-accent-foreground" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold">
            {t("Qui sommes-nous ?", "Who are we?")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground leading-relaxed">
            {t(
              "ToolTrim est un projet indépendant créé par des freelances, pour des freelances. Nous utilisons nous-mêmes les outils que nous recommandons. Pas de rédaction IA générique — chaque fiche est rédigée et vérifiée manuellement.",
              "ToolTrim is an independent project created by freelancers, for freelancers. We use the tools we recommend ourselves. No generic AI writing — every page is written and manually verified."
            )}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Analyser ma stack →", "Analyze my stack →")}
          </Link>
          <Link
            to={`${prefix}/transparency`}
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
          >
            {t("Notre politique de transparence", "Our transparency policy")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
